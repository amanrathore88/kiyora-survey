export interface SurveyQuestion {
  id: number;
  sectionId: number;
  questionNumber: string;
  questionText: string;
  questionType: "radio" | "checkbox" | "text";
  minSelections: number | null;
  maxSelections: number | null;
  hasOtherOption: boolean;
  conditionalLogic: ConditionalLogic | null;
  researcherNote: string | null;
  orderIndex: number;
  isActive: boolean;
  currentRevision: number;
  options: QuestionOption[];
  section: SurveySection;
}

export interface QuestionOption {
  id: number;
  questionId: number;
  optionText: string;
  orderIndex: number;
  isActive: boolean;
}

export interface SurveySection {
  id: number;
  surveyId: number;
  sectionKey: string;
  sectionTitle: string;
  description: string | null;
  conceptText: string | null;
  orderIndex: number;
  isActive: boolean;
}

export interface ConditionalLogic {
  type: "show_if";
  conditions: ConditionalCondition[];
  fallback: "skip";
}

export interface ConditionalCondition {
  questionNumber: string;
  operator: "includes_option" | "equals_option";
  value: string;
}

export interface AnswerPayload {
  sessionToken: string;
  questionId: number;
  selectedOptionIds: number[];
  otherText?: string;
  freeText?: string;
}

export interface SessionInfo {
  id: number;
  sessionToken: string;
  status: "in_progress" | "completed" | "abandoned";
  currentQuestionIndex: number;
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string;
}

export interface ResponseDetail {
  sessionId: number;
  sessionToken: string;
  submittedAt: string;
  participantName: string | null;
  participantContact: string | null;
  isArchived: boolean;
  answers: {
    questionNumber: string;
    questionText: string;
    questionType: string;
    selectedOptions: string[];
    otherText: string | null;
    freeText: string | null;
  }[];
}

export interface PurchaseIntentComparison {
  sessionId: number;
  q16Answer: string | null;
  q23Answer: string | null;
  shift: "upgraded" | "downgraded" | "same" | "incomplete";
}

export interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  abandonedSessions: number;
  completionRate: number;
  averageCompletionTime: string | null;
}
