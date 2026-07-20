import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, List, Filter, Search } from 'lucide-react';
import { fetchOpenTasks, TASK_CATEGORIES } from '../data/tasksApi';
import TaskCard from '../components/TaskCard';
import MapView from '../components/MapView';
import { supabase } from '../utils/supabaseClient';
import { useI18n } from '../utils/i18n';

export default function RunnerFeed() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
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

  // Auto-select first filtered task when opening Map view
  useEffect(() => {
    if (viewMode === 'map' && filteredTasks.length > 0) {
      if (!selectedTask || !filteredTasks.some(t => t.id === selectedTask.id)) {
        setSelectedTask(filteredTasks[0]);
      }
    }
  }, [viewMode, filteredTasks.length]);

  // Smooth scroll carousel to selected task card
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
      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border-light px-5 pt-safe pb-4 rounded-b-3xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[24px] font-extrabold text-white tracking-tight">{t('explore_title')}</h1>
            <p className="text-[13px] text-accent font-semibold">{filteredTasks.length} {t('tasks_near_you')}</p>
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
            placeholder={t('search_tasks_placeholder')}
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
            {t('all_filter')}
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
              {t(cat.id)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="animate-fade-in pt-4">
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

            {/* Heatmap overlay toggle */}
            <div className="absolute top-4 right-4 z-[1000]">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-lg transition-all active:scale-95 text-[16px]
                  ${showHeatmap 
                    ? 'bg-danger border-danger text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                    : 'glass-panel border-border-light text-charcoal-light hover:text-white'
                  }`}
                title="Toggle Task Hotspots Heatmap"
                id="heatmap-toggle"
              >
                🔥
              </button>
            </div>

            {/* Sync Carousel overlay at the bottom of the map */}
            {filteredTasks.length > 0 && (
              <div className="absolute bottom-6 left-0 right-0 z-[1000] px-4 pointer-events-none">
                <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pointer-events-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      id={`carousel-card-${task.id}`}
                      className={`snap-center shrink-0 w-[290px] transition-all duration-300 transform
                        ${selectedTask?.id === task.id
                          ? 'opacity-100 scale-100 shadow-[0_8px_32px_rgba(0,255,135,0.25)]'
                          : 'opacity-50 scale-95 hover:opacity-80'
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
              <div className="text-center py-16">
                <span className="text-5xl block mb-4 opacity-50">🔍</span>
                <p className="text-[18px] font-bold text-white mb-2">{t('no_tasks_found')}</p>
                <p className="text-[14px] text-charcoal-light font-medium">{t('try_different_filter')}</p>
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
