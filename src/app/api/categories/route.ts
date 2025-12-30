import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(categories);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color, iconName, keywords } = body;
    
    await db.insert(categories).values({
      id,
      name,
      color,
      iconName,
      keywords: keywords || [],
    }).onConflictDoUpdate({
      target: categories.id,
      set: { name, color, iconName, keywords: keywords || [] },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving category:', error);
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 });
  }
}

