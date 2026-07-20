import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight, Star, TrendingUp, Award, LogOut, Shield, Bell, HelpCircle, CreditCard, Edit3, X, Save, Phone, Mail, MapPin, Clock, CheckCircle, LayoutDashboard, Globe } from 'lucide-react';
import { fetchCurrentUser } from '../data/usersApi';
import { fetchTasks } from '../data/tasksApi';
import { fetchReviewsForUser } from '../data/reviewsApi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useI18n, LANGUAGES, CURRENCIES } from '../utils/i18n';

export default function Profile() {
  const navigate = useNavigate();
  const { signOut, isAdmin, profile: authProfile, refreshProfile } = useAuth();
  const [isRunner, setIsRunner] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', bio: '' });
  const { lang, setLang, currency, setCurrency, t, formatPrice } = useI18n();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showRunnerStepsModal, setShowRunnerStepsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const activeProfile = authProfile || await fetchCurrentUser();
      const tasks = await fetchTasks();
      if (activeProfile) {
        setUserProfile(activeProfile);
        setIsRunner(activeProfile.is_runner);
        const filtered = tasks.filter(t => t.clientId === activeProfile.id || t.acceptedRunnerId === activeProfile.id);
        setMyTasks(filtered);
        setEditForm({
          name: activeProfile.name || '',
          phone: activeProfile.phone || '',
          bio: activeProfile.bio || '',
        });

        setLoadingReviews(true);
        const userReviews = await fetchReviewsForUser(activeProfile.id);
        setReviews(userReviews);
        setLoadingReviews(false);
      }
    } catch (err) {
      console.error('[Profile] Error loading data:', err);
      setLoadingReviews(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [authProfile]);

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    try {
      const initials = editForm.name ? editForm.name.slice(0, 2).toUpperCase() : '??';
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          bio: editForm.bio,
          initials,
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      setUserProfile(prev => ({
        ...prev,
        name: editForm.name,
        phone: editForm.phone,
        bio: editForm.bio,
        initials,
      }));

      if (refreshProfile) {
        await refreshProfile();
      }

      setShowEditModal(false);
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    }
  };
  const handleModeToggle = async (mode) => {
    if (!userProfile) return;
    if (mode === true && !userProfile.verified) {
      setShowRunnerStepsModal(true);
      return;
    }
    setIsRunner(mode);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_runner: mode })
        .eq('id', userProfile.id);

      if (error) throw error;
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Failed to toggle runner mode:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <h2 className="text-[20px] font-black text-white mb-2">Profile Load Error</h2>
        <p className="text-charcoal-light text-[14px] mb-6 max-w-xs">We couldn't retrieve your profile data. Please try again or log out and log back in.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={loadData} className="w-full btn-accent py-4 rounded-xl font-bold">
            Retry Connection
          </button>
          <button onClick={signOut} className="w-full py-4 rounded-xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors font-bold uppercase tracking-wider text-[13px]">
            Log Out
          </button>
        </div>
      </div>
    );
  }

  const activeTasks = myTasks.filter(t => ['accepted', 'picked_up', 'en_route'].includes(t.status));
  const completedTasks = myTasks.filter(t => t.status === 'delivered');

  const stats = isRunner
    ? [
        { label: t('completed'), value: userProfile.completed_tasks?.toString() || '0', icon: TrendingUp, color: 'text-accent' },
        { label: t('rating'), value: userProfile.rating?.toString() || '0', icon: Star, color: 'text-warning' },
        { label: t('earned'), value: formatPrice(userProfile.earnings || 0), icon: Award, color: 'text-accent' },
      ]
    : [
        { label: t('posted'), value: myTasks.filter(t => t.clientId === userProfile.id).length.toString(), icon: TrendingUp, color: 'text-accent' },
        { label: t('active'), value: activeTasks.length.toString(), icon: Star, color: 'text-warning' },
        { label: t('spent'), value: formatPrice(userProfile.spent || 0), icon: Award, color: 'text-accent' },
      ];

  const menuItems = [
    { icon: Globe, label: t('language'), desc: LANGUAGES.find(l => l.code === lang)?.label || 'English', accent: false, onClick: () => setShowLangModal(true) },
    { icon: CreditCard, label: t('currency'), desc: currency, accent: false, onClick: () => setShowCurrencyModal(true) },
    { icon: Shield, label: t('verification'), desc: userProfile.verified ? t('verified') : t('verify_identity'), accent: userProfile.verified, onClick: () => navigate('/kyc-upload') },
    { icon: HelpCircle, label: t('support'), desc: 'FAQ, contact us', accent: false, onClick: () => setShowSupportModal(true) },
    ...(isAdmin ? [{ icon: LayoutDashboard, label: t('admin_panel'), desc: 'Manage platform', accent: true, onClick: () => navigate('/admin') }] : []),
  ];

  return (
    <div className="pb-safe min-h-screen bg-dark">
      {/* Header */}
      <div className="px-5 pt-safe pb-4">
        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-[24px] font-extrabold text-white tracking-tight">Profile</h1>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-charcoal-light hover:bg-surface hover:text-white transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden animate-fade-in-up border border-border-light shadow-lg mb-6">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/3 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start gap-5 mb-5 relative z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-dark flex items-center justify-center text-[28px] font-black text-accent border-2 border-accent shadow-[0_0_20px_rgba(0,255,135,0.15)]">
                {userProfile.initials}
              </div>
              {userProfile.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-dark shadow-lg">
                  <CheckCircle size={12} className="text-dark" strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-black text-white leading-tight mb-1">{userProfile.name}</h2>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-warning text-[14px] font-bold flex items-center gap-1">
                  <Star size={14} fill="currentColor" />
                  {userProfile.rating}
                </span>
                {userProfile.verified && (
                  <span className="text-[10px] text-accent font-bold uppercase tracking-wider bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-lg">
                    ✓ Verified
                  </span>
                )}
              </div>
              {/* Contact info */}
              <div className="flex flex-col gap-1">
                {userProfile.phone && (
                  <span className="text-[12px] text-charcoal-light font-medium flex items-center gap-1.5">
                    <Phone size={11} /> {userProfile.phone}
                  </span>
                )}
                {userProfile.email && (
                  <span className="text-[12px] text-charcoal-light font-medium flex items-center gap-1.5 truncate">
                    <Mail size={11} /> {userProfile.email}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="w-9 h-9 rounded-xl bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-accent hover:border-accent/30 transition-all"
            >
              <Edit3 size={15} />
            </button>
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <p className="text-[13px] text-charcoal-light font-medium leading-relaxed mb-5 relative z-10 bg-dark/50 rounded-xl px-4 py-3 border border-border">
              "{userProfile.bio}"
            </p>
          )}

          {/* Mode Toggle */}
          <div className="bg-dark p-1.5 rounded-2xl flex mb-5 border border-border relative z-10">
            <button
              onClick={() => handleModeToggle(false)}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300
                ${!isRunner ? 'bg-accent text-dark shadow-[0_0_10px_rgba(0,255,135,0.4)]' : 'text-charcoal-light hover:text-white'}`}
              id="mode-client"
            >
              🙋 {t('client')}
            </button>
            <button
              onClick={() => handleModeToggle(true)}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300
                ${isRunner ? 'bg-accent text-dark shadow-[0_0_10px_rgba(0,255,135,0.4)]' : 'text-charcoal-light hover:text-white'}`}
              id="mode-runner"
            >
              🏃 {t('runner')}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {stats.map((stat, i) => (
              <div key={i} className="text-center bg-dark-surface p-4 rounded-2xl border border-border hover:border-accent/20 transition-colors">
                <stat.icon size={16} className={`${stat.color} mx-auto mb-2`} />
                <div className="text-[22px] font-black text-white leading-none">
                  {stat.value}
                </div>
                {stat.suffix && (
                  <div className="text-[10px] text-accent font-bold uppercase tracking-wider mt-1">{stat.suffix}</div>
                )}
                <div className="text-[11px] text-charcoal-light font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Member since badge */}
        <div className="flex items-center gap-2 px-2 mb-6">
          <Clock size={13} className="text-charcoal-light" />
          <span className="text-[12px] text-charcoal-light font-medium">
            Member since {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
          </span>
          <span className="text-[10px] text-charcoal-light mx-1">•</span>
          <MapPin size={13} className="text-charcoal-light" />
          <span className="text-[12px] text-charcoal-light font-medium">
            Casablanca, Morocco
          </span>
        </div>
      </div>

      {/* My Active Tasks */}
      {activeTasks.length > 0 && (
        <section className="px-5 mb-8">
          <h3 className="text-[14px] font-bold text-charcoal-light uppercase tracking-wider mb-4 px-1">Active Tasks</h3>
          <div>
            {activeTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => navigate(`/active/${task.id}`)}
                className="w-full flex items-center gap-4 p-5 glass-panel border border-accent/30 rounded-2xl text-left hover:bg-dark-surface transition-all group mb-4"
              >
                <span className="text-2xl drop-shadow-md">
                  {task.category === 'delivery' ? '📦' : task.category === 'documents' ? '📄' : task.category === 'shopping' ? '🛒' : '🔧'}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[15px] font-bold text-white block truncate mb-1">{task.title}</span>
                  <span className="text-[11px] text-accent font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                    Live tracking <ChevronRight size={12} strokeWidth={3} />
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[18px] font-black text-accent block">{task.offeredPrice}</span>
                  <span className="text-[10px] text-accent/80 font-bold uppercase tracking-widest">MAD</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Completed Tasks Summary */}
      {completedTasks.length > 0 && (
        <section className="px-5 mb-8">
          <h3 className="text-[14px] font-bold text-charcoal-light uppercase tracking-wider mb-4 px-1">Recent Completed</h3>
          <div className="glass-panel rounded-2xl border border-border-light overflow-hidden divide-y divide-border">
            {completedTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-lg">
                  {task.category === 'delivery' ? '📦' : task.category === 'documents' ? '📄' : task.category === 'shopping' ? '🛒' : '🔧'}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-bold text-white block truncate">{task.title}</span>
                  <span className="text-[11px] text-charcoal-light font-medium">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-accent" />
                  <span className="text-[14px] font-bold text-accent">{task.offeredPrice} MAD</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Reviews & Feedback */}
      {!loadingReviews && reviews.length > 0 && (
        <section className="px-5 mb-8">
          <h3 className="text-[14px] font-bold text-charcoal-light uppercase tracking-wider mb-4 px-1">Recent Reviews</h3>
          <div className="glass-panel rounded-3xl p-5 border border-border-light flex flex-col gap-4">
            {reviews.slice(0, 5).map((rev) => (
              <div key={rev.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-dark-surface border border-border flex items-center justify-center text-[11px] font-black text-accent uppercase">
                      {rev.profiles?.initials || rev.profiles?.name?.slice(0, 2) || '??'}
                    </div>
                    <div>
                      <span className="text-[13px] font-bold text-white block leading-tight">
                        {rev.profiles?.name || 'Anonymous User'}
                      </span>
                      <span className="text-[10px] text-charcoal-light font-medium">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-warning/10 px-2 py-0.5 rounded-lg border border-warning/20">
                    <Star size={11} className="text-warning fill-warning" />
                    <span className="text-[11px] font-bold text-warning">{Number(rev.rating).toFixed(1)}</span>
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-[12px] text-charcoal-light font-medium leading-relaxed pl-10 italic">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Items */}
      <section className="px-5 mb-8">
        <h3 className="text-[14px] font-bold text-charcoal-light uppercase tracking-wider mb-4 px-1">Settings</h3>
        <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-border border border-border-light">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className="w-full flex items-center gap-4 px-6 py-5 hover:bg-dark-surface transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-xl ${item.accent ? 'bg-accent/10 border-accent/20' : 'bg-dark border-border'} border flex items-center justify-center ${item.accent ? 'text-accent' : 'text-charcoal-light'} shadow-inner`}>
                <item.icon size={20} />
              </div>
              <div className="flex-1">
                <span className="text-[15px] font-bold text-white block mb-0.5">{item.label}</span>
                <span className="text-[12px] text-charcoal-light font-medium">{item.desc}</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </button>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section className="px-5 mb-10 pb-10">
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors text-[15px] font-bold uppercase tracking-wider"
        >
          <LogOut size={18} strokeWidth={2.5} />
          Log Out
        </button>
      </section>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div
            className="w-full max-w-lg bg-dark-surface border-t border-x border-border-light rounded-t-3xl p-6 animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field w-full px-4 py-3.5 rounded-xl text-[15px] font-semibold"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="input-field w-full px-4 py-3.5 rounded-xl text-[15px] font-semibold"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(p => ({ ...p, bio: e.target.value }))}
                  className="input-field w-full px-4 py-3.5 rounded-xl text-[15px] font-semibold resize-none"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="w-full btn-accent py-4 rounded-2xl text-[15px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Save size={18} strokeWidth={2.5} />
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Language Selector Modal */}
      {showLangModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowLangModal(false)}>
          <div
            className="w-full max-w-lg bg-dark-surface border-t border-x border-border-light rounded-t-3xl p-6 animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white">{t('language')}</h3>
              <button
                onClick={() => setShowLangModal(false)}
                className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setShowLangModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border text-[15px] font-bold transition-all
                    ${lang === l.code
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-dark border-border text-white hover:border-border-light'
                    }`}
                >
                  <span>{l.label}</span>
                  {lang === l.code && <CheckCircle size={16} className="text-accent" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Currency Selector Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowCurrencyModal(false)}>
          <div
            className="w-full max-w-lg bg-dark-surface border-t border-x border-border-light rounded-t-3xl p-6 animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white">{t('currency')}</h3>
              <button
                onClick={() => setShowCurrencyModal(false)}
                className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setShowCurrencyModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border text-[15px] font-bold transition-all
                    ${currency === c.code
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-dark border-border text-white hover:border-border-light'
                    }`}
                >
                  <span>{c.code} ({c.symbol})</span>
                  {currency === c.code && <CheckCircle size={16} className="text-accent" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Become a Runner / Verification Steps Modal */}
      {showRunnerStepsModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowRunnerStepsModal(false)}>
          <div
            className="w-full max-w-lg bg-dark-surface border-t border-x border-border-light rounded-t-3xl p-6 animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-black text-white">Become a Runner</h3>
              <button
                onClick={() => setShowRunnerStepsModal(false)}
                className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-[14px] text-charcoal-light mb-5 font-medium leading-relaxed">
                To start accepting tasks, earning money, and bidding on runs, you must verify your profile by completing these simple steps:
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[12px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-white mb-0.5">Identity Verification</h4>
                    <p className="text-[12px] text-charcoal-light font-medium">Upload your CIN, Passport, or Driver's license.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[12px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-white mb-0.5">Profile Selfie</h4>
                    <p className="text-[12px] text-charcoal-light font-medium">Take a photo holding your identity card next to your face.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[12px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-white mb-0.5">Vehicle Documents</h4>
                    <p className="text-[12px] text-charcoal-light font-medium">Provide registration papers for your motorcycle or vehicle.</p>
                  </div>
                </div>
              </div>
            </div>

            {userProfile.kyc_status === 'pending' ? (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-6 text-center">
                <p className="text-[13px] font-bold text-warning">Your verification is currently pending review.</p>
                <p className="text-[11px] text-charcoal-light mt-1">We will notify you within 24 hours.</p>
              </div>
            ) : userProfile.kyc_status === 'rejected' ? (
              <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6">
                <p className="text-[13px] font-bold text-danger">Verification rejected</p>
                <p className="text-[12px] text-charcoal-light mt-1">{userProfile.kyc_rejection_reason || 'Please submit updated documents.'}</p>
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={() => setShowRunnerStepsModal(false)}
                className="flex-1 py-4 rounded-2xl border border-border text-charcoal-light font-bold text-[14px] hover:text-white transition-colors"
              >
                Maybe Later
              </button>
              {userProfile.kyc_status !== 'pending' && (
                <button
                  onClick={() => {
                    setShowRunnerStepsModal(false);
                    navigate('/kyc-upload');
                  }}
                  className="flex-1 btn-accent py-4 rounded-2xl text-[14px] font-extrabold uppercase tracking-wider text-center"
                >
                  {userProfile.kyc_status === 'rejected' ? 'Resubmit Docs' : 'Verify Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Support Ticket Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowSupportModal(false)}>
          <div
            className="w-full max-w-lg bg-dark-surface border-t border-x border-border-light rounded-t-3xl p-6 animate-slide-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white">Help & Support</h3>
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Subject</label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  className="input-field w-full px-4 py-3.5 rounded-xl text-[15px] font-semibold"
                  placeholder="e.g. KYC verification, Payment issue"
                />
              </div>
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Message</label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="input-field w-full px-4 py-3.5 rounded-xl text-[15px] font-medium resize-none"
                  rows={4}
                  placeholder="Describe your issue or question in detail..."
                />
              </div>
            </div>

            <button
              onClick={async () => {
                if (!supportSubject.trim() || !supportMessage.trim()) return;
                setSubmittingSupport(true);
                const { submitSupportTicket } = await import('../data/reviewsApi');
                await submitSupportTicket({
                  userId: userProfile.id,
                  subject: supportSubject,
                  message: supportMessage,
                });
                setSubmittingSupport(false);
                setShowSupportModal(false);
                setSupportSubject('');
                setSupportMessage('');
                alert('Support request submitted. Our team will contact you shortly.');
              }}
              disabled={submittingSupport || !supportSubject.trim() || !supportMessage.trim()}
              className="w-full btn-accent py-4 rounded-2xl font-bold uppercase tracking-wider text-[15px] flex items-center justify-center gap-2"
            >
              {submittingSupport ? (
                <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                'Submit Ticket'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
