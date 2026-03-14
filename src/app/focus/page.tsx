"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Play, Square, Lock, Clock, AlertTriangle } from "lucide-react";
import { cn, getDateString, getNowTime, timeToMinutes, minutesDiff, formatElapsed } from "@/lib/utils";
import { FocusSession } from "@/lib/types";
import { api } from "@/lib/api";

const PRESET_TIMES = ["09:30", "15:30", "20:00"];

function getNextPresetTime(): { time: string; date: string } {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = getDateString();

  for (const t of PRESET_TIMES) {
    if (timeToMinutes(t) > nowMin) {
      return { time: t, date: today };
    }
  }
  // All presets passed today — pick first one tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { time: PRESET_TIMES[0], date: getDateString(tomorrow) };
}

export default function FocusPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [now, setNow] = useState(new Date());

  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [confirmStart, setConfirmStart] = useState(false);

  // Lock state
  const [lockTime, setLockTime] = useState("");
  const [lockDate, setLockDate] = useState(getDateString());
  const [showLock, setShowLock] = useState(false);

  // AI state (only after completing)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ summary: string; affirmation: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState<FocusSession | null>(null);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load (only completed sessions — active sessions live in local state only)
  const loadSessions = useCallback(async () => {
    try {
      const data = await api.getFocusSessions();
      const typed: FocusSession[] = data.map((s: any) => ({ ...s, notes: s.notes || "" }));
      setSessions(typed.filter((s) => s.status === "completed"));
    } catch (e) {
      console.error("Failed to load focus sessions", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Derived
  const completedSessions = useMemo(() => sessions.filter((s) => s.status === "completed"), [sessions]);

  const nextFocusNumber = useMemo(() => {
    if (sessions.length === 0) return 1;
    return Math.max(...sessions.map((s) => s.sessionNumber)) + 1;
  }, [sessions]);

  const nextScheduled = useMemo(() => {
    const withNext = sessions
      .filter((s) => s.nextFocusTime && s.nextFocusDate)
      .sort((a, b) => b.sessionNumber - a.sessionNumber);
    if (withNext.length === 0) return null;
    return { time: withNext[0].nextFocusTime!, date: withNext[0].nextFocusDate! };
  }, [sessions]);

  const countdown = useMemo(() => {
    if (!nextScheduled) return null;
    const target = new Date(`${nextScheduled.date}T${nextScheduled.time}:00`);
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, overdue: true };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      overdue: false,
    };
  }, [nextScheduled, now]);

  const elapsed = useMemo(() => {
    if (!activeSession) return null;
    return minutesDiff(activeSession.startTime, getNowTime());
  }, [activeSession, now]);

  // Actions
  const handlePlayClick = () => {
    if (!confirmStart) {
      setConfirmStart(true);
      // Reset confirm after 3 seconds if not clicked again
      setTimeout(() => setConfirmStart(false), 3000);
      return;
    }
    startNewFocus();
  };

  const startNewFocus = () => {
    setConfirmStart(false);
    const newSession: FocusSession = {
      id: `focus-${Date.now()}`,
      sessionNumber: nextFocusNumber,
      dateString: getDateString(),
      startTime: getNowTime(),
      contentType: "task",
      notes: "",
      status: "active",
    };
    // Only local state — not saved to DB until completed
    setActiveSession(newSession);
    setEditNotes("");
    setAiResult(null);
    setAiError(null);
    setJustCompleted(null);
    setTimeout(() => notesRef.current?.focus(), 200);
  };

  const lockAndComplete = async () => {
    if (!activeSession || !lockTime) return;
    const completed: FocusSession = {
      ...activeSession,
      endTime: getNowTime(),
      notes: editNotes,
      nextFocusTime: lockTime,
      nextFocusDate: lockDate,
      status: "completed",
    };
    try {
      // First time saving to DB — only on completion
      await api.saveFocusSession(completed);

      setJustCompleted(completed);
      setActiveSession(null);
      setShowLock(false);
      setLockTime("");
      await loadSessions();

      // Request AI feedback — send full history for deep context
      const aiInput = editNotes.trim() || `מיקוד ${completed.sessionNumber}, משך: ${completed.startTime} עד ${completed.endTime}`;
      const history = completedSessions.map((s) => ({
        sessionNumber: s.sessionNumber,
        dateString: s.dateString,
        startTime: s.startTime,
        endTime: s.endTime,
        notes: s.notes,
        aiSummary: s.aiSummary,
        aiAffirmation: s.aiAffirmation,
      }));
      setAiLoading(true);
      setAiError(null);
      try {
        const result = await api.getFocusAI(aiInput, history);
        if (result && result.summary) {
          setAiResult(result);
          await api.updateFocusSession({
            id: completed.id,
            aiSummary: result.summary,
            aiAffirmation: result.affirmation,
          });
        } else {
          setAiError("תגובה ריקה מה-AI");
        }
      } catch (e: any) {
        console.error("AI failed", e);
        setAiError(e?.message || "שגיאה בקבלת משוב");
      } finally {
        setAiLoading(false);
      }

      // Notification
      if ("Notification" in window && Notification.permission === "granted") {
        const target = new Date(`${lockDate}T${lockTime}:00`);
        const delay = target.getTime() - Date.now();
        if (delay > 0) {
          setTimeout(() => {
            new Notification("FOCUS_PROTOCOL", {
              body: `מיקוד ${nextFocusNumber + 1} — הגיע הזמן להתייצב.`,
              icon: "/favicon.png",
            });
          }, delay);
        }
      }
    } catch (e) {
      console.error("Failed to complete session", e);
    }
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // --- Render ---
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
      </div>
    );
  }

  // ========================
  // STATE: No active session
  // ========================
  if (!activeSession) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4" dir="rtl">

        {/* AI feedback from just-completed session */}
        {justCompleted && (aiLoading || aiResult || aiError) && (
          <div className="w-full max-w-sm mb-10">
            {aiLoading && (
              <div className="text-center">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping mx-auto mb-2" />
                <p className="text-xs font-mono text-zinc-600">מעבד...</p>
              </div>
            )}
            {aiError && !aiLoading && (
              <div className="text-center">
                <p className="text-xs font-mono text-red-400">{aiError}</p>
              </div>
            )}
            {aiResult && (
              <div className="space-y-4">
                {aiResult.summary.split("\n\n").map((block, i) => (
                  <p key={i} className="text-sm text-zinc-400 leading-relaxed text-right whitespace-pre-line">{block}</p>
                ))}
                {aiResult.affirmation && (
                  <p className="text-sm text-orange-400 font-medium text-center mt-2">{aiResult.affirmation}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Countdown or big play button */}
        {nextScheduled && countdown ? (
          <div className="text-center">
            {/* Countdown */}
            <div className="mb-8">
              {countdown.overdue ? (
                <div className="flex items-center gap-2 justify-center mb-2">
                  <AlertTriangle size={14} className="text-red-400 animate-pulse" />
                  <span className="text-xs font-mono text-red-400 tracking-wider">OVERDUE</span>
                </div>
              ) : (
                <span className="text-xs font-mono text-zinc-600 tracking-wider">NEXT_FOCUS</span>
              )}
              <div className={cn(
                "text-4xl font-black tabular-nums tracking-tight mt-2",
                countdown.overdue ? "text-red-400" : "text-zinc-500"
              )}>
                {countdown.overdue
                  ? nextScheduled.time
                  : `${String(countdown.hours).padStart(2, "0")}:${String(countdown.minutes).padStart(2, "0")}:${String(countdown.seconds).padStart(2, "0")}`}
              </div>
            </div>

            {/* Play circle */}
            <button
              onClick={handlePlayClick}
              className={cn(
                "w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90",
                confirmStart
                  ? "bg-orange-500 border-2 border-orange-400 shadow-[0_0_60px_rgba(249,115,22,0.5)] scale-105"
                  : countdown.overdue
                    ? "bg-red-500/10 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:shadow-[0_0_60px_rgba(239,68,68,0.5)]"
                    : "bg-orange-500/10 border-2 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.2)] hover:shadow-[0_0_60px_rgba(249,115,22,0.4)]"
              )}
            >
              <Play
                size={48}
                strokeWidth={2}
                className={cn(
                  "mr-[-4px] transition-colors duration-300",
                  confirmStart ? "text-black" : countdown.overdue ? "text-red-400" : "text-orange-500"
                )}
              />
            </button>

            <div className="mt-6 text-xs font-mono transition-colors duration-300">
              {confirmStart ? (
                <span className="text-orange-400">לחץ שוב להתחלה</span>
              ) : (
                <span className="text-zinc-700">מיקוד {nextFocusNumber}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            {/* First time / no scheduled — just big play */}
            <button
              onClick={handlePlayClick}
              className={cn(
                "w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90",
                confirmStart
                  ? "bg-orange-500 border-2 border-orange-400 shadow-[0_0_60px_rgba(249,115,22,0.5)] scale-105"
                  : "bg-orange-500/10 border-2 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.2)] hover:shadow-[0_0_60px_rgba(249,115,22,0.4)]"
              )}
            >
              <Play size={48} strokeWidth={2} className={cn(
                "mr-[-4px] transition-colors duration-300",
                confirmStart ? "text-black" : "text-orange-500"
              )} />
            </button>

            <div className="mt-6 text-xs font-mono transition-colors duration-300">
              {confirmStart ? (
                <span className="text-orange-400">לחץ שוב להתחלה</span>
              ) : (
                <span className="text-zinc-700">מיקוד {nextFocusNumber}</span>
              )}
            </div>
          </div>
        )}

        {/* Chain dots */}
        {completedSessions.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-1.5 justify-center max-w-xs">
            {[...completedSessions]
              .sort((a, b) => a.sessionNumber - b.sessionNumber)
              .slice(-30)
              .map((s) => (
                <div
                  key={s.id}
                  title={`מיקוד ${s.sessionNumber}`}
                  className="w-2.5 h-2.5 rounded-full bg-orange-500/60 hover:bg-orange-400 transition-all hover:scale-150"
                />
              ))}
          </div>
        )}

        {/* Total */}
        {completedSessions.length > 0 && (
          <div className="mt-4 text-xs font-mono text-zinc-700">
            {completedSessions.length} מיקודים
          </div>
        )}
      </div>
    );
  }

  // ========================
  // STATE: Active session
  // ========================
  return (
    <div className="min-h-screen bg-black px-4 py-6 md:px-8 md:py-10" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs font-mono text-zinc-600 tracking-wider">מיקוד {activeSession.sessionNumber}</span>
          <div className="text-2xl font-black text-white tabular-nums mt-1">
            {elapsed !== null ? formatElapsed(elapsed) : "00:00"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-zinc-600">{activeSession.startTime}</span>
        </div>
      </div>

      {/* Notes */}
      <textarea
        ref={notesRef}
        value={editNotes}
        onChange={(e) => setEditNotes(e.target.value)}
        placeholder="..."
        className="w-full bg-transparent text-white text-sm font-mono leading-relaxed resize-none outline-none min-h-[50vh] placeholder:text-zinc-800"
        dir="rtl"
      />

      {/* Bottom: Lock icon & panel */}
      {!showLock ? (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              const preset = getNextPresetTime();
              setLockTime(preset.time);
              setLockDate(preset.date);
              setShowLock(true);
            }}
            className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-700 hover:border-orange-500/30 hover:text-orange-500 transition-all duration-300"
          >
            <Lock size={18} />
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Preset time buttons */}
          <div className="flex gap-2 justify-center">
            {PRESET_TIMES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setLockTime(t);
                  // If picking a time that already passed today, set to tomorrow
                  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                  if (timeToMinutes(t) <= nowMin) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setLockDate(getDateString(tomorrow));
                  } else {
                    setLockDate(getDateString());
                  }
                }}
                className={cn(
                  "px-5 py-2.5 rounded-full font-mono text-sm transition-all duration-300",
                  lockTime === t
                    ? "bg-orange-500 text-black font-bold"
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-600"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Custom time (small, secondary) */}
          <div className="flex gap-2 justify-center items-center">
            <input
              type="time"
              value={PRESET_TIMES.includes(lockTime) ? "" : lockTime}
              onChange={(e) => {
                setLockTime(e.target.value);
                const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                if (timeToMinutes(e.target.value) <= nowMin) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setLockDate(getDateString(tomorrow));
                } else {
                  setLockDate(getDateString());
                }
              }}
              className="bg-transparent border-b border-zinc-800 text-zinc-600 text-xs font-mono px-2 py-1 outline-none focus:border-orange-500/40 focus:text-zinc-400 w-20 text-center"
              placeholder="אחר"
            />
            {lockDate !== getDateString() && (
              <span className="text-xs font-mono text-zinc-600">מחר</span>
            )}
          </div>

          {/* Lock button */}
          <button
            onClick={lockAndComplete}
            disabled={!lockTime}
            className={cn(
              "w-full py-3 rounded-full font-mono text-sm transition-all duration-300",
              lockTime
                ? "bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                : "bg-zinc-900 border border-zinc-800 text-zinc-700 cursor-not-allowed"
            )}
          >
            <Lock size={14} className="inline ml-2" />
            נעילה — {lockTime || "—"}
          </button>
        </div>
      )}
    </div>
  );
}
