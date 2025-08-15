import { useState } from "react";
import API from "../utils/api";
import React from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const { data } = await API.post("/chatbot", { message: input });
      const botMsg = { sender: "bot", text: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "bot", text: "Error: Could not connect." }]);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Health Chatbot</h2>
      <div className="border p-4 h-64 overflow-y-auto mb-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <p key={idx} className={msg.sender === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block px-3 py-1 rounded ${
                msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {msg.text}
            </span>
          </p>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="border flex-1 p-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
