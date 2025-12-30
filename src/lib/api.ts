// API helper functions to replace localStorage calls

export const api = {
  // Events
  async getEvents(dateString?: string): Promise<any[]> {
    const url = dateString ? `/api/events?dateString=${dateString}` : '/api/events';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async saveEvent(event: any): Promise<void> {
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

  // Categories
  async getCategories(): Promise<any[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async saveCategory(category: any): Promise<void> {
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
  },

  // Work Topics
  async getWorkTopics(dateString?: string): Promise<any[]> {
    const url = dateString ? `/api/work-topics?dateString=${dateString}` : '/api/work-topics';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch work topics');
    return res.json();
  },

  async saveWorkTopic(topic: any): Promise<void> {
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
  async getWorkSubjects(): Promise<any[]> {
    const res = await fetch('/api/work-subjects');
    if (!res.ok) throw new Error('Failed to fetch work subjects');
    return res.json();
  },

  async saveWorkSubject(subject: any): Promise<void> {
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
  async getDailyNotes(dateString: string): Promise<any | null> {
    const res = await fetch(`/api/daily-notes?dateString=${dateString}`);
    if (!res.ok) throw new Error('Failed to fetch daily notes');
    return res.json();
  },

  async saveDailyNotes(notes: any): Promise<void> {
    await fetch('/api/daily-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });
  },

  // Sticky Notes
  async getStickyNotes(): Promise<any> {
    const res = await fetch('/api/sticky-notes');
    if (!res.ok) throw new Error('Failed to fetch sticky notes');
    return res.json();
  },

  async saveStickyNotes(notes: any): Promise<void> {
    await fetch('/api/sticky-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes),
    });
  },

  // Pomodoro Settings
  async getPomodoroSettings(): Promise<any> {
    const res = await fetch('/api/pomodoro-settings');
    if (!res.ok) throw new Error('Failed to fetch pomodoro settings');
    return res.json();
  },

  async savePomodoroSettings(settings: any): Promise<void> {
    await fetch('/api/pomodoro-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },

  // Parser Texts
  async getParserTexts(dateString: string): Promise<any | null> {
    const res = await fetch(`/api/parser-texts?dateString=${dateString}`);
    if (!res.ok) throw new Error('Failed to fetch parser texts');
    return res.json();
  },

  async saveParserTexts(parserText: any): Promise<void> {
    await fetch('/api/parser-texts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parserText),
    });
  },

  // Photos
  async getPhotos(dateString: string): Promise<any | null> {
    const res = await fetch(`/api/photos?dateString=${dateString}`);
    if (!res.ok) throw new Error('Failed to fetch photos');
    return res.json();
  },

  async savePhotos(photo: any): Promise<void> {
    await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    });
  },

  async deletePhotos(dateString: string): Promise<void> {
    await fetch(`/api/photos?dateString=${dateString}`, { method: 'DELETE' });
  },

  // Habits
  async getHabits(): Promise<any[]> {
    const res = await fetch('/api/habits');
    if (!res.ok) throw new Error('Failed to fetch habits');
    return res.json();
  },

  async saveHabit(habit: any): Promise<void> {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    });
  },

  async deleteHabit(id: string): Promise<void> {
    await fetch(`/api/habits?id=${id}`, { method: 'DELETE' });
  },

  // Habit Logs
  async getHabitLogs(habitId?: string, dateString?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (habitId) params.append('habitId', habitId);
    if (dateString) params.append('dateString', dateString);
    const url = `/api/habit-logs${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch habit logs');
    return res.json();
  },

  async saveHabitLog(log: any): Promise<void> {
    await fetch('/api/habit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  },

  // Missions
  async getMissions(dateString?: string): Promise<any[]> {
    const url = dateString ? `/api/missions?dateString=${dateString}` : '/api/missions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch missions');
    const result = await res.json();
    return Array.isArray(result) ? result : (result ? [result] : []);
  },

  async getMission(dateString: string): Promise<any | null> {
    const res = await fetch(`/api/missions?dateString=${dateString}`);
    if (!res.ok) throw new Error('Failed to fetch mission');
    return res.json();
  },

  async saveMission(mission: any): Promise<void> {
    await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });
  },
};

