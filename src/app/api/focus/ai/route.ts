import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

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

    return history
        .sort((a, b) => a.sessionNumber - b.sessionNumber)
        .map((s) => {
            let block = `[מיקוד ${s.sessionNumber} | ${s.dateString} ${s.startTime}–${s.endTime || "?"}]`;
            if (s.notes) block += `\nהערות: ${s.notes}`;
            if (s.aiSummary) block += `\nסיכום קודם: ${s.aiSummary}`;
            return block;
        })
        .join("\n\n");
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

        const prompt = `אתה שותף אסטרטגי בפרוטוקול מיקוד — מערכת אישית של צמיחה רציפה.
תפקידך: לשמר הקשר היסטורי, למנוע סטיות מנתיב, ולשקף מצב אובייקטיבי שאינו מאפשר הונאה עצמית.

=== היסטוריית מיקודים קודמים (${sessionCount - 1} מיקודים) ===
${historyBlock}

=== המיקוד הנוכחי (מיקוד ${sessionCount}) ===
${notes}

=== המשימה שלך ===
כתוב משוב בעברית בפורמט הבא בדיוק (שמור על הכותרות):

סיכום:
[2-3 משפטים. מה קרה במיקוד הזה. תמצת את הליבה.]

דפוסים:
[${sessionCount <= 2 ? "אם זה אחד המיקודים הראשונים, ציין את זה וכתוב מה אתה מתחיל לראות." : "זהה דפוסים חוזרים, שינויים, התקדמות או נסיגה ביחס למיקודים קודמים. היה ספציפי — הפנה למיקודים קודמים לפי מספר."}]

אתגר:
[שאלה אחת חדה או תובנה אחת שמאתגרת את האדם. אל תחמיא — תשקף אמת. אם יש פער בין מה שהוא אומר למה שהוא עושה, ציין את זה.]

אפירמציה:
[משפט אחד בגוף ראשון שמתחיל ב"אני". מבוסס על מה שבאמת קרה, לא על מה שהאדם רוצה לשמוע.]

חשוב: כתוב בתמציתיות. אל תכתוב יותר מ-6 שורות בסך הכל. עברית בלבד.`;

        const result = await model.generateContent(prompt);
        const fullText = result.response.text();

        // Parse sections
        const summaryMatch = fullText.match(/סיכום:\s*([\s\S]*?)(?=דפוסים:|$)/);
        const patternsMatch = fullText.match(/דפוסים:\s*([\s\S]*?)(?=אתגר:|$)/);
        const challengeMatch = fullText.match(/אתגר:\s*([\s\S]*?)(?=אפירמציה:|$)/);
        const affirmationMatch = fullText.match(/אפירמציה:\s*([\s\S]*?)$/);

        const summary = [
            summaryMatch?.[1]?.trim(),
            patternsMatch?.[1]?.trim() ? `דפוסים: ${patternsMatch[1].trim()}` : null,
            challengeMatch?.[1]?.trim() ? `אתגר: ${challengeMatch[1].trim()}` : null,
        ].filter(Boolean).join("\n\n");

        const affirmation = affirmationMatch?.[1]?.trim() || "";

        return NextResponse.json({
            summary: summary || fullText,
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
