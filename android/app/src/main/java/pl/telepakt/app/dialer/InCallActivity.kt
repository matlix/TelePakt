package pl.telepakt.app.dialer

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.VideoProfile
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

/**
 * Ekran rozmowy TelePakt (gdy jest domyślną aplikacją Telefon): odbieranie/odrzucanie, wyciszenie, głośnik, wstrzymanie,
 * klawiatura (DTMF), dodanie rozmowy, scalenie - oraz przyciski komunikatów, które same łączą 3-way z TelePakt.
 * Interfejs budowany w kodzie i odświeżany przy każdej zmianie rozmów (jest ich najwyżej kilka).
 */
class InCallActivity : Activity() {

    private val ui = Handler(Looper.getMainLooper())
    private lateinit var root: LinearLayout
    private var showKeypad = false
    private var messages: List<VoiceMsg>? = null
    private var messagesError: String? = null
    private var proximity: PowerManager.WakeLock? = null

    private val listener: () -> Unit = { render() }
    private val ticker = object : Runnable {
        override fun run() {
            render()
            ui.postDelayed(this, 1000)
        }
    }

    @Suppress("DEPRECATION")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Ekran ma się pojawić nad ekranem blokady i zapalić telefon przy połączeniu przychodzącym.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.statusBarColor = Color.parseColor("#020617")
        window.navigationBarColor = Color.parseColor("#020617")

        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#020617"))
            setPadding(dp(16), dp(36), dp(16), dp(16))
        }
        setContentView(ScrollView(this).apply {
            isFillViewport = true
            setBackgroundColor(Color.parseColor("#020617"))
            addView(root, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        })
        loadMessages()
    }

    override fun onStart() {
        super.onStart()
        CallManager.addListener(listener)
        ui.post(ticker)
    }

    override fun onStop() {
        CallManager.removeListener(listener)
        ui.removeCallbacks(ticker)
        releaseProximity()
        super.onStop()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        render()
    }

    private fun loadMessages() {
        if (!TelePaktApi.isConfigured(this)) {
            messagesError = "Zaloguj się w aplikacji TelePakt, aby używać komunikatów."
            return
        }
        Thread {
            try {
                val list = TelePaktApi.messages(applicationContext)
                runOnUiThread { messages = list.take(6); render() }
            } catch (e: ApiException) {
                runOnUiThread { messagesError = e.message; render() }
            } catch (e: Exception) {
                runOnUiThread { messagesError = "Nie udało się pobrać komunikatów"; render() }
            }
        }.start()
    }

    // ------------------------------------------------------------------ rysowanie

    private fun render() {
        val top = CallManager.topLevelCalls()
        if (top.isEmpty()) {
            if (!isFinishing) finish()
            return
        }
        root.removeAllViews()
        top.forEach { addCallCard(it, top.size > 1) }
        val primary = top.firstOrNull { it.state == Call.STATE_RINGING } ?: top.firstOrNull { it.state == Call.STATE_ACTIVE } ?: top.first()
        if (primary.state != Call.STATE_RINGING) {
            addControls(primary)
            if (showKeypad) addKeypad(primary)
            addTelePaktPanel()
            addEndButton(primary)
        }
        updateProximity(primary)
    }

    private fun stateText(call: Call): String = when (call.state) {
        Call.STATE_RINGING -> "Połączenie przychodzące"
        Call.STATE_DIALING, Call.STATE_CONNECTING, Call.STATE_NEW, Call.STATE_PULLING_CALL -> "Łączenie…"
        Call.STATE_HOLDING -> "Wstrzymana"
        Call.STATE_DISCONNECTING, Call.STATE_DISCONNECTED -> "Kończę…"
        Call.STATE_ACTIVE -> {
            val start = call.details.connectTimeMillis
            if (start > 0) {
                val s = ((System.currentTimeMillis() - start) / 1000).coerceAtLeast(0)
                "%d:%02d".format(s / 60, s % 60)
            } else "Rozmowa"
        }
        else -> ""
    }

    private fun addCallCard(call: Call, several: Boolean) {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = rounded("#0F172A", 20, "#1E293B")
            setPadding(dp(14), dp(14), dp(14), dp(14))
        }
        card.addView(text(CallManager.displayName(this, call), 22f, "#FFFFFF", bold = true))
        val number = CallManager.numberOf(call)
        if (number.isNotBlank() && CallManager.displayName(this, call) != number && !CallManager.isConference(call)) {
            card.addView(text(number, 13f, "#94A3B8"))
        }
        card.addView(text(stateText(call), 14f, if (call.state == Call.STATE_ACTIVE) "#34D399" else "#38BDF8"))

        if (call.state == Call.STATE_RINGING) {
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
            row.addView(bigButton("Odrzuć", "#DC2626") { call.reject(false, null) }, weight())
            row.addView(bigButton("Odbierz", "#16A34A") { call.answer(VideoProfile.STATE_AUDIO_ONLY) }, weight())
            card.addView(row, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(14) })
        } else if (several && call.state == Call.STATE_HOLDING) {
            card.addView(smallButton("Wznów tę rozmowę") { call.unhold() }, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(8) })
        }
        root.addView(card, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(10) })
    }

    private fun addControls(call: Call) {
        val audio = CallManager.service?.callAudioState
        val muted = audio?.isMuted == true
        val route = audio?.route ?: CallAudioState.ROUTE_EARPIECE
        val mask = audio?.supportedRouteMask ?: 0

        val grid = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        fun row(vararg buttons: Button) {
            val r = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            buttons.forEach { r.addView(it, weight()) }
            grid.addView(r, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(8) })
        }

        val canHold = call.details.can(Call.Details.CAPABILITY_HOLD) || call.details.can(Call.Details.CAPABILITY_SUPPORT_HOLD)
        val holding = call.state == Call.STATE_HOLDING
        val mergeable = call.conferenceableCalls.isNotEmpty() || call.details.can(Call.Details.CAPABILITY_MERGE_CONFERENCE)

        val b1 = toggle(if (muted) "Mikrofon wył." else "Wycisz", muted) { CallManager.service?.setMuted(!muted) }
        val b2 = toggle("Głośnik", route == CallAudioState.ROUTE_SPEAKER) {
            CallManager.service?.setAudioRoute(
                if (route == CallAudioState.ROUTE_SPEAKER) CallAudioState.ROUTE_WIRED_OR_EARPIECE else CallAudioState.ROUTE_SPEAKER
            )
        }
        val b3 = toggle(if (holding) "Wznów" else "Wstrzymaj", holding) {
            if (holding) call.unhold() else call.hold()
        }.apply { isEnabled = canHold }
        row(b1, b2, b3)

        val b4 = toggle("Klawiatura", showKeypad) { showKeypad = !showKeypad; render() }
        val b5 = toggle("Dodaj rozmowę", false) {
            startActivity(Intent(this, DialerActivity::class.java).putExtra(DialerActivity.EXTRA_ADD_CALL, true))
        }
        val b6 = if ((mask and CallAudioState.ROUTE_BLUETOOTH) != 0) {
            toggle("Bluetooth", route == CallAudioState.ROUTE_BLUETOOTH) {
                CallManager.service?.setAudioRoute(
                    if (route == CallAudioState.ROUTE_BLUETOOTH) CallAudioState.ROUTE_WIRED_OR_EARPIECE else CallAudioState.ROUTE_BLUETOOTH
                )
            }
        } else toggle("Scal", false) { mergeManually(call) }.apply { isEnabled = mergeable }
        row(b4, b5, b6)

        if ((mask and CallAudioState.ROUTE_BLUETOOTH) != 0 && mergeable) {
            row(toggle("Scal rozmowy", false) { mergeManually(call) })
        }
        root.addView(grid)
    }

    /** Ręczne scalenie jak w Telefonie AOSP: conference() z rozmową do scalenia, w ostateczności mergeConference(). */
    private fun mergeManually(call: Call) {
        try {
            val other = call.conferenceableCalls.firstOrNull()
            if (other != null) call.conference(other) else call.mergeConference()
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "ręczne scalanie nie powiodło się", e)
        }
    }

    private fun addKeypad(call: Call) {
        val keys = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#")
        val grid = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        keys.chunked(3).forEach { chunk ->
            val r = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            chunk.forEach { k ->
                r.addView(toggle(k, false) {
                    call.playDtmfTone(k[0])
                    ui.postDelayed({ call.stopDtmfTone() }, 150)
                }, weight())
            }
            grid.addView(r, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(6) })
        }
        root.addView(grid)
    }

    /** Przyciski komunikatów: jeden stuknięcie = połącz z TelePakt, scal i odtwórz. */
    private fun addTelePaktPanel() {
        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded("#082F49", 20, "#0EA5E9")
            setPadding(dp(12), dp(12), dp(12), dp(12))
        }
        panel.addView(text("TelePakt", 15f, "#7DD3FC", bold = true))
        panel.addView(text("Stuknij komunikat: połączę z TelePakt, scalę rozmowy i odtworzę go rozmówcy.", 11f, "#94A3B8"))

        CallManager.status?.let {
            panel.addView(text(it, 12f, if (CallManager.statusIsError) "#F87171" else "#34D399", bold = true).apply {
                setPadding(0, dp(6), 0, dp(4))
            })
        }

        val list = messages
        when {
            messagesError != null -> panel.addView(text(messagesError!!, 12f, "#F87171"))
            list == null -> panel.addView(text("Wczytuję komunikaty…", 12f, "#94A3B8"))
            list.isEmpty() -> panel.addView(text("Nie masz aktywnych komunikatów. Dodaj je w aplikacji (zakładka Komunikaty).", 12f, "#94A3B8"))
            else -> list.forEach { m ->
                panel.addView(
                    smallButton("▶ ${m.title}") { CallManager.startThreeWay(this, m) },
                    LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(6) }
                )
            }
        }
        panel.addView(
            smallButton("● Połącz z TelePakt i nagrywaj rozmowę") { CallManager.startThreeWay(this, null) },
            LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(10) }
        )
        root.addView(panel, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(6); bottomMargin = dp(10) })
    }

    private fun addEndButton(call: Call) {
        root.addView(
            bigButton("Zakończ", "#DC2626") { call.disconnect() },
            LinearLayout.LayoutParams(-1, dp(56)).apply { topMargin = dp(4) }
        )
    }

    // ------------------------------------------------------------------ czujnik zbliżeniowy

    /** Przy rozmowie na słuchawce gasimy ekran, gdy telefon jest przy uchu (Telecom tego nie robi za aplikację). */
    private fun updateProximity(primary: Call) {
        val route = CallManager.service?.callAudioState?.route ?: CallAudioState.ROUTE_EARPIECE
        val want = primary.state == Call.STATE_ACTIVE && route == CallAudioState.ROUTE_EARPIECE
        if (!want) { releaseProximity(); return }
        if (proximity == null) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            if (pm.isWakeLockLevelSupported(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK)) {
                proximity = pm.newWakeLock(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK, "telepakt:proximity")
            }
        }
        proximity?.let { if (!it.isHeld) it.acquire(60 * 60 * 1000L) }
    }

    private fun releaseProximity() {
        proximity?.let { if (it.isHeld) it.release() }
    }

    override fun onDestroy() {
        releaseProximity()
        super.onDestroy()
    }

    // ------------------------------------------------------------------ pomocnicze widoki

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    private fun weight() = LinearLayout.LayoutParams(0, -2, 1f).apply { setMargins(dp(3), 0, dp(3), 0) }

    private fun rounded(fill: String, radiusDp: Int, stroke: String? = null) = GradientDrawable().apply {
        setColor(Color.parseColor(fill))
        cornerRadius = dp(radiusDp).toFloat()
        if (stroke != null) setStroke(dp(1), Color.parseColor(stroke))
    }

    private fun text(value: String, size: Float, color: String, bold: Boolean = false) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(Color.parseColor(color))
        gravity = Gravity.CENTER
        if (bold) setTypeface(typeface, Typeface.BOLD)
    }

    private fun bigButton(label: String, color: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 16f
        setTextColor(Color.WHITE)
        setTypeface(typeface, Typeface.BOLD)
        background = rounded(color, 28)
        minHeight = dp(52)
        setOnClickListener { onClick() }
    }

    private fun smallButton(label: String, onClick: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 13f
        setTextColor(Color.parseColor("#E0F2FE"))
        background = rounded("#0C4A6E", 14, "#0EA5E9")
        setOnClickListener { onClick() }
    }

    private fun toggle(label: String, on: Boolean, onClick: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 12f
        setTextColor(Color.parseColor(if (on) "#020617" else "#E2E8F0"))
        background = rounded(if (on) "#38BDF8" else "#1E293B", 14)
        setOnClickListener { onClick() }
    }
}
