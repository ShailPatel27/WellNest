import express from "express";
import auth from "../middleware/auth.js";
import Result from "../models/Result.js";
import Question from "../models/Question.js";

const router = express.Router();


// Save new result
router.post("/", auth, async (req, res) => {
  try {
    const { category, answers } = req.body;
    const questionIds = Object.keys(answers);

    // Fetch correct answers
    const questions = await Question.find({ _id: { $in: questionIds } });

    let score = 0;
    questions.forEach(q => {
      if (answers[q._id] === q.correctAnswer) score++;
    });

    const newResult = await Result.create({
      user: req.user.id,
      category,
      score,
      total: questions.length
    });

    res.json(newResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving result" });
  }
});

// Get result by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, user: req.user.id });
    if (!result) return res.status(404).json({ message: "Result not found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching result" });
  }
});

// Get test history
router.get("/history", auth, async (req, res) => {
  try {
    const history = await Result.find({ user: req.user.id }).sort({ createdAt: 1 });
    const formatted = history.map(r => ({
      date: r.createdAt,
      score: r.score,
      total: r.total,
      category: r.category
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

export default router;
