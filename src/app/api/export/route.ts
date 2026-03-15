import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function GET() {
  try {
    const [
      categories,
      events,
      workSubjects,
      workTopics,
      dailyNotes,
      stickyNotes,
      pomodoroSettings,
      dailyMissions,
      focusSessions,
      focusSettings,
      laws,
      lawLogs,
      aiProfile,
      chatSessions,
    ] = await Promise.all([
      db.select().from(schema.categories),
      db.select().from(schema.events),
      db.select().from(schema.workSubjects),
      db.select().from(schema.workTopics),
      db.select().from(schema.dailyNotes),
      db.select().from(schema.stickyNotes),
      db.select().from(schema.pomodoroSettings),
      db.select().from(schema.dailyMissions),
      db.select().from(schema.focusSessions),
      db.select().from(schema.focusSettings),
      db.select().from(schema.laws),
      db.select().from(schema.lawLogs),
      db.select().from(schema.aiProfile),
      db.select().from(schema.chatSessions),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      data: {
        categories,
        events,
        workSubjects,
        workTopics,
        dailyNotes,
        stickyNotes,
        pomodoroSettings,
        dailyMissions,
        focusSessions,
        focusSettings,
        laws,
        lawLogs,
        aiProfile,
        chatSessions,
      },
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="life26-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
