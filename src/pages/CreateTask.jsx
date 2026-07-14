import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Check } from 'lucide-react';
import CategoryCard from '../components/CategoryCard';
import PriceInput from '../components/PriceInput';
import PhotoUpload from '../components/PhotoUpload';
import MapView from '../components/MapView';
import { TASK_CATEGORIES, LOCATIONS, createTask } from '../data/mockTasks';
import { getCurrentUserId } from '../data/mockUsers';

const STEPS = ['Category', 'Details', 'Location', 'Price', 'Review'];

export default function CreateTask() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const canProceed = () => {
    if (step === 0) return form.category;
    if (step === 1) return form.title.trim().length > 3;
    return true;
  };

  const handleSubmit = async () => {
    const clientId = getCurrentUserId();
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
              <p className="text-charcoal-light text-[15px] mb-8 font-medium">Pin the pickup and destination locations.</p>
            </div>

            {/* Pickup */}
            <div className="stagger-item mb-6" style={{ animationDelay: '0.1s' }}>
              <label className="text-[14px] font-bold text-charcoal-light flex items-center gap-2 mb-3 uppercase tracking-wider">
                <span className="w-6 h-6 bg-accent/20 text-accent rounded-full flex items-center justify-center text-[12px] border border-accent/30">📍</span>
                Pickup Location
              </label>
              <div className="flex items-center gap-3 px-5 py-4 bg-dark-surface border border-border rounded-xl text-[15px] font-semibold text-white">
                <MapPin size={18} className="text-accent" />
                {form.pickup.name || 'Maarif, Casablanca'}
              </div>
            </div>

            {/* Map */}
            <div className="stagger-item overflow-hidden rounded-2xl border border-border shadow-lg mb-6" style={{ animationDelay: '0.2s' }}>
              <MapView
                pickup={form.pickup}
                destination={form.category !== 'custom' ? form.destination : null}
                height="240px"
              />
            </div>

            {/* Destination */}
            {form.category !== 'custom' && (
              <div className="stagger-item" style={{ animationDelay: '0.3s' }}>
                <label className="text-[14px] font-bold text-charcoal-light flex items-center gap-2 mb-3 uppercase tracking-wider mt-4">
                  <span className="w-6 h-6 bg-danger/20 text-danger rounded-full flex items-center justify-center text-[12px] border border-danger/30">🏁</span>
                  Destination
                </label>
                <div className="flex items-center gap-3 px-5 py-4 bg-dark-surface border border-border rounded-xl text-[15px] font-semibold text-white">
                  <MapPin size={18} className="text-danger" />
                  {form.destination.name || 'Anfa, Casablanca'}
                </div>
              </div>
            )}
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
