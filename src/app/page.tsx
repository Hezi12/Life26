"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Monitor,
  Clock,
  Activity,
  Volume2,
  X,
  Check,
  Zap,
  Shield,
  BarChart3,
  Target,
  Moon,
  Smartphone,
  Gamepad2,
  Calendar,
  Flame,
} from "lucide-react";
import { cn, timeToMinutes, minutesToTime, calculateDuration } from "@/lib/utils";
import {
  Category,
  Event,
  WorkTopic,
  WorkSubject,
  DailyNotes,
  StickyNotes,
  PomodoroSettings,
  FocusSession,
  Law,
  LawLog,
  DailyMission,
} from "@/lib/types";
import { ICON_MAP, INITIAL_CATEGORIES } from "@/lib/constants";
import { api } from '@/lib/api';
import { playSound, initAudio, SoundType } from "@/lib/audio";

// --- HomePage Component ---
export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workTopics, setWorkTopics] = useState<WorkTopic[]>([]);
  const [workSubjects, setWorkSubjects] = useState<WorkSubject[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNotes | null>(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNotes | null>(null);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workMinutes: 60,
    breakMinutes: 5,
    soundsEnabled: true,
    workSound: "success",
    breakSound: "chime",
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextFocusInfo, setNextFocusInfo] = useState<{ time?: string; date?: string; total?: number } | null>(null);
  const [laws, setLaws] = useState<Law[]>([]);
  const [lawLogs, setLawLogs] = useState<Record<string, LawLog>>({});
  const [todayMission, setTodayMission] = useState<DailyMission | null>(null);
  const [missionStreak, setMissionStreak] = useState(0);

  // Persistent tracker for Pomodoro sounds (defined in parent to survive unmounts)
  const lastActiveCycleRef = useRef<{type: 'work' | 'break', end: number} | null>(null);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newTopicSubjectId, setNewTopicSubjectId] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const dailyNotesRef = useRef<HTMLTextAreaElement>(null);
  const stickyNotesRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);

  const dateString = currentTime.toISOString().split('T')[0];

  // Global click listener to unlock audio and request notification permission
  useEffect(() => {
    const unlock = () => {
      initAudio();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, []);

  // 1. Initial Data Loading
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const loadData = async () => {
      try {
        const [eventsData, categoriesData, topicsData, subjectsData, pomodoroData] = await Promise.all([
          api.getEvents(),
          api.getCategories(),
          api.getWorkTopics(),
          api.getWorkSubjects(),
          api.getPomodoroSettings(),
        ]);
        
        setEvents(eventsData);
        setCategories(categoriesData.length > 0 ? categoriesData : INITIAL_CATEGORIES);
        setWorkTopics(topicsData);
        setWorkSubjects(subjectsData);
        setPomodoroSettings(pomodoroData);

        const dailyNotesData = await api.getDailyNotes(dateString);
        if (dailyNotesData) {
          setDailyNotes(dailyNotesData);
          if (dailyNotesRef.current) {
            dailyNotesRef.current.value = dailyNotesData.content || '';
            requestAnimationFrame(() => {
              if (dailyNotesRef.current) {
                dailyNotesRef.current.scrollTop = dailyNotesRef.current.scrollHeight;
              }
            });
          }
        }

        const stickyNotesData = await api.getStickyNotes();
        if (stickyNotesData) setStickyNotes(stickyNotesData);

        // Load focus next session info
        const focusSessions = await api.getFocusSessions();
        const completedFocus = focusSessions.filter((s: FocusSession) => s.status === 'completed');
        const lastCompleted = completedFocus
          .sort((a: FocusSession, b: FocusSession) => b.sessionNumber - a.sessionNumber)[0];
        if (lastCompleted?.nextFocusTime) {
          setNextFocusInfo({ time: lastCompleted.nextFocusTime, date: lastCompleted.nextFocusDate, total: completedFocus.length });
          // Schedule notification 5 min before next focus via Service Worker
          if ("Notification" in window && Notification.permission === "granted" && navigator.serviceWorker?.controller) {
            const target = new Date(`${lastCompleted.nextFocusDate}T${lastCompleted.nextFocusTime}:00`);
            if (target.getTime() > Date.now()) {
              navigator.serviceWorker.controller.postMessage({
                type: "SCHEDULE_FOCUS_NOTIFICATION",
                time: lastCompleted.nextFocusTime,
                date: lastCompleted.nextFocusDate,
                sessionNumber: lastCompleted.sessionNumber + 1,
              });
            }
          }
        } else {
          setNextFocusInfo({ total: completedFocus.length });
        }

        // Load today's mission
        const allMissions = await api.getMissions();
        if (Array.isArray(allMissions)) {
          const todayM = allMissions.find((m: DailyMission) => m.dateString === dateString);
          if (todayM) setTodayMission(todayM);
          // Calculate streak
          let streak = 0;
          const checkDate = new Date();
          while (true) {
            const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            const m = allMissions.find((x: DailyMission) => x.dateString === dStr && x.mission);
            if (m) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
            else break;
          }
          setMissionStreak(streak);
        }

        // Load laws
        const [lawsData, logsData] = await Promise.all([
          api.getLaws(),
          api.getLawLogs(),
        ]);
        if (lawsData) setLaws(lawsData);
        if (logsData) {
          const logsMap: Record<string, LawLog> = {};
          logsData.forEach((log: LawLog) => (logsMap[log.id] = log));
          setLawLogs(logsMap);
        }

      } catch (e) {
        console.error("Failed to load dashboard data", e);
        // No fallback - API is required
      }
      
      setIsLoaded(true);
    };

    loadData();
    return () => clearInterval(timer);
  }, [dateString]);

  // 2. Synchronization Logic
  useEffect(() => {
    const handleSync = async (e: CustomEvent) => {
      if (e.detail?.source === 'dashboard-page') return;

      try {
        if (e.detail?.type === 'workTopicsUpdated') {
          const topics = await api.getWorkTopics(dateString);
          setWorkTopics(topics);
        }
        
        if (e.detail?.type === 'notes-updated') {
          const dailyNotesData = await api.getDailyNotes(dateString);
          if (dailyNotesData) {
            setDailyNotes(dailyNotesData);
            if (dailyNotesRef.current && !isTypingRef.current) {
              dailyNotesRef.current.value = dailyNotesData.content || '';
            }
          }
          const stickyNotesData = await api.getStickyNotes();
          if (stickyNotesData) {
            setStickyNotes(stickyNotesData);
            if (stickyNotesRef.current && !isTypingRef.current) {
              stickyNotesRef.current.value = stickyNotesData.content || '';
            }
          }
        }

        const eventsData = await api.getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Sync failed', error);
      }
    };

    window.addEventListener('life26-update', handleSync as unknown as EventListener);
    
    return () => {
      window.removeEventListener('life26-update', handleSync as unknown as EventListener);
    };
  }, [dateString]);

  // 3. Identify Active Computer Session & Timeline Matrix
  const dailyEvents = useMemo(() => {
    return events.filter(e => e.dateString === dateString).sort((a, b) => a.time.localeCompare(b.time));
  }, [events, dateString]);

  const activeSession = useMemo(() => {
    if (!isLoaded) return null;
    
    // Disable session view on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) return null;

    const computerEvents = dailyEvents.filter(event => {
      const category = categories.find(c => c.id === event.categoryId);
      const titleLower = event.title.toLowerCase();
      return (
        titleLower.includes('מחשב') || 
        titleLower.includes('עבודה') ||
        category?.name === 'עבודה' ||
        category?.id === '9'
      );
    });

    if (computerEvents.length === 0) return null;

    const groupedSessions: { events: Event[], startTime: string, endTime: string }[] = [];
    
    computerEvents.forEach(event => {
      const startMins = timeToMinutes(event.time);
      const nextEventInDay = dailyEvents.find(e => timeToMinutes(e.time) > startMins);
      const endMins = nextEventInDay ? timeToMinutes(nextEventInDay.time) : startMins + 30;

      const lastGroup = groupedSessions[groupedSessions.length - 1];
      if (lastGroup && (startMins - timeToMinutes(lastGroup.endTime)) <= 5) {
        lastGroup.events.push(event);
        lastGroup.endTime = minutesToTime(endMins);
      } else {
        groupedSessions.push({
          events: [event],
          startTime: event.time,
          endTime: minutesToTime(endMins)
        });
      }
    });

    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    return groupedSessions.find(group => {
      const start = timeToMinutes(group.startTime);
      const end = timeToMinutes(group.endTime);
      return nowMins >= start && nowMins < end;
    }) || null;
  }, [dailyEvents, categories, currentTime, isLoaded]);

  // Pomodoro Sound Logic (Global Tracker)
  useEffect(() => {
    if (!isLoaded || !pomodoroSettings.soundsEnabled) return;
    
    // Disable sounds on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const nowSecs = currentTime.getSeconds();
    const totalNowSecs = nowMins * 60 + nowSecs;

    // Check if tracked cycle just ended
    if (lastActiveCycleRef.current) {
      const endSecs = lastActiveCycleRef.current.end * 60;
      if (totalNowSecs >= endSecs) {
        const type = lastActiveCycleRef.current.type;
        const msg = type === 'work' ? 'זמן הפסקה!' : 'חוזרים לעבודה!';
        const sound = type === 'work' ? (pomodoroSettings.workSound || 'success') : (pomodoroSettings.breakSound || 'chime');
        
        playSound(sound as SoundType, 0.3, 'Pomodoro', msg);
        lastActiveCycleRef.current = null;
      }
    }

    // Update tracker if we are in a session
    if (activeSession) {
      const startMins = timeToMinutes(activeSession.startTime);
      const endMins = timeToMinutes(activeSession.endTime);
      
      const workMinutes = pomodoroSettings.workMinutes;
      const breakMinutes = pomodoroSettings.breakMinutes;
      
      // Calculate current cycle (redundant but necessary for global tracking)
      let currentPos = startMins;
      let currentCycle = null;

      while (currentPos < endMins) {
        const remainingTotal = endMins - currentPos;
        let currentWorkDuration = workMinutes;
        if (remainingTotal - workMinutes < 35) currentWorkDuration = remainingTotal;
        
        // Work
        if (nowMins >= currentPos && nowMins < currentPos + currentWorkDuration) {
          currentCycle = { type: 'work', end: currentPos + currentWorkDuration };
          break;
        }
        currentPos += currentWorkDuration;

        // Break
        if (currentPos < endMins) {
          const actualBreak = Math.min(breakMinutes, endMins - currentPos);
          if (nowMins >= currentPos && nowMins < currentPos + actualBreak) {
            currentCycle = { type: 'break', end: currentPos + actualBreak };
            break;
          }
          currentPos += breakMinutes;
        }
      }

      if (currentCycle) {
        lastActiveCycleRef.current = currentCycle as {type: 'work' | 'break', end: number};
      }
    }
  }, [currentTime, activeSession, pomodoroSettings, isLoaded]);

  const timelineData = useMemo(() => {
    if (!isLoaded) return { current: null, upcoming: [] };
    
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Find current event
    let currentIdx = -1;
    const processedEvents = dailyEvents.map((event, idx) => {
      const startMins = timeToMinutes(event.time);
      const nextEvent = dailyEvents[idx + 1];
      const endMins = nextEvent ? timeToMinutes(nextEvent.time) : startMins + 60;
      
      const isCurrent = nowMins >= startMins && nowMins < endMins;
      if (isCurrent) currentIdx = idx;
      
      return { ...event, endMins, startMins };
    });

    const current = currentIdx !== -1 ? processedEvents[currentIdx] : null;
    const upcoming = processedEvents.slice(currentIdx !== -1 ? currentIdx + 1 : 0).slice(0, 3);

    return { current, upcoming };
  }, [dailyEvents, currentTime, isLoaded]);

  // 4. Load Data for Active Session
  const sessionTopics = useMemo(() => {
    if (!activeSession) return [];
    const eventIds = activeSession.events.map(e => e.id);
    return workTopics
      .filter(t => eventIds.includes(t.eventId) && t.dateString === dateString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activeSession, workTopics, dateString]);

  const currentTopic = useMemo(() => {
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    return sessionTopics.find(t => {
      const start = timeToMinutes(t.startTime);
      const end = timeToMinutes(t.endTime);
      return nowMins >= start && nowMins < end;
    });
  }, [sessionTopics, currentTime]);

  // 5. Handlers for sync
  const handleTopicsUpdate = async () => {
    try {
      const topics = await api.getWorkTopics(dateString);
      setWorkTopics(topics);
      window.dispatchEvent(new CustomEvent('life26-update', { 
        detail: { type: 'workTopicsUpdated', source: 'dashboard-page' } 
      }));
    } catch (error) {
      console.error('Failed to update topics', error);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopicSubjectId || !newStartTime || !newEndTime || !activeSession) return;
    const now = new Date();

    const newTopic: WorkTopic = {
      id: `topic-${Date.now()}`,
      eventId: activeSession.events?.[0]?.id || 'manual',
      subjectId: newTopicSubjectId,
      startTime: newStartTime,
      endTime: newEndTime,
      durationMinutes: calculateDuration(newStartTime, newEndTime),
      dateString: now.toISOString().split('T')[0]
    };

    try {
      await api.saveWorkTopic(newTopic);
      await handleTopicsUpdate();
      setIsConfigOpen(false);
    } catch (error) {
      console.error('Failed to save topic', error);
    }
  };

  // Initialize config values when opening
  useEffect(() => {
    if (isConfigOpen && workSubjects.length > 0) {
      if (!newTopicSubjectId) setNewTopicSubjectId(workSubjects[0].id);
      
      const lastTopic = sessionTopics[sessionTopics.length - 1];
      const start = lastTopic ? lastTopic.endTime : activeSession?.startTime || '09:00';
      const [h, m] = start.split(':').map(Number);
      const end = minutesToTime(h * 60 + m + 30);
      
      setNewStartTime(start);
      setNewEndTime(end);
    }
  }, [isConfigOpen, workSubjects, sessionTopics, activeSession]);

  const saveDailyNotes = useCallback(async () => {
    if (typeof window === 'undefined' || isTypingRef.current) return;
    
    const content = dailyNotesRef.current?.value || '';
    const notes: DailyNotes = {
      id: dailyNotes?.id || `notes-${dateString}`,
      dateString,
      content,
    };

    try {
      await api.saveDailyNotes(notes);
      setDailyNotes(notes);
      window.dispatchEvent(new CustomEvent('life26-update', { 
        detail: { type: 'notes-updated', source: 'dashboard-page' } 
      }));
    } catch (error) {
      console.error('Failed to save daily notes', error);
    }
  }, [dateString, dailyNotes]);

  const saveStickyNotes = useCallback(async () => {
    if (typeof window === 'undefined' || isTypingRef.current) return;
    
    const content = stickyNotesRef.current?.value || '';
    const notes: StickyNotes = {
      id: stickyNotes?.id || 'sticky-1',
      content,
    };

    try {
      await api.saveStickyNotes(notes);
      setStickyNotes(notes);
      window.dispatchEvent(new CustomEvent('life26-update', { 
        detail: { type: 'notes-updated', source: 'dashboard-page' } 
      }));
    } catch (error) {
      console.error('Failed to save sticky notes', error);
    }
  }, [stickyNotes]);

  const todayString = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const activeLaws = useMemo(() => {
    return laws.filter((l) => l.isActive).sort((a, b) => a.position - b.position);
  }, [laws]);

  const toggleLawLog = async (lawId: string, toKept: boolean) => {
    const logId = `${lawId}-${todayString}`;
    const newLogs = { ...lawLogs };
    const existing = newLogs[logId];

    if (existing && existing.kept === toKept) {
      delete newLogs[logId];
      setLawLogs(newLogs);
      await api.saveLawLog({ id: logId, lawId, dateString: todayString, kept: false });
    } else {
      newLogs[logId] = { id: logId, lawId, dateString: todayString, kept: toKept };
      setLawLogs(newLogs);
      await api.saveLawLog(newLogs[logId]);
    }
  };

  const LAW_ICONS = [Moon, Smartphone, Gamepad2];
  const LAW_COLORS = ["#3b82f6", "#a855f7", "#ef4444"];

  const birthDate = useMemo(() => new Date(1993, 4, 12), []);
  const weeksExpired = useMemo(() => {
    return Math.floor((currentTime.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
  }, [currentTime, birthDate]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-black text-white font-mono selection:bg-orange-500/30 selection:text-white pt-safe" dir="rtl">
      {!activeSession ? (
        <div className="flex-1 bg-black flex flex-col overflow-auto pb-32 pt-safe" dir="rtl">
          {/* Background */}
          <div className="fixed inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

          {/* Mobile Dashboard (no Life Matrix, no top row) */}
          <div className="md:hidden max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-4 animate-in fade-in duration-700 relative z-10">

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="border border-zinc-800/50 rounded-xl p-3 bg-zinc-900/20">
                <Target size={12} className="text-orange-500 mb-1.5" />
                <div className="text-lg font-black italic text-orange-500 leading-none">{nextFocusInfo?.total || 0}</div>
                <div className="text-[8px] text-zinc-600 uppercase tracking-wider mt-1">מיקודים</div>
              </div>
              <div className="border border-zinc-800/50 rounded-xl p-3 bg-zinc-900/20">
                <Flame size={12} className="text-[#00d4ff] mb-1.5" />
                <div className="text-lg font-black italic text-[#00d4ff] leading-none">{missionStreak}D</div>
                <div className="text-[8px] text-zinc-600 uppercase tracking-wider mt-1">רצף</div>
              </div>
              <div className="border border-zinc-800/50 rounded-xl p-3 bg-zinc-900/20">
                <Shield size={12} className="text-emerald-400 mb-1.5" />
                <div className="text-lg font-black italic text-emerald-400 leading-none">
                  {activeLaws.filter(l => lawLogs[`${l.id}-${todayString}`]?.kept === true).length}/{activeLaws.length}
                </div>
                <div className="text-[8px] text-zinc-600 uppercase tracking-wider mt-1">חוקים</div>
              </div>
              <div className="border border-zinc-800/50 rounded-xl p-3 bg-zinc-900/20">
                <Calendar size={12} className="text-purple-400 mb-1.5" />
                <div className="text-lg font-black italic text-purple-400 leading-none">{dailyEvents.length}</div>
                <div className="text-[8px] text-zinc-600 uppercase tracking-wider mt-1">אירועים</div>
              </div>
            </div>

            {/* Today's Mission */}
            <div className="border border-zinc-800/50 rounded-xl p-4 bg-zinc-900/10 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={13} className="text-[#00d4ff]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Mission</span>
              </div>
              {todayMission?.mission ? (
                <div className="text-sm font-bold text-white leading-relaxed">{todayMission.mission}</div>
              ) : (
                <div className="text-xs text-zinc-700 italic">לא הוגדרה משימה להיום</div>
              )}
            </div>

            {/* Next Focus + Laws Row */}
            <div className="grid grid-cols-1 gap-3">
              {/* Next Focus */}
              <div className="border border-zinc-800/50 rounded-xl p-4 bg-zinc-900/10">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={13} className="text-orange-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Next Focus</span>
                </div>
                {nextFocusInfo?.time ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white tabular-nums">{nextFocusInfo.time}</span>
                    {nextFocusInfo.date && nextFocusInfo.date !== todayString && (
                      <span className="text-xs text-zinc-600 font-mono">מחר</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-zinc-700">לא נקבע</span>
                )}
              </div>

              {/* Laws Quick Toggle */}
              <div className="border border-zinc-800/50 rounded-xl p-4 bg-zinc-900/10">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={13} className="text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">3 Laws</span>
                </div>
                <div className="flex items-center gap-3">
                  {activeLaws.map((law) => {
                    const logId = `${law.id}-${todayString}`;
                    const log = lawLogs[logId];
                    const Icon = LAW_ICONS[law.position - 1] || Shield;
                    const color = LAW_COLORS[law.position - 1] || "#f97316";

                    return (
                      <div key={law.id} className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
                          <Icon size={12} style={{ color }} />
                        </div>
                        <button
                          onClick={() => toggleLawLog(law.id, true)}
                          className={cn(
                            "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                            log?.kept === true
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "border-zinc-800/60 text-zinc-700 hover:border-emerald-500/30"
                          )}
                        >
                          <Check size={11} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => toggleLawLog(law.id, false)}
                          className={cn(
                            "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                            log && log.kept === false
                              ? "bg-red-500/20 border-red-500/40 text-red-400"
                              : "border-zinc-800/60 text-zinc-700 hover:border-red-500/30"
                          )}
                        >
                          <X size={11} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Today's Timeline */}
            {dailyEvents.length > 0 && (
              <div className="border border-zinc-800/50 rounded-xl p-4 bg-zinc-900/10">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={13} className="text-zinc-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Timeline</span>
                </div>
                <div className="space-y-1.5">
                  {dailyEvents.slice(0, 8).map((event) => {
                    const category = categories.find(c => c.id === event.categoryId);
                    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                    const eventMins = timeToMinutes(event.time);
                    const nextEvent = dailyEvents[dailyEvents.indexOf(event) + 1];
                    const endMins = nextEvent ? timeToMinutes(nextEvent.time) : eventMins + 60;
                    const isCurrent = nowMins >= eventMins && nowMins < endMins;
                    const isPast = nowMins >= endMins;

                    return (
                      <div key={event.id} className={cn(
                        "flex items-center gap-3 py-1.5 px-2 rounded-lg transition-all",
                        isCurrent ? "bg-orange-500/[0.06] border border-orange-500/20" : "",
                        isPast ? "opacity-40" : ""
                      )}>
                        <span className={cn(
                          "text-[11px] font-mono tabular-nums w-12",
                          isCurrent ? "text-orange-500 font-bold" : "text-zinc-600"
                        )}>
                          {event.time}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: category?.color || '#333' }}
                        />
                        <span className={cn(
                          "text-xs truncate",
                          isCurrent ? "text-white font-bold" : "text-zinc-400"
                        )}>
                          {event.title}
                        </span>
                        {isCurrent && (
                          <div className="mr-auto w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes Row */}
            <div className="grid grid-cols-1 gap-3">
              {/* Daily Notes */}
              <div className="border border-zinc-800/50 rounded-xl p-4 bg-zinc-900/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3 bg-orange-500 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">יומן</span>
                </div>
                <textarea
                  ref={dailyNotesRef}
                  defaultValue={dailyNotes?.content || ''}
                  onFocus={() => { isTypingRef.current = true; }}
                  onBlur={() => { isTypingRef.current = false; saveDailyNotes(); }}
                  className="w-full h-32 bg-transparent text-sm text-zinc-300 font-mono leading-relaxed resize-none outline-none placeholder:text-zinc-800 scrollbar-hide"
                  placeholder="כתוב כאן..."
                />
              </div>

              {/* Sticky Notes */}
              <div className="border border-zinc-800/50 rounded-xl p-4 bg-zinc-900/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-3 bg-zinc-700 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">פתקים</span>
                </div>
                <textarea
                  ref={stickyNotesRef}
                  defaultValue={stickyNotes?.content || ''}
                  onFocus={() => { isTypingRef.current = true; }}
                  onBlur={() => { isTypingRef.current = false; saveStickyNotes(); }}
                  className="w-full h-32 bg-transparent text-sm text-zinc-500 font-mono leading-relaxed resize-none outline-none placeholder:text-zinc-800 scrollbar-hide"
                  placeholder="פתקים קבועים..."
                />
              </div>
            </div>

          </div>

          {/* Desktop: Only Life Matrix */}
          <div className="hidden md:flex flex-1 items-center justify-center relative z-10 animate-in fade-in duration-700">
            <div className="w-full max-w-5xl px-8">
              <div className="border border-zinc-800/30 rounded-xl p-8 bg-zinc-900/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Activity size={14} className="text-zinc-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Life Matrix</span>
                  </div>
                  <span className="text-[10px] text-zinc-700 font-mono tabular-nums">
                    שבוע {weeksExpired.toLocaleString()} / 4,160
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(80,minmax(0,1fr))] grid-flow-row gap-[2px] overflow-hidden">
                  {Array.from({ length: 4160 }).map((_, i) => {
                    const isCurrent = i === weeksExpired;
                    const isPast = i < weeksExpired;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-[1px]",
                          isCurrent
                            ? "bg-orange-500 shadow-[0_0_6px_#f97316]"
                            : isPast
                              ? "bg-zinc-800"
                              : "bg-white/[0.04]"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <>
          {/* Header - Mobile responsive */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 p-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 border-b border-zinc-900 bg-black/50 backdrop-blur-md shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
              <h1 className="text-lg sm:text-xl font-black italic tracking-[0.2em] text-white">LIFE26</h1>
              
              {/* Navigation Controls - Mobile optimized */}
              <div className="flex items-center gap-2 sm:gap-3 bg-zinc-900/30 p-1 border border-zinc-800 rounded-lg w-full sm:w-auto">
                <button
                  onClick={() => setCurrentTime(new Date(currentTime.setDate(currentTime.getDate() - 1)))}
                  className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => setCurrentTime(new Date())}
                  className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 hover:bg-white/10 transition-colors rounded-md"
                >
                  היום
                </button>
                <div className="w-px h-4 bg-zinc-800 mx-1" />
                <div className="text-[10px] sm:text-xs font-bold text-orange-500 px-2 min-w-[120px] sm:min-w-[140px] text-center">
                  {isLoaded ? new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'short' }).format(currentTime) : "טוען..."}
                </div>
                <div className="w-px h-4 bg-zinc-800 mx-1" />
                <button
                  onClick={() => setCurrentTime(new Date(currentTime.setDate(currentTime.getDate() + 1)))}
                  className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                  <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 bg-zinc-900/30 border border-zinc-800 rounded-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Online</span>
              </div>
            </div>
          </header>

          {/* Main Diagnostic Grid - Mobile: column, Desktop: grid */}
          <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-0 overflow-hidden bg-black">
            
            {/* COMMAND CENTER (Left Column, Cols 1-7) */}
            <div className="flex-1 md:col-span-7 border-l border-zinc-900 flex flex-col overflow-hidden relative bg-[#050505]">
              {/* Background scanner effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.03)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-10 animate-in fade-in duration-1000">
                {/* Active Session Status - Mobile responsive */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 border-b border-zinc-900 pb-4 sm:pb-5 mb-6 md:mb-16 relative z-10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg md:rounded-sm text-orange-500">
                        <Monitor size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">סשן פעיל</div>
                        <div className="text-[11px] sm:text-xs font-black text-white tabular-nums tracking-widest">
                          {activeSession.startTime} <span className="mx-1 sm:mx-2 text-zinc-800">—</span> {activeSession.endTime}
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-zinc-900" />

                    {/* Current Topic Display & Config - Mobile optimized */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
                      {currentTopic ? (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex flex-col">
                            <div className="text-[7px] sm:text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">נושא נוכחי</div>
                            <div className="text-[10px] sm:text-[11px] font-black text-orange-500 uppercase tracking-wide">
                              {workSubjects.find(s => s.id === currentTopic.subjectId)?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[8px] sm:text-[9px] font-black text-zinc-800 uppercase tracking-widest">ללא נושא</div>
                      )}

                      <div className="flex items-center gap-2 sm:gap-3">
                        {isConfigOpen ? (
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg animate-in fade-in slide-in-from-right-4 duration-500 w-full sm:w-auto">
                            <select 
                              value={newTopicSubjectId}
                              onChange={(e) => setNewTopicSubjectId(e.target.value)}
                              className="bg-transparent text-[10px] text-white font-black outline-none border-none p-0 cursor-pointer flex-1 sm:flex-none min-w-[100px]"
                            >
                              {workSubjects.map((s) => <option key={s.id} value={s.id} className="bg-black text-white">{s.name.toUpperCase()}</option>)}
                            </select>
                            <div className="w-px h-4 bg-zinc-800" />
                            <input 
                              type="time" 
                              value={newStartTime}
                              onChange={(e) => setNewStartTime(e.target.value)}
                              className="bg-transparent text-[10px] text-white font-black outline-none border-none p-0 font-mono w-14 sm:w-16"
                            />
                            <span className="text-[8px] text-zinc-700">TO</span>
                            <input 
                              type="time" 
                              value={newEndTime}
                              onChange={(e) => setNewEndTime(e.target.value)}
                              className="bg-transparent text-[10px] text-white font-black outline-none border-none p-0 font-mono w-14 sm:w-16"
                            />
                            <button 
                              onClick={handleAddTopic}
                              className="p-1.5 bg-white text-black rounded-md md:rounded-sm hover:bg-orange-500 hover:text-white transition-all"
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                            <button 
                              onClick={() => setIsConfigOpen(false)}
                              className="p-1.5 text-zinc-600 hover:text-white"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsConfigOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-600 transition-all rounded-lg md:rounded-sm text-[9px] font-black uppercase tracking-widest"
                          >
                            <Settings size={12} />
                            Config_Topic
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-4 sm:gap-6">
                    <Activity size={12} className="sm:w-3.5 sm:h-3.5 text-orange-500 animate-pulse" />
                  </div>
                </div>

                {/* HUD DISPLAY AREA - Compact & Optimized */}
                <div className="flex-1 flex flex-col items-center justify-center relative z-10 overflow-hidden">
                  
                  {/* Center: Clock & Map */}
                  <div className="w-full flex flex-col items-center justify-center mb-auto pt-6 md:pt-10">
                    <PomodoroTimerAlternative 
                      activeSession={activeSession}
                      settings={pomodoroSettings}
                      currentTime={currentTime}
                    />
                  </div>

                  {/* Bottom: Operational Timeline - High-End Modular Matrix */}
                  <div className="w-full max-w-5xl mt-auto pb-4 px-2 md:px-0">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:h-40">
                      {/* CURRENT MISSION BOX */}
                      <div className="flex-1 md:flex-[1.4] relative">
                        <div className="h-full bg-zinc-900/40 border border-orange-500/30 rounded-2xl md:rounded-sm p-5 md:p-5 backdrop-blur-md relative overflow-hidden shadow-lg md:shadow-[0_0_40px_rgba(249,115,22,0.05)]">
                          {/* Decorative background number */}
                          <div className="absolute -right-2 -bottom-6 text-[80px] md:text-[100px] font-black text-white/[0.02] italic pointer-events-none select-none">NOW</div>
                          
                          <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="space-y-3">
                              {timelineData.current ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-mono text-orange-500 font-black flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                      {timelineData.current.time}
                                    </div>
                                    {/* Countdown Logic */}
                                    {(() => {
                                      const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                                      const remaining = timelineData.current.endMins - nowMins;
                                      if (remaining <= 0) return null;
                                      return (
                                        <div className="text-[11px] font-mono text-white/90 font-black tabular-nums bg-orange-500/10 px-2 py-1 rounded-md md:rounded-sm">
                                          -{Math.floor(remaining / 60)}h {remaining % 60}m
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div className="text-xl md:text-xl font-black text-white uppercase leading-tight tracking-tighter">
                                    {timelineData.current.title.split(':')[0]}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs font-black text-zinc-800 uppercase tracking-widest italic py-4">Operational_Idle</div>
                              )}
                            </div>
                            
                            {timelineData.current && (
                              <div className="flex items-center justify-between mt-4 md:mt-0">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2.5 h-2.5 rounded-full" 
                                    style={{ 
                                      backgroundColor: categories.find(c => c.id === timelineData.current?.categoryId)?.color || '#333',
                                      boxShadow: `0 4px 10px ${categories.find(c => c.id === timelineData.current?.categoryId)?.color}40`
                                    }} 
                                  />
                                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                    {categories.find(c => c.id === timelineData.current?.categoryId)?.name || 'General'}
                                  </span>
                                </div>
                                <div className="text-[8px] font-mono text-zinc-700 font-black opacity-40">L-OPS_01</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent h-full w-full -translate-y-full animate-scan pointer-events-none opacity-20" />
                        </div>
                      </div>

                      {/* UPCOMING SEQUENCE BOXES - Mobile: hidden on very small screens, 1 item on medium mobile */}
                      <div className="hidden md:grid flex-[3] grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        {timelineData.upcoming.map((event, i) => {
                          const category = categories.find(c => c.id === event.categoryId);
                          return (
                            <div key={event.id} className="relative group/item min-h-[80px] sm:min-h-0">
                              <div className="h-full bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 transition-all rounded-sm p-3 sm:p-4 relative overflow-hidden group/box shadow-lg">
                                <div 
                                  className="absolute bottom-0 left-0 right-0 h-0.5 opacity-20 group-hover/item:opacity-100 transition-all" 
                                  style={{ backgroundColor: category?.color || '#333' }} 
                                />
                                
                                <div className="flex flex-col h-full justify-between relative z-10">
                                  <div className="text-[8px] sm:text-[9px] font-mono text-zinc-600 font-black flex items-center gap-2">
                                    {event.time}
                                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                  </div>
                                  <div className="text-xs sm:text-[14px] font-black text-zinc-300 uppercase leading-tight tracking-tight group-hover/item:text-white transition-colors">
                                    {event.title.split(':')[0]}
                                  </div>
                                  <div className="text-[6px] sm:text-[7px] font-black text-zinc-700 uppercase tracking-[0.2em]">{category?.name}</div>
                                </div>

                                <div 
                                  className="absolute inset-0 opacity-0 group-hover/box:opacity-5 transition-opacity pointer-events-none"
                                  style={{ backgroundColor: category?.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {timelineData.upcoming.length === 0 && (
                          <div className="col-span-1 sm:col-span-3 flex items-center justify-center border border-dashed border-zinc-900/50 rounded-sm bg-black/20 min-h-[80px] sm:min-h-0">
                            <span className="text-[8px] sm:text-[9px] text-zinc-800 uppercase tracking-[0.4em] font-black italic">Sequence_Complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LOGGING & BUFFER (Right Column, Cols 8-12) - Mobile: hidden */}
            <div className="hidden md:flex md:col-span-5 flex-col overflow-hidden bg-black border-r border-zinc-900 border-t md:border-t-0">
              
              {/* Daily Protocol Panel */}
              <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 border-b border-zinc-900 overflow-hidden relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-orange-500 shadow-[0_0_8px_#f97316]" />
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black">יומן</h2>
                  </div>
                </div>
                
                <div className="flex-1 relative group z-10">
                  <div className="absolute -right-1 top-0 h-8 w-[2px] bg-orange-500 group-focus-within:h-full transition-all duration-700 ease-in-out" />
                  <div className="h-full bg-zinc-950/40 p-8 border border-white/5 focus-within:border-orange-500/20 transition-all rounded-sm shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-sm">
                    <textarea
                      ref={dailyNotesRef}
                      defaultValue={dailyNotes?.content || ''}
                      onFocus={() => { isTypingRef.current = true; }}
                      onBlur={() => {
                        isTypingRef.current = false;
                        saveDailyNotes();
                      }}
                      className="w-full h-full bg-transparent text-zinc-300 text-sm sm:text-[15px] font-mono leading-[1.8] p-0 pb-[50%] resize-none outline-none placeholder:text-zinc-900 font-medium scrollbar-hide"
                      placeholder="כתוב כאן..."
                    />
                  </div>
                </div>
              </div>

              {/* Static Buffer Panel */}
              <div className="h-[35%] min-h-[200px] sm:min-h-[250px] md:h-[35%] flex flex-col p-4 sm:p-6 md:p-8 overflow-hidden bg-[#030303] relative">
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-zinc-800" />
                    <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-black">פתקים</h2>
                  </div>
                </div>
                
                <div className="flex-1 bg-black p-6 flex flex-col transition-all border border-zinc-900/50 focus-within:border-zinc-700/50 relative group/buffer">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                  <textarea
                    ref={stickyNotesRef}
                    defaultValue={stickyNotes?.content || ''}
                    onFocus={() => { isTypingRef.current = true; }}
                    onBlur={() => { 
                      isTypingRef.current = false;
                      saveStickyNotes();
                    }}
                    className="w-full h-full bg-transparent text-zinc-500 text-xs sm:text-[13px] font-mono leading-relaxed p-0 resize-none outline-none placeholder:text-zinc-900 scrollbar-hide"
                    placeholder="פתקים קבועים..."
                  />
                  <div className="flex justify-end mt-2 opacity-30 group-focus-within/buffer:opacity-100 transition-opacity">
                    <div className="text-[7px] text-zinc-800 font-black uppercase tracking-[0.4em]"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Sub-Components ---

interface PomodoroTimerProps {
  activeSession: { startTime: string; endTime: string } | null;
  settings: PomodoroSettings;
  currentTime: Date;
}

function PomodoroTimerAlternative({ activeSession, settings, currentTime }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  
  const cycles = useMemo(() => {
    if (!activeSession) return [];
    
    const startMins = timeToMinutes(activeSession.startTime);
    const endMins = timeToMinutes(activeSession.endTime);
    const totalDuration = endMins - startMins;
    
    const workMinutes = settings.workMinutes;
    const breakMinutes = settings.breakMinutes;
    const cycleMinutes = workMinutes + breakMinutes;
    
    const result: { type: 'work' | 'break', start: number, end: number, duration: number }[] = [];
    let currentPos = startMins;
    
    while (currentPos < endMins) {
      const remainingTotal = endMins - currentPos;
      
      // Work cycle
      let currentWorkDuration = workMinutes;
      const potentialRemainingAfterWork = remainingTotal - workMinutes;
      
      // The 35-minute rule: if what's left after this work cycle is < 35 mins (including break), merge it
      if (potentialRemainingAfterWork < 35) {
        currentWorkDuration = remainingTotal;
      }
      
      result.push({
        type: 'work',
        start: currentPos,
        end: currentPos + currentWorkDuration,
        duration: currentWorkDuration
      });
      
      currentPos += currentWorkDuration;
      
      // Break cycle (only if we're not at the end)
      if (currentPos < endMins) {
        result.push({
          type: 'break',
          start: currentPos,
          end: Math.min(currentPos + breakMinutes, endMins),
          duration: Math.min(breakMinutes, endMins - currentPos)
        });
        currentPos += breakMinutes;
      }
    }
    
    return result;
  }, [activeSession, settings]);
  
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const nowSecs = now.getSeconds();
      
      const currentCycle = cycles.find(c => nowMins >= c.start && nowMins < c.end);
      
      if (currentCycle) {
        setMode(currentCycle.type);
        const remainingMins = currentCycle.end - nowMins;
        setTimeLeft(remainingMins * 60 - nowSecs);
      } else {
        // If between cycles or session ended
        setMode('work');
        setTimeLeft(0);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cycles]);

  const formatTime = (seconds: number) => {
    if (seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentCycle = cycles.find(c => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return nowMins >= c.start && nowMins < c.end;
  });
  
  const progress = currentCycle 
    ? ((currentCycle.duration * 60 - timeLeft) / (currentCycle.duration * 60)) * 100 
    : 0;

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Ultra Modern Clean Ring */}
        <svg className="w-full h-full -rotate-90 absolute" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <circle 
            cx="50" cy="50" r="48" 
          fill="none" 
            stroke={mode === 'work' ? "#f97316" : "#00d4ff"} 
            strokeWidth="1.2" 
            strokeDasharray="301.6" 
            strokeDashoffset={301.6 - (301.6 * Math.max(0, Math.min(100, progress)) / 100)}
          className="transition-all duration-1000 ease-linear"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${mode === 'work' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(0, 212, 255, 0.4)'})` }}
        />
      </svg>

        <div className="flex flex-col items-center justify-center z-10">
          <div className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-1 opacity-80 italic leading-none">
            {mode === 'work' ? 'עבודה' : 'הפסקה'}
        </div>
          <div className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">
          {formatTime(timeLeft)}
          </div>
          <div className="mt-6 flex items-center justify-center">
            <div className={cn("w-1 h-1 rounded-full animate-pulse", mode === 'work' ? "bg-orange-500" : "bg-cyan-500")} />
          </div>
        </div>
      </div>

      {/* Sessions/Cycles Visualization - Pure Minimalist Dashes */}
      <div className="w-full max-w-sm px-2">
        <div className="flex gap-1.5 h-1.5 items-center justify-center">
          {cycles.map((cycle, i) => {
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            const isCurrent = nowMins >= cycle.start && nowMins < cycle.end;
            const isPast = nowMins >= cycle.end;
            
            return (
              <div 
                key={i} 
                className={cn(
                  "h-full transition-all duration-700 rounded-[1px]",
                  isCurrent ? "flex-[4] h-2.5 shadow-[0_0_10px_currentColor]" : "flex-1",
                  isPast ? "opacity-30" : "opacity-100"
                )}
                style={{ 
                  backgroundColor: cycle.type === 'work' ? '#f97316' : '#00d4ff',
                  color: cycle.type === 'work' ? '#f97316' : '#00d4ff'
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
