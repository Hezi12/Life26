"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Trash2, Brain, Pencil, Check, X, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FocusSession, AiProfile } from "@/lib/types";
import { api } from "@/lib/api";

function renderMarkdown(text: string) {
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

export default function FocusHistoryPage() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [profile, setProfile] = useState<AiProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [editingNextId, setEditingNextId] = useState<string | null>(null);
  const [editNextTime, setEditNextTime] = useState("");
  const [editNextDate, setEditNextDate] = useState("");

  // Prompt editor state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [promptDraft, setPromptDraft] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sessionsData, profileData] = await Promise.all([
        api.getFocusSessions(),
        api.getAiProfile(),
      ]);
      setSessions(sessionsData.sort((a, b) => b.sessionNumber - a.sessionNumber));
      setProfile(profileData);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteFocusSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  const handleSaveTimes = async (id: string) => {
    try {
      await api.updateFocusSession({ id, startTime: editStart, endTime: editEnd });
      setSessions((prev) =>
        prev.map((s) => s.id === id ? { ...s, startTime: editStart, endTime: editEnd } : s)
      );
      setEditingTimeId(null);
    } catch (e) {
      console.error("Failed to update times", e);
    }
  };

  const handleSaveNext = async (id: string) => {
    try {
      await api.updateFocusSession({
        id,
        nextFocusTime: editNextTime || undefined,
        nextFocusDate: editNextDate || undefined,
      });
      setSessions((prev) =>
        prev.map((s) => s.id === id ? { ...s, nextFocusTime: editNextTime, nextFocusDate: editNextDate } : s)
      );
      setEditingNextId(null);
    } catch (e) {
      console.error("Failed to update next focus", e);
    }
  };

  const handleSaveNotes = async (id: string) => {
    try {
      await api.updateFocusSession({ id, notes: notesDraft });
      setSessions((prev) =>
        prev.map((s) => s.id === id ? { ...s, notes: notesDraft } : s)
      );
      setEditingNotesId(null);
    } catch (e) {
      console.error("Failed to update notes", e);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.saveAiProfile(profileDraft);
      setProfile((prev) => prev ? { ...prev, content: profileDraft } : prev);
      setEditingProfile(false);
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  };

  const openPromptModal = async () => {
    try {
      const data = await api.getAiPrompt();
      setPromptContent(data.content);
      setPromptDraft(data.content);
    } catch {
      setPromptContent("");
      setPromptDraft("");
    }
    setShowPromptModal(true);
  };

  const handleSavePrompt = async () => {
    setPromptSaving(true);
    try {
      await api.saveAiPrompt(promptDraft);
      setPromptContent(promptDraft);
      setShowPromptModal(false);
    } catch (e) {
      console.error("Failed to save prompt", e);
    } finally {
      setPromptSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
      </div>
    );
  }

  const completed = sessions.filter((s) => s.status === "completed");

  return (
    <div className="min-h-screen bg-black px-4 py-6 md:px-8 md:py-10" dir="rtl">
      {/* Prompt Editor Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-orange-500" />
                <span className="text-sm font-black text-white tracking-tight">הוראות AIX</span>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <textarea
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                className="w-full bg-zinc-900 text-sm text-zinc-300 font-mono leading-relaxed rounded-lg p-4 outline-none resize-none min-h-[400px] border border-zinc-700 focus:border-orange-500/50"
                dir="rtl"
                placeholder="הזן את הוראות המערכת עבור AIX..."
              />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-700">
                {promptDraft.length} תווים
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={promptSaving}
                  className="px-5 py-2 bg-orange-500 text-black text-xs font-black rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50"
                >
                  {promptSaving ? "שומר..." : "שמור"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-black text-white tracking-tight">
            היסטוריית מיקודים
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={openPromptModal}
              className="text-zinc-700 hover:text-orange-500 transition-colors"
              title="הוראות AIX"
            >
              <Settings2 size={18} />
            </button>
            <span className="text-xs font-mono text-zinc-600">
              {completed.length} מיקודים
            </span>
          </div>
        </div>

        {/* AI Profile Card */}
        <button
          onClick={() => {
            setShowProfile(!showProfile);
            if (!showProfile && profile) {
              setProfileDraft(profile.content);
            }
            setEditingProfile(false);
          }}
          className="w-full mb-8 border border-zinc-800 rounded-xl p-4 text-right hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-orange-500" />
              <span className="text-sm font-mono text-orange-400">הפרופיל הפנימי של AIX</span>
            </div>
            {showProfile ? (
              <ChevronUp size={14} className="text-zinc-600" />
            ) : (
              <ChevronDown size={14} className="text-zinc-600" />
            )}
          </div>
          {profile?.updatedAt && (
            <p className="text-[10px] font-mono text-zinc-700 mt-1">
              עדכון אחרון: {new Date(profile.updatedAt).toLocaleDateString("he-IL")}
            </p>
          )}
        </button>

        {showProfile && profile && (
          <div className="mb-8 border border-zinc-800 rounded-xl p-4 -mt-4">
            {editingProfile ? (
              <div className="space-y-3">
                <textarea
                  value={profileDraft}
                  onChange={(e) => setProfileDraft(e.target.value)}
                  className="w-full bg-zinc-900 text-sm text-zinc-300 font-mono leading-relaxed rounded-lg p-3 outline-none resize-none min-h-[200px] border border-zinc-700 focus:border-orange-500/50"
                  dir="rtl"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-3 py-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-3 py-1.5 text-xs font-mono text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                  {profile.content || "טרם נבנה פרופיל. הפרופיל ייבנה אוטומטית עם סיום המיקוד הראשון."}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileDraft(profile.content);
                    setEditingProfile(true);
                  }}
                  className="mt-3 flex items-center gap-1 text-[10px] font-mono text-zinc-600 hover:text-orange-500 transition-colors"
                >
                  <Pencil size={10} />
                  עריכה
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sessions list */}
        {completed.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm font-mono text-zinc-700">אין עדיין מיקודים שהושלמו</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((session) => {
              const isExpanded = expandedId === session.id;
              const isDeleting = deleteConfirm === session.id;

              return (
                <div
                  key={session.id}
                  className="border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
                >
                  {/* Session header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    className="w-full p-4 text-right"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <span className="text-xs font-black text-orange-500">
                            {session.sessionNumber}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-mono text-zinc-300">
                            {session.dateString}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-600">
                            {session.startTime} — {session.endTime || "?"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.aiSummary && (
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500/60" title="יש משוב AIX" />
                        )}
                        {isExpanded ? (
                          <ChevronUp size={14} className="text-zinc-600" />
                        ) : (
                          <ChevronDown size={14} className="text-zinc-600" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Editable times */}
                      <div className="flex items-center gap-2">
                        {editingTimeId === session.id ? (
                          <>
                            <input
                              type="time"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                              className="text-[10px] font-mono text-orange-400 bg-orange-500/10 outline-none px-1.5 py-1 rounded w-[3.5rem]"
                            />
                            <span className="text-[10px] text-zinc-700">—</span>
                            <input
                              type="time"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                              className="text-[10px] font-mono text-orange-400 bg-orange-500/10 outline-none px-1.5 py-1 rounded w-[3.5rem]"
                            />
                            <button
                              onClick={() => handleSaveTimes(session.id)}
                              className="text-orange-500 hover:text-orange-400 transition-colors"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setEditingTimeId(null)}
                              className="text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] font-mono text-zinc-600">
                              {session.startTime} — {session.endTime || "?"}
                            </span>
                            <button
                              onClick={() => {
                                setEditStart(session.startTime);
                                setEditEnd(session.endTime || "");
                                setEditingTimeId(session.id);
                              }}
                              className="text-zinc-700 hover:text-zinc-500 transition-colors"
                            >
                              <Pencil size={9} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] font-mono text-zinc-600">הערות</p>
                          {editingNotesId !== session.id && (
                            <button
                              onClick={() => {
                                setNotesDraft(session.notes || "");
                                setEditingNotesId(session.id);
                              }}
                              className="text-zinc-700 hover:text-zinc-500 transition-colors"
                            >
                              <Pencil size={9} />
                            </button>
                          )}
                        </div>
                        {editingNotesId === session.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={notesDraft}
                              onChange={(e) => setNotesDraft(e.target.value)}
                              className="w-full bg-zinc-900 text-sm text-zinc-300 leading-relaxed rounded-lg p-3 outline-none resize-none min-h-[120px] border border-zinc-700 focus:border-orange-500/50"
                              dir="rtl"
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="text-zinc-600 hover:text-zinc-400 transition-colors"
                              >
                                <X size={14} />
                              </button>
                              <button
                                onClick={() => handleSaveNotes(session.id)}
                                className="text-orange-500 hover:text-orange-400 transition-colors"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                            {session.notes || <span className="text-zinc-700 italic">אין הערות</span>}
                          </p>
                        )}
                      </div>

                      {/* AI Summary */}
                      {session.aiSummary && (
                        <div className="border-t border-zinc-800/50 pt-3">
                          <p className="text-[10px] font-mono text-orange-500/60 mb-1">משוב AIX</p>
                          <div className="space-y-2">
                            {session.aiSummary.split("\n\n").map((block, i) => (
                              <p key={i} className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                                {renderMarkdown(block)}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Affirmation */}
                      {session.aiAffirmation && (
                        <p className="text-sm text-orange-400 font-medium text-center">
                          {renderMarkdown(session.aiAffirmation)}
                        </p>
                      )}

                      {/* Next session plan */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-600">מיקוד הבא:</span>
                          {editingNextId === session.id ? (
                            <>
                              <input
                                type="time"
                                value={editNextTime}
                                onChange={(e) => setEditNextTime(e.target.value)}
                                className="text-[10px] font-mono text-orange-400 bg-orange-500/10 outline-none px-1.5 py-1 rounded w-[3.5rem]"
                              />
                              <input
                                type="date"
                                value={editNextDate}
                                onChange={(e) => setEditNextDate(e.target.value)}
                                className="text-[10px] font-mono text-orange-400 bg-orange-500/10 outline-none px-1.5 py-1 rounded"
                              />
                              <button
                                onClick={() => handleSaveNext(session.id)}
                                className="text-orange-500 hover:text-orange-400 transition-colors"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingNextId(null)}
                                className="text-zinc-600 hover:text-zinc-400 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] font-mono text-zinc-400">
                                {session.nextFocusTime || "לא נקבע"}
                              </span>
                              {session.nextFocusDate && session.nextFocusDate !== session.dateString && (
                                <span className="text-[10px] font-mono text-zinc-600">({session.nextFocusDate})</span>
                              )}
                              <button
                                onClick={() => {
                                  setEditNextTime(session.nextFocusTime || "");
                                  setEditNextDate(session.nextFocusDate || session.dateString);
                                  setEditingNextId(session.id);
                                }}
                                className="text-zinc-700 hover:text-zinc-500 transition-colors"
                              >
                                <Pencil size={9} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Delete */}
                      <div className="flex justify-end pt-2 border-t border-zinc-800/50">
                        {isDeleting ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-red-400">למחוק?</span>
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="text-[10px] font-mono text-red-500 hover:text-red-400 px-2 py-1"
                            >
                              כן
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 px-2 py-1"
                            >
                              לא
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(session.id)}
                            className="text-zinc-700 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
