// routes/results.js
import express from "express";
import Result from "../models/Result.js";

const router = express.Router();

// Save test results
router.post("/", async (req, res) => {
  try {
    const { userId, category, answers, totalPoints, score, total } = req.body;

    if (!userId || !category || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    // If frontend didn't send totalPoints/score, calculate them
    let calculatedPoints = 0;

    const answerDetails = answers.map((a) => {
      const pointsObtained = a.points ?? 0;
      calculatedPoints += pointsObtained;

      return {
        quizId: a.quizId,
        question: a.question || "Question text missing",
        selectedAnswer: a.selectedAnswer || null,
        points: pointsObtained,
      };
    });

    const maxPoints = total || answers.length * 3;
    const finalTotalPoints = totalPoints ?? calculatedPoints;
    const scoreOutOf10 =
      score ?? (maxPoints ? Math.round((finalTotalPoints / maxPoints) * 10) : 0);

    const result = new Result({
      userId,
      category,
      answers: answerDetails,
      totalPoints: finalTotalPoints,
      maxPoints,
      scoreOutOf10,
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
