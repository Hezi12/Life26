import { pgTable, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

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

// Habits table
export const habits = pgTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  frequency: text('frequency').notNull(), // 'daily' | 'weekly' | 'specific'
  daysOfWeek: jsonb('days_of_week').$type<number[]>(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  iconName: text('icon_name').notNull(),
  color: text('color').notNull(),
});

// Habit Logs table
export const habitLogs = pgTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull(),
  dateString: text('date_string').notNull(),
  completed: boolean('completed').default(false),
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
