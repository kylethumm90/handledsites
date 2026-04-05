"use client";

type Props = {
  businessName: string;
  trade: string;
  logoUrl?: string | null;
  accentColor?: string | null;
};

const QUIZ_HEADLINES: Record<string, string> = {
  Solar: "Find Out If Your Home Qualifies for $0-Down Solar",
  Landscaping: "What Would Your Yard Look Like With a Pro Behind It?",
  Roofing: "How Much Is Your Roof Actually Worth?",
  HVAC: "Is Your HVAC System Costing You More Than It Should?",
  Plumbing: "What\u2019s That Plumbing Issue Really Going to Cost?",
  Electrical: "Is Your Home\u2019s Wiring Up to Code?",
  Painting: "How Much Should Your Paint Job Actually Cost?",
  "General Contractor": "What\u2019s Your Project Worth?",
};

const SAMPLE_OPTIONS = ["Yes", "No", "Not sure", "Renting"];

export default function QuizPreview({
  businessName,
  trade,
  logoUrl,
  accentColor,
}: Props) {
  const accent = accentColor || "#6366f1";
  const headline = QUIZ_HEADLINES[trade] || "Answer a Few Quick Questions";
  const letters = ["A", "B", "C", "D"];

  return (
    <div className="relative mx-auto w-[280px]">
      {/* Phone frame */}
      <div
        className="mx-auto flex h-[580px] w-[280px] flex-col rounded-[2.5rem] border-4 overflow-hidden"
        style={{
          borderColor: "#d1d5db",
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Notch */}
        <div
          className="mx-auto mt-2 mb-1 h-4 w-20 flex-shrink-0 rounded-full"
          style={{ backgroundColor: "#e5e7eb", position: "relative", zIndex: 10 }}
        />

        {/* Top bar: logo/name */}
        <div className="flex items-center justify-center bg-white px-4 py-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="h-24 max-w-[180px] object-contain"
            />
          ) : (
            <span className="text-sm font-bold text-gray-900 truncate">
              {businessName}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-200">
          <div
            className="h-full rounded-r-full"
            style={{ width: "15%", backgroundColor: accent }}
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col px-5 pt-5">
          {/* Headline */}
          <h3
            className="mb-5 text-center text-sm font-bold leading-snug"
            style={{ color: "#1a1a1a" }}
          >
            {headline}
          </h3>

          {/* Question */}
          <p className="mb-3 text-center text-xs font-medium text-gray-600">
            Are you the homeowner?
          </p>

          {/* Options */}
          <div className="space-y-2">
            {SAMPLE_OPTIONS.map((option, i) => (
              <div
                key={option}
                className="flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5"
                style={{
                  borderColor: i === 0 ? accent : "#e5e7eb",
                  backgroundColor: i === 0 ? `${accent}10` : "white",
                }}
              >
                <span
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                  style={{
                    backgroundColor: i === 0 ? accent : "#f3f4f6",
                    color: i === 0 ? "white" : "#6b7280",
                  }}
                >
                  {letters[i]}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: i === 0 ? accent : "#374151" }}
                >
                  {option}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="mx-auto mb-2 mt-4 h-1 w-16 flex-shrink-0 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}
