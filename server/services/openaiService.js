import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  return new OpenAI({ apiKey });
}

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

export async function generateQuestions({ category, count, target }) {
  const openai = getClient();

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

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });

  const rawText = completion.choices[0].message.content;
  return safeParseJSON(rawText, "questions");
}
