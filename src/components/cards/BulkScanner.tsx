"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  X, Camera, Upload, Check, Sparkles, Loader2, RotateCcw,
  Trash2, ChevronDown, ChevronUp, Download, Undo2, Volume2,
  Layers, ZapOff, AlertTriangle, CheckCircle2, Package, Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CONDITIONS, getConditionValue } from "@/lib/constants/conditions";
import { compressForScan, compressForBinder, readAndCompressFile } from "@/lib/image-utils";

/* ────────── Types ────────── */

interface CardMatch {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  card_type: string | null;
  image_url: string | null;
  market_value: number | null;
  set_id: string;
  card_sets: { id: string; name: string; series: string; symbol_url: string | null } | null;
}

interface ScannedCard {
  id: string; // unique scan ID
  image: string; // base64 thumbnail
  ai: {
    card_name: string;
    set_name: string;
    card_number: string;
    rarity: string;
    confidence: string;
    condition_estimate: string;
    condition_notes: string;
    position?: { row: number; col: number };
  } | null;
  matches: CardMatch[];
  selectedMatch: CardMatch | null;
  condition: string;
  quantity: number;
  status: "pending" | "recognized" | "confirmed" | "added" | "failed" | "duplicate";
  error?: string;
}

type ScanMode = "rapid" | "batch" | "continuous" | "binder";

interface BulkScannerProps {
  open: boolean;
  onClose: () => void;
  onAddCard: (cardId: string, condition: string, quantity: number) => Promise<void>;
  existingCardIds?: Set<string>;
}

/* ────────── Component ────────── */

export default function BulkScanner({ open, onClose, onAddCard, existingCardIds }: BulkScannerProps) {
  const [mode, setMode] = useState<ScanMode>("rapid");
  const [scannedCards, setScannedCards] = useState<ScannedCard[]>([]);
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const binderInputRef = useRef<HTMLInputElement>(null);
  const beepRef = useRef<AudioContext | null>(null);
  const autoCaptureTimer = useRef<NodeJS.Timeout | null>(null);

  // Stats
  const totalScanned = scannedCards.length;
  const totalConfirmed = scannedCards.filter((c) => c.status === "confirmed" || c.status === "added").length;
  const totalAdded = scannedCards.filter((c) => c.status === "added").length;
  const totalValue = scannedCards
    .filter((c) => c.selectedMatch?.market_value && (c.status === "confirmed" || c.status === "added"))
    .reduce((sum, c) => sum + (getConditionValue(c.selectedMatch!.market_value!, c.condition) * c.quantity), 0);
  const duplicateCount = scannedCards.filter((c) => c.status === "duplicate").length;

  /* ── Audio ── */
  const playBeep = useCallback((success: boolean) => {
    if (!soundEnabled) return;
    try {
      if (!beepRef.current) beepRef.current = new AudioContext();
      const ctx = beepRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = success ? 880 : 440;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.1 : 0.3));
    } catch { /* audio not available */ }
  }, [soundEnabled]);

  /* ── Camera ── */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch {
      setCameraError("Could not access camera. Please allow permissions or use upload mode.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
    if (autoCaptureTimer.current) {
      clearInterval(autoCaptureTimer.current);
      autoCaptureTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (open && (mode === "rapid" || mode === "continuous")) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [open, mode, startCamera, stopCamera]);

  useEffect(() => {
    if (!open) {
      setScannedCards([]);
      setProcessing(false);
      setCameraError(null);
      setAutoCapture(false);
    }
  }, [open]);

  /* ── Continuous mode auto-capture ── */
  useEffect(() => {
    if (mode === "continuous" && autoCapture && cameraReady && !processing) {
      autoCaptureTimer.current = setInterval(() => {
        if (!processing) captureAndRecognize();
      }, 3000);
      return () => {
        if (autoCaptureTimer.current) clearInterval(autoCaptureTimer.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoCapture, cameraReady, processing]);

  /* ── Core: Capture + Recognize ── */
  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;
    setProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setProcessing(false); return; }
    ctx.drawImage(video, 0, 0);
    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    // Compress before sending to API
    const dataUrl = await compressForScan(rawDataUrl);

    const scanId = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const placeholder: ScannedCard = {
      id: scanId,
      image: dataUrl,
      ai: null,
      matches: [],
      selectedMatch: null,
      condition: "near_mint",
      quantity: 1,
      status: "pending",
    };

    setScannedCards((prev) => [placeholder, ...prev]);

    try {
      const res = await fetch("/api/cards/scan/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();

      if (data.recognized && data.ai && data.matches?.length > 0) {
        const topMatch = data.matches[0];
        const isDuplicate = existingCardIds?.has(topMatch.id);

        playBeep(true);
        setScannedCards((prev) =>
          prev.map((c) =>
            c.id === scanId
              ? {
                  ...c,
                  ai: data.ai,
                  matches: data.matches,
                  selectedMatch: topMatch,
                  condition: data.ai.condition_estimate || "near_mint",
                  status: isDuplicate ? "duplicate" : "recognized",
                }
              : c
          )
        );
      } else {
        playBeep(false);
        setScannedCards((prev) =>
          prev.map((c) =>
            c.id === scanId
              ? { ...c, ai: data.ai || null, status: "failed", error: data.message || "Could not identify" }
              : c
          )
        );
      }
    } catch {
      playBeep(false);
      setScannedCards((prev) =>
        prev.map((c) => (c.id === scanId ? { ...c, status: "failed", error: "Recognition failed" } : c))
      );
    } finally {
      setProcessing(false);
    }
  }, [processing, existingCardIds, playBeep]);

  /* ── Batch Upload ── */
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setProcessing(true);
    const newCards: ScannedCard[] = [];

    for (const file of files.slice(0, 50)) {
      const dataUrl = await readAndCompressFile(file, 640, 900, 0.75);
      const scanId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      newCards.push({
        id: scanId,
        image: dataUrl,
        ai: null,
        matches: [],
        selectedMatch: null,
        condition: "near_mint",
        quantity: 1,
        status: "pending",
      });
    }

    setScannedCards((prev) => [...newCards, ...prev]);

    // Process sequentially to avoid rate limits
    for (const card of newCards) {
      try {
        const res = await fetch("/api/cards/scan/recognize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: card.image }),
        });
        const data = await res.json();

        if (data.recognized && data.matches?.length > 0) {
          const topMatch = data.matches[0];
          const isDuplicate = existingCardIds?.has(topMatch.id);
          playBeep(true);
          setScannedCards((prev) =>
            prev.map((c) =>
              c.id === card.id
                ? {
                    ...c,
                    ai: data.ai,
                    matches: data.matches,
                    selectedMatch: topMatch,
                    condition: data.ai?.condition_estimate || "near_mint",
                    status: isDuplicate ? "duplicate" : "recognized",
                  }
                : c
            )
          );
        } else {
          setScannedCards((prev) =>
            prev.map((c) =>
              c.id === card.id ? { ...c, status: "failed", error: data.message || "Not identified" } : c
            )
          );
        }
      } catch {
        setScannedCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, status: "failed", error: "Failed" } : c))
        );
      }
    }

    setProcessing(false);
    if (e.target) e.target.value = "";
  };

  /* ── Binder Page Scan ── */
  const handleBinderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    const rawUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    const dataUrl = await compressForBinder(rawUrl);

    try {
      const res = await fetch("/api/cards/scan/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [dataUrl], mode: "binder" }),
      });
      const data = await res.json();

      if (data.results) {
        const newCards: ScannedCard[] = data.results.map((r: any, i: number) => {
          const topMatch = r.matches?.[0] || null;
          const isDuplicate = topMatch && existingCardIds?.has(topMatch.id);
          return {
            id: `binder-${Date.now()}-${i}`,
            image: dataUrl, // share binder image
            ai: r.ai,
            matches: r.matches || [],
            selectedMatch: topMatch,
            condition: r.ai?.condition_estimate || "near_mint",
            quantity: 1,
            status: !r.recognized ? "failed" : isDuplicate ? "duplicate" : topMatch ? "recognized" : "failed",
            error: r.error,
          };
        });
        playBeep(true);
        setScannedCards((prev) => [...newCards, ...prev]);
      }
    } catch {
      playBeep(false);
    } finally {
      setProcessing(false);
      if (e.target) e.target.value = "";
    }
  };

  /* ── Actions ── */
  const confirmCard = (scanId: string) => {
    setScannedCards((prev) =>
      prev.map((c) => (c.id === scanId && c.selectedMatch ? { ...c, status: "confirmed" } : c))
    );
  };

  const confirmAll = () => {
    setScannedCards((prev) =>
      prev.map((c) => (c.status === "recognized" && c.selectedMatch ? { ...c, status: "confirmed" } : c))
    );
  };

  const removeCard = (scanId: string) => {
    setScannedCards((prev) => prev.filter((c) => c.id !== scanId));
  };

  const undoLast = () => {
    setScannedCards((prev) => prev.slice(1));
  };

  const changeMatch = (scanId: string, match: CardMatch) => {
    setScannedCards((prev) =>
      prev.map((c) => (c.id === scanId ? { ...c, selectedMatch: match, status: "recognized" } : c))
    );
  };

  const changeCondition = (scanId: string, condition: string) => {
    setScannedCards((prev) =>
      prev.map((c) => (c.id === scanId ? { ...c, condition } : c))
    );
  };

  const addAllConfirmed = async () => {
    const toAdd = scannedCards.filter((c) => c.status === "confirmed" && c.selectedMatch);
    setProcessing(true);

    for (const card of toAdd) {
      try {
        await onAddCard(card.selectedMatch!.id, card.condition, card.quantity);
        setScannedCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, status: "added" } : c))
        );
      } catch {
        setScannedCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, status: "failed", error: "Failed to add" } : c))
        );
      }
    }

    setProcessing(false);
    playBeep(true);
  };

  const exportCSV = () => {
    const rows = [["Card Name", "Set", "Number", "Rarity", "Condition", "Qty", "Est. Value", "Status"]];
    for (const c of scannedCards) {
      const match = c.selectedMatch;
      const value = match?.market_value ? getConditionValue(match.market_value, c.condition) : 0;
      rows.push([
        match?.name || c.ai?.card_name || "Unknown",
        match?.card_sets?.name || c.ai?.set_name || "",
        match?.number || c.ai?.card_number || "",
        match?.rarity || c.ai?.rarity || "",
        c.condition,
        String(c.quantity),
        `$${value.toFixed(2)}`,
        c.status,
      ]);
    }
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poke-trade-scan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      <div className="relative flex flex-col lg:flex-row w-full h-full max-w-6xl mx-auto bg-card shadow-2xl overflow-hidden">
        {/* ── Left: Camera / Upload Area ── */}
        <div className="flex-1 flex flex-col bg-black relative min-h-[40vh] lg:min-h-0">
          {/* Mode tabs */}
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2 bg-gradient-to-b from-black/80 to-transparent">
            {([
              { key: "rapid", label: "Rapid", icon: <Camera className="h-3.5 w-3.5" /> },
              { key: "batch", label: "Batch Upload", icon: <Upload className="h-3.5 w-3.5" /> },
              { key: "continuous", label: "Continuous", icon: <Sparkles className="h-3.5 w-3.5" /> },
              { key: "binder", label: "Binder Page", icon: <Grid3X3 className="h-3.5 w-3.5" /> },
            ] as { key: ScanMode; label: string; icon: React.ReactNode }[]).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === m.key
                    ? "bg-white text-black"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg transition-all ${soundEnabled ? "bg-white/20 text-white" : "bg-white/5 text-white/30"}`}
                title={soundEnabled ? "Sound on" : "Sound off"}
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Camera view (rapid + continuous) */}
          {(mode === "rapid" || mode === "continuous") && (
            <div className="flex-1 relative">
              {cameraError ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <div>
                    <Camera className="h-12 w-12 text-white/20 mx-auto mb-3" />
                    <p className="text-sm text-white/60">{cameraError}</p>
                    <Button size="sm" variant="outline" className="mt-3 text-white border-white/30" onClick={startCamera}>
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Card frame overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 max-w-xs aspect-[2.5/3.5] border-2 border-white/40 rounded-lg relative">
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-white rounded-br" />
                    </div>
                  </div>
                  {/* Processing indicator */}
                  {processing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="bg-black/80 rounded-xl p-4 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                        <span className="text-white text-sm font-medium">Recognizing...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-3">
                  {mode === "rapid" && (
                    <>
                      <Button size="sm" variant="outline" className="text-white border-white/30" onClick={undoLast} disabled={scannedCards.length === 0}>
                        <Undo2 className="h-4 w-4" />
                      </Button>
                      <button
                        onClick={captureAndRecognize}
                        disabled={!cameraReady || processing}
                        className="h-16 w-16 rounded-full bg-white flex items-center justify-center hover:bg-white/90 disabled:bg-white/30 transition-all shadow-lg"
                      >
                        <Camera className="h-7 w-7 text-black" />
                      </button>
                      <Button size="sm" variant="outline" className="text-white border-white/30" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4" />
                      </Button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await readAndCompressFile(file, 640, 900, 0.75);
                        const scanId = `upload-${Date.now()}`;
                        setScannedCards((prev) => [{ id: scanId, image: dataUrl, ai: null, matches: [], selectedMatch: null, condition: "near_mint", quantity: 1, status: "pending" }, ...prev]);
                        setProcessing(true);
                        try {
                          const res = await fetch("/api/cards/scan/recognize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: dataUrl }) });
                          const data = await res.json();
                          if (data.recognized && data.matches?.length > 0) {
                            const topMatch = data.matches[0];
                            const isDuplicate = existingCardIds?.has(topMatch.id);
                            playBeep(true);
                            setScannedCards((prev) => prev.map((c) => c.id === scanId ? { ...c, ai: data.ai, matches: data.matches, selectedMatch: topMatch, condition: data.ai?.condition_estimate || "near_mint", status: isDuplicate ? "duplicate" : "recognized" } : c));
                          } else {
                            playBeep(false);
                            setScannedCards((prev) => prev.map((c) => c.id === scanId ? { ...c, status: "failed", error: "Not identified" } : c));
                          }
                        } catch {
                          setScannedCards((prev) => prev.map((c) => c.id === scanId ? { ...c, status: "failed", error: "Failed" } : c));
                        } finally {
                          setProcessing(false);
                        }
                        e.target.value = "";
                      }} className="hidden" />
                    </>
                  )}
                  {mode === "continuous" && (
                    <Button
                      size="lg"
                      onClick={() => setAutoCapture(!autoCapture)}
                      className={autoCapture ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                    >
                      {autoCapture ? (
                        <><ZapOff className="h-4 w-4 mr-2" /> Stop Auto-Scan</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Start Auto-Scan</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Batch upload */}
          {mode === "batch" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <Upload className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Batch Upload</h3>
                <p className="text-sm text-white/60 mb-6">
                  Select up to 50 card photos. Each will be identified automatically.
                </p>
                <Button size="lg" onClick={() => batchInputRef.current?.click()} disabled={processing} className="gap-2">
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {processing ? "Processing..." : "Select Photos"}
                </Button>
                <input
                  ref={batchInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBatchUpload}
                  className="hidden"
                />
                {processing && (
                  <div className="mt-4">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${((totalScanned - scannedCards.filter((c) => c.status === "pending").length) / Math.max(totalScanned, 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-2">
                      {totalScanned - scannedCards.filter((c) => c.status === "pending").length} / {totalScanned} processed
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Binder page scan */}
          {mode === "binder" && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <Grid3X3 className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Binder Page Scan</h3>
                <p className="text-sm text-white/60 mb-6">
                  Photograph a full binder page. AI will identify each card in the grid separately.
                </p>
                <Button size="lg" onClick={() => binderInputRef.current?.click()} disabled={processing} className="gap-2">
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Grid3X3 className="h-4 w-4" />}
                  {processing ? "Analyzing page..." : "Upload Binder Page"}
                </Button>
                <input
                  ref={binderInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBinderUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Scanned Cards List ── */}
        <div className="w-full lg:w-[400px] flex flex-col bg-card border-l border-border max-h-[60vh] lg:max-h-full">
          {/* Stats bar */}
          <div className="shrink-0 p-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Scan Session
              </h3>
              <button onClick={() => setShowHistory(!showHistory)} className="text-muted-foreground hover:text-foreground">
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">{totalScanned}</div>
                <div className="text-[10px] text-muted-foreground">Scanned</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{totalConfirmed}</div>
                <div className="text-[10px] text-muted-foreground">Confirmed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">{totalAdded}</div>
                <div className="text-[10px] text-muted-foreground">Added</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">${totalValue.toFixed(0)}</div>
                <div className="text-[10px] text-muted-foreground">Value</div>
              </div>
            </div>
            {duplicateCount > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {duplicateCount} duplicate{duplicateCount > 1 ? "s" : ""} found in collection
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="shrink-0 p-2 border-b border-border flex gap-2 flex-wrap">
            {scannedCards.some((c) => c.status === "recognized") && (
              <Button size="sm" variant="outline" onClick={confirmAll} className="text-xs gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm All
              </Button>
            )}
            {totalConfirmed > 0 && totalConfirmed > totalAdded && (
              <Button size="sm" onClick={addAllConfirmed} disabled={processing} className="text-xs gap-1">
                {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                Add {totalConfirmed - totalAdded} to Collection
              </Button>
            )}
            {totalScanned > 0 && (
              <Button size="sm" variant="ghost" onClick={exportCSV} className="text-xs gap-1 ml-auto">
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            )}
          </div>

          {/* Cards list */}
          <div className="flex-1 overflow-y-auto">
            {scannedCards.length === 0 ? (
              <div className="flex items-center justify-center h-full p-6 text-center">
                <div>
                  <Camera className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No cards scanned yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {mode === "rapid" ? "Tap the capture button to scan" :
                     mode === "batch" ? "Upload photos to start" :
                     mode === "continuous" ? "Start auto-scan to begin" :
                     "Upload a binder page photo"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {scannedCards.map((card) => (
                  <ScannedCardRow
                    key={card.id}
                    card={card}
                    onConfirm={() => confirmCard(card.id)}
                    onRemove={() => removeCard(card.id)}
                    onChangeMatch={(match) => changeMatch(card.id, match)}
                    onChangeCondition={(cond) => changeCondition(card.id, cond)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────── Scanned Card Row ────────── */

function ScannedCardRow({
  card,
  onConfirm,
  onRemove,
  onChangeMatch,
  onChangeCondition,
}: {
  card: ScannedCard;
  onConfirm: () => void;
  onRemove: () => void;
  onChangeMatch: (match: CardMatch) => void;
  onChangeCondition: (condition: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const match = card.selectedMatch;
  const condInfo = CONDITIONS.find((c) => c.value === card.condition) || CONDITIONS[2];
  const estValue = match?.market_value ? getConditionValue(match.market_value, card.condition) : null;

  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-500",
    recognized: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
    added: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    duplicate: "bg-amber-100 text-amber-700",
  };

  const statusLabels: Record<string, string> = {
    pending: "Scanning...",
    recognized: "Review",
    confirmed: "Confirmed",
    added: "Added ✓",
    failed: "Failed",
    duplicate: "Duplicate",
  };

  return (
    <div className={`p-2.5 ${card.status === "added" ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2.5">
        {/* Thumbnail */}
        <div className="h-12 w-9 rounded overflow-hidden bg-muted shrink-0 relative">
          {match?.image_url ? (
            <Image src={match.image_url} alt="" fill className="object-contain" sizes="36px" />
          ) : card.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">?</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {card.status === "pending" ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Identifying...</span>
            </div>
          ) : match ? (
            <>
              <p className="text-xs font-semibold truncate">{match.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {match.card_sets?.name} · #{match.number}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-medium ${condInfo.color}`}>{condInfo.shortLabel}</span>
                {estValue && <span className="text-[10px] text-green-600 font-medium">${estValue.toFixed(2)}</span>}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold truncate text-muted-foreground">
                {card.ai?.card_name || "Unknown Card"}
              </p>
              <p className="text-[10px] text-red-500">{card.error || "No match found"}</p>
            </>
          )}
        </div>

        {/* Status + Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Badge className={`text-[9px] px-1.5 py-0 ${statusColors[card.status]}`}>
            {statusLabels[card.status]}
          </Badge>
          {card.status === "recognized" && (
            <button onClick={onConfirm} className="p-1 rounded hover:bg-green-50 text-green-600" title="Confirm">
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
          {card.status !== "added" && (
            <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 text-red-400" title="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {card.matches.length > 1 && (
            <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-muted text-muted-foreground">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded: alternate matches + condition selector */}
      {expanded && (
        <div className="mt-2 pl-11 space-y-2">
          {card.matches.length > 1 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Other matches:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {card.matches.filter((m) => m.id !== match?.id).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onChangeMatch(m)}
                    className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 text-left"
                  >
                    {m.image_url && (
                      <div className="h-8 w-6 relative rounded overflow-hidden bg-muted shrink-0">
                        <Image src={m.image_url} alt="" fill className="object-contain" sizes="24px" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium truncate">{m.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{m.card_sets?.name} · #{m.number}</p>
                    </div>
                    {m.market_value && <span className="text-[10px] text-green-600">${m.market_value.toFixed(2)}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Condition:</p>
            <div className="flex flex-wrap gap-1">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onChangeCondition(c.value)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all border ${
                    card.condition === c.value
                      ? `${c.bgColor} ${c.borderColor} ${c.color}`
                      : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {c.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


