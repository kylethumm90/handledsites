"use client";

import { useState, useRef } from "react";
import type { Business } from "@/lib/supabase";
import { TRADE_SERVICES, US_STATES, Trade } from "@/lib/constants";
import { Search, Check, Star } from "lucide-react";
import ImageUpload from "./ImageUpload";

type Props = { business: Business };

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  reviews: { text: string; author: string; rating: number }[];
};

export default function ContractorSettingsEditor({ business }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Business info
  const [logoUrl, setLogoUrl] = useState(business.logo_url);
  const [name, setName] = useState(business.name);
  const [ownerName, setOwnerName] = useState(business.owner_name);
  const [phone, setPhone] = useState(business.phone);
  const [email, setEmail] = useState(business.email ?? "");
  const [city, setCity] = useState(business.city);
  const [state, setState] = useState(business.state);
  const [services, setServices] = useState<string[]>(business.services);
  const [socialFacebook, setSocialFacebook] = useState(business.social_facebook ?? "");
  const [socialInstagram, setSocialInstagram] = useState(business.social_instagram ?? "");
  const [socialNextdoor, setSocialNextdoor] = useState(business.social_nextdoor ?? "");
  const [aboutBio, setAboutBio] = useState(business.about_bio ?? "");
  const [yearsInBusiness, setYearsInBusiness] = useState(business.years_in_business ?? "");
  const [licenseNumber, setLicenseNumber] = useState(business.license_number ?? "");
  const [heroTagline, setHeroTagline] = useState(business.hero_tagline ?? "");
  const [serviceAreasText, setServiceAreasText] = useState(
    (business.service_areas || []).join(", ")
  );

  // Google My Business
  const [googleReviewUrl, setGoogleReviewUrl] = useState(business.google_review_url ?? "");
  const [googlePlaceId, setGooglePlaceId] = useState(business.google_place_id ?? "");
  const [streetAddress, setStreetAddress] = useState(business.street_address ?? "");
  const [googleRating, setGoogleRating] = useState<number | null>(business.google_rating);
  const [googleReviewCount, setGoogleReviewCount] = useState<number | null>(business.google_review_count);
  const [googleReviews, setGoogleReviews] = useState(business.google_reviews);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Integrations
  const [gtmId, setGtmId] = useState(business.gtm_id ?? "");
  const [metaPixelId, setMetaPixelId] = useState(business.meta_pixel_id ?? "");
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState(business.zapier_webhook_url ?? "");

  // Custom domain
  const [customDomain, setCustomDomain] = useState(business.custom_domain ?? "");
  const [domainStatus, setDomainStatus] = useState(business.domain_status ?? "none");
  const [domainError, setDomainError] = useState(business.domain_error ?? "");
  const [domainInput, setDomainInput] = useState("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainChecking, setDomainChecking] = useState(false);
  const [domainDns, setDomainDns] = useState<{ type: string; name: string; value: string } | null>(null);

  const handleAddDomain = async () => {
    if (!domainInput.trim()) return;
    setDomainSaving(true);
    setDomainError("");
    try {
      const res = await fetch("/api/contractor/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add domain");
      setCustomDomain(data.domain);
      setDomainStatus("pending");
      setDomainDns(data.dns);
      setDomainInput("");
    } catch (e: unknown) {
      setDomainError(e instanceof Error ? e.message : "Failed to add domain");
    } finally {
      setDomainSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    setDomainChecking(true);
    setDomainError("");
    try {
      const res = await fetch("/api/contractor/domain");
      const data = await res.json();
      setDomainStatus(data.status);
      setDomainError(data.error || "");
      if (data.dns) setDomainDns(data.dns);
    } catch {
      setDomainError("Failed to check domain status");
    } finally {
      setDomainChecking(false);
    }
  };

  const handleRemoveDomain = async () => {
    setDomainSaving(true);
    setDomainError("");
    try {
      const res = await fetch("/api/contractor/domain", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove domain");
      setCustomDomain("");
      setDomainStatus("none");
      setDomainDns(null);
    } catch (e: unknown) {
      setDomainError(e instanceof Error ? e.message : "Failed to remove domain");
    } finally {
      setDomainSaving(false);
    }
  };

  const availableServices = business.trade
    ? TRADE_SERVICES[business.trade as Trade] || []
    : [];

  const isGoogleConnected = !!googlePlaceId;

  const handleServiceToggle = (service: string) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const formatPhoneDisplay = (p: string) => {
    if (p.length === 10) return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`;
    return p;
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(0, 10));
  };

  const handlePlaceSearch = (value: string) => {
    setPlaceQuery(value);
    setShowDropdown(false);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 3) { setPlaceResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setPlaceResults(data.results || []);
        setShowDropdown(true);
      } catch { setPlaceResults([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const selectPlace = (place: PlaceResult) => {
    setGoogleReviewUrl(`https://search.google.com/local/writereview?placeid=${place.placeId}`);
    setGooglePlaceId(place.placeId);
    setStreetAddress(place.address);
    setGoogleRating(place.rating);
    setGoogleReviewCount(place.reviewCount);
    setGoogleReviews(place.reviews.length > 0 ? place.reviews : null);
    setPlaceQuery("");
    setPlaceResults([]);
    setShowDropdown(false);
  };

  const disconnectGoogle = () => {
    setGoogleReviewUrl("");
    setGooglePlaceId("");
    setStreetAddress("");
    setGoogleRating(null);
    setGoogleReviewCount(null);
    setGoogleReviews(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/contractor/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, owner_name: ownerName, phone, email: email || null, city, state, services,
          logo_url: logoUrl,
          social_facebook: socialFacebook.trim() || null,
          social_instagram: socialInstagram.trim() || null,
          social_nextdoor: socialNextdoor.trim() || null,
          about_bio: aboutBio.trim() || null,
          years_in_business: yearsInBusiness === "" ? null : Number(yearsInBusiness),
          license_number: licenseNumber.trim() || null,
          hero_tagline: heroTagline.trim() || null,
          service_areas: serviceAreasText.trim()
            ? serviceAreasText.split(",").map((s) => s.trim()).filter(Boolean) : null,
          google_review_url: googleReviewUrl || null,
          google_place_id: googlePlaceId || null,
          street_address: streetAddress || null,
          google_rating: googleRating,
          google_review_count: googleReviewCount,
          google_reviews: googleReviews,
          gtm_id: gtmId || null,
          meta_pixel_id: metaPixelId || null,
          zapier_webhook_url: zapierWebhookUrl || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Changes saved!");
    } catch {
      setMessage("Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none";
  const labelClass = "mb-1 block text-xs font-medium text-gray-500";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-xs text-gray-400">Manage your business info, Google profile, and integrations.</p>
      </div>

      {/* Section 1: Business Info — universal, applies to all sites */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Business Info</h2>
        <p className="mb-4 text-xs text-gray-400">Core details that appear across all your sites.</p>
        <div className="space-y-4">
          <ImageUpload currentUrl={logoUrl} storagePath={`logos/${business.id}`} onUploaded={setLogoUrl} shape="circle" label="Profile picture" />
          <div>
            <label className={labelClass}>Business name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Owner name</label>
            <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" value={formatPhoneDisplay(phone)} onChange={(e) => handlePhoneChange(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                {US_STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Trade</label>
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500">{business.trade}</div>
          </div>
          {availableServices.length > 0 && (
            <div>
              <label className={labelClass}>Services</label>
              <div className="grid grid-cols-2 gap-1.5">
                {availableServices.map((service) => (
                  <label key={service} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${services.includes(service) ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}>
                    <input type="checkbox" checked={services.includes(service)} onChange={() => handleServiceToggle(service)} className="sr-only" />
                    {service}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Google My Business — business card + website */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Google My Business</h2>
        <p className="mb-4 text-xs text-gray-400">Connect your Google Business Profile to pull in reviews, ratings, and your address.</p>

        {isGoogleConnected ? (
          <div>
            {/* Connected state */}
            <div className="rounded-lg border border-green-100 bg-green-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Connected</span>
                </div>
                <button onClick={disconnectGoogle} className="text-[11px] text-green-600 underline hover:text-green-800">Change</button>
              </div>
              {streetAddress && (
                <p className="text-sm text-green-700 mb-1">{streetAddress}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-green-700">
                {googleRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {googleRating}
                  </span>
                )}
                {googleReviewCount && (
                  <span>{googleReviewCount} reviews</span>
                )}
              </div>
              {googleReviews && googleReviews.length > 0 && (
                <p className="mt-2 text-xs text-green-600">{googleReviews.length} reviews pulled</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Search */}
            <div className="relative">
              <label className={labelClass}>Find your business on Google</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input type="text" value={placeQuery} onChange={(e) => handlePlaceSearch(e.target.value)} placeholder="Search your business name..." className={`${inputClass} pl-9`} />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  </div>
                )}
              </div>
              {showDropdown && placeResults.length > 0 && (
                <div className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
                  {placeResults.map((place) => (
                    <button key={place.placeId} onClick={() => selectPlace(place)} className="flex w-full flex-col px-3 py-2.5 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{place.name}</span>
                        {place.rating && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {place.rating}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{place.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Website — website-only fields */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Website</h2>
        <p className="mb-4 text-xs text-gray-400">These settings only apply to your one-page website.</p>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>About your business</label>
            <textarea value={aboutBio} onChange={(e) => setAboutBio(e.target.value)} placeholder="Tell customers a bit about your business, experience, and what makes you different." rows={4} className={inputClass} />
            <p className="mt-1 text-xs text-gray-400">Leave blank to hide the about section.</p>
          </div>
          <div>
            <label className={labelClass}>Hero tagline</label>
            <input type="text" value={heroTagline} onChange={(e) => setHeroTagline(e.target.value)} placeholder={`e.g. Fast, Reliable ${business.trade} in ${business.city}, ${business.state}`} className={inputClass} />
            <p className="mt-1 text-xs text-gray-400">Main headline on your website. Leave blank for auto-generated.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Years in business</label>
              <input type="number" value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} placeholder="e.g. 18" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>License number</label>
              <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. HVAC-AL-004821" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Service areas</label>
            <input type="text" value={serviceAreasText} onChange={(e) => setServiceAreasText(e.target.value)} placeholder="e.g. Huntsville, Madison, Decatur, Athens" className={inputClass} />
            <p className="mt-1 text-xs text-gray-400">Comma-separated list of cities you serve.</p>
          </div>
        </div>
      </div>

      {/* Section 4: Social Links — business card + website */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Social Links</h2>
        <p className="mb-4 text-xs text-gray-400">These show on your business card and website.</p>
        <div className="space-y-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            <input type="url" value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="https://facebook.com/yourbusiness" className={`${inputClass} pl-10`} />
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            <input type="url" value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/yourbusiness" className={`${inputClass} pl-10`} />
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            <input type="url" value={socialNextdoor} onChange={(e) => setSocialNextdoor(e.target.value)} placeholder="https://nextdoor.com/pages/..." className={`${inputClass} pl-10`} />
          </div>
        </div>
      </div>

      {/* Section 5: Integrations & Tracking */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Integrations &amp; tracking</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Google Tag Manager ID</label>
            <input type="text" value={gtmId} onChange={(e) => setGtmId(e.target.value)} placeholder="GTM-XXXXXXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Meta Pixel ID</label>
            <input type="text" value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)} placeholder="123456789012345" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Zapier webhook URL</label>
            <input type="url" value={zapierWebhookUrl} onChange={(e) => setZapierWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/..." className={inputClass} />
            <p className="mt-1 text-xs text-gray-400">Quiz lead data will be POSTed here on each submission</p>
          </div>
        </div>
      </div>

      {/* Section 6: Custom Domain */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Custom Domain</h2>
        <p className="mb-4 text-xs text-gray-400">Host your sites on your own domain instead of handledsites.com.</p>

        {customDomain && domainStatus !== "none" ? (
          <div>
            {/* Domain configured */}
            <div className={`rounded-lg border p-4 ${domainStatus === "active" ? "border-green-100 bg-green-50" : domainStatus === "error" ? "border-red-100 bg-red-50" : "border-amber-100 bg-amber-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${domainStatus === "active" ? "bg-green-500" : domainStatus === "error" ? "bg-red-500" : "bg-amber-500"}`} />
                  <span className="text-sm font-semibold text-gray-900">{customDomain}</span>
                </div>
                <button onClick={handleRemoveDomain} disabled={domainSaving} className="text-[11px] text-gray-500 underline hover:text-gray-800 disabled:opacity-50">
                  Remove
                </button>
              </div>

              <p className={`text-xs ${domainStatus === "active" ? "text-green-700" : domainStatus === "error" ? "text-red-700" : "text-amber-700"}`}>
                {domainStatus === "active" && "Domain is active and serving your sites."}
                {domainStatus === "pending" && "Waiting for DNS configuration..."}
                {domainStatus === "error" && (domainError || "DNS configuration error.")}
              </p>

              {domainStatus !== "active" && (
                <div className="mt-3">
                  {domainDns && (
                    <div className="rounded-md border border-gray-200 bg-white p-3 mb-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Add this DNS record at your domain registrar:</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block">Type</span>
                          <span className="font-mono font-medium text-gray-900">{domainDns.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Name</span>
                          <span className="font-mono font-medium text-gray-900">{domainDns.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Value</span>
                          <span className="font-mono font-medium text-gray-900 break-all">{domainDns.value}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <button onClick={handleVerifyDomain} disabled={domainChecking} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    {domainChecking ? "Checking..." : "Verify DNS"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Add domain form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                placeholder="yourdomain.com"
                className={`${inputClass} flex-1`}
              />
              <button onClick={handleAddDomain} disabled={domainSaving || !domainInput.trim()} className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap">
                {domainSaving ? "Adding..." : "Add domain"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">Enter a domain you own. You&apos;ll need to configure DNS records after adding it.</p>
          </div>
        )}

        {domainError && domainStatus === "none" && (
          <p className="mt-2 text-xs text-red-600">{domainError}</p>
        )}
      </div>

      {/* Save */}
      <div className="mt-6">
        {message && (
          <p className={`mb-3 text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>{message}</p>
        )}
        <button onClick={handleSave} disabled={saving} className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
