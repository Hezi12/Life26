import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiProfile } from "@/lib/schema";
import { eq } from "drizzle-orm";

interface HistorySession {
    sessionNumber: number;
    dateString: string;
    startTime: string;
    endTime?: string;
    notes: string;
    aiSummary?: string;
    aiAffirmation?: string;
}

function buildHistoryBlock(history: HistorySession[]): string {
    if (history.length === 0) return "אין היסטוריה קודמת — זהו המיקוד הראשון.";

    // Send last 20 sessions for context (most recent are most relevant)
    return history
        .sort((a, b) => a.sessionNumber - b.sessionNumber)
        .slice(-20)
        .map((s) => {
            let block = `[מיקוד ${s.sessionNumber} | ${s.dateString} ${s.startTime}–${s.endTime || "?"}]`;
            if (s.notes) block += `\nהערות: ${s.notes}`;
            if (s.aiSummary) block += `\nסיכום קודם: ${s.aiSummary}`;
            return block;
        })
        .join("\n\n");
}

async function loadProfile(): Promise<string> {
    try {
        const rows = await db.select().from(aiProfile).where(eq(aiProfile.id, 'main'));
        return rows[0]?.content || '';
    } catch {
        return '';
    }
}

async function saveProfile(content: string): Promise<void> {
    try {
        await db.insert(aiProfile)
            .values({ id: 'main', content, updatedAt: new Date().toISOString() })
            .onConflictDoUpdate({
                target: aiProfile.id,
                set: { content, updatedAt: new Date().toISOString() }
            });
    } catch (error) {
        console.error("Failed to save AI profile:", error);
    }
}

export async function POST(req: Request) {
    try {
        const { notes, history } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const historyBlock = buildHistoryBlock(history || []);
        const sessionCount = (history || []).length + 1;
        const currentProfile = await loadProfile();

        const prompt = `אתה משקף אישי במערכת מיקוד. אתה מדבר ישירות אל המשתמש בגוף שני (אתה/את).

=== כללים חשובים ===
- דבר בגוף שני — "עשית", "כתבת", "אתה", לא "הוא" או "האדם"
- היה קצר וענייני. אל תנפח. אל תהיה דרמטי או פאתטי
- אל תניח הנחות על מה שהמשתמש מרגיש או חושב — תגיב רק למה שכתוב
- אל תחמיא סתם. אם אין מה לומר על דפוסים — אמור שעדיין מוקדם
- כתוב עברית טבעית ופשוטה, בלי סגנון מליצי

=== הפרופיל הפנימי שלך ===
${currentProfile || "אין עדיין פרופיל — זהו המיקוד הראשון. התחל לבנות הבנה."}

=== היסטוריה (${sessionCount - 1} מיקודים קודמים) ===
${historyBlock}

=== המיקוד הנוכחי (מיקוד ${sessionCount}) ===
${notes}

=== מה לכתוב ===

חלק א — משוב (בעברית, בגוף שני):

סיכום:
[2-3 משפטים קצרים. מה עשית במיקוד הזה.]

דפוסים:
[${sessionCount <= 3 ? "אם אלה המיקודים הראשונים, כתוב שעדיין מוקדם לזהות דפוסים, או ציין משהו ראשוני שאתה שם לב אליו." : "דפוסים שאתה רואה לאורך המיקודים. הפנה למיקודים קודמים לפי מספר. אם אין דפוס ברור — אמור את זה."}]

אתגר:
[שאלה אחת קצרה או תובנה אחת. ללא הטפה.]

אפירמציה:
[משפט אחד בגוף ראשון שמתחיל ב"אני". מבוסס על מה שבאמת קרה במיקוד.]

חלק ב — עדכון פרופיל:
כתוב בדיוק את השורה:
---PROFILE_UPDATE---
ואז כתוב פרופיל מעודכן. מסמך קצר (עד 10 שורות) בעברית שמכיל:
- מה אתה יודע על המשתמש מתוך המיקודים (עובדות, לא הנחות)
- דפוסים שזיהית
- תחומי עניין שעלו
- שינויים לאורך זמן

הפרופיל הוא מסמך שלם — כתוב מחדש בכל פעם. שמור רק מה שרלוונטי.`;

        const result = await model.generateContent(prompt);
        const fullText = result.response.text();

        // Split feedback from profile update
        const parts = fullText.split('---PROFILE_UPDATE---');
        const feedbackText = parts[0].trim();
        const profileUpdate = parts[1]?.trim();

        // Save updated profile if present
        if (profileUpdate) {
            await saveProfile(profileUpdate);
        }

        // Parse feedback sections
        const summaryMatch = feedbackText.match(/סיכום:\s*([\s\S]*?)(?=דפוסים:|$)/);
        const patternsMatch = feedbackText.match(/דפוסים:\s*([\s\S]*?)(?=אתגר:|$)/);
        const challengeMatch = feedbackText.match(/אתגר:\s*([\s\S]*?)(?=אפירמציה:|$)/);
        const affirmationMatch = feedbackText.match(/אפירמציה:\s*([\s\S]*?)(?=---PROFILE_UPDATE---|$)/);

        const summary = [
            summaryMatch?.[1]?.trim(),
            patternsMatch?.[1]?.trim() ? `דפוסים: ${patternsMatch[1].trim()}` : null,
            challengeMatch?.[1]?.trim() ? `אתגר: ${challengeMatch[1].trim()}` : null,
        ].filter(Boolean).join("\n\n");

        const affirmation = affirmationMatch?.[1]?.trim() || "";

        return NextResponse.json({
            summary: summary || feedbackText,
            affirmation,
        });
    } catch (error: any) {
        console.error("Focus AI Error:", error?.message || error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
