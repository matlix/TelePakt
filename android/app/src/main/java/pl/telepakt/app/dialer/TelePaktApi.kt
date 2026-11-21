package pl.telepakt.app.dialer

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/** Komunikat z konta użytkownika (zakładka Komunikaty); do przycisków na ekranie rozmowy. */
data class VoiceMsg(val id: Int, val title: String)

/** Wyjątek z komunikatem dla użytkownika (powód błędu pokazywany wprost na ekranie rozmowy). */
class ApiException(message: String) : Exception(message)

/** Minimalny klient API TelePakt dla natywnych ekranów (adres i token zapisuje aplikacja w SharedPreferences "telepakt"). */
object TelePaktApi {
    private const val TAG = "TelePakt"

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("telepakt", Context.MODE_PRIVATE)

    fun isConfigured(ctx: Context): Boolean =
        !prefs(ctx).getString("api_url", "").isNullOrBlank() && !prefs(ctx).getString("auth_token", "").isNullOrBlank()

    private fun request(ctx: Context, method: String, path: String, readTimeoutMs: Int, json: String = "{}"): Pair<Int, String> {
        val apiUrl = prefs(ctx).getString("api_url", "") ?: ""
        val token = prefs(ctx).getString("auth_token", "") ?: ""
        if (apiUrl.isBlank() || token.isBlank()) throw ApiException("Zaloguj się w aplikacji TelePakt.")
        val conn = URL("${apiUrl.trimEnd('/')}$path").openConnection() as HttpURLConnection
        try {
            conn.requestMethod = method
            conn.connectTimeout = 8000
            conn.readTimeout = readTimeoutMs
            conn.setRequestProperty("Authorization", "Bearer $token")
            if (method == "POST") {
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                conn.outputStream.use { it.write(json.toByteArray()) }
            }
            val code = conn.responseCode
            val body = (if (code in 200..299) conn.inputStream else conn.errorStream)
                ?.bufferedReader()?.use { it.readText() }.orEmpty()
            return Pair(code, body)
        } catch (e: IOException) {
            Log.e(TAG, "API $method $path: sieć", e)
            throw ApiException("Brak połączenia z serwerem")
        } finally {
            conn.disconnect()
        }
    }

    private fun errorOf(body: String, fallback: String): String =
        try { JSONObject(body).optString("error", fallback) } catch (e: Exception) { fallback }

    /** Numer TelePakt, do którego dzwonimy, żeby utworzyć rozmowę 3-way. */
    fun forwardingNumber(ctx: Context): String {
        val (code, body) = request(ctx, "GET", "/api/telephony/forwarding-info/", 8000)
        if (code !in 200..299) {
            Log.w(TAG, "forwarding-info HTTP $code: $body")
            throw ApiException(errorOf(body, "Nie udało się pobrać numeru TelePakt (HTTP $code)"))
        }
        val number = JSONObject(body).optString("number")
        if (number.isBlank()) throw ApiException("Serwer nie zwrócił numeru TelePakt")
        return number
    }

    fun messages(ctx: Context): List<VoiceMsg> {
        val (code, body) = request(ctx, "GET", "/api/telephony/messages/", 8000)
        if (code !in 200..299) {
            Log.w(TAG, "messages HTTP $code: $body")
            throw ApiException(errorOf(body, "Nie udało się pobrać komunikatów (HTTP $code)"))
        }
        val arr = JSONObject(body).getJSONArray("messages")
        val list = mutableListOf<VoiceMsg>()
        for (i in 0 until arr.length()) {
            val m = arr.getJSONObject(i)
            if (m.optBoolean("is_active", true)) list.add(VoiceMsg(m.getInt("id"), m.getString("title")))
        }
        return list
    }

    /** Prosi serwer o odtworzenie komunikatu w trwającej rozmowie 3-way; zwraca (kod HTTP, powód błędu lub null). */
    fun speak(ctx: Context, messageId: Int): Pair<Int, String?> {
        val (code, body) = request(ctx, "POST", "/api/telephony/messages/$messageId/speak/", 35000)
        if (code in 200..299) return Pair(code, null)
        Log.w(TAG, "speak HTTP $code: $body")
        return Pair(code, errorOf(body, "Nie udało się odtworzyć komunikatu (HTTP $code)"))
    }

    /** Ile różnych użytkowników TelePakt zgłosiło numer (0 = brak wystarczających zgłoszeń; to NIE znaczy „bezpieczny”). */
    fun reputation(ctx: Context, number: String): Int {
        val (code, body) = request(ctx, "GET", "/api/telephony/number-reputation/?number=" + java.net.URLEncoder.encode(number, "UTF-8"), 8000)
        if (code !in 200..299) {
            Log.w(TAG, "number-reputation HTTP $code: $body")
            throw ApiException(errorOf(body, "Nie udało się sprawdzić numeru (HTTP $code)"))
        }
        val json = JSONObject(body)
        return if (json.optBoolean("warn")) json.optInt("reports") else 0
    }

    fun reportNumber(ctx: Context, number: String, category: String = "telemarketing") {
        val (code, body) = request(ctx, "POST", "/api/telephony/report-number/", 8000, JSONObject().put("number", number).put("category", category).toString())
        if (code !in 200..299) {
            Log.w(TAG, "report-number HTTP $code: $body")
            throw ApiException(errorOf(body, "Nie udało się zgłosić numeru (HTTP $code)"))
        }
    }
}
