import React from 'react';

export function TaskCardSkeleton() {
  return (
    <div className="w-full glass-card rounded-3xl p-5.5 border border-white/5 animate-pulse space-y-4">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-white/10 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-white/10 rounded-lg w-3/4" />
          <div className="h-3 bg-white/5 rounded-lg w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-white/5 rounded-lg w-full" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-4 bg-white/10 rounded-lg w-1/4" />
        <div className="h-6 bg-accent/15 rounded-xl w-1/5" />
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border-2 border-white/5 bg-white/5 animate-pulse flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-white/10" />
      <div className="h-3 bg-white/10 rounded-lg w-16" />
      <div className="h-2 bg-white/5 rounded-lg w-24" />
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-dark-surface animate-pulse flex flex-col items-center justify-center border border-white/10 rounded-3xl p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 animate-ping mb-3" />
      <div className="h-3 bg-white/10 rounded-lg w-32" />
    </div>
  );
}
