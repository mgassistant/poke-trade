"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Shield, Download, Search, FileText,
  Phone, Mail, DollarSign, Calendar, ChevronDown, ChevronUp,
  Users, TrendingUp, Filter, ArrowUpDown, CheckCircle, X
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
  estimated_collection_value: number | string | null;
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

interface ParsedNotes {
  collection_types?: string[];
  current_insurance?: string;
  message?: string;
  member_tier?: string;
  trust_score?: number;
  has_verified_portfolio?: boolean;
  consent_portfolio_share?: boolean;
  portfolio_summary?: any;
  collection_stats?: any;
  assigned_agent?: string;
  insurance_partner?: string;
  referral_revenue?: number;
  renewal_date?: string;
}

const STATUS_OPTIONS = ["new", "contacted", "quoted", "bound", "lost"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  quoted: "bg-purple-100 text-purple-700 border-purple-200",
  bound: "bg-green-100 text-green-700 border-green-200",
  lost: "bg-gray-100 text-gray-500 border-gray-200",
};

const TIER_COLORS: Record<string, string> = {
  elite: "bg-purple-100 text-purple-700 border-purple-200",
  pro: "bg-blue-100 text-blue-700 border-blue-200",
  free: "bg-gray-100 text-gray-600 border-gray-200",
};

const STORAGE_LABELS: Record<string, string> = {
  home: "Home",
  safe: "Home Safe",
  bank_vault: "Bank Vault",
  storage_unit: "Storage Unit",
  other: "Other",
};

type SortField = "created_at" | "estimated_collection_value" | "status";
type SortDir = "asc" | "desc";

function parseNotes(notes: string | null): ParsedNotes {
  if (!notes) return {};
  try {
    return JSON.parse(notes);
  } catch {
    return { message: notes };
  }
}

function formatValue(val: number | string | null | undefined): string {
  if (val == null) return "N/A";
  if (typeof val === "string") return val;
  return `$${val.toLocaleString()}`;
}

export default function AdminInsurancePage() {
  const [leads, setLeads] = useState<InsuranceLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [portfolioFilter, setPortfolioFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  const updateLead = async (id: string, updates: Record<string, any>) => {
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

  const updateNotes = (id: string, lead: InsuranceLead, noteUpdates: Partial<ParsedNotes>) => {
    const existing = parseNotes(lead.admin_notes);
    const merged = { ...existing, ...noteUpdates };
    updateLead(id, { admin_notes: JSON.stringify(merged) });
  };

  // Filtering & sorting
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.phone && l.phone.includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }

    // Tier filter
    if (tierFilter !== "all") {
      result = result.filter((l) => {
        const notes = parseNotes(l.admin_notes);
        return (notes.member_tier || "free") === tierFilter;
      });
    }

    // Portfolio filter
    if (portfolioFilter !== "all") {
      result = result.filter((l) => {
        const notes = parseNotes(l.admin_notes);
        const has = !!notes.has_verified_portfolio;
        return portfolioFilter === "yes" ? has : !has;
      });
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "estimated_collection_value") {
        const aVal = typeof a.estimated_collection_value === "number" ? a.estimated_collection_value : 0;
        const bVal = typeof b.estimated_collection_value === "number" ? b.estimated_collection_value : 0;
        cmp = aVal - bVal;
      } else if (sortField === "status") {
        cmp = STATUS_OPTIONS.indexOf(a.status) - STATUS_OPTIONS.indexOf(b.status);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [leads, searchQuery, statusFilter, tierFilter, portfolioFilter, sortField, sortDir]);

  const exportCSV = () => {
    const headers = [
      "Name", "Email", "Phone", "Collection Value", "Cards", "Graded",
      "Storage", "Status", "Member Tier", "Portfolio", "Collection Types",
      "Assigned Agent", "Insurance Partner", "Referral Revenue",
      "Renewal Date", "Referred To", "Quote", "Policy #", "Date",
    ];
    const rows = filteredLeads.map((l) => {
      const notes = parseNotes(l.admin_notes);
      return [
        l.name, l.email, l.phone ?? "",
        typeof l.estimated_collection_value === "number" ? l.estimated_collection_value.toString() : (l.estimated_collection_value ?? ""),
        l.number_of_cards?.toString() ?? "",
        l.has_graded_cards ? "Yes" : "No",
        STORAGE_LABELS[l.storage_method ?? ""] ?? l.storage_method ?? "",
        l.status,
        notes.member_tier || "free",
        notes.has_verified_portfolio ? "Yes" : "No",
        (notes.collection_types || []).join("; "),
        notes.assigned_agent || "",
        notes.insurance_partner || "",
        notes.referral_revenue?.toString() || "",
        notes.renewal_date || "",
        l.referred_to ?? "", l.quote_amount?.toString() ?? "",
        l.policy_number ?? "",
        new Date(l.created_at).toLocaleDateString(),
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insurance-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalValue = leads.reduce((sum, l) => {
    const v = typeof l.estimated_collection_value === "number" ? l.estimated_collection_value : 0;
    return sum + v;
  }, 0);
  const quotedLeads = leads.filter((l) => l.status === "quoted").length;
  const boundLeads = leads.filter((l) => l.status === "bound").length;
  const totalRevenue = leads.reduce((sum, l) => {
    const notes = parseNotes(l.admin_notes);
    return sum + (notes.referral_revenue || 0);
  }, 0);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Insurance CRM
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage collector insurance leads, quotes, and policies
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Leads", value: leads.length.toString(), icon: Users, color: "text-blue-600" },
          { label: "Quoted", value: quotedLeads.toString(), icon: FileText, color: "text-purple-600" },
          { label: "Bound", value: boundLeads.toString(), icon: CheckCircle, color: "text-green-600" },
          { label: "Est. Value", value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-amber-600" },
          { label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Filters:</span>
          </div>

          {/* Status */}
          <div className="flex gap-1 flex-wrap">
            {["all", ...STATUS_OPTIONS].map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setStatusFilter(f)}
              >
                {f === "all" ? "All Status" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-5" />

          {/* Tier */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-7 rounded-md border border-gray-200 bg-white px-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
          </select>

          {/* Portfolio */}
          <select
            value={portfolioFilter}
            onChange={(e) => setPortfolioFilter(e.target.value)}
            className="h-7 rounded-md border border-gray-200 bg-white px-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Portfolios</option>
            <option value="yes">Has Portfolio</option>
            <option value="no">No Portfolio</option>
          </select>

          <Separator orientation="vertical" className="h-5" />

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Sort:</span>
          </div>
          {(
            [
              { field: "created_at" as SortField, label: "Date" },
              { field: "estimated_collection_value" as SortField, label: "Value" },
              { field: "status" as SortField, label: "Status" },
            ] as const
          ).map((s) => (
            <Button
              key={s.field}
              variant={sortField === s.field ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => toggleSort(s.field)}
            >
              {s.label} {sortField === s.field && (sortDir === "desc" ? "↓" : "↑")}
            </Button>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          Showing {filteredLeads.length} of {leads.length} leads
        </p>
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
            const notes = parseNotes(lead.admin_notes);
            const tier = notes.member_tier || "free";

            return (
              <Card key={lead.id} className={isExpanded ? "ring-2 ring-blue-200" : ""}>
                <CardContent className="p-0">
                  {/* Summary Row */}
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
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${TIER_COLORS[tier] ?? TIER_COLORS.free}`}
                        >
                          {tier.toUpperCase()}
                        </Badge>
                        {notes.has_verified_portfolio && (
                          <span className="text-xs" title="Verified Portfolio">✅</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <DollarSign className="h-3 w-3" /> {formatValue(lead.estimated_collection_value)}
                        </span>
                        {notes.collection_types && notes.collection_types.length > 0 && (
                          <span className="hidden sm:flex items-center gap-1">
                            {notes.collection_types.slice(0, 3).map((t: string) => (
                              <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">
                                {t}
                              </Badge>
                            ))}
                            {notes.collection_types.length > 3 && (
                              <span className="text-[9px] text-gray-400">
                                +{notes.collection_types.length - 3}
                              </span>
                            )}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{" "}
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-5">
                      {/* Lead Info Grid */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Lead Information
                        </h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Cards Count</p>
                            <p className="text-sm font-medium">{lead.number_of_cards ?? "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Has Graded Cards</p>
                            <p className="text-sm font-medium">
                              {lead.has_graded_cards ? "Yes" : "No"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Storage Method</p>
                            <p className="text-sm font-medium">
                              {STORAGE_LABELS[lead.storage_method ?? ""] ??
                                lead.storage_method ??
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Current Insurance</p>
                            <p className="text-sm font-medium">
                              {notes.current_insurance || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Trust Score</p>
                            <p className="text-sm font-medium">
                              {notes.trust_score ? `${notes.trust_score}/100` : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Portfolio Shared</p>
                            <p className="text-sm font-medium">
                              {notes.consent_portfolio_share ? "✅ Yes" : "❌ No"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Consent to Contact</p>
                            <p className="text-sm font-medium">
                              {lead.consent_to_contact ? "Yes" : "No"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">User ID</p>
                            <p className="text-sm font-medium font-mono text-[11px]">
                              {lead.user_id ? lead.user_id.slice(0, 8) + "…" : "Guest"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Collection Types */}
                      {notes.collection_types && notes.collection_types.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Collection Types</p>
                          <div className="flex flex-wrap gap-1.5">
                            {notes.collection_types.map((t: string) => (
                              <Badge key={t} variant="outline" className="text-xs">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Customer Message */}
                      {notes.message && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Customer Message</p>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                            {notes.message}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* CRM Fields */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          CRM Management
                        </h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Status
                            </label>
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
                            <label className="text-xs text-muted-foreground block mb-1">
                              Assigned Agent
                            </label>
                            <input
                              type="text"
                              defaultValue={notes.assigned_agent ?? ""}
                              onBlur={(e) =>
                                updateNotes(lead.id, lead, {
                                  assigned_agent: e.target.value,
                                })
                              }
                              className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                              placeholder="Agent name"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Insurance Partner
                            </label>
                            <input
                              type="text"
                              defaultValue={notes.insurance_partner ?? lead.referred_to ?? ""}
                              onBlur={(e) => {
                                updateLead(lead.id, { referred_to: e.target.value });
                                updateNotes(lead.id, lead, {
                                  insurance_partner: e.target.value,
                                });
                              }}
                              className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                              placeholder="Partner / agency"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Quote Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={lead.quote_amount ?? ""}
                              onBlur={(e) =>
                                updateLead(lead.id, {
                                  quote_amount: parseFloat(e.target.value) || null,
                                })
                              }
                              className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                              placeholder="$0.00"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Referral Revenue
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={notes.referral_revenue ?? ""}
                              onBlur={(e) =>
                                updateNotes(lead.id, lead, {
                                  referral_revenue: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                              placeholder="$0.00"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Renewal Date
                            </label>
                            <input
                              type="date"
                              defaultValue={notes.renewal_date ?? ""}
                              onBlur={(e) =>
                                updateNotes(lead.id, lead, {
                                  renewal_date: e.target.value,
                                })
                              }
                              className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Policy Number
                            </label>
                            <input
                              type="text"
                              defaultValue={lead.policy_number ?? ""}
                              onBlur={(e) =>
                                updateLead(lead.id, { policy_number: e.target.value })
                              }
                              className="w-full h-9 rounded-md border border-border bg-white px-3 text-sm"
                              placeholder="Policy #"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          Internal Notes
                        </label>
                        <textarea
                          defaultValue={notes.message || ""}
                          onBlur={(e) => {
                            // Preserve structured notes, update message
                            const existing = parseNotes(lead.admin_notes);
                            existing.message = e.target.value;
                            updateLead(lead.id, {
                              admin_notes: JSON.stringify(existing),
                            });
                          }}
                          rows={3}
                          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm resize-none"
                          placeholder="Follow-up notes, reminders..."
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
          <strong>ℹ️ Note:</strong> Poké-Trade is not an insurance company. Insurance
          referral leads connect collectors with licensed insurance professionals. All
          insurance products are offered by licensed professionals through approved
          carrier partners.
        </p>
      </div>
    </div>
  );
}
