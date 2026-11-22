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
        ),
        // Kreator konfiguracji: te uprawnienia prosimy pojedynczo, z wyjaśnieniem po co.
        Permission(strings = [Manifest.permission.READ_CONTACTS], alias = "contacts"),
        Permission(strings = [Manifest.permission.READ_CALL_LOG], alias = "calllog"),
        Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "notif")
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

    /** Stan wszystkich uprawnień potrzebnych aplikacji (kreator konfiguracji pokazuje je krok po kroku). */
    @PluginMethod
    fun getPermissionStates(call: PluginCall) {
        fun g(p: String) = ContextCompat.checkSelfPermission(context, p) == PackageManager.PERMISSION_GRANTED
        val telecom = context.getSystemService(android.content.Context.TELECOM_SERVICE) as android.telecom.TelecomManager
        val ret = JSObject()
        ret.put("phone", g(Manifest.permission.READ_PHONE_STATE) && g(Manifest.permission.CALL_PHONE))
        ret.put("contacts", g(Manifest.permission.READ_CONTACTS))
        ret.put("calllog", g(Manifest.permission.READ_CALL_LOG))
        // Od Androida 13 powiadomienia wymagają zgody; wcześniej wystarczy, że nie są wyłączone w ustawieniach.
        ret.put("notifications", androidx.core.app.NotificationManagerCompat.from(context).areNotificationsEnabled())
        ret.put("dialer", telecom.defaultDialerPackage == context.packageName)
        ret.put("overlay", Settings.canDrawOverlays(context))
        ret.put("sdk", Build.VERSION.SDK_INT)
        call.resolve(ret)
    }

    /** Prosi o jedno uprawnienie: group = contacts | calllog | notifications. Zwraca nowy stan wszystkich. */
    @PluginMethod
    fun requestPermissionGroup(call: PluginCall) {
        val alias = when (call.getString("group")) {
            "contacts" -> "contacts"
            "calllog" -> "calllog"
            "notifications" -> "notif"
            else -> null
        }
        if (alias == null) { call.reject("Nieznana grupa uprawnień."); return }
        requestPermissionForAlias(alias, call, "permissionGroupResult")
    }

    @com.getcapacitor.annotation.PermissionCallback
    private fun permissionGroupResult(call: PluginCall) {
        getPermissionStates(call)
    }

    /** Otwiera ustawienia aplikacji (kind = notifications otwiera ustawienia powiadomień) - gdy Android nie pokazuje już okienka zgody. */
    @PluginMethod
    fun openAppSettings(call: PluginCall) {
        try {
            val intent = if (call.getString("kind") == "notifications") {
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            } else {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + context.packageName))
            }
            context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            call.resolve()
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "openAppSettings failed", e)
            call.reject("Nie udało się otworzyć ustawień aplikacji: ${e.message}")
        }
    }

    /** Autotest konta testowego (część natywna): zwraca listę kroków {name, ok, detail}. Nic nie kosztuje i niczego nie zostawia. */
    @PluginMethod
    fun runNativeSelfTest(call: PluginCall) {
        val steps = org.json.JSONArray()
        fun step(name: String, ok: Boolean, detail: String) {
            steps.put(org.json.JSONObject().put("name", name).put("ok", ok).put("detail", detail))
        }
        fun granted(p: String) = ContextCompat.checkSelfPermission(context, p) == PackageManager.PERMISSION_GRANTED
        try {
            step("Urządzenie", true, "${Build.MANUFACTURER} ${Build.MODEL}, Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
            val telecom = context.getSystemService(android.content.Context.TELECOM_SERVICE) as android.telecom.TelecomManager
            val isDefault = telecom.defaultDialerPackage == context.packageName
            step("Domyślna aplikacja Telefon", isDefault, "domyślna: ${telecom.defaultDialerPackage}")
            step("Uprawnienia", true, listOf("READ_PHONE_STATE", "CALL_PHONE", "READ_CONTACTS", "READ_CALL_LOG", "RECORD_AUDIO")
                .joinToString(", ") { it + "=" + granted("android.permission.$it") })
            step("Nakładka (SYSTEM_ALERT_WINDOW)", true, Settings.canDrawOverlays(context).toString())
            step("Usługa scalania (ułatwienia dostępu)", true, MergeAccessibilityService.isEnabled(context).toString())
            val accounts = try { telecom.callCapablePhoneAccounts.size } catch (e: SecurityException) { -1 }
            step("Karty SIM do połączeń", accounts != 0, "liczba kont: $accounts")
            val blockOk = if (isDefault && pl.telepakt.app.dialer.Blocklist.available(context)) {
                val probe = "+48000000001"
                val blocked = pl.telepakt.app.dialer.Blocklist.block(context, probe)
                val seen = pl.telepakt.app.dialer.Blocklist.isBlocked(context, probe)
                val removed = pl.telepakt.app.dialer.Blocklist.unblock(context, probe)
                step("Blokowanie numerów (zapis i odczyt)", blocked && seen && removed, "block=$blocked widoczny=$seen odblokowany=$removed")
                true
            } else { step("Blokowanie numerów", false, "wymaga bycia domyślną aplikacją Telefon"); false }
            if (granted("android.permission.READ_CONTACTS")) {
                val n = context.contentResolver.query(android.provider.ContactsContract.CommonDataKinds.Phone.CONTENT_URI, arrayOf("_id"), null, null, null)?.use { it.count } ?: -1
                step("Kontakty (odczyt)", n >= 0, "numerów w kontaktach: $n")
            } else step("Kontakty (odczyt)", false, "brak uprawnienia READ_CONTACTS")
            if (granted("android.permission.READ_CALL_LOG")) {
                val n = context.contentResolver.query(android.provider.CallLog.Calls.CONTENT_URI, arrayOf("_id"), null, null, null)?.use { it.count } ?: -1
                step("Rejestr połączeń (odczyt)", n >= 0, "wpisów: $n")
            } else step("Rejestr połączeń (odczyt)", false, "brak uprawnienia READ_CALL_LOG")
            val prefs = context.getSharedPreferences("telepakt", android.content.Context.MODE_PRIVATE)
            step("Ustawienia lokalne", true, "cisza nocna=${prefs.getBoolean("quiet_enabled", false)} środki włączone=${prefs.getBoolean("telephony_enabled", true)} token=${!prefs.getString("auth_token", "").isNullOrBlank()}")
            if (!blockOk) Unit
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "runNativeSelfTest failed", e)
            step("Autotest natywny", false, "wyjątek: ${e.message}")
        }
        val ret = JSObject()
        ret.put("steps", steps)
        call.resolve(ret)
    }

    /** Ostatnie linie logu TEJ aplikacji (logcat własnego procesu) - do wysłania na serwer przy diagnozie. */
    @PluginMethod
    fun getAppLog(call: PluginCall) {
        try {
            val proc = Runtime.getRuntime().exec(arrayOf("logcat", "-d", "-t", "300", "-v", "time", "--pid=" + android.os.Process.myPid()))
            val text = proc.inputStream.bufferedReader().use { it.readText() }
            val ret = JSObject()
            ret.put("log", text.takeLast(15000))
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Nie udało się odczytać logu aplikacji: ${e.message}")
        }
    }

    /** Uruchamia test połączenia z TelePakt (koszt ok. minuty rozmowy); wynik odczytuje getLiveTestResult. */
    @PluginMethod
    fun startLiveTest(call: PluginCall) {
        pl.telepakt.app.dialer.CallManager.startSoloTest(context)
        call.resolve()
    }

    @PluginMethod
    fun getLiveTestResult(call: PluginCall) {
        val raw = context.getSharedPreferences("telepakt", android.content.Context.MODE_PRIVATE).getString("live_test", null)
        val ret = JSObject()
        ret.put("finished", raw != null)
        if (raw != null) ret.put("result", org.json.JSONObject(raw))
        call.resolve(ret)
    }

    /** Czy TelePakt jest domyślną aplikacją Telefon (wtedy sam łączy 3-way i scala, bez nakładki ani ułatwień dostępu). */
    @PluginMethod
    fun checkDefaultDialer(call: PluginCall) {
        val telecom = context.getSystemService(android.content.Context.TELECOM_SERVICE) as android.telecom.TelecomManager
        val ret = JSObject()
        ret.put("isDefault", telecom.defaultDialerPackage == context.packageName)
        call.resolve(ret)
    }

    /** Pokazuje systemowe okno „Ustawić TelePakt jako domyślną aplikację Telefon?”. Wybór potwierdza użytkownik. */
    @PluginMethod
    fun requestDefaultDialer(call: PluginCall) {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val rm = context.getSystemService(android.content.Context.ROLE_SERVICE) as android.app.role.RoleManager
                if (!rm.isRoleAvailable(android.app.role.RoleManager.ROLE_DIALER)) {
                    call.reject("Ten telefon nie pozwala wybrać innej aplikacji Telefon.")
                    return
                }
                rm.createRequestRoleIntent(android.app.role.RoleManager.ROLE_DIALER)
            } else {
                Intent(android.telecom.TelecomManager.ACTION_CHANGE_DEFAULT_DIALER)
                    .putExtra(android.telecom.TelecomManager.EXTRA_CHANGE_DEFAULT_DIALER_PACKAGE_NAME, context.packageName)
            }
            // Okno wyboru roli MUSI być uruchomione „dla wyniku” - zwykłe startActivity zamyka je od razu, bez śladu.
            startActivityForResult(call, intent, "dialerRoleResult")
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "requestDefaultDialer failed", e)
            call.reject("Nie udało się otworzyć wyboru aplikacji Telefon: ${e.message}")
        }
    }

    @com.getcapacitor.annotation.ActivityCallback
    private fun dialerRoleResult(call: PluginCall?, @Suppress("UNUSED_PARAMETER") result: androidx.activity.result.ActivityResult?) {
        val telecom = context.getSystemService(android.content.Context.TELECOM_SERVICE) as android.telecom.TelecomManager
        val ret = JSObject()
        ret.put("isDefault", telecom.defaultDialerPackage == context.packageName)
        call?.resolve(ret)
    }

    /** Czy włączono usługę automatycznego scalania rozmowy (Ustawienia > Ułatwienia dostępu). */
    @PluginMethod
    fun checkMergeService(call: PluginCall) {
        val ret = JSObject()
        ret.put("enabled", MergeAccessibilityService.isEnabled(context))
        call.resolve(ret)
    }

    /** Etykiety przycisków, które usługa scalania widziała ostatnio w aplikacji Telefon (diagnostyka). */
    @PluginMethod
    fun getDialerLabels(call: PluginCall) {
        val ret = JSObject()
        ret.put("labels", context.getSharedPreferences("telepakt", android.content.Context.MODE_PRIVATE).getString("dialer_labels", "") ?: "")
        call.resolve(ret)
    }

    @PluginMethod
    fun openAccessibilitySettings(call: PluginCall) {
        try {
            context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            call.resolve()
        } catch (e: Exception) {
            android.util.Log.e("TelePakt", "openAccessibilitySettings failed", e)
            call.reject("Nie udało się otworzyć ustawień ułatwień dostępu: ${e.message}")
        }
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
