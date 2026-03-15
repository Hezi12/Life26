import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lawLogs } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lawId = searchParams.get('lawId');
    const dateString = searchParams.get('dateString');

    if (lawId && dateString) {
      const result = await db.select().from(lawLogs).where(
        and(eq(lawLogs.lawId, lawId), eq(lawLogs.dateString, dateString))
      ).limit(1);
      return NextResponse.json(result[0] || null);
    } else if (lawId) {
      const result = await db.select().from(lawLogs).where(eq(lawLogs.lawId, lawId));
      return NextResponse.json(result);
    } else if (dateString) {
      const result = await db.select().from(lawLogs).where(eq(lawLogs.dateString, dateString));
      return NextResponse.json(result);
    } else {
      const result = await db.select().from(lawLogs);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching law logs:', error);
    return NextResponse.json({ error: 'Failed to fetch law logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, lawId, dateString, kept } = body;

    await db.insert(lawLogs).values({
      id: id || `${lawId}-${dateString}`,
      lawId,
      dateString,
      kept: kept !== undefined ? kept : false,
    }).onConflictDoUpdate({
      target: lawLogs.id,
      set: { kept: kept !== undefined ? kept : false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving law log:', error);
    return NextResponse.json({ error: 'Failed to save law log' }, { status: 500 });
  }
}
