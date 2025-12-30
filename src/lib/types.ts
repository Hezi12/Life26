// Shared types for the application

export interface Category {
  id: string;
  name: string;
  color: string;
  iconName: string;
  keywords: string[];
}

export interface Event {
  id: string;
  dateString: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  categoryId: string;
}

export interface WorkTopic {
  id: string;
  eventId: string;
  subjectId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  dateString: string;
}

export interface WorkSubject {
  id: string;
  name: string;
  color: string;
  iconName: string;
}

export interface DailyNotes {
  id: string;
  dateString: string;
  content: string;
}

export interface StickyNotes {
  id: string;
  content: string;
}

export interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  soundsEnabled: boolean;
  workSound: string;
  breakSound: string;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'specific';
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  iconName: string;
  color: string;
}

export interface HabitLog {
  id: string; // habitId-dateString
  habitId: string;
  dateString: string;
  completed: boolean;
}

export interface DailyMission {
  id: string; // YYYY-MM-DD
  dateString: string;
  mission: string;
  reflection?: string;
  score?: 0 | 1 | 2 | 3;
}

