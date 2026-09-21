"use client";

interface TextQuestionProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  charLabel?: string;
}

export default function TextQuestion({
  value,
  onChange,
  placeholder = "Type your response here...",
  charLabel = "characters",
}: TextQuestionProps) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-[#1b2a4a] focus:border-transparent outline-none resize-none transition-colors"
      />
      <p className="text-xs text-gray-400 mt-1 text-right">
        {value.length} {charLabel}
      </p>
    </div>
  );
}
