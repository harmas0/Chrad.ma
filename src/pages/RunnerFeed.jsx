import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, List, Filter, Search } from 'lucide-react';
import { fetchOpenTasks, TASK_CATEGORIES } from '../data/tasksApi';
import TaskCard from '../components/TaskCard';
import MapView from '../components/MapView';
import { supabase } from '../utils/supabaseClient';

export default function RunnerFeed() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const tasks = await fetchOpenTasks();
      if (!cancelled) { setAllTasks(tasks); setLoading(false); }
    }
    load();

    const channel = supabase
      .channel('runner-feed-tasks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
      }, () => {
        load();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredTasks = allTasks.filter((task) => {
    if (activeFilter !== 'all' && task.category !== activeFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pb-safe min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border-light px-5 pt-safe pb-4 rounded-b-3xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[24px] font-extrabold text-white tracking-tight">Explore Tasks</h1>
            <p className="text-[13px] text-accent font-semibold">{filteredTasks.length} tasks near you</p>
          </div>
          
          {/* View toggle */}
          <div className="flex bg-dark-surface rounded-xl p-1 gap-1 border border-border">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent text-dark shadow-md' : 'text-charcoal-light hover:text-white'}`}
              id="view-list"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-accent text-dark shadow-md' : 'text-charcoal-light hover:text-white'}`}
              id="view-map"
            >
              <Map size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="input-field w-full pl-11 pr-5 py-3 rounded-xl font-medium"
            id="search-tasks"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-2 px-2 pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all border
              ${activeFilter === 'all'
                ? 'bg-white text-dark border-transparent shadow-[0_4px_15px_rgba(255,255,255,0.2)]'
                : 'bg-dark-surface text-charcoal-light border-border hover:border-charcoal-light'
              }`}
            id="filter-all"
          >
            All
          </button>
          {TASK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 border
                ${activeFilter === cat.id
                  ? 'bg-white text-dark border-transparent shadow-[0_4px_15px_rgba(255,255,255,0.2)]'
                  : 'bg-dark-surface text-charcoal-light border-border hover:border-charcoal-light'
                }`}
              id={`filter-${cat.id}`}
            >
              <span className="text-[15px]">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in pt-4">
        {viewMode === 'map' ? (
          <div className="px-0">
            <MapView
              taskMarkers={filteredTasks}
              height="calc(100dvh - 280px)"
              className="rounded-none border-0"
              darkMode
              showUserLocation
            />
          </div>
        ) : (
          <div className="px-5 pt-4 pb-28">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-4 opacity-50">🔍</span>
                <p className="text-[18px] font-bold text-white mb-2">No tasks found</p>
                <p className="text-[14px] text-charcoal-light font-medium">Try a different filter or check back later.</p>
              </div>
            ) : (
              filteredTasks.map((task, i) => (
                <div
                  key={task.id}
                  className="stagger-item mb-5"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <TaskCard task={task} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
