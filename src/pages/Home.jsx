import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Star, TrendingUp, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import NotificationCenter from '../components/NotificationCenter';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AnnouncementBanner from '../components/AnnouncementBanner';
import AdBanner from '../components/AdBanner';
import { fetchOpenTasks, TASK_CATEGORIES, fetchActiveCategories } from '../data/tasksApi';
import { countBidsForTask } from '../data/bidsApi';
import TaskCard from '../components/TaskCard';
import { useI18n } from '../utils/i18n';

const howItWorks = [
  {
    step: 1,
    icon: '📝',
    titleKey: 'step_1_title',
    descKey: 'step_1_desc',
  },
  {
    step: 2,
    icon: '💬',
    titleKey: 'step_2_title',
    descKey: 'step_2_desc',
  },
  {
    step: 3,
    icon: '✅',
    titleKey: 'step_3_title',
    descKey: 'step_3_desc',
  },
];

const stats = [
  { value: '2,450+', labelKey: 'completed_stat', icon: TrendingUp },
  { value: '4.8★', labelKey: 'avg_rating_stat', icon: Star },
  { value: '< 3 min', labelKey: 'bid_time_stat', icon: Zap },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [recentTasks, setRecentTasks] = useState([]);
  const [categories, setCategories] = useState(TASK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tasks, cats] = await Promise.all([
          fetchOpenTasks(),
          fetchActiveCategories()
        ]);
        if (cancelled) return;
        
        const featuredCats = cats.filter(c => c.isFeatured);
        setCategories(featuredCats.length > 0 ? featuredCats : cats);

        const withBids = await Promise.all(
          tasks.slice(0, 4).map(async (t) => {
            const count = await countBidsForTask(t.id);
            return { ...t, bids: Array(count).fill('') };
          })
        );
        if (!cancelled) {
          setRecentTasks(withBids);
          setLoading(false);
        }
      } catch (err) {
        console.error('[Home] Error fetching tasks:', err);
        if (!cancelled) {
          setFetchError(err.message || 'Failed to load tasks');
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="pb-safe relative overflow-x-hidden pt-safe">
      {/* Dynamic Background Ambient Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent-glow rounded-full blur-[130px] -translate-y-1/3 translate-x-1/4 pointer-events-none opacity-60 animate-pulse-glow" />
      <div className="absolute top-[450px] left-0 w-60 h-60 bg-info-light rounded-full blur-[100px] -translate-x-1/2 pointer-events-none opacity-35" />

      <div className="flex flex-col space-y-8">
        
        {/* ── Hero Branding & Header ── */}
        <section className="relative px-6 pt-2">
          {/* Logo & Status Badge */}
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <div className="flex items-center gap-3 p-2 px-3 rounded-2xl glass-card border border-white/10">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,255,135,0.4)]">
                <span className="text-[20px]">⚡</span>
              </div>
              <div>
                <h1 className="text-[22px] font-heading font-black text-white leading-none tracking-tight">Chrad<span className="text-accent">.ma</span></h1>
                <span className="text-[10px] text-accent font-black tracking-widest uppercase">Instant Errands</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationCenter />
              <LanguageSwitcher compact />
            </div>
          </div>

          {/* Broadcast Announcement Banner */}
          <AnnouncementBanner />

          {/* Hero Content Box */}
          <div className="glass-floating rounded-3xl p-6.5 border border-white/15 relative overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-accent" />
              <span className="text-[11px] text-accent font-black uppercase tracking-widest">Fast Escrow Delivery</span>
            </div>

            <h2 className="text-[28px] font-heading font-black text-white leading-[1.15] mb-3 tracking-tight">
              {t('welcome')}
            </h2>
            <p className="text-[14px] text-charcoal-light leading-relaxed mb-6 font-medium">
              {t('hero_desc')}
            </p>

            <button
              onClick={() => navigate('/create')}
              className="btn-accent text-[14px] font-heading font-black px-6 py-4 rounded-2xl w-full flex items-center justify-center gap-2 uppercase tracking-wider shadow-[0_8px_25px_rgba(0,255,135,0.3)] active-press"
              id="hero-cta"
            >
              {t('post_task')}
              <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
        </section>

        {/* ── Category Quick Grid ── */}
        <section className="px-6">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-[14px] font-heading font-black text-white uppercase tracking-wider">Categories</h3>
            <span className="text-[11px] text-charcoal-light font-bold">Pick your task</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {categories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => navigate('/create', { state: { category: cat.id } })}
                className="stagger-item flex flex-col items-center justify-center gap-2 py-4 px-1.5 rounded-2xl glass-card border border-white/10 hover:border-accent hover:shadow-[0_0_20px_rgba(0,255,135,0.2)] active-press"
                style={{ animationDelay: `${i * 0.05}s` }}
                id={`quick-${cat.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <CategoryIcon icon={cat.icon || cat.id} size={22} />
                </div>
                <span className="text-[11px] font-bold text-white leading-tight text-center truncate w-full px-1 font-heading">
                  {t(cat.id) !== cat.id ? t(cat.id) : (cat.nameEn || cat.label)}
                </span>
              </button>
            ))}
          </div>

          {/* Sponsored Ad Banner */}
          <AdBanner placement="home_banner" />
        </section>

        {/* ── Stats Ribbon ── */}
        <section className="px-6">
          <div className="glass-card rounded-2xl p-5 flex justify-around border border-white/10 shadow-lg">
            {stats.map((stat, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <stat.icon size={18} className="text-accent mb-1" />
                <div className="text-[18px] font-heading font-black text-white leading-none mb-1">{stat.value}</div>
                <div className="text-[9px] text-charcoal-light font-black uppercase tracking-widest">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works Steps ── */}
        <section className="px-6">
          <h3 className="text-[14px] font-heading font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            {t('how_it_works')}
          </h3>
          <div className="space-y-3">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="flex items-center gap-4 p-4 rounded-2xl glass-card border border-white/10"
              >
                <div className="w-11 h-11 rounded-xl bg-dark/80 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-inner">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[14px] font-bold text-white mb-0.5 flex items-center gap-2 font-heading">
                    <span className="bg-accent text-dark text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                      Step {item.step}
                    </span>
                    {t(item.titleKey)}
                  </h4>
                  <p className="text-[12px] text-charcoal-light leading-snug font-medium">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Live Tasks Nearby ── */}
        <section className="px-6 pb-28">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-accent" />
              {t('nearby_tasks')}
            </h3>
            <button
              onClick={() => navigate('/explore')}
              className="text-[12px] text-accent font-black uppercase tracking-wider flex items-center gap-1 hover:underline"
              id="see-all-tasks"
            >
              {t('see_all')} <ArrowRight size={13} strokeWidth={3} />
            </button>
          </div>

          <div>
            {loading ? (
              <div className="glass-card rounded-3xl p-8 text-center border border-white/10">
                <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[13px] text-charcoal-light font-bold">{t('loading_tasks')}</p>
              </div>
            ) : fetchError ? (
              <div className="glass-card rounded-3xl p-6 text-center border border-danger/30">
                <span className="text-3xl block mb-2">⚠️</span>
                <p className="text-[14px] text-white font-bold mb-1">{t('connection_error')}</p>
                <p className="text-[12px] text-charcoal-light mb-3">{fetchError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-accent text-[12px] px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider"
                >
                  {t('retry')}
                </button>
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center border border-white/10">
                <span className="text-3xl block mb-2">📡</span>
                <p className="text-[14px] text-white font-bold mb-1">{t('no_tasks')}</p>
                <p className="text-[12px] text-charcoal-light">{t('be_first')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task, i) => (
                  <div key={task.id} className="stagger-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
