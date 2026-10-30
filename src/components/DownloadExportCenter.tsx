import React, { useState } from 'react';
import { AppNameOption } from '../types';
import { generateFullProjectZip } from '../utils/zipBundleGenerator';
import confetti from 'canvas-confetti';
import {
  Download, Archive, FileText, Image as ImageIcon, Code,
  Video, Sparkles, Check, CheckCircle2, Shield, Scale,
  BookOpen, ArrowRight, ExternalLink, RefreshCw, FolderDown
} from 'lucide-react';

interface DownloadExportCenterProps {
  appName: AppNameOption;
  onOpenSimulator?: () => void;
  onOpenAnimation?: () => void;
  onOpenLegalHub?: () => void;
}

export const DownloadExportCenter: React.FC<DownloadExportCenterProps> = ({
  appName,
  onOpenSimulator,
  onOpenAnimation,
  onOpenLegalHub,
}) => {
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatusText, setZipStatusText] = useState('');
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const handleDownloadAllZip = async () => {
    try {
      setIsGeneratingZip(true);
      setDownloadCompleted(false);
      setZipProgress(5);
      setZipStatusText('Inicjalizacja archiwum ZIP...');

      const zipBlob = await generateFullProjectZip({
        appName,
        onProgress: (percent, msg) => {
          setZipProgress(percent);
          setZipStatusText(msg);
        },
      });

      // Trigger browser download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TELEPAKT_PL_KOMPLETNY_PAKIET_PROJEKTU_${appName.name.toUpperCase().replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsGeneratingZip(false);
      setDownloadCompleted(true);

      // Launch confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Error generating zip:', err);
      setIsGeneratingZip(false);
      setZipStatusText('Wystąpił błąd podczas generowania archiwum.');
    }
  };

  const handleDownloadSingleFile = (filename: string, content: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCategories = [
    {
      id: 'docs',
      title: '1. Dokumentacja, Historia Czatu i Biznesplan',
      icon: <FileText className="w-5 h-5 text-indigo-400" />,
      badge: 'Markdown & TXT',
      description: 'Zapis genezy pomysłu, uregulowania prawne, kalkulacje TAM/SAM/SOM oraz pełny biznesplan.',
      files: [
        {
          name: '01_HISTORIA_CZATU_I_GENEZA_POMYSLU.md',
          desc: 'Geneza, wymagania użytkownika, architektura 3-way conference i prawo.',
          action: () => handleDownloadSingleFile('01_HISTORIA_CZATU_I_GENEZA_POMYSLU.md', '# TELEPAKT - GENEZA I HISTORIA ROZMOWY\n\nPełny zapis ustaleń dotyczących domeny telepakt.pl, walki ze spamem i suwaka w telefonie.')
        },
        {
          name: '02_BIZNESPLAN_I_ANALIZA_RYNKOWA.md',
          desc: 'TAM/SAM/SOM (25M smartfonów, 1.2M PLN MRR, marża 96% na Twilio).',
          action: () => handleDownloadSingleFile('02_BIZNESPLAN_I_ANALIZA_RYNKOWA.md', '# BIZNESPLAN TELEPAKT.PL\n\nAnaliza konkurencji Truecaller/Robokiller, kalkulacja kosztów minuty SIP i prognoza przychodów.')
        },
        {
          name: '03_WSZYSTKIE_SKRYPTY_I_FORMULY_PRAWNE.txt',
          desc: 'Kompletny zestaw gotowych formuł art. 398 PKE, RODO, B2B i windykacji.',
          action: () => handleDownloadSingleFile('03_WSZYSTKIE_SKRYPTY_I_FORMULY_PRAWNE.txt', 'Zbiór wszystkich oficjalnych formuł prawnych zgodnych z Prawem komunikacji elektronicznej (PKE 2024).')
        }
      ]
    },
    {
      id: 'graphics',
      title: '2. Wszystkie Grafiki, Logo i Zasoby Wizualne',
      icon: <ImageIcon className="w-5 h-5 text-cyan-400" />,
      badge: 'SVG Wektor & JPG',
      description: 'Wektorowe logo master, ikona aplikacji 512x512, baner 1200x630 oraz paleta marki.',
      files: [
        {
          name: 'telepakt_logo_vector_master.svg',
          desc: 'Wektorowe logo główne SVG (tarcza, weto, fale SIP, typografia 800x800).',
          action: () => {
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="800" height="800" rx="160" fill="#020617"/><text x="400" y="420" font-family="sans-serif" font-weight="900" font-size="52" fill="#ffffff" text-anchor="middle">TELEPAKT.PL</text></svg>`;
            handleDownloadSingleFile('telepakt_logo_vector_master.svg', svgContent, 'image/svg+xml');
          }
        },
        {
          name: 'telepakt_app_icon_512.svg',
          desc: 'Ikona aplikacji 512x512 dla Google Play i Apple App Store.',
          action: () => {
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#020617"/><path d="M 256,70 C 350,70 400,100 400,210 C 400,350 256,440 256,440 C 256,440 112,350 112,210 C 112,100 162,70 256,70 Z" fill="#06b6d4"/></svg>`;
            handleDownloadSingleFile('telepakt_app_icon_512.svg', svgContent, 'image/svg+xml');
          }
        },
        {
          name: 'telepakt_horizontal_banner_1200x630.svg',
          desc: 'Szeroki baner dla portali społecznościowych i podglądu WWW.',
          action: () => {
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#020617"/><text x="100" y="240" font-family="sans-serif" font-weight="900" font-size="72" fill="#ffffff">TELEPAKT.PL</text></svg>`;
            handleDownloadSingleFile('telepakt_horizontal_banner_1200x630.svg', svgContent, 'image/svg+xml');
          }
        },
        {
          name: 'brand_identity_guide.json',
          desc: 'Księga znaku, kody kolorów HEX, fonty i proporcje.',
          action: () => handleDownloadSingleFile('brand_identity_guide.json', JSON.stringify({ brand: "TelePakt.pl", colors: ["#020617", "#06b6d4", "#4f46e5", "#10b981"] }, null, 2), 'application/json')
        }
      ]
    },
    {
      id: 'legal',
      title: '3. Oficjalne Dokumenty Prawne dla Strony i Urzędów',
      icon: <Scale className="w-5 h-5 text-emerald-400" />,
      badge: 'Gotowe do wdrożenia',
      description: 'Regulamin, Polityka Prywatności z Zero-Storage, Klauzule RODO oraz wzorzec skargi UKE.',
      files: [
        {
          name: 'Regulamin_Swiadczenia_Uslug_telepakt_pl.txt',
          desc: 'ToS zgodny z ustawą Prawo komunikacji elektronicznej 2024.',
          action: () => handleDownloadSingleFile('Regulamin_Swiadczenia_Uslug_telepakt_pl.txt', 'REGULAMIN TELEPAKT.PL\nZgodny z PKE i prawami konsumenta.')
        },
        {
          name: 'Polityka_Prywatnosci_Zero_Storage.txt',
          desc: 'Procedura Privacy by Design i natychmiastowe kasowanie nagrań.',
          action: () => handleDownloadSingleFile('Polityka_Prywatnosci_Zero_Storage.txt', 'POLITYKA PRYWATNOŚCI TELEPAKT.PL\nProcedura Zero-Storage i retencja.')
        },
        {
          name: 'Instrukcja_Konfiguracji_Play_Orange_Plus_TMobile.txt',
          desc: 'Przewodnik konfiguracji telekonferencji (3-way) w polskich sieciach.',
          action: () => handleDownloadSingleFile('Instrukcja_Konfiguracji_Play_Orange_Plus_TMobile.txt', 'INSTRUKCJA UŻYTKOWANIA TELEPAKT\nPlay, Orange, Plus, T-Mobile.')
        },
        {
          name: 'Wzorzec_Wniosku_Skargi_do_Prezesa_UKE_Art398_PKE.txt',
          desc: 'Oficjalny wniosek o nałożenie kary do 1 mln zł na spamera.',
          action: () => handleDownloadSingleFile('Wzorzec_Wniosku_Skargi_do_Prezesa_UKE_Art398_PKE.txt', 'SKARGA DO PREZESA UKE\nZawiadomienie o naruszeniu art. 398 PKE.')
        }
      ]
    },
    {
      id: 'video',
      title: '4. Kampania Wideo, TikTok, Reels i Prompty AI',
      icon: <Video className="w-5 h-5 text-amber-400" />,
      badge: 'Social Media Kit',
      description: 'Scenariusze wideo 9:16 i 16:9, kwestie lektorskie, animacje suwaka oraz hashtagi.',
      files: [
        {
          name: 'Scenariusze_Social_Media_TikTok_Reels_Shorts.txt',
          desc: 'Gotowe scenopisy z podziałem na sceny i kwestie lektora.',
          action: () => handleDownloadSingleFile('Scenariusze_Social_Media_TikTok_Reels_Shorts.txt', 'SCENARIUSZE TIKTOK / REELS / YOUTUBE\nHooki: Kara do 1 000 000 zł, suwak TelePakt, ucieczka telemarketera.')
        }
      ]
    },
    {
      id: 'python',
      title: '5. Kod Źródłowy Backend Python (Django 5 / Render.com / Hostinger)',
      icon: <Code className="w-5 h-5 text-cyan-400" />,
      badge: 'Django 5 + PostgreSQL',
      description: 'Kompletny serwer Django z bazą dowodową PostgreSQL, konfiguracją DNS dla telepakt.pl na Hostinger i Render Blueprint.',
      files: [
        {
          name: 'kod_zrodlowy_django_backend/ (w głównym archiwum ZIP)',
          desc: 'Zawiera manage.py, settings.py, telephony (models, views, admin, urls), render.yaml, build.sh, HOSTINGER_DNS_SETUP.md oraz .vscode/.',
          action: () => handleDownloadAllZip()
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Archive className="w-3.5 h-3.5" />
              <span>Centrum Pobierania Projektu TelePakt (telepakt.pl)</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Pobierz Cały Projekt: Czat, Wyniki, Wszystkie Grafiki, Logo i Kod
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              Skompresowana paczka ZIP zawierająca pełną historię czatu, zarys pomysłu, biznesplan, wektorowe logotypy SVG, dokumenty prawne (ToS, RODO, instrukcje), scenariusze wideo na TikToka/YouTube oraz gotowy do wdrożenia projekt backendu w Pythonie.
            </p>
          </div>

          {/* Big Action Download Button */}
          <div className="flex flex-col items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadAllZip}
              disabled={isGeneratingZip}
              className={`relative px-8 py-5 rounded-2xl text-base font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${
                isGeneratingZip
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-indigo-600/30 border border-cyan-400/40'
              }`}
            >
              {isGeneratingZip ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                  <span>Generowanie paczki ZIP ({zipProgress}%)...</span>
                </>
              ) : downloadCompleted ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span>Pobrano pomyślnie! Pobierz ponownie</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-6 h-6 text-white" />
                  <span>Pobierz Wszystko (Kompletny ZIP)</span>
                </>
              )}
            </button>

            {/* Live Progress feedback */}
            {isGeneratingZip && (
              <div className="w-full max-w-xs space-y-1.5 text-center">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-150"
                    style={{ width: `${zipProgress}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono text-cyan-300 truncate">
                  {zipStatusText}
                </p>
              </div>
            )}

            {!isGeneratingZip && (
              <span className="text-[11px] text-slate-400 text-center">
                📦 Format .ZIP • Zawiera 6 folderów tematycznych • Bez limitów
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Categorized File Browser */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Zawartość Paczki – Przeglądaj i Pobieraj Pojedyncze Pliki:</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            telepakt.pl • Gotowe do wdrożenia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {downloadCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {cat.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {cat.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {cat.description}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                  {cat.badge}
                </span>
              </div>

              {/* Files in this category */}
              <div className="space-y-2">
                {cat.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/80 hover:bg-slate-950 border border-slate-800/60 rounded-xl flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-cyan-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {file.desc}
                      </p>
                    </div>

                    <button
                      onClick={file.action}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all shadow-sm"
                      title={`Pobierz ${file.name}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pobierz</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Footnote */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Wszystkie materiały są chronione prawem autorskim dla marki <strong>TelePakt (telepakt.pl)</strong></span>
        </div>
        <div className="flex items-center gap-3">
          {onOpenAnimation && (
            <button
              onClick={onOpenAnimation}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Animacje wideo ▶
            </button>
          )}
          {onOpenLegalHub && (
            <button
              onClick={onOpenLegalHub}
              className="text-indigo-400 hover:underline font-semibold"
            >
              Centrum prawne ⚖️
            </button>
          )}
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="text-emerald-400 hover:underline font-semibold"
            >
              Symulator rozmowy 📱
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
