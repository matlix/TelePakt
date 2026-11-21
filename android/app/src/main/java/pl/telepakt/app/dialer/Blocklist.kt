package pl.telepakt.app.dialer

import android.content.ContentValues
import android.content.Context
import android.provider.BlockedNumberContract
import android.util.Log

/**
 * Systemowa lista zablokowanych numerów. Zapisywać do niej może tylko domyślna aplikacja Telefon - system sam odrzuca
 * wtedy połączenia z tych numerów (nie docierają do nas ani do użytkownika, a wpis zostaje w rejestrze połączeń).
 */
object Blocklist {
    private const val TAG = "TelePakt"

    fun available(ctx: Context): Boolean = try {
        BlockedNumberContract.canCurrentUserBlockNumbers(ctx)
    } catch (e: Exception) {
        Log.w(TAG, "blokowanie numerów niedostępne", e)
        false
    }

    fun isBlocked(ctx: Context, number: String): Boolean = try {
        available(ctx) && BlockedNumberContract.isBlocked(ctx, number)
    } catch (e: Exception) {
        Log.w(TAG, "sprawdzenie blokady nie powiodło się", e)
        false
    }

    /** Zwraca true, gdy numer jest (już) zablokowany po tym wywołaniu. */
    fun block(ctx: Context, number: String): Boolean {
        if (number.isBlank() || !available(ctx)) return false
        if (isBlocked(ctx, number)) return true
        return try {
            val values = ContentValues().apply { put(BlockedNumberContract.BlockedNumbers.COLUMN_ORIGINAL_NUMBER, number) }
            ctx.contentResolver.insert(BlockedNumberContract.BlockedNumbers.CONTENT_URI, values) != null
        } catch (e: Exception) {
            Log.e(TAG, "blokowanie numeru nie powiodło się", e)
            false
        }
    }

    fun unblock(ctx: Context, number: String): Boolean = try {
        BlockedNumberContract.unblock(ctx, number) >= 0
    } catch (e: Exception) {
        Log.e(TAG, "odblokowanie numeru nie powiodło się", e)
        false
    }
}
