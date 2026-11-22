package pl.telepakt.app.dialer

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.ContactsContract
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.util.Log
import android.widget.Toast

/** Ustawienia telefonu przechowywane lokalnie (SharedPreferences "telepakt"): cisza nocna, stan środków. */
object Policy {
    private fun prefs(ctx: Context) = ctx.getSharedPreferences("telepakt", Context.MODE_PRIVATE)

    // ---- cisza nocna: w wybranych godzinach dzwonek połączeń od numerów spoza kontaktów jest wyciszany (nie blokujemy!)
    fun quietEnabled(ctx: Context) = prefs(ctx).getBoolean("quiet_enabled", false)
    fun quietStart(ctx: Context) = prefs(ctx).getInt("quiet_start", 22)
    fun quietEnd(ctx: Context) = prefs(ctx).getInt("quiet_end", 7)
    fun setQuiet(ctx: Context, enabled: Boolean, start: Int, end: Int) {
        prefs(ctx).edit().putBoolean("quiet_enabled", enabled).putInt("quiet_start", start).putInt("quiet_end", end).apply()
    }

    fun quietNow(ctx: Context, hour: Int = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)): Boolean {
        if (!quietEnabled(ctx)) return false
        val s = quietStart(ctx)
        val e = quietEnd(ctx)
        return if (s == e) false else if (s < e) hour in s until e else hour >= s || hour < e
    }

    // ---- środki na koncie TelePakt: gdy serwer powie, że ich brak, aplikacja działa jak zwykły telefon
    fun telephonyEnabled(ctx: Context) = prefs(ctx).getBoolean("telephony_enabled", true)
    fun setTelephonyEnabled(ctx: Context, enabled: Boolean) = prefs(ctx).edit().putBoolean("telephony_enabled", enabled).apply()

    /** Gotowe odpowiedzi „Odrzuć z wiadomością” (otwierają SMS z gotową treścią - bez uprawnienia do SMS). */
    val QUICK_REPLIES = listOf(
        "Nie mogę teraz rozmawiać. Oddzwonię później.",
        "Jestem zajęty. Napisz, w czym mogę pomóc.",
        "Nie wyrażam zgody na kontakt marketingowy."
    )
}

/** Wybieranie numeru z ostrzeżeniami (zagraniczne / o podwyższonej opłacie) i wyborem karty SIM przy dual SIM. */
object Dialing {
    private const val TAG = "TelePakt"
    private val EMERGENCY = setOf("112", "997", "998", "999")

    /** Numer w postaci +prefiks... lub krajowej; bez spacji i myślników. */
    fun clean(raw: String): String {
        val t = raw.trim().filter { it.isDigit() || it == '+' || it == '*' || it == '#' }
        return if (t.startsWith("00")) "+" + t.substring(2) else t
    }

    fun isForeign(raw: String): Boolean {
        val n = clean(raw)
        return n.startsWith("+") && !n.startsWith("+48")
    }

    /** Numery o podwyższonej opłacie w Polsce: 70x (np. 700, 701...). Zwraca true tylko dla krajowych 9-cyfrowych. */
    fun isPremiumPl(raw: String): Boolean {
        var n = clean(raw)
        if (n.startsWith("+48")) n = n.substring(3) else if (n.startsWith("0048")) n = n.substring(4)
        return n.length == 9 && n.startsWith("70")
    }

    fun inContacts(ctx: Context, number: String): Boolean {
        if (ctx.checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) return false
        return try {
            val uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(number))
            ctx.contentResolver.query(uri, arrayOf(ContactsContract.PhoneLookup._ID), null, null, null)?.use { it.moveToFirst() } == true
        } catch (e: Exception) {
            Log.w(TAG, "wyszukiwanie w kontaktach nie powiodło się", e)
            false
        }
    }

    /** Ostrzeżenie przed oddzwonieniem (oszustwo „na jeden dzwonek”, drogie numery) albo null. */
    fun warningFor(ctx: Context, raw: String): String? {
        val n = clean(raw)
        if (n in EMERGENCY || n.isEmpty()) return null
        if (isPremiumPl(n)) {
            return "To numer o podwyższonej opłacie (70x). Rozmowa może być bardzo droga."
        }
        if (isForeign(n) && !inContacts(ctx, n)) {
            return "To numer zagraniczny spoza Twoich kontaktów. Oddzwanianie na nieznane numery zagraniczne bywa kosztowne " +
                "(oszustwo „na jeden dzwonek”). Zadzwoń tylko, jeśli wiesz, kto to."
        }
        return null
    }

    /** Wybiera numer po ewentualnym ostrzeżeniu i wyborze karty SIM. Numery alarmowe idą od razu, bez pytań. */
    fun call(activity: Activity, raw: String, onPlaced: () -> Unit = {}) {
        val number = clean(raw)
        if (number.isEmpty()) return
        if (number in EMERGENCY) { place(activity, number, null, onPlaced); return }
        val warning = warningFor(activity, number)
        if (warning == null) {
            chooseSim(activity, number, onPlaced)
        } else {
            AlertDialog.Builder(activity).setTitle("Uwaga").setMessage(warning)
                .setPositiveButton("Zadzwoń mimo to") { _, _ -> chooseSim(activity, number, onPlaced) }
                .setNegativeButton("Anuluj", null).show()
        }
    }

    private fun chooseSim(activity: Activity, number: String, onPlaced: () -> Unit) {
        val telecom = activity.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
        val accounts: List<PhoneAccountHandle> = try {
            telecom.callCapablePhoneAccounts.orEmpty()
        } catch (e: SecurityException) {
            emptyList()  // bez READ_PHONE_STATE system wybierze kartę sam
        }
        if (accounts.size < 2) { place(activity, number, null, onPlaced); return }
        val labels = accounts.map { h ->
            try { telecom.getPhoneAccount(h)?.label?.toString() ?: h.id } catch (e: SecurityException) { h.id }
        }.toTypedArray()
        AlertDialog.Builder(activity).setTitle("Z której karty SIM zadzwonić?")
            .setItems(labels) { _, which -> place(activity, number, accounts[which], onPlaced) }
            .setNegativeButton("Anuluj", null).show()
    }

    fun place(ctx: Context, number: String, account: PhoneAccountHandle?, onPlaced: () -> Unit = {}) {
        try {
            val telecom = ctx.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
            val extras = Bundle()
            if (account != null) extras.putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, account)
            telecom.placeCall(Uri.fromParts("tel", number, null), extras)
            onPlaced()
        } catch (e: SecurityException) {
            Toast.makeText(ctx, "Brak uprawnienia do wykonywania połączeń. Zezwól na nie w ustawieniach TelePakt.", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            Log.e(TAG, "placeCall failed", e)
            Toast.makeText(ctx, "Nie udało się wybrać numeru: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    fun voicemail(ctx: Context) {
        try {
            val telecom = ctx.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
            telecom.placeCall(Uri.fromParts("voicemail", "", null), Bundle())
        } catch (e: Exception) {
            Log.e(TAG, "voicemail failed", e)
            Toast.makeText(ctx, "Nie udało się połączyć z pocztą głosową: ${e.message}. Numer poczty ustawisz w ustawieniach telefonu operatora.", Toast.LENGTH_LONG).show()
        }
    }
}
