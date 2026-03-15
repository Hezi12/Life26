"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Play, Lock, Pencil, History, Check } from "lucide-react";
import { cn, getDateString, getNowTime, timeToMinutes } from "@/lib/utils";
import { FocusSession } from "@/lib/types";
import { api } from "@/lib/api";

const PRESET_TIMES = ["09:30", "15:30", "20:00"];

function renderMarkdown(text: string) {
  // Remove stray ** that don't wrap text
  const cleaned = text.replace(/\*\*\s*$/gm, "").replace(/^\s*\*\*\s*$/gm, "").trim();
  if (!cleaned) return null;
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-zinc-200 font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function getDefaultNextTime(): { time: string; date: string } {
  const now = new Date();
  const target = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const mins = target.getMinutes();
  const rounded = mins < 15 ? 0 : mins < 45 ? 30 : 60;
  target.setMinutes(rounded, 0, 0);

  const h = String(target.getHours()).padStart(2, "0");
  const m = String(target.getMinutes()).padStart(2, "0");
  return { time: `${h}:${m}`, date: getDateString(target) };
}

export default function FocusPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [now, setNow] = useState(new Date());

  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editingStart, setEditingStart] = useState(false);

  // Lock state
  const [lockTime, setLockTime] = useState("");
  const [lockDate, setLockDate] = useState(getDateString());
  const [showLock, setShowLock] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Prevent page scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Clock — update every second only when needed (countdown/elapsed)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load completed sessions
  const loadSessions = useCallback(async () => {
    try {
      const data = await api.getFocusSessions();
      const typed: FocusSession[] = data.map((s: FocusSession) => ({ ...s, notes: s.notes || "" }));
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

  // Latest session's AI feedback (persisted in DB, won't disappear)
  const latestFeedback = useMemo(() => {
    const sorted = [...completedSessions].sort((a, b) => b.sessionNumber - a.sessionNumber);
    const latest = sorted[0];
    if (!latest?.aiSummary) return null;
    return { summary: latest.aiSummary, affirmation: latest.aiAffirmation || "" };
  }, [completedSessions]);


  // Actions
  const startNewFocus = () => {
    const newSession: FocusSession = {
      id: `focus-${Date.now()}`,
      sessionNumber: nextFocusNumber,
      dateString: getDateString(),
      startTime: getNowTime(),
      contentType: "task",
      notes: "",
      status: "active",
    };
    setActiveSession(newSession);
    setEditNotes("");
    setAiError(null);
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
      await api.saveFocusSession(completed);

      setActiveSession(null);
      setShowLock(false);
      setLockTime("");
      setAiLoading(true);
      setAiError(null);

      // Reload sessions so the new one appears
      await loadSessions();

      // Request AI feedback in background
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

      try {
        const result = await api.getFocusAI(aiInput, history);
        if (result && result.summary) {
          // Save AI result to DB
          await api.updateFocusSession({
            id: completed.id,
            aiSummary: result.summary,
            aiAffirmation: result.affirmation,
          });
          // Reload so latestFeedback picks it up from DB
          await loadSessions();
        } else {
          setAiError("תגובה ריקה מה-AI");
        }
      } catch (e: any) {
        console.error("AI failed", e);
        setAiError(e?.message || "שגיאה בקבלת משוב");
      } finally {
        setAiLoading(false);
      }

      // Notification for next focus
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
    // Show feedback: either loading, error, or the latest from DB
    const showFeedback = aiLoading || aiError || latestFeedback;

    return (
      <div className="h-screen overflow-hidden bg-black flex flex-col items-center px-4 pt-safe" dir="rtl">

        {/* Top section — AI feedback, scrollable if long */}
        <div className="flex-1 flex flex-col justify-end items-center w-full max-w-md overflow-hidden pb-8">
          {showFeedback && (
            <div className="w-full overflow-y-auto max-h-full">
              {aiLoading && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: "0.6s" }} />
                  </div>
                  <p className="text-xs font-mono text-zinc-600">השותף האסטרטגי מעבד...</p>
                </div>
              )}
              {aiError && !aiLoading && (
                <div className="text-center">
                  <p className="text-xs font-mono text-red-400">{aiError}</p>
                </div>
              )}
              {!aiLoading && !aiError && latestFeedback && (
                <div className="space-y-3">
                  {latestFeedback.summary.split("\n\n").map((block, i) => (
                    <p key={i} className="text-[11px] md:text-[13px] text-zinc-500 leading-relaxed text-right whitespace-pre-line">{renderMarkdown(block)}</p>
                  ))}
                  {latestFeedback.affirmation && (
                    <div className="border-r-2 border-orange-500/40 pr-3 mt-4">
                      <p className="text-[11px] md:text-[13px] text-orange-400/80 leading-relaxed text-right">{renderMarkdown(latestFeedback.affirmation)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center — Play button + focus info */}
        <div className="flex flex-col items-center py-4">
          <div className="text-center mb-6">
            {nextScheduled ? (
              <>
                <span className="text-xs font-mono text-zinc-600 tracking-wider">מיקוד {nextFocusNumber}</span>
                <div className="text-4xl font-black tabular-nums tracking-tight mt-2 text-zinc-400">
                  {nextScheduled.time}
                </div>
                {nextScheduled.date !== getDateString() && (
                  <span className="text-xs font-mono text-zinc-600 mt-1 block">מחר</span>
                )}
              </>
            ) : (
              <span className="text-sm font-mono text-zinc-600">מיקוד {nextFocusNumber}</span>
            )}
          </div>

          <button
            onClick={startNewFocus}
            className="w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 bg-orange-500/10 border-2 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.2)] hover:shadow-[0_0_60px_rgba(249,115,22,0.4)]"
          >
            <Play size={48} strokeWidth={2} className="mr-[-4px] text-orange-500" />
          </button>
        </div>

        {/* Bottom section — spacer to balance layout */}
        <div className="flex-1" />

        {/* History link */}
        {completedSessions.length > 0 && (
          <Link href="/focus/history" className="fixed bottom-24 md:bottom-6 left-4 md:left-6 text-zinc-700 hover:text-zinc-500 transition-colors">
            <History size={18} />
          </Link>
        )}
      </div>
    );
  }

  // ========================
  // STATE: Active session
  // ========================
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const lockDefaultPreset = PRESET_TIMES.find((t) => timeToMinutes(t) > nowMin) || PRESET_TIMES[0];

  return (
    <div className="h-screen overflow-hidden bg-black px-4 py-6 md:px-8 md:py-10 pt-safe flex flex-col" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <span className="text-sm font-black text-white tracking-tight">מיקוד {activeSession.sessionNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 mr-4">
            {editingStart ? (
              <>
                <input
                  type="time"
                  value={activeSession.startTime}
                  onChange={(e) => setActiveSession({ ...activeSession, startTime: e.target.value })}
                  className="text-[10px] font-mono text-orange-400 bg-orange-500/10 outline-none w-[3.5rem] px-1 py-0.5 rounded"
                  autoFocus
                />
                <span className="text-[10px] font-mono text-zinc-700">·</span>
                <input
                  type="date"
                  value={activeSession.dateString}
                  onChange={(e) => setActiveSession({ ...activeSession, dateString: e.target.value })}
                  className="text-[10px] font-mono text-orange-400 bg-orange-500/10 outline-none px-1 py-0.5 rounded"
                />
                <button
                  onClick={() => setEditingStart(false)}
                  className="text-orange-500 hover:text-orange-400 transition-colors mr-1"
                >
                  <Check size={10} />
                </button>
              </>
            ) : (
              <>
                <span className="text-[10px] font-mono text-zinc-600">
                  {activeSession.startTime} · {activeSession.dateString}
                </span>
                <button
                  onClick={() => setEditingStart(true)}
                  className="text-zinc-700 hover:text-zinc-500 transition-colors"
                >
                  <Pencil size={9} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lock controls */}
        {!showLock ? (
          <button
            onClick={() => {
              setLockTime(lockDefaultPreset);
              if (timeToMinutes(lockDefaultPreset) <= nowMin) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setLockDate(getDateString(tomorrow));
              } else {
                setLockDate(getDateString());
              }
              setShowCustom(false);
              setShowLock(true);
            }}
            className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-all duration-300"
          >
            <Lock size={14} />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* Default preset */}
            <button
              onClick={() => {
                setLockTime(lockDefaultPreset);
                const nm = new Date().getHours() * 60 + new Date().getMinutes();
                if (timeToMinutes(lockDefaultPreset) <= nm) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setLockDate(getDateString(tomorrow));
                } else {
                  setLockDate(getDateString());
                }
                setShowCustom(false);
              }}
              className={cn(
                "font-mono text-sm px-2 py-1 rounded-lg transition-all duration-200",
                lockTime === lockDefaultPreset && !showCustom
                  ? "text-orange-400 bg-orange-500/10"
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {lockDefaultPreset}
            </button>

            {/* +3h option — show as input when editing, button otherwise */}
            {showCustom ? (
              <input
                type="time"
                value={lockTime}
                onChange={(e) => {
                  setLockTime(e.target.value);
                  const nm = new Date().getHours() * 60 + new Date().getMinutes();
                  if (timeToMinutes(e.target.value) <= nm) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setLockDate(getDateString(tomorrow));
                  } else {
                    setLockDate(getDateString());
                  }
                }}
                autoFocus
                className="text-sm font-mono tabular-nums text-orange-400 text-center outline-none w-28 bg-orange-500/10 px-2 py-1 rounded-lg [&::-webkit-calendar-picker-indicator]:invert"
              />
            ) : (
              <button
                onClick={() => {
                  const def = getDefaultNextTime();
                  setLockTime(def.time);
                  setLockDate(def.date);
                }}
                className={cn(
                  "font-mono text-sm px-2 py-1 rounded-lg transition-all duration-200",
                  lockTime === getDefaultNextTime().time
                    ? "text-orange-400 bg-orange-500/10"
                    : "text-zinc-600 hover:text-zinc-400"
                )}
              >
                {getDefaultNextTime().time}
              </button>
            )}

            {/* Pencil toggle */}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              <Pencil size={12} />
            </button>

            {lockDate !== getDateString() && (
              <span className="text-[10px] font-mono text-zinc-600">מחר</span>
            )}

            {/* Lock confirm */}
            <button
              onClick={lockAndComplete}
              disabled={!lockTime}
              className="w-8 h-8 rounded-full border border-orange-500/30 flex items-center justify-center text-orange-500 hover:bg-orange-500/10 active:scale-90 transition-all duration-300"
            >
              <Lock size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <textarea
          ref={notesRef}
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          placeholder="..."
          className="w-full h-full bg-transparent text-white text-sm font-mono leading-relaxed resize-none outline-none placeholder:text-zinc-800"
          dir="rtl"
        />
      </div>

    </div>
  );
}
