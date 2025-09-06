"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Plus, Pencil, Trash2 } from "lucide-react";
import TeacherModal, { Teacher } from "@/components/teacher-modal";
import { DataTable } from "@/components/ui/data-table";
import { usersApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function TeachersPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<Teacher[]>([]);
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
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Fetch teachers
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getTeachers({
        ...pagination,
        search: searchQuery,
      });
      setAllData(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("fetch teachers error:", err);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, pagination.page, pagination.limit]);

  // CRUD handler
  const handleSubmit = async (values?: Partial<Teacher>) => {
    try {
      if (modalMode === "edit" && selectedTeacher) {
        await usersApi.updateTeacher(selectedTeacher._id!, values);
      } else if (modalMode === "delete" && selectedTeacher) {
        await usersApi.deleteTeacher(selectedTeacher._id!);
      }
      await fetchTeachers();
    } catch (err) {
      console.error("teacher operation error:", err);
      alert("Operation failed. See console.");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Teachers</h1>
          <Button
            onClick={() => {
              setModalMode("add");
              setSelectedTeacher(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Teacher
          </Button>
        </div>

        <DataTable<Teacher>
          data={allData}
          columns={[
            { key: "name", title: "Name", sortable: true },
            { key: "email", title: "Email" },
            { key: "phone", title: "Phone", render: (_v, item) => item.phone || "-" },
            {
              key: "approvalStatus",
              title: "Approval Status",
              render: (_v, item) => {
                if (item.approvalStatus == 'approved'){
                  return <div className="bg-green-200 px-2 py-1 text-xs w-fit rounded-full">Approved</div>
                } else if (item.approvalStatus == 'rejected'){
                   return <div className="bg-red-200 px-2 py-1 text-xs w-fit rounded-full">Rejected</div>
                } else {
                   return <div className="bg-yellow-200 px-2 py-1 text-xs w-fit rounded-full">Pending</div>
                }
              },
            },
            {
              key: "actions",
              title: "Actions",
              render: (_v, item) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => router.push(`/admin/teachers/${item._id}`)}
                    title="View"
                  >
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedTeacher(item);
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
                      setSelectedTeacher(item);
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

        <TeacherModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          initialData={selectedTeacher || {}}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
