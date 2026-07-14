import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose?.();
      }}
      id="modal-overlay"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark/70 backdrop-blur-md" />

      {/* Content — bottom sheet on mobile */}
      <div
        ref={contentRef}
        className="relative w-full sm:max-w-md glass-panel rounded-t-[32px] sm:rounded-3xl p-6 animate-slide-up max-h-[90dvh] overflow-y-auto border-t border-border-light sm:border"
        id="modal-content"
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center mb-5">
          <div className="w-12 h-1.5 bg-border-light rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-extrabold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-dark-surface border border-border flex items-center justify-center text-charcoal-light hover:bg-surface hover:text-white transition-colors"
            aria-label="Close"
            id="modal-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {children}
      </div>
    </div>
  );
}
