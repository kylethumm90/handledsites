"use client";

// Contractor-facing gallery management.
// Upload zone (react-dropzone) at the top; below it a sortable grid of
// thumbnails (@dnd-kit/sortable) where each tile carries inline editors
// for caption, service type, visibility, and delete. Photos saved here
// render publicly under "Recent Work" on the contractor's /[slug]
// business card when is_visible is true.

import { useCallback, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Eye, EyeOff, ImagePlus } from "lucide-react";

const INK = "#111827";
const MUTED = "#6B7280";
const HAIRLINE = "rgba(17,24,39,0.08)";
const SURFACE = "#FFFFFF";

const DEFAULT_SERVICE_OPTIONS = [
  "HVAC",
  "Roofing",
  "Solar",
  "Plumbing",
  "Electrical",
  "Other",
];

export type GalleryPhoto = {
  id: string;
  business_id: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  service_type: string | null;
  display_order: number;
  is_visible: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
};

type UploadingItem = {
  key: string;
  name: string;
  previewUrl: string;
  progress: number; // 0-100; rough — we don't get true progress with fetch()
  error: string | null;
};

type Props = {
  initialPhotos: GalleryPhoto[];
  services: string[];
};

export default function GalleryClient({ initialPhotos, services }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Prefer the contractor's configured services if any; otherwise fall
  // back to the canonical list. Always include "Other" as an escape
  // hatch and an empty option to clear the value.
  const serviceOptions = useMemo(() => {
    const base = services && services.length > 0 ? services : DEFAULT_SERVICE_OPTIONS;
    const dedup = Array.from(new Set([...base, "Other"]));
    return dedup;
  }, [services]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setGlobalError(null);

    const items: UploadingItem[] = acceptedFiles.map((file) => ({
      key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      progress: 5,
      error: null,
    }));
    setUploading((prev) => [...prev, ...items]);

    // Animate the bar so users see motion while sharp + Supabase do
    // their thing. Real progress tracking would need XHR; a smooth
    // fake bar is good enough for the file sizes we're handling.
    const tickers: number[] = [];
    items.forEach((item) => {
      const t = window.setInterval(() => {
        setUploading((prev) =>
          prev.map((u) =>
            u.key === item.key && u.progress < 90
              ? { ...u, progress: u.progress + 5 }
              : u
          )
        );
      }, 250);
      tickers.push(t);
    });

    try {
      const formData = new FormData();
      acceptedFiles.forEach((f) => formData.append("files", f));

      const res = await fetch("/api/contractor/gallery/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setGlobalError(data.error || "Upload failed");
        setUploading((prev) =>
          prev.map((u) =>
            items.some((i) => i.key === u.key)
              ? { ...u, error: data.error || "Upload failed" }
              : u
          )
        );
        return;
      }

      const created: GalleryPhoto[] = data.created || [];
      const errors: { name: string; error: string }[] = data.errors || [];

      if (created.length > 0) {
        setPhotos((prev) =>
          [...prev, ...created].sort((a, b) => a.display_order - b.display_order)
        );
      }

      // Annotate any per-file failures so the user sees which ones
      // didn't make it; successful files just disappear from the queue.
      setUploading((prev) =>
        prev
          .map((u) => {
            if (!items.some((i) => i.key === u.key)) return u;
            const fileFailure = errors.find((e) => e.name === u.name);
            if (fileFailure) return { ...u, error: fileFailure.error, progress: 100 };
            return null;
          })
          .filter((u): u is UploadingItem => u !== null)
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setGlobalError(msg);
      setUploading((prev) =>
        prev.map((u) =>
          items.some((i) => i.key === u.key) ? { ...u, error: msg } : u
        )
      );
    } finally {
      tickers.forEach((t) => window.clearInterval(t));
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    maxSize: 15 * 1024 * 1024,
    multiple: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = useCallback(
    async (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;

      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = arrayMove(photos, oldIndex, newIndex).map((p, i) => ({
        ...p,
        display_order: i,
      }));
      setPhotos(reordered);

      try {
        await fetch("/api/contractor/gallery/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: reordered.map((p) => ({ id: p.id, display_order: p.display_order })),
          }),
        });
      } catch {
        // No-op: keeping the optimistic order is fine; next reload
        // will pull from the DB if it didn't persist.
      }
    },
    [photos]
  );

  const updatePhoto = useCallback(
    async (id: string, updates: Partial<GalleryPhoto>) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      try {
        await fetch(`/api/contractor/gallery/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      } catch {
        // Silent — UI shows the optimistic change.
      }
    },
    []
  );

  const deletePhoto = useCallback(async (id: string) => {
    if (!window.confirm("Delete this photo? This can't be undone.")) return;
    const prev = photos;
    setPhotos((p) => p.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/contractor/gallery/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setPhotos(prev);
      setGlobalError("Couldn't delete that photo. Try again.");
    }
  }, [photos]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: INK,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Photo gallery
        </h1>
        <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 0" }}>
          Upload project photos. Visible photos appear on your public site
          under &ldquo;Recent Work.&rdquo;
        </p>
      </header>

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? INK : HAIRLINE}`,
          borderRadius: 12,
          padding: "32px 16px",
          textAlign: "center",
          background: isDragActive ? "rgba(17,24,39,0.03)" : SURFACE,
          cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <input {...getInputProps()} />
        <ImagePlus
          size={28}
          strokeWidth={1.5}
          color={MUTED}
          style={{ marginBottom: 8 }}
        />
        <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>
          Drop photos here or click to upload.
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
          JPEG, PNG, WebP, HEIC · up to 15MB each
        </div>
      </div>

      {globalError && (
        <div
          style={{
            fontSize: 13,
            color: "#B91C1C",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            padding: "8px 12px",
            borderRadius: 8,
          }}
        >
          {globalError}
        </div>
      )}

      {uploading.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {uploading.map((u) => (
            <UploadingRow
              key={u.key}
              item={u}
              onDismiss={() =>
                setUploading((prev) => prev.filter((x) => x.key !== u.key))
              }
            />
          ))}
        </div>
      )}

      {photos.length === 0 && uploading.length === 0 ? (
        <div
          style={{
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 12,
            padding: "40px 20px",
            textAlign: "center",
            background: SURFACE,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>
            Upload your first project photos.
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            Show off your work.
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={photos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {photos.map((p) => (
                <PhotoTile
                  key={p.id}
                  photo={p}
                  serviceOptions={serviceOptions}
                  onUpdate={updatePhoto}
                  onDelete={deletePhoto}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function UploadingRow({
  item,
  onDismiss,
}: {
  item: UploadingItem;
  onDismiss: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 8,
        border: `1px solid ${HAIRLINE}`,
        borderRadius: 10,
        background: SURFACE,
      }}
    >
      <img
        src={item.previewUrl}
        alt=""
        style={{
          width: 44,
          height: 44,
          objectFit: "cover",
          borderRadius: 6,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            color: INK,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            marginTop: 4,
            height: 4,
            borderRadius: 2,
            background: "#F3F4F6",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${item.progress}%`,
              height: "100%",
              background: item.error ? "#B91C1C" : INK,
              transition: "width 0.25s linear",
            }}
          />
        </div>
        {item.error && (
          <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 4 }}>
            {item.error}
          </div>
        )}
      </div>
      {item.error && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: MUTED,
            fontSize: 12,
            cursor: "pointer",
            padding: 4,
          }}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

function PhotoTile({
  photo,
  serviceOptions,
  onUpdate,
  onDelete,
}: {
  photo: GalleryPhoto;
  serviceOptions: string[];
  onUpdate: (id: string, updates: Partial<GalleryPhoto>) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const [caption, setCaption] = useState(photo.caption ?? "");
  const captionDirtyRef = useRef(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    border: `1px solid ${HAIRLINE}`,
    borderRadius: 12,
    background: SURFACE,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const commitCaption = () => {
    if (!captionDirtyRef.current) return;
    captionDirtyRef.current = false;
    onUpdate(photo.id, { caption: caption.trim() || null });
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ position: "relative", aspectRatio: "4 / 3", background: "#F3F4F6" }}>
        <img
          src={photo.public_url}
          alt={photo.caption ?? ""}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          loading="lazy"
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            background: "rgba(255,255,255,0.92)",
            border: "none",
            borderRadius: 6,
            padding: 4,
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GripVertical size={14} color={INK} />
        </button>
        {!photo.is_visible && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(17,24,39,0.85)",
              color: "white",
              fontSize: 10,
              fontWeight: 600,
              padding: "3px 6px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Hidden
          </div>
        )}
      </div>

      <div
        style={{
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <input
          type="text"
          value={caption}
          placeholder="Add a caption"
          onChange={(e) => {
            setCaption(e.target.value);
            captionDirtyRef.current = true;
          }}
          onBlur={commitCaption}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          style={{
            width: "100%",
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 13,
            color: INK,
            outline: "none",
            background: "white",
          }}
        />

        <select
          value={photo.service_type ?? ""}
          onChange={(e) =>
            onUpdate(photo.id, { service_type: e.target.value || null })
          }
          style={{
            width: "100%",
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 13,
            color: photo.service_type ? INK : MUTED,
            background: "white",
            cursor: "pointer",
          }}
        >
          <option value="">Service type…</option>
          {serviceOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => onUpdate(photo.id, { is_visible: !photo.is_visible })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: photo.is_visible ? INK : MUTED,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
            aria-label={photo.is_visible ? "Hide photo" : "Show photo"}
          >
            {photo.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
            {photo.is_visible ? "Visible" : "Hidden"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(photo.id)}
            aria-label="Delete photo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "#B91C1C",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
