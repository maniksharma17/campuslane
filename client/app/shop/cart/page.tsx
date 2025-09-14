"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Image from "next/image";
import Snack from "@/components/ui/snack";
import { ShoppingCart, Trash2 } from "lucide-react";

const BASE_URL=process.env.NEXT_PUBLIC_AWS_STORAGE_URL;

type Variant = { _id?: string; name: string; price: number; cutoffPrice?: number; stock?: number; images?: string[] };

type ProductRef = { _id: string; name?: string; images?: string[]; variants?: Variant[] };

type CartItem = {
  _id?: string; // cart item id
  productId?: ProductRef | string; // populated or id
  variantId?: Variant | string; // populated or id
  quantity: number;
  price: number;
};

type Cart = { _id?: string; userId?: string; items: CartItem[] } | null;

export default function CartPage(): JSX.Element {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // itemId being updated

  // snack
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVariant, setSnackVariant] = useState<"success" | "error" | "info">("info");

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
      console.error("fetchCart error", err);
      setCart(null);
      setSnackMessage("Failed to load cart");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  }

  // helpers to handle multiple response shapes
  function getProduct(item: CartItem): ProductRef | undefined {
    // product may be populated under productId or item.product
    const p = (item as any).product || item.productId;
    if (!p) return undefined;
    return typeof p === "string" ? undefined : (p as ProductRef);
  }

  function getVariant(item: CartItem): Variant | undefined {
    // variant can be stored as object, string id, or as product.selectedVariant
    if (!item) return undefined;
    if (item.variantId && typeof item.variantId !== "string") return item.variantId as Variant;
    const product = getProduct(item);
    if (product?.variants && item.variantId) {
      return product.variants.find((v) => String(v._id) === String(item.variantId));
    }
    // support product.selectedVariant shape
    if ((product as any)?.selectedVariant) return (product as any).selectedVariant as Variant;
    return undefined;
  }

  function getItemId(item: CartItem) {
    // Prefer the cart-item _id (server-side id), fallback to productId
    return (typeof item.productId === "string" ? item.productId : (item.productId as any)?._id);
  }

  function formatCurrency(n?: number) {
    if (typeof n !== "number") return "₹0";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  }

  const subtotal = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((s, it) => s + (Number(it.price || getVariant(it)?.price || 0) * Number(it.quantity || 0)), 0);
  }, [cart]);

  // Update quantity (optimistic UI + server sync)
  async function updateQuantity(item: CartItem, newQty: number) {
    const itemId = getItemId(item);
    if (!itemId) return;
    if (newQty < 1) return;

    setActionLoading(String(itemId));
    // optimistic update
    const prev = cart;
    setCart((c) => {
      if (!c) return c;
      return {
        ...c,
        items: c.items.map((it) => (getItemId(it) === itemId ? { ...it, quantity: newQty } : it)),
      };
    });

    try {
      await api.patch(`/cart/items/${itemId}`, { quantity: newQty });
      await fetchCart(); // refresh authoritative state
    } catch (err: any) {
      console.error("updateQuantity error", err);
      // revert
      setCart(prev);
      setSnackMessage(err?.response?.data?.message || "Failed to update quantity");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setActionLoading(null);
    }
  }

  // Change variant for an item. Robust handling: optimistic UI and revert on failure.
  async function changeVariant(item: CartItem, variantId: string, quantity: number) {
    const itemId = getItemId(item);
    if (!itemId) return;

    const product = getProduct(item);
    const availableVariants = product?.variants || [];
    const chosenVariant = availableVariants.find((v) => String(v._id) === String(variantId));
    if (!chosenVariant) {
      setSnackMessage("Selected variant not found");
      setSnackVariant("error");
      setSnackOpen(true);
      return;
    }

    setActionLoading(String(itemId));
    const prev = cart ? JSON.parse(JSON.stringify(cart)) : null;

    // optimistic update: update item's variantId and price locally
    setCart((c) => {
      if (!c) return c;
      return {
        ...c,
        items: c.items.map((it) => {
          if (getItemId(it) === itemId) {
            return { ...it, variantId: String(variantId), price: chosenVariant.price };
          }
          return it;
        }),
      };
    });

    try {
      // send variantId to backend; backend should update price/validation
      await api.patch(`/cart/items/${itemId}`, { variantId, quantity });
      await fetchCart();
    } catch (err: any) {
      console.error("changeVariant error", err);
      // revert
      setCart(prev);
      setSnackMessage(err?.response?.data?.message || "Failed to change variant");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setActionLoading(null);
    }
  }

  async function removeItem(item: CartItem) {
    const itemId = getItemId(item);
    if (!itemId) return;

    setActionLoading(String(itemId));
    try {
      await api.delete(`/cart/items/${itemId}`);
      await fetchCart();
    } catch (err: any) {
      console.error("removeItem error", err);
      setSnackMessage(err?.response?.data?.message || "Failed to remove item");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setActionLoading(null);
    }
  }

  async function clearCart() {
    if (!confirm("Clear all items from cart?")) return;
    setActionLoading("clear");
    try {
      await api.delete(`/cart`);
      await fetchCart();
    } catch (err: any) {
      console.error("clearCart error", err);
      setSnackMessage(err?.response?.data?.message || "Failed to clear cart");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setActionLoading(null);
    }
  }

  // Layout
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="animate-pulse grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-12 bg-gray-200 rounded" />
              {[1,2,3].map((i)=> (
                <div key={i} className="h-36 bg-gray-200 rounded" />
              ))}
            </div>

            <aside className="lg:col-span-1">
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-medium">Shopping Cart</h1>
          <div className="flex items-center gap-3">
            <Button variant={"default"} onClick={() => router.push('/shop/products') }>Continue shopping</Button>
          </div>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-20 text-gray-600">Your cart is empty.</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Items list (left) */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item, idx) => {
                const product = getProduct(item);
                const variant = getVariant(item);
                const itemId = getItemId(item) || `idx-${idx}`;
                const image = product?.images?.[0] || variant?.images?.[0] || "/images/placeholder.png";
                const name = product?.name || "Product";
                const availableVariants = product?.variants || [];

                return (
                  <div
  key={itemId}
  className="bg-white rounded-lg shadow p-4 flex gap-4 border border-gray-100 hover:shadow-md transition"
>
  {/* Product image */}
  <div className="w-28 h-28 relative rounded overflow-hidden flex-shrink-0 bg-gray-50">
    <Image
      src={`${BASE_URL}/${image}`}
      alt={name}
      fill
      className="object-cover"
    />
  </div>

  {/* Details */}
  <div className="flex-1 flex flex-col">
    {/* Top row: name + price */}
    <div className="flex items-start justify-between gap-4">
      <div>
        <div
          onClick={() =>
            product?._id && router.push(`/products/${product._id}`)
          }
          className="text-sm font-medium cursor-pointer hover:underline line-clamp-2"
        >
          {name}
        </div>
        {variant?.name && (
          <div className="text-xs text-gray-500 mt-1">
            Variant: {variant.name}
          </div>
        )}
        <div className="text-xs text-green-600 mt-1">
          {variant?.stock && variant.stock > 0
            ? `${variant.stock} in stock`
            : "Out of stock"}
        </div>
      </div>

      <div className="text-lg font-semibold text-gray-900">
        {formatCurrency(item.price || variant?.price)}
      </div>
    </div>

    {/* Bottom row: qty controls + actions */}
    <div className="mt-auto flex items-center gap-3 pt-3">
      <div className="flex items-center border rounded overflow-hidden">
        <button
          className="px-3 py-1 text-sm"
          onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
          disabled={actionLoading === String(itemId)}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <div className="px-4 py-1 text-sm font-medium">{item.quantity}</div>
        <button
          className="px-3 py-1 text-sm"
          onClick={() => updateQuantity(item, item.quantity + 1)}
          disabled={actionLoading === String(itemId)}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <button
        className="ml-auto inline-flex items-center gap-2 text-sm text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        onClick={() => removeItem(item)}
      >
        <Trash2 className="w-4 h-4 opacity-60" /> Remove
      </button>
    </div>
  </div>
</div>

                );
              })}
            </div>

            {/* Summary (right) - sticky on large screens */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-28">
                <div className="bg-white rounded-lg shadow p-6 w-full">
                  <div className="text-sm text-gray-600">Order summary</div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm">Subtotal</div>
                    <div className="font-semibold">{formatCurrency(subtotal)}</div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                    <div>Estimated shipping</div>
                    <div>₹0</div>
                  </div>

                  <div className="mt-4 border-t pt-4 flex items-center justify-between">
                    <div className="text-base font-semibold">Total</div>
                    <div className="text-xl font-bold">{formatCurrency(subtotal)}</div>
                  </div>

                  <div className="mt-4">
                    <Button onClick={() => router.push('/shop/checkout')} className="w-full">Proceed to checkout</Button>
                  </div>

                  <div className="mt-3 text-xs text-gray-500">Prices include GST where applicable.</div>
                </div>
              </div>
            </aside>
          </div>
        )}

      </main>

      <Snack open={snackOpen} onClose={() => setSnackOpen(false)} message={snackMessage} variant={snackVariant} />
    </div>
  );
}
