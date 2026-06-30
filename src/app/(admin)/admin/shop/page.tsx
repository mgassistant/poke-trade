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
  images: string[] | null;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  user_id: string;
  tracking_number: string | null;
  shipping_name: string | null;
  shipping_address: Record<string, string> | null;
  stripe_payment_intent_id: string | null;
  admin_notes: string | null;
  fraud_status: string | null;
  manual_review_reason: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  created_at: string;
  items: { quantity: number; unit_price: number; price_type: string; product_snapshot?: Record<string, unknown> }[];
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState<Record<string, string>>({});
  const [savingOrder, setSavingOrder] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<Record<string, string | number | boolean>>({
    title: "",
    slug: "",
    description: "",
    category: "sealed",
    condition: "Factory Sealed",
    product_type: "",
    msrp_price: 0,
    market_price: 0,
    member_price: 0,
    premium_member_price: 0,
    public_price: 0,
    cost_basis: 0,
    inventory_count: 0,
    max_qty_per_member: 1,
    max_qty_per_household: 2,
    status: "draft",
    requires_membership: false,
    premium_only: false,
    sku: "",
    upc: "",
    set_name: "",
    card_name: "",
    card_number: "",
    rarity: "",
    grade: "",
    grading_company: "",
    language: "English",
    brand: "Pokémon",
    shipping_weight_oz: 0,
    handling_days: 3,
    marketplace_ready: false,
    ebay_price: 0,
    tcgplayer_price: 0,
    amazon_price: 0,
  });
  const [creating, setCreating] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File, slug?: string) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', slug || String(createForm.slug || createForm.title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      const res = await fetch('/api/shop/products/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setProductImages(prev => [...prev, data.url]);
        return data.url;
      }
    } catch {}
    setUploadingImage(false);
    return null;
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch products for stats
      const res = await fetch("/api/shop/products?status=all");
      const data = await res.json();
      const res2 = await fetch("/api/shop/products?status=draft");
      const data2 = await res2.json();
      const res3 = await fetch("/api/shop/products?status=archived");
      const data3 = await res3.json();
      const all = [...(data.products ?? []), ...(data2.products ?? []), ...(data3.products ?? [])];
      const unique = Array.from(new Map(all.map((p: Product) => [p.id, p])).values());
      setProducts(unique as Product[]);

      // Always fetch orders for stats
      const statusParam = tab === "fraud" ? "&status=manual_review" : "";
      const ordersRes = await fetch(`/api/shop/orders?all=true${statusParam}`);
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders ?? []);
    } catch {
      // Silent
    }
    setLoading(false);
  };

  const handleCreateProduct = async () => {
    setCreating(true);
    try {
      // Auto-generate slug from title if empty
      const slug = (createForm.slug as string) || (createForm.title as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const payload = { ...createForm, slug, images: productImages };
      
      const res = await fetch("/api/shop/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setProductImages([]);
        setCreateForm({
          title: "", slug: "", description: "", category: "sealed", condition: "Factory Sealed",
          product_type: "", msrp_price: 0, market_price: 0, member_price: 0, premium_member_price: 0,
          public_price: 0, cost_basis: 0, inventory_count: 0, max_qty_per_member: 1,
          max_qty_per_household: 2, status: "draft", requires_membership: false, premium_only: false,
        });
        fetchData();
        setMessage("Product created!");
        setTimeout(() => setMessage(null), 3000);
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error}`);
        setTimeout(() => setMessage(null), 5000);
      }
    } catch {
      setMessage("Failed to create product");
      setTimeout(() => setMessage(null), 3000);
    }
    setCreating(false);
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
        body: JSON.stringify({ ...editForm, images: productImages }),
      });
      if (res.ok) {
        setEditingProduct(null);
        setEditForm({});
        setProductImages([]);
        fetchData();
        setMessage("Product updated!");
        setTimeout(() => setMessage(null), 3000);
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error || 'Update failed'}`);
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message || 'Update failed'}`);
      setTimeout(() => setMessage(null), 5000);
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
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium">Products</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{products.length}</div>
          <div className="text-xs text-gray-400">{products.filter((p) => p.status === "active").length} active</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-medium">Total Inventory</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{products.reduce((s, p) => s + p.inventory_count, 0)}</div>
          <div className="text-xs text-gray-400">{products.filter((p) => p.inventory_count <= 3 && p.inventory_count > 0).length} low stock</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium">Total Sold</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{products.reduce((s, p) => s + (p.sold_count || 0), 0)}</div>
          <div className="text-xs text-gray-400">${products.reduce((s, p) => s + (p.sold_count || 0) * (p.public_price || 0), 0).toFixed(0)} revenue</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Truck className="h-4 w-4" />
            <span className="text-xs font-medium">Orders</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          <div className="text-xs text-gray-400">{orders.filter((o) => o.status === "paid" || o.status === "processing").length} pending ship</div>
        </div>
      </div>

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

          {/* Create Product Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Create New Product</h3>
                  <button onClick={() => setShowCreateForm(false)}>
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Title *</label>
                    <Input
                      value={String(createForm.title)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Pokémon TCG: Prismatic Evolutions Booster Box"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Slug (auto-generated)</label>
                    <Input
                      value={String(createForm.slug)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="auto-from-title"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Category</label>
                    <select
                      value={String(createForm.category)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm"
                    >
                      <option value="sealed">Sealed Product</option>
                      <option value="singles">Single Card</option>
                      <option value="graded">Graded Card</option>
                      <option value="accessories">Accessories</option>
                      <option value="bundles">Bundles</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">Description</label>
                    <textarea
                      value={String(createForm.description)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm h-20 resize-none"
                      placeholder="Product description..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Condition</label>
                    <Input
                      value={String(createForm.condition)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, condition: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Product Type</label>
                    <Input
                      value={String(createForm.product_type)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, product_type: e.target.value }))}
                      placeholder="Booster Box, ETB, Single Card..."
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Status</label>
                    <select
                      value={String(createForm.status)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
                      className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active (Visible)</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  {/* Drop Scheduling (visible when status = scheduled) */}
                  {createForm.status === 'scheduled' && (
                    <>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Scheduled Release</label>
                        <Input type="datetime-local" value={String(createForm.scheduled_at || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, scheduled_at: e.target.value }))} className="h-9" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Elite Early Access</label>
                        <Input type="datetime-local" value={String(createForm.elite_early_access_at || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, elite_early_access_at: e.target.value }))} className="h-9" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Pro Early Access</label>
                        <Input type="datetime-local" value={String(createForm.pro_early_access_at || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, pro_early_access_at: e.target.value }))} className="h-9" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">Release Notes</label>
                        <textarea value={String(createForm.release_notes || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, release_notes: e.target.value }))} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm h-16 resize-none" placeholder="Drop details, quantity info..." />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Inventory Count</label>
                    <Input
                      type="number"
                      value={String(createForm.inventory_count)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, inventory_count: parseInt(e.target.value) || 0 }))}
                      className="h-9"
                    />
                  </div>

                  {/* Pricing Section */}
                  <div className="sm:col-span-2 border-t pt-3 mt-1">
                    <p className="text-xs font-semibold text-gray-700 mb-2">💰 Pricing</p>
                  </div>
                  {[
                    { key: "msrp_price", label: "MSRP" },
                    { key: "market_price", label: "Market Price" },
                    { key: "public_price", label: "Public Price" },
                    { key: "member_price", label: "Member Price (Pro)" },
                    { key: "premium_member_price", label: "Premium Price (Elite)" },
                    { key: "cost_basis", label: "Cost Basis" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={String(createForm[f.key])}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                        className="h-9"
                      />
                    </div>
                  ))}

                  {/* Marketplace Readiness */}
                  <div className="sm:col-span-2 border-t pt-3 mt-1">
                    <p className="text-xs font-semibold text-gray-700 mb-2">🌍 Multi-Channel Listing</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">SKU (auto-generated if blank)</label>
                    <Input value={String(createForm.sku || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, sku: e.target.value }))} placeholder="PT-SEA-001234" className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">UPC/EAN</label>
                    <Input value={String(createForm.upc || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, upc: e.target.value }))} placeholder="820650853814" className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Set Name</label>
                    <Input value={String(createForm.set_name || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, set_name: e.target.value }))} placeholder="Prismatic Evolutions" className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Card Name</label>
                    <Input value={String(createForm.card_name || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, card_name: e.target.value }))} placeholder="Umbreon VMAX" className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Card #</label>
                    <Input value={String(createForm.card_number || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, card_number: e.target.value }))} placeholder="215/203" className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Rarity</label>
                    <Input value={String(createForm.rarity || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, rarity: e.target.value }))} placeholder="Secret Rare" className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Weight (oz)</label>
                    <Input type="number" step="0.1" value={String(createForm.shipping_weight_oz || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, shipping_weight_oz: parseFloat(e.target.value) || 0 }))} className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Handling Days</label>
                    <Input type="number" value={String(createForm.handling_days || 3)} onChange={(e) => setCreateForm(prev => ({ ...prev, handling_days: parseInt(e.target.value) || 3 }))} className="h-9" />
                  </div>

                  {/* Channel-Specific Pricing */}
                  <div className="sm:col-span-2 border-t pt-3 mt-1">
                    <p className="text-xs font-semibold text-gray-700 mb-2">🏪 Channel Pricing</p>
                  </div>
                  {[
                    { key: "ebay_price", label: "eBay Price" },
                    { key: "tcgplayer_price", label: "TCGPlayer Price" },
                    { key: "amazon_price", label: "Amazon Price" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                      <Input type="number" step="0.01" value={String(createForm[f.key] || '')} onChange={(e) => setCreateForm(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))} className="h-9" />
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!createForm.marketplace_ready} onChange={(e) => setCreateForm(prev => ({ ...prev, marketplace_ready: e.target.checked }))} className="rounded" />
                    <label className="text-xs text-gray-600">✅ Ready for Marketplace Listing</label>
                  </div>

                  {/* Product Images */}
                  <div className="sm:col-span-2 border-t pt-3 mt-1">
                    <p className="text-xs font-semibold text-gray-700 mb-2">📷 Product Images</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {productImages.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProductImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        {uploadingImage ? (
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <Plus className="h-5 w-5 text-gray-400" />
                            <span className="text-[10px] text-gray-400 mt-0.5">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await handleImageUpload(file);
                              setUploadingImage(false);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400">JPG, PNG, or WebP. First image is the cover photo.</p>
                  </div>

                  {/* Limits */}
                  <div className="sm:col-span-2 border-t pt-3 mt-1">
                    <p className="text-xs font-semibold text-gray-700 mb-2">🛡️ Anti-Scalper Limits</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max per Member</label>
                    <Input
                      type="number"
                      value={String(createForm.max_qty_per_member)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, max_qty_per_member: parseInt(e.target.value) || 1 }))}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max per Household</label>
                    <Input
                      type="number"
                      value={String(createForm.max_qty_per_household)}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, max_qty_per_household: parseInt(e.target.value) || 2 }))}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={!!createForm.requires_membership}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, requires_membership: e.target.checked }))}
                        className="rounded"
                      />
                      Requires Membership
                    </label>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={!!createForm.premium_only}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, premium_only: e.target.checked }))}
                        className="rounded"
                      />
                      Elite Only
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 mt-4 border-t">
                  <Button
                    onClick={handleCreateProduct}
                    disabled={creating || !createForm.title}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Create Product
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

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
                    { key: "status", label: "Status (draft/active/sold_out/archived)", type: "text" },
                    { key: "description", label: "Description", type: "text" },
                    { key: "condition", label: "Condition", type: "text" },
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
                    {/* Image Upload in Edit */}
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">📷 Images</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {productImages.map((url, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg border overflow-hidden group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProductImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400">
                          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <Plus className="h-4 w-4 text-gray-400" />}
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) { await handleImageUpload(file, editingProduct?.slug); setUploadingImage(false); }
                            e.target.value = '';
                          }} />
                        </label>
                      </div>
                    </div>

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
                      onClick={() => { setEditingProduct(null); setEditForm({}); setProductImages([]); }}
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
                            onClick={() => { setEditingProduct(product); setEditForm({}); setProductImages(product.images || []); }}
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
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setSelectedOrder(order); setOrderForm({ status: order.status, tracking_number: order.tracking_number || '', admin_notes: order.admin_notes || '' }); }}>
                    <Eye className="h-3 w-3 mr-1" /> Details
                  </Button>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Order #{selectedOrder.id.slice(0, 8)}</h3>
              <button onClick={() => setSelectedOrder(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</div>
                <div><span className="text-gray-500">Total:</span> <strong>${selectedOrder.total.toFixed(2)}</strong></div>
                {selectedOrder.subtotal > 0 && <div><span className="text-gray-500">Subtotal:</span> ${selectedOrder.subtotal.toFixed(2)}</div>}
                {selectedOrder.shipping > 0 && <div><span className="text-gray-500">Shipping:</span> ${selectedOrder.shipping.toFixed(2)}</div>}
              </div>

              {selectedOrder.shipping_name && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Ship To:</p>
                  <p className="font-medium">{selectedOrder.shipping_name}</p>
                  {selectedOrder.shipping_address && (
                    <p className="text-xs text-gray-600">
                      {selectedOrder.shipping_address.line1}{selectedOrder.shipping_address.line2 ? `, ${selectedOrder.shipping_address.line2}` : ''}<br/>
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}
                    </p>
                  )}
                </div>
              )}

              {selectedOrder.items?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Items:</p>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-gray-100 text-xs">
                      <span>{(item.product_snapshot as any)?.title || 'Item'} x{item.quantity}</span>
                      <span>${(item.unit_price * item.quantity).toFixed(2)} ({item.price_type})</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select value={orderForm.status || selectedOrder.status} onChange={(e) => setOrderForm(prev => ({ ...prev, status: e.target.value }))} className="w-full h-9 rounded-md border border-gray-200 px-3 text-sm">
                  {['pending','paid','processing','shipped','delivered','canceled','refunded','manual_review'].map(s => (
                    <option key={s} value={s}>{s.replace('_',' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tracking Number</label>
                <Input value={orderForm.tracking_number || ''} onChange={(e) => setOrderForm(prev => ({ ...prev, tracking_number: e.target.value }))} placeholder="1Z999AA10123456784" className="h-9" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Admin Notes</label>
                <textarea value={orderForm.admin_notes || ''} onChange={(e) => setOrderForm(prev => ({ ...prev, admin_notes: e.target.value }))} className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm h-16 resize-none" placeholder="Internal notes..." />
              </div>

              {selectedOrder.refund_amount && selectedOrder.refund_amount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  Refunded ${selectedOrder.refund_amount.toFixed(2)} on {selectedOrder.refunded_at ? new Date(selectedOrder.refunded_at).toLocaleDateString() : 'N/A'}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={savingOrder} onClick={async () => {
                  setSavingOrder(true);
                  try {
                    await fetch(`/api/shop/orders/${selectedOrder.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderForm) });
                    setMessage('Order updated!');
                    setTimeout(() => setMessage(null), 3000);
                    fetchData();
                    setSelectedOrder(null);
                  } catch {} finally { setSavingOrder(false); }
                }}>
                  {savingOrder ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save
                </Button>

                {selectedOrder.stripe_payment_intent_id && selectedOrder.status !== 'refunded' && (
                  <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={refunding} onClick={async () => {
                    if (!confirm('Process full refund? This cannot be undone.')) return;
                    setRefunding(true);
                    try {
                      const res = await fetch(`/api/shop/orders/${selectedOrder.id}/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: orderForm.admin_notes || 'Admin refund' }) });
                      const data = await res.json();
                      if (data.success) {
                        setMessage('Refund processed!');
                        fetchData();
                        setSelectedOrder(null);
                      } else { setMessage(`Refund error: ${data.error}`); }
                    } catch {} finally { setRefunding(false); setTimeout(() => setMessage(null), 5000); }
                  }}>
                    {refunding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <DollarSign className="h-4 w-4 mr-1" />} Refund
                  </Button>
                )}

                <Button size="sm" variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
