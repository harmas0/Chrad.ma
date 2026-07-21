import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Camera, Check, Phone, Clock, AlertTriangle } from 'lucide-react';
import { fetchTaskById, updateTaskStatus } from '../data/tasksApi';
import { fetchProfileById } from '../data/usersApi';
import MapView from '../components/MapView';
import StatusTimeline from '../components/StatusTimeline';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import ReportDispute from '../components/ReportDispute';
import { useI18n } from '../utils/i18n';
import { submitReview } from '../data/reviewsApi';
import { compressImage } from '../utils/imageCompressor';

// Helper to compute distance in meters between two lat/lng coordinates
function getHaversineDistance(coords1, coords2) {
  if (!coords1 || !coords2) return null;
  const R = 6371e3; // metres
  const phi1 = (coords1.lat * Math.PI) / 180;
  const phi2 = (coords2.lat * Math.PI) / 180;
  const deltaPhi = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const deltaLambda = ((coords2.lng - coords1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export default function ActiveTask() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, formatPrice } = useI18n();
  const [task, setTask] = useState(null);
  const [runner, setRunner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate runner movement
  const [runnerPos, setRunnerPos] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('accepted');
  const isRunner = user && task && user.id === task.acceptedRunnerId;
  const isClient = user && task && user.id === task.clientId;
  const lastDbWriteRef = useRef(0);

  // Geofencing states
  const [geofenceInfo, setGeofenceInfo] = useState(null);

  // Dev simulation states
  const [simRoute, setSimRoute] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulate movement along OSRM route in Dev mode
  useEffect(() => {
    const isRunner = user?.id === task?.acceptedRunnerId;
    if (!isSimulating || simRoute.length === 0 || !isRunner) return;

    let currentStep = 0;
    const trackingChannel = supabase.channel(`task-${id}-tracking`);

    const interval = setInterval(async () => {
      if (currentStep >= simRoute.length) {
        setIsSimulating(false);
        clearInterval(interval);
        return;
      }

      const nextPos = { lat: simRoute[currentStep][0], lng: simRoute[currentStep][1] };
      setRunnerPos(nextPos);

      // Broadcast simulated position to client
      trackingChannel.send({
        type: 'broadcast',
        event: 'location',
        payload: nextPos,
      });

      // Throttled database persist
      const now = Date.now();
      if (now - lastDbWriteRef.current >= 15000) { // faster database writes during simulation
        lastDbWriteRef.current = now;
        try {
          await supabase.from('runner_locations').upsert({
            task_id: id,
            runner_id: user.id,
            lat: nextPos.lat,
            lng: nextPos.lng,
          }, { onConflict: 'task_id' });
        } catch (e) {
          console.error('Simulation: Failed to persist location:', e);
        }
      }

      currentStep++;
    }, 450); // fast simulation step tick

    return () => {
      clearInterval(interval);
    };
  }, [isSimulating, simRoute, task?.acceptedRunnerId, id, user?.id]);

  // Compute geofence proximity alert
  useEffect(() => {
    if (!task || !runnerPos) {
      setGeofenceInfo(null);
      return;
    }

    const targetCoords = (currentStatus === 'accepted' || !task.destination) ? task.pickup : task.destination;
    if (!targetCoords) {
      setGeofenceInfo(null);
      return;
    }

    const dist = getHaversineDistance(runnerPos, targetCoords);
    if (dist !== null && dist <= 150) {
      setGeofenceInfo({
        distance: dist,
        type: (currentStatus === 'accepted' || !task.destination) ? 'pickup' : 'destination',
      });
    } else {
      setGeofenceInfo(null);
    }
  }, [runnerPos?.lat, runnerPos?.lng, task?.id, currentStatus]);

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [deliveryPhotoFile, setDeliveryPhotoFile] = useState(null);
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState(null);
  const [uploadingDeliveryPhoto, setUploadingDeliveryPhoto] = useState(false);
  const [showDeliveryUpload, setShowDeliveryUpload] = useState(false);
  const deliveryInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const tVal = await fetchTaskById(id);
      if (cancelled) return;
      if (tVal) {
        setTask(tVal);
        setCurrentStatus(tVal.status);
        if (tVal.acceptedRunnerId) {
          const u = await fetchProfileById(tVal.acceptedRunnerId);
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

    const channel = supabase.channel(`task-${id}-tracking`);

    if (isRunner) {
      // Runner: Watch GPS, broadcast location, and persist to DB
      let watchId;
      const handlePosition = async (pos) => {
        if (isSimulating) return; // skip if simulating
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setRunnerPos(newPos);
        // Broadcast to client
        channel.send({
          type: 'broadcast',
          event: 'location',
          payload: newPos,
        });
        // Persist to lightweight table with throttling (max once every 30s)
        const now = Date.now();
        if (now - lastDbWriteRef.current >= 30000) {
          lastDbWriteRef.current = now;
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
        }
      };

      const handleError = (err) => {
        console.error('GPS error:', err);
      };

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED' && !isSimulating) {
          if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
              enableHighAccuracy: true,
              maximumAge: 5000,
              timeout: 10000,
            });
          }
        }
      });

      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        supabase.removeChannel(channel);
      };
    } else if (isClient) {
      // Client: Listen to runner location broadcast
      channel.on('broadcast', { event: 'location' }, (payload) => {
        setRunnerPos(payload.payload);
      }).subscribe();

      // Fallback: Poll runner location from DB every 10s
      const interval = setInterval(async () => {
        try {
          const { data: locData } = await supabase
            .from('runner_locations')
            .select('*')
            .eq('task_id', id)
            .maybeSingle();
          if (locData) {
            setRunnerPos({ lat: Number(locData.lat), lng: Number(locData.lng) });
          }
        } catch (e) {
          console.error('Failed to poll runner location:', e);
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [task, user, id, isSimulating]);

  const handleStatusChange = async (newStatus) => {
    setCurrentStatus(newStatus);
    const success = await updateTaskStatus(id, newStatus);
    if (!success) {
      alert('Failed to update status');
      // Revert status
      if (task) setCurrentStatus(task.status);
    }
  };

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
        <p className="text-charcoal-light font-bold text-lg">Task not found</p>
      </div>
    );
  }

  const canConfirm = isClient && currentStatus === 'delivered';
  const reportedUserId = isRunner ? task.clientId : task.acceptedRunnerId;
  const canReport = runner && !['confirmed', 'cancelled'].includes(currentStatus) && (isClient || isRunner);

  return (
    <div className="min-h-screen bg-dark flex flex-col pt-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-floating border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-dark/70 border border-white/10 flex items-center justify-center text-white hover:bg-surface transition-colors active-press"
            id="active-back"
          >
            <ArrowLeft size={19} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="font-heading font-black text-white text-[16px] leading-tight line-clamp-1">{task.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-accent font-black uppercase tracking-wider bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                Live Tracking
              </span>
            </div>
          </div>
        </div>

        {/* Dev Mode Simulation Controller */}
        {window.location.hostname === 'localhost' && isRunner && simRoute.length > 0 && (
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all border z-[1000]
              ${isSimulating 
                ? 'bg-danger/20 border-danger text-danger animate-pulse'
                : 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
              }`}
          >
            {isSimulating ? 'Stop Sim' : 'Simulate Trip'}
          </button>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 min-h-[300px] relative">
        <MapView
          pickupCoords={task.pickup}
          destCoords={task.category !== 'custom' ? task.destination : null}
          waypoints={task.waypoints || []}
          runnerCoords={runnerPos}
          height="100%"
          darkMode
          showUserLocation
          showRouteInfo={true}
          onRouteCalculated={(stats) => {
            if (stats?.coordinates) {
              setSimRoute(stats.coordinates);
            }
          }}
        />
      </div>

      {/* Bottom Panel */}
      <div className="px-5 py-8 animate-slide-up relative z-10 -mt-6">
        {/* Geofence Proximity Alert Banner */}
        {geofenceInfo && (
          <div className="glass-panel border-2 border-accent/40 bg-accent/5 rounded-3xl p-5 flex items-center gap-3.5 shadow-[0_8px_32px_rgba(0,255,135,0.15)] animate-bounce-in mb-6">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-[20px] flex-shrink-0 animate-pulse">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-black text-white leading-tight">
                {isRunner ? 'You have arrived!' : 'Runner is on-site!'}
              </h4>
              <p className="text-[11px] text-charcoal-light font-medium mt-1 leading-snug">
                {isRunner 
                  ? `You are within ${Math.round(geofenceInfo.distance)}m of the ${geofenceInfo.type === 'pickup' ? 'pickup point' : 'destination'}.`
                  : `The runner is ${Math.round(geofenceInfo.distance)}m from the ${geofenceInfo.type === 'pickup' ? 'pickup point' : 'destination'}.`
                }
              </p>
            </div>
          </div>
        )}

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
                <span>{runner.completed_tasks || 0} {t('tasks')}</span>
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
                  onClick={() => alert(t('no_phone_error'))}
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
            <span className="text-[13px] text-charcoal-light font-bold uppercase tracking-wider">{t('price_agreed')}</span>
            <span className="text-[20px] font-black text-accent">{formatPrice(task.offeredPrice)}</span>
          </div>
        </div>

        {/* Status action buttons */}
        {isRunner && (
          <div className="flex gap-4 mb-6 w-full">
            {currentStatus === 'accepted' && (
              <button
                onClick={() => handleStatusChange('picked_up')}
                className="flex-1 py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                📦 {t('mark_picked')}
              </button>
            )}
            {currentStatus === 'picked_up' && (
              <button
                onClick={() => handleStatusChange('en_route')}
                className="flex-1 py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                🚗 {t('mark_route')}
              </button>
            )}
            {currentStatus === 'en_route' && (
              <div className="w-full flex flex-col gap-3">
                {showDeliveryUpload ? (
                  <div className="glass-panel border border-accent/30 rounded-3xl p-5 text-center relative overflow-hidden w-full">
                    <h4 className="text-[15px] font-extrabold text-white mb-2">Upload Delivery Proof</h4>
                    <p className="text-[12px] text-charcoal-light mb-4">Please take or upload a photo of the delivered item / location.</p>
                    
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={deliveryInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setDeliveryPhotoFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setDeliveryPhotoPreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    {deliveryPhotoPreview ? (
                      <div className="relative mb-4 w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border">
                        <img src={deliveryPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            setDeliveryPhotoFile(null);
                            setDeliveryPhotoPreview(null);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-dark/80 flex items-center justify-center text-white"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => deliveryInputRef.current?.click()}
                        className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-accent/50 bg-dark flex flex-col items-center justify-center gap-2 mb-4"
                      >
                        <Camera className="text-charcoal-light" size={28} />
                        <span className="text-[12px] text-charcoal-light font-bold">Take Delivery Photo</span>
                      </button>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeliveryUpload(false);
                          setDeliveryPhotoFile(null);
                          setDeliveryPhotoPreview(null);
                        }}
                        className="flex-1 py-3 rounded-xl border border-border text-charcoal-light font-bold text-[13px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!deliveryPhotoFile) return;
                          setUploadingDeliveryPhoto(true);
                          try {
                            const compFile = await compressImage(deliveryPhotoFile);
                            const filePath = `delivery-proof/${task.id}-${Date.now()}.jpg`;
                            const { error: uploadErr } = await supabase.storage
                              .from('task-photos')
                              .upload(filePath, compFile, { upsert: true });
                            if (uploadErr) throw uploadErr;

                            const { data: urlData } = supabase.storage
                              .from('task-photos')
                              .getPublicUrl(filePath);

                            if (urlData?.publicUrl) {
                              const success = await updateTaskStatus(task.id, 'delivered', {
                                delivery_photo_url: urlData.publicUrl,
                              });
                              if (success) {
                                setCurrentStatus('delivered');
                                setTask(prev => ({ ...prev, status: 'delivered', deliveryPhotoUrl: urlData.publicUrl }));
                                setShowDeliveryUpload(false);
                              } else {
                                alert('Failed to mark task as delivered');
                              }
                            }
                          } catch (err) {
                            alert('Upload failed: ' + err.message);
                          } finally {
                            setUploadingDeliveryPhoto(false);
                          }
                        }}
                        disabled={!deliveryPhotoFile || uploadingDeliveryPhoto}
                        className="flex-1 btn-accent py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5"
                      >
                        {uploadingDeliveryPhoto ? (
                          <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Submit & Deliver'
                        )}
                      </button>
                    </div>

                    <button
                      onClick={async () => {
                        setUploadingDeliveryPhoto(true);
                        try {
                          const success = await updateTaskStatus(task.id, 'delivered');
                          if (success) {
                            setCurrentStatus('delivered');
                            setTask(prev => ({ ...prev, status: 'delivered' }));
                            setShowDeliveryUpload(false);
                          }
                        } catch (err) {
                          alert('Failed to mark delivered: ' + err.message);
                        } finally {
                          setUploadingDeliveryPhoto(false);
                        }
                      }}
                      className="text-[11px] text-charcoal-light font-bold hover:text-white mt-3 block mx-auto underline"
                    >
                      Skip photo & mark delivered
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeliveryUpload(true)}
                    className="w-full py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
                  >
                    ✅ {t('mark_delivered')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Report Problem Button */}
        {canReport && (
          <button
            onClick={() => setShowReport(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors text-[13px] font-bold uppercase tracking-wider mb-6"
          >
            <AlertTriangle size={16} />
            {t('report_dispute')}
          </button>
        )}

        {/* Confirm Delivery */}
        {canConfirm && (
          <div className="animate-fade-in-up mb-6">
            <div className="glass-panel border border-accent/30 rounded-3xl p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
              <span className="text-5xl block mb-3 drop-shadow-lg relative z-10">📸</span>
              <h4 className="text-[18px] font-extrabold text-white mb-2 relative z-10">{t('delivery_photo')}</h4>
              <p className="text-[14px] text-charcoal-light font-medium mb-5 relative z-10">
                {task.deliveryPhotoUrl ? 'Runner uploaded delivery proof.' : t('runner_uploaded_photo')}
              </p>

              {/* Proof of delivery photo area */}
              <div className="w-full mb-5 relative z-10">
                {task.deliveryPhotoUrl ? (
                  <img
                    src={task.deliveryPhotoUrl}
                    alt="Delivery Proof"
                    className="w-full h-56 object-cover rounded-2xl border border-border-light shadow-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-dark border-2 border-dashed border-border-light rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <Camera size={40} className="text-muted mx-auto mb-2 opacity-50" />
                      <span className="text-[13px] text-muted font-medium">{t('verification_photo')}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleStatusChange('confirmed')}
                className="w-full py-4 rounded-2xl btn-accent font-extrabold text-[16px] transition-all flex items-center justify-center gap-3 animate-pulse-glow relative z-10"
                id="confirm-delivery"
              >
                <Check size={22} strokeWidth={3} />
                {t('confirm_release')}
              </button>
            </div>
          </div>
        )}

        {/* Confirmed state */}
        {currentStatus === 'confirmed' && (
          <div className="text-center py-8 animate-bounce-in glass-panel rounded-3xl border border-border-light px-6">
            <span className="text-7xl block mb-5 drop-shadow-[0_0_20px_rgba(0,255,135,0.4)]">🎉</span>
            <h3 className="text-[24px] font-extrabold text-white mb-2">{t('task_complete')}</h3>
            <p className="text-[14px] text-charcoal-light font-medium mb-6">{t('payment_released_to_runner')}</p>

            {isClient && !reviewSubmitted ? (
              <div className="border-t border-border pt-6 mt-4 text-left">
                <h4 className="text-[16px] font-bold text-white mb-2 text-center">Rate the Runner</h4>
                <p className="text-[12px] text-charcoal-light text-center mb-4">Share your feedback to help the community.</p>
                
                {/* Star selection */}
                <div className="flex justify-center gap-3 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-transform active:scale-90 ${star <= rating ? 'text-warning' : 'text-charcoal-light opacity-40'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Leave a comment about the service (optional)..."
                  rows={3}
                  className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium resize-none mb-5"
                />

                <button
                  onClick={async () => {
                    setSubmittingReview(true);
                    await submitReview({
                      taskId: task.id,
                      reviewerId: user.id,
                      revieweeId: task.acceptedRunnerId,
                      rating,
                      comment: reviewComment,
                    });
                    setReviewSubmitted(true);
                    setSubmittingReview(false);
                  }}
                  disabled={submittingReview}
                  className="w-full btn-accent py-3.5 rounded-xl font-bold uppercase tracking-wider text-[14px] flex items-center justify-center gap-2"
                >
                  {submittingReview ? (
                    <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full btn-accent py-4 rounded-xl text-[15px] font-bold uppercase tracking-wider shadow-lg"
              >
                {t('back_home')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Report Dispute Modal */}
      {showReport && task && reportedUserId && (
        <ReportDispute
          taskId={task.id}
          reportedUserId={reportedUserId}
          onClose={() => setShowReport(false)}
          onSubmitted={() => {
            setShowReport(false);
            alert(t('report_submitted'));
          }}
        />
      )}
    </div>
  );
}
