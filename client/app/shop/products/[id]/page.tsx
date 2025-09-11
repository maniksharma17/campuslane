"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Image from "next/image";

// Local types matching your schema + populated relations
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

export default function ProductDetailPage(): JSX.Element {
  const { id } = useParams() as { id?: string };
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [mainImage, setMainImage] = useState<string | null>(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    fetchProduct(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!product) return;
    // choose image from selected variant first, otherwise product images
    const variant = product.variants?.[selectedVariantIndex];
    const img = variant?.images?.[0] || product.images?.[0] || null;
    setMainImage(img);
  }, [product, selectedVariantIndex]);

  async function fetchProduct(productId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/products/${productId}`);
      const p: Product | null = res.data?.data || res.data?.product || res.data || null;
      if (!p) {
        setError("Product not found");
        setProduct(null);
      } else {
        setProduct(p);
        setSelectedVariantIndex(0);
        setQuantity(1);
      }
    } catch (err: any) {
      console.error("fetchProduct error", err);
      setError(err?.message || "Failed to load product");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  const selectedVariant = useMemo(() => product?.variants?.[selectedVariantIndex] || null, [product, selectedVariantIndex]);

  function getRefName(ref?: PopulatedRef) {
    if (!ref) return undefined;
    if (typeof ref === "string") return ref;
    return (ref as any).name || (ref as any)._id || undefined;
  }

  function formatDate(d?: string) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("en-IN");
    } catch {
      return d;
    }
  }

  function incQty() {
    if (!selectedVariant) return setQuantity((q) => q + 1);
    setQuantity((q) => Math.min(selectedVariant.stock || 9999, q + 1));
  }
  function decQty() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  async function handleAddToCart() {
  if (!product) return;
  if (!selectedVariant) {
    alert("Please select a variant");
    return;
  }
  if ((selectedVariant.stock ?? 0) < 1) {
    alert("This variant is out of stock");
    return;
  }

  setActionLoading(true);
  try {
    await api.post("/cart/items", {
      productId: product._id,
      variantId: selectedVariant._id, // always send id
      quantity,
      price: selectedVariant.price,
    });

    // ✅ redirect like Amazon
    router.push("/shop/cart");
  } catch (err) {
    console.error("addToCart error", err);
    alert("Failed to add to cart");
  } finally {
    setActionLoading(false);
  }
}


  function handleBuyNow() {
    if (!product || !selectedVariant) return;
    if ((selectedVariant.stock ?? 0) < 1) {
      alert("This variant is out of stock");
      return;
    }
    router.push(`/shop/checkout/buy-now?productId=${encodeURIComponent(product._id)}&variant=${encodeURIComponent(selectedVariant.name)}&quantity=${quantity}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-lg" />
            <div>
              <div className="h-8 bg-gray-200 w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 w-1/2 mb-6" />
              <div className="h-10 bg-gray-200 w-40 mb-2" />
              <div className="h-10 bg-gray-200 w-40 mt-4" />
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
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-sm text-red-600">{error}</div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-sm text-gray-600">Product not found.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-4">Home / {getRefName(product.category) || "Category"} / {product.name}</div>

        <div className="grid md:grid-cols-[1.2fr_0.9fr] gap-8">
          {/* Left: Large image + thumbnails + additional images */}
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex gap-4 p-4">
                {/* thumbnails column (hidden on small screens) */}
                <div className="hidden md:flex flex-col gap-3">
                  {((selectedVariant?.images && selectedVariant.images.length) ? selectedVariant.images : product.images).map((img, i) => (
                    <button key={i} onClick={() => setMainImage(img)} className={`w-20 h-20 rounded-md overflow-hidden border ${mainImage === img ? 'border-gray-800' : 'border-gray-200'}`}>
                      <Image src={img} alt={`${product.name} ${i}`} width={80} height={80} className="object-cover" />
                    </button>
                  ))}
                </div>

                {/* main image */}
                <div className="flex-1 min-h-[520px] bg-gray-100 relative rounded-md overflow-hidden">
                  {mainImage ? (
                    <Image src={mainImage} alt={product.name} fill className="object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>
              </div>

              {/* mobile thumbnails */}
              <div className="md:hidden px-4 pt-3 pb-4">
                <div className="flex gap-2 overflow-x-auto">
                  {((selectedVariant?.images && selectedVariant.images.length) ? selectedVariant.images : product.images).map((img, i) => (
                    <button key={i} onClick={() => setMainImage(img)} className={`w-20 h-20 rounded-md overflow-hidden border ${mainImage === img ? 'border-gray-800' : 'border-gray-200'}`}>
                      <Image src={img} alt={`${product.name} ${i}`} width={80} height={80} className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* full width product description and details below (amazon style) */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Product description</h2>
              <div className="text-sm text-gray-700 leading-relaxed">
                {product.description || "No description available."}
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Product details</h2>
              <table className="w-full text-sm text-gray-700">
                <tbody>
                  <tr className="border-b"><td className="py-2 font-medium w-48">Brand</td><td className="py-2">{product.brand || '—'}</td></tr>
                  <tr className="border-b"><td className="py-2 font-medium">Category</td><td className="py-2">{getRefName(product.category) || '—'}</td></tr>
                  <tr className="border-b"><td className="py-2 font-medium">Gender</td><td className="py-2">{product.gender || '—'}</td></tr>
                  <tr className="border-b"><td className="py-2 font-medium">Subject</td><td className="py-2">{product.subject || '—'}</td></tr>
                  <tr className="border-b"><td className="py-2 font-medium">Class level</td><td className="py-2">{getRefName(product.classLevel) || '—'}</td></tr>
                  <tr className="border-b"><td className="py-2 font-medium">School</td><td className="py-2">{getRefName(product.school) || '—'}</td></tr>
                  <tr className="border-b"><td className="py-2 font-medium">Type</td><td className="py-2">{product.type || '—'}</td></tr>
                  <tr className="border-b"><td className="py-2 font-medium">Created</td><td className="py-2">{formatDate(product.createdAt)}</td></tr>
                  <tr><td className="py-2 font-medium">Last updated</td><td className="py-2">{formatDate(product.updatedAt)}</td></tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Right column: purchase card */}
          <aside className="sticky top-20">
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>

              <div className="text-sm text-gray-600 mb-4">{getRefName(product.category) || '—'}</div>

              {/* Price area */}
              <div className="mb-4">
                {selectedVariant ? (
                  <div>
                    <div className="text-3xl font-bold">₹{selectedVariant.price}</div>
                    {selectedVariant.cutoffPrice ? (
                      <div className="text-sm text-gray-500 line-through">₹{selectedVariant.cutoffPrice}</div>
                    ) : null}
                    {selectedVariant.cutoffPrice ? (
                      <div className="text-sm text-green-600">Save ₹{(selectedVariant.cutoffPrice - selectedVariant.price)}</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Price not available</div>
                )}
              </div>

              {/* Variant selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Select variant</div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedVariantIndex(idx); setQuantity(1); }}
                        className={`px-3 py-1.5 text-sm rounded-md border ${selectedVariantIndex === idx ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock and quantity */}
              <div className="mb-4">
                <div className="text-sm text-gray-700 mb-2">{selectedVariant ? (selectedVariant.stock > 0 ? `${selectedVariant.stock} in stock` : 'Out of stock') : ''}</div>

                <div className="flex items-center gap-3">
                  <button onClick={decQty} className="px-3 py-1 border rounded-md">-</button>
                  <div className="px-3 py-1 border rounded-md">{quantity}</div>
                  <button onClick={incQty} className="px-3 py-1 border rounded-md">+</button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-3">
                <Button onClick={handleAddToCart} variant="outline" className="flex-1" disabled={actionLoading || (selectedVariant?.stock ?? 0) < 1}>
                  {actionLoading ? 'Adding...' : 'Add to cart'}
                </Button>
                <Button onClick={handleBuyNow} className="flex-1" disabled={(selectedVariant?.stock ?? 0) < 1}>
                  Buy now
                </Button>
              </div>

              {/* Small meta */}
              <div className="text-xs text-gray-500">
                <div>Brand: {product.brand || '—'}</div>
                <div>Gender: {product.gender || '—'}</div>
              </div>
            </div>
          </aside>
        </div>

      </main>
    </div>
  );
}
