package pl.telepakt.app.overlay

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission

@CapacitorPlugin(
    name = "TelePaktOverlay",
    permissions = [
        Permission(
            strings = [Manifest.permission.READ_PHONE_STATE, Manifest.permission.ANSWER_PHONE_CALLS, Manifest.permission.CALL_PHONE],
            alias = "phone"
        )
    ]
)
class TelePaktOverlayPlugin : Plugin() {

    @PluginMethod
    fun checkOverlayPermission(call: PluginCall) {
        val hasPermission = Settings.canDrawOverlays(context)
        val ret = JSObject()
        ret.put("granted", hasPermission)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestOverlayPermission(call: PluginCall) {
        if (!Settings.canDrawOverlays(context)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + context.packageName)
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
        call.resolve()
    }

    @PluginMethod
    fun showOverlay(call: PluginCall) {
        val phoneNumber = call.getString("phoneNumber", "+48 799 555 123")
        val serviceIntent = Intent(context, CallOverlayService::class.java).apply {
            putExtra("PHONE_NUMBER", phoneNumber)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    /** Zapisuje adres API i token sesji - czyta je CallOverlayService uruchamiany przez CallReceiver. */
    @PluginMethod
    fun saveConfig(call: PluginCall) {
        context.getSharedPreferences("telepakt", android.content.Context.MODE_PRIVATE).edit()
            .putString("api_url", call.getString("apiUrl", ""))
            .putString("auth_token", call.getString("token", ""))
            .apply()
        call.resolve()
    }

    /**
     * Wybiera numer jednym stuknięciem - także kod MMI, np. przekierowanie `**67*+48...#` - bez kopiowania
     * i wklejania w aplikacji Telefon. Wymaga uprawnienia CALL_PHONE (grupa "Telefon" z banera konfiguracji).
     */
    @PluginMethod
    fun dialNumber(call: PluginCall) {
        val number = call.getString("number")
        if (number.isNullOrBlank()) {
            call.reject("Brak numeru do wybrania.")
            return
        }
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Brak uprawnienia do wybierania numerów. Włącz je przyciskiem „Włącz teraz” w banerze „Dokończ konfigurację”.")
            return
        }
        try {
            // '#' i '+' muszą być zakodowane w adresie tel:, inaczej dialer ucina kod.
            val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:" + Uri.encode(number)))
                .apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            context.startActivity(intent)
            call.resolve()
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "dialNumber failed", e)
            call.reject("Nie udało się wybrać numeru: ${e.message}")
        }
    }

    @PluginMethod
    fun hideOverlay(call: PluginCall) {
        val serviceIntent = Intent(context, CallOverlayService::class.java)
        context.stopService(serviceIntent)
        val ret = JSObject()
        ret.put("success", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun checkPhoneStatePermission(call: PluginCall) {
        val granted = listOf(
            Manifest.permission.READ_PHONE_STATE, Manifest.permission.ANSWER_PHONE_CALLS, Manifest.permission.CALL_PHONE
        ).all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
        val ret = JSObject()
        ret.put("granted", granted)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestPhoneStatePermission(call: PluginCall) {
        requestPermissionForAlias("phone", call, "phoneStateCallback")
    }

    @com.getcapacitor.annotation.PermissionCallback
    private fun phoneStateCallback(call: PluginCall) {
        checkPhoneStatePermission(call)
    }
}
