import { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
    }

    // Detect Android Chrome / Desktop installability
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-bounce-in max-w-md mx-auto">
        <div className="glass-floating border border-accent/40 bg-dark/95 rounded-3xl p-4.5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden flex items-center justify-between gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0 shadow-inner">
            <Smartphone size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-black text-white text-[14px] leading-tight flex items-center gap-1.5 mb-0.5">
              <span>Install Chrad App</span>
              <span className="text-[9px] font-black text-accent bg-accent/15 px-1.5 py-0.2 rounded uppercase">PWA</span>
            </h4>
            <p className="text-[11px] text-charcoal-light font-medium line-clamp-1">
              Add to Home Screen for instant runner alerts & offline access
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-accent text-dark font-extrabold text-[12px] uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,135,0.3)] hover:scale-105 transition-all flex items-center gap-1"
            >
              <Download size={14} strokeWidth={3} />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl bg-white/5 text-charcoal-light hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-dark/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full p-6 rounded-3xl border border-white/20 text-center space-y-4 animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent mx-auto">
              <Share size={26} />
            </div>
            <h3 className="font-heading font-black text-white text-[18px]">Install on iOS Safari</h3>
            <ol className="text-left text-[13px] text-charcoal-light space-y-2.5 bg-dark/60 p-4 rounded-2xl border border-white/10 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[11px] font-black flex items-center justify-center">1</span>
                Tap the <Share size={14} className="inline text-accent" /> Share button in Safari toolbar.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[11px] font-black flex items-center justify-center">2</span>
                Scroll down and select <strong className="text-white">"Add to Home Screen"</strong>.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[11px] font-black flex items-center justify-center">3</span>
                Tap <strong className="text-accent">Add</strong> at top right.
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-2xl bg-white/10 text-white font-bold text-[13px]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
