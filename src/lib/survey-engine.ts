import type { ConditionalLogic } from "./types";

interface AnswerMap {
  [questionNumber: string]: {
    selectedOptions: string[];
    otherText?: string;
    freeText?: string;
  };
}

/**
 * Evaluates whether a question should be displayed based on its conditional logic
 * and the respondent's previous answers.
 */
export function shouldShowQuestion(
  conditionalLogicJson: string | null,
  answersMap: AnswerMap
): boolean {
  if (!conditionalLogicJson) return true;

  try {
    const logic: ConditionalLogic = JSON.parse(conditionalLogicJson);

    if (logic.type !== "show_if") return true;

    for (const condition of logic.conditions) {
      const answer = answersMap[condition.questionNumber];
      if (!answer) return false;

      switch (condition.operator) {
        case "includes_option":
          if (!answer.selectedOptions.includes(condition.value)) return false;
          break;
        case "equals_option":
          if (
            answer.selectedOptions.length !== 1 ||
            answer.selectedOptions[0] !== condition.value
          )
            return false;
          break;
        default:
          return true;
      }
    }

    return true;
  } catch {
    return true; // If parsing fails, show the question
  }
}

/**
 * Validates the research sequence — ensures Q16 is answered before
 * any Japanese positioning questions (Q19+) are served.
 */
export function validateResearchSequence(
  targetQuestionOrder: number,
  answeredQuestionOrders: number[]
): { valid: boolean; error?: string } {
  // Q16 is order_index 16, Q19 starts at order_index 19
  // Concept 2 (Japanese tech) is shown before Q19
  if (targetQuestionOrder >= 20) {
    if (!answeredQuestionOrders.includes(17)) {
      return {
        valid: false,
        error:
          "Q17 must be answered before the Japanese technology positioning is revealed.",
      };
    }
  }

  return { valid: true };
}

/**
 * Maps a Likert-style purchase intent answer to a numeric score
 * for Q16/Q23 comparison analytics.
 */
export function purchaseIntentScore(answer: string): number {
  const scoreMap: Record<string, number> = {
    "Definitely would consider": 5,
    "Definitely yes": 5,
    "Probably would consider": 4,
    "Probably yes": 4,
    "Not sure": 3,
    "Probably would not consider": 2,
    "Probably no": 2,
    "Definitely would not consider": 1,
    "Definitely no": 1,
  };
  return scoreMap[answer] || 0;
}

/**
 * Calculates the purchase intent shift between Q16 (blind) and Q23 (post-positioning).
 */
export function calculateIntentShift(
  q16Answer: string,
  q23Answer: string
): "upgraded" | "downgraded" | "same" {
  const q16Score = purchaseIntentScore(q16Answer);
  const q23Score = purchaseIntentScore(q23Answer);

  if (q23Score > q16Score) return "upgraded";
  if (q23Score < q16Score) return "downgraded";
  return "same";
}
