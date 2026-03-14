import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { focusSessions } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
    try {
        const sessions = await db
            .select()
            .from(focusSessions)
            .orderBy(desc(focusSessions.sessionNumber));

        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Failed to fetch focus sessions:", error);
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, sessionNumber, dateString, startTime, endTime, contentType, notes, aiSummary, aiAffirmation, nextFocusTime, nextFocusDate, status } = body;

        await db.insert(focusSessions).values({
            id,
            sessionNumber,
            dateString,
            startTime,
            endTime: endTime || null,
            contentType,
            notes: notes || '',
            aiSummary: aiSummary || null,
            aiAffirmation: aiAffirmation || null,
            nextFocusTime: nextFocusTime || null,
            nextFocusDate: nextFocusDate || null,
            status
        }).onConflictDoUpdate({
            target: focusSessions.id,
            set: { sessionNumber, dateString, startTime, endTime: endTime || null, contentType, notes: notes || '', aiSummary: aiSummary || null, aiAffirmation: aiAffirmation || null, nextFocusTime: nextFocusTime || null, nextFocusDate: nextFocusDate || null, status }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save focus session:", error);
        return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing session id" }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (updates.endTime !== undefined) updateData.endTime = updates.endTime;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.contentType !== undefined) updateData.contentType = updates.contentType;
        if (updates.aiSummary !== undefined) updateData.aiSummary = updates.aiSummary;
        if (updates.aiAffirmation !== undefined) updateData.aiAffirmation = updates.aiAffirmation;
        if (updates.nextFocusTime !== undefined) updateData.nextFocusTime = updates.nextFocusTime;
        if (updates.nextFocusDate !== undefined) updateData.nextFocusDate = updates.nextFocusDate;
        if (updates.status !== undefined) updateData.status = updates.status;

        await db.update(focusSessions).set(updateData).where(eq(focusSessions.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update focus session:", error);
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing session id" }, { status: 400 });
        }

        await db.delete(focusSessions).where(eq(focusSessions.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete focus session:", error);
        return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
    }
}
