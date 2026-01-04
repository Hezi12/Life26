import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyMissions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('dateString');

    if (dateString) {
      const result = await db.select().from(dailyMissions).where(eq(dailyMissions.dateString, dateString)).limit(1);
      return NextResponse.json(result[0] || null);
    }

    const result = await db.select().from(dailyMissions);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching daily missions:', error);
    return NextResponse.json({ error: 'Failed to fetch daily missions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, dateString, mission, reflection, score } = body;

    await db.insert(dailyMissions).values({
      id: id || `mission-${dateString}`,
      dateString,
      mission,
      reflection: reflection || null,
      score: score !== undefined ? score : null,
    }).onConflictDoUpdate({
      target: dailyMissions.id,
      set: { mission, reflection: reflection || null, score: score !== undefined ? score : null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving daily mission:', error);
    return NextResponse.json({ error: 'Failed to save daily mission' }, { status: 500 });
  }
}


