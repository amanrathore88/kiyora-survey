export type Language = "en" | "hi";

export interface QuestionTranslation {
  questionText: string;
  options: Record<string, string>; // English option text -> Hindi option text
}

export interface SectionTranslation {
  title: string;
  conceptText?: string;
}

export const UI_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    surveyTitle: "KIYOKI",
    surveySubtitle: "Customer Research Questionnaire",
    studySubtitle: "India Air Purifier Concept & Price Validation",
    companyName: "Kiyoki Private Limited",
    welcomeHeading: "Welcome to Kiyoki Customer Research",
    welcomeDescription:
      "We are researching consumer attitudes toward indoor air quality, health, and air purification solutions tailored for India's high-pollution conditions.",
    welcomeIncentive:
      "Participants who successfully complete the full research session will receive a coupon worth ₹2,000 as a research participation reward.",
    welcomeDuration: "Takes approximately 5–7 minutes • One question at a time",
    selectLanguageLabel: "Select Your Preferred Language / अपनी भाषा चुनें:",
    langEnglish: "English",
    langHindi: "हिन्दी (Hindi)",
    startSurvey: "Start Survey",
    starting: "Starting...",
    back: "Back",
    next: "Next",
    saving: "Saving...",
    completeSurvey: "Complete Survey",
    loadingQuestion: "Loading question...",
    newSection: "New Section",
    pleaseReadCarefully: "Please Read Carefully",
    conceptContinue: "I have read this — Continue",
    questionProgress: "Question",
    of: "of",
    rewardBadge: "₹2,000 Reward",
    other: "Other",
    pleaseSpecify: "Please specify...",
    typeResponseHere: "Type your response here...",
    characters: "characters",
    errorSelectOption: "Please select an option.",
    errorProvideResponse: "Please provide a response.",
    selectExactly: "Please select exactly",
    selectAtLeast: "Please select at least",
    selectAllThatApply: "Select all that apply",
    selectUpTo: "Select up to",
    optionsWord: "options",
    thankYouTitle: "Thank You for Participating!",
    thankYouSubtitle: "Your valuable insights will help shape Kiyoki.",
    incentiveRewardBox:
      "As a research participation reward, you are eligible to receive a coupon worth ₹2,000.",
    contactFormHeading: "Claim Your Participation Reward",
    contactFormSubheading:
      "Please provide your contact details so our research coordinator can issue your ₹2,000 participation reward coupon.",
    fullNameLabel: "Full Name",
    namePlaceholder: "Enter your full name",
    contactLabel: "Mobile Number or Email Address",
    contactPlaceholder: "e.g., +91 98765 43210 or name@example.com",
    submitContact: "Submit & Claim Coupon",
    savingContact: "Submitting...",
    contactSuccessTitle: "Details Submitted Successfully!",
    contactSuccessMessage:
      "Thank you! Your participation coupon details have been recorded. Our research team will reach out shortly with your ₹2,000 reward coupon.",
    pauseSurvey: "Pause Survey",
    abandonSurvey: "Abandon Survey",
    pauseModalTitle: "Survey Paused",
    pauseModalDescription:
      "Your responses up to this point have been safely saved. You can take a break and resume whenever you're ready.",
    resumeLinkTitle: "Your Private Resume Link",
    resumeLinkHelp:
      "Bookmark or copy this link to resume your survey from this exact point on any device.",
    copyLink: "Copy Link",
    linkCopied: "Link Copied!",
    resumeSurvey: "Resume Survey",
    saveAndExit: "Save & Exit to Home",
    abandonModalTitle: "Abandon Survey?",
    abandonModalWarning:
      "Are you sure you want to abandon the survey? All remaining questions will be forfeited and you will NOT be eligible to receive the ₹2,000 research reward coupon.",
    cancel: "No, Continue Survey",
    confirmAbandon: "Yes, Abandon Survey",
    abandoning: "Abandoning...",
    abandonedTitle: "Survey Abandoned",
    abandonedMessage:
      "You have exited the Kiyoki customer research survey. Your session has been marked as abandoned.",
    returnHome: "Return to Home",
    sessionResumedToast: "Resumed survey from Question",
    invalidSessionTitle: "Session Unavailable",
    invalidSessionMessage:
      "This survey session is either expired, already completed, or was previously abandoned.",
    startNewSurvey: "Start a New Survey",
    needBreakPrompt: "Need a break?",
    orPrompt: "or",
    skip: "Skip",
    skipQuestion: "Skip Question",
    skipping: "Skipping...",
    skipThisQuestion: "Skip this question",
    skipQuestionTooltip: "Skip this question and proceed to next",
  },
  hi: {
    surveyTitle: "कियोकी (KIYOKI)",
    surveySubtitle: "उपभोक्ता अनुसंधान प्रश्नावली",
    studySubtitle: "भारत एयर प्यूरीफायर अवधारणा एवं मूल्य सत्यापन",
    companyName: "कियोकी प्राइवेट लिमिटेड (Kiyoki Private Limited)",
    welcomeHeading: "कियोकी उपभोक्ता अनुसंधान में आपका स्वागत है",
    welcomeDescription:
      "हम भारत की उच्च प्रदूषण स्थितियों के अनुकूल इनडोर वायु गुणवत्ता, स्वास्थ्य और एयर प्यूरीफायर समाधानों के प्रति उपभोक्ता प्राथमिकताओं पर शोध कर रहे हैं।",
    welcomeIncentive:
      "पूरा अनुसंधान सर्वेक्षण सफलतापूर्वक पूरा करने वाले प्रतिभागियों को शोध भागीदारी पुरस्कार के रूप में ₹2,000 का कूपन प्रदान किया जाएगा।",
    welcomeDuration: "लगभग 5–7 मिनट का समय • एक बार में एक प्रश्न",
    selectLanguageLabel: "Select Your Preferred Language / अपनी भाषा चुनें:",
    langEnglish: "English",
    langHindi: "हिन्दी (Hindi)",
    startSurvey: "सर्वेक्षण शुरू करें",
    starting: "प्रारंभ हो रहा है...",
    back: "पीछे",
    next: "आगे बढ़ें",
    saving: "सहेजा जा रहा है...",
    completeSurvey: "सर्वेक्षण पूरा करें",
    loadingQuestion: "प्रश्न लोड हो रहा है...",
    newSection: "नया अनुभाग",
    pleaseReadCarefully: "कृपया ध्यानपूर्वक पढ़ें",
    conceptContinue: "मैंने इसे पढ़ लिया है — आगे बढ़ें",
    questionProgress: "प्रश्न",
    of: "का",
    rewardBadge: "₹2,000 पुरस्कार",
    other: "अन्य",
    pleaseSpecify: "कृपया विवरण दें...",
    typeResponseHere: "अपना उत्तर यहाँ लिखें...",
    characters: "अक्षर",
    errorSelectOption: "कृपया एक विकल्प चुनें।",
    errorProvideResponse: "कृपया अपना उत्तर दर्ज करें।",
    selectExactly: "कृपया ठीक",
    selectAtLeast: "कृपया कम से कम",
    selectAllThatApply: "लागू होने वाले सभी विकल्प चुनें",
    selectUpTo: "अधिकतम विकल्प चुनें:",
    optionsWord: "विकल्प",
    thankYouTitle: "भाग लेने के लिए धन्यवाद!",
    thankYouSubtitle: "आपके महत्वपूर्ण विचार कियोकी को बेहतर बनाने में मदद करेंगे।",
    incentiveRewardBox:
      "शोध भागीदारी पुरस्कार के रूप में, आप ₹2,000 मूल्य का कूपन प्राप्त करने के पात्र हैं।",
    contactFormHeading: "अपना भागीदारी पुरस्कार प्राप्त करें",
    contactFormSubheading:
      "कृपया अपना संपर्क विवरण प्रदान करें ताकि हमारे अनुसंधान समन्वयक आपका ₹2,000 भागीदारी पुरस्कार कूपन जारी कर सकें।",
    fullNameLabel: "पूरा नाम",
    namePlaceholder: "अपना पूरा नाम दर्ज करें",
    contactLabel: "मोबाइल नंबर या ईमेल पता",
    contactPlaceholder: "जैसे, +91 98765 43210 या name@example.com",
    submitContact: "जमा करें और कूपन प्राप्त करें",
    savingContact: "जमा किया जा रहा है...",
    contactSuccessTitle: "विवरण सफलतापूर्वक जमा हुआ!",
    contactSuccessMessage:
      "धन्यवाद! आपका संपर्क विवरण दर्ज कर लिया गया है। हमारी शोध टीम जल्द ही आपके ₹2,000 के पुरस्कार कूपन के साथ संपर्क करेगी।",
    pauseSurvey: "सर्वेक्षण रोकें",
    abandonSurvey: "सर्वेक्षण छोड़ें",
    pauseModalTitle: "सर्वेक्षण रोका गया",
    pauseModalDescription:
      "आपके अब तक के उत्तर सुरक्षित रूप से सहेज लिए गए हैं। आप विराम ले सकते हैं और जब चाहें तब जारी रख सकते हैं।",
    resumeLinkTitle: "आपका निजी सर्वेक्षण लिंक",
    resumeLinkHelp:
      "सर्वेक्षण को इसी बिंदु से किसी भी डिवाइस पर पुनः शुरू करने के लिए इस लिंक को कॉपी या बुकमार्क करें।",
    copyLink: "लिंक कॉपी करें",
    linkCopied: "लिंक कॉपी हो गया!",
    resumeSurvey: "सर्वेक्षण जारी रखें",
    saveAndExit: "सहेजें और होम पर जाएं",
    abandonModalTitle: "क्या आप सर्वेक्षण छोड़ना चाहते हैं?",
    abandonModalWarning:
      "क्या आप निश्चित रूप से सर्वेक्षण छोड़ना चाहते हैं? शेष प्रश्न छूट जाएंगे और आप ₹2,000 के शोध भागीदारी कूपन के पात्र नहीं होंगे।",
    cancel: "नहीं, सर्वेक्षण जारी रखें",
    confirmAbandon: "हाँ, सर्वेक्षण छोड़ें",
    abandoning: "छोड़ा जा रहा है...",
    abandonedTitle: "सर्वेक्षण छोड़ दिया गया",
    abandonedMessage:
      "आपने कियोकी उपभोक्ता अनुसंधान सर्वेक्षण छोड़ दिया है। आपका सत्र समाप्त हो चुका है।",
    returnHome: "होम पेज पर लौटें",
    sessionResumedToast: "प्रश्न से सर्वेक्षण पुनः शुरू हुआ",
    invalidSessionTitle: "सत्र अनुपलब्ध",
    invalidSessionMessage:
      "यह सर्वेक्षण सत्र या तो समाप्त हो चुका है, पहले ही पूरा हो चुका है, या छोड़ दिया गया है।",
    startNewSurvey: "नया सर्वेक्षण शुरू करें",
    needBreakPrompt: "विराम की आवश्यकता है?",
    orPrompt: "या",
    skip: "छोड़ें",
    skipQuestion: "प्रश्न छोड़ें",
    skipping: "छोड़ा जा रहा है...",
    skipThisQuestion: "यह प्रश्न छोड़ें",
    skipQuestionTooltip: "यह प्रश्न छोड़कर आगे बढ़ें",
  },
};

export const SECTIONS_TRANSLATIONS: Record<string, Record<Language, SectionTranslation>> = {
  A: {
    en: { title: "Respondent Profile" },
    hi: { title: "उत्तरदाता प्रोफ़ाइल" },
  },
  B: {
    en: { title: "Air Quality, Need & Current Behaviour" },
    hi: { title: "वायु गुणवत्ता, आवश्यकता और वर्तमान व्यवहार" },
  },
  C: {
    en: { title: "Purchase Decision & Price" },
    hi: { title: "खरीद निर्णय और मूल्य" },
  },
  D: {
    en: {
      title: "Blind Kiyoki Concept Test",
      conceptText:
        'CONCEPT 1: "A premium air purifier designed specifically for India\'s high-pollution conditions, with strong air-cleaning performance, HEPA filtration, UV treatment and a premium minimalist design. Expected price: ₹11,999."',
    },
    hi: {
      title: "ब्लाइंड कियोकी अवधारणा परीक्षण",
      conceptText:
        'अवधारणा 1: "एक प्रीमियम एयर प्यूरीफायर जिसे विशेष रूप से भारत की अत्यधिक प्रदूषण स्थितियों के लिए डिज़ाइन किया गया है, जिसमें शक्तिशाली वायु-सफाई प्रदर्शन, हेपा (HEPA) निस्पंदन, यूवी (UV) उपचार और एक प्रीमियम न्यूनतम (मिनिमलिस्ट) डिज़ाइन शामिल है। अनुमानित कीमत: ₹11,999।"',
    },
  },
  E: {
    en: {
      title: "Japanese Technology & Brand Positioning",
      conceptText:
        'CONCEPT 2: "Kiyoki is being developed for Indian pollution conditions and incorporates Japanese technology / design thinking, while targeting a price of approximately ₹11,999."',
    },
    hi: {
      title: "जापानी तकनीक और ब्रांड स्थिति",
      conceptText:
        'अवधारणा 2: "कियोकी को भारतीय प्रदूषण स्थितियों के लिए विकसित किया जा रहा है और इसमें जापानी तकनीक / डिज़ाइन सोच शामिल है, जबकि इसकी लक्षित कीमत लगभग ₹11,999 है।"',
    },
  },
  F: {
    en: {
      title: "Final Kiyoki Purchase Test",
      conceptText:
        'FINAL PROPOSITION: "KIYOKI — an air purifier built for India\'s pollution conditions, incorporating Japanese technology/design thinking, strong CADR, HEPA filtration and UV treatment, with premium design at approximately ₹11,999."',
    },
    hi: {
      title: "अंतिम कियोकी खरीद परीक्षण",
      conceptText:
        'अंतिम प्रस्ताव: "कियोकी (KIYOKI) — भारत की प्रदूषण स्थितियों के लिए निर्मित एक एयर प्यूरीफायर, जिसमें जापानी तकनीक / डिज़ाइन सोच, शक्तिशाली सीएडीआर (CADR), हेपा निस्पंदन और यूवी उपचार के साथ लगभग ₹11,999 में प्रीमियम डिज़ाइन शामिल है।"',
    },
  },
};

export const QUESTIONS_TRANSLATIONS: Record<string, Record<Language, QuestionTranslation>> = {
  Q1: {
    en: {
      questionText: "Age group",
      options: {
        "18-24": "18-24",
        "25-34": "25-34",
        "35-44": "35-44",
        "45-54": "45-54",
        "55+": "55+",
      },
    },
    hi: {
      questionText: "आयु वर्ग",
      options: {
        "18-24": "18-24 वर्ष",
        "25-34": "25-34 वर्ष",
        "35-44": "35-44 वर्ष",
        "45-54": "45-54 वर्ष",
        "55+": "55 वर्ष से अधिक",
      },
    },
  },
  Q2: {
    en: {
      questionText: "Gender",
      options: {
        Male: "Male",
        Female: "Female",
        "Prefer not to say / Other": "Prefer not to say / Other",
      },
    },
    hi: {
      questionText: "लिंग (जेंडर)",
      options: {
        Male: "पुरुष (Male)",
        Female: "महिला (Female)",
        "Prefer not to say / Other": "बताना नहीं चाहते / अन्य",
      },
    },
  },
  Q3: {
    en: {
      questionText: "Which best describes your current status?",
      options: {
        Student: "Student",
        "Working professional": "Working professional",
        "Business / self-employed": "Business / self-employed",
        Homemaker: "Homemaker",
        Other: "Other",
      },
    },
    hi: {
      questionText: "आपकी वर्तमान स्थिति का सबसे अच्छा वर्णन कौन सा विकल्प करता है?",
      options: {
        Student: "छात्र / विद्यार्थी (Student)",
        "Working professional": "नौकरीपेशा / कामकाजी पेशेवर (Working professional)",
        "Business / self-employed": "व्यवसाय / स्वरोज़गार (Business / self-employed)",
        Homemaker: "गृहिणी / गृहस्वामी (Homemaker)",
        Other: "अन्य",
      },
    },
  },
  Q4: {
    en: {
      questionText: "What is your marital status?",
      options: {
        Single: "Single",
        Married: "Married",
        "Other / Prefer not to say": "Other / Prefer not to say",
      },
    },
    hi: {
      questionText: "आपकी वैवाहिक स्थिति क्या है?",
      options: {
        Single: "अविवाहित (Single)",
        Married: "विवाहित (Married)",
        "Other / Prefer not to say": "अन्य / बताना नहीं चाहते",
      },
    },
  },
  Q5: {
    en: {
      questionText: "Do you have children?",
      options: {
        No: "No",
        "Yes - child under 5": "Yes - child under 5",
        "Yes - child 5-12": "Yes - child 5-12",
        "Yes - child 13-18": "Yes - child 13-18",
        "Yes - adult children": "Yes - adult children",
      },
    },
    hi: {
      questionText: "क्या आपके बच्चे हैं?",
      options: {
        No: "नहीं",
        "Yes - child under 5": "हाँ - 5 वर्ष से कम आयु का बच्चा",
        "Yes - child 5-12": "हाँ - 5 से 12 वर्ष का बच्चा",
        "Yes - child 13-18": "हाँ - 13 से 18 वर्ष का बच्चा",
        "Yes - adult children": "हाँ - वयस्क बच्चे",
      },
    },
  },
  Q6: {
    en: {
      questionText: "Who currently lives in your household? (Select all that apply)",
      options: {
        "Spouse / partner": "Spouse / partner",
        Children: "Children",
        "Parents / elderly family members": "Parents / elderly family members",
        "Other family members": "Other family members",
        "I live alone": "I live alone",
      },
    },
    hi: {
      questionText: "वर्तमान में आपके घर में कौन-कौन रहता है? (लागू होने वाले सभी विकल्प चुनें)",
      options: {
        "Spouse / partner": "पति / पत्नी / साथी",
        Children: "बच्चे",
        "Parents / elderly family members": "माता-पिता / बुजुर्ग परिवार के सदस्य",
        "Other family members": "परिवार के अन्य सदस्य",
        "I live alone": "मैं अकेला/अकेली रहता/रहती हूँ",
      },
    },
  },
  Q7: {
    en: {
      questionText: "Where do you currently live?",
      options: {
        "Delhi NCR": "Delhi NCR",
        "Other metro city": "Other metro city",
        "Tier 2 city": "Tier 2 city",
        "Tier 3 / smaller city": "Tier 3 / smaller city",
        Other: "Other",
      },
    },
    hi: {
      questionText: "आप वर्तमान में कहाँ रहते हैं?",
      options: {
        "Delhi NCR": "दिल्ली एनसीआर (Delhi NCR)",
        "Other metro city": "अन्य मेट्रो शहर (मुंबई, बेंगलुरु, आदि)",
        "Tier 2 city": "टियर 2 शहर",
        "Tier 3 / smaller city": "टियर 3 / छोटा शहर",
        Other: "अन्य",
      },
    },
  },
  Q8: {
    en: {
      questionText: "How concerned are you about indoor air quality and pollution inside your home?",
      options: {
        "Very concerned": "Very concerned",
        "Somewhat concerned": "Somewhat concerned",
        Neutral: "Neutral",
        "Not very concerned": "Not very concerned",
        "Not concerned at all": "Not concerned at all",
      },
    },
    hi: {
      questionText: "आप अपने घर के अंदर की वायु गुणवत्ता और प्रदूषण को लेकर कितने चिंतित हैं?",
      options: {
        "Very concerned": "बहुत अधिक चिंतित",
        "Somewhat concerned": "कुछ हद तक चिंतित",
        Neutral: "तटस्थ / सामान्य",
        "Not very concerned": "ज़्यादा चिंतित नहीं",
        "Not concerned at all": "बिल्कुल भी चिंतित नहीं",
      },
    },
  },
  Q9: {
    en: {
      questionText: "Do you currently own or regularly use an air purifier at home?",
      options: {
        Yes: "Yes",
        No: "No",
        "Used one previously": "Used one previously",
      },
    },
    hi: {
      questionText: "क्या आपके पास वर्तमान में घर पर एयर प्यूरीफायर है या आप नियमित रूप से इसका उपयोग करते हैं?",
      options: {
        Yes: "हाँ",
        No: "नहीं",
        "Used one previously": "पहले इस्तेमाल किया था",
      },
    },
  },
  Q10: {
    en: {
      questionText: "What would be the main reasons for you to consider an air purifier? (Select up to 3)",
      options: {
        "High outdoor pollution / AQI": "High outdoor pollution / AQI",
        "Cleaner indoor air": "Cleaner indoor air",
        "Children's health": "Children's health",
        "Elderly family members": "Elderly family members",
        "Dust / allergy concerns": "Dust / allergy concerns",
        "Smoke / odour": "Smoke / odour",
        "General preventive health / wellness": "General preventive health / wellness",
        "I do not see a need": "I do not see a need",
      },
    },
    hi: {
      questionText: "एयर प्यूरीफायर खरीदने पर विचार करने के आपके मुख्य कारण क्या होंगे? (अधिकतम 3 चुनें)",
      options: {
        "High outdoor pollution / AQI": "बाहरी उच्च प्रदूषण / गंभीर एक्यूआई (AQI)",
        "Cleaner indoor air": "घर के अंदर स्वच्छ हवा",
        "Children's health": "बच्चों का स्वास्थ्य",
        "Elderly family members": "बुजुर्ग परिवार के सदस्य",
        "Dust / allergy concerns": "धूल / एलर्जी की चिंता",
        "Smoke / odour": "धुआँ / गंध से छुटकारा",
        "General preventive health / wellness": "सामान्य निवारक स्वास्थ्य और तंदुरुस्ती",
        "I do not see a need": "मुझे इसकी आवश्यकता नहीं लगती",
      },
    },
  },
  Q11: {
    en: {
      questionText: "If you would NOT consider buying an air purifier, what is the main reason?",
      options: {
        "Too expensive": "Too expensive",
        "Do not think I need one": "Do not think I need one",
        "Do not know enough about air purifiers": "Do not know enough about air purifiers",
        "Do not trust their effectiveness": "Do not trust their effectiveness",
        "Filter / maintenance cost": "Filter / maintenance cost",
        "Already have one": "Already have one",
      },
    },
    hi: {
      questionText: "यदि आप एयर प्यूरीफायर खरीदने पर विचार नहीं करेंगे, तो इसका मुख्य कारण क्या है?",
      options: {
        "Too expensive": "बहुत महंगा है",
        "Do not think I need one": "मुझे नहीं लगता कि मुझे इसकी आवश्यकता है",
        "Do not know enough about air purifiers": "एयर प्यूरीफायर के बारे में पर्याप्त जानकारी नहीं है",
        "Do not trust their effectiveness": "उनकी प्रभावशीलता पर भरोसा नहीं है",
        "Filter / maintenance cost": "फिल्टर और रखरखाव की लागत अधिक है",
        "Already have one": "पहले से ही एक मौजूद है",
      },
    },
  },
  Q12: {
    en: {
      questionText: "Which THREE factors matter most when choosing an air purifier?",
      options: {
        "Air-cleaning performance / CADR": "Air-cleaning performance / CADR",
        Price: "Price",
        "Filter quality / HEPA filtration": "Filter quality / HEPA filtration",
        "Annual filter & maintenance cost": "Annual filter & maintenance cost",
        "Brand trust": "Brand trust",
        "Low noise": "Low noise",
        "Design / appearance": "Design / appearance",
        "Room coverage": "Room coverage",
        "Air-quality display / smart features": "Air-quality display / smart features",
        "Warranty & after-sales service": "Warranty & after-sales service",
      },
    },
    hi: {
      questionText: "एयर प्यूरीफायर चुनते समय कौन से तीन कारक सबसे अधिक महत्वपूर्ण हैं? (ठीक 3 चुनें)",
      options: {
        "Air-cleaning performance / CADR": "वायु सफाई प्रदर्शन / सीएडीआर (CADR)",
        Price: "कीमत",
        "Filter quality / HEPA filtration": "फ़िल्टर गुणवत्ता / हेपा (HEPA) फ़िल्टर",
        "Annual filter & maintenance cost": "वार्षिक फ़िल्टर और रखरखाव लागत",
        "Brand trust": "ब्रांड पर भरोसा",
        "Low noise": "शांत संचालन / कम शोर",
        "Design / appearance": "डिज़ाइन / रूप-रंग",
        "Room coverage": "कमरे का कवरेज क्षेत्र",
        "Air-quality display / smart features": "वायु गुणवत्ता डिस्प्ले / स्मार्ट फीचर्स",
        "Warranty & after-sales service": "वारंटी और बिक्री के बाद सेवा",
      },
    },
  },
  Q13: {
    en: {
      questionText: "Before seeing any Kiyoki concept, what price would you personally consider reasonable for a good air purifier for your home?",
      options: {
        "Below ₹8,000": "Below ₹8,000",
        "₹8,000-9,999": "₹8,000-9,999",
        "₹10,000-11,999": "₹10,000-11,999",
        "₹12,000-14,999": "₹12,000-14,999",
        "₹15,000-19,999": "₹15,000-19,999",
        "₹20,000+": "₹20,000+",
      },
    },
    hi: {
      questionText: "कियोकी अवधारणा को देखने से पहले, अपने घर के लिए एक अच्छे एयर प्यूरीफायर के लिए आप व्यक्तिगत रूप से कौन सी कीमत उचित मानेंगे?",
      options: {
        "Below ₹8,000": "₹8,000 से कम",
        "₹8,000-9,999": "₹8,000 - ₹9,999",
        "₹10,000-11,999": "₹10,000 - ₹11,999",
        "₹12,000-14,999": "₹12,000 - ₹14,999",
        "₹15,000-19,999": "₹15,000 - ₹19,999",
        "₹20,000+": "₹20,000 से अधिक",
      },
    },
  },
  Q14: {
    en: {
      questionText: "Where would you be most comfortable buying an air purifier?",
      options: {
        Amazon: "Amazon",
        Flipkart: "Flipkart",
        "Brand website": "Brand website",
        "Electronics / retail store": "Electronics / retail store",
        "Through a trusted dealer": "Through a trusted dealer",
      },
    },
    hi: {
      questionText: "आप एयर प्यूरीफायर खरीदना कहाँ सबसे सुविधाजनक मानेंगे?",
      options: {
        Amazon: "अमेज़न (Amazon)",
        Flipkart: "फ्लिपकार्ट (Flipkart)",
        "Brand website": "ब्रांड की आधिकारिक वेबसाइट",
        "Electronics / retail store": "इलेक्ट्रॉनिक्स / रिटेल स्टोर (क्रोमा, रिलायंस आदि)",
        "Through a trusted dealer": "एक विश्वसनीय डीलर के माध्यम से",
      },
    },
  },
  Q15: {
    en: {
      questionText: "Which air-purifier brands, if any, would you naturally consider today?",
      options: {
        Dyson: "Dyson",
        Philips: "Philips",
        Xiaomi: "Xiaomi",
        Qubo: "Qubo",
        Coway: "Coway",
        Honeywell: "Honeywell",
        "I don't know / no preference": "I don't know / no preference",
      },
    },
    hi: {
      questionText: "आज आप स्वाभाविक रूप से किन एयर प्यूरीफायर ब्रांड्स पर विचार करेंगे?",
      options: {
        Dyson: "डायसन (Dyson)",
        Philips: "फिलिप्स (Philips)",
        Xiaomi: "शाओमी (Xiaomi)",
        Qubo: "क्यूबों (Qubo)",
        Coway: "कोवे (Coway)",
        Honeywell: "हनीवेल (Honeywell)",
        "I don't know / no preference": "मुझे नहीं पता / कोई विशेष प्राथमिकता नहीं",
      },
    },
  },
  Q16: {
    en: {
      questionText: "Based only on the description above, how likely would you be to consider buying it at ₹11,999?",
      options: {
        "Definitely would consider": "Definitely would consider",
        "Probably would consider": "Probably would consider",
        "Not sure": "Not sure",
        "Probably would not consider": "Probably would not consider",
        "Definitely would not consider": "Definitely would not consider",
      },
    },
    hi: {
      questionText: "केवल ऊपर दिए गए विवरण के आधार पर, क्या आप ₹11,999 पर इसे खरीदने पर विचार करेंगे?",
      options: {
        "Definitely would consider": "निश्चित रूप से विचार करेंगे",
        "Probably would consider": "संभवतः विचार करेंगे",
        "Not sure": "निश्चित नहीं कह सकते",
        "Probably would not consider": "संभवतः विचार नहीं करेंगे",
        "Definitely would not consider": "बिल्कुल भी विचार नहीं करेंगे",
      },
    },
  },
  Q17: {
    en: {
      questionText: "What is your FIRST reaction to the ₹11,999 price?",
      options: {
        "Very good value": "Very good value",
        "Reasonable / acceptable": "Reasonable / acceptable",
        "Slightly expensive but I may consider it": "Slightly expensive but I may consider it",
        "Too expensive": "Too expensive",
        "Not sure without comparing performance and filter cost": "Not sure without comparing performance and filter cost",
      },
    },
    hi: {
      questionText: "₹11,999 की कीमत पर आपकी पहली प्रतिक्रिया क्या है?",
      options: {
        "Very good value": "बहुत ही अच्छा मूल्य (पैसा वसूल)",
        "Reasonable / acceptable": "उचित / स्वीकार्य",
        "Slightly expensive but I may consider it": "थोड़ा महंगा है लेकिन मैं इस पर विचार कर सकता/सकती हूँ",
        "Too expensive": "बहुत अधिक महंगा है",
        "Not sure without comparing performance and filter cost": "प्रदर्शन और फ़िल्टर लागत की तुलना किए बिना निश्चित नहीं",
      },
    },
  },
  Q18: {
    en: {
      questionText: "What would you need to believe or verify before paying ₹11,999? (Select up to 3)",
      options: {
        "Proven CADR / cleaning performance": "Proven CADR / cleaning performance",
        "Effective for severe Indian pollution": "Effective for severe Indian pollution",
        "Filter life and replacement cost": "Filter life and replacement cost",
        "Independent testing / certification": "Independent testing / certification",
        "Warranty & after-sales support": "Warranty & after-sales support",
        "Low noise": "Low noise",
        "Low electricity consumption": "Low electricity consumption",
        "Trusted technology / engineering credentials": "Trusted technology / engineering credentials",
        "Customer reviews": "Customer reviews",
      },
    },
    hi: {
      questionText: "₹11,999 का भुगतान करने से पहले आपको क्या सत्यापित करने या विश्वास करने की आवश्यकता होगी? (अधिकतम 3 चुनें)",
      options: {
        "Proven CADR / cleaning performance": "प्रमाणित सीएडीआर (CADR) / वायु सफाई क्षमता",
        "Effective for severe Indian pollution": "गंभीर भारतीय प्रदूषण के लिए प्रभावी होना",
        "Filter life and replacement cost": "फ़िल्टर जीवन और नया फ़िल्टर बदलने का खर्च",
        "Independent testing / certification": "स्वतंत्र प्रयोगशाला परीक्षण / प्रमाणन",
        "Warranty & after-sales support": "वारंटी और बिक्री के बाद सेवा समर्थन",
        "Low noise": "कम शोर (शांत संचालन)",
        "Low electricity consumption": "कम बिजली की खपत",
        "Trusted technology / engineering credentials": "विश्वसनीय तकनीक / इंजीनियरिंग साख",
        "Customer reviews": "ग्राहकों की समीक्षाएं और रेटिंग",
      },
    },
  },
  Q19: {
    en: {
      questionText: "After learning about the Japanese technology / design association, does your interest change?",
      options: {
        "Much more interested": "Much more interested",
        "Somewhat more interested": "Somewhat more interested",
        "No change": "No change",
        "Somewhat less interested": "Somewhat less interested",
        "Much less interested": "Much less interested",
      },
    },
    hi: {
      questionText: "जापानी तकनीक / डिज़ाइन के जुड़ाव के बारे में जानने के बाद, क्या आपकी रुचि में कोई बदलाव आता है?",
      options: {
        "Much more interested": "रुचि बहुत अधिक बढ़ गई",
        "Somewhat more interested": "रुचि कुछ हद तक बढ़ गई",
        "No change": "कोई बदलाव नहीं (समान रुचि)",
        "Somewhat less interested": "रुचि थोड़ी कम हो गई",
        "Much less interested": "रुचि बहुत कम हो गई",
      },
    },
  },
  Q20: {
    en: {
      questionText: "What does 'Japanese technology' communicate to you most strongly? (Select up to 2)",
      options: {
        "Better quality": "Better quality",
        "Reliability / durability": "Reliability / durability",
        "Advanced technology": "Advanced technology",
        "Premium design": "Premium design",
        "Better safety / precision": "Better safety / precision",
        "Higher price": "Higher price",
        "It does not make a difference to me": "It does not make a difference to me",
        "I would need proof of the Japanese association": "I would need proof of the Japanese association",
      },
    },
    hi: {
      questionText: "'जापानी तकनीक' आपके लिए सबसे मजबूती से क्या दर्शाती है? (अधिकतम 2 चुनें)",
      options: {
        "Better quality": "बेहतर गुणवत्ता (Quality)",
        "Reliability / durability": "विश्वसनीयता / टिकाऊपन (Durability)",
        "Advanced technology": "उन्नत एवं आधुनिक तकनीक (Advanced technology)",
        "Premium design": "प्रीमियम एवं सुंदर डिज़ाइन",
        "Better safety / precision": "बेहतर सुरक्षा और सटीकता (Precision)",
        "Higher price": "अधिक कीमत",
        "It does not make a difference to me": "इससे मुझे कोई फ़र्क नहीं पड़ता",
        "I would need proof of the Japanese association": "मुझे जापानी जुड़ाव के प्रमाण की आवश्यकता होगी",
      },
    },
  },
  Q21: {
    en: {
      questionText: "Which positioning feels most relevant and credible to you?",
      options: {
        "Made for Indian pollution": "Made for Indian pollution",
        "Japanese technology / design": "Japanese technology / design",
        "Strong performance at an accessible price": "Strong performance at an accessible price",
        "Premium minimalist design": "Premium minimalist design",
        "A combination of Indian-market engineering + Japanese technology": "A combination of Indian-market engineering + Japanese technology",
        "None of these": "None of these",
      },
    },
    hi: {
      questionText: "कौन सी ब्रांड स्थिति आपको सबसे प्रासंगिक और विश्वसनीय लगती है?",
      options: {
        "Made for Indian pollution": "भारतीय प्रदूषण के लिए विशेष निर्मित",
        "Japanese technology / design": "जापानी तकनीक / डिज़ाइन",
        "Strong performance at an accessible price": "सुलभ कीमत पर दमदार प्रदर्शन",
        "Premium minimalist design": "प्रीमियम न्यूनतम (मिनिमलिस्ट) डिज़ाइन",
        "A combination of Indian-market engineering + Japanese technology": "भारतीय बाज़ार इंजीनियरिंग + जापानी तकनीक का संयोजन",
        "None of these": "इनमें से कोई नहीं",
      },
    },
  },
  Q22: {
    en: {
      questionText: "How important is proof of the Japanese technology/design association before it influences your purchase?",
      options: {
        "Essential - I would want clear evidence": "Essential - I would want clear evidence",
        Important: "Important",
        "Nice to have": "Nice to have",
        "Not important": "Not important",
        "Japanese association does not affect my decision": "Japanese association does not affect my decision",
      },
    },
    hi: {
      questionText: "आपकी खरीद को प्रभावित करने से पहले जापानी तकनीक / डिज़ाइन जुड़ाव का प्रमाण कितना महत्वपूर्ण है?",
      options: {
        "Essential - I would want clear evidence": "अनिवार्य - मुझे स्पष्ट प्रमाण चाहिए",
        Important: "महत्वपूर्ण",
        "Nice to have": "हो तो अच्छा है (ज़रूरी नहीं)",
        "Not important": "महत्वपूर्ण नहीं",
        "Japanese association does not affect my decision": "जापानी जुड़ाव मेरे निर्णय को प्रभावित नहीं करता",
      },
    },
  },
  Q23: {
    en: {
      questionText: "Considering everything you have seen, how likely are you to buy / seriously consider Kiyoki at ₹11,999?",
      options: {
        "Definitely yes": "Definitely yes",
        "Probably yes": "Probably yes",
        "Not sure": "Not sure",
        "Probably no": "Probably no",
        "Definitely no": "Definitely no",
      },
    },
    hi: {
      questionText: "सब कुछ देखने के बाद, क्या आप ₹11,999 में कियोकी (Kiyoki) खरीदने / गंभीरता से विचार करने की संभावना रखते हैं?",
      options: {
        "Definitely yes": "निश्चित रूप से हाँ",
        "Probably yes": "संभवतः हाँ",
        "Not sure": "निश्चित नहीं",
        "Probably no": "संभवतः नहीं",
        "Definitely no": "निश्चित रूप से नहीं",
      },
    },
  },
  Q24: {
    en: {
      questionText: "Which ONE thing would most increase your confidence to buy Kiyoki?",
      options: {
        "Independent performance test results": "Independent performance test results",
        "Clear Japanese technology/design partnership proof": "Clear Japanese technology/design partnership proof",
        "Lower filter replacement cost / longer filter life": "Lower filter replacement cost / longer filter life",
        "Strong warranty and service network": "Strong warranty and service network",
        "Customer reviews / recommendations": "Customer reviews / recommendations",
        "IIT / credible technical institution association, if officially validated and communicated": "IIT / credible technical institution association, if officially validated and communicated",
        "Introductory offer / financing": "Introductory offer / financing",
      },
    },
    hi: {
      questionText: "कियोकी खरीदने के आपके विश्वास को सबसे ज़्यादा कौन सी एक चीज़ बढ़ाएगी?",
      options: {
        "Independent performance test results": "स्वतंत्र प्रयोगशाला के प्रदर्शन परीक्षण परिणाम",
        "Clear Japanese technology/design partnership proof": "स्पष्ट जापानी तकनीक / डिज़ाइन साझेदारी का प्रमाण",
        "Lower filter replacement cost / longer filter life": "कम फ़िल्टर बदलने की लागत / फ़िल्टर का लंबा जीवन",
        "Strong warranty and service network": "मजबूत वारंटी और सर्विस नेटवर्क",
        "Customer reviews / recommendations": "ग्राहकों की समीक्षाएं / सिफारिशें",
        "IIT / credible technical institution association, if officially validated and communicated": "आईआईटी (IIT) या विश्वसनीय तकनीकी संस्थान का जुड़ाव (यदि आधिकारिक रूप से मान्य हो)",
        "Introductory offer / financing": "प्रारंभिक छूट प्रस्ताव / आसान ईएमआई (फाइनेंसिंग)",
      },
    },
  },
  Q25: {
    en: {
      questionText: "In one sentence, what would make you choose Kiyoki over an established air-purifier brand?",
      options: {},
    },
    hi: {
      questionText: "एक वाक्य में बताएं, स्थापित एयर प्यूरीफायर ब्रांड्स की तुलना में आप कियोकी (Kiyoki) को क्यों चुनेंगे?",
      options: {},
    },
  },
};

/**
 * Returns translated question text and option texts for a given question and language.
 */
export function getTranslatedQuestion(
  questionNumber: string,
  lang: Language,
  defaultQuestionText: string,
  options: { id: number; optionText: string; orderIndex: number }[]
): { questionText: string; options: { id: number; optionText: string; orderIndex: number }[] } {
  if (lang === "en") {
    return { questionText: defaultQuestionText, options };
  }

  const qTrans = QUESTIONS_TRANSLATIONS[questionNumber]?.[lang];
  const translatedQuestionText = qTrans?.questionText || defaultQuestionText;

  const translatedOptions = options.map((opt) => {
    const optHindi = qTrans?.options[opt.optionText];
    return {
      ...opt,
      optionText: optHindi || opt.optionText,
    };
  });

  return {
    questionText: translatedQuestionText,
    options: translatedOptions,
  };
}

/**
 * Returns translated section title and concept text.
 */
export function getTranslatedSection(
  sectionKey: string,
  lang: Language,
  defaultTitle: string,
  defaultConceptText: string | null
): { title: string; conceptText: string | null } {
  if (lang === "en") {
    return { title: defaultTitle, conceptText: defaultConceptText };
  }

  const secTrans = SECTIONS_TRANSLATIONS[sectionKey]?.[lang];
  return {
    title: secTrans?.title || defaultTitle,
    conceptText: secTrans?.conceptText ?? defaultConceptText,
  };
}
