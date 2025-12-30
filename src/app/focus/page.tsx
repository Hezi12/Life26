"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function FocusPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-black text-white font-mono" dir="rtl">
      {/* Header - Aligned with other pages */}
      <header className="flex items-center justify-between p-6 border-b border-zinc-900 bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black italic tracking-[0.2em] text-white uppercase">FOCUS_PROTOCOL</h1>
          
          <div className="flex items-center gap-3 bg-zinc-900/30 p-1 border border-zinc-800 rounded-sm">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 hover:bg-white/10 transition-colors"
            >
              היום
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <div className="text-xs font-bold text-orange-500 px-2 min-w-[140px] text-center">
              {isLoaded ? new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'short' }).format(currentDate) : "---"}
            </div>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-12 flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.02)_0%,transparent_70%)] pointer-events-none" />
        <div className="text-[10px] uppercase tracking-[1em] text-zinc-800 animate-pulse">Initialization_Required</div>
      </div>
    </div>
  );
}



