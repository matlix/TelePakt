package pl.telepakt.app.dialer

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.provider.BlockedNumberContract
import android.provider.CallLog
import android.provider.ContactsContract
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

/** Wspólne, proste widoki dla ekranów list (kontakty, zablokowane numery). */
internal class Ui(private val ctx: Context) {
    fun dp(v: Int) = (v * ctx.resources.displayMetrics.density).toInt()

    fun rounded(fill: String, radiusDp: Int, stroke: String? = null) = GradientDrawable().apply {
        setColor(Color.parseColor(fill))
        cornerRadius = dp(radiusDp).toFloat()
        if (stroke != null) setStroke(dp(1), Color.parseColor(stroke))
    }

    fun label(value: String, size: Float, color: String, bold: Boolean = false, center: Boolean = true) = TextView(ctx).apply {
        text = value
        textSize = size
        setTextColor(Color.parseColor(color))
        if (center) gravity = Gravity.CENTER
        if (bold) setTypeface(typeface, Typeface.BOLD)
    }

    fun button(value: String, fill: String = "#0F172A", stroke: String? = "#1E293B", color: String = "#E2E8F0", left: Boolean = true, onClick: () -> Unit) =
        Button(ctx).apply {
            text = value
            isAllCaps = false
            textSize = 13f
            if (left) gravity = Gravity.START or Gravity.CENTER_VERTICAL
            setTextColor(Color.parseColor(color))
            background = rounded(fill, 12, stroke)
            setOnClickListener { onClick() }
        }

    fun screen(activity: Activity, title: String, content: LinearLayout): LinearLayout {
        activity.window.statusBarColor = Color.parseColor("#020617")
        activity.window.navigationBarColor = Color.parseColor("#020617")
        val col = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#020617"))
            setPadding(dp(16), dp(36), dp(16), dp(16))
        }
        col.addView(label(title, 16f, "#7DD3FC", bold = true))
        col.addView(content, LinearLayout.LayoutParams(-1, -2))
        activity.setContentView(ScrollView(ctx).apply {
            setBackgroundColor(Color.parseColor("#020617"))
            addView(col, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        })
        return col
    }
}

/** Kontakty i ulubione: wyszukiwanie po nazwie lub numerze, stuknięcie dzwoni (z ostrzeżeniem przy numerach zagranicznych). */
class ContactsActivity : Activity() {
    private lateinit var ui: Ui
    private lateinit var list: LinearLayout
    private lateinit var search: EditText
    private var onlyFavorites = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ui = Ui(this)
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val tabs = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        lateinit var favBtn: Button
        lateinit var allBtn: Button
        fun paint() {
            favBtn.background = ui.rounded(if (onlyFavorites) "#38BDF8" else "#1E293B", 14)
            favBtn.setTextColor(Color.parseColor(if (onlyFavorites) "#020617" else "#E2E8F0"))
            allBtn.background = ui.rounded(if (!onlyFavorites) "#38BDF8" else "#1E293B", 14)
            allBtn.setTextColor(Color.parseColor(if (!onlyFavorites) "#020617" else "#E2E8F0"))
        }
        favBtn = ui.button("★ Ulubione", left = false) { onlyFavorites = true; paint(); load() }
        allBtn = ui.button("Wszystkie", left = false) { onlyFavorites = false; paint(); load() }
        tabs.addView(favBtn, LinearLayout.LayoutParams(0, -2, 1f).apply { setMargins(0, ui.dp(10), ui.dp(4), ui.dp(8)) })
        tabs.addView(allBtn, LinearLayout.LayoutParams(0, -2, 1f).apply { setMargins(ui.dp(4), ui.dp(10), 0, ui.dp(8)) })
        content.addView(tabs)
        search = EditText(this).apply {
            hint = "Szukaj po nazwie lub numerze"
            setHintTextColor(Color.parseColor("#64748B"))
            setTextColor(Color.WHITE)
            background = ui.rounded("#0F172A", 12, "#1E293B")
            setPadding(ui.dp(12), ui.dp(10), ui.dp(12), ui.dp(10))
            addTextChangedListener(object : TextWatcher {
                override fun afterTextChanged(s: Editable?) { load() }
                override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
                override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            })
        }
        content.addView(search, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = ui.dp(8) })
        list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(list)
        ui.screen(this, "Kontakty", content)
        paint()
        if (checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.READ_CONTACTS), 1)
        } else load()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        load()
    }

    private fun load() {
        list.removeAllViews()
        if (checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            list.addView(ui.label("Zezwól TelePakt na dostęp do kontaktów, aby je zobaczyć.", 12f, "#94A3B8"))
            return
        }
        val q = search.text?.toString()?.trim().orEmpty()
        val selection = StringBuilder("1=1")
        val args = mutableListOf<String>()
        if (onlyFavorites) selection.append(" AND ${ContactsContract.CommonDataKinds.Phone.STARRED}=1")
        if (q.isNotEmpty()) {
            selection.append(" AND (${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} LIKE ? OR ${ContactsContract.CommonDataKinds.Phone.NUMBER} LIKE ?)")
            args += "%$q%"; args += "%$q%"
        }
        try {
            contentResolver.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                arrayOf(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER),
                selection.toString(), args.toTypedArray(), ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " COLLATE LOCALIZED ASC"
            )?.use { c ->
                var shown = 0
                val seen = HashSet<String>()
                while (c.moveToNext() && shown < 300) {
                    val name = c.getString(0).orEmpty()
                    val number = c.getString(1).orEmpty()
                    if (number.isBlank() || !seen.add("$name|${Dialing.clean(number)}")) continue
                    list.addView(
                        ui.button("$name\n$number") { Dialing.call(this, number) { finish() } },
                        LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = ui.dp(6) }
                    )
                    shown++
                }
                if (shown == 0) list.addView(ui.label(if (onlyFavorites) "Brak ulubionych kontaktów. Oznacz gwiazdką kontakt w aplikacji Kontakty." else "Brak kontaktów.", 12f, "#94A3B8"))
            }
        } catch (e: Exception) {
            Log.e("TelePakt", "odczyt kontaktów nie powiódł się", e)
            list.addView(ui.label("Nie udało się wczytać kontaktów: ${e.message}", 12f, "#F87171"))
        }
    }
}

/** Zablokowane numery: lista (wraz z liczbą wcześniejszych połączeń z nich), dodawanie ręczne i odblokowanie. Tylko użytkownik decyduje. */
class BlocklistActivity : Activity() {
    private lateinit var ui: Ui
    private lateinit var list: LinearLayout
    private lateinit var input: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ui = Ui(this)
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(ui.label("Blokujesz tylko Ty - TelePakt niczego nie blokuje sam. Zablokowane numery nie dzwonią, a ich próby zostają w rejestrze połączeń.", 11f, "#94A3B8").apply { setPadding(0, ui.dp(8), 0, ui.dp(8)) })
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        input = EditText(this).apply {
            hint = "Numer do zablokowania"
            inputType = android.text.InputType.TYPE_CLASS_PHONE
            setHintTextColor(Color.parseColor("#64748B"))
            setTextColor(Color.WHITE)
            background = ui.rounded("#0F172A", 12, "#1E293B")
            setPadding(ui.dp(12), ui.dp(10), ui.dp(12), ui.dp(10))
        }
        row.addView(input, LinearLayout.LayoutParams(0, -2, 1f))
        row.addView(ui.button("Zablokuj", fill = "#7F1D1D", stroke = null, color = "#FEE2E2", left = false) {
            val n = Dialing.clean(input.text.toString())
            if (n.length < 3) { Toast.makeText(this, "Wpisz numer telefonu.", Toast.LENGTH_SHORT).show(); return@button }
            val ok = Blocklist.block(this, n)
            Toast.makeText(this, if (ok) "Numer zablokowany." else "Nie udało się zablokować (TelePakt musi być aplikacją Telefon).", Toast.LENGTH_LONG).show()
            input.setText("")
            load()
        }, LinearLayout.LayoutParams(-2, -2).apply { leftMargin = ui.dp(6) })
        content.addView(row, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = ui.dp(10) })
        list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        content.addView(list)
        ui.screen(this, "Zablokowane numery", content)
        load()
    }

    private fun earlierCalls(number: String): Int {
        if (checkSelfPermission(Manifest.permission.READ_CALL_LOG) != PackageManager.PERMISSION_GRANTED) return -1
        return try {
            contentResolver.query(CallLog.Calls.CONTENT_URI, arrayOf(CallLog.Calls._ID), "${CallLog.Calls.NUMBER}=?", arrayOf(number), null)
                ?.use { it.count } ?: 0
        } catch (e: Exception) { -1 }
    }

    private fun load() {
        list.removeAllViews()
        if (!Blocklist.available(this)) {
            list.addView(ui.label("Lista zablokowanych numerów jest dostępna, gdy TelePakt jest Twoją aplikacją Telefon.", 12f, "#94A3B8"))
            return
        }
        try {
            contentResolver.query(
                BlockedNumberContract.BlockedNumbers.CONTENT_URI,
                arrayOf(BlockedNumberContract.BlockedNumbers.COLUMN_ORIGINAL_NUMBER), null, null, null
            )?.use { c ->
                var shown = 0
                while (c.moveToNext()) {
                    val number = c.getString(0).orEmpty()
                    val earlier = earlierCalls(number)
                    val note = when {
                        earlier < 0 -> ""
                        earlier == 0 -> "\nBrak wcześniejszych połączeń"
                        else -> "\nWcześniejsze połączenia z tego numeru: $earlier"
                    }
                    list.addView(
                        ui.button("🚫 $number$note  (stuknij, aby odblokować)") {
                            val ok = Blocklist.unblock(this, number)
                            Toast.makeText(this, if (ok) "Numer odblokowany." else "Nie udało się odblokować.", Toast.LENGTH_SHORT).show()
                            load()
                        },
                        LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = ui.dp(6) }
                    )
                    shown++
                }
                if (shown == 0) list.addView(ui.label("Nie zablokowałeś żadnego numeru.", 12f, "#94A3B8"))
            }
        } catch (e: Exception) {
            Log.e("TelePakt", "odczyt listy zablokowanych nie powiódł się", e)
            list.addView(ui.label("Nie udało się wczytać listy: ${e.message}", 12f, "#F87171"))
        }
    }
}
