import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../utils/api";

export default function ResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await API.get(`/results/${id}`);
        setResult(data);
      } catch (err) {
        console.error("Error fetching result:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return <p className="text-center mt-6">Loading result...</p>;
  if (!result) return <p className="text-center mt-6">Result not found.</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Test Result</h2>
      <p>
        Category: <strong>{result.category}</strong>
      </p>
      <p>
        Score: <strong>{result.score} / {result.total}</strong>
      </p>
      <p>
        Score out of 10: <strong>{result.scoreOutOf10}</strong>
      </p>

      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Answers</h3>
        {result.answers.map((a, idx) => (
          <div key={idx} className="mb-2 p-2 border rounded">
            <p className="font-medium">{a.question}</p>
            <p>
              Your answer: <strong>{a.selectedAnswer || "Not answered"}</strong>
            </p>
            {a.correctAnswer && (
              <p>
                Correct answer: <strong>{a.correctAnswer}</strong>
              </p>
            )}
            <p>
              {a.isCorrect ? (
                <span className="text-green-600 font-semibold">Correct</span>
              ) : (
                <span className="text-red-600 font-semibold">Incorrect</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
