import React, { useState } from 'react';
import {
  Download, Smartphone, Shield, CheckCircle2, AlertTriangle, Play,
  Volume2, ExternalLink, X, Copy, Check, Terminal, FileCode, Layers, Info
} from 'lucide-react';
import { NativeOverlayBridge } from '../services/nativeOverlayBridge';
import { PolishVoiceSynthesizer } from '../utils/speech';

interface AndroidOverlayTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp?: () => void;
}

export const AndroidOverlayTestModal: React.FC<AndroidOverlayTestModalProps> = ({
  isOpen,
  onClose,
  onOpenApp,
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'simulate' | 'code'>('download');
  const [sliderVal, setSliderVal] = useState(0);
  const [isWetoFired, setIsWetoFired] = useState(false);
  const [speechPlaying, setSpeechPlaying] = useState(false);
  const [copiedApkUrl, setCopiedApkUrl] = useState(false);

  if (!isOpen) return null;

  const apkUrl = `${window.location.origin}/telepakt.apk`;

  const handleCopyApkUrl = () => {
    navigator.clipboard.writeText(apkUrl);
    setCopiedApkUrl(true);
    setTimeout(() => setCopiedApkUrl(false), 2500);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderVal(val);
    if (val >= 90 && !isWetoFired) {
      triggerWeto();
    }
  };

  const triggerWeto = () => {
    setIsWetoFired(true);
    setSpeechPlaying(true);

    if (PolishVoiceSynthesizer.isSupported()) {
      PolishVoiceSynthesizer.speak(
        'Uwaga telemarketerze. Na podstawie artykułu 398 Prawa komunikacji elektronicznej oraz artykułu 21 RODO oświadczam, że zgłaszam bezwzględny sprzeciw wobec marketingu bezpośredniego. Żądam natychmiastowego usunięcia mojego numeru z Państwa bazy i zaprzestania połączeń W razie dalszych połączeń zgłoszę sprawę Prezesowi Urzędu Komunikacji Elektronicznej.',
        { onEnd: () => setSpeechPlaying(false), onError: () => setSpeechPlaying(false) }
      );
    } else {
      setTimeout(() => setSpeechPlaying(false), 4000);
    }
  };

  const resetSlider = () => {
    setSliderVal(0);
    setIsWetoFired(false);
    PolishVoiceSynthesizer.stop();
    setSpeechPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Natywny Wrapper Android (.APK)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Capacitor + Kotlin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pływający suwak (WindowManager Overlay) wyzwalający sprzeciw art. 398 PKE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'download'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Pobierz plik .APK i Instalacja</span>
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'simulate'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Symulator Pływającego Suwaka</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'code'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Kod Źródłowy Kotlin (Overlay)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 flex-1">
          {activeTab === 'download' && (
            <div className="space-y-6">
              
              {/* Highlight Download Box */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
                      Oficjalny pakiet instalacyjny Android
                    </span>
                    <h3 className="text-base font-black text-white">TelePakt Android APK (Gotowy do instalacji)</h3>
                    <p className="text-xs text-slate-300">
                      Zawiera natywne serwisy: <code className="text-cyan-300">CallOverlayService.kt</code>, <code className="text-cyan-300">CallReceiver.kt</code> oraz mostek nakładki WindowManager.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <a
                      href="https://github.com/matlix/TelePakt/releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                    >
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>Pobierz z GitHub Releases</span>
                    </a>

                    <a
                      href="/telepakt.apk"
                      download="telepakt.apk"
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Lokalny .APK</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyApkUrl}
                      className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                      title="Skopiuj link do pobrania na telefon"
                    >
                      {copiedApkUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedApkUrl ? 'Skopiowano!' : 'Kopiuj'}</span>
                    </button>
                  </div>
                </div>

                {/* Parsing Issue Troubleshooting Card */}
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200/90 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Komunikat „Problem parsing the package” na Android 13 (np. Ulefone Armor)?</span>
                  </div>
                  $${1}Najczęstsze przyczyny: plik pobrał się niekompletnie (pobierz go ponownie, najlepiej przez Wi-Fi), na telefonie jest już zainstalowana starsza wersja podpisana innym kluczem (odinstaluj ją i zainstaluj ponownie) albo telefon ma Androida starszego niż 7.0. Plik pobieraj zawsze z tej strony.$${2}
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 font-mono break-all flex items-center justify-between gap-2">
                  <span>Repozytorium GitHub z kodem źródłowym: <strong className="text-cyan-300">https://github.com/matlix/TelePakt</strong></span>
                </div>
              </div>

              {/* 3 Steps Guide */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Instrukcja uruchomienia na telefonie z Androidem (3 proste kroki):
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 min-w-0 overflow-hidden">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                      1
                    </div>
                    <strong className="text-white block break-words">Zezwól na instalację</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed break-words">
                      Pobierz plik <code className="text-cyan-300 break-all">telepakt.apk</code> na telefon. W ustawieniach przeglądarki Chrome/Samsung zezwól na instalację z tego źródła.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 min-w-0 overflow-hidden">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <strong className="text-white block break-words">Włącz uprawnienie nakładki</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed break-words">
                      Po otwarciu aplikacji kliknij przycisk żądania nakładki lub wejdź w: <br />
                      <em className="break-words">Ustawienia ➔ Aplikacje ➔ TelePakt ➔ Wyświetlaj nad innymi aplikacjami (Włącz)</em>.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 min-w-0 overflow-hidden">
                    <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                      3
                    </div>
                    <strong className="text-white block break-words">Zadzwoń lub odbierz test</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed break-words">
                      Gdy zadzwoni telefon, <code className="text-cyan-300 break-all">CallReceiver</code> wykryje stan dzwonienia i <code className="text-cyan-300 break-all">WindowManager</code> natychmiast wyświetli pływający suwak nad ekranem połączenia!
                    </p>
                  </div>
                </div>
              </div>

              {/* Note on Google Play / Store verification */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200 overflow-hidden">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 min-w-0 flex-1 overflow-hidden">
                  <strong className="text-white block text-xs sm:text-sm font-bold break-words">
                    Jak to działa w Androidzie od wersji 8.0 do 14/15?
                  </strong>
                  <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs break-words">
                    Google Android pozwala legalnym aplikacjom na wyświetlanie widoków systemowych typu{' '}
                    <code className="text-cyan-300 font-mono text-[10px] sm:text-xs px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700/60 break-all inline">
                      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    </code>
                    . Wymaga to jednorazowego przełączenia suwaka przez użytkownika w Ustawieniach telefonu. Kod TelePakt sam przenosi użytkownika prosto do tego ekranu systemowego.
                  </p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'simulate' && (
            <div className="space-y-6">
              
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">
                  Podgląd działania nakładki (Floating Slider)
                </span>
                <h3 className="text-base font-black text-white">
                  Tak wygląda pływający suwak podczas przychodzącego połączenia:
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Przesuń suwak w prawo, aby zasymulować natychmiastowe wygłoszenie formuły prawnej z art. 398 PKE.
                </p>
              </div>

              {/* Mockup Phone Frame */}
              <div className="max-w-sm mx-auto p-4 rounded-3xl bg-slate-950 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
                
                {/* Fake System Calling Screen */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400 animate-pulse">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                      Połączenie przychodzące
                    </span>
                    <strong className="text-sm text-white block">+48 22 000 00 88</strong>
                    <span className="text-[11px] text-slate-400">Prawdopodobnie: Telemarketing / Call Center</span>
                  </div>
                </div>

                {/* The Floating Overlay Card (Rendered on top like Android WindowManager) */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-950/95 border-2 border-cyan-400/80 shadow-2xl shadow-cyan-500/20 space-y-3 relative backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>TelePakt Floating Tarcza</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 font-bold">
                      SYSTEM OVERLAY
                    </span>
                  </div>

                  {isWetoFired ? (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Weto Prawne PKE Zgłoszone!</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Formuła art. 398 PKE została odtworzona do mikrofonu rozmowy.
                      </p>
                      {speechPlaying && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold animate-pulse">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Głos asystenta aktywny...</span>
                        </div>
                      )}
                      <div>
                        <button
                          type="button"
                          onClick={resetSlider}
                          className="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold cursor-pointer"
                        >
                          Zresetuj suwak do ponownego testu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Przesuń suwak w prawo, aby odciąć telemarketera i wygłosić prawny zakaz art. 398 PKE:
                      </p>

                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderVal}
                          onChange={handleSliderChange}
                          className="w-full h-11 bg-slate-900 rounded-full appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
                        />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[11px] font-bold text-slate-400">
                          {sliderVal < 20 ? '➔ Przesuń aby zgłosić weto ➔' : `Wyzwalanie (${sliderVal}%)`}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 text-center">
                    Okienko pływające można przesuwać palcem w dowolne miejsce ekranu telefonu.
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">
                  Implementacja w Kotlin Android
                </span>
                <h3 className="text-sm font-bold text-white">
                  Plik: android/app/src/main/java/pl/telepakt/app/overlay/CallOverlayService.kt (~115 linii)
                </h3>
                <p className="text-xs text-slate-400">
                  Poniższy kod zarządza instancją <code className="text-cyan-300">WindowManager</code>, parametrami <code className="text-cyan-300">TYPE_APPLICATION_OVERLAY</code> oraz gestami dotykowymi suwaka.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[350px]">
                <pre>{`// android/app/src/main/java/pl/telepakt/app/overlay/CallOverlayService.kt
package pl.telepakt.app.overlay

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.SeekBar
import android.widget.TextView

class CallOverlayService : Service() {
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val phoneNumber = intent?.getStringExtra("phoneNumber") ?: "Nieznany"
        showOverlay(phoneNumber)
        return START_STICKY
    }

    private fun showOverlay(phoneNumber: String) {
        if (overlayView != null) return

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            y = 120
        }

        // Dynamically inflate floating slider layout
        // On slider progress == 100 -> trigger Art. 398 PKE Legal Weto TTS
        windowManager?.addView(overlayView, params)
    }

    override fun onDestroy() {
        super.onDestroy()
        if (overlayView != null) {
            windowManager?.removeView(overlayView)
            overlayView = null
        }
    }
}`}</pre>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Wszystkie pliki źródłowe Kotlin są dostępne w repozytorium projektu w katalogu <code className="text-cyan-300">/android</code>.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Zgodne z Android 8.0 - Android 14/15 (Google API 26-35)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="/telepakt.apk"
              download="telepakt.apk"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-center transition-colors"
            >
              Pobierz .APK (3.6 MB)
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
