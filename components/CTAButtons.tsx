"use client";

import { Phone, MessageSquare, UserPlus } from "lucide-react";
import { generateVCard, downloadVCard } from "@/lib/vcard";

type Props = {
  phone: string;
  businessName: string;
  city: string;
  state: string;
  slug: string;
};

export default function CTAButtons({
  phone,
  businessName,
  city,
  state,
  slug,
}: Props) {
  const formattedPhone = `+1${phone}`;
  const displayPhone = `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  const cardUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${slug}`
      : `https://handled.sites/${slug}`;

  const handleSaveContact = async () => {
    const vcard = generateVCard({
      businessName,
      phone,
      city,
      state,
      url: cardUrl,
    });

    // Try Web Share API first
    if (navigator.share) {
      try {
        const file = new File([vcard], `${businessName}.vcf`, {
          type: "text/vcard",
        });
        await navigator.share({
          files: [file],
        });
        return;
      } catch {
        // Share cancelled or failed, fall through to download
      }
    }

    // Fallback to download
    downloadVCard(vcard, businessName.toLowerCase().replace(/\s+/g, "-"));
  };

  return (
    <div className="space-y-3">
      <a
        href={`tel:${formattedPhone}`}
        className="flex items-center justify-center gap-2 rounded-xl bg-card-call py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        <Phone className="h-4 w-4" />
        Call {displayPhone}
      </a>

      <a
        href={`sms:${formattedPhone}?body=${encodeURIComponent("Hi, I need a quote")}`}
        className="flex items-center justify-center gap-2 rounded-xl bg-card-text-bg py-3.5 text-sm font-bold text-card-text-fg transition-opacity hover:opacity-90"
      >
        <MessageSquare className="h-4 w-4" />
        Text us instead
      </a>

      <button
        onClick={handleSaveContact}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-card-save-bg py-3.5 text-sm font-bold text-card-save-fg transition-opacity hover:opacity-90"
      >
        <UserPlus className="h-4 w-4" />
        Save to contacts
      </button>
    </div>
  );
}
