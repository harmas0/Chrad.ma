import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useI18n, LANGUAGES } from '../utils/i18n';

const FLAG_MAP = {
  en: '🇬🇧',
  fr: '🇫🇷',
  ar: '🇲🇦',
};

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border transition-all active-press ${
          compact
            ? 'p-2 bg-dark/60 border-white/10 text-white hover:border-accent/40'
            : 'px-3 py-2 bg-dark/60 border-white/10 text-white hover:border-accent/40 text-[13px] font-bold'
        }`}
        id="language-switcher-btn"
      >
        <span className="text-base leading-none">{FLAG_MAP[lang] || '🌐'}</span>
        {!compact && <span>{currentLangObj.code.toUpperCase()}</span>}
        <ChevronDown size={14} className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-dark/95 backdrop-blur-xl border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.6)] py-2 z-[9999] animate-scale-in">
          <div className="px-3 py-1.5 mb-1 border-b border-white/10 flex items-center gap-1.5 text-[10px] font-extrabold text-muted uppercase tracking-wider">
            <Globe size={12} />
            <span>Select Language</span>
          </div>
          {LANGUAGES.map((l) => {
            const isSelected = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-bold transition-all ${
                  isSelected
                    ? 'bg-accent/15 text-accent'
                    : 'text-charcoal-light hover:bg-surface hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{FLAG_MAP[l.code]}</span>
                  <span>{l.label}</span>
                </div>
                {isSelected && <Check size={14} strokeWidth={3} className="text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
