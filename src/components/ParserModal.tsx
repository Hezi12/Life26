"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Category, Event } from "@/lib/types";

interface ParserModalProps {
  dateString: string;
  categories: Category[];
  existingEvents: Event[];
  initialText?: string;
  onClose: () => void;
  onSave: (parsedEvents: Event[], rawText: string) => void;
}

// פונקציה ליצירת מזהה מקוצר (6 תווים אחרונים)
const generateShortId = (fullId: string): string => {
  return fullId.slice(-6).toLowerCase();
};

export function ParserModal({ 
  dateString, 
  categories, 
  existingEvents, 
  initialText, 
  onClose, 
  onSave 
}: ParserModalProps) {
  // יצירת טקסט התחלתי מאירועים קיימים
  const getInitialText = () => {
    // אם יש אירועים קיימים, תמיד להשתמש בהם (עם shortId)
    // זה עדיף על initialText כי initialText יכול להיות ישן ללא shortId
    if (existingEvents.length > 0) {
      return existingEvents
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((e: Event) => {
          const shortId = generateShortId(e.id);
          const timeStr = e.time.replace(':', '');
          return `[${shortId}] ${timeStr} ${e.title}`;
        }).join('\n');
    }
    // רק אם אין אירועים קיימים, להשתמש ב-initialText
    if (initialText) {
      return initialText;
    }
    return "";
  };

  const [input, setInput] = useState(getInitialText());

  // עדכון הטקסט כשהנתונים משתנים (כל פעם שהמודל נפתח)
  useEffect(() => {
    const newText = getInitialText();
    // תמיד מעדכן, גם אם הטקסט ריק (כדי למחוק אירועים)
    setInput(newText);
  }, [dateString, initialText, existingEvents]);
  const [parsed, setParsed] = useState<Event[]>([]);

  useEffect(() => {
    const lines = input.split('\n').filter((line: string) => line.trim());
    const newEvents: Event[] = [];
    lines.forEach((line: string) => {
      // תמיכה בפורמט: [shortId] HHMM title או HHMM title
      const eventRegex = /^(?:\[([a-f0-9]{6})\]\s*)?(\d{2}):?(\d{2})\s+(.+)/;
      const eventMatch = line.match(eventRegex);
      
      if (eventMatch) {
        const [, shortId, hour, minute, title] = eventMatch;
        const timeStr = `${hour}:${minute}`;
        const titleTrimmed = title.trim();
        
        if (titleTrimmed) {
          const defaultCategory = categories.find((c: Category) => c.id === "0") || categories[0];
          let categoryId = defaultCategory?.id || "0";
          for (const cat of categories) {
            if (cat.id !== "0" && cat.keywords?.some((k: string) => titleTrimmed.toLowerCase().includes(k.toLowerCase()))) {
              categoryId = cat.id;
              break;
            }
          }
          
          // מציאת אירוע קיים לפי shortId
          let existingEvent: Event | undefined = undefined;
          if (shortId) {
            existingEvent = existingEvents.find(
              e => generateShortId(e.id) === shortId
            );
          }
          
          const eventData: Event = {
            dateString,
            time: timeStr,
            title: titleTrimmed,
            categoryId,
          };

          // ✅ אם זה אירוע קיים, שמור את ה-ID שלו
          if (existingEvent) {
            eventData.id = existingEvent.id; // שמירת ה-ID המקורי!
          } else {
            // אם אין existingEvent, eventData לא יכיל id (אירוע חדש)
            eventData.id = Math.random().toString(36).substr(2, 9);
          }

          newEvents.push(eventData);
        }
      }
    });
    setParsed(newEvents);
  }, [input, dateString, categories, existingEvents]);

  return (
    <div className="fixed inset-0 bg-black/98 z-[110] flex items-center justify-center md:p-4 pt-safe" onClick={onClose} dir="rtl">
      <div className="bg-black border-zinc-800 w-full md:max-w-4xl h-full md:h-[75vh] flex flex-col md:shadow-[0_0_100px_rgba(0,0,0,1)] rounded-none md:rounded-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/40">
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-500 italic">Temporal_Data_Parser</div>
          <button onClick={onClose} className="text-zinc-700 hover:text-orange-500 transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <textarea autoFocus className="flex-1 bg-transparent p-6 md:p-10 outline-none text-xl md:text-2xl font-mono text-orange-500 resize-none leading-relaxed placeholder:opacity-10 scrollbar-hide text-right" 
            placeholder="0700 INITIALIZE_OPS&#10;0900 CORE_SYSTEM_SYNC" value={input} onChange={e => setInput(e.target.value)} />
          <div className="hidden md:block w-[30%] border-r border-zinc-900 p-8 bg-zinc-950/20 overflow-y-auto space-y-6 scrollbar-hide">
             <div className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] border-b border-zinc-900 pb-2 text-right">Processor_Stream</div>
             <div className="space-y-4">
              {parsed.map((e, i) => (
                <div key={i} className="text-[11px] font-mono flex items-center gap-3 animate-in slide-in-from-left-2 duration-300 flex-row-reverse justify-end" style={{ animationDelay: `${i * 30}ms` }}>
                  <span className="text-orange-500/50 tabular-nums">{e.time}</span>
                  <div className="w-1 h-3 bg-zinc-800" />
                  <span className="text-zinc-400 font-bold tracking-tight truncate text-right">{e.title.replace(/:.*/, '').trim()}</span>
                </div>
              ))}
             </div>
          </div>
        </div>
        <div className="p-6 md:p-8 bg-zinc-950/40 border-t border-zinc-900">
          <button onClick={() => onSave(parsed, input)} className="w-full bg-white text-black py-5 text-[10px] font-black uppercase tracking-[0.5em] hover:bg-orange-500 hover:text-white transition-all">
            Inject_To_Timeline ({parsed.length}_Events)
          </button>
        </div>
      </div>
    </div>
  );
}

