"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  Target,
  BarChart3,
  X,
  Calendar,
  Settings2,
  Clock,
  Activity,
  History,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Habit, HabitLog } from "@/lib/types";
import { ICON_MAP, NEON_COLORS, AVAILABLE_ICONS } from "@/lib/constants";
import { api } from "@/lib/api";

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, HabitLog>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    name: "",
    iconName: "Zap",
    color: NEON_COLORS[0],
    frequency: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startDate: new Date().toISOString().split('T')[0]
  });

  const dateString = currentTime.toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [habitsData, logsData] = await Promise.all([
          api.getHabits(),
          api.getHabitLogs(),
        ]);

        if (habitsData && Array.isArray(habitsData)) {
          setHabits(habitsData);
        }

        if (logsData && Array.isArray(logsData)) {
          const logsMap: Record<string, HabitLog> = {};
          logsData.forEach(log => {
            logsMap[log.id] = log;
          });
          setLogs(logsMap);
        }
      } catch (e) {
        console.error("Failed to load habits", e);
      }
      setIsLoaded(true);
    };

    loadData();
  }, []);

  const saveToStorage = async (updatedHabits: Habit[], updatedLogs: Record<string, HabitLog>) => {
    try {
      // Save habits
      for (const habit of updatedHabits) {
        await api.saveHabit(habit);
      }

      // Save logs
      for (const log of Object.values(updatedLogs)) {
        await api.saveHabitLog(log);
      }

      window.dispatchEvent(new CustomEvent('life26-update', { detail: { type: 'habits-updated' } }));
    } catch (error) {
      console.error('Failed to save habits', error);
    }
  };

  const toggleHabit = (habitId: string) => {
    const logId = `${habitId}-${dateString}`;
    const newLogs = { ...logs };

    if (newLogs[logId]) {
      newLogs[logId] = { ...newLogs[logId], completed: !newLogs[logId].completed };
    } else {
      newLogs[logId] = { id: logId, habitId, dateString, completed: true };
    }

    setLogs(newLogs);
    saveToStorage(habits, newLogs);
  };

  const addHabit = () => {
    if (!newHabit.name) return;
    const habitToAdd: Habit = {
      id: `hbt-${Date.now()}`,
      name: newHabit.name || "",
      category: "general",
      frequency: (newHabit.frequency as any) || "daily",
      daysOfWeek: newHabit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      startDate: newHabit.startDate,
      endDate: newHabit.endDate,
      iconName: newHabit.iconName || "Zap",
      color: newHabit.color || NEON_COLORS[0]
    };

    const updatedHabits = [...habits, habitToAdd];
    setHabits(updatedHabits);
    saveToStorage(updatedHabits, logs);
    setIsConfiguring(false);
    setNewHabit({
      name: "",
      iconName: "Zap",
      color: NEON_COLORS[0],
      frequency: "daily",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const deleteHabit = (id: string) => {
    if (!confirm("Are you sure you want to delete this habit? All history will be kept but the habit will be removed from future deployment.")) return;
    const updatedHabits = habits.filter(h => h.id !== id);
    setHabits(updatedHabits);
    saveToStorage(updatedHabits, logs);
  };

  const resetDay = () => {
    if (!confirm("האם לאפס את כל ההרגלים של היום הנבחר?")) return;
    const newLogs = { ...logs };
    activeHabits.forEach(h => {
      delete newLogs[`${h.id}-${dateString}`];
    });
    setLogs(newLogs);
    saveToStorage(habits, newLogs);
  };

  const activeHabits = useMemo(() => {
    const currentDay = currentTime.getDay();
    return habits.filter(h => {
      if (h.startDate && dateString < h.startDate) return false;
      if (h.endDate && dateString > h.endDate) return false;
      if (h.frequency === 'specific' && h.daysOfWeek) {
        return h.daysOfWeek.includes(currentDay);
      }
      return true;
    });
  }, [habits, currentTime, dateString]);

  const stats = useMemo(() => {
    if (activeHabits.length === 0) return { count: 0, percent: 0, total: 0 };
    const completed = activeHabits.filter(h => logs[`${h.id}-${dateString}`]?.completed).length;
    return {
      count: completed,
      total: activeHabits.length,
      percent: Math.round((completed / activeHabits.length) * 100)
    };
  }, [activeHabits, logs, dateString]);

  if (!isLoaded) return null;

  return (
    <div className="h-screen bg-black text-white font-mono flex flex-col overflow-hidden pt-safe" dir="rtl">
      {/* Header HUD - Mobile responsive */}
      <header className="p-4 sm:p-6 border-b border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 shrink-0 bg-black backdrop-blur-md z-20">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_#f97316]" />
            <h1 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase text-white">HABIT_PROTOCOL</h1>
          </div>
          <p className="text-zinc-500 text-[9px] sm:text-[10px] uppercase tracking-[0.3em]">Neural Rewiring / Systematic Discipline</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900/30 p-1 border border-zinc-800 rounded-lg w-full sm:w-auto">
            <button onClick={() => setCurrentTime(new Date(currentTime.setDate(currentTime.getDate() - 1)))} className="p-1 text-zinc-500 hover:text-white transition-colors">
              <ChevronRight size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button onClick={() => setCurrentTime(new Date())} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 text-zinc-400 hover:bg-white/10 transition-colors rounded-md">
              היום
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <div className="text-[10px] sm:text-xs font-bold text-orange-500 px-2 min-w-[120px] sm:min-w-[140px] text-center">
              {new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'short' }).format(currentTime)}
            </div>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button onClick={() => setCurrentTime(new Date(currentTime.setDate(currentTime.getDate() + 1)))} className="p-1 text-zinc-500 hover:text-white transition-colors">
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
            <span className="text-[9px] sm:text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-none mb-1">Deployment_Sync</span>
            <span className="text-lg sm:text-xl font-black text-[#00d4ff] italic leading-none">{stats.percent}%</span>
          </div>
        </div>
      </header>

      {/* Progression Matrix - Hidden on mobile for minimalism */}
      <section className="hidden md:block shrink-0 p-4 sm:p-6 md:p-8 pb-4 border-b border-zinc-900/50 bg-[#020202] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at center, #00d4ff 0.5px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-3 bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-black tracking-[0.4em]">Continuity_Matrix</span>
            </div>
            <span className="text-[8px] sm:text-[9px] text-[#00d4ff]/50 font-mono italic uppercase tracking-widest text-left">Systematic_Persistence_Window</span>
          </div>

          {/* Grid - Mobile: scrollable, Desktop: fixed */}
          <div className="grid grid-cols-11 gap-2 sm:gap-3 overflow-x-auto sm:overflow-x-visible">
            {Array.from({ length: 11 }).map((_, i) => {
              const d = new Date(currentTime);
              d.setDate(d.getDate() + (i - 5));
              const dStr = d.toISOString().split('T')[0];
              const isSelected = dStr === dateString;
              const isToday = dStr === new Date().toISOString().split('T')[0];
              const isFuture = d.getTime() > new Date().getTime() && !isToday;

              // Calculate daily % for that date
              const dayHabits = habits.filter(h => {
                if (h.startDate && dStr < h.startDate) return false;
                if (h.endDate && dStr > h.endDate) return false;
                if (h.frequency === 'specific' && h.daysOfWeek) return h.daysOfWeek.includes(d.getDay());
                return true;
              });
              const dayCompleted = dayHabits.filter(h => logs[`${h.id}-${dStr}`]?.completed).length;
              const dayPercent = dayHabits.length > 0 ? (dayCompleted / dayHabits.length) : 0;

              return (
                <div
                  key={i}
                  className={cn(
                    "h-16 sm:h-20 border rounded-sm flex flex-col items-center justify-center transition-all relative group/cell overflow-hidden",
                    dayPercent > 0 ? "bg-orange-500/[0.03] border-orange-500/20" : "bg-black border-zinc-900",
                    isSelected && "border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.1)] bg-orange-500/[0.05]",
                    isFuture && "opacity-20 border-dashed border-zinc-800"
                  )}
                >
                  <div className={cn(
                    "text-[8px] sm:text-[9px] font-black mb-1 sm:mb-2 tabular-nums",
                    isSelected ? "text-orange-500" : (isToday ? "text-[#00d4ff]" : "text-zinc-700")
                  )}>
                    {d.getDate()}.{d.getMonth() + 1}
                  </div>

                  <div className="relative h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                    {dayPercent >= 1 ? (
                      <Check size={14} className="sm:w-4 sm:h-4 text-orange-500 drop-shadow-[0_0_8px_#f97316]" />
                    ) : dayPercent > 0 ? (
                      <div className="text-[9px] sm:text-[10px] font-black text-orange-500/60 tabular-nums">{Math.round(dayPercent * 100)}%</div>
                    ) : (
                      <div className={cn("w-1.5 h-1.5 rounded-full", isToday ? "bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" : "bg-zinc-900")} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <main className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-0 overflow-hidden bg-black">

        {/* RIGHT: Daily Protocols (Input) */}
        <div className="flex-1 md:col-span-7 border-l border-zinc-900 p-4 md:p-8 flex flex-col gap-6 overflow-hidden bg-black">
          <div className="flex items-center justify-between shrink-0">
            <SectionHeader icon={<Activity size={14} />} title="Active_Protocols" color="text-orange-500" />
            <button
              onClick={() => setIsConfiguring(true)}
              className="hidden md:flex px-3 py-1.5 border border-orange-500/30 text-[9px] font-black text-orange-500 hover:bg-orange-500 hover:text-black transition-all rounded-sm uppercase tracking-widest items-center gap-2"
            >
              <Plus size={12} strokeWidth={3} />
              Deploy_New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-0 md:pr-2 scrollbar-hide">
            {activeHabits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 md:gap-3">
                {activeHabits.map((habit) => {
                  const isCompleted = logs[`${habit.id}-${dateString}`]?.completed;
                  const Icon = ICON_MAP[habit.iconName] || Zap;

                  return (
                    <div
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={cn(
                        "group relative flex items-center justify-between p-5 md:p-5 rounded-2xl md:rounded-sm border transition-all duration-500 cursor-pointer overflow-hidden",
                        isCompleted
                          ? "bg-orange-500/[0.02] border-orange-500/20"
                          : "bg-zinc-900/10 border-zinc-900 hover:border-zinc-800"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute right-0 top-0 bottom-0 w-1 md:w-[2px] transition-all duration-500 rounded-r-2xl md:rounded-none",
                          isCompleted ? "bg-orange-500" : "bg-zinc-800"
                        )}
                      />

                      <div className="relative flex items-center gap-4 md:gap-5">
                        <div
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-xl md:rounded-sm border transition-all duration-500 bg-black",
                            isCompleted
                              ? "border-orange-500/30 text-orange-500 shadow-sm"
                              : "border-zinc-800 text-zinc-600 group-hover:text-zinc-400"
                          )}
                        >
                          <Icon size={18} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className={cn(
                            "text-[14px] md:text-[13px] font-bold uppercase tracking-wider transition-colors",
                            isCompleted ? "text-white" : "text-zinc-500"
                          )}>
                            {habit.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 md:gap-6">
                        <div className={cn(
                          "w-6 h-6 rounded-full md:rounded-sm border-2 flex items-center justify-center transition-all duration-300",
                          isCompleted
                            ? "bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20 md:shadow-none"
                            : "border-zinc-800 group-hover:border-zinc-700"
                        )}>
                          {isCompleted && <Check size={14} strokeWidth={4} className="text-black" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-900 rounded-2xl md:rounded-sm opacity-40">
                <Target size={24} className="text-zinc-800 mb-4" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">No protocols deployed for this cycle</p>
              </div>
            )}
          </div>
        </div>

        {/* LEFT: Metrics & Analysis - Hidden on mobile */}
        <div className="hidden md:flex col-span-5 border-r border-zinc-900 p-8 flex flex-col gap-10 overflow-hidden bg-[#030303]">
          <SectionHeader icon={<History size={14} />} title="System_Analytics" color="text-[#00d4ff]" />

          {/* Circular Progress */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke="#00d4ff"
                  strokeWidth="2"
                  strokeDasharray="276.5"
                  strokeDashoffset={276.5 - (276.5 * stats.percent / 100)}
                  className="transition-all duration-1000 ease-in-out opacity-80"
                  style={{ filter: "drop-shadow(0 0 12px rgba(0,212,255,0.4))" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Sync_Level</span>
                <span className="text-4xl font-black italic text-white tabular-nums leading-none">{stats.percent}%</span>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#00d4ff] animate-pulse" />
                  <span className="text-[8px] font-bold text-[#00d4ff]/60 uppercase tracking-tighter">
                    {stats.count} / {stats.total} Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Chain Analysis */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Protocol_Heatmap</span>
              <span className="text-[8px] text-zinc-800 font-mono">28_DAY_STREAM</span>
            </div>

            <div className="flex-1 bg-black border border-zinc-900 p-6 flex flex-col items-center justify-center overflow-hidden">
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 28 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (27 - i));
                  const ds = d.toISOString().split('T')[0];
                  const dayLogs = Object.values(logs).filter(l => l.dateString === ds && l.completed);
                  const dayPercent = habits.length > 0 ? (dayLogs.length / habits.length) : 0;

                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-sm border transition-all relative group/cell flex items-center justify-center",
                        dayPercent > 0.8 ? "border-[#00d4ff]/30 shadow-[0_0_10px_rgba(0,212,255,0.1)]" : "border-zinc-900"
                      )}
                      style={{
                        backgroundColor: dayPercent > 0 ? `rgba(0, 212, 255, ${dayPercent * 0.2})` : 'transparent'
                      }}
                    >
                      <span className="text-[7px] font-bold text-zinc-800 group-hover/cell:text-zinc-500 transition-colors">
                        {d.getDate()}
                      </span>
                      {dayPercent >= 1 && (
                        <div className="absolute inset-0 border border-[#00d4ff]/40 animate-pulse rounded-sm" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: New Habit */}
      {isConfiguring && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4" onClick={() => setIsConfiguring(false)}>
          <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 italic">HABIT_INIT_STATION</div>
              <button onClick={() => setIsConfiguring(false)} className="text-zinc-600 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
              {/* Identification */}
              <div className="space-y-3">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Identification_Label</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="ENTER PROTOCOL NAME..."
                  className="w-full bg-black border border-zinc-800 p-4 rounded-sm outline-none focus:border-orange-500/50 text-sm font-bold text-white transition-all placeholder:opacity-20 uppercase tracking-widest"
                />
              </div>

              {/* Visuals */}
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Icon_Interface</label>
                  <div className="grid grid-cols-6 gap-2 bg-zinc-900/10 p-2 border border-zinc-900 rounded-sm">
                    {AVAILABLE_ICONS.slice(0, 18).map((iconKey) => {
                      const Icon = ICON_MAP[iconKey];
                      return (
                        <button
                          key={iconKey}
                          onClick={() => setNewHabit({ ...newHabit, iconName: iconKey })}
                          className={cn(
                            "aspect-square flex items-center justify-center transition-all rounded-sm border",
                            newHabit.iconName === iconKey
                              ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                              : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:text-zinc-400"
                          )}
                        >
                          <Icon size={14} strokeWidth={2} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Visual_Signature</label>
                  <div className="flex gap-2.5 flex-wrap bg-zinc-900/10 p-2 border border-zinc-900 rounded-sm">
                    {NEON_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewHabit({ ...newHabit, color })}
                        className={cn(
                          "w-6 h-6 rounded-sm transition-all border-2",
                          newHabit.color === color ? "border-white scale-110 shadow-[0_0_10px_currentColor]" : "border-transparent opacity-40 hover:opacity-100"
                        )}
                        style={{ backgroundColor: color, color: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Deployment Settings */}
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Deployment_Schedule</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setNewHabit({ ...newHabit, frequency: 'daily', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] })}
                    className={cn(
                      "flex-1 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-sm border",
                      newHabit.frequency === 'daily' ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    CONSTANT_SYNC
                  </button>
                  <button
                    onClick={() => setNewHabit({ ...newHabit, frequency: 'specific' })}
                    className={cn(
                      "flex-1 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all rounded-sm border",
                      newHabit.frequency === 'specific' ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    SPECIFIC_DAYS
                  </button>
                </div>

                {newHabit.frequency === 'specific' && (
                  <div className="flex justify-between bg-zinc-900/20 p-3 border border-zinc-900 rounded-sm">
                    {DAYS.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const currentDays = newHabit.daysOfWeek || [];
                          const nextDays = currentDays.includes(idx)
                            ? currentDays.filter(d => d !== idx)
                            : [...currentDays, idx];
                          setNewHabit({ ...newHabit, daysOfWeek: nextDays });
                        }}
                        className={cn(
                          "w-10 h-10 text-[10px] font-black transition-all rounded-sm border",
                          newHabit.daysOfWeek?.includes(idx)
                            ? "bg-white text-black border-white shadow-[0_0_10px_white]"
                            : "bg-black border-zinc-900 text-zinc-700 hover:text-zinc-400"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-[#050505] border-t border-zinc-900">
              <button
                onClick={addHabit}
                className="w-full py-5 bg-white text-black rounded-sm text-[10px] font-black uppercase tracking-[0.5em] hover:bg-orange-500 transition-all"
              >
                DEPLOY_TO_TIMELINE
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 2px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}

const SectionHeader = ({ icon, title, color = "text-zinc-500" }: { icon: React.ReactNode, title: string, color?: string }) => (
  <div className="flex items-center gap-3 border-b border-zinc-900/50 pb-4 shrink-0">
    <span className={cn(color)}>{icon}</span>
    <h2 className={cn("text-[11px] font-black uppercase tracking-[0.4em]", color)}>{title}</h2>
  </div>
);
