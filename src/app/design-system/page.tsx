"use client";

import React from "react";
import {
  Check,
  X,
  Home,
  Settings,
  Activity,
  MoreVertical,
  Coffee,
  Code,
  Dumbbell,
  Moon,
  Sun,
  LayoutDashboard,
  Target,
  Calendar,
  Repeat,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";

const DesignSystemPage = () => {
  return (
    <div className="max-w-6xl mx-auto pb-24" dir="rtl">
      <header className="mb-16 border-b border-zinc-900 pb-8">
        <h1 className="text-3xl font-mono tracking-tighter text-white mb-2">DESIGN SYSTEM</h1>
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Life26 / Visual Protocol</p>
      </header>

      {/* Grid Headers */}
      <div className="grid grid-cols-4 gap-8 mb-8 pb-4 border-b border-zinc-900 sticky top-0 bg-black z-10">
        <div className="text-zinc-600 text-xs font-mono uppercase tracking-widest self-end">רכיב</div>
        <div className="flex flex-col items-center">
          <span className="text-orange-500 font-mono text-lg mb-1">1</span>
          <div className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest text-center">VARIATION A (TERMINAL)</div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-orange-500 font-mono text-lg mb-1">2</span>
          <div className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest text-center">VARIATION B (OPERATOR)</div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-orange-500 font-mono text-lg mb-1">3</span>
          <div className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest text-center">VARIATION C (FUTURIST)</div>
        </div>
      </div>

      {/* 11. Writing Window */}
      <Section title="חלון כתיבה">
        <div className="grid grid-cols-4 gap-8 items-start">
          <div className="text-zinc-500 font-mono text-[10px] uppercase">Input Area</div>
          <WritingA placeholder="הקלד כאן..." />
          <WritingB placeholder="הקלד כאן..." />
          <WritingC placeholder="הקלד כאן..." />
        </div>
      </Section>

      {/* 5. Timeline with Icons */}
      <Section title="ציר זמן עם אייקונים">
        <div className="grid grid-cols-4 gap-8 items-start">
          <div className="text-zinc-500 font-mono text-[10px] uppercase">Activity Segment</div>
          <div className="flex flex-col gap-8">
            <TimelineIconA time="07:00" title="השכמה" icon={<Sun size={14} />} />
            <TimelineIconA time="09:00" title="עבודה" icon={<Code size={14} />} active />
            <TimelineIconA time="17:00" title="אימון" icon={<Dumbbell size={14} />} />
          </div>
          <div className="flex flex-col gap-8">
            <TimelineIconB time="07:00" title="השכמה" icon={<Sun size={14} />} />
            <TimelineIconB time="09:00" title="עבודה" icon={<Code size={14} />} active />
            <TimelineIconB time="17:00" title="אימון" icon={<Dumbbell size={14} />} />
          </div>
          <div className="flex flex-col gap-8">
            <TimelineIconC time="07:00" title="השכמה" icon={<Sun size={14} />} />
            <TimelineIconC time="09:00" title="עבודה" icon={<Code size={14} />} active />
            <TimelineIconC time="17:00" title="אימון" icon={<Dumbbell size={14} />} />
          </div>
        </div>
      </Section>

      {/* 12. Time Distribution (New) */}
      <Section title="חלוקת זמן (Pie Chart)">
        <div className="grid grid-cols-4 gap-8 items-center">
          <div className="text-zinc-500 font-mono text-[10px] uppercase">Visualization</div>
          <PieChartA data={[{label: "עבודה", val: 60}, {label: "פנאי", val: 25}, {label: "שינה", val: 15}]} />
          <PieChartB data={[{label: "עבודה", val: 60}, {label: "פנאי", val: 25}, {label: "שינה", val: 15}]} />
          <PieChartC data={[{label: "עבודה", val: 60}, {label: "פנאי", val: 25}, {label: "שינה", val: 15}]} />
        </div>
      </Section>

      {/* 13. Color Combinations (New) */}
      <Section title="שילוב צבעים (Accent + Secondary)">
        <div className="grid grid-cols-4 gap-8 items-start">
          <div className="text-zinc-500 font-mono text-[10px] uppercase">Multi-Accent UI</div>
          <div className="border border-zinc-800 p-4 font-mono space-y-4">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-500 uppercase">Status:</span>
              <span className="text-orange-500">ACTIVE</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-500 uppercase">System:</span>
              <span className="text-[#00d4ff]">SYNCED</span>
            </div>
            <div className="h-1 bg-zinc-900 w-full overflow-hidden">
              <div className="h-full bg-orange-500 w-2/3 shadow-[0_0_8px_rgba(255,87,34,0.5)]" />
            </div>
            <div className="h-1 bg-zinc-900 w-full overflow-hidden">
              <div className="h-full bg-[#00d4ff] w-1/3 shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
            </div>
          </div>
          <div className="bg-zinc-900/40 rounded-sm p-4 space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 bg-orange-500/10 border border-orange-500/20 p-2 rounded-sm text-center">
                <div className="text-orange-500 text-xs font-bold">4.5h</div>
                <div className="text-[8px] text-zinc-500 uppercase">Focus</div>
              </div>
              <div className="flex-1 bg-[#00d4ff]/10 border border-[#00d4ff]/20 p-2 rounded-sm text-center">
                <div className="text-[#00d4ff] text-xs font-bold">120%</div>
                <div className="text-[8px] text-zinc-500 uppercase">CPU</div>
              </div>
            </div>
            <div className="text-[10px] text-zinc-400 text-center italic">המערכת פועלת כסדרה</div>
          </div>
          <div className="bg-black border-r-2 border-orange-500 p-4 shadow-[0_0_20px_rgba(0,212,255,0.05)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#00d4ff] flex items-center justify-center text-[#00d4ff] animate-pulse">
                <Activity size={16} />
              </div>
              <div>
                <div className="text-white text-xs font-bold italic uppercase">בביצוע</div>
                <div className="text-[#00d4ff] text-[10px] font-mono">ID: 2026-X</div>
              </div>
            </div>
            <button className="w-full py-2 bg-gradient-to-l from-orange-600 to-transparent text-white text-[10px] font-black uppercase italic tracking-[0.2em]">
              הפסק פעולה
            </button>
          </div>
        </div>
      </Section>

      {/* 2. Color Palettes (Updated) */}
      <Section title="פלטת צבעים">
        <div className="grid grid-cols-4 gap-8 items-center">
          <div className="text-zinc-500 font-mono text-[10px] uppercase">דגימות צבע</div>
          <div className="flex flex-col items-center gap-2">
            <ColorSwatch color="#000000" label="רקע ראשי" border />
          </div>
          <div className="flex flex-col items-center gap-2">
            <ColorSwatch color="#ff5722" label="כתום (Accent)" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <ColorSwatch color="#00d4ff" label="ציאן (System)" />
          </div>
        </div>
      </Section>

      {/* Rest of the sections remained below for comparison if needed */}
      <Section title="טיפוגרפיה">
        <TypographyRow label="H1" text="מערכת ניהול חיים" />
        <TypographyRow label="H2" text="מיקוד נוכחי" />
        <TypographyRow label="Body" text="זהו טקסט לדוגמה שנועד לבדוק את הקריאות של המערכת בתנאי עבודה שונים." />
      </Section>

      <Section title="כפתורים">
        <div className="grid grid-cols-4 gap-8 items-start">
          <div className="text-zinc-500 font-mono text-[10px] uppercase">פעולה ראשית</div>
          <button className="border border-white text-white px-6 py-2 font-mono text-sm uppercase hover:bg-white hover:text-black transition-all">התחל מיקוד</button>
          <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-sm text-sm font-medium transition-all">התחל מיקוד</button>
          <button className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-sm text-sm font-bold shadow-[0_0_15px_rgba(255,87,34,0.3)] transition-all">התחל מיקוד</button>
        </div>
      </Section>
    </div>
  );
};

// Sub-components for the design system

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-20">
    <h3 className="text-zinc-700 text-[10px] font-mono uppercase tracking-[0.3em] mb-8 border-r border-zinc-800 pr-4">{title}</h3>
    <div className="flex flex-col gap-12">{children}</div>
  </section>
);

const TypographyRow = ({ label, text, isData = false }: { label: string; text: string; isData?: boolean }) => (
  <div className="grid grid-cols-4 gap-8 items-center">
    <div className="text-zinc-500 font-mono text-[10px] uppercase">{label}</div>
    <div className={cn("text-center font-mono", isData ? "text-orange-500 text-xs" : "text-white text-lg")}>{text}</div>
    <div className={cn("text-center", isData ? "text-zinc-400 text-xs uppercase" : "text-white text-base font-medium")}>{text}</div>
    <div className={cn("text-center font-bold tracking-tight", isData ? "text-orange-400 text-xs italic" : "text-white text-xl")}>{text}</div>
  </div>
);

const ColorSwatch = ({ color, label, border = false }: { color: string; label: string; border?: boolean }) => (
  <div className="flex flex-col items-center gap-2">
    <div
      className={cn("w-12 h-12", border && "border border-zinc-800")}
      style={{ backgroundColor: color }}
    />
    <span className="text-[10px] text-zinc-500 font-mono uppercase">{label}</span>
    <span className="text-[10px] text-zinc-600 font-mono">{color}</span>
  </div>
);

const IconSet = ({ className }: { className?: string }) => (
  <div className={cn("flex justify-center gap-4", className)}>
    <Home size={18} />
    <Activity size={18} />
    <Check size={18} />
    <X size={18} />
    <Settings size={18} />
  </div>
);

// Timeline with Icons
const TimelineIconA = ({ time, title, icon, active }: any) => (
  <div className={cn("border-r-2 pr-4 font-mono transition-colors", active ? "border-orange-500" : "border-zinc-800")}>
    <div className="flex items-center gap-2 mb-1">
      <span className={active ? "text-orange-500" : "text-zinc-600"}>{icon}</span>
      <span className={cn("text-[10px] tracking-tighter", active ? "text-orange-500" : "text-zinc-500")}>{time}</span>
    </div>
    <div className={cn("text-xs uppercase", active ? "text-white" : "text-zinc-500")}>{title}</div>
  </div>
);

const TimelineIconB = ({ time, title, icon, active }: any) => (
  <div className="flex gap-4 group">
    <div className="flex flex-col items-center">
      <div className={cn("w-6 h-6 rounded-sm flex items-center justify-center border transition-all",
        active ? "bg-zinc-800 border-zinc-600 text-white" : "border-zinc-900 text-zinc-600")}>
        {icon}
      </div>
      <div className="w-[1px] h-10 bg-zinc-900" />
    </div>
    <div className="pt-0.5">
      <div className={cn("text-[10px] font-bold", active ? "text-zinc-300" : "text-zinc-600")}>{time}</div>
      <div className={cn("text-sm", active ? "text-white font-medium" : "text-zinc-500")}>{title}</div>
    </div>
  </div>
);

const TimelineIconC = ({ time, title, icon, active }: any) => (
  <div className="relative pr-8 py-2 overflow-hidden">
    {active && <div className="absolute inset-0 bg-orange-500/5 -mr-10 skew-x-12" />}
    <div className={cn("absolute right-0 top-0 bottom-0 w-0.5 transition-all", active ? "bg-[#00d4ff] shadow-[0_0_10px_#00d4ff]" : "bg-zinc-900")} />
    <div className="flex items-center gap-3">
      <div className={cn("transition-transform duration-500", active && "scale-110 text-[#00d4ff]")}>{icon}</div>
      <div>
        <div className={cn("text-xs font-black italic tracking-[0.2em] uppercase", active ? "text-white" : "text-zinc-700")}>{title}</div>
        <div className={cn("text-[8px] font-mono", active ? "text-[#00d4ff]" : "text-zinc-700")}>{time}</div>
      </div>
    </div>
  </div>
);

// Pie Charts
const PieChartA = ({ data }: any) => (
  <div className="flex flex-col items-center gap-4 font-mono">
    <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#18181b" strokeWidth="10" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#ff5722" strokeWidth="10" strokeDasharray="170 283" />
    </svg>
    <div className="text-[10px] text-zinc-600 uppercase flex gap-4">
      {data.map((d: any) => <div key={d.label}>{d.label} {d.val}%</div>)}
    </div>
  </div>
);

const PieChartB = ({ data }: any) => (
  <div className="flex items-center gap-6">
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full border-4 border-zinc-900" />
      <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent border-l-transparent rotate-[30deg]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-xs font-bold">60%</span>
      </div>
    </div>
    <div className="space-y-1">
      {data.map((d: any) => (
        <div key={d.label} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: d.label === "עבודה" ? "#ff5722" : "#333"}} />
          <span className="text-[10px] text-zinc-400">{d.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const PieChartC = ({ data }: any) => (
  <div className="flex flex-col items-center gap-2">
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#111" strokeWidth="3" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#00d4ff" strokeWidth="3" strokeDasharray="60, 100" className="drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ff5722" strokeWidth="3" strokeDasharray="25, 100" strokeDashoffset="-60" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[#00d4ff] text-[10px] font-black italic">SYNC</span>
      </div>
    </div>
    <div className="text-[8px] font-mono text-orange-500 uppercase tracking-widest">Analytics_Active</div>
  </div>
);

// Writing Windows
const WritingA = ({ placeholder }: any) => (
  <div className="font-mono">
    <div className="text-[10px] text-zinc-600 mb-1 uppercase tracking-tighter">Terminal_Input v1.0</div>
    <div className="border border-zinc-800 p-4 bg-black flex gap-3">
      <span className="text-orange-500">{">"}</span>
      <textarea
        className="bg-transparent border-none outline-none text-white text-sm w-full h-24 resize-none font-mono"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const WritingB = ({ placeholder }: any) => (
  <div className="bg-zinc-900/40 rounded-sm border border-zinc-800 p-4 transition-all focus-within:border-zinc-600">
    <textarea
      className="bg-transparent border-none outline-none text-white text-sm w-full h-24 resize-none"
      placeholder={placeholder}
    />
    <div className="flex justify-end mt-2">
      <div className="text-[10px] text-zinc-600 font-mono">256 CHR</div>
    </div>
  </div>
);

const WritingC = ({ placeholder }: any) => (
  <div className="relative group">
    <div className="absolute -right-1 top-0 bottom-0 w-[2px] bg-orange-600 group-focus-within:h-full h-1/3 transition-all duration-300" />
    <div className="bg-black p-4 shadow-[inset_0_0_20px_rgba(255,87,34,0.02)] border border-orange-500/10 focus-within:border-orange-500/30 transition-all">
      <textarea
        className="bg-transparent border-none outline-none text-white text-lg font-bold italic w-full h-24 resize-none placeholder:text-zinc-800"
        placeholder={placeholder}
      />
    </div>
  </div>
);

export default DesignSystemPage;
