import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight, Star, TrendingUp, Award, LogOut, Shield, Bell, HelpCircle, CreditCard, Edit3, X, Save, Phone, Mail, MapPin, Clock, CheckCircle } from 'lucide-react';
import { fetchCurrentUser, fetchProfiles, getCurrentUserId, setCurrentUserId } from '../data/mockUsers';
import { fetchTasks } from '../data/mockTasks';

export default function Profile() {
  const navigate = useNavigate();
  const [isRunner, setIsRunner] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', bio: '' });

  async function loadData() {
    setLoading(true);
    const [profile, profiles, tasks] = await Promise.all([
      fetchCurrentUser(),
      fetchProfiles(),
      fetchTasks()
    ]);
    if (profile) {
      setUserProfile(profile);
      setIsRunner(profile.is_runner);
      const filtered = tasks.filter(t => t.clientId === profile.id || t.acceptedRunnerId === profile.id);
      setMyTasks(filtered);
      setEditForm({
        name: profile.name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
    }
    setAllProfiles(profiles);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileChange = (e) => {
    const id = e.target.value;
    setCurrentUserId(id);
    loadData();
  };

  const handleSaveProfile = () => {
    // In a real app this would update Supabase
    setUserProfile(prev => ({
      ...prev,
      name: editForm.name,
      phone: editForm.phone,
      bio: editForm.bio,
    }));
    setShowEditModal(false);
  };

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
      </div>
    );
  }

  const activeTasks = myTasks.filter(t => ['accepted', 'picked_up', 'en_route'].includes(t.status));
  const completedTasks = myTasks.filter(t => t.status === 'delivered');

  const stats = isRunner
    ? [
        { label: 'Completed', value: userProfile.completed_tasks?.toString() || '0', icon: TrendingUp, color: 'text-accent' },
        { label: 'Rating', value: userProfile.rating?.toString() || '0', icon: Star, color: 'text-warning' },
        { label: 'Earned', value: userProfile.earnings?.toString() || '0', suffix: 'MAD', icon: Award, color: 'text-accent' },
      ]
    : [
        { label: 'Posted', value: myTasks.filter(t => t.clientId === userProfile.id).length.toString(), icon: TrendingUp, color: 'text-accent' },
        { label: 'Active', value: activeTasks.length.toString(), icon: Star, color: 'text-warning' },
        { label: 'Spent', value: userProfile.spent?.toString() || '0', suffix: 'MAD', icon: Award, color: 'text-accent' },
      ];

  const menuItems = [
    { icon: CreditCard, label: 'Payment Methods', desc: 'Manage cards & wallets', accent: false },
    { icon: Bell, label: 'Notifications', desc: 'Push & in-app alerts', accent: false },
    { icon: Shield, label: 'Verification', desc: userProfile.verified ? 'Verified ✓' : 'Verify your identity', accent: userProfile.verified },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQ, contact us', accent: false },
  ];

  return (
    <div className="pb-safe min-h-screen bg-dark">
      {/* Header */}
      <div className="px-5 pt-safe pb-4">
        <div className="flex items-center justify-between mb-6 pt-4">
          <h1 className="text-[24px] font-extrabold text-white tracking-tight">Profile</h1>
          <div className="flex items-center gap-3">
            <select
              value={userProfile.id}
              onChange={handleProfileChange}
              className="text-[12px] bg-dark-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent text-white font-bold max-w-[160px] truncate"
            >
              {allProfiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.is_runner ? 'Runner' : 'Client'})
                </option>
              ))}
            </select>
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
              onClick={() => setIsRunner(false)}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300
                ${!isRunner ? 'bg-accent text-dark shadow-[0_0_10px_rgba(0,255,135,0.4)]' : 'text-charcoal-light hover:text-white'}`}
              id="mode-client"
            >
              🙋 Client
            </button>
            <button
              onClick={() => setIsRunner(true)}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300
                ${isRunner ? 'bg-accent text-dark shadow-[0_0_10px_rgba(0,255,135,0.4)]' : 'text-charcoal-light hover:text-white'}`}
              id="mode-runner"
            >
              🏃 Runner
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

      {/* Menu Items */}
      <section className="px-5 mb-8">
        <h3 className="text-[14px] font-bold text-charcoal-light uppercase tracking-wider mb-4 px-1">Settings</h3>
        <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-border border border-border-light">
          {menuItems.map((item, i) => (
            <button
              key={i}
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
        <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors text-[15px] font-bold uppercase tracking-wider">
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
    </div>
  );
}
