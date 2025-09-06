"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import CommonModal, { Field } from "@/components/education-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, Link } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { educationApi } from "@/lib/api";
import Image from "next/image";

interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  thumbnailKey: string;
  s3Key?: string;
  fileUrl?: string;
  videoUrl?: string;
  type: "file" | "video" | "quiz";
  googleFormUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const chapterId = searchParams.get("chapterId");

  const [activeTab, setActiveTab] = useState<"file" | "video" | "quiz">("file");
  const [allData, setAllData] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const fetchContent = async () => {
    if (!classId || !subjectId || !chapterId) return;
    setLoading(true);
    try {
      const res = await educationApi.getContent({
        classId,
        subjectId,
        chapterId,
        type: activeTab,
      });
      setAllData(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, classId, subjectId, chapterId]);

  // Filter + paginate
  const filteredData = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return allData.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
    );
  }, [allData, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredData.slice(start, start + pagination.limit);
  }, [filteredData, pagination]);

  const totalPages = Math.ceil(filteredData.length / pagination.limit);

  const handleSubmit = async (values?: Record<string, any>) => {
    if (modalMode === "add") {
      await educationApi.createContent({
        ...(values as any),
        classId,
        subjectId,
        chapterId,
        type: activeTab,
      });
    }
    if (modalMode === "edit" && selectedItem) {
      await educationApi.updateContent(selectedItem._id, {
        ...(values as any),
        classId,
        subjectId,
        chapterId,
        type: activeTab,
      });
    }
    if (modalMode === "delete" && selectedItem) {
      await educationApi.deleteContent(selectedItem._id);
    }
    fetchContent();
  };

  const fields: Field[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    ...(activeTab === "quiz"
      ? ([
          {
            name: "googleFormUrl",
            label: "Google Form URL",
            type: "text",
            required: true,
          },
          {
            name: "quizType",
            label: "Quiz Type",
            type: "select",
            options: [
              {
                value: "native",
                label: "Native Quiz",
              },
              {
                value: "googleForm",
                label: "External Quiz",
              },
            ] as { value: string; label: string }[],
          },
        ] as const)
      : []),
  ];

  const columns = [
    {
      key: "thumbnailKey",
      title: "Thumbnail",
      render: (_: any, item: ContentItem) => {
        const url = `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${item.thumbnailKey}`;
        return (
          <Image
            src={url}
            height={80}
            width={80}
            alt={item.title}
            className="rounded object-cover"
          />
        );
      },
    },
    { key: "title", title: "Title", sortable: true },
    { key: "description", title: "Description" },
    ...(activeTab !== "quiz"
      ? [
          {
            key: "fileUrl",
            title: "Content",
            render: (_: any, item: ContentItem) => (
              <div>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${item?.s3Key}`}
                  className="flex flex-row gap-2 items-center"
                >
                  <Link className="h-4 w-4" />
                  <p>Open</p>
                </a>
              </div>
            ),
          },
        ]
      : []),

    ...(activeTab === "quiz"
      ? [{ key: "googleFormUrl", title: "Google Form URL" }]
      : []),
    {
      key: "actions",
      title: "Actions",
      render: (_: any, item: ContentItem) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setModalMode("edit");
              setSelectedItem(item);
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
              setSelectedItem(item);
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
          <h1 className="text-2xl font-bold">Content</h1>
          <Button
            onClick={() => {
              setModalMode("add");
              setSelectedItem(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add {activeTab}
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as any);
            setPagination({ page: 1, limit: 10 });
          }}
        >
          <TabsList>
            <TabsTrigger value="file">Files</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="quiz">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <DataTable<ContentItem>
              data={paginatedData}
              columns={columns}
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
          </TabsContent>
        </Tabs>

        <CommonModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          title={activeTab}
          initialData={selectedItem || {}}
          fields={fields}
          onSubmit={handleSubmit}
          fileUploadAllowed={activeTab !== "quiz"}
        />
      </div>
    </AdminLayout>
  );
}
