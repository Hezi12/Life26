"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  ChevronRight, 
  ChevronLeft, 
  Target, 
  Settings, 
  Plus, 
  Briefcase, 
  User, 
  Dumbbell, 
  Moon, 
  Coffee, 
  Zap, 
  Book, 
  Bed, 
  Camera,
  X,
  Check,
  Search,
  Trash2,
  Clock,
  Heart,
  Gamepad2,
  Music,
  ShoppingBag,
  Car,
  Plane,
  Utensils,
  GraduationCap,
  Activity,
  Circle,
  Monitor,
  Calendar, 
  List, 
  Compass,
  Film,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, Event } from "@/lib/types";
import { ICON_MAP, NEON_COLORS, INITIAL_CATEGORIES, AVAILABLE_ICONS } from "@/lib/constants";
import { ParserModal } from "@/components/ParserModal";
import { api } from "@/lib/api";

const INITIAL_EVENTS: Event[] = [];

// --- TYPES ---

interface DaySpineProps {
  events: Event[];
  categories: Category[];
  currentDate: Date;
}

interface MonthlyAnalyticsProps {
  events: Event[];
  categories: Category[];
  currentDate: Date;
}

// --- UTILS ---

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// --- COMPONENTS ---

/**
 * Vertical spine visualization of the daily timeline.
 */
function DaySpine({ events, categories, currentDate }: DaySpineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const defaultCategory = categories.find(c => c.id === "0") || categories[0];

  // REAL-TIME UPDATE
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // DATA SEGMENTS
  const segments = useMemo(() => {
    if (events.length === 0) return [];

    const totalMinutesInDay = 1440;
    const segmentsList = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const [hour, min] = event.time.split(':').map(Number);
      const startMinutes = hour * 60 + min;
      
      let endMinutes: number;
      const nextEvent = events[i + 1];
      
      if (!nextEvent) {
        endMinutes = startMinutes >= 1320 ? 1440 : startMinutes + 30;
      } else {
        const [nextH, nextM] = nextEvent.time.split(':').map(Number);
        endMinutes = nextH * 60 + nextM;
      }

      const duration = endMinutes - startMinutes;
      const startPercent = (startMinutes / totalMinutesInDay) * 100;
      let heightPercent = Math.max(1, (duration / totalMinutesInDay) * 100);
      
      const category = categories.find(c => c.id === event.categoryId) || defaultCategory;

      segmentsList.push({
        event,
        category,
        startPercent,
        heightPercent,
        startMinutes,
        endMinutes
      });
    }

    return segmentsList;
  }, [events, categories, defaultCategory]);

  // SCANNER POSITION
  const currentTimePercent = useMemo(() => {
    const now = currentTime;
    const isToday = now.getDate() === currentDate.getDate() &&
                    now.getMonth() === currentDate.getMonth() &&
                    now.getFullYear() === currentDate.getFullYear();

    if (!isToday) return -1;

    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    return (totalMinutes / 1440) * 100;
  }, [currentTime, currentDate]);

  return (
    <div className="w-14 h-full flex-shrink-0 border-l border-zinc-900 bg-black/40 backdrop-blur-sm overflow-hidden relative">
      {/* HOUR MARKERS */}
      {[...Array(25)].map((_, i) => (
        <div 
          key={i} 
          className="absolute right-0 left-0 border-t border-zinc-900/30"
          style={{ top: `${(i / 24) * 100}%` }}
        />
      ))}

      {/* SEGMENTS */}
      {segments.map((segment) => {
        const Icon = ICON_MAP[segment.category.iconName] || Circle;
        const now = currentTime;
        const isToday = now.getDate() === currentDate.getDate() &&
                        now.getMonth() === currentDate.getMonth() &&
                        now.getFullYear() === currentDate.getFullYear();
        
        const isPast = isToday && segment.endMinutes <= (currentTimePercent / 100) * 1440;
        const isCurrent = isToday && 
                         segment.startMinutes <= (currentTimePercent / 100) * 1440 &&
                         segment.endMinutes > (currentTimePercent / 100) * 1440;

        return (
          <div
            key={segment.event.id}
            className={cn(
              "absolute left-[2px] right-[2px] flex items-center justify-center transition-all duration-500 rounded-[1px] overflow-hidden",
              isCurrent && "animate-gentle-pulse"
            )}
            style={{
              top: `${segment.startPercent}%`,
              height: `calc(${segment.heightPercent}% - 1px)`,
              backgroundColor: segment.category.color,
              opacity: isPast ? 0.15 : isCurrent ? 1 : 0.4,
              ...(isCurrent && {
                boxShadow: `0 0 15px ${segment.category.color}`,
                zIndex: 10
              })
            }}
          >
            {isCurrent && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent h-1/2 w-full -translate-y-full animate-scan opacity-30" />
            )}
            
            {segment.heightPercent > 3 && (
              <Icon 
                size={10}
                className={cn(
                  "text-white/90 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] relative z-10",
                  isCurrent && "animate-pulse"
                )}
                strokeWidth={isCurrent ? 3 : 2}
              />
            )}
          </div>
        );
      })}

      {/* SCANNER LINE */}
      {currentTimePercent >= 0 && (
        <div
          className="absolute left-0 right-0 h-[2px] z-50 transition-all duration-1000"
          style={{ top: `${currentTimePercent}%` }}
        >
          <div className="absolute inset-0 bg-orange-500 shadow-[0_0_15px_#f97316]" />
          <div className="absolute inset-0 bg-white blur-[1px] opacity-50 animate-pulse" />
          <div className="absolute -top-[20px] -bottom-[20px] left-0 right-0 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent opacity-30 animate-pulse" />
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] animate-ping" />
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] animate-ping delay-300" />
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  
  // Initialize with defaults first
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [dailyParserTexts, setDailyParserTexts] = useState<Record<string, string>>({});
  const [dailyPhotos, setDailyPhotos] = useState<Record<string, string>>({});

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isParserOpen, setIsParserOpen] = useState(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Load from API after mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadData = async () => {
      try {
        const [eventsData, categoriesData] = await Promise.all([
          api.getEvents(),
          api.getCategories(),
        ]);
        
        if (eventsData && Array.isArray(eventsData) && eventsData.length > 0) {
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
        
        // Load parser texts and photos from API
        const parserTextData = await api.getParserTexts(dateString);
        if (parserTextData) {
          setDailyParserTexts(prev => ({ ...prev, [dateString]: parserTextData.content || '' }));
        }
        
        const photoData = await api.getPhotos(dateString);
        if (photoData) {
          setDailyPhotos(prev => ({ ...prev, [dateString]: photoData.photoData }));
        }
      } catch (error) {
        console.error('Error loading from API:', error);
        // No fallback - API is required
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Synchronize events when they change elsewhere
  useEffect(() => {
    const handleSync = async () => {
      try {
        const eventsData = await api.getEvents();
        if (eventsData && Array.isArray(eventsData)) {
          setEvents(eventsData);
        }
        const parserTextData = await api.getParserTexts(dateString);
        if (parserTextData) {
          setDailyParserTexts(prev => ({ ...prev, [dateString]: parserTextData.content || '' }));
        }
      } catch (error) {
        console.error('Sync failed', error);
      }
    };

    window.addEventListener('life26-update' as any, handleSync);
    
    return () => {
      window.removeEventListener('life26-update' as any, handleSync);
    };
  }, [dateString]);

  const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  const formattedDate = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(currentDate);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            let width = img.width;
            let height = img.height;
            const maxWidth = 1920;
            const maxHeight = 1080;
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = width * ratio;
              height = height * ratio;
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setDailyPhotos(prev => ({ ...prev, [dateString]: compressedDataUrl }));
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDailyPhotos(prev => ({ ...prev, [dateString]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handlePhotoDelete = async () => {
    try {
      await api.deletePhotos(dateString);
      setDailyPhotos(prev => {
        const newPhotos = { ...prev };
        delete newPhotos[dateString];
        return newPhotos;
      });
    } catch (error) {
      console.error('Failed to delete photo', error);
    }
  };

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    // Save events to API
    const saveEvents = async () => {
      try {
        for (const event of events) {
          await api.saveEvent(event);
        }
        // Notify other pages
        window.dispatchEvent(new CustomEvent('life26-update', { 
          detail: { type: 'events-updated', source: 'schedule-page' } 
        }));
      } catch (error) {
        console.error('Failed to save events to API', error);
        // No fallback - API is required
      }
    };
    
    saveEvents();
  }, [events, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    // Save categories to API
    const saveCategories = async () => {
      try {
        for (const category of categories) {
          await api.saveCategory(category);
        }
      } catch (error) {
        console.error('Failed to save categories to API', error);
        // No fallback - API is required
      }
    };
    
    saveCategories();
  }, [categories, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    // Save parser texts to API
    const saveParserTexts = async () => {
      try {
        for (const [dateStr, content] of Object.entries(dailyParserTexts)) {
          await api.saveParserTexts({
            id: `parser-${dateStr}`,
            dateString: dateStr,
            content: content as string,
          });
        }
      } catch (error) {
        console.error('Failed to save parser texts to API', error);
      }
    };
    
    saveParserTexts();
  }, [dailyParserTexts, isLoaded]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    
    // Save photos to API
    const savePhotos = async () => {
      try {
        for (const [dateStr, photoData] of Object.entries(dailyPhotos)) {
          await api.savePhotos({
            id: `photo-${dateStr}`,
            dateString: dateStr,
            photoData: photoData as string,
          });
        }
      } catch (error) {
        console.error('Failed to save photos to API', error);
      }
    };
    
    savePhotos();
  }, [dailyPhotos, isLoaded]);

  const dailyEvents = useMemo(() => {
    return events
      .filter(e => e.dateString === dateString)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [events, dateString]);

  const currentEventIndex = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (dateString !== today || dailyEvents.length === 0) return -1;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMin;
    for (let i = 0; i < dailyEvents.length; i++) {
      const [eventHour, eventMin] = dailyEvents[i].time.split(':').map(Number);
      const eventMinutes = eventHour * 60 + eventMin;
      if (currentMinutes >= eventMinutes) {
        if (i < dailyEvents.length - 1) {
          const [nextHour, nextMin] = dailyEvents[i + 1].time.split(':').map(Number);
          const nextMinutes = nextHour * 60 + nextMin;
          if (currentMinutes < nextMinutes) return i;
        } else if (eventMinutes >= 22 * 60) return i;
      }
    }
    return -1;
  }, [dailyEvents, dateString]);

  useEffect(() => {
    if (!timelineScrollRef.current || currentEventIndex === -1) return;
    setTimeout(() => {
      if (!timelineScrollRef.current) return;
      const container = timelineScrollRef.current;
      const eventElements = container.querySelectorAll('[data-event-index]');
      const targetElement = eventElements[currentEventIndex] as HTMLElement;
      if (targetElement) {
        const containerHeight = container.clientHeight;
        const eventTop = targetElement.offsetTop;
        const eventHeight = targetElement.offsetHeight;
        container.scrollTop = eventTop - (containerHeight / 2) + (eventHeight / 2);
      }
    }, 100);
  }, [currentEventIndex]);

  const categoryDurations = useMemo(() => {
    const durations: Record<string, number> = {};
    categories.forEach(cat => durations[cat.id] = 0);
    if (dailyEvents.length === 0) return durations;
    for (let i = 0; i < dailyEvents.length - 1; i++) {
      const current = dailyEvents[i];
      const next = dailyEvents[i + 1];
      const [currentHour, currentMin] = current.time.split(':').map(Number);
      const [nextHour, nextMin] = next.time.split(':').map(Number);
      const durationMinutes = (nextHour * 60 + nextMin) - (currentHour * 60 + currentMin);
      durations[current.categoryId] += durationMinutes;
    }
    const lastEvent = dailyEvents[dailyEvents.length - 1];
    if (lastEvent) {
      const [lastHour, lastMin] = lastEvent.time.split(':').map(Number);
      const lastEventTime = lastHour * 60 + lastMin;
      if (lastEventTime >= 22 * 60) {
        durations[lastEvent.categoryId] += (24 * 60) - lastEventTime;
      }
    }
    return durations;
  }, [dailyEvents, categories]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-black text-white font-mono" dir="rtl">
      
      {/* Header - Aligned with Computer Page */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 p-4 sm:p-6 border-b border-zinc-900 bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <h1 className="text-xl font-black italic tracking-[0.2em] text-white">DAILY OPS</h1>
          
          <div className="flex items-center gap-3 bg-zinc-900/30 p-1 border border-zinc-800 rounded-sm">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 hover:bg-white/10 transition-colors"
            >
              היום
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <div className="text-xs font-bold text-orange-500 px-2 min-w-[140px] text-center">
              {formattedDate}
            </div>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
              className="p-1 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-zinc-900/30 p-1 border border-zinc-800 rounded-sm">
            <button 
              onClick={() => setViewMode('daily')}
              className={cn(
                "px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all",
                viewMode === 'daily' ? "bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "text-zinc-600 hover:text-white"
              )}
            >
              Daily
            </button>
            <button 
              onClick={() => setViewMode('monthly')}
              className={cn(
                "px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all",
                viewMode === 'monthly' ? "bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "text-zinc-600 hover:text-white"
              )}
            >
              Monthly
            </button>
          </div>
          
          <button 
            onClick={() => setIsParserOpen(true)}
            className="p-2 border border-zinc-800 hover:border-orange-500 hover:text-orange-500 text-zinc-500 rounded-sm transition-all group"
            title="הוסף אירוע"
          >
            <Plus size={18} className="group-hover:drop-shadow-[0_0_8px_currentColor]" />
          </button>
          
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="p-2 text-zinc-500 hover:text-orange-500 transition-all hover:scale-110"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {viewMode === 'daily' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* 1. MAIN GRID (Daily View) - Mobile: column, Desktop: grid */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-0 overflow-hidden">
              {/* Timeline Column (Cols 1-5) - Mobile: full width */}
              <div className="flex-1 md:col-span-5 border-l border-zinc-900 bg-[#050505] flex flex-col overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-zinc-900 bg-zinc-950/20 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-orange-500 shadow-[0_0_8px_#ff5722]" />
                    <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">TIMELINE</h2>
                  </div>
                </div>

                <div ref={timelineScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                  <div className="space-y-3 relative">
                    {dailyEvents.length > 0 ? (
                      dailyEvents.map((event, index) => {
                        const defaultCategory = categories.find(c => c.id === "0") || categories[0];
                        const category = categories.find(c => c.id === event.categoryId) || defaultCategory;
                        const Icon = ICON_MAP[category.iconName] || Briefcase;
                        const isCurrent = index === currentEventIndex;

                        return (
                          <div key={event.id} data-event-index={index} className="relative pr-6">
                            {/* Timeline Line */}
                            <div className="absolute right-0 top-0 bottom-0 w-px bg-zinc-900/50" />
                            
                            <div className={cn(
                              "transition-all duration-500 group relative py-4 px-6 border rounded-sm flex items-center gap-8 overflow-hidden",
                              isCurrent 
                                ? "bg-zinc-900/60 border-zinc-800 shadow-[0_0_25px_rgba(0,0,0,0.5)]" 
                                : "border-transparent hover:bg-zinc-900/20 hover:border-zinc-900/50"
                            )}>
                              {/* Active Indicator Background */}
                              {isCurrent && (
                                <>
                                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/[0.03] pointer-events-none" />
                                  <div className="absolute -right-4 top-0 bottom-0 w-24 bg-orange-500/5 skew-x-[20deg] pointer-events-none" 
                                       style={{ backgroundColor: `${category.color}10` }} />
                                </>
                              )}

                              {/* Status Bar */}
                              <div className={cn(
                                "absolute right-[-1px] top-0 bottom-0 w-1 transition-all duration-500 z-10",
                                isCurrent ? "opacity-100 shadow-[0_0_15px_currentColor]" : "opacity-0 group-hover:opacity-40"
                              )}
                                style={{ backgroundColor: category.color }} />
                              
                              {/* Time & Icon Block */}
                              <div className="flex items-center gap-5 shrink-0 min-w-[120px] relative z-10">
                                <div className={cn(
                                  "p-3 rounded-sm border transition-all duration-500 bg-black shadow-inner relative",
                                  isCurrent ? "border-zinc-700 scale-110 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-zinc-900 group-hover:border-zinc-700"
                                )}
                                  style={{ 
                                    color: category.color,
                                    ...(isCurrent && { boxShadow: `0 0 20px ${category.color}40` })
                                  }}>
                                  <Icon size={18} strokeWidth={isCurrent ? 3 : 2} className={cn(isCurrent && "animate-gentle-pulse")} />
                                  
                                  {/* Pulsing Dot Next to Icon */}
                                  {isCurrent && (
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping absolute opacity-75" />
                                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316] relative z-20" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col justify-center">
                                  <span className={cn(
                                    "text-base font-black tracking-tighter font-mono tabular-nums leading-none transition-all",
                                    isCurrent ? "text-white" : "text-[#71717a]"
                                  )}>
                                    {event.time}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Title & Category Content */}
                              <div className="flex-1 flex flex-col justify-center overflow-hidden relative z-10">
                                <div className={cn(
                                  "text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 transition-opacity",
                                  isCurrent ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                                )}
                                  style={{ color: category.color }}>
                                  {category.name}
                                </div>
                                <div className={cn(
                                  "text-lg font-bold tracking-tight transition-all truncate",
                                  isCurrent ? "text-white scale-[1.02] origin-right" : "text-zinc-500 group-hover:text-zinc-200"
                                )}>
                                  {event.title.replace(/:.*/, '').trim()}
                                </div>
                              </div>

                              {/* Scanning Effect for current event */}
                              {isCurrent && (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 z-0">
                                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[10%] w-full animate-scan" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-zinc-900/50 rounded-sm">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-800 italic">אין נתונים ביומן</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dashboard Column (Cols 6-12) */}
              <div className="col-span-7 flex flex-col overflow-hidden bg-black">
                {/* Photo Widget */}
            <div className="h-[45%] border-b border-zinc-900 bg-zinc-950/10 p-8 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-zinc-700" />
                  <h2 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">VISUAL LOG</h2>
                </div>
              </div>

              <div className="flex-1 relative group overflow-hidden border border-zinc-900 bg-black/40 rounded-sm shadow-inner">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                {dailyPhotos[dateString] ? (
                  <>
                    <img src={dailyPhotos[dateString]} alt="Daily visual" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 ease-in-out" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-all duration-700 pointer-events-none" />
                    <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0">
                      <button onClick={handlePhotoDelete} className="p-3 bg-black/80 hover:bg-red-500 text-white rounded-sm border border-zinc-800"><Trash2 size={14} /></button>
                      <label htmlFor="photo-upload" className="p-3 bg-black/80 hover:bg-white hover:text-black text-white rounded-sm cursor-pointer border border-zinc-800"><Camera size={14} /></label>
                    </div>
                  </>
                ) : (
                  <label htmlFor="photo-upload" className="h-full flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/[0.02] transition-all group/label">
                    <div className="p-8 border border-dashed border-zinc-800 rounded-full group-hover/label:border-orange-500/50 transition-colors">
                      <Camera size={48} strokeWidth={1} className="text-zinc-800 group-hover/label:text-orange-500 transition-all opacity-40 group-hover/label:scale-110" />
                    </div>
                  </label>
                )}
              </div>
            </div>

                {/* Metrics Widget */}
                <div className="flex-1 bg-black p-4 sm:p-6 md:p-8 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-orange-500 shadow-[0_0_8px_#ff5722]" />
                      <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">METRICS</h2>
                    </div>
                    <Activity size={14} className="sm:w-4 sm:h-4 text-zinc-800 animate-pulse" />
                  </div>

                  {(() => {
                    const activeCategories = categories.filter(cat => (categoryDurations[cat.id] || 0) > 0);
                    const noCategory = categories.find(c => c.id === "0");
                    const hasNoCategoryDuration = (categoryDurations["0"] || 0) > 0;
                    
                    if (activeCategories.length === 0 && !hasNoCategoryDuration) {
                      return (
                        <div className="flex flex-col items-center justify-center flex-1 text-zinc-800 border border-dashed border-zinc-900 rounded-sm">
                          <Activity size={24} className="sm:w-8 sm:h-8 opacity-20 mb-4" />
                        </div>
                      );
                    }
                    
                    const allActive = [...activeCategories];
                    if (hasNoCategoryDuration && !allActive.some(c => c.id === "0")) {
                      if (noCategory) allActive.push(noCategory);
                    }

                    const totalMinutes = allActive.reduce((sum, cat) => sum + (categoryDurations[cat.id] || 0), 0);
                    const sortedCategories = [...allActive].sort((a, b) => (categoryDurations[b.id] || 0) - (categoryDurations[a.id] || 0));
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    let currentOffset = 0;
                    const pieSegments = allActive.map(cat => {
                      const duration = categoryDurations[cat.id] || 0;
                      const percentage = (duration / totalMinutes) * 100;
                      const dashLength = (percentage / 100) * circumference;
                      const segment = { cat, duration, percentage, dashLength, offset: currentOffset };
                      currentOffset -= dashLength;
                      return segment;
                    });
                    const totalHours = Math.floor(totalMinutes / 60);
                    const totalMins = totalMinutes % 60;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 flex-1 items-center">
                        <div className="space-y-3 sm:space-y-4">
                          {sortedCategories.slice(0, 8).map(cat => {
                            const duration = categoryDurations[cat.id] || 0;
                            const percentage = (duration / totalMinutes) * 100;
                            return (
                              <div key={cat.id} className="space-y-2 group/metric">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-1.5 h-4 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: cat.color, color: cat.color }} />
                                    <span className="text-[10px] sm:text-xs text-zinc-300 font-black group-hover/metric:text-white transition-colors tracking-widest uppercase">{cat.name}</span>
                                  </div>
                                  <div className="flex items-baseline gap-2 sm:gap-3">
                                    <span className="text-xs sm:text-sm font-black text-white" style={{ color: cat.color }}>{Math.round(percentage)}%</span>
                                    <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono font-bold">
                                      {Math.floor(duration/60)}<span className="text-[7px] sm:text-[8px] mx-0.5">H</span>
                                      {duration%60}<span className="text-[7px] sm:text-[8px] mx-0.5">M</span>
                                    </span>
                                  </div>
                                </div>
                                <div className="h-1 bg-zinc-900/50 w-full relative overflow-hidden rounded-full">
                                  <div className="absolute top-0 right-0 h-full transition-all duration-1000"
                                    style={{ width: `${percentage}%`, backgroundColor: cat.color, boxShadow: `0 0 12px ${cat.color}60` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="relative w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0 mx-auto">
                          <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#0a0a0a" strokeWidth="8" />
                            {pieSegments.map((segment) => (
                              <circle key={segment.cat.id} cx="50" cy="50" r="40" fill="none" stroke={segment.cat.color} strokeWidth="8"
                                strokeDasharray={`${segment.dashLength} ${circumference}`} strokeDashoffset={segment.offset}
                                className="transition-all duration-700" style={{ filter: `drop-shadow(0 0 4px ${segment.cat.color}40)` }} />
                            ))}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-lg sm:text-xl font-black text-white tracking-tighter">{totalHours > 0 ? `${totalHours}ש ` : ''}{totalMins}ד</div>
                            <div className="text-[7px] sm:text-[8px] font-black text-orange-500 uppercase tracking-[0.3em] mt-1">ACTIVE TIME</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* 2. DAY SPINE (Daily View only) - Mobile: hidden or simplified */}
            <div className="hidden md:block">
              <DaySpine 
                events={dailyEvents}
                categories={categories}
                currentDate={currentDate}
              />
            </div>
          </div>
        ) : (
          /* MONTHLY VIEW CONTAINER */
          <div className="flex-1 flex overflow-hidden">
            <MonthlyAnalytics events={events} categories={categories} currentDate={currentDate} />
          </div>
        )}
      </div>

      {/* Modals */}
      {isCategoryModalOpen && <CategoryModal categories={categories} onClose={() => setIsCategoryModalOpen(false)} onSave={setCategories} />}
      {isParserOpen && (
        <ParserModal dateString={dateString} categories={categories} existingEvents={dailyEvents} initialText={dailyParserTexts[dateString] || ""} 
          onClose={() => setIsParserOpen(false)} onSave={async (newEvents: Event[], inputText: string) => {
            setEvents(prev => [...prev.filter(e => e.dateString !== dateString), ...newEvents]);
            setDailyParserTexts(prev => ({...prev, [dateString]: inputText}));
            
            // Save parser text to API
            try {
              await api.saveParserTexts({
                id: `parser-${dateString}`,
                dateString,
                content: inputText,
              });
            } catch (error) {
              console.error('Failed to save parser text', error);
            }
            
            setIsParserOpen(false);
          }}
        />
      )}
    </div>
  );
}

// --- Modals Components ---

function MonthlyAnalytics({ events, categories, currentDate }: MonthlyAnalyticsProps) {
  // MONTH GRID DATA (42 DAYS)
  const data = useMemo(() => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); 
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startOffset);
    
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dayEvents = events
        .filter(e => e.dateString === ds)
        .sort((a, b) => a.time.localeCompare(b.time));
        
      const durations: Record<string, number> = {};
      categories.forEach(c => durations[c.id] = 0);
      
      if (dayEvents.length > 0) {
        for (let j = 0; j < dayEvents.length - 1; j++) {
          const start = timeToMinutes(dayEvents[j].time);
          const end = timeToMinutes(dayEvents[j+1].time);
          durations[dayEvents[j].categoryId] += (end - start);
        }
        const last = dayEvents[dayEvents.length - 1];
        const lastStart = timeToMinutes(last.time);
        if (lastStart >= 1320) durations[last.categoryId] += (1440 - lastStart);
      }
      
      const totalMinutes = Object.values(durations).reduce((a, b) => a + b, 0);
      const sortedDayCats = Object.entries(durations)
        .filter(([_, mins]) => mins > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([id, mins]) => ({
          category: categories.find(c => c.id === id) || categories[0],
          minutes: mins
        }));
      
      days.push({
        date: d,
        dateString: ds,
        durations,
        totalMinutes,
        topCategories: sortedDayCats,
        isCurrentMonth: d.getMonth() === month
      });
    }
    return days;
  }, [events, categories, currentDate]);

  // GLOBAL STATISTICS
  const globalStats = useMemo(() => {
    const totals: Record<string, number> = {};
    categories.forEach(c => totals[c.id] = 0);
    
    data.forEach(day => {
      Object.entries(day.durations).forEach(([id, mins]) => {
        totals[id] = (totals[id] || 0) + mins;
      });
    });
    
    return Object.entries(totals)
      .map(([id, mins]) => ({
        category: categories.find(c => c.id === id) || categories[0],
        minutes: mins
      }))
      .filter(s => s.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  }, [data, categories]);

  const totalMonthlyMinutes = globalStats.reduce((a, b) => a + b.minutes, 0);

  return (
    <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden bg-[#020202]">
      {/* MATRIX VIEW */}
      <div className="col-span-9 border-l border-zinc-900 p-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-orange-500 shadow-[0_0_8px_#f97316]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Chronos_Matrix</h2>
            <span className="text-[10px] text-zinc-600 font-mono ml-4 uppercase tracking-widest">
              {currentDate.toLocaleString('he-IL', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-4 flex-wrap justify-end max-w-[60%]">
            {globalStats.slice(0, 12).map(s => (
              <div key={s.category.id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.category.color }} />
                <span className="text-[8px] font-mono text-zinc-600 uppercase font-bold">{s.category.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1.5 min-h-0">
          {data.map((day, i) => (
            <div key={i} className={cn(
              "group relative border rounded-sm overflow-hidden flex flex-col p-2 transition-all hover:bg-zinc-900/10",
              day.isCurrentMonth ? "bg-zinc-950/20 border-white/[0.03]" : "bg-black/40 border-transparent opacity-20"
            )}>
              <div className="flex justify-between items-center mb-1.5">
                <span className={cn(
                  "text-[10px] font-black font-mono transition-colors",
                  day.isCurrentMonth ? "text-zinc-600 group-hover:text-zinc-400" : "text-zinc-800"
                )}>
                  {day.date.getDate().toString().padStart(2, '0')}
                </span>
                {day.totalMinutes > 0 && day.isCurrentMonth && (
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_5px_#f97316]" />
                )}
              </div>
              
              {day.totalMinutes > 0 && day.isCurrentMonth && (
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="bg-zinc-900/40 border border-zinc-800/50 p-1.5 rounded-sm flex flex-col items-center justify-center">
                    <div className="text-[11px] font-black text-white tabular-nums leading-none">
                      {(day.totalMinutes / 60).toFixed(1)}<span className="text-[7px] text-orange-500 ml-0.5 font-bold">H</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    {day.topCategories.map((tc, idx) => (
                      <div key={idx} className="flex flex-col bg-black/40 border-r-2 border-zinc-900 p-1 rounded-sm overflow-hidden"
                           style={{ borderRightColor: tc.category.color }}>
                        <div className="text-[6px] font-black text-zinc-500 uppercase truncate leading-tight mb-0.5">
                          {tc.category.name}
                        </div>
                        <div className="text-[8px] font-mono font-bold text-white leading-tight">
                          {(tc.minutes / 60).toFixed(1)}<span className="text-[6px] text-zinc-600 ml-0.5">h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DIAGNOSTIC POPUP */}
              {day.isCurrentMonth && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-[100] pointer-events-none flex items-center justify-center">
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] max-h-[500px] bg-[#080808] border border-zinc-700 rounded-sm shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col p-6 backdrop-blur-3xl transition-all scale-95 group-hover:scale-100 ring-1 ring-white/10">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
                      <div className="flex flex-col">
                        <div className="text-sm text-orange-500 font-black uppercase italic tracking-[0.2em]">
                          {new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(day.date)}
                        </div>
                        <div className="text-[8px] text-zinc-600 font-mono tracking-[0.3em] mt-1">CHRONOS_ANALYSIS_STATION // {day.dateString}</div>
                      </div>
                      <div className="p-2 bg-zinc-900/50 rounded-sm border border-zinc-800">
                        <Activity size={16} className="text-orange-500 animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                      {day.totalMinutes > 0 ? (
                        Object.entries(day.durations)
                          .filter(([_, mins]) => mins > 0)
                          .sort((a, b) => b[1] - a[1])
                          .map(([id, mins]) => {
                            const cat = categories.find(c => c.id === id);
                            const dayPercentage = Math.round((mins / day.totalMinutes) * 100);
                            return (
                              <div key={id} className="space-y-2 group/pop">
                                <div className="flex justify-between items-end">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-1.5 h-4 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: cat?.color, color: cat?.color }} />
                                    <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest group-hover/pop:text-white transition-colors">{cat?.name}</span>
                                  </div>
                                  <div className="flex items-baseline gap-3 shrink-0">
                                    <span className="text-xs font-mono font-bold text-white">{Math.floor(mins/60)}h {mins%60}m</span>
                                    <span className="text-[10px] font-black text-orange-500 font-mono">{dayPercentage}%</span>
                                  </div>
                                </div>
                                <div className="h-1.5 bg-zinc-900/80 w-full rounded-full overflow-hidden border border-zinc-800/30">
                                  <div className="h-full transition-all duration-1000 ease-out" 
                                       style={{ width: `${dayPercentage}%`, backgroundColor: cat?.color, boxShadow: `0 0 15px ${cat?.color}60` }} />
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="h-48 flex flex-col items-center justify-center gap-4 opacity-30 border border-dashed border-zinc-900 rounded-sm">
                          <Activity size={32} className="text-zinc-800" />
                          <span className="text-[10px] text-zinc-700 uppercase font-black tracking-[0.4em] italic">System_Idle_Mode</span>
                        </div>
                      )}
                    </div>

                    {day.totalMinutes > 0 && (
                      <div className="mt-6 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-8 shrink-0">
                        <div className="space-y-1">
                          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block">Total_Planned</span>
                          <span className="text-2xl font-black text-white font-mono leading-none tracking-tighter tabular-nums">
                            {Math.floor(day.totalMinutes/60)}<span className="text-xs mx-0.5 text-zinc-500">H</span>
                            {day.totalMinutes%60}<span className="text-xs text-zinc-500">M</span>
                          </span>
                        </div>
                        <div className="space-y-1 text-left">
                          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block text-right">Day_Load</span>
                          <div className="flex items-center justify-end gap-3 mt-1">
                            <span className="text-xl font-black text-orange-500 font-mono italic leading-none">
                              {Math.round((day.totalMinutes / 1440) * 100)}%
                            </span>
                            <div className="w-1 h-6 bg-orange-500/20 rounded-full overflow-hidden">
                              <div className="w-full bg-orange-500 transition-all duration-1000" style={{ height: `${(day.totalMinutes / 1440) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ANALYTICS SIDEBAR */}
      <div className="col-span-3 flex flex-col overflow-hidden bg-black border-r border-white/[0.03]">
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-b border-white/[0.03] min-h-0">
          <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#0a0a0a" strokeWidth="6" />
              {(() => {
                let offset = 0;
                const circumference = 282.74; // 2 * PI * 45
                return globalStats.map(s => {
                  const percent = (s.minutes / totalMonthlyMinutes) * 100;
                  const dash = (percent / 100) * circumference;
                  const currentOffset = offset;
                  offset -= dash;
                  return (
                    <circle 
                      key={s.category.id} 
                      cx="50" cy="50" r="45" fill="none" stroke={s.category.color} strokeWidth="6"
                      strokeDasharray={`${dash} ${circumference}`} strokeDashoffset={currentOffset}
                      className="transition-all duration-1000" style={{ filter: `drop-shadow(0 0 4px ${s.category.color}40)` }}
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-black text-white tabular-nums leading-none">
                {Math.floor(totalMonthlyMinutes / 60)}<span className="text-xs text-zinc-600 ml-1 font-mono">H</span>
              </div>
              <div className="text-[8px] font-black text-orange-500 uppercase tracking-[0.3em] mt-2">TOTAL_LOG</div>
            </div>
          </div>

          <div className="w-full space-y-4 overflow-y-auto pr-2 scrollbar-hide flex-1">
            {globalStats.map(s => {
              const percentage = Math.round((s.minutes / totalMonthlyMinutes) * 100);
              const hours = Math.floor(s.minutes / 60);
              return (
                <div key={s.category.id} className="flex flex-col gap-2 group/item">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-4 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: s.category.color, color: s.category.color }} />
                      <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest group-hover/item:text-white transition-colors truncate max-w-[100px]">{s.category.name}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-white font-mono">{hours}<span className="text-[8px] ml-0.5 text-zinc-500">H</span></span>
                        <span className="text-xs font-black text-orange-500 font-mono">{percentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-900/50 w-full rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" 
                         style={{ width: `${percentage}%`, backgroundColor: s.category.color, boxShadow: `0 0 10px ${s.category.color}60` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-[#050505] flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-orange-500" />
            <h3 className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-black">STAT_SUMMARY</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Active_Days</div>
              <div className="text-2xl font-black text-white italic tabular-nums">
                {data.filter(d => d.totalMinutes > 0 && d.isCurrentMonth).length}
                <span className="text-[10px] text-zinc-700 ml-1 not-italic">/{data.filter(d => d.isCurrentMonth).length}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Avg_Daily</div>
              <div className="text-2xl font-black text-orange-500 italic tabular-nums">
                {Math.round(totalMonthlyMinutes / Math.max(1, data.filter(d => d.totalMinutes > 0 && d.isCurrentMonth).length) / 60)}
                <span className="text-[10px] text-zinc-800 ml-1 not-italic">H</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function CategoryModal({ categories, onClose, onSave }: any) {
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState<Partial<Category>>({});

  const expandCategory = (cat: Category | null) => {
    if (cat) {
      setExpandedId(cat.id);
      setTempCategory({ ...cat });
    } else {
      const newId = Math.random().toString(36).substr(2, 9);
      setExpandedId(newId);
      setTempCategory({ id: newId, name: "", color: NEON_COLORS[0], iconName: "Zap", keywords: [] });
    }
  };

  const saveCategory = () => {
    if (expandedId && tempCategory.id) {
      const categoryToSave = { ...tempCategory, keywords: tempCategory.keywords || [] } as Category;
      if (localCategories.find(c => c.id === tempCategory.id)) {
        setLocalCategories(localCategories.map(c => c.id === tempCategory.id ? categoryToSave : c));
      } else {
        setLocalCategories([...localCategories, categoryToSave]);
      }
    }
    setExpandedId(null);
  };

  const deleteCategory = (id: string) => {
    if (id === "0") return;
    setLocalCategories(localCategories.filter(c => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 italic">CAT_CONFIG_MANAGER</div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-3 scrollbar-hide">
          {localCategories.map(cat => {
            const Icon = ICON_MAP[cat.iconName] || Briefcase;
            const isExpanded = expandedId === cat.id;
            return (
              <div key={cat.id} className="border border-zinc-900 bg-white/[0.01] rounded-sm overflow-hidden transition-all hover:bg-white/[0.03]">
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => isExpanded ? setExpandedId(null) : expandCategory(cat)}>
                  <div className="flex items-center gap-4">
                    <div className="w-1 h-6 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: cat.color, color: cat.color }} />
                    <div className="p-2 rounded-sm bg-black border border-zinc-800" style={{ color: cat.color }}><Icon size={16} /></div>
                    <span className="text-sm font-black text-zinc-300 uppercase tracking-widest">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {cat.id !== "0" && <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id); }} className="p-1.5 text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>}
                    <ChevronLeft size={16} className={cn("text-zinc-700 transition-transform duration-300", isExpanded && "rotate-[-90deg]")} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-zinc-900 p-6 space-y-6 bg-black/40">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Category_Label</label>
                        <input className="w-full bg-black border border-zinc-800 p-3 rounded-sm outline-none focus:border-orange-500/50 text-sm font-bold text-white transition-all" 
                          value={tempCategory.name || ""} onChange={e => setTempCategory({...tempCategory, name: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Icon_Interface</label>
                        <div className="grid grid-cols-8 gap-2">
                          {AVAILABLE_ICONS.map(iconName => {
                            const IconComp = ICON_MAP[iconName];
                            return <button key={iconName} onClick={() => setTempCategory({...tempCategory, iconName})} 
                              className={cn("p-2 rounded-sm border transition-all flex items-center justify-center", tempCategory.iconName === iconName ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-white")}><IconComp size={16} /></button>
                          })}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">Visual_Signature</label>
                        <div className="flex gap-3 flex-wrap">
                          {NEON_COLORS.map(color => (
                            <button key={color} onClick={() => setTempCategory({...tempCategory, color})} className={cn("w-8 h-8 rounded-sm border-2 transition-all", tempCategory.color === color ? "scale-110 border-white shadow-[0_0_15px_currentColor]" : "border-transparent opacity-40 hover:opacity-100")} style={{ backgroundColor: color, color: color }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button onClick={saveCategory} className="w-full bg-white text-black py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] hover:bg-orange-500 transition-all">Update_Register</button>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => expandCategory(null)} className="w-full py-6 border border-dashed border-zinc-900 text-zinc-700 hover:text-white hover:border-zinc-700 transition-all rounded-sm flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em]">
            <Plus size={16} /> Init_New_Category
          </button>
        </div>
        <div className="p-6 border-t border-zinc-900 bg-black/40">
          <button onClick={() => { onSave(localCategories); onClose(); }} className="w-full py-4 bg-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-orange-500 hover:text-black transition-all rounded-sm">Sync_And_Close</button>
        </div>
      </div>
    </div>
  );
}

// Analytics and other components below...
