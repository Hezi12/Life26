import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workSubjects } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(workSubjects);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching work subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch work subjects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color, iconName } = body;

    await db.insert(workSubjects).values({
      id,
      name,
      color,
      iconName,
    }).onConflictDoUpdate({
      target: workSubjects.id,
      set: { name, color, iconName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving work subject:', error);
    return NextResponse.json({ error: 'Failed to save work subject' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subject ID required' }, { status: 400 });
    }

    await db.delete(workSubjects).where(eq(workSubjects.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work subject:', error);
    return NextResponse.json({ error: 'Failed to delete work subject' }, { status: 500 });
  }
}


