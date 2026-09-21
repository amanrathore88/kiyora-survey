import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/schema";
import { webcrypto } from "crypto";
import { sql } from "drizzle-orm";

const nodeCrypto = webcrypto as unknown as Crypto;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = nodeCrypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await nodeCrypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const hash = await nodeCrypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(hash);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hashHex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${saltHex}:${hashHex}`;
}

interface QuestionSeedData {
  sectionId: number;
  questionNumber: string;
  orderIndex: number;
  questionText: string;
  questionType: "radio" | "checkbox" | "text";
  minSelections?: number;
  maxSelections?: number;
  hasOtherOption?: boolean;
  conditionalLogic?: string;
  researcherNote?: string;
  options: string[];
}

async function seed() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:./kiyora-survey.db",
  });
  const db = drizzle(client, { schema });

  console.log("Clearing existing data...");
  await db.run(sql`DELETE FROM response_answers`);
  await db.run(sql`DELETE FROM responses`);
  await db.run(sql`DELETE FROM respondent_contacts`);
  await db.run(sql`DELETE FROM survey_sessions`);
  await db.run(sql`DELETE FROM question_revisions`);
  await db.run(sql`DELETE FROM question_options`);
  await db.run(sql`DELETE FROM questions`);
  await db.run(sql`DELETE FROM sections`);
  await db.run(sql`DELETE FROM surveys`);
  await db.run(sql`DELETE FROM admin_users`);

  console.log("Inserting survey...");
  const [survey] = await db
    .insert(schema.surveys)
    .values({
      title: "KIYOKI Customer Research Questionnaire",
      description: "India Air Purifier Concept & Price Validation",
      incentiveText:
        "Participants who successfully complete the full research survey/session will receive a coupon worth ₹2,000. The coupon is a research participation reward and should not be presented as a discount on the air purifier.",
      isActive: true,
    })
    .returning();

  console.log("Inserting sections...");
  const sectionsData = [
    {
      sectionKey: "A",
      sectionTitle: "Respondent Profile",
      orderIndex: 1,
      conceptText: null as string | null,
    },
    {
      sectionKey: "B",
      sectionTitle: "Air Quality, Need & Current Behaviour",
      orderIndex: 2,
      conceptText: null as string | null,
    },
    {
      sectionKey: "C",
      sectionTitle: "Purchase Decision & Price",
      orderIndex: 3,
      conceptText: null as string | null,
    },
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
        description: null,
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

  console.log("Inserting questions...");

  const questionsData: QuestionSeedData[] = [
    // === Section A: Respondent Profile ===
    {
      sectionId: sec["A"],
      questionNumber: "Q1",
      orderIndex: 1,
      questionText: "Age group",
      questionType: "radio",
      options: ["18-24", "25-34", "35-44", "45-54", "55+"],
    },
    {
      sectionId: sec["A"],
      questionNumber: "Q2",
      orderIndex: 2,
      questionText: "Gender",
      questionType: "radio",
      options: ["Male", "Female", "Prefer not to say / Other"],
    },
    {
      sectionId: sec["A"],
      questionNumber: "Q3",
      orderIndex: 3,
      questionText: "Which best describes your current status?",
      questionType: "radio",
      options: [
        "Student",
        "Working professional",
        "Business / self-employed",
        "Homemaker",
        "Other",
      ],
    },
    {
      sectionId: sec["A"],
      questionNumber: "Q4",
      orderIndex: 4,
      questionText: "What is your marital status?",
      questionType: "radio",
      options: ["Single", "Married", "Other / Prefer not to say"],
    },
    {
      sectionId: sec["A"],
      questionNumber: "Q5",
      orderIndex: 5,
      questionText: "Do you have children?",
      questionType: "radio",
      options: [
        "No",
        "Yes - child under 5",
        "Yes - child 5-12",
        "Yes - child 13-18",
        "Yes - adult children",
      ],
    },
    {
      sectionId: sec["A"],
      questionNumber: "Q6",
      orderIndex: 6,
      questionText:
        "Who currently lives in your household? (Select all that apply)",
      questionType: "checkbox",
      options: [
        "Spouse / partner",
        "Children",
        "Parents / elderly family members",
        "Other family members",
        "I live alone",
      ],
    },
    {
      sectionId: sec["A"],
      questionNumber: "Q7",
      orderIndex: 7,
      questionText: "Where do you currently live?",
      questionType: "radio",
      researcherNote:
        "Researcher may additionally record city/locality separately if required.",
      options: [
        "Delhi NCR",
        "Other metro city",
        "Tier 2 city",
        "Tier 3 / smaller city",
        "Other",
      ],
    },

    // === Section B: Air Quality, Need & Current Behaviour ===
    {
      sectionId: sec["B"],
      questionNumber: "Q8",
      orderIndex: 8,
      questionText:
        "How concerned are you about indoor air quality and pollution inside your home?",
      questionType: "radio",
      options: [
        "Very concerned",
        "Somewhat concerned",
        "Neutral",
        "Not very concerned",
        "Not concerned at all",
      ],
    },
    {
      sectionId: sec["B"],
      questionNumber: "Q9",
      orderIndex: 9,
      questionText:
        "Do you currently own or regularly use an air purifier at home?",
      questionType: "radio",
      options: ["Yes", "No", "Used one previously"],
    },
        {
      sectionId: sec["B"],
      questionNumber: "Q10",
      orderIndex: 10,
      questionText:
        "Considering the current severity of air pollution, do you feel the need to own an air purifier in the near future?",
      questionType: "radio",
      options: ["Yes", "No", "Maybe"],
    },
{
      sectionId: sec["B"],
      questionNumber: "Q11",
      orderIndex: 11,
      questionText:
        "What would be the main reasons for you to consider an air purifier? (Select up to 3)",
      questionType: "checkbox",
      maxSelections: 3,
      hasOtherOption: true,
      options: [
        "High outdoor pollution / AQI",
        "Cleaner indoor air",
        "Children's health",
        "Elderly family members",
        "Dust / allergy concerns",
        "Smoke / odour",
        "General preventive health / wellness",
        "I do not see a need",
      ],
    },
    {
      sectionId: sec["B"],
      questionNumber: "Q12",
      orderIndex: 12,
      questionText:
        "If you would NOT consider buying an air purifier, what is the main reason?",
      questionType: "radio",
      hasOtherOption: true,
      conditionalLogic: JSON.stringify({
        type: "show_if",
        conditions: [
          {
            questionNumber: "Q11",
            operator: "includes_option",
            value: "I do not see a need",
          },
        ],
        fallback: "skip",
      }),
      researcherNote:
        "If respondent is clearly not interested, continue with profile/brand perception questions as useful; do not force purchase-intent answers.",
      options: [
        "Too expensive",
        "Do not think I need one",
        "Do not know enough about air purifiers",
        "Do not trust their effectiveness",
        "Filter / maintenance cost",
        "Already have one",
      ],
    },

    // === Section C: Purchase Decision & Price ===
    {
      sectionId: sec["C"],
      questionNumber: "Q13",
      orderIndex: 13,
      questionText:
        "Which THREE factors matter most when choosing an air purifier?",
      questionType: "checkbox",
      minSelections: 3,
      maxSelections: 3,
      options: [
        "Air-cleaning performance / CADR",
        "Price",
        "Filter quality / HEPA filtration",
        "Annual filter & maintenance cost",
        "Brand trust",
        "Low noise",
        "Design / appearance",
        "Room coverage",
        "Air-quality display / smart features",
        "Warranty & after-sales service",
      ],
    },
    {
      sectionId: sec["C"],
      questionNumber: "Q14",
      orderIndex: 14,
      questionText:
        "Before seeing any Kiyoki concept, what price would you personally consider reasonable for a good air purifier for your home?",
      questionType: "radio",
      options: [
        "Below ₹8,000",
        "₹8,000-9,999",
        "₹10,000-11,999",
        "₹12,000-14,999",
        "₹15,000-19,999",
        "₹20,000+",
      ],
    },
    {
      sectionId: sec["C"],
      questionNumber: "Q15",
      orderIndex: 15,
      questionText:
        "Where would you be most comfortable buying an air purifier?",
      questionType: "radio",
      hasOtherOption: true,
      options: [
        "Amazon",
        "Flipkart",
        "Brand website",
        "Electronics / retail store",
        "Through a trusted dealer",
      ],
    },
    {
      sectionId: sec["C"],
      questionNumber: "Q16",
      orderIndex: 16,
      questionText:
        "Which air-purifier brands, if any, would you naturally consider today?",
      questionType: "checkbox",
      hasOtherOption: true,
      options: [
        "Dyson",
        "Philips",
        "Xiaomi",
        "Qubo",
        "Coway",
        "Honeywell",
        "I don't know / no preference",
      ],
    },

    // === Section D: Blind Kiyoki Concept Test ===
    {
      sectionId: sec["D"],
      questionNumber: "Q17",
      orderIndex: 17,
      questionText:
        "Based only on the description above, how likely would you be to consider buying it at ₹11,999?",
      questionType: "radio",
      researcherNote:
        "Record purchase intent at Q16 before revealing Japanese technology, then compare it with Q23. This helps measure whether the Japanese-technology + India-pollution positioning actually increases consideration. Do not coach respondents toward a positive answer.",
      options: [
        "Definitely would consider",
        "Probably would consider",
        "Not sure",
        "Probably would not consider",
        "Definitely would not consider",
      ],
    },
    {
      sectionId: sec["D"],
      questionNumber: "Q18",
      orderIndex: 18,
      questionText: "What is your FIRST reaction to the ₹11,999 price?",
      questionType: "radio",
      options: [
        "Very good value",
        "Reasonable / acceptable",
        "Slightly expensive but I may consider it",
        "Too expensive",
        "Not sure without comparing performance and filter cost",
      ],
    },
    {
      sectionId: sec["D"],
      questionNumber: "Q19",
      orderIndex: 19,
      questionText:
        "What would you need to believe or verify before paying ₹11,999? (Select up to 3)",
      questionType: "checkbox",
      maxSelections: 3,
      hasOtherOption: true,
      options: [
        "Proven CADR / cleaning performance",
        "Effective for severe Indian pollution",
        "Filter life and replacement cost",
        "Independent testing / certification",
        "Warranty & after-sales support",
        "Low noise",
        "Low electricity consumption",
        "Trusted technology / engineering credentials",
        "Customer reviews",
      ],
    },

    // === Section E: Japanese Technology & Brand Positioning ===
    {
      sectionId: sec["E"],
      questionNumber: "Q20",
      orderIndex: 20,
      questionText:
        "After learning about the Japanese technology / design association, does your interest change?",
      questionType: "radio",
      options: [
        "Much more interested",
        "Somewhat more interested",
        "No change",
        "Somewhat less interested",
        "Much less interested",
      ],
    },
    {
      sectionId: sec["E"],
      questionNumber: "Q21",
      orderIndex: 21,
      questionText:
        "What does 'Japanese technology' communicate to you most strongly? (Select up to 2)",
      questionType: "checkbox",
      maxSelections: 2,
      options: [
        "Better quality",
        "Reliability / durability",
        "Advanced technology",
        "Premium design",
        "Better safety / precision",
        "Higher price",
        "It does not make a difference to me",
        "I would need proof of the Japanese association",
      ],
    },
    {
      sectionId: sec["E"],
      questionNumber: "Q22",
      orderIndex: 22,
      questionText:
        "Which positioning feels most relevant and credible to you?",
      questionType: "radio",
      options: [
        "Made for Indian pollution",
        "Japanese technology / design",
        "Strong performance at an accessible price",
        "Premium minimalist design",
        "A combination of Indian-market engineering + Japanese technology",
        "None of these",
      ],
    },
    {
      sectionId: sec["E"],
      questionNumber: "Q23",
      orderIndex: 23,
      questionText:
        "How important is proof of the Japanese technology/design association before it influences your purchase?",
      questionType: "radio",
      options: [
        "Essential - I would want clear evidence",
        "Important",
        "Nice to have",
        "Not important",
        "Japanese association does not affect my decision",
      ],
    },

    // === Section F: Final Kiyoki Purchase Test ===
    {
      sectionId: sec["F"],
      questionNumber: "Q24",
      orderIndex: 24,
      questionText:
        "Considering everything you have seen, how likely are you to buy / seriously consider Kiyoki at ₹11,999?",
      questionType: "radio",
      options: [
        "Definitely yes",
        "Probably yes",
        "Not sure",
        "Probably no",
        "Definitely no",
      ],
    },
    {
      sectionId: sec["F"],
      questionNumber: "Q25",
      orderIndex: 25,
      questionText:
        "Which ONE thing would most increase your confidence to buy Kiyoki?",
      questionType: "radio",
      hasOtherOption: true,
      options: [
        "Independent performance test results",
        "Clear Japanese technology/design partnership proof",
        "Lower filter replacement cost / longer filter life",
        "Strong warranty and service network",
        "Customer reviews / recommendations",
        "IIT / credible technical institution association, if officially validated and communicated",
        "Introductory offer / financing",
      ],
    },
    {
      sectionId: sec["F"],
      questionNumber: "Q26",
      orderIndex: 26,
      questionText:
        "In one sentence, what would make you choose Kiyoki over an established air-purifier brand?",
      questionType: "text",
      options: [],
    },
  ];

  for (const qData of questionsData) {
    const { options, ...qFields } = qData;

    const [insertedQuestion] = await db
      .insert(schema.questions)
      .values({
        sectionId: qFields.sectionId,
        questionNumber: qFields.questionNumber,
        questionText: qFields.questionText,
        questionType: qFields.questionType as "radio" | "checkbox" | "text",
        minSelections: qFields.minSelections || null,
        maxSelections: qFields.maxSelections || null,
        hasOtherOption: qFields.hasOtherOption || false,
        conditionalLogic: qFields.conditionalLogic || null,
        researcherNote: qFields.researcherNote || null,
        orderIndex: qFields.orderIndex,
        isActive: true,
        currentRevision: 1,
      })
      .returning();

    // Insert options
    if (options && options.length > 0) {
      await db.insert(schema.questionOptions).values(
        options.map((opt, i) => ({
          questionId: insertedQuestion.id,
          optionText: opt,
          orderIndex: i + 1,
          isActive: true,
        }))
      );
    }

    // Insert revision 1
    await db.insert(schema.questionRevisions).values({
      questionId: insertedQuestion.id,
      revisionNumber: 1,
      questionText: insertedQuestion.questionText,
      questionType: insertedQuestion.questionType,
      optionsSnapshot: JSON.stringify(options),
      changedBy: "system",
      changeReason: "Initial seed",
    });
  }

  console.log("Inserting admin user...");
  const password = process.env.ADMIN_INITIAL_PASSWORD || "admin123";
  const passwordHash = await hashPassword(password);

  await db.insert(schema.adminUsers).values({
    username: "admin",
    passwordHash: passwordHash,
    displayName: "Administrator",
  });

  console.log("\u2705 Database seeded successfully!");
  console.log("   Survey: KIYOKI Customer Research Questionnaire");
  console.log("   Sections: 6 (A-F)");
  console.log("   Questions: 25");
  console.log("   Admin user: admin");
  process.exit(0);
}

seed().catch((err) => {
  console.error("\u274c Database seed failed:", err);
  process.exit(1);
});
