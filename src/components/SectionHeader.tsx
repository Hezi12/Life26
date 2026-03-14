import { cn } from "@/lib/utils";

export const SectionHeader = ({ icon, title, color = "text-zinc-500" }: { icon: React.ReactNode; title: string; color?: string }) => (
  <div className="flex items-center gap-3 border-b border-zinc-900/50 pb-4 shrink-0">
    <span className={cn(color)}>{icon}</span>
    <h2 className={cn("text-[11px] font-black uppercase tracking-[0.4em]", color)}>{title}</h2>
  </div>
);
