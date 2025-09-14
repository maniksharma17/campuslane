"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Snack from "@/components/ui/snack";
import { ChevronLeft, FileText, Repeat, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BASE_URL=process.env.NEXT_PUBLIC_AWS_STORAGE_URL

/* ----- Types ----- */
type RawItem = {
  _id?: string;
  productId?: string | Record<string, any>;
  variantId?: string | Record<string, any>;
  name?: string;
  price?: number;
  quantity?: number;
  variant?: {
    images: string[];
    name: string
  }
};

type RawOrder = {
  _id: string;
  items?: RawItem[];
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  shippingAddress?: Record<string, any>;
  paymentType?: string;
  paymentStatus?: string;
  deliveryRate?: number;
  freeShipping?: boolean;
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

function formatCurrency(n?: number) {
  if (typeof n !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
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

/* Small Status badge */
function StatusBadge({ status }: { status?: string }) {
  const s = (status || "pending").toLowerCase();
  if (s === "delivered") return <Badge variant="default">Delivered</Badge>;
  if (s === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
  if (s === "pending") return <Badge variant="outline">Pending</Badge>;
  return <Badge variant="outline">{s.replace(/_/g, " ")}</Badge>;
}

/* Progress stepper */
function ProgressStepper({ status }: { status?: string }) {
  const current = (status || "pending").toLowerCase();
  if (current === "cancelled") {
    return (
      <div className="flex items-center gap-3 text-sm text-red-600">
        <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center">
          ✕
        </div>
        <div>Cancelled</div>
      </div>
    );
  }

  const idx = Math.max(0, STATUS_FLOW.indexOf(current));
  return (
    <div className="flex items-center gap-4 overflow-auto py-2">
      {STATUS_FLOW.map((s, i) => {
        const achieved = i <= idx;
        return (
          <div key={s} className="flex items-center gap-3">
            <div className="flex flex-col items-center text-xs">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                  achieved ? "bg-green-600" : "bg-gray-200 text-gray-600"
                }`}
                title={s.replace(/_/g, " ").toUpperCase()}
              >
                {achieved ? "✓" : i + 1}
              </div>
              <div className="mt-1 whitespace-nowrap text-[11px] text-gray-600">
                {s.replace(/_/g, " ").toUpperCase()}
              </div>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={`h-[2px] w-10 ${
                  i < idx ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----- Page component ----- */
export default function OrderDetailPage(): JSX.Element {
  const { id } = useParams() as { id?: string };
  const router = useRouter();

  const [order, setOrder] = useState<RawOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVariant, setSnackVariant] = useState<
    "success" | "error" | "info"
  >("info");

  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchOrder(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchOrder(orderId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/${orderId}`);
      // API might return { success: true, data: order } or directly order
      const payload = res.data?.data ?? res.data ?? null;
      if (!payload) {
        setError("Order not found");
        setOrder(null);
        return;
      }

      // normalize order object
      const o: RawOrder = payload?.order ?? payload;

      // If items reference product IDs (string), fetch product details to enrich display
      const items = Array.isArray(o.items) ? o.items : [];
      const idsToFetch = new Set<string>();
      items.forEach((it) => {
        if (typeof it.productId === "string")
          idsToFetch.add(it.productId as string);
        else if (
          it.productId &&
          typeof it.productId === "object" &&
          !(it as any).name
        ) {
          // maybe partial object without name -> ignore
        }
      });

      const productCache: Record<string, any> = {};
      if (idsToFetch.size > 0) {
        setLoadingProducts(true);
        const ids = Array.from(idsToFetch);
        await Promise.all(
          ids.map(async (pid) => {
            try {
              const pRes = await api.get(`/products/${pid}`);
              const p = pRes.data?.data ?? pRes.data ?? null;
              productCache[pid] = p?.product ?? p;
            } catch (err) {
              console.error("product fetch failed", pid, err);
              productCache[pid] = null;
            }
          })
        );
        setLoadingProducts(false);
      }

      // create enriched items array (attach product where available)
      const enrichedItems = items.map((it) => {
        let product = null;
        if (typeof it.productId === "string")
          product = productCache[it.productId];
        else if (it.productId && typeof it.productId === "object")
          product = it.productId;
        return { ...it, product };
      });

      setOrder({ ...o, items: enrichedItems });
    } catch (err: any) {
      console.error("fetch order error", err);
      setError(err?.response?.data?.message || "Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  const subtotal = useMemo(() => {
    if (!order?.items) return 0;
    return order.items.reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
  }, [order]);

  async function cancelOrder() {
    if (!order) return;
    setCancelling(true);

    const prev = order;
    // optimistic UI
    setOrder({
      ...order,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });

    try {
      await api.patch(`/orders/${order._id}/cancel`);
      setSnackMessage("Order cancelled");
      setSnackVariant("success");
      setSnackOpen(true);
    } catch (err: any) {
      console.error("cancel error", err);
      setOrder(prev); // revert
      setSnackMessage(err?.response?.data?.message || "Could not cancel order");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setCancelling(false);
    }
  }


  async function handleReorder() {
    if (!order) return;

    try {
      await api.post(`/orders/reorder/${order?._id}`);
      setSnackMessage("Order added to cart");
      setSnackVariant("success");
      setSnackOpen(true);
      router.push("/shop/cart");
    } catch (err: any) {
      setSnackMessage("Could not reorder");
      setSnackVariant("error");
      setSnackOpen(true);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="animate-pulse h-8 w-1/3 bg-gray-200 rounded mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-12 bg-white rounded shadow-sm border" />
              <div className="h-48 bg-white rounded shadow-sm border" />
              <div className="h-36 bg-white rounded shadow-sm border" />
            </div>
            <aside className="">
              <div className="h-40 bg-white rounded shadow-sm border p-4" />
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="bg-white rounded shadow p-6 text-red-600">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <Card>
            <CardContent className="py-8 text-center text-gray-600">
              Order not found.
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const lastUpdated = formatDate(order.updatedAt);
  const placedAt = formatDate(order.createdAt);
  const shortId = String(order._id).slice(-8).toUpperCase();
  const city = order.shippingAddress?.city ?? "—";
  const paymentType = order.paymentType ?? "—";

  const isCancellable = ![
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ].includes((order.status ?? "").toLowerCase());

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant={"outline"}
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={16} /> Back
          </Button>

          <div className="ml-2">
            <h1 className="text-2xl font-medium">Order #{shortId}</h1>
            <div className="text-sm text-gray-600">
              Placed {placedAt} • Updated {lastUpdated}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Items + timeline + shipping/payment */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {order.items?.map((it, idx) => {
                    const product =
                      (it as any).product ??
                      (typeof it.productId === "object" ? it.productId : null);
                    const image = it?.variant?.images?.[0] ?? "/placeholder.png";
                    const title = product?.name ?? it.name ?? `Item ${idx + 1}`;
                    const variant = it?.variant?.name;
                    const unitPrice = it.price ?? 0;
                    const qty = it.quantity ?? 1;
                    return (
                      <div
                        key={it._id ?? idx}
                        className="py-4 flex gap-4 items-center"
                      >
                        <div className="w-20 h-20 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={`${BASE_URL}/${image}`}
                            alt={title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{title}</div>
                          <div className="font-medium text-gray-600 truncate">{variant}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Qty: {qty}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {formatCurrency(unitPrice)}
                          </div>
                          <div className="font-medium mt-1">
                            {formatCurrency(unitPrice * qty)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Delivery & status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Status</div>
                    <div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>

                <div>
                  <ProgressStepper status={order.status} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Shipping address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="font-medium">
                    {order.shippingAddress?.name ?? "—"}
                  </div>
                  <div>{order.shippingAddress?.phone ?? "—"}</div>
                  <div>
                    {order.shippingAddress?.street}
                    {order.shippingAddress?.streetOptional
                      ? `, ${order.shippingAddress.streetOptional}`
                      : ""}
                  </div>
                  <div>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.state}{" "}
                    {order.shippingAddress?.zipcode}
                  </div>
                  <div>{order.shippingAddress?.country}</div>

                  <div className="mt-3 text-xs text-gray-500">
                    Delivery city:{" "}
                    <span className="font-medium text-gray-700">{city}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    Method: <span className="font-medium">{paymentType}</span>
                  </div>
                  <div>
                    Payment status:{" "}
                    <span className="font-medium">
                      {order.paymentStatus ?? "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary + actions (sticky on large screens) */}
          <aside className="lg:sticky lg:top-28 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Order summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <div>Subtotal</div>
                    <div>{formatCurrency(subtotal)}</div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600">
                    <div>Delivery</div>
                    <div>
                      {order.freeShipping
                        ? "Free"
                        : formatCurrency(order.deliveryRate ?? 0)}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600">
                    <div>Taxes</div>
                    <div>
                      {formatCurrency(
                        Math.round(
                          (subtotal + (order.deliveryRate ?? 0)) * 0.18
                        )
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between text-lg font-medium">
                    <div>Total</div>
                    <div>
                      {formatCurrency(
                        order.totalAmount ??
                          subtotal + (order.deliveryRate ?? 0)
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <ReorderButton handleReorder={handleReorder} />

                    {isCancellable && (
                      <Button
                        variant="ghost"
                        onClick={cancelOrder}
                        disabled={!isCancellable || cancelling}
                        className="w-full text-red-600"
                      >
                        {cancelling ? (
                          "Cancelling..."
                        ) : (
                          <>
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    Order ID:{" "}
                    <span className="font-mono text-xs">{order._id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Need help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">
                  <div>
                    If you have questions about this order, contact support with
                    your order ID.
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        (window.location.href = `/support?orderId=${order._id}`)
                      }
                    >
                      Contact support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        <Snack
          open={snackOpen}
          onClose={() => setSnackOpen(false)}
          message={snackMessage}
          variant={snackVariant}
        />
      </div>
    </main>
  );
}

function ReorderButton({ handleReorder }: { handleReorder: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default">Reorder</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-medium">
            Reorder this order?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will add all items from this order back into your cart. Are you
            sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReorder}>
            Yes, Reorder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
