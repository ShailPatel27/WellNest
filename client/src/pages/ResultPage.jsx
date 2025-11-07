// src/pages/ResultPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../utils/api";
import { Lightbulb } from "lucide-react";

export default function ResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      try {
        const { data } = await API.get(`/results/${id}`);
        setResult(data);

        // Fetch AI tips
        setTipsLoading(true);
        API.post("/ai/tips", { answers: data.answers })
          .then((res) => {
            let raw = res.data?.tips;

            // 🛠 Fix JSON issue
            if (typeof raw === "string") {
              raw = raw.trim();
              if (raw.startsWith("```json")) {
                raw = raw.replace(/```json|```/g, "").trim();
              }
              try {
                raw = JSON.parse(raw);
              } catch {
                raw = [raw]; // fallback
              }
            }

            if (Array.isArray(raw)) {
              const shortened = raw.map((tip) => {
                if (tip.length > 100) {
                  return tip.split(".")[0] + "."; // keep first sentence
                }
                return tip;
              });
              setTips(shortened);
            }
          })
          .catch((err) => console.error("Error fetching tips:", err))
          .finally(() => setTipsLoading(false));
      } catch (err) {
        console.error("Error fetching result:", err);
        setError("Could not fetch your result. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [id]);

  if (loading) return <p className="text-center mt-6">Loading result...</p>;
  if (error) return <p className="text-center text-error mt-6">{error}</p>;
  if (!result) return <p className="text-center mt-6">Result not found</p>;

  // Points calculation
  const totalPoints = result.answers.reduce((sum, a) => sum + (a.points ?? 0), 0);
  const maxPoints = result.answers.length * 3;
  const scoreOutOf10 = maxPoints ? Math.round((totalPoints / maxPoints) * 10) : 0;

  // ✅ Use DaisyUI tokens for consistent theming
  const getColor = (points) => {
    if (points >= 3) return "bg-success/20 border-success text-success";
    if (points === 2) return "bg-accent/20 border-accent text-accent";
    if (points === 1) return "bg-warning/20 border-warning text-warning";
    return "bg-error/20 border-error text-error";
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4 text-center">Your Result</h2>

      <div className="bg-base-200 p-4 rounded-lg shadow mb-6 text-center">
        <p className="text-xl font-semibold">
          Score: <span className="text-primary">{scoreOutOf10}</span> / 10
        </p>
        <p className="text-lg">Category: {result.category}</p>
        <p className="text-lg">
          Total Points: {totalPoints} / {maxPoints}
        </p>
      </div>

      <h3 className="text-2xl font-bold mb-3">Question Review</h3>
      <div className="space-y-4">
        {result.answers.map((a, i) => (
          <div key={i} className={`p-3 rounded border ${getColor(a.points ?? 0)}`}>
            <p className="font-medium">
              {i + 1}. {a.question || "Question not found"}
            </p>
            <p>
              Your Answer:{" "}
              <span className="font-semibold">{a.selectedAnswer || "Not answered"}</span>
            </p>
            {a.correctAnswer && (
              <p>
                Correct Answer: <span className="font-semibold">{a.correctAnswer}</span>
              </p>
            )}
            <p>
              Points: <strong>{a.points}</strong>
            </p>
          </div>
        ))}
      </div>

      <h3 className="text-2xl font-bold mt-10 mb-4 flex items-center justify-center gap-2">
        <Lightbulb className="w-6 h-6 text-accent" /> Tips for Improvement
      </h3>

      {tipsLoading ? (
        <p className="text-center text-base-content/60">Generating personalized tips...</p>
      ) : tips.length > 0 ? (
        <div className="bg-base-200 p-6 rounded-lg shadow text-base-content">
          <ul className="space-y-3 text-left max-w-xl mx-auto">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-success">✔</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-center text-base-content/60">No tips available.</p>
      )}

      <div className="mt-8 text-center">
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
