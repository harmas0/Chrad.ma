import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Check, Search, Loader2, Crosshair } from 'lucide-react';
import CategoryCard from '../components/CategoryCard';
import PriceInput from '../components/PriceInput';
import PhotoUpload from '../components/PhotoUpload';
import MapView from '../components/MapView';
import { TASK_CATEGORIES, LOCATIONS, createTask } from '../data/mockTasks';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Category', 'Details', 'Location', 'Price', 'Review'];

export default function CreateTask() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const initialCategory = location.state?.category || null;

  const [step, setStep] = useState(initialCategory ? 1 : 0);
  const [form, setForm] = useState({
    category: initialCategory,
    title: '',
    description: '',
    photos: [],
    pickup: LOCATIONS.maarif,
    destination: LOCATIONS.anfa,
    price: 50,
    itemBudget: 0,
  });
  const [submitted, setSubmitted] = useState(false);

  const [activeTab, setActiveTab] = useState('pickup');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locatingGPS, setLocatingGPS] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}+Morocco&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    const loc = {
      lat: Number(result.lat),
      lng: Number(result.lon),
      name: result.display_name.split(',')[0],
      address: result.display_name,
    };
    update(activeTab, loc);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleMapClick = async (latlng) => {
    const { lat, lng } = latlng;
    const loc = {
      lat,
      lng,
      name: 'Custom Location',
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };
    update(activeTab, loc);
    // Reverse geocode asynchronously to get a readable address
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        update(activeTab, {
          lat,
          lng,
          name: data.name || data.display_name.split(',')[0],
          address: data.display_name,
        });
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const loc = {
          lat, lng,
          name: 'My Location',
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        };
        update(activeTab, loc);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data?.display_name) {
            update(activeTab, {
              lat, lng,
              name: data.name || data.display_name.split(',')[0],
              address: data.display_name,
            });
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
        } finally {
          setLocatingGPS(false);
        }
      },
      () => setLocatingGPS(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const canProceed = () => {
    if (step === 0) return form.category;
    if (step === 1) return form.title.trim().length > 3;
    return true;
  };

  const handleSubmit = async () => {
    const clientId = user?.id;
    if (!clientId) {
      alert('You must be logged in to post a task.');
      return;
    }
    const result = await createTask({
      clientId,
      category: form.category,
      title: form.title,
      description: form.description,
      photos: form.photos,
      pickup: form.pickup,
      destination: form.destination,
      price: form.price,
      itemBudget: form.itemBudget,
    });
    if (result) {
      setSubmitted(true);
      setTimeout(() => navigate('/'), 2000);
    } else {
      alert('Failed to post task. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center bg-dark">
        <div className="animate-bounce-in text-7xl mb-8 drop-shadow-[0_0_20px_rgba(0,255,135,0.4)]">🚀</div>
        <h2 className="text-[26px] font-extrabold text-white mb-3">Task Posted!</h2>
        <p className="text-charcoal-light text-[15px] mb-6">Runners nearby are being notified.</p>
        <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-accent/10 border border-accent/20 text-accent text-[14px] font-bold animate-pulse-glow">
          <div className="w-2.5 h-2.5 bg-accent rounded-full animate-ping" />
          Broadcasting to runners...
        </div>
      </div>
    );
  }

  const selectedCategory = TASK_CATEGORIES.find(c => c.id === form.category);

  return (
    <div className="pb-action-bar min-h-screen bg-dark">
      {/* Top bar */}
      <div className="sticky top-0 z-40 glass border-b border-border px-5 pt-safe pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
            className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-colors"
            id="create-back"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-[18px] font-bold text-white tracking-tight">Post a Task</h1>

          <span className="text-[14px] text-accent font-bold bg-accent/10 px-3 py-1 rounded-full">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-dark-surface rounded-full overflow-hidden border border-border-light">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,255,135,0.5)]"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="px-5 py-10 animate-fade-in-up" key={step}>
        {/* STEP 0: Category */}
        {step === 0 && (
          <div>
            <h2 className="text-[24px] font-extrabold text-white mb-2">What type of task?</h2>
            <p className="text-charcoal-light text-[15px] mb-8 font-medium">Select the category that best fits your need.</p>

            <div className="grid grid-cols-2 gap-5">
              {TASK_CATEGORIES.map((cat, i) => (
                <div key={cat.id} className="stagger-item" style={{ animationDelay: `${i * 0.05}s` }}>
                  <CategoryCard
                    category={cat}
                    isSelected={form.category === cat.id}
                    onClick={(id) => update('category', id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Details */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h2 className="text-[24px] font-extrabold text-white mb-2">Task Details</h2>
              <p className="text-charcoal-light text-[15px] mb-8 font-medium">Be specific so runners know exactly what to do.</p>
            </div>

            <div className="stagger-item mb-6" style={{ animationDelay: '0.1s' }}>
              <label className="text-[14px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g., Send contracts to notary office"
                className="input-field w-full px-5 py-4 rounded-xl text-[16px] font-medium"
                id="task-title"
              />
            </div>

            <div className="stagger-item mb-6" style={{ animationDelay: '0.2s' }}>
              <label className="text-[14px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe the task in detail..."
                rows={5}
                className="input-field w-full px-5 py-4 rounded-xl text-[16px] font-medium resize-none"
                id="task-description"
              />
            </div>

            <div className="stagger-item mb-6" style={{ animationDelay: '0.3s' }}>
              <PhotoUpload
                photos={form.photos}
                onPhotosChange={(photos) => update('photos', photos)}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <h2 className="text-[24px] font-extrabold text-white mb-2">Where?</h2>
              <p className="text-charcoal-light text-[15px] mb-6 font-medium">Search for an address or click anywhere on the map to set a location pin.</p>
            </div>

            {/* Tab selection */}
            {form.category !== 'custom' && (
              <div className="grid grid-cols-2 gap-3 mb-5 bg-dark-surface p-1.5 rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('pickup')}
                  className={`py-3 px-4 rounded-xl text-[14px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
                    ${activeTab === 'pickup'
                      ? 'bg-accent text-dark shadow-[0_0_15px_rgba(0,255,135,0.3)]'
                      : 'text-charcoal-light hover:text-white'
                    }`}
                >
                  📍 Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('destination')}
                  className={`py-3 px-4 rounded-xl text-[14px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2
                    ${activeTab === 'destination'
                      ? 'bg-danger text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'text-charcoal-light hover:text-white'
                    }`}
                >
                  🏁 Destination
                </button>
              </div>
            )}

            {/* Address Search Field */}
            <form onSubmit={handleSearch} className="relative mb-5 stagger-item">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search address in Morocco for ${activeTab}...`}
                    className="input-field w-full pl-12 pr-5 py-4 rounded-xl text-[15px] font-semibold"
                  />
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-light" />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-5 rounded-xl btn-accent font-bold text-[14px] flex items-center justify-center transition-all"
                >
                  {searching ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
                </button>
              </div>

              {/* Suggestions */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 z-50 glass-panel border border-border-light rounded-2xl overflow-hidden shadow-2xl divide-y divide-border">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="w-full px-5 py-3.5 hover:bg-surface text-left text-[13px] font-semibold text-white leading-snug transition-colors flex flex-col gap-0.5"
                    >
                      <span className="text-[14px] text-accent font-bold">{result.display_name.split(',')[0]}</span>
                      <span className="text-charcoal-light text-[11px] truncate">{result.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Use My Location GPS Button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locatingGPS}
              className="w-full mt-3 mb-2 flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/15 text-accent font-bold text-[14px] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {locatingGPS ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Crosshair size={18} />
              )}
              {locatingGPS ? 'Detecting location...' : `Use my GPS for ${activeTab}`}
            </button>

            {/* Active Pin Visualizer */}
            <div className="glass-panel p-4.5 rounded-2xl border border-border-light mb-5 flex flex-col gap-1.5 stagger-item">
              <span className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${activeTab === 'pickup' ? 'bg-accent' : 'bg-danger'}`} />
                Configuring {activeTab} pin
              </span>
              <h4 className="text-[15px] font-bold text-white leading-snug">
                {activeTab === 'pickup' ? form.pickup.name : form.destination.name}
              </h4>
              <p className="text-[12px] text-charcoal-light leading-relaxed truncate">
                {activeTab === 'pickup' ? form.pickup.address || 'Select on map' : form.destination.address || 'Select on map'}
              </p>
            </div>

            {/* Interactive Leaflet Map */}
            <div className="stagger-item overflow-hidden rounded-2xl border border-border shadow-lg mb-6" style={{ animationDelay: '0.2s' }}>
              <MapView
                pickup={form.pickup}
                destination={form.category !== 'custom' ? form.destination : null}
                height="280px"
                onMapClick={handleMapClick}
                showUserLocation
                showRouteInfo
                darkMode
              />
            </div>
          </div>
        )}

        {/* STEP 3: Price */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <h2 className="text-[24px] font-extrabold text-white mb-2">Name Your Price</h2>
              <p className="text-charcoal-light text-[15px] mb-8 font-medium">Set a fair starting price. Runners will bid or counter-offer.</p>
            </div>

            <div className="stagger-item mb-6" style={{ animationDelay: '0.1s' }}>
              <PriceInput
                value={form.price}
                onChange={(v) => update('price', v)}
                label="Runner Fee"
              />
            </div>

            {form.category === 'shopping' && (
              <div className="stagger-item mt-8 pt-8 border-t border-border mb-6" style={{ animationDelay: '0.2s' }}>
                <PriceInput
                  value={form.itemBudget}
                  onChange={(v) => update('itemBudget', v)}
                  label="Item Budget"
                  min={0}
                  max={1000}
                  step={10}
                />
                <p className="text-[13px] text-accent mt-4 font-medium flex items-start gap-2 bg-accent/10 p-3 rounded-xl border border-accent/20">
                  <span className="text-[16px]">💡</span> 
                  This amount covers the cost of items the runner will purchase for you.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div>
            <div className="mb-6">
              <h2 className="text-[24px] font-extrabold text-white mb-2">Review & Post</h2>
              <p className="text-charcoal-light text-[15px] mb-6 font-medium">Everything look good? Let's get it done.</p>
            </div>

            <div className="glass-panel rounded-3xl p-7 border border-border-light stagger-item relative overflow-hidden mb-6" style={{ animationDelay: '0.1s' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
              
              {/* Category */}
              <div className="flex items-center gap-3 relative z-10 mb-7">
                <span className="text-3xl drop-shadow-md">{selectedCategory?.icon}</span>
                <span className="text-[18px] font-bold text-white tracking-wide">{selectedCategory?.label}</span>
              </div>

              <hr className="border-border mb-7" />

              {/* Title */}
              <div className="relative z-10 mb-7">
                <span className="text-[12px] text-charcoal-light font-bold uppercase tracking-widest block mb-1">Task</span>
                <span className="text-[16px] font-semibold text-white">{form.title || 'Untitled task'}</span>
              </div>

              {/* Description */}
              {form.description && (
                <div className="relative z-10 mb-7">
                  <span className="text-[12px] text-charcoal-light font-bold uppercase tracking-widest block mb-1">Details</span>
                  <span className="text-[14px] text-charcoal-light leading-relaxed font-medium">{form.description}</span>
                </div>
              )}

              {/* Route */}
              <div className="flex flex-col gap-3 relative z-10 bg-dark-surface p-4 rounded-xl border border-border mb-7">
                <div className="flex items-center gap-3 text-[14px] font-medium text-white">
                  <span className="text-accent bg-accent/20 p-1.5 rounded-lg border border-accent/30 text-[12px]">📍</span>
                  {form.pickup.name}
                </div>
                {form.destination && form.category !== 'custom' && (
                  <div className="flex items-center gap-3 text-[14px] font-medium text-white">
                    <span className="text-danger bg-danger/20 p-1.5 rounded-lg border border-danger/30 text-[12px]">🏁</span>
                    {form.destination.name}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="pt-4 border-t border-border relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] text-charcoal-light font-bold uppercase tracking-wider">Your Offer</span>
                  <span className="text-[28px] font-black text-accent tracking-tighter">{form.price} <span className="text-[14px] text-accent/80 font-bold uppercase tracking-widest">MAD</span></span>
                </div>
                {form.category === 'shopping' && form.itemBudget > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-charcoal-light font-bold uppercase tracking-wider">Item Budget</span>
                    <span className="text-[20px] font-bold text-warning">{form.itemBudget} <span className="text-[14px] text-warning/80 font-bold uppercase tracking-widest">MAD</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div 
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 glass-panel border-t border-border-light px-6 pt-5"
        style={{ paddingBottom: 'calc(24px + var(--safe-area-bottom, 0px))' }}
      >
        <div className="w-full">
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-2xl font-bold text-[16px] flex items-center justify-center gap-3 transition-all duration-300
                ${canProceed()
                  ? 'btn-accent shadow-[0_8px_25px_rgba(0,255,135,0.3)]'
                  : 'bg-dark-surface text-muted cursor-not-allowed border border-border'
                }`}
              id="create-next"
            >
              Continue
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="w-full py-4 rounded-2xl btn-accent font-extrabold text-[16px] flex items-center justify-center gap-3 animate-pulse-glow"
              id="create-submit"
            >
              <Check size={20} strokeWidth={3} />
              Post Task — {form.price} MAD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
