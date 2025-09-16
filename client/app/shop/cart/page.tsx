"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Image from "next/image";
import Snack from "@/components/ui/snack";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

const BASE_URL = process.env.NEXT_PUBLIC_AWS_STORAGE_URL || "";

/**
 * Types (loosened to match the various shapes in your API)
 */
type Variant = {
  _id?: string;
  id?: string;
  name?: string;
  price?: number;
  cutoffPrice?: number;
  stock?: number;
  images?: string[];
};

type Category = {
  _id?: string;
  name?: string;
};

type ProductRef = {
  _id?: string;
  name?: string;
  images?: string[];
  variants?: Variant[];
  selectedVariant?: Variant;
  category?: Category;
};

type CartItem = {
  _id?: string; // server-side cart item id
  productId?: ProductRef | string; // populated product or product id string
  variantId?: Variant | string; // variant object or id string
  quantity: number;
  price: number; // per-item price (from your JSON)
  [k: string]: any;
};

type Cart = { _id?: string; userId?: string; items: CartItem[] } | null;

/**
 * Helpers
 */
function isString(x: unknown): x is string {
  return typeof x === "string";
}

/** Safely get the populated product object if present */
function getProductFromItem(item: CartItem): ProductRef | undefined {
  // some responses may use `item.product` or `item.productId`
  const p = (item as any).product ?? item.productId;
  if (!p) return undefined;
  return isString(p) ? undefined : (p as ProductRef);
}

/** Get the variant object (prioritize explicit variant object, then product.selectedVariant, then match by id) */
function getVariantFromItem(item: CartItem): Variant | undefined {
  if (!item) return undefined;

  // 1) variantId might be populated as object
  if (item.variantId && !isString(item.variantId)) {
    return item.variantId as Variant;
  }

  // 2) product.selectedVariant (your payload has this)
  const product = getProductFromItem(item);
  if (product?.selectedVariant) return product.selectedVariant as Variant;

  // 3) find in product.variants by matching id/_id
  if (product?.variants && item.variantId) {
    const variantIdStr = String(item.variantId);
    return product.variants.find((v) => {
      if (!v) return false;
      return (v._id && String(v._id) === variantIdStr) || (v.id && String(v.id) === variantIdStr);
    });
  }

  return undefined;
}

/** Resolve a stable key for rendering (prefer cart item _id, fallback to product+variant combo) */
function getRenderKey(item: CartItem, idx: number) {
  if (item._id) return item._id;
  const product = getProductFromItem(item);
  const variant = getVariantFromItem(item);
  return `${product?._id ?? "product"}-${variant?.id ?? variant?._id ?? "variant"}-${idx}`;
}

/** Prefer cart item _id for server calls; return undefined if not present */
function getServerCartItemId(item: CartItem): string | undefined {
  return item._id;
}

/** Resolve a variant id string to send to the backend */
function resolveVariantIdForApi(item: CartItem): string | undefined {
  const variant = getVariantFromItem(item);
  if (variant) return variant.id ?? variant._id;
  // variantId might already be a string
  if (item.variantId && isString(item.variantId)) return item.variantId;
  return undefined;
}

/** Build full image URL safely */
function buildImageUrl(path?: string) {
  if (!path) return "/images/placeholder.png";
  const trimmedBase = BASE_URL.replace(/\/+$/, "");
  const trimmedPath = path.replace(/^\/+/, "");
  return trimmedBase ? `${trimmedBase}/${trimmedPath}` : `/${trimmedPath}`;
}

export default function CartPage(): JSX.Element {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  // snack
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVariant, setSnackVariant] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    // If user is not authenticated, redirect to auth
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    // fetch cart only when authenticated
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router]);

  async function fetchCart() {
    setLoading(true);
    try {
      const res = await api.get("/cart");
      // server shape may be { data: { data: ... } } or { data: ... }
      const data = res.data?.data ?? res.data ?? null;
      setCart(data);
    } catch (err: any) {
      console.error("fetchCart error", err);
      setCart(null);
      setSnackMessage("Failed to load cart");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(n?: number) {
    if (typeof n !== "number") return "₹0";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  }

  // Subtotal uses the cart item's price * quantity (per your JSON)
  const subtotal = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
  }, [cart]);

  /** Update quantity with optimistic UI (only when item._id exists), otherwise fallback to server refresh */
  async function updateQuantity(item: CartItem, newQty: number) {
    if (newQty < 1) return;

    const serverItemId = getServerCartItemId(item);
    const clientKey = getRenderKey(item, 0);

    // Prepare variantId for API
    const variantIdForApi = resolveVariantIdForApi(item);

    // If there's no server cart item id, do a direct refresh attempt (can't patch unknown id)
    if (!serverItemId) {
      setActionLoading("update-fallback");
      try {
        await api.patch(`/cart/items`, { productId: typeof item.productId === "string" ? item.productId : (item.productId as any)?._id, variantId: variantIdForApi, quantity: newQty });
        await fetchCart();
      } catch (err: any) {
        console.error("updateQuantity fallback error", err);
        setSnackMessage(err?.response?.data?.message || "Failed to update quantity");
        setSnackVariant("error");
        setSnackOpen(true);
      } finally {
        setActionLoading(null);
      }
      return;
    }

    setActionLoading(String(serverItemId));
    // optimistic update
    const prev = cart;
    setCart((c) => {
      if (!c) return c;
      return {
        ...c,
        items: c.items.map((it) =>
          getServerCartItemId(it) === serverItemId ? { ...it, quantity: newQty } : it
        ),
      };
    });

    try {
      await api.patch(`/cart/items/${serverItemId}`, { quantity: newQty, variantId: variantIdForApi });
      // fetch authoritative state
      await fetchCart();
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

  async function removeItem(item: CartItem) {
    const serverItemId = getServerCartItemId(item);
    if (!serverItemId) {
      // fallback: attempt delete by product+variant
      setActionLoading("remove-fallback");
      try {
        await api.delete("/cart/items", { data: { productId: typeof item.productId === "string" ? item.productId : (item.productId as any)?._id, variantId: resolveVariantIdForApi(item) } });
        await fetchCart();
      } catch (err: any) {
        console.error("removeItem fallback error", err);
        setSnackMessage(err?.response?.data?.message || "Failed to remove item");
        setSnackVariant("error");
        setSnackOpen(true);
      } finally {
        setActionLoading(null);
      }
      return;
    }

    setActionLoading(String(serverItemId));
    try {
      await api.delete(`/cart/items/${serverItemId}`);
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
      setSnackMessage("Cart cleared");
      setSnackVariant("success");
      setSnackOpen(true);
    } catch (err: any) {
      console.error("clearCart error", err);
      setSnackMessage(err?.response?.data?.message || "Failed to clear cart");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setActionLoading(null);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="animate-pulse grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-12 bg-gray-200 rounded" />
              {[1, 2, 3].map((i) => (
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
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h1 className="text-2xl font-medium">Shopping Cart</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button variant={"default"} onClick={() => router.push("/shop/products")}>
              Continue shopping
            </Button>
            <Button variant={"ghost"} onClick={clearCart} disabled={actionLoading === "clear" || !cart || cart.items.length === 0}>
              Clear cart
            </Button>
          </div>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-20 text-gray-600">Your cart is empty.</div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Items list (left) */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item, idx) => {
                const product = getProductFromItem(item);
                const variant = getVariantFromItem(item);
                const itemId = getRenderKey(item, idx);
                const image = variant?.images?.[0] || product?.images?.[0] || "/images/placeholder.png";
                const imageSrc = buildImageUrl(image);
                const name = product?.name || "Product";
                const availableVariants = product?.variants || [];

                const serverItemId = getServerCartItemId(item);
                const disabled = actionLoading !== null && actionLoading !== "clear" && actionLoading !== "update-fallback" && actionLoading !== "remove-fallback" && actionLoading !== String(serverItemId);

                return (
                  <div
                    key={itemId}
                    className="bg-white rounded-lg shadow p-4 flex gap-4 border border-gray-100 hover:shadow-md transition"
                  >
                    {/* Product image */}
                    <div className="w-28 h-28 relative rounded overflow-hidden flex-shrink-0 bg-gray-50">
                      <Image src={imageSrc} alt={name} fill className="object-cover" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col min-w-0">
                      {/* Top row: name + price */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div
                            onClick={() => product?._id && router.push(`/products/${product._id}`)}
                            className="text-sm font-medium cursor-pointer hover:underline line-clamp-2"
                          >
                            {name}
                          </div>

                          {/* Category */}
                          {product?.category?.name && (
                            <div className="text-xs text-gray-500 mt-1">{product.category.name}</div>
                          )}

                          {/* Variant name */}
                          {variant?.name && <div className="text-xs text-gray-500 mt-1">Variant: {variant.name}</div>}

                          {/* Stock */}
                          <div className="text-xs text-green-600 mt-1">
                            {variant?.stock && variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                          </div>
                        </div>

                        <div className="text-right">
                          {variant?.cutoffPrice ? (
                            <div className="text-xs text-gray-400 line-through">{formatCurrency(variant.cutoffPrice)}</div>
                          ) : null}
                          <div className="text-lg font-semibold text-gray-900">{formatCurrency(item.price || variant?.price)}</div>
                        </div>
                      </div>

                      {/* Bottom row: qty controls + actions */}
                      <div className="mt-auto flex items-center gap-3 pt-3">
                        <div className="flex items-center border rounded overflow-hidden">
                          <button
                            className="px-3 py-1 text-sm"
                            onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                            disabled={disabled || actionLoading === "update-fallback" || actionLoading === String(serverItemId)}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <div className="px-4 py-1 text-sm font-medium">{item.quantity}</div>
                          <button
                            className="px-3 py-1 text-sm"
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            disabled={disabled || actionLoading === "update-fallback" || actionLoading === String(serverItemId)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="ml-auto inline-flex items-center gap-2 text-sm text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                          onClick={() => removeItem(item)}
                          disabled={disabled || actionLoading === String(serverItemId)}
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
                    <Button onClick={() => router.push("/shop/checkout")} className="w-full" disabled={subtotal <= 0}>
                      Proceed to checkout
                    </Button>
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
