import React, { useState, useEffect } from 'react';
import {
  X, MessageSquare, Send, Copy, Check, ExternalLink,
  ShieldAlert, Clock, Sparkles, CheckCircle2, AlertTriangle,
  FileText, Smartphone, Hash, Trash2, ArrowRight
} from 'lucide-react';
import {
  PREDEFINED_SMS_TEMPLATES,
  calculateSmsSegments,
  twilioSmsService,
  TWILIO_DEFAULT_SENDER,
  SmsSegmentation
} from '../services/twilioSmsService';
import { PredefinedSmsTemplate, TwilioSmsLog } from '../types';
import confetti from 'canvas-confetti';

interface TwilioSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipient?: string;
  relatedCallId?: string;
  initialTemplateId?: string;
}

export const TwilioSmsModal: React.FC<TwilioSmsModalProps> = ({
  isOpen,
  onClose,
  initialRecipient = '',
  relatedCallId,
  initialTemplateId = 'pke-rodo-full'
}) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [recipient, setRecipient] = useState(initialRecipient);
  const [selectedTemplate, setSelectedTemplate] = useState<PredefinedSmsTemplate | null>(
    PREDEFINED_SMS_TEMPLATES.find((t) => t.id === initialTemplateId) || PREDEFINED_SMS_TEMPLATES[0]
  );
  const [messageBody, setMessageBody] = useState('');
  const [segmentation, setSegmentation] = useState<SmsSegmentation>({
    charCount: 0,
    segmentCount: 1,
    maxCharsPerSegment: 160,
    isGsm7: true
  });

  const [isSending, setIsSending] = useState(false);
  const [sendSuccessLog, setSendSuccessLog] = useState<TwilioSmsLog | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedSid, setCopiedSid] = useState<string | null>(null);
  const [smsHistory, setSmsHistory] = useState<TwilioSmsLog[]>([]);

  // Initialize values when opened or props change
  useEffect(() => {
    if (isOpen) {
      if (initialRecipient) {
        setRecipient(initialRecipient);
      }
      const defaultTpl = PREDEFINED_SMS_TEMPLATES.find((t) => t.id === initialTemplateId) || PREDEFINED_SMS_TEMPLATES[0];
      setSelectedTemplate(defaultTpl);
      setMessageBody(defaultTpl.text);
      setSegmentation(calculateSmsSegments(defaultTpl.text));
      setSendSuccessLog(null);
      setErrorMessage(null);
      loadHistory();
    }
  }, [isOpen, initialRecipient, initialTemplateId]);

  const loadHistory = () => {
    setSmsHistory(twilioSmsService.getSentSmsHistory());
  };

  const handleTextChange = (text: string) => {
    setMessageBody(text);
    setSegmentation(calculateSmsSegments(text));
  };

  const handleSelectTemplate = (tpl: PredefinedSmsTemplate) => {
    setSelectedTemplate(tpl);
    handleTextChange(tpl.text);
  };

  const handleSendViaTwilio = async () => {
    setErrorMessage(null);
    setSendSuccessLog(null);

    const cleanRecipient = recipient.trim();
    if (!cleanRecipient) {
      setErrorMessage('Wpisz numer telefonu telemarketera lub firmy.');
      return;
    }

    if (!messageBody.trim()) {
      setErrorMessage('Wpisz treść wiadomości przed wysłaniem.');
      return;
    }

    setIsSending(true);
    try {
      const log = await twilioSmsService.sendSms(
        cleanRecipient,
        messageBody,
        selectedTemplate?.title || 'Własny sprzeciw',
        relatedCallId
      );
      setSendSuccessLog(log);
      loadHistory();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Nie udało się nadać wiadomości przez Twilio.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageBody);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {}
  };

  const handleCopySid = async (sid: string) => {
    try {
      await navigator.clipboard.writeText(sid);
      setCopiedSid(sid);
      setTimeout(() => setCopiedSid(null), 2000);
    } catch {}
  };

  const handleOpenNativeSms = () => {
    const cleanNumber = recipient.replace(/[^\d+]/g, '');
    const encodedBody = encodeURIComponent(messageBody);
    window.location.href = `sms:${cleanNumber}?body=${encodedBody}`;
  };

  const handleClearHistory = () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić lokalną historię wysłanych wiadomości SMS?')) {
      twilioSmsService.clearSmsHistory();
      loadHistory();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20 shrink-0">
              <MessageSquare className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Wysyłka Sprzeciwu SMS (Twilio)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Twilio API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prawnie wiążące doręczenie oświadczenia woli (art. 77² K.c. • art. 398 PKE)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 pt-2 gap-2 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'compose'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nowa wiadomość</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Rejestr wysłanych ({smsHistory.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'compose' ? (
            <>
              {/* Success Banner if sent */}
              {sendSuccessLog && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>SMS wysłany pomyślnie przez bramkę Twilio!</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
                      STATUS: DELIVERED
                    </span>
                  </div>
                  <div className="font-mono text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Twilio Message SID:</span>
                      <button
                        onClick={() => handleCopySid(sendSuccessLog.messageSid)}
                        className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        title="Kopiuj SID dowodowy"
                      >
                        <span>{sendSuccessLog.messageSid}</span>
                        {copiedSid === sendSuccessLog.messageSid ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Odbiorca:</span>
                      <span className="text-white font-bold">{sendSuccessLog.to}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Nadawca:</span>
                      <span className="text-slate-300">{sendSuccessLog.from}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Czas nadania:</span>
                      <span className="text-slate-300">{sendSuccessLog.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-300/80">
                    Identyfikator SID jest trwałym dowodem doręczenia oświadczenia woli na wypadek skargi do UKE / UODO lub pozwu sądowego.
                  </p>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Recipient Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="sms-recipient-input" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Numer telefonu odbiorcy (telemarketera):</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Bramka: {TWILIO_DEFAULT_SENDER}
                  </span>
                </div>
                <input
                  id="sms-recipient-input"
                  type="tel"
                  placeholder="np. +48 22 104 39 88 lub 500 123 456"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Predefined Templates Quick Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Wybierz gotowy wzorzec prawny sprzeciwu:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Kliknij wzorzec, aby wstawić treść
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PREDEFINED_SMS_TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                            : 'bg-slate-950/70 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                              {tpl.badge}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          </div>
                          <div className="font-bold text-xs text-white pt-0.5">{tpl.title}</div>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 font-sans">
                          {tpl.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Body Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="sms-body-textarea" className="font-bold text-slate-300">
                    Treść wiadomości SMS:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Skopiowano</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Kopiuj</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  id="sms-body-textarea"
                  rows={4}
                  value={messageBody}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Wpisz treść oświadczenia lub sprzeciwu..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans resize-none"
                />

                {/* Character & Segment Counter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Hash className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Znaków: <strong className="text-white">{segmentation.charCount}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Segmentów SMS: <strong className="text-cyan-400">{segmentation.segmentCount}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      segmentation.isGsm7
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {segmentation.isGsm7 ? 'GSM-7 (Standard)' : 'UCS-2 (Polskie znaki: 70 zn./SMS)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-[11px] flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-semibold text-white">Moc prawna wiadomości SMS:</p>
                  <p>
                    Wysłanie sprzeciwu SMS na numer, z którego dzwoniono, stanowi skuteczne doręczenie oświadczenia w formie dokumentowej (art. 77² K.c.). Uniemożliwia telemarketerowi twierdzenie, że &quot;połączenie zostało zerwane&quot;.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Lokalny rejestr wysłanych wiadomości SMS
                </span>
                {smsHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Wyczyść historię</span>
                  </button>
                )}
              </div>

              {smsHistory.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-white">Brak wysłanych wiadomości SMS</p>
                  <p>Gdy wyślesz sprzeciw przez bramkę Twilio, dowód nadania i Message SID pojawią się w tym miejscu.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {smsHistory.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-white">{log.to}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            DELIVERED
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                      </div>

                      <p className="text-slate-300 text-xs bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed font-sans">
                        {log.body}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5">
                          <span>SID:</span>
                          <button
                            onClick={() => handleCopySid(log.messageSid)}
                            className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                            title="Kopiuj SID"
                          >
                            <span>{log.messageSid}</span>
                            {copiedSid === log.messageSid ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span>Segmentów: {log.segmentCount}</span>
                          {log.templateUsed && (
                            <span className="text-indigo-300">Wzorzec: {log.templateUsed}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Native SMS Fallback */}
            <button
              type="button"
              onClick={handleOpenNativeSms}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Otwórz wiadomość w aplikacji Wiadomości/SMS telefonu"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Otwórz w SMS telefonu</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Zamknij
            </button>

            {activeTab === 'compose' && (
              <button
                type="button"
                onClick={handleSendViaTwilio}
                disabled={isSending}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Wysyłanie Twilio...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Wyślij przez Twilio API</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
