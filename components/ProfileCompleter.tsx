"use client";

import { useState, useEffect, useRef } from "react";

type ProfileData = {
  owner_name: string | null;
  years_in_business: number | null;
  service_areas: string[] | null;
  license_number: string | null;
  hero_tagline: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_nextdoor: string | null;
};

type Question = {
  id: string;
  field: keyof ProfileData;
  message: string;
  placeholder: string;
  type: "text" | "number" | "areas";
  skipLabel?: string;
};

const QUESTIONS: Question[] = [
  {
    id: "owner_name",
    field: "owner_name",
    message: "First off — what's your name? We'll use this on your website's about section.",
    placeholder: "e.g. John Martinez",
    type: "text",
  },
  {
    id: "years_in_business",
    field: "years_in_business",
    message: "How many years have you been in business? This builds trust with customers.",
    placeholder: "e.g. 12",
    type: "number",
  },
  {
    id: "service_areas",
    field: "service_areas",
    message: "What cities or areas do you serve? List as many as you want, separated by commas.",
    placeholder: "e.g. Austin, Round Rock, Cedar Park",
    type: "areas",
  },
  {
    id: "hero_tagline",
    field: "hero_tagline",
    message: "Got a tagline or slogan? This shows as the headline on your website.",
    placeholder: "e.g. Fast, reliable HVAC service you can trust",
    type: "text",
    skipLabel: "Skip — I'll think of one later",
  },
  {
    id: "license_number",
    field: "license_number",
    message: "Do you have a license number? We'll display it on your site for credibility.",
    placeholder: "e.g. TACLA12345C",
    type: "text",
    skipLabel: "Skip — I don't have one",
  },
  {
    id: "social_instagram",
    field: "social_instagram",
    message: "Got an Instagram? Drop your profile URL and we'll link it on your sites.",
    placeholder: "e.g. https://instagram.com/yourbusiness",
    type: "text",
    skipLabel: "No Instagram",
  },
  {
    id: "social_facebook",
    field: "social_facebook",
    message: "How about a Facebook page?",
    placeholder: "e.g. https://facebook.com/yourbusiness",
    type: "text",
    skipLabel: "No Facebook",
  },
];

type ChatEntry = {
  type: "agent" | "user";
  text: string;
};

export default function ProfileCompleter({
  businessName,
  existing,
}: {
  businessName: string;
  existing: ProfileData;
}) {
  // Filter out questions where data already exists
  const pendingQuestions = QUESTIONS.filter((q) => {
    const val = existing[q.field];
    if (val === null || val === undefined) return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === "string" && val.trim() === "") return true;
    return false;
  });

  const [dismissed, setDismissed] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = currentIdx < pendingQuestions.length ? pendingQuestions[currentIdx] : null;

  // Initialize with greeting
  useEffect(() => {
    if (chat.length === 0 && pendingQuestions.length > 0) {
      const greeting = `Hey! Let's finish setting up ${businessName}. Just a few quick questions to make your sites look even better.`;
      setChat([
        { type: "agent", text: greeting },
        { type: "agent", text: pendingQuestions[0].message },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Focus input when question changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIdx]);

  // Nothing to ask
  if (pendingQuestions.length === 0 || dismissed) return null;

  const advanceToNext = (nextIdx: number, newChat: ChatEntry[], currentAnswers: Record<string, string | number | string[]>) => {
    if (nextIdx >= pendingQuestions.length) {
      // All done — save everything
      setChat([...newChat, { type: "agent", text: "That's everything. Your sites are being updated now." }]);
      setDone(true);
      saveAnswers(currentAnswers);
    } else {
      // Show next question after a brief delay
      setTimeout(() => {
        setChat((prev) => [...prev, { type: "agent", text: pendingQuestions[nextIdx].message }]);
        setCurrentIdx(nextIdx);
      }, 400);
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion || !inputValue.trim()) return;

    let value: string | number | string[] = inputValue.trim();
    if (currentQuestion.type === "number") {
      value = parseInt(inputValue, 10) || 0;
    } else if (currentQuestion.type === "areas") {
      value = inputValue.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const newAnswers = { ...answers, [currentQuestion.field]: value };
    setAnswers(newAnswers);

    const displayText = Array.isArray(value) ? (value as string[]).join(", ") : String(value);
    const newChat: ChatEntry[] = [...chat, { type: "user", text: displayText }];
    setChat(newChat);
    setInputValue("");

    const nextIdx = currentIdx + 1;
    advanceToNext(nextIdx, newChat, newAnswers);
  };

  const handleSkip = () => {
    if (!currentQuestion) return;

    const newChat: ChatEntry[] = [...chat, { type: "user", text: currentQuestion.skipLabel || "Skipped" }];
    setChat(newChat);
    setInputValue("");

    const nextIdx = currentIdx + 1;
    advanceToNext(nextIdx, newChat, answers);
  };

  const saveAnswers = async (finalAnswers: Record<string, string | number | string[]>) => {
    setSaving(true);
    try {
      await fetch("/api/contractor/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
    } catch {
      // Silent fail — data will be saved next time they visit settings
    }
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (done && !saving) {
    return (
      <div className="mb-8 rounded-2xl border border-green-100 bg-green-50 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-sm font-medium text-green-800">Profile updated. Your sites look even better now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01" /></svg>
          </div>
          <span className="text-sm font-semibold text-gray-900">Finish setting up your profile</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Later
        </button>
      </div>

      {/* Chat messages */}
      <div className="max-h-[320px] overflow-y-auto px-5 py-4">
        <div className="space-y-3">
          {chat.map((entry, i) => (
            <div key={i} className={`flex ${entry.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  entry.type === "user"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {entry.text}
              </div>
            </div>
          ))}
          {saving && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      {currentQuestion && !done && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type={currentQuestion.type === "number" ? "number" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentQuestion.placeholder}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white transition-opacity hover:bg-gray-800 disabled:opacity-30"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
            </button>
          </div>
          {currentQuestion.skipLabel && (
            <button
              onClick={handleSkip}
              className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              {currentQuestion.skipLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
