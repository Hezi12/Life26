"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Target,
  Shield,
  ShieldCheck,
  Flame,
  Zap,
  Clock,
  TrendingUp,
  Calendar,
  Activity,
  ChevronLeft,
  ChevronRight,
  Monitor,
  CheckCircle2,
  XCircle,
  Moon,
  Smartphone,
  Gamepad2,
} from "lucide-react";
import { cn, timeToMinutes, getDateString } from "@/lib/utils";
import {
  FocusSession,
  DailyMission,
  Law,
  LawLog,
  WorkTopic,
  Event,
} from "@/lib/types";
import { api } from "@/lib/api";

const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const POSITION_ICONS = [Moon, Smartphone, Gamepad2];
const POSITION_COLORS = ["#3b82f6", "#a855f7", "#ef4444"];

function getWeekDates(offset: number = 0): { start: Date; end: Date; dates: string[] } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + (offset * 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(getDateString(d));
  }

  const end = new Date(startOfWeek);
  end.setDate(startOfWeek.getDate() + 6);

  return { start: startOfWeek, end, dates };
}

function StatCard({ icon: Icon, label, value, sub, color = "text-orange-500", bgGlow }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bgGlow?: string;
}) {
  return (
    <div className="relative border border-zinc-800/60 rounded-xl p-4 bg-zinc-900/20 overflow-hidden group hover:border-zinc-700/60 transition-all duration-300">
      {bgGlow && (
        <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-5 ${bgGlow}`} />
      )}
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={cn("opacity-60", color)} />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{label}</span>
      </div>
      <div className={cn("text-2xl font-black italic tabular-nums leading-none", color)}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-zinc-600 mt-1.5 font-mono">{sub}</div>
      )}
    </div>
  );
}

function MiniBar({ value, max, color = "bg-orange-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [laws, setLaws] = useState<Law[]>([]);
  const [lawLogs, setLawLogs] = useState<LawLog[]>([]);
  const [workTopics, setWorkTopics] = useState<WorkTopic[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [f, m, l, ll, w, e] = await Promise.all([
          api.getFocusSessions(),
          api.getMissions(),
          api.getLaws(),
          api.getLawLogs(),
          api.getWorkTopics(),
          api.getEvents(),
        ]);
        setFocusSessions(f || []);
        setMissions(Array.isArray(m) ? m : []);
        setLaws(l || []);
        setLawLogs(ll || []);
        setWorkTopics(w || []);
        setEvents(e || []);
      } catch (err) {
        console.error("Failed to load analytics data", err);
      }
      setIsLoaded(true);
    };
    loadAll();
  }, []);

  const week = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const todayStr = getDateString();
  const isCurrentWeek = weekOffset === 0;

  // ---- FOCUS STATS ----
  const focusStats = useMemo(() => {
    const completed = focusSessions.filter(s => s.status === "completed");
    const weekSessions = completed.filter(s => week.dates.includes(s.dateString));

    const totalMinutes = weekSessions.reduce((sum, s) => {
      if (s.startTime && s.endTime) {
        let start = timeToMinutes(s.startTime);
        let end = timeToMinutes(s.endTime);
        if (end < start) end += 24 * 60;
        return sum + (end - start);
      }
      return sum;
    }, 0);

    const allTimeTotal = completed.length;

    // Focus per day this week
    const perDay = week.dates.map(d => weekSessions.filter(s => s.dateString === d).length);

    return { weekCount: weekSessions.length, totalMinutes, allTimeTotal, perDay };
  }, [focusSessions, week]);

  // ---- MISSION STATS ----
  const missionStats = useMemo(() => {
    const weekMissions = missions.filter(m => week.dates.includes(m.dateString) && m.mission);
    const scored = weekMissions.filter(m => m.score !== undefined && m.score !== null);
    const avgScore = scored.length > 0
      ? (scored.reduce((sum, m) => sum + (m.score || 0), 0) / scored.length)
      : 0;

    // Streak
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dStr = getDateString(checkDate);
      const m = missions.find(x => x.dateString === dStr && x.mission);
      if (m) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const perDay = week.dates.map(d => {
      const m = missions.find(x => x.dateString === d);
      return m?.score ?? -1;
    });

    return { weekCount: weekMissions.length, avgScore, streak, total: missions.filter(m => m.mission).length, perDay };
  }, [missions, week]);

  // ---- LAWS STATS ----
  const lawStats = useMemo(() => {
    const activeLaws = laws.filter(l => l.isActive);
    const logsMap: Record<string, LawLog> = {};
    lawLogs.forEach(l => logsMap[l.id] = l);

    let weekKept = 0;
    let weekBroken = 0;
    let weekTotal = 0;

    week.dates.forEach(d => {
      if (d > todayStr) return;
      activeLaws.forEach(law => {
        if (law.startDate > d) return;
        weekTotal++;
        const log = logsMap[`${law.id}-${d}`];
        if (log?.kept === true) weekKept++;
        else if (log?.kept === false) weekBroken++;
      });
    });

    // Streak
    let streak = 0;
    for (let i = 1; i <= 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = getDateString(d);
      const relevant = activeLaws.filter(l => l.startDate <= ds);
      if (relevant.length === 0) break;
      const allKept = relevant.every(l => logsMap[`${l.id}-${ds}`]?.kept === true);
      if (allKept) streak++;
      else break;
    }

    const complianceRate = weekTotal > 0 ? Math.round((weekKept / weekTotal) * 100) : 0;

    // Per day compliance
    const perDay = week.dates.map(d => {
      if (d > todayStr) return -1;
      let kept = 0;
      let total = 0;
      activeLaws.forEach(law => {
        if (law.startDate > d) return;
        total++;
        const log = logsMap[`${law.id}-${d}`];
        if (log?.kept === true) kept++;
      });
      return total > 0 ? Math.round((kept / total) * 100) : -1;
    });

    return { weekKept, weekBroken, weekTotal, complianceRate, streak, activeLaws, logsMap, perDay };
  }, [laws, lawLogs, week, todayStr]);

  // ---- WORK STATS ----
  const workStats = useMemo(() => {
    const weekTopics = workTopics.filter(t => week.dates.includes(t.dateString));
    const totalMinutes = weekTopics.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const perDay = week.dates.map(d => {
      const dayTopics = weekTopics.filter(t => t.dateString === d);
      return dayTopics.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    });

    return { weekTopics: weekTopics.length, totalMinutes, hours, mins, perDay };
  }, [workTopics, week]);

  // ---- DAILY ACTIVITY HEATMAP ----
  const dailyActivity = useMemo(() => {
    return week.dates.map((d, i) => {
      const dayEvents = events.filter(e => e.dateString === d).length;
      const dayFocus = focusSessions.filter(s => s.dateString === d && s.status === "completed").length;
      const dayMission = missions.find(m => m.dateString === d && m.mission) ? 1 : 0;
      const dayWork = workTopics.filter(t => t.dateString === d).length;

      return {
        date: d,
        dayName: DAYS_HE[new Date(d + "T00:00:00").getDay()],
        dayNum: new Date(d + "T00:00:00").getDate(),
        events: dayEvents,
        focus: dayFocus,
        mission: dayMission,
        work: dayWork,
        total: dayEvents + dayFocus + dayMission + dayWork,
        isToday: d === todayStr,
        isFuture: d > todayStr,
      };
    });
  }, [week, events, focusSessions, missions, workTopics, todayStr]);

  // ---- OVERALL SCORE ----
  const weeklyScore = useMemo(() => {
    let score = 0;
    let maxScore = 0;

    // Focus sessions (max 2 per day = 14 points)
    maxScore += 14;
    score += Math.min(focusStats.weekCount * 2, 14);

    // Missions (max 7 points for having missions, +3 per high score)
    maxScore += 7;
    score += missionStats.weekCount;

    // Laws compliance
    maxScore += 21;
    score += lawStats.weekKept;

    // Work sessions (max 10 points)
    maxScore += 10;
    score += Math.min(workStats.weekTopics, 10);

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }, [focusStats, missionStats, lawStats, workStats]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
      </div>
    );
  }

  const weekLabel = (() => {
    const s = week.start;
    const e = week.end;
    return `${s.getDate()}/${s.getMonth() + 1} — ${e.getDate()}/${e.getMonth() + 1}`;
  })();

  return (
    <div className="h-screen overflow-y-auto bg-black text-white font-mono pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8 pt-safe" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-zinc-900/80 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <BarChart3 size={16} className="text-orange-500" />
              <h1 className="text-base sm:text-lg font-black italic tracking-tighter uppercase text-white">
                ANALYTICS
              </h1>
            </div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] mt-0.5">
              Weekly Performance Overview
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <div className="text-center min-w-[120px]">
              <div className="text-xs font-bold text-orange-500 tabular-nums">{weekLabel}</div>
              {isCurrentWeek && (
                <div className="text-[8px] text-zinc-600 uppercase tracking-widest">השבוע</div>
              )}
            </div>
            <button
              onClick={() => setWeekOffset(w => Math.min(w + 1, 0))}
              disabled={isCurrentWeek}
              className={cn(
                "p-1.5 transition-colors",
                isCurrentWeek ? "text-zinc-800" : "text-zinc-500 hover:text-white"
              )}
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">

        {/* Weekly Score */}
        <div className="relative border border-zinc-800/60 rounded-xl p-5 bg-zinc-900/10 overflow-hidden">
          <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full blur-3xl opacity-[0.03] bg-orange-500" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-orange-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Weekly_Score</span>
            </div>
            <span className={cn(
              "text-3xl font-black italic tabular-nums",
              weeklyScore >= 70 ? "text-emerald-400" : weeklyScore >= 40 ? "text-orange-500" : "text-red-400"
            )}>
              {weeklyScore}%
            </span>
          </div>
          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                weeklyScore >= 70 ? "bg-emerald-500" : weeklyScore >= 40 ? "bg-orange-500" : "bg-red-500"
              )}
              style={{ width: `${weeklyScore}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Target}
            label="מיקודים"
            value={focusStats.weekCount}
            sub={`${Math.floor(focusStats.totalMinutes / 60)} שעות סה״כ`}
            color="text-orange-500"
            bgGlow="bg-orange-500"
          />
          <StatCard
            icon={Zap}
            label="משימות"
            value={missionStats.weekCount}
            sub={missionStats.avgScore > 0 ? `ממוצע ${missionStats.avgScore.toFixed(1)}/3` : "אין ציונים"}
            color="text-[#00d4ff]"
            bgGlow="bg-[#00d4ff]"
          />
          <StatCard
            icon={Shield}
            label="חוקים"
            value={`${lawStats.complianceRate}%`}
            sub={`${lawStats.weekKept} שמירות מתוך ${lawStats.weekTotal}`}
            color="text-emerald-400"
            bgGlow="bg-emerald-500"
          />
          <StatCard
            icon={Monitor}
            label="עבודה"
            value={`${workStats.hours}:${String(workStats.mins).padStart(2, "0")}`}
            sub={`${workStats.weekTopics} נושאים`}
            color="text-purple-400"
            bgGlow="bg-purple-500"
          />
        </div>

        {/* Streaks Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-zinc-800/40 rounded-xl p-3 bg-zinc-900/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Flame size={16} className="text-orange-500" />
            </div>
            <div>
              <div className="text-lg font-black italic text-orange-500 leading-none">{missionStats.streak}D</div>
              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-0.5">Mission Streak</div>
            </div>
          </div>
          <div className="border border-zinc-800/40 rounded-xl p-3 bg-zinc-900/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck size={16} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-lg font-black italic text-emerald-400 leading-none">{lawStats.streak}D</div>
              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-0.5">Laws Streak</div>
            </div>
          </div>
          <div className="border border-zinc-800/40 rounded-xl p-3 bg-zinc-900/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
              <Target size={16} className="text-[#00d4ff]" />
            </div>
            <div>
              <div className="text-lg font-black italic text-[#00d4ff] leading-none">{focusStats.allTimeTotal}</div>
              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-0.5">Total Focus</div>
            </div>
          </div>
        </div>

        {/* Daily Activity Grid */}
        <div className="border border-zinc-800/60 rounded-xl p-5 bg-zinc-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-zinc-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Daily_Activity</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {dailyActivity.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "rounded-lg p-3 text-center transition-all border",
                  day.isToday
                    ? "border-orange-500/30 bg-orange-500/[0.05]"
                    : day.isFuture
                    ? "border-zinc-900 bg-zinc-900/20 opacity-30"
                    : "border-zinc-800/30 bg-zinc-900/20"
                )}
              >
                <div className={cn(
                  "text-[9px] font-black mb-1",
                  day.isToday ? "text-orange-500" : "text-zinc-600"
                )}>
                  {day.dayName}
                </div>
                <div className={cn(
                  "text-sm font-black tabular-nums mb-2",
                  day.isToday ? "text-white" : "text-zinc-500"
                )}>
                  {day.dayNum}
                </div>

                <div className="space-y-1">
                  {day.focus > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <Target size={8} className="text-orange-500" />
                      <span className="text-[8px] text-orange-500 font-bold">{day.focus}</span>
                    </div>
                  )}
                  {day.mission > 0 && (
                    <div className="flex items-center justify-center">
                      <Zap size={8} className="text-[#00d4ff]" />
                    </div>
                  )}
                  {day.work > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <Monitor size={8} className="text-purple-400" />
                      <span className="text-[8px] text-purple-400 font-bold">{day.work}</span>
                    </div>
                  )}
                  {!day.isFuture && day.total === 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 mx-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Sessions Detail */}
        <div className="border border-zinc-800/60 rounded-xl p-5 bg-zinc-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} className="text-orange-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Focus_Sessions</span>
          </div>
          <div className="space-y-1">
            {week.dates.map((d, i) => (
              <div key={d} className="flex items-center gap-3">
                <span className={cn(
                  "text-[9px] w-6 text-center font-bold",
                  d === todayStr ? "text-orange-500" : "text-zinc-700"
                )}>
                  {DAYS_HE[new Date(d + "T00:00:00").getDay()]}
                </span>
                <div className="flex-1">
                  <MiniBar value={focusStats.perDay[i]} max={3} color="bg-orange-500" />
                </div>
                <span className="text-[10px] text-zinc-600 tabular-nums w-4 text-center">
                  {focusStats.perDay[i] > 0 ? focusStats.perDay[i] : "·"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Scores */}
        <div className="border border-zinc-800/60 rounded-xl p-5 bg-zinc-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-[#00d4ff]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Mission_Scores</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {week.dates.map((d, i) => {
              const score = missionStats.perDay[i];
              const hasScore = score >= 0;
              return (
                <div key={d} className="text-center">
                  <div className={cn(
                    "text-[9px] font-bold mb-1.5",
                    d === todayStr ? "text-[#00d4ff]" : "text-zinc-700"
                  )}>
                    {DAYS_HE[new Date(d + "T00:00:00").getDay()]}
                  </div>
                  <div className={cn(
                    "w-10 h-10 mx-auto rounded-lg border flex items-center justify-center text-sm font-black",
                    !hasScore
                      ? "border-zinc-900 text-zinc-900"
                      : score === 3
                      ? "border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]"
                      : score === 2
                      ? "border-[#00d4ff]/20 bg-[#00d4ff]/5 text-[#00d4ff]/60"
                      : score >= 0
                      ? "border-zinc-800 text-zinc-600"
                      : "border-zinc-900 text-zinc-900"
                  )}>
                    {hasScore ? score : "·"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Laws Weekly Compliance */}
        <div className="border border-zinc-800/60 rounded-xl p-5 bg-zinc-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Laws_Compliance</span>
          </div>

          {lawStats.activeLaws.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-zinc-700">אין חוקים פעילים</div>
          ) : (
            <div className="space-y-3">
              {lawStats.activeLaws.map((law) => {
                const Icon = POSITION_ICONS[law.position - 1];
                const color = POSITION_COLORS[law.position - 1];
                const weekLogs = week.dates.map(d => {
                  if (d > todayStr) return null;
                  return lawStats.logsMap[`${law.id}-${d}`];
                });
                const kept = weekLogs.filter(l => l?.kept === true).length;
                const total = weekLogs.filter(l => l !== null).length;

                return (
                  <div key={law.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color }} />
                        <span className="text-[10px] font-bold text-zinc-400">{law.name}</span>
                      </div>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
                        {kept}/{total}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {week.dates.map((d, i) => {
                        const log = weekLogs[i];
                        const isFuture = d > todayStr;
                        return (
                          <div key={d} className="flex items-center justify-center h-6">
                            {isFuture ? (
                              <div className="w-1 h-1 rounded-full bg-zinc-900" />
                            ) : log?.kept === true ? (
                              <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : log?.kept === false ? (
                              <XCircle size={14} className="text-red-500/50" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-zinc-800" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Work Hours */}
        <div className="border border-zinc-800/60 rounded-xl p-5 bg-zinc-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Work_Hours</span>
          </div>
          <div className="space-y-1">
            {week.dates.map((d, i) => {
              const mins = workStats.perDay[i];
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              return (
                <div key={d} className="flex items-center gap-3">
                  <span className={cn(
                    "text-[9px] w-6 text-center font-bold",
                    d === todayStr ? "text-purple-400" : "text-zinc-700"
                  )}>
                    {DAYS_HE[new Date(d + "T00:00:00").getDay()]}
                  </span>
                  <div className="flex-1">
                    <MiniBar value={mins} max={480} color="bg-purple-500" />
                  </div>
                  <span className="text-[10px] text-zinc-600 tabular-nums w-12 text-left">
                    {mins > 0 ? `${h}:${String(m).padStart(2, "0")}` : "·"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* All-Time Stats */}
        <div className="border border-zinc-800/60 rounded-xl p-5 bg-zinc-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-zinc-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">All_Time</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xl font-black italic text-orange-500">{focusStats.allTimeTotal}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider">מיקודים</div>
            </div>
            <div>
              <div className="text-xl font-black italic text-[#00d4ff]">{missionStats.total}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider">משימות</div>
            </div>
            <div>
              <div className="text-xl font-black italic text-emerald-400">{lawLogs.filter(l => l.kept).length}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider">חוקים שנשמרו</div>
            </div>
            <div>
              <div className="text-xl font-black italic text-purple-400">{workTopics.length}</div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-wider">נושאי עבודה</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
