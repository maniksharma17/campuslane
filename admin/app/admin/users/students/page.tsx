"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Plus, Pencil, Trash2 } from "lucide-react";
import StudentModal, { Student } from "@/components/student-modal";
import { DataTable } from "@/components/ui/data-table";
import { usersApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function StudentsPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ 
    page: 1,
    limit: 10,
    total: 0,
    pages: 0, 
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete">("add");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // fetch
  const fetchStudents = async () => {
    setLoading(true);
    try {
      // adjust params if backend supports paging/search
      const res = await usersApi.getStudents({
        ...pagination,
        search: searchQuery,
      });
      setAllData(res.data.data || []);
      setPagination(res.data.pagination)
    } catch (err) {
      console.error("fetch students error:", err);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchQuery, pagination.page, pagination.limit]);



  // CRUD handler called by page; the modal uploads avatar and passes finalData here
  const handleSubmit = async (values?: Partial<Student>) => {
    try {
      if (modalMode === "edit" && selectedStudent) {
        await usersApi.updateStudent(selectedStudent._id!, values);
      } else if (modalMode === "delete" && selectedStudent) {
        await usersApi.deleteStudent(selectedStudent._id!);
      }
      await fetchStudents();
    } catch (err) {
      console.error("student operation error:", err);
      alert("Operation failed. See console.");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Students</h1>
        </div>

        <DataTable<Student>
          data={allData}
          columns={[
            { key: "name", title: "Name", sortable: true },
            { key: "email", title: "Email" },
            { key: "studentCode", title: "Code" },
            { key: "age", title: "Age", render: (v, item) => item.age ?? "-" },
            {
              key: "actions",
              title: "Actions",
              render: (_v, item) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => router.push(`/admin/students/${item._id}`)}
                    title="View"
                  >
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedStudent(item);
                      setModalOpen(true);
                    }}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setModalMode("delete");
                      setSelectedStudent(item);
                      setModalOpen(true);
                    }}
                    title="Delete"
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
            total: pagination?.total,
            totalPages: pagination?.pages,
          }}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
          onSearch={(q) => {
            setSearchQuery(q);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        />

        <StudentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          initialData={selectedStudent || {}}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
