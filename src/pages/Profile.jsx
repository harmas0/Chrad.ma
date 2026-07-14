import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronRight, Star, TrendingUp, Award, LogOut, Shield, Bell, HelpCircle, CreditCard } from 'lucide-react';
import { fetchCurrentUser, fetchProfiles, getCurrentUserId, setCurrentUserId } from '../data/mockUsers';
import { fetchTasks } from '../data/mockTasks';

export default function Profile() {
  const navigate = useNavigate();
  const [isRunner, setIsRunner] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // filter tasks where this user is client or accepted runner
      const filtered = tasks.filter(t => t.clientId === profile.id || t.acceptedRunnerId === profile.id);
      setMyTasks(filtered);
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

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
      </div>
    );
  }

  const activeTasks = myTasks.filter(t => ['accepted', 'picked_up', 'en_route'].includes(t.status));

  const stats = isRunner
    ? [
        { label: 'Tasks Done', value: userProfile.completed_tasks?.toString() || '0', icon: TrendingUp },
        { label: 'Rating', value: userProfile.rating?.toString() || '0', icon: Star },
        { label: 'Earned', value: userProfile.earnings?.toString() || '0', suffix: 'MAD', icon: Award },
      ]
    : [
        { label: 'Tasks Posted', value: myTasks.filter(t => t.clientId === userProfile.id).length.toString(), icon: TrendingUp },
        { label: 'Active', value: activeTasks.length.toString(), icon: Star },
        { label: 'Spent', value: userProfile.spent?.toString() || '0', suffix: 'MAD', icon: Award },
      ];

  const menuItems = [
    { icon: CreditCard, label: 'Payment Methods', desc: 'Manage cards & wallets' },
    { icon: Bell, label: 'Notifications', desc: 'Push & in-app alerts' },
    { icon: Shield, label: 'Verification', desc: userProfile.verified ? 'Verified ✓' : 'Verify your identity' },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQ, contact us' },
  ];

  return (
    <div className="pb-safe min-h-screen bg-dark">
      {/* Header */}
      <div className="px-5 pt-safe pb-4">
        <div className="flex items-center justify-between mb-8 pt-4">
          <h1 className="text-[24px] font-extrabold text-white tracking-tight">Profile</h1>
          <div className="flex items-center gap-3">
            <select
              value={userProfile.id}
              onChange={handleProfileChange}
              className="text-[12px] bg-dark-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-accent text-white font-bold max-w-[180px] truncate"
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
        <div className="glass-panel rounded-3xl p-7 relative overflow-hidden animate-fade-in-up border border-border-light shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-5 mb-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-dark flex items-center justify-center text-[28px] font-black text-accent border border-accent shadow-[0_0_15px_rgba(0,255,135,0.2)]">
              {userProfile.initials}
            </div>
            <div>
              <h2 className="text-[20px] font-black text-white leading-tight mb-1">{userProfile.name}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-warning text-[14px] font-bold flex items-center gap-1">
                  <Star size={14} fill="currentColor" />
                  {userProfile.rating}
                </span>
                {userProfile.verified && (
                  <span className="text-[11px] text-accent font-bold uppercase tracking-wider bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="bg-dark p-1.5 rounded-2xl flex mb-6 border border-border relative z-10">
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
          <div className="grid grid-cols-3 gap-5 relative z-10">
            {stats.map((stat, i) => (
              <div key={i} className="text-center bg-dark-surface p-4 rounded-2xl border border-border">
                <div className="text-[24px] font-black text-white leading-none">
                  {stat.value}
                </div>
                <div className="text-[10px] text-accent font-bold uppercase tracking-wider mt-2 h-4">
                  {stat.suffix && <span>{stat.suffix}</span>}
                </div>
                <div className="text-[12px] text-charcoal-light font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Active Tasks */}
      {activeTasks.length > 0 && (
        <section className="px-5 mb-10">
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

      {/* Menu Items */}
      <section className="px-5 mb-10">
        <h3 className="text-[14px] font-bold text-charcoal-light uppercase tracking-wider mb-4 px-1">Settings</h3>
        <div className="glass-panel rounded-3xl overflow-hidden divide-y divide-border border border-border-light">
          {menuItems.map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-4 px-6 py-5 hover:bg-dark-surface transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-dark border border-border flex items-center justify-center text-charcoal-light shadow-inner">
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
    </div>
  );
}
