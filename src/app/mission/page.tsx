"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Target, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Activity, 
  Zap,
  Star,
  History,
  TrendingUp,
  AlertCircle,
  Plus,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DailyMission } from "@/lib/types";
import { api } from "@/lib/api";

const MissionPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [missions, setMissions] = useState<Record<string, DailyMission>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const dateString = currentDate.toISOString().split('T')[0];
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 1. Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const missionsData = await api.getMissions();
        if (missionsData && Array.isArray(missionsData)) {
          const missionsMap: Record<string, DailyMission> = {};
          missionsData.forEach(mission => {
            missionsMap[mission.dateString] = mission;
          });
          setMissions(missionsMap);
        }
      } catch (error) {
        console.error('Failed to load missions', error);
      }
      setIsLoaded(true);
    };
    
    loadData();
  }, []);

  // 2. Save Data
  const saveMission = async (date: string, data: Partial<DailyMission>) => {
    const missionData = {
      ...(missions[date] || { id: `mission-${date}`, dateString: date, mission: "" }),
      ...data
    };
    
    try {
      await api.saveMission(missionData);
      
      const newMissions = {
        ...missions,
        [date]: missionData
      };
      setMissions(newMissions);
      
      window.dispatchEvent(new CustomEvent('life26-update', { detail: { type: 'missions-updated' } }));
    } catch (error) {
      console.error('Failed to save mission', error);
    }
  };

  const resetDay = async () => {
    if (!confirm("האם לאפס את כל הנתונים של היום הנבחר?")) return;
    
    try {
      // Note: We don't have a delete endpoint for missions, so we'll just update it to empty
      await api.saveMission({
        id: `mission-${dateString}`,
        dateString,
        mission: "",
        reflection: null,
        score: null,
      });
      
      const newMissions = { ...missions };
      delete newMissions[dateString];
      setMissions(newMissions);
      
      window.dispatchEvent(new CustomEvent('life26-update', { detail: { type: 'missions-updated' } }));
    } catch (error) {
      console.error('Failed to reset mission', error);
    }
  };

  const currentMission = missions[dateString] || { id: dateString, dateString, mission: "" };
  const yesterdayMission = missions[yesterdayStr];

  // Stats for the chain
  const chainStats = useMemo(() => {
    const keys = Object.keys(missions).sort();
    if (keys.length === 0) return { streak: 0, total: 0 };
    
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (missions[dStr] && missions[dStr].mission) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return { streak, total: keys.length };
  }, [missions]);

  if (!isLoaded) return null;

  return (
    <div className="h-screen bg-black text-white font-mono flex flex-col overflow-hidden pt-safe" dir="rtl">
      {/* HUD - Mobile responsive */}
      <header className="p-4 sm:p-6 border-b border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 shrink-0 bg-black backdrop-blur-md z-20">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_#f97316]" />
            <h1 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase text-white">MISSION_PROTOCOL</h1>
          </div>
          <p className="text-zinc-500 text-[9px] sm:text-[10px] uppercase tracking-[0.3em]">Single Objective Core / Chain of Command</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
          {/* Navigation Controls - Mobile optimized */}
          <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900/30 p-1 border border-zinc-800 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronRight size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 text-zinc-400 hover:bg-white/10 transition-colors rounded-md"
            >
              היום
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <div className="text-[10px] sm:text-xs font-bold text-orange-500 px-2 min-w-[120px] sm:min-w-[140px] text-center">
              {new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'short' }).format(currentDate)}
            </div>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button
              onClick={resetDay}
              className="p-1 text-zinc-700 hover:text-red-500 transition-colors"
              title="Reset Day"
            >
              <RotateCcw size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          <div className="hidden sm:block h-8 w-px bg-zinc-900" />

          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-none mb-1">Active_Streak</span>
            <span className="text-lg sm:text-xl font-black text-[#00d4ff] italic leading-none">{chainStats.streak}D</span>
          </div>
        </div>
      </header>

      {/* Progression Matrix - Hidden on mobile for minimalism */}
      <section className="hidden md:block shrink-0 p-4 sm:p-6 md:p-8 pb-4 border-b border-zinc-900/50 bg-[#020202] relative overflow-hidden">
        {/* Decorative background grid with dual color nodes */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at center, #00d4ff 0.5px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-3 bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-black tracking-[0.4em]">Progression_Matrix</span>
            </div>
            <span className="text-[8px] sm:text-[9px] text-[#00d4ff]/50 font-mono italic uppercase tracking-widest">11_Day_Continuity_Window</span>
          </div>
          
          {/* Grid - Mobile: scrollable */}
          <div className="grid grid-cols-11 gap-2 sm:gap-3 overflow-x-auto sm:overflow-x-visible">
            {Array.from({ length: 11 }).map((_, i) => {
              const d = new Date(currentDate);
              d.setDate(d.getDate() + (i - 5)); 
              const dStr = d.toISOString().split('T')[0];
              const m = missions[dStr];
              const isSelected = dStr === dateString;
              const isToday = dStr === new Date().toISOString().split('T')[0];
              const isFuture = d.getTime() > new Date().getTime() && !isToday;
              
              return (
                <div 
                  key={i}
                  className={cn(
                    "h-20 sm:h-24 border rounded-sm flex flex-col items-center justify-center transition-all relative group/cell overflow-hidden",
                    m?.mission ? "bg-orange-500/[0.03] border-orange-500/20" : "bg-black border-zinc-900",
                    isSelected && "border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.1)] bg-orange-500/[0.05]",
                    isFuture && "opacity-20 border-dashed border-zinc-800"
                  )}
                >
                  {/* Decorative corner */}
                  {isSelected && <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-orange-500" />}
                  
                  <div className={cn(
                    "text-[9px] sm:text-[10px] font-black mb-3 sm:mb-4 tabular-nums",
                    isSelected ? "text-orange-500" : (isToday ? "text-[#00d4ff]" : "text-zinc-700")
                  )}>
                    {d.getDate()}.{d.getMonth() + 1}
                  </div>

                  <div className="relative flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8">
                    {(() => {
                      const hasMission = !!m?.mission;
                      const hasScore = m?.score !== undefined && m?.score !== null;

                      if (!hasMission) {
                        if (isToday) return <Plus size={18} className="text-[#00d4ff] animate-pulse" />;
                        return <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />;
                      }

                      if (!hasScore) {
                        return (
                          <div className="relative">
                            <Activity size={18} className="text-orange-500 animate-gentle-pulse" />
                            <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-full animate-pulse" />
                          </div>
                        );
                      }

                      return (
                        <div className="relative flex items-center justify-center">
                          <Check size={18} className="text-orange-500 drop-shadow-[0_0_8px_#f97316]" />
                          <div 
                            className={cn(
                              "absolute -bottom-4 w-1 h-1 rounded-full",
                              m.score === 3 ? "bg-orange-500 shadow-[0_0_8px_#f97316]" :
                              m.score === 2 ? "bg-orange-500/60" :
                              m.score === 1 ? "bg-orange-500/30" : "bg-zinc-700"
                            )} 
                          />
                        </div>
                      );
                    })()}
                  </div>

                  {isToday && !m?.mission && (
                    <div className="absolute bottom-2 text-[7px] font-black text-[#00d4ff]/40 tracking-tighter uppercase">Needs_Deployment</div>
                  )}
                  {m?.mission && !m?.score && (
                    <div className="absolute bottom-2 text-[7px] font-black text-orange-500/40 tracking-tighter uppercase">In_Progress</div>
                  )}
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover/cell:block z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 p-3 text-[10px] whitespace-nowrap rounded shadow-2xl min-w-[140px]">
                      <div className="text-zinc-500 mb-2 font-black border-b border-zinc-800 pb-1">{dStr} {isToday ? "(OPERATIONAL_NOW)" : ""}</div>
                      {m?.mission ? (
                        <div className="text-white font-bold italic leading-relaxed">"{m.mission}"</div>
                      ) : (
                        <div className="text-zinc-700 italic uppercase">No mission defined</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <main className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-0 overflow-y-auto md:overflow-hidden scrollbar-hide">
        
        {/* Right Column: Today's Deployment - Shown first on mobile */}
        <div className="flex-1 md:col-span-7 p-4 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-8 overflow-visible md:overflow-hidden">
          <SectionHeader icon={<Zap size={14} />} title="Today_Deployment" color="text-orange-500" />
          
          <div className="flex-1 flex flex-col min-h-[300px] md:min-h-0 relative group animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="absolute -right-0 top-0 h-12 w-[2px] bg-orange-500 transition-all duration-500 rounded-full" />
            <div className="flex-1 flex flex-col bg-zinc-900/10 border border-orange-500/10 focus-within:border-orange-500/20 p-6 md:p-8 transition-all relative overflow-hidden rounded-2xl md:rounded-sm shadow-sm md:shadow-none">
              <div className="text-[9px] sm:text-[10px] text-orange-500/50 mb-4 sm:mb-6 uppercase font-black tracking-[0.3em] relative z-10">Core_Objective_Input</div>
              <textarea
                value={currentMission.mission}
                onChange={(e) => saveMission(dateString, { mission: e.target.value })}
                placeholder="מה הדבר הכי חשוב היום?..."
                className="flex-1 w-full bg-transparent text-xl sm:text-2xl md:text-3xl font-black italic text-white placeholder:text-zinc-900 outline-none resize-none leading-tight relative z-10 scrollbar-hide"
              />
              
              <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0 pt-4 sm:pt-6 border-t border-zinc-900/50 relative z-10 shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[8px] text-zinc-600 uppercase font-black mb-1">Protocol</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Focus</span>
                  </div>
                  <div className="hidden md:block w-px h-6 bg-zinc-900" />
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[8px] text-zinc-600 uppercase font-black mb-1">Constraint</span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Single_Focus</span>
                  </div>
                </div>
                
                {currentMission.mission && (
                  <div className="flex items-center gap-2 text-orange-500 bg-orange-500/5 px-3 py-1.5 rounded-full md:rounded-sm border border-orange-500/10">
                    <Target size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Target_Locked</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: Yesterday's Debrief - Mobile: shown below today */}
        <div className="flex-1 md:col-span-5 border-l border-zinc-900 p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 overflow-visible md:overflow-hidden bg-[#030303] md:rounded-none rounded-t-[2.5rem] mt-4 md:mt-0 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] md:shadow-none">
          <SectionHeader icon={<History size={14} />} title="Yesterday_Debrief" color="text-[#00d4ff]" />
          
          {yesterdayMission ? (
            <div className="flex-1 flex flex-col gap-6 min-h-0 animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="bg-[#00d4ff]/[0.02] border border-[#00d4ff]/10 p-5 rounded-2xl md:rounded-sm relative group shrink-0">
                <div className="absolute -right-0 top-4 h-6 w-[2px] bg-[#00d4ff]/30 rounded-full" />
                <div className="text-[9px] text-[#00d4ff]/60 mb-2 uppercase font-black tracking-widest">Objective</div>
                <div className="text-zinc-300 text-base font-bold italic leading-tight">
                  "{yesterdayMission.mission}"
                </div>
              </div>

              <div className="space-y-4 shrink-0">
                <div className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Execution_Score</div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((s) => (
                    <button
                      key={s}
                      onClick={() => saveMission(yesterdayStr, { score: s as any })}
                      className={cn(
                        "flex-1 py-3 md:py-2 border transition-all font-black text-xs rounded-xl md:rounded-none",
                        yesterdayMission.score === s 
                          ? "bg-[#00d4ff] border-[#00d4ff] text-black shadow-lg shadow-[#00d4ff]/20" 
                          : "bg-transparent border-zinc-800 text-zinc-700 hover:border-[#00d4ff]/50 hover:text-white"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4 min-h-[200px] md:min-h-0 pb-20 md:pb-0">
                <div className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Reflection_Log</div>
                <div className="flex-1 bg-black border border-zinc-900 p-5 rounded-2xl md:rounded-sm relative group">
                  <textarea
                    value={yesterdayMission.reflection || ""}
                    onChange={(e) => saveMission(yesterdayStr, { reflection: e.target.value })}
                    placeholder="איך היה הביצוע?..."
                    className="w-full h-full bg-transparent text-sm text-zinc-400 focus:text-zinc-200 outline-none resize-none transition-colors scrollbar-hide font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-2xl md:rounded-sm text-center">
              <AlertCircle size={20} className="text-zinc-800 mb-3" />
              <p className="text-[10px] text-zinc-700 uppercase tracking-widest">No data for {yesterdayStr}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const SectionHeader = ({ icon, title, color = "text-zinc-500" }: { icon: React.ReactNode, title: string, color?: string }) => (
  <div className="flex items-center gap-3 border-b border-zinc-900/50 pb-4 shrink-0">
    <span className={cn(color)}>{icon}</span>
    <h2 className={cn("text-[11px] font-black uppercase tracking-[0.4em]", color)}>{title}</h2>
  </div>
);

export default MissionPage;
