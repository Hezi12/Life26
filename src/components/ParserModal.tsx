"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Category, Event } from "@/lib/types";

interface WorkTopic {
  id: string;
  eventId: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  dateString: string;
}

interface WorkSubject {
  id: string;
  name: string;
  color: string;
  iconName: string;
}

interface ParserModalProps {
  dateString: string;
  categories: Category[];
  existingEvents: Event[];
  initialText?: string;
  onClose: () => void;
  onSave: (parsedEvents: Event[], rawText: string, workTopics?: WorkTopic[], workSubjects?: WorkSubject[]) => void;
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
  const [parsedWorkTopics, setParsedWorkTopics] = useState<WorkTopic[]>([]);
  const [parsedWorkSubjects, setParsedWorkSubjects] = useState<WorkSubject[]>([]);

  // Helper function to convert time to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to convert minutes to time
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  useEffect(() => {
    const lines = input.split('\n').filter((line: string) => line.trim());
    const rawEvents: Array<{
      shortId?: string;
      time: string;
      title: string;
      categoryId: string;
      existingEvent?: Event;
      subjectName?: string; // נושא מתוך הכותרת (אחרי ":")
    }> = [];

    // Step 1: Parse all lines into raw events
    lines.forEach((line: string) => {
      const eventRegex = /^(?:\[([a-f0-9]{6})\]\s*)?(\d{2}):?(\d{2})\s+(.+)/;
      const eventMatch = line.match(eventRegex);

      if (eventMatch) {
        const [, shortId, hour, minute, title] = eventMatch;
        const timeStr = `${hour}:${minute}`;
        const titleTrimmed = title.trim();

        if (titleTrimmed) {
          const defaultCategory = categories.find((c: Category) => c.id === "0") || categories[0];
          let categoryId = defaultCategory?.id || "0";
          
          // Find categories that match keywords in the title
          const matchingCategories: Array<{ category: Category; keywordIndex: number }> = [];
          
          for (const cat of categories) {
            if (cat.id !== "0" && cat.keywords) {
              for (const keyword of cat.keywords) {
                const keywordLower = keyword.toLowerCase();
                const titleLower = titleTrimmed.toLowerCase();
                const keywordIndex = titleLower.indexOf(keywordLower);
                if (keywordIndex !== -1) {
                  matchingCategories.push({ category: cat, keywordIndex });
                  break; // Only one keyword per category
                }
              }
            }
          }
          
          // Sort by keyword position (first occurrence) and select the first one
          if (matchingCategories.length > 0) {
            matchingCategories.sort((a, b) => a.keywordIndex - b.keywordIndex);
            categoryId = matchingCategories[0].category.id;
          }

          // מציאת אירוע קיים לפי shortId
          let existingEvent: Event | undefined = undefined;
          if (shortId) {
            existingEvent = existingEvents.find(
              e => generateShortId(e.id) === shortId
            );
          }

          // Extract subject name from title (after ":")
          // For example: "במחשב: פיתוח מסחר" -> subjectName: "פיתוח מסחר"
          let subjectName: string | undefined = undefined;
          const colonIndex = titleTrimmed.indexOf(':');
          if (colonIndex !== -1) {
            subjectName = titleTrimmed.substring(colonIndex + 1).trim();
          }

          rawEvents.push({
            shortId,
            time: timeStr,
            title: titleTrimmed,
            categoryId,
            existingEvent,
            subjectName,
          });
        }
      }
    });

    // Step 2: Merge consecutive events of the same category
    const mergedEvents: Event[] = [];
    const workTopicsData: WorkTopic[] = [];
    const workSubjectsData: WorkSubject[] = [];
    const subjectNameToId = new Map<string, string>();

    let i = 0;
    while (i < rawEvents.length) {
      const current = rawEvents[i];
      
      // Check if this is a work session (computer/work category)
      const isWorkSession = current.categoryId === '9' || 
        current.title.toLowerCase().includes('מחשב') || 
        current.title.toLowerCase().includes('עבודה');

      // Collect consecutive work events of the same category
      const workSegments: Array<{ time: string; subjectName?: string; existingEvent?: Event }> = [];
      let j = i;

      if (isWorkSession) {
        // Collect all consecutive work events
        while (j < rawEvents.length) {
          const segment = rawEvents[j];
          const segmentNext = rawEvents[j + 1];
          
          const isSegmentWork = segment.categoryId === '9' || 
            segment.title.toLowerCase().includes('מחשב') || 
            segment.title.toLowerCase().includes('עבודה');
          
          // Stop if not a work session
          if (!isSegmentWork) break;

          // Stop if different category
          if (segment.categoryId !== current.categoryId) break;

          // Stop if not consecutive (more than 2 hours gap)
          if (j > i && timeToMinutes(segment.time) - timeToMinutes(rawEvents[j - 1].time) > 120) {
            break;
          }

          workSegments.push({
            time: segment.time,
            subjectName: segment.subjectName,
            existingEvent: segment.existingEvent,
          });

          // Check if next event is same category and consecutive
          if (segmentNext && 
              segmentNext.categoryId === segment.categoryId &&
              timeToMinutes(segmentNext.time) - timeToMinutes(segment.time) <= 120) {
            j++;
          } else {
            break;
          }
        }
      }

      // Determine end time for the merged event
      let endTime: string;
      const nextEvent = rawEvents[j + 1];
      if (nextEvent) {
        endTime = nextEvent.time;
      } else {
        // Default to 30 minutes if no next event
        const endMinutes = timeToMinutes(current.time) + 30;
        endTime = minutesToTime(endMinutes);
      }

      // Create or get event ID
      const eventId = current.existingEvent?.id || Math.random().toString(36).substr(2, 9);
      
      // Extract base title (without subject)
      let baseTitle = current.title;
      const colonIndex = baseTitle.indexOf(':');
      if (colonIndex !== -1) {
        baseTitle = baseTitle.substring(0, colonIndex).trim();
      }

      const mergedEvent: Event = {
        id: eventId,
        dateString,
        time: current.time,
        title: baseTitle,
        categoryId: current.categoryId,
      };

      // If this is a work session with multiple segments, create work topics
      if (isWorkSession && workSegments.length > 0) {
        // Update event time to start of first segment
        mergedEvent.time = workSegments[0].time;

        // Create work topics for each segment with a subject
        for (let k = 0; k < workSegments.length; k++) {
          const segment = workSegments[k];
          
          if (!segment.subjectName) continue;

          // Determine end time for this segment
          const segmentEnd = k < workSegments.length - 1 
            ? workSegments[k + 1].time 
            : endTime;

          // Get or create work subject
          let subjectId = subjectNameToId.get(segment.subjectName);
          if (!subjectId) {
            subjectId = `subject-${segment.subjectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            subjectNameToId.set(segment.subjectName, subjectId);
            
            workSubjectsData.push({
              id: subjectId,
              name: segment.subjectName,
              color: '#f97316', // Default orange
              iconName: 'Code', // Default icon
            });
          }

          // Create work topic
          const topicId = `topic-${eventId}-${k}-${Date.now()}`;
          workTopicsData.push({
            id: topicId,
            eventId: mergedEvent.id,
            subjectId: subjectId,
            startTime: segment.time,
            endTime: segmentEnd,
            durationMinutes: timeToMinutes(segmentEnd) - timeToMinutes(segment.time),
            dateString,
          });
        }
      }

      mergedEvents.push(mergedEvent);
      i = j + 1;
    }

    setParsed(mergedEvents);
    setParsedWorkTopics(workTopicsData);
    setParsedWorkSubjects(workSubjectsData);
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
          <button onClick={() => {
            onSave(parsed, input, parsedWorkTopics, parsedWorkSubjects);
          }} className="w-full bg-white text-black py-5 text-[10px] font-black uppercase tracking-[0.5em] hover:bg-orange-500 hover:text-white transition-all">
            Inject_To_Timeline ({parsed.length}_Events)
          </button>
        </div>
      </div>
    </div>
  );
}

