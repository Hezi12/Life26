
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { focusSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const settings = await db
            .select()
            .from(focusSettings)
            .where(eq(focusSettings.id, 'user_settings'))
            .limit(1);

        if (settings.length === 0) {
            return NextResponse.json({
                schedule: [],
                notificationPreMinutes: 15,
                notifyOnTime: true
            });
        }

        return NextResponse.json(settings[0]);
    } catch (error) {
        console.error("Failed to fetch focus settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { schedule, notificationPreMinutes, notifyOnTime } = body;

        await db
            .insert(focusSettings)
            .values({
                id: 'user_settings',
                schedule,
                notificationPreMinutes,
                notifyOnTime
            })
            .onConflictDoUpdate({
                target: focusSettings.id,
                set: { schedule, notificationPreMinutes, notifyOnTime }
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save focus settings:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
