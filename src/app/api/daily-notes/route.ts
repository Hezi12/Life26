import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyNotes } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('dateString');
    
    if (!dateString) {
      return NextResponse.json({ error: 'dateString required' }, { status: 400 });
    }
    
    const result = await db.select().from(dailyNotes).where(eq(dailyNotes.dateString, dateString)).limit(1);
    return NextResponse.json(result[0] || null);
  } catch (error) {
    console.error('Error fetching daily notes:', error);
    return NextResponse.json({ error: 'Failed to fetch daily notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, dateString, content } = body;
    
    await db.insert(dailyNotes).values({
      id,
      dateString,
      content: content || '',
    }).onConflictDoUpdate({
      target: dailyNotes.id,
      set: { content: content || '' },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving daily notes:', error);
    return NextResponse.json({ error: 'Failed to save daily notes' }, { status: 500 });
  }
}

