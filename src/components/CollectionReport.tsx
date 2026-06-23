"use client";

import { useEffect, useState } from "react";
import {
  FileText, Download, Share2, Loader2, Shield,
  BarChart3, Star, Award
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ReportData {
  generated_at: string;
  summary: {
    total_cards: number;
    total_estimated_value: number;
    graded_cards: number;
    ungraded_cards: number;
    want_list_items: number;
  };
  top_10_most_valuable: {
    name: string;
    set: string;
    condition: string;
    graded: boolean;
    grading_company: string | null;
    grade: string | null;
    estimated_value: number;
  }[];
  condition_breakdown: Record<string, number>;
  disclaimer: string;
}

interface CollectionReportProps {
  onShareWithAgent?: () => void;
}

export default function CollectionReport({ onShareWithAgent }: CollectionReportProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/insurance/report");
        const data = await res.json();
        if (data.report) {
          setReport(data.report);
        } else {
          setError(data.error || "Failed to generate report");
        }
      } catch {
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleDownloadPDF = () => {
    // In production, this would generate a proper PDF
    // For now, create a text-based report download
    if (!report) return;
    const text = [
      "POKÉ-TRADE COLLECTION INVENTORY REPORT",
      `Generated: ${new Date(report.generated_at).toLocaleString()}`,
      "",
      "SUMMARY",
      `Total Cards: ${report.summary.total_cards}`,
      `Total Estimated Value: $${report.summary.total_estimated_value.toLocaleString()}`,
      `Graded Cards: ${report.summary.graded_cards}`,
      `Ungraded Cards: ${report.summary.ungraded_cards}`,
      "",
      "TOP 10 MOST VALUABLE",
      ...report.top_10_most_valuable.map(
        (c, i) =>
          `${i + 1}. ${c.name} (${c.set}) - ${c.condition}${c.graded ? ` [${c.grading_company} ${c.grade}]` : ""} - $${c.estimated_value.toLocaleString()}`
      ),
      "",
      "CONDITION BREAKDOWN",
      ...Object.entries(report.condition_breakdown).map(
        ([cond, count]) => `${cond}: ${count} cards`
      ),
      "",
      "DISCLAIMER",
      report.disclaimer,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collection-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !report) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error || "No collection data"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Collection Inventory Report
            </h3>
            <p className="text-xs text-muted-foreground">
              Generated {new Date(report.generated_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download Report
            </Button>
            {onShareWithAgent && (
              <Button size="sm" onClick={onShareWithAgent} className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share with Agent
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{report.summary.total_cards}</p>
            <p className="text-xs text-muted-foreground">Total Cards</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              ${report.summary.total_estimated_value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Est. Value</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{report.summary.graded_cards}</p>
            <p className="text-xs text-muted-foreground">Graded</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{report.summary.ungraded_cards}</p>
            <p className="text-xs text-muted-foreground">Ungraded</p>
          </div>
        </div>

        {/* Top 10 */}
        {report.top_10_most_valuable.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <Star className="h-4 w-4 text-amber-500" /> Top 10 Most Valuable
            </h4>
            <div className="space-y-2">
              {report.top_10_most_valuable.map((card, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{card.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {card.set} · {card.condition}
                        {card.graded && (
                          <Badge variant="outline" className="ml-1 text-[9px] bg-purple-50 text-purple-700 border-purple-200">
                            {card.grading_company} {card.grade}
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    ${card.estimated_value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Condition Breakdown */}
        {Object.keys(report.condition_breakdown).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <BarChart3 className="h-4 w-4 text-blue-500" /> Condition Breakdown
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(report.condition_breakdown).map(([condition, count]) => (
                <Badge
                  key={condition}
                  variant="outline"
                  className="text-xs"
                >
                  {condition}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700">{report.disclaimer}</p>
        </div>
      </CardContent>
    </Card>
  );
}
