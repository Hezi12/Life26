"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Target, 
  Calendar, 
  Repeat, 
  Monitor, 
  Palette,
  Zap,
  Plus 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParserModal } from "./ParserModal";
import { Category, Event } from "@/lib/types";
import { INITIAL_CATEGORIES } from "@/lib/constants";
import { api } from "@/lib/api";

const Sidebar = () => {
  const pathname = usePathname();
  const [time, setTime] = useState<Date | null>(null);
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [todayText, setTodayText] = useState<string>("");

  const today = new Date();
  const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadData = async () => {
      try {
        const categoriesData = await api.getCategories();
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);
        }
        
        const allEvents = await api.getEvents();
        const todayEventsData = allEvents.filter(e => e.dateString === dateString);
        setTodayEvents(todayEventsData);
        
        const parserTextData = await api.getParserTexts(dateString);
        setTodayText(parserTextData?.content || "");
      } catch (error) {
        console.error('Failed to load data', error);
        // No fallback - API is required
      }
    };
    
    loadData();
    
    // Refresh data periodically
    const interval = setInterval(loadData, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [dateString]);

  const getTodayData = async () => {
    if (typeof window === 'undefined') return { events: [], text: "" };
    
    try {
      const allEvents = await api.getEvents();
      const todayEventsData = allEvents.filter(e => e.dateString === dateString);
      
      const parserTextData = await api.getParserTexts(dateString);
      const todayTextData = parserTextData?.content || "";
      
      setTodayEvents(todayEventsData);
      setTodayText(todayTextData);
      
      return { events: todayEventsData, text: todayTextData };
    } catch (error) {
      console.error('Failed to load events', error);
      return { events: [], text: "" };
    }
  };

  const handleSave = async (newEvents: Event[], rawText: string) => {
    try {
      // 1. טעינת כל האירועים הקיימים של היום מה-API
      const allEvents = await api.getEvents();
      const allExistingEvents = allEvents.filter(e => e.dateString === dateString);
      
      // 2. הפרדה בין אירועים לעדכון, יצירה, ומחיקה
      const eventsToUpdate: Event[] = [];
      const eventsToCreate: Event[] = [];
      const incomingEventIds = new Set<string>();

      newEvents.forEach(eventData => {
        if (eventData.id) {
          // אם יש ID, זה אירוע קיים שצריך לעדכן
          eventsToUpdate.push(eventData);
          incomingEventIds.add(eventData.id);
        } else {
          // אם אין ID, זה אירוע חדש
          eventsToCreate.push(eventData);
        }
      });

      // 3. זיהוי אירועים למחיקה (קיימים במסד אבל לא ברשימה החדשה)
      const eventsToDelete = allExistingEvents.filter(
        existingEvent => !incomingEventIds.has(existingEvent.id)
      );

      // 4. ביצוע המחיקות
      for (const eventToDelete of eventsToDelete) {
        await api.deleteEvent(eventToDelete.id);
      }

      // 5. ביצוע העדכונים
      for (const eventToUpdate of eventsToUpdate) {
        await api.saveEvent(eventToUpdate);
      }

      // 6. יצירת אירועים חדשים
      for (const eventToCreate of eventsToCreate) {
        await api.saveEvent(eventToCreate);
      }

      // 7. שמירת parser text
      await api.saveParserTexts({
        id: `parser-${dateString}`,
        dateString,
        content: rawText,
      });

      setIsParserOpen(false);
      
      // Update local state
      setTodayEvents(newEvents);
      setTodayText(rawText);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('life26-update', { 
        detail: { type: 'events-updated', source: 'sidebar' } 
      }));
    } catch (error) {
      console.error('Failed to save events', error);
      // No fallback - API is required
    }
  };

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const navItems = [
    { href: "/focus", icon: Target, label: "Focus" },
    { href: "/schedule", icon: Calendar, label: "Schedule" },
    { href: "/mission", icon: Zap, label: "Mission" },
    { href: "/computer", icon: Monitor, label: "Computer" },
    { href: "/habits", icon: Repeat, label: "Habits" },
    { href: "/design-system", icon: Palette, label: "Design" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed right-0 top-0 h-screen w-16 bg-black border-l border-white/[0.03] flex flex-col items-center py-12 z-50 overflow-hidden md:flex hidden">
        {/* Decorative background element for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        
        <Link href="/" className="mb-16 flex flex-col items-center select-none cursor-pointer group relative z-10">
          {time ? (
            <div className="flex flex-col items-center leading-[0.75] gap-0">
              <span className="text-[28px] font-black text-orange-500 tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                {time.getHours().toString().padStart(2, '0')}
              </span>
              <span className="text-[24px] font-bold text-zinc-400 tabular-nums tracking-tighter">
                {time.getMinutes().toString().padStart(2, '0')}
              </span>
              <span className="text-[20px] font-medium text-zinc-700 tabular-nums tracking-tighter">
                {time.getSeconds().toString().padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-10">
              <div className="w-1 h-4 bg-white rounded-full" />
              <div className="w-1 h-4 bg-white rounded-full" />
              <div className="w-1 h-4 bg-white rounded-full" />
            </div>
          )}
        </Link>

        <nav className="flex flex-col gap-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative group transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={cn(
                    "transition-all duration-500",
                    isActive 
                      ? "text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]" 
                      : "text-zinc-800 group-hover:text-zinc-400"
                  )} 
                />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pb-4 flex flex-col items-center gap-6">
          <button
            onClick={async () => {
              await getTodayData();
              setIsParserOpen(true);
            }}
            className="w-8 h-8 flex items-center justify-center text-zinc-700 hover:text-orange-500 transition-all duration-300 group"
          >
            <Plus size={18} className="group-hover:drop-shadow-[0_0_8px_currentColor]" strokeWidth={1.5} />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <aside className="fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] bg-black/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-50 md:hidden px-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <Link href="/" className="flex items-center justify-center flex-1 h-16 relative group">
          <LayoutDashboard 
            size={24} 
            strokeWidth={pathname === '/' ? 2 : 1.5}
            className={cn(
              "transition-all duration-300",
              pathname === '/' 
                ? "text-orange-500" 
                : "text-zinc-600"
            )} 
          />
        </Link>
        
        {navItems.filter(item => item.href !== '/design-system' && item.href !== '/computer').map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center flex-1 h-full relative group transition-all duration-300"
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2 : 1.5}
                className={cn(
                  "transition-all duration-300",
                  isActive 
                    ? "text-orange-500" 
                    : "text-zinc-600"
                )} 
              />
            </Link>
          );
        })}

        <button
          onClick={async () => {
            await getTodayData();
            setIsParserOpen(true);
          }}
          className="flex items-center justify-center flex-1 h-full text-zinc-600 hover:text-orange-500 transition-all duration-300 group"
        >
          <div className="bg-orange-500 rounded-full p-2 shadow-lg shadow-orange-500/20 active:scale-90 transition-transform">
            <Plus size={22} className="text-white" strokeWidth={2.5} />
          </div>
        </button>
      </aside>

      {isParserOpen && (
        <ParserModal
          dateString={dateString}
          categories={categories}
          existingEvents={todayEvents}
          initialText={todayText}
          onClose={() => setIsParserOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default Sidebar;

