import React from "react";

export default function QuestionCard({ question, onSelect }) {
  // Normalize question text
  const questionText = question.questionText || question.question || "No question text";

  // Normalize options array
  const options = (question.options || []).map(opt =>
    typeof opt === "string"
      ? { text: opt, value: opt }
      : { text: opt.text || opt.value || opt, value: opt.value || opt.text || opt }
  );

  return (
    <div className="border rounded p-4 mb-4">
      <p className="font-semibold">{questionText}</p>
      <div className="mt-2 space-y-2">
        {options.map((opt, idx) => (
          <label key={idx} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={question._id || question.id || idx}
              value={opt.value}
              onChange={() => onSelect(question._id || question.id || idx, opt.value)}
            />
            {opt.text}
          </label>
        ))}
      </div>
    </div>
  );
}
