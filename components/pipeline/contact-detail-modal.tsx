"use client";

/**
 * handled. — ContactDetailModal
 *
 * Centered overlay modal that opens when a contact card on the Pipeline
 * screen is tapped. Body sections are filled in subsequent passes; this
 * file is currently the shell only (backdrop + animation + close).
 *
 * See docs/PRODUCT_SPEC.md "Contact Detail Modal" section and the
 * reference mockup at docs/mockups/pipeline-contact-modal.png.
 */

import { useEffect } from "react";
import type { Lead } from "@/lib/supabase";
import { colors, fonts } from "@/lib/design-system";

type Props = {
  lead: Lead;
  onClose: () => void;
};

export default function ContactDetailModal({ lead, onClose }: Props) {
  // Close on Escape + lock body scroll while the modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <>
      {/*
        Scoped keyframes for the fade/scale entrance. Kept inline so the
        modal is fully self-contained — no global CSS edit needed.
      */}
      <style>{`
        @keyframes handled-modal-fade-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes handled-modal-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${lead.name} — contact details`}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          animation: "handled-modal-backdrop-in 140ms ease-out",
        }}
      >
        <div
          // Clicks inside the panel must not bubble up to the backdrop.
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 640,
            maxHeight: "85vh",
            overflowY: "auto",
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: 0,
            fontFamily: fonts.body,
            color: colors.navy,
            animation: "handled-modal-fade-in 160ms ease-out",
            transformOrigin: "center center",
          }}
        >
          {/* Placeholder body — real sections land in the next pass. */}
          <div style={{ padding: 24 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: fonts.body,
                fontWeight: 700,
                fontSize: 22,
                lineHeight: 1.2,
                color: colors.navy,
              }}
            >
              {lead.name}
            </h2>
          </div>
        </div>
      </div>
    </>
  );
}
