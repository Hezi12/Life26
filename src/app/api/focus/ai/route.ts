
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { notes } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Missing API Key" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const summaryPrompt = `אנא קרא את המיקוד הזה וכתוב ממנו סיכום של 2-3 שורות שיעזור לאדם להבין מה הוא עבר במיקוד הזה. כתוב בעברית: ${notes}`;
        const affirmationPrompt = `על בסיס המיקוד הזה, כתוב משפט אחד מחזק ומעודד בגוף ראשון שמתחיל ב'אני' שיעזור לאדם להחדיר לעצמו מוטיבציה. חשוב שיהיה בגוף ראשון! כתוב בעברית: ${notes}`;

        // Run in parallel
        const [summaryResult, affirmationResult] = await Promise.all([
            model.generateContent(summaryPrompt),
            model.generateContent(affirmationPrompt)
        ]);

        const summary = summaryResult.response.text();
        const affirmation = affirmationResult.response.text();

        return NextResponse.json({ summary, affirmation });
    } catch (error) {
        console.error("Focus AI Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
