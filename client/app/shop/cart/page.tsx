"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Image from "next/image";

type Variant = { _id?: string; name: string; price: number; cutoffPrice?: number; stock?: number; images?: string[] };

type ProductRef = { _id?: string; name?: string; images?: string[]; variants?: Variant[] } | string;

type CartItem = {
  _id?: string; // cart item id
  productId?: ProductRef; // populated or id
  variantId?: Variant | string; // populated or id
  quantity: number;
  price: number;
};

type Cart = { _id?: string; userId?: string; items: CartItem[] };

export default function CartPage(): JSX.Element {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // itemId being updated

  useEffect(() => {
    fetchCart();
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
    } finally {
      setLoading(false);
    }
  }

  function getProduct(item: CartItem): ProductRef | undefined {
    return (item as any).product || item.productId;
  }
  function getVariant(item: CartItem): Variant | undefined {
    return (item as any).variant || (item.variantId && typeof item.variantId !== 'string' ? (item.variantId as Variant) : undefined);
  }
  function getItemId(item: CartItem) {
    return item._id || (item as any).id;
  }

  const subtotal = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((s, it) => s + (it.price || (getVariant(it)?.price || 0)) * (it.quantity || 0), 0);
  }, [cart]);

  async function updateQuantity(item: CartItem, newQty: number) {
    const itemId = getItemId(item);
    if (!itemId) return;
    setActionLoading(itemId);
    try {
      await api.patch(`/cart/items/${itemId}`, { quantity: newQty });
      await fetchCart();
    } catch (err) {
      console.error("updateQuantity error", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function changeVariant(item: CartItem, variantId: string) {
    const itemId = getItemId(item);
    if (!itemId) return;
    setActionLoading(itemId);
    try {
      await api.patch(`/cart/items/${itemId}`, { variantId });
      await fetchCart();
    } catch (err) {
      console.error("changeVariant error", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function removeItem(item: CartItem) {
    const itemId = getItemId(item);
    if (!itemId) return;
    setActionLoading(itemId);
    try {
      await api.delete(`/cart/items/${itemId}`);
      await fetchCart();
    } catch (err) {
      console.error("removeItem error", err);
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
    } catch (err) {
      console.error("clearCart error", err);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-10">
          <div className="animate-pulse grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="h-12 bg-gray-200 rounded" />
              <div className="h-36 bg-gray-200 rounded" />
              <div className="h-36 bg-gray-200 rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-10 lg:pt-28">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-medium">Shopping Cart</h1>
          <div>
            <Button variant="outline" onClick={clearCart} disabled={actionLoading === 'clear'}>Clear cart</Button>
          </div>
        </div>

        {!cart || (cart.items || []).length === 0 ? (
          <div className="text-center py-16 text-gray-600">Your cart is empty.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Items list */}
            <div className="md:col-span-2 space-y-4">
              {cart.items.map((item, idx) => {
                const product = getProduct(item) as ProductRef | undefined;
                const variant = getVariant(item);
                const itemId = getItemId(item);
                const image = (product && typeof product !== 'string' && product.images && product.images[0]) || "/images/placeholder.png";
                const name = (product && typeof product !== 'string' && product.name) || "Product";
                const availableVariants = (product && typeof product !== 'string' && product.variants) || [];

                return (
                  <div key={itemId || idx} className="bg-white rounded-lg shadow p-4 flex gap-4">
                    <div className="w-28 h-28 relative rounded overflow-hidden">
                      <Image src={image} alt={name} fill className="object-cover" />
                    </div>

                    <div className="flex-1">
                      <a onClick={() => router.push(`/products/${(product as any)?._id || product}`)} className="text-sm font-medium cursor-pointer">{name}</a>
                      <div className="text-xs text-gray-500 mt-1">Variant: {variant?.name || (typeof item.variantId === 'string' ? item.variantId : '—')}</div>

                      {/* Variant select */}
                      {availableVariants.length > 0 && (
                        <div className="mt-2">
                          <select
                            value={(variant && variant._id) || ''}
                            onChange={(e) => changeVariant(item, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                            >
                            {availableVariants.map((v) => (
                              <option key={(v as any)._id || v.name} value={(v as any)._id || v.name}>{v.name} — ₹{v.price}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center border rounded">
                          <button className="px-3 py-1" onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))} disabled={actionLoading === itemId}>-</button>
                          <div className="px-4 py-1">{item.quantity}</div>
                          <button className="px-3 py-1" onClick={() => updateQuantity(item, item.quantity + 1)} disabled={actionLoading === itemId}>+</button>
                        </div>

                        <div className="text-sm font-semibold">₹{(item.price || (variant?.price || 0)) * item.quantity}</div>

                        <button className="text-sm text-gray-600 underline" onClick={() => removeItem(item)} disabled={actionLoading === itemId}>Remove</button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <aside className="">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-600">Order summary</div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm">Subtotal</div>
                  <div className="font-semibold">₹{subtotal}</div>
                </div>

                <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                  <div>Estimated shipping</div>
                  <div>₹0</div>
                </div>

                <div className="mt-4 border-t pt-4 flex items-center justify-between">
                  <div className="text-base font-semibold">Total</div>
                  <div className="text-xl font-bold">₹{subtotal}</div>
                </div>

                <div className="mt-4">
                  <Button onClick={() => router.push('/shop/checkout')} className="w-full">Proceed to checkout</Button>
                </div>

                <div className="mt-3 text-xs text-gray-500">Prices include GST where applicable.</div>
              </div>
            </aside>

          </div>
        )}

      </main>
    </div>
  );
}
