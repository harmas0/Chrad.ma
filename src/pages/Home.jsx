import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Star, TrendingUp } from 'lucide-react';
import { fetchOpenTasks, TASK_CATEGORIES } from '../data/mockTasks';
import { countBidsForTask } from '../data/mockBids';
import TaskCard from '../components/TaskCard';

const howItWorks = [
  {
    step: 1,
    icon: '📝',
    title: 'Post Your Task',
    description: 'Describe what you need done, set a starting price, and pin the location.',
  },
  {
    step: 2,
    icon: '💬',
    title: 'Get Bids',
    description: 'Nearby runners send offers. Compare prices, ratings, and ETAs.',
  },
  {
    step: 3,
    icon: '✅',
    title: 'Done & Verified',
    description: 'Runner completes the task. You confirm with a photo. Payment released.',
  },
];

const stats = [
  { value: '2,450+', label: 'Completed', icon: TrendingUp },
  { value: '4.8', label: 'Avg Rating', icon: Star },
  { value: '< 3m', label: 'Bid Time', icon: Zap },
];

export default function Home() {
  const navigate = useNavigate();
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const tasks = await fetchOpenTasks();
        if (cancelled) return;
        const withBids = await Promise.all(
          tasks.slice(0, 3).map(async (t) => {
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
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-accent-glow rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none opacity-60" />
      <div className="absolute top-[400px] left-0 w-48 h-48 bg-info-light rounded-full blur-[80px] -translate-x-1/2 pointer-events-none opacity-40" />

      {/* Main layout container with uniform spacing between sections */}
      <div className="flex flex-col">
        
        {/* ── Hero Section ── */}
        <section className="relative px-6">
          {/* Logo */}
          <div className="mb-6 animate-fade-in pt-4">
            <div className="flex items-center gap-3 p-2.5 rounded-2xl glass w-max">
              <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,255,135,0.4)]">
                <span className="text-[22px]">⚡</span>
              </div>
              <div className="pr-2">
                <h1 className="text-[24px] font-extrabold text-white leading-none tracking-tight">Chrad</h1>
                <span className="text-[11px] text-accent font-bold tracking-widest uppercase">On-Demand</span>
              </div>
            </div>
          </div>

          {/* Hero text */}
          <div className="animate-fade-in-up mb-6">
            <h2 className="text-[30px] font-extrabold text-white leading-[1.15] mb-3 tracking-tight">
              What do you need<br />
              <span className="gradient-text-accent">done today?</span>
            </h2>
            <p className="text-[15px] text-charcoal-light leading-relaxed">
              Name your price. A nearby runner bids, negotiates, and gets it done — fast.
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/create')}
            className="btn-accent text-[15px] px-6 py-3.5 rounded-2xl w-full flex items-center justify-center gap-2 animate-fade-in-up font-bold mt-6 shadow-[0_8px_25px_rgba(0,255,135,0.2)]"
            style={{ animationDelay: '0.15s' }}
            id="hero-cta"
          >
            Post a Task
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </section>

        {/* ── Category Quick Actions ── */}
        <section className="px-6 mt-8">
          <div className="grid grid-cols-4 gap-2.5">
            {TASK_CATEGORIES.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => navigate('/create', { state: { category: cat.id } })}
                className="stagger-item flex flex-col items-center justify-center gap-2 py-4 px-1.5 rounded-2xl glass-panel border border-border hover:border-accent transition-colors"
                style={{ animationDelay: `${i * 0.05}s` }}
                id={`quick-${cat.id}`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-[11px] font-bold text-charcoal leading-tight text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Stats Ribbon ── */}
        <section className="px-6 mt-8">
          <div className="glass-panel rounded-2xl p-6 flex justify-around border border-border">
            {stats.map((stat, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                <stat.icon size={20} className="text-accent mb-1.5" />
                <div className="text-[20px] font-extrabold text-white leading-none mb-0.5">{stat.value}</div>
                <div className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="px-6 mt-8">
          <h3 className="text-[16px] font-bold text-white mb-5 flex items-center gap-2">
            <Zap size={18} className="text-accent" />
            How Chrad Works
          </h3>
          <div>
            {howItWorks.map((item, i) => (
              <div
                key={item.step}
                className="flex items-start gap-4 p-6 rounded-2xl glass-panel border border-border mb-5"
              >
                <div className="w-10 h-10 rounded-xl bg-dark-surface border border-border flex items-center justify-center text-xl flex-shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[14px] font-bold text-white mb-1 flex items-center gap-2">
                    <span className="bg-accent text-dark text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0">
                      {item.step}
                    </span>
                    {item.title}
                  </h4>
                  <p className="text-[13px] text-charcoal-light leading-snug">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Live Tasks Nearby ── */}
        <section className="px-6 mt-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-bold text-white">Live Tasks Nearby</h3>
            <button
              onClick={() => navigate('/explore')}
              className="text-[13px] text-accent font-bold flex items-center gap-1"
              id="see-all-tasks"
            >
              See all <ArrowRight size={14} />
            </button>
          </div>
          <div className="pb-28">
            {loading ? (
              <div className="glass-panel rounded-2xl p-8 text-center border border-border">
                <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[13px] text-charcoal-light font-medium">Loading nearby tasks...</p>
              </div>
            ) : fetchError ? (
              <div className="glass-panel rounded-2xl p-6 text-center border border-danger/30">
                <span className="text-3xl block mb-2">⚠️</span>
                <p className="text-[14px] text-white font-bold mb-1">Connection Error</p>
                <p className="text-[12px] text-charcoal-light mb-3">{fetchError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-accent text-[13px] px-5 py-2 rounded-xl font-bold"
                >
                  Retry
                </button>
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="glass-panel rounded-2xl p-6 text-center border border-border">
                <span className="text-3xl block mb-2">📡</span>
                <p className="text-[14px] text-white font-bold mb-1">No open tasks right now</p>
                <p className="text-[12px] text-charcoal-light">Be the first to post a task!</p>
              </div>
            ) : (
              recentTasks.map((task, i) => (
                <div key={task.id} className="stagger-item mb-5" style={{ animationDelay: `${i * 0.08}s` }}>
                  <TaskCard task={task} />
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
