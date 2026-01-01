import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { habits } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(habits);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, category, frequency, daysOfWeek, startDate, endDate, iconName, color } = body;

    await db.insert(habits).values({
      id,
      name,
      category,
      frequency,
      daysOfWeek: daysOfWeek || null,
      startDate: startDate || null,
      endDate: endDate || null,
      iconName,
      color,
    }).onConflictDoUpdate({
      target: habits.id,
      set: { name, category, frequency, daysOfWeek: daysOfWeek || null, startDate: startDate || null, endDate: endDate || null, iconName, color },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving habit:', error);
    return NextResponse.json({ error: 'Failed to save habit' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Habit ID required' }, { status: 400 });
    }

    await db.delete(habits).where(eq(habits.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}

