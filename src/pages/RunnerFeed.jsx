import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, List, Search, Flame } from 'lucide-react';
import { fetchOpenTasks, TASK_CATEGORIES } from '../data/tasksApi';
import TaskCard from '../components/TaskCard';
import MapView from '../components/MapView';
import CategoryIcon from '../components/CategoryIcon';
import NotificationCenter from '../components/NotificationCenter';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AnnouncementBanner from '../components/AnnouncementBanner';
import AdBanner from '../components/AdBanner';
import { supabase } from '../utils/supabaseClient';
import { useI18n } from '../utils/i18n';

export default function RunnerFeed() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState('list');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const filteredTasks = allTasks.filter((task) => {
    if (activeFilter !== 'all' && task.category !== activeFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (viewMode === 'map' && filteredTasks.length > 0) {
      if (!selectedTask || !filteredTasks.some(t => t.id === selectedTask.id)) {
        setSelectedTask(filteredTasks[0]);
      }
    }
  }, [viewMode, filteredTasks.length]);

  useEffect(() => {
    if (viewMode === 'map' && selectedTask) {
      const el = document.getElementById(`carousel-card-${selectedTask.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedTask, viewMode]);

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

  return (
    <div className="pb-safe min-h-screen bg-dark">
      {/* Floating Header */}
      <div className="sticky top-0 z-40 glass-floating border-b border-white/10 px-5 pt-safe pb-4 rounded-b-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[24px] font-heading font-black text-white tracking-tight">{t('explore_title')}</h1>
            <p className="text-[11px] text-accent font-black uppercase tracking-wider">{filteredTasks.length} {t('tasks_near_you')}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <LanguageSwitcher compact />
          </div>
          <div className="flex bg-dark/80 rounded-2xl p-1 gap-1 border border-white/10">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl transition-all font-black text-[12px] flex items-center gap-1.5 uppercase ${viewMode === 'list' ? 'bg-accent text-dark shadow-[0_0_12px_rgba(0,255,135,0.4)]' : 'text-charcoal-light hover:text-white'}`}
              id="view-list"
            >
              <List size={15} strokeWidth={2.5} />
              {t('list')}
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-xl transition-all font-black text-[12px] flex items-center gap-1.5 uppercase ${viewMode === 'map' ? 'bg-accent text-dark shadow-[0_0_12px_rgba(0,255,135,0.4)]' : 'text-charcoal-light hover:text-white'}`}
              id="view-map"
            >
              <Map size={15} strokeWidth={2.5} />
              {t('map')}
            </button>
          </div>
        </div>

        {/* Broadcast Announcement Banner */}
        <AnnouncementBanner />

        {/* Search Field */}
        <div className="relative mb-3.5">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_tasks_placeholder')}
            className="input-field w-full pl-11 pr-5 py-3 rounded-2xl font-medium text-[13px] bg-dark/60 border-white/10"
            id="search-tasks"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-2 px-2 pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border
              ${activeFilter === 'all'
                ? 'bg-accent text-dark border-accent shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                : 'bg-dark/60 text-charcoal-light border-white/10 hover:border-white/20'
              }`}
            id="filter-all"
          >
            {t('all_filter')}
          </button>
          {TASK_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border
                ${activeFilter === cat.id
                  ? 'bg-accent text-dark border-accent shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                  : 'bg-dark/60 text-charcoal-light border-white/10 hover:border-white/20'
                }`}
              id={`filter-${cat.id}`}
            >
              <CategoryIcon icon={cat.icon || cat.id} size={15} />
              {t(cat.id)}
            </button>
          ))}
        </div>

        {/* Sponsored Feed Card Ad */}
        <AdBanner placement="feed_card" />
      </div>

      {/* Content */}
      <div className="animate-fade-in pt-2">
        {viewMode === 'map' ? (
          <div className="px-0 relative w-full" style={{ height: 'calc(100dvh - 280px)' }}>
            <MapView
              taskMarkers={filteredTasks}
              pickupCoords={selectedTask?.pickup}
              destCoords={selectedTask?.destination}
              showHeatmap={showHeatmap}
              height="100%"
              className="rounded-none border-0"
              darkMode
              showUserLocation
              showRouteInfo={true}
              onTaskMarkerClick={(task) => setSelectedTask(task)}
            />

            {/* Heatmap Toggle Button */}
            <div className="absolute top-4 right-4 z-[1000]">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-xl transition-all active-press text-[16px]
                  ${showHeatmap 
                    ? 'bg-danger border-danger text-white shadow-[0_0_20px_rgba(255,51,102,0.5)]' 
                    : 'glass-floating border-white/15 text-white hover:border-white/30'
                  }`}
                title={t('toggle_task_hotspots_heatmap')}
                id="heatmap-toggle"
              >
                <Flame size={20} className={showHeatmap ? 'text-white' : 'text-danger'} />
              </button>
            </div>

            {/* Map Carousel */}
            {filteredTasks.length > 0 && (
              <div className="absolute bottom-6 left-0 right-0 z-[1000] px-4 pointer-events-none">
                <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pointer-events-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      id={`carousel-card-${task.id}`}
                      className={`snap-center shrink-0 w-[295px] transition-all duration-300 transform
                        ${selectedTask?.id === task.id
                          ? 'opacity-100 scale-100 shadow-[0_8px_32px_rgba(0,255,135,0.3)]'
                          : 'opacity-60 scale-95 hover:opacity-85'
                        }`}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => {
                          if (selectedTask?.id === task.id) {
                            navigate(`/task/${task.id}`);
                          } else {
                            setSelectedTask(task);
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 pt-4 pb-28">
            {filteredTasks.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center border border-white/10 my-8">
                <span className="text-5xl block mb-4 opacity-50">🔍</span>
                <p className="text-[18px] font-heading font-black text-white mb-1">{t('no_tasks_found')}</p>
                <p className="text-[13px] text-charcoal-light font-medium">{t('try_different_filter')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="stagger-item"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
