"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag, ChevronLeft, ChevronRight, Flag,
  Trash2, AlertTriangle, Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  condition: string;
  status: string;
  created_at: string;
  seller: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  card: { name: string; image_url: string | null; market_value: number | null } | null;
}

const statusColors: Record<string, string> = {
  active: "border-green-300 text-green-700 bg-green-50",
  sold: "border-blue-300 text-blue-700 bg-blue-50",
  cancelled: "border-red-300 text-red-700 bg-red-50",
  expired: "border-gray-300 text-gray-600 bg-gray-50",
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [showReported, setShowReported] = useState(false);
  const [reported, setReported] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (statusFilter) params.set("status", statusFilter);
    if (showReported) params.set("reported", "true");
    const res = await fetch(`/api/admin/listings?${params}`);
    const data = await res.json();
    if (showReported) {
      setReported(data.reports || []);
      setTotal(data.total || 0);
    } else {
      setListings(data.listings || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }, [page, statusFilter, showReported]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleAction = async (listingId: string, action: string, notes?: string) => {
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action, notes }),
    });
    fetchListings();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listing Moderation</h1>
        <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} listings</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!showReported ? "default" : "outline"}
          size="sm"
          onClick={() => { setShowReported(false); setPage(1); }}
          className="text-xs"
        >
          All Listings
        </Button>
        <Button
          variant={showReported ? "default" : "outline"}
          size="sm"
          onClick={() => { setShowReported(true); setPage(1); }}
          className="text-xs"
        >
          <AlertTriangle className="h-3 w-3 mr-1" /> Reported
        </Button>
        {!showReported && (
          <>
            <div className="w-px bg-gray-300 mx-1" />
            {["", "active", "sold", "cancelled", "expired"].map((s) => (
              <Button
                key={s || "all"}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className="text-xs"
              >
                {s || "All"}
              </Button>
            ))}
          </>
        )}
      </div>

      {/* Reported Listings */}
      {showReported ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-3 text-left font-medium text-gray-600">Listing</th>
                    <th className="p-3 text-left font-medium text-gray-600">Reporter</th>
                    <th className="p-3 text-left font-medium text-gray-600">Reason</th>
                    <th className="p-3 text-left font-medium text-gray-600">Date</th>
                    <th className="p-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="p-3"><Skeleton className="h-5 w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : reported.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No reported listings
                      </td>
                    </tr>
                  ) : (
                    reported.map((report: any, i: number) => (
                      <tr key={report.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                        <td className="p-3">
                          <div className="font-medium text-xs">{report.listing?.title || "Deleted"}</div>
                          {report.listing?.price && <div className="text-[10px] text-gray-500">${report.listing.price}</div>}
                        </td>
                        <td className="p-3 text-xs text-gray-600">
                          {report.reporter?.display_name || report.reporter?.username || "—"}
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-gray-900">{report.reason}</div>
                          {report.details && <div className="text-[10px] text-gray-500 mt-0.5">{report.details}</div>}
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {report.listing?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-red-600 border-red-300"
                                onClick={() => handleAction(report.listing.id, "remove", report.reason)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Remove
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Regular Listings Table */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="p-3 text-left font-medium text-gray-600">Card</th>
                    <th className="p-3 text-left font-medium text-gray-600">Title</th>
                    <th className="p-3 text-left font-medium text-gray-600">Seller</th>
                    <th className="p-3 text-left font-medium text-gray-600">Price</th>
                    <th className="p-3 text-left font-medium text-gray-600">Market</th>
                    <th className="p-3 text-left font-medium text-gray-600">Status</th>
                    <th className="p-3 text-left font-medium text-gray-600">Date</th>
                    <th className="p-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="p-3"><Skeleton className="h-5 w-16" /></td>
                        ))}
                      </tr>
                    ))
                  ) : listings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        No listings found
                      </td>
                    </tr>
                  ) : (
                    listings.map((listing, i) => {
                      const marketValue = listing.card?.market_value || 0;
                      const isInflated = marketValue > 0 && listing.price > marketValue * 3;
                      return (
                        <tr key={listing.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30`}>
                          <td className="p-3">
                            {listing.card?.image_url ? (
                              <img src={listing.card.image_url} alt="" className="h-10 w-7 rounded object-cover" />
                            ) : (
                              <div className="h-10 w-7 bg-gray-200 rounded" />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-xs text-gray-900">{listing.title}</div>
                            <div className="text-[10px] text-gray-500">{listing.condition}</div>
                          </td>
                          <td className="p-3 text-xs text-gray-600">
                            {listing.seller?.display_name || listing.seller?.username || "—"}
                          </td>
                          <td className="p-3">
                            <span className={`text-xs font-medium ${isInflated ? "text-red-600" : "text-gray-900"}`}>
                              ${listing.price}
                            </span>
                            {isInflated && (
                              <Badge variant="outline" className="ml-1 text-[8px] border-yellow-300 text-yellow-700 bg-yellow-50">
                                HIGH
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-xs text-gray-500">
                            {marketValue > 0 ? `$${marketValue}` : "—"}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[10px] ${statusColors[listing.status] || ""}`}>
                              {listing.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-gray-500">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleAction(listing.id, "flag")}
                              >
                                <Flag className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-600"
                                onClick={() => handleAction(listing.id, "remove")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
