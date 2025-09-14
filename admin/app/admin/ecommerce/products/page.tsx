"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { AdminLayout } from "@/components/layout/admin-layout";
import { DataTable } from "@/components/ui/data-table";
import ProductModal from "@/components/product-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Eye, RefreshCw } from "lucide-react";
import { ecommerceApi } from "@/lib/api";
import { IProduct } from "@/types";


export default function ProductsPage(): JSX.Element {
  const router = useRouter();

  // table data
  const [data, setData] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);

  // controls
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined
  );

  // categories for filter select
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selected, setSelected] = useState<Partial<IProduct> | null>(null);

  // small UX states
  const [refreshing, setRefreshing] = useState(false);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // fetch categories once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await ecommerceApi.getCategories({ page: 1, limit: 200 });
        const items = res.data?.data ?? res.data ?? [];
        if (!mounted) return;
        setCategories(
          Array.isArray(items)
            ? items.map((c: any) => ({ value: c._id, label: c.name }))
            : []
        );
      } catch (err) {
        console.error("failed to load categories", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchProducts = useCallback(
    async (opts?: { page?: number; limit?: number }) => {
      setLoading(true);
      try {
        const params = {
          page: opts?.page ?? page,
          limit: opts?.limit ?? limit,
          search: debouncedSearch || undefined,
          category: categoryFilter || undefined,
        } as any;

        const res = await ecommerceApi.getProducts(params);

        // Support multiple response shapes — prefer `docs` (your aggregate facet)
        const items: any[] =
          res.data?.docs ?? res.data?.data ?? res.data?.items ?? res.data ?? [];

        // total count may be present as `total` or inside `pagination`
        const totalCount =
          Number(res.data?.total ?? res.data?.pagination?.total ?? res.data?.meta?.total) ||
          items.length ||
          0;

        // totalPages fallback
        const totalPages =
          Number(res.data?.totalPages ?? res.data?.pagination?.pages ?? Math.ceil(totalCount / (params.limit || 10)));

        setData(Array.isArray(items) ? items : []);
        setTotal(totalCount);

        // adjust current page if the server responded with different page
        const serverPage = Number(res.data?.page ?? res.data?.pagination?.page ?? params.page);
        if (serverPage && serverPage !== page) {
          setPage(serverPage);
        }

        // If limit changed server-side, sync it (optional)
        const serverLimit = Number(res.data?.limit ?? res.data?.pagination?.limit ?? params.limit);
        if (serverLimit && serverLimit !== limit) {
          setLimit(serverLimit);
        }

        // ensure totalPages (DataTable expects totalPages via pagination prop)
        // We set total and rely on DataTable to compute pages; if you prefer, pass totalPages too.
      } catch (err) {
        console.error("fetchProducts error", err);
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, debouncedSearch, categoryFilter]
  );

  // initial + param change fetch
  useEffect(() => {
    // whenever debouncedSearch or category changes, reset page to 1
    setPage(1);
  }, [debouncedSearch, categoryFilter]);

  useEffect(() => {
    fetchProducts({ page, limit });
  }, [fetchProducts, page, limit]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [total, limit]);

  // modal submit handler
  const handleModalSubmit = async (payload?: any) => {
    try {
      if (modalMode === "add") {
        await ecommerceApi.createProduct(payload);
      } else if (modalMode === "edit" && selected) {
        await ecommerceApi.updateProduct(selected?._id as string, payload);
      } else if (modalMode === "delete" && selected) {
        await ecommerceApi.deleteProduct(selected?._id as string);
      }
      await fetchProducts({ page: 1, limit });
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProducts({ page, limit });
    } finally {
      setRefreshing(false);
    }
  };

  const columns = [
    {
      key: "image",
      title: "Image",
      render: (_: any, item: IProduct) => {
        const key = item.images?.[0] || item.variants[0].images?.[0];
        if (!key) return <div className="w-24 h-16 bg-gray-100 rounded" />;
        const base = process.env.NEXT_PUBLIC_AWS_STORAGE_URL || "";
        const url = key.startsWith("http") ? key : `${base}/${key}`;
        return (
          <div className="w-24 h-16 rounded overflow-hidden">
            <Image src={url} width={96} height={64} alt={item.name} className="object-cover w-full h-full" />
          </div>
        );
      },
    },
    { key: "name", title: "Name", sortable: true },
    {
      key: "category",
      title: "Category",
      render: (_: any, item: IProduct) => {
        if (!item.category) return "-";
        if (typeof item.category === "string") return item.category;
        return (item.category as any).name ?? "-";
      },
    },
    {
      key: "price",
      title: "Price",
      render: (_: any, item: IProduct) => {
        const prices = (item.variants ?? []).map((v: any) => Number(v.price ?? 0));
        if (!prices.length) return "-";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
      },
    },
    {
      key: "stock",
      title: "Stock",
      render: (_: any, item: IProduct) => {
        const stock = (item.variants ?? []).reduce((acc: number, v: any) => acc + Number(v.stock ?? 0), 0);
        return String(stock);
      },
    },
    {
      key: "active",
      title: "Active",
      render: (_: any, item: IProduct) => (
        <span className={item.isActive ? "text-green-600" : "text-red-600"}>
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, item: IProduct) => (
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={() => router.push(`products/detail?productId=${item._id}`)}>
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setModalMode("edit");
              setSelected(item);
              setModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setModalMode("delete");
              setSelected(item);
              setModalOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-gray-600 mt-1">Manage catalog, variants and inventory.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-[220px]"
              />
              <Button variant="ghost" onClick={() => { setSearchTerm(""); setDebouncedSearch(""); setPage(1); }}>
                Clear
              </Button>
            </div>

            <Select
              value={categoryFilter ?? ""}
              onValueChange={(val) => {
                setCategoryFilter(val || undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48 border rounded px-3 py-2">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => { setModalMode("add"); setSelected(null); setModalOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>

            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Data table */}
        <DataTable<IProduct>
          data={data}
          columns={columns}
          loading={loading}
          pagination={{
            page,
            limit,
            total,
            totalPages,
          }}
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          onSearch={(q) => {
            // if your DataTable exposes an internal search input, sync it here
            setSearchTerm(q);
            setPage(1);
          }}
        />

        <ProductModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          initialData={selected ?? {}}
          onSubmit={handleModalSubmit}
        />
      </div>
    </AdminLayout>
  );
}
