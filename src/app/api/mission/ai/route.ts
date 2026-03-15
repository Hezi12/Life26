import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { focusSessions, dailyMissions, aiProfile } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export const maxDuration = 60;

async function loadProfile(): Promise<string> {
    try {
        const rows = await db.select().from(aiProfile).where(eq(aiProfile.id, 'main'));
        return rows[0]?.content || '';
    } catch {
        return '';
    }
}

export async function POST(req: Request) {
    try {
        const { dateString } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
        }

        // Load all focus sessions (last 50 for context)
        const sessions = await db
            .select()
            .from(focusSessions)
            .orderBy(desc(focusSessions.dateString), desc(focusSessions.startTime))
            .limit(50);

        // Load recent missions for context
        const recentMissions = await db
            .select()
            .from(dailyMissions)
            .orderBy(desc(dailyMissions.dateString))
            .limit(14);

        // Load AI profile
        const profile = await loadProfile();

        // Build focus history block
        const historyBlock = sessions.length === 0
            ? "אין היסטוריה של מיקודים."
            : sessions
                .sort((a, b) => `${a.dateString} ${a.startTime}`.localeCompare(`${b.dateString} ${b.startTime}`))
                .map(s => {
                    let block = `[מיקוד ${s.sessionNumber} | ${s.dateString} ${s.startTime}–${s.endTime || "?"}] (${s.contentType})`;
                    if (s.notes) block += `\nהערות: ${s.notes}`;
                    if (s.aiSummary) block += `\nסיכום AI: ${s.aiSummary}`;
                    if (s.aiAffirmation) block += `\nהתחייבות: ${s.aiAffirmation}`;
                    return block;
                })
                .join("\n\n");

        // Build missions history block
        const missionsBlock = recentMissions.length === 0
            ? "אין היסטוריה של מטרות יומיות."
            : recentMissions
                .sort((a, b) => a.dateString.localeCompare(b.dateString))
                .map(m => {
                    let block = `[${m.dateString}] מטרה: "${m.mission}"`;
                    if (m.score !== null && m.score !== undefined) block += ` | ציון: ${m.score}/3`;
                    if (m.reflection) block += ` | רפלקציה: ${m.reflection}`;
                    return block;
                })
                .join("\n");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const prompt = `אתה ארכיטקט קוגניטיבי שמנתח את כל היסטוריית המיקודים והמטרות היומיות של המשתמש ומייצר את המטרה היומית המדויקת ביותר.

=== הפרופיל שלך על המשתמש ===
${profile || "אין פרופיל זמין עדיין."}

=== היסטוריית מיקודים (${sessions.length} סשנים) ===
${historyBlock}

=== היסטוריית מטרות יומיות (${recentMissions.length} ימים אחרונים) ===
${missionsBlock}

=== התאריך המבוקש ===
${dateString}

=== משימה ===
בהתבסס על כל ההיסטוריה — מיקודים, הערות, סיכומי AI, התחייבויות, מטרות קודמות וציוניהם — קבע מהי המטרה היומית הנכונה ביותר להיום (${dateString}).

כללים:
1. המטרה צריכה להיות ספציפית, ברורה, וניתנת למדידה
2. היא צריכה להתבסס על מה שעלה במיקודים האחרונים — לא דבר כללי
3. היא צריכה להמשיך את המומנטום מהימים הקודמים
4. אם יש דפוס של הימנעות או כישלון חוזר — תתייחס לזה
5. תן גם הסבר קצר למה בחרת את המטרה הזו

תחזיר JSON בלבד, בלי שום טקסט מסביב, בלי markdown, בלי backticks:

{
  "mission": "המטרה היומית — משפט אחד ברור וחד",
  "reasoning": "הסבר קצר (2-3 משפטים) למה זו המטרה הנכונה להיום, מבוסס על ההיסטוריה",
  "based_on": "רשימה קצרה של מיקודים/מטרות ספציפיים שהשפיעו על הבחירה",
  "completion_criteria": "איך המשתמש יידע שהמטרה בוצעה — קריטריון ברור אחד"
}`;

        const result = await model.generateContent(prompt);
        const fullText = result.response.text();

        const jsonStr = fullText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(jsonStr);

        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error("Mission AI Error:", error?.message || error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
