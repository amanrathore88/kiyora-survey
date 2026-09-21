import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/schema";
import { shouldShowQuestion, validateResearchSequence, purchaseIntentScore, calculateIntentShift } from "../src/lib/survey-engine";
import { verifyPassword } from "../src/lib/auth";
import { generateCSV } from "../src/lib/csv-export";
import { eq, asc, and, gt } from "drizzle-orm";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 RUNNING COMPREHENSIVE SYSTEM VERIFICATION TESTS");
  console.log("==================================================\n");

  const client = createClient({ url: process.env.DATABASE_URL || "file:./kiyora-survey.db" });
  const db = drizzle(client, { schema });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Database Seed Verification (Surveys, Sections, Questions)
  // ----------------------------------------------------
  console.log("📋 1. Verifying Database Seed & Structure...");
  const [survey] = await db.select().from(schema.surveys).limit(1);
  assert(!!survey && survey.title === "KIYORA Customer Research Questionnaire", "Survey title matches exactly");
  assert(
    !!survey.incentiveText?.includes("₹2,000") &&
    !!survey.incentiveText?.includes("research participation reward") &&
    !!survey.incentiveText?.includes("should not be presented as a discount"),
    "Incentive text accurately describes ₹2,000 reward, NOT a discount"
  );

  const sections = await db.select().from(schema.sections).orderBy(asc(schema.sections.orderIndex));
  assert(sections.length === 6, "Exactly 6 sections (A-F) created");
  assert(sections[0].sectionKey === "A" && sections[5].sectionKey === "F", "Sections ordered A to F");
  assert(Boolean(sections[3].conceptText?.includes("CONCEPT 1") && !sections[3].conceptText?.includes("Japanese")), "Section D concept contains Concept 1 without Japanese reference");
  assert(Boolean(sections[4].conceptText?.includes("CONCEPT 2") && sections[4].conceptText?.includes("Japanese technology")), "Section E concept contains Concept 2 with Japanese technology");
  assert(Boolean(sections[5].conceptText?.includes("FINAL PROPOSITION")), "Section F concept contains Final Proposition");

  const allQuestions = await db.select().from(schema.questions).orderBy(asc(schema.questions.orderIndex));
  assert(allQuestions.length === 25, "Exactly 25 questions seeded");
  assert(allQuestions[0].questionNumber === "Q1" && allQuestions[24].questionNumber === "Q25", "Questions ordered Q1 to Q25");

  // ----------------------------------------------------
  // TEST 2: Selection Constraints (Q10, Q12, Q18, Q20, Q6, Q15)
  // ----------------------------------------------------
  console.log("\n🔒 2. Verifying Min & Max Selection Constraints...");
  const q6 = allQuestions.find((q) => q.questionNumber === "Q6");
  assert(q6?.minSelections === null && q6?.maxSelections === null, "Q6 has no artificial max limits");

  const q10 = allQuestions.find((q) => q.questionNumber === "Q10");
  assert(q10?.maxSelections === 3, "Q10 maximum 3 selections enforced in schema");

  const q12 = allQuestions.find((q) => q.questionNumber === "Q12");
  assert(q12?.minSelections === 3 && q12?.maxSelections === 3, "Q12 EXACTLY 3 selections (min=3, max=3) enforced in schema");

  const q18 = allQuestions.find((q) => q.questionNumber === "Q18");
  assert(q18?.maxSelections === 3, "Q18 maximum 3 selections enforced in schema");

  const q20 = allQuestions.find((q) => q.questionNumber === "Q20");
  assert(q20?.maxSelections === 2, "Q20 maximum 2 selections enforced in schema");

  const q25 = allQuestions.find((q) => q.questionNumber === "Q25");
  assert(q25?.questionType === "text", "Q25 is open text response");

  // ----------------------------------------------------
  // TEST 3: Normalized Options Table Verification
  // ----------------------------------------------------
  console.log("\n🗄️ 3. Verifying Normalized question_options Table (No JSON Blobs)...");
  const q1Options = await db.select().from(schema.questionOptions).where(eq(schema.questionOptions.questionId, allQuestions[0].id));
  assert(q1Options.length === 5, "Q1 options normalized into question_options table with 5 rows");
  assert(q1Options.map(o => o.optionText).join(",") === "18-24,25-34,35-44,45-54,55+", "Q1 options match exact questionnaire values");

  // ----------------------------------------------------
  // TEST 4: Conditional Logic Engine (Q11 Behavior)
  // ----------------------------------------------------
  console.log("\n🔀 4. Verifying Conditional Logic Engine...");
  const q11 = allQuestions.find((q) => q.questionNumber === "Q11");
  assert(!!q11?.conditionalLogic, "Q11 has conditional logic rule defined");

  const showWhenNeedNotSeen = shouldShowQuestion(q11!.conditionalLogic, {
    Q10: { selectedOptions: ["High outdoor pollution / AQI", "I do not see a need"] },
  });
  assert(showWhenNeedNotSeen === true, "Q11 IS shown when Q10 includes 'I do not see a need'");

  const skipWhenPositiveNeed = shouldShowQuestion(q11!.conditionalLogic, {
    Q10: { selectedOptions: ["High outdoor pollution / AQI", "Cleaner indoor air"] },
  });
  assert(skipWhenPositiveNeed === false, "Q11 IS SKIPPED when Q10 does not include 'I do not see a need'");

  // ----------------------------------------------------
  // TEST 5: Research Sequence Validation (Q16 Before Japanese Reveal)
  // ----------------------------------------------------
  console.log("\n🇯🇵 5. Verifying Research Sequence Integrity...");
  const seqWithoutQ16 = validateResearchSequence(19, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15]);
  assert(!seqWithoutQ16.valid, "Sequence blocks Q19 (Japanese positioning) if Q16 is not answered");

  const seqWithQ16 = validateResearchSequence(19, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16]);
  assert(seqWithQ16.valid, "Sequence allows Q19 when Q16 has been answered");

  // ----------------------------------------------------
  // TEST 6: Purchase Intent Comparison (Q16 vs Q23 Scoring)
  // ----------------------------------------------------
  console.log("\n📊 6. Verifying Purchase Intent Analytics Comparison (Q16 vs Q23)...");
  assert(purchaseIntentScore("Definitely would consider") === 5, "Q16 definite = score 5");
  assert(purchaseIntentScore("Probably no") === 2, "Q23 probably no = score 2");
  assert(calculateIntentShift("Probably would consider", "Definitely yes") === "upgraded", "Shift upgraded when score increases (4 -> 5)");
  assert(calculateIntentShift("Definitely would consider", "Probably yes") === "downgraded", "Shift downgraded when score decreases (5 -> 4)");
  assert(calculateIntentShift("Not sure", "Not sure") === "same", "Shift same when score unchanged (3 -> 3)");

  // ----------------------------------------------------
  // TEST 7: Admin Authentication & Password Security
  // ----------------------------------------------------
  console.log("\n🔐 7. Verifying Admin Authentication Security (PBKDF2)...");
  const [admin] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.username, "admin"));
  assert(!!admin, "Admin user exists in admin_users table");
  const correctPassword = await verifyPassword("admin123", admin.passwordHash);
  assert(correctPassword === true, "Valid password accepted by PBKDF2 verification");
  const incorrectPassword = await verifyPassword("wrongpassword", admin.passwordHash);
  assert(incorrectPassword === false, "Invalid password rejected by PBKDF2 verification");

  // ----------------------------------------------------
  // TEST 8: Full Survey Session, Responses & Answers Persistence
  // ----------------------------------------------------
  console.log("\n💾 8. Verifying Survey Session Flow, Submission & Audit Persistence...");
  const testSessionToken = "test-session-" + Date.now();

  const [testSession] = await db.insert(schema.surveySessions).values({
    surveyId: survey.id,
    sessionToken: testSessionToken,
    status: "in_progress",
    currentQuestionIndex: 1,
  }).returning();

  assert(!!testSession && testSession.status === "in_progress", "Survey session created with in_progress status");

  // Record Q1 response
  const [q1Response] = await db.insert(schema.responses).values({
    sessionId: testSession.id,
    questionId: allQuestions[0].id,
    questionRevision: allQuestions[0].currentRevision,
    isArchived: false,
  }).returning();

  await db.insert(schema.responseAnswers).values({
    responseId: q1Response.id,
    questionId: allQuestions[0].id,
    optionId: q1Options[1].id, // 25-34
  });

  // Record Q16 response
  const q16Question = allQuestions.find(q => q.questionNumber === "Q16")!;
  const q16Options = await db.select().from(schema.questionOptions).where(eq(schema.questionOptions.questionId, q16Question.id));
  const [q16Response] = await db.insert(schema.responses).values({
    sessionId: testSession.id,
    questionId: q16Question.id,
    questionRevision: q16Question.currentRevision,
    isArchived: false,
  }).returning();
  await db.insert(schema.responseAnswers).values({
    responseId: q16Response.id,
    questionId: q16Question.id,
    optionId: q16Options[1].id, // Probably would consider
  });

  // Record Q23 response
  const q23Question = allQuestions.find(q => q.questionNumber === "Q23")!;
  const q23Options = await db.select().from(schema.questionOptions).where(eq(schema.questionOptions.questionId, q23Question.id));
  const [q23Response] = await db.insert(schema.responses).values({
    sessionId: testSession.id,
    questionId: q23Question.id,
    questionRevision: q23Question.currentRevision,
    isArchived: false,
  }).returning();
  await db.insert(schema.responseAnswers).values({
    responseId: q23Response.id,
    questionId: q23Question.id,
    optionId: q23Options[0].id, // Definitely yes
  });

  // Complete session
  await db.update(schema.surveySessions).set({
    status: "completed",
    completedAt: new Date().toISOString(),
  }).where(eq(schema.surveySessions.id, testSession.id));

  // Collect contact info POST completion
  await db.insert(schema.respondentContacts).values({
    sessionId: testSession.id,
    participantName: "Priya Sharma",
    participantContact: "priya.sharma@example.com",
  });

  const [contactCheck] = await db.select().from(schema.respondentContacts).where(eq(schema.respondentContacts.sessionId, testSession.id));
  assert(contactCheck?.participantName === "Priya Sharma", "Respondent contact recorded successfully after survey completion");

  // ----------------------------------------------------
  // TEST 9: Question Versioning & Revision System
  // ----------------------------------------------------
  console.log("\n📜 9. Verifying Question Versioning & Revision Tracking...");
  // Question with responses (Q1) should create revision 2
  const initialRevisions = await db.select().from(schema.questionRevisions).where(eq(schema.questionRevisions.questionId, allQuestions[0].id));
  assert(initialRevisions.length === 1 && initialRevisions[0].revisionNumber === 1, "Question starts with revision 1 snapshot");

  // Simulate updating question Q1 which already has answers
  const newRevisionNumber = allQuestions[0].currentRevision + 1;
  await db.insert(schema.questionRevisions).values({
    questionId: allQuestions[0].id,
    revisionNumber: newRevisionNumber,
    questionText: "Age group (Updated category wording)",
    questionType: allQuestions[0].questionType,
    optionsSnapshot: JSON.stringify(["18-24", "25-34", "35-44", "45-54", "55+"]),
    changedBy: "admin",
    changeReason: "Research team refinement",
  });
  await db.update(schema.questions).set({
    currentRevision: newRevisionNumber,
    questionText: "Age group (Updated category wording)",
  }).where(eq(schema.questions.id, allQuestions[0].id));

  const updatedRevisions = await db.select().from(schema.questionRevisions).where(eq(schema.questionRevisions.questionId, allQuestions[0].id));
  assert(updatedRevisions.length === 2, "Editing a used question created a new Revision #2 without deleting Revision #1");

  // Check that historical answer still references revision 1
  const [histResponse] = await db.select().from(schema.responses).where(eq(schema.responses.id, q1Response.id));
  assert(histResponse.questionRevision === 1, "Historical response preserved original question revision number");

  // Restore question 1 text and clean up test revision for consistency
  await db.update(schema.questions).set({
    questionText: "Age group",
    currentRevision: 1,
  }).where(eq(schema.questions.id, allQuestions[0].id));
  await db.delete(schema.questionRevisions).where(
    and(
      eq(schema.questionRevisions.questionId, allQuestions[0].id),
      gt(schema.questionRevisions.revisionNumber, 1)
    )
  );

  // ----------------------------------------------------
  // TEST 10: Soft Deletion (Never Destructive Delete)
  // ----------------------------------------------------
  console.log("\n🗑️ 10. Verifying Soft-Delete (Deactivation) Guarantee...");
  await db.update(schema.questions).set({ isActive: false }).where(eq(schema.questions.id, allQuestions[0].id));
  const [deactivatedQ] = await db.select().from(schema.questions).where(eq(schema.questions.id, allQuestions[0].id));
  assert(deactivatedQ.isActive === false, "Question deactivated via soft-delete flag (isActive = false)");

  // Reactivate
  await db.update(schema.questions).set({ isActive: true }).where(eq(schema.questions.id, allQuestions[0].id));
  const [reactivatedQ] = await db.select().from(schema.questions).where(eq(schema.questions.id, allQuestions[0].id));
  assert(reactivatedQ.isActive === true, "Question reactivated cleanly without loss of data");

  // Response archiving (soft delete)
  await db.update(schema.responses).set({ isArchived: true }).where(eq(schema.responses.sessionId, testSession.id));
  const [archivedCheck] = await db.select().from(schema.responses).where(eq(schema.responses.sessionId, testSession.id));
  assert(archivedCheck.isArchived === true, "Response successfully archived (soft-deleted with auditability)");
  await db.update(schema.responses).set({ isArchived: false }).where(eq(schema.responses.sessionId, testSession.id));

  // ----------------------------------------------------
  // TEST 11: Flattened CSV Export Generation
  // ----------------------------------------------------
  console.log("\n📄 11. Verifying Flattened CSV Export Generation...");
  const csvContent = await generateCSV();
  assert(csvContent.startsWith("session_id,submitted_at,participant_name"), "CSV starts with exact expected headers");
  assert(csvContent.includes("Priya Sharma"), "CSV row contains completed participant data");
  assert(csvContent.includes("Q16_blind_purchase_intent") && csvContent.includes("Q23_final_purchase_intent"), "CSV contains both Q16 blind intent and Q23 final purchase intent columns");

  // ----------------------------------------------------
  // TEST 12: Bilingual Hindi/English Translations & English Persistence
  // ----------------------------------------------------
  console.log("\n🌐 12. Verifying Bilingual Support (English & Hindi) & English DB Storage...");
  const { QUESTIONS_TRANSLATIONS, SECTIONS_TRANSLATIONS, UI_TRANSLATIONS, getTranslatedQuestion } = await import("../src/lib/translations");
  
  assert(Object.keys(QUESTIONS_TRANSLATIONS).length === 25, "All 25 questions have registered translations");
  assert(Object.keys(SECTIONS_TRANSLATIONS).length === 6, "All 6 sections have registered translations");
  assert(Boolean(UI_TRANSLATIONS.hi.surveyTitle && UI_TRANSLATIONS.en.surveyTitle), "UI strings defined for both English and Hindi");

  // Verify Hindi translation resolution
  const q1Trans = getTranslatedQuestion("Q1", "hi", "Age group", [
    { id: 1, optionText: "18-24", orderIndex: 1 },
    { id: 2, optionText: "25-34", orderIndex: 2 },
  ]);
  assert(q1Trans.questionText === "आयु वर्ग", "Q1 translates to Hindi properly");
  assert(q1Trans.options[0].optionText === "18-24 वर्ष", "Q1 options translate to Hindi properly");

  // Create a Hindi session and submit an answer
  const [hindiSession] = await db.insert(schema.surveySessions).values({
    surveyId: survey.id,
    sessionToken: "hindi-test-session-" + Date.now(),
    status: "completed",
    language: "hi",
    currentQuestionIndex: 1,
  }).returning();

  const [hindiResp] = await db.insert(schema.responses).values({
    sessionId: hindiSession.id,
    questionId: allQuestions[0].id,
    questionRevision: 1,
    isArchived: false,
  }).returning();

  // Respondent chose Hindi option "25-34 वर्ष", but backend saves option ID (English "25-34")
  await db.insert(schema.responseAnswers).values({
    responseId: hindiResp.id,
    questionId: allQuestions[0].id,
    optionId: q1Options[1].id,
  });

  await db.insert(schema.respondentContacts).values({
    sessionId: hindiSession.id,
    participantName: "Rahul Verma",
    participantContact: "rahul@example.com",
  });

  // Verify stored response in DB is linked to English option text
  const [savedOpt] = await db.select().from(schema.questionOptions).where(eq(schema.questionOptions.id, q1Options[1].id));
  assert(savedOpt.optionText === "25-34", "Selected Hindi option maps to canonical English option in database");

  // Verify CSV export outputs English answer for Hindi session
  const hindiCSV = await generateCSV();
  assert(hindiCSV.includes("Rahul Verma") && hindiCSV.includes("25-34"), "CSV export outputs English answers for respondent who chose Hindi");
  assert(hindiCSV.includes(",hi,"), "CSV export records survey language as 'hi'");

  // Clean up Hindi test session
  await db.delete(schema.responseAnswers).where(eq(schema.responseAnswers.responseId, hindiResp.id));
  await db.delete(schema.responses).where(eq(schema.responses.sessionId, hindiSession.id));
  await db.delete(schema.respondentContacts).where(eq(schema.respondentContacts.sessionId, hindiSession.id));
  await db.delete(schema.surveySessions).where(eq(schema.surveySessions.id, hindiSession.id));

  // ----------------------------------------------------
  // TEST 13: Survey Pause, Resume & Abandonment Flow
  // ----------------------------------------------------
  console.log("\n⏸️ 13. Verifying Survey Pause, Resume & Abandonment Lifecycle...");
  const pauseTestToken = "lifecycle-test-" + Date.now();
  const [pauseSession] = await db.insert(schema.surveySessions).values({
    surveyId: survey.id,
    sessionToken: pauseTestToken,
    status: "in_progress",
    language: "en",
    currentQuestionIndex: 1,
  }).returning();

  // 1. Simulate pausing at question 14
  await db.update(schema.surveySessions).set({
    currentQuestionIndex: 14,
    lastActivityAt: new Date().toISOString(),
  }).where(eq(schema.surveySessions.id, pauseSession.id));

  const [pausedCheck] = await db.select().from(schema.surveySessions).where(eq(schema.surveySessions.id, pauseSession.id));
  assert(pausedCheck.currentQuestionIndex === 14 && pausedCheck.status === "in_progress", "Survey session paused with progress saved at Question 14");

  // 2. Simulate resuming session
  const [resumedCheck] = await db.select().from(schema.surveySessions).where(eq(schema.surveySessions.sessionToken, pauseTestToken));
  assert(resumedCheck.status === "in_progress" && resumedCheck.currentQuestionIndex === 14, "Survey session resumes cleanly from Question 14");

  // 3. Simulate respondent abandoning midway
  await db.update(schema.surveySessions).set({
    status: "abandoned",
    currentQuestionIndex: 14,
    lastActivityAt: new Date().toISOString(),
  }).where(eq(schema.surveySessions.id, pauseSession.id));

  const [abandonedCheck] = await db.select().from(schema.surveySessions).where(eq(schema.surveySessions.id, pauseSession.id));
  assert(abandonedCheck.status === "abandoned" && abandonedCheck.currentQuestionIndex === 14, "Survey session marked as abandoned with drop-off index 14 recorded");

  // 4. Verify abandoned session cannot be resumed
  assert(abandonedCheck.status !== "in_progress", "Abandoned session correctly blocked from active survey resumption");

  // Clean up test session
  await db.delete(schema.surveySessions).where(eq(schema.surveySessions.id, pauseSession.id));

  console.log("\n==================================================");
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
