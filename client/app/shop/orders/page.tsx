"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Orders Page — collapsed-by-default details
 * - Removed "Track" option
 * - Toggle details per-order with "Show details" / "Hide details"
 *
 * Drop-in replacement for your OrdersPage.
 */

const STATUS_FLOW = [
  "ordered",
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

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "delivered"
      ? "default"
      : status === "cancelled"
      ? "destructive"
      : "outline";
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchOrdersAndProducts() {
      setLoading(true);
      setLoadingProducts(false);
      try {
        const res = await api.get("/orders/mine", {
          params: { page: 1, limit: 20 },
        });
        const fetchedOrders = res.data?.data ?? res.data ?? [];

        fetchedOrders.forEach((o: any) => {
          o.items = o.items ?? [];
        });

        const idsToFetch = new Set<string>();
        fetchedOrders.forEach((o: any) => {
          o.items.forEach((it: any) => {
            if (typeof it.productId === "string") {
              idsToFetch.add(it.productId);
            } else if (
              it.productId &&
              typeof it.productId === "object" &&
              !it.productId.name &&
              (it.productId._id || it.productId.id)
            ) {
              const pid = it.productId._id ?? it.productId.id;
              if (pid) idsToFetch.add(pid);
            }
          });
        });

        const productCache: Record<string, any> = {};
        if (idsToFetch.size > 0) {
          setLoadingProducts(true);
          const idsArray = Array.from(idsToFetch);
          await Promise.all(
            idsArray.map(async (id) => {
              try {
                const pRes = await api.get(`/products/${id}`);
                const payload = pRes.data?.data ?? pRes.data ?? null;
                const product =
                  payload?.product ?? payload?.productData ?? payload ?? null;
                productCache[id] = product;
              } catch (err) {
                console.error("Failed to fetch product", id, err);
                productCache[id] = null;
              }
            })
          );
          setLoadingProducts(false);
        }

        const enriched = fetchedOrders.map((o: any) => {
          const items = o.items.map((it: any) => {
            let pid: string | null = null;
            if (typeof it.productId === "string") pid = it.productId;
            else if (it.productId && typeof it.productId === "object") {
              pid = it.productId._id ?? it.productId.id ?? null;
            }
            const fetchedProduct = pid ? productCache[pid] : null;
            const populated =
              typeof it.productId === "object" && it.productId?.name
                ? it.productId
                : fetchedProduct ?? null;

            return {
              ...it,
              product: populated,
            };
          });
          return { ...o, items };
        });

        if (mounted) setOrders(enriched);
      } catch (err) {
        console.error("orders fetch error", err);
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingProducts(false);
        }
      }
    }

    fetchOrdersAndProducts();
    return () => {
      mounted = false;
    };
  }, []);

  function isExpanded(orderId: string) {
    return expandedOrderIds.includes(orderId);
  }

  function toggleExpanded(orderId: string) {
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  }

  if (loading)
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse h-6 w-1/3 bg-gray-200 rounded mb-6" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-48 bg-white rounded shadow-sm border p-4 flex items-center justify-between"
              >
                <div className="w-3/4">
                  <div className="h-4 w-1/4 bg-gray-200 rounded mb-3" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-1/3 bg-gray-200 rounded" />
                </div>
                <div className="w-1/4 h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 pt-28">
        <h1 className="text-3xl font-medium">My Orders</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-gray-600">
                You haven&apos;t placed any orders yet. Once you order, they&apos;ll
                appear here with invoices and more.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusIndex = Math.max(
                0,
                STATUS_FLOW.indexOf(order.status ?? "ordered")
              );

              const subtotal =
                order.items?.reduce(
                  (sum: number, it: any) =>
                    sum + (it.price ?? it.unitPrice ?? 0) * (it.quantity ?? 1),
                  0
                ) ?? 0;

              const shipping = order.shippingAmount ?? order.shipping ?? 0;
              const tax = order.taxAmount ?? order.tax ?? 0;
              const discount = order.discountAmount ?? order.discount ?? 0;
              const total =
                order.totalAmount ??
                (subtotal + shipping + tax - (discount ?? 0));

              const firstItem = order.items?.[0] ?? null;
              const firstProduct = firstItem?.product ?? firstItem?.productId ?? null;
              const firstImage = (firstProduct?.images && firstProduct.images[0]) ?? "/placeholder.png";
              const firstName = firstProduct?.name ?? firstItem?.name ?? "Product";

              const expanded = isExpanded(order._id);

              return (
                <Card key={order._id} className="shadow-md border">
                  <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col">
                      <CardTitle className="text-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            Order #{String(order._id).slice(-8).toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            • {order.items?.length ?? 0} items
                          </span>
                        </div>
                      </CardTitle>
                      <div className="text-sm text-gray-500">
                        Placed on{" "}
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="hidden md:flex items-center gap-2">
                        <StatusBadge status={order.status ?? "ordered"} />
                        {order.trackingNumber && (
                          <Badge variant="outline">
                            Tracking: {order.trackingNumber}
                          </Badge>
                        )}
                      </div>

                      <div className="ml-auto md:ml-0 flex gap-2">
                        {/* Removed Track button as requested */}

                        <Button
                          variant="ghost"
                          onClick={() => {
                            // invoice route
                            window.open(`/orders/${order._id}/invoice`, "_blank");
                          }}
                        >
                          Invoice
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            window.location.href = `/reorder/${order._id}`;
                          }}
                        >
                          Reorder
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Cancel this order? This action may not be reversible."
                              )
                            )
                              return;
                            try {
                              await api.post(`/orders/${order._id}/cancel`);
                              setOrders((prev) =>
                                prev.map((o) =>
                                  o._id === order._id ? { ...o, status: "cancelled" } : o
                                )
                              );
                            } catch (err) {
                              console.error("cancel error", err);
                              alert("Could not cancel order.");
                            }
                          }}
                          disabled={
                            ["shipped", "out_for_delivery", "delivered", "cancelled"].includes(
                              order.status
                            )
                          }
                        >
                          Cancel
                        </Button>

                        {/* Details toggle */}
                        <Button
                          variant="default"
                          onClick={() => toggleExpanded(order._id)}
                        >
                          {expanded ? "Hide details" : "Show details"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Collapsed view: compact summary */}
                  {!expanded ? (
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 relative rounded overflow-hidden bg-gray-100">
                            <Image
                              src={firstImage}
                              alt={firstName}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{firstName}</div>
                            <div className="text-sm text-gray-500">
                              {order.items?.length ?? 0} items • {formatCurrency(total)}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 text-right">
                          <div>
                            <span className="font-medium">Placed: </span>
                            <span>
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString("en-IN")
                                : "—"}
                            </span>
                          </div>
                          <div className="mt-2">
                            <StatusBadge status={order.status ?? "ordered"} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  ) : (
                    /* Expanded view: full details (previously existing content) */
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT / MAIN: Items + Timeline */}
                        <div className="lg:col-span-2 space-y-4">
                          {/* Status Timeline */}
                          <div className="flex items-center gap-4 overflow-auto pb-2">
                            {STATUS_FLOW.map((s, idx) => {
                              const achieved = idx <= statusIndex;
                              return (
                                <div key={s} className="flex items-center gap-3">
                                  <div
                                    className={`flex items-center justify-center rounded-full w-8 h-8 ${
                                      achieved ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                                    }`}
                                  >
                                    {achieved ? "✓" : idx + 1}
                                  </div>
                                  <div className="text-sm whitespace-nowrap text-gray-600">
                                    {s.replace(/_/g, " ")}
                                  </div>
                                  {idx < STATUS_FLOW.length - 1 && (
                                    <div
                                      className={`h-0.5 w-6 ${
                                        idx < statusIndex ? "bg-green-400" : "bg-gray-200"
                                      }`}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Items table */}
                          <div className="bg-white border rounded-md">
                            <div className="hidden md:grid grid-cols-12 gap-4 py-3 px-4 border-b text-sm text-gray-500">
                              <div className="col-span-5">Product</div>
                              <div className="col-span-2">Price</div>
                              <div className="col-span-2">Qty</div>
                              <div className="col-span-2 text-right">Subtotal</div>
                              <div className="col-span-1" />
                            </div>

                            <div className="divide-y">
                              {order.items?.map((it: any, i: number) => {
                                const product = it.product ?? it.productId ?? null;
                                const image =
                                  (product?.images && product.images[0]) ?? "/placeholder.png";
                                const name = product?.name ?? it.name ?? "Product";
                                const sku = product?.sku ?? it.sku ?? null;
                                const unitPrice = it.price ?? it.unitPrice ?? product?.price ?? 0;
                                const qty = it.quantity ?? 1;
                                return (
                                  <div
                                    key={(it._id ?? it.productId ?? i) + String(i)}
                                    className="py-4 px-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center"
                                  >
                                    <div className="md:col-span-5 flex items-center gap-4">
                                      <div className="w-20 h-20 relative rounded overflow-hidden bg-gray-100">
                                        <Image
                                          src={image}
                                          alt={name}
                                          fill
                                          sizes="80px"
                                          className="object-cover"
                                        />
                                      </div>
                                      <div>
                                        <Link href={`/product/${product?._id ?? it.productId}`} className="font-medium hover:underline">
                                          {name}
                                        </Link>
                                        {sku && (
                                          <div className="text-sm text-gray-500">SKU: {sku}</div>
                                        )}
                                        {it.variant && (
                                          <div className="text-sm text-gray-500">
                                            Variant: {it.variant}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="md:col-span-2 text-sm">
                                      {formatCurrency(unitPrice)}
                                    </div>

                                    <div className="md:col-span-2 text-sm">{qty}</div>

                                    <div className="md:col-span-2 text-right font-semibold">
                                      {formatCurrency(unitPrice * qty)}
                                    </div>

                                    <div className="md:col-span-1 text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          window.location.href = `/product/${product?._id ?? it.productId}`;
                                        }}
                                      >
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Order meta (shipping/payment) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border rounded-md p-4">
                              <h3 className="font-medium mb-2">Shipping</h3>
                              <div className="text-sm text-gray-700">
                                {order.shippingAddress ? (
                                  <>
                                    <div>{order.shippingAddress.name}</div>
                                    <div>{order.shippingAddress.line1}</div>
                                    {order.shippingAddress.line2 && (
                                      <div>{order.shippingAddress.line2}</div>
                                    )}
                                    <div>
                                      {order.shippingAddress.city} • {order.shippingAddress.postalCode}
                                    </div>
                                    <div>{order.shippingAddress.country}</div>
                                  </>
                                ) : (
                                  <div className="text-gray-500">No shipping address available</div>
                                )}
                              </div>
                            </div>

                            <div className="bg-white border rounded-md p-4">
                              <h3 className="font-medium mb-2">Payment</h3>
                              <div className="text-sm text-gray-700">
                                <div>
                                  Method: {order.paymentMethod ?? order.payment?.method ?? "—"}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {order.payment?.status ?? order.paymentStatus ?? "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT: Summary */}
                        <aside className="space-y-4">
                          <div className="bg-white border rounded-md p-4">
                            <h3 className="font-medium mb-3">Order Summary</h3>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Subtotal</span>
                              <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Shipping</span>
                              <span>{formatCurrency(shipping)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Tax</span>
                              <span>{formatCurrency(tax)}</span>
                            </div>
                            {discount > 0 && (
                              <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>-{formatCurrency(discount)}</span>
                              </div>
                            )}

                            <div className="border-t mt-3 pt-3 flex justify-between text-lg font-semibold">
                              <span>Total</span>
                              <span>{formatCurrency(total)}</span>
                            </div>

                            <div className="mt-4 flex flex-col gap-2">
                              {/* Track package removed */}
                              <Button
                                variant="outline"
                                onClick={() => window.open(`/orders/${order._id}/invoice`, "_blank")}
                              >
                                Download invoice
                              </Button>
                            </div>
                          </div>

                          {/* quick order details */}
                          <div className="bg-white border rounded-md p-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Order ID: </span>
                              {order._id}
                            </div>
                            <div className="mt-2">
                              <span className="font-medium">Status: </span>
                              <StatusBadge status={order.status ?? "ordered"} />
                            </div>
                            {order.trackingNumber && (
                              <div className="mt-2">
                                <span className="font-medium">Tracking #: </span>
                                <span>{order.trackingNumber}</span>
                              </div>
                            )}
                            <div className="mt-2">
                              <span className="font-medium">Placed: </span>
                              <span>
                                {order.createdAt
                                  ? new Date(order.createdAt).toLocaleString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </span>
                            </div>
                          </div>

                          {/* support */}
                          <div className="bg-white border rounded-md p-4 text-sm">
                            <div className="font-medium mb-2">Need help?</div>
                            <div className="text-gray-600 mb-3">
                              Contact support with your order ID for quick help.
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                (window.location.href = `/support?orderId=${order._id}`)
                              }
                            >
                              Contact support
                            </Button>
                          </div>
                        </aside>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
