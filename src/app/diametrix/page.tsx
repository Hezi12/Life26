"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  BookOpen,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Check,
  X,
  HandMetal,
  FileText,
  Wrench,
  Search,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiametrixMeeting, DiametrixError } from "@/lib/types";
import { api } from "@/lib/api";

// ─── Protocol Rules (static) ────────────────────────────────────────────────
const PROTOCOL_RULES = [
  {
    number: 1,
    title: "עליונות הפקודה הכתובה",
    icon: FileText,
    color: "#3b82f6",
    content:
      'כל פעולה בחשבון המסחר תבוצע אך ורק על פי החלטה כתובה ומתועדת מראש ביומן ההחלטות. אין לקבל החלטות אסטרטגיות או לבצע שינויים בפרמטרים בזמן שהמסחר חי; כל שינוי מחייב "ישיבת מנהל" ותיעוד התאריך והרציונל לפני הביצוע.',
  },
  {
    number: 2,
    title: "וטו מוחלט: HANDS-OFF",
    icon: HandMetal,
    color: "#ef4444",
    content:
      "חל איסור מוחלט, סופי וגורף על ביצוע פעולות קנייה או מכירה ידניות מכל סוג. יוצא מן הכלל: מקרים בהם האסטרטגיה החמיצה כניסה והמחיר הנוכחי אטרקטיבי יותר.",
  },
  {
    number: 3,
    title: "מענה לחריגות טכניות",
    icon: Wrench,
    color: "#f59e0b",
    content:
      'התערבות ידנית מותרת אך ורק במקרה של שגיאה טכנית המחייבת פעולה מיידית להחזרת החשבון למצב הנכון. מטרת ההתערבות: יישור קו עם מצב האסטרטגיה הנדרש או הבאת החשבון למצב "נקי" (Flat).',
  },
  {
    number: 4,
    title: "תחקור ותיקון שורש",
    icon: Search,
    color: "#a855f7",
    content:
      "כל שגיאה טכנית שהצריכה התערבות ידנית מחייבת רישום מיידי בתיעוד השגיאות, כולל פירוט המקרה והפעולה שננקטה. חובה לבצע תחקיר עומק ולתקן את הכשל בבסיסו.",
  },
];

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

type ActiveTab = "protocol" | "meetings" | "errors";

export default function DiametrixPage() {
  const [meetings, setMeetings] = useState<DiametrixMeeting[]>([]);
  const [errors, setErrors] = useState<DiametrixError[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("meetings");
  const [expandedProtocol, setExpandedProtocol] = useState(false);

  // Meeting form state
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<DiametrixMeeting | null>(null);
  const [mDate, setMDate] = useState("");
  const [mTime, setMTime] = useState("");
  const [mBackground, setMBackground] = useState("");
  const [mDecisions, setMDecisions] = useState<string[]>([""]);
  const [mAllocations, setMAllocations] = useState<{ strategy: string; contracts: string }[]>([]);
  const [mSummary, setMSummary] = useState("");
  const [mNextNote, setMNextNote] = useState("");

  // Error form state
  const [showErrorForm, setShowErrorForm] = useState(false);
  const [editingError, setEditingError] = useState<DiametrixError | null>(null);
  const [eDate, setEDate] = useState("");
  const [eTime, setETime] = useState("");
  const [eStrategy, setEStrategy] = useState("");
  const [eErrorType, setEErrorType] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [eRootCause, setERootCause] = useState("");
  const [eFix, setEFix] = useState("");
  const [eStatus, setEStatus] = useState<"open" | "resolved">("open");

  // Expanded cards
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meetingsData, errorsData] = await Promise.all([
          api.getDiametrixMeetings(),
          api.getDiametrixErrors(),
        ]);
        if (meetingsData) setMeetings(meetingsData);
        if (errorsData) setErrors(errorsData);
      } catch (e) {
        console.error("Failed to load diametrix data", e);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  const sortedMeetings = useMemo(
    () => [...meetings].sort((a, b) => b.meetingNumber - a.meetingNumber),
    [meetings]
  );

  const sortedErrors = useMemo(
    () => [...errors].sort((a, b) => b.errorNumber - a.errorNumber),
    [errors]
  );

  const nextMeetingNumber = useMemo(
    () => (meetings.length > 0 ? Math.max(...meetings.map((m) => m.meetingNumber)) + 1 : 1),
    [meetings]
  );

  const nextErrorNumber = useMemo(
    () => (errors.length > 0 ? Math.max(...errors.map((e) => e.errorNumber)) + 1 : 1),
    [errors]
  );

  const openMeetingCount = meetings.length;
  const openErrorCount = errors.filter((e) => e.status === "open").length;
  const resolvedErrorCount = errors.filter((e) => e.status === "resolved").length;

  // ─── Meeting CRUD ─────────────────────────────────────────────────────────
  const resetMeetingForm = () => {
    setShowMeetingForm(false);
    setEditingMeeting(null);
    setMDate("");
    setMTime("");
    setMBackground("");
    setMDecisions([""]);
    setMAllocations([]);
    setMSummary("");
    setMNextNote("");
  };

  const openNewMeeting = () => {
    resetMeetingForm();
    const now = new Date();
    setMDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
    setMTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setShowMeetingForm(true);
  };

  const openEditMeeting = (meeting: DiametrixMeeting) => {
    setEditingMeeting(meeting);
    setMDate(meeting.date);
    setMTime(meeting.time);
    setMBackground(meeting.background);
    setMDecisions(meeting.decisions.length > 0 ? meeting.decisions : [""]);
    setMAllocations(meeting.allocations);
    setMSummary(meeting.summary);
    setMNextNote(meeting.nextMeetingNote);
    setShowMeetingForm(true);
  };

  const saveMeeting = async () => {
    const dateObj = new Date(mDate);
    const dayName = DAYS_HE[dateObj.getDay()];
    const filteredDecisions = mDecisions.filter((d) => d.trim());

    const meeting: DiametrixMeeting = {
      id: editingMeeting?.id || `dm-${Date.now()}`,
      meetingNumber: editingMeeting?.meetingNumber || nextMeetingNumber,
      date: mDate,
      day: dayName,
      time: mTime,
      background: mBackground,
      decisions: filteredDecisions,
      allocations: mAllocations.filter((a) => a.strategy.trim()),
      summary: mSummary,
      nextMeetingNote: mNextNote,
    };

    try {
      await api.saveDiametrixMeeting(meeting);
      const updated = await api.getDiametrixMeetings();
      setMeetings(updated);
    } catch (e) {
      console.error("Failed to save meeting", e);
    }
    resetMeetingForm();
  };

  const deleteMeeting = async (id: string) => {
    try {
      await api.deleteDiametrixMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error("Failed to delete meeting", e);
    }
  };

  // ─── Error CRUD ───────────────────────────────────────────────────────────
  const resetErrorForm = () => {
    setShowErrorForm(false);
    setEditingError(null);
    setEDate("");
    setETime("");
    setEStrategy("");
    setEErrorType("");
    setEDescription("");
    setERootCause("");
    setEFix("");
    setEStatus("open");
  };

  const openNewError = () => {
    resetErrorForm();
    const now = new Date();
    setEDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    );
    setETime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setShowErrorForm(true);
  };

  const openEditError = (error: DiametrixError) => {
    setEditingError(error);
    setEDate(error.date);
    setETime(error.time);
    setEStrategy(error.strategy);
    setEErrorType(error.errorType);
    setEDescription(error.description);
    setERootCause(error.rootCause);
    setEFix(error.fix);
    setEStatus(error.status as "open" | "resolved");
    setShowErrorForm(true);
  };

  const saveError = async () => {
    const err: DiametrixError = {
      id: editingError?.id || `de-${Date.now()}`,
      errorNumber: editingError?.errorNumber || nextErrorNumber,
      date: eDate,
      time: eTime,
      strategy: eStrategy,
      errorType: eErrorType,
      description: eDescription,
      rootCause: eRootCause,
      fix: eFix,
      status: eStatus,
    };

    try {
      await api.saveDiametrixError(err);
      const updated = await api.getDiametrixErrors();
      setErrors(updated);
    } catch (e) {
      console.error("Failed to save error", e);
    }
    resetErrorForm();
  };

  const deleteError = async (id: string) => {
    try {
      await api.deleteDiametrixError(id);
      setErrors((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      console.error("Failed to delete error", e);
    }
  };

  const toggleErrorStatus = async (error: DiametrixError) => {
    const newStatus = error.status === "open" ? "resolved" : "open";
    const updated = { ...error, status: newStatus };
    try {
      await api.saveDiametrixError(updated as DiametrixError);
      setErrors((prev) => prev.map((e) => (e.id === error.id ? (updated as DiametrixError) : e)));
    } catch (e) {
      console.error("Failed to toggle error status", e);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="h-screen bg-black text-white font-mono flex flex-col overflow-hidden pt-safe" dir="rtl">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 border-b border-zinc-900/80 flex justify-between items-center shrink-0 bg-black z-20">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]" />
          <h1 className="text-sm sm:text-base font-black italic tracking-tighter uppercase text-zinc-200">
            DIAMETRIX
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BookOpen size={12} className="text-cyan-500" />
            <span className="text-[10px] font-bold text-zinc-500 tabular-nums">{openMeetingCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className={openErrorCount > 0 ? "text-amber-500" : "text-zinc-700"} />
            <span
              className={cn(
                "text-[10px] font-bold tabular-nums",
                openErrorCount > 0 ? "text-amber-500" : "text-zinc-600"
              )}
            >
              {openErrorCount}
            </span>
          </div>
          {resolvedErrorCount > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 tabular-nums">{resolvedErrorCount}</span>
            </div>
          )}
        </div>
      </header>

      {/* Protocol Banner (collapsible) */}
      <button
        onClick={() => setExpandedProtocol(!expandedProtocol)}
        className="px-4 sm:px-6 py-2.5 border-b border-zinc-900/50 flex items-center justify-between shrink-0 hover:bg-zinc-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield size={13} className="text-cyan-500/70" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-600/80">
            פרוטוקול הפרדת רשויות
          </span>
        </div>
        {expandedProtocol ? (
          <ChevronUp size={13} className="text-zinc-600" />
        ) : (
          <ChevronDown size={13} className="text-zinc-600" />
        )}
      </button>

      {expandedProtocol && (
        <div className="px-4 sm:px-6 py-4 border-b border-zinc-900/50 shrink-0 space-y-3 bg-zinc-950/50 overflow-y-auto max-h-[40vh]">
          {PROTOCOL_RULES.map((rule) => {
            const Icon = rule.icon;
            return (
              <div key={rule.number} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${rule.color}12` }}
                >
                  <Icon size={15} style={{ color: rule.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] font-black uppercase tracking-widest"
                      style={{ color: rule.color }}
                    >
                      §{rule.number}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-300">{rule.title}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-500 leading-relaxed">{rule.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Bar */}
      <div className="px-4 sm:px-6 py-2 border-b border-zinc-900/50 flex gap-1 shrink-0">
        {(
          [
            { key: "meetings" as ActiveTab, label: "יומן החלטות", icon: BookOpen },
            { key: "errors" as ActiveTab, label: "תיעוד שגיאות", icon: AlertTriangle },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 transition-all",
                activeTab === tab.key
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                  : "text-zinc-600 hover:text-zinc-400 border border-transparent"
              )}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <section className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-4">
        {/* ─── MEETINGS TAB ────────────────────────────────────────────────── */}
        {activeTab === "meetings" && (
          <div className="space-y-3">
            {/* Add button */}
            <button
              onClick={openNewMeeting}
              className="w-full border border-dashed border-cyan-500/20 rounded-lg py-3 flex items-center justify-center gap-2 text-cyan-600/60 hover:text-cyan-500 hover:border-cyan-500/40 transition-all"
            >
              <Plus size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">ישיבה חדשה</span>
            </button>

            {/* Meeting Form */}
            {showMeetingForm && (
              <div className="border border-cyan-500/20 rounded-lg p-4 bg-cyan-500/[0.02] space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={14} className="text-cyan-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">
                    {editingMeeting ? `עריכת ישיבה ${editingMeeting.meetingNumber}` : `ישיבה ${nextMeetingNumber}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">תאריך</label>
                    <input
                      type="date"
                      value={mDate}
                      onChange={(e) => setMDate(e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-cyan-500/40 text-xs text-zinc-300 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">שעה</label>
                    <input
                      type="time"
                      value={mTime}
                      onChange={(e) => setMTime(e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-cyan-500/40 text-xs text-zinc-300 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">רקע</label>
                  <textarea
                    value={mBackground}
                    onChange={(e) => setMBackground(e.target.value)}
                    rows={2}
                    placeholder="יתרת חשבון, מצב שוק, הקשר..."
                    className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-cyan-500/40 text-xs text-zinc-300 transition-all placeholder:opacity-20 resize-none leading-relaxed"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">החלטות</label>
                  {mDecisions.map((decision, i) => (
                    <div key={i} className="flex gap-2 mb-1.5">
                      <span className="text-[10px] text-cyan-600 font-bold mt-2 shrink-0">{i + 1}.</span>
                      <input
                        type="text"
                        value={decision}
                        onChange={(e) => {
                          const updated = [...mDecisions];
                          updated[i] = e.target.value;
                          setMDecisions(updated);
                        }}
                        placeholder="החלטה..."
                        className="flex-1 bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-cyan-500/40 text-xs text-zinc-300 transition-all placeholder:opacity-20"
                        dir="rtl"
                      />
                      {mDecisions.length > 1 && (
                        <button
                          onClick={() => setMDecisions(mDecisions.filter((_, idx) => idx !== i))}
                          className="text-zinc-700 hover:text-red-500 transition-colors p-1"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setMDecisions([...mDecisions, ""])}
                    className="text-[9px] text-cyan-600/50 hover:text-cyan-500 font-bold mt-1 transition-colors"
                  >
                    + החלטה נוספת
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[8px] text-zinc-600 uppercase tracking-widest">הקצאת חוזים</label>
                    <button
                      onClick={() => setMAllocations([...mAllocations, { strategy: "", contracts: "" }])}
                      className="text-[9px] text-cyan-600/50 hover:text-cyan-500 font-bold transition-colors"
                    >
                      + הקצאה
                    </button>
                  </div>
                  {mAllocations.map((alloc, i) => (
                    <div key={i} className="flex gap-2 mb-1.5">
                      <input
                        type="text"
                        value={alloc.strategy}
                        onChange={(e) => {
                          const updated = [...mAllocations];
                          updated[i] = { ...updated[i], strategy: e.target.value };
                          setMAllocations(updated);
                        }}
                        placeholder="אסטרטגיה..."
                        className="flex-1 bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-cyan-500/40 text-[10px] text-zinc-300 transition-all placeholder:opacity-20 font-mono"
                      />
                      <input
                        type="text"
                        value={alloc.contracts}
                        onChange={(e) => {
                          const updated = [...mAllocations];
                          updated[i] = { ...updated[i], contracts: e.target.value };
                          setMAllocations(updated);
                        }}
                        placeholder="חוזים..."
                        className="w-24 bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-cyan-500/40 text-[10px] text-zinc-300 transition-all placeholder:opacity-20 font-mono"
                      />
                      <button
                        onClick={() => setMAllocations(mAllocations.filter((_, idx) => idx !== i))}
                        className="text-zinc-700 hover:text-red-500 transition-colors p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">סיכום</label>
                  <textarea
                    value={mSummary}
                    onChange={(e) => setMSummary(e.target.value)}
                    rows={2}
                    placeholder="סיכום ההחלטה..."
                    className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-cyan-500/40 text-xs text-zinc-300 transition-all placeholder:opacity-20 resize-none leading-relaxed"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">
                    הערה לישיבה הבאה
                  </label>
                  <input
                    type="text"
                    value={mNextNote}
                    onChange={(e) => setMNextNote(e.target.value)}
                    placeholder="מועד / נושא לישיבה הבאה..."
                    className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-cyan-500/40 text-xs text-zinc-300 transition-all placeholder:opacity-20"
                    dir="rtl"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveMeeting}
                    disabled={!mDate || !mTime}
                    className="flex-1 py-2 bg-cyan-500 text-black rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-30"
                  >
                    שמור
                  </button>
                  <button
                    onClick={resetMeetingForm}
                    className="px-5 py-2 border border-zinc-800 text-zinc-500 rounded-sm text-[9px] font-black uppercase tracking-widest hover:border-zinc-600 transition-all"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* Meeting Cards */}
            {sortedMeetings.map((meeting) => {
              const isExpanded = expandedMeeting === meeting.id;
              return (
                <div
                  key={meeting.id}
                  className="border border-zinc-800/50 rounded-lg overflow-hidden bg-zinc-900/20 transition-all"
                >
                  <div className="h-[1.5px] bg-cyan-500/30" />
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <span className="text-[11px] font-black text-cyan-500">{meeting.meetingNumber}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-cyan-600 uppercase tracking-widest">
                            ישיבה {meeting.meetingNumber}
                          </span>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {meeting.date.split("-").reverse().join("/")} · יום {meeting.day} · {meeting.time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpandedMeeting(isExpanded ? null : meeting.id)}
                          className="text-zinc-700 hover:text-zinc-400 transition-colors p-1"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button
                          onClick={() => openEditMeeting(meeting)}
                          className="text-zinc-800 hover:text-cyan-500 transition-colors p-1"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => deleteMeeting(meeting.id)}
                          className="text-zinc-800 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Summary always visible */}
                    {meeting.summary && !isExpanded && (
                      <p className="text-[10px] text-zinc-500 mt-2 mr-11 line-clamp-2 leading-relaxed">
                        {meeting.summary}
                      </p>
                    )}

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-3 mr-11 space-y-3">
                        {meeting.background && (
                          <div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">רקע</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{meeting.background}</p>
                          </div>
                        )}

                        {meeting.decisions.length > 0 && (
                          <div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                              החלטות
                            </span>
                            <div className="mt-1 space-y-1">
                              {meeting.decisions.map((d, i) => (
                                <div key={i} className="flex gap-2">
                                  <span className="text-[10px] text-cyan-600 font-bold shrink-0">{i + 1}.</span>
                                  <span className="text-[11px] text-zinc-400 leading-relaxed">{d}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {meeting.allocations.length > 0 && (
                          <div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                              הקצאת חוזים
                            </span>
                            <div className="mt-1 grid gap-1">
                              {meeting.allocations.map((a, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between bg-black/50 px-3 py-1.5 rounded-sm border border-zinc-800/30"
                                >
                                  <span className="text-[10px] text-cyan-400 font-mono font-bold">{a.strategy}</span>
                                  <span className="text-[10px] text-zinc-400 font-mono">{a.contracts}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {meeting.summary && (
                          <div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">סיכום</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{meeting.summary}</p>
                          </div>
                        )}

                        {meeting.nextMeetingNote && (
                          <div className="flex items-center gap-2 bg-cyan-500/[0.04] px-3 py-2 rounded-sm border border-cyan-500/10">
                            <Clock size={11} className="text-cyan-600 shrink-0" />
                            <span className="text-[10px] text-cyan-500/80">{meeting.nextMeetingNote}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedMeetings.length === 0 && !showMeetingForm && (
              <div className="text-center py-12">
                <BookOpen size={24} className="text-zinc-800 mx-auto mb-3" />
                <p className="text-[11px] text-zinc-700">אין ישיבות מתועדות</p>
              </div>
            )}
          </div>
        )}

        {/* ─── ERRORS TAB ──────────────────────────────────────────────────── */}
        {activeTab === "errors" && (
          <div className="space-y-3">
            {/* Add button */}
            <button
              onClick={openNewError}
              className="w-full border border-dashed border-amber-500/20 rounded-lg py-3 flex items-center justify-center gap-2 text-amber-600/60 hover:text-amber-500 hover:border-amber-500/40 transition-all"
            >
              <Plus size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">תקלה חדשה</span>
            </button>

            {/* Error Form */}
            {showErrorForm && (
              <div className="border border-amber-500/20 rounded-lg p-4 bg-amber-500/[0.02] space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    {editingError ? `עריכת תקלה ${editingError.errorNumber}` : `תקלה ${nextErrorNumber}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">תאריך</label>
                    <input
                      type="date"
                      value={eDate}
                      onChange={(e) => setEDate(e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-amber-500/40 text-xs text-zinc-300 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">שעה</label>
                    <input
                      type="time"
                      value={eTime}
                      onChange={(e) => setETime(e.target.value)}
                      className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-amber-500/40 text-xs text-zinc-300 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">אסטרטגיה</label>
                    <input
                      type="text"
                      value={eStrategy}
                      onChange={(e) => setEStrategy(e.target.value)}
                      placeholder="S01_Vol_L..."
                      className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-amber-500/40 text-[10px] text-zinc-300 transition-all placeholder:opacity-20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">סוג תקלה</label>
                    <input
                      type="text"
                      value={eErrorType}
                      onChange={(e) => setEErrorType(e.target.value)}
                      placeholder="שגיאת Stop Loss..."
                      className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-amber-500/40 text-[10px] text-zinc-300 transition-all placeholder:opacity-20"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">תיאור</label>
                  <textarea
                    value={eDescription}
                    onChange={(e) => setEDescription(e.target.value)}
                    rows={2}
                    placeholder="מה קרה..."
                    className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-amber-500/40 text-xs text-zinc-300 transition-all placeholder:opacity-20 resize-none leading-relaxed"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">שורש התקלה</label>
                  <textarea
                    value={eRootCause}
                    onChange={(e) => setERootCause(e.target.value)}
                    rows={2}
                    placeholder="מה גרם לתקלה..."
                    className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-amber-500/40 text-xs text-zinc-300 transition-all placeholder:opacity-20 resize-none leading-relaxed"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">תיקון</label>
                  <textarea
                    value={eFix}
                    onChange={(e) => setEFix(e.target.value)}
                    rows={2}
                    placeholder="מה תוקן / מה צריך לתקן..."
                    className="w-full bg-black border border-zinc-800 p-2 rounded-sm outline-none focus:border-amber-500/40 text-xs text-zinc-300 transition-all placeholder:opacity-20 resize-none leading-relaxed"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">סטטוס</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEStatus("open")}
                      className={cn(
                        "flex-1 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all",
                        eStatus === "open"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                          : "border-zinc-800 text-zinc-600"
                      )}
                    >
                      פתוח
                    </button>
                    <button
                      onClick={() => setEStatus("resolved")}
                      className={cn(
                        "flex-1 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all",
                        eStatus === "resolved"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                          : "border-zinc-800 text-zinc-600"
                      )}
                    >
                      טופל
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveError}
                    disabled={!eDate || !eTime || !eStrategy}
                    className="flex-1 py-2 bg-amber-500 text-black rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-30"
                  >
                    שמור
                  </button>
                  <button
                    onClick={resetErrorForm}
                    className="px-5 py-2 border border-zinc-800 text-zinc-500 rounded-sm text-[9px] font-black uppercase tracking-widest hover:border-zinc-600 transition-all"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {/* Error Cards */}
            {sortedErrors.map((error) => {
              const isExpanded = expandedError === error.id;
              const isResolved = error.status === "resolved";
              return (
                <div
                  key={error.id}
                  className={cn(
                    "border rounded-lg overflow-hidden transition-all",
                    isResolved
                      ? "border-emerald-500/15 bg-emerald-500/[0.02]"
                      : "border-amber-500/15 bg-amber-500/[0.02]"
                  )}
                >
                  <div className={cn("h-[1.5px]", isResolved ? "bg-emerald-500/30" : "bg-amber-500/30")} />
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleErrorStatus(error)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            isResolved ? "bg-emerald-500/10" : "bg-amber-500/10"
                          )}
                          title={isResolved ? "סמן כפתוח" : "סמן כטופל"}
                        >
                          {isResolved ? (
                            <CheckCircle2 size={15} className="text-emerald-500" />
                          ) : (
                            <AlertTriangle size={15} className="text-amber-500" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                isResolved ? "text-emerald-600" : "text-amber-600"
                              )}
                            >
                              תקלה {error.errorNumber}
                            </span>
                            <span className="text-[9px] text-zinc-600 font-mono">{error.strategy}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {error.date.split("-").reverse().join("/")} · {error.time} · {error.errorType}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpandedError(isExpanded ? null : error.id)}
                          className="text-zinc-700 hover:text-zinc-400 transition-colors p-1"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button
                          onClick={() => openEditError(error)}
                          className="text-zinc-800 hover:text-amber-500 transition-colors p-1"
                        >
                          <Edit3 size={11} />
                        </button>
                        <button
                          onClick={() => deleteError(error.id)}
                          className="text-zinc-800 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Description always visible */}
                    {error.description && !isExpanded && (
                      <p className="text-[10px] text-zinc-500 mt-2 mr-11 line-clamp-2 leading-relaxed">
                        {error.description}
                      </p>
                    )}

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-3 mr-11 space-y-2.5">
                        {error.description && (
                          <div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">תיאור</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{error.description}</p>
                          </div>
                        )}
                        {error.rootCause && (
                          <div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                              שורש התקלה
                            </span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{error.rootCause}</p>
                          </div>
                        )}
                        {error.fix && (
                          <div>
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">תיקון</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{error.fix}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedErrors.length === 0 && !showErrorForm && (
              <div className="text-center py-12">
                <CheckCircle2 size={24} className="text-emerald-800 mx-auto mb-3" />
                <p className="text-[11px] text-zinc-700">אין תקלות מתועדות</p>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="pb-20 md:pb-0" />
    </div>
  );
}
