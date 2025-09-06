"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import CommonModal, { Field } from "@/components/education-modal";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { educationApi } from "@/lib/api";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

interface Subject {
  _id: string;
  name: string;
  description?: string;
  classId: string;
  thumbnailKey?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SubjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [allData, setAllData] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Fetch subjects for selected class
  const fetchSubjects = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await educationApi.getSubjects({ classId });
      setAllData(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Filter + paginate in memory
  const filteredData = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return allData.filter(
      (sub) =>
        sub.name.toLowerCase().includes(search) ||
        sub.description?.toLowerCase().includes(search)
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
      await educationApi.createSubject({
        ...(values as { name: string; description?: string }),
        classId: classId ?? ""
      });
    }
    if (modalMode === "edit" && selectedSubject) {
      await educationApi.updateSubject(selectedSubject._id, values as  { name: string; description?: string; classId: string, thumbnailKey?: string });
    }
    if (modalMode === "delete" && selectedSubject) {
      await educationApi.deleteSubject(selectedSubject._id);
    }
    fetchSubjects();
  };

  const fields: Field[] = [
    { name: "name", label: "Subject Name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Subjects</h1>
          <Button
            onClick={() => {
              setModalMode("add");
              setSelectedSubject(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Subject
          </Button>
        </div>

        <DataTable<Subject>
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
                      router.push(`subjects/chapters?subjectId=${item._id}&classId=${classId}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedSubject(item);
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
                      setSelectedSubject(item);
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
          title="Subject"
          initialData={selectedSubject || {}}
          fields={fields}
          onSubmit={handleSubmit}
          fileUploadAllowed={false}
        />
      </div>
    </AdminLayout>
  );
}
