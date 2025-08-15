// src/pages/ResultPage.jsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import API from "../utils/api";
import React from "react";

export default function ResultPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const category = searchParams.get("category") || "physical";
  const count = searchParams.get("count") || 5;
  const target = searchParams.get("target") || "";

  // Fetch questions from Gemini API route
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data } = await API.get(
          `/questions?category=${category}&count=${count}&target=${target}`
        );
        setQuestions(data.questions);
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    }
    fetchQuestions();
  }, [category, count, target]);

  // Handle selecting an answer
  function handleAnswer(qIndex, option) {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  }

  // Submit answers to /results
  async function handleSubmit() {
    try {
      // Format answers keyed by question index
      const formattedAnswers = {};
      questions.forEach((q, index) => {
        formattedAnswers[q.question] = answers[index] || "";
      });

      const { data } = await API.post("/results", {
        category,
        answers: formattedAnswers
      });

      setResult(data);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting results:", err);
    }
  }

  if (!questions.length && !submitted) return <p>Loading quiz...</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      {!submitted ? (
        <>
          <h2 className="text-2xl font-bold mb-4">
            {category.charAt(0).toUpperCase() + category.slice(1)} Health Quiz
          </h2>
          {questions.map((q, index) => (
            <div key={index} className="mb-6 border p-3 rounded">
              <p className="font-medium mb-2">
                {index + 1}. {q.question}
              </p>
              {q.options.map((option, i) => (
                <label key={i} className="block">
                  <input
                    type="radio"
                    name={`q-${index}`}
                    value={option}
                    checked={answers[index] === option}
                    onChange={() => handleAnswer(index, option)}
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
            Submit
          </button>
        </>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Result</h2>
          <p className="mb-2">
            Score: <strong>{result.score}</strong> / {result.total}
          </p>
          <p className="text-lg text-green-700">
            Category: {result.category}
          </p>
        </div>
      )}
    </div>
  );
}
