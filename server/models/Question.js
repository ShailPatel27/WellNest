import mongoose from "mongoose";

/**
 * Example:
 * {
 *   category: "mental",
 *   questionText: "How often do you feel anxious?",
 *   options: [
 *     { text: "Never", value: 0 },
 *     { text: "Sometimes", value: 5 },
 *     { text: "Often", value: 8 },
 *     { text: "Always", value: 10 }
 *   ],
 *   targets: ["general"]
 * }
 */
const questionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["mental", "physical"],
      required: true
    },
    questionText: { type: String, required: true },
    options: [
      {
        text: { type: String, required: true },
        value: { type: Number, required: true }
      }
    ],
    targets: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
