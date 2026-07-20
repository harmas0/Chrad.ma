import { useState, useEffect } from 'react';
import { Map, RefreshCw, Layers } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import MapView from '../../components/MapView';

export default function AdminLiveMap() {
  const [activeTasks, setActiveTasks] = useState([]);
  const [runnerLocations, setRunnerLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    // Fetch active tasks & runner locations
    const [
      { data: tasks, error: tasksErr },
      { data: runners, error: runnersErr }
    ] = await Promise.all([
      supabase.from('tasks').select('*').in('status', ['accepted', 'picked_up', 'en_route', 'delivered']),
      supabase.from('runner_locations').select('*')
    ]);

    if (!tasksErr && tasks) {
      // Map schema row to UI structure
      const mapped = tasks.map(row => ({
        id: row.id,
        title: row.title,
        category: row.category,
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

    // Set up realtime channel subscriptions to listen for task & runner location changes
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1 flex items-center gap-2.5">
            <Map className="text-accent" size={26} />
            Live Map Dashboard
          </h1>
          <p className="text-[14px] text-charcoal-light font-medium">Real-time visualization of runners and active errand routes</p>
        </div>
        <button
          onClick={loadData}
          className="p-3 bg-dark-surface border border-border rounded-xl text-charcoal-light hover:text-white flex items-center gap-2 transition-all active:scale-95 text-[13px] font-bold"
        >
          <RefreshCw size={14} className="animate-spin-slow" />
          Refresh
        </button>
      </div>

      {/* Map view container */}
      <div className="flex-1 glass-panel border border-border-light rounded-3xl overflow-hidden relative min-h-[350px]">
        <MapView
          height="100%"
          darkMode={true}
          showUserLocation={false}
          showRouteInfo={true}
          taskMarkers={activeTasks}
          runnerLocations={runnerLocations}
        />

        {/* Legend */}
        <div className="absolute top-4 left-4 z-[1000] glass-panel p-4 border border-border-light rounded-xl pointer-events-none select-none text-[11px] space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <span className="text-white font-bold">Active Runner Locations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">📍</span>
            <span className="text-charcoal-light">Pickup / Start Stop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">🏁</span>
            <span className="text-charcoal-light">Destination Stop</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">🟡</span>
            <span className="text-charcoal-light">Waypoint Intermediates</span>
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="absolute bottom-4 right-4 z-[1000] glass-panel px-3 py-1.5 border border-border-light rounded-lg pointer-events-none select-none text-[10px] text-accent font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
          Live Channel Connected
        </div>
      </div>
    </div>
  );
}
