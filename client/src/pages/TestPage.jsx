import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../utils/api";
import QuestionCard from "../components/QuestionCard";
import React from "react";

export default function TestPage() {
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
        setQuestions(data);
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
