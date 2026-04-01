"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, ExternalLink } from "lucide-react";

type Props = {
  slug: string;
};

export default function SuccessState({ slug }: Props) {
  const [copied, setCopied] = useState(false);
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://handled.sites";
  const url = `${baseUrl}/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check className="h-8 w-8 text-green-600" />
      </div>

      <div>
        <h3
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Your card is live!
        </h3>
        <p className="mt-2 text-gray-600">
          Share this link anywhere — texts, emails, social media, even your
          truck.
        </p>
      </div>

      {/* URL display */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <span className="flex-1 truncate text-sm font-medium text-gray-800">
          {url}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <QRCodeSVG value={url} size={160} level="M" />
        </div>
        <p className="text-xs text-gray-500">
          Screenshot this QR code for flyers, truck decals, or business cards
        </p>
      </div>

      {/* View card link */}
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        View your card
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
