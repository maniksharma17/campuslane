"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import api from "@/lib/api";
import Snack from "@/components/ui/snack";
import { Trash2, ShoppingCart } from "lucide-react";

type Variant = {
  _id?: string;
  name?: string;
  price?: number;
  cutoffPrice?: number;
  stock?: number;
  images?: string[];
};

type Product = {
  _id: string;
  name: string;
  description?: string;
  images?: string[];
  variants?: Variant[];
  category?: { _id?: string; name?: string } | string;
};

export default function WishlistPage(): JSX.Element {
  const router = useRouter();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  // snack
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVariant, setSnackVariant] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWishlist() {
    setLoading(true);
    try {
      const res = await api.get("/wishlist");
      // support multiple response shapes:
      // { data: [products] } or { data: { products: [...] } } or { data: { items: [...] } } or res.data (legacy)
      const payload = res.data?.data ?? res.data ?? null;

      let products: Product[] = [];
      if (Array.isArray(payload)) {
        products = payload;
      } else if (payload) {
        // common shapes:
        products =
          payload.products ??
          payload.items ??
          payload.docs ??
          payload.data ??
          [];
      }

      // normalize: if items are IDs only, show empty (frontend can prompt)
      const mapped = Array.isArray(products) ? products : [];
      setItems(mapped);
    } catch (err) {
      console.error("fetchWishlist error", err);
      setItems([]);
      setSnackMessage("Failed to load wishlist");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => (p.name || "").toLowerCase().includes(q));
  }, [items, search]);

  // pick best variant: first in-stock, else first variant, else undefined
  function pickVariant(product: Product): Variant | undefined {
    const v = product.variants || [];
    if (!v.length) return undefined;
    const inStock = v.find((x) => (x.stock ?? 0) > 0);
    return inStock ?? v[0];
  }

  function formatCurrency(n?: number) {
    if (typeof n !== "number") return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  }

  async function handleAddToCart(product: Product) {
    if (!product) return;
    const variant = pickVariant(product);
    if (!variant) {
      setSnackMessage("No variant available for this product");
      setSnackVariant("error");
      setSnackOpen(true);
      return;
    }
    if ((variant.stock ?? 0) < 1) {
      setSnackMessage("Selected variant is out of stock");
      setSnackVariant("error");
      setSnackOpen(true);
      return;
    }

    setActionLoading(product._id);
    try {
      await api.post("/cart/items", {
        productId: product._id,
        variantId: variant._id,
        quantity: 1,
        price: variant.price,
      });

      setSnackMessage("Added to cart");
      setSnackVariant("success");
      setSnackOpen(true);

      // redirect to cart so user can checkout (industry-standard)
      router.push("/shop/cart");
    } catch (err: any) {
      console.error("addToCart error", err);
      const message = err?.response?.data?.message || "Failed to add to cart";
      setSnackMessage(message);
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(productId?: string) {
    if (!productId) return;
    setActionLoading(productId);
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems((prev) => prev.filter((p) => p._id !== productId));
      setSnackMessage("Removed from wishlist");
      setSnackVariant("success");
      setSnackOpen(true);
    } catch (err) {
      console.error("removeFromWishlist error", err);
      setSnackMessage("Failed to remove item");
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-medium">My Wishlist</h1>

          <div className="flex items-center gap-3">
            <input
              aria-label="Search wishlist"
              placeholder="Search wishlist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm font-medium w-56 bg-white"
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="p-4 bg-white rounded-lg shadow animate-pulse h-44"
                style={{ minHeight: 176 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-lg font-medium">No items in your wishlist</div>
            <div className="text-sm text-gray-600 mt-2">Browse products and tap the ♥ to save them here.</div>
            <div className="mt-4">
              <Button onClick={() => router.push("/shop/products")}>Shop products</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const variant = pickVariant(p);
              const image = p.images?.[0] || p.variants?.[0]?.images?.[0] || "/images/placeholder.png";
              return (
                <article
                  key={p._id}
                  className="bg-white rounded-lg shadow overflow-hidden cursor-default hover:shadow-md transition"
                >
                  <div
                    className="h-44 w-full relative bg-gray-100"
                    onClick={() => router.push(`/products/${p._id}`)}
                    role="link"
                    tabIndex={0}
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${image}`}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>

                  <div className="p-3 flex flex-col" style={{ minHeight: 150 }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3
                          onClick={() => router.push(`/products/${p._id}`)}
                          className="text-sm font-medium cursor-pointer hover:underline line-clamp-2"
                        >
                          {p.name}
                        </h3>
                        {variant?.name && (
                          <div className="text-xs text-gray-500 mt-1 font-medium">
                            Variant: {variant.name}
                          </div>
                        )}
                        <div className="text-xs mt-1 font-medium text-green-600">
                          {variant?.stock && variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                        </div>
                      </div>

                      <div className="text-sm font-medium">
                        {formatCurrency(variant?.price)}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-3">
                      <Button
                        onClick={() => handleAddToCart(p)}
                        variant="outline"
                        className="flex-1 text-sm font-medium"
                        disabled={actionLoading === p._id || (variant?.stock ?? 0) < 1}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" /> Add to cart
                      </Button>

                      <button
                        onClick={() => handleRemove(p._id)}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm text-gray-700 rounded hover:bg-gray-100"
                        disabled={actionLoading === p._id}
                        aria-label={`Remove ${p.name} from wishlist`}
                      >
                        <Trash2 className="w-4 h-4 opacity-80" />
                        <span className="font-medium">Remove</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <Snack open={snackOpen} onClose={() => setSnackOpen(false)} message={snackMessage} variant={snackVariant} />
      </main>
    </div>
  );
}
