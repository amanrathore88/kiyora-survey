import { db } from "./db";
import { questions, questionOptions, sections } from "./schema";
import { eq, asc } from "drizzle-orm";
import { ensureDatabaseReady } from "./init-db";

export interface CachedQuestionOption {
  id: number;
  optionText: string;
  orderIndex: number;
}

export interface CachedQuestionSection {
  id: number;
  sectionKey: string;
  sectionTitle: string;
  conceptText: string | null;
}

export interface CachedQuestion {
  id: number;
  sectionId: number;
  questionNumber: string;
  questionText: string;
  questionType: "radio" | "checkbox" | "text";
  minSelections: number | null;
  maxSelections: number | null;
  hasOtherOption: boolean;
  conditionalLogic: string | null;
  isExitPoint: boolean;
  exitLogic: string | null;
  researcherNote: string | null;
  orderIndex: number;
  isActive: boolean;
  currentRevision: number;
  options: CachedQuestionOption[];
  section: CachedQuestionSection;
}

interface CacheState {
  questions: CachedQuestion[];
  timestamp: number;
}

let cache: CacheState | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateSurveyCache() {
  cache = null;
}

export async function getCachedSurveyQuestions(): Promise<CachedQuestion[]> {
  await ensureDatabaseReady();
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.questions;
  }

  // Fetch questions, options, and sections in 3 parallel queries
  const [activeQuestions, activeOptions, allSections] = await Promise.all([
    db
      .select()
      .from(questions)
      .where(eq(questions.isActive, true))
      .orderBy(asc(questions.orderIndex)),
    db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.isActive, true))
      .orderBy(asc(questionOptions.orderIndex)),
    db.select().from(sections),
  ]);

  const sectionMap = new Map<number, CachedQuestionSection>();
  for (const s of allSections) {
    sectionMap.set(s.id, {
      id: s.id,
      sectionKey: s.sectionKey,
      sectionTitle: s.sectionTitle,
      conceptText: s.conceptText,
    });
  }

  const optionsMap = new Map<number, CachedQuestionOption[]>();
  for (const opt of activeOptions) {
    const list = optionsMap.get(opt.questionId) || [];
    list.push({
      id: opt.id,
      optionText: opt.optionText,
      orderIndex: opt.orderIndex,
    });
    optionsMap.set(opt.questionId, list);
  }

  const combined: CachedQuestion[] = activeQuestions.map((q) => {
    const sec = sectionMap.get(q.sectionId) || {
      id: q.sectionId,
      sectionKey: "",
      sectionTitle: "",
      conceptText: null,
    };
    const opts = optionsMap.get(q.id) || [];
    return {
      id: q.id,
      sectionId: q.sectionId,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionType: q.questionType as "radio" | "checkbox" | "text",
      minSelections: q.minSelections,
      maxSelections: q.maxSelections,
      hasOtherOption: q.hasOtherOption,
      conditionalLogic: q.conditionalLogic,
      isExitPoint: Boolean(q.isExitPoint),
      exitLogic: q.exitLogic || null,
      researcherNote: q.researcherNote,
      orderIndex: q.orderIndex,
      isActive: q.isActive,
      currentRevision: q.currentRevision,
      options: opts,
      section: sec,
    };
  });

  cache = {
    questions: combined,
    timestamp: now,
  };

  return combined;
}
