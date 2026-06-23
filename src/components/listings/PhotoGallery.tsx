"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoGalleryProps {
  photos: string[];
  alt?: string;
  size?: "sm" | "md" | "lg";
}

export function PhotoGallery({ photos, alt = "Photo", size = "md" }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const validPhotos = photos.filter(Boolean);
  if (validPhotos.length === 0) return null;

  const sizeClasses = {
    sm: "h-32",
    md: "h-64",
    lg: "h-96",
  };

  return (
    <>
      <div className="space-y-2">
        {/* Main Image */}
        <div
          className={`relative ${sizeClasses[size]} w-full rounded-lg overflow-hidden bg-muted/20 cursor-pointer group`}
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={validPhotos[activeIndex]}
            alt={`${alt} ${activeIndex + 1}`}
            fill
            className="object-contain transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 400px"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="text-white/0 group-hover:text-white/80 text-xs font-medium transition-colors">
              Click to enlarge
            </span>
          </div>
          {validPhotos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
              {activeIndex + 1}/{validPhotos.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {validPhotos.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {validPhotos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative h-14 w-14 rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                  idx === activeIndex
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                <Image
                  src={photo}
                  alt={`${alt} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={validPhotos}
          initialIndex={activeIndex}
          alt={alt}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

function Lightbox({
  photos,
  initialIndex,
  alt,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  // Handle touch swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="h-5 w-5 text-white" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 text-white/70 text-sm">
        {index + 1} / {photos.length}
      </div>

      {/* Navigation */}
      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full max-w-4xl max-h-[85vh] mx-auto p-8"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const diff = e.changedTouches[0].clientX - touchStart;
          if (Math.abs(diff) > 50) {
            if (diff > 0) goPrev();
            else goNext();
          }
          setTouchStart(null);
        }}
      >
        <Image
          src={photos[index]}
          alt={`${alt} ${index + 1}`}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
    </div>
  );
}
