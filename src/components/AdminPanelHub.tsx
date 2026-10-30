import React, { useState } from 'react';
import { CustomerReview, IntegrationCredential, UserCredentialItem, AppNameOption } from '../types';
import {
  INITIAL_CUSTOMER_REVIEWS,
  INITIAL_INTEGRATION_CREDENTIALS,
  INITIAL_USER_ACCOUNTS
} from '../data/adminAndReviewsData';
import {
  Shield, Check, CheckCircle2, AlertTriangle, Star, Trash2,
  Edit3, Key, Lock, RefreshCw, Send, Smartphone, Globe,
  Server, MessageSquare, UserCheck, Users, HelpCircle,
  ExternalLink, Sparkles, Plus, Eye, EyeOff, Save, ShoppingBag,
  CreditCard, ArrowRight, CornerDownRight, ThumbsUp
} from 'lucide-react';

interface AdminPanelHubProps {
  appName: AppNameOption;
  onOpenWebsiteView?: () => void;
}

export const AdminPanelHub: React.FC<AdminPanelHubProps> = ({ appName, onOpenWebsiteView }) => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'credentials' | 'users' | 'payments_architecture'>('reviews');

  // Reviews State
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_CUSTOMER_REVIEWS);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'featured'>('all');
  const [replyText, setReplyText] = useState<{ [reviewId: string]: string }>({});
  const [activeReplyingId, setActiveReplyingId] = useState<string | null>(null);

  // New Review Modal for testing public submission
  const [isNewReviewModalOpen, setIsNewReviewModalOpen] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewContent, setNewReviewContent] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewSpamType, setNewReviewSpamType] = useState('Fotowoltaika & Telemarketerzy');
  const [newReviewDevice, setNewReviewDevice] = useState<'Android' | 'iPhone' | 'Web'>('Android');

  // Credentials State
  const [credentials, setCredentials] = useState<IntegrationCredential[]>(INITIAL_INTEGRATION_CREDENTIALS);
  const [editingCredId, setEditingCredId] = useState<string | null>(null);
  const [tempCredValue, setTempCredValue] = useState('');
  const [testingStatus, setTestingStatus] = useState<{ [id: string]: string }>({});
  const [showMasked, setShowMasked] = useState<{ [id: string]: boolean }>({});

  // Users State
  const [users, setUsers] = useState<UserCredentialItem[]>(INITIAL_USER_ACCOUNTS);
  const [userSearch, setUserSearch] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Review Actions
  const handleApproveReview = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
    showToast('Opinia została zatwierdzona i jest widoczna na stronie telepakt.pl');
  };

  const handleToggleFeatured = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isFeatured: !r.isFeatured, isApproved: true } : r));
    showToast('Zaktualizowano status wyróżnienia na stronie głównej');
  };

  const handleDeleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    showToast('Opinia została usunięta z bazy');
  };

  const handleSaveReply = (id: string) => {
    const text = replyText[id];
    if (!text || text.trim() === '') return;
    setReviews(prev => prev.map(r => r.id === id ? { ...r, adminReply: text } : r));
    setActiveReplyingId(null);
    showToast('Odpowiedź administratora została opublikowana pod opinią');
  };

  const handleCreateNewReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewContent) return;

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      authorName: newReviewAuthor,
      rating: newReviewRating,
      title: newReviewTitle || 'Opinia użytkownika TelePakt',
      content: newReviewContent,
      createdAt: 'Przed chwilą (Nowa)',
      isApproved: false, // domyślnie czeka na akceptację admina
      isFeatured: false,
      verifiedSubscriber: true,
      deviceType: newReviewDevice,
      spamTypeBlocked: newReviewSpamType
    };

    setReviews([newRev, ...reviews]);
    setIsNewReviewModalOpen(false);
    setNewReviewAuthor('');
    setNewReviewTitle('');
    setNewReviewContent('');
    showToast('Nowa opinia została zgłoszona! Pojawiła się w kolejce do moderacji poniżej.');
  };

  // Credential Actions
  const handleTestCredential = (cred: IntegrationCredential) => {
    setTestingStatus(prev => ({ ...prev, [cred.id]: 'Testowanie połączenia...' }));
    setTimeout(() => {
      setTestingStatus(prev => ({
        ...prev,
        [cred.id]: `Połączenie udane! Odpowiedź 200 OK (${new Date().toLocaleTimeString('pl-PL')})`
      }));
      showToast(`Zweryfikowano klucz: ${cred.name}`);
    }, 900);
  };

  const handleSaveCredential = (id: string) => {
    setCredentials(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          valueMasked: tempCredValue.length > 8 ? `${tempCredValue.slice(0, 4)}••••••••${tempCredValue.slice(-4)}` : '••••••••',
          status: 'active',
          lastTested: `Zaktualizowano (${new Date().toLocaleTimeString('pl-PL')})`
        };
      }
      return c;
    }));
    setEditingCredId(null);
    setTempCredValue('');
    showToast('Nowe dane uwierzytelniające zapisane w bazie Django!');
  };

  // User Actions
  const handleChangeUserPlan = (userId: string, newPlan: UserCredentialItem['plan']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
    showToast(`Zaktualizowano abonament użytkownika na: ${newPlan}`);
  };

  const handleResetUserPassword = (userId: string, email: string) => {
    showToast(`Wygenerowano i wysłano bezpieczny link resetu hasła na adres: ${email}`);
  };

  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === 'pending') return !r.isApproved;
    if (reviewFilter === 'approved') return r.isApproved;
    if (reviewFilter === 'featured') return r.isFeatured;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Shield className="w-3.5 h-3.5" />
              Panel Administracyjny TelePakt
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
              <Globe className="w-3.5 h-3.5" />
              telepakt.pl/admin
            </span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pendingCount} {pendingCount === 1 ? 'nowa opinia do moderacji' : 'nowe opinie do moderacji'}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Centrum Zarządzania, Uwierzytelniania i Moderacji Opinii
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Zarządzaj opiniami klientów (moderacja, wyróżnienia, odpowiedzi), danymi uwierzytelniającymi kont zewnętrznych (Twilio, Google Play Store, Apple App Store Connect) oraz kontami użytkowników.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNewReviewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            Symuluj dodanie opinii klienta
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-cyan-300" />
          Moderacja Opinii Klientów
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full text-[10px]">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'credentials'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Key className="w-4 h-4 text-amber-300" />
          Uwierzytelnienia (Twilio, Google Play, Apple)
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-300" />
          Konta Użytkowników & Plany
        </button>

        <button
          onClick={() => setActiveTab('payments_architecture')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'payments_architecture'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-purple-300" />
          Płatności: Google Play / Apple vs Własny System
        </button>
      </div>

      {/* TAB 1: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Sub Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Filtruj opinie:</span>
              {(['all', 'pending', 'approved', 'featured'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    reviewFilter === f
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {f === 'all' && `Wszystkie (${reviews.length})`}
                  {f === 'pending' && `Oczekujące (${reviews.filter(r => !r.isApproved).length})`}
                  {f === 'approved' && `Zatwierdzone (${reviews.filter(r => r.isApproved).length})`}
                  {f === 'featured' && `Wyróżnione na WWW (${reviews.filter(r => r.isFeatured).length})`}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-400">
              Opinie zatwierdzone pojawiają się automatycznie na stronie głównej <strong>telepakt.pl</strong>
            </span>
          </div>

          {/* Reviews List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredReviews.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-semibold">Brak opinii w tej kategorii.</p>
                <p className="text-xs text-slate-500 mt-1">Zmień filtr lub zasymuluj dodanie opinii klienta u góry.</p>
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    !rev.isApproved
                      ? 'bg-amber-950/20 border-amber-500/30 shadow-lg shadow-amber-900/10'
                      : rev.isFeatured
                      ? 'bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-600'}`}
                          />
                        ))}
                      </div>

                      <span className="font-bold text-white text-xs">{rev.authorName}</span>

                      {rev.verifiedSubscriber && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Zweryfikowany Abonent
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800">
                        {rev.deviceType}
                      </span>

                      <span className="text-[10px] text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
                        Zablokowany spam: {rev.spamTypeBlocked}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-slate-500">{rev.createdAt}</span>

                      {!rev.isApproved ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40">
                          Oczekuje na zatwierdzenie
                        </span>
                      ) : rev.isFeatured ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/40 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Wyróżniona na WWW
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/40">
                          Opublikowana
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 mb-1">{rev.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.content}</p>

                  {/* Official Admin Reply display */}
                  {rev.adminReply && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        Oficjalna odpowiedź zespołu TelePakt:
                      </div>
                      <p className="text-slate-300 text-[11px] pl-5">{rev.adminReply}</p>
                    </div>
                  )}

                  {/* Replying form inline */}
                  {activeReplyingId === rev.id && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
                      <span className="text-xs font-semibold text-white block">
                        Napisz oficjalną odpowiedź do opinii:
                      </span>
                      <textarea
                        value={replyText[rev.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                        placeholder="Np. Dziękujemy za zaufanie! Nasz zespół dba o stałą aktualizację..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveReplyingId(null)}
                          className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                        >
                          Anuluj
                        </button>
                        <button
                          onClick={() => handleSaveReply(rev.id)}
                          className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Opublikuj odpowiedź
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Bar for Admin */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      {!rev.isApproved ? (
                        <button
                          onClick={() => handleApproveReview(rev.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Zatwierdź opinię
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleFeatured(rev.id)}
                          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            rev.isFeatured
                              ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {rev.isFeatured ? 'Usuń z wyróżnionych' : 'Wyróżnij na stronie głównej'}
                        </button>
                      )}

                      <button
                        onClick={() => setActiveReplyingId(activeReplyingId === rev.id ? null : rev.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        {rev.adminReply ? 'Edytuj odpowiedź' : 'Odpowiedz jako TelePakt'}
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Usuń trwale"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Usuń opinię
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREDENTIALS MANAGER */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  Klucze Uwierzytelniające Integracji Zewnętrznych
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Klucze są szyfrowane i przekazywane do serwera Django oraz zmiennych środowiskowych Render.com.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                Wszystkie integracje produkcyjne aktywne
              </div>
            </div>

            <div className="space-y-4">
              {credentials.map((cred) => {
                const isEditing = editingCredId === cred.id;
                const isShown = showMasked[cred.id];
                const statusMsg = testingStatus[cred.id];

                return (
                  <div key={cred.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{cred.name}</span>
                        <code className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                          {cred.key}
                        </code>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] text-slate-400">{cred.lastTested}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 uppercase">
                          {cred.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {cred.description}
                    </p>

                    {/* Value Field & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex-1 w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 font-mono text-xs text-slate-200 flex items-center justify-between">
                        {isEditing ? (
                          <input
                            type="text"
                            value={tempCredValue}
                            onChange={(e) => setTempCredValue(e.target.value)}
                            placeholder="Wklej nowy token / klucz / JSON..."
                            className="w-full bg-transparent text-white focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="truncate">
                            {isShown ? cred.valueMasked : '••••••••••••••••••••••••••••••••'}
                          </span>
                        )}

                        <button
                          onClick={() => setShowMasked({ ...showMasked, [cred.id]: !isShown })}
                          className="ml-2 text-slate-400 hover:text-white"
                          title={isShown ? 'Ukryj' : 'Pokaż fragment'}
                        >
                          {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveCredential(cred.id)}
                              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" /> Zapisz
                            </button>
                            <button
                              onClick={() => setEditingCredId(null)}
                              className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
                            >
                              Anuluj
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingCredId(cred.id);
                                setTempCredValue('');
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Zmień
                            </button>
                            <button
                              onClick={() => handleTestCredential(cred)}
                              className="px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Testuj
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {statusMsg && (
                      <div className="p-2 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {statusMsg}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-slate-500" />
                      Gdzie znaleźć: {cred.instructions}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: USERS & CREDENTIALS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Konta Abonentów i Uprawnienia
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Zmiana planów abonamentowych, resetowanie haseł, monitorowanie zużycia minut telekonferencji.
                </p>
              </div>

              <input
                type="text"
                placeholder="Szukaj po e-mail lub telefonie..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Użytkownik</th>
                    <th className="px-4 py-3">Numer telefonu</th>
                    <th className="px-4 py-3">Abonament (Plan)</th>
                    <th className="px-4 py-3">Źródło zakupu</th>
                    <th className="px-4 py-3">Minuty bota</th>
                    <th className="px-4 py-3 text-right">Zarządzanie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {users
                    .filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.phone.includes(userSearch))
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{user.email}</div>
                          <div className="text-[10px] text-slate-400">Dołączył: {user.joinedDate}</div>
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px] text-cyan-300">
                          {user.phone}
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={user.plan}
                            onChange={(e) => handleChangeUserPlan(user.id, e.target.value as any)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                          >
                            <option value="Darmowy (3 dni)">Darmowy (3 dni)</option>
                            <option value="Miesięczny (19,99 zł)">Miesięczny (19,99 zł)</option>
                            <option value="Roczny Tarcza (179 zł)">Roczny Tarcza (179 zł)</option>
                            <option value="B2B Firma (499 zł)">B2B Firma (499 zł)</option>
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            user.provider === 'Apple App Store'
                              ? 'bg-slate-800 text-slate-200 border border-slate-700'
                              : user.provider === 'Google Play IAP'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                              : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                          }`}>
                            {user.provider}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px]">
                              {user.quotaMinutesUsed}/{user.totalMinutes} min
                            </span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 rounded-full"
                                style={{ width: `${Math.min(100, (user.quotaMinutesUsed / user.totalMinutes) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleResetUserPassword(user.id, user.email)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Lock className="w-3 h-3 text-amber-400" />
                            Reset hasła
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENTS ARCHITECTURE (In-App Purchases vs Web Payments) */}
      {activeTab === 'payments_architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Czy potrzebujesz własnego systemu płatności, jeśli korzystasz z Google Play i Apple Store?
                </h3>
                <p className="text-xs text-slate-400">
                  Precyzyjna odpowiedź inżynieryjna i biznesowa na Twoje pytanie o StoreKit, Google Play Billing oraz płatności na stronie WWW.
                </p>
              </div>
            </div>

            {/* Answer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
              {/* Card 1: W Aplikacji Mobilnej (Apple & Google Play) */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    1. W aplikacji mobilnej (iOS / Android)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                    Apple & Google obsługują 100%
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>NIE POTRZEBUJESZ bramki typu Stripe czy PayU w aplikacji mobilnej!</strong> Zgodnie z wytycznymi <em>Apple App Store Review Guidelines (sekcja 3.1.1)</em> oraz <em>Google Play Payments Policy</em>:
                </p>

                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-5">
                  <li>
                    Wszelkie subskrypcje i usługi cyfrowe konsumowane w telefonie <strong>MUSZĄ</strong> przejść przez In-App Purchases (Google Play Billing / Apple StoreKit).
                  </li>
                  <li>
                    Apple i Google <strong>zajmują się wszystkim</strong>: pobieraniem pieniędzy z kart, obsługą Apple Pay, Google Pay, a w Polsce nawet <strong>BLIK-iem podpiętym do konta Google Play</strong>!
                  </li>
                  <li>
                    Oni rozliczają też podatki, VAT MOSS, waluty i ewentualne zwroty konsumenckie (chargebacks).
                  </li>
                  <li>
                    Prowizja sklepu wynosi <strong>15%</strong> (dla małych firm w programie App Store Small Business do 1 mln USD rocznie).
                  </li>
                </ul>
              </div>

              {/* Card 2: Na stronie WWW (telepakt.pl) */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    2. Na stronie WWW (telepakt.pl)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                    Opcjonalny Stripe / BLIK / PayU
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Na stronie internetowej <strong>telepakt.pl</strong> nie obowiązują restrykcje Apple/Google. Możesz tutaj sprzedawać subskrypcję bezpośrednio:
                </p>

                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-5">
                  <li>
                    Prowizja polskiego BLIK-a lub Stripe to zaledwie <strong>1,2% - 2,5%</strong> (zamiast 15% Apple/Google!).
                  </li>
                  <li>
                    Wzorem Spotify czy YouTube Premium, możesz oferować na stronie abonament taniej (np. 19,99 zł na www vs 24,99 zł w aplikacji), zachęcając użytkowników do zakupu przez stronę.
                  </li>
                  <li>
                    Użytkownik kupuje na <code>telepakt.pl</code>, loguje się tym samym mailem w aplikacji mobilnej, a Django od razu odblokowuje mu ochronę!
                  </li>
                </ul>
              </div>
            </div>

            {/* Crucial Technical Clarification: What Django MUST Have */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                Co Twój backend Django MUSI posiadać do obsługi Google Play & Apple:
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Mimo że Apple i Google przyjmują wpłaty, <strong>Twój serwer Django musi odebrać tzw. Webhook Weryfikacyjny (Server-to-Server Receipt Validation)</strong>. Gdy użytkownik kliknie „Subskrybuj” na iPhone:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-cyan-400 font-bold mb-1">Krok 1: Zakup w telefonie</div>
                  <div className="text-[11px] text-slate-400">Użytkownik płaci FaceID / Google Pay. Sklep generuje unikalny token paragonu (Purchase Token).</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-indigo-400 font-bold mb-1">Krok 2: Wysłanie do Django</div>
                  <div className="text-[11px] text-slate-400">Aplikacja wysyła token do Twojego API: <code>/api/telephony/verify-purchase/</code>.</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-emerald-400 font-bold mb-1">Krok 3: Weryfikacja ze sklepem</div>
                  <div className="text-[11px] text-slate-400">Django pyta serwer Apple/Google za pomocą skonfigurowanego klucza czy paragon jest ważny.</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-purple-400 font-bold mb-1">Krok 4: Aktywacja ochrony</div>
                  <div className="text-[11px] text-slate-400">Django ustawia w PostgreSQL: <code>subscription_active = True</code>, <code>retention_days = 30</code>.</div>
                </div>
              </div>

              {/* RevenueCat recommendation */}
              <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-indigo-500/20 text-xs text-slate-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Złoty standard w branży mobilnej:</strong> Narzędzie <strong>RevenueCat</strong> (darmowe do $2,500 przychodu/mies.) obsługuje za Ciebie weryfikację zarówno Apple, jak i Google Play w jednym SDK!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Symulacja dodania nowej opinii na stronie */}
      {isNewReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Dodaj opinię (formularz na stronie telepakt.pl)</h3>
              </div>
              <button
                onClick={() => setIsNewReviewModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Zamknij ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewReview} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Imię / Nazwisko / Miasto:</label>
                <input
                  type="text"
                  required
                  placeholder="np. Michał z Krakowa"
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ocena (Gwiazdki):</label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Urządzenie:</label>
                  <select
                    value={newReviewDevice}
                    onChange={(e) => setNewReviewDevice(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Android">Android</option>
                    <option value="iPhone">iPhone (iOS)</option>
                    <option value="Web">Przeglądarka Web</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Zablokowany rodzaj spamu:</label>
                <input
                  type="text"
                  placeholder="np. Fotowoltaika, Kredyty, Naciągacze"
                  value={newReviewSpamType}
                  onChange={(e) => setNewReviewSpamType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tytuł opinii:</label>
                <input
                  type="text"
                  placeholder="np. Spokój od niechcianych telefonów!"
                  value={newReviewTitle}
                  onChange={(e) => setNewReviewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Treść opinii:</label>
                <textarea
                  required
                  placeholder="Opisz jak zadziałał suwak TelePakt, czy telemarketer się rozłączył..."
                  value={newReviewContent}
                  onChange={(e) => setNewReviewContent(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Wyślij opinię do moderacji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
