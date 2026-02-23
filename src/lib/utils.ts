import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert "HH:mm" to total minutes */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/** Convert total minutes to "HH:mm" */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/** Calculate duration in minutes between two "HH:mm" strings (handles overnight) */
export const calculateDuration = (start: string, end: string): number => {
  let s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (e < s) e += 24 * 60;
  return e - s;
};
