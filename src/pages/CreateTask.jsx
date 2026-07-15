import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Check, Search, Loader2, Crosshair } from 'lucide-react';
import CategoryCard from '../components/CategoryCard';
import PriceInput from '../components/PriceInput';
import PhotoUpload from '../components/PhotoUpload';
import MapView from '../components/MapView';
import { TASK_CATEGORIES, LOCATIONS, createTask } from '../data/tasksApi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useI18n } from '../utils/i18n';

const STEPS = ['Category', 'Details', 'Location', 'Price', 'Review'];

export default function CreateTask() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, formatPrice } = useI18n();
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
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      const taskId = `task-${Date.now()}`;
      const uploadedUrls = [];

      for (let i = 0; i < form.photos.length; i++) {
        const item = form.photos[i];
        if (item.file) {
          const fileExt = item.file.name.split('.').pop();
          const filePath = `${taskId}/photo-${i}-${Date.now()}.${fileExt}`;
          const { error } = await supabase.storage
            .from('task-photos')
            .upload(filePath, item.file, { upsert: true });

          if (!error) {
            const { data: urlData } = supabase.storage
              .from('task-photos')
              .getPublicUrl(filePath);

            if (urlData?.publicUrl) {
              uploadedUrls.push(urlData.publicUrl);
            }
          }
        }
      }

      const result = await createTask({
        id: taskId,
        clientId,
        category: form.category,
        title: form.title,
        description: form.description,
        photos: uploadedUrls,
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
    } catch (err) {
      alert('Error uploading photos: ' + err.message);
    } finally {
      setSubmitting(false);
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

          <h1 className="text-[18px] font-bold text-white tracking-tight">{t('post_task')}</h1>

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
            <h2 className="text-[24px] font-extrabold text-white mb-2">{t('task_type')}</h2>
            <p className="text-charcoal-light text-[15px] mb-8 font-medium">{t('category_desc')}</p>

            <div className="grid grid-cols-2 gap-5">
              {TASK_CATEGORIES.map((cat, i) => (
                <div key={cat.id} className="stagger-item" style={{ animationDelay: `${i * 0.05}s` }}>
                  <CategoryCard
                    category={{
                      ...cat,
                      label: t(cat.id),
                    }}
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
              <h2 className="text-[24px] font-extrabold text-white mb-2">{t('task_details')}</h2>
              <p className="text-charcoal-light text-[15px] mb-8 font-medium">{t('details_desc')}</p>
            </div>

            <div className="stagger-item mb-6" style={{ animationDelay: '0.1s' }}>
              <label className="text-[14px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">{t('title_label')}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder={t('title_placeholder')}
                className="input-field w-full px-5 py-4 rounded-xl text-[16px] font-medium"
                id="task-title"
              />
            </div>

            <div className="stagger-item mb-6" style={{ animationDelay: '0.2s' }}>
              <label className="text-[14px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">{t('description_label')}</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder={t('description_placeholder')}
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
              <h2 className="text-[24px] font-extrabold text-white mb-2">{t('where_label')}</h2>
              <p className="text-charcoal-light text-[15px] mb-6 font-medium">{t('location_desc')}</p>
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
                  📍 {t('pickup_label')}
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
                  🏁 {t('destination_label')}
                </button>
              </div>
            )}

            {/* Address Search Field */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-4 relative z-10">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-light" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_address')}
                  className="input-field w-full pl-11 pr-4 py-3 rounded-xl font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="btn-accent px-5 py-3 rounded-xl font-bold flex items-center justify-center"
              >
                {searching ? <Loader2 size={18} className="animate-spin" /> : t('explore')}
              </button>
            </form>

            {/* Search results list */}
            {searchResults.length > 0 && (
              <div className="absolute left-5 right-5 mt-1 bg-dark-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectResult(res)}
                    className="w-full px-4 py-3 text-left text-[14px] text-white hover:bg-dark border-b border-border/50 last:border-0 transition-colors flex items-start gap-2.5 font-medium"
                  >
                    <MapPin size={16} className="text-accent shrink-0 mt-0.5" />
                    <span>{res.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locatingGPS}
                className="flex-1 py-3 px-4 rounded-xl bg-dark-surface border border-border text-[13px] font-bold text-white hover:border-border-light transition-all flex items-center justify-center gap-2"
              >
                <Crosshair size={16} className={locatingGPS ? 'animate-spin text-accent' : 'text-charcoal-light'} />
                {locatingGPS ? 'Locating...' : t('use_my_location')}
              </button>
            </div>

            {/* Interactive map panel */}
            <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-border shadow-lg mb-6 relative">
              <MapView
                pickupCoords={form.pickup}
                destCoords={form.category !== 'custom' ? form.destination : null}
                height="100%"
                darkMode
                onClick={handleMapClick}
              />
              <div className="absolute bottom-3 left-3 bg-dark/95 border border-border px-3 py-1.5 rounded-lg backdrop-blur-sm z-30 text-[11px] font-bold text-white">
                {activeTab === 'pickup' ? '📍 Drag to Set Pickup' : '🏁 Drag to Set Destination'}
              </div>
            </div>

            <div className="bg-dark-surface rounded-xl p-4 border border-border flex items-start gap-3">
              <div className="text-xl">🗺️</div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1">
                  {activeTab === 'pickup' ? 'Selected Pickup' : 'Selected Destination'}
                </p>
                <p className="text-[14px] text-white font-medium truncate">
                  {activeTab === 'pickup' ? form.pickup.address : form.destination?.address || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Price */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <h2 className="text-[24px] font-extrabold text-white mb-2">{t('pricing_label')}</h2>
              <p className="text-charcoal-light text-[15px] mb-8 font-medium">{t('pricing_desc')}</p>
            </div>

            <div className="stagger-item mb-8" style={{ animationDelay: '0.1s' }}>
              <label className="text-[13px] font-bold text-charcoal-light block mb-2.5 uppercase tracking-wider">
                {t('how_much_pay')}
              </label>
              <PriceInput
                value={form.price}
                onChange={(v) => update('price', v)}
                min={20}
                max={500}
              />
            </div>

            {form.category === 'shopping' && (
              <div className="stagger-item animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="bg-dark-surface rounded-2xl p-5 border border-border">
                  <div className="mb-4">
                    <label className="text-[14px] font-bold text-white block mb-1">
                      {t('shopping_budget')}
                    </label>
                    <p className="text-[12px] text-charcoal-light">
                      {t('shopping_budget_desc')}
                    </p>
                  </div>
                  <PriceInput
                    value={form.itemBudget}
                    onChange={(v) => update('itemBudget', v)}
                    min={0}
                    max={1500}
                    step={10}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div>
            <div className="mb-6">
              <h2 className="text-[24px] font-extrabold text-white mb-2">{t('review_post')}</h2>
              <p className="text-charcoal-light text-[15px] mb-8 font-medium">{t('review_desc')}</p>
            </div>

            <div className="glass-panel border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />

              {/* Title & Category */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60 relative z-10 mb-5">
                <div>
                  <h3 className="text-[18px] font-black text-white leading-tight mb-1">{form.title}</h3>
                  <span className="text-[11px] font-black uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                    {t(form.category)}
                  </span>
                </div>
                <span className="text-3xl">{selectedCategory?.icon}</span>
              </div>

              {/* Description */}
              {form.description && (
                <div className="relative z-10 mb-7">
                  <span className="text-[12px] text-charcoal-light font-bold uppercase tracking-widest block mb-1">{t('description_label')}</span>
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
                  <span className="text-[14px] text-charcoal-light font-bold uppercase tracking-wider">{t('your_offer')}</span>
                  <span className="text-[28px] font-black text-accent tracking-tighter">{formatPrice(form.price)}</span>
                </div>
                {form.category === 'shopping' && form.itemBudget > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-charcoal-light font-bold uppercase tracking-wider">{t('item_budget')}</span>
                    <span className="text-[20px] font-bold text-warning">{formatPrice(form.itemBudget)}</span>
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
              {t('continue')}
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl btn-accent font-extrabold text-[16px] flex items-center justify-center gap-3 disabled:opacity-50"
              id="create-submit"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check size={20} strokeWidth={3} />
                  {t('post_task_btn')} — {formatPrice(form.price)}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
