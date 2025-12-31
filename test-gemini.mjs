
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Missing API Key");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    console.log("Testing various models...");

    const modelsToTry = [
        "gemini-2.5-pro",
        "gemini-2.0-flash",
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`\nAttempting: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ SUCCESS with ${modelName}!`);
            console.log("Response:", (await result.response).text());
            return; // Stop after first success
        } catch (e) {
            console.log(`❌ FAILED ${modelName}: ${e.message}`);
        }
    }

    console.log("\nAll attempts failed. Trying to list models via REST API...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Available models:", data.models.map(m => m.name));
        } else {
            console.log("Could not list models. Response:", data);
        }
    } catch (e) {
        console.log("Failed to list models:", e);
    }
}

test();
