"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield, Download, Search, Loader2, FileText,
  Phone, Mail, DollarSign, Calendar, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface InsuranceLead {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  estimated_collection_value: number | null;
  number_of_cards: number | null;
  has_graded_cards: boolean;
  storage_method: string | null;
  consent_to_contact: boolean;
  status: string;
  admin_notes: string | null;
  referred_to: string | null;
  quote_amount: number | null;
  policy_number: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = ["new", "contacted", "quoted", "bound", "lost"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  quoted: "bg-purple-100 text-purple-700 border-purple-200",
  bound: "bg-green-100 text-green-700 border-green-200",
  lost: "bg-gray-100 text-gray-500 border-gray-200",
};

const STORAGE_LABELS: Record<string, string> = {
  home: "Home",
  safe: "Home Safe",
  bank_vault: "Bank Vault",
  storage_unit: "Storage Unit",
  other: "Other",
};

export default function AdminInsurancePage() {
  const [leads, setLeads] = useState<InsuranceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/insurance");
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLead = async (id: string, updates: Partial<InsuranceLead>) => {
    try {
      await fetch("/api/admin/insurance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      fetchLeads();
    } catch {
      alert("Failed to update lead");
    }
  };

  const exportCSV = () => {
    const headers = [
      "Name", "Email", "Phone", "Collection Value", "Cards", "Graded",
      "Storage", "Status", "Referred To", "Quote", "Policy #", "Date",
    ];
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.phone ?? "",
      l.estimated_collection_value?.toString() ?? "",
      l.number_of_cards?.toString() ?? "",
      l.has_graded_cards ? "Yes" : "No",
      STORAGE_LABELS[l.storage_method ?? ""] ?? l.storage_method ?? "",
      l.status,
      l.referred_to ?? "",
      l.quote_amount?.toString() ?? "",
      l.policy_number ?? "",
      new Date(l.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insurance-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLeads =
    filter === "all" ? leads : leads.filter((l) => l.status === filter);

  // Stats
  const totalValue = leads.reduce(
    (sum, l) => sum + (l.estimated_collection_value ?? 0),
    0
  );
  const boundLeads = leads.filter((l) => l.status === "bound").length;
  const conversionRate =
    leads.length > 0 ? ((boundLeads / leads.length) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            Insurance Referral Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage insurance referral inquiries from collectors
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: leads.length.toString(), icon: FileText },
          { label: "Conversion Rate", value: `${conversionRate}%`, icon: DollarSign },
          { label: "Bound Policies", value: boundLeads.toString(), icon: Shield },
          {
            label: "Total Value Referred",
            value: `$${totalValue.toLocaleString()}`,
            icon: DollarSign,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...STATUS_OPTIONS].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No leads found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const isExpanded = expandedId === lead.id;

            return (
              <Card key={lead.id}>
                <CardContent className="p-0">
                  {/* Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{lead.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${STATUS_COLORS[lead.status] ?? ""}`}
                        >
                          {lead.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </span>
                        )}
                        {lead.estimated_collection_value && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> ${lead.estimated_collection_value.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Cards Count</p>
                          <p className="text-sm font-medium">{lead.number_of_cards ?? "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Has Graded Cards</p>
                          <p className="text-sm font-medium">{lead.has_graded_cards ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Storage Method</p>
                          <p className="text-sm font-medium">
                            {STORAGE_LABELS[lead.storage_method ?? ""] ?? lead.storage_method ?? "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Consent to Contact</p>
                          <p className="text-sm font-medium">{lead.consent_to_contact ? "Yes" : "No"}</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Status Update */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Status</label>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLead(lead.id, { status: e.target.value })}
                            className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Referred To</label>
                          <input
                            type="text"
                            defaultValue={lead.referred_to ?? ""}
                            onBlur={(e) => updateLead(lead.id, { referred_to: e.target.value })}
                            className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                            placeholder="Agent/agency name"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Quote Amount</label>
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={lead.quote_amount ?? ""}
                            onBlur={(e) =>
                              updateLead(lead.id, {
                                quote_amount: parseFloat(e.target.value) || null,
                              } as Partial<InsuranceLead>)
                            }
                            className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                            placeholder="$0.00"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Policy Number</label>
                          <input
                            type="text"
                            defaultValue={lead.policy_number ?? ""}
                            onBlur={(e) => updateLead(lead.id, { policy_number: e.target.value })}
                            className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                            placeholder="Policy #"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Admin Notes</label>
                        <textarea
                          defaultValue={lead.admin_notes ?? ""}
                          onBlur={(e) => updateLead(lead.id, { admin_notes: e.target.value })}
                          rows={3}
                          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm resize-none"
                          placeholder="Follow-up notes..."
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-100 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-600">
          <strong>ℹ️ Note:</strong> Poké-Trade is not an insurance company.
          Insurance referral leads connect collectors with licensed insurance
          professionals. All insurance products are offered by licensed professionals
          through approved carrier partners.
        </p>
      </div>
    </div>
  );
}
