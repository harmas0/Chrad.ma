import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, Check, Shield, AlertCircle, Clock, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadKYCDocument, submitKYC } from '../data/adminApi';
import { compressImage } from '../utils/imageCompressor';

const STEPS = ['ID Document', 'Selfie', 'Vehicle Docs', 'Review'];

export default function KYCUpload() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [vehicleFile, setVehicleFile] = useState(null);
  const [vehiclePreview, setVehiclePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const idInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const vehicleInputRef = useRef(null);

  // If already submitted or approved
  if (profile?.kyc_status === 'pending' || profile?.kyc_status === 'approved') {
    return (
      <div className="min-h-screen bg-dark px-5 pt-safe pb-safe">
        <div className="pt-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors mb-6">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="glass-panel rounded-3xl p-8 text-center border border-border-light mt-10 animate-fade-in-up">
          {profile.kyc_status === 'approved' ? (
            <>
              <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent mx-auto mb-5 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,135,0.15)]">
                <Check size={36} className="text-accent" />
              </div>
              <h2 className="text-[22px] font-black text-white mb-2">Identity Verified</h2>
              <p className="text-[14px] text-charcoal-light font-medium">Your identity has been verified. You can now accept runner tasks.</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-warning/10 border-2 border-warning mx-auto mb-5 flex items-center justify-center animate-pulse-glow" style={{ '--tw-shadow-color': 'rgba(255,176,32,0.3)' }}>
                <Clock size={36} className="text-warning" />
              </div>
              <h2 className="text-[22px] font-black text-white mb-2">Verification Pending</h2>
              <p className="text-[14px] text-charcoal-light font-medium">Your documents are being reviewed. This usually takes 1-2 business days.</p>
            </>
          )}
          <button
            onClick={() => navigate('/profile')}
            className="mt-6 btn-accent py-3.5 px-8 rounded-xl text-[14px] font-bold"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  // Rejected — allow resubmission
  const wasRejected = profile?.kyc_status === 'rejected';

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'id') {
        setIdFile(file);
        setIdPreview(reader.result);
      } else if (type === 'selfie') {
        setSelfieFile(file);
        setSelfiePreview(reader.result);
      } else if (type === 'vehicle') {
        setVehicleFile(file);
        setVehiclePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!idFile || !selfieFile || !vehicleFile) return;
    setUploading(true);
    setError(null);

    try {
      const [compId, compSelfie, compVehicle] = await Promise.all([
        compressImage(idFile),
        compressImage(selfieFile),
        compressImage(vehicleFile),
      ]);

      const [idUrl, selfieUrl, vehicleUrl] = await Promise.all([
        uploadKYCDocument(user.id, compId, 'id'),
        uploadKYCDocument(user.id, compSelfie, 'selfie'),
        uploadKYCDocument(user.id, compVehicle, 'vehicle'),
      ]);

      if (!idUrl || !selfieUrl || !vehicleUrl) throw new Error('Failed to upload documents');

      const success = await submitKYC(user.id, idUrl, selfieUrl, vehicleUrl);
      if (!success) throw new Error('Failed to submit KYC');

      setSubmitted(true);
      refreshProfile?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark px-5 pt-safe pb-safe flex items-center justify-center">
        <div className="glass-panel rounded-3xl p-8 text-center border border-border-light animate-bounce-in max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent mx-auto mb-5 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,135,0.15)]">
            <Check size={36} className="text-accent" />
          </div>
          <h2 className="text-[22px] font-black text-white mb-2">Documents Submitted!</h2>
          <p className="text-[14px] text-charcoal-light font-medium mb-6">
            Our team will review your documents within 1-2 business days. You'll be notified once verified.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="btn-accent py-3.5 px-8 rounded-xl text-[14px] font-bold w-full"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark px-5 pt-safe pb-safe">
      {/* Header */}
      <div className="pt-4 mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-accent" />
            <span className="text-[14px] font-bold text-white">Identity Verification</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Rejected notice */}
        {wasRejected && (
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 mb-6 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-danger mb-1">Previous submission rejected</p>
                <p className="text-[12px] text-charcoal-light">{profile?.kyc_rejection_reason || 'Please resubmit with clearer documents.'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black border-2 transition-all duration-300
                ${i < step ? 'bg-accent border-accent text-dark' : i === step ? 'border-accent text-accent bg-accent/10' : 'border-border text-charcoal-light bg-dark-surface'}`}>
                {i < step ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider hidden sm:block ${i <= step ? 'text-accent' : 'text-charcoal-light'}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl mb-4 text-[13px] font-medium animate-fade-in">
          {error}
        </div>
      )}

      {/* Step 0: ID Document */}
      {step === 0 && (
        <div className="animate-fade-in-up">
          <h2 className="text-[22px] font-black text-white mb-2">Upload your ID</h2>
          <p className="text-[14px] text-charcoal-light font-medium mb-6">
            Take a clear photo of the front of your National ID card (CIN) or passport.
          </p>

          <input
            ref={idInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileChange(e, 'id')}
            className="hidden"
          />

          {idPreview ? (
            <div className="relative mb-6">
              <img src={idPreview} alt="ID Preview" className="w-full aspect-[16/10] object-cover rounded-2xl border border-border-light shadow-lg" />
              <button
                onClick={() => { setIdFile(null); setIdPreview(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-dark/80 backdrop-blur-sm border border-border flex items-center justify-center text-white hover:text-danger transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => idInputRef.current?.click()}
              className="w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-border hover:border-accent/50 bg-dark-surface flex flex-col items-center justify-center gap-4 transition-all group mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Camera size={28} />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold text-white mb-1">Tap to capture or upload</p>
                <p className="text-[12px] text-charcoal-light">JPEG, PNG • Max 10MB</p>
              </div>
            </button>
          )}

          <div className="bg-dark-surface rounded-xl p-4 border border-border mb-6">
            <p className="text-[11px] font-bold text-charcoal-light uppercase tracking-widest mb-2">Tips for a good photo</p>
            <ul className="space-y-1.5">
              {['Make sure all text is readable', 'Avoid glare and shadows', 'Include all four corners', 'Use a flat, dark background'].map((tip, i) => (
                <li key={i} className="text-[12px] text-charcoal-light flex items-center gap-2">
                  <Check size={10} className="text-accent shrink-0" /> {tip}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!idFile}
            className="w-full btn-accent py-4 rounded-2xl text-[15px] font-extrabold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continue <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Step 1: Selfie */}
      {step === 1 && (
        <div className="animate-fade-in-up">
          <h2 className="text-[22px] font-black text-white mb-2">Take a Selfie</h2>
          <p className="text-[14px] text-charcoal-light font-medium mb-6">
            Take a clear selfie of yourself holding your ID card next to your face.
          </p>

          <input
            ref={selfieInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => handleFileChange(e, 'selfie')}
            className="hidden"
          />

          {selfiePreview ? (
            <div className="relative mb-6">
              <img src={selfiePreview} alt="Selfie Preview" className="w-full aspect-square object-cover rounded-2xl border border-border-light shadow-lg" />
              <button
                onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-dark/80 backdrop-blur-sm border border-border flex items-center justify-center text-white hover:text-danger transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => selfieInputRef.current?.click()}
              className="w-full aspect-square max-h-[400px] rounded-2xl border-2 border-dashed border-border hover:border-accent/50 bg-dark-surface flex flex-col items-center justify-center gap-4 transition-all group mb-6 relative overflow-hidden"
            >
              {/* Face outline guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-60 border-2 border-accent/30 rounded-[50%] border-dashed" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform z-10">
                <Camera size={28} />
              </div>
              <div className="text-center z-10">
                <p className="text-[14px] font-bold text-white mb-1">Take a selfie with your ID</p>
                <p className="text-[12px] text-charcoal-light">Hold your ID next to your face</p>
              </div>
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-4 rounded-2xl border border-border text-charcoal-light font-bold text-[15px] hover:text-white hover:border-border-light transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!selfieFile}
              className="flex-1 btn-accent py-4 rounded-2xl text-[15px] font-extrabold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Vehicle Docs */}
      {step === 2 && (
        <div className="animate-fade-in-up">
          <h2 className="text-[22px] font-black text-white mb-2">Vehicle Documents</h2>
          <p className="text-[14px] text-charcoal-light font-medium mb-6">
            Upload a clear photo of your motorcycle / vehicle registration, permit, or insurance.
          </p>

          <input
            ref={vehicleInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFileChange(e, 'vehicle')}
            className="hidden"
          />

          {vehiclePreview ? (
            <div className="relative mb-6">
              <img src={vehiclePreview} alt="Vehicle Docs Preview" className="w-full aspect-[16/10] object-cover rounded-2xl border border-border-light shadow-lg" />
              <button
                onClick={() => { setVehicleFile(null); setVehiclePreview(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-dark/80 backdrop-blur-sm border border-border flex items-center justify-center text-white hover:text-danger transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => vehicleInputRef.current?.click()}
              className="w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-border hover:border-accent/50 bg-dark-surface flex flex-col items-center justify-center gap-4 transition-all group mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Camera size={28} />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold text-white mb-1">Tap to capture or upload</p>
                <p className="text-[12px] text-charcoal-light">Registration, Insurance or Permit</p>
              </div>
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-2xl border border-border text-charcoal-light font-bold text-[15px] hover:text-white hover:border-border-light transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!vehicleFile}
              className="flex-1 btn-accent py-4 rounded-2xl text-[15px] font-extrabold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="animate-fade-in-up">
          <h2 className="text-[22px] font-black text-white mb-2">Review & Submit</h2>
          <p className="text-[14px] text-charcoal-light font-medium mb-6">
            Make sure all uploaded document photos are clear and legible before submitting.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div>
              <p className="text-[10px] font-bold text-charcoal-light uppercase tracking-widest mb-2">ID Document</p>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border-light shadow-lg">
                <img src={idPreview} alt="ID" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-charcoal-light uppercase tracking-widest mb-2">Selfie</p>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border-light shadow-lg">
                <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-charcoal-light uppercase tracking-widest mb-2">Vehicle Docs</p>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border-light shadow-lg">
                <img src={vehiclePreview} alt="Vehicle Docs" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div className="bg-dark-surface rounded-xl p-4 border border-border mb-6">
            <p className="text-[12px] text-charcoal-light leading-relaxed">
              By submitting, you confirm that these are genuine documents and you consent to identity verification. Your documents are stored securely and only accessible to our verification team.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-4 rounded-2xl border border-border text-charcoal-light font-bold text-[15px] hover:text-white hover:border-border-light transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="flex-1 btn-accent py-4 rounded-2xl text-[15px] font-extrabold uppercase tracking-wider disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={18} strokeWidth={2.5} />
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
