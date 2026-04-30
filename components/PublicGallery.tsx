"use client";

// Public-facing "Recent Work" gallery on /[slug].
// Renders the contractor's visible photos in a responsive grid with
// optional service-type filter pills and a click-to-open lightbox with
// keyboard nav. The component is hidden by the parent if there are no
// visible photos — we don't render an empty state to homeowners.

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type PublicGalleryPhoto = {
  id: string;
  public_url: string;
  caption: string | null;
  service_type: string | null;
  width: number | null;
  height: number | null;
};

const ALL_FILTER = "__all__";

export default function PublicGallery({ photos }: { photos: PublicGalleryPhoto[] }) {
  const [filter, setFilter] = useState<string>(ALL_FILTER);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Derive the filter pills from the data: only show a pill for a
  // service type that actually has at least one photo.
  const serviceTypes = useMemo(() => {
    const set = new Set<string>();
    for (const p of photos) {
      if (p.service_type) set.add(p.service_type);
    }
    return Array.from(set).sort();
  }, [photos]);

  const filtered = useMemo(() => {
    if (filter === ALL_FILTER) return photos;
    return photos.filter((p) => p.service_type === filter);
  }, [photos, filter]);

  const close = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + filtered.length) % filtered.length
    );
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % filtered.length));

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    // Lock scroll while the lightbox is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, filtered.length]);

  if (photos.length === 0) return null;

  const active = lightboxIndex !== null ? filtered[lightboxIndex] ?? null : null;

  return (
    <section style={{ marginTop: 8 }}>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "white",
          margin: "0 0 12px",
          letterSpacing: "-0.01em",
        }}
      >
        Recent Work
      </h2>

      {serviceTypes.length > 1 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <FilterPill
            label="All"
            active={filter === ALL_FILTER}
            onClick={() => setFilter(ALL_FILTER)}
          />
          {serviceTypes.map((s) => (
            <FilterPill
              key={s}
              label={s}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: 6,
          gridTemplateColumns: "repeat(2, 1fr)",
        }}
        className="public-gallery-grid"
      >
        {filtered.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            aria-label={p.caption ?? "Open photo"}
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              border: "none",
              padding: 0,
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              background: "#1e2235",
            }}
          >
            <Image
              src={p.public_url}
              alt={p.caption ?? ""}
              fill
              sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
              style={{ objectFit: "cover" }}
            />
          </button>
        ))}
      </div>

      <style>{`
        @media (min-width: 600px) {
          .public-gallery-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 900px) {
          .public-gallery-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>

      {active && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>

          {filtered.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={prev}
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={next}
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <img
              src={active.public_url}
              alt={active.caption ?? ""}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
            {active.caption && (
              <div
                style={{
                  color: "white",
                  fontSize: 13,
                  textAlign: "center",
                  maxWidth: 600,
                }}
              >
                {active.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        background: active ? "white" : "rgba(255,255,255,0.08)",
        color: active ? "#111827" : "rgba(255,255,255,0.85)",
        border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
    >
      {label}
    </button>
  );
}
