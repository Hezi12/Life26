
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatSessions } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
    try {
        const sessions = await db
            .select()
            .from(chatSessions)
            .orderBy(desc(chatSessions.updatedAt));

        return NextResponse.json(sessions);
    } catch (error) {
        console.error("Failed to fetch chats:", error);
        return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, title, messages, updatedAt } = body;

        // Check if exists using id
        const existing = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.id, id));

        if (existing.length > 0) {
            await db
                .update(chatSessions)
                .set({ title, messages, updatedAt })
                .where(eq(chatSessions.id, id));
        } else {
            await db
                .insert(chatSessions)
                .values({ id, title, messages, updatedAt });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save chat:", error);
        return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
    }
}
