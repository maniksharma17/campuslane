"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Image from "next/image";

// Minimal local TS types used only by this component
type Category = { _id: string; name: string; image?: string };
type Variant = {
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
  images: string[];
  variants?: Variant[];
  category?: string;
  brand?: string;
};

export default function ProductsPage(): JSX.Element {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, page]);

  async function fetchCategories() {
    setLoadingCategories(true);
    try {
      const res = await api.get("/categories", { params: { limit: 100 } });
      const items: any[] = Array.isArray(res.data)
        ? res.data
        : res.data?.docs || res.data?.data || res.data?.items || [];
      setCategories(items);
    } catch (err) {
      console.error("fetchCategories error", err);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const params: any = { page, limit };
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get("/products", { params });
      const items: any[] = Array.isArray(res.data)
        ? res.data
        : res.data?.docs || res.data?.data || res.data?.items || [];
      setProducts(items);
    } catch (err) {
      console.error("fetchProducts error", err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  function handleCategoryClick(id: string | null) {
    setSelectedCategory(id);
    setPage(1);
  }

  function handleProductClick(id: string) {
    router.push(`/shop/products/${id}`);
  }

  function handleBuyNow(e: React.MouseEvent, product: Product) {
    e.stopPropagation();
    const variant = product.variants?.[0];
    const variantQuery = variant
      ? `&variant=${encodeURIComponent(variant.name)}`
      : "";
    router.push(`/shop/checkout/buy-now?productId=${product._id}${variantQuery}`);
  }

  return (
    <div className="min-h-screen bg-primary/10">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
        <h1 className="text-2xl max-md:text-xl font-medium mb-3">
          Shop for School Essentials
        </h1>

        {/* Categories row */}
        <section className="mb-4">
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-3 py-1.5 bg-white text-sm rounded-full whitespace-nowrap border transition ${
                !selectedCategory ? "bg-white border-primary shadow" : "bg-transparent"
              }`}
            >
              All
            </button>

            {loadingCategories ? (
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-8 bg-gray-200 rounded-full animate-pulse"
                  />
                ))}
              </div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryClick(cat._id)}
                  className={`px-3 py-1.5 bg-white text-sm rounded-full whitespace-nowrap border transition ${
                    selectedCategory === cat._id
                      ? "bg-white border-primary shadow"
                      : "bg-transparent"
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </section>

        {/* Products grid */}
        <section>
          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3 bg-white shadow rounded-lg animate-pulse h-40"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-500">
              No products found.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p) => (
                <article
                  key={p._id}
                  onClick={() => handleProductClick(p._id)}
                  className="bg-white shadow rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition"
                >
                  <div className="h-48 w-full relative">
                    <Image
                      width={200}
                      height={200}
                      src={p.images?.[0] || "/images/placeholder.png"}
                      alt={p.name}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {p.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        {p.variants?.[0] ? `₹${p.variants[0].price}` : "—"}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={(e) => handleBuyNow(e, p)}
                      >
                        Buy now
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
