"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, History, Settings, Check, X, ChevronRight, ChevronLeft, ArrowRight, Loader2 } from "lucide-react";
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
  const [sessionData, setSessionData] = useState<Partial<FocusSession>>({});
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

    // Find first time that is later than now
    const next = times.find(t => t.minutes > currentMinutes);

    if (next) {
      return next.val;
    } else {
      // If all passed, return the first one (tomorrow)
      return times[0].val;
    }
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

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/focus/session');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0) {
          const last = data[0]; // Ordered by startTime desc
          if (last.nextSessionPlan) {
            setNextSessionTime(new Date(last.nextSessionPlan));
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch history");
    }
  };

  // --- Views ---

  const startSession = () => {
    setStartTime(new Date());
    setElapsed(0);
    setNotes("");
    setView('active');

    // Set next plan based on schedule
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

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const finishSession = async () => {
    if (!notes.trim()) return;
    setIsLoading(true);

    // 1. Get AI Review
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
      // Fallback or error handling
      setReviewData({ summary: "Error generating summary", affirmation: "You did great despite technical difficulties!" });
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

    // Parse next plan time
    const [h, m] = nextPlan.split(':').map(Number);
    const planDate = new Date();
    planDate.setHours(h);
    planDate.setMinutes(m);
    if (planDate < endTime) {
      planDate.setDate(planDate.getDate() + 1); // Tomorrow if time passed
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
      await fetchHistory(); // Refresh
      setView('dashboard');
    } catch (e) {
      console.error("Save Error", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-black text-white font-mono" dir="rtl">
      {/* Header */}
      <header className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/50 backdrop-blur-sm shrink-0 z-10 relative">
        <h1 className="text-xl font-black italic tracking-widest text-orange-500 uppercase">FOCUS_PROTOCOL</h1>
        <div className="flex items-center gap-4">
          {view === 'dashboard' ? (
            <>
              <button onClick={() => setView('history')} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <History size={20} />
              </button>
              <button onClick={() => setView('settings')} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
            </>
          ) : (
            <button onClick={() => setView('dashboard')} className="text-zinc-500 hover:text-white uppercase text-xs tracking-widest font-bold">Close Session</button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 relative">

        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-12 animate-in fade-in duration-500 py-12">

            {/* Top Info */}
            <div className="text-center space-y-4 relative z-10">
              <div className="text-orange-500 font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs border border-orange-500/30 py-1 px-3 rounded-full inline-block bg-orange-500/10 backdrop-blur-sm">
                Sequence #{history.length + 1}
              </div>
              <div>
                <div className="text-zinc-500 text-xs tracking-[0.2em] uppercase mb-4">Next Session Protocol</div>
                <div className="text-4xl md:text-6xl font-black font-mono tracking-tighter text-white">
                  {nextSessionTime ? (
                    <span>{nextSessionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  ) : (
                    <span className="text-zinc-600">READY</span>
                  )}
                </div>
                {nextSessionTime && (
                  <div className="text-orange-500/50 mt-2 text-[10px] uppercase tracking-widest">
                    {nextSessionTime.toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Main Action - Ultra Minimalist Spinning Circle */}
            <button
              onClick={startSession}
              className="group relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center rounded-full transition-all focus:outline-none"
            >
              {/* Thin spinning ring */}
              <div className="absolute inset-0 rounded-full border-[1px] border-zinc-900 border-t-orange-500/30 animate-[spin_10s_linear_infinite] group-hover:border-t-orange-500/80 transition-all duration-700" />

              {/* Inner Glow - very subtle */}
              <div className="absolute inset-4 rounded-full bg-orange-500/[0.02] group-hover:bg-orange-500/[0.05] transition-colors duration-1000" />

              {/* Play Icon - Centered directly */}
              <div className="relative z-10 transition-all duration-700 group-hover:scale-110">
                <Play className="w-10 h-10 md:w-14 md:h-14 text-zinc-700 fill-zinc-700 group-hover:text-orange-500 group-hover:fill-orange-500 transition-all duration-700 ml-1.5 opacity-50 group-hover:opacity-100" />
              </div>
            </button>
          </div>
        )}

        {/* VIEW: ACTIVE SESSION */}
        {view === 'active' && (
          <div className="max-w-4xl mx-auto h-full flex flex-col gap-8 animate-in slide-in-from-bottom-10 duration-500">
            <div className="text-center">
              <div className="text-zinc-500 text-xs tracking-widest uppercase mb-2">Session Active</div>
              <div className="text-6xl md:text-8xl font-black font-mono tracking-tighter tabular-nums text-white">
                {formatTime(elapsed)}
              </div>
            </div>

            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-lg p-6 flex flex-col">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your focus thoughts here..."
                className="flex-1 bg-transparent resize-none outline-none text-lg leading-relaxed text-zinc-300 placeholder:text-zinc-700 font-sans"
                autoFocus
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={finishSession}
                disabled={isLoading}
                className="bg-white text-black px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Finish Session
              </button>
            </div>
          </div>
        )}

        {/* VIEW: SUMMARY */}
        {view === 'summary' && reviewData && (
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center animate-in zoom-in-95 duration-300">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 md:p-12 space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-block p-3 rounded-full bg-green-500/10 text-green-500 mb-4">
                  <Check size={32} />
                </div>
                <h2 className="text-2xl font-bold">Session Complete</h2>
                <div className="text-zinc-500">{formatTime(elapsed)} Focus Time</div>
              </div>

              <div className="space-y-6">
                <div className="bg-black/30 p-6 rounded-xl border border-zinc-800/50">
                  <div className="text-orange-500 text-[10px] uppercase tracking-widest mb-2 font-bold">AI Summary</div>
                  <p className="text-zinc-300 text-sm leading-relaxed">{reviewData.summary}</p>
                </div>

                <div className="bg-orange-500/5 p-6 rounded-xl border border-orange-500/10">
                  <div className="text-orange-500 text-[10px] uppercase tracking-widest mb-2 font-bold">Motivation</div>
                  <p className="text-orange-200 text-lg font-medium italic">"{reviewData.affirmation}"</p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800">
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-3">Plan Next Session</label>
                <div className="flex gap-4">
                  <input
                    type="time"
                    value={nextPlan}
                    onChange={(e) => setNextPlan(e.target.value)}
                    className="bg-black border border-zinc-800 text-white p-4 rounded-lg outline-none focus:border-orange-500 transition-colors w-full text-center text-xl font-mono"
                  />
                  <button
                    onClick={saveSession}
                    disabled={isLoading}
                    className="bg-white text-black px-8 rounded-lg font-bold hover:bg-orange-500 hover:text-white transition-all whitespace-nowrap"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : "Save & Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: HISTORY */}
        {view === 'history' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-right-10 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Session History</h2>
              <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {history.map((session, i) => {
                // Check punctuality logic (simple version)
                // If previous session exists, check its nextSessionPlan vs this session's startTime
                let isPunctual = null;
                const prev = history[i + 1]; // History is desc, so prev in time is index + 1
                if (prev && prev.nextSessionPlan) {
                  const planned = new Date(prev.nextSessionPlan);
                  const actual = new Date(session.startTime);
                  const diffMins = Math.abs(actual.getTime() - planned.getTime()) / 60000;
                  isPunctual = diffMins <= 15; // 15 min window
                }

                return (
                  <div key={session.id} className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-500">
                          #{session.sessionNumber}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{new Date(session.startTime).toLocaleDateString()}</div>
                          <div className="text-zinc-500 text-xs uppercase tracking-widest">{new Date(session.startTime).toLocaleTimeString()} • {session.durationMinutes} MIN</div>
                        </div>
                      </div>
                      {isPunctual !== null && (
                        <div className={cn("p-2 rounded-full", isPunctual ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                          {isPunctual ? <Check size={16} /> : <X size={16} />}
                        </div>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-4 group-hover:line-clamp-none transition-all">{session.notes}</p>
                    {session.aiAffirmation && (
                      <div className="pl-4 border-l-2 border-orange-500/50 text-orange-400/80 text-xs italic">
                        "{session.aiAffirmation}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {view === 'settings' && (
          <div className="max-w-xl mx-auto animate-in slide-in-from-right-10 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Focus Protocol Settings</h2>
              <button onClick={() => setView('dashboard')} className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl space-y-6">
                <h3 className="text-lg font-bold mb-4 text-orange-500 uppercase tracking-widest text-xs">Default Schedule</h3>

                <div className="space-y-4">
                  {[
                    { label: 'Morning Protocol', key: 'morning' as const },
                    { label: 'Noon Protocol', key: 'noon' as const },
                    { label: 'Evening Protocol', key: 'evening' as const }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-zinc-800/50">
                      <label className="text-zinc-400 text-sm">{item.label}</label>
                      <input
                        type="time"
                        value={settings[item.key]}
                        onChange={(e) => saveSettings({ ...settings, [item.key]: e.target.value })}
                        className="bg-transparent text-white outline-none focus:text-orange-500 font-mono text-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
