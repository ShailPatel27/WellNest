import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mt-16 px-6">
      
      {/* Mental Health Card */}
      <div
        className="bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-2xl shadow-2xl p-10 cursor-pointer hover:scale-105 hover:shadow-xl transform transition-all"
        onClick={() => handleCardClick("/test-selector?category=mental")}
      >
        <h2 className="text-3xl font-bold mb-4">🧠 Mental Health</h2>
        <p className="text-lg">
          Take quizzes, learn tips, and explore exercises to improve your mental wellness.
        </p>
      </div>

      {/* Physical Health Card */}
      <div
        className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl shadow-2xl p-10 cursor-pointer hover:scale-105 hover:shadow-xl transform transition-all"
        onClick={() => handleCardClick("/test-selector?category=physical")}
      >
        <h2 className="text-3xl font-bold mb-4">💪 Physical Health</h2>
        <p className="text-lg">
          Access fitness quizzes, health tips, and routines to stay physically active.
        </p>
      </div>

      {/* Chatbot Card */}
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl shadow-2xl p-10 cursor-pointer hover:scale-105 hover:shadow-xl transform transition-all"
        onClick={() => handleCardClick("/chatbot")}
      >
        <h2 className="text-3xl font-bold mb-4">🤖 Chatbot</h2>
        <p className="text-lg">
          Talk to our AI chatbot for guidance, tips, or just a friendly conversation.
        </p>
      </div>

      {/* Overall Wellness Check Card */}
      <div
        className="bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-2xl shadow-2xl p-10 cursor-pointer hover:scale-105 hover:shadow-xl transform transition-all"
        onClick={() => handleCardClick("/test-selector?category=wellness")}
      >
        <h2 className="text-3xl font-bold mb-4">🌿 Wellness Check</h2>
        <p className="text-lg">
          Take an overall test that combines mental and physical health for a complete checkup.
        </p>
      </div>

    </div>
  );
}
