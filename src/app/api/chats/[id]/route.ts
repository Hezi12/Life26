
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatSessions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await db.delete(chatSessions).where(eq(chatSessions.id, params.id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete chat:", error);
        return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
    }
}
