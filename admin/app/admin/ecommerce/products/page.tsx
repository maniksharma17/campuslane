"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ProductModal from "@/components/product-modal";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { ecommerceApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IProduct } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductsPage() {
  const router = useRouter();

  const [data, setData] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number>(0);

  // controls
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
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

  useEffect(() => {
    (async () => {
      try {
        const res = await ecommerceApi.getCategories({ page: 1, limit: 100 });
        const items = res.data?.data ?? res.data ?? [];
        setCategories(items.map((c: any) => ({ value: c._id, label: c.name })));
      } catch (err) {
        console.error("failed to load categories", err);
      }
    })();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await ecommerceApi.getProducts({
        page,
        limit,
        search,
        category: categoryFilter,
      });
      const items = res.data?.data ?? res.data ?? [];
      const totalCount =
        res.data?.total ?? res.data?.meta?.total ?? items.length;
      setData(items);
      setTotal(Number(totalCount ?? 0));
    } catch (err) {
      console.error("fetchProducts error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, categoryFilter]);

  const totalPages = Math.ceil((total || 0) / limit);

  const handleModalSubmit = async (payload?: any) => {
    try {
      if (modalMode === "add") {
        await ecommerceApi.createProduct(payload);
      } else if (modalMode === "edit" && selected) {
        await ecommerceApi.updateProduct(selected?._id as string, payload);
      } else if (modalMode === "delete" && selected) {
        await ecommerceApi.deleteProduct(selected?._id as string);
      }
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  const columns = [
    {
      key: "image",
      title: "Image",
      render: (_: any, item: IProduct) => {
        const key = item.images?.[0];
        if (!key) return null;
        const url = `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${key}`;
        return (
          <Image
            src={url}
            width={96}
            height={64}
            alt={item.name}
            className="rounded object-cover"
          />
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
        const prices = (item.variants ?? []).map((v: any) => v.price ?? 0);
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
        const stock = (item.variants ?? []).reduce(
          (acc: number, v: any) => acc + (v.stock ?? 0),
          0
        );
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
          <Button
            size="sm"
            variant="default"
            onClick={() => router.push(`products/detail?productId=${item._id}`)}
          >
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Products</h1>

          <div className="flex gap-3 items-center">
            <Select
              value={categoryFilter ?? ""}
              onValueChange={(val) => {
                setCategoryFilter(val || undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full border rounded px-3 py-2">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setModalMode("add");
                setSelected(null);
                setModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>
        </div>

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
            setSearch(q);
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
