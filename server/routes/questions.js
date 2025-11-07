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
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// ===== Helpers =====
function cleanJSON(text) {
  return (text || "")
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

function safeParseJSON(str) {
  const cleaned = cleanJSON(str);
  try {
    return JSON.parse(cleaned);
  } catch {
    return cleaned; // return raw text so we can try other fallbacks
  }
}

function extractQuestions(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
  if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
  return [];
}

// Heuristic fallback ONLY if AI forgets points.
// Tries to infer direction (positive/negative health) from the question text.
function addHeuristicPoints(questionText, options) {
  const negQ = /stress|pain|smok|alcohol|drink|sugar|candy|soda|junk|fast\s*food|screen|sedentary|sitting|anxiety|depress|fatigue|exhaust|insomnia|bp|blood pressure|cholesterol/i.test(
    questionText || ""
  );

  const toObj = (opt) =>
    typeof opt === "string" ? { text: opt, value: opt } : { text: opt.text || opt.value, value: opt.value || opt.text };

  const scored = options.map((raw) => {
    const o = toObj(raw);
    const t = (o.text || "").toLowerCase();

    // common labels
    const isBest =
      /always|excellent|great|7-9|4-5|often exercise|well-rested|clear|none|never|low|rarely/.test(t);
    const isWorst =
      /never(?!.*exercise)|poor|<5|0-1|high|severe|always (?!good)|daily(?! exercise)|frequent(?! exercise)/.test(t);

    let points;

    if (negQ) {
      // For negative constructs (stress, pain, smoking, etc.), lower intensity is healthier
      if (/(none|never|low|rarely|minimal)/.test(t)) points = 3;
      else if (/(moderate|sometimes|medium|some)/.test(t)) points = 2;
      else if (/(often|high|frequent|severe|daily|always)/.test(t)) points = 0;
      else if (isBest) points = 3;
      else if (isWorst) points = 0;
      else points = 1; // neutral fallback
    } else {
      // Positive constructs (sleep, hydration, steps, exercise, fruits/veg)
      if (isBest) points = 3;
      else if (/(most|good|3-4|sometimes|moderate|ok|fair)/.test(t)) points = 2;
      else if (/(rarely|1-2|poor|not much)/.test(t)) points = 1;
      else if (isWorst) points = 0;
      else points = 1; // neutral fallback
    }

    return { ...o, points };
  });

  // Ensure points are 0..3 ints
  return scored.map((o) => ({ ...o, points: Math.max(0, Math.min(3, Math.round(o.points ?? 0))) }));
}

function normalizeQuestions(raw) {
  const list = extractQuestions(raw);
  return list
    .map((q) => {
      const questionText = q.question || q.questionText || "";
      let options = Array.isArray(q.options) ? q.options : [];
      // Normalize options shape
      options = options.map((opt) => {
        if (typeof opt === "string") {
          return { text: opt, value: opt };
        }
        const text = opt.text ?? opt.value ?? "";
        const value = opt.value ?? opt.text ?? text;
        // If AI provided points, respect them. Else, temporarily set undefined; we'll fill later.
        const points = typeof opt.points === "number" ? Math.max(0, Math.min(3, Math.round(opt.points))) : undefined;
        return { text, value, points };
      });

      // If ANY option is missing points, add heuristic
      const missing = options.some((o) => typeof o.points !== "number");
      if (missing) {
        options = addHeuristicPoints(questionText, options);
      }

      // Sort options by descending points for a nicer UX (optional)
      options.sort((a, b) => b.points - a.points);

      return {
        question: questionText,
        options,
        // keep any metadata the model might add
        dimension: q.dimension || q.topic || undefined,
      };
    })
    .filter((q) => q.question && q.options?.length >= 2);
}

// ===== AI Prompts =====
const BASE_PROMPT_RULES = `
Return ONLY valid JSON (no prose, no code fences).

Schema:
[
  {
    "question": "string",
    "options": [
      { "text": "string", "points": 0|1|2|3 },
      { "text": "string", "points": 0|1|2|3 },
      { "text": "string", "points": 0|1|2|3 },
      { "text": "string", "points": 0|1|2|3 }
    ],
    "dimension": "optional-short-tag-like 'sleep'|'stress'|'hydration'"
  }
]

Scoring rules (VERY IMPORTANT):
- Points reflect HEALTHINESS. Higher = healthier (3 best, 0 worst).
- For POSITIVE behaviors (sleep quality/quantity, hydration, fruit/veg intake, physical activity):
  - Best/healthiest choice → 3, then 2, 1, 0.
- For NEGATIVE constructs (stress level, pain level, smoking, alcohol frequency, screen time, junk/processed food):
  - Worst choice (e.g., "High", "Severe", "Daily", "Very Often") → 0
  - Best choice (e.g., "Low", "None", "Never", "Rarely") → 3

Constraints:
- Exactly 4 concise options per question.
- Keep labels short and clear (e.g., "Never", "Rarely", "Most days", "Always").
- No duplicate options. No explanations. Pure JSON only.
`;

async function generateWithOpenAI({ category, count, target }) {
  if (!openaiApiKey) throw new Error("Missing OPENAI_API_KEY");
  const openai = new OpenAI({ apiKey: openaiApiKey });

  const prompt = `
Create ${count} questions to assess a user's ${category} health${target ? `, focusing on ${target}` : ""}.
Questions should be practical and answerable by everyday users (no medical diagnostics).

${BASE_PROMPT_RULES}
`;

  const completion = await openai.chat.completions.create({
    model: openaiModel,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
  });

  const rawText = completion.choices?.[0]?.message?.content ?? "[]";
  const parsed = safeParseJSON(rawText);
  return normalizeQuestions(parsed);
}

async function generateWithGemini({ category, count, target }) {
  if (!genAI) throw new Error("Missing GEMINI_API_KEY");

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Create ${count} questions to assess a user's ${category} health${target ? `, focusing on ${target}` : ""}.
Questions should be practical and answerable by everyday users (no medical diagnostics).

${BASE_PROMPT_RULES}
`;

  const result = await model.generateContent(prompt);
  const rawText = await result.response.text();
  const parsed = safeParseJSON(rawText);
  return normalizeQuestions(parsed);
}

// ===== Route =====
router.get("/", async (req, res) => {
  const category = (req.query.category || "general").toString();
  const count = Math.max(1, Math.min(20, parseInt(req.query.count, 10) || 5));
  const target = (req.query.target || "general").toString();

  try {
    console.log("⚡ Generating questions with OpenAI...");
    const questions = await generateWithOpenAI({ category, count, target });
    return res.json({ questions });
  } catch (err) {
    console.warn(`⚠ OpenAI failed, switching to Gemini: ${err.message}`);
    try {
      const questions = await generateWithGemini({ category, count, target });
      return res.json({ questions });
    } catch (err2) {
      console.error(`❌ Both AI providers failed: ${err2.message}`);
      return res.status(500).json({ error: "AI generation failed" });
    }
  }
});

export default router;
