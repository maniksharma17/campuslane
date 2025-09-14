"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Snack from "@/components/ui/snack";
import { ArrowLeft, ChevronLeft } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_AWS_STORAGE_URL;

type Variant = { _id?: string; name?: string; price: number; stock?: number; images?: string[] };
type ProductRef = { _id?: string; name?: string; images?: string[]; variants?: Variant[] };
type CartItem = {
  _id?: string;
  productId?: ProductRef | string;
  variantId?: Variant | string;
  quantity: number;
  price: number;
};
type CartShape = { _id?: string; items: CartItem[] } | null;

export default function CheckoutPage(): JSX.Element {
  const router = useRouter();

  const [cart, setCart] = useState<CartShape>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    streetOptional: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India",
  });

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentType, setPaymentType] = useState<"COD" | "ONLINE">("COD");

  // snack
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVariant, setSnackVariant] = useState<"success" | "error" | "info">("info");

  // simple errors map
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCart() {
    setLoading(true);
    try {
      const res = await api.get("/cart");
      const data = res.data?.data || res.data || null;
      setCart(data);
    } catch (err) {
      console.error("cart fetch error", err);
      setSnackMessage("Failed to load cart");
      setSnackVariant("error");
      setSnackOpen(true);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }

  // helpers for varied response shapes
  function getProduct(item: CartItem): ProductRef | undefined {
    const p = (item as any).product || item.productId;
    if (!p) return undefined;
    return typeof p === "string" ? undefined : (p as ProductRef);
  }
  function getVariant(item: CartItem): Variant | undefined {
    if (!item) return undefined;
    if (item.variantId && typeof item.variantId !== "string") return item.variantId as Variant;
    const product = getProduct(item);
    if (product?.variants && item.variantId) {
      return product.variants.find((v) => String((v as any)._id) === String(item.variantId));
    }
    if ((product as any)?.selectedVariant) return (product as any).selectedVariant as Variant;
    return undefined;
  }

  function formatCurrency(n?: number) {
    if (typeof n !== "number") return "₹0";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  }

  const subtotal = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((s, it) => s + (Number(it.price || getVariant(it)?.price || 0) * Number(it.quantity || 0)), 0);
  }, [cart]);

  const shippingFee = shippingMethod === "standard" ? 0 : 50;
  const total = subtotal + shippingFee;

  // validation helpers
  function validateAddress() {
    const e: Record<string, string> = {};
    if (!address.name.trim()) e.name = "Name is required";
    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) e.phone = "Enter a valid 10-digit phone (India)";
    if (!address.street.trim()) e.street = "Street is required";
    if (!address.city.trim()) e.city = "City is required";
    if (!address.state.trim()) e.state = "State is required";
    if (!/^\d{5,6}$/.test(address.zipcode.trim())) e.zipcode = "Enter a valid pin code";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // handle place order
  async function handleCheckout() {
    if (!cart || cart.items.length === 0) {
      setSnackMessage("Your cart is empty.");
      setSnackVariant("info");
      setSnackOpen(true);
      return;
    }

    if (!validateAddress()) {
      setSnackMessage("Please fix address errors.");
      setSnackVariant("error");
      setSnackOpen(true);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        items: cart.items.map((i) => ({
          productId: (getProduct(i)?._id || i.productId) as string,
          variantId: (getVariant(i)?._id || i.variantId) as string,
          quantity: i.quantity,
          price: i.price,
        })),
        totalAmount: total,
        shippingAddress: {
          ...address,
        },
        shippingMethod,
        paymentType,
      };

      const res = await api.post("/orders/checkout", payload);

      // server may return order id or payment URL
      const orderId = res.data?.data?.orderId || res.data?.orderId;
      const paymentUrl = res.data?.data?.paymentUrl || res.data?.paymentUrl;

      setSnackMessage("Order placed successfully");
      setSnackVariant("success");
      setSnackOpen(true);

      // if online payment, redirect to payment gateway if URL provided
      if (paymentType === "ONLINE" && paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      // otherwise redirect to orders list or order detail
      if (orderId) {
        router.push(`/shop/orders/${orderId}`);
      } else {
        router.push("/shop/orders");
      }
    } catch (err: any) {
      console.error("checkout error", err);
      setSnackMessage(err?.response?.data?.message || "Checkout failed. Try again.");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  // UX helpers
  function updateAddressField<K extends keyof typeof address>(key: K, value: string) {
    setAddress((a) => ({ ...a, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  // Skeleton layout: mirrors final layout and sits under navbar
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="animate-pulse grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/3" />
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>

            <aside className="w-full">
              <div className="lg:sticky lg:top-28 bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-10 bg-gray-200 rounded mb-2" />
                <div className="h-10 bg-gray-200 rounded mb-2" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  // Empty cart state
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-medium mb-2">Your cart is empty</h2>
            <p className="text-sm text-gray-600 mb-6">Add items to cart before checking out.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => router.push("/shop/products")}>Continue shopping</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-row items-center gap-3">
            
            <h1 className="text-2xl font-medium">Complete your order</h1>
          </div>

          <Button
              variant={"outline"}
              onClick={() => router.back()}
              className="flex justify-center items-center gap-2 text-md text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={16} /> Back to cart
            </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: Form */}
          <section aria-labelledby="shipping-heading">
            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Shipping Address</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={address.name}
                      onChange={(e) => updateAddressField("name", e.target.value)}
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
                  </div>

                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={address.phone}
                      onChange={(e) => updateAddressField("phone", e.target.value)}
                      placeholder="10-digit mobile"
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && <div className="text-xs text-red-600 mt-1">{errors.phone}</div>}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Street *</Label>
                    <Input
                      value={address.street}
                      onChange={(e) => updateAddressField("street", e.target.value)}
                      aria-invalid={!!errors.street}
                    />
                    {errors.street && <div className="text-xs text-red-600 mt-1">{errors.street}</div>}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Street (Optional)</Label>
                    <Input value={address.streetOptional} onChange={(e) => updateAddressField("streetOptional", e.target.value)} />
                  </div>

                  <div>
                    <Label>City *</Label>
                    <Input value={address.city} onChange={(e) => updateAddressField("city", e.target.value)} aria-invalid={!!errors.city} />
                    {errors.city && <div className="text-xs text-red-600 mt-1">{errors.city}</div>}
                  </div>

                  <div>
                    <Label>State *</Label>
                    <Input value={address.state} onChange={(e) => updateAddressField("state", e.target.value)} aria-invalid={!!errors.state} />
                    {errors.state && <div className="text-xs text-red-600 mt-1">{errors.state}</div>}
                  </div>

                  <div>
                    <Label>Zipcode *</Label>
                    <Input value={address.zipcode} onChange={(e) => updateAddressField("zipcode", e.target.value)} aria-invalid={!!errors.zipcode} />
                    {errors.zipcode && <div className="text-xs text-red-600 mt-1">{errors.zipcode}</div>}
                  </div>

                  <div>
                    <Label>Country</Label>
                    <Input value={address.country} onChange={(e) => updateAddressField("country", e.target.value)} />
                  </div>
                </div>

            
              </CardContent>
            </Card>
          </section>

          {/* RIGHT: Order summary (sticky on large screens) */}
          <aside aria-labelledby="order-summary-heading">
            <div className="lg:sticky lg:top-28">
              <Card>
                <CardHeader>
                  <CardTitle className="font-medium">Order summary</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {cart.items.map((item, idx) => {
                      const product = getProduct(item);
                      const variant = getVariant(item);
                      const image = product?.images?.[0] || variant?.images?.[0] || "/images/placeholder.png";
                      const title = product?.name || "Product";

                      return (
                        <div key={(item._id ?? idx)} className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                            <Image src={`${BASE_URL}/${image}`} alt={title} width={64} height={64} className="object-cover" />
                          </div>

                          <div className="flex-1">
                            <div className="text-sm font-medium">{title}</div>
                            <div className="text-xs text-gray-500">{variant?.name || ""} • Qty {item.quantity}</div>
                          </div>

                          <div className="text-sm font-medium">{formatCurrency((item.price || variant?.price || 0) * item.quantity)}</div>
                        </div>
                      );
                    })}

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>Subtotal</div>
                        <div>{formatCurrency(subtotal)}</div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                        <div>Shipping</div>
                        <div>{shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-base font-medium">
                        <div>Total</div>
                        <div className="text-xl">{formatCurrency(total)}</div>
                      </div>

                      <div className="mt-4">
                        <Button onClick={handleCheckout} className="w-full" disabled={submitting}>
                          {submitting ? "Placing order..." : paymentType === "COD" ? "Place order" : "Pay now"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      <Snack open={snackOpen} onClose={() => setSnackOpen(false)} message={snackMessage} variant={snackVariant} />
    </main>
  );
}
