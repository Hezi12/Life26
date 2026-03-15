import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiProfile } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const rows = await db.select().from(aiProfile).where(eq(aiProfile.id, 'main'));
        if (rows.length === 0) {
            return NextResponse.json({ id: 'main', content: '', updatedAt: null });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Failed to fetch AI profile:", error);
        return NextResponse.json({ id: 'main', content: '', updatedAt: null });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { content } = body;

        await db.insert(aiProfile)
            .values({
                id: 'main',
                content,
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: aiProfile.id,
                set: {
                    content,
                    updatedAt: new Date().toISOString(),
                }
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save AI profile:", error);
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }
}
