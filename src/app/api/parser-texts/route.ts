import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parserTexts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('dateString');

    if (!dateString) {
      return NextResponse.json({ error: 'dateString required' }, { status: 400 });
    }

    const result = await db.select().from(parserTexts).where(eq(parserTexts.dateString, dateString)).limit(1);
    return NextResponse.json(result[0] || null);
  } catch (error) {
    console.error('Error fetching parser texts:', error);
    return NextResponse.json({ error: 'Failed to fetch parser texts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, dateString, content } = body;

    await db.insert(parserTexts).values({
      id: id || `parser-${dateString}`,
      dateString,
      content: content || '',
    }).onConflictDoUpdate({
      target: parserTexts.id,
      set: { content: content || '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving parser texts:', error);
    return NextResponse.json({ error: 'Failed to save parser texts' }, { status: 500 });
  }
}


