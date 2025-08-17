// pages/TestSelector.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../utils/api";
import QuestionCard from "../components/QuestionCard";
import { v4 as uuidv4 } from "uuid";

export default function TestSelector() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const category = query.get("category") || "general";

  const [count, setCount] = useState(5);
  const [target, setTarget] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  // Fetch questions from DB or AI
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(
        `/questions?category=${category}&count=${count}&target=${target || "general"}`
      );

      const normalized = (data.questions || data).map((q) => {
        const opts = (q.options || []).map((opt, i) => {
          const text = typeof opt === "string" ? opt : opt.text || opt.value || "";
          const value = typeof opt === "string" ? opt : opt.value || opt.text || "";
          const points = typeof opt === "object" && opt.points != null
            ? opt.points
            : i; // 0–3 points
          return { text, value, points };
        });

        return {
          _id: q._id || uuidv4(),
          questionText: q.question || q.questionText || "Untitled question",
          options: opts,
        };
      });

      setQuestions(normalized);
      setStarted(true);
    } catch (err) {
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qId, value, points) => {
    setAnswers((prev) => ({ ...prev, [qId]: { value, points } }));
  };

  const handleSubmit = async () => {
    try {
      const userId = "test-user-123"; // replace with real auth user later

      const formattedAnswers = questions.map((q) => {
        const answerObj = answers[q._id] || { value: null, points: 0 };
        return {
          quizId: q._id,
          question: q.questionText,
          selectedAnswer: answerObj.value,
          points: answerObj.points,
        };
      });

      const totalPoints = formattedAnswers.reduce((sum, a) => sum + a.points, 0);
      const maxPoints = questions.length * 3; // 0–3 scale
      const scoreOutOf10 = Math.round((totalPoints / maxPoints) * 10);

      const { data } = await API.post("/results", {
        userId,
        category,
        answers: formattedAnswers,
        totalPoints,
        maxPoints,
        scoreOutOf10,
      });

      navigate(`/result/${data._id}`);
    } catch (err) {
      console.error("Error submitting test:", err.response?.data || err.message);
    }
  };

  // Pre-test setup screen
  if (!started) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 border rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 capitalize">{category} Test Setup</h2>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Number of Questions</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={count}
            min={1}
            max={20}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Target Area (optional)</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="e.g., back, exhaustion..."
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <p className="text-sm text-gray-500">Leave blank for general questions</p>
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          onClick={fetchQuestions}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Test"}
        </button>
      </div>
    );
  }

  if (loading) return <p className="text-center mt-6">Loading questions...</p>;
  if (!questions.length) return <p className="text-center mt-6">No questions available.</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <h2 className="text-2xl mb-4 capitalize">{category} Test</h2>

      {questions.map((q, index) => (
        <QuestionCard
          key={`${q._id}-${index}`}
          question={q}
          onSelect={(value, points) => handleSelect(q._id, value, points)}
        />
      ))}

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        onClick={handleSubmit}
      >
        Submit Test
      </button>
    </div>
  );
}
