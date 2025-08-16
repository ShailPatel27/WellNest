// src/pages/ResultPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../utils/api";

export default function ResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const { data } = await API.get(`/results/${id}`);
        setResult(data);
      } catch (err) {
        console.error("Error fetching result:", err);
        setError("Could not fetch your result. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [id]);

  if (loading) return <p className="text-center">Loading result...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!result) return <p className="text-center">Result not found</p>;

  // Scale score to 10
  const scoreOutOf10 = Math.round((result.score / result.total) * 10);

  // Generate tips based on score
  const tips =
    scoreOutOf10 >= 8
      ? ["Excellent! Keep practicing and stay consistent."]
      : scoreOutOf10 >= 5
      ? ["Good job! Try reviewing the questions you missed.", "Practice regularly to boost your score."]
      : ["Don’t worry! Focus on the basics first.", "Spend 15–20 minutes daily on small exercises.", "Try again with fewer questions to build confidence."];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4 text-center">Your Result</h2>

      <div className="bg-base-200 p-4 rounded-lg shadow mb-6 text-center">
        <p className="text-xl font-semibold">
          Score: <span className="text-primary">{scoreOutOf10}</span> / 10
        </p>
        <p className="text-lg">Category: {result.category}</p>
      </div>

      <h3 className="text-2xl font-bold mb-3">Question Review</h3>
      <div className="space-y-4">
        {result.answers.map((a, i) => (
          <div
            key={i}
            className={`p-3 rounded border ${
              a.isCorrect ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"
            }`}
          >
            <p className="font-medium">{i + 1}. {a.question || "Question not found"}</p>
            <p>
              Your Answer:{" "}
              <span className={a.isCorrect ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {a.selectedAnswer ?? "Not Answered"}
              </span>
            </p>
            <p>
              Correct Answer: <span className="font-semibold">{a.correctAnswer}</span>
            </p>
          </div>
        ))}
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-3">Tips for Improvement</h3>
      <ul className="list-disc pl-6 space-y-2">
        {tips.map((tip, i) => <li key={i}>{tip}</li>)}
      </ul>

      <div className="mt-8 text-center">
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}
