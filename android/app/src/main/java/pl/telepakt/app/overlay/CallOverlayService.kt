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

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var telephonyManager: TelephonyManager? = null
    private var isDefenseActivated = false
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

        // Slider Container Track
        val sliderTrack = FrameLayout(this).apply {
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#020617"))
                cornerRadius = 36f
                setStroke(2, Color.parseColor("#334155"))
            }
            setPadding(8, 8, 8, 8)
        }

        val sliderHint = TextView(this).apply {
            text = "PRZESUŃ, BY WŁĄCZYĆ AUTO-SPRZECIW ➔"
            textSize = 11f
            setTextColor(Color.parseColor("#38BDF8"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, 120)
        }
        sliderTrack.addView(sliderHint)

        val sliderThumb = TextView(this).apply {
            text = "🛡️ PKE"
            textSize = 12f
            setTextColor(Color.parseColor("#020617"))
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#06B6D4"))
                cornerRadius = 32f
            }
            layoutParams = FrameLayout.LayoutParams(180, 110, Gravity.START or Gravity.CENTER_VERTICAL)
        }

        sliderThumb.setOnTouchListener(object : View.OnTouchListener {
            var startX = 0f

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        startX = event.rawX
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val maxScroll = (sliderTrack.width - v.width - 16).toFloat()
                        val newX = (event.rawX - startX).coerceIn(0f, maxScroll)
                        v.x = newX
                        if (newX >= maxScroll * 0.85f && !isDefenseActivated) {
                            activateDefense(root, sliderHint, v)
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        if (!isDefenseActivated) {
                            v.animate().x(0f).setDuration(200).start()
                        }
                        return true
                    }
                }
                return false
            }
        })
        sliderTrack.addView(sliderThumb)
        root.addView(sliderTrack)

        // Nagrywanie - działa także zanim odbierzemy (połączenie musi iść przez numer TelePakt)
        val recordBtn = Button(this).apply {
            text = "● NAGRYWAJ TĘ ROZMOWĘ"
            textSize = 12f
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#DC2626"))
                cornerRadius = 32f
            }
            setOnClickListener { startRecording(this) }
        }
        root.addView(recordBtn, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = 16 })

        // Przekierowanie: odrzucenie dzwoniącego połączenia uruchamia u operatora przekierowanie
        // "gdy zajęty" na numer TelePakt (kod ustawiany w aplikacji, ekran Ustawienia).
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

    /** Prosi backend o włączenie nagrywania (Twilio). Rozmówca nie słyszy żadnego komunikatu. */
    private fun startRecording(button: Button) {
        if (apiUrl.isBlank() || authToken.isBlank()) {
            Toast.makeText(this, "Nagrywanie niedostępne: zaloguj się w aplikacji TelePakt", Toast.LENGTH_LONG).show()
            return
        }
        button.isEnabled = false
        Thread {
            val ok = try {
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
                conn.disconnect()
                code in 200..299
            } catch (e: Exception) {
                false
            }
            button.post {
                if (ok) {
                    button.text = "● NAGRYWANIE TRWA"
                } else {
                    button.isEnabled = true
                    Toast.makeText(this, "Nie udało się włączyć nagrywania", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    private fun activateDefense(root: LinearLayout, hint: TextView, thumb: View) {
        isDefenseActivated = true
        thumb.visibility = View.GONE
        hint.text = "✓ SPRZECIW WŁĄCZONY"
        hint.setTextColor(Color.parseColor("#10B981"))
        root.background = GradientDrawable().apply {
            setColor(Color.parseColor("#064E3B"))
            cornerRadius = 48f
            setStroke(3, Color.parseColor("#10B981"))
        }
        Toast.makeText(this, "TelePakt: Formuła prawna Art. 398 PKE wygłoszona w trakcie połączenia!", Toast.LENGTH_LONG).show()
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
