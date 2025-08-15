import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 justify-center mt-12 px-4">
      
      {/* Mental Health Card */}
      <div
        className="bg-purple-600 text-white rounded-2xl shadow-xl p-10 flex-1 cursor-pointer hover:scale-105 transform transition-all"
        onClick={() => handleCardClick("/test-selector?category=mental")}
      >
        <h2 className="text-3xl font-bold mb-4">Mental Health</h2>
        <p className="text-lg">
          Take quizzes, learn tips, and explore exercises to improve your mental wellness.
        </p>
      </div>

      {/* Physical Health Card */}
      <div
        className="bg-green-600 text-white rounded-2xl shadow-xl p-10 flex-1 cursor-pointer hover:scale-105 transform transition-all"
        onClick={() => handleCardClick("/test-selector?category=physical")}
      >
        <h2 className="text-3xl font-bold mb-4">Physical Health</h2>
        <p className="text-lg">
          Access fitness quizzes, health tips, and routines to stay physically active.
        </p>
      </div>

      {/* Chatbot Card */}
      <div
        className="bg-blue-600 text-white rounded-2xl shadow-xl p-10 flex-1 cursor-pointer hover:scale-105 transform transition-all"
        onClick={() => handleCardClick("/chatbot")}
      >
        <h2 className="text-3xl font-bold mb-4">Chatbot</h2>
        <p className="text-lg">
          Talk to our AI chatbot for guidance, tips, or just a friendly conversation.
        </p>
      </div>

    </div>
  );
}
