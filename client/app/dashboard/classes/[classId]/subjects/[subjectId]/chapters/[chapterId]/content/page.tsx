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

const TYPE_TABS = ["all", "file", "video", "quiz", "game", "image"] as const;

export default function ContentPage() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTypeTab, setActiveTypeTab] =
    useState<(typeof TYPE_TABS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { classId, subjectId, chapterId } = useParams<{
    classId: string;
    subjectId: string;
    chapterId: string;
  }>();

  const { user } = useAuthStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    if(!user) return;
    try {
      const res = await api.get("/teacher/content", {
        params: {
          classId,
          subjectId,
          chapterId,
          uploaderId: user._id,  // this must exist and be a string
          approvalStatus: statusFilter,
        },
      });
      // adapt to backend structure: res.data.data array
      setRawData(res.data?.data || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || "Failed to fetch content.");
    } finally {
      setLoading(false);
    }
  }, [user, classId, subjectId, chapterId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return rawData.filter((item: any) => {
      if (!item) return false;
      const matchesSearch =
        !search ||
        (item.title || "")
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (item.description || "")
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (item.tags || []).some((tag: string) =>
          tag.toLowerCase().includes(search.toLowerCase())
        );

      const matchesType =
        activeTypeTab === "all" || item.type === activeTypeTab;
      const matchesStatus =
        !statusFilter || item.approvalStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rawData, search, activeTypeTab, statusFilter]);

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
              // quick view would go here
              window.open(item.s3Key ? `/s3/${item.s3Key}` : "#", "_blank");
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
      const payload = {
        ...values,
        classId,
        subjectId,
        chapterId,
      };

      if (modalMode === "add") {
        const res = await api.post("/content", payload);
        setRawData((prev) => [...prev, res.data]);
        toast.success("Content added!");
      } else if (modalMode === "edit" && selectedItem) {
        const res = await api.patch(`/content/${selectedItem._id}`, payload);
        setRawData((prev) =>
          prev.map((c) => (c._id === selectedItem._id ? res.data : c))
        );
        toast.success("Content updated!");
      } else if (modalMode === "delete" && selectedItem) {
        await api.delete(`/content/${selectedItem._id}`);
        setRawData((prev) => prev.filter((c) => c._id !== selectedItem._id));
        toast.success("Content deleted!");
      }
    } catch (err: any) {
      const code = err?.response?.status;
      const msg = err?.response?.data?.message || "Request failed.";
      setErrorMsg(`Error ${code}: ${msg}`);
      toast.error(`Error ${code}: ${msg}`);
    } finally {
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-8 lg:p-20">
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

      {/* Type tabs for quick filtering */}
      <Tabs
        value={activeTypeTab}
        onValueChange={(v) => setActiveTypeTab(v as any)}
      >
        <TabsList className="grid grid-cols-6 gap-2 max-w-md">
          {TYPE_TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="pt-4">
        <DataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          emptyMessage="No content found."
          onSearch={(q) => setSearch(q)}
        />
      </div>

      {errorMsg && (
        <div className="text-red-600 font-medium border border-red-400 p-3 rounded-lg bg-red-50">
          {errorMsg}
        </div>
      )}

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
    </div>
  );
}
