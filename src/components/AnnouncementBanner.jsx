import { useState, useEffect } from 'react';
import { Megaphone, X, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadActiveAnnouncement() {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const dismissedId = localStorage.getItem(`announcement_dismissed_${data.id}`);
          if (!dismissedId) {
            setAnnouncement(data);
          }
        }
      } catch (err) {
        console.error('Failed to load announcements:', err);
      }
    }
    loadActiveAnnouncement();
  }, []);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (announcement?.id) {
      localStorage.setItem(`announcement_dismissed_${announcement.id}`, 'true');
    }
  };

  return (
    <div className="px-5 mb-6 animate-fade-in-down">
      <div className="glass-floating border border-accent/40 rounded-3xl p-4.5 bg-accent/5 relative overflow-hidden shadow-[0_8px_30px_rgba(0,255,135,0.15)] flex items-start gap-3.5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0 shadow-inner mt-0.5">
          <Megaphone size={20} />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/30 flex items-center gap-1">
              <Sparkles size={10} />
              Announcement
            </span>
            <h4 className="font-heading font-black text-white text-[14px] truncate">{announcement.title}</h4>
          </div>
          <p className="text-[12px] text-charcoal-light font-medium leading-relaxed">
            {announcement.message}
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-xl bg-dark/70 border border-white/10 flex items-center justify-center text-charcoal-light hover:text-white transition-colors shrink-0"
          aria-label="Dismiss announcement"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
