package pl.telepakt.app.dialer

import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.telecom.Call
import android.telecom.InCallService
import android.telecom.TelecomManager
import android.util.Log
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Stan rozmów widziany przez TelePakt jako domyślną aplikację Telefon oraz sekwencja „jeden przycisk”:
 * stuknięcie komunikatu -> wybranie numeru TelePakt (rozmowa pierwsza idzie na wstrzymanie) -> scalenie rozmów ->
 * serwer odtwarza komunikat do konferencji.
 *
 * Wszystkie zmiany stanu dzieją się na głównym wątku; sieć na osobnych wątkach z powrotem przez [main].
 */
object CallManager {
    private const val TAG = "TelePakt"
    private const val MERGE_RETRY_MS = 4000L
    private const val MERGE_MAX_TRIES = 4
    private const val DIAL_TIMEOUT_MS = 45000L
    private const val SPEAK_RETRY_MS = 1800L
    private const val SPEAK_MAX_TRIES = 4

    private val main = Handler(Looper.getMainLooper())

    val calls = CopyOnWriteArrayList<Call>()
    @Volatile var service: InCallService? = null
    private val listeners = CopyOnWriteArrayList<() -> Unit>()

    /** Tekst postępu sekwencji 3-way dla ekranu rozmowy (null = nic się nie dzieje). */
    @Volatile var status: String? = null
        private set
    @Volatile var statusIsError = false
        private set

    private var pending: VoiceMsg? = null
    private var appContext: Context? = null
    private var telepaktNumber: String? = null
    private var dialing = false
    private var active = false
    private var mergeTries = 0
    private var lastMergeAt = 0L
    private var speaking = false
    private var speakTries = 0
    private var dialStartedAt = 0L

    fun addListener(l: () -> Unit) { listeners.add(l) }
    fun removeListener(l: () -> Unit) { listeners.remove(l) }
    private fun notifyChanged() { main.post { listeners.forEach { it() } } }

    private fun setStatus(text: String?, error: Boolean = false) {
        status = text
        statusIsError = error
        notifyChanged()
    }

    private val callback = object : Call.Callback() {
        override fun onStateChanged(call: Call, state: Int) {
            // Rozmowa odebrana poza naszym ekranem (słuchawka Bluetooth, przycisk w powiadomieniu): pokaż ekran rozmowy.
            if (state == Call.STATE_ACTIVE) service?.let { (it as? TelePaktInCallService)?.openCallScreen() }
            onCallsChanged()
        }
        override fun onDetailsChanged(call: Call, details: Call.Details) { onCallsChanged() }
        override fun onParentChanged(call: Call, parent: Call?) { onCallsChanged() }
        override fun onChildrenChanged(call: Call, children: MutableList<Call>) { onCallsChanged() }
        override fun onConferenceableCallsChanged(call: Call, conferenceableCalls: MutableList<Call>) { onCallsChanged() }
    }

    /** Zgłoszenia numeru przez innych użytkowników (>0 = ostrzegamy). Brak wpisu = nie wiemy; nigdy nie piszemy „bezpieczny”. */
    private val reputation = java.util.concurrent.ConcurrentHashMap<String, Int>()
    private val reputationAsked = java.util.concurrent.ConcurrentHashMap.newKeySet<String>()

    fun reputationFor(call: Call): Int = reputation[digits(numberOf(call))] ?: 0

    private fun fetchReputation(ctx: Context, call: Call) {
        val number = numberOf(call)
        val key = digits(number)
        if (key.length < 7 || !TelePaktApi.isConfigured(ctx) || !reputationAsked.add(key)) return
        Thread {
            try {
                val reports = TelePaktApi.reputation(ctx.applicationContext, number)
                if (reports > 0) { reputation[key] = reports; notifyChanged() }
            } catch (e: Exception) {
                reputationAsked.remove(key)  // spróbujemy przy następnym połączeniu
                Log.w(TAG, "reputacja numeru: ${e.message}")
            }
        }.start()
    }

    /** Zgłasza numer i blokuje go na systemowej liście; zwraca opis wyniku dla użytkownika. */
    fun blockAndReport(ctx: Context, number: String, onDone: (String) -> Unit) {
        val blocked = Blocklist.block(ctx, number)
        Thread {
            var reportMsg = ""
            try {
                TelePaktApi.reportNumber(ctx.applicationContext, number)
            } catch (e: Exception) {
                reportMsg = " Zgłoszenia nie wysłano: ${e.message}"
            }
            val text = (if (blocked) "Numer zablokowany." else "Nie udało się zablokować numeru (to wymaga bycia domyślną aplikacją Telefon).") +
                (if (reportMsg.isEmpty()) " Zgłoszono jako niechciany." else reportMsg)
            main.post { onDone(text) }
        }.start()
    }

    fun onCallAdded(call: Call) {
        appContext?.let { if (call.state == Call.STATE_RINGING) fetchReputation(it, call) }
        calls.add(call)
        call.registerCallback(callback)
        onCallsChanged()
    }

    fun onCallRemoved(call: Call) {
        call.unregisterCallback(callback)
        calls.remove(call)
        if (calls.isEmpty()) reset()
        onCallsChanged()
    }

    private fun reset() {
        pending = null; active = false
        dialing = false
        active = false
        mergeTries = 0
        speaking = false
        speakTries = 0
        main.removeCallbacksAndMessages(null)
        status = null
        statusIsError = false
    }

    /** Rozmowy, które pokazujemy na liście: bez dzieci konferencji (te są w ramach rozmowy konferencyjnej). */
    fun topLevelCalls(): List<Call> = calls.filter { it.parent == null }

    fun isConference(call: Call) = call.details.hasProperty(Call.Details.PROPERTY_CONFERENCE)

    private fun digits(s: String?) = (s ?: "").filter { it.isDigit() }

    fun numberOf(call: Call): String = call.details.handle?.schemeSpecificPart ?: ""

    fun isTelePakt(call: Call) = isTelePaktLeg(call)

    private fun isTelePaktLeg(call: Call): Boolean {
        val tp = digits(telepaktNumber)
        if (tp.length < 7) return false
        val n = digits(numberOf(call))
        return n.length >= 7 && n.takeLast(9) == tp.takeLast(9)
    }

    /** Rozmowa z TelePakt jest scalona z naszą rozmową (jest dzieckiem konferencji albo konferencja ją zawiera). */
    private fun isBridged(): Boolean {
        val leg = calls.firstOrNull { isTelePaktLeg(it) } ?: return false
        if (leg.state != Call.STATE_ACTIVE) return false
        if (leg.parent != null) return true
        return calls.any { isConference(it) && it.children.contains(leg) }
    }

    // ---------------------------------------------------------------- sekwencja 3-way

    /**
     * Rozpoczyna sekwencję dla komunikatu [msg] (null = tylko połącz i scal, np. żeby nagrywać całą rozmowę).
     * Można wołać wielokrotnie: jeśli rozmowa jest już scalona, komunikat leci od razu.
     */
    fun startThreeWay(ctx: Context, msg: VoiceMsg?) {
        appContext = ctx.applicationContext
        if (speaking) { setStatus("Poczekaj, trwa odtwarzanie poprzedniego komunikatu.", true); return }
        if (msg != null) pending = msg
        active = true
        if (!TelePaktApi.isConfigured(ctx)) {
            setStatus("Zaloguj się w aplikacji TelePakt, aby używać komunikatów.", true)
            return
        }
        if (!Policy.telephonyEnabled(ctx)) {
            pending = null; active = false
            setStatus("Brak środków na koncie TelePakt - funkcje TelePakt są wyłączone.", true)
            return
        }
        if (telepaktNumber != null) {
            advance()
            return
        }
        setStatus("Pobieram numer TelePakt…")
        Thread {
            try {
                val number = TelePaktApi.forwardingNumber(ctx.applicationContext)
                main.post { telepaktNumber = number; advance() }
            } catch (e: ApiException) {
                main.post { pending = null; active = false; setStatus(e.message ?: "Nie udało się pobrać numeru TelePakt", true) }
            } catch (e: Exception) {
                Log.e(TAG, "forwarding-info failed", e)
                main.post { pending = null; active = false; setStatus("Nie udało się pobrać numeru TelePakt", true) }
            }
        }.start()
    }

    private fun onCallsChanged() {
        if (active) advance()
        notifyChanged()
    }

    /** Jeden krok maszyny stanów: patrzy na rozmowy i robi to, co jest następne. */
    private fun advance() {
        val ctx = appContext ?: return
        if (telepaktNumber == null) return
        val leg = calls.firstOrNull { isTelePaktLeg(it) }

        if (leg == null) {
            if (!dialing) dial(ctx)
            return
        }
        when (leg.state) {
            Call.STATE_DIALING, Call.STATE_CONNECTING, Call.STATE_NEW -> setStatus("Łączę z TelePakt…")
            Call.STATE_RINGING -> setStatus("Łączę z TelePakt…")
            Call.STATE_ACTIVE -> {
                dialing = false
                if (isBridged()) {
                    val msg = pending
                    if (msg != null) speak(ctx, msg) else { active = false; setStatus("Rozmowa jest połączona z TelePakt (nagrywanie).") }
                } else {
                    tryMerge(leg)
                }
            }
            Call.STATE_DISCONNECTED, Call.STATE_DISCONNECTING -> {
                if (dialing || pending != null) {
                    dialing = false
                    pending = null; active = false
                    // Nie zostawiamy użytkownika z wstrzymaną rozmową: wznawiamy tę, którą sami odłożyliśmy na czas dzwonienia.
                    calls.filter { it.state == Call.STATE_HOLDING && !isTelePaktLeg(it) }.forEach {
                        try { it.unhold() } catch (e: Exception) { Log.w(TAG, "wznowienie rozmowy nie powiodło się", e) }
                    }
                    val why = describeDisconnect(leg)
                    Log.w(TAG, "rozmowa z TelePakt zakończona: $why")
                    setStatus("TelePakt nie odebrał lub rozłączył rozmowę. Powód z telefonu: $why", true)
                }
            }
            else -> {}
        }
    }

    /** Powód zakończenia rozmowy podany przez system (kod + opis operatora), do pokazania wprost użytkownikowi. */
    private fun describeDisconnect(call: Call): String {
        val cause = call.details.disconnectCause ?: return "brak informacji"
        val kind = when (cause.code) {
            android.telecom.DisconnectCause.LOCAL -> "zakończona przez telefon"
            android.telecom.DisconnectCause.REMOTE -> "rozłączona przez TelePakt/sieć"
            android.telecom.DisconnectCause.REJECTED -> "odrzucona"
            android.telecom.DisconnectCause.BUSY -> "zajęte"
            android.telecom.DisconnectCause.MISSED -> "bez odpowiedzi"
            android.telecom.DisconnectCause.CANCELED -> "anulowana"
            android.telecom.DisconnectCause.RESTRICTED -> "zablokowana przez operatora (ograniczenie połączeń)"
            android.telecom.DisconnectCause.ERROR -> "błąd sieci/operatora"
            else -> "kod ${cause.code}"
        }
        val extra = listOfNotNull(cause.label?.toString()?.takeIf { it.isNotBlank() },
            cause.description?.toString()?.takeIf { it.isNotBlank() }, cause.reason?.takeIf { it.isNotBlank() })
        return if (extra.isEmpty()) kind else "$kind (${extra.joinToString("; ")})"
    }

    private fun dial(ctx: Context) {
        val number = telepaktNumber ?: return
        try {
            val telecom = ctx.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
            dialing = true
            dialStartedAt = System.currentTimeMillis()
            mergeTries = 0
            setStatus("Łączę z TelePakt…")
            // Ta sama karta SIM co rozmowa, do której dołączamy (przy dual SIM inaczej scalenie się nie uda).
            val extras = Bundle()
            calls.firstOrNull { !isTelePaktLeg(it) }?.details?.accountHandle?.let {
                extras.putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, it)
            }
            telecom.placeCall(Uri.fromParts("tel", number, null), extras)
            main.postDelayed({
                val leg = calls.firstOrNull { isTelePaktLeg(it) }
                if (dialing && (leg == null || leg.state != Call.STATE_ACTIVE)) {
                    dialing = false
                    pending = null; active = false
                    setStatus("TelePakt nie odebrał w ciągu ${DIAL_TIMEOUT_MS / 1000} s. Spróbuj ponownie.", true)
                }
            }, DIAL_TIMEOUT_MS)
        } catch (e: SecurityException) {
            dialing = false
            pending = null; active = false
            Log.e(TAG, "placeCall: brak uprawnienia", e)
            setStatus("Brak uprawnienia do wykonywania połączeń. Włącz je w ustawieniach TelePakt.", true)
        } catch (e: Exception) {
            dialing = false
            pending = null; active = false
            Log.e(TAG, "placeCall failed", e)
            setStatus("Nie udało się połączyć z TelePakt: ${e.message}", true)
        }
    }

    /** Scalanie jak w AOSP Dialer: najpierw conference() z rozmową do scalenia, w ostateczności mergeConference(). */
    private fun tryMerge(leg: Call) {
        val now = System.currentTimeMillis()
        if (now - lastMergeAt < MERGE_RETRY_MS && mergeTries > 0) {
            setStatus("TelePakt odebrał - scalam rozmowy…")
            return
        }
        if (mergeTries >= MERGE_MAX_TRIES) {
            pending = null; active = false
            setStatus("Nie udało się scalić rozmów. Operator mógł zablokować rozmowy konferencyjne - stuknij „Scal” ręcznie, jeśli przycisk jest widoczny.", true)
            return
        }
        mergeTries++
        lastMergeAt = now
        setStatus("TelePakt odebrał - scalam rozmowy…")
        try {
            val other = leg.conferenceableCalls.firstOrNull() ?: calls.firstOrNull { it !== leg && it.parent == null && !isTelePaktLeg(it) }
            when {
                leg.conferenceableCalls.isNotEmpty() -> leg.conference(leg.conferenceableCalls[0])
                leg.details.can(Call.Details.CAPABILITY_MERGE_CONFERENCE) -> leg.mergeConference()
                other != null && other.details.can(Call.Details.CAPABILITY_MERGE_CONFERENCE) -> other.mergeConference()
                else -> Log.i(TAG, "scalanie: operator jeszcze nie pozwala (brak możliwości MERGE), próba $mergeTries")
            }
        } catch (e: Exception) {
            Log.e(TAG, "merge failed", e)
        }
        // Powtórka po MERGE_RETRY_MS, nawet jeśli żadne zdarzenie rozmowy nie nadejdzie.
        main.postDelayed({ if (active) advance() }, MERGE_RETRY_MS)
    }

    private fun speak(ctx: Context, msg: VoiceMsg) {
        if (speaking) return
        speaking = true
        speakTries = 0
        speakNow(ctx, msg)
    }

    private fun speakNow(ctx: Context, msg: VoiceMsg) {
        speakTries++
        setStatus("Odtwarzam: ${msg.title}…")
        Thread {
            var error: String? = null
            var retry = false
            try {
                val (code, reason) = TelePaktApi.speak(ctx, msg.id)
                if (reason != null) {
                    error = reason
                    // 409: serwer jeszcze nie widzi konferencji (dostawca potrzebuje chwili po scaleniu).
                    retry = code == 409
                }
            } catch (e: ApiException) {
                error = e.message
            } catch (e: Exception) {
                Log.e(TAG, "speak failed", e)
                error = "Nie udało się odtworzyć komunikatu"
            }
            main.post {
                if (error == null) {
                    speaking = false
                    pending = null; active = false
                    setStatus("✓ ${msg.title}")
                    main.postDelayed({ if (!speaking && pending == null) setStatus(null) }, 4000)
                } else if (retry && speakTries < SPEAK_MAX_TRIES) {
                    main.postDelayed({ speakNow(ctx, msg) }, SPEAK_RETRY_MS)
                } else {
                    speaking = false
                    pending = null; active = false
                    setStatus(error, true)
                }
            }
        }.start()
    }

    fun clearStatus() { setStatus(null) }

    fun refresh() = notifyChanged()

    fun attach(ctx: Context) { appContext = ctx.applicationContext }

    private val nameCache = java.util.concurrent.ConcurrentHashMap<String, String>()

    /** Nazwa z kontaktów (jeśli jest uprawnienie READ_CONTACTS), inaczej numer; „Numer ukryty” gdy brak. */
    fun displayName(ctx: Context, call: Call): String {
        if (isConference(call)) return "Rozmowa konferencyjna"
        val number = numberOf(call)
        if (number.isBlank()) return "Numer ukryty"
        if (isTelePaktLeg(call)) return "TelePakt"
        nameCache[number]?.let { return it.ifEmpty { number } }
        var name = ""
        if (ctx.checkSelfPermission(android.Manifest.permission.READ_CONTACTS) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            try {
                val uri = android.net.Uri.withAppendedPath(
                    android.provider.ContactsContract.PhoneLookup.CONTENT_FILTER_URI, android.net.Uri.encode(number)
                )
                ctx.contentResolver.query(uri, arrayOf(android.provider.ContactsContract.PhoneLookup.DISPLAY_NAME), null, null, null)?.use {
                    if (it.moveToFirst()) name = it.getString(0) ?: ""
                }
            } catch (e: Exception) {
                Log.w(TAG, "wyszukiwanie kontaktu nie powiodło się", e)
            }
        }
        nameCache[number] = name
        return name.ifEmpty { number }
    }
}
