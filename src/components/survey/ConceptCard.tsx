"use client";

import { motion } from "framer-motion";

interface ConceptCardProps {
  sectionTitle: string;
  conceptText: string;
  onContinue: () => void;
  badgeText?: string;
  headingText?: string;
  buttonText?: string;
}

export default function ConceptCard({
  sectionTitle,
  conceptText,
  onContinue,
  badgeText = "New Section",
  headingText = "Please Read Carefully",
  buttonText = "I have read this — Continue",
}: ConceptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded-full">
          {badgeText}
        </span>
        <span className="ml-2 text-sm text-gray-500 font-medium">{sectionTitle}</span>
      </div>

      <div className="concept-card rounded-2xl shadow-md p-6 md:p-8 bg-amber-50/50 border border-amber-200/80">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-amber-900">
            {headingText}
          </h2>
        </div>

        <p className="text-gray-800 leading-relaxed text-base whitespace-pre-line font-medium">
          {conceptText}
        </p>

        <button
          onClick={onContinue}
          className="mt-6 w-full py-3.5 bg-[#1b2a4a] hover:bg-[#2d4a7a] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
        >
          {buttonText}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
