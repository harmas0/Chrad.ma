import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Sparkles, Tag, ArrowRight, Globe } from 'lucide-react';
import { fetchActiveAds, recordAdImpression, recordAdClick } from '../data/adsApi';

export default function AdBanner({ placement = 'home_banner', className = '' }) {
  const [ad, setAd] = useState(null);
  const [impressionRecorded, setImpressionRecorded] = useState(false);
  const adsenseRef = useRef(null);

  useEffect(() => {
    async function loadAd() {
      const ads = await fetchActiveAds(placement);
      if (ads && ads.length > 0) {
        // Weighted random selection or simple random
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

    // Google AdSense SDK auto loader
    if (ad?.provider === 'google_adsense' && ad?.adsense_client_id) {
      try {
        const scriptId = 'adsense-js-sdk';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ad.adsense_client_id}`;
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }
        // Trigger push
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn('AdSense push notice:', err);
      }
    }
  }, [ad, impressionRecorded]);

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

  // Provider 1: GOOGLE ADSENSE
  if (ad.provider === 'google_adsense') {
    return (
      <div className={`my-4 ${className}`}>
        <div className="glass-card border border-white/10 rounded-3xl p-4 text-center overflow-hidden relative">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-info bg-info/10 border border-info/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Globe size={10} />
              Google AdSense Network
            </span>
            <span className="text-[10px] text-charcoal-light font-bold">{ad.advertiser || 'Google Partner'}</span>
          </div>

          <div ref={adsenseRef} className="min-h-[90px] flex items-center justify-center bg-dark/40 rounded-2xl p-2 border border-white/5">
            {ad.adsense_slot_id ? (
              <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', minHeight: '90px' }}
                data-ad-client={ad.adsense_client_id}
                data-ad-slot={ad.adsense_slot_id}
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            ) : (
              <div className="py-4 text-[12px] text-charcoal-light font-medium">
                <span className="text-white font-bold block mb-1">⚡ {ad.title}</span>
                AdSense Unit Slot: {ad.adsense_client_id}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Provider 2: CUSTOM HTML / JS EMBED
  if (ad.provider === 'html_embed' && ad.html_code) {
    return (
      <div className={`my-4 ${className}`}>
        <div className="glass-card border border-white/10 rounded-3xl p-4 overflow-hidden relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} />
              Sponsored Partner
            </span>
            <span className="text-[10px] text-charcoal-light font-bold">{ad.advertiser || 'Partner'}</span>
          </div>

          <div 
            dangerouslySetInnerHTML={{ __html: ad.html_code }}
            className="w-full overflow-hidden rounded-2xl"
          />
        </div>
      </div>
    );
  }

  // Provider 3: CUSTOM IMAGE & BUTTON BANNER
  return (
    <div className={`my-4 ${className}`}>
      <div 
        onClick={handleClick}
        className="glass-card border border-white/15 rounded-3xl overflow-hidden relative group cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={ad.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
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
