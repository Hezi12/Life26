import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { focusSessions } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
    try {
        const sessions = await db
            .select()
            .from(focusSessions)
            .orderBy(desc(focusSessions.startTime));

        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Failed to fetch focus sessions:", error);
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, sessionNumber, startTime, endTime, durationMinutes, notes, aiSummary, aiAffirmation, nextSessionPlan, status } = body;

        await db.insert(focusSessions).values({
            id,
            sessionNumber,
            startTime: new Date(startTime),
            endTime: endTime ? new Date(endTime) : null,
            notes,
            aiSummary,
            aiAffirmation,
            nextSessionPlan: nextSessionPlan ? new Date(nextSessionPlan) : null,
            status
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save focus session:", error);
        return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
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
