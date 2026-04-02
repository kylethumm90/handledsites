"use client";

import { useState, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Camera } from "lucide-react";

type Props = {
  currentUrl: string | null;
  storagePath: string;
  onUploaded: (url: string) => void;
  shape?: "circle" | "rectangle";
  height?: string;
  width?: string;
  label: string;
  useServerUpload?: boolean;
};

export default function ImageUpload({
  currentUrl,
  storagePath,
  onUploaded,
  shape = "circle",
  height = "h-20",
  width = "w-20",
  label,
  useServerUpload = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2MB");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      let url: string;

      if (useServerUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("storagePath", storagePath);

        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
        const data = await res.json();
        url = data.url;
      } else {
        const ext = file.name.split(".").pop() || "png";
        const path = `${storagePath}.${ext}`;
        const supabase = getSupabaseClient();

        const { error: uploadError } = await supabase.storage
          .from("contractor-assets")
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("contractor-assets")
          .getPublicUrl(path);

        url = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      setPreview(url);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const isCircle = shape === "circle";

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </label>
      <div
        className={`relative cursor-pointer overflow-hidden ${isCircle ? "rounded-full" : "rounded-lg"} ${height} ${width} group`}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400">
            {isCircle ? "Logo" : "Cover"}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="sr-only"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <p className="mt-1 text-xs text-gray-400">Click to change · Under 2MB</p>
    </div>
  );
}
