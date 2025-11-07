// app.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Load environment variables
dotenv.config();

const app = express();

// --- Middleware: security, logging, parsing
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// --- CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://well-nest-ebon.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

app.use(morgan("dev"));

// --- Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "WellNest API",
    time: new Date().toISOString()
  });
});

// --- Import routes
import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/questions.js";
import resultRoutes from "./routes/results.js";
import chatbotRoutes from "./routes/chatbot.js";
import aiRoutes from "./routes/ai.js"; // <-- new AI route

// --- Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/ai", aiRoutes); // <-- mount AI route

// --- 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl
  });
});

// --- Error handler
app.use((err, _req, res, _next) => {
  console.error("ERROR:", err);
  res.status(err.status || 500).json({
    error: err.message || "Server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

// --- Connect to MongoDB and start server
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wellnest";
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: process.env.MONGO_DB || "wellnest"
    });
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`✅ WellNest API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
})();
