package pl.telepakt.app.overlay

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast

/**
 * Naciska za użytkownika „Scal” (Merge) w aplikacji Telefon, żeby połączenie 3-way z TelePakt nie wymagało ręcznego
 * stuknięcia. Android nie ma dla zwykłych aplikacji interfejsu do scalania rozmów - to jedyna droga bez zostawania
 * domyślną aplikacją Telefon.
 *
 * Ograniczenia celowe (prywatność i bezpieczeństwo):
 *  - usługa działa WYŁĄCZNIE w oknie po stuknięciu przycisku „Połącz z TelePakt (3-way)” ([arm], domyślnie 90 s);
 *    poza tym oknem ignoruje wszystkie zdarzenia i niczego nie czyta,
 *  - patrzy tylko na okno aplikacji Telefon (nie na naszą nakładkę i nie na inne aplikacje),
 *  - szuka jednego przycisku po jego etykiecie i naciska go raz; nic nie zapisuje ani nie wysyła.
 */
class MergeAccessibilityService : AccessibilityService() {

    private var lastAttemptAt = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "usługa scalania połączona")
    }

    override fun onUnbind(intent: android.content.Intent?): Boolean {
        instance = null
        return super.onUnbind(intent)
    }

    override fun onInterrupt() {}

    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
    private val ticker = object : Runnable {
        override fun run() {
            if (!isArmed()) return
            tick()
            handler.postDelayed(this, TICK_MS)
        }
    }

    /** Włącza cykliczne sprawdzanie ekranu (poza zdarzeniami, bo po otwarciu menu żadne nie musi przyjść). */
    private fun startTicking() {
        handler.removeCallbacks(ticker)
        handler.post(ticker)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || !isArmed()) return
        val pkg = event.packageName?.toString() ?: return
        if (pkg == packageName || !isDialerPackage(pkg)) return
        tick()
    }

    private fun tick() {
        // Zdarzeń zmiany treści jest dużo - próbujemy najwyżej co 400 ms.
        val now = System.currentTimeMillis()
        if (now - lastAttemptAt < 400) return
        lastAttemptAt = now

        try {
            // Okna aplikacji Telefon: główne i ewentualne menu rozwijane („⋮”/„Więcej”) - to osobne okno.
            val roots = windows.mapNotNull { it.root }
                .filter { val p = it.packageName?.toString() ?: ""; p != packageName && isDialerPackage(p) }
            if (roots.isEmpty()) return

            // 1) „Scal” widoczne od razu albo w otwartym menu.
            for (root in roots) {
                val target = findNode(root, MERGE_LABEL, EXCLUDED_LABEL) ?: continue
                if (click(target)) {
                    armedUntil = 0L  // naciśnięte: koniec nasłuchiwania
                    menuOpenedAt = 0L
                    lastMergeAt = now
                    Log.i(TAG, "naciśnięto przycisk scalania (etykieta: ${labelOf(target)})")
                    Toast.makeText(this, "TelePakt: scalam rozmowy…", Toast.LENGTH_SHORT).show()
                    return
                }
            }

            saveLabels(roots)

            // 2) W wielu telefonach „Scal” jest dopiero pod przyciskiem „⋮”/„Więcej”: otwieramy menu (jedno stuknięcie
            // na 2,5 s). Jeśli po otwarciu menu nie ma w nim „Scal” (druga rozmowa jeszcze się łączy), zamykamy je
            // przyciskiem Wstecz i próbujemy ponownie - menu otwarte przez nas nie może zostać na ekranie.
            if (menuOpenedAt != 0L && now - menuOpenedAt > MENU_WAIT_MS) {
                performGlobalAction(GLOBAL_ACTION_BACK)
                menuOpenedAt = 0L
                lastOverflowAt = now
                return
            }
            if (menuOpenedAt == 0L && now - lastOverflowAt > MENU_WAIT_MS) {
                for (root in roots) {
                    val more = findNode(root, OVERFLOW_LABEL, null) ?: continue
                    if (click(more)) {
                        menuOpenedAt = now
                        lastOverflowAt = now
                        Log.i(TAG, "otwarto menu „${labelOf(more)}” w poszukiwaniu przycisku scalania")
                        break
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "scalanie nie powiodło się", e)
        }
    }

    private fun click(target: AccessibilityNodeInfo): Boolean {
        var node: AccessibilityNodeInfo? = target
        while (node != null && !node.isClickable) node = node.parent
        return node?.performAction(AccessibilityNodeInfo.ACTION_CLICK) == true
    }

    /** Diagnostyka dla właściciela: etykiety przycisków widziane w aplikacji Telefon (do dopasowania do jego telefonu). */
    private fun saveLabels(roots: List<AccessibilityNodeInfo>) {
        val labels = LinkedHashSet<String>()
        fun walk(node: AccessibilityNodeInfo, depth: Int) {
            if (labels.size >= 30 || depth > 25) return
            val label = labelOf(node)
            if (label.isNotEmpty() && label.length <= 40 && (node.isClickable || node.parent?.isClickable == true)) labels.add(label)
            for (i in 0 until node.childCount) node.getChild(i)?.let { walk(it, depth + 1) }
        }
        roots.forEach { walk(it, 0) }
        if (labels.isNotEmpty()) {
            getSharedPreferences("telepakt", Context.MODE_PRIVATE).edit()
                .putString("dialer_labels", labels.joinToString(" | ")).apply()
        }
    }

    private fun isDialerPackage(pkg: String): Boolean {
        if (pkg in KNOWN_DIALERS) return true
        val telecom = getSystemService(Context.TELECOM_SERVICE) as android.telecom.TelecomManager
        return pkg == telecom.defaultDialerPackage
    }

    private fun labelOf(node: AccessibilityNodeInfo): String =
        (node.text?.toString() ?: node.contentDescription?.toString() ?: "").trim()

    /** Pierwszy element o etykiecie pasującej do [match] (tekst albo opis dla czytników ekranu), bez [exclude]. */
    private fun findNode(node: AccessibilityNodeInfo, match: Regex, exclude: Regex?): AccessibilityNodeInfo? {
        val label = labelOf(node)
        if (label.isNotEmpty() && label.length <= 40 && match.containsMatchIn(label) && exclude?.containsMatchIn(label) != true) {
            return node
        }
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val found = findNode(child, match, exclude)
            if (found != null) return found
        }
        return null
    }

    companion object {
        private const val TAG = "TelePakt"
        private const val ARM_MS = 90_000L

        private val MERGE_LABEL = Regex("(?i)\\b(merge|scal|scalanie|połącz rozmowy|polacz rozmowy|conference|konferencj)")
        private val EXCLUDED_LABEL = Regex("(?i)(swap|zamień|zamien|telepakt)")
        // Przycisk „⋮” / „⋯”: różne telefony nazywają go różnie (opis dla czytników ekranu).
        private val OVERFLOW_LABEL = Regex("(?i)(more options|more|więcej opcji|więcej|wiecej|opcje|options|menu|inne|⋮|⋯|…)")
        private const val MENU_WAIT_MS = 2500L
        private const val TICK_MS = 700L
        private val KNOWN_DIALERS = setOf(
            "com.google.android.dialer", "com.android.dialer", "com.android.incallui", "com.android.phone",
            "com.samsung.android.incallui", "com.samsung.android.dialer", "com.miui.voip", "com.android.server.telecom"
        )

        @Volatile var instance: MergeAccessibilityService? = null
        @Volatile private var armedUntil = 0L
        @Volatile var lastMergeAt = 0L
        @Volatile private var menuOpenedAt = 0L
        @Volatile private var lastOverflowAt = 0L

        /** Włącza nasłuchiwanie przycisku „Scal” na [ARM_MS]; wołane po stuknięciu „Połącz z TelePakt (3-way)”. */
        fun arm() {
            armedUntil = System.currentTimeMillis() + ARM_MS
            menuOpenedAt = 0L
            lastOverflowAt = 0L
            instance?.startTicking()
        }

        private fun isArmed() = System.currentTimeMillis() < armedUntil

        /** Czy użytkownik włączył tę usługę w Ustawieniach > Ułatwienia dostępu. */
        fun isEnabled(context: Context): Boolean {
            val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
                ?: return false
            val me = ComponentName(context, MergeAccessibilityService::class.java)
            return enabled.split(':').any {
                it.equals(me.flattenToString(), ignoreCase = true) || it.equals(me.flattenToShortString(), ignoreCase = true)
            }
        }
    }
}
