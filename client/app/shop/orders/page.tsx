"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, X } from "lucide-react";

/**
 * OrdersPage — shows compact order cards with:
 *  - client-side search
 *  - extra order details (payment, shipping city, item count, last-updated)
 *  - cancel option (with confirmation + optimistic update)
 *  - horizontal progress bar / stepper reflecting status
 *
 * This expects API response shape: { success: true, data: [ orders... ], pagination: { ... } }
 */

// Order status flow (common statuses). "cancelled" handled separately.
const STATUS_FLOW = [
  "pending", // your data used "pending"
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

function formatCurrency(amount?: number) {
  if (typeof amount !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "pending").toLowerCase();
  if (s === "delivered") return <Badge variant="default">Delivered</Badge>;
  if (s === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  if (s === "pending") return <Badge variant="outline">Pending</Badge>;
  return <Badge variant="outline">{s.replace(/_/g, " ")}</Badge>;
}

function ProgressStepper({ status }: { status?: string }) {
  // returns a horizontal stepper showing progress through STATUS_FLOW
  const current = (status || "pending").toLowerCase();
  if (current === "cancelled") {
    // show a single cancelled state
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center">✕</div>
          <div>Cancelled</div>
        </div>
      </div>
    );
  }

  const idx = STATUS_FLOW.indexOf(current);
  const clampedIdx = idx === -1 ? 0 : idx;

  return (
    <div className="flex items-center gap-3 overflow-auto py-2">
      {STATUS_FLOW.map((s, i) => {
        const achieved = i <= clampedIdx;
        return (
          <div key={s} className="flex items-center gap-3">
            <div className="flex flex-col items-center text-xs">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                  achieved ? "bg-green-600" : "bg-gray-200 text-gray-600"
                }`}
                aria-current={i === clampedIdx}
                title={s.replace(/_/g, " ")}
              >
                {achieved ? "✓" : i + 1}
              </div>
              <div className="mt-1 whitespace-nowrap text-[11px] text-gray-600">{s.replace(/_/g, " ").toUpperCase()}</div>
            </div>

            {i < STATUS_FLOW.length - 1 && (
              <div
                aria-hidden
                className={`h-[2px] w-10 ${i < clampedIdx ? "bg-green-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type ApiOrder = {
  _id: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: Array<{
    _id?: string;
    productId?: string | Record<string, any>;
    name?: string;
    price?: number;
    quantity?: number;
  }>;
  paymentType?: string;
  paymentStatus?: string;
  deliveryRate?: number;
  freeShipping?: boolean;
  shippingAddress?: { city?: string; name?: string; phone?: string };
};

export default function OrdersPage(): JSX.Element {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/orders/mine", { params: { page: 1, limit: 50 } });
        const data = res.data?.data ?? res.data ?? [];
        const normalized = (data as ApiOrder[]).map((o) => ({
          ...o,
          items: Array.isArray(o.items) ? o.items : [],
        }));
        if (mounted) setOrders(normalized);
      } catch (err) {
        console.error("orders fetch error", err);
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      if (String(o._id ?? "").toLowerCase().includes(q)) return true;
      if ((o.status ?? "").toLowerCase().includes(q)) return true;
      if ((o.paymentStatus ?? "").toLowerCase().includes(q)) return true;
      // search product names
      for (const it of o.items ?? []) {
        const name = (it.name ?? (typeof it.productId === "object" ? (it.productId as any).name : "") ?? "").toLowerCase();
        if (name.includes(q)) return true;
      }
      // search city
      if ((o.shippingAddress?.city ?? "").toLowerCase().includes(q)) return true;
      return false;
    });
  }, [orders, search]);

  async function cancelOrder(orderId: string) {
    if (!confirm("Cancel this order? This action may not be reversible.")) return;
    setCancellingIds((s) => [...s, orderId]);

    // optimistic UI: set status to 'cancelled' locally, revert on failure
    const prev = orders;
    setOrders((list) => list.map((o) => (o._id === orderId ? { ...o, status: "cancelled", updatedAt: new Date().toISOString() } : o)));

    try {
      await api.patch(`/orders/${orderId}/cancel`);
      // success — server should reflect cancellation; we already updated UI optimistically
    } catch (err: any) {
      console.log("cancel error", err);
      // revert
      setOrders(prev);
      alert(err?.response?.data?.message || "Unable to cancel order.");
    } finally {
      setCancellingIds((s) => s.filter((id) => id !== orderId));
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="animate-pulse h-8 w-1/3 bg-gray-200 rounded mb-6" />
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded shadow-sm border p-4" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-medium">My Orders</h1>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Input
                placeholder="Search by order ID, product, status or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search orders"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <div className="text-lg font-medium mb-2">{search ? "No matching orders" : "No orders yet"}</div>
              <div className="text-sm text-gray-600">
                {search ? "Try a different search term." : "Your orders will appear here once you place them."}
              </div>
              <div className="mt-4">
                <Link href="/shop">
                  <Button>Start shopping</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filtered.map((order) => {
              const items = order.items ?? [];
              const subtotal =
                typeof order.totalAmount === "number"
                  ? order.totalAmount
                  : items.reduce((s, it) => s + (Number(it.price ?? 0) * Number(it.quantity ?? 1)), 0);

              const firstItem = items[0] ?? null;
              const firstName = firstItem?.name ?? (typeof firstItem?.productId === "object" ? (firstItem.productId as any).name : null) ?? `Item (${items.length})`;
              const placedAt = formatDate(order.createdAt);
              const lastUpdated = formatDate(order.updatedAt);
              const shortId = String(order._id ?? "").slice(-8).toUpperCase();
              const city = order.shippingAddress?.city ?? "—";
              const payment = order.paymentType ?? "—";
              const paymentStatus = order.paymentStatus ?? "—";
              const deliveryRate = typeof order.deliveryRate === "number" ? formatCurrency(order.deliveryRate) : order.freeShipping ? "Free" : "—";
              const isCancellable = !["shipped", "out_for_delivery", "delivered", "cancelled"].includes((order.status ?? "").toLowerCase());
              const cancelling = cancellingIds.includes(order._id);

              return (
                <Card key={order._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-2">
                    <div className="flex items-start gap-4">
                      

                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-medium truncate">Order #{shortId}</div>
                          <div className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</div>
                        </div>

                        <div className="text-sm text-gray-600 mt-1 truncate max-w-[60ch]">{firstName}</div>

                        {/* small details row */}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
                          <div>Placed: <span className="font-medium text-gray-700">{placedAt}</span></div>
                          <div>City: <span className="font-medium text-gray-700">{city}</span></div>
                          <div>Payment: <span className="font-medium text-gray-700">{payment}</span></div>
                          <div>Pay status: <span className="font-medium text-gray-700">{paymentStatus}</span></div>
                          <div>Delivery fee: <span className="font-medium text-gray-700">{deliveryRate}</span></div>
                        </div>

                        <div className="mt-3">
                          {/* progress stepper */}
                          <ProgressStepper status={order.status} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="font-medium">{formatCurrency(subtotal)}</div>
                      </div>

                      <div className="flex items-center">
                        <Link href={`/shop/orders/${order._id}`}>
                          <Button variant="outline" className="flex items-center gap-2">
                            View <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => cancelOrder(order._id)}
                          disabled={!isCancellable || cancelling}
                          title={isCancellable ? "Cancel order" : "Cannot cancel at this stage"}
                          className="text-red-500"
                        >
                          {cancelling ? "Cancelling..." : <>Cancel</>}
                        </Button>
                      </div>

                      <div className="text-xs text-gray-500">{lastUpdated !== "—" ? `Updated: ${lastUpdated}` : null}</div>
                    </div>
                  </CardHeader>

                  {/* mobile footer: compact info */}
                  <CardContent className="sm:hidden pt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">Status</div>
                      <div><StatusBadge status={order.status} /></div>
                      <div className="text-xs font-medium">{formatCurrency(subtotal)}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
