import express from "express";
import Result from "../models/Result.js";

const router = express.Router();

// Save test results
router.post("/", async (req, res) => {
  try {
    const { userId, category, answers } = req.body;

    if (!userId || !category || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    let correctCount = 0;
    const answerDetails = answers.map((a) => {
      const isCorrect = a.isCorrect ?? false;
      if (isCorrect) correctCount++;

      return {
        quizId: a.quizId,
        question: a.question || "Question text missing",
        selectedAnswer: a.selectedAnswer,
        correctAnswer: a.correctAnswer || null,
        isCorrect,
      };
    });

    const scoreOutOf10 = answers.length
      ? Math.round((correctCount / answers.length) * 10)
      : 0;

    const result = new Result({
      userId,
      category,
      score: correctCount,
      total: answers.length,
      scoreOutOf10,
      answers: answerDetails,
    });

    await result.save();

    res.status(201).json(result);
  } catch (error) {
    console.error("Error saving result:", error);
    res.status(500).json({ error: "Failed to save result" });
  }
});

// Get result by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ error: "Result not found" });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

export default router;
