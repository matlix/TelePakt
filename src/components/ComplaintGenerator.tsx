import React, { useState } from 'react';
import { CallLog, AppNameOption } from '../types';
import { FileText, Copy, Check, Download, Send, ExternalLink, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

interface ComplaintGeneratorProps {
  appName: AppNameOption;
  initialCall?: CallLog | null;
}

export const ComplaintGenerator: React.FC<ComplaintGeneratorProps> = ({
  appName,
  initialCall,
}) => {
  const [recipient, setRecipient] = useState<'UKE' | 'UODO' | 'UOKIK'>('UKE');
  const [callerNumber, setCallerNumber] = useState(initialCall?.callerNumber || '+48 22 104 39 88');
  const [callDateTime, setCallDateTime] = useState(
    new Date().toLocaleDateString('pl-PL') + ' godz. ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  );
  const [scriptUsed, setScriptUsed] = useState(initialCall?.scriptUsed || 'Pełny sprzeciw RODO i art. 398 PKE');
  const [applicantName, setApplicantName] = useState('Jan Kowalski');
  const [applicantAddress, setApplicantAddress] = useState('ul. Przykładowa 12/4, 00-001 Warszawa');
  const [copied, setCopied] = useState(false);

  const generateComplaintContent = () => {
    if (recipient === 'UKE') {
      return `Miejscowość: Warszawa, data: ${new Date().toLocaleDateString('pl-PL')} r.

Wnioskodawca:
${applicantName}
Adres: ${applicantAddress}
Adres skrytki ePUAP: /JanKowalski/SkrytkaESP

DO:
PREZES URZĘDU KOMUNIKACJI ELEKTRONICZNEJ
ul. Giełdowa 7/9, 01-211 Warszawa
(Doręczenie elektroniczne przez platformę ePUAP / formularz UKE)

ZAWIADOMIENIE O POPEŁNIENIU DELIKTU ADMINISTRACYJNEGO
z art. 398 ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej (PKE)

Działając w imieniu własnym, niniejszym składam formalne zawiadomienie o podejrzeniu naruszenia przez podmiot posługujący się numerem telefonu: ${callerNumber} bezwzględnego zakazu prowadzenia marketingu bezpośredniego bez mojej uprzedniej zgody.

I. OPIS STANU FAKTYCZNEGO
1. W dniu ${callDateTime} na mój numer telefonu zarejestrowano połączenie przychodzące z numeru: ${callerNumber}.
2. Osoba dzwoniąca podjęła próbę przedstawienia niezamówionej oferty marketingowej (telemarketing).
3. Nigdy nie wyraziłem/am uprzedniej, wyraźnej zgody na kontakt w celach marketingu bezpośredniego na ten numer telefonu (naruszenie art. 398 ust. 1 PKE).
4. W trakcie połączenia, przy użyciu systemu ${appName.name}, odtworzono i zarejestrowano formalne oświadczenie prawne: „${scriptUsed}”.
5. Pomimo braku zgody oraz zgłoszenia sprzeciwu, połączenie zostało zrealizowane.

II. PODSTAWA PRAWNA
Zgodnie z art. 398 ust. 1 ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej:
„Używanie telekomunikacyjnych urządzeń końcowych i automatycznych systemów wywołujących dla celów marketingu bezpośredniego lub przesyłania niezamówionej informacji handlowej wymaga uprzedniej zgody abonenta lub użytkownika końcowego.”

Zgodnie z art. 445 ust. 1 pkt 1 PKE podmiot naruszający ten zakaz podlega karze pieniężnej nakładanej przez Prezesa UKE w wysokości do 3% przychodu ukaranego podmiotu osiągniętego w poprzednim roku kalendarzowym lub do 1 000 000 zł.

III. WNIOSKI DOWODOWE
Wnoszę o:
1. Wszczęcie z urzędu postępowania administracyjnego wobec podmiotu korzystającego z numeru ${callerNumber}.
2. Dopuszczenie jako dowodu załączonego nagrania audio rozmowy w formacie cyfrowym dokumentującego fakt połączenia oraz treść zgłoszonego sprzeciwu.
3. Nałożenie na podmiot dopuszczający się naruszenia kary pieniężnej określonej w art. 445 PKE.

Podpis:
${applicantName}
(Podpisano podpisem zaufanym / podpisem kwalifikowanym ePUAP)`;
    } else if (recipient === 'UODO') {
      return `Miejscowość: Warszawa, data: ${new Date().toLocaleDateString('pl-PL')} r.

Skarżący:
${applicantName}
Adres: ${applicantAddress}

DO:
PREZES URZĘDU OCHRONY DANYCH OSOBOWYCH
ul. Stawki 2, 00-193 Warszawa

SKARGA NA NARUSZENIE PRZEPISÓW O OCHRONIE DANYCH OSOBOWYCH (RODO)
Dotyczy: Naruszenie art. 21 ust. 2 i 3 oraz art. 17 ust. 1 Rozporządzenia 2016/679 (RODO)

Niniejszym wnoszę skargę na bezprawne przetwarzanie moich danych osobowych (w postaci numeru telefonu ${applicantAddress}) przez podmiot posługujący się numerem ${callerNumber}.

W dniu ${callDateTime} podczas połączenia wniesiono kategoryczny sprzeciw wobec marketingu bezpośredniego na podstawie art. 21 ust. 2 RODO oraz zażądano usunięcia danych na podstawie art. 17 RODO.
Zgodnie z art. 21 ust. 3 RODO administrator po wniesieniu sprzeciwu nie może już przetwarzać danych w celach marketingu.

Wnoszę o:
1. Przeprowadzenie kontroli legalności pozyskania i przetwarzania moich danych.
2. Nakazanie trwałego usunięcia danych osobowych.
3. Zastosowanie administracyjnej kary pieniężnej na podstawie art. 83 ust. 5 RODO.

Podpis:
${applicantName}`;
    } else {
      return `DO: PREZES URZĘDU OCHRONY KONKURENCJI I KONSUMENTÓW
Plac Powstańców Warszawy 1, 00-950 Warszawa

ZAWIADOMIENIE O STOSOWANIU NIEUCZCIWEJ PRAKTYKI RYNKOWEJ
z art. 7 pkt 4 ustawy o przeciwdziałaniu nieuczciwym praktykom rynkowym

Niniejszym zawiadamiam o stosowaniu przez podmiot operujący numerem ${callerNumber} uciążliwego, niechcianego nagabywania konsumenta drogą telefoniczną w dniu ${callDateTime}.`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateComplaintContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadTxt = () => {
    const text = generateComplaintContent();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Zgloszenie-${recipient}-${callerNumber.replace(/[^0-9]/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <FileText className="w-3.5 h-3.5" />
              Generator Zgłoszeń i Pism Procesowych
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Oficjalne Zawiadomienie o Naruszeniu (ePUAP / UKE / UODO)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Wygeneruj gotowy wniosek ze wskazanym numerem telefonu, czasem rozmowy i powołaniem na nowe <strong>Prawo komunikacji elektronicznej (PKE)</strong>. Wystarczy skopiować i podpisać Profilem Zaufanym w ePUAP.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Parameters */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Wybierz organ i parametry zgłoszenia
            </h3>

            {/* Recipient Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setRecipient('UKE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  recipient === 'UKE'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                UKE (PKE 2024)
              </button>
              <button
                onClick={() => setRecipient('UODO')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  recipient === 'UODO'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                UODO (RODO)
              </button>
              <button
                onClick={() => setRecipient('UOKIK')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  recipient === 'UOKIK'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                UOKiK
              </button>
            </div>

            {/* Input Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Numer dzwoniącego marketera</label>
                <input
                  type="text"
                  value={callerNumber}
                  onChange={(e) => setCallerNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Data i godzina połączenia</label>
                <input
                  type="text"
                  value={callDateTime}
                  onChange={(e) => setCallDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Użyta formuła prawna</label>
                <input
                  type="text"
                  value={scriptUsed}
                  onChange={(e) => setScriptUsed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Imię i nazwisko zgłaszającego</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Adres korespondencyjny</label>
                <input
                  type="text"
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Direct Official Submission Links */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block">Gdzie złożyć pismo w 100% online?</span>
              <div className="space-y-1.5 text-xs">
                <a
                  href="https://epuap.gov.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  <span>Platforma ePUAP (Pismo ogólne)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://uke.gov.pl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  <span>Formularz interwencyjny UKE</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Generated Official Letter Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Podgląd zawiadomienia gotowego do podpisu</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Skopiowano!' : 'Kopiuj treść'}
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Pobierz .txt
                </button>
              </div>
            </div>

            {/* Letter Body */}
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-y-auto max-h-[460px] leading-relaxed select-all">
              {generateComplaintContent()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
