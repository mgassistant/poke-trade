"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { X, Camera, Upload, Search, RotateCcw, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CONDITIONS, getConditionValue, type ConditionInfo } from "@/lib/constants/conditions";
import GradeEstimator from "./GradeEstimator";

interface CardMatch {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  card_type: string | null;
  image_url: string | null;
  market_value: number | null;
  set_id: string;
  card_sets: {
    id: string;
    name: string;
    series: string;
    symbol_url: string | null;
  } | null;
}

interface CardScannerProps {
  open: boolean;
  onClose: () => void;
  onAddCard: (cardId: string, condition: string, quantity: number) => Promise<void>;
}

type ScanStep = "capture" | "identify" | "condition" | "confirm";
type CaptureMode = "camera" | "upload";

export default function CardScanner({ open, onClose, onAddCard }: CardScannerProps) {
  const [step, setStep] = useState<ScanStep>("capture");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardMatch | null>(null);
  const [selectedCondition, setSelectedCondition] = useState("near_mint");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [aiRecognizing, setAiRecognizing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    card_name: string;
    set_name: string;
    card_number: string;
    rarity: string;
    confidence: string;
    condition_estimate: string;
    condition_notes: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Could not access camera. Please allow camera permissions or use upload mode.");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Start/stop camera based on mode and open state
  useEffect(() => {
    if (open && captureMode === "camera" && step === "capture") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, captureMode, step, startCamera, stopCamera]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setStep("capture");
      setCapturedImage(null);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedCard(null);
      setSelectedCondition("near_mint");
      setQuantity(1);
      setAdding(false);
      setCameraError(null);
    }
  }, [open]);

  // AI recognition function
  const recognizeCard = async (imageDataUrl: string) => {
    setAiRecognizing(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch("/api/cards/scan/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
      });
      const data = await res.json();
      if (data.recognized && data.ai) {
        setAiResult(data.ai);
        if (data.matches && data.matches.length > 0) {
          setSearchResults(data.matches);
          setSearchQuery(data.ai.card_name || "");
        }
        if (data.ai.condition_estimate) {
          setSelectedCondition(data.ai.condition_estimate);
        }
      } else {
        setAiError(data.message || data.error || "Could not recognize card");
      }
    } catch {
      setAiError("Recognition failed — try typing the card name instead");
    } finally {
      setAiRecognizing(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    setStep("identify");
    // Auto-trigger AI recognition
    recognizeCard(dataUrl);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      setStep("identify");
      recognizeCard(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      setStep("identify");
      recognizeCard(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Search cards by name
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/cards/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        const data = await res.json();
        if (data.cards) setSearchResults(data.cards);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCard = (card: CardMatch) => {
    setSelectedCard(card);
    setStep("condition");
  };

  const handleGradeChange = (_grade: number, conditionValue: string) => {
    setSelectedCondition(conditionValue);
  };

  const handleAddToCollection = async () => {
    if (!selectedCard) return;
    setAdding(true);
    try {
      await onAddCard(selectedCard.id, selectedCondition, quantity);
      onClose();
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCard(null);
    setAiResult(null);
    setAiError(null);
    setStep("capture");
  };

  if (!open) return null;

  const conditionInfo = CONDITIONS.find((c) => c.value === selectedCondition) || CONDITIONS[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {step === "capture" && "Scan Card"}
              {step === "identify" && "Identify Card"}
              {step === "condition" && "Assess Condition"}
              {step === "confirm" && "Confirm"}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 px-4 pt-3 shrink-0">
          {(["capture", "identify", "condition"] as ScanStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step === s
                    ? "bg-primary"
                    : ["capture", "identify", "condition"].indexOf(step) > i
                      ? "bg-primary/40"
                      : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* STEP 1: Capture */}
          {step === "capture" && (
            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setCaptureMode("camera")}
                  className={`flex-1 py-2 px-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    captureMode === "camera" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <Camera className="h-4 w-4" /> Take Photo
                </button>
                <button
                  onClick={() => setCaptureMode("upload")}
                  className={`flex-1 py-2 px-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    captureMode === "upload" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted/50"
                  }`}
                >
                  <Upload className="h-4 w-4" /> Upload Photo
                </button>
              </div>

              {captureMode === "camera" ? (
                <div className="space-y-3">
                  {cameraError ? (
                    <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center p-6">
                      <div className="text-center">
                        <Camera className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">{cameraError}</p>
                        <Button size="sm" variant="outline" className="mt-3" onClick={startCamera}>
                          Retry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Card frame overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Semi-transparent border */}
                        <div className="absolute inset-0 border-[40px] border-black/50 rounded-lg" />
                        {/* Card outline */}
                        <div className="absolute inset-[40px] border-2 border-white/60 rounded-md" />
                        {/* Corner markers */}
                        <div className="absolute top-[36px] left-[36px] w-6 h-6 border-t-3 border-l-3 border-white rounded-tl" />
                        <div className="absolute top-[36px] right-[36px] w-6 h-6 border-t-3 border-r-3 border-white rounded-tr" />
                        <div className="absolute bottom-[36px] left-[36px] w-6 h-6 border-b-3 border-l-3 border-white rounded-bl" />
                        <div className="absolute bottom-[36px] right-[36px] w-6 h-6 border-b-3 border-r-3 border-white rounded-br" />
                        {/* Instruction text */}
                        <div className="absolute bottom-2 left-0 right-0 text-center">
                          <span className="text-white/80 text-xs bg-black/50 px-3 py-1 rounded-full">
                            Place card within the frame
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                  <Button
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Camera className="h-5 w-5" />
                    {cameraReady ? "Capture" : "Starting camera..."}
                  </Button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] bg-muted/30 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Drop image here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    JPG, PNG, or HEIC
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/heif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Identify */}
          {step === "identify" && (
            <div className="space-y-4">
              {/* Captured image preview */}
              {capturedImage && (
                <div className="relative">
                  <div className="aspect-[3/4] max-h-48 bg-muted rounded-lg overflow-hidden mx-auto w-36">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedImage}
                      alt="Captured card"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <button
                    onClick={handleRetake}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    title="Retake"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* AI Recognition Status */}
              {aiRecognizing && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">AI recognizing card...</p>
                    <p className="text-xs text-blue-600">Analyzing image with GPT-4o</p>
                  </div>
                </div>
              )}

              {aiResult && !aiRecognizing && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">AI Identified</span>
                    <Badge variant="outline" className={`text-[10px] ml-auto ${
                      aiResult.confidence === "high" ? "border-green-400 text-green-700 bg-green-100" :
                      aiResult.confidence === "medium" ? "border-yellow-400 text-yellow-700 bg-yellow-100" :
                      "border-red-400 text-red-700 bg-red-100"
                    }`}>
                      {aiResult.confidence} confidence
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{aiResult.card_name}</p>
                  <p className="text-xs text-gray-600">
                    {aiResult.set_name}{aiResult.card_number ? ` · #${aiResult.card_number}` : ""}
                    {aiResult.rarity ? ` · ${aiResult.rarity}` : ""}
                  </p>
                  {aiResult.condition_notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">Condition: {aiResult.condition_notes}</p>
                  )}
                </div>
              )}

              {aiError && !aiRecognizing && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">{aiError}</p>
                  <p className="text-xs text-yellow-600 mt-1">You can search manually below</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {aiResult && searchResults.length > 0
                    ? "Select the correct match below, or refine your search:"
                    : "Type the card name to find it in our database:"}
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Pikachu VMAX, Charizard ex..."
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Search results */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {searching ? (
                  <div className="text-center py-4">
                    <div className="inline-block h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground mt-2">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleSelectCard(card)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      {card.image_url ? (
                        <div className="h-14 w-10 relative rounded overflow-hidden bg-muted shrink-0">
                          <Image
                            src={card.image_url}
                            alt={card.name}
                            fill
                            className="object-contain"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-muted-foreground">?</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{card.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {card.card_sets?.name || "Unknown Set"} · #{card.number}
                          {card.rarity && ` · ${card.rarity}`}
                        </p>
                        {card.market_value != null && (
                          <p className="text-xs text-green-600">${card.market_value.toFixed(2)}</p>
                        )}
                      </div>
                      <Check className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    </button>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">No cards found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Try a different name or spelling</p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Search className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Type at least 2 characters to search</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Condition Assessment */}
          {step === "condition" && selectedCard && (
            <div className="space-y-4">
              {/* Selected card preview */}
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                {selectedCard.image_url ? (
                  <div className="h-16 w-12 relative rounded overflow-hidden bg-muted shrink-0">
                    <Image
                      src={selectedCard.image_url}
                      alt={selectedCard.name}
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-12 bg-muted rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedCard.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedCard.card_sets?.name} · #{selectedCard.number}
                  </p>
                  {selectedCard.market_value != null && (
                    <p className="text-xs text-green-600">Market: ${selectedCard.market_value.toFixed(2)}</p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setSelectedCard(null); setStep("identify"); }}>
                  Change
                </Button>
              </div>

              {/* Grade Estimator */}
              <GradeEstimator
                marketValue={selectedCard.market_value}
                onGradeChange={handleGradeChange}
                compact
              />

              {/* Or quick-select condition */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Or select condition directly:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedCondition(c.value)}
                      className={`
                        px-3 py-2 rounded-md text-left transition-all border
                        ${selectedCondition === c.value
                          ? `${c.bgColor} ${c.borderColor}`
                          : "bg-card border-border hover:bg-muted/50"
                        }
                      `}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold ${c.color}`}>{c.shortLabel}</span>
                        <span className="text-[11px] text-muted-foreground">{c.label}</span>
                      </div>
                      {selectedCondition === c.value && selectedCard.market_value && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          ≈ ${getConditionValue(selectedCard.market_value, c.value).toFixed(2)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-muted-foreground">Quantity:</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 rounded border border-border flex items-center justify-center text-sm hover:bg-muted/50"
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 h-8 text-center"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    className="h-8 w-8 rounded border border-border flex items-center justify-center text-sm hover:bg-muted/50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Summary + Add */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Condition:</span>
                  <Badge variant="outline" className={`${conditionInfo.color} ${conditionInfo.borderColor}`}>
                    {conditionInfo.label} ({conditionInfo.shortLabel})
                  </Badge>
                </div>
                {selectedCard.market_value != null && (
                  <div className="flex justify-between text-sm">
                    <span>Est. Value:</span>
                    <span className="font-semibold">
                      ${getConditionValue(selectedCard.market_value, selectedCondition).toFixed(2)}
                      {quantity > 1 && (
                        <span className="text-muted-foreground font-normal">
                          {" "}(×{quantity} = ${(getConditionValue(selectedCard.market_value, selectedCondition) * quantity).toFixed(2)})
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleAddToCollection}
                disabled={adding}
                className="w-full gap-2"
                size="lg"
              >
                {adding ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Add to Collection
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
