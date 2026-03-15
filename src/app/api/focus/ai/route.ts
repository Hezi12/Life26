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

export const maxDuration = 60;

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

תחזיר JSON בלבד, בלי שום טקסט מסביב, בלי markdown, בלי backticks. רק JSON תקני:

{
  "summary": "2-3 משפטים קצרים. מה עשה במיקוד הזה.",
  "patterns": "${sessionCount <= 3 ? "אם אלה המיקודים הראשונים, כתוב שעדיין מוקדם לזהות דפוסים, או ציין משהו ראשוני." : "דפוסים לאורך המיקודים. הפנה למיקודים קודמים לפי מספר. אם אין דפוס — אמור את זה."}",
  "challenge": "שאלה אחת קצרה או תובנה אחת. ללא הטפה.",
  "affirmation": "משפט אחד בגוף ראשון שמתחיל באני. מבוסס על מה שקרה במיקוד.",
  "profile": "פרופיל מעודכן - מסמך קצר (עד 10 שורות) בעברית: עובדות על המשתמש, דפוסים, תחומי עניין, שינויים. כתוב מחדש בכל פעם."
}`;

        const result = await model.generateContent(prompt);
        const fullText = result.response.text();

        // Parse JSON response (strip markdown code fences if present)
        const jsonStr = fullText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(jsonStr);

        // Save updated profile if present
        if (parsed.profile) {
            await saveProfile(parsed.profile);
        }

        const summary = [
            parsed.summary,
            parsed.patterns ? `דפוסים: ${parsed.patterns}` : null,
            parsed.challenge ? `אתגר: ${parsed.challenge}` : null,
        ].filter(Boolean).join("\n\n");

        return NextResponse.json({
            summary,
            affirmation: parsed.affirmation || "",
        });
    } catch (error: any) {
        console.error("Focus AI Error:", error?.message || error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
