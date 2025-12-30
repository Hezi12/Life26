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
        
        const savedTexts = localStorage.getItem('life26-parser-texts');
        const texts = savedTexts ? JSON.parse(savedTexts) : {};
        setTodayText(texts[dateString] || "");
      } catch (error) {
        console.error('Failed to load data', error);
        // Fallback to localStorage
        const savedCategories = localStorage.getItem('life26-categories');
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories));
        }
        const savedEvents = localStorage.getItem('life26-events');
        const allEvents: Event[] = savedEvents ? JSON.parse(savedEvents) : [];
        setTodayEvents(allEvents.filter(e => e.dateString === dateString));
        const savedTexts = localStorage.getItem('life26-parser-texts');
        const texts = savedTexts ? JSON.parse(savedTexts) : {};
        setTodayText(texts[dateString] || "");
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
      
      const savedTexts = localStorage.getItem('life26-parser-texts');
      const texts = savedTexts ? JSON.parse(savedTexts) : {};
      const todayTextData = texts[dateString] || "";
      
      setTodayEvents(todayEventsData);
      setTodayText(todayTextData);
      
      return { events: todayEventsData, text: todayTextData };
    } catch (error) {
      console.error('Failed to load events', error);
      // Fallback to localStorage
      const savedEvents = localStorage.getItem('life26-events');
      const allEvents: Event[] = savedEvents ? JSON.parse(savedEvents) : [];
      const todayEventsData = allEvents.filter(e => e.dateString === dateString);
      
      const savedTexts = localStorage.getItem('life26-parser-texts');
      const texts = savedTexts ? JSON.parse(savedTexts) : {};
      const todayTextData = texts[dateString] || "";
      
      setTodayEvents(todayEventsData);
      setTodayText(todayTextData);
      
      return { events: todayEventsData, text: todayTextData };
    }
  };

  const handleSave = async (newEvents: Event[], rawText: string) => {
    try {
      // Get all existing events
      const allEvents = await api.getEvents();
      
      // Filter out today's events and add new ones
      const filteredEvents = allEvents.filter(e => e.dateString !== dateString);
      const updatedEvents = [...filteredEvents, ...newEvents];
      
      // Save all events to API
      for (const event of updatedEvents) {
        await api.saveEvent(event);
      }
      
      // Save parser text to localStorage (still local for now)
      const savedTexts = localStorage.getItem('life26-parser-texts');
      const texts = savedTexts ? JSON.parse(savedTexts) : {};
      texts[dateString] = rawText;
      localStorage.setItem('life26-parser-texts', JSON.stringify(texts));
      
      setIsParserOpen(false);
      
      // Update local state
      setTodayEvents(newEvents);
      setTodayText(rawText);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('life26-update', { 
        detail: { type: 'eventsUpdated', source: 'sidebar' } 
      }));
    } catch (error) {
      console.error('Failed to save events', error);
      // Fallback to localStorage
      const savedEvents = localStorage.getItem('life26-events');
      let allEvents: Event[] = savedEvents ? JSON.parse(savedEvents) : [];
      allEvents = allEvents.filter(e => e.dateString !== dateString);
      allEvents = [...allEvents, ...newEvents];
      localStorage.setItem('life26-events', JSON.stringify(allEvents));
      
      const savedTexts = localStorage.getItem('life26-parser-texts');
      const texts = savedTexts ? JSON.parse(savedTexts) : {};
      texts[dateString] = rawText;
      localStorage.setItem('life26-parser-texts', JSON.stringify(texts));
      
      setIsParserOpen(false);
      window.dispatchEvent(new CustomEvent('life26-update', { 
        detail: { type: 'eventsUpdated', source: 'sidebar' } 
      }));
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
    <aside className="fixed right-0 top-0 h-screen w-16 bg-black border-l border-white/[0.03] flex flex-col items-center py-12 z-50 overflow-hidden">
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
    </aside>
  );
};

export default Sidebar;

