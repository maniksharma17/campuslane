"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export default function ChaptersPage() {
  const { classId, subjectId } = useParams() as { classId?: string; subjectId?: string };
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!subjectId) {
      setRawData([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/chapters", { params: { subjectId } });
      const items = res.data?.data ?? res.data?.items ?? res.data ?? [];
      setRawData(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("fetch chapters error", err);
      setRawData([]);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // client-side filter across name/description
  const filteredData = useMemo(() => {
    if (!search) return rawData;
    const q = search.toLowerCase();
    return rawData.filter((it: any) =>
      (it.name ?? "").toString().toLowerCase().includes(q) ||
      (it.description ?? "").toString().toLowerCase().includes(q)
    );
  }, [rawData, search]);

  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredData.slice(start, start + limit);
  }, [filteredData, page, limit]);

  const columns = [
    { key: "name", title: "Chapter Name", sortable: true },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, item: any) => (
        <Button
          size="sm"
          onClick={() =>
            router.push(
              `/dashboard/classes/${classId}/subjects/${subjectId}/chapters/${item._id}/content`
            )
          }
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 lg:p-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Chapters</h2>
        <div className="text-sm text-muted-foreground">
          {classId} / {subjectId}
        </div>
      </div>

      <DataTable
        data={paginatedData}
        columns={columns}
        loading={loading}
        pagination={{
          page,
          limit,
          total,
          totalPages,
        }}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        emptyMessage="No chapters found."
      />
    </div>
  );
}
