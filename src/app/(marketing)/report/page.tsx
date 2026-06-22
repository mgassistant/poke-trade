"use client";

import Image from "next/image";
import { useState } from "react";
import { AlertTriangle, Upload, Shield, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReportPage() {
  const [issueType, setIssueType] = useState("");

  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-6 px-4 py-1.5 bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Report an Issue
          </Badge>
          <h1 className="text-3xl font-bold">Report an Issue</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Help us keep Poké-Trade safe. Report scams, counterfeit cards, bugs, or any other issues.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Issue Type */}
            <div>
              <label htmlFor="issue-type" className="block text-sm font-medium text-foreground mb-2">
                Issue Type <span className="text-destructive">*</span>
              </label>
              <select
                id="issue-type"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select an issue type...</option>
                <option value="scam">Scam / Fraud</option>
                <option value="counterfeit">Counterfeit Card</option>
                <option value="bug">Bug / Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Your Email <span className="text-destructive">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                placeholder="Please describe the issue in detail. Include usernames, listing URLs, or trade IDs if applicable."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Screenshots <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop images here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 5MB each
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="relative">
              <button
                disabled
                className="w-full rounded-lg bg-primary/50 text-primary-foreground py-3 text-sm font-semibold cursor-not-allowed opacity-60"
              >
                Submit Report
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                🚧 Online report submission coming soon. For now, please email us directly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Trust & Safety Contact */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Trust & Safety Team</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Our Trust & Safety team reviews all reports within 24 hours. For urgent issues — active scams, threats, or safety concerns — email us directly for the fastest response.
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:safety@poke-trade.com" className="text-primary hover:underline text-sm font-medium">
                    safety@poke-trade.com
                  </a>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:support@poke-trade.com" className="text-primary hover:underline text-sm font-medium">
                    support@poke-trade.com
                  </a>
                  <span className="text-xs text-muted-foreground">(general support)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
