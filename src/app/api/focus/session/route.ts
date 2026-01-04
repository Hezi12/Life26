
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
        const { id, startTime, nextSessionPlan } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const updateData: any = {};
        if (startTime) {
            updateData.startTime = new Date(startTime);
        }
        if (nextSessionPlan !== undefined) {
            updateData.nextSessionPlan = nextSessionPlan ? new Date(nextSessionPlan) : null;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "At least one field to update is required" }, { status: 400 });
        }

        await db.update(focusSessions)
            .set(updateData)
            .where(eq(focusSessions.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update focus session:", error);
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            // Delete specific session
            await db.delete(focusSessions)
                .where(eq(focusSessions.id, id));
            return NextResponse.json({ success: true });
        } else {
            // Delete all sessions (for reset functionality)
            await db.delete(focusSessions);
            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error("Failed to delete focus session:", error);
        return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
    }
}
