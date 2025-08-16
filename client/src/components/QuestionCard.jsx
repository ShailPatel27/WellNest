import React from "react";

export default function QuestionCard({ question, onSelect }) {
  const questionText = question.questionText || question.question || "No question text";

  const options = (question.options || []).map((opt) =>
    typeof opt === "string"
      ? { text: opt, value: opt }
      : { text: opt.text || opt.value || opt, value: opt.value || opt.text || opt }
  );

  const questionId = question._id || question.id || Math.random().toString();

  return (
    <div className="border rounded p-4 mb-4">
      <p className="font-semibold">{questionText}</p>
      <div className="mt-2 space-y-2">
        {options.map((opt, idx) => (
          <label key={`${questionId}-${idx}`} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={questionId}
              value={opt.value}
              onChange={() => onSelect(questionId, opt.value)}
            />
            {opt.text}
          </label>
        ))}
      </div>
    </div>
  );
}
