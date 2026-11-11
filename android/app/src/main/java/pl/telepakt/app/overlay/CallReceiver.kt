package pl.telepakt.app.overlay

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.telephony.TelephonyManager

/**
 * Odbiera zmiany stanu telefonu i pokazuje nakładkę TelePakt dopiero PO ODEBRANIU rozmowy przychodzącej.
 *
 * Gdy telefon dzwoni, nakładki nie ma - nie zasłania przycisków odbierania/odrzucania. Po odebraniu
 * użytkownik może połączyć rozmowę 3-way z numerem TelePakt i odtwarzać komunikaty. Rozmowy wychodzące
 * (bez wcześniejszego dzwonienia) nie pokazują nakładki.
 */
class CallReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return
        val prefs = context.getSharedPreferences("telepakt", Context.MODE_PRIVATE)

        when (intent.getStringExtra(TelephonyManager.EXTRA_STATE)) {
            TelephonyManager.EXTRA_STATE_RINGING ->
                // Zapamiętujemy w pamięci trwałej: proces może zostać zabity między zdarzeniami.
                prefs.edit().putBoolean("incoming_seen", true).apply()

            TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                if (prefs.getBoolean("incoming_seen", false) && Settings.canDrawOverlays(context)) {
                    val serviceIntent = Intent(context, CallOverlayService::class.java)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent)
                    } else {
                        context.startService(serviceIntent)
                    }
                }
            }

            TelephonyManager.EXTRA_STATE_IDLE -> {
                prefs.edit().putBoolean("incoming_seen", false).apply()
                // Koniec rozmowy: zamknij nakładkę (drugi, niezależny od usługi sposób).
                context.stopService(Intent(context, CallOverlayService::class.java))
            }
        }
    }
}
