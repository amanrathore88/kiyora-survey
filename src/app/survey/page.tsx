"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ProgressBar from "@/components/survey/ProgressBar";
import ConceptCard from "@/components/survey/ConceptCard";
import RadioQuestion from "@/components/survey/RadioQuestion";
import CheckboxQuestion from "@/components/survey/CheckboxQuestion";
import TextQuestion from "@/components/survey/TextQuestion";
import {
  Language,
  UI_TRANSLATIONS,
  getTranslatedQuestion,
  getTranslatedSection,
} from "@/lib/translations";
import { shouldShowQuestion } from "@/lib/survey-engine";

interface QuestionOption {
  id: number;
  optionText: string;
  orderIndex: number;
}

interface QuestionData {
  id: number;
  questionNumber: string;
  questionText: string;
  questionType: "radio" | "checkbox" | "text";
  minSelections: number | null;
  maxSelections: number | null;
  hasOtherOption: boolean;
  conditionalLogic?: string | null;
  orderIndex: number;
  options: QuestionOption[];
  section: {
    sectionKey: string;
    sectionTitle: string;
    conceptText: string | null;
  };
}

interface AnswerState {
  selectedOptionIds: number[];
  otherText: string;
  freeText: string;
}

export default function SurveyPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(26);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [answer, setAnswer] = useState<AnswerState>({
    selectedOptionIds: [],
    otherText: "",
    freeText: "",
  });
  const [showConcept, setShowConcept] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(1);

  // Pause & Abandon state
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [isAbandoned, setIsAbandoned] = useState(false);
  const [invalidSessionMsg, setInvalidSessionMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [abandonSaving, setAbandonSaving] = useState(false);
  const [resumeToast, setResumeToast] = useState<string | null>(null);

  // Auto-advance state (default: true)
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [autoAdvancingId, setAutoAdvancingId] = useState<number | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load autoAdvance preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kiyoki_auto_advance");
      if (saved !== null) {
        setAutoAdvance(saved !== "false");
      }
    } catch {
      // ignore
    }
  }, []);

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Refs for tracking data without triggering effect re-runs
  const allQuestionsRef = useRef<QuestionData[]>([]);
  const answersHistoryRef = useRef<Record<number, AnswerState>>({});
  const lastSectionKeyRef = useRef<string>("");
  const conceptShownRef = useRef<Set<string>>(new Set());
  const totalQuestionsRef = useRef<number>(26);
  const initialLoadDoneRef = useRef<boolean>(false);

  const t = UI_TRANSLATIONS[language];

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    sessionStorage.setItem("kiyoki_lang", newLang);
  };

  // Build client answers map for instant conditional logic checking
  const getAnswersMap = useCallback((): Record<
    string,
    { selectedOptions: string[]; otherText?: string; freeText?: string }
  > => {
    const map: Record<
      string,
      { selectedOptions: string[]; otherText?: string; freeText?: string }
    > = {};

    const allQ = allQuestionsRef.current;
    for (const q of allQ) {
      const ans = answersHistoryRef.current[q.id];
      if (!ans) continue;

      const selectedOptions: string[] = [];
      for (const optId of ans.selectedOptionIds) {
        if (optId === -1) {
          selectedOptions.push("Other");
        } else {
          const opt = q.options.find((o) => o.id === optId);
          if (opt) selectedOptions.push(opt.optionText);
        }
      }

      map[q.questionNumber] = {
        selectedOptions,
        otherText: ans.otherText,
        freeText: ans.freeText,
      };
    }

    return map;
  }, []);

  // Compute next valid question using in-memory question list & conditional logic (0ms)
  const getNextValidQuestionIndex = useCallback(
    (
      fromIndex: number,
      dir: number = 1
    ): { targetIndex: number; question: QuestionData | null } => {
      const allQ = allQuestionsRef.current;
      if (!allQ.length) return { targetIndex: fromIndex, question: null };

      const answersMap = getAnswersMap();
      let target = fromIndex;

      while (target >= 1 && target <= totalQuestionsRef.current) {
        const candidate = allQ.find((q) => q.orderIndex === target);
        if (!candidate) {
          target += dir;
          continue;
        }

        if (candidate.conditionalLogic) {
          const show = shouldShowQuestion(candidate.conditionalLogic, answersMap);
          if (!show) {
            target += dir;
            continue;
          }
        }

        return { targetIndex: target, question: candidate };
      }

      return { targetIndex: target, question: null };
    },
    [getAnswersMap]
  );

  // Instantly displays a question and handles section concept cards
  const displayQuestion = useCallback(
    (q: QuestionData, index: number, dir: number = 1) => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      setAutoAdvancingId(null);

      setDirection(dir);
      setCurrentIndex(index);
      setQuestion(q);
      setError("");

      const sec = q.section;
      if (
        sec.conceptText &&
        sec.sectionKey !== lastSectionKeyRef.current &&
        !conceptShownRef.current.has(sec.sectionKey)
      ) {
        setShowConcept(true);
        conceptShownRef.current.add(sec.sectionKey);
      } else {
        setShowConcept(false);
      }
      lastSectionKeyRef.current = sec.sectionKey;

      if (answersHistoryRef.current[q.id]) {
        setAnswer(answersHistoryRef.current[q.id]);
      } else {
        setAnswer({ selectedOptionIds: [], otherText: "", freeText: "" });
      }
    },
    []
  );

  const fetchQuestion = useCallback(
    async (index: number, fetchDirection: number = 1, shouldShowLoading = true) => {
      setError("");
      const currentToken =
        sessionToken || sessionStorage.getItem("kiyoki_session") || sessionStorage.getItem("kiyora_session");
      if (!currentToken) {
        router.push("/");
        return;
      }

      // Fast-path: If all questions are already in memory, display instantly (0ms)!
      if (allQuestionsRef.current.length > 0) {
        const { targetIndex, question: targetQ } = getNextValidQuestionIndex(
          index,
          fetchDirection
        );
        if (targetQ) {
          displayQuestion(targetQ, targetIndex, fetchDirection);
          setLoading(false);
          return;
        }
      }

      if (shouldShowLoading) {
        setLoading(true);
      }

      try {
        const res = await fetch(
          `/api/survey/questions?sessionToken=${currentToken}&all=true`
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load question");
          setLoading(false);
          return;
        }

        const list: QuestionData[] = data.questions || [];
        allQuestionsRef.current = list;
        const totalQ = data.totalQuestions || list.length || 26;
        totalQuestionsRef.current = totalQ;
        setTotalQuestions(totalQ);

        const { targetIndex, question: targetQ } = getNextValidQuestionIndex(
          index,
          fetchDirection
        );

        if (targetQ) {
          displayQuestion(targetQ, targetIndex, fetchDirection);
        } else if (list.length > 0) {
          displayQuestion(list[0], 1, fetchDirection);
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [router, sessionToken, getNextValidQuestionIndex, displayQuestion]
  );

  // Initial load: runs strictly once on mount
  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    async function init() {
      // 1. Instant pre-hydration from sessionStorage (0ms first paint!)
      const storedQuestions =
        sessionStorage.getItem("kiyoki_questions") ||
        sessionStorage.getItem("kiyora_questions");
      if (storedQuestions) {
        try {
          const parsed = JSON.parse(storedQuestions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allQuestionsRef.current = parsed;
            const totalQ = parsed.length;
            totalQuestionsRef.current = totalQ;
            setTotalQuestions(totalQ);
            const firstQ =
              parsed.find((q: QuestionData) => q.orderIndex === 1) || parsed[0];
            setQuestion(firstQ);
            setCurrentIndex(1);
            setLoading(false);
          }
        } catch {
          // ignore parsing error
        }
      }

      // 2. Check if URL has ?resume=<token>
      const params = new URLSearchParams(window.location.search);
      const resumeToken = params.get("resume");

      if (resumeToken) {
        try {
          const res = await fetch(`/api/survey/resume?token=${encodeURIComponent(resumeToken)}`);
          const data = await res.json();

          if (!res.ok || !data.valid) {
            setInvalidSessionMsg(
              data.error || "This survey session is unavailable, completed, or abandoned."
            );
            setLoading(false);
            return;
          }

          // Valid session for resume
          sessionStorage.setItem("kiyoki_session", resumeToken);
          setSessionToken(resumeToken);
          if (data.language === "hi" || data.language === "en") {
            setLanguage(data.language);
            sessionStorage.setItem("kiyoki_lang", data.language);
          }

          const resumeIdx = data.currentQuestionIndex || 1;
          const resumeMsg =
            data.language === "hi"
              ? `प्रश्न संख्या ${resumeIdx} से सर्वेक्षण पुनः शुरू हुआ।`
              : `Survey resumed from Question ${resumeIdx}.`;
          setResumeToast(resumeMsg);
          setTimeout(() => setResumeToast(null), 4000);

          await fetchQuestion(resumeIdx, 1, allQuestionsRef.current.length === 0);
          return;
        } catch {
          setInvalidSessionMsg("Unable to connect to server to verify your session.");
          setLoading(false);
          return;
        }
      }

      // 3. Standard flow from home page
      const storedLang = (sessionStorage.getItem("kiyoki_lang") ||
        sessionStorage.getItem("kiyora_lang")) as Language | null;
      if (storedLang === "hi" || storedLang === "en") {
        setLanguage(storedLang);
      }

      const storedToken =
        sessionStorage.getItem("kiyoki_session") ||
        sessionStorage.getItem("kiyora_session");
      if (!storedToken) {
        router.push("/");
        return;
      }

      setSessionToken(storedToken);

      // Only fetch from network if questions weren't already hydrated from sessionStorage
      if (allQuestionsRef.current.length === 0) {
        void fetchQuestion(1, 1, true);
      }
    }

    void init();
  }, [fetchQuestion, router]);

  const validateAnswer = (): string | null => {
    if (!question) return null;

    if (question.questionType === "text") {
      if (!answer.freeText.trim()) return t.errorProvideResponse;
      return null;
    }

    if (answer.selectedOptionIds.length === 0) {
      return t.errorSelectOption;
    }

    if (question.questionType === "checkbox") {
      if (
        question.minSelections &&
        answer.selectedOptionIds.length < question.minSelections
      ) {
        if (question.minSelections === question.maxSelections) {
          return `${t.selectExactly} ${question.minSelections} ${t.optionsWord}.`;
        }
        return `${t.selectAtLeast} ${question.minSelections} ${t.optionsWord}.`;
      }
      if (
        question.maxSelections &&
        answer.selectedOptionIds.length > question.maxSelections
      ) {
        return `${t.selectUpTo} ${question.maxSelections} ${t.optionsWord}.`;
      }
    }

    return null;
  };

  // Core advance logic shared by manual "Next" and "Auto-advance"
  const advanceWithAnswer = async (answerToSave: AnswerState) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvancingId(null);

    if (!question) return;
    setError("");

    const currentToken =
      sessionToken ||
      sessionStorage.getItem("kiyoki_session") ||
      sessionStorage.getItem("kiyora_session");

    // 1. Immediately record answer in local history
    answersHistoryRef.current[question.id] = { ...answerToSave };

    // 2. Fire non-blocking background save to database
    if (currentToken) {
      fetch("/api/survey/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: currentToken,
          questionId: question.id,
          selectedOptionIds: answerToSave.selectedOptionIds,
          otherText: answerToSave.otherText || undefined,
          freeText: answerToSave.freeText || undefined,
        }),
      }).catch((err) => console.error("Background answer save error:", err));
    }

    // 3. Find next question in memory instantly (0ms)
    const { targetIndex: nextIdx, question: nextQ } = getNextValidQuestionIndex(
      currentIndex + 1,
      1
    );

    if (nextIdx > totalQuestionsRef.current || !nextQ) {
      // Completed survey
      setSubmitting(true);
      if (currentToken) {
        try {
          await fetch("/api/survey/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken: currentToken }),
          });
        } catch {
          // ignore
        }
      }
      router.push("/thank-you");
      return;
    }

    displayQuestion(nextQ, nextIdx, 1);
  };

  // High-performance Optimistic Next: 0ms UI transition + non-blocking background save
  const handleNext = async () => {
    const validationError = validateAnswer();
    if (validationError) {
      setError(validationError);
      return;
    }

    await advanceWithAnswer(answer);
  };

  // Instant radio selection with auto-advance
  const handleRadioSelect = (id: number) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    const newAnswer: AnswerState = {
      selectedOptionIds: [id],
      otherText: id === -1 ? answer.otherText : "",
      freeText: "",
    };

    setAnswer(newAnswer);
    setError("");

    // If auto-advance is enabled and user selected a regular option (not "Other")
    if (autoAdvance && id !== -1) {
      setAutoAdvancingId(id);
      autoAdvanceTimerRef.current = setTimeout(() => {
        setAutoAdvancingId(null);
        void advanceWithAnswer(newAnswer);
      }, 280);
    } else {
      setAutoAdvancingId(null);
    }
  };

  // High-performance Optimistic Skip: 0ms UI transition + non-blocking background skip
  const handleSkip = async () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvancingId(null);

    if (!question || submitting) return;
    setError("");

    const currentToken =
      sessionToken ||
      sessionStorage.getItem("kiyoki_session") ||
      sessionStorage.getItem("kiyora_session");

    // Clear local answer history for this question
    delete answersHistoryRef.current[question.id];
    setAnswer({ selectedOptionIds: [], otherText: "", freeText: "" });

    // Fire background non-blocking skip
    if (currentToken) {
      fetch("/api/survey/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: currentToken,
          questionId: question.id,
          currentIndex,
        }),
      }).catch((err) => console.error("Background skip error:", err));
    }

    // Find next question in memory instantly (0ms)
    const { targetIndex: nextIdx, question: nextQ } = getNextValidQuestionIndex(
      currentIndex + 1,
      1
    );

    if (nextIdx > totalQuestionsRef.current || !nextQ) {
      setSubmitting(true);
      if (currentToken) {
        try {
          await fetch("/api/survey/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken: currentToken }),
          });
        } catch {
          // ignore
        }
      }
      router.push("/thank-you");
      return;
    }

    displayQuestion(nextQ, nextIdx, 1);
  };

  // High-performance Back navigation (0ms instant transition)
  const handleBack = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvancingId(null);

    if (currentIndex <= 1) return;
    setError("");

    const { targetIndex: prevIdx, question: prevQ } = getNextValidQuestionIndex(
      currentIndex - 1,
      -1
    );

    if (!prevQ || prevIdx < 1) return;

    displayQuestion(prevQ, prevIdx, -1);
  };

  const handleConceptContinue = () => {
    setShowConcept(false);
  };

  // Pause survey handlers
  const handlePauseClick = async () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvancingId(null);
    setShowPauseModal(true);
    const currentToken =
      sessionToken ||
      sessionStorage.getItem("kiyoki_session") ||
      sessionStorage.getItem("kiyora_session");
    if (currentToken && currentIndex > 0) {
      try {
        await fetch("/api/survey/pause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: currentToken,
            currentIndex,
          }),
        });
      } catch (err) {
        console.error("Error saving pause progress:", err);
      }
    }
  };

  const handleCopyResumeLink = async () => {
    const currentToken =
      sessionToken ||
      sessionStorage.getItem("kiyoki_session") ||
      sessionStorage.getItem("kiyora_session") ||
      "";
    const resumeUrl = `${window.location.origin}/survey?resume=${encodeURIComponent(
      currentToken
    )}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(resumeUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = resumeUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleSaveAndExit = async () => {
    const currentToken =
      sessionToken ||
      sessionStorage.getItem("kiyoki_session") ||
      sessionStorage.getItem("kiyora_session");
    if (currentToken) {
      try {
        await fetch("/api/survey/pause", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: currentToken,
            currentIndex,
          }),
        });
      } catch (err) {
        console.error("Error saving pause progress:", err);
      }
    }
    router.push("/");
  };

  // Abandon survey handler
  const handleAbandonConfirm = async () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvancingId(null);
    const currentToken =
      sessionToken ||
      sessionStorage.getItem("kiyoki_session") ||
      sessionStorage.getItem("kiyora_session");
    setAbandonSaving(true);
    try {
      if (currentToken) {
        await fetch("/api/survey/abandon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: currentToken,
            currentIndex,
          }),
        });
      }
      sessionStorage.removeItem("kiyoki_session");
      sessionStorage.removeItem("kiyora_session");
      setShowAbandonModal(false);
      setIsAbandoned(true);
    } catch (err) {
      console.error("Error abandoning survey:", err);
      setShowAbandonModal(false);
      setIsAbandoned(true);
    } finally {
      setAbandonSaving(false);
    }
  };

  // Compute translated section and question data
  const translatedSection = question
    ? getTranslatedSection(
        question.section.sectionKey,
        language,
        question.section.sectionTitle,
        question.section.conceptText
      )
    : null;

  const translatedQuestion = question
    ? getTranslatedQuestion(
        question.questionNumber,
        language,
        question.questionText,
        question.options
      )
    : null;

  const currentToken =
    sessionToken ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("kiyoki_session") ||
        sessionStorage.getItem("kiyora_session") ||
        ""
      : "");
  const resumeLinkUrl = typeof window !== "undefined" ? `${window.location.origin}/survey?resume=${currentToken}` : "";

  // 1. Invalid / Expired Session View
  if (invalidSessionMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 border border-gray-100 text-center">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.invalidSessionTitle}</h2>
          <p className="text-sm text-gray-600 mb-6">{invalidSessionMsg}</p>
          <Link
            href="/"
            className="inline-block w-full py-3 bg-[#1b2a4a] hover:bg-[#2d4a7a] text-white font-semibold rounded-xl transition text-center shadow-sm"
          >
            {t.startNewSurvey}
          </Link>
        </div>
      </div>
    );
  }

  // 2. Abandoned Survey View
  if (isAbandoned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 border border-gray-100 text-center">
          <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.abandonedTitle}</h2>
          <p className="text-sm text-gray-600 mb-6">{t.abandonedMessage}</p>
          <Link
            href="/"
            className="inline-block w-full py-3 bg-[#1b2a4a] hover:bg-[#2d4a7a] text-white font-semibold rounded-xl transition text-center shadow-sm"
          >
            {t.returnHome}
          </Link>
        </div>
      </div>
    );
  }

  // 3. Loading State
  if (loading && !showConcept) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-[#1b2a4a]"
            viewBox="0 0 24 24"
          >
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
          <p className="text-gray-500 text-sm font-medium">{t.loadingQuestion}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      {/* Resumed Banner Toast */}
      {resumeToast && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {resumeToast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Kiyoki Private Limited"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h1 className="text-sm font-bold text-[#1b2a4a] leading-tight">
                {t.surveyTitle}
              </h1>
              <p className="text-xs text-gray-500">{t.surveySubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause Survey Button */}
            <button
              type="button"
              onClick={handlePauseClick}
              className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-[#1b2a4a] bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title={t.pauseSurvey}
            >
              <svg className="w-3.5 h-3.5 text-[#1b2a4a]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">{t.pauseSurvey}</span>
            </button>

            {/* Abandon Survey Button */}
            <button
              type="button"
              onClick={() => setShowAbandonModal(true)}
              className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title={t.abandonSurvey}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">{t.abandonSurvey}</span>
            </button>

            {/* Language Switcher Badge */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleLanguageChange("en")}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  language === "en"
                    ? "bg-[#1b2a4a] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange("hi")}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  language === "hi"
                    ? "bg-[#1b2a4a] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                हि
              </button>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full hidden md:inline-block">
              {t.rewardBadge}
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <ProgressBar
        current={currentIndex}
        total={totalQuestions}
        questionLabel={t.questionProgress}
        ofLabel={t.of}
      />

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            {showConcept && translatedSection?.conceptText ? (
              <ConceptCard
                key={`concept-${translatedSection.title}-${language}`}
                sectionTitle={translatedSection.title}
                conceptText={translatedSection.conceptText}
                onContinue={handleConceptContinue}
                badgeText={t.newSection}
                headingText={t.pleaseReadCarefully}
                buttonText={t.conceptContinue}
              />
            ) : question && translatedQuestion ? (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.25 }}
              >
                {/* Section Badge & Auto-advance Toggle */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-[#1b2a4a] text-white text-xs font-semibold rounded-full shadow-2xs">
                      {language === "hi" ? "अनुभाग " : "Section "}
                      {question.section.sectionKey}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {translatedSection?.title}
                    </span>
                  </div>

                  {/* Auto-advance Option Switch */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !autoAdvance;
                      setAutoAdvance(nextVal);
                      if (!nextVal && autoAdvanceTimerRef.current) {
                        clearTimeout(autoAdvanceTimerRef.current);
                        autoAdvanceTimerRef.current = null;
                        setAutoAdvancingId(null);
                      }
                      try {
                        localStorage.setItem("kiyoki_auto_advance", String(nextVal));
                      } catch {
                        // ignore
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5 cursor-pointer select-none shadow-2xs ${
                      autoAdvance
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                    }`}
                    title={t.autoAdvanceTooltip}
                  >
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        autoAdvance ? "bg-emerald-500 ring-2 ring-emerald-300 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    <span>{t.autoAdvance}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        autoAdvance ? "bg-emerald-600 text-white" : "bg-gray-300 text-gray-700"
                      }`}
                    >
                      {autoAdvance
                        ? language === "hi"
                          ? "चालू"
                          : "ON"
                        : language === "hi"
                        ? "बंद"
                        : "OFF"}
                    </span>
                  </button>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 border border-gray-100">
                  <div className="flex items-start gap-3 mb-6">
                    <span className="flex-shrink-0 w-10 h-10 bg-[#1b2a4a] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                      {question.questionNumber.replace("Q", "")}
                    </span>
                    <h2 className="text-lg font-semibold text-gray-800 leading-snug pt-1.5">
                      {translatedQuestion.questionText}
                    </h2>
                  </div>

                  {/* Selection constraint hint */}
                  {question.questionType === "checkbox" && (
                    <p className="text-sm font-medium text-gray-500 mb-4 ml-13">
                      {question.minSelections === question.maxSelections &&
                      question.minSelections
                        ? `${t.selectExactly} ${question.minSelections}`
                        : question.maxSelections
                        ? `${t.selectUpTo} ${question.maxSelections}`
                        : t.selectAllThatApply}
                    </p>
                  )}

                  {/* Question Type Renderers */}
                  {question.questionType === "radio" && (
                    <RadioQuestion
                      options={translatedQuestion.options}
                      selectedId={answer.selectedOptionIds[0] ?? null}
                      hasOther={question.hasOtherOption}
                      otherText={answer.otherText}
                      otherLabel={t.other}
                      placeholder={t.pleaseSpecify}
                      autoAdvancingId={autoAdvancingId}
                      autoAdvancingLabel={t.autoAdvancing}
                      onSelect={handleRadioSelect}
                      onOtherChange={(text) =>
                        setAnswer((prev) => ({ ...prev, otherText: text }))
                      }
                    />
                  )}

                  {question.questionType === "checkbox" && (
                    <CheckboxQuestion
                      options={translatedQuestion.options}
                      selectedIds={answer.selectedOptionIds}
                      maxSelections={question.maxSelections}
                      hasOther={question.hasOtherOption}
                      otherText={answer.otherText}
                      otherLabel={t.other}
                      placeholder={t.pleaseSpecify}
                      onToggle={(id) => {
                        setAnswer((prev) => {
                          const isSelected = prev.selectedOptionIds.includes(id);
                          if (isSelected) {
                            return {
                              ...prev,
                              selectedOptionIds: prev.selectedOptionIds.filter(
                                (i) => i !== id
                              ),
                            };
                          }
                          if (
                            question.maxSelections &&
                            prev.selectedOptionIds.length >=
                              question.maxSelections
                          ) {
                            return prev;
                          }
                          return {
                            ...prev,
                            selectedOptionIds: [...prev.selectedOptionIds, id],
                          };
                        });
                        setError("");
                      }}
                      onOtherChange={(text) =>
                        setAnswer((prev) => ({ ...prev, otherText: text }))
                      }
                    />
                  )}

                  {question.questionType === "text" && (
                    <TextQuestion
                      value={answer.freeText}
                      placeholder={t.typeResponseHere}
                      charLabel={t.characters}
                      onChange={(text) => {
                        setAnswer((prev) => ({ ...prev, freeText: text }));
                        setError("");
                      }}
                    />
                  )}

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium"
                    >
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 mt-6">
                  <button
                    onClick={handleBack}
                    disabled={currentIndex <= 1 || submitting || skipping}
                    className="order-1 px-4 sm:px-6 py-2.5 text-gray-600 hover:text-[#1b2a4a] font-medium rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                  >
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    {t.back}
                  </button>

                  <div className="order-2 flex items-center gap-2 sm:gap-3 ml-auto">
                    {/* Skip Question Button */}
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={submitting || skipping}
                      title={t.skipQuestionTooltip}
                      className="px-3.5 sm:px-4 py-2.5 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-600 hover:text-[#1b2a4a] font-medium rounded-xl transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
                    >
                      {skipping ? (
                        <>
                          <svg
                            className="animate-spin h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                          >
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
                          <span>{t.skipping}</span>
                        </>
                      ) : (
                        <>
                          <span>{t.skipQuestion}</span>
                          <svg
                            className="w-3.5 h-3.5 opacity-60"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 5l7 7-7 7M5 5l7 7-7 7"
                            />
                          </svg>
                        </>
                      )}
                    </button>

                    {/* Next / Complete Survey Button */}
                    <button
                      onClick={handleNext}
                      disabled={submitting || skipping}
                      className="px-6 sm:px-8 py-2.5 bg-[#1b2a4a] hover:bg-[#2d4a7a] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            viewBox="0 0 24 24"
                          >
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
                          {t.saving}
                        </>
                      ) : currentIndex >= totalQuestions ? (
                        t.completeSurvey
                      ) : (
                        <>
                          {t.next}
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
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Secondary Pause, Skip & Abandon Prompts */}
                <div className="mt-8 text-center text-xs text-gray-500 flex flex-wrap items-center justify-center gap-2">
                  <span>{t.needBreakPrompt}</span>
                  <button
                    type="button"
                    onClick={handlePauseClick}
                    className="text-[#1b2a4a] hover:underline font-semibold cursor-pointer"
                  >
                    {t.pauseSurvey}
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={submitting || skipping}
                    className="text-gray-500 hover:text-[#1b2a4a] hover:underline cursor-pointer"
                  >
                    {t.skipThisQuestion}
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => setShowAbandonModal(true)}
                    className="text-red-500 hover:underline font-semibold cursor-pointer"
                  >
                    {t.abandonSurvey}
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Pause Modal */}
      <AnimatePresence>
        {showPauseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 text-[#1b2a4a] rounded-full flex items-center justify-center font-bold">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t.pauseModalTitle}</h3>
                  <p className="text-xs text-emerald-600 font-semibold">
                    ✓ {t.questionProgress} {currentIndex} {t.of} {totalQuestions}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {t.pauseModalDescription}
              </p>

              {/* Resume Link Box */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    {t.resumeLinkTitle}
                  </label>
                  {copySuccess && (
                    <span className="text-xs font-semibold text-emerald-600 animate-pulse">
                      ✓ {t.linkCopied}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {t.resumeLinkHelp}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resumeLinkUrl}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyResumeLink}
                    className="flex-shrink-0 px-3 py-2 bg-[#1b2a4a] hover:bg-[#2d4a7a] text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
                  >
                    {copySuccess ? t.linkCopied : t.copyLink}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowPauseModal(false)}
                  className="flex-1 py-2.5 bg-[#1b2a4a] hover:bg-[#2d4a7a] text-white font-semibold rounded-xl text-sm transition shadow-xs text-center cursor-pointer"
                >
                  {t.resumeSurvey}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition text-center border border-gray-200 cursor-pointer"
                >
                  {t.saveAndExit}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Abandon Modal */}
      <AnimatePresence>
        {showAbandonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 border border-red-100"
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t.abandonModalTitle}
              </h3>

              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                {t.abandonModalWarning}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowAbandonModal(false)}
                  disabled={abandonSaving}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition text-center border border-gray-200 cursor-pointer disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleAbandonConfirm}
                  disabled={abandonSaving}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition text-center shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {abandonSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t.abandoning}
                    </>
                  ) : (
                    t.confirmAbandon
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
