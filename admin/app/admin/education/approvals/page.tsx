"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Eye } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import {api} from "@/lib/api";
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

  const [contentData, setContentData] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await api.get("/teacher/content", {
        params: {
          classId,
          subjectId,
          chapterId,
          includeDeleted: false,
        },
      });
      setContentData(res.data.data || []);
      setPagination(res.data.pagination || {
        page: 1,
        limit: 10,
        total: res.data.data?.length || 0,
        pages: 1,
      });
    } catch (err: any) {
      console.error("fetch content error:", err);
      setContentData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, subjectId, chapterId]);

  const filteredData = contentData.filter((item) =>
    searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Teacher Content</h1>

        <DataTable<ContentItem>
          data={filteredData.filter((item) => item.uploaderRole !== "admin")}
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
                      router.push(`/admin/education/approvals/detail?id=${item._id}`)
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
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.pages,
          }}
          onPageChange={(page) =>
            setPagination((p) => ({ ...p, page }))
          }
          onLimitChange={(limit) =>
            setPagination((p) => ({ ...p, limit, page: 1 }))
          }
          onSearch={(q) => {
            setSearchQuery(q);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        />
      </div>
    </AdminLayout>
  );
}
