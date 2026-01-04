import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habitLogs } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habitId');
    const dateString = searchParams.get('dateString');

    if (habitId && dateString) {
      const result = await db.select().from(habitLogs).where(
        and(eq(habitLogs.habitId, habitId), eq(habitLogs.dateString, dateString))
      ).limit(1);
      return NextResponse.json(result[0] || null);
    } else if (habitId) {
      const result = await db.select().from(habitLogs).where(eq(habitLogs.habitId, habitId));
      return NextResponse.json(result);
    } else if (dateString) {
      const result = await db.select().from(habitLogs).where(eq(habitLogs.dateString, dateString));
      return NextResponse.json(result);
    } else {
      const result = await db.select().from(habitLogs);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching habit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch habit logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, habitId, dateString, completed } = body;

    await db.insert(habitLogs).values({
      id: id || `log-${habitId}-${dateString}`,
      habitId,
      dateString,
      completed: completed !== undefined ? completed : false,
    }).onConflictDoUpdate({
      target: habitLogs.id,
      set: { completed: completed !== undefined ? completed : false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving habit log:', error);
    return NextResponse.json({ error: 'Failed to save habit log' }, { status: 500 });
  }
}


