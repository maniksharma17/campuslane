// File: ProductDetailPage.tsx
// Redesigned Product Detail page — image column sticky, rest scrollable, max-width aligned with products page, skeleton fixed under navbar.

"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Image from "next/image";
import Snack from "@/components/ui/snack";
import { Heart, ShoppingCart, ArrowLeft } from "lucide-react";

// --- Types ---
type Variant = {
  _id?: string;
  name: string;
  price: number;
  cutoffPrice?: number;
  stock: number;
  images?: string[];
};

type PopulatedRef = { _id?: string; name?: string } | string | undefined;

type Product = {
  _id: string;
  name: string;
  description?: string;
  category?: PopulatedRef;
  images: string[];
  variants?: Variant[];
  school?: PopulatedRef;
  gender?: string;
  classLevel?: PopulatedRef;
  subject?: string;
  brand?: string;
  type?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const BASE_URL=process.env.NEXT_PUBLIC_AWS_STORAGE_URL

export default function ProductDetailPage(): JSX.Element {
  const { id } = useParams() as { id?: string };
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // snack/toast
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVariant, setSnackVariant] = useState<
    "success" | "error" | "info"
  >("info");

  const mainImageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchProduct(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchProduct(productId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/products/${productId}`);
      // support multiple response shapes
      const p: Product | null =
        res.data?.data || res.data?.product || res.data || null;
      if (!p) {
        setError("Product not found");
        setProduct(null);
      } else {
        setProduct(p);
        // choose default variant: first with stock > 0 or first variant or null
        let defaultIndex = 0;
        if (p.variants && p.variants.length > 0) {
          const inStockIndex = p.variants.findIndex((v) => (v.stock ?? 0) > 0);
          defaultIndex = inStockIndex >= 0 ? inStockIndex : 0;
        }
        setSelectedVariantIndex(defaultIndex);
        setQuantity(1);
        const variant = p.variants?.[defaultIndex];
        const img = variant?.images?.[0] || p.images?.[0] || null;
        setMainImage(img);
      }
    } catch (err: any) {
      console.error("fetchProduct error", err);
      setError(
        err?.response?.data?.error.message || err?.message || "Failed to load product"
      );
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    const arr = product.variants || [];
    return arr[selectedVariantIndex] || arr[0] || null;
  }, [product, selectedVariantIndex]);

  function getRefName(ref?: PopulatedRef) {
    if (!ref) return undefined;
    if (typeof ref === "string") return ref;
    return (ref as any).name || (ref as any)._id || undefined;
  }

  function formatCurrency(n?: number) {
    if (typeof n !== "number") return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })
      .format(n)
      .replace("₹", "₹");
  }

  function incQty() {
    if (!selectedVariant) return setQuantity((q) => q + 1);
    setQuantity((q) => Math.min(selectedVariant.stock ?? 9999, q + 1));
  }
  function decQty() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  // --- Actions ---
  async function handleAddToCart() {
    if (!product) return;
    if (!selectedVariant) {
      setSnackMessage("Please select a variant before adding to cart.");
      setSnackVariant("info");
      setSnackOpen(true);
      return;
    }
    if ((selectedVariant.stock ?? 0) < 1) {
      setSnackMessage("This variant is out of stock.");
      setSnackVariant("error");
      setSnackOpen(true);
      return;
    }

    if (quantity < 1) {
      setSnackMessage("Please select a valid quantity.");
      setSnackVariant("info");
      setSnackOpen(true);
      return;
    }

    setActionLoading(true);
    try {
      await api.post("/cart/items", {
        productId: product._id,
        variantId: selectedVariant._id,
        quantity,
        price: selectedVariant.price,
      });

      setSnackMessage("Added to cart");
      setSnackVariant("success");
      setSnackOpen(true);

      // keep UX snappy: short delay so user sees snack, then redirect
      setTimeout(() => router.push("/shop/cart"), 700);
    } catch (err: any) {
      console.error("addToCart error", err);
      const message =
        err?.response?.data?.error.message ||
        "Failed to add to cart. Please try again.";
      setSnackMessage(message);
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddToWishlist() {
    if (!product) return;
    setWishlistLoading(true);
    try {
      await api.post("/wishlist", { productId: product._id });
      setIsWishlisted(true);
      setSnackMessage("Added to wishlist");
      setSnackVariant("success");
      setSnackOpen(true);
    } catch (err: any) {
      console.error("addToWishlist error", err);
      const message =
        err?.response?.data?.error.message || "Failed to add to wishlist";
      setSnackMessage(message);
      setSnackVariant("error");
      setSnackOpen(true);
    } finally {
      setWishlistLoading(false);
    }
  }

  // small helpers
  function renderPrice() {
    if (selectedVariant) {
      return (
        <div>
          <div className="text-3xl font-bold">
            {formatCurrency(selectedVariant.price)}
          </div>
          {selectedVariant.cutoffPrice ? (
            <div className="flex items-center gap-3 mt-1">
              <div className="text-sm text-gray-500 line-through">
                {formatCurrency(selectedVariant.cutoffPrice)}
              </div>
              <div className="text-sm text-green-600">
                Save{" "}
                {formatCurrency(
                  (selectedVariant.cutoffPrice || 0) - selectedVariant.price
                )}
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    // fallback: compute minPrice across variants
    const min = product?.variants?.reduce(
      (acc, v) => Math.min(acc, v.price),
      Infinity
    );
    if (min && isFinite(min))
      return <div className="text-2xl font-medium">{formatCurrency(min)}</div>;
    return <div className="text-sm text-gray-600">Price not available</div>;
  }

  // --- LAYOUT & SKELETON --------------------------------------------------
  const topOffsetClass = "top-28"; // adjust if navbar height changes

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="animate-pulse grid md:grid-cols-12 gap-8">
            <div className="md:col-span-7">
              <div className="h-[60vh] bg-gray-200 rounded-lg" />
              <div className="mt-6 h-40 bg-gray-200 rounded-lg" />
            </div>
            <div className="md:col-span-5 space-y-4">
              <div className="h-10 bg-gray-200 rounded-lg w-3/4" />
              <div className="h-8 bg-gray-200 rounded-lg w-full" />
              <div className="h-8 bg-gray-200 rounded-lg w-full" />
              <div className="h-40 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="text-sm text-red-600">{error}</div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="text-sm text-gray-600">Product not found.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="lg:sticky lg:top-32 flex items-center gap-4 text-sm text-gray-600 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span> / </span>
          <div>{getRefName(product.category) || "Category"}</div>
          <span> / </span>
          <div className="font-medium truncate max-w-[30rem]">
            {product.name}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Image column (sticky on large screens) */}
          <div className="lg:col-span-7 lg:sticky lg:top-40">
            <div className="w-full bg-white rounded-md">
              <div className="rounded-lg shadow overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Thumbnails */}
                  <div className="hidden md:flex flex-col gap-3">
                    {(selectedVariant?.images && selectedVariant.images.length
                      ? selectedVariant.images
                      : product.images || []
                    ).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMainImage(img);
                          mainImageRef.current?.focus();
                        }}
                        aria-label={`Show image ${i + 1}`}
                        className={`w-20 h-20 rounded-md overflow-hidden border ${
                          mainImage === img
                            ? "border-gray-500"
                            : "border-gray-200"
                        }`}
                      >
                        <Image
                          src={`${BASE_URL}/${img}`}
                          alt={`${product.name} ${i + 1}`}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Main image - natural height, no sticky, no stretch */}
                  <div
                    ref={mainImageRef}
                    tabIndex={0}
                    className="flex-1 bg-gray-100 relative rounded-md overflow-hidden flex items-center justify-center h-[500px]"
                  >
                    {mainImage ? (
                      <Image
                        src={`${BASE_URL}/${mainImage}`}
                        alt={product.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile thumbnails */}
                <div className="md:hidden px-4 pt-3 pb-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {(selectedVariant?.images && selectedVariant.images.length
                      ? selectedVariant.images
                      : product.images || []
                    ).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setMainImage(img)}
                        className={`w-20 h-20 rounded-md overflow-hidden border ${
                          mainImage === img
                            ? "border-gray-800"
                            : "border-gray-200"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} ${i + 1}`}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: purchase card and actions (non-sticky - scrolls with page) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-lg shadow p-6 w-full mx-auto lg:mx-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-4 text-md text-gray-600">
                    <div>{product.brand || "—"}</div>
                  </div>
                  <h1 className="text-xl font-medium">{product.name}</h1>
                  <div className="text-sm text-gray-600">
                    {getRefName(product.category) || "—"}
                  </div>
                </div>
                <button
                  aria-label="Add to wishlist"
                  onClick={handleAddToWishlist}
                  disabled={wishlistLoading}
                  className="p-2 rounded-full hover:bg-gray-100 ml-2"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isWishlisted ? "text-red-500" : "text-gray-400"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4">{renderPrice()}</div>

              {/* variant selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Variants</div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, idx) => (
                      <button
                        key={v._id || idx}
                        onClick={() => {
                          setSelectedVariantIndex(idx);
                          setQuantity(1);
                          setMainImage(
                            (v.images && v.images[0]) ||
                              product.images?.[0] ||
                              null
                          );
                        }}
                        aria-pressed={selectedVariantIndex === idx}
                        className={`px-3 py-1.5 rounded-md border text-sm ${
                          selectedVariantIndex === idx
                            ? "bg-primary text-white"
                            : "bg-white text-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="min-w-[140px] text-left">
                            <div className="font-medium">{v.name}</div>
                            <div className="text-xs">
                              {v.stock > 0
                                ? `${v.stock} in stock`
                                : "Out of stock"}
                            </div>
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency(v.price)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* quantity */}
              <div className="mt-4 flex items-center gap-3">
                <div className="text-sm">Quantity</div>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <button
                    aria-label="Decrease quantity"
                    onClick={decQty}
                    className="px-3 py-1"
                  >
                    -
                  </button>
                  <input
                    aria-label="Quantity"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value || 1)))
                    }
                    className="w-16 text-center"
                  />
                  <button
                    aria-label="Increase quantity"
                    onClick={incQty}
                    className="px-3 py-1"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* actions */}
              <div className="mt-6 flex gap-3">
                <Button
                  variant={"default"}
                  onClick={handleAddToCart}
                  className="flex-1"
                  disabled={actionLoading || (selectedVariant?.stock ?? 0) < 1}
                >
                  {actionLoading ? (
                    "Adding..."
                  ) : (
                    <div className="flex items-center gap-2 justify-center">
                      <ShoppingCart className="w-4 h-4" /> Add to cart
                    </div>
                  )}
                </Button>

              </div>
            </div>

            <div className="mt-6">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-medium mb-3">
                  Product description
                </h2>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {product.description || "No description available."}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-3">Product details</h2>
                <table className="w-full text-sm text-gray-700">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-medium w-48">Brand</td>
                      <td className="py-2">{product.brand || "—"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Category</td>
                      <td className="py-2">
                        {getRefName(product.category) || "—"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Gender</td>
                      <td className="py-2">{product.gender || "—"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Subject</td>
                      <td className="py-2">{product.subject || "—"}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Class level</td>
                      <td className="py-2">
                        {getRefName(product.classLevel) || "—"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">School</td>
                      <td className="py-2">
                        {getRefName(product.school) || "—"}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Type</td>
                      <td className="py-2">{product.type || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* snack */}
        <Snack
          open={snackOpen}
          onClose={() => setSnackOpen(false)}
          message={snackMessage}
          variant={snackVariant}
        />
      </main>
    </div>
  );
}
