import { client, db } from "./db";
import * as schema from "./schema";
import { hashPassword } from "./auth";

let isDbReady = false;
let initPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(): Promise<void> {
  if (isDbReady) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        // Fast-path: Check if questions table already exists and has data in 1 quick query
        try {
          const quickCheck = await client.execute("SELECT count(*) as count FROM questions");
          const count = Number(quickCheck.rows[0]?.count || 0);
          if (count > 0) {
            isDbReady = true;
            return;
          }
        } catch {
          // Table doesn't exist yet, proceed to create tables below
        }

        // 1. Check if questions table exists
        const tableCheck = await client.execute(
          "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='questions'"
        );
        const tableCount = Number(tableCheck.rows[0]?.count || 0);

        if (tableCount === 0) {
          console.log("Database tables missing. Running initial schema migration...");
          // Create tables
          await client.executeMultiple(`
            CREATE TABLE IF NOT EXISTS admin_users (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              username text NOT NULL,
              password_hash text NOT NULL,
              display_name text,
              created_at text NOT NULL,
              last_login_at text
            );
            CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_unique ON admin_users (username);

            CREATE TABLE IF NOT EXISTS surveys (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              title text NOT NULL,
              description text,
              incentive_text text,
              is_active integer DEFAULT true NOT NULL,
              created_at text NOT NULL,
              updated_at text NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sections (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              survey_id integer NOT NULL,
              section_key text NOT NULL,
              section_title text NOT NULL,
              description text,
              concept_text text,
              order_index integer NOT NULL,
              is_active integer DEFAULT true NOT NULL,
              FOREIGN KEY (survey_id) REFERENCES surveys(id) ON UPDATE no action ON DELETE no action
            );

            CREATE TABLE IF NOT EXISTS questions (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              section_id integer NOT NULL,
              question_number text NOT NULL,
              question_text text NOT NULL,
              question_type text NOT NULL,
              min_selections integer,
              max_selections integer,
              has_other_option integer DEFAULT false NOT NULL,
              conditional_logic text,
              researcher_note text,
              order_index integer NOT NULL,
              is_active integer DEFAULT true NOT NULL,
              current_revision integer DEFAULT 1 NOT NULL,
              created_at text NOT NULL,
              updated_at text NOT NULL,
              FOREIGN KEY (section_id) REFERENCES sections(id) ON UPDATE no action ON DELETE no action
            );

            CREATE TABLE IF NOT EXISTS question_options (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              question_id integer NOT NULL,
              option_text text NOT NULL,
              order_index integer NOT NULL,
              is_active integer DEFAULT true NOT NULL,
              FOREIGN KEY (question_id) REFERENCES questions(id) ON UPDATE no action ON DELETE no action
            );

            CREATE TABLE IF NOT EXISTS question_revisions (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              question_id integer NOT NULL,
              revision_number integer NOT NULL,
              question_text text NOT NULL,
              question_type text NOT NULL,
              options_snapshot text NOT NULL,
              changed_by text,
              change_reason text,
              created_at text NOT NULL,
              FOREIGN KEY (question_id) REFERENCES questions(id) ON UPDATE no action ON DELETE no action
            );

            CREATE TABLE IF NOT EXISTS survey_sessions (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              survey_id integer NOT NULL,
              session_token text NOT NULL,
              status text DEFAULT 'in_progress' NOT NULL,
              current_question_index integer DEFAULT 0 NOT NULL,
              language text DEFAULT 'en' NOT NULL,
              ip_address text,
              user_agent text,
              started_at text NOT NULL,
              completed_at text,
              last_activity_at text NOT NULL,
              FOREIGN KEY (survey_id) REFERENCES surveys(id) ON UPDATE no action ON DELETE no action
            );
            CREATE UNIQUE INDEX IF NOT EXISTS survey_sessions_session_token_unique ON survey_sessions (session_token);

            CREATE TABLE IF NOT EXISTS responses (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              session_id integer NOT NULL,
              question_id integer NOT NULL,
              question_revision integer NOT NULL,
              submitted_at text NOT NULL,
              is_archived integer DEFAULT false NOT NULL,
              FOREIGN KEY (session_id) REFERENCES survey_sessions(id) ON UPDATE no action ON DELETE no action,
              FOREIGN KEY (question_id) REFERENCES questions(id) ON UPDATE no action ON DELETE no action
            );

            CREATE TABLE IF NOT EXISTS response_answers (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              response_id integer NOT NULL,
              question_id integer NOT NULL,
              option_id integer,
              other_text text,
              free_text text,
              FOREIGN KEY (response_id) REFERENCES responses(id) ON UPDATE no action ON DELETE no action,
              FOREIGN KEY (question_id) REFERENCES questions(id) ON UPDATE no action ON DELETE no action,
              FOREIGN KEY (option_id) REFERENCES question_options(id) ON UPDATE no action ON DELETE no action
            );

            CREATE TABLE IF NOT EXISTS respondent_contacts (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              session_id integer NOT NULL,
              participant_name text,
              participant_contact text,
              collected_at text NOT NULL,
              FOREIGN KEY (session_id) REFERENCES survey_sessions(id) ON UPDATE no action ON DELETE no action
            );
            CREATE UNIQUE INDEX IF NOT EXISTS respondent_contacts_session_id_unique ON respondent_contacts (session_id);
          `);
        }

        // 2. Check if questions exist
        const countRes = await client.execute("SELECT count(*) as count FROM questions");
        const count = Number(countRes.rows[0]?.count || 0);

        if (count === 0) {
          console.log("Database has 0 questions. Auto-seeding initial 26 questions and admin...");
          await autoSeed();
        } else {
          // Database already has questions — keep everything intact and migrate any 'Kiyora' to 'Kiyoki'
          try {
            await client.executeMultiple(`
              UPDATE surveys SET title = REPLACE(REPLACE(title, 'KIYORA', 'KIYOKI'), 'Kiyora', 'Kiyoki'), description = REPLACE(REPLACE(description, 'KIYORA', 'KIYOKI'), 'Kiyora', 'Kiyoki');
              UPDATE sections SET section_title = REPLACE(REPLACE(section_title, 'KIYORA', 'KIYOKI'), 'Kiyora', 'Kiyoki'), concept_text = REPLACE(REPLACE(concept_text, 'KIYORA', 'KIYOKI'), 'Kiyora', 'Kiyoki');
              UPDATE questions SET question_text = REPLACE(REPLACE(question_text, 'KIYORA', 'KIYOKI'), 'Kiyora', 'Kiyoki');
            `);
          } catch (migrateErr) {
            console.warn("Kiyoki name migration check:", migrateErr);
          }

          // Check if new Q10 (severity of air pollution) exists, if not, migrate
          try {
            const checkQ10 = await client.execute(
              "SELECT count(*) as count FROM questions WHERE question_text LIKE '%severity of air pollution%'"
            );
            if (Number(checkQ10.rows[0]?.count || 0) === 0) {
              console.log("Migrating database to insert Q10 (air pollution severity)...");
              const allQRes = await client.execute(
                "SELECT id, question_number, order_index, conditional_logic, section_id FROM questions ORDER BY order_index DESC"
              );
              const qRows = allQRes.rows as unknown as {
                id: number;
                question_number: string;
                order_index: number;
                conditional_logic: string | null;
                section_id: number;
              }[];

              const secBId = qRows.find((q) => q.order_index === 9)?.section_id || 2;

              for (const q of qRows) {
                if (q.order_index >= 10) {
                  const newIdx = q.order_index + 1;
                  const newNum = `Q${newIdx}`;
                  let cond = q.conditional_logic;
                  if (cond && cond.includes('"questionNumber":"Q10"')) {
                    cond = cond.replace('"questionNumber":"Q10"', '"questionNumber":"Q11"');
                  }
                  await client.execute({
                    sql: "UPDATE questions SET order_index = ?, question_number = ?, conditional_logic = ? WHERE id = ?",
                    args: [newIdx, newNum, cond, q.id],
                  });
                }
              }

              const nowStr = new Date().toISOString();
              const insertQ = await client.execute({
                sql: "INSERT INTO questions (section_id, question_number, question_text, question_type, order_index, is_active, has_other_option, current_revision, created_at, updated_at) VALUES (?, 'Q10', 'Considering the current severity of air pollution, do you feel the need to own an air purifier in the near future?', 'radio', 10, 1, 0, 1, ?, ?)",
                args: [secBId, nowStr, nowStr],
              });
              const newQId = Number(insertQ.lastInsertRowid);

              await client.executeMultiple(`
                INSERT INTO question_options (question_id, option_text, order_index, is_active) VALUES (${newQId}, 'Yes', 1, 1);
                INSERT INTO question_options (question_id, option_text, order_index, is_active) VALUES (${newQId}, 'No', 2, 1);
                INSERT INTO question_options (question_id, option_text, order_index, is_active) VALUES (${newQId}, 'Maybe', 3, 1);
                INSERT INTO question_revisions (question_id, revision_number, question_text, question_type, options_snapshot, changed_by, change_reason, created_at) VALUES (${newQId}, 1, 'Considering the current severity of air pollution, do you feel the need to own an air purifier in the near future?', 'radio', '["Yes","No","Maybe"]', 'system', 'Added Q10 on air pollution severity', '${nowStr}');
              `);
              console.log("Q10 migration complete. 26 questions active.");
            }
          } catch (q10Err) {
            console.warn("Q10 migration error:", q10Err);
          }
        }
        isDbReady = true;
      } catch (err) {
        console.warn("Auto-initialization check:", err);
      }
    })();
  }

  return initPromise;
}

async function autoSeed() {
  const now = new Date().toISOString();

  // 1. Insert Survey
  const [survey] = await db
    .insert(schema.surveys)
    .values({
      title: "KIYOKI Customer Research Questionnaire",
      description: "India Air Purifier Concept & Price Validation",
      incentiveText:
        "Participants who successfully complete the full research survey/session will receive a coupon worth ₹2,000. The coupon is a research participation reward and should not be presented as a discount on the air purifier.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // 2. Insert Sections
  const sectionsData = [
    { sectionKey: "A", sectionTitle: "Respondent Profile", orderIndex: 1, conceptText: null },
    { sectionKey: "B", sectionTitle: "Air Quality, Need & Current Behaviour", orderIndex: 2, conceptText: null },
    { sectionKey: "C", sectionTitle: "Purchase Decision & Price", orderIndex: 3, conceptText: null },
    {
      sectionKey: "D",
      sectionTitle: "Blind Kiyoki Concept Test",
      orderIndex: 4,
      conceptText:
        'CONCEPT 1: "A premium air purifier designed specifically for India\'s high-pollution conditions, with strong air-cleaning performance, HEPA filtration, UV treatment and a premium minimalist design. Expected price: ₹11,999."',
    },
    {
      sectionKey: "E",
      sectionTitle: "Japanese Technology & Brand Positioning",
      orderIndex: 5,
      conceptText:
        'CONCEPT 2: "Kiyoki is being developed for Indian pollution conditions and incorporates Japanese technology / design thinking, while targeting a price of approximately ₹11,999."',
    },
    {
      sectionKey: "F",
      sectionTitle: "Final Kiyoki Purchase Test",
      orderIndex: 6,
      conceptText:
        'FINAL PROPOSITION: "KIYOKI — an air purifier built for India\'s pollution conditions, incorporating Japanese technology/design thinking, strong CADR, HEPA filtration and UV treatment, with premium design at approximately ₹11,999."',
    },
  ];

  const sectionRows = await db
    .insert(schema.sections)
    .values(
      sectionsData.map((s) => ({
        surveyId: survey.id,
        sectionKey: s.sectionKey,
        sectionTitle: s.sectionTitle,
        conceptText: s.conceptText,
        orderIndex: s.orderIndex,
        isActive: true,
      }))
    )
    .returning();

  const sec: Record<string, number> = {};
  for (const s of sectionRows) {
    sec[s.sectionKey] = s.id;
  }

  // 3. Insert Questions & Options
  const questionsData = [
    { sectionId: sec["A"], questionNumber: "Q1", orderIndex: 1, questionText: "Age group", questionType: "radio" as const, options: ["18-24", "25-34", "35-44", "45-54", "55+"] },
    { sectionId: sec["A"], questionNumber: "Q2", orderIndex: 2, questionText: "Gender", questionType: "radio" as const, options: ["Male", "Female", "Prefer not to say / Other"] },
    { sectionId: sec["A"], questionNumber: "Q3", orderIndex: 3, questionText: "Which best describes your current status?", questionType: "radio" as const, options: ["Student", "Working professional", "Business / self-employed", "Homemaker", "Other"] },
    { sectionId: sec["A"], questionNumber: "Q4", orderIndex: 4, questionText: "What is your marital status?", questionType: "radio" as const, options: ["Single", "Married", "Other / Prefer not to say"] },
    { sectionId: sec["A"], questionNumber: "Q5", orderIndex: 5, questionText: "Do you have children?", questionType: "radio" as const, options: ["No", "Yes - child under 5", "Yes - child 5-12", "Yes - child 13-18", "Yes - adult children"] },
    { sectionId: sec["A"], questionNumber: "Q6", orderIndex: 6, questionText: "Who currently lives in your household? (Select all that apply)", questionType: "checkbox" as const, options: ["Spouse / partner", "Children", "Parents / elderly family members", "Other family members", "I live alone"] },
    { sectionId: sec["A"], questionNumber: "Q7", orderIndex: 7, questionText: "Where do you currently live?", questionType: "radio" as const, researcherNote: "Researcher may additionally record city/locality separately if required.", options: ["Delhi NCR", "Other metro city", "Tier 2 city", "Tier 3 / smaller city", "Other"] },
    { sectionId: sec["B"], questionNumber: "Q8", orderIndex: 8, questionText: "How concerned are you about indoor air quality and pollution inside your home?", questionType: "radio" as const, options: ["Very concerned", "Somewhat concerned", "Neutral", "Not very concerned", "Not concerned at all"] },
    { sectionId: sec["B"], questionNumber: "Q9", orderIndex: 9, questionText: "Do you currently own or regularly use an air purifier at home?", questionType: "radio" as const, options: ["Yes", "No", "Used one previously"] },
    { sectionId: sec["B"], questionNumber: "Q10", orderIndex: 10, questionText: "Considering the current severity of air pollution, do you feel the need to own an air purifier in the near future?", questionType: "radio" as const, options: ["Yes", "No", "Maybe"] },
    { sectionId: sec["B"], questionNumber: "Q11", orderIndex: 11, questionText: "What would be the main reasons for you to consider an air purifier? (Select up to 3)", questionType: "checkbox" as const, maxSelections: 3, hasOtherOption: true, options: ["High outdoor pollution / AQI", "Cleaner indoor air", "Children's health", "Elderly family members", "Dust / allergy concerns", "Smoke / odour", "General preventive health / wellness", "I do not see a need"] },
    { sectionId: sec["B"], questionNumber: "Q12", orderIndex: 12, questionText: "If you would NOT consider buying an air purifier, what is the main reason?", questionType: "radio" as const, hasOtherOption: true, conditionalLogic: '{"type":"show_if","conditions":[{"questionNumber":"Q11","operator":"includes_option","value":"I do not see a need"}],"fallback":"skip"}', researcherNote: "If respondent is clearly not interested, continue with profile/brand perception questions as useful; do not force purchase-intent answers.", options: ["Too expensive", "Do not think I need one", "Do not know enough about air purifiers", "Do not trust their effectiveness", "Filter / maintenance cost", "Already have one"] },
    { sectionId: sec["C"], questionNumber: "Q13", orderIndex: 13, questionText: "Which THREE factors matter most when choosing an air purifier?", questionType: "checkbox" as const, minSelections: 3, maxSelections: 3, options: ["Air-cleaning performance / CADR", "Price", "Filter quality / HEPA filtration", "Annual filter & maintenance cost", "Brand trust", "Low noise", "Design / appearance", "Room coverage", "Air-quality display / smart features", "Warranty & after-sales service"] },
    { sectionId: sec["C"], questionNumber: "Q14", orderIndex: 14, questionText: "Before seeing any Kiyoki concept, what price would you personally consider reasonable for a good air purifier for your home?", questionType: "radio" as const, options: ["Below ₹8,000", "₹8,000-9,999", "₹10,000-11,999", "₹12,000-14,999", "₹15,000-19,999", "₹20,000+"] },
    { sectionId: sec["C"], questionNumber: "Q15", orderIndex: 15, questionText: "Where would you be most comfortable buying an air purifier?", questionType: "radio" as const, hasOtherOption: true, options: ["Amazon", "Flipkart", "Brand website", "Electronics / retail store", "Through a trusted dealer"] },
    { sectionId: sec["C"], questionNumber: "Q16", orderIndex: 16, questionText: "Which air-purifier brands, if any, would you naturally consider today?", questionType: "checkbox" as const, hasOtherOption: true, options: ["Dyson", "Philips", "Xiaomi", "Qubo", "Coway", "Honeywell", "I don't know / no preference"] },
    { sectionId: sec["D"], questionNumber: "Q17", orderIndex: 17, questionText: "Based only on the description above, how likely would you be to consider buying it at ₹11,999?", questionType: "radio" as const, researcherNote: "Record purchase intent at Q17 before revealing Japanese technology, then compare it with Q24. This helps measure whether the Japanese-technology + India-pollution positioning actually increases consideration. Do not coach respondents toward a positive answer.", options: ["Definitely would consider", "Probably would consider", "Not sure", "Probably would not consider", "Definitely would not consider"] },
    { sectionId: sec["D"], questionNumber: "Q18", orderIndex: 18, questionText: "What is your FIRST reaction to the ₹11,999 price?", questionType: "radio" as const, options: ["Very good value", "Reasonable / acceptable", "Slightly expensive but I may consider it", "Too expensive", "Not sure without comparing performance and filter cost"] },
    { sectionId: sec["D"], questionNumber: "Q19", orderIndex: 19, questionText: "What would you need to believe or verify before paying ₹11,999? (Select up to 3)", questionType: "checkbox" as const, maxSelections: 3, hasOtherOption: true, options: ["Proven CADR / cleaning performance", "Effective for severe Indian pollution", "Filter life and replacement cost", "Independent testing / certification", "Warranty & after-sales support", "Low noise", "Low electricity consumption", "Trusted technology / engineering credentials", "Customer reviews"] },
    { sectionId: sec["E"], questionNumber: "Q20", orderIndex: 20, questionText: "After learning about the Japanese technology / design association, does your interest change?", questionType: "radio" as const, options: ["Much more interested", "Somewhat more interested", "No change", "Somewhat less interested", "Much less interested"] },
    { sectionId: sec["E"], questionNumber: "Q21", orderIndex: 21, questionText: "What does 'Japanese technology' communicate to you most strongly? (Select up to 2)", questionType: "checkbox" as const, maxSelections: 2, options: ["Better quality", "Reliability / durability", "Advanced technology", "Premium design", "Better safety / precision", "Higher price", "It does not make a difference to me", "I would need proof of the Japanese association"] },
    { sectionId: sec["E"], questionNumber: "Q22", orderIndex: 22, questionText: "Which positioning feels most relevant and credible to you?", questionType: "radio" as const, options: ["Made for Indian pollution", "Japanese technology / design", "Strong performance at an accessible price", "Premium minimalist design", "A combination of Indian-market engineering + Japanese technology", "None of these"] },
    { sectionId: sec["E"], questionNumber: "Q23", orderIndex: 23, questionText: "How important is proof of the Japanese technology/design association before it influences your purchase?", questionType: "radio" as const, options: ["Essential - I would want clear evidence", "Important", "Nice to have", "Not important", "Japanese association does not affect my decision"] },
    { sectionId: sec["F"], questionNumber: "Q24", orderIndex: 24, questionText: "Considering everything you have seen, how likely are you to buy / seriously consider Kiyoki at ₹11,999?", questionType: "radio" as const, options: ["Definitely yes", "Probably yes", "Not sure", "Probably no", "Definitely no"] },
    { sectionId: sec["F"], questionNumber: "Q25", orderIndex: 25, questionText: "Which ONE thing would most increase your confidence to buy Kiyoki?", questionType: "radio" as const, hasOtherOption: true, options: ["Independent performance test results", "Clear Japanese technology/design partnership proof", "Lower filter replacement cost / longer filter life", "Strong warranty and service network", "Customer reviews / recommendations", "IIT / credible technical institution association, if officially validated and communicated", "Introductory offer / financing"] },
    { sectionId: sec["F"], questionNumber: "Q26", orderIndex: 26, questionText: "In one sentence, what would make you choose Kiyoki over an established air-purifier brand?", questionType: "text" as const, options: [] },
  ];

  for (const q of questionsData) {
    const [insertedQ] = await db
      .insert(schema.questions)
      .values({
        sectionId: q.sectionId,
        questionNumber: q.questionNumber,
        orderIndex: q.orderIndex,
        questionText: q.questionText,
        questionType: q.questionType,
        minSelections: "minSelections" in q ? q.minSelections : null,
        maxSelections: "maxSelections" in q ? q.maxSelections : null,
        hasOtherOption: "hasOtherOption" in q ? Boolean(q.hasOtherOption) : false,
        conditionalLogic: "conditionalLogic" in q ? q.conditionalLogic : null,
        researcherNote: "researcherNote" in q ? q.researcherNote : null,
        isActive: true,
        currentRevision: 1,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (q.options.length > 0) {
      await db.insert(schema.questionOptions).values(
        q.options.map((opt, idx) => ({
          questionId: insertedQ.id,
          optionText: opt,
          orderIndex: idx + 1,
          isActive: true,
        }))
      );
    }

    await db.insert(schema.questionRevisions).values({
      questionId: insertedQ.id,
      revisionNumber: 1,
      questionText: q.questionText,
      questionType: q.questionType,
      optionsSnapshot: JSON.stringify(q.options),
      changedBy: "system",
      changeReason: "Initial seed",
      createdAt: now,
    });
  }

  // 4. Insert Admin User
  const password = process.env.ADMIN_INITIAL_PASSWORD || "admin123";
  const passwordHash = await hashPassword(password);
  await db.insert(schema.adminUsers).values({
    username: "admin",
    passwordHash,
    displayName: "Administrator",
    createdAt: now,
  });
}
