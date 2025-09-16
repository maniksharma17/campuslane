"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import CommonModal, { Field } from "@/components/education-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, Link } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { educationApi } from "@/lib/api";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuestionItem {
  questionText: string;
  options: string[];
  correctOption: number;
  s3Key?: string;
}

interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  thumbnailKey: string;
  s3Key?: string;
  fileUrl?: string;
  videoUrl?: string;
  type: "file" | "video" | "quiz" | "image";
  quizType?: "native" | "googleForm";
  googleFormUrl?: string;
  questions?: QuestionItem[];
  duration?: number;
  isAdminContent?: boolean;
  fileSize?: number;
  classId: {
    _id: string;
    name: string;
  };
  subjectId: {
    _id: string;
    name: string;
  };
  chapterId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const chapterId = searchParams.get("chapterId");

  const [activeTab, setActiveTab] = useState<"file" | "video" | "image" | "quiz">("file");

  // server-backed data
  const [allData, setAllData] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // server pagination state
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // search (debounced)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const [isAdminContent, setIsAdminContent] = useState(true);

  const [info, setInfo] = useState({
    className: "",
    subjectName: "",
    chapterName: "",
  });

  // debounce searchQuery -> debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // fetch content from server with pagination and filters
  const { page, limit } = pagination;

  const fetchContent = useCallback(async () => {
    if (!classId || !subjectId || !chapterId) return;

    setLoading(true);
    try {
      const res = await educationApi.getContent({
        classId,
        subjectId,
        chapterId,
        isAdminContent: String(isAdminContent),
        type: activeTab,
        page,
        limit,
        search: debouncedSearch || undefined,
      });

      const items: ContentItem[] = res.data?.data || [];
      const pg = res.data?.pagination || res.data?.meta?.pagination || null;

      setAllData(items);

      if (pg) {
        setTotal(typeof pg.total === "number" ? pg.total : items.length);
        setTotalPages(typeof pg.totalPages === "number" ? pg.pages : Math.max(1, Math.ceil((pg.total || items.length) / limit)));
      } else {
        // fallback: total = length of server page * unknown pages
        setTotal(items.length);
        setTotalPages(Math.max(1, Math.ceil(items.length / limit)));
      }
    } catch (err) {
      console.error("Fetch content error:", err);
      // optionally show toast or set error state
      setAllData([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [classId, subjectId, chapterId, isAdminContent, activeTab, page, limit, debouncedSearch]);

  // re-fetch when relevant filters or pagination change
  useEffect(() => {
    // If class/subject/chapter missing, do nothing
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchContent]);

  // reset page when activeTab or admin toggle changes
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [activeTab, isAdminContent, debouncedSearch, classId, subjectId, chapterId]);

  const handleSubmit = async (values?: Record<string, any>) => {
    if (modalMode === "add") {
      await educationApi.createContent({
        ...(values as any),
        classId,
        subjectId,
        chapterId,
        type: activeTab,
        duration: values?.duration,
        fileSize: values?.fileSize,
      });
    }
    if (modalMode === "edit" && selectedItem) {
      await educationApi.updateContent(selectedItem._id, {
        ...(values as any),
        classId,
        subjectId,
        chapterId,
        type: activeTab,
        duration: values?.duration,
        fileSize: values?.fileSize,
      });
    }
    if (modalMode === "delete" && selectedItem) {
      await educationApi.deleteContent(selectedItem._id);
    }
    // after change, refresh the current page
    fetchContent();
  };

  const handleContentTypeChange = (v: string) => {
    if (v === "admin") setIsAdminContent(true);
    else setIsAdminContent(false);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // Fields for modal
  const fields: Field[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea" },
    ...(activeTab === "quiz"
      ? ([
          {
            name: "quizType",
            label: "Quiz Type",
            type: "select",
            options: [
              { value: "native", label: "Native Quiz" },
              { value: "googleForm", label: "External Quiz" },
            ] as { value: string; label: string }[],
          },
          {
            name: "googleFormUrl",
            label: "Google Form URL",
            type: "text",
            required: false,
          },
        ] as const)
      : []),
  ];

  // Columns unchanged, but DataTable will be fed server data + server pagination
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
      ? [
          {
            key: "quizType",
            title: "Quiz Type",
            render: (_: any, item: ContentItem) => <div>{item.quizType ?? "-"}</div>,
          },
          {
            key: "questions",
            title: "Questions",
            render: (_: any, item: ContentItem) => (
              <div>{item.questions ? `${item.questions.length} Qs` : "-"}</div>
            ),
          },
          {
            key: "googleFormUrl",
            title: "Google Form URL",
            render: (_: any, item: ContentItem) =>
              item.googleFormUrl ? (
                <a
                  href={item.googleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Open
                </a>
              ) : (
                "-"
              ),
          },
        ]
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

  // UI helpers
  const onSearch = (query: string) => {
    setSearchQuery(query);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>{allData.length > 0 && <ContentBreadcrumb item={allData[0]} />}</div>

          <div className="flex justify-between items-center">
            <div className="flex flex-row gap-4">
              <Button
                onClick={() => {
                  setModalMode("add");
                  setSelectedItem(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add {activeTab}
              </Button>
              <Select onValueChange={handleContentTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Type of content"></SelectValue>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={"admin"}>Admin Content</SelectItem>
                  <SelectItem value={"all"}>Teacher Content</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-4 text-sm text-muted-foreground">
              Showing {total} result{total !== 1 ? "s" : ""} — page {pagination.page} of {totalPages}
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as any);
            setPagination({ page: 1, limit: pagination.limit });
          }}
        >
          <TabsList>
            <TabsTrigger value="file">Files</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="quiz">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <DataTable<ContentItem>
              data={allData}
              columns={columns}
              loading={loading}
              pagination={{
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages,
              }}
              onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
              onLimitChange={(limit) => setPagination({ page: 1, limit })}
              onSearch={onSearch}
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

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function ContentBreadcrumb({ item }: { item: ContentItem }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Class */}
        <BreadcrumbItem>
          <BreadcrumbLink href={`/admin/education/classes`}>
            {item.classId.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Subject */}
        <BreadcrumbItem>
          <BreadcrumbLink
            href={`/admin/education/classes/subjects?classId=${item.classId._id}`}
          >
            {item.subjectId.name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Chapter */}
        <BreadcrumbItem>
          <BreadcrumbLink href={`/admin/education/classes/subjects/chapters?subjectId=${item.subjectId._id}&classId=${item.classId._id}`}>{item.chapterId.name}</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
