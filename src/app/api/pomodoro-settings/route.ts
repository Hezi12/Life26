import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pomodoroSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(pomodoroSettings).where(eq(pomodoroSettings.id, 'default')).limit(1);
    return NextResponse.json(result[0] || {
      id: 'default',
      workMinutes: 60,
      breakMinutes: 5,
      soundsEnabled: true,
      workSound: 'success',
      breakSound: 'chime',
    });
  } catch (error) {
    console.error('Error fetching pomodoro settings:', error);
    return NextResponse.json({ error: 'Failed to fetch pomodoro settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workMinutes, breakMinutes, soundsEnabled, workSound, breakSound } = body;

    await db.insert(pomodoroSettings).values({
      id: 'default',
      workMinutes,
      breakMinutes,
      soundsEnabled,
      workSound,
      breakSound,
    }).onConflictDoUpdate({
      target: pomodoroSettings.id,
      set: { workMinutes, breakMinutes, soundsEnabled, workSound, breakSound },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving pomodoro settings:', error);
    return NextResponse.json({ error: 'Failed to save pomodoro settings' }, { status: 500 });
  }
}


