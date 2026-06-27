"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package, Plus, Bell, Trash2, Edit, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Loader2, Activity, AlertTriangle,
  Clock, Filter, RefreshCw, Zap, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ═══════════════ Types ═══════════════

interface DropProduct {
  id: string;
  retailer: string;
  product_name: string;
  product_url: string | null;
  image_url: string | null;
  retail_price: number | null;
  current_price: number | null;
  in_stock: boolean;
  last_in_stock_at: string | null;
  category: string | null;
  set_name: string | null;
  release_date: string | null;
  created_at: string;
}

interface DropAlert {
  id: string;
  product_id: string;
  alert_type: string;
  previous_state: Record<string, any> | null;
  new_state: Record<string, any> | null;
  notified: boolean;
  created_at: string;
  drop_products: {
    product_name: string;
    retailer: string;
    image_url: string | null;
    current_price: number | null;
  };
}

interface StockCheck {
  id: string;
  product_id: string;
  in_stock: boolean;
  price: number | null;
  stock_quantity: number | null;
  response_ms: number | null;
  error: string | null;
  created_at: string;
  drop_products: {
    product_name: string;
    retailer: string;
  };
}

// ═══════════════ Helpers ═══════════════

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function alertBadge(type: string) {
  switch (type) {
    case "restock": return { label: "🟢 Restock", className: "border-green-300 text-green-700 bg-green-50" };
    case "price_drop": return { label: "📉 Price Drop", className: "border-blue-300 text-blue-700 bg-blue-50" };
    case "back_oos": return { label: "🔴 Out of Stock", className: "border-red-300 text-red-700 bg-red-50" };
    case "manual_alert": return { label: "🔔 Manual", className: "border-yellow-300 text-yellow-700 bg-yellow-50" };
    default: return { label: type, className: "border-gray-300 text-gray-700 bg-gray-50" };
  }
}

function stateChangeText(alert: DropAlert): string {
  const prev = alert.previous_state;
  const next = alert.new_state;
  if (!prev || !next) return "—";

  if (alert.alert_type === "restock") {
    return `Was OOS → Now In Stock${next.price ? ` ($${next.price})` : ""}`;
  }
  if (alert.alert_type === "back_oos") {
    return `Was In Stock → Now OOS`;
  }
  if (alert.alert_type === "price_drop") {
    return `$${prev.price || "?"} → $${next.price || "?"}`;
  }
  return "—";
}

// ═══════════════ Tab: Products ═══════════════

function ProductsTab() {
  const [products, setProducts] = useState<DropProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({
    retailer: "", product_name: "", product_url: "", image_url: "",
    retail_price: "", category: "", set_name: "", release_date: "",
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/drops?page=${page}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/drops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        retail_price: form.retail_price ? parseFloat(form.retail_price) : null,
      }),
    });
    setShowForm(false);
    setForm({ retailer: "", product_name: "", product_url: "", image_url: "", retail_price: "", category: "", set_name: "", release_date: "" });
    fetchProducts();
  };

  const toggleStock = async (id: string, currentStock: boolean) => {
    await fetch("/api/admin/drops", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, in_stock: !currentStock }),
    });
    fetchProducts();
  };

  const triggerAlert = async (id: string) => {
    await fetch("/api/admin/drops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "trigger_alert", productId: id }),
    });
  };

  const deleteProduct = async (id: string) => {
    await fetch(`/api/admin/drops?id=${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const seedProducts = async () => {
    setSeeding(true);
    await fetch("/api/drops/seed", { method: "POST" }).catch(() => {});
    setSeeding(false);
    fetchProducts();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{total} products tracked</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={seedProducts} disabled={seeding}>
            {seeding ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Package className="h-3 w-3 mr-1" />}
            Seed Products
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3 w-3 mr-1" /> Add Product
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Add Drop Product</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <Input placeholder="Retailer *" value={form.retailer} onChange={(e) => setForm({ ...form, retailer: e.target.value })} required />
              <Input placeholder="Product Name *" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required />
              <Input placeholder="Product URL" value={form.product_url} onChange={(e) => setForm({ ...form, product_url: e.target.value })} />
              <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              <Input placeholder="Retail Price" type="number" step="0.01" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: e.target.value })} />
              <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <Input placeholder="Set Name" value={form.set_name} onChange={(e) => setForm({ ...form, set_name: e.target.value })} />
              <Input placeholder="Release Date" type="date" value={form.release_date} onChange={(e) => setForm({ ...form, release_date: e.target.value })} />
              <div className="col-span-2 flex gap-2">
                <Button type="submit" size="sm">Save Product</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 text-left font-medium text-gray-600">Product</th>
                  <th className="p-3 text-left font-medium text-gray-600">Retailer</th>
                  <th className="p-3 text-left font-medium text-gray-600">Price</th>
                  <th className="p-3 text-left font-medium text-gray-600">Stock</th>
                  <th className="p-3 text-left font-medium text-gray-600">Category</th>
                  <th className="p-3 text-left font-medium text-gray-600">Added</th>
                  <th className="p-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="p-3"><Skeleton className="h-5 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No drop products yet
                    </td>
                  </tr>
                ) : (
                  products.map((product, i) => (
                    <tr key={product.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {product.image_url && <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                          <div>
                            <div className="font-medium text-xs text-gray-900">{product.product_name}</div>
                            {product.set_name && <div className="text-[10px] text-gray-500">{product.set_name}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-gray-600">{product.retailer}</td>
                      <td className="p-3 text-xs text-gray-900">{product.retail_price ? `$${product.retail_price}` : "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] cursor-pointer ${product.in_stock ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}`} onClick={() => toggleStock(product.id, product.in_stock)}>
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-500">{product.category || "—"}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(product.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={() => triggerAlert(product.id)} title="Trigger Alert">
                            <Bell className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => deleteProduct(product.id)} title="Delete">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
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
    </div>
  );
}

// ═══════════════ Tab: Alerts ═══════════════

function AlertsTab() {
  const [alerts, setAlerts] = useState<DropAlert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [retailers, setRetailers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState("");
  const [filterRetailer, setFilterRetailer] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filterType) params.set("alert_type", filterType);
    if (filterRetailer) params.set("retailer", filterRetailer);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);

    const res = await fetch(`/api/admin/drops/alerts?${params}`);
    const data = await res.json();
    setAlerts(data.alerts || []);
    setTotal(data.total || 0);
    setRetailers(data.retailers || []);
    setLoading(false);
  }, [page, filterType, filterRetailer, dateFrom, dateTo]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const runMonitor = async () => {
    setRunning(true);
    await fetch("/api/drops/monitor").catch(() => {});
    setRunning(false);
    fetchAlerts();
  };

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              >
                <option value="">All Types</option>
                <option value="restock">🟢 Restock</option>
                <option value="price_drop">📉 Price Drop</option>
                <option value="back_oos">🔴 Out of Stock</option>
                <option value="manual_alert">🔔 Manual</option>
              </select>
              <select
                className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
                value={filterRetailer}
                onChange={(e) => { setFilterRetailer(e.target.value); setPage(1); }}
              >
                <option value="">All Retailers</option>
                {retailers.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" className="h-8 text-xs w-36" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              <span className="text-xs text-gray-400">to</span>
              <Input type="date" className="h-8 text-xs w-36" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            <div className="ml-auto">
              <Button size="sm" onClick={runMonitor} disabled={running}>
                {running ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                Run Monitor Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 text-left font-medium text-gray-600">Type</th>
                  <th className="p-3 text-left font-medium text-gray-600">Product</th>
                  <th className="p-3 text-left font-medium text-gray-600">Retailer</th>
                  <th className="p-3 text-left font-medium text-gray-600">Change</th>
                  <th className="p-3 text-left font-medium text-gray-600">Time</th>
                  <th className="p-3 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="p-3"><Skeleton className="h-5 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No alerts yet
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert, i) => {
                    const badge = alertBadge(alert.alert_type);
                    return (
                      <tr key={alert.id} className={`border-b border-gray-100 ${i % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30`}>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {alert.drop_products?.image_url && (
                              <img src={alert.drop_products.image_url} alt="" className="h-7 w-7 rounded object-cover" />
                            )}
                            <span className="text-xs font-medium text-gray-900">{alert.drop_products?.product_name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-gray-600">{alert.drop_products?.retailer || "—"}</td>
                        <td className="p-3 text-xs text-gray-700">{stateChangeText(alert)}</td>
                        <td className="p-3 text-xs text-gray-500">{formatTime(alert.created_at)}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${alert.notified ? "border-green-300 text-green-700 bg-green-50" : "border-yellow-300 text-yellow-700 bg-yellow-50"}`}>
                            {alert.notified ? "Sent" : "Pending"}
                          </Badge>
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
              <p className="text-xs text-gray-500">Page {page} of {totalPages} ({total} alerts)</p>
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
    </div>
  );
}

// ═══════════════ Tab: Monitor Status ═══════════════

function MonitorStatusTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/drops/status");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const runMonitor = async () => {
    setRunning(true);
    await fetch("/api/drops/monitor").catch(() => {});
    setRunning(false);
    fetchStatus();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const stats = data?.stats || {};
  const checks: StockCheck[] = data?.checks || [];
  const retailerCounts: Record<string, number> = data?.retailerCounts || {};

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Last Check</div>
                <div className="text-sm font-semibold text-gray-900">
                  {data?.lastCheck ? formatTime(data.lastCheck.time) : "Never"}
                </div>
                {data?.lastCheck && (
                  <Badge variant="outline" className={`text-[9px] mt-0.5 ${data.lastCheck.status === "success" ? "border-green-300 text-green-700 bg-green-50" : "border-red-300 text-red-700 bg-red-50"}`}>
                    {data.lastCheck.status}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Active Products</div>
                <div className="text-2xl font-bold text-gray-900">{data?.activeProducts || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Success Rate</div>
                <div className="text-2xl font-bold text-gray-900">{stats.successRate || 0}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Avg Response</div>
                <div className="text-2xl font-bold text-gray-900">{stats.avgResponseMs || 0}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retailers + Run Monitor */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Products by Retailer</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(retailerCounts).length === 0 ? (
              <p className="text-sm text-gray-400">No active products</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(retailerCounts).sort(([, a], [, b]) => b - a).map(([retailer, count]) => (
                  <div key={retailer} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{retailer}</span>
                    <Badge variant="outline" className="text-xs">{count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monitor Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={runMonitor} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Run Monitor Now
            </Button>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{stats.totalChecks || 0}</div>
                <div className="text-xs text-gray-500">Recent Checks</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{stats.errorCount || 0}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Stock Checks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Stock Checks (Last 50)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="p-3 text-left font-medium text-gray-600">Product</th>
                  <th className="p-3 text-left font-medium text-gray-600">Retailer</th>
                  <th className="p-3 text-left font-medium text-gray-600">In Stock</th>
                  <th className="p-3 text-left font-medium text-gray-600">Price</th>
                  <th className="p-3 text-left font-medium text-gray-600">Response</th>
                  <th className="p-3 text-left font-medium text-gray-600">Time</th>
                  <th className="p-3 text-left font-medium text-gray-600">Error</th>
                </tr>
              </thead>
              <tbody>
                {checks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No stock checks yet
                    </td>
                  </tr>
                ) : (
                  checks.map((check, i) => (
                    <tr key={check.id} className={`border-b border-gray-100 ${check.error ? "bg-red-50/50" : i % 2 === 1 ? "bg-gray-50/50" : ""} hover:bg-blue-50/30`}>
                      <td className="p-3 text-xs font-medium text-gray-900">{check.drop_products?.product_name || "—"}</td>
                      <td className="p-3 text-xs text-gray-600">{check.drop_products?.retailer || "—"}</td>
                      <td className="p-3">
                        {check.in_stock ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-900">{check.price ? `$${check.price}` : "—"}</td>
                      <td className="p-3 text-xs text-gray-500">{check.response_ms ? `${check.response_ms}ms` : "—"}</td>
                      <td className="p-3 text-xs text-gray-500">{formatTime(check.created_at)}</td>
                      <td className="p-3 text-xs text-red-600 max-w-[200px] truncate">{check.error || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════ Main Page ═══════════════

export default function DropsPage() {
  const [tab, setTab] = useState("products");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drop Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage products, alerts, and monitoring</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="products">
            <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Products</span>
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <span className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="status">
            <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Monitor Status</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <AlertsTab />
        </TabsContent>
        <TabsContent value="status" className="mt-4">
          <MonitorStatusTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
