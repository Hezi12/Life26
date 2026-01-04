"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, X, Edit2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Types
interface FocusSession {
  id: string;
  sessionNumber: number;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  aiSummary: string | null;
  aiAffirmation: string | null;
  nextSessionPlan: string | null;
  status: string;
}

export default function FocusHistoryPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<FocusSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editTime, setEditTime] = useState<string>("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/focus/session');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  const updateSessionDateTime = async (id: string) => {
    if (!editDate || !editTime) return;
    setIsLoading(true);

    try {
      const [year, month, day] = editDate.split('-').map(Number);
      const [hours, minutes] = editTime.split(':').map(Number);
      
      const newStartDate = new Date(year, month - 1, day, hours, minutes);

      const res = await fetch('/api/focus/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, startTime: newStartDate.toISOString() }),
      });

      if (res.ok) {
        await fetchSessions();
        setEditingSessionId(null);
        if (selectedSession?.id === id) {
          const updated = await fetch(`/api/focus/session`).then(r => r.json());
          const updatedSession = updated.find((s: FocusSession) => s.id === id);
          if (updatedSession) setSelectedSession(updatedSession);
        }
      }
    } catch (e) {
      console.error("Failed to update session", e);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (session: FocusSession) => {
    setEditingSessionId(session.id);
    const date = new Date(session.startTime);
    setEditDate(date.toISOString().split('T')[0]);
    setEditTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditDate("");
    setEditTime("");
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-black text-white selection:bg-orange-500/30" dir="rtl">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-zinc-900 bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/focus" className="text-zinc-500 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-black italic tracking-[0.2em] text-white">FOCUS_HISTORY</h1>
              <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-[0.3em] mt-1">
                {sessions.length} Sessions Logged
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions List */}
        <div className={cn(
          "flex flex-col border-l border-zinc-900 overflow-hidden transition-all duration-300",
          selectedSession ? "w-full md:w-1/2" : "w-full"
        )}>
          <div className="p-4 sm:p-6 border-b border-zinc-900 bg-zinc-950/20 shrink-0">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Session_Archive</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {sessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <p className="text-zinc-600 text-sm uppercase tracking-widest">No sessions found</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-900">
                {sessions.map((session) => {
                  const startDate = new Date(session.startTime);
                  const isEditing = editingSessionId === session.id;
                  const isSelected = selectedSession?.id === session.id;

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "p-4 sm:p-6 hover:bg-zinc-900/20 transition-all cursor-pointer group",
                        isSelected && "bg-zinc-900/40 border-r-2 border-orange-500"
                      )}
                      onClick={() => !isEditing && setSelectedSession(session)}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="text-[9px] text-zinc-600 uppercase tracking-widest block mb-1">
                                תאריך
                              </label>
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm font-mono p-2 rounded outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[9px] text-zinc-600 uppercase tracking-widest block mb-1">
                                שעה
                              </label>
                              <input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm font-mono p-2 rounded outline-none focus:border-orange-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSessionDateTime(session.id);
                              }}
                              disabled={isLoading}
                              className="flex-1 px-4 py-2 bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-orange-400 transition-all disabled:opacity-50"
                            >
                              {isLoading ? (
                                <Loader2 size={14} className="animate-spin mx-auto" />
                              ) : (
                                "שמור"
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditing();
                              }}
                              className="px-4 py-2 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded hover:bg-zinc-700 transition-all"
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg sm:text-xl font-black text-orange-500 tracking-tighter">
                                  #{session.sessionNumber}
                                </span>
                                <span className="text-xs text-zinc-500 font-light">
                                  {startDate.toLocaleDateString('he-IL', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-xs text-zinc-600 font-mono">
                                  {startDate.toLocaleTimeString('he-IL', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {session.aiSummary && (
                                <p className="text-sm text-zinc-400 line-clamp-2 mt-2">
                                  {session.aiSummary}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(session);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-orange-500 transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Session Detail View */}
        {selectedSession && (
          <div className="hidden md:flex flex-col w-1/2 border-l border-zinc-900 overflow-hidden bg-[#050505]">
            <div className="p-4 sm:p-6 border-b border-zinc-900 bg-zinc-950/20 shrink-0 flex items-center justify-between">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">Session_Details</h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-zinc-600 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-hide">
              {/* Session Info */}
              <div className="space-y-4">
                {editingSessionId === selectedSession.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm font-mono p-2 rounded outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm font-mono p-2 rounded outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateSessionDateTime(selectedSession.id)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-orange-400 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin mx-auto" />
                        ) : (
                          "שמור"
                        )}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded hover:bg-zinc-700 transition-all"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-mono text-white">
                      {new Date(selectedSession.startTime).toLocaleString('he-IL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <button
                      onClick={() => startEditing(selectedSession)}
                      className="p-1.5 text-zinc-600 hover:text-orange-500 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedSession.notes && (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black border-b border-zinc-900 pb-2">
                    Notes
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {selectedSession.notes}
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {selectedSession.aiSummary && (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-black border-b border-zinc-900 pb-2">
                    AI Summary
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {selectedSession.aiSummary}
                  </p>
                </div>
              )}

              {/* AI Affirmation */}
              {selectedSession.aiAffirmation && (
                <div className="space-y-3 pt-4 border-t border-zinc-900">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-orange-500/60 font-black">
                    Affirmation
                  </div>
                  <p className="text-lg italic text-zinc-200 leading-relaxed">
                    "{selectedSession.aiAffirmation}"
                  </p>
                </div>
              )}

              {/* Next Session Plan */}
              {selectedSession.nextSessionPlan && (
                <div className="space-y-3 pt-4 border-t border-zinc-900">
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
                    Next Session Planned
                  </div>
                  <div className="text-sm font-mono text-zinc-400">
                    {new Date(selectedSession.nextSessionPlan).toLocaleString('he-IL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Mobile Detail Modal */}
        {selectedSession && (
          <div className="md:hidden fixed inset-0 bg-black z-50 flex flex-col">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-black uppercase tracking-widest">Session Details</h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-zinc-600 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Same content as desktop detail view */}
              <div className="space-y-4">
                {editingSessionId === selectedSession.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm font-mono p-2 rounded outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm font-mono p-2 rounded outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateSessionDateTime(selectedSession.id)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-orange-400 transition-all disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin mx-auto" />
                        ) : (
                          "שמור"
                        )}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded hover:bg-zinc-700 transition-all"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-mono text-white">
                      {new Date(selectedSession.startTime).toLocaleString('he-IL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <button
                      onClick={() => startEditing(selectedSession)}
                      className="p-1.5 text-zinc-600 hover:text-orange-500 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              {selectedSession.notes && (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black border-b border-zinc-900 pb-2">
                    Notes
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {selectedSession.notes}
                  </div>
                </div>
              )}
              {selectedSession.aiSummary && (
                <div className="space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-black border-b border-zinc-900 pb-2">
                    AI Summary
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {selectedSession.aiSummary}
                  </p>
                </div>
              )}
              {selectedSession.aiAffirmation && (
                <div className="space-y-3 pt-4 border-t border-zinc-900">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-orange-500/60 font-black">
                    Affirmation
                  </div>
                  <p className="text-lg italic text-zinc-200 leading-relaxed">
                    "{selectedSession.aiAffirmation}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

