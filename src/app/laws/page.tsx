"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Check,
  X,
  Shield,
  ShieldCheck,
  ShieldX,
  Edit3,
  Flame,
  Moon,
  Smartphone,
  Gamepad2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Law, LawLog } from "@/lib/types";
import { api } from "@/lib/api";

const POSITION_ICONS = [Moon, Smartphone, Gamepad2];
const POSITION_COLORS = ["#3b82f6", "#a855f7", "#ef4444"];

const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [logs, setLogs] = useState<Record<string, LawLog>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [expandedLaw, setExpandedLaw] = useState<number | null>(null);
  const trackingRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lawsData, logsData] = await Promise.all([
          api.getLaws(),
          api.getLawLogs(),
        ]);
        if (lawsData && Array.isArray(lawsData)) setLaws(lawsData);
        if (logsData && Array.isArray(logsData)) {
          const logsMap: Record<string, LawLog> = {};
          logsData.forEach((log) => (logsMap[log.id] = log));
          setLogs(logsMap);
        }
      } catch (e) {
        console.error("Failed to load laws", e);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded && trackingRef.current) {
      trackingRef.current.scrollLeft = 0;
    }
  }, [isLoaded]);

  const saveLawLog = async (log: LawLog) => {
    try {
      await api.saveLawLog(log);
      window.dispatchEvent(
        new CustomEvent("life26-update", { detail: { type: "laws-updated" } })
      );
    } catch (error) {
      console.error("Failed to save law log", error);
    }
  };

  const activeLaws = useMemo(() => {
    return laws
      .filter((l) => l.isActive)
      .sort((a, b) => a.position - b.position);
  }, [laws]);

  const toggleLaw = (lawId: string, dateString: string, toKept: boolean) => {
    const logId = `${lawId}-${dateString}`;
    const newLogs = { ...logs };
    const existing = newLogs[logId];

    if (existing && existing.kept === toKept) {
      delete newLogs[logId];
      setLogs(newLogs);
      saveLawLog({ id: logId, lawId, dateString, kept: false });
    } else {
      newLogs[logId] = { id: logId, lawId, dateString, kept: toKept };
      setLogs(newLogs);
      saveLawLog(newLogs[logId]);
    }
  };

  const setLawData = async (
    position: number,
    name: string,
    description: string,
    startDate: string,
    endDate: string
  ) => {
    if (!name.trim()) return;

    const currentLaw = activeLaws.find((l) => l.position === position);
    if (currentLaw) {
      const updated = {
        ...currentLaw,
        name: name.trim(),
        description: description.trim(),
        startDate: startDate || currentLaw.startDate,
        endDate: endDate || undefined,
      };
      await api.saveLaw(updated);
    } else {
      const newLaw: Law = {
        id: `law-${Date.now()}`,
        position,
        name: name.trim(),
        description: description.trim(),
        startDate: startDate || todayString,
        endDate: endDate || undefined,
        isActive: true,
      };
      await api.saveLaw(newLaw);
    }

    const updatedLaws = await api.getLaws();
    setLaws(updatedLaws);
    setEditingPosition(null);
    setEditName("");
    setEditDesc("");
    window.dispatchEvent(
      new CustomEvent("life26-update", { detail: { type: "laws-updated" } })
    );
  };

  const replaceLaw = async (position: number) => {
    const currentLaw = activeLaws.find((l) => l.position === position);
    if (currentLaw) {
      await api.saveLaw({ ...currentLaw, isActive: false });
    }
    setEditingPosition(position);
    setEditName("");
    setEditDesc("");
    setEditStartDate(todayString);
    setEditEndDate("");
  };

  const trackingDays = useMemo(() => {
    // Show 3 days back + today + 4 days forward = 8 days
    const days = [];
    for (let i = -3; i <= 4; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({
        date: d,
        dateString: ds,
        isToday: ds === todayString,
        isFuture: ds > todayString,
        dayName: DAYS_HE[d.getDay()],
      });
    }
    return days;
  }, [todayString]);

  const streak = useMemo(() => {
    if (activeLaws.length === 0) return 0;
    let count = 0;
    for (let i = 1; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const relevantLaws = activeLaws.filter((l) => l.startDate <= ds);
      if (relevantLaws.length === 0) break;
      const allKept = relevantLaws.every(
        (l) => logs[`${l.id}-${ds}`]?.kept === true
      );
      if (allKept) count++;
      else break;
    }
    return count;
  }, [activeLaws, logs, todayString]);

  const todayStats = useMemo(() => {
    let kept = 0;
    let broken = 0;
    activeLaws.forEach((law) => {
      const log = logs[`${law.id}-${todayString}`];
      if (log?.kept === true) kept++;
      else if (log?.kept === false) broken++;
    });
    return { kept, broken, total: activeLaws.length };
  }, [activeLaws, logs, todayString]);

  if (!isLoaded) return null;

  return (
    <div
      className="h-screen bg-black text-white font-mono flex flex-col overflow-hidden pt-safe"
      dir="rtl"
    >
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 border-b border-zinc-900/80 flex justify-between items-center shrink-0 bg-black z-20">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
          <h1 className="text-sm sm:text-base font-black italic tracking-tighter uppercase text-zinc-200">
            THREE_LAWS
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {streak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame
                size={13}
                className="text-orange-500 drop-shadow-[0_0_6px_#f97316]"
              />
              <span className="text-xs font-black italic text-orange-500 tabular-nums">
                {streak}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {todayStats.kept === 3 ? (
              <ShieldCheck
                size={16}
                className="text-emerald-500 drop-shadow-[0_0_8px_#10b981]"
              />
            ) : todayStats.broken > 0 ? (
              <ShieldX
                size={16}
                className="text-red-500 drop-shadow-[0_0_8px_#ef4444]"
              />
            ) : (
              <Shield size={16} className="text-zinc-700" />
            )}
            <span
              className={cn(
                "text-xs font-black italic tabular-nums",
                todayStats.kept === 3
                  ? "text-emerald-500"
                  : todayStats.broken > 0
                  ? "text-red-500"
                  : "text-zinc-600"
              )}
            >
              {todayStats.kept}/3
            </span>
          </div>
        </div>
      </header>

      {/* Law Cards — fixed section */}
      <section className="shrink-0 px-4 sm:px-6 py-4 space-y-3">
        {[1, 2, 3].map((position) => {
          const law = activeLaws.find((l) => l.position === position);
          const Icon = POSITION_ICONS[position - 1];
          const color = POSITION_COLORS[position - 1];
          const isEditing = editingPosition === position;
          const isExpanded = expandedLaw === position;
          const log = law ? logs[`${law.id}-${todayString}`] : null;
          const isKept = log?.kept === true;
          const isBroken = log?.kept === false;

          return (
            <div key={position}>
              {isEditing ? (
                <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={14} style={{ color }} />
                    <span
                      className="text-[9px] font-black uppercase tracking-widest"
                      style={{ color }}
                    >
                      חוק {position}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="שם החוק..."
                    autoFocus
                    className="w-full bg-black border border-zinc-800 p-2.5 rounded-sm outline-none focus:border-zinc-600 text-sm font-bold text-white transition-all placeholder:opacity-30 mb-2"
                    dir="rtl"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="תיאור מפורט של החוק..."
                    rows={3}
                    className="w-full bg-black border border-zinc-800 p-2.5 rounded-sm outline-none focus:border-zinc-600 text-xs text-zinc-300 transition-all placeholder:opacity-30 resize-none leading-relaxed"
                    dir="rtl"
                  />
                  <div className="flex gap-3 mt-2">
                    <div className="flex-1">
                      <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">התחלה</label>
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="w-full bg-black border border-zinc-800 p-1.5 rounded-sm outline-none focus:border-zinc-600 text-xs text-zinc-300 transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">סיום</label>
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="w-full bg-black border border-zinc-800 p-1.5 rounded-sm outline-none focus:border-zinc-600 text-xs text-zinc-300 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setLawData(position, editName, editDesc, editStartDate, editEndDate)}
                      className="flex-1 py-2 bg-white text-black rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                    >
                      שמור
                    </button>
                    <button
                      onClick={() => {
                        setEditingPosition(null);
                        setEditName("");
                        setEditDesc("");
                        setEditStartDate("");
                        setEditEndDate("");
                      }}
                      className="px-5 py-2 border border-zinc-800 text-zinc-500 rounded-sm text-[9px] font-black uppercase tracking-widest hover:border-zinc-600 transition-all"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : law ? (
                <div
                  className={cn(
                    "border rounded-lg overflow-hidden transition-all duration-300",
                    isKept
                      ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                      : isBroken
                      ? "border-red-500/20 bg-red-500/[0.03]"
                      : "border-zinc-800/50 bg-zinc-900/20"
                  )}
                >
                  <div
                    className="h-[1.5px] opacity-50"
                    style={{ backgroundColor: color }}
                  />

                  <div className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}12` }}
                        >
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div>
                          <span
                            className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none mb-1"
                            style={{ color, textShadow: `0 0 10px ${color}40` }}
                          >
                            חוק {position}
                          </span>
                          <h3 className="text-[15px] sm:text-base font-bold text-white leading-tight">
                            {law.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleLaw(law.id, todayString, true)}
                          className={cn(
                            "w-9 h-9 rounded-lg border flex items-center justify-center transition-all",
                            isKept
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "border-zinc-800/80 text-zinc-700 hover:border-emerald-500/30 hover:text-emerald-500/50"
                          )}
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => toggleLaw(law.id, todayString, false)}
                          className={cn(
                            "w-9 h-9 rounded-lg border flex items-center justify-center transition-all",
                            isBroken
                              ? "bg-red-500/20 border-red-500/40 text-red-400"
                              : "border-zinc-800/80 text-zinc-700 hover:border-red-500/30 hover:text-red-500/50"
                          )}
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() =>
                            setExpandedLaw(isExpanded ? null : position)
                          }
                          className="text-zinc-700 hover:text-zinc-400 transition-all p-0.5"
                        >
                          <ChevronDown
                            size={13}
                            className={cn(
                              "transition-transform duration-200",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPosition(position);
                            setEditName(law.name);
                            setEditDesc(law.description || "");
                            setEditStartDate(law.startDate || "");
                            setEditEndDate(law.endDate || "");
                          }}
                          className="text-zinc-800 hover:text-zinc-400 transition-colors p-0.5"
                        >
                          <Edit3 size={11} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 mr-[48px] space-y-2">
                        {law.description && (
                          <div className="text-[11px] sm:text-xs text-zinc-500 leading-relaxed whitespace-pre-line">
                            {law.description}
                          </div>
                        )}
                        <div className="text-[9px] text-zinc-600 font-mono tracking-wide">
                          {law.startDate.split("-").reverse().join("/")}
                          {law.endDate && ` — ${law.endDate.split("-").reverse().join("/")}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingPosition(position);
                    setEditName("");
                    setEditDesc("");
                    setEditStartDate(todayString);
                    setEditEndDate("");
                  }}
                  className="w-full border border-dashed border-zinc-800/60 rounded-lg py-4 text-center group hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center justify-center gap-2 text-zinc-700 group-hover:text-zinc-500">
                    <Icon size={14} style={{ color: `${color}40` }} />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      חוק {position} — הגדר
                    </span>
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </section>

      {/* Tracking Section — fills remaining space */}
      <section className="flex-1 min-h-0 border-t border-zinc-900/80 bg-black/50 flex flex-col">
        <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-red-500/80 rounded-full" />
            <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-black tracking-[0.25em]">
              Daily_Tracking
            </span>
          </div>
        </div>

        <div
          ref={trackingRef}
          className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide"
        >
          <div className="px-4 sm:px-6">
            {/* Date headers */}
            <div className="flex">
              <div className="w-24 sm:w-32 shrink-0" />
              {trackingDays.map((day) => (
                <div
                  key={day.dateString}
                  className={cn(
                    "flex-1 text-center min-w-[3rem]",
                    day.isToday ? "text-red-500" : "text-zinc-700"
                  )}
                >
                  <div className="text-[9px] font-black uppercase">
                    {day.dayName}
                  </div>
                  <div className="text-[10px] font-bold tabular-nums">
                    {day.date.getDate()}/{day.date.getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center mt-2 mb-2">
              <div className="w-24 sm:w-32 shrink-0" />
              <div className="flex-1 h-px bg-zinc-900/80" />
            </div>

            {/* Law rows */}
            {[1, 2, 3].map((position) => {
              const law = activeLaws.find((l) => l.position === position);
              const Icon = POSITION_ICONS[position - 1];
              const color = POSITION_COLORS[position - 1];

              return (
                <div key={position} className="flex items-center mb-2">
                  <div className="w-24 sm:w-32 shrink-0 flex items-center gap-2 pr-1">
                    <Icon
                      size={14}
                      style={{ color }}
                      className="shrink-0"
                    />
                    <span className="text-[10px] sm:text-[11px] font-bold text-zinc-600 truncate">
                      חוק {position}
                    </span>
                  </div>

                  {trackingDays.map((day) => {
                    if (!law) {
                      return (
                        <div
                          key={day.dateString}
                          className="flex-1 min-w-[3rem] h-10 flex items-center justify-center"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                        </div>
                      );
                    }

                    const logId = `${law.id}-${day.dateString}`;
                    const log = logs[logId];
                    const isKept = log?.kept === true;
                    const isBroken = log?.kept === false;

                    if (day.isFuture) {
                      return (
                        <div
                          key={day.dateString}
                          className="flex-1 min-w-[3rem] h-10 flex items-center justify-center opacity-10"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={day.dateString}
                        className="flex-1 min-w-[3rem] h-10 flex items-center justify-center gap-1"
                      >
                        <button
                          onClick={() =>
                            toggleLaw(law.id, day.dateString, true)
                          }
                          className={cn(
                            "w-5 h-7 rounded-sm flex items-center justify-center transition-all border",
                            isKept
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "border-zinc-800/40 text-zinc-800 hover:border-emerald-500/20 hover:text-emerald-500/40"
                          )}
                        >
                          <Check size={10} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() =>
                            toggleLaw(law.id, day.dateString, false)
                          }
                          className={cn(
                            "w-5 h-7 rounded-sm flex items-center justify-center transition-all border",
                            isBroken
                              ? "bg-red-500/20 border-red-500/40 text-red-400"
                              : "border-zinc-800/40 text-zinc-800 hover:border-red-500/20 hover:text-red-500/40"
                          )}
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Summary row */}
            <div className="flex items-center mt-1 pt-2 border-t border-zinc-900/50">
              <div className="w-24 sm:w-32 shrink-0">
                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                  Summary
                </span>
              </div>
              {trackingDays.map((day) => {
                let dayKept = 0;
                let dayBroken = 0;
                activeLaws.forEach((l) => {
                  if (l.startDate > day.dateString) return;
                  const log = logs[`${l.id}-${day.dateString}`];
                  if (log?.kept === true) dayKept++;
                  else if (log?.kept === false) dayBroken++;
                });
                const allKept =
                  activeLaws.length > 0 && dayKept === activeLaws.length;
                const hasBroken = dayBroken > 0;

                return (
                  <div
                    key={day.dateString}
                    className="flex-1 min-w-[3rem] h-8 flex items-center justify-center"
                  >
                    {day.isFuture ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                    ) : allKept ? (
                      <ShieldCheck
                        size={15}
                        className="text-emerald-500 drop-shadow-[0_0_4px_#10b981]"
                      />
                    ) : hasBroken ? (
                      <ShieldX
                        size={15}
                        className="text-red-500/50"
                      />
                    ) : dayKept > 0 ? (
                      <span className="text-[9px] font-bold text-zinc-600 tabular-nums">
                        {dayKept}/3
                      </span>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
