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

/** Get date string in YYYY-MM-DD format */
export const getDateString = (d: Date = new Date()): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Get current time as HH:mm */
export const getNowTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

/** Calculate difference in minutes between two HH:mm times (handles overnight) */
export const minutesDiff = (start: string, end: string): number => {
  let diff = timeToMinutes(end) - timeToMinutes(start);
  if (diff < 0) diff += 24 * 60;
  return diff;
};

/** Format minutes as HH:MM string */
export const formatElapsed = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
