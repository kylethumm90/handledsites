"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, Check, Copy, ExternalLink } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { generateUniqueSlug, checkDuplicateContact } from "@/lib/slug";
import { TRADE_SERVICES, Trade } from "@/lib/constants";
import PhonePreview from "./PhonePreview";
import QuizPreview from "./QuizPreview";
import WebsitePreview from "./WebsitePreview";

const TRADES_LIST = ["HVAC", "Plumbing", "Solar"] as const;
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Phase = "form" | "transitioning" | "pause" | "url" | "fan" | "statement" | "actions" | "exit";

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function OnboardingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [trade, setTrade] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [aboutText, setAboutText] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [slug, setSlug] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workDoneRef = useRef(false);
  const phoneDigits = phone.replace(/\D/g, "");
  const progress = (step / 7) * 100;
  const availableServices = trade ? TRADE_SERVICES[trade as Trade] || [] : [];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be under 2MB."); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleServiceToggle = (s: string) => {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const doBackgroundWork = async (): Promise<string> => {
    const duplicateError = await checkDuplicateContact(phoneDigits, email || null);
    if (duplicateError) throw new Error(duplicateError);

    const generatedSlug = await generateUniqueSlug(businessName);
    const supabase = getSupabaseClient();

    let logoUrl: string | null = null;
    if (logoFile) {
      const ext = logoFile.name.split(".").pop() || "png";
      const path = `logos/${generatedSlug}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("contractor-assets").upload(path, logoFile, { upsert: true });
      if (uploadError) throw new Error("Logo upload failed");
      const { data: urlData } = supabase.storage.from("contractor-assets").getPublicUrl(path);
      logoUrl = urlData.publicUrl;
      setUploadedLogoUrl(logoUrl);
    }

    let aboutBio: string | null = null;
    if (aboutText.trim()) {
      try {
        const bioRes = await fetch("/api/generate-bio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessName, trade, city, state, services, differentiator: aboutText }),
        });
        if (bioRes.ok) { const d = await bioRes.json(); aboutBio = d.bio; }
      } catch { aboutBio = aboutText; }
    }

    const { data: bizData, error: bizError } = await supabase.from("businesses").insert({
      name: businessName, owner_name: businessName, phone: phoneDigits,
      email: email || null, city, state, trade, services, logo_url: logoUrl, about_bio: aboutBio,
    }).select("id").single();
    if (bizError) throw new Error(bizError.message);

    const { error: siteError } = await supabase.from("sites").insert([
      { business_id: bizData.id, type: "business_card", slug: generatedSlug },
      { business_id: bizData.id, type: "quiz_funnel", slug: generatedSlug },
      { business_id: bizData.id, type: "review_funnel", slug: generatedSlug },
      { business_id: bizData.id, type: "website", slug: generatedSlug },
    ]);
    if (siteError) throw new Error(siteError.message);
    return generatedSlug;
  };

  const handleSubmit = async () => {
    setError("");
    setPhase("transitioning");

    // After 300ms transition, enter pause phase and start background work
    setTimeout(async () => {
      setPhase("pause");
      try {
        const result = await doBackgroundWork();
        workDoneRef.current = true;
        setSlug(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setPhase("form");
      }
    }, 300);
  };

  // Choreograph the reveal sequence once work is done
  useEffect(() => {
    if (!slug || phase !== "pause") return;
    // Minimum pause of 1.5s from entering pause phase
    const timer = setTimeout(() => {
      setPhase("url");
      setTimeout(() => setPhase("fan"), 400);
      setTimeout(() => setPhase("statement"), 1000);
      setTimeout(() => setPhase("actions"), 1300);
      setTimeout(() => setPhase("exit"), 1600);
    }, 1200);
    return () => clearTimeout(timer);
  }, [slug, phase]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://handledsites.com";
  const showReveal = phase !== "form";
  const formVisible = phase === "form";

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none";
  const btnNext = "w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 mt-6";

  // ====== REVEAL SEQUENCE ======
  if (showReveal) {
    const phaseIdx = ["transitioning","pause","url","fan","statement","actions","exit"].indexOf(phase);
    const showUrl = phaseIdx >= 2;
    const showFan = phaseIdx >= 3;
    const showStatement = phaseIdx >= 4;
    const showActions = phaseIdx >= 5;
    const showExit = phaseIdx >= 6;

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center py-12">
        {error && (
          <div className="mb-8 text-center">
            <p className="mb-3 text-sm text-red-600">{error}</p>
            <button onClick={() => { setError(""); setPhase("form"); }} className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Let&apos;s try again
            </button>
          </div>
        )}

        {/* Phone fan */}
        <div className="relative mb-8" style={{ height: 400, width: 320 }}>
          {/* Left: Website */}
          <div
            className="absolute left-0 top-0 transition-all duration-500 ease-out"
            style={{
              transform: showFan ? "translateX(-60px) rotate(-8deg) scale(0.85)" : "translateX(0) rotate(0) scale(1)",
              opacity: showFan ? 1 : 0,
              zIndex: 1,
            }}
          >
            <div className="pointer-events-none" style={{ transform: "scale(0.5)", transformOrigin: "top center", width: 280, height: 580 }}>
              <WebsitePreview businessName={businessName} trade={trade} city={city} state={state} services={services} />
            </div>
            {showFan && (
              <p className="mt-1 text-center text-xs font-medium text-gray-400 transition-opacity duration-300" style={{ opacity: showStatement ? 1 : 0 }}>Website</p>
            )}
          </div>

          {/* Center: Business Card */}
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 transition-all duration-300 ease-out"
            style={{ zIndex: 3 }}
          >
            <div className="pointer-events-none" style={{ transform: "scale(0.5)", transformOrigin: "top center", width: 280, height: 580 }}>
              <PhonePreview
                businessName={businessName || "Your Business"}
                phone={phoneDigits || "5551234567"}
                city={city || "Your City"}
                state={state || "ST"}
                trade={trade || ""}
                logoUrl={uploadedLogoUrl || logoPreview}
              />
            </div>
            {showFan && (
              <p className="mt-1 text-center text-xs font-medium text-gray-400 transition-opacity duration-300" style={{ opacity: showStatement ? 1 : 0 }}>Business card</p>
            )}
          </div>

          {/* Right: Quiz */}
          <div
            className="absolute right-0 top-0 transition-all duration-500 ease-out"
            style={{
              transform: showFan ? "translateX(60px) rotate(8deg) scale(0.85)" : "translateX(0) rotate(0) scale(1)",
              opacity: showFan ? 1 : 0,
              zIndex: 2,
            }}
          >
            <div className="pointer-events-none" style={{ transform: "scale(0.5)", transformOrigin: "top center", width: 280, height: 580 }}>
              <QuizPreview businessName={businessName} trade={trade} logoUrl={uploadedLogoUrl || logoPreview} />
            </div>
            {showFan && (
              <p className="mt-1 text-center text-xs font-medium text-gray-400 transition-opacity duration-300" style={{ opacity: showStatement ? 1 : 0 }}>Quiz funnel</p>
            )}
          </div>
        </div>

        {/* URL */}
        <div className="transition-opacity duration-400" style={{ opacity: showUrl ? 1 : 0 }}>
          <p className="text-center font-mono text-sm text-gray-500">
            {slug ? `${slug}.handled.site` : ""}
          </p>
        </div>

        {/* Statement */}
        <div className="mt-6 transition-opacity duration-300" style={{ opacity: showStatement ? 1 : 0 }}>
          <p className="text-center text-2xl font-medium text-gray-900">Your sites are live.</p>
        </div>

        {/* Action rows */}
        <div className="mt-8 w-full max-w-lg space-y-3 transition-opacity duration-300" style={{ opacity: showActions ? 1 : 0 }}>
          {slug && (
            <>
              <ActionRow label="Business card" url={`${baseUrl}/${slug}`} path={`/${slug}`} />
              <ActionRow label="Website" url={`${baseUrl}/s/${slug}`} path={`/s/${slug}`} />
              <ActionRow label="Quiz funnel" url={`${baseUrl}/q/${slug}`} path={`/q/${slug}`} />
            </>
          )}
        </div>

        {/* Exit */}
        <div className="mt-10 text-center transition-opacity duration-400" style={{ opacity: showExit ? 1 : 0 }}>
          <a
            href="/contractor/login"
            className="inline-block rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Go to your dashboard
          </a>
          <p className="mt-3 text-xs text-gray-400">You can edit everything in Settings anytime.</p>
        </div>
      </div>
    );
  }

  // ====== FORM STEPS ======
  return (
    <div className={`flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12 transition-opacity duration-300 ${formVisible ? "opacity-100" : "opacity-0"}`}>
      {/* Left: Question */}
      <div className="flex-1 lg:max-w-md">
        <div className="mb-8 h-1 w-full rounded-full bg-gray-100">
          <div className="h-1 rounded-full bg-gray-900 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => setStep((step - 1) as Step)} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs font-medium text-gray-400">Step {step} of 7</span>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {step === 1 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">What&apos;s your trade?</h2>
            <p className="mb-8 text-sm text-gray-500">Select the type of work you do.</p>
            <div className="space-y-3">
              {TRADES_LIST.map((t) => (
                <button key={t} onClick={() => { setTrade(t); setServices([]); setTimeout(() => setStep(2), 300); }}
                  className={`w-full rounded-xl border-2 px-5 py-4 text-left text-base font-semibold transition-all ${trade === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-900 hover:border-gray-400"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">What&apos;s your business name?</h2>
            <p className="mb-6 text-sm text-gray-500">This is what customers will see.</p>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Flowright Plumbing" className={inputClass} autoFocus />
            <button onClick={() => setStep(3)} disabled={!businessName.trim()} className={btnNext}>Next</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Where are you located?</h2>
            <p className="mb-6 text-sm text-gray-500">So customers know you&apos;re local.</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputClass} autoFocus />
              <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                <option value="">State</option>
                {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button onClick={() => setStep(4)} disabled={!city.trim() || !state} className={btnNext}>Next</button>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">What services do you offer?</h2>
            <p className="mb-6 text-sm text-gray-500">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-2">
              {availableServices.map((s) => (
                <button key={s} onClick={() => handleServiceToggle(s)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${services.includes(s) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(5)} disabled={services.length === 0} className={btnNext}>Next</button>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">What makes your business different?</h2>
            <p className="mb-6 text-sm text-gray-500">We&apos;ll use this to write your website&apos;s about section.</p>
            <textarea value={aboutText} onChange={(e) => setAboutText(e.target.value)} placeholder="e.g. Family owned for 12 years, licensed and insured, free estimates on every job" rows={3} className={inputClass} autoFocus />
            <button onClick={() => setStep(6)} className={btnNext}>Next</button>
            <button onClick={() => { setAboutText(""); setStep(6); }} className="mt-2 w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600">Skip for now</button>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">How can customers reach you?</h2>
            <p className="mb-6 text-sm text-gray-500">Your phone number will be on all your sites.</p>
            <div className="space-y-3">
              <input type="tel" value={phone} onChange={(e) => setPhone(formatPhoneInput(e.target.value))} placeholder="(555) 123-4567" className={inputClass} autoFocus />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className={inputClass} />
            </div>
            <button onClick={() => setStep(7)} disabled={phoneDigits.length !== 10} className={btnNext}>Next</button>
          </div>
        )}

        {step === 7 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Got a logo?</h2>
            <p className="mb-6 text-sm text-gray-500">Upload it now or use your initials.</p>
            {logoPreview ? (
              <div className="mb-4 flex items-center gap-4">
                <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-full object-cover" />
                <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="text-sm text-gray-500 hover:text-gray-700">Remove</button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700">
                <Upload className="h-5 w-5" /> Upload logo
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            <button onClick={handleSubmit} className="w-full rounded-xl bg-gray-900 py-4 text-base font-bold text-white hover:bg-gray-800">
              Create my sites
            </button>
            {!logoFile && (
              <button onClick={handleSubmit} className="mt-2 w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600">
                Skip, we&apos;ll use your initials
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right: Live preview */}
      <div className="hidden lg:block lg:sticky lg:top-8">
        <PhonePreview
          businessName={businessName || "Your Business"}
          phone={phoneDigits || "5551234567"}
          city={city || "Your City"}
          state={state || "ST"}
          trade={trade || ""}
          logoUrl={logoPreview}
        />
      </div>
    </div>
  );
}

function ActionRow({ label, url, path }: { label: string; url: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-400">{label}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-600">{url}</span>
      <button onClick={handleCopy} className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700">
        {copied ? <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Copied</span> : <span className="flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</span>}
      </button>
      <a href={path} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700">
        <span className="flex items-center gap-1">View <ExternalLink className="h-3 w-3" /></span>
      </a>
    </div>
  );
}
