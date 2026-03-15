import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diametrixErrors } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(diametrixErrors);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching diametrix errors:', error);
    return NextResponse.json({ error: 'Failed to fetch errors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, errorNumber, date, time, strategy, errorType, description, rootCause, fix, status } = body;

    await db.insert(diametrixErrors).values({
      id,
      errorNumber,
      date,
      time,
      strategy,
      errorType,
      description: description || '',
      rootCause: rootCause || '',
      fix: fix || '',
      status: status || 'open',
    }).onConflictDoUpdate({
      target: diametrixErrors.id,
      set: { errorNumber, date, time, strategy, errorType, description: description || '', rootCause: rootCause || '', fix: fix || '', status: status || 'open' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving diametrix error:', error);
    return NextResponse.json({ error: 'Failed to save error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Error ID required' }, { status: 400 });
    }

    await db.delete(diametrixErrors).where(eq(diametrixErrors.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diametrix error:', error);
    return NextResponse.json({ error: 'Failed to delete error' }, { status: 500 });
  }
}
