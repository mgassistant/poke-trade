"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package, Plus, Bell, Trash2, Edit, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function DropsPage() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drop Products</h1>
          <p className="text-sm text-gray-500 mt-1">{total} products tracked</p>
        </div>
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

      {/* Add Product Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Drop Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Retailer *"
                value={form.retailer}
                onChange={(e) => setForm({ ...form, retailer: e.target.value })}
                required
              />
              <Input
                placeholder="Product Name *"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                required
              />
              <Input
                placeholder="Product URL"
                value={form.product_url}
                onChange={(e) => setForm({ ...form, product_url: e.target.value })}
              />
              <Input
                placeholder="Image URL"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <Input
                placeholder="Retail Price"
                type="number"
                step="0.01"
                value={form.retail_price}
                onChange={(e) => setForm({ ...form, retail_price: e.target.value })}
              />
              <Input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                placeholder="Set Name"
                value={form.set_name}
                onChange={(e) => setForm({ ...form, set_name: e.target.value })}
              />
              <Input
                placeholder="Release Date"
                type="date"
                value={form.release_date}
                onChange={(e) => setForm({ ...form, release_date: e.target.value })}
              />
              <div className="col-span-2 flex gap-2">
                <Button type="submit" size="sm">Save Product</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
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
                          {product.image_url && (
                            <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                          )}
                          <div>
                            <div className="font-medium text-xs text-gray-900">{product.product_name}</div>
                            {product.set_name && <div className="text-[10px] text-gray-500">{product.set_name}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-gray-600">{product.retailer}</td>
                      <td className="p-3 text-xs text-gray-900">
                        {product.retail_price ? `$${product.retail_price}` : "—"}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] cursor-pointer ${
                            product.in_stock
                              ? "border-green-300 text-green-700 bg-green-50"
                              : "border-red-300 text-red-700 bg-red-50"
                          }`}
                          onClick={() => toggleStock(product.id, product.in_stock)}
                        >
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-500">{product.category || "—"}</td>
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-600"
                            onClick={() => triggerAlert(product.id)}
                            title="Trigger Alert"
                          >
                            <Bell className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-600"
                            onClick={() => deleteProduct(product.id)}
                            title="Delete"
                          >
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
