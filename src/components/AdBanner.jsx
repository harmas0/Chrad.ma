import { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { fetchActiveAds, recordAdImpression, recordAdClick } from '../data/adsApi';

export default function AdBanner({ placement = 'home_banner', className = '' }) {
  const [ad, setAd] = useState(null);
  const [impressionRecorded, setImpressionRecorded] = useState(false);

  useEffect(() => {
    async function loadAd() {
      const ads = await fetchActiveAds(placement);
      if (ads && ads.length > 0) {
        // Pick one at random if multiple ads exist
        const selected = ads[Math.floor(Math.random() * ads.length)];
        setAd(selected);
      }
    }
    loadAd();
  }, [placement]);

  useEffect(() => {
    if (ad?.id && !impressionRecorded) {
      recordAdImpression(ad.id);
      setImpressionRecorded(true);
    }
  }, [ad?.id, impressionRecorded]);

  if (!ad) return null;

  const handleClick = (e) => {
    if (ad.id) {
      recordAdClick(ad.id);
    }
    if (ad.target_url) {
      if (ad.target_url.startsWith('http')) {
        window.open(ad.target_url, '_blank');
      } else {
        window.location.hash = ad.target_url;
      }
    }
  };

  return (
    <div className={`my-4 ${className}`}>
      <div 
        onClick={handleClick}
        className="glass-card border border-white/15 rounded-3xl overflow-hidden relative group cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/85 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-5 flex items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-[70%]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} />
                {ad.badge_text || 'SPONSORED'}
              </span>
              {ad.advertiser && (
                <span className="text-[11px] text-charcoal-light font-bold truncate">
                  • {ad.advertiser}
                </span>
              )}
            </div>

            <h4 className="font-heading font-black text-white text-[15px] leading-tight line-clamp-2">
              {ad.title}
            </h4>
          </div>

          {/* CTA Button */}
          <button className="px-4 py-2.5 rounded-2xl bg-accent text-dark font-heading font-black text-[12px] uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,135,0.3)] group-hover:bg-white transition-colors shrink-0 flex items-center gap-1.5">
            <span>{ad.cta_text || 'View Offer'}</span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
