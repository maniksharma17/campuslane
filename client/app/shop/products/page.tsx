// File: app/(shop)/products/page.tsx
// React + Next.js (use client) — redesigned UI with search, category chips, filters, server-side search & pagination.

"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Image from "next/image";
import Snack from "@/components/ui/snack";
import { Heart } from "lucide-react";

// --- Local types (tight to server response) ---
type Category = { _id: string; name: string; image?: string };
type Variant = {
  _id?: string;
  name: string;
  price: number;
  cutoffPrice?: number;
  stock: number;
  images?: string[];
};
type Product = {
  _id: string;
  name: string;
  description?: string;
  images?: string[];
  variants: Variant[];
  category?: { _id?: string; name?: string; image?: string } | string;
  brand?: string;
  minPrice?: number; // server returns aggregated minPrice
  totalStock?: number; // aggregated stock
  createdAt?: string;
};

const BASE_URL=process.env.NEXT_PUBLIC_AWS_STORAGE_URL


export default function ProductsPage(): JSX.Element {
  const router = useRouter();

  // data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  // ui state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVariant, setSnackVariant] = useState<
    "success" | "error" | "info"
  >("info");

  // filter state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [gender, setGender] = useState<"" | "Boys" | "Girls" | "Unisex">("");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "relevance" | "price_asc" | "price_desc" | "newest"
  >("relevance");

  const [totalPages, setTotalPages] = useState(1);

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // whenever filters/search/page/limit change -> fetch
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategory,
    debouncedQuery,
    page,
    limit,
    brand,
    gender,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
  ]);

  async function fetchCategories() {
    setLoadingCategories(true);
    try {
      const res = await api.get("/categories", { params: { limit: 100 } });
      const items: any[] = Array.isArray(res.data)
        ? res.data
        : res.data?.docs || res.data?.data || res.data?.items || res.data;
      setCategories(items || []);
    } catch (err) {
      console.error("fetchCategories error", err);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const params: any = {
        page,
        limit,
        search: debouncedQuery || undefined,
        category: selectedCategory || undefined,
        brand: brand || undefined,
        gender: gender || undefined,
        minPrice: typeof minPrice !== "undefined" ? minPrice : undefined,
        maxPrice: typeof maxPrice !== "undefined" ? maxPrice : undefined,
        inStock: inStockOnly || undefined,
        sort: sortBy,
      };

      const res = await api.get("/products", { params });

      // server returns { docs, total, page, limit, totalPages }
      const data = res.data;
      const items: any[] = Array.isArray(data)
        ? data
        : data?.docs || data?.data || data?.items || [];
      setProducts(items || []);
      setTotal(data?.total || (items?.length ?? 0));
      setTotalPages(
        data?.totalPages ||
          Math.max(1, Math.ceil((data?.total || items?.length || 0) / limit))
      );
    } catch (err) {
      console.error("fetchProducts error", err);
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleAddToCart(product: Product) {
    if (!product) return;

    if (product.variants[0].stock < 1) {
      setSnackMessage("This item is out of stock.");
      setSnackVariant("error");
      setSnackOpen(true);
      return;
    }

    setActionLoading(true);
    try {
      await api.post("/cart/items", {
        productId: product._id,
        variantId: product.variants?.[0]?._id,
        quantity: 1,
        price: product.variants?.[0]?.price,
      });

      setSnackMessage("Added to cart successfully!");
      setSnackVariant("success");
      setSnackOpen(true);
    } catch (err: any) {
      console.error("addToCart error", err?.response);
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

  function handlePickCategory(id: string | null) {
    setSelectedCategory(id);
    setPage(1);
  }

  function handleClearFilters() {
    setBrand("");
    setGender("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setInStockOnly(false);
    setSortBy("relevance");
    setPage(1);
  }

  const priceLabel = useMemo(() => {
    if (minPrice == null && maxPrice == null) return "Any price";
    if (minPrice != null && maxPrice != null)
      return `₹${minPrice} - ₹${maxPrice}`;
    if (minPrice != null) return `>= ₹${minPrice}`;
    return `<= ₹${maxPrice}`;
  }, [minPrice, maxPrice]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-medium">
              Shop for School Essentials
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Find books, uniforms, stationery and more — filtered and sorted
              for you.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-200 px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {query && (
                <button
                  aria-label="clear search"
                  onClick={() => {
                    setQuery("");
                    setDebouncedQuery("");
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
            </div>

            <Button
              onClick={() => setShowFilters((s) => !s)}
              className="md:hidden inline-flex"
            >
              Filters
            </Button>
            
          </div>
        </header>

        {/* Categories */}
        <section className="mb-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => handlePickCategory(null)}
              className={`flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-xl border ${
                !selectedCategory
                  ? "border-primary bg-white shadow-sm"
                  : "border-transparent bg-white/40"
              }`}
            >
              <span className="text-sm font-medium">All</span>
            </button>

            {loadingCategories ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-36 h-12 bg-gray-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handlePickCategory(cat._id)}
                  className={`flex items-center gap-3 shrink-0 px-3 py-2 rounded-xl border transition ${
                    selectedCategory === cat._id
                      ? "border-primary bg-white shadow"
                      : "border-gray-100 bg-white/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {cat.image ? (
                      <Image
                        src={`${BASE_URL}/${cat.image}`}
                        width={48}
                        height={48}
                        alt={cat.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">
                        {cat.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm">{cat.name}</span>
                </button>
              ))
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters column */}
          <aside
            className={`lg:col-span-1 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-white rounded-lg p-4 shadow-sm sticky top-28">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Filters</h3>
                <button
                  className="text-sm text-gray-500"
                  onClick={handleClearFilters}
                >
                  Reset
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Brand
                  </label>
                  <input
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      setPage(1);
                    }}
                    placeholder="e.g. Scholastic"
                    className="w-full rounded-md border px-2 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value as any);
                      setPage(1);
                    }}
                    className="w-full rounded-md border px-2 py-2 text-sm"
                  >
                    <option value="">Any</option>
                    <option value="Boys">Boys</option>
                    <option value="Girls">Girls</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Price
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={minPrice ?? ""}
                      onChange={(e) =>
                        setMinPrice(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="min"
                      className="w-1/2 rounded-md border px-2 py-2 text-sm"
                    />
                    <input
                      value={maxPrice ?? ""}
                      onChange={(e) =>
                        setMaxPrice(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="max"
                      className="w-1/2 rounded-md border px-2 py-2 text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{priceLabel}</div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm">In stock only</label>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setPage(1);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Sort
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setPage(1);
                    }}
                    className="w-full rounded-md border px-2 py-2 text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to high</option>
                    <option value="price_desc">Price: High to low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setPage(1);
                      fetchProducts();
                    }}
                    className="w-full"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <section className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {loadingProducts ? "Loading products..." : `${total} results`}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm">Per page:</div>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-md border px-2 py-1"
                >
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: limit }).map((_, i) => (
                  <div
                    key={i}
                    className="h-56 bg-white rounded-lg shadow animate-pulse"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                No products match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <article
                    key={p._id}
                    className="bg-white rounded-xl border hover:shadow-sm transition cursor-pointer overflow-hidden flex flex-col"
                  >
                    <div className="relative h-44 w-full">
                      <Image
                        src={`${BASE_URL}/${p.images?.[0]||p.variants[0].images?.[0]}` || "/images/placeholder.png"}
                        alt={p.name}
                        width={400}
                        height={400}
                        className="object-cover w-full h-full"
                      />
                      
                      {p.category && typeof p.category !== "string" && (
                        <div className="absolute left-2 top-2 bg-white/90 px-2 py-1 rounded text-xs font-medium">
                          {p.category.name}
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-medium line-clamp-2">
                          {p.name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {p.brand || "—"}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <div className="text-md font-semibold">
                            {p.minPrice
                              ? `₹${p.minPrice}`
                              : p.variants?.[0]
                              ? `₹${p.variants[0].price}`
                              : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2 items-center">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => handleAddToCart(p)}
                        >
                          Add to Cart
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/shop/products/${p._id}`);
                          }}
                          variant={"outline"}
                          className="text-gray-500"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="mt-6 bg-white p-3 rounded-lg flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </div>
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
