import { useI18n } from '../../utils/i18n';
import { useState, useEffect } from 'react';
import { Map, RefreshCw, Layers, Flame, Navigation, Activity, ShieldCheck, UserCheck, Play, Pause, Search, Filter, Eye, ChevronRight } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import MapView from '../../components/MapView';

export default function AdminLiveMap() {
  const { t } = useI18n();
  const [activeTasks, setActiveTasks] = useState([]);
  const [runnerLocations, setRunnerLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Controls State
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedTaskFilter, setSelectedTaskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedLocation, setFocusedLocation] = useState([33.5731, -7.6322]);
  const [focusedZoom, setFocusedZoom] = useState(13);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'runners'

  // Admin Live Movement Simulator State
  const [isSimulating, setIsSimulating] = useState(false);

  async function loadData() {
    const [
      { data: tasks, error: tasksErr },
      { data: runners, error: runnersErr }
    ] = await Promise.all([
      supabase.from('tasks').select('*').in('status', ['open', 'bidding', 'accepted', 'picked_up', 'en_route', 'delivered']),
      supabase.from('runner_locations').select('*')
    ]);

    if (!tasksErr && tasks) {
      const mapped = tasks.map(row => ({
        id: row.id,
        title: row.title,
        category: row.category || 'delivery',
        status: row.status,
        offeredPrice: row.offered_price,
        pickup: {
          name: row.pickup_name,
          address: row.pickup_address,
          lat: Number(row.pickup_lat),
          lng: Number(row.pickup_lng),
        },
        destination: row.destination_name ? {
          name: row.destination_name,
          address: row.destination_address,
          lat: Number(row.destination_lat),
          lng: Number(row.destination_lng),
        } : null,
        waypoints: row.waypoints || [],
        acceptedRunnerId: row.accepted_runner_id,
      }));
      setActiveTasks(mapped);
    }

    if (!runnersErr && runners) {
      setRunnerLocations(runners.map(r => ({
        runnerId: r.runner_id,
        taskId: r.task_id,
        lat: Number(r.lat),
        lng: Number(r.lng),
        updatedAt: r.updated_at,
      })));
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();

    const tasksChannel = supabase
      .channel('admin-live-map-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runner_locations' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
    };
  }, []);

  // Admin Live Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    // Move runner markers slightly every 2 seconds to simulate active movement
    const timer = setInterval(() => {
      setRunnerLocations(prev =>
        prev.map(r => ({
          ...r,
          lat: r.lat + (Math.random() - 0.5) * 0.002,
          lng: r.lng + (Math.random() - 0.5) * 0.002,
        }))
      );
    }, 2000);

    return () => clearInterval(timer);
  }, [isSimulating]);

  const filteredTasks = activeTasks.filter(t => {
    const matchesFilter = selectedTaskFilter === 'all' || t.status === selectedTaskFilter;
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const focusOnTask = (task) => {
    if (task.pickup?.lat && task.pickup?.lng) {
      setFocusedLocation([task.pickup.lat, task.pickup.lng]);
      setFocusedZoom(15);
    }
  };

  const focusOnRunner = (runner) => {
    if (runner.lat && runner.lng) {
      setFocusedLocation([runner.lat, runner.lng]);
      setFocusedZoom(16);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-90px)] flex flex-col">
      {/* Top Header */}
      <div className="mb-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black text-white tracking-tight mb-1 flex items-center gap-2.5">
            <Map className="text-accent" size={26} />
            {t('live_operations_control_center')}
          </h1>
          <p className="text-[13px] text-charcoal-light font-medium">{t('realtime_gps_dispatch_telemetry_and')}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Simulation Toggle */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3.5 py-2 rounded-xl text-[12px] font-extrabold flex items-center gap-1.5 transition-all active:scale-95 border
              ${isSimulating 
                ? 'bg-accent/20 border-accent/40 text-accent animate-pulse' 
                : 'bg-dark-surface border-border text-charcoal-light hover:text-white'}`}
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            {isSimulating ? 'Simulating Telemetry' : 'Simulate Fleet Movement'}
          </button>

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3.5 py-2 rounded-xl text-[12px] font-extrabold flex items-center gap-1.5 transition-all active:scale-95 border
              ${showHeatmap 
                ? 'bg-warning/20 border-warning/40 text-warning' 
                : 'bg-dark-surface border-border text-charcoal-light hover:text-white'}`}
          >
            <Flame size={14} />
            {showHeatmap ? 'Heatmap Active' : 'Show Demand Heatmap'}
          </button>

          {/* Refresh */}
          <button
            onClick={loadData}
            className="p-2.5 bg-dark-surface border border-border rounded-xl text-charcoal-light hover:text-white flex items-center gap-2 transition-all active:scale-95 text-[13px] font-bold"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Map + Sidebar Layout */}
      <div className="flex-1 flex gap-4 min-h-0 relative">
        {/* Map Container */}
        <div className="flex-1 glass-panel border border-border-light rounded-3xl overflow-hidden relative min-h-[400px]">
          <MapView
            height="100%"
            darkMode={true}
            showUserLocation={false}
            showRouteInfo={true}
            taskMarkers={filteredTasks}
            runnerLocations={runnerLocations}
            showHeatmap={showHeatmap}
            center={focusedLocation}
            zoom={focusedZoom}
          />

          {/* Top Floating Stats HUD */}
          <div className="absolute top-4 left-16 z-[1000] flex items-center gap-2 pointer-events-none">
            <div className="glass-panel bg-black/75 backdrop-blur-md px-3.5 py-2 border border-white/10 rounded-xl flex items-center gap-2 pointer-events-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
              <div>
                <span className="text-[12px] font-black text-white">{activeTasks.length}</span>
                <span className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider ml-1.5">{t('tasks_monitored')}</span>
              </div>
            </div>
            <div className="glass-panel bg-black/75 backdrop-blur-md px-3.5 py-2 border border-white/10 rounded-xl flex items-center gap-2 pointer-events-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-info animate-pulse" />
              <div>
                <span className="text-[12px] font-black text-info">{runnerLocations.length}</span>
                <span className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider ml-1.5">{t('fleet_runners')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Sidebar Drawer */}
        <div className="w-[320px] glass-panel border border-border-light rounded-3xl p-4 flex flex-col shrink-0 overflow-hidden hidden lg:flex">
          {/* Sidebar Tabs */}
          <div className="flex bg-dark rounded-xl p-1 border border-border mb-3">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
                activeTab === 'tasks' ? 'bg-accent text-dark shadow-md' : 'text-charcoal-light hover:text-white'
              }`}
            >
              Tasks ({filteredTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('runners')}
              className={`flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
                activeTab === 'runners' ? 'bg-accent text-dark shadow-md' : 'text-charcoal-light hover:text-white'
              }`}
            >
              Runners ({runnerLocations.length})
            </button>
          </div>

          {/* Filter Bar */}
          <div className="mb-3 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-light" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_telemetry')}
                className="input-field w-full pl-9 pr-3 py-2 rounded-xl text-[12px]"
              />
            </div>
            {activeTab === 'tasks' && (
              <select
                value={selectedTaskFilter}
                onChange={(e) => setSelectedTaskFilter(e.target.value)}
                className="input-field w-full px-3 py-1.5 rounded-xl text-[11px] font-bold bg-dark border-border"
              >
                <option value="all">{t('all_statuses')}</option>
                <option value="open">{t('open')}</option>
                <option value="bidding">{t('bidding')}</option>
                <option value="accepted">{t('accepted_in_transit')}</option>
                <option value="completed">{t('completed')}</option>
              </select>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
            {activeTab === 'tasks' ? (
              filteredTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => focusOnTask(t)}
                  className="bg-dark rounded-xl p-3 border border-border hover:border-accent/40 cursor-pointer transition-all hover:translate-x-1 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-white truncate max-w-[170px]">{t.title}</span>
                    <span className="text-[12px] font-black text-accent">{t.offeredPrice} MAD</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-charcoal-light">
                    <span className="capitalize bg-dark-surface px-2 py-0.5 rounded border border-border">{t.status}</span>
                    <span className="group-hover:text-accent flex items-center gap-0.5">{t('focus')} <ChevronRight size={10} /></span>
                  </div>
                </div>
              ))
            ) : (
              runnerLocations.map(r => (
                <div
                  key={r.runnerId}
                  onClick={() => focusOnRunner(r)}
                  className="bg-dark rounded-xl p-3 border border-border hover:border-info/40 cursor-pointer transition-all hover:translate-x-1 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-info" />
                      Runner {r.runnerId?.slice(0, 8)}
                    </span>
                    <span className="text-[10px] text-info font-bold uppercase">{t('active_gps')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-charcoal-light">
                    <span>{r.taskId ? `Task: ${r.taskId.slice(0, 8)}` : 'Idle / Available'}</span>
                    <span className="group-hover:text-info flex items-center gap-0.5">{t('focus')} <ChevronRight size={10} /></span>
                  </div>
                </div>
              ))
            )}

            {activeTab === 'tasks' && filteredTasks.length === 0 && (
              <div className="text-center py-10 text-[12px] text-charcoal-light">{t('no_tasks_match_filter')}</div>
            )}
            {activeTab === 'runners' && runnerLocations.length === 0 && (
              <div className="text-center py-10 text-[12px] text-charcoal-light">{t('no_active_runner_telemetry')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

