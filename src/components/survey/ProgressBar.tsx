interface ProgressBarProps {
  current: number;
  total: number;
  questionLabel?: string;
  ofLabel?: string;
}

export default function ProgressBar({
  current,
  total,
  questionLabel = "Question",
  ofLabel = "of",
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>
            {questionLabel} {current} {ofLabel} {total}
          </span>
          <span className="font-semibold text-gray-700">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#1b2a4a] h-2 rounded-full progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
