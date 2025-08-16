// models/Result.js
import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  quizId: { type: String, ref: "Quiz", required: true },
  selectedAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
});

const ResultSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // or ObjectId if you have a User collection
  category: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  scoreOutOf10: { type: Number, required: true },
  answers: [AnswerSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Result", ResultSchema);
