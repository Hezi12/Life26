import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { photos } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('dateString');

    if (!dateString) {
      return NextResponse.json({ error: 'dateString required' }, { status: 400 });
    }

    const result = await db.select().from(photos).where(eq(photos.dateString, dateString)).limit(1);
    return NextResponse.json(result[0] || null);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, dateString, photoData } = body;

    await db.insert(photos).values({
      id: id || `photo-${dateString}`,
      dateString,
      photoData,
    }).onConflictDoUpdate({
      target: photos.id,
      set: { photoData },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving photos:', error);
    return NextResponse.json({ error: 'Failed to save photos' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateString = searchParams.get('dateString');

    if (!dateString) {
      return NextResponse.json({ error: 'dateString required' }, { status: 400 });
    }

    await db.delete(photos).where(eq(photos.dateString, dateString));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photos:', error);
    return NextResponse.json({ error: 'Failed to delete photos' }, { status: 500 });
  }
}

