"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, History, Settings, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface FocusSession {
  id: string;
  sessionNumber: number;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  notes: string | null;
  aiSummary: string | null;
  aiAffirmation: string | null;
  nextSessionPlan: string | null;
  status: string;
}

export default function FocusPage() {
  const [view, setView] = useState<'dashboard' | 'active' | 'summary' | 'history' | 'settings'>('dashboard');
  const [history, setHistory] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<{ morning: string, noon: string, evening: string }>({
    morning: "08:00",
    noon: "15:00",
    evening: "20:00"
  });

  // Load settings
  useEffect(() => {
    const stored = localStorage.getItem('focus_settings');
    if (stored) setSettings(JSON.parse(stored));
    fetchHistory();
  }, []);

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem('focus_settings', JSON.stringify(newSettings));
  };

  const getNextScheduledTime = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const times = [
      { name: 'morning', val: settings.morning },
      { name: 'noon', val: settings.noon },
      { name: 'evening', val: settings.evening }
    ].map(t => {
      const [h, m] = t.val.split(':').map(Number);
      return { ...t, minutes: h * 60 + m };
    }).sort((a, b) => a.minutes - b.minutes);

    const next = times.find(t => t.minutes > currentMinutes);
    return next ? next.val : times[0].val;
  };

  // Dashboard State
  const [nextSessionTime, setNextSessionTime] = useState<Date | null>(null);

  // Active Session State
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Summary State
  const [reviewData, setReviewData] = useState<{ summary: string, affirmation: string } | null>(null);
  const [nextPlan, setNextPlan] = useState<string>("");

  // UI Effects State
  const [isMouseOver, setIsMouseOver] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/focus/session');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0) {
          const last = data[0];
          if (last.nextSessionPlan) {
            setNextSessionTime(new Date(last.nextSessionPlan));
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch history");
    }
  };

  const startSession = () => {
    setStartTime(new Date());
    setElapsed(0);
    setNotes("");
    setView('active');
    setNextPlan(getNextScheduledTime());
  };

  useEffect(() => {
    if (view === 'active' && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [view, startTime]);

  const finishSession = async () => {
    if (!notes.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/focus/ai', {
        method: 'POST',
        body: JSON.stringify({ notes }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setReviewData(data);
      setView('summary');
    } catch (e) {
      console.error("AI Error", e);
      setReviewData({ summary: "Error generating summary", affirmation: "Persistence is key." });
      setView('summary');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async () => {
    if (!startTime) return;
    setIsLoading(true);

    const endTime = new Date();
    const durationMinutes = Math.floor(elapsed / 60);

    const [h, m] = nextPlan.split(':').map(Number);
    const planDate = new Date();
    planDate.setHours(h);
    planDate.setMinutes(m);
    if (planDate < endTime) {
      planDate.setDate(planDate.getDate() + 1);
    }

    const payload = {
      id: crypto.randomUUID(),
      sessionNumber: history.length + 1,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes,
      notes,
      aiSummary: reviewData?.summary,
      aiAffirmation: reviewData?.affirmation,
      nextSessionPlan: planDate.toISOString(),
      status: 'completed'
    };

    try {
      await fetch('/api/focus/session', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      await fetchHistory();
      setView('dashboard');
    } catch (e) {
      console.error("Save Error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const resetHistory = async () => {
    if (!confirm('Clear all focus history?')) return;
    try {
      const response = await fetch('/api/focus/session', { method: 'DELETE' });
      if (response.ok) {
        setHistory([]);
        setNextSessionTime(null);
      }
    } catch (error) {
      console.error("Failed to reset history:", error);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-black text-white selection:bg-orange-500/30" dir="rtl">
      {/* Zen Header - Only on Dashboard/History/Settings */}
      {view !== 'active' && view !== 'summary' && (
        <header className="p-8 flex justify-between items-center bg-transparent z-10 relative">
          <h1 className="text-sm font-light tracking-[0.4em] text-zinc-500 uppercase">&nbsp;</h1>
          <div className="flex items-center gap-6">
            <button onClick={() => setView('history')} className="text-zinc-500 hover:text-white transition-colors duration-500">
              <History size={18} strokeWidth={1} />
            </button>
            <button onClick={() => setView('settings')} className="text-zinc-500 hover:text-white transition-colors duration-500">
              <Settings size={18} strokeWidth={1} />
            </button>
          </div>
        </header>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 relative flex flex-col">

        {/* VIEW: DASHBOARD (ZEN) */}
        {view === 'dashboard' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-16 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
              <div className="text-orange-500/40 text-[10px] tracking-[0.5em] uppercase font-light">
                מיקוד #{history.length + 1}
              </div>
              <div>
                <div className="text-6xl md:text-8xl font-thin tracking-tighter leading-none text-white/70">
                  {nextSessionTime && nextSessionTime > new Date() ? (
                    nextSessionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  ) : (
                    getNextScheduledTime()
                  )}
                </div>
                {/* Next Session Date Display - Styled Beautifully */}
                {nextSessionTime && nextSessionTime > new Date() && (
                  <div className="text-zinc-800 text-[10px] tracking-[0.4em] uppercase mt-6 opacity-50 font-light">
                    {nextSessionTime.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={startSession}
              className="group relative w-80 h-80 md:w-[450px] md:h-[450px] flex items-center justify-center rounded-full transition-all duration-1000 focus:outline-none"
            >
              {/* Bold, Weightless Spinning Arcs - THICKER */}
              <div className="absolute inset-0 rounded-full border-[0.5px] border-zinc-900" />
              <div className="absolute inset-0 rounded-full border-t-[3px] border-orange-500/40 animate-[spin_12s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border-b-[1px] border-orange-500/10 animate-[spin_20s_linear_infinite_reverse] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000">
                <Play className="w-16 h-16 md:w-24 md:h-24 text-zinc-500 fill-none group-hover:text-orange-500 transition-all duration-1000 ml-2 stroke-[2px]" />
              </div>

              {/* Subtle Ambient Glow */}
              <div className="absolute inset-[-10%] bg-orange-500/[0.03] rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            </button>
          </div>
        )}

        {/* VIEW: ACTIVE SESSION (DISTRACTION-FREE) */}
        {view === 'active' && (
          <div
            className="flex-1 max-w-4xl mx-auto w-full flex flex-col pt-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-4"
            onMouseEnter={() => setIsMouseOver(true)}
            onMouseLeave={() => setIsMouseOver(false)}
          >
            <div className={cn(
              "flex-1 flex flex-col transition-opacity duration-1000 w-full",
              isMouseOver ? "opacity-100" : "opacity-10"
            )}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="..."
                className="w-full flex-1 bg-transparent resize-none outline-none text-lg md:text-xl font-light leading-relaxed text-zinc-300 placeholder:text-zinc-900 text-right pr-4 rtl"
                autoFocus
              />
            </div>

            {/* Symmetrical Ultra-Minimalist Control Row */}
            <div className="py-20 flex items-center justify-center transition-opacity duration-700">
              <div className="flex items-center gap-8 bg-zinc-900/60 border border-white/5 rounded-full px-6 py-2 hover:border-white/10 transition-all group/row shadow-2xl">
                <input
                  type="text"
                  value={nextPlan}
                  onChange={(e) => setNextPlan(e.target.value)}
                  className="bg-transparent text-3xl font-extralight tracking-tighter text-zinc-300 tabular-nums outline-none w-24 text-center hover:text-white transition-colors cursor-text"
                  maxLength={5}
                />
                <button
                  onClick={finishSession}
                  disabled={isLoading}
                  className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-500 group/btn shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-zinc-500" />
                  ) : (
                    <Check size={18} className="text-zinc-100 group-hover/btn:text-black transition-colors stroke-[3px]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SUMMARY */}
        {view === 'summary' && reviewData && (
          <div className="flex-1 max-w-2xl mx-auto flex flex-col justify-center gap-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-12 text-center">
              <div className="space-y-4">
                <div className="text-[10px] tracking-[0.4em] text-orange-500 uppercase">סיכום ותובנות</div>
                <p className="text-xl md:text-2xl font-light leading-relaxed text-zinc-300">{reviewData.summary}</p>
              </div>

              <div className="space-y-12 pt-20 border-t border-zinc-900/50 relative">
                <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                <div className="text-[11px] tracking-[0.8em] text-zinc-500 uppercase font-light mr-[-0.8em]">המקור להשראה</div>
                <div className="relative px-4">
                  <p className="text-3xl md:text-5xl italic text-zinc-100 font-serif leading-tight drop-shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                    "{reviewData.affirmation}"
                  </p>
                </div>
              </div>

              <button
                onClick={saveSession}
                disabled={isLoading}
                className="mt-12 text-[10px] tracking-[0.5em] text-zinc-500 uppercase hover:text-white transition-colors duration-500 py-4"
              >
                {isLoading ? "שומר..." : "סיום המיקוד"}
              </button>
            </div>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {view === 'history' && (
          <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center justify-between mb-16 px-4">
              <h2 className="text-sm tracking-[0.4em] text-zinc-500 uppercase">יומן מיקוד</h2>
              <button onClick={() => setView('dashboard')} className="text-zinc-600 hover:text-white transition-colors"><X size={18} strokeWidth={1} /></button>
            </div>

            <div className="space-y-1">
              {history.map((session) => (
                <div key={session.id} className="group p-6 hover:bg-zinc-900/20 transition-all rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest">#{session.sessionNumber}</div>
                    <div>
                      <div className="text-sm text-zinc-300 font-light">{new Date(session.startTime).toLocaleDateString()}</div>
                      <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.durationMinutes} דקות
                      </div>
                    </div>
                  </div>
                  <div className="max-w-[300px] text-zinc-500 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {session.aiSummary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {view === 'settings' && (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center justify-between mb-16 px-4">
              <h2 className="text-sm tracking-[0.4em] text-zinc-500 uppercase">הגדרות פרוטוקול</h2>
              <button onClick={() => setView('dashboard')} className="text-zinc-600 hover:text-white transition-colors"><X size={18} strokeWidth={1} /></button>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-[10px] tracking-[0.3em] text-zinc-600 uppercase mb-8">לוח זמנים</h3>
                {[
                  { label: 'מיקוד בוקר', key: 'morning' as const },
                  { label: 'מיקוד צהריים', key: 'noon' as const },
                  { label: 'מיקוד ערב', key: 'evening' as const }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-4 border-b border-zinc-900/50">
                    <label className="text-zinc-400 text-sm font-light uppercase tracking-widest">{item.label}</label>
                    <input
                      type="time"
                      value={settings[item.key]}
                      onChange={(e) => saveSettings({ ...settings, [item.key]: e.target.value })}
                      className="bg-transparent text-white font-light text-lg outline-none focus:text-orange-500 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-24 opacity-20 hover:opacity-100 transition-opacity duration-1000">
                <button
                  onClick={resetHistory}
                  className="w-full py-4 text-[10px] tracking-[0.4em] text-red-900 hover:text-red-500 uppercase transition-colors"
                >
                  מחיקת כל הנתונים
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
