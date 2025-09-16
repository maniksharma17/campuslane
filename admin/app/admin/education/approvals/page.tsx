"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Eye } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  type: string;
  approvalStatus: string;
  tags: string[];
  s3Key?: string;
  thumbnailKey?: string;
  classId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
  chapterId: { _id: string; name: string };
  uploaderRole: string;
  createdAt: string;
  updatedAt: string;
}

export default function TeacherContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");
  const chapterId = searchParams.get("chapterId");

  const [data, setData] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // server pagination + filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/teacher/content", {
        params: {
          includeDeleted: false,
          page,
          limit,
          search: searchQuery || undefined,
        },
      });

      setData(res.data?.data || []);

      const pg = res.data?.pagination || {};
      setTotal(pg.total || 0);
      setTotalPages(pg.pages || 1);
    } catch (err: any) {
      console.error("fetch content error:", err);
      setData([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Teacher Content</h1>

        <DataTable<ContentItem>
          data={data.filter((item) => item.uploaderRole !== "admin")}
          columns={[
            { key: "title", title: "Title", sortable: true },
            { key: "type", title: "Type" },
            { key: "approvalStatus", title: "Status" },
            {
              key: "tags",
              title: "Tags",
              render: (_v, item) => (
                <div className="flex flex-wrap gap-1">
                  {item.tags?.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-gray-200 px-2 py-0.5 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              key: "class",
              title: "Class / Subject / Chapter",
              render: (_v, item) =>
                `${item.classId.name} / ${item.subjectId.name} / ${item.chapterId.name}`,
            },
            {
              key: "actions",
              title: "Actions",
              render: (_v, item) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() =>
                      router.push(
                        `/admin/education/approvals/detail?id=${item._id}`
                      )
                    }
                    title="View Content"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
          loading={loading}
          pagination={{
            page,
            limit,
            total,
            totalPages,
          }}
          onPageChange={(p: number) => setPage(p)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          onSearch={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
        />
      </div>
    </AdminLayout>
  );
}
