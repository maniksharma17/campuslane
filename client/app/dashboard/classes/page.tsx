"use client";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export default function ClassesPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const [rawData, setRawData] = useState<any[]>([]); // unfiltered server data
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/classes"); // no search param
      setRawData(res.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter client-side
  const filteredData = useMemo(() => {
    if (!search) return rawData;
    return rawData.filter((item: any) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [rawData, search]);

  // Paginate client-side
  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredData.slice(start, start + limit);
  }, [filteredData, page, limit]);

  const totalPages = Math.ceil(filteredData.length / limit);

  const columns = [
    { key: "name", title: "Class Name", sortable: true },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, item: any) => (
        <Button
          size="sm"
          onClick={() => router.push(`/dashboard/classes/${item._id}/subjects`)}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 lg:p-20">
      <h2 className="text-2xl font-semibold">Classes</h2>
      <DataTable
        data={paginatedData}
        columns={columns}
        loading={loading}
        pagination={{
          page,
          limit,
          total: filteredData.length,
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
        emptyMessage="No classes found."
      />
    </div>
  );
}
