import { db } from "./db";
import {
  surveySessions,
  responses,
  responseAnswers,
  questionOptions,
  questions,
  respondentContacts,
} from "./schema";
import { eq, and, asc } from "drizzle-orm";

/**
 * Ordered list of CSV columns matching the export specification.
 */
export const CSV_COLUMNS = [
  "session_id",
  "submitted_at",
  "participant_name",
  "participant_contact",
  "survey_language",
  "Q1_age_group",
  "Q2_gender",
  "Q3_status",
  "Q4_marital_status",
  "Q5_children",
  "Q6_household",
  "Q7_location",
  "Q8_air_quality_concern",
  "Q9_own_purifier",
  "Q10_future_need",
  "Q11_reasons",
  "Q11_other_text",
  "Q12_not_consider_reason",
  "Q12_other_text",
  "Q13_factors",
  "Q14_price_expectation",
  "Q15_purchase_channel",
  "Q15_other_text",
  "Q16_brands",
  "Q16_other_text",
  "Q17_blind_purchase_intent",
  "Q18_price_reaction",
  "Q19_verification_needs",
  "Q19_other_text",
  "Q20_japanese_interest_change",
  "Q21_japanese_perception",
  "Q22_positioning_preference",
  "Q23_proof_importance",
  "Q24_final_purchase_intent",
  "Q25_confidence_factor",
  "Q25_other_text",
  "Q26_open_response",
  "is_archived",
] as const;

/**
 * Escapes a single CSV value according to RFC 4180 rules:
 * - Null or undefined values become an empty string.
 * - Values containing commas, double quotes, newlines, or carriage returns
 *   are wrapped in double quotes, with internal double quotes doubled.
 */
export function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (
    str.includes('"') ||
    str.includes(",") ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Extracts question number (1 to 25) from questionNumber string or orderIndex.
 */
function parseQuestionIndex(
  questionNumber?: string | null,
  orderIndex?: number | null
): number | null {
  if (questionNumber) {
    const trimmed = questionNumber.trim();
    const match = trimmed.match(/^Q?(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 26) {
        return num;
      }
    }
  }
  if (typeof orderIndex === "number" && orderIndex >= 1 && orderIndex <= 26) {
    return orderIndex;
  }
  return null;
}

interface QuestionAnswerData {
  options: string[];
  otherTexts: string[];
  freeTexts: string[];
}

export interface CSVExportOptions {
  status?: string;
  archiveFilter?: "all" | "active" | "archived";
}

/**
 * Generates a full CSV string with one row per completed respondent
 * with flattened answers suitable for Excel / Power BI.
 */
export async function generateCSV(options?: CSVExportOptions): Promise<string> {
  const statusFilter = options?.status || "completed";
  const archiveFilter = options?.archiveFilter || "all";

  // 1. Query survey sessions
  // 3. Also join respondent_contacts for name/contact
  const baseQuery = db
    .select({
      session: surveySessions,
      contact: respondentContacts,
    })
    .from(surveySessions)
    .leftJoin(
      respondentContacts,
      eq(surveySessions.id, respondentContacts.sessionId)
    );

  const completedSessions =
    statusFilter === "all"
      ? await baseQuery.orderBy(asc(surveySessions.id))
      : await baseQuery
          .where(eq(surveySessions.status, statusFilter as "completed" | "in_progress" | "abandoned"))
          .orderBy(asc(surveySessions.id));

  // Build CSV header row
  const headerRow = CSV_COLUMNS.map(escapeCSV).join(",");
  const dataRows: string[] = [];

  // 4. Build a row per session
  for (const { session, contact } of completedSessions) {
    // 2. For each session, join responses → response_answers → question_options to get answer texts
    const sessionRecords = await db
      .select({
        response: responses,
        question: questions,
        answer: responseAnswers,
        option: questionOptions,
      })
      .from(responses)
      .innerJoin(questions, eq(responses.questionId, questions.id))
      .leftJoin(responseAnswers, eq(responses.id, responseAnswers.responseId))
      .leftJoin(questionOptions, eq(responseAnswers.optionId, questionOptions.id))
      .where(eq(responses.sessionId, session.id))
      .orderBy(asc(questions.orderIndex), asc(questionOptions.orderIndex));

    // Organize answers by question index (1..25)
    const answersMap = new Map<number, QuestionAnswerData>();
    for (let i = 1; i <= 26; i++) {
      answersMap.set(i, { options: [], otherTexts: [], freeTexts: [] });
    }

    let isArchived = false;
    const responseSubmittedTimes: string[] = [];

    for (const record of sessionRecords) {
      if (record.response?.isArchived) {
        isArchived = true;
      }
      if (record.response?.submittedAt) {
        responseSubmittedTimes.push(record.response.submittedAt);
      }

      const qIndex = parseQuestionIndex(
        record.question?.questionNumber,
        record.question?.orderIndex
      );

      if (!qIndex || qIndex < 1 || qIndex > 26) {
        continue;
      }

      const qData = answersMap.get(qIndex)!;

      // Option text from question_options
      if (record.option?.optionText) {
        const text = record.option.optionText.trim();
        if (text && !qData.options.includes(text)) {
          qData.options.push(text);
        }
      }

      // Other text from response_answers
      if (record.answer?.otherText) {
        const other = record.answer.otherText.trim();
        if (other && !qData.otherTexts.includes(other)) {
          qData.otherTexts.push(other);
        }
      }

      // Free text from response_answers
      const free = (
        record.answer?.freeText ?? (record.answer as Record<string, unknown>)?.textValue as string | undefined
      )?.trim();
      if (free && !qData.freeTexts.includes(free)) {
        qData.freeTexts.push(free);
      }
    }

    if (archiveFilter === "active" && isArchived) {
      continue;
    }
    if (archiveFilter === "archived" && !isArchived) {
      continue;
    }

    // Determine submitted_at timestamp
    let submittedAt = session.completedAt || "";
    if (!submittedAt) {
      if (responseSubmittedTimes.length > 0) {
        responseSubmittedTimes.sort();
        submittedAt = responseSubmittedTimes[responseSubmittedTimes.length - 1];
      } else {
        submittedAt = session.startedAt || "";
      }
    }

    // Participant name & contact from respondent_contacts
    const participantName =
      contact?.participantName ??
      ((session as Record<string, unknown>)?.participantName as string | undefined) ??
      "";
    const participantContact =
      contact?.participantContact ??
      ((contact as Record<string, unknown>)?.contactValue as string | undefined) ??
      "";

    // Answer retrieval helpers
    const getSingleAnswer = (qNum: number): string => {
      const data = answersMap.get(qNum);
      if (!data) return "";
      if (data.options.length > 0) return data.options[0];
      if (data.freeTexts.length > 0) return data.freeTexts[0];
      return "";
    };

    // Multi-select answers (Q6, Q10, Q12, Q15, Q18, Q20) are semicolon-separated
    const getMultiAnswer = (qNum: number): string => {
      const data = answersMap.get(qNum);
      if (!data) return "";
      if (data.options.length > 0) return data.options.join(";");
      if (data.freeTexts.length > 0) return data.freeTexts.join(";");
      return "";
    };

    // 'Other' text gets its own column
    const getOtherText = (qNum: number): string => {
      const data = answersMap.get(qNum);
      if (!data || data.otherTexts.length === 0) return "";
      return data.otherTexts.join("; ");
    };

    // Open response (Q25)
    const getOpenResponse = (qNum: number): string => {
      const data = answersMap.get(qNum);
      if (!data) return "";
      if (data.freeTexts.length > 0) return data.freeTexts.join("\n");
      if (data.otherTexts.length > 0) return data.otherTexts.join("; ");
      if (data.options.length > 0) return data.options.join(";");
      return "";
    };

    // Row cells strictly matching CSV_COLUMNS order:
    // session_id, submitted_at, participant_name, participant_contact,
    // Q1_age_group, Q2_gender, Q3_status, Q4_marital_status, Q5_children,
    // Q6_household, Q7_location,
    // Q8_air_quality_concern, Q9_own_purifier,
    // Q10_reasons, Q10_other_text,
    // Q11_not_consider_reason, Q11_other_text,
    // Q12_factors,
    // Q13_price_expectation, Q14_purchase_channel, Q14_other_text,
    // Q15_brands, Q15_other_text,
    // Q16_blind_purchase_intent, Q17_price_reaction,
    // Q18_verification_needs, Q18_other_text,
    // Q19_japanese_interest_change,
    // Q20_japanese_perception,
    // Q21_positioning_preference, Q22_proof_importance,
    // Q23_final_purchase_intent, Q24_confidence_factor, Q24_other_text,
    // Q25_open_response,
    // is_archived
    const rowValues: string[] = [
      String(session.id),
      submittedAt,
      participantName,
      participantContact,
      session.language || "en",
      getSingleAnswer(1),
      getSingleAnswer(2),
      getSingleAnswer(3),
      getSingleAnswer(4),
      getSingleAnswer(5),
      getMultiAnswer(6),
      getSingleAnswer(7),
      getSingleAnswer(8),
      getSingleAnswer(9),
      getSingleAnswer(10),
      getMultiAnswer(11),
      getOtherText(11),
      getSingleAnswer(12),
      getOtherText(12),
      getMultiAnswer(13),
      getSingleAnswer(14),
      getSingleAnswer(15),
      getOtherText(15),
      getMultiAnswer(16),
      getOtherText(16),
      getSingleAnswer(17),
      getSingleAnswer(18),
      getMultiAnswer(19),
      getOtherText(19),
      getSingleAnswer(20),
      getMultiAnswer(21),
      getSingleAnswer(22),
      getSingleAnswer(23),
      getSingleAnswer(24),
      getSingleAnswer(25),
      getOtherText(25),
      getOpenResponse(26),
      isArchived ? "true" : "false",
    ];

    // 5. Escape CSV values
    const escapedRow = rowValues.map(escapeCSV).join(",");
    dataRows.push(escapedRow);
  }

  // 6. Return the full CSV string with header row
  return [headerRow, ...dataRows].join("\n");
}
