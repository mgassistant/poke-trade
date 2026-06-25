import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-100 text-blue-700 border-blue-200" },
  open: { label: "Open", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-700 border-purple-200" },
  waiting_on_user: { label: "Waiting on You", className: "bg-orange-100 text-orange-700 border-orange-200" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-700 border-green-200" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-gray-100 text-gray-600 border-gray-200" },
  normal: { label: "Normal", className: "bg-blue-50 text-blue-600 border-blue-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 border-red-200" },
};

export function TicketStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return <Badge className={`text-[10px] font-medium ${config.className}`}>{config.label}</Badge>;
}

export function TicketPriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
  return <Badge className={`text-[10px] font-medium ${config.className}`}>{config.label}</Badge>;
}
