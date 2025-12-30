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
    <div className="h-screen overflow-hidden flex flex-col bg-black text-white font-mono pt-safe" dir="rtl">
      {/* Header - Aligned with other pages */}
      <header className="flex items-center justify-between p-4 md:p-6 border-b border-zinc-900 bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <h1 className="text-lg md:text-xl font-black italic tracking-tighter md:tracking-[0.2em] text-white uppercase">FOCUS_PROTOCOL</h1>
          
          <div className="flex items-center gap-2 md:gap-3 bg-zinc-900/30 p-1 border border-zinc-800 rounded-lg md:rounded-sm">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
              className="p-1 text-zinc-500 hover:text-orange-500 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 text-zinc-400 hover:bg-white/10 transition-colors rounded-md md:rounded-sm"
            >
              היום
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <div className="text-[10px] md:text-xs font-bold text-orange-500 px-2 min-w-[100px] md:min-w-[140px] text-center">
              {isLoaded ? new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'short' }).format(currentDate) : "---"}
            </div>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
              className="p-1 text-zinc-500 hover:text-orange-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center relative bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.03)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex flex-col items-center gap-8">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border border-zinc-900 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-t-2 border-orange-500 animate-[spin_10s_linear_infinite]" />
            <div className="text-[10px] uppercase tracking-[0.5em] md:tracking-[1em] text-zinc-800 animate-pulse font-black">Initialization</div>
          </div>
          <div className="text-zinc-500 text-sm font-medium italic">השקט הוא הכוח שלך</div>
        </div>
      </div>
    </div>
  );
}



