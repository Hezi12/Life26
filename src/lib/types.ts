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

export interface DailyMission {
  id: string; // YYYY-MM-DD
  dateString: string;
  mission: string;
  reflection?: string;
  score?: 0 | 1 | 2 | 3;
}

export type FocusContentType = 'task' | 'brainstorm' | 'freewrite' | 'strategy';
export type FocusStatus = 'active' | 'locked' | 'completed';

export interface FocusSession {
  id: string;
  sessionNumber: number;
  dateString: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  contentType: FocusContentType;
  notes: string;
  aiSummary?: string;
  aiAffirmation?: string;
  nextFocusTime?: string; // HH:mm
  nextFocusDate?: string; // YYYY-MM-DD
  status: FocusStatus;
}

export interface FocusSettings {
  schedule: { day: string; time: string }[];
  notificationPreMinutes: number;
  notifyOnTime: boolean;
}

export interface Law {
  id: string;
  position: number; // 1, 2, or 3
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface LawLog {
  id: string; // lawId-dateString
  lawId: string;
  dateString: string;
  kept: boolean;
}

export interface DiametrixMeeting {
  id: string;
  meetingNumber: number;
  date: string; // YYYY-MM-DD
  day: string; // Hebrew day name
  time: string; // HH:mm
  background: string;
  decisions: string[];
  allocations: { strategy: string; contracts: string }[];
  summary: string;
  nextMeetingNote: string;
}

export type DiametrixErrorStatus = 'open' | 'resolved';

export interface DiametrixError {
  id: string;
  errorNumber: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  strategy: string;
  errorType: string;
  description: string;
  rootCause: string;
  fix: string;
  status: DiametrixErrorStatus;
}

export interface AiProfile {
  id: string;
  content: string;
  updatedAt?: string;
}

