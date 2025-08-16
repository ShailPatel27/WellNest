import { useState, useEffect, useRef } from "react";
import API from "../utils/api";
import React from "react";
import { Send } from "lucide-react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 Load chat history on mount
  const fetchHistory = async () => {
    try {
      const { data } = await API.get("/chatbot/history");
      setMessages(data); // [{ sender, text }]
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 🔹 Send a new message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    try {
      const { data } = await API.post("/chatbot", { message: currentInput });
      const botMsg = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMsg]);

      // 🔹 Reload history from server (keeps everything in sync)
      await fetchHistory();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error: Could not connect." },
      ]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[80vh] flex flex-col">
      <h2 className="text-3xl font-bold mb-4 text-center">Health Chatbot</h2>

      {/* Chat Window */}
      <div className="flex-1 border rounded-lg p-4 bg-base-200 overflow-y-auto shadow-md">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Start a conversation...
          </p>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat ${msg.sender === "user" ? "chat-end" : "chat-start"}`}
          >
            <div
              className={`chat-bubble ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Auto-scroll anchor */}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className="mt-4 flex items-center gap-2">
        <input
          className="input input-bordered flex-1"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="btn btn-primary">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
