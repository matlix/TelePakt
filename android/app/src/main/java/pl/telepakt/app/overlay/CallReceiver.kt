package pl.telepakt.app.overlay

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.telephony.TelephonyManager

/**
 * BroadcastReceiver odbierający zdarzenia przychodzących połączeń telefonicznych
 * i uruchamiający CallOverlayService na telefonie użytkownika.
 */
class CallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: "+48 (Nieznany)"

            if (state == TelephonyManager.EXTRA_STATE_IDLE) {
                // Koniec rozmowy: zamknij nakładkę (drugi, niezależny od usługi sposób).
                context.stopService(Intent(context, CallOverlayService::class.java))
                return
            }

            if (state == TelephonyManager.EXTRA_STATE_RINGING || state == TelephonyManager.EXTRA_STATE_OFFHOOK) {
                // Sprawdź czy użytkownik nadał uprawnienie SYSTEM_ALERT_WINDOW (wyświetlanie nad innymi)
                if (Settings.canDrawOverlays(context)) {
                    val serviceIntent = Intent(context, CallOverlayService::class.java).apply {
                        putExtra("PHONE_NUMBER", incomingNumber)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent)
                    } else {
                        context.startService(serviceIntent)
                    }
                }
            }
        }
    }
}
