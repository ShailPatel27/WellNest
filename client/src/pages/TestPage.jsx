// src/pages/TestPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../utils/api";

export default function TestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const category = searchParams.get("category") || "physical";
  const count = searchParams.get("count") || 5;
  const target = searchParams.get("target") || "";

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data } = await API.get(
          `/questions?category=${category}&count=${count}&target=${target}`
        );
        const qList = Array.isArray(data) ? data : data.questions || [];
        setQuestions(qList);
      } catch (err) {
        console.error("Error fetching questions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [category, count, target]);

  function handleAnswer(qId, optionValue) {
    setAnswers((prev) => ({ ...prev, [qId]: optionValue }));
  }

  async function handleSubmit() {
    try {
      const userId = "test-user-123"; // replace with real user ID

      const formattedAnswers = questions.map((q) => ({
        quizId: q._id,
        selectedAnswer: answers[q._id] || null,
      }));

      const { data } = await API.post("/results", {
        userId,
        category,
        answers: formattedAnswers,
      });

      navigate(`/result/${data._id}`);
    } catch (err) {
      console.error("Error submitting test:", err.response?.data || err.message);
    }
  }

  if (loading) return <p className="text-center">Loading questions...</p>;
  if (!questions.length) return <p className="text-center">No questions available.</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
        {category.charAt(0).toUpperCase() + category.slice(1)} Health Test
      </h2>

      {questions.map((q, index) => (
        <div key={q._id} className="mb-6 border p-3 rounded">
          <p className="font-medium mb-2">
            {index + 1}. {q.question}
          </p>
          {q.options.map((option, i) => (
            <label key={i} className="block">
              <input
                type="radio"
                name={`q-${q._id}`}
                checked={answers[q._id] === option}
                onChange={() => handleAnswer(q._id, option)}
              />
              <span className="ml-2">{option}</span>
            </label>
          ))}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Submit Test
      </button>
    </div>
  );
}
