import { useI18n } from '../utils/i18n';
import { useState, useRef } from 'react';
import { AlertTriangle, X, Camera, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createDispute } from '../data/adminApi';

const REASONS = [
  { key: 'didnt_deliver', label: "Didn't deliver", emoji: '📦' },
  { key: 'damaged_item', label: 'Damaged item', emoji: '💔' },
  { key: 'rude_behavior', label: 'Rude behavior', emoji: '😤' },
  { key: 'scam', label: 'Scam / Fraud', emoji: '🚨' },
  { key: 'other', label: 'Other', emoji: '❓' },
];

export default function ReportDispute({ taskId, reportedUserId, onClose, onSubmitted }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 3) {
      setError('Maximum 3 photos allowed');
      return;
    }
    setError(null);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const result = await createDispute({
        taskId,
        reporterId: user.id,
        reportedUserId,
        reason,
        description,
        evidenceUrls: photos,
      });

      if (!result) throw new Error('Failed to submit report');
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-dark-surface border-t border-x border-border-light rounded-t-3xl p-6 animate-slide-up shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-[18px] font-extrabold text-white">{t('report_a_problem')}</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl mb-4 text-[13px] font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* Reason */}
        <div className="mb-5">
          <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-3 block">{t('what_happened')}</label>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map(r => (
              <button
                key={r.key}
                onClick={() => setReason(r.key)}
                className={`flex items-center gap-2.5 p-3.5 rounded-xl text-left transition-all border text-[13px] font-bold
                  ${reason === r.key
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-dark border-border text-charcoal-light hover:text-white hover:border-border-light'
                  }`}
              >
                <span className="text-lg">{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-5">
          <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">{t('description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field w-full px-4 py-3.5 rounded-xl text-[14px] font-medium resize-none"
            rows={3}
            placeholder={t('describe_what_happened_in_detail')}
          />
        </div>

        {/* Evidence Photos */}
        <div className="mb-6">
          <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Evidence (optional, max 3)</label>
          <div className="flex gap-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0">
                <img src={photo} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-dark/80 flex items-center justify-center text-white hover:text-danger transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-accent/50 bg-dark flex items-center justify-center text-charcoal-light hover:text-accent transition-colors"
              >
                <Camera size={22} />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoAdd}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!reason || submitting}
          className="w-full btn-accent py-4 rounded-2xl text-[15px] font-extrabold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} strokeWidth={2.5} />
              {t('submit_report')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
