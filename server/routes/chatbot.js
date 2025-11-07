import express from "express";
import auth from "../middleware/auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import OpenAI from "openai";
import Chat from "../models/Chat.js";

dotenv.config();
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// System rules for health assistant
const systemPrompt = `
You are a helpful health assistant which gives tips based on the problems given.
Keep responses extremely short.
Be polite and friendly.
Focus only on health related topics.
Keep the language simple and clear.
Do not use extra symbols, bold, or prefixes like "Bot:".
Avoid unrelated topics.
`;

// 📌 Send message
router.post("/", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Message required" });
    }

    // 🔹 Get or create chat history for user
    let chat = await Chat.findOne({ user: req.user.id });
    if (!chat) {
      chat = await Chat.create({ user: req.user.id, messages: [] });
    }

    // Save user message
    chat.messages.push({ sender: "user", text: message });
    await chat.save();

    // Prepare conversation context
    const messagesForAI = [
      { role: "system", content: systemPrompt },
      ...chat.messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    let reply;

    // Try OpenAI first
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messagesForAI,
        max_tokens: 120,
      });
      reply = response.choices[0].message.content.trim();
    } catch (err) {
      console.warn("OpenAI failed, switching to Gemini:", err.message);

      // Fallback to Gemini (Gemini needs plain text)
      const historyText = chat.messages
        .map((m) => `${m.sender === "user" ? "User" : "Assistant"}: ${m.text}`)
        .join("\n");

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(
        `${systemPrompt}\n${historyText}\nUser: ${message}`
      );
      reply = result.response.text().trim();
    }

    // Save bot reply
    chat.messages.push({ sender: "bot", text: reply });
    await chat.save();

    res.json({ reply });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ message: err.message || "Error generating reply" });
  }
});

// 📌 Get chat history for logged user
router.get("/history", auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user.id });
    res.json(chat ? chat.messages : []);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

export default router;
