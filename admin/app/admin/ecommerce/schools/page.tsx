"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import Image from "next/image";
import SchoolModal from "@/components/school-modal";
import { DataTable } from "@/components/ui/data-table";
import { ecommerceApi, educationApi } from "@/lib/api";
import { useRouter } from "next/navigation";

interface School {
  _id: string;
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function SchoolsPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">(
    "add"
  );
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      // If your API supports paging, pass pagination/search; else call without params
      const res = await ecommerceApi.getSchools({
        page: pagination.page,
        limit: 1000,
        search: undefined,
      });
      setAllData(res.data.data || []);
    } catch (err) {
      console.error("fetch schools error:", err);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData = useMemo(() => {
    const s = searchQuery.toLowerCase();
    return allData.filter(
      (sc) =>
        sc.name.toLowerCase().includes(s) ||
        (sc.address || "").toLowerCase().includes(s) ||
        (sc.city || "").toLowerCase().includes(s)
    );
  }, [allData, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredData.slice(start, start + pagination.limit);
  }, [filteredData, pagination]);

  const totalPages = Math.ceil(filteredData.length / pagination.limit);

  // CRUD handler
  const handleSubmit = async (values?: Partial<School>) => {
    try {
      if (modalMode === "add") {
        await ecommerceApi.createSchool(values);
      } else if (modalMode === "edit" && selectedSchool) {
        await ecommerceApi.updateSchool(selectedSchool._id, values);
      } else if (modalMode === "delete" && selectedSchool) {
        await ecommerceApi.deleteSchool(selectedSchool._id);
      }
      await fetchSchools();
    } catch (err) {
      console.error("school operation error:", err);
      alert("Operation failed. See console.");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Schools</h1>

          <div className="flex items-center gap-3">

            <Button
              onClick={() => {
                setModalMode("add");
                setSelectedSchool(null);
                setModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add School
            </Button>
          </div>
        </div>

        <DataTable<School>
          data={paginatedData}
          columns={[
            {
              key: "logo",
              title: "Logo",
              render: (_val, item) => {
                if (!item.logo) return null;
                const url = `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${item.logo}`;
                return (
                  <div className="w-20 h-12 relative rounded overflow-hidden border">
                    <Image src={url} alt={item.name} fill style={{ objectFit: "cover" }} />
                  </div>
                );
              },
            },
            { key: "name", title: "Name", sortable: true },
            {
              key: "address",
              title: "Address",
              render: (_v, item) =>
                `${item.address ? item.address + ", " : ""}${item.city || ""}`,
            },
            { key: "pincode", title: "Pincode" },
            {
              key: "actions",
              title: "Actions",
              render: (_v, item) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => router.push(`/admin/schools/${item._id}`)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedSchool(item);
                      setModalOpen(true);
                    }}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setModalMode("delete");
                      setSelectedSchool(item);
                      setModalOpen(true);
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
          loading={loading}
          pagination={{
            page: pagination.page,
            limit: pagination.limit,
            total: filteredData.length,
            totalPages,
          }}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onLimitChange={(limit) => setPagination({ page: 1, limit })}
          onSearch={(q) => {
            setSearchQuery(q);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        />

        <SchoolModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          initialData={selectedSchool || {}}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
