import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ===== OpenAI Setup =====
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ===== Gemini Setup =====
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

// ===== Helper Functions =====
function cleanJSON(text) {
  return (text || "")
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

function safeParseJSON(str, fallbackKey = "data") {
  try {
    return JSON.parse(cleanJSON(str));
  } catch {
    return { [fallbackKey]: cleanJSON(str) };
  }
}

// ===== AI Providers =====
async function generateWithOpenAI({ category, count, target }) {
  if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY");

  const openai = new OpenAI({ apiKey: openaiApiKey });

  const prompt = `
  Create ${count} well-crafted ${category} questions for ${target}.
  These questions will be to evaluate the user's ${category} health.

  Return ONLY valid JSON:
  [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": 0
    }
  ]
  `;

  const completion = await openai.chat.completions.create({
    model: openaiModel,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  const rawText = completion.choices[0].message.content;
  return safeParseJSON(rawText, "questions");
}

async function generateWithGemini({ category, count, target }) {
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
  Create ${count} well-crafted ${category} questions for ${target} rehabilitation.

  Return ONLY valid JSON:
  [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": 0
    }
  ]
  `;

  const result = await model.generateContent(prompt);
  const rawText = await result.response.text();
  return safeParseJSON(rawText, "questions");
}

// ===== Route =====
router.get("/", async (req, res) => {
  const { category, count, target } = req.query;

  try {
    console.log("⚡ Trying OpenAI...");
    const data = await generateWithOpenAI({ category, count, target });
    return res.json(data);
  } catch (err) {
    console.warn(`⚠ OpenAI failed, switching to Gemini: ${err.message}`);
    try {
      const data = await generateWithGemini({ category, count, target });
      return res.json(data);
    } catch (err2) {
      console.error(`❌ Both AI providers failed: ${err2.message}`);
      return res.status(500).json({ error: "AI generation failed" });
    }
  }
});

export default router;