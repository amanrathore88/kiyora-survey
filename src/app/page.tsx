"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Language, UI_TRANSLATIONS } from "@/lib/translations";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");

  const t = UI_TRANSLATIONS[selectedLanguage];

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/survey/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: selectedLanguage }),
      });
      const data = await res.json();
      if (data.sessionToken) {
        sessionStorage.setItem("kiyoki_session", data.sessionToken);
        sessionStorage.setItem("kiyoki_lang", selectedLanguage);
        if (Array.isArray(data.questions)) {
          sessionStorage.setItem("kiyoki_questions", JSON.stringify(data.questions));
        }
        if (data.totalQuestions) {
          sessionStorage.setItem("kiyoki_total_q", String(data.totalQuestions));
        }
        router.push("/survey");
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f9fa]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center border border-gray-100"
      >
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.png"
            alt="Kiyoki Private Limited"
            width={120}
            height={120}
            className="rounded-full shadow-sm"
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-[#1b2a4a] mb-1 tracking-wide">
          {t.surveyTitle}
        </h1>
        <h2 className="text-base font-medium text-gray-700 mb-1">
          {t.surveySubtitle}
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          {t.studySubtitle}
        </p>

        {/* Language Selector */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 text-left">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2.5">
            {t.selectLanguageLabel}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedLanguage("en")}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border flex items-center justify-center ${
                selectedLanguage === "en"
                  ? "bg-[#1b2a4a] text-white border-[#1b2a4a] shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("hi")}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border flex items-center justify-center ${
                selectedLanguage === "hi"
                  ? "bg-[#1b2a4a] text-white border-[#1b2a4a] shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        {/* Incentive Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            <strong className="font-semibold text-amber-950">
              {selectedLanguage === "hi"
                ? "अनुसंधान भागीदारी पुरस्कार: "
                : "Research Participation Reward: "}
            </strong>
            {t.welcomeIncentive}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mb-6">
          {t.welcomeDuration}
        </p>

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-3.5 px-6 bg-[#1b2a4a] hover:bg-[#2d4a7a] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t.starting}
            </>
          ) : (
            <>
              {t.startSurvey}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          {t.companyName}
        </p>
      </motion.div>
    </div>
  );
}
