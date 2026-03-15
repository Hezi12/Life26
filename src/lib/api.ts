// API helper functions

import type {
  AiProfile,
  Category,
  Event,
  WorkTopic,
  WorkSubject,
  DailyNotes,
  StickyNotes,
  PomodoroSettings,
  DailyMission,
  FocusSession,
  FocusSettings,
  Law,
  LawLog,
  DiametrixMeeting,
  DiametrixError,
} from './types';

interface ParserText {
  id: string;
  dateString: string;
  content: string;
}

interface Photo {
  id: string;
  dateString: string;
  photoData: string;
}

export const api = {
  // Events
  async getEvents(dateString?: string): Promise<Event[]> {
    const url = dateString ? `/api/events?dateString=${dateString}` : '/api/events';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async saveEvent(event: Event): Promise<void> {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  },

  async deleteEvent(id: string): Promise<void> {
    const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to delete event' }));
      throw new Error(error.error || 'Failed to delete event');
    }
  },

  async deleteEventsByDate(dateString: string): Promise<void> {
    const res = await fetch(`/api/events?dateString=${dateString}`, { method: 'DELETE' });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to delete events' }));
      throw new Error(error.error || 'Failed to delete events');
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async saveCategory(category: Category): Promise<void> {
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
  },

  // Work Topics
  async getWorkTopics(dateString?: string): Promise<WorkTopic[]> {
    const url = dateString ? `/api/work-topics?dateString=${dateString}` : '/api/work-topics';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch work topics');
    return res.json();
  },

  async saveWorkTopic(topic: WorkTopic): Promise<void> {
    await fetch('/api/work-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topic),
    });
  },

  async deleteWorkTopic(id: string): Promise<void> {
    await fetch(`/api/work-topics?id=${id}`, { method: 'DELETE' });
  },

  // Work Subjects
  async getWorkSubjects(): Promise<WorkSubject[]> {
    const res = await fetch('/api/work-subjects');
    if (!res.ok) throw new Error('Failed to fetch work subjects');
    return res.json();
  },

  async saveWorkSubject(subject: WorkSubject): Promise<void> {
    await fetch('/api/work-subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subject),
    });
  },

  async deleteWorkSubject(id: string): Promise<void> {
    await fetch(`/api/work-subjects?id=${id}`, { method: 'DELETE' });
  },

  // Daily Notes
  async getDailyNotes(dateString: string): Promise<DailyNotes | null> {
    const res = await fetch(`/api/daily-notes?dateString=${dateString}`);
    if (!res.ok) throw new Error('Failed to fetch daily notes');
    return res.json();
  },

  async saveDailyNotes(notes: DailyNotes): Promise<void> {
    await fetch('/api/daily-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });
  },

  // Sticky Notes
  async getStickyNotes(): Promise<StickyNotes | null> {
    const res = await fetch('/api/sticky-notes');
    if (!res.ok) throw new Error('Failed to fetch sticky notes');
    return res.json();
  },

  async saveStickyNotes(notes: StickyNotes): Promise<void> {
    await fetch('/api/sticky-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });
  },

  // Pomodoro Settings
  async getPomodoroSettings(): Promise<PomodoroSettings> {
    const res = await fetch('/api/pomodoro-settings');
    if (!res.ok) throw new Error('Failed to fetch pomodoro settings');
    return res.json();
  },

  async savePomodoroSettings(settings: PomodoroSettings): Promise<void> {
    await fetch('/api/pomodoro-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },

  // Parser Texts
  async getParserTexts(dateString: string): Promise<ParserText | null> {
    const res = await fetch(`/api/parser-texts?dateString=${dateString}`);
    if (!res.ok) throw new Error('Failed to fetch parser texts');
    return res.json();
  },

  async saveParserTexts(parserText: ParserText): Promise<void> {
    await fetch('/api/parser-texts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parserText),
    });
  },

  // Photos
  async getPhotos(dateString: string): Promise<Photo | null> {
    const res = await fetch(`/api/photos?dateString=${dateString}`);
    if (!res.ok) throw new Error('Failed to fetch photos');
    return res.json();
  },

  async savePhotos(photo: Photo): Promise<void> {
    await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    });
  },

  async deletePhotos(dateString: string): Promise<void> {
    await fetch(`/api/photos?dateString=${dateString}`, { method: 'DELETE' });
  },

  // Missions
  async getMissions(dateString?: string): Promise<DailyMission[]> {
    const url = dateString ? `/api/missions?dateString=${dateString}` : '/api/missions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch missions');
    const result = await res.json();
    return Array.isArray(result) ? result : (result ? [result] : []);
  },

  async getMission(dateString: string): Promise<DailyMission | null> {
    const res = await fetch(`/api/missions?dateString=${dateString}`);
    if (!res.ok) throw new Error('Failed to fetch mission');
    return res.json();
  },

  async saveMission(mission: DailyMission): Promise<void> {
    await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });
  },

  // Focus Sessions
  async getFocusSessions(): Promise<FocusSession[]> {
    const res = await fetch('/api/focus/session');
    if (!res.ok) throw new Error('Failed to fetch focus sessions');
    return res.json();
  },

  async saveFocusSession(session: FocusSession): Promise<void> {
    await fetch('/api/focus/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
  },

  async updateFocusSession(update: Partial<FocusSession> & { id: string }): Promise<void> {
    await fetch('/api/focus/session', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
  },

  async deleteFocusSession(id: string): Promise<void> {
    await fetch(`/api/focus/session?id=${id}`, { method: 'DELETE' });
  },

  // Focus Settings
  async getFocusSettings(): Promise<FocusSettings> {
    const res = await fetch('/api/focus/settings');
    if (!res.ok) throw new Error('Failed to fetch focus settings');
    return res.json();
  },

  async saveFocusSettings(settings: FocusSettings): Promise<void> {
    await fetch('/api/focus/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },

  // Focus AI
  async getFocusAI(notes: string, history?: Partial<FocusSession>[]): Promise<{ summary: string; affirmation: string }> {
    const res = await fetch('/api/focus/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, history: history || [] }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `AI response failed (${res.status})`);
    }
    return res.json();
  },

  // AI Profile
  async getAiProfile(): Promise<AiProfile> {
    const res = await fetch('/api/ai-profile');
    if (!res.ok) throw new Error('Failed to fetch AI profile');
    return res.json();
  },

  // Laws
  async getLaws(): Promise<Law[]> {
    const res = await fetch('/api/laws');
    if (!res.ok) throw new Error('Failed to fetch laws');
    return res.json();
  },

  async saveLaw(law: Law): Promise<void> {
    await fetch('/api/laws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(law),
    });
  },

  async deleteLaw(id: string): Promise<void> {
    await fetch(`/api/laws?id=${id}`, { method: 'DELETE' });
  },

  // Law Logs
  async getLawLogs(lawId?: string, dateString?: string): Promise<LawLog[]> {
    const params = new URLSearchParams();
    if (lawId) params.append('lawId', lawId);
    if (dateString) params.append('dateString', dateString);
    const url = `/api/law-logs${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch law logs');
    return res.json();
  },

  async saveLawLog(log: LawLog): Promise<void> {
    await fetch('/api/law-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  },

  async saveAiProfile(content: string): Promise<void> {
    await fetch('/api/ai-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  },

  async getAiPrompt(): Promise<AiProfile> {
    const res = await fetch('/api/ai-profile?type=prompt');
    if (!res.ok) throw new Error('Failed to fetch AI prompt');
    return res.json();
  },

  async saveAiPrompt(content: string): Promise<void> {
    await fetch('/api/ai-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type: 'prompt' }),
    });
  },

  // DIAMETRIX Meetings
  async getDiametrixMeetings(): Promise<DiametrixMeeting[]> {
    const res = await fetch('/api/diametrix/meetings');
    if (!res.ok) throw new Error('Failed to fetch meetings');
    return res.json();
  },

  async saveDiametrixMeeting(meeting: DiametrixMeeting): Promise<void> {
    await fetch('/api/diametrix/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting),
    });
  },

  async deleteDiametrixMeeting(id: string): Promise<void> {
    await fetch(`/api/diametrix/meetings?id=${id}`, { method: 'DELETE' });
  },

  // DIAMETRIX Errors
  async getDiametrixErrors(): Promise<DiametrixError[]> {
    const res = await fetch('/api/diametrix/errors');
    if (!res.ok) throw new Error('Failed to fetch errors');
    return res.json();
  },

  async saveDiametrixError(error: DiametrixError): Promise<void> {
    await fetch('/api/diametrix/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error),
    });
  },

  async deleteDiametrixError(id: string): Promise<void> {
    await fetch(`/api/diametrix/errors?id=${id}`, { method: 'DELETE' });
  },
};
