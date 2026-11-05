import React, { useState } from 'react';
import { CallLog, AppNameOption, CloudProvider } from '../types';
import {
  ShieldAlert, FileText, CheckCircle2, Play, Pause, Trash2, ArrowRight,
  Download, Cloud, HardDrive, ShieldCheck, Clock, AlertTriangle,
  FolderDown, ExternalLink, RefreshCw, FileCheck2, Info, Lock, Check,
  MessageSquare
} from 'lucide-react';
import { downloadRecordingLocally, downloadEvidenceCertificate, CLOUD_PROVIDERS } from '../utils/audioExporter';
import { CloudExportModal } from './CloudExportModal';
import { TwilioSmsModal } from './TwilioSmsModal';
import confetti from 'canvas-confetti';

interface CallHistoryViewProps {
  appName: AppNameOption;
  calls: CallLog[];
  onOpenComplaint: (call: CallLog) => void;
  onClearCalls?: () => void;
  onUpdateCall?: (updatedCall: CallLog) => void;
}

export const CallHistoryView: React.FC<CallHistoryViewProps> = ({
  appName,
  calls,
  onOpenComplaint,
  onClearCalls,
  onUpdateCall,
}) => {
  const [selectedCallForCloud, setSelectedCallForCloud] = useState<CallLog | null>(null);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [selectedCallForSms, setSelectedCallForSms] = useState<CallLog | null>(null);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'downloaded' | 'cloud' | 'server_deleted'>('all');
  const [autoDeleteAfterDownload, setAutoDeleteAfterDownload] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleDownloadAudio = (call: CallLog) => {
    const res = downloadRecordingLocally(call, appName.name);
    
    // Update call state
    const updated: CallLog = {
      ...call,
      downloadedLocally: true,
      downloadTimestamp: 'Przed chwilą',
      deletedFromServer: autoDeleteAfterDownload ? true : call.deletedFromServer,
      deletedFromServerTimestamp: autoDeleteAfterDownload ? 'Przed chwilą (Zero-Storage)' : call.deletedFromServerTimestamp,
      serverRetentionExpiry: autoDeleteAfterDownload ? 'Trwale wykasowane z serwera' : call.serverRetentionExpiry
    };

    if (onUpdateCall) {
      onUpdateCall(updated);
    }

    if (autoDeleteAfterDownload) {
      showToast(`Pobrano plik ${res.filename} i TRWALE usunięto kopię z serwerów (Zero-Storage).`);
    } else {
      showToast(`Pobrano nagranie audio (${res.sizeKb} KB) na Twoje urządzenie.`);
    }

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 }
    });
  };

  const handleDownloadCertificate = (call: CallLog) => {
    downloadEvidenceCertificate(call, appName.name);
    showToast('Pobrano certyfikowany protokół dowodowy dla UKE / UODO.');
  };

  const handleOpenCloudModal = (call: CallLog) => {
    setSelectedCallForCloud(call);
    setIsCloudModalOpen(true);
  };

  const handleOpenSmsModal = (call: CallLog) => {
    setSelectedCallForSms(call);
    setIsSmsModalOpen(true);
  };

  const handleConfirmCloudSync = (callId: string, provider: CloudProvider, deleteFromServer: boolean) => {
    const targetCall = calls.find(c => c.id === callId);
    if (!targetCall) return;

    const providerName = CLOUD_PROVIDERS.find(p => p.id === provider)?.name || provider;

    const updated: CallLog = {
      ...targetCall,
      cloudSyncedProvider: provider,
      cloudSyncTimestamp: 'Przed chwilą',
      deletedFromServer: deleteFromServer ? true : targetCall.deletedFromServer,
      deletedFromServerTimestamp: deleteFromServer ? 'Przed chwilą (po wysłaniu do chmury)' : targetCall.deletedFromServerTimestamp,
      serverRetentionExpiry: deleteFromServer ? 'Trwale wykasowane z serwera' : targetCall.serverRetentionExpiry
    };

    if (onUpdateCall) {
      onUpdateCall(updated);
    }

    showToast(`Nagranie pomyślnie zsynchronizowane z ${providerName}!`);
  };

  const handleDeleteFromServer = (call: CallLog) => {
    if (!call.downloadedLocally && !call.cloudSyncedProvider) {
      const confirmDelete = window.confirm(
        'Uwaga: To nagranie nie zostało jeszcze zapisane na Twoim telefonie/komputerze ani w chmurze! Czy na pewno chcesz trwale usunąć je z serwera?'
      );
      if (!confirmDelete) return;
    }

    const updated: CallLog = {
      ...call,
      deletedFromServer: true,
      deletedFromServerTimestamp: 'Przed chwilą (Usunięto ręcznie)',
      serverRetentionExpiry: 'Trwale wykasowane z serwera'
    };

    if (onUpdateCall) {
      onUpdateCall(updated);
    }

    showToast('Plik audio został bezpowrotnie usunięty z serwera chmurowego.');
  };

  const filteredCalls = calls.filter(call => {
    if (activeFilter === 'downloaded') return call.downloadedLocally;
    if (activeFilter === 'cloud') return Boolean(call.cloudSyncedProvider);
    if (activeFilter === 'server_deleted') return call.deletedFromServer;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Banner with Server Retention & Privacy Policy */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Rejestr Naruszeń & Baza Dowodowa Audio (Art. 308 K.p.c.)
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Baza Nagrań Dowodowych & Polityka Retencji Danych
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Pobieraj pliki audio bezpośrednio na telefon lub komputer, synchronizuj z <strong>Google Drive / iCloud / Dropbox</strong> – TelePakt realizuje bezwzględną zasadę Zero-Storage (zero nagrań na serwerach centralnych).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              Wszystkich wpisów: {calls.length}
            </span>
          </div>
        </div>

        {/* Zero-Storage Guarantee Policy & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
          
          {/* Zero-Storage Guarantee Box */}
          <div className="lg:col-span-7 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gwarancja Zero-Storage: 0 plików na serwerach {appName.name}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Dla Twojej maksymalnej prywatności TelePakt <strong>nigdy nie przechowuje nagrań na własnych serwerach</strong>. Plik dowodowy trafia wyłącznie do pamięci Twojego telefonu lub na Twój prywatny dysk w chmurze.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-rose-400 block mb-0.5">Natychmiastowy shredding</span>
                <span className="text-slate-400 leading-snug block">
                  Tymczasowy strumień audio węzła telekomunikacyjnego jest bezpowrotnie niszczony po zakończeniu połączenia.
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">Tylko Twoja własność</span>
                <span className="text-slate-400 leading-snug block">
                  Zapis w telefonie lub na Twoim koncie Google Drive / iCloud / Dropbox. Nikt poza Tobą nie ma dostępu.
                </span>
              </div>
            </div>
          </div>

          {/* Zero-Storage Status Box */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-gradient-to-br from-emerald-950/25 via-slate-950 to-slate-950 border border-emerald-500/30 text-xs flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Tryb Zero-Storage (Brak śladu)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ZAWSZE AKTYWNY
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Pliki audio i protokoły dowodowe istnieją <strong>wyłącznie na Twoim urządzeniu lub w Twojej prywatnej chmurze</strong>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Brak centralnego przechowywania danych przez TelePakt</span>
            </div>
          </div>

        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Wszystkie ({calls.length})
          </button>
          <button
            onClick={() => setActiveFilter('downloaded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'downloaded'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Pobrane na telefon / PC ({calls.filter(c => c.downloadedLocally).length})
          </button>
          <button
            onClick={() => setActiveFilter('cloud')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'cloud'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            W chmurze klienta (Google Drive / itp.) ({calls.filter(c => c.cloudSyncedProvider).length})
          </button>
          <button
            onClick={() => setActiveFilter('server_deleted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'server_deleted'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Zero-Storage (Prywatne) ({calls.filter(c => c.deletedFromServer).length})
          </button>
        </div>

      </div>

      {/* Calls List */}
      <div className="space-y-3">
        {filteredCalls.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            Brak nagrań spełniających wybrane kryterium filtra.
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div
              key={call.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                call.deletedFromServer
                  ? 'bg-slate-900/60 border-slate-800/80'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Call Details */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white font-mono text-base tracking-tight">
                    {call.callerNumber}
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    call.spamRisk === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {call.spamCategory}
                  </span>

                  {/* Status badges */}
                  {call.downloadedLocally && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      Zapisano w telefonie
                    </span>
                  )}

                  {call.cloudSyncedProvider && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      Kopia w chmurze: {CLOUD_PROVIDERS.find(p => p.id === call.cloudSyncedProvider)?.name || 'Chmura'}
                    </span>
                  )}

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Zero-Storage: Tylko u Ciebie
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  {call.callerName} • <span className="text-slate-300">{call.timestamp}</span> • Czas nagrania: <strong>{call.durationSeconds}s</strong>
                </p>

                <div className="text-[11px] text-indigo-300 flex flex-wrap items-center gap-2 pt-0.5">
                  <span>Wygłoszona formuła: <strong>{call.scriptUsed}</strong></span>
                  <span>•</span>
                  <span>Czas bota: <strong>{call.botConnectedSeconds}s</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                
                {/* Download Audio Button */}
                <button
                  onClick={() => handleDownloadAudio(call)}
                  title="Pobierz plik audio WAV na komputer lub telefon"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 hover:border-slate-600 transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pobierz na urządzenie</span>
                </button>

                {/* Cloud Sync Button */}
                <button
                  onClick={() => handleOpenCloudModal(call)}
                  title="Prześlij do Google Drive, Dropbox, OneDrive lub Nextcloud"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-indigo-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 hover:border-indigo-500/40 transition-all active:scale-95"
                >
                  <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Wyślij do chmury</span>
                </button>

                {/* Evidence Certificate TXT */}
                <button
                  onClick={() => handleDownloadCertificate(call)}
                  title="Pobierz protokół zabezpieczenia dowodu dla UKE/Sądu"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
                >
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                </button>

                {/* Delete from server if still hosted */}
                {!call.deletedFromServer && (
                  <button
                    onClick={() => handleDeleteFromServer(call)}
                    title="Trwale usuń kopię z serwera (zwolnij chmurę)"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                )}

                {/* Send Twilio SMS Objection */}
                <button
                  onClick={() => handleOpenSmsModal(call)}
                  title="Wyślij formalny sprzeciw SMS (Twilio) z art. 398 PKE / RODO"
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-cyan-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 hover:border-cyan-500/40 transition-all active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sprzeciw SMS</span>
                </button>

                {/* Open UKE/UODO complaint */}
                <button
                  onClick={() => onOpenComplaint(call)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Skarga UKE</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Cloud Export Modal */}
      <CloudExportModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        call={selectedCallForCloud}
        brandName={appName.name}
        onConfirmSync={handleConfirmCloudSync}
      />

      {/* Twilio SMS Modal */}
      <TwilioSmsModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        initialRecipient={selectedCallForSms?.callerNumber || ''}
        relatedCallId={selectedCallForSms?.id}
        initialTemplateId="pke-rodo-full"
      />

    </div>
  );
};
