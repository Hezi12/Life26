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
    await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
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
};

