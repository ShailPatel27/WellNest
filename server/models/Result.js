import mongoose from "mongoose";

/**
 * Result stores one test attempt
 */
const resultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category: {
      type: String,
      enum: ["mental", "physical"],
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    suggestions: [{ type: String }],
    rawAnswers: [{ questionId: mongoose.Schema.Types.ObjectId, value: Number }],
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Result = mongoose.model("Result", resultSchema);
export default Result;
