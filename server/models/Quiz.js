// models/Quiz.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const QuizSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4(), // UUID instead of ObjectId
  },
  category: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
});

export default mongoose.model("Quiz", QuizSchema);
