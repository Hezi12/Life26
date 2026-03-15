import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { laws } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(laws);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching laws:', error);
    return NextResponse.json({ error: 'Failed to fetch laws' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, position, name, description, startDate, endDate, isActive } = body;

    await db.insert(laws).values({
      id,
      position,
      name,
      description: description || '',
      startDate,
      endDate: endDate || null,
      isActive: isActive !== undefined ? isActive : true,
    }).onConflictDoUpdate({
      target: laws.id,
      set: { position, name, description: description || '', startDate, endDate: endDate || null, isActive: isActive !== undefined ? isActive : true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving law:', error);
    return NextResponse.json({ error: 'Failed to save law' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Law ID required' }, { status: 400 });
    }

    await db.delete(laws).where(eq(laws.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting law:', error);
    return NextResponse.json({ error: 'Failed to delete law' }, { status: 500 });
  }
}
