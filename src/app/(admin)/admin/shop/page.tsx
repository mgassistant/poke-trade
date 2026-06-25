"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package, Plus, Loader2, Search, Edit, Archive,
  ShoppingBag, AlertTriangle, Truck, DollarSign,
  RefreshCw, Eye, X, Save, Hash,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  inventory_count: number;
  reserved_count: number;
  sold_count: number;
  member_price: number | null;
  public_price: number | null;
  market_price: number | null;
  msrp_price: number | null;
  premium_member_price: number | null;
  cost_basis: number | null;
  requires_membership: boolean;
  premium_only: boolean;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  user_id: string;
  tracking_number: string | null;
  fraud_status: string | null;
  manual_review_reason: string | null;
  created_at: string;
  items: { quantity: number; unit_price: number; price_type: string }[];
}

type Tab = "products" | "orders" | "fraud";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  sold_out: "bg-red-100 text-red-700",
  archived: "bg-gray-100 text-gray-500",
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  canceled: "bg-gray-100 text-gray-600",
  refunded: "bg-red-100 text-red-600",
  manual_review: "bg-amber-100 text-amber-700",
};

export default function AdminShopPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "products") {
        const res = await fetch("/api/shop/products?status=all");
        const data = await res.json();
        // Also fetch draft and archived
        const res2 = await fetch("/api/shop/products?status=draft");
        const data2 = await res2.json();
        const res3 = await fetch("/api/shop/products?status=archived");
        const data3 = await res3.json();
        const all = [...(data.products ?? []), ...(data2.products ?? []), ...(data3.products ?? [])];
        const unique = Array.from(new Map(all.map((p: Product) => [p.id, p])).values());
        setProducts(unique as Product[]);
      } else if (tab === "orders" || tab === "fraud") {
        const statusParam = tab === "fraud" ? "&status=manual_review" : "";
        const res = await fetch(`/api/shop/orders?all=true${statusParam}`);
        const data = await res.json();
        setOrders(data.orders ?? []);
      }
    } catch {
      // Silent
    }
    setLoading(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/shop/seed", { method: "POST" });
      const data = await res.json();
      setMessage(`Seeded ${data.seeded} products!`);
      fetchData();
    } catch {
      setMessage("Seed failed");
    }
    setSeeding(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleArchive = async (slug: string) => {
    try {
      await fetch(`/api/shop/products/${slug}`, { method: "DELETE" });
      fetchData();
    } catch {
      // Silent
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/shop/products/${editingProduct.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingProduct(null);
        setEditForm({});
        fetchData();
        setMessage("Product updated!");
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      // Silent
    }
    setSaving(false);
  };

  const handleUpdateOrder = async (orderId: string, updates: Record<string, string>) => {
    try {
      await fetch(`/api/shop/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchData();
    } catch {
      // Silent
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Management</h1>
          <p className="text-sm text-gray-500 mt-1">Products, orders, and inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Seed Data
          </Button>
        </div>
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm mb-4">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {([
          { key: "products", label: "Products", icon: Package },
          { key: "orders", label: "Orders", icon: ShoppingBag },
          { key: "fraud", label: "Fraud Review", icon: AlertTriangle },
        ] as { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]).map(
          (t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                tab === t.key
                  ? "bg-white text-gray-900 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      ) : tab === "products" ? (
        <div>
          {/* Search */}
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Product Edit Modal */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Edit Product</h3>
                  <button onClick={() => setEditingProduct(null)}>
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    { key: "title", label: "Title", type: "text" },
                    { key: "status", label: "Status", type: "text" },
                    { key: "msrp_price", label: "MSRP Price", type: "number" },
                    { key: "market_price", label: "Market Price", type: "number" },
                    { key: "member_price", label: "Member Price", type: "number" },
                    { key: "premium_member_price", label: "Premium Price", type: "number" },
                    { key: "public_price", label: "Public Price", type: "number" },
                    { key: "cost_basis", label: "Cost Basis", type: "number" },
                    { key: "inventory_count", label: "Inventory", type: "number" },
                    { key: "max_qty_per_member", label: "Max Qty/Member", type: "number" },
                    { key: "max_qty_per_household", label: "Max Qty/Household", type: "number" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-xs text-gray-500 mb-1 block">{field.label}</label>
                      <Input
                        type={field.type}
                        value={
                          editForm[field.key] !== undefined
                            ? String(editForm[field.key])
                            : String((editingProduct as Record<string, unknown>)[field.key] ?? "")
                        }
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            [field.key]:
                              field.type === "number"
                                ? parseFloat(e.target.value) || 0
                                : e.target.value,
                          }))
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleSaveProduct}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingProduct(null); setEditForm({}); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Product Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Member $</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Stock</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Sold</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 max-w-[200px] truncate">
                          {product.title}
                        </div>
                        <div className="text-xs text-gray-400">{product.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {product.category.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${STATUS_COLORS[product.status] ?? ""} border-0 text-[10px]`}>
                          {product.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {product.member_price ? `$${product.member_price.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={product.inventory_count <= 3 ? "text-red-600 font-medium" : "text-gray-700"}>
                          {product.inventory_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{product.sold_count}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingProduct(product); setEditForm({}); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={`/shop/${product.slug}`}
                            target="_blank"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </a>
                          {product.status !== "archived" && (
                            <button
                              onClick={() => handleArchive(product.slug)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Archive"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">
                No products found. Click &quot;Seed Data&quot; to add sample products.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Orders / Fraud tab */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                {tab === "fraud" ? "No orders flagged for review." : "No orders yet."}
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`${STATUS_COLORS[order.status] ?? ""} border-0 text-[10px]`}>
                      {order.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-gray-400 font-mono">
                      {order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                </div>

                {order.fraud_status && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-3">
                    <strong>Fraud flag:</strong> {order.manual_review_reason || order.fraud_status}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {order.status === "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => handleUpdateOrder(order.id, { status: "processing" })}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Mark Processing
                    </Button>
                  )}
                  {order.status === "processing" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => {
                        const tracking = prompt("Enter tracking number:");
                        if (tracking) {
                          handleUpdateOrder(order.id, {
                            status: "shipped",
                            tracking_number: tracking,
                          });
                        }
                      }}
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      Ship
                    </Button>
                  )}
                  {order.status === "manual_review" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleUpdateOrder(order.id, { status: "paid", fraud_status: "cleared" })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleUpdateOrder(order.id, { status: "canceled", fraud_status: "rejected" })}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
