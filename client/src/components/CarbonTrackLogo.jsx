import React from 'react'

export default function CarbonTrackLogo({ className = 'h-8', showText = true, textClass = 'text-slate-900' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 shrink-0">
        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
          <path d="M12 6a6 6 0 0 0-6 6c0 3.31 2.69 6 6 6s6-2.69 6-6"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-display font-bold tracking-tight text-base ${textClass}`}>CarbonTrack</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-600 font-semibold mt-0.5">ESG INTELLIGENCE</span>
        </div>
      )}
    </div>
  )
}
