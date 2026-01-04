
import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, sessionNumber, startTime, endTime, notes, aiSummary, aiAffirmation, nextSessionPlan, status } = body;

        // Insert new session
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

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, startTime } = body;

        if (!id || !startTime) {
            return NextResponse.json({ error: "ID and startTime are required" }, { status: 400 });
        }

        await db.update(focusSessions)
            .set({ startTime: new Date(startTime) })
            .where(eq(focusSessions.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update focus session:", error);
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await db.delete(focusSessions);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to reset focus sessions:", error);
        return NextResponse.json({ error: "Failed to reset sessions" }, { status: 500 });
    }
}
