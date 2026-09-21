"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Language, UI_TRANSLATIONS } from "@/lib/translations";

export default function ThankYouPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedLang = sessionStorage.getItem("kiyora_lang") as Language | null;
    if (storedLang === "hi" || storedLang === "en") {
      setLanguage(storedLang);
    }
  }, []);

  const t = UI_TRANSLATIONS[language];

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;

    setLoading(true);
    try {
      const sessionToken = sessionStorage.getItem("kiyora_session");
      const res = await fetch("/api/survey/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          participantName: name.trim(),
          participantContact: contact.trim(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        sessionStorage.removeItem("kiyora_session");
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f9fa]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center border border-gray-100"
      >
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.png"
            alt="Kiyoki Private Limited"
            width={90}
            height={90}
            className="rounded-full shadow-sm"
          />
        </div>

        <div className="text-4xl mb-3">🎉</div>

        <h1 className="text-2xl font-bold text-[#1b2a4a] mb-1.5">
          {t.thankYouTitle}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {t.thankYouSubtitle}
        </p>

        {!submitted ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                <strong className="text-amber-950 font-bold">
                  {language === "hi" ? "शोध भागीदारी पुरस्कार: " : "Research Participation Reward: "}
                </strong>
                {t.incentiveRewardBox}
              </p>
            </div>

            <form onSubmit={handleSubmitContact} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  {t.fullNameLabel}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1b2a4a] focus:border-transparent outline-none text-sm text-gray-800"
                  placeholder={t.namePlaceholder}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  {t.contactLabel}
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1b2a4a] focus:border-transparent outline-none text-sm text-gray-800"
                  placeholder={t.contactPlaceholder}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#1b2a4a] hover:bg-[#2d4a7a] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm sm:text-base mt-2"
              >
                {loading ? t.savingContact : t.submitContact}
              </button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-2xl p-6 text-left"
          >
            <h3 className="text-base font-bold text-green-900 mb-1">
              {t.contactSuccessTitle}
            </h3>
            <p className="text-sm text-green-800 leading-relaxed font-medium">
              {t.contactSuccessMessage}
            </p>
          </motion.div>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-6 text-xs text-gray-500 hover:text-[#1b2a4a] underline block mx-auto"
        >
          {language === "hi" ? "मुखपृष्ठ पर वापस जाएं" : "Return to home"}
        </button>
      </motion.div>
    </div>
  );
}
