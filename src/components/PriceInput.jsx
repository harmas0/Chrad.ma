import { useState, useEffect } from 'react';

export default function PriceInput({ value, onChange, min = 10, max = 500, step = 5, label = 'Your Price', currency = 'MAD' }) {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    setIsPulsing(true);
    const timer = setTimeout(() => setIsPulsing(false), 400);
    return () => clearTimeout(timer);
  }, [value]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div id="price-input">
      <label className="text-[14px] font-bold text-charcoal-light uppercase tracking-wider block mb-4">{label}</label>
      
      {/* Price display */}
      <div className="flex items-center justify-center mb-4">
        <div className={`text-center transition-transform duration-300 ${isPulsing ? 'price-pulse' : ''}`}>
          <span className="text-[52px] font-black text-white leading-none tracking-tighter">
            {value}
          </span>
          <span className="text-[18px] font-bold text-accent ml-2 uppercase tracking-widest">{currency}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative px-2 mt-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dark [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(0,255,135,0.6)] 
            [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-accent
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-dark [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-accent
            [&::-moz-range-thumb]:shadow-[0_0_15px_rgba(0,255,135,0.6)] [&::-moz-range-thumb]:cursor-grab"
          style={{
            background: `linear-gradient(to right, #00FF87 0%, #00FF87 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
          }}
          id="price-slider"
        />
        <div className="flex justify-between mt-3 text-[12px] text-charcoal-light font-bold">
          <span>{min} {currency}</span>
          <span>{max} {currency}</span>
        </div>
      </div>

      {/* Quick adjust buttons */}
      <div className="flex justify-center gap-3 mt-4">
        {[-10, -5, 5, 10].map((delta) => (
          <button
            key={delta}
            onClick={() => {
              const newVal = Math.max(min, Math.min(max, value + delta));
              onChange(newVal);
            }}
            className={`px-4 py-2 rounded-xl text-[14px] font-black transition-all duration-150 active:scale-95 border
              ${delta > 0
                ? 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
                : 'bg-dark-surface text-charcoal-light border-border hover:border-charcoal-light hover:text-white'
              }`}
            id={`price-adjust-${delta > 0 ? 'plus' : 'minus'}-${Math.abs(delta)}`}
          >
            {delta > 0 ? '+' : ''}{delta}
          </button>
        ))}
      </div>
    </div>
  );
}
