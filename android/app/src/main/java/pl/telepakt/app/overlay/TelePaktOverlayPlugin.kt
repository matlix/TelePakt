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
            strings = [Manifest.permission.READ_PHONE_STATE, Manifest.permission.CALL_PHONE],
            alias = "phone"
        ),
        // Odczyt numeru własnej karty SIM (tylko na życzenie, przyciskiem w Profilu).
        Permission(
            strings = [Manifest.permission.READ_PHONE_NUMBERS, Manifest.permission.READ_PHONE_STATE],
            alias = "numbers"
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
        val granted = listOf(Manifest.permission.READ_PHONE_STATE, Manifest.permission.CALL_PHONE).all {
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

    /**
     * Numery własnych kart SIM (także dual SIM). Prosi o uprawnienie, jeśli go brak. Zwraca `{ numbers: [{slot, number,
     * label}], sims: <liczba aktywnych kart> }`. Lista może być pusta mimo kart: wielu operatorów nie zapisuje numeru
     * na karcie, a system nie ma go skąd wziąć - aplikacja pokazuje wtedy prośbę o wpisanie numeru ręcznie.
     */
    /**
     * Czy operator (każdej aktywnej karty SIM) pozwala na rozmowy konferencyjne - bez nich scalenie 3-way z TelePakt
     * nie jest możliwe. Czyta konfigurację operatora z telefonu (CarrierConfig: support_conference_call_bool).
     * To wskazówka, nie gwarancja: ustawienie "true" nie ręczy, że abonament lub sieć nie blokuje scalania, więc
     * ostatecznie sprawdza je pierwsza próba. `supported=false` jest natomiast pewne: operator wyłączył konferencje.
     * Wymaga READ_PHONE_STATE (grupa "Telefon" z banera konfiguracji).
     */
    @PluginMethod
    @Suppress("MissingPermission")
    fun checkConferenceSupport(call: PluginCall) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Brak uprawnienia do stanu telefonu.")
            return
        }
        try {
            val sm = context.getSystemService(android.content.Context.TELEPHONY_SUBSCRIPTION_SERVICE)
                as android.telephony.SubscriptionManager
            val cm = context.getSystemService(android.content.Context.CARRIER_CONFIG_SERVICE)
                as android.telephony.CarrierConfigManager
            val subs = sm.activeSubscriptionInfoList.orEmpty()
            val sims = org.json.JSONArray()
            var anySupported = false
            for (sub in subs) {
                val config = cm.getConfigForSubId(sub.subscriptionId)
                val supported = config?.getBoolean(android.telephony.CarrierConfigManager.KEY_SUPPORT_CONFERENCE_CALL_BOOL, true) ?: true
                if (supported) anySupported = true
                sims.put(org.json.JSONObject()
                    .put("slot", sub.simSlotIndex + 1)
                    .put("supported", supported)
                    .put("carrier", (sub.carrierName ?: sub.displayName ?: "").toString()))
            }
            val ret = JSObject()
            ret.put("sims", sims)
            // Brak aktywnej karty SIM: nie wiemy nic - nie wolno ogłaszać braku wsparcia.
            ret.put("anySupported", subs.isEmpty() || anySupported)
            ret.put("known", subs.isNotEmpty())
            call.resolve(ret)
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "checkConferenceSupport failed", e)
            call.reject("Nie udało się sprawdzić operatora: ${e.message}")
        }
    }

    @PluginMethod
    fun getPhoneNumbers(call: PluginCall) {
        val granted = listOf(Manifest.permission.READ_PHONE_NUMBERS, Manifest.permission.READ_PHONE_STATE).all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
        if (!granted) {
            requestPermissionForAlias("numbers", call, "phoneNumbersCallback")
            return
        }
        readPhoneNumbers(call)
    }

    @com.getcapacitor.annotation.PermissionCallback
    private fun phoneNumbersCallback(call: PluginCall) {
        val granted = listOf(Manifest.permission.READ_PHONE_NUMBERS, Manifest.permission.READ_PHONE_STATE).all {
            ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
        }
        if (!granted) {
            call.reject("Brak zgody na odczyt numeru telefonu. Wpisz numer ręcznie albo zezwól w Ustawienia telefonu > Aplikacje > TelePakt > Uprawnienia > Telefon.")
            return
        }
        readPhoneNumbers(call)
    }

    @Suppress("DEPRECATION", "MissingPermission")
    private fun readPhoneNumbers(call: PluginCall) {
        try {
            val sm = context.getSystemService(android.content.Context.TELEPHONY_SUBSCRIPTION_SERVICE)
                as android.telephony.SubscriptionManager
            val tm = context.getSystemService(android.content.Context.TELEPHONY_SERVICE) as android.telephony.TelephonyManager
            val subs = sm.activeSubscriptionInfoList.orEmpty()
            val out = org.json.JSONArray()
            val seen = HashSet<String>()
            for (sub in subs) {
                val number = try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) sm.getPhoneNumber(sub.subscriptionId)
                    else tm.createForSubscriptionId(sub.subscriptionId).line1Number ?: sub.number
                } catch (e: Exception) {
                    android.util.Log.w("TelePakt", "number for sub ${sub.subscriptionId} unavailable", e)
                    ""
                }.orEmpty().trim()
                if (number.isNotEmpty() && seen.add(number)) {
                    out.put(org.json.JSONObject()
                        .put("slot", sub.simSlotIndex + 1)
                        .put("number", number)
                        .put("label", (sub.carrierName ?: sub.displayName ?: "").toString()))
                }
            }
            val ret = JSObject()
            ret.put("numbers", out)
            ret.put("sims", subs.size)
            call.resolve(ret)
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "getPhoneNumbers failed", e)
            call.reject("Nie udało się odczytać numeru z telefonu: ${e.message}")
        }
    }
}
