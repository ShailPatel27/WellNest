import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../utils/api";
import QuestionCard from "../components/QuestionCard";
import { v4 as uuidv4 } from "uuid"; // for generating unique IDs

export default function TestSelector() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const category = query.get("category");
  const count = query.get("count");
  const target = query.get("target");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data } = await API.get(`/questions?category=${category}&count=${count}&target=${target}`);

        // Normalize questions: ensure each has _id and proper options
        const normalized = (data.questions || data).map(q => ({
          _id: q._id || uuidv4(),
          questionText: q.question || q.questionText || "Untitled question",
          options: (q.options || []).map(opt =>
            typeof opt === "string"
              ? { text: opt, value: opt }
              : { text: opt.text || opt.value, value: opt.value || opt.text }
          ),
        }));

        setQuestions(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [category, count, target]);

  const handleSelect = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    try {
      const { data } = await API.post("/results", {
        category,
        answers
      });
      navigate(`/result/${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading questions...</p>;

  if (!questions.length) return <p>No questions available.</p>;

  return (
    <div>
      <h2 className="text-2xl mb-4">Test ({category})</h2>
      {questions.map(q => (
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
