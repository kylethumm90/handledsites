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
};

export default function ImageUpload({
  currentUrl,
  storagePath,
  onUploaded,
  shape = "circle",
  height = "h-20",
  width = "w-20",
  label,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${storagePath}.${ext}`;
      const supabase = getSupabaseClient();

      const { error } = await supabase.storage
        .from("contractor-assets")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("contractor-assets")
        .getPublicUrl(path);

      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      setPreview(url);
      onUploaded(url);
    } catch {
      // Silent fail — user can retry
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
      <p className="mt-1 text-xs text-gray-400">Click to change · Under 2MB</p>
    </div>
  );
}
