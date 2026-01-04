import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stickyNotes } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(stickyNotes).where(eq(stickyNotes.id, 'sticky-1')).limit(1);
    return NextResponse.json(result[0] || { id: 'sticky-1', content: '' });
  } catch (error) {
    console.error('Error fetching sticky notes:', error);
    return NextResponse.json({ error: 'Failed to fetch sticky notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content } = body;

    await db.insert(stickyNotes).values({
      id: id || 'sticky-1',
      content: content || '',
    }).onConflictDoUpdate({
      target: stickyNotes.id,
      set: { content: content || '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving sticky notes:', error);
    return NextResponse.json({ error: 'Failed to save sticky notes' }, { status: 500 });
  }
}


