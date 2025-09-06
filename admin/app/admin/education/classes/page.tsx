"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import CommonModal, { Field } from "@/components/education-modal";
import { Pencil, Trash2, Plus, View, ViewIcon, Eye } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { educationApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Class {
  _id: string;
  name: string;
  description?: string;
  thumbnailKey?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Fetch once
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await educationApi.getClasses();
      setAllData(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Filter + paginate in memory
  const filteredData = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return allData.filter(
      (cls) =>
        cls.name.toLowerCase().includes(search) ||
        cls.description?.toLowerCase().includes(search)
    );
  }, [allData, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredData.slice(start, start + pagination.limit);
  }, [filteredData, pagination]);

  const totalPages = Math.ceil(filteredData.length / pagination.limit);

  // Handle CRUD
  const handleSubmit = async (values?: Record<string, any>) => {
    if (modalMode === "add") {
      await educationApi.createClass(
        values as { name: string; description?: string }
      );
    }
    if (modalMode === "edit" && selectedClass) {
      await educationApi.updateClass(
        selectedClass._id,
        values as { name: string; description?: string }
      );
    }
    if (modalMode === "delete" && selectedClass) {
      await educationApi.deleteClass(selectedClass._id);
    }
    fetchClasses();
  };

  const fields: Field[] = [
    { name: "name", label: "Class Name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Classes</h1>
          <Button
            onClick={() => {
              setModalMode("add");
              setSelectedClass(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </div>

        <DataTable<Class>
          data={paginatedData}
          columns={[
            {
              key: "thumbnailKey",
              title: "Image",
              render: (_val, item) => {
                if (!item.thumbnailKey) return null; 
                const url = `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${item.thumbnailKey}`;
                return (
                  <Image
                    src={url}
                    height={100}
                    width={100}
                    alt={item.name}
                    className="z-50 rounded object-cover"
                  />
                );
              },
            },
            { key: "name", title: "Name", sortable: true },
            { key: "description", title: "Description" },
            {
              key: "actions",
              title: "Actions",
              render: (_val, item) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setSelectedClass(item);
                      router.push(`classes/subjects?classId=${item?._id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedClass(item);
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
                      setSelectedClass(item);
                      setModalOpen(true);
                    }}
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
          onSearch={(query) => {
            setSearchQuery(query);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        />

        {/* Common Modal */}
        <CommonModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          title="Class"
          initialData={selectedClass || {}}
          fields={fields}
          onSubmit={handleSubmit}
          fileUploadAllowed={false}
        />
      </div>
    </AdminLayout>
  );
}
