import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workTopics } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('dateString');
    
    if (dateString) {
      const result = await db.select().from(workTopics).where(eq(workTopics.dateString, dateString));
      return NextResponse.json(result);
    }
    
    const result = await db.select().from(workTopics);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching work topics:', error);
    return NextResponse.json({ error: 'Failed to fetch work topics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, eventId, subjectId, startTime, endTime, durationMinutes, dateString } = body;
    
    await db.insert(workTopics).values({
      id,
      eventId,
      subjectId,
      startTime,
      endTime,
      durationMinutes,
      dateString,
    }).onConflictDoUpdate({
      target: workTopics.id,
      set: { eventId, subjectId, startTime, endTime, durationMinutes, dateString },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving work topic:', error);
    return NextResponse.json({ error: 'Failed to save work topic' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });
    }
    
    await db.delete(workTopics).where(eq(workTopics.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work topic:', error);
    return NextResponse.json({ error: 'Failed to delete work topic' }, { status: 500 });
  }
}

