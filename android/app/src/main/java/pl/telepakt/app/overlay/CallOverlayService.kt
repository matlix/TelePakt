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

    companion object {
        /**
         * Przycisk "Przekieruj do TelePakt" jest chwilowo wylaczony (decyzja wlasciciela, 2026-11-10).
         * Aby go wlaczyc: ustaw true, dodaj ANSWER_PHONE_CALLS do AndroidManifest.xml i do aliasu "phone"
         * w TelePaktOverlayPlugin.kt oraz wlacz FEATURES.forwarding w src/config.ts.
         */
        private const val FORWARDING_ENABLED = false

        /**
         * Przycisk "Nagrywaj całą rozmowę" (3-way przez numer TelePakt) jest chwilowo wyłączony
         * (decyzja właściciela, 2026-11-11). Aby go włączyć: true + FEATURES.recording w src/config.ts.
         */
        private const val RECORD_WHOLE_CALL_ENABLED = false
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var telephonyManager: TelephonyManager? = null
    private var apiUrl = ""
    private var authToken = ""

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
        if (state == TelephonyManager.CALL_STATE_IDLE) {
            // Połączenie zakończone - zamknij nakładkę
            stopSelf()
        }
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

        // Nagrywanie CAŁEJ rozmowy: telefon wstrzymuje rozmowę i dzwoni na numer TelePakt; po stuknięciu
        // "Scal" w aplikacji Telefon numer TelePakt słyszy obie strony i nagrywa (3-way, bez zapowiedzi).
        val recordBtn = Button(this).apply {
            text = "● NAGRYWAJ CAŁĄ ROZMOWĘ"
            textSize = 12f
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#DC2626"))
                cornerRadius = 32f
            }
            setOnClickListener { recordWholeCall(this) }
        }
        if (RECORD_WHOLE_CALL_ENABLED) {
            root.addView(recordBtn, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 16 })
        }

        if (FORWARDING_ENABLED) {
            // Tryb przekierowania: nagrywa rozmowę, która już przechodzi przez numer TelePakt.
            val recordForwardedBtn = Button(this).apply {
                text = "● NAGRYWAJ (rozmowa przez TelePakt)"
                textSize = 11f
                setTextColor(Color.WHITE)
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#7F1D1D"))
                    cornerRadius = 32f
                }
                setOnClickListener { startRecording(this) }
            }
            root.addView(recordForwardedBtn, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 12 })
        }

        // Przekierowanie: odrzucenie dzwoniącego połączenia uruchamia u operatora przekierowanie
        // "gdy zajęty" na numer TelePakt (kod ustawiany w aplikacji, ekran Ustawienia).
        if (FORWARDING_ENABLED) {
            val forwardBtn = Button(this).apply {
                text = "↪ PRZEKIERUJ DO TELEPAKT"
                textSize = 12f
                setTextColor(Color.parseColor("#38BDF8"))
                background = GradientDrawable().apply {
                    setColor(Color.TRANSPARENT)
                    cornerRadius = 32f
                    setStroke(3, Color.parseColor("#38BDF8"))
                }
                setOnClickListener { sendToTelePakt() }
            }
            root.addView(forwardBtn, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = 12 })
        }

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

    /** Odrzuca dzwoniące połączenie; operator przekierowuje je wg ustawienia "gdy zajęty". */
    private fun sendToTelePakt() {
        val granted = checkSelfPermission(android.Manifest.permission.ANSWER_PHONE_CALLS) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P || !granted) {
            Toast.makeText(this, "Włącz uprawnienie do odrzucania połączeń w Ustawieniach TelePakt", Toast.LENGTH_LONG).show()
            return
        }
        val telecom = getSystemService(Context.TELECOM_SERVICE) as android.telecom.TelecomManager
        @Suppress("DEPRECATION", "MissingPermission")
        val ended = telecom.endCall()
        Toast.makeText(
            this,
            if (ended) "Połączenie przekierowane do TelePakt (jeśli ustawiono przekierowanie)" else "Nie udało się odrzucić połączenia",
            Toast.LENGTH_LONG
        ).show()
        if (ended) stopSelf()
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
                    val dial = Intent(Intent.ACTION_DIAL, android.net.Uri.fromParts("tel", number, null))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(dial)
                    button.text = "● GDY TELEPAKT ODBIERZE: STUKNIJ „SCAL”"
                    Toast.makeText(
                        this,
                        "Wciśnij zadzwoń. Gdy TelePakt odbierze, stuknij „Scal” w aplikacji Telefon - wtedy nagrywane są obie strony.",
                        Toast.LENGTH_LONG
                    ).show()
                } catch (e: Exception) {
                    android.util.Log.e("TelePakt", "record-whole-call: nie można otworzyć aplikacji Telefon", e)
                    Toast.makeText(this, "Nie można otworzyć aplikacji Telefon", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    /** Prosi backend o włączenie nagrywania (Twilio). Rozmówca nie słyszy żadnego komunikatu. */
    private fun startRecording(button: Button) {
        if (apiUrl.isBlank() || authToken.isBlank()) {
            Toast.makeText(this, "Nagrywanie niedostępne: zaloguj się w aplikacji TelePakt", Toast.LENGTH_LONG).show()
            return
        }
        button.isEnabled = false
        Thread {
            var ok = false
            var message = "Nie udało się włączyć nagrywania"
            try {
                val conn = java.net.URL("${apiUrl.trimEnd('/')}/api/telephony/start-recording/")
                    .openConnection() as java.net.HttpURLConnection
                conn.requestMethod = "POST"
                conn.connectTimeout = 8000
                conn.readTimeout = 8000
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $authToken")
                conn.outputStream.use { it.write("{}".toByteArray()) }
                val code = conn.responseCode
                if (code in 200..299) {
                    ok = true
                } else {
                    // Pokazujemy PRZYCZYNE z serwera (np. "brak trwajacego polaczenia"), nie ogolny blad.
                    val body = (conn.errorStream ?: conn.inputStream)?.bufferedReader()?.use { it.readText() }.orEmpty()
                    message = try {
                        org.json.JSONObject(body).optString("error", message)
                    } catch (e: Exception) {
                        "$message (HTTP $code)"
                    }
                    android.util.Log.w("TelePakt", "start-recording HTTP $code: $body")
                }
                conn.disconnect()
            } catch (e: Exception) {
                message = "Brak połączenia z serwerem"
                android.util.Log.e("TelePakt", "start-recording failed", e)
            }
            button.post {
                if (ok) {
                    button.text = "● NAGRYWANIE TRWA"
                } else {
                    button.isEnabled = true
                    Toast.makeText(this, message, Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    private data class OverlayMessage(val id: Int, val title: String, val hasAudio: Boolean, val text: String)

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
                            list.add(OverlayMessage(m.getInt("id"), m.getString("title"), m.optBoolean("has_audio", false), m.optString("text", "")))
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
                    text = "Odpowiedź usłyszy rozmówca przez głośnik Twojego telefonu - włącz głośnik w rozmowie."
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
        }
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
        return buildSlider(idle, "▶") { _, hint, _, done -> playMessage(message, hint, idle, done) }
    }

    /**
     * Pobiera dźwięk komunikatu (własne nagranie albo głos AI z serwera) i odtwarza go na głośniku. Rozmówca
     * słyszy go przez mikrofon telefonu. Powód każdej porażki jest pokazywany wprost (toast + logcat).
     */
    private fun playMessage(message: OverlayMessage, hint: TextView, idleText: String, done: () -> Unit) {
        hint.text = "Przygotowuję…"
        Thread {
            var file: java.io.File? = null
            var reason = "Nie udało się pobrać komunikatu"
            try {
                file = fetchMessageAudio(message)
            } catch (e: java.io.IOException) {
                reason = "Brak połączenia z serwerem"
                android.util.Log.e("TelePakt", "fetchMessageAudio: sieć", e)
            } catch (e: Exception) {
                reason = e.message ?: reason
                android.util.Log.e("TelePakt", "fetchMessageAudio failed", e)
            }
            hint.post {
                val green = Color.parseColor("#10B981")
                val blue = Color.parseColor("#38BDF8")
                val finished: (Boolean) -> Unit = { played ->
                    hint.text = if (played) "✓ ${message.title}" else idleText
                    hint.setTextColor(if (played) green else blue)
                    hint.postDelayed({
                        hint.text = idleText
                        hint.setTextColor(blue)
                        done()
                    }, if (played) 1500L else 0L)
                }
                val ready = file
                if (ready != null) {
                    hint.text = "Odtwarzam przez głośnik…"
                    playOnSpeaker(ready, finished)
                } else if (!message.hasAudio && message.text.isNotBlank()) {
                    // Głos AI niedostępny (serwer/Telnyx/sieć) - czytamy tekst głosem samego telefonu, żeby suwak działał.
                    Toast.makeText(this, "Głos AI niedostępny: $reason. Czytam głosem telefonu.", Toast.LENGTH_LONG).show()
                    hint.text = "Czytam głosem telefonu…"
                    speakWithPhoneVoice(message.text, finished)
                } else {
                    Toast.makeText(this, reason, Toast.LENGTH_LONG).show()
                    hint.text = "✗ $reason"
                    hint.setTextColor(Color.parseColor("#F87171"))
                    hint.postDelayed({
                        hint.text = idleText
                        hint.setTextColor(blue)
                        done()
                    }, 3000L)
                }
            }
        }.start()
    }

    /** Własne nagranie pobieramy wprost, komunikat czytany przez AI generuje serwer (Telnyx, ten sam głos co w ustawieniach). */
    private fun fetchMessageAudio(message: OverlayMessage): java.io.File {
        val base = apiUrl.trimEnd('/')
        val path = if (message.hasAudio) "audio" else "preview"
        val conn = java.net.URL("$base/api/telephony/messages/${message.id}/$path/")
            .openConnection() as java.net.HttpURLConnection
        conn.connectTimeout = 8000
        conn.readTimeout = 30000
        conn.setRequestProperty("Authorization", "Bearer $authToken")
        if (!message.hasAudio) {
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/json")
            conn.outputStream.use { it.write("{}".toByteArray()) }
        }
        val code = conn.responseCode
        if (code !in 200..299) {
            val body = (conn.errorStream ?: conn.inputStream)?.bufferedReader()?.use { it.readText() }.orEmpty()
            android.util.Log.w("TelePakt", "komunikat ${message.id} HTTP $code: $body")
            conn.disconnect()
            throw Exception(
                try {
                    org.json.JSONObject(body).optString("error", "Błąd serwera (HTTP $code)")
                } catch (e: Exception) {
                    "Błąd serwera (HTTP $code)"
                }
            )
        }
        val ext = if ((conn.contentType ?: "").contains("wav")) "wav" else "mp3"
        val file = java.io.File(cacheDir, "komunikat_${message.id}.$ext")
        conn.inputStream.use { input -> file.outputStream().use { output -> input.copyTo(output) } }
        conn.disconnect()
        return file
    }

    private var player: android.media.MediaPlayer? = null
    private var speakerTouched = false
    private var speakerWasOn = false

    @Suppress("DEPRECATION")
    private fun setSpeaker(on: Boolean) {
        val audio = getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
        audio.isSpeakerphoneOn = on
    }

    /**
     * Odtwarza plik na głośniku (włącza tryb głośnomówiący na czas odtwarzania i potem go przywraca).
     * Uwaga: to dźwięk akustyczny - rozmówca słyszy go o tyle, o ile mikrofon telefonu go wychwyci;
     * jakość zależy od modelu telefonu i jego tłumienia echa.
     */
    private fun playOnSpeaker(file: java.io.File, onEnd: (Boolean) -> Unit) {
        stopPlayback()
        val audio = getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
        @Suppress("DEPRECATION")
        speakerWasOn = audio.isSpeakerphoneOn
        speakerTouched = true
        setSpeaker(true)
        val finish: (Boolean) -> Unit = { ok ->
            stopPlayback()
            file.delete()
            onEnd(ok)
        }
        try {
            val p = android.media.MediaPlayer()
            p.setAudioAttributes(
                android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            p.setDataSource(file.absolutePath)
            p.setOnCompletionListener { finish(true) }
            p.setOnErrorListener { _, what, extra ->
                android.util.Log.e("TelePakt", "MediaPlayer error what=$what extra=$extra")
                Toast.makeText(this, "Nie udało się odtworzyć komunikatu (kod $what)", Toast.LENGTH_LONG).show()
                finish(false)
                true
            }
            p.prepare()
            player = p
            p.start()
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "playOnSpeaker failed", e)
            Toast.makeText(this, "Nie udało się odtworzyć komunikatu: ${e.message}", Toast.LENGTH_LONG).show()
            finish(false)
        }
    }

    private var phoneTts: android.speech.tts.TextToSpeech? = null

    /**
     * Zapasowy głos: Android TextToSpeech (polski) czyta tekst na głośniku. Brzmi inaczej niż głos AI z ustawień,
     * ale działa bez serwera i bez Telnyx. Jeśli telefon nie ma polskiego głosu, mówi o tym wprost.
     */
    private fun speakWithPhoneVoice(text: String, onEnd: (Boolean) -> Unit) {
        stopPlayback()
        val audio = getSystemService(Context.AUDIO_SERVICE) as android.media.AudioManager
        @Suppress("DEPRECATION")
        speakerWasOn = audio.isSpeakerphoneOn
        speakerTouched = true
        setSpeaker(true)
        val main = android.os.Handler(android.os.Looper.getMainLooper())
        val finish: (Boolean) -> Unit = { ok -> main.post { stopPlayback(); onEnd(ok) } }
        val fail: (String) -> Unit = { message ->
            android.util.Log.e("TelePakt", "phone TTS: $message")
            main.post { Toast.makeText(this, message, Toast.LENGTH_LONG).show() }
            finish(false)
        }
        phoneTts = android.speech.tts.TextToSpeech(this) { status ->
            val engine = phoneTts
            if (status != android.speech.tts.TextToSpeech.SUCCESS || engine == null) {
                fail("Telefon nie ma głosu do czytania tekstu (Ustawienia > Zamiana tekstu na mowę).")
                return@TextToSpeech
            }
            val lang = engine.setLanguage(java.util.Locale("pl", "PL"))
            if (lang == android.speech.tts.TextToSpeech.LANG_MISSING_DATA ||
                lang == android.speech.tts.TextToSpeech.LANG_NOT_SUPPORTED
            ) {
                fail("Telefon nie ma polskiego głosu. Zainstaluj go w Ustawienia > Zamiana tekstu na mowę.")
                return@TextToSpeech
            }
            engine.setAudioAttributes(
                android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            engine.setOnUtteranceProgressListener(object : android.speech.tts.UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {}
                override fun onDone(utteranceId: String?) { finish(true) }
                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) { fail("Nie udało się przeczytać komunikatu głosem telefonu.") }
            })
            engine.speak(text, android.speech.tts.TextToSpeech.QUEUE_FLUSH, null, "telepakt-answer")
        }
    }

    private fun stopPlayback() {
        phoneTts?.let {
            try { it.stop(); it.shutdown() } catch (e: Exception) { /* już wyłączony */ }
        }
        phoneTts = null
        player?.let {
            try { it.stop() } catch (e: Exception) { /* już zatrzymany */ }
            it.release()
        }
        player = null
        if (speakerTouched) {
            setSpeaker(speakerWasOn)
            speakerTouched = false
        }
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
        try {
            stopPlayback()
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "stopPlayback failed", e)
        }
        unregisterPhoneListener()
    }
}
