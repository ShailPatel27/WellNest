import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../utils/api";
import QuestionCard from "../components/QuestionCard";
import { v4 as uuidv4 } from "uuid"; // for generating unique IDs

export default function TestSelector() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const category = query.get("category"); // comes from home page

  const [count, setCount] = useState(5);
  const [target, setTarget] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(
        `/questions?category=${category}&count=${count}&target=${target || "general"}`
      );

      const normalized = (data.questions || data).map((q) => ({
        _id: q._id || uuidv4(),
        questionText: q.question || q.questionText || "Untitled question",
        options: (q.options || []).map((opt) =>
          typeof opt === "string"
            ? { text: opt, value: opt }
            : { text: opt.text || opt.value, value: opt.value || opt.text }
        ),
      }));

      setQuestions(normalized);
      setStarted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    try {
      const { data } = await API.post("/results", {
        category,
        answers,
      });
      navigate(`/result/${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Show form before test starts
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
            onChange={(e) => setCount(e.target.value)}
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

  // Show test after questions are generated
  if (loading) return <p>Loading questions...</p>;
  if (!questions.length) return <p>No questions available.</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <h2 className="text-2xl mb-4 capitalize">{category} Test</h2>
      {questions.map((q) => (
        <QuestionCard key={q._id} question={q} onSelect={handleSelect} />
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
