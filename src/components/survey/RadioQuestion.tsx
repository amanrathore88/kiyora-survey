"use client";

interface RadioQuestionProps {
  options: { id: number; optionText: string }[];
  selectedId: number | null;
  hasOther: boolean;
  otherText: string;
  otherLabel?: string;
  placeholder?: string;
  onSelect: (id: number) => void;
  onOtherChange: (text: string) => void;
}

export default function RadioQuestion({
  options,
  selectedId,
  hasOther,
  otherText,
  otherLabel = "Other",
  placeholder = "Please specify...",
  onSelect,
  onOtherChange,
}: RadioQuestionProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div
          key={option.id}
          role="button"
          tabIndex={0}
          className={`survey-option cursor-pointer select-none transition-all ${
            selectedId === option.id ? "selected ring-2 ring-[#1b2a4a]" : ""
          }`}
          onClick={() => onSelect(option.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(option.id);
            }
          }}
        >
          <input
            type="radio"
            name="survey-radio"
            checked={selectedId === option.id}
            readOnly
            className="cursor-pointer"
          />
          <span className="text-sm md:text-base">{option.optionText}</span>
        </div>
      ))}
      {hasOther && (
        <div
          role="button"
          tabIndex={0}
          className={`survey-option flex-col items-start cursor-pointer select-none transition-all ${
            selectedId === -1 ? "selected ring-2 ring-[#1b2a4a]" : ""
          }`}
          onClick={() => onSelect(-1)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(-1);
            }
          }}
        >
          <div className="flex items-center w-full">
            <input
              type="radio"
              name="survey-radio"
              checked={selectedId === -1}
              readOnly
              className="cursor-pointer"
            />
            <span className="text-sm md:text-base">{otherLabel}</span>
          </div>
          {selectedId === -1 && (
            <input
              type="text"
              value={otherText}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => onOtherChange(e.target.value)}
              placeholder={placeholder}
              className="mt-2 ml-7 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1b2a4a] focus:border-transparent outline-none cursor-text select-text"
              autoFocus
            />
          )}
        </div>
      )}
    </div>
  );
}
