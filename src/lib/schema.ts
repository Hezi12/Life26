import { pgTable, text, integer, boolean, jsonb, timestamp, serial } from 'drizzle-orm/pg-core';

// Categories table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  iconName: text('icon_name').notNull(),
  keywords: jsonb('keywords').$type<string[]>().default([]),
});

// Events table
export const events = pgTable('events', {
  id: text('id').primaryKey(),
  dateString: text('date_string').notNull(),
  time: text('time').notNull(),
  title: text('title').notNull(),
  categoryId: text('category_id').notNull(),
});

// Work Subjects table
export const workSubjects = pgTable('work_subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  iconName: text('icon_name').notNull(),
});

// Work Topics table
export const workTopics = pgTable('work_topics', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull(),
  subjectId: text('subject_id').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  dateString: text('date_string').notNull(),
});

// Daily Notes table
export const dailyNotes = pgTable('daily_notes', {
  id: text('id').primaryKey(),
  dateString: text('date_string').notNull(),
  content: text('content').default(''),
});

// Sticky Notes table
export const stickyNotes = pgTable('sticky_notes', {
  id: text('id').primaryKey().default('sticky-1'),
  content: text('content').default(''),
});

// Pomodoro Settings table
export const pomodoroSettings = pgTable('pomodoro_settings', {
  id: text('id').primaryKey().default('default'),
  workMinutes: integer('work_minutes').default(60),
  breakMinutes: integer('break_minutes').default(5),
  soundsEnabled: boolean('sounds_enabled').default(true),
  workSound: text('work_sound').default('success'),
  breakSound: text('break_sound').default('chime'),
});

// Daily Missions table
export const dailyMissions = pgTable('daily_missions', {
  id: text('id').primaryKey(),
  dateString: text('date_string').notNull(),
  mission: text('mission').notNull(),
  reflection: text('reflection'),
  score: integer('score'), // 0 | 1 | 2 | 3
});

// Parser Texts table (for raw parser input text)
export const parserTexts = pgTable('parser_texts', {
  id: text('id').primaryKey(),
  dateString: text('date_string').notNull(),
  content: text('content').default(''),
});

// Photos table (for daily photos)
export const photos = pgTable('photos', {
  id: text('id').primaryKey(),
  dateString: text('date_string').notNull(),
  photoData: text('photo_data').notNull(), // base64 encoded image
});

// Chat Sessions table
export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  messages: jsonb('messages').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Focus Sessions table
export const focusSessions = pgTable('focus_sessions', {
  id: text('id').primaryKey(),
  sessionNumber: integer('session_number').notNull(),
  dateString: text('date_string').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time'), // HH:mm
  contentType: text('content_type').notNull(), // 'task' | 'brainstorm' | 'freewrite' | 'strategy'
  notes: text('notes').default(''),
  aiSummary: text('ai_summary'),
  aiAffirmation: text('ai_affirmation'),
  nextFocusTime: text('next_focus_time'), // HH:mm — locked time for next focus
  nextFocusDate: text('next_focus_date'), // YYYY-MM-DD
  status: text('status').notNull(), // 'active' | 'locked' | 'completed'
});

// Focus Settings table
export const focusSettings = pgTable('focus_settings', {
  id: text('id').primaryKey().default('user_settings'),
  schedule: jsonb('schedule').$type<{ day: string; time: string }[]>(),
  notificationPreMinutes: integer('notification_pre_minutes').default(15),
  notifyOnTime: boolean('notify_on_time').default(true),
});

// Laws table (3 Laws system)
export const laws = pgTable('laws', {
  id: text('id').primaryKey(),
  position: integer('position').notNull(), // 1, 2, or 3
  name: text('name').notNull(),
  description: text('description').default(''),
  startDate: text('start_date').notNull(), // YYYY-MM-DD when this law was set
  endDate: text('end_date'), // YYYY-MM-DD
  isActive: boolean('is_active').default(true),
});

// Law Logs table
export const lawLogs = pgTable('law_logs', {
  id: text('id').primaryKey(), // lawId-dateString
  lawId: text('law_id').notNull(),
  dateString: text('date_string').notNull(),
  kept: boolean('kept').default(false),
});

// DIAMETRIX — Trading protocol meetings (decision journal)
export const diametrixMeetings = pgTable('diametrix_meetings', {
  id: text('id').primaryKey(),
  meetingNumber: integer('meeting_number').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  day: text('day').notNull(), // day name in Hebrew
  time: text('time').notNull(), // HH:mm
  background: text('background').default(''),
  decisions: jsonb('decisions').$type<string[]>().default([]),
  allocations: jsonb('allocations').$type<{ strategy: string; contracts: string }[]>().default([]),
  summary: text('summary').default(''),
  nextMeetingNote: text('next_meeting_note').default(''),
});

// DIAMETRIX — Trading protocol error log
export const diametrixErrors = pgTable('diametrix_errors', {
  id: text('id').primaryKey(),
  errorNumber: integer('error_number').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:mm
  strategy: text('strategy').notNull(),
  errorType: text('error_type').notNull(),
  description: text('description').default(''),
  rootCause: text('root_cause').default(''),
  fix: text('fix').default(''),
  status: text('status').notNull().default('open'), // 'open' | 'resolved'
});

// AI Profile — internal document the AI maintains about the user across focus sessions
export const aiProfile = pgTable('ai_profile', {
  id: text('id').primaryKey().default('main'),
  content: text('content').default(''), // the AI's evolving understanding of the user
  updatedAt: text('updated_at'), // ISO timestamp of last update
});
