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
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var telephonyManager: TelephonyManager? = null
    private var apiUrl = ""
    private var authToken = ""

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
        return START_NOT_STICKY
    }

    private fun registerPhoneListener() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            telephonyManager?.registerTelephonyCallback(
                mainExecutor,
                object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                    override fun onCallStateChanged(state: Int) {
                        handleCallState(state)
                    }
                }
            )
        } else {
            @Suppress("DEPRECATION")
            telephonyManager?.listen(object : PhoneStateListener() {
                @Deprecated("Deprecated in Java")
                override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                    handleCallState(state)
                }
            }, PhoneStateListener.LISTEN_CALL_STATE)
        }
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

        // Suwaki komunikatów: po jednym na aktywny komunikat użytkownika (maks. 4), ładowane z serwera.
        // Przesunięcie suwaka odtwarza komunikat rozmówcy - w rozmowie nagrywanej przez TelePakt (3-way).
        val messagesBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val messagesInfo = TextView(this).apply {
            text = "Ładowanie komunikatów…"
            textSize = 11f
            setTextColor(Color.parseColor("#94A3B8"))
            gravity = Gravity.CENTER
            setPadding(0, 8, 0, 8)
        }
        messagesBox.addView(messagesInfo)
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
        root.addView(recordBtn, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = 16 })

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

    private data class OverlayMessage(val id: Int, val title: String)

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
                        if (m.optBoolean("is_active", true)) list.add(OverlayMessage(m.getInt("id"), m.getString("title")))
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
                items.forEach { message ->
                    box.addView(
                        buildSliderRow(message),
                        LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
                        ).apply { topMargin = 10 }
                    )
                }
            }
        }.start()
    }

    /** Jeden suwak: przesunięcie do końca odtwarza komunikat; po odtworzeniu suwak wraca na początek. */
    private fun buildSliderRow(message: OverlayMessage): FrameLayout {
        val track = FrameLayout(this).apply {
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#020617"))
                cornerRadius = 36f
                setStroke(2, Color.parseColor("#334155"))
            }
            setPadding(8, 8, 8, 8)
        }
        val idleText = "${message.title}  ➔"
        val hint = TextView(this).apply {
            text = idleText
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
            text = "▶"
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
                            speakMessage(message, hint, v, idleText) { busy = false }
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

    /** Prosi serwer o odtworzenie komunikatu w trwającej rozmowie. Przy błędzie pokazuje jego przyczynę. */
    private fun speakMessage(message: OverlayMessage, hint: TextView, thumb: View, idleText: String, onDone: () -> Unit) {
        hint.text = "Odtwarzam…"
        Thread {
            var ok = false
            var reason = "Nie udało się odtworzyć komunikatu"
            try {
                val conn = java.net.URL("${apiUrl.trimEnd('/')}/api/telephony/messages/${message.id}/speak/")
                    .openConnection() as java.net.HttpURLConnection
                conn.requestMethod = "POST"
                conn.connectTimeout = 8000
                conn.readTimeout = 15000
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("Authorization", "Bearer $authToken")
                conn.outputStream.use { it.write("{}".toByteArray()) }
                val code = conn.responseCode
                if (code in 200..299) {
                    ok = true
                } else {
                    val body = (conn.errorStream ?: conn.inputStream)?.bufferedReader()?.use { it.readText() }.orEmpty()
                    reason = try {
                        org.json.JSONObject(body).optString("error", reason)
                    } catch (e: Exception) {
                        "$reason (HTTP $code)"
                    }
                    android.util.Log.w("TelePakt", "speak HTTP $code: $body")
                }
                conn.disconnect()
            } catch (e: Exception) {
                reason = "Brak połączenia z serwerem"
                android.util.Log.e("TelePakt", "speak failed", e)
            }
            hint.post {
                thumb.animate().x(0f).setDuration(300).start()
                if (ok) {
                    hint.text = "✓ ${message.title}"
                    hint.setTextColor(Color.parseColor("#10B981"))
                    hint.postDelayed({
                        hint.text = idleText
                        hint.setTextColor(Color.parseColor("#38BDF8"))
                        onDone()
                    }, 2500)
                } else {
                    hint.text = idleText
                    Toast.makeText(this, reason, Toast.LENGTH_LONG).show()
                    onDone()
                }
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
        overlayView?.let { windowManager?.removeView(it) }
        overlayView = null
    }
}
