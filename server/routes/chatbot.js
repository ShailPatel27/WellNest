import express from "express";
import auth from "../middleware/auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      apiVersion: "v1beta"
    });

    // Add system-style instruction for brevity & health focus
    const systemPrompt = `
      You are a helpful health assistant. 
      Always keep responses under 3 short sentences. 
      Focus only on health, wellness, diet, exercise, and medical awareness. 
      Avoid unrelated topics.
    `;

    const result = await model.generateContent(`${systemPrompt}\nUser: ${message}`);
    const reply = result.response.text().trim();

    console.log("Gemini reply:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ message: err.message || "Error generating reply" });
  }
});

export default router;
