"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import CategoryModal from "@/components/category-modal";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { ecommerceApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ICategory {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const router = useRouter();

  // list state (server-side pagination)
  const [data, setData] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number>(0);

  // controls
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selected, setSelected] = useState<ICategory | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await ecommerceApi.getCategories({ page, limit, search });
      const items = res.data?.data ?? res.data ?? [];
      const totalCount = res.data?.total ?? res.data?.meta?.total ?? items.length;
      setData(items);
      setTotal(Number(totalCount ?? 0));
    } catch (err) {
      console.error("fetchCategories error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  const totalPages = Math.ceil((total || 0) / limit);

  const handleModalSubmit = async (values?: { name: string; description?: string; image?: string }) => {
    try {
      if (modalMode === "add") {
        await ecommerceApi.createCategory(values as any);
      } else if (modalMode === "edit" && selected) {
        await ecommerceApi.updateCategory(selected._id, values as any);
      } else if (modalMode === "delete" && selected) {
        await ecommerceApi.deleteCategory(selected._id);
      }
      await fetchCategories();
    } catch (err) {
      console.error(err);
      alert("Operation failed");
    }
  };

  const columns = [
    {
      key: "image",
      title: "Image",
      render: (_: any, item: ICategory) => {
        if (!item.image) return null;
        const url = `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${item.image}`;
        return <Image src={url} width={96} height={64} alt={item.name} className="rounded object-cover" />;
      },
    },
    { key: "name", title: "Name", sortable: true },
    { key: "description", title: "Description" },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, item: ICategory) => (
        <div className="flex gap-2">
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
          <h1 className="text-2xl font-bold">Categories</h1>
          <div className="flex gap-3">
            
            <Button
              onClick={() => {
                setModalMode("add");
                setSelected(null);
                setModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
        </div>

        <DataTable<ICategory>
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

        <CategoryModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          initialData={selected || {}}
          onSubmit={handleModalSubmit}
        />
      </div>
    </AdminLayout>
  );
}
