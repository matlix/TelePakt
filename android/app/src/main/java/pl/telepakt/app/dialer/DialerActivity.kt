package pl.telepakt.app.dialer

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.provider.CallLog
import android.telecom.TelecomManager
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

/**
 * Wybieranie numeru i ostatnie połączenia - to, czego system wymaga od domyślnej aplikacji Telefon (ACTION_DIAL).
 * Numery alarmowe (112, 997...) idą tą samą drogą co zwykłe: wybiera je system przez TelecomManager.
 */
class DialerActivity : Activity() {

    private var number = StringBuilder()
    private lateinit var display: TextView
    private lateinit var recents: LinearLayout
    private var addCall = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        addCall = intent.getBooleanExtra(EXTRA_ADD_CALL, false)
        window.statusBarColor = Color.parseColor("#020617")
        window.navigationBarColor = Color.parseColor("#020617")

        // Numer z intencji (np. stuknięty link tel: albo „Zadzwoń” z innej aplikacji).
        intent?.data?.takeIf { it.scheme == "tel" }?.schemeSpecificPart?.let { number.append(Uri.decode(it)) }

        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#020617"))
            setPadding(dp(16), dp(36), dp(16), dp(16))
        }
        col.addView(label(if (addCall) "Dodaj rozmowę" else "Telefon TelePakt", 14f, "#7DD3FC", bold = true))

        display = label("", 30f, "#FFFFFF", bold = true).apply { minHeight = dp(52) }
        col.addView(display)

        listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#").chunked(3).forEach { chunk ->
            val r = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            chunk.forEach { k ->
                r.addView(Button(this).apply {
                    text = k
                    textSize = 22f
                    isAllCaps = false
                    setTextColor(Color.WHITE)
                    background = rounded("#1E293B", 16)
                    setOnClickListener { number.append(k); refresh() }
                }, LinearLayout.LayoutParams(0, dp(58), 1f).apply { setMargins(dp(4), dp(4), dp(4), dp(4)) })
            }
            col.addView(r)
        }

        val actions = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        actions.addView(Button(this).apply {
            text = "⌫"
            textSize = 20f
            setTextColor(Color.WHITE)
            background = rounded("#334155", 28)
            setOnClickListener { if (number.isNotEmpty()) number.deleteCharAt(number.length - 1); refresh() }
            setOnLongClickListener { number.clear(); refresh(); true }
        }, LinearLayout.LayoutParams(0, dp(56), 1f).apply { setMargins(dp(4), dp(8), dp(4), dp(8)) })
        actions.addView(Button(this).apply {
            text = "Zadzwoń"
            isAllCaps = false
            textSize = 16f
            setTextColor(Color.WHITE)
            setTypeface(typeface, Typeface.BOLD)
            background = rounded("#16A34A", 28)
            setOnClickListener { placeCall(number.toString()) }
        }, LinearLayout.LayoutParams(0, dp(56), 2f).apply { setMargins(dp(4), dp(8), dp(4), dp(8)) })
        col.addView(actions)

        col.addView(label("Ostatnie połączenia", 12f, "#94A3B8", bold = true).apply { setPadding(0, dp(10), 0, dp(4)) })
        recents = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        col.addView(recents)

        setContentView(ScrollView(this).apply {
            setBackgroundColor(Color.parseColor("#020617"))
            addView(col, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        })
        refresh()
        requestPermissionsIfNeeded()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.data?.takeIf { it.scheme == "tel" }?.schemeSpecificPart?.let { number = StringBuilder(Uri.decode(it)); refresh() }
    }

    private fun refresh() {
        display.text = number.toString()
    }

    private fun requestPermissionsIfNeeded() {
        val wanted = listOf(Manifest.permission.CALL_PHONE, Manifest.permission.READ_CALL_LOG, Manifest.permission.READ_CONTACTS)
            .filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (wanted.isNotEmpty()) requestPermissions(wanted.toTypedArray(), 1) else loadRecents()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        loadRecents()
    }

    private fun placeCall(raw: String) {
        val target = raw.trim()
        if (target.isEmpty()) return
        try {
            val telecom = getSystemService(Context.TELECOM_SERVICE) as TelecomManager
            telecom.placeCall(Uri.fromParts("tel", target, null), Bundle())
            finish()
        } catch (e: SecurityException) {
            Toast.makeText(this, "Brak uprawnienia do wykonywania połączeń. Zezwól na nie w ustawieniach TelePakt.", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "placeCall failed", e)
            Toast.makeText(this, "Nie udało się wybrać numeru: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun loadRecents() {
        recents.removeAllViews()
        if (checkSelfPermission(Manifest.permission.READ_CALL_LOG) != PackageManager.PERMISSION_GRANTED) {
            recents.addView(label("Zezwól na dostęp do rejestru połączeń, aby zobaczyć ostatnie rozmowy.", 12f, "#94A3B8"))
            return
        }
        try {
            contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(CallLog.Calls.NUMBER, CallLog.Calls.TYPE, CallLog.Calls.CACHED_NAME),
                null, null, CallLog.Calls.DATE + " DESC"
            )?.use { c ->
                var shown = 0
                while (c.moveToNext() && shown < 15) {
                    val num = c.getString(0) ?: continue
                    if (num.isBlank()) continue
                    val type = c.getInt(1)
                    val name = c.getString(2).orEmpty()
                    val arrow = when (type) {
                        CallLog.Calls.OUTGOING_TYPE -> "↗"
                        CallLog.Calls.MISSED_TYPE, CallLog.Calls.REJECTED_TYPE -> "✗"
                        else -> "↙"
                    }
                    recents.addView(Button(this).apply {
                        text = "$arrow  ${name.ifEmpty { num }}${if (name.isNotEmpty()) "  ($num)" else ""}"
                        isAllCaps = false
                        textSize = 13f
                        gravity = Gravity.START or Gravity.CENTER_VERTICAL
                        setTextColor(Color.parseColor(if (type == CallLog.Calls.MISSED_TYPE) "#F87171" else "#E2E8F0"))
                        background = rounded("#0F172A", 12, "#1E293B")
                        setOnClickListener { number = StringBuilder(num); refresh() }
                    }, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = dp(6) })
                    shown++
                }
                if (shown == 0) recents.addView(label("Brak ostatnich połączeń.", 12f, "#94A3B8"))
            }
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "odczyt rejestru połączeń nie powiódł się", e)
            recents.addView(label("Nie udało się wczytać ostatnich połączeń.", 12f, "#F87171"))
        }
    }

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    private fun rounded(fill: String, radiusDp: Int, stroke: String? = null) = GradientDrawable().apply {
        setColor(Color.parseColor(fill))
        cornerRadius = dp(radiusDp).toFloat()
        if (stroke != null) setStroke(dp(1), Color.parseColor(stroke))
    }

    private fun label(value: String, size: Float, color: String, bold: Boolean = false) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(Color.parseColor(color))
        gravity = Gravity.CENTER
        if (bold) setTypeface(typeface, Typeface.BOLD)
    }

    companion object {
        const val EXTRA_ADD_CALL = "add_call"
    }
}
