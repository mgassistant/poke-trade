"use client";

import {
  AlertTriangle, MessageSquare, FileText, Search, CheckCircle,
  Shield, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  type: "filed" | "response_requested" | "evidence_submitted" | "under_review" | "decision_made" | "message";
  date: string;
  description: string;
  actor?: string;
  isAdmin?: boolean;
}

interface DisputeTimelineProps {
  dispute: {
    status: string;
    created_at: string;
    updated_at: string;
    respondent_response?: string | null;
    admin_decision?: string | null;
    admin_reasoning?: string | null;
    decided_at?: string | null;
    outcome?: string | null;
    credit_amount?: number;
  };
  messages?: {
    id: string;
    sender_id: string;
    message: string;
    attachments: string[];
    is_admin: boolean;
    created_at: string;
  }[];
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  filed: AlertTriangle,
  response_requested: MessageSquare,
  evidence_submitted: FileText,
  under_review: Search,
  decision_made: CheckCircle,
  message: MessageSquare,
};

const EVENT_COLORS: Record<string, string> = {
  filed: "bg-red-100 text-red-600",
  response_requested: "bg-yellow-100 text-yellow-600",
  evidence_submitted: "bg-blue-100 text-blue-600",
  under_review: "bg-purple-100 text-purple-600",
  decision_made: "bg-green-100 text-green-600",
  message: "bg-gray-100 text-gray-600",
};

export default function DisputeTimeline({
  dispute,
  messages = [],
}: DisputeTimelineProps) {
  // Build timeline events
  const events: TimelineEvent[] = [];

  // Filed
  events.push({
    type: "filed",
    date: dispute.created_at,
    description: "Dispute filed",
  });

  // Response requested (if respondent exists)
  events.push({
    type: "response_requested",
    date: dispute.created_at,
    description: "Response requested from other party",
  });

  // Messages as evidence
  messages.forEach((msg) => {
    events.push({
      type: msg.is_admin ? "message" : "evidence_submitted",
      date: msg.created_at,
      description: msg.is_admin ? `Admin: ${msg.message}` : msg.message,
      actor: msg.is_admin ? "Admin" : undefined,
      isAdmin: msg.is_admin,
    });
  });

  // Respondent response
  if (dispute.respondent_response) {
    events.push({
      type: "evidence_submitted",
      date: dispute.updated_at,
      description: "Respondent submitted their response",
    });
  }

  // Under review
  if (dispute.status === "investigating" || dispute.status === "resolved") {
    events.push({
      type: "under_review",
      date: dispute.updated_at,
      description: "Dispute is under review by the team",
    });
  }

  // Decision
  if (dispute.decided_at && dispute.admin_decision) {
    events.push({
      type: "decision_made",
      date: dispute.decided_at,
      description: `Decision: ${dispute.outcome ?? dispute.admin_decision}${
        dispute.credit_amount && dispute.credit_amount > 0
          ? ` — $${dispute.credit_amount} platform credit issued`
          : ""
      }`,
      isAdmin: true,
    });
  }

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const Icon = EVENT_ICONS[event.type] ?? Clock;
        const colorClass = EVENT_COLORS[event.type] ?? "bg-gray-100 text-gray-600";
        const isLast = idx === events.length - 1;

        return (
          <div key={idx} className="flex gap-3">
            {/* Connector Line + Icon */}
            <div className="flex flex-col items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-gray-200 min-h-[24px]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{event.description}</p>
                {event.isAdmin && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <Shield className="h-2.5 w-2.5 mr-0.5" /> Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(event.date).toLocaleString()}
              </p>

              {/* Admin reasoning */}
              {event.type === "decision_made" && dispute.admin_reasoning && (
                <div className="mt-2 bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">Reasoning:</p>
                  <p className="text-sm">{dispute.admin_reasoning}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
