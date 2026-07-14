import { useRef, useState } from 'react';
import { Camera, X, ImagePlus } from 'lucide-react';

export default function PhotoUpload({ photos = [], onPhotosChange, maxPhotos = 4 }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    const newPhotos = [...photos];
    Array.from(files).forEach((file) => {
      if (newPhotos.length < maxPhotos && file.type.startsWith('image/')) {
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: URL.createObjectURL(file),
        });
      }
    });
    onPhotosChange(newPhotos);
  };

  const removePhoto = (photoId) => {
    const updated = photos.filter((p) => p.id !== photoId);
    onPhotosChange(updated);
  };

  return (
    <div id="photo-upload">
      <label className="text-[14px] font-bold text-white uppercase tracking-wider block mb-2.5">
        Photos <span className="text-charcoal-light font-medium lowercase">(optional)</span>
      </label>

      <div className="flex gap-3 flex-wrap">
        {/* Existing photos */}
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group animate-scale-in"
          >
            <img
              src={photo.preview}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removePhoto(photo.id)}
              className="absolute top-1.5 right-1.5 w-5 h-5 bg-dark/80 text-white rounded-full flex items-center justify-center transition-all hover:bg-danger"
              aria-label="Remove photo"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
        ))}

        {/* Add photo button */}
        {photos.length < maxPhotos && (
          <button
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`
              w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer
              ${dragOver
                ? 'border-accent bg-accent/10 scale-105 shadow-[0_0_15px_rgba(0,255,135,0.2)]'
                : 'border-border hover:border-accent/50 hover:bg-dark-surface'
              }
            `}
            id="add-photo-btn"
          >
            <ImagePlus size={22} className="text-charcoal-light" />
            <span className="text-[11px] text-charcoal-light font-bold">Add</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        id="photo-file-input"
      />

      <p className="text-[12px] text-charcoal-light font-medium">
        {photos.length}/{maxPhotos} photos • Tap to upload or use camera
      </p>
    </div>
  );
}
