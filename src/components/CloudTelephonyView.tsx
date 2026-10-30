import React, { useState } from 'react';
import { AppNameOption } from '../types';
import { Radio, PhoneForwarded, Clock, CreditCard, Play, Server, CheckCircle2, Copy, Check } from 'lucide-react';

interface CloudTelephonyViewProps {
  appName: AppNameOption;
}

export const CloudTelephonyView: React.FC<CloudTelephonyViewProps> = ({ appName }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/telephony/conference-bridge');
  const [testCaller, setTestCaller] = useState('+48601234567');
  const [simulatedXml, setSimulatedXml] = useState<string | null>(null);
  const [copiedXml, setCopiedXml] = useState(false);

  const handleTestWebhook = () => {
    if (selectedEndpoint === '/api/telephony/conference-bridge') {
      setSimulatedXml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Utworzenie unikalnego pokoju konferencyjnego z polskim numerem bota -->
    <Dial>
        <Conference
            startConferenceOnEnter="true"
            endConferenceOnExit="false"
            record="record-from-start"
            recordingStatusCallback="https://tarczarodo.onrender.com/api/telephony/recording-callback"
            statusCallbackEvent="start end join leave">
            room_CA998877665544
        </Conference>
    </Dial>
</Response>`);
    } else if (selectedEndpoint === '/api/telephony/play-legal-script') {
      setSimulatedXml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Odtworzenie polskiego głosu Amazon Polly Maja Neural -->
    <Say voice="Polly.Maja-Neural" language="pl-PL">
        Dzień dobry. Informuję, że ta rozmowa jest nagrywana. Nie wyraziłem zgody na kontakt marketingowy, a zgodnie z art. 398 ustawy Prawo komunikacji elektronicznej taki kontakt wymaga uprzedniej zgody...
    </Say>
</Response>`);
    } else {
      setSimulatedXml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- Przekierowanie zajętego: odrzucenie spamu i nagranie odpowiedzi -->
    <Say voice="Polly.Jacek-Neural" language="pl-PL">
        Połączyłeś się z rejestratorem sprzeciwów marketingowych. Właściciel tego numeru wniósł bezwzględny sprzeciw z art. 21 RODO oraz art. 398 PKE.
    </Say>
    <Record maxLength="30" playBeep="true" action="/api/telephony/recording-callback" />
    <Hangup/>
</Response>`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Server className="w-3.5 h-3.5" />
              Chmurowa Linia Botowa & Integracja z Twilio
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Dlaczego linia chmurowa (Bot Line) to jedyne działające rozwiązanie?
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Google od Androida 10 zablokował aplikacjom nagrywanie rozmów, a Apple w iOS w ogóle nie pozwala aplikacjom dotykać pasma audio. Zestawienie <strong>konferencji 3-stronnej (3-way conference)</strong> przez polski numer stacjonarny lub komórkowy pozwala legalnie wpuścić bota na linię bez łamania zabezpieczeń telefonu.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: 3-Way Conference */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <PhoneForwarded className="w-5 h-5 text-indigo-400" />
              Model 1: Scalenie do 3-way conference
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Główny tryb
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Dzwoni marketer, Ty odbierasz, a gdy okazuje się, że to spam, wciskasz suwak w {appName.name}. Telefon łączy się z Twoim numerem Twilio, scala rozmowę w ułamku sekundy, a bot wypowiada formułę prawną.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Czas zestawienia (Polska VoLTE):</span>
              <span className="text-emerald-400 font-bold font-mono">2 - 5 sekund</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Android:</span>
              <span className="text-white">Auto-merge (1-kliknięcie w dialerze)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>iPhone (iOS):</span>
              <span className="text-white">Przycisk „Scal rozmowy” na ekranie</span>
            </div>
          </div>
        </div>

        {/* Card 2: Busy Forwarding */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              Model 2: Odrzuć z przekierowaniem (Busy Forward)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Dla natrętnych botów
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Gdy widzisz na ekranie oznaczony spam (np. fotowoltaika), po prostu klikasz „Odrzuć”. Sieć komórkowa przekierowuje zajęty numer do Twojego bota, który natychmiast odtwarza sprzeciw i nagrywa telemarketera.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Twój czas zaangażowania:</span>
              <span className="text-emerald-400 font-bold font-mono">0 sekund (pełna automatyzacja)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Konfiguracja u operatora:</span>
              <span className="text-white">Kod USSD: **67*NUMER_BOTA#</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Obsługa sieci w Polsce:</span>
              <span className="text-white">Play, Orange, T-Mobile, Plus</span>
            </div>
          </div>
        </div>

      </div>

      {/* Cost & Minute Economics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          Koszty infrastruktury i optymalizacja minut (Pakiet 60 minut)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Polski numer telefonu (+48)</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">~4,50 zł / mies.</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Koszt utrzymania polskiego numeru stacjonarnego (DID Warszawa +48 22) na Twilio lub u polskiego operatora SIP. Wymaga standardowej weryfikacji adresu w Polsce.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Taktowanie rozmowy bota</div>
            <div className="text-xl font-bold text-indigo-400 font-mono">0,08 zł / minutę</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Twilio zaokrągla każde połączenie do pełnej minuty w górę. Oświadczenie prawne trwa 34 sekundy, więc każda interwencja kosztuje dokładnie 1 minutę taryfikacyjną.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200">Tryb „Tylko Oświadczenie”</div>
            <div className="text-xl font-bold text-amber-400 font-mono">Oszczędność 80% minut</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Bot rozłącza się ze spotkania po wygłoszeniu oświadczenia RODO. Rozmowa może trwać dalej, ale minuty bota przestają lecieć!
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Webhook Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Symulator Webhooków Twilio / TwiML (Test API na żywo)
          </h3>
          <span className="text-xs text-slate-400">
            Przetestuj generowanie TwiML XML przez FastAPI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Wybierz endpoint FastAPI:</label>
              <select
                value={selectedEndpoint}
                onChange={(e) => {
                  setSelectedEndpoint(e.target.value);
                  setSimulatedXml(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="/api/telephony/conference-bridge">POST /api/telephony/conference-bridge</option>
                <option value="/api/telephony/play-legal-script">POST /api/telephony/play-legal-script</option>
                <option value="/api/telephony/reject-forward-bot">POST /api/telephony/reject-forward-bot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Testowy numer dzwoniący (From):</label>
              <input
                type="text"
                value={testCaller}
                onChange={(e) => setTestCaller(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <button
              onClick={handleTestWebhook}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Wyślij testowy webhook POST
            </button>
          </div>

          <div className="md:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
              <span className="text-xs font-mono text-indigo-400">Odpowiedź TwiML (XML)</span>
              {simulatedXml && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(simulatedXml);
                    setCopiedXml(true);
                    setTimeout(() => setCopiedXml(false), 2000);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedXml ? 'Skopiowano' : 'Kopiuj'}
                </button>
              )}
            </div>

            <pre className="text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre leading-relaxed min-h-[140px]">
              {simulatedXml || 'Kliknij „Wyślij testowy webhook POST”, aby zobaczyć odpowiedź TwiML serwera Python...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
