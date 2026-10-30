import React, { useState } from 'react';
import { PythonCodeFile, AppNameOption } from '../types';
import { PYTHON_PROJECT_FILES } from '../data/pythonProjectFiles';
import { downloadPythonProjectZip } from '../utils/zipExporter';
import {
  Code, Download, Copy, Check, FileCode, Terminal, ExternalLink,
  FolderTree, Shield, CheckCircle2, Cpu, Sparkles, Globe, Server,
  HelpCircle, ArrowRight, BookOpen, Key, Zap, CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PythonProjectExplorerProps {
  appName: AppNameOption;
}

export const PythonProjectExplorer: React.FC<PythonProjectExplorerProps> = ({ appName }) => {
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'gemini_vscode' | 'hostinger_dns' | 'render_deploy'>('code');
  const [selectedFile, setSelectedFile] = useState<PythonCodeFile>(PYTHON_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [copiedDnsField, setCopiedDnsField] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDnsField(fieldId);
    setTimeout(() => setCopiedDnsField(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadPythonProjectZip(appName.id);
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {
      console.error('Error downloading zip:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Download CTA */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-3.5 h-3.5" />
              Python Django 5.x + PostgreSQL
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
              <Globe className="w-3.5 h-3.5" />
              telepakt.pl (Hostinger)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Server className="w-3.5 h-3.5" />
              Render.com Cloud
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Backend Python Django dla TelePakt (telepakt.pl)
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Kompletne środowisko backendowe z obsługą webhooków telefonii Twilio (TwiML), bazą dowodową PostgreSQL, serwerem produkcyjnym Gunicorn, WhiteNoise oraz pełną konfiguracją DNS dla Hostinger.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isDownloading}
          className="shrink-0 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/25 flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Generowanie archiwum ZIP...' : 'Pobierz projekt Django (.ZIP)'}
        </button>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('code')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'code'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          Przeglądarka Kodu Django ({PYTHON_PROJECT_FILES.length} plików)
        </button>

        <button
          onClick={() => setActiveSubTab('gemini_vscode')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'gemini_vscode'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          Gemini w VS Code (Instrukcja)
        </button>

        <button
          onClick={() => setActiveSubTab('hostinger_dns')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'hostinger_dns'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-300" />
          Hostinger DNS: telepakt.pl ➔ Render
        </button>

        <button
          onClick={() => setActiveSubTab('render_deploy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'render_deploy'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Server className="w-4 h-4 text-purple-300" />
          Wdrożenie Render.com (Blueprint)
        </button>
      </div>

      {/* TAB 1: CODE EXPLORER */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: File Tree */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-400" />
                Struktura projektu Django
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {PYTHON_PROJECT_FILES.length} plików
              </span>
            </div>

            <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
              {PYTHON_PROJECT_FILES.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                      <span className="font-mono text-[11px] truncate">{file.path}</span>
                    </div>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-850 text-slate-400'
                    }`}>
                      {file.language}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Run Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs text-slate-400 space-y-2 pt-3">
              <span className="text-white font-semibold flex items-center gap-1.5 text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Uruchomienie lokalne Django (VS Code):
              </span>
              <div className="bg-slate-900 rounded p-2 font-mono text-[10px] text-emerald-300 space-y-1">
                <div>$ python3 -m venv venv</div>
                <div>$ source venv/bin/activate</div>
                <div>$ pip install -r requirements.txt</div>
                <div>$ python manage.py migrate</div>
                <div>$ python manage.py runserver</div>
              </div>
            </div>
          </div>

          {/* Right Column: Code Viewer */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* File Header */}
            <div className="bg-slate-950 border-b border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-white">
                    {selectedFile.path}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedFile.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Skopiowano!' : 'Kopiuj plik'}
                </button>
              </div>
            </div>

            {/* Code Viewer Body */}
            <div className="p-5 bg-slate-950 overflow-x-auto max-h-[600px] overflow-y-auto">
              <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre select-all">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GEMINI CODE ASSIST IN VS CODE */}
      {activeSubTab === 'gemini_vscode' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Tak, istnieje oficjalne rozszerzenie Gemini dla Visual Studio Code!
                </h3>
                <p className="text-xs text-slate-400">
                  Nazywa się <strong>Gemini Code Assist</strong> (wydawca: <em>Google Cloud</em>). Działa bezpośrednio w edytorze VS Code.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1.5">
                  <BookOpen className="w-4 h-4" />
                  Krok 1: Instalacja z Marketplace
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  W VS Code naciśnij <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono">Ctrl+Shift+X</kbd> (Mac: <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono">Cmd+Shift+X</kbd>). Wpisz <strong>Gemini Code Assist</strong> i kliknij <em>Install</em>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1.5">
                  <Key className="w-4 h-4" />
                  Krok 2: Logowanie Google
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Kliknij ikonę Gemini na pasku bocznym po lewej stronie i zaloguj się swoim kontem Google. Dostępny jest bezpłatny poziom (Free Tier) z hojnym limitem zapytań i kodu.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1.5">
                  <Zap className="w-4 h-4" />
                  Krok 3: Analiza całego projektu
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Otwórz rozpakowany folder projektu w VS Code. W czacie Gemini użyj przedrostka <code className="text-cyan-300 font-mono font-bold">@workspace</code>, aby asystent rozumiał całą architekturę Django!
                </p>
              </div>
            </div>

            {/* Prompt Templates for TelePakt */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Przykładowe zapytania do Gemini Code Assist w projekcie TelePakt:
              </h4>

              <div className="space-y-2">
                {[
                  {
                    title: 'Dodanie nowej formuły prawnej dla windykacji',
                    prompt: '@workspace W pliku telephony/views.py dodaj obsługę nowej formuły prawnej dla windykacji terenowej, która po 15 sekundach automatycznie się rozłącza (auto_hangup).'
                  },
                  {
                    title: 'Generowanie testów jednostkowych dla webhooka Twilio',
                    prompt: '@workspace Napisz test jednostkowy w Django (telephony/tests.py) testujący widok twilio_conference_bridge pod kątem poprawnego nagłówka Content-Type: application/xml i znacznika TwiML <Conference>.'
                  },
                  {
                    title: 'Optymalizacja zapytań bazy danych dla panelu Admina',
                    prompt: '@workspace Sprawdź plik telephony/admin.py i telephony/models.py – jak zoptymalizować zapytania do PostgreSQL przy 100 000 zarejestrowanych połączeniach?'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-white block">{item.title}</span>
                      <code className="text-[11px] text-cyan-300 font-mono mt-1 block select-all">
                        {item.prompt}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopyText(item.prompt, `prompt-${idx}`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedDnsField === `prompt-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Kopiuj prompt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOSTINGER DNS SETUP (telepakt.pl -> Render) */}
      {activeSubTab === 'hostinger_dns' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Domena zarejestrowana: telepakt.pl na Hostinger.com
                </span>
                <h3 className="text-lg font-bold text-white">
                  Instrukcja podpięcia domeny telepakt.pl pod serwer Render
                </h3>
                <p className="text-xs text-slate-400">
                  Przekierowanie ruchu z Hostinger hPanel na Anycast IP Render wraz z darmowym certyfikatem SSL Let's Encrypt.
                </p>
              </div>
            </div>

            {/* DNS Records Table */}
            <div className="overflow-x-auto my-6 border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Typ rekordu</th>
                    <th className="px-4 py-3">Nazwa / Host</th>
                    <th className="px-4 py-3">Wskazuje na (Wartość docelowa)</th>
                    <th className="px-4 py-3">TTL</th>
                    <th className="px-4 py-3 text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono text-[11px]">
                  {/* Record A */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-emerald-400 font-bold">A</td>
                    <td className="px-4 py-3 text-white">@ (lub telepakt.pl)</td>
                    <td className="px-4 py-3 text-cyan-300 font-bold">216.24.57.1</td>
                    <td className="px-4 py-3 text-slate-400">300 (lub 14400)</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleCopyText('216.24.57.1', 'dns-a')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDnsField === 'dns-a' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Kopiuj IP
                      </button>
                    </td>
                  </tr>

                  {/* Record CNAME */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-cyan-400 font-bold">CNAME</td>
                    <td className="px-4 py-3 text-white">www</td>
                    <td className="px-4 py-3 text-indigo-300">telepakt-backend.onrender.com</td>
                    <td className="px-4 py-3 text-slate-400">300</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleCopyText('telepakt-backend.onrender.com', 'dns-cname')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDnsField === 'dns-cname' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Kopiuj CNAME
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Step-by-step instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-white font-bold text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
                  W panelu Hostinger (hPanel):
                </span>
                <ol className="list-decimal pl-5 text-[11px] text-slate-400 space-y-1">
                  <li>Zaloguj się na <strong>hpanel.hostinger.com</strong>.</li>
                  <li>Przejdź do: <strong>Domeny</strong> ➔ <strong>telepakt.pl</strong> ➔ <strong>Zarządzaj</strong>.</li>
                  <li>Wybierz <strong>DNS / Serwery nazw</strong> (DNS Zone).</li>
                  <li>Usuń lub edytuj stary rekord A wskazujący na parking Hostinger.</li>
                  <li>Dodaj rekord <strong>A (@ ➔ 216.24.57.1)</strong> oraz <strong>CNAME (www ➔ telepakt-backend.onrender.com)</strong>.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-white font-bold text-xs flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">2</span>
                  W panelu Render.com:
                </span>
                <ol className="list-decimal pl-5 text-[11px] text-slate-400 space-y-1">
                  <li>Wejdź na <strong>dashboard.render.com</strong> do usługi <strong>telepakt-backend</strong>.</li>
                  <li>W zakładce <strong>Settings</strong> przewiń do <strong>Custom Domains</strong>.</li>
                  <li>Kliknij <strong>Add Custom Domain</strong> i wpisz: <code className="text-cyan-300">telepakt.pl</code> oraz <code className="text-cyan-300">www.telepakt.pl</code>.</li>
                  <li>Render zweryfikuje rekordy DNS w ciągu 5-15 minut i automatycznie wygeneruje bezpłatny certyfikat <strong>SSL (HTTPS)</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RENDER 1-CLICK DEPLOY */}
      {activeSubTab === 'render_deploy' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">
              Automatyczne wdrożenie za pomocą Render Blueprint (render.yaml)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Plik <code className="text-indigo-300 font-mono">render.yaml</code> zawarty w projekcie automatycznie definiuje całą architekturę w chmurze Render:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-indigo-400 font-bold text-xs mb-1">Usługa Web Service</div>
                <div className="text-[11px] text-slate-300">Python 3.11 + Gunicorn 22.x z automatycznym restartem i skalowaniem.</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-emerald-400 font-bold text-xs mb-1">Baza PostgreSQL</div>
                <div className="text-[11px] text-slate-300">Dedykowana baza relacyjna dla rejestru dowodów z szyfrowaniem i sumami SHA-256.</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-cyan-400 font-bold text-xs mb-1">Region: Frankfurt</div>
                <div className="text-[11px] text-slate-300">Zapewnia minimalne opóźnienia ping (&lt;20ms) dla połączeń głosowych z Polski.</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white block">
                Kroki publikacji na Render.com w 3 kliknięciach:
              </span>
              <ol className="list-decimal pl-5 text-xs text-slate-300 space-y-2">
                <li>Wrzuć pobrany kod projektu na swoje konto <strong>GitHub</strong> lub <strong>GitLab</strong> (repozytorium prywatne).</li>
                <li>Zaloguj się na <strong>https://render.com</strong> i kliknij <strong>New +</strong> ➔ <strong>Blueprint</strong>.</li>
                <li>Wybierz swoje repozytorium – Render sam odczyta <code className="text-indigo-300 font-mono">render.yaml</code>, uruchomi skrypt <code className="text-indigo-300 font-mono">build.sh</code> i postawi bazę danych!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
