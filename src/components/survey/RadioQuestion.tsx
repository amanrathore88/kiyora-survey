"use client";

interface RadioQuestionProps {
  options: { id: number; optionText: string }[];
  selectedId: number | null;
  hasOther: boolean;
  otherText: string;
  otherLabel?: string;
  placeholder?: string;
  autoAdvancingId?: number | null;
  autoAdvancingLabel?: string;
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
  autoAdvancingId = null,
  autoAdvancingLabel = "Opening next...",
  onSelect,
  onOtherChange,
}: RadioQuestionProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isAdvancing = autoAdvancingId === option.id;
        const isSelected = selectedId === option.id;

        return (
          <div
            key={option.id}
            role="button"
            tabIndex={0}
            className={`survey-option cursor-pointer select-none transition-all flex items-center justify-between ${
              isAdvancing
                ? "selected ring-2 ring-emerald-500 bg-emerald-50/60 border-emerald-400"
                : isSelected
                ? "selected ring-2 ring-[#1b2a4a]"
                : ""
            }`}
            onClick={() => onSelect(option.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(option.id);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="survey-radio"
                checked={isSelected}
                readOnly
                className="cursor-pointer"
              />
              <span className="text-sm md:text-base font-medium">{option.optionText}</span>
            </div>

            {isAdvancing && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full animate-pulse flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {autoAdvancingLabel}
              </span>
            )}
          </div>
        );
      })}
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
