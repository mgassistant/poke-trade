"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, ShoppingBag, Loader2, CheckCircle,
  Truck, Clock, XCircle, AlertTriangle, ExternalLink,
} from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  price_type: string;
  product: {
    title: string;
    slug: string;
    images: string[];
    category: string;
  } | null;
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  total: number;
  tracking_number: string | null;
  created_at: string;
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Paid", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  processing: { label: "Processing", icon: Package, color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  canceled: { label: "Canceled", icon: XCircle, color: "bg-gray-100 text-gray-600" },
  refunded: { label: "Refunded", icon: XCircle, color: "bg-red-100 text-red-700" },
  manual_review: { label: "Under Review", icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const success = searchParams.get("success");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/shop/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders ?? []);
        }
      } catch {
        // Silent
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Track your shop purchases</p>
        </div>
        <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white">
          <Link href="/shop">
            <ShoppingBag className="h-4 w-4 mr-1.5" />
            Shop
          </Link>
        </Button>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-6 flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Order placed successfully! You&apos;ll receive a confirmation email shortly.
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-semibold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your shop purchases will appear here.
          </p>
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
            <Link href="/shop">Browse Shop</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Badge className={`${statusConfig.color} border-0 text-xs`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    ${order.total.toFixed(2)}
                  </span>
                </div>

                {/* Items */}
                <div className="p-4 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.product ? (
                          <Link
                            href={`/shop/${item.product.slug}`}
                            className="text-gray-700 hover:text-red-600 transition-colors truncate"
                          >
                            {item.product.title}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Product unavailable</span>
                        )}
                        {item.quantity > 1 && (
                          <span className="text-xs text-gray-400">×{item.quantity}</span>
                        )}
                      </div>
                      <span className="text-gray-600 shrink-0 ml-2">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tracking */}
                {order.tracking_number && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 text-xs">
                      <Truck className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-blue-700">
                        Tracking: {order.tracking_number}
                      </span>
                      <ExternalLink className="h-3 w-3 text-blue-400 ml-auto" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
