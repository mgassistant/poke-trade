"use client";

import { useState } from "react";
import { Shield, Search, CheckCircle, XCircle, Loader2, Award, Users, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PSACertData {
  CertNumber: string;
  Subject: string;
  Category: string;
  CardNumber: string;
  Year: string;
  Brand: string;
  Variety: string;
  CardGrade: string;
  GradeDescription: string;
  LabelType: string;
  TotalPopulation: number;
  PopulationHigher: number;
  PSAImageFront: string | null;
  PSAImageBack: string | null;
}

function getGradeColor(grade: string): string {
  const num = parseFloat(grade);
  if (num >= 10) return "text-purple-600 bg-purple-50 border-purple-200";
  if (num >= 9) return "text-green-600 bg-green-50 border-green-200";
  if (num >= 8) return "text-blue-600 bg-blue-50 border-blue-200";
  if (num >= 7) return "text-cyan-600 bg-cyan-50 border-cyan-200";
  if (num >= 5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

interface PSALookupProps {
  onVerified?: (certData: PSACertData) => void;
  compact?: boolean;
  defaultCert?: string;
}

export default function PSALookup({ onVerified, compact = false, defaultCert }: PSALookupProps) {
  const [certNumber, setCertNumber] = useState(defaultCert || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PSACertData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const handleLookup = async () => {
    const cleaned = certNumber.replace(/\D/g, "");
    if (!cleaned || cleaned.length < 5) {
      setError("Enter a valid PSA cert number (min 5 digits)");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/cards/psa?cert=${cleaned}`);
      const data = await res.json();

      if (data.success && data.data) {
        setResult(data.data);
        setCached(data.cached || false);
        onVerified?.(data.data);
      } else {
        setError(data.error || "Cert not found");
      }
    } catch {
      setError("Lookup failed — try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
          <Input
            value={certNumber}
            onChange={(e) => setCertNumber(e.target.value)}
            placeholder="Enter PSA Cert #"
            className="pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          />
        </div>
        <Button
          onClick={handleLookup}
          disabled={loading || !certNumber.trim()}
          size={compact ? "sm" : "default"}
          className="bg-blue-600 hover:bg-blue-700 gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {compact ? "Verify" : "Verify PSA"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className="border-green-200 bg-green-50/30">
          <CardContent className="pt-4 pb-3 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800 text-sm">PSA Verified</p>
                  <p className="text-xs text-green-600">Cert #{result.CertNumber}</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border font-bold text-lg ${getGradeColor(result.CardGrade)}`}>
                PSA {result.CardGrade}
              </div>
            </div>

            {/* Card Info */}
            <div className="space-y-1.5">
              <p className="font-semibold text-gray-900">{result.Subject}</p>
              <div className="flex flex-wrap gap-1.5">
                {result.Year && (
                  <Badge variant="outline" className="text-[10px]">{result.Year}</Badge>
                )}
                {result.Brand && (
                  <Badge variant="outline" className="text-[10px]">{result.Brand}</Badge>
                )}
                {result.CardNumber && (
                  <Badge variant="outline" className="text-[10px]">#{result.CardNumber}</Badge>
                )}
                {result.LabelType && (
                  <Badge variant="outline" className="text-[10px]">{result.LabelType}</Badge>
                )}
                {result.GradeDescription && (
                  <Badge variant="outline" className="text-[10px]">{result.GradeDescription}</Badge>
                )}
              </div>
            </div>

            {/* Population Data */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Population</p>
                  <p className="text-sm font-bold">{(result.TotalPopulation || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                <ChevronUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Pop Higher</p>
                  <p className="text-sm font-bold">{(result.PopulationHigher || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Cached indicator */}
            {cached && (
              <p className="text-[10px] text-gray-400 text-right">Cached result</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
