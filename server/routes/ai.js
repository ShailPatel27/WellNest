import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Robust parser that converts any model output to a string[]
function extractTips(raw) {
  if (Array.isArray(raw)) return raw.map(String);

  if (typeof raw !== "string") return [];

  let content = raw.trim();

  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  content = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();

  // Try parsing the whole thing as JSON
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (parsed && Array.isArray(parsed.tips)) return parsed.tips.map(String);
  } catch (e) {
    // ignore and continue
  }

  // Try to find the first JSON array substring
  const match = content.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr)) return arr.map(String);
    } catch (e) {
      // ignore and continue
    }
  }

  // Fallback: split into lines/bullets
  return content
    .split(/\r?\n+/)
    .map((s) => s.replace(/^\s*[-*•\d.]+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

router.post("/tips", async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "answers must be an array" });
    }

    let tips = [];

    if (openai) {
      const prompt = `You are a certified health coach. Based on the user's quiz answers, produce 5–7 concise improvement tips (max 120 characters each).
- One sentence per tip, imperative voice.
- DO NOT include code fences or any prose.
- Return ONLY a JSON array of strings.

User answers JSON:
${JSON.stringify(answers, null, 2)}
`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You return only a JSON array of short tips (strings). No code fences, no extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      });

      const content = response?.choices?.[0]?.message?.content ?? "";
      tips = extractTips(content);
    }

    // Heuristic fallback if the model is unavailable or parsing failed
    if (!tips.length) {
      const generic = [
        "Schedule 10-minute movement breaks each hour.",
        "Drink a glass of water with every meal and task.",
        "Aim for 7–9 hours of sleep at consistent times.",
        "Add one vegetable to lunch and dinner.",
        "Do 5 minutes of gentle stretching daily.",
        "Take a 10-minute walk after meals when possible.",
        "Plan tomorrow’s meals the night before.",
      ];
      tips = generic.slice(0, 5);
    }

    // Final cleanup: trim, ensure period, cap count
    tips = tips
      .map((t) => String(t).trim())
      .filter(Boolean)
      .map((t) => (/[.!?]$/.test(t) ? t : t + "."))
      .slice(0, 7);

    return res.json({ tips });
  } catch (err) {
    console.error("Error generating AI tips:", err);
    return res.status(500).json({ error: "Failed to generate tips" });
  }
});

export default router;
