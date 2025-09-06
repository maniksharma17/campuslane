"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import CommonModal, { Field } from "@/components/education-modal";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { educationApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface Chapter {
  _id: string;
  name: string;
  description?: string;
  thumbnailKey: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChaptersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectId");

  const [allData, setAllData] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // Fetch chapters for selected subject
  const fetchChapters = async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const res = await educationApi.getChapters({ subjectId });
      setAllData(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  // Filter + paginate
  const filteredData = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return allData.filter(
      (ch) =>
        ch.name.toLowerCase().includes(search) ||
        ch.description?.toLowerCase().includes(search)
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
      await educationApi.createChapter({
        ...(values as { name: string; description?: string }),
        subjectId: subjectId ?? "",
      });
    }
    if (modalMode === "edit" && selectedChapter) {
      await educationApi.updateChapter(
        selectedChapter._id,
        values as { name: string; description?: string; subjectId: string }
      );
    }
    if (modalMode === "delete" && selectedChapter) {
      await educationApi.deleteChapter(selectedChapter._id);
    }
    fetchChapters();
  };

  const fields: Field[] = [
    { name: "name", label: "Chapter Name", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chapters</h1>
          <Button
            onClick={() => {
              setModalMode("add");
              setSelectedChapter(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Chapter
          </Button>
        </div>

        <DataTable<Chapter>
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
                      const classId = searchParams.get("classId");
                      const subjectId = searchParams.get("subjectId");
                      router.push(
                        `chapters/content?chapterId=${item._id}&subjectId=${subjectId}&classId=${classId}`
                      );
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedChapter(item);
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
                      setSelectedChapter(item);
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
          title="Chapter"
          initialData={selectedChapter || {}}
          fields={fields}
          onSubmit={handleSubmit}
          fileUploadAllowed={false}
        />
      </div>
    </AdminLayout>
  );
}
