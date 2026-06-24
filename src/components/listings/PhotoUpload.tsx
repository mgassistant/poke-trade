"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  required?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUpload({ photos, onChange, maxPhotos = 4, required = false }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const toUpload = fileArray.slice(0, remaining);
    setError("");
    setUploading(true);

    try {
      const supabase = createClient();
      const newUrls: string[] = [];

      for (const file of toUpload) {
        // Validate
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError("Only JPG, PNG, and WEBP images are allowed");
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError("Images must be under 5MB");
          continue;
        }

        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `listings/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          // Try to create bucket if it doesn't exist, then retry
          if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket")) {
            // Bucket might not exist yet - user needs to create it via Supabase dashboard
            setError("Photo storage not configured. Please create the 'listing-photos' bucket in Supabase.");
            continue;
          }
          setError(`Upload failed: ${uploadError.message}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        onChange([...photos, ...newUrls]);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [photos, maxPhotos, onChange]);

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          Photos {required && <span className="text-red-500">*</span>}
          <span className="ml-1">({photos.length}/{maxPhotos})</span>
        </label>
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((url, idx) => (
            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
              <Image
                src={url}
                alt={`Photo ${idx + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 text-[8px] bg-primary text-primary-foreground px-1 py-0.5 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length > 0) {
              handleFiles(e.dataTransfer.files);
            }
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Drop photos or click to upload</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  JPG, PNG, WEBP · Max 5MB · Up to {maxPhotos - photos.length} more
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
