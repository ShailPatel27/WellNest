export async function generateQuestions({ category, count, target }) {
  const openai = getClient();

  const prompt = `
  Create ${count} well-crafted ${category} questions for ${target} rehabilitation.

  Each question must have multiple-choice answers with a scoring system.
  Higher scores should represent healthier or more positive responses, while lower
  or zero scores should represent unhealthy or negative responses.

  Return ONLY valid JSON in this format:
  [
    {
      "question": "string",
      "options": [
        { "text": "string", "points": number },
        { "text": "string", "points": number },
        { "text": "string", "points": number },
        { "text": "string", "points": number }
      ]
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
