import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Camera, Check, Phone, Clock, AlertTriangle } from 'lucide-react';
import { fetchTaskById, updateTaskStatus } from '../data/tasksApi';
import { fetchProfileById } from '../data/usersApi';
import MapView from '../components/MapView';
import StatusTimeline from '../components/StatusTimeline';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import ReportDispute from '../components/ReportDispute';

export default function ActiveTask() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [runner, setRunner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate runner movement
  const [runnerPos, setRunnerPos] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('accepted');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const t = await fetchTaskById(id);
      if (cancelled) return;
      if (t) {
        setTask(t);
        setCurrentStatus(t.status);
        if (t.acceptedRunnerId) {
          const u = await fetchProfileById(t.acceptedRunnerId);
          if (!cancelled) setRunner(u);
        }
      }
      
      // Load last known location from db
      try {
        const { data: locData } = await supabase
          .from('runner_locations')
          .select('*')
          .eq('task_id', id)
          .maybeSingle();
        if (!cancelled && locData) {
          setRunnerPos({ lat: Number(locData.lat), lng: Number(locData.lng) });
        }
      } catch (e) {
        console.error('Failed to load last known runner location:', e);
      }

      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!task || !user) return;
    const isClient = user.id === task.clientId;
    const isRunner = user.id === task.acceptedRunnerId;

    const channel = supabase.channel(`task-${id}-tracking`);

    if (isRunner) {
      // Runner: Watch GPS, broadcast location, and persist to DB
      let watchId;
      const handlePosition = async (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setRunnerPos(newPos);
        // Broadcast to client
        channel.send({
          type: 'broadcast',
          event: 'location',
          payload: newPos,
        });
        // Persist to lightweight table
        try {
          await supabase.from('runner_locations').upsert({
            task_id: id,
            runner_id: user.id,
            lat: newPos.lat,
            lng: newPos.lng,
          }, { onConflict: 'task_id' });
        } catch (e) {
          console.error('Failed to persist runner location:', e);
        }
      };

      const handleError = (err) => {
        console.error('GPS error:', err);
      };

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
              enableHighAccuracy: true,
              maximumAge: 0,
            });
          }
        }
        if (status === 'ERROR') {
          console.error('Realtime channel error');
        }
      });

      // Cleanup on unmount or when task ends
      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        // Send a final empty payload to indicate stop (optional)
        channel.send({ type: 'broadcast', event: 'location', payload: null });
        supabase.removeChannel(channel);
      };
    } else if (isClient) {
      // Client: Listen for location broadcasts
      channel
        .on('broadcast', { event: 'location' }, (payload) => {
          if (payload.payload) setRunnerPos(payload.payload);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [task, user, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-charcoal-light font-bold">Task not found</p>
      </div>
    );
  }

  const isClient = user?.id === task.clientId;
  const isRunner = user?.id === task.acceptedRunnerId;
  const canConfirm = isClient && (currentStatus === 'delivered' || task.status === 'delivered');

  const handleStatusChange = async (newStatus) => {
    setCurrentStatus(newStatus);
    await updateTaskStatus(task.id, newStatus);
  };

  return (
    <div className="pb-safe-only min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border-light px-5 pt-safe pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-colors shadow-md"
            id="active-back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-[18px] font-extrabold text-white truncate mb-1">Live Tracking</h1>
            <span className="text-[11px] text-accent font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,135,0.8)]" />
              Runner is active
            </span>
          </div>
        </div>
        {/* ETA overlay */}
        {routeInfo && (
          <div className="mt-2 flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full shadow-md">
            <Clock size={14} />
            <span>{formatDuration(routeInfo.duration)} ETA</span>
          </div>
        )}
      </div>

      {/* Full Map */}
      <div className="relative border-b border-border shadow-lg z-0">
        <MapView
          pickup={task.pickup}
          destination={task.destination}
          runnerPosition={runnerPos}
          height="45dvh"
          className="rounded-none border-0"
          showRouteInfo
          darkMode
        />
        {/* Gradient overlay to blend map into bottom panel */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-dark to-transparent pointer-events-none" />
      </div>

      {/* Bottom Panel */}
      <div className="px-5 py-8 animate-slide-up relative z-10 -mt-6">
        {/* Status Timeline */}
        <div className="glass-panel rounded-3xl p-6 border border-border-light mb-6">
          <StatusTimeline currentStatus={currentStatus} />
        </div>

        {/* Runner Info */}
        {runner && (
          <div className="flex items-center gap-4 glass-panel rounded-3xl p-6 border border-border-light mb-6">
            <div className="w-14 h-14 rounded-full bg-dark flex items-center justify-center text-[18px] font-black text-accent flex-shrink-0 border border-border shadow-inner">
              {runner.initials}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[16px] font-bold text-white mb-1">{runner.name}</h4>
              <div className="flex items-center gap-3 text-[13px] text-charcoal-light font-medium">
                <span className="text-warning font-bold">⭐ {runner.rating}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{runner.completed_tasks || 0} tasks</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const { fetchOrCreateConversation } = await import('../data/messagesApi');
                  const conv = await fetchOrCreateConversation(task.id, runner.id);
                  if (conv) {
                    navigate(`/chat/${conv.id}`);
                  } else {
                    navigate('/messages');
                  }
                }}
                className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent hover:bg-accent/20 transition-all active:scale-95"
                id="chat-runner"
                aria-label="Chat with runner"
              >
                <MessageCircle size={20} strokeWidth={2.5} />
              </button>
              {runner.phone ? (
                <a
                  href={`tel:${runner.phone}`}
                  className="w-12 h-12 rounded-xl bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-all active:scale-95"
                  aria-label="Call runner"
                >
                  <Phone size={20} />
                </a>
              ) : (
                <button
                  onClick={() => alert('Runner has not provided a phone number.')}
                  className="w-12 h-12 rounded-xl bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-all active:scale-95 opacity-50 cursor-not-allowed"
                  aria-label="Call runner"
                >
                  <Phone size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Task Summary */}
        <div className="glass-panel rounded-3xl p-6 border border-border-light flex flex-col gap-4 relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
          <h4 className="text-[15px] font-bold text-white relative z-10 leading-snug">{task.title}</h4>
          <div className="flex items-center justify-between relative z-10 pt-3 border-t border-border">
            <span className="text-[13px] text-charcoal-light font-bold uppercase tracking-wider">Price agreed</span>
            <span className="text-[20px] font-black text-accent">{task.offeredPrice} <span className="text-[12px] uppercase">MAD</span></span>
          </div>
        </div>

        {/* Status action buttons */}
        {isRunner && (
          <div className="flex gap-4 mb-6">
            {currentStatus === 'accepted' && (
              <button
                onClick={() => handleStatusChange('picked_up')}
                className="flex-1 py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                📦 Mark as Picked Up
              </button>
            )}
            {currentStatus === 'picked_up' && (
              <button
                onClick={() => handleStatusChange('en_route')}
                className="flex-1 py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                🚗 Mark as En Route
              </button>
            )}
            {currentStatus === 'en_route' && (
              <button
                onClick={() => handleStatusChange('delivered')}
                className="flex-1 py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                ✅ Mark as Delivered
              </button>
            )}
          </div>
        )}

        {/* Report Problem Button */}
        {runner && !['confirmed', 'cancelled'].includes(currentStatus) && (
          <button
            onClick={() => setShowReport(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors text-[13px] font-bold uppercase tracking-wider mb-6"
          >
            <AlertTriangle size={16} />
            Report a Problem
          </button>
        )}

        {/* Confirm Delivery */}
        {canConfirm && (
          <div className="animate-fade-in-up mb-6">
            <div className="glass-panel border border-accent/30 rounded-3xl p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
              <span className="text-5xl block mb-3 drop-shadow-lg relative z-10">📸</span>
              <h4 className="text-[18px] font-extrabold text-white mb-2 relative z-10">Delivery Photo</h4>
              <p className="text-[14px] text-charcoal-light font-medium mb-5 relative z-10">Runner uploaded a verification photo.</p>

              {/* Placeholder photo area */}
              <div className="w-full h-48 bg-dark border-2 border-dashed border-border-light rounded-2xl flex items-center justify-center mb-5 relative z-10">
                <div className="text-center">
                  <Camera size={40} className="text-muted mx-auto mb-2 opacity-50" />
                  <span className="text-[13px] text-muted font-medium">Verification photo</span>
                </div>
              </div>

              <button
                onClick={() => handleStatusChange('confirmed')}
                className="w-full py-4 rounded-2xl btn-accent font-extrabold text-[16px] transition-all flex items-center justify-center gap-3 animate-pulse-glow relative z-10"
                id="confirm-delivery"
              >
                <Check size={22} strokeWidth={3} />
                Confirm & Release Payment
              </button>
            </div>
          </div>
        )}

        {/* Confirmed state */}
        {currentStatus === 'confirmed' && (
          <div className="text-center py-10 animate-bounce-in glass-panel rounded-3xl border border-border-light">
            <span className="text-7xl block mb-5 drop-shadow-[0_0_20px_rgba(0,255,135,0.4)]">🎉</span>
            <h3 className="text-[24px] font-extrabold text-white mb-3">Task Complete!</h3>
            <p className="text-[15px] text-charcoal-light font-medium mb-8 px-6">Payment of <strong className="text-accent">{task.offeredPrice} MAD</strong> has been released to the runner.</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary text-[15px] font-bold px-8 py-4 rounded-xl shadow-lg"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>

      {/* Report Dispute Modal */}
      {showReport && task && runner && (
        <ReportDispute
          taskId={task.id}
          reportedUserId={runner.id}
          onClose={() => setShowReport(false)}
          onSubmitted={() => {
            setShowReport(false);
            alert('Your report has been submitted. Our team will review it shortly.');
          }}
        />
      )}
    </div>
  );
}
