import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diametrixMeetings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(diametrixMeetings);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching diametrix meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, meetingNumber, date, day, time, background, decisions, allocations, summary, nextMeetingNote } = body;

    await db.insert(diametrixMeetings).values({
      id,
      meetingNumber,
      date,
      day,
      time,
      background: background || '',
      decisions: decisions || [],
      allocations: allocations || [],
      summary: summary || '',
      nextMeetingNote: nextMeetingNote || '',
    }).onConflictDoUpdate({
      target: diametrixMeetings.id,
      set: { meetingNumber, date, day, time, background: background || '', decisions: decisions || [], allocations: allocations || [], summary: summary || '', nextMeetingNote: nextMeetingNote || '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving diametrix meeting:', error);
    return NextResponse.json({ error: 'Failed to save meeting' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 });
    }

    await db.delete(diametrixMeetings).where(eq(diametrixMeetings.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diametrix meeting:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
