"use client";

interface CheckboxQuestionProps {
  options: { id: number; optionText: string }[];
  selectedIds: number[];
  maxSelections: number | null;
  hasOther: boolean;
  otherText: string;
  otherLabel?: string;
  placeholder?: string;
  onToggle: (id: number) => void;
  onOtherChange: (text: string) => void;
}

export default function CheckboxQuestion({
  options,
  selectedIds,
  maxSelections,
  hasOther,
  otherText,
  otherLabel = "Other",
  placeholder = "Please specify...",
  onToggle,
  onOtherChange,
}: CheckboxQuestionProps) {
  const isMaxReached = maxSelections ? selectedIds.length >= maxSelections : false;

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        const isDisabled = !isSelected && isMaxReached;

        return (
          <div
            key={option.id}
            role="button"
            tabIndex={isDisabled ? -1 : 0}
            className={`survey-option cursor-pointer select-none transition-all ${
              isSelected ? "selected ring-2 ring-[#1b2a4a]" : ""
            } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => !isDisabled && onToggle(option.id)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
                e.preventDefault();
                onToggle(option.id);
              }
            }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              disabled={isDisabled}
              readOnly
              className="cursor-pointer"
            />
            <span className="text-sm md:text-base">{option.optionText}</span>
          </div>
        );
      })}
      {hasOther && (
        <div
          role="button"
          tabIndex={!selectedIds.includes(-1) && isMaxReached ? -1 : 0}
          className={`survey-option flex-col items-start cursor-pointer select-none transition-all ${
            selectedIds.includes(-1) ? "selected ring-2 ring-[#1b2a4a]" : ""
          } ${
            !selectedIds.includes(-1) && isMaxReached
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          onClick={() => {
            if (!selectedIds.includes(-1) && isMaxReached) return;
            onToggle(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!selectedIds.includes(-1) && isMaxReached) return;
              onToggle(-1);
            }
          }}
        >
          <div className="flex items-center w-full">
            <input
              type="checkbox"
              checked={selectedIds.includes(-1)}
              disabled={!selectedIds.includes(-1) && isMaxReached}
              readOnly
              className="cursor-pointer"
            />
            <span className="text-sm md:text-base">{otherLabel}</span>
          </div>
          {selectedIds.includes(-1) && (
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
