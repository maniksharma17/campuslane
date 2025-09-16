"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import CommonModal from "@/components/CommonModal";
import { useAuthStore } from "@/lib/store/auth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import Snack from "@/components/ui/snack";

const TYPE_TABS = ["all", "file", "video", "quiz", "image"] as const;

export default function ContentPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // server pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTypeTab, setActiveTypeTab] =
    useState<(typeof TYPE_TABS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  // modals / selection / UI
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackVariant, setSnackVariant] = useState<
    "success" | "error" | "info"
  >("info");

  const { classId, subjectId, chapterId } = useParams<{
    classId: string;
    subjectId: string;
    chapterId: string;
  }>();

  const { user } = useAuthStore();

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // fetch server data with pagination + filters
  const fetchData = useCallback(async () => {
    if (!user) return;
    if (!classId || !subjectId || !chapterId) return;

    setLoading(true);
    try {
      const res = await api.get("/teacher/content", {
        params: {
          classId,
          subjectId,
          chapterId,
          uploaderId: user._id,
          approvalStatus: statusFilter,
          type: activeTypeTab !== "all" ? activeTypeTab : undefined,
          search: debouncedSearch || undefined,
          page,
          limit,
        },
      });

      const items = res.data?.data || [];
      const pg = res.data?.pagination || res.data?.meta?.pagination || null;

      setData(items);

      if (pg) {
        setTotal(typeof pg.total === "number" ? pg.total : items.length);
        setTotalPages(
          typeof pg.totalPages === "number"
            ? pg.pages
            : Math.max(1, Math.ceil((pg.total || items.length) / limit))
        );
      } else {
        // Fallback when server doesn't return pagination
        setTotal(items.length);
        setTotalPages(Math.max(1, Math.ceil(items.length / limit)));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || "Failed to fetch content.");
      setData([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    classId,
    subjectId,
    chapterId,
    statusFilter,
    activeTypeTab,
    debouncedSearch,
    page,
    limit,
  ]);

  // initial + whenever deps change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTypeTab, statusFilter, debouncedSearch, classId, subjectId, chapterId]);

  const columns = [
    { key: "title", title: "Title", sortable: true },
    { key: "type", title: "Type" },
    {
      key: "approvalStatus",
      title: "Status",
      render: (_: any, item: any) => {
        const color =
          item.approvalStatus === "approved"
            ? "green"
            : item.approvalStatus === "rejected"
            ? "red"
            : "yellow";
        return (
          <Badge className={`bg-${color}-100 text-${color}-800`}>
            {item.approvalStatus}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, item: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.open(
                item.s3Key
                  ? `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${item.s3Key}`
                  : "#",
                "_blank"
              );
            }}
          >
            View
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedItem(item);
              setModalMode("edit");
              setModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setSelectedItem(item);
              setModalMode("delete");
              setModalOpen(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (values?: Record<string, any>) => {
    try {
      const payload = { ...values, classId, subjectId, chapterId };

      if (modalMode === "add") {
        await api.post("/content", payload);
        toast.success("Content added!");
      } else if (modalMode === "edit" && selectedItem) {
        await api.patch(`/content/${selectedItem._id}`, payload);
        toast.success("Content updated!");
      } else if (modalMode === "delete" && selectedItem) {
        await api.delete(`/content/${selectedItem._id}`);
        toast.success("Content deleted!");
      }

      // refresh page after change
      fetchData();
    } catch (err: any) {
      const code = err?.response?.status;
      const msg = err?.response?.data?.message || "Request failed.";
      setSnackMessage(msg);
      setSnackVariant("error");
      setSnackOpen(true);
      toast.error(`Error ${code}: ${msg}`);
    }
  };

  return (
    <div className="p-6 space-y-8 lg:p-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">My Content</h2>
          <p className="text-sm text-muted-foreground">
            Manage content you uploaded — upload new files, videos, quizzes,
            images or games.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedItem(null);
              setModalMode("add");
              setModalOpen(true);
            }}
          >
            + Add Content
          </Button>
        </div>
      </div>

      {/* Type tabs */}
      <Tabs
        value={activeTypeTab}
        onValueChange={(v) => {
          setActiveTypeTab(v as any);
          setPage(1);
        }}
      >
        <TabsList className="grid grid-cols-6 gap-2 max-w-md">
          {TYPE_TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Data Table */}
      <div className="pt-4">
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          emptyMessage="No content found."
          onSearch={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          pagination={{
            page,
            limit,
            total,
            totalPages,
          }}
          onPageChange={(p: number) => setPage(p)}
          onLimitChange={(newLimit: number) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {errorMsg && (
        <div className="text-red-600 font-medium border border-red-400 p-3 rounded-lg bg-red-50">
          {errorMsg}
        </div>
      )}

      {/* Modal */}
      <CommonModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        title="Content"
        initialData={selectedItem || {}}
        onSubmit={handleSubmit}
        fileUploadAllowed
        defaultType={(activeTypeTab === "all" ? "file" : activeTypeTab) as any}
      />

      {/* Snack */}
      <Snack
        open={snackOpen}
        onClose={() => setSnackOpen(false)}
        message={snackMessage}
        variant={snackVariant}
      />
    </div>
  );
}
