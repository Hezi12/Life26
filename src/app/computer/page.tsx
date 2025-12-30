"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Download,
  Upload,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, Event, WorkTopic, WorkSubject, DailyNotes, StickyNotes, PomodoroSettings } from "@/lib/types";
import { ICON_MAP, AVAILABLE_ICONS, INITIAL_CATEGORIES, NEON_COLORS } from "@/lib/constants";
import { playSound } from "@/lib/audio";
import { api } from "@/lib/api";

// --- INITIAL DATA ---

const INITIAL_WORK_SUBJECTS: WorkSubject[] = [
  { id: "1", name: "פיתוח מסחר", color: "#06b6d4", iconName: "Code" },
  { id: "2", name: "פיתוח פרויקט Life26", color: "#3b82f6", iconName: "Code" },
  { id: "3", name: "תפעול", color: "#14b8a6", iconName: "Activity" },
  { id: "4", name: "תכנון", color: "#f97316", iconName: "Target" },
];

const INITIAL_POMODORO: PomodoroSettings = {
  workMinutes: 60,
  breakMinutes: 5,
  soundsEnabled: true,
  workSound: "success",
  breakSound: "chime",
};

// --- UTILS ---

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const formatDateDisplay = (date: Date): string => {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${dayName} ${day}/${month}`;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}` : `${mins}ד`;
};

const calculateDuration = (startTime: string, endTime: string): number => {
  let start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end < start) end += 1440;
  return end - start;
};

// --- MAIN COMPONENT ---

export default function ComputerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [workTopics, setWorkTopics] = useState<WorkTopic[]>([]);
  const [workSubjects, setWorkSubjects] = useState<WorkSubject[]>(INITIAL_WORK_SUBJECTS);
  const [dailyNotes, setDailyNotes] = useState<DailyNotes | null>(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNotes | null>(null);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(INITIAL_POMODORO);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<WorkTopic | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const dailyNotesRef = useRef<HTMLTextAreaElement>(null);
  const stickyNotesRef = useRef<HTMLTextAreaElement>(null);
  const isTypingRef = useRef(false);

  const dateString = formatDate(currentDate);

  // Load data from API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadData = async () => {
      try {
        const [eventsData, categoriesData, topicsData, subjectsData, pomodoroData] = await Promise.all([
          api.getEvents(),
          api.getCategories(),
          api.getWorkTopics(dateString),
          api.getWorkSubjects(),
          api.getPomodoroSettings(),
        ]);

        if (eventsData && Array.isArray(eventsData)) {
          setEvents(eventsData);
        }

        if (categoriesData && Array.isArray(categoriesData) && categoriesData.length > 0) {
          const mergedCategories: Category[] = [];
          INITIAL_CATEGORIES.forEach(defaultCat => {
            const existing = categoriesData.find((c: Category) => c.id === defaultCat.id);
            if (existing) {
              mergedCategories.push({
                ...existing,
                iconName: defaultCat.iconName,
                color: defaultCat.color
              });
            } else {
              mergedCategories.push(defaultCat);
            }
          });
          categoriesData.forEach((cat: Category) => {
            if (!INITIAL_CATEGORIES.some(dc => dc.id === cat.id)) {
              mergedCategories.push(cat);
            }
          });
          setCategories(mergedCategories);
        } else {
          setCategories(INITIAL_CATEGORIES);
        }

        if (topicsData && Array.isArray(topicsData)) {
          setWorkTopics(topicsData);
        }

        if (subjectsData && Array.isArray(subjectsData) && subjectsData.length > 0) {
          setWorkSubjects(subjectsData);
        }

        if (pomodoroData) {
          setPomodoroSettings(pomodoroData);
        }

        const dailyNotesData = await api.getDailyNotes(dateString);
        if (dailyNotesData) {
          setDailyNotes(dailyNotesData);
        }

        const stickyNotesData = await api.getStickyNotes();
        if (stickyNotesData) {
          setStickyNotes(stickyNotesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [dateString]);

  // Sync events from other pages
  useEffect(() => {
    const handleSync = async () => {
      try {
        const eventsData = await api.getEvents();
        if (eventsData && Array.isArray(eventsData)) {
          setEvents(eventsData);
        }
      } catch (error) {
        console.error('Sync failed', error);
      }
    };
    window.addEventListener('life26-update' as any, handleSync);
    return () => {
      window.removeEventListener('life26-update' as any, handleSync);
    };
  }, []);

  // Load daily data when date changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadDailyData = async () => {
      try {
        const dailyNotesData = await api.getDailyNotes(dateString);
        if (dailyNotesData) {
          setDailyNotes(dailyNotesData);
        }
      } catch (error) {
        console.error('Error loading daily notes:', error);
      }
    };

    loadDailyData();
  }, [dateString]);

  // Save work topics
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saveTopics = async () => {
      try {
        for (const topic of workTopics) {
          await api.saveWorkTopic(topic);
        }
        window.dispatchEvent(new CustomEvent('life26-update', { 
          detail: { type: 'workTopicsUpdated', source: 'computer-page' } 
        }));
      } catch (error) {
        console.error('Failed to save work topics', error);
      }
    };
    
    saveTopics();
  }, [workTopics]);

  // Save work subjects
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saveSubjects = async () => {
      try {
        for (const subject of workSubjects) {
          await api.saveWorkSubject(subject);
        }
      } catch (error) {
        console.error('Failed to save work subjects', error);
      }
    };
    
    saveSubjects();
  }, [workSubjects]);

  // Save pomodoro settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savePomodoro = async () => {
      try {
        await api.savePomodoroSettings(pomodoroSettings);
      } catch (error) {
        console.error('Failed to save pomodoro settings', error);
      }
    };
    
    savePomodoro();
  }, [pomodoroSettings]);

  // Listen for events changes from other pages
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'life26-events' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setEvents(parsed);
          }
        } catch (error) {
          console.error('Error parsing events:', error);
        }
      }
      if (e.key === 'life26-categories' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCategories(parsed);
          }
        } catch (error) {
          console.error('Error parsing categories:', error);
        }
      }
      if (e.key === 'life26-daily-notes' && e.newValue) {
        if (!isTypingRef.current) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (typeof parsed === 'object' && parsed !== null) {
              const notes = Object.values(parsed).find((n: any) => n.dateString === dateString) as DailyNotes | undefined;
              setDailyNotes(notes || null);
            }
          } catch (error) {
            console.error('Error parsing daily notes:', error);
          }
        }
      }
      if (e.key === 'life26-sticky-notes' && e.newValue) {
        if (!isTypingRef.current) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && typeof parsed === 'object') {
              setStickyNotes(parsed);
            }
          } catch (error) {
            console.error('Error parsing sticky notes:', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleCustomEvent = async (e: CustomEvent) => {
      if (e.detail?.type === 'events-updated') {
        try {
          const eventsData = await api.getEvents();
          if (eventsData && Array.isArray(eventsData)) {
            setEvents(eventsData);
          }
        } catch (error) {
          console.error('Error syncing events', error);
        }
      }
      if (e.detail?.type === 'notes-updated' && !isTypingRef.current) {
        try {
          const dailyNotesData = await api.getDailyNotes(dateString);
          if (dailyNotesData) {
            setDailyNotes(dailyNotesData);
            if (dailyNotesRef.current) {
              dailyNotesRef.current.value = dailyNotesData.content || '';
            }
          }
          const stickyNotesData = await api.getStickyNotes();
          if (stickyNotesData) {
            setStickyNotes(stickyNotesData);
            if (stickyNotesRef.current) {
              stickyNotesRef.current.value = stickyNotesData.content || '';
            }
          }
        } catch (error) {
          console.error('Error syncing notes', error);
        }
      }
    };

    window.addEventListener('life26-update' as any, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('life26-update' as any, handleCustomEvent);
    };
  }, [dateString]);

  // Update topics when event times change
  useEffect(() => {
    const dailyEvents = events.filter(e => e.dateString === dateString);
    const dailyTopics = workTopics.filter(t => t.dateString === dateString);

    // Find topics that need updating
    const topicsToUpdate: WorkTopic[] = [];
    const topicsToDelete: string[] = [];
    const newAutoTopics: WorkTopic[] = [];

    dailyTopics.forEach(topic => {
      const event = dailyEvents.find(e => e.id === topic.eventId);
      if (!event) {
        // Event was deleted (ID doesn't exist), delete topic from database
        topicsToDelete.push(topic.id);
        return;
      }

      // Event exists - check if time changed and update topic accordingly
      // Calculate new session times
      const [eventHour, eventMin] = event.time.split(':').map(Number);
      const eventStartMinutes = eventHour * 60 + eventMin;
      
      let eventEndMinutes: number;
      const nextEvent = dailyEvents
        .filter(e => {
          const [h, m] = e.time.split(':').map(Number);
          return h * 60 + m > eventStartMinutes;
        })
        .sort((a, b) => {
          const [h1, m1] = a.time.split(':').map(Number);
          const [h2, m2] = b.time.split(':').map(Number);
          return (h1 * 60 + m1) - (h2 * 60 + m2);
        })[0];
      
      if (nextEvent) {
        const [h, m] = nextEvent.time.split(':').map(Number);
        eventEndMinutes = h * 60 + m;
      } else {
        eventEndMinutes = eventStartMinutes + 30;
      }

      const topicStart = timeToMinutes(topic.startTime);
      const topicEnd = timeToMinutes(topic.endTime);
      const topicEndAdjusted = topicEnd < topicStart ? topicEnd + 24 * 60 : topicEnd;

      // Check if topic is outside event bounds (event time changed)
      if (topicStart < eventStartMinutes || topicEndAdjusted > eventEndMinutes) {
        // Adjust topic times proportionally or delete if too far out
        const topicStartRelative = topicStart - eventStartMinutes;
        const oldEventDuration = eventEndMinutes - eventStartMinutes;
        const newEventDuration = eventEndMinutes - eventStartMinutes;

        if (oldEventDuration > 0 && newEventDuration > 0) {
          const ratio = newEventDuration / oldEventDuration;
          const newTopicStart = eventStartMinutes + (topicStartRelative * ratio);
          const newTopicEnd = newTopicStart + (topicEndAdjusted - topicStart) * ratio;

          if (newTopicEnd <= eventEndMinutes) {
            // Update topic times to match new event time
            topicsToUpdate.push({
              ...topic,
              startTime: minutesToTime(Math.round(newTopicStart)),
              endTime: minutesToTime(Math.round(newTopicEnd)),
              durationMinutes: Math.round(newTopicEnd - newTopicStart),
            });
          } else {
            topicsToDelete.push(topic.id);
          }
        } else {
          topicsToDelete.push(topic.id);
        }
      }
    });

    // Auto-create topics from event titles
    dailyEvents.forEach(event => {
      const category = categories.find(c => c.id === event.categoryId);
      const titleLower = event.title.toLowerCase();
      const isWorkSession = (
        titleLower.includes('מחשב') || 
        titleLower.includes('עבודה') ||
        category?.name === 'עבודה' ||
        category?.id === '9'
      );

      if (isWorkSession) {
        // Check if event already has topics in workTopics
        const eventHasTopics = workTopics.some(t => t.eventId === event.id && t.dateString === dateString);
        
        if (!eventHasTopics) {
          // Look for subject match in title
          let bestSubject: WorkSubject | null = null;
          
          workSubjects.forEach(subject => {
            if (event.title.includes(subject.name)) {
              if (!bestSubject || subject.name.length > bestSubject.name.length) {
                bestSubject = subject;
              }
            }
          });

          if (bestSubject) {
            const subject = bestSubject as WorkSubject;
            // Calculate session duration
            const [h, m] = event.time.split(':').map(Number);
            const startMins = h * 60 + m;
            
            let endMins: number;
            const nextEvent = dailyEvents
              .filter(e => {
                const [eh, em] = e.time.split(':').map(Number);
                return eh * 60 + em > startMins;
              })
              .sort((a, b) => {
                const [h1, m1] = a.time.split(':').map(Number);
                const [h2, m2] = b.time.split(':').map(Number);
                return (h1 * 60 + m1) - (h2 * 60 + m2);
              })[0];
            
            if (nextEvent) {
              const [eh, em] = nextEvent.time.split(':').map(Number);
              endMins = eh * 60 + em;
            } else {
              endMins = startMins + 30;
            }

            newAutoTopics.push({
              id: `auto-${event.id}-${Date.now()}`,
              eventId: event.id,
              subjectId: subject.id,
              startTime: event.time,
              endTime: minutesToTime(endMins),
              durationMinutes: endMins - startMins,
              dateString
            });
          }
        }
      }
    });

    // Execute deletions from database first (only if event ID was deleted)
    if (topicsToDelete.length > 0) {
      const deleteTopics = async () => {
        try {
          for (const topicId of topicsToDelete) {
            await api.deleteWorkTopic(topicId);
            console.log('✅ Deleted work topic from database:', topicId);
          }
        } catch (error) {
          console.error('❌ Failed to delete work topics:', error);
        }
      };
      deleteTopics();
    }

    // Update state (deletions, updates, and new topics)
    if (topicsToUpdate.length > 0 || topicsToDelete.length > 0 || newAutoTopics.length > 0) {
      setWorkTopics(prev => {
        let updated = prev.map(t => {
          const update = topicsToUpdate.find(u => u.id === t.id);
          return update || t;
        });
        updated = updated.filter(t => !topicsToDelete.includes(t.id));
        return [...updated, ...newAutoTopics];
      });
    }
  }, [events, dateString, workTopics]);

  // Identify work sessions
  const workSessions = useMemo(() => {
    const dailyEvents = events.filter(e => e.dateString === dateString);
    
    return dailyEvents
      .filter(event => {
        const category = categories.find(c => c.id === event.categoryId);
        const titleLower = event.title.toLowerCase();
        return (
          titleLower.includes('מחשב') || 
          titleLower.includes('עבודה') ||
          category?.name === 'עבודה' ||
          category?.id === '9'
        );
      })
      .map((event, index) => {
        const [startHour, startMin] = event.time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        
        let endMinutes: number;
        const nextEvent = dailyEvents
          .filter(e => {
            const [h, m] = e.time.split(':').map(Number);
            return h * 60 + m > startMinutes;
          })
          .sort((a, b) => {
            const [h1, m1] = a.time.split(':').map(Number);
            const [h2, m2] = b.time.split(':').map(Number);
            return (h1 * 60 + m1) - (h2 * 60 + m2);
          })[0];
        
        if (nextEvent) {
          const [h, m] = nextEvent.time.split(':').map(Number);
          endMinutes = h * 60 + m;
        } else {
          endMinutes = startMinutes + 30;
        }
        
        const duration = endMinutes - startMinutes;
        const startTime = minutesToTime(startMinutes);
        const endTime = minutesToTime(endMinutes);
        
        return {
          event,
          startTime,
          endTime,
          durationMinutes: duration,
        };
      })
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [events, categories, dateString]);

  // Get topics for a session
  const getTopicsForSession = (sessionId: string) => {
    return workTopics
      .filter(topic => topic.eventId === sessionId && topic.dateString === dateString)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  // Statistics
  const statistics = useMemo(() => {
    const totalWorkMinutes = workSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const totalTopicsMinutes = workTopics
      .filter(topic => topic.dateString === dateString)
      .reduce((sum, topic) => {
        const duration = calculateDuration(topic.startTime, topic.endTime);
        return sum + (duration > 0 ? duration : 0);
      }, 0);
    
    const coveragePercent = totalWorkMinutes > 0 
      ? Math.round((totalTopicsMinutes / totalWorkMinutes) * 100) 
      : 0;

    const topicsBySubject: Record<string, { subject: WorkSubject; minutes: number }> = {};
    workTopics
      .filter(topic => topic.dateString === dateString)
      .forEach(topic => {
        const subject = workSubjects.find(s => s.id === topic.subjectId);
        if (subject) {
          const duration = calculateDuration(topic.startTime, topic.endTime);
          if (duration > 0) {
            if (!topicsBySubject[topic.subjectId]) {
              topicsBySubject[topic.subjectId] = { subject, minutes: 0 };
            }
            topicsBySubject[topic.subjectId].minutes += duration;
          }
        }
      });

    return {
      totalWorkMinutes,
      totalTopicsMinutes,
      coveragePercent,
      topicsBySubject: Object.values(topicsBySubject).sort((a, b) => b.minutes - a.minutes),
    };
  }, [workSessions, workTopics, workSubjects, dateString]);

  // Navigation
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setTime(Date.now());
    }
    setCurrentDate(newDate);
  };

  // Save daily notes
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
        detail: { type: 'notes-updated', source: 'computer-page' } 
      }));
    } catch (error) {
      console.error('Failed to save daily notes', error);
    }
  }, [dateString, dailyNotes]);

  // Save sticky notes
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
        detail: { type: 'notes-updated', source: 'computer-page' } 
      }));
    } catch (error) {
      console.error('Failed to save sticky notes', error);
    }
  }, [stickyNotes]);

  // Add topic
  const handleAddTopic = (sessionId: string) => {
    const session = workSessions.find(s => s.event.id === sessionId);
    if (session) {
      setSelectedSessionId(sessionId);
      setEditingTopic(null);
      setIsTopicDialogOpen(true);
    }
  };

  // Edit topic
  const handleEditTopic = (topic: WorkTopic) => {
    setEditingTopic(topic);
    setIsTopicDialogOpen(true);
  };

  // Delete topic
  const handleDeleteTopic = (topicId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק נושא זה?')) {
      setWorkTopics(prev => prev.filter(t => t.id !== topicId));
    }
  };

  // Save topic
  const handleSaveTopic = (data: { subjectId: string; startTime: string; endTime: string }) => {
    if (editingTopic) {
      const duration = calculateDuration(data.startTime, data.endTime);
      setWorkTopics(prev => prev.map(t => 
        t.id === editingTopic.id 
          ? { ...t, ...data, durationMinutes: duration }
          : t
      ));
    } else if (selectedSessionId) {
      const newTopic: WorkTopic = {
        id: `topic-${Date.now()}`,
        eventId: selectedSessionId,
        subjectId: data.subjectId,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: calculateDuration(data.startTime, data.endTime),
        dateString,
      };
      setWorkTopics(prev => [...prev, newTopic]);
    }
    setIsTopicDialogOpen(false);
    setEditingTopic(null);
    setSelectedSessionId(null);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-black text-white font-mono pt-safe" dir="rtl">
      {/* Top Header - Aligned with Schedule Page */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 p-4 sm:p-6 border-b border-zinc-900 bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <h1 className="text-xl font-black italic tracking-[0.2em] text-white uppercase">CORE TERMINAL</h1>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-3 bg-zinc-900/30 p-1 border border-zinc-800 rounded-lg md:rounded-sm w-full sm:w-auto">
            <button
              onClick={() => navigateDate('prev')}
              className="p-1 text-zinc-500 hover:text-orange-500 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigateDate('today')}
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 text-zinc-400 hover:bg-white/10 transition-colors rounded-md md:rounded-sm"
            >
              היום
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <div className="text-[10px] md:text-xs font-bold text-orange-500 px-2 min-w-[120px] md:min-w-[140px] text-center">
              {formatDateDisplay(currentDate)}
            </div>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button
              onClick={() => navigateDate('next')}
              className="p-1 text-zinc-500 hover:text-orange-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="hidden md:block p-2 text-zinc-500 hover:text-orange-500 transition-all hover:scale-110"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* Main Grid - Mobile: column, Desktop: grid */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-0 overflow-hidden bg-black">
        
        {/* Left Column: Analysis & Sessions (Cols 1-5) - Mobile: full width */}
        <div className="flex-1 md:col-span-5 border-l border-zinc-900 flex flex-col overflow-hidden bg-[#050505]">
          
          {/* Daily Summary Section */}
            <div className="p-4 sm:p-6 border-b border-zinc-900 bg-zinc-950/20">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-orange-500 shadow-[0_0_8px_#f97316]" />
                  <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-black">Daily_Analytics</h2>
                </div>
                <div className="text-[7px] sm:text-[8px] text-zinc-700 font-mono">STATUS // OPTIMAL</div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[8px] text-zinc-600 uppercase tracking-widest mb-1 font-black">TOTAL_WORK_LOAD</span>
                    <span className="text-lg sm:text-xl font-black text-white tabular-nums">{formatDuration(statistics.totalWorkMinutes)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[8px] text-zinc-600 uppercase tracking-widest mb-1 font-black">TOPIC_SYNC_RATE</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-xl font-black text-orange-500 tabular-nums">{statistics.coveragePercent}%</span>
                      <span className="text-[8px] sm:text-[9px] text-zinc-600 font-mono">({formatDuration(statistics.totalTopicsMinutes)})</span>
                    </div>
                  </div>
                </div>

              {/* Pie Chart Representation - Hidden on mobile for minimalism */}
              <div className="hidden sm:flex justify-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#0a0a0a" strokeWidth="3" />
                    <circle 
                      cx="18" cy="18" r="15.9155" 
                      fill="none" 
                      stroke="#ff5722" 
                      strokeWidth="3" 
                      strokeDasharray={`${statistics.coveragePercent} 100`} 
                      strokeDashoffset="0"
                      className="transition-all duration-1000 ease-out"
                      style={{ filter: "drop-shadow(0 0 4px #ff572240)" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[7px] sm:text-[8px] font-black text-orange-500 tracking-widest">SYNC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects Breakdown */}
            {statistics.topicsBySubject.length > 0 && (
              <div className="mt-6 md:mt-8 space-y-3">
                <div className="text-[8px] text-zinc-700 uppercase tracking-[0.3em] mb-2 font-black border-b border-zinc-900 pb-1">Segment_Allocation</div>
                <div className="grid grid-cols-1 gap-3">
                  {statistics.topicsBySubject.slice(0, 4).map(({ subject, minutes }) => {
                    const percent = statistics.totalTopicsMinutes > 0
                      ? Math.round((minutes / statistics.totalTopicsMinutes) * 100)
                      : 0;
                    return (
                      <div key={subject.id} className="flex flex-col gap-1.5 group/seg">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span className="text-zinc-500 group-hover/seg:text-zinc-300 transition-colors">{subject.name}</span>
                          <span className="text-white font-mono">{formatDuration(minutes)}</span>
                        </div>
                        <div className="h-1 bg-zinc-900 w-full relative rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 right-0 h-full transition-all duration-1000"
                            style={{ 
                              width: `${percent}%`, 
                              backgroundColor: subject.color,
                              boxShadow: `0 0 10px ${subject.color}40`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Work Sessions Section - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
                <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-black">Active_Sessions</h2>
              </div>
              <div className="text-[8px] text-zinc-700 font-mono tracking-widest italic">STREAM_v2.0</div>
            </div>

            {workSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-900 rounded-2xl md:rounded-sm bg-black/20">
                <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-800 italic">No_Active_Data</span>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {workSessions.map((session) => {
                  const sessionTopics = getTopicsForSession(session.event.id);
                  return (
                    <div key={session.event.id} className="relative pr-6 group/sess">
                      {/* Timeline Line */}
                      <div className="absolute right-0 top-0 bottom-0 w-px bg-zinc-900 group-hover/sess:bg-zinc-800 transition-colors" />
                      <div className="absolute -right-[2.5px] top-0 w-[6px] h-[6px] rounded-full bg-zinc-900 group-hover/sess:bg-[#00d4ff] transition-all group-hover/sess:shadow-[0_0_8px_#00d4ff]" />
                      
                      <div className="flex items-center justify-between mb-4 bg-zinc-900/20 p-2 rounded-lg md:rounded-sm border border-zinc-800/50">
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] text-[#00d4ff] font-mono font-bold tracking-tighter">
                            {session.startTime} {'>'} {session.endTime}
                          </div>
                          <div className="w-1 h-1 rounded-full bg-zinc-800" />
                          <div className="text-[9px] text-zinc-600 font-mono uppercase font-black">
                            {formatDuration(session.durationMinutes)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddTopic(session.event.id)}
                          className="w-7 h-7 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:border-[#00d4ff] hover:text-[#00d4ff] transition-all rounded-lg md:rounded-sm bg-black/40 hover:scale-110"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      {sessionTopics.length > 0 && (
                        <div className="space-y-3 mt-2">
                          {sessionTopics.map((topic) => {
                            const subject = workSubjects.find(s => s.id === topic.subjectId);
                            if (!subject) return null;
                            const Icon = ICON_MAP[subject.iconName] || ICON_MAP['Circle'];
                            return (
                              <div
                                key={topic.id}
                                className="group relative bg-zinc-900/40 border border-zinc-800/50 p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all rounded-xl md:rounded-sm overflow-hidden shadow-sm md:shadow-none"
                              >
                                <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-xl md:rounded-none" style={{ backgroundColor: subject.color, boxShadow: `0 0 10px ${subject.color}20` }} />
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 md:gap-5">
                                    <div className="p-2.5 md:p-3 bg-black border border-zinc-800 rounded-lg md:rounded-sm relative shadow-sm" style={{ color: subject.color }}>
                                      <Icon size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col gap-0.5 md:gap-1">
                                      <div className="text-[12px] md:text-[11px] font-black text-white uppercase tracking-[0.05em] group-hover:text-orange-500 transition-colors">{subject.name}</div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-[9px] text-zinc-500 font-mono font-bold">{topic.startTime} - {topic.endTime}</div>
                                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                        <div className="text-[9px] text-zinc-600 font-mono uppercase font-black">{formatDuration(calculateDuration(topic.startTime, topic.endTime))}</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <button
                                      onClick={() => handleEditTopic(topic)}
                                      className="p-2 text-zinc-600 hover:text-white transition-colors bg-zinc-950 border border-zinc-800 rounded-lg md:rounded-sm"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTopic(topic.id)}
                                      className="p-2 text-zinc-600 hover:text-red-500 transition-colors bg-zinc-950 border border-zinc-800 rounded-lg md:rounded-sm"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Writing Area (Cols 6-12) - Hidden on mobile for minimalism */}
        <div className="hidden md:flex md:col-span-7 flex flex-col overflow-hidden bg-black border-r border-zinc-900/50 border-t md:border-t-0">
          
          {/* Daily Notes - WritingC style */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 border-b border-zinc-900 overflow-hidden relative">
            {/* Background scanner effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-orange-500 shadow-[0_0_8px_#f97316]" />
                <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 font-black">Daily_Protocol</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[8px] text-zinc-700 font-black uppercase tracking-widest font-mono">v2.0_IO_STREAM</div>
                <div className="w-2 h-2 rounded-full bg-orange-500/20 animate-pulse" />
              </div>
            </div>
            
            <div className="flex-1 relative group z-10">
              <div className="absolute -right-1 top-0 bottom-0 w-[2px] bg-orange-500 group-focus-within:h-full h-8 transition-all duration-700 ease-in-out" />
              <div className="h-full bg-zinc-950/30 p-8 border border-white/5 focus-within:border-orange-500/20 transition-all shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] backdrop-blur-sm rounded-sm">
                <textarea
                  ref={dailyNotesRef}
                  defaultValue={dailyNotes?.content || ''}
                  onFocus={() => { isTypingRef.current = true; }}
                  onBlur={() => { 
                    isTypingRef.current = false;
                    saveDailyNotes();
                  }}
                  className="w-full h-full bg-transparent text-zinc-200 text-base leading-[1.8] p-0 resize-none outline-none placeholder:text-zinc-900 font-medium scrollbar-hide"
                  placeholder="Initialize daily logging stream..."
                />
              </div>
            </div>
          </div>

          {/* Sticky Notes - WritingB style */}
          <div className="h-1/3 flex flex-col p-8 bg-[#020202] overflow-hidden relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-zinc-700 shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
                <h2 className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-black">Static_Buffer</h2>
              </div>
              <div className="text-[8px] text-zinc-800 font-mono tracking-[0.2em] uppercase">Long_Term_Storage</div>
            </div>
            
            <div className="flex-1 bg-zinc-900/10 rounded-sm border border-zinc-900/50 p-6 transition-all focus-within:border-zinc-700/50 group/sticky relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-zinc-800" />
              <textarea
                ref={stickyNotesRef}
                defaultValue={stickyNotes?.content || ''}
                onFocus={() => { isTypingRef.current = true; }}
                onBlur={() => { 
                  isTypingRef.current = false;
                  saveStickyNotes();
                }}
                className="w-full h-full bg-transparent text-zinc-400 text-sm leading-relaxed p-0 resize-none outline-none placeholder:text-zinc-900 font-mono"
                placeholder="Secure data persistence..."
              />
              <div className="flex justify-end mt-4">
                <div className="text-[7px] text-zinc-800 font-black uppercase tracking-[0.3em] italic opacity-50 group-focus-within/sticky:opacity-100 transition-opacity">MEM_CORE_v2.0 // SYNC_OK</div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Topic Dialog */}
      {isTopicDialogOpen && (
        <TopicDialog
          session={selectedSessionId ? workSessions.find(s => s.event.id === selectedSessionId) : null}
          topic={editingTopic}
          subjects={workSubjects}
          onClose={() => {
            setIsTopicDialogOpen(false);
            setEditingTopic(null);
            setSelectedSessionId(null);
          }}
          onSave={handleSaveTopic}
        />
      )}

      {/* Settings Dialog */}
      {isSettingsOpen && (
        <SettingsDialog
          subjects={workSubjects}
          pomodoro={pomodoroSettings}
          onClose={() => setIsSettingsOpen(false)}
          onSaveSubjects={(subjects) => {
            setWorkSubjects(subjects);
            setIsSettingsOpen(false);
          }}
          onSavePomodoro={(settings) => {
            setPomodoroSettings(settings);
            setIsSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}

// --- Topic Dialog Component ---

interface TopicDialogProps {
  session: { startTime: string; endTime: string } | null | undefined;
  topic: WorkTopic | null;
  subjects: WorkSubject[];
  onClose: () => void;
  onSave: (data: { subjectId: string; startTime: string; endTime: string }) => void;
}

function TopicDialog({ session, topic, subjects, onSave, onClose }: TopicDialogProps) {
  const [subjectId, setSubjectId] = useState(topic?.subjectId || subjects[0]?.id || '');
  const [startTime, setStartTime] = useState(topic?.startTime || session?.startTime || '09:00');
  const [endTime, setEndTime] = useState(topic?.endTime || session?.endTime || '17:00');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!subjectId) newErrors.subjectId = 'שדה חובה';
    if (!startTime) newErrors.startTime = 'שדה חובה';
    if (!endTime) newErrors.endTime = 'שדה חובה';
    if (startTime && endTime) {
      const start = timeToMinutes(startTime);
      let end = timeToMinutes(endTime);
      if (end < start) end += 24 * 60;
      if (end <= start) {
        newErrors.endTime = 'זמן סיום חייב להיות אחרי התחלה';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave({ subjectId, startTime, endTime });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100]" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-[#0a0a0a] border border-zinc-800 p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-0 top-0 w-1 h-full bg-orange-500" />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-black italic uppercase tracking-[0.2em] text-white">
              {topic ? 'עריכת נושא' : 'הוספת נושא'}
            </h3>
            <div className="text-[8px] text-zinc-600 font-mono mt-1">MODULE_WORK_LOG_v2.0</div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">נושא</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-black border border-zinc-900 text-sm text-white p-3 focus:outline-none focus:border-orange-500/50 transition-colors appearance-none"
            >
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id} className="bg-black">
                  {subject.name}
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <div className="text-[9px] text-orange-500 font-bold uppercase mt-1">{errors.subjectId}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">זמן התחלה</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-black border border-zinc-900 text-sm text-white p-3 font-mono focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              {errors.startTime && (
                <div className="text-[9px] text-orange-500 font-bold uppercase mt-1">{errors.startTime}</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">זמן סיום</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-black border border-zinc-900 text-sm text-white p-3 font-mono focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              {errors.endTime && (
                <div className="text-[9px] text-orange-500 font-bold uppercase mt-1">{errors.endTime}</div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-white text-black py-4 text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              שמור
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-900 text-zinc-400 py-4 text-xs font-black uppercase tracking-widest hover:text-white transition-all border border-zinc-800"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- Settings Dialog Component ---

interface SettingsDialogProps {
  subjects: WorkSubject[];
  pomodoro: PomodoroSettings;
  onClose: () => void;
  onSaveSubjects: (subjects: WorkSubject[]) => void;
  onSavePomodoro: (settings: PomodoroSettings) => void;
}

function SettingsDialog({ subjects, pomodoro, onSaveSubjects, onSavePomodoro, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<'subjects' | 'pomodoro'>('subjects');
  const [localSubjects, setLocalSubjects] = useState(subjects);
  const [localPomodoro, setLocalPomodoro] = useState(pomodoro);
  const [editingSubject, setEditingSubject] = useState<WorkSubject | null>(null);

  const handleSave = () => {
    onSaveSubjects(localSubjects);
    onSavePomodoro(localPomodoro);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-2xl h-[80vh] flex flex-col rounded-sm shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-0 top-0 w-1 h-full bg-orange-500" />
        
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">הגדרות מערכת</div>
            <div className="text-[8px] text-zinc-600 font-mono mt-1">SYSTEM_CORE_CONFIG_v2.0</div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1">
          {/* Tabs - Design System Style */}
          <div className="flex gap-8 mb-10 border-b border-zinc-900">
            <button
              onClick={() => setActiveTab('subjects')}
              className={cn(
                "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                activeTab === 'subjects' 
                  ? "text-white" 
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              נושאים
              {activeTab === 'subjects' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-orange-500 shadow-[0_0_10px_#ff5722]" />}
            </button>
            <button
              onClick={() => setActiveTab('pomodoro')}
              className={cn(
                "pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative",
                activeTab === 'pomodoro' 
                  ? "text-white" 
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              פומודורו
              {activeTab === 'pomodoro' && <div className="absolute bottom-0 right-0 left-0 h-0.5 bg-orange-500 shadow-[0_0_10px_#ff5722]" />}
            </button>
          </div>

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-zinc-800" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 text-right">מאגר נושאי עבודה</h4>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const json = JSON.stringify(localSubjects, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `work-subjects-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <Download size={14} />
                  ייצוא
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'application/json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const json = JSON.parse(event.target?.result as string);
                            if (Array.isArray(json)) {
                              setLocalSubjects(json);
                            } else {
                              alert('קובץ לא תקין');
                            }
                          } catch (error) {
                            alert('שגיאה בטעינה');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <Upload size={14} />
                  ייבוא
                </button>
                <button
                  onClick={() => {
                    const newSubject: WorkSubject = {
                      id: `subject-${Date.now()}`,
                      name: 'נושא חדש',
                      color: '#ff5722',
                      iconName: 'Code',
                    };
                    setLocalSubjects([...localSubjects, newSubject]);
                    setEditingSubject(newSubject);
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 flex items-center gap-2 transition-colors"
                >
                  <Plus size={14} />
                  הוסף נושא
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {localSubjects.map(subject => {
                const Icon = ICON_MAP[subject.iconName] || ICON_MAP['Circle'];
                const isEditing = editingSubject?.id === subject.id;
                return (
                  <div key={subject.id} className="group border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 transition-all overflow-hidden rounded-sm">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-1 h-6 shrink-0" style={{ backgroundColor: subject.color }} />
                        <div className="p-2.5 bg-black rounded-sm shrink-0" style={{ color: subject.color }}>
                          <Icon size={16} />
                        </div>
                        <span className="text-sm font-bold text-zinc-200">{subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingSubject(isEditing ? null : subject)}
                          className="p-2 text-zinc-600 hover:text-white transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('מחיקת נושא זה?')) {
                              setLocalSubjects(localSubjects.filter(s => s.id !== subject.id));
                              if (isEditing) setEditingSubject(null);
                            }
                          }}
                          className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subject Editor - Design System Style */}
            {editingSubject && (
              <div className="border border-orange-500/20 bg-orange-500/[0.02] mt-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-orange-500/10 p-4 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 italic">עורך פרוטוקול נושא</span>
                  <button onClick={() => setEditingSubject(null)} className="text-zinc-600 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <SubjectEditor
                  subject={editingSubject}
                  onSave={(updated) => {
                    setLocalSubjects(localSubjects.map(s => 
                      s.id === updated.id ? updated : s
                    ));
                    setEditingSubject(null);
                  }}
                  onClose={() => setEditingSubject(null)}
                />
              </div>
            )}
          </div>
        )}

        {/* Pomodoro Tab */}
        {activeTab === 'pomodoro' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300 max-w-md">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">זמן עבודה (דקות)</label>
                <input
                  type="number"
                  value={localPomodoro.workMinutes}
                  onChange={(e) => setLocalPomodoro({ ...localPomodoro, workMinutes: parseInt(e.target.value) || 60 })}
                  className="w-full bg-black border border-zinc-900 text-white p-3 font-mono focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">זמן הפסקה (דקות)</label>
                <input
                  type="number"
                  value={localPomodoro.breakMinutes}
                  onChange={(e) => setLocalPomodoro({ ...localPomodoro, breakMinutes: parseInt(e.target.value) || 5 })}
                  className="w-full bg-black border border-zinc-900 text-white p-3 font-mono focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-900">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-300">התראות קוליות</span>
                <span className="text-[8px] text-zinc-600 uppercase tracking-widest font-mono">audio_signal_module</span>
              </div>
              <button
                onClick={() => setLocalPomodoro({ ...localPomodoro, soundsEnabled: !localPomodoro.soundsEnabled })}
                className={cn(
                  "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]",
                  localPomodoro.soundsEnabled
                    ? "bg-white text-black"
                    : "border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700"
                )}
              >
                {localPomodoro.soundsEnabled ? 'פעיל' : 'כבוי'}
              </button>
            </div>

            {localPomodoro.soundsEnabled && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">אות סיום עבודה</label>
                  <div className="flex gap-2">
                    <select
                      value={localPomodoro.workSound}
                      onChange={(e) => setLocalPomodoro({ ...localPomodoro, workSound: e.target.value })}
                      className="flex-1 bg-black border border-zinc-900 text-sm text-white p-3 focus:outline-none focus:border-orange-500/50 transition-colors appearance-none font-mono"
                    >
                      <option value="default" className="bg-black">DEFAULT_LOG</option>
                      <option value="bell" className="bg-black">SIGNAL_BELL</option>
                      <option value="chime" className="bg-black">DIGITAL_CHIME</option>
                      <option value="success" className="bg-black">SUCCESS_MELODY</option>
                      <option value="beep" className="bg-black">SYSTEM_BEEP</option>
                    </select>
                    <button
                      onClick={() => playSound(localPomodoro.workSound as any)}
                      className="px-4 border border-zinc-900 text-zinc-500 hover:text-orange-500 hover:border-orange-500/30 transition-all bg-black/50"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">אות סיום הפסקה</label>
                  <div className="flex gap-2">
                    <select
                      value={localPomodoro.breakSound}
                      onChange={(e) => setLocalPomodoro({ ...localPomodoro, breakSound: e.target.value })}
                      className="flex-1 bg-black border border-zinc-900 text-sm text-white p-3 focus:outline-none focus:border-orange-500/50 transition-colors appearance-none font-mono"
                    >
                      <option value="default" className="bg-black">DEFAULT_LOG</option>
                      <option value="bell" className="bg-black">SIGNAL_BELL</option>
                      <option value="chime" className="bg-black">DIGITAL_CHIME</option>
                      <option value="success" className="bg-black">SUCCESS_MELODY</option>
                      <option value="beep" className="bg-black">SYSTEM_BEEP</option>
                    </select>
                    <button
                      onClick={() => playSound(localPomodoro.breakSound as any)}
                      className="px-4 border border-zinc-900 text-zinc-500 hover:text-orange-500 hover:border-orange-500/30 transition-all bg-black/50"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        </div>
        
        {/* Footer Actions */}
        <div className="p-8 border-t border-zinc-900 bg-zinc-900/10">
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="px-10 bg-white text-black py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            >
              שמור שינויים
            </button>
            <button
              onClick={onClose}
              className="px-10 bg-zinc-900 text-zinc-400 py-4 text-xs font-black uppercase tracking-[0.2em] hover:text-white transition-all border border-zinc-800"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- Subject Editor Component ---

interface SubjectEditorProps {
  subject: WorkSubject;
  onSave: (subject: WorkSubject) => void;
  onClose: () => void;
}

function SubjectEditor({ subject, onSave, onClose }: SubjectEditorProps) {
  const [name, setName] = useState(subject.name);
  const [color, setColor] = useState(subject.color);
  const [iconName, setIconName] = useState(subject.iconName);

  return (
    <div className="p-8 space-y-8 bg-zinc-950/50">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">שם הנושא</label>
          <input 
            autoFocus
            className="w-full bg-black border border-zinc-900 p-4 rounded-sm outline-none focus:border-orange-500/50 transition-colors text-sm font-bold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="הזן שם נושא..."
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">מזהה ויזואלי (אייקון)</label>
          <div className="grid grid-cols-8 gap-2">
            {AVAILABLE_ICONS.map(icon => {
              const IconComponent = ICON_MAP[icon];
              const isSelected = iconName === icon;
              if (!IconComponent) return null;
              return (
                <button
                  key={icon}
                  onClick={() => setIconName(icon)}
                  className={cn(
                    "p-3 rounded-sm border transition-all flex items-center justify-center",
                    isSelected 
                      ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                      : "bg-black border-zinc-900 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                  )}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">אנרגיית צבע (ACCENT)</label>
        <div className="flex flex-wrap gap-3">
          {NEON_COLORS.map((c: string) => (
            <button 
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all relative",
                color === c 
                  ? "scale-125 border-white shadow-[0_0_15px_currentColor]" 
                  : "border-transparent hover:scale-110"
              )}
              style={{ backgroundColor: c, color: c }}
            >
              {color === c && <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />}
            </button>
          ))}
        </div>

      </div>

      <div className="flex gap-4 pt-6 border-t border-zinc-900">
        <button
          onClick={() => onSave({ ...subject, name, color, iconName })}
          className="flex-1 bg-white text-black py-4 rounded-sm font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          שמור נושא
        </button>
        <button
          onClick={onClose}
          className="px-8 bg-zinc-900 text-zinc-500 py-4 rounded-sm font-black uppercase text-xs tracking-widest hover:text-white transition-all border border-zinc-800"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

