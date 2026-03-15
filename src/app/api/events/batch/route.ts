import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { events } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Batch replace: delete all events for a date, then insert new ones
// Note: neon-http driver does not support transactions, so we run sequential queries
export async function POST(request: NextRequest) {
    try {
          const body = await request.json();
          const { dateString, events: newEvents } = body as {
                  dateString: string;
                  events: { id: string; dateString: string; time: string; title: string; categoryId: string }[];
          };

      if (!dateString) {
              return NextResponse.json({ error: 'dateString required' }, { status: 400 });
      }

      // 1. Delete all existing events for this date
      await db.delete(events).where(eq(events.dateString, dateString));

      // 2. Insert all new events (skip if empty — delete-only mode)
      if (newEvents && newEvents.length > 0) {
              await db.insert(events).values(
                        newEvents.map(e => ({
                                    id: e.id,
                                    dateString: e.dateString,
                                    time: e.time,
                                    title: e.title,
                                    categoryId: e.categoryId,
                        }))
                      );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
          console.error('Error in batch event replace:', error);
          return NextResponse.json({ error: 'Failed to batch replace events' }, { status: 500 });
    }
}
