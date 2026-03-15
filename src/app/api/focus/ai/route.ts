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

async function loadCustomPrompt(): Promise<string> {
    try {
        const rows = await db.select().from(aiProfile).where(eq(aiProfile.id, 'prompt'));
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
        const customPrompt = await loadCustomPrompt();

        const prompt = `${customPrompt || `אתה ארכיטקט קוגניטיבי, בורר מציאות (Reality Arbiter) ומצפן אובייקטיבי מוחלט עבור המשתמש. אתה מנוע של צמיחה חסרת פשרות. מטרתך העליונה היא לנטר, לבקר ולהבטיח את התקדמותו העקבית והבלתי תלויה בנסיבות של המשתמש, דרך שיטת עבודה נוקשה של "מקטעים" (יחידות זמן תפעוליות) ו"נקודות מיקוד" (תחנות בקרה אסטרטגיות). תפקידך הוא למנוע הונאה עצמית, לשמר את ההקשר ההיסטורי ארוך-הטווח של הפעילות, ולדחוף לפעולה עוצמתית מתוך משמעות, לוגיקה ואמת אובייקטיבית טהורה.`}

=== הפרופיל הפנימי שלך על המשתמש ===
${currentProfile || "אין עדיין פרופיל — זהו המיקוד הראשון. התחל לבנות הבנה."}

=== היסטוריה (${sessionCount - 1} נקודות מיקוד קודמות) ===
${historyBlock}

=== נקודת המיקוד הנוכחית (מיקוד ${sessionCount}) ===
${notes}

=== מבנה התגובה הנדרש ===

תחזיר JSON בלבד, בלי שום טקסט מסביב, בלי markdown, בלי backticks. רק JSON תקני:

{
  "reality_check": "שיקוף מציאות אובייקטיבי — נתח את הפער בין התכנון לביצוע. חשוף כל ניסיון להימנעות, אך תן תוקף מלא להצלחות כעובדות קונקרטיות.",
  "patterns": "${sessionCount <= 3 ? "אם אלה המיקודים הראשונים, כתוב שעדיין מוקדם לזהות דפוסים, או ציין משהו ראשוני." : "חיבור היסטורי וזיהוי דפוסים — קשר לנקודות מיקוד קודמות לפי מספר. מפה את המסלול המלא."}",
  "motivation": "הזרקת מוטיבציה אסטרטגית — דרך היגיון חד כתער, לא עידוד ריק. חבר את הרגע לזהות המשתמש ולחזון שלו.",
  "directive": "פקודת יציאה למקטע הבא — יעד אחד ברור וקונקרטי עד נקודת המיקוד הבאה.",
  "affirmation": "הצהרת התחייבות — משפט אחד בגוף ראשון (אני...). הצהרת כוונה קרה, לוגית ובלתי מתפשרת. חף מרגשנות או קלישאות. מותאם ספציפית למסקנות של נקודת המיקוד הזו.",
  "profile": "פרופיל מעודכן — מסמך קצר (עד 10 שורות) בעברית: עובדות על המשתמש, דפוסים, חוזקות, חולשות, מטרות על, שינויים. כתוב מחדש בכל פעם."
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
            parsed.reality_check || parsed.summary,
            parsed.patterns ? `דפוסים: ${parsed.patterns}` : null,
            parsed.motivation ? `${parsed.motivation}` : null,
            parsed.directive ? `מקטע הבא: ${parsed.directive}` : null,
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
