"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Upload, Check, Copy, ExternalLink } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { generateUniqueSlug, checkDuplicateContact } from "@/lib/slug";
import { TRADE_SERVICES, Trade } from "@/lib/constants";
import PhonePreview from "./PhonePreview";

const TRADES = ["HVAC", "Plumbing", "Solar"] as const;

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const progress = (step / 7) * 100;

  const availableServices = trade
    ? TRADE_SERVICES[trade as Trade] || []
    : [];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be under 2MB."); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleServiceToggle = (service: string) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const duplicateError = await checkDuplicateContact(phoneDigits, email || null);
      if (duplicateError) { setError(duplicateError); setSubmitting(false); return; }

      const slug = await generateUniqueSlug(businessName);
      const supabase = getSupabaseClient();

      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        const path = `logos/${slug}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("contractor-assets")
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw new Error("Logo upload failed");
        const { data: urlData } = supabase.storage.from("contractor-assets").getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      // Generate about bio via API
      let aboutBio: string | null = null;
      if (aboutText.trim()) {
        try {
          const bioRes = await fetch("/api/generate-bio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessName, trade, city, state, services, differentiator: aboutText,
            }),
          });
          if (bioRes.ok) {
            const bioData = await bioRes.json();
            aboutBio = bioData.bio;
          }
        } catch {
          aboutBio = aboutText;
        }
      }

      const { data: bizData, error: bizError } = await supabase
        .from("businesses")
        .insert({
          name: businessName,
          owner_name: businessName,
          phone: phoneDigits,
          email: email || null,
          city, state, trade,
          services,
          logo_url: logoUrl,
          about_bio: aboutBio,
        })
        .select("id")
        .single();

      if (bizError) throw new Error(bizError.message);

      const { error: siteError } = await supabase.from("sites").insert([
        { business_id: bizData.id, type: "business_card", slug },
        { business_id: bizData.id, type: "quiz_funnel", slug },
        { business_id: bizData.id, type: "review_funnel", slug },
        { business_id: bizData.id, type: "website", slug },
      ]);

      if (siteError) throw new Error(siteError.message);
      setSuccessSlug(slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (successSlug) {
    return <SuccessScreen slug={successSlug} businessName={businessName} />;
  }

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none";
  const btnNext = "w-full rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 mt-6";

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
      {/* Left: Question */}
      <div className="flex-1 lg:max-w-md">
        {/* Progress bar */}
        <div className="mb-8 h-1 w-full rounded-full bg-gray-100">
          <div
            className="h-1 rounded-full bg-gray-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicator + back */}
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as Step)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs font-medium text-gray-400">Step {step} of 7</span>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {/* Step 1: Trade */}
        {step === 1 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">What&apos;s your trade?</h2>
            <p className="mb-8 text-sm text-gray-500">Select the type of work you do.</p>
            <div className="space-y-3">
              {TRADES.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTrade(t); setServices([]); setTimeout(() => setStep(2), 300); }}
                  className={`w-full rounded-xl border-2 px-5 py-4 text-left text-base font-semibold transition-all ${
                    trade === t
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-900 hover:border-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Business name */}
        {step === 2 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">What&apos;s your business name?</h2>
            <p className="mb-6 text-sm text-gray-500">This is what customers will see.</p>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Flowright Plumbing"
              className={inputClass}
              autoFocus
            />
            <button onClick={() => setStep(3)} disabled={!businessName.trim()} className={btnNext}>
              Next
            </button>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Where are you located?</h2>
            <p className="mb-6 text-sm text-gray-500">So customers know you&apos;re local.</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className={inputClass}
                autoFocus
              />
              <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                <option value="">State</option>
                {["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button onClick={() => setStep(4)} disabled={!city.trim() || !state} className={btnNext}>
              Next
            </button>
          </div>
        )}

        {/* Step 4: Services */}
        {step === 4 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">What services do you offer?</h2>
            <p className="mb-6 text-sm text-gray-500">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-2">
              {availableServices.map((s) => (
                <button
                  key={s}
                  onClick={() => handleServiceToggle(s)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    services.includes(s)
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(5)} disabled={services.length === 0} className={btnNext}>
              Next
            </button>
          </div>
        )}

        {/* Step 5: About */}
        {step === 5 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">What makes your business different?</h2>
            <p className="mb-6 text-sm text-gray-500">We&apos;ll use this to write your website&apos;s about section.</p>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="e.g. Family owned for 12 years, licensed and insured, free estimates on every job"
              rows={3}
              className={inputClass}
              autoFocus
            />
            <button onClick={() => setStep(6)} className={btnNext}>
              Next
            </button>
            <button onClick={() => { setAboutText(""); setStep(6); }} className="mt-2 w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600">
              Skip for now
            </button>
          </div>
        )}

        {/* Step 6: Phone + Email */}
        {step === 6 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">How can customers reach you?</h2>
            <p className="mb-6 text-sm text-gray-500">Your phone number will be on all your sites.</p>
            <div className="space-y-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                placeholder="(555) 123-4567"
                className={inputClass}
                autoFocus
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className={inputClass}
              />
            </div>
            <button onClick={() => setStep(7)} disabled={phoneDigits.length !== 10} className={btnNext}>
              Next
            </button>
          </div>
        )}

        {/* Step 7: Logo */}
        {step === 7 && (
          <div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Got a logo?</h2>
            <p className="mb-6 text-sm text-gray-500">Upload it now or use your initials.</p>

            {logoPreview ? (
              <div className="mb-4 flex items-center gap-4">
                <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-full object-cover" />
                <button
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-8 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
              >
                <Upload className="h-5 w-5" />
                Upload logo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-gray-900 py-4 text-base font-bold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Building your sites..." : "Create my sites"}
            </button>
            {!logoFile && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-2 w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600"
              >
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

function SuccessScreen({ slug }: { slug: string; businessName: string }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://handledsites.com";

  const sites = [
    { label: "Business Card", url: `${baseUrl}/${slug}`, path: `/${slug}`, color: "bg-gray-100 text-gray-600" },
    { label: "Quiz Funnel", url: `${baseUrl}/q/${slug}`, path: `/q/${slug}`, color: "bg-amber-50 text-amber-700" },
    { label: "Website", url: `${baseUrl}/s/${slug}`, path: `/s/${slug}`, color: "bg-blue-50 text-blue-700" },
    { label: "Review Funnel", url: `${baseUrl}/r/${slug}`, path: `/r/${slug}`, color: "bg-green-50 text-green-700" },
  ];

  return (
    <div className="mx-auto max-w-lg py-8 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="mb-2 text-3xl font-bold text-gray-900">You&apos;re all set.</h2>
      <p className="mb-8 text-gray-500">Your sites are live. Share them anywhere.</p>

      <div className="space-y-3 text-left">
        {sites.map((site) => (
          <SiteRow key={site.label} label={site.label} url={site.url} path={site.path} color={site.color} />
        ))}
      </div>

      <a
        href="/contractor/login"
        className="mt-8 inline-block rounded-xl bg-gray-900 px-8 py-3 text-sm font-semibold text-white hover:bg-gray-800"
      >
        Go to dashboard
      </a>
    </div>
  );
}

function SiteRow({ label, url, path, color }: { label: string; url: string; path: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>{label}</span>
      <span className="min-w-0 flex-1 truncate text-xs font-mono text-gray-500">{url}</span>
      <button onClick={handleCopy} className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200">
        {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
      </button>
      <a href={path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800">
        View <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
