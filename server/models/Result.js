// models/Result.js
import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  quizId: { type: String, ref: "Quiz", required: true },
  question: { type: String, required: true }, // storing text for reference
  selectedAnswer: { type: String, required: true },
  points: { type: Number, required: true }, // points scored for this answer
});

const ResultSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // or ObjectId if you have a User collection
  category: { type: String, required: true },
  totalPoints: { type: Number, required: true }, // raw points scored
  maxPoints: { type: Number, required: true }, // maximum possible points
  scoreOutOf10: { type: Number, required: true }, // normalized score
  answers: [AnswerSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Result", ResultSchema);
