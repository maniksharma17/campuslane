"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Eye, Trash2, Check } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { notificationsApi, usersApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export interface Notification {
  _id: string;
  userId: string;
  role: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  meta: {
    teacherId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications({
        ...pagination,
        search: searchQuery,
        type: filterType !== "all" ? filterType : undefined,
      });
      setAllData(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("fetch notifications error:", err);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, pagination.page, pagination.limit, filterType]);

  // handlers
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error("mark as read error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      await fetchNotifications();
    } catch (err) {
      console.error("delete notification error:", err);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Teacher Approvals</h1>
          
        </div>

        <DataTable<Notification>
          data={allData}
          columns={[
            {
              key: "createdAt",
              title: "Date",
              render: (_v, item) =>
                new Date(item.createdAt).toLocaleString("en-IN"),
              sortable: true
            },
            { key: "title", title: "Title", sortable: true },
            { key: "body", title: "Message" },
            {
              key: "actions",
              title: "Actions",
              render: (_v, item) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() =>
                      router.push(`/admin/users/notifications/detail?teacherId=${item.meta.teacherId}`)
                    }
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item._id)}
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
