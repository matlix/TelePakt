package pl.telepakt.app.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.*
import androidx.core.app.NotificationCompat

/**
 * Natywny serwis Android Overlay wyświetlający pływający suwak TelePakt nad połączeniem
 * Obsługuje WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY i nasłuchuje stanu linii.
 */
class CallOverlayService : Service() {

    // Dwa tryby suwaków odpowiedzi (wybierane po stanie telefonu):
    //  - telefon DZWONI: suwak uzbraja komunikat na serwerze i odrzuca rozmowę; operator przekierowuje ją do TelePakt,
    //    który odtwarza komunikat rozmówcy i się rozłącza (wymaga przekierowania "gdy zajęty" i ANSWER_PHONE_CALLS);
    //  - rozmowa TRWA: po połączeniu 3-way z numerem TelePakt suwak prosi serwer o odtworzenie komunikatu w rozmowie.

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var telephonyManager: TelephonyManager? = null
    private var apiUrl = ""
    private var authToken = ""
    private var threeWayBtn: Button? = null

    // Referencje do nasłuchu stanu linii: bez nich system może je usunąć, a nakładka nigdy się nie zamknie.
    private var telephonyCallback: TelephonyCallback? = null
    @Suppress("DEPRECATION")
    private var legacyListener: PhoneStateListener? = null

    // Zegar awaryjny: gdy nasłuch zawiedzie, sami sprawdzamy stan linii i zamykamy nakładkę po rozmowie.
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
    private var idleChecks = 0
    private val idleWatcher = object : Runnable {
        override fun run() {
            @Suppress("DEPRECATION")
            val state = try { telephonyManager?.callState } catch (e: SecurityException) { null }
            idleChecks = if (state == TelephonyManager.CALL_STATE_IDLE) idleChecks + 1 else 0
            if (idleChecks >= 2) {
                android.util.Log.i("TelePakt", "linia bezczynna - zamykam nakładkę")
                stopSelf()
                return
            }
            handler.postDelayed(this, 2000L)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
        startForegroundServiceNotification()
        registerPhoneListener()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Konfigurację zapisuje aplikacja (TelePaktOverlayPlugin.saveConfig); CallReceiver nie zna jej z intentu
        val prefs = getSharedPreferences("telepakt", Context.MODE_PRIVATE)
        apiUrl = prefs.getString("api_url", "") ?: ""
        authToken = prefs.getString("auth_token", "") ?: ""
        val phoneNumber = intent?.getStringExtra("PHONE_NUMBER") ?: "+48 799 555 123"
        showOverlayWindow(phoneNumber)
        handler.removeCallbacks(idleWatcher)
        idleChecks = 0
        handler.postDelayed(idleWatcher, 4000L)
        return START_NOT_STICKY
    }

    private fun registerPhoneListener() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                    override fun onCallStateChanged(state: Int) {
                        handleCallState(state)
                    }
                }
                telephonyCallback = callback
                telephonyManager?.registerTelephonyCallback(mainExecutor, callback)
            } else {
                @Suppress("DEPRECATION")
                val listener = object : PhoneStateListener() {
                    @Deprecated("Deprecated in Java")
                    override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                        handleCallState(state)
                    }
                }
                legacyListener = listener
                @Suppress("DEPRECATION")
                telephonyManager?.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
            }
        } catch (e: Exception) {
            // Bez nasłuchu zostaje zegar awaryjny (idleWatcher) - nie wywracamy usługi.
            android.util.Log.e("TelePakt", "registerPhoneListener failed", e)
        }
    }

    private fun unregisterPhoneListener() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                telephonyCallback?.let { telephonyManager?.unregisterTelephonyCallback(it) }
            } else {
                @Suppress("DEPRECATION")
                legacyListener?.let { telephonyManager?.listen(it, PhoneStateListener.LISTEN_NONE) }
            }
        } catch (e: Exception) {
            android.util.Log.w("TelePakt", "unregisterPhoneListener failed", e)
        }
        telephonyCallback = null
        legacyListener = null
    }

    private fun handleCallState(state: Int) {
        when (state) {
            TelephonyManager.CALL_STATE_IDLE -> stopSelf()  // połączenie zakończone - zamknij nakładkę
            TelephonyManager.CALL_STATE_OFFHOOK -> threeWayBtn?.visibility = View.VISIBLE
            TelephonyManager.CALL_STATE_RINGING -> threeWayBtn?.visibility = View.GONE
        }
    }

    @Suppress("DEPRECATION")
    private fun currentCallState(): Int =
        try {
            telephonyManager?.callState ?: TelephonyManager.CALL_STATE_IDLE
        } catch (e: SecurityException) {
            TelephonyManager.CALL_STATE_IDLE
        }

    private fun showOverlayWindow(phoneNumber: String) {
        if (overlayView != null) return

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            y = 120
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 36, 40, 36)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#0F172A"))
                cornerRadius = 48f
                setStroke(3, Color.parseColor("#06B6D4"))
            }
        }

        // Header
        val header = TextView(this).apply {
            text = "🛡️ TelePakt - Tarcza Prawna Art. 398 PKE"
            textSize = 15f
            setTextColor(Color.parseColor("#38BDF8"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        root.addView(header)

        val callerInfo = TextView(this).apply {
            text = "Rozmowa przychodząca: $phoneNumber"
            textSize = 12f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, 8, 0, 24)
        }
        root.addView(callerInfo)

        // Najpierw tylko jeden suwak. Dopiero jego przesunięcie pokazuje możliwe odpowiedzi - po jednym
        // suwaku na aktywny komunikat użytkownika (maks. 4), pobierane z serwera już przy otwarciu nakładki.
        val messagesBox = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
        }
        val messagesInfo = TextView(this).apply {
            text = "Ładowanie komunikatów…"
            textSize = 11f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, 8, 0, 8)
        }
        messagesBox.addView(messagesInfo)
        val chooseSlider = buildSlider("PRZESUŃ, BY WYBRAĆ ODPOWIEDŹ  ➔", "💬") { track, _, _, _ ->
            track.visibility = View.GONE
            messagesBox.visibility = View.VISIBLE
        }
        root.addView(chooseSlider)
        root.addView(messagesBox)
        loadMessages(messagesBox, messagesInfo)

        // Rozmowa trwa: połączenie 3-way z numerem TelePakt. TelePakt słyszy obie strony, nagrywa rozmowę i może
        // odtworzyć komunikat (suwak odpowiedzi). Przycisk pojawia się dopiero po odebraniu rozmowy.
        val threeWay = Button(this).apply {
            text = "● POŁĄCZ Z TELEPAKT (3-way)"
            textSize = 12f
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#DC2626"))
                cornerRadius = 32f
            }
            setOnClickListener { recordWholeCall(this) }
            visibility = if (currentCallState() == TelephonyManager.CALL_STATE_OFFHOOK) View.VISIBLE else View.GONE
        }
        threeWayBtn = threeWay
        root.addView(threeWay, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = 16 })

        // Close button
        val closeBtn = Button(this).apply {
            text = "Zamknij Nakładkę"
            textSize = 11f
            setTextColor(Color.parseColor("#64748B"))
            setBackgroundColor(Color.TRANSPARENT)
            setOnClickListener { stopSelf() }
        }
        root.addView(closeBtn)

        overlayView = root
        windowManager?.addView(overlayView, params)
    }

    /** Odrzuca dzwoniącą rozmowę; operator przekierowuje ją wg ustawienia "gdy zajęty". Zwraca, czy się udało. */
    private fun rejectRingingCall(): Boolean {
        val granted = checkSelfPermission(android.Manifest.permission.ANSWER_PHONE_CALLS) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P || !granted) {
            Toast.makeText(
                this,
                "Włącz uprawnienie do rozmów w aplikacji TelePakt (baner „Dokończ konfigurację”), żeby odrzucać rozmowy.",
                Toast.LENGTH_LONG
            ).show()
            return false
        }
        val telecom = getSystemService(Context.TELECOM_SERVICE) as android.telecom.TelecomManager
        return try {
            @Suppress("DEPRECATION", "MissingPermission")
            telecom.endCall()
        } catch (e: SecurityException) {
            android.util.Log.e("TelePakt", "endCall: brak uprawnienia", e)
            false
        }
    }

    /**
     * Nagrywanie całej rozmowy metodą 3-way: pobiera numer TelePakt z serwera i otwiera aplikację Telefon
     * z wpisanym numerem. Użytkownik wciska "zadzwoń" (rozmowa idzie na wstrzymanie), a gdy TelePakt odbierze -
     * "Scal". Android nie pozwala aplikacji nagrywać dźwięku zwykłej rozmowy, więc nagrywa serwer.
     */
    private fun recordWholeCall(button: Button) {
        if (apiUrl.isBlank()) {
            Toast.makeText(this, "Nagrywanie niedostępne: zaloguj się w aplikacji TelePakt", Toast.LENGTH_LONG).show()
            return
        }
        button.isEnabled = false
        Thread {
            var number = ""
            var message = "Nie udało się pobrać numeru TelePakt"
            try {
                val conn = java.net.URL("${apiUrl.trimEnd('/')}/api/telephony/forwarding-info/")
                    .openConnection() as java.net.HttpURLConnection
                conn.connectTimeout = 8000
                conn.readTimeout = 8000
                val code = conn.responseCode
                val body = (if (code in 200..299) conn.inputStream else conn.errorStream)
                    ?.bufferedReader()?.use { it.readText() }.orEmpty()
                if (code in 200..299) {
                    number = org.json.JSONObject(body).optString("number")
                } else {
                    message = try {
                        org.json.JSONObject(body).optString("error", message)
                    } catch (e: Exception) {
                        "$message (HTTP $code)"
                    }
                    android.util.Log.w("TelePakt", "forwarding-info HTTP $code: $body")
                }
                conn.disconnect()
            } catch (e: Exception) {
                message = "Brak połączenia z serwerem"
                android.util.Log.e("TelePakt", "record-whole-call: pobranie numeru nie powiodło się", e)
            }
            button.post {
                button.isEnabled = true
                if (number.isBlank()) {
                    Toast.makeText(this, message, Toast.LENGTH_LONG).show()
                    return@post
                }
                try {
                    // Z uprawnieniem CALL_PHONE numer jest wybierany od razu (rozmowa idzie na wstrzymanie);
                    // bez niego otwieramy dialer z wpisanym numerem i trzeba jeszcze wcisnąć "zadzwoń".
                    val canCall = checkSelfPermission(android.Manifest.permission.CALL_PHONE) ==
                        android.content.pm.PackageManager.PERMISSION_GRANTED
                    val dial = Intent(
                        if (canCall) Intent.ACTION_CALL else Intent.ACTION_DIAL,
                        android.net.Uri.parse("tel:" + android.net.Uri.encode(number))
                    ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(dial)
                    button.text = "● GDY TELEPAKT ODBIERZE: STUKNIJ „SCAL”"
                    Toast.makeText(
                        this,
                        if (canCall) "Łączę z TelePakt. Gdy odbierze, stuknij „Scal” w aplikacji Telefon - tego kroku Android nie pozwala wykonać za Ciebie."
                        else "Wciśnij zadzwoń. Gdy TelePakt odbierze, stuknij „Scal” w aplikacji Telefon.",
                        Toast.LENGTH_LONG
                    ).show()
                } catch (e: Exception) {
                    android.util.Log.e("TelePakt", "record-whole-call: nie można otworzyć aplikacji Telefon", e)
                    Toast.makeText(this, "Nie można otworzyć aplikacji Telefon", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    private data class OverlayMessage(val id: Int, val title: String, val hasAudio: Boolean, val text: String, val seconds: Double)

    /** Pobiera aktywne komunikaty użytkownika i dodaje po jednym suwaku na każdy. Powód błędu pokazuje wprost. */
    private fun loadMessages(box: LinearLayout, info: TextView) {
        if (apiUrl.isBlank() || authToken.isBlank()) {
            info.text = "Zaloguj się w aplikacji TelePakt, aby używać komunikatów."
            return
        }
        Thread {
            var items = emptyList<OverlayMessage>()
            var error: String? = null
            try {
                val conn = java.net.URL("${apiUrl.trimEnd('/')}/api/telephony/messages/")
                    .openConnection() as java.net.HttpURLConnection
                conn.connectTimeout = 8000
                conn.readTimeout = 8000
                conn.setRequestProperty("Authorization", "Bearer $authToken")
                val code = conn.responseCode
                val body = (if (code in 200..299) conn.inputStream else conn.errorStream)
                    ?.bufferedReader()?.use { it.readText() }.orEmpty()
                if (code in 200..299) {
                    val arr = org.json.JSONObject(body).getJSONArray("messages")
                    val list = mutableListOf<OverlayMessage>()
                    for (i in 0 until arr.length()) {
                        val m = arr.getJSONObject(i)
                        if (m.optBoolean("is_active", true)) {
                            list.add(OverlayMessage(m.getInt("id"), m.getString("title"), m.optBoolean("has_audio", false), m.optString("text", ""), m.optDouble("audio_seconds", 0.0)))
                        }
                    }
                    items = list.take(4)
                } else {
                    error = try {
                        org.json.JSONObject(body).optString("error", "Nie udało się pobrać komunikatów")
                    } catch (e: Exception) {
                        "Nie udało się pobrać komunikatów (HTTP $code)"
                    }
                    android.util.Log.w("TelePakt", "messages HTTP $code: $body")
                }
                conn.disconnect()
            } catch (e: Exception) {
                error = "Brak połączenia z serwerem"
                android.util.Log.e("TelePakt", "loadMessages failed", e)
            }
            box.post {
                if (overlayView == null) return@post  // nakładka została już zamknięta
                if (error != null) {
                    info.text = error
                    return@post
                }
                if (items.isEmpty()) {
                    info.text = "Nie masz aktywnych komunikatów. Dodaj je w aplikacji (zakładka Komunikaty)."
                    return@post
                }
                box.removeView(info)
                box.addView(TextView(this).apply {
                    text = if (currentCallState() == TelephonyManager.CALL_STATE_RINGING) {
                        "Przesunięcie odrzuci rozmowę, a TelePakt odtworzy wybrany komunikat rozmówcy."
                    } else {
                        "W rozmowie: najpierw połącz z TelePakt (3-way), potem przesuń komunikat."
                    }
                    textSize = 10f
                    setTextColor(Color.parseColor("#94A3B8"))
                    gravity = Gravity.CENTER
                    setPadding(0, 0, 0, 4)
                })
                items.forEach { message ->
                    box.addView(
                        buildAnswerSlider(message),
                        LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply { topMargin = 10 }
                    )
                }
            }
        }.start()
    }

    /**
     * Jeden suwak. Przesunięcie do końca wywołuje [onComplete]; suwak wraca na początek dopiero po wywołaniu
     * przekazanego tam `done` (do tego czasu kolejne przesunięcia są ignorowane).
     */
    private fun buildSlider(
        label: String,
        icon: String,
        onComplete: (track: FrameLayout, hint: TextView, thumb: View, done: () -> Unit) -> Unit
    ): FrameLayout {
        val track = FrameLayout(this).apply {
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#020617"))
                cornerRadius = 36f
                setStroke(2, Color.parseColor("#334155"))
            }
            setPadding(8, 8, 8, 8)
            clipToOutline = true  // wypełnienie postępu nie wychodzi poza zaokrąglenia
        }
        // Pasek postępu (przezroczysty turkus) - rośnie od lewej podczas odtwarzania komunikatu.
        val fill = View(this).apply {
            setBackgroundColor(Color.parseColor("#4006B6D4"))
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
            pivotX = 0f
            scaleX = 0f
        }
        track.addView(fill)
        val hint = TextView(this).apply {
            text = label
            textSize = 11f
            setTextColor(Color.parseColor("#38BDF8"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            setPadding(200, 0, 24, 0)
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, 120)
        }
        track.addView(hint)
        val thumb = TextView(this).apply {
            text = icon
            textSize = 16f
            setTextColor(Color.parseColor("#020617"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#06B6D4"))
                cornerRadius = 32f
            }
            layoutParams = FrameLayout.LayoutParams(180, 110, Gravity.START or Gravity.CENTER_VERTICAL)
        }
        var busy = false
        thumb.setOnTouchListener(object : View.OnTouchListener {
            var startX = 0f

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        startX = event.rawX
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        if (busy) return true
                        val maxScroll = (track.width - v.width - 16).toFloat()
                        val newX = (event.rawX - startX).coerceIn(0f, maxScroll)
                        v.x = newX
                        if (newX >= maxScroll * 0.85f) {
                            busy = true
                            onComplete(track, hint, v) {
                                v.animate().x(0f).setDuration(300).start()
                                busy = false
                            }
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        if (!busy) v.animate().x(0f).setDuration(200).start()
                        return true
                    }
                }
                return false
            }
        })
        track.addView(thumb)
        return track
    }

    /** Suwak odpowiedzi: przesunięcie do końca odtwarza komunikat przez głośnik telefonu. */
    private fun buildAnswerSlider(message: OverlayMessage): FrameLayout {
        val idle = "${message.title}  ➔"
        return buildSlider(idle, "▶") { track, hint, thumb, done -> onAnswerSlid(message, track, hint, thumb, idle, done) }
    }

    /**
     * Widoczny ruch podczas odtwarzania: pasek postępu wypełnia suwak, w napisie "tańczy" equalizer, ikona pulsuje.
     * Zwraca funkcję zatrzymującą animację. Czas jest szacunkiem, gdy odtwarzacz go nie zna (głos telefonu).
     */
    private fun startPlayMotion(track: FrameLayout, hint: TextView, thumb: View, durationMs: Long): () -> Unit {
        val fill = track.getChildAt(0)
        fill.alpha = 1f
        val progress = android.animation.ObjectAnimator.ofFloat(fill, "scaleX", 0f, 1f).apply {
            duration = durationMs.coerceAtLeast(1000L)
            interpolator = android.view.animation.LinearInterpolator()
            start()
        }
        val pulse = android.animation.ObjectAnimator.ofFloat(thumb, "alpha", 1f, 0.4f).apply {
            duration = 450
            repeatMode = android.animation.ValueAnimator.REVERSE
            repeatCount = android.animation.ValueAnimator.INFINITE
            start()
        }
        val thumbText = thumb as? TextView
        thumbText?.text = "🔊"
        val frames = arrayOf("▂▄▆▄▂", "▄▆▄▂▄", "▆▄▂▄▆", "▄▂▄▆▄")
        var frame = 0
        val ticker = object : Runnable {
            override fun run() {
                val bars = frames[frame++ % frames.size]
                hint.text = "$bars  Odtwarzam  $bars"
                handler.postDelayed(this, 160L)
            }
        }
        handler.post(ticker)
        return {
            handler.removeCallbacks(ticker)
            progress.cancel()
            pulse.cancel()
            thumb.alpha = 1f
            thumbText?.text = "▶"
            fill.animate().alpha(0f).setDuration(300).withEndAction {
                fill.scaleX = 0f
                fill.alpha = 1f
            }.start()
        }
    }

    /** Suwak odpowiedzi przesunięty do końca: tryb zależy od stanu telefonu (dzwoni / trwa rozmowa). */
    private fun onAnswerSlid(
        message: OverlayMessage, track: FrameLayout, hint: TextView, thumb: View, idleText: String, done: () -> Unit
    ) {
        when (currentCallState()) {
            TelephonyManager.CALL_STATE_RINGING -> armAndReject(message, hint, idleText, done)
            TelephonyManager.CALL_STATE_OFFHOOK -> speakInCall(message, track, hint, thumb, idleText, done)
            else -> {
                Toast.makeText(this, "Brak aktywnej rozmowy.", Toast.LENGTH_SHORT).show()
                done()
            }
        }
    }

    /** POST bez treści do API: zwraca (kod, treść); przy braku sieci rzuca IOException. */
    private fun postEmpty(path: String, readTimeoutMs: Int = 10000): Pair<Int, String> {
        val conn = java.net.URL("${apiUrl.trimEnd('/')}$path").openConnection() as java.net.HttpURLConnection
        conn.requestMethod = "POST"
        conn.connectTimeout = 8000
        conn.readTimeout = readTimeoutMs
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Authorization", "Bearer $authToken")
        conn.outputStream.use { it.write("{}".toByteArray()) }
        val code = conn.responseCode
        val body = (if (code in 200..299) conn.inputStream else conn.errorStream)
            ?.bufferedReader()?.use { it.readText() }.orEmpty()
        conn.disconnect()
        return Pair(code, body)
    }

    private fun serverError(body: String, fallback: String): String =
        try {
            org.json.JSONObject(body).optString("error", fallback)
        } catch (e: Exception) {
            fallback
        }

    /** Błąd widoczny na samym suwaku (i w toaście), potem suwak wraca do stanu wyjściowego. */
    private fun failHint(hint: TextView, reason: String, idleText: String, done: () -> Unit) {
        Toast.makeText(this, reason, Toast.LENGTH_LONG).show()
        hint.text = "✗ $reason"
        hint.setTextColor(Color.parseColor("#F87171"))
        hint.postDelayed({
            hint.text = idleText
            hint.setTextColor(Color.parseColor("#38BDF8"))
            done()
        }, 3000L)
    }

    /**
     * Tryb "przed odebraniem": uzbraja komunikat na serwerze i dopiero po potwierdzeniu odrzuca rozmowę. Operator
     * przekierowuje ją do TelePakt, który odtwarza komunikat rozmówcy i się rozłącza. Gdy uzbrojenie się nie uda,
     * rozmowa NIE jest odrzucana (można ją odebrać).
     */
    private fun armAndReject(message: OverlayMessage, hint: TextView, idleText: String, done: () -> Unit) {
        hint.text = "Przygotowuję…"
        Thread {
            var ok = false
            var reason = "Nie udało się przygotować komunikatu"
            try {
                val (code, body) = postEmpty("/api/telephony/messages/${message.id}/arm/")
                if (code in 200..299) {
                    ok = true
                } else {
                    reason = serverError(body, "$reason (HTTP $code)")
                    android.util.Log.w("TelePakt", "arm HTTP $code: $body")
                }
            } catch (e: java.io.IOException) {
                reason = "Brak połączenia z serwerem - rozmowa nie została odrzucona"
                android.util.Log.e("TelePakt", "arm: sieć", e)
            } catch (e: Exception) {
                android.util.Log.e("TelePakt", "arm failed", e)
            }
            hint.post {
                if (!ok) {
                    failHint(hint, reason, idleText, done)
                    return@post
                }
                hint.text = "Odrzucam - TelePakt odtworzy komunikat…"
                if (rejectRingingCall()) {
                    Toast.makeText(this, "Rozmowa przekazana do TelePakt. Odtworzy: ${message.title}", Toast.LENGTH_LONG).show()
                    hint.postDelayed({ stopSelf() }, 800L)
                } else {
                    hint.text = idleText  // nie odrzucono (np. brak uprawnienia) - rozmowa dalej dzwoni
                    done()
                }
            }
        }.start()
    }

    /** Tryb "w rozmowie": serwer odtwarza komunikat w rozmowie 3-way przez TelePakt - słyszą go obie strony. */
    private fun speakInCall(
        message: OverlayMessage, track: FrameLayout, hint: TextView, thumb: View, idleText: String, done: () -> Unit
    ) {
        hint.text = "Wysyłam do rozmowy…"
        Thread {
            var ok = false
            var reason = "Nie udało się odtworzyć komunikatu"
            try {
                val (code, body) = postEmpty("/api/telephony/messages/${message.id}/speak/", 20000)
                if (code in 200..299) {
                    ok = true
                } else {
                    reason = serverError(body, "$reason (HTTP $code)")
                    android.util.Log.w("TelePakt", "speak HTTP $code: $body")
                }
            } catch (e: java.io.IOException) {
                reason = "Brak połączenia z serwerem"
                android.util.Log.e("TelePakt", "speak: sieć", e)
            } catch (e: Exception) {
                android.util.Log.e("TelePakt", "speak failed", e)
            }
            hint.post {
                if (!ok) {
                    failHint(hint, reason, idleText, done)
                    return@post
                }
                // Czas trwania: dla własnego nagrania znamy go dokładnie, dla głosu AI szacujemy z długości tekstu.
                val ms = if (message.hasAudio && message.seconds > 0) {
                    (message.seconds * 1000).toLong()
                } else {
                    maxOf(2500L, message.text.length * 70L)
                }
                val stopMotion = startPlayMotion(track, hint, thumb, ms)
                hint.postDelayed({
                    stopMotion()
                    hint.text = "✓ ${message.title}"
                    hint.setTextColor(Color.parseColor("#10B981"))
                    hint.postDelayed({
                        hint.text = idleText
                        hint.setTextColor(Color.parseColor("#38BDF8"))
                        done()
                    }, 1500L)
                }, ms)
            }
        }.start()
    }

    private fun startForegroundServiceNotification() {
        val channelId = "telepakt_overlay_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Tarcza Połączeń TelePakt",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("TelePakt - Tarcza Aktywna")
            .setContentText("Monitorowanie połączeń spamowych zgodnie z art. 398 PKE")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        startForeground(1001, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(idleWatcher)
        // Najpierw zdejmujemy okno - żadna późniejsza awaria nie może zostawić nakładki na ekranie.
        try {
            overlayView?.let { windowManager?.removeView(it) }
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "removeView failed", e)
        }
        overlayView = null
        unregisterPhoneListener()
    }
}
