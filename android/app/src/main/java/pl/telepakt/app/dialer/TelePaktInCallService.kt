package pl.telepakt.app.dialer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.InCallService
import android.telecom.VideoProfile
import android.util.Log

/**
 * Usługa, przez którą system przekazuje TelePakt rozmowy, gdy TelePakt jest domyślną aplikacją Telefon.
 * Dzwonek odtwarza system; my pokazujemy ekran rozmowy ([InCallActivity]) i powiadomienie.
 */
class TelePaktInCallService : InCallService() {

    private val listener: () -> Unit = { updateNotification() }

    override fun onCreate() {
        super.onCreate()
        CallManager.service = this
        CallManager.attach(this)
        CallManager.addListener(listener)
    }

    override fun onDestroy() {
        CallManager.removeListener(listener)
        if (CallManager.service === this) CallManager.service = null
        super.onDestroy()
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        CallManager.onCallAdded(call)
        if (call.state == Call.STATE_RINGING) {
            // Cisza nocna: numery spoza kontaktów dzwonią bezgłośnie (nic nie jest odrzucane ani blokowane).
            val number = CallManager.numberOf(call)
            if (Policy.quietNow(this) && !Dialing.inContacts(this, number)) {
                try {
                    (getSystemService(Context.TELECOM_SERVICE) as android.telecom.TelecomManager).silenceRinger()
                } catch (e: Exception) {
                    Log.w("TelePakt", "wyciszenie dzwonka nie powiodło się", e)
                }
            }
            // Ekran pełnoekranowy pokaże powiadomienie (działa też na zablokowanym telefonie).
            updateNotification()
        } else {
            openCallScreen()
        }
    }

    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        CallManager.onCallRemoved(call)
        updateNotification()
        notifyIfMissed(call)
    }

    override fun onCallAudioStateChanged(audioState: CallAudioState?) {
        super.onCallAudioStateChanged(audioState)
        CallManager.refresh()
    }

    fun openCallScreen() {
        try {
            startActivity(Intent(this, InCallActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (e: Exception) {
            Log.e("TelePakt", "nie można otworzyć ekranu rozmowy", e)
        }
    }

    private fun updateNotification() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val top = CallManager.topLevelCalls()
        if (top.isEmpty()) {
            nm.cancel(NOTIFICATION_ID)
            return
        }
        ensureChannel(nm)
        val ringing = top.firstOrNull { it.state == Call.STATE_RINGING }
        val shown = ringing ?: top.first()
        val who = CallManager.displayName(this, shown)

        val open = PendingIntent.getActivity(
            this, 0, Intent(this, InCallActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        @Suppress("DEPRECATION")
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(this, CHANNEL_ID) else Notification.Builder(this)
        builder.setSmallIcon(android.R.drawable.sym_action_call)
            .setContentTitle(if (ringing != null) "Połączenie przychodzące" else "Rozmowa")
            .setContentText(who)
            .setContentIntent(open)
            .setCategory(Notification.CATEGORY_CALL)
            .setOngoing(true)
        if (ringing != null) {
            builder.setFullScreenIntent(open, true)
                .addAction(Notification.Action.Builder(null, "Odbierz", action(ACTION_ANSWER)).build())
                .addAction(Notification.Action.Builder(null, "Odrzuć", action(ACTION_DECLINE)).build())
        }
        nm.notify(NOTIFICATION_ID, builder.build())
    }

    /** Połączenie przychodzące, którego nikt nie odebrał (ani nie odrzucił): powiadomienie z przyciskiem „Oddzwoń”. */
    private fun notifyIfMissed(call: Call) {
        val cause = call.details.disconnectCause ?: return
        if (cause.code != android.telecom.DisconnectCause.MISSED) return
        val number = CallManager.numberOf(call)
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm.getNotificationChannel(MISSED_CHANNEL) == null) {
            nm.createNotificationChannel(NotificationChannel(MISSED_CHANNEL, "Nieodebrane połączenia", NotificationManager.IMPORTANCE_DEFAULT))
        }
        val callBack = PendingIntent.getActivity(
            this, number.hashCode(),
            Intent(this, DialerActivity::class.java).setAction(Intent.ACTION_DIAL)
                .setData(android.net.Uri.fromParts("tel", number, null)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        @Suppress("DEPRECATION")
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(this, MISSED_CHANNEL) else Notification.Builder(this)
        builder.setSmallIcon(android.R.drawable.sym_call_missed)
            .setContentTitle("Nieodebrane połączenie")
            .setContentText(CallManager.displayName(this, call))
            .setContentIntent(callBack)
            .setCategory(Notification.CATEGORY_MISSED_CALL)
            .setAutoCancel(true)
            .addAction(Notification.Action.Builder(null, "Oddzwoń", callBack).build())
        nm.notify(number.hashCode(), builder.build())
    }

    private fun action(name: String): PendingIntent =
        PendingIntent.getBroadcast(
            this, name.hashCode(), Intent(this, CallActionReceiver::class.java).setAction(name),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    private fun ensureChannel(nm: NotificationManager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        // Bez dźwięku: dzwonek gra system; kanał ma wysoki priorytet, żeby ekran połączenia pojawił się od razu.
        val channel = NotificationChannel(CHANNEL_ID, "Rozmowy TelePakt", NotificationManager.IMPORTANCE_HIGH).apply {
            setSound(null, null)
            enableVibration(false)
        }
        nm.createNotificationChannel(channel)
    }

    companion object {
        private const val CHANNEL_ID = "telepakt_calls"
        private const val NOTIFICATION_ID = 4242
        private const val MISSED_CHANNEL = "telepakt_missed"
        const val ACTION_ANSWER = "pl.telepakt.app.ANSWER"
        const val ACTION_DECLINE = "pl.telepakt.app.DECLINE"
    }
}

/** Przyciski „Odbierz”/„Odrzuć” z powiadomienia o połączeniu przychodzącym. */
class CallActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val ringing = CallManager.calls.firstOrNull { it.state == Call.STATE_RINGING } ?: return
        when (intent.action) {
            TelePaktInCallService.ACTION_ANSWER -> {
                ringing.answer(VideoProfile.STATE_AUDIO_ONLY)
                context.startActivity(Intent(context, InCallActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            }
            TelePaktInCallService.ACTION_DECLINE -> ringing.reject(false, null)
        }
    }
}
