"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { AdminLayout } from "@/components/layout/admin-layout";
import { ecommerceApi } from "@/lib/api";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface IOrder {
  _id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  createdAt: string;
  customer: { name: string; email: string };
  items: {
    _id: string;
    productId: { name: string; images: string[] };
    quantity: number;
    price: number;
  }[];
}

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number>(0);

  // controls
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<IOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await ecommerceApi.getOrders({
        page,
        limit,
        search,
      });
      const items = res.data?.data ?? res.data ?? [];
      const totalCount =
        res.data?.total ?? res.data?.meta?.total ?? items.length;
      setOrders(items);
      setTotal(Number(totalCount ?? 0));
    } catch (err) {
      console.error("fetchOrders error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  const totalPages = Math.ceil((total || 0) / limit);

  const columns = [
    {
      key: "id",
      title: "Order ID",
      render: (_: any, order: IOrder) =>
        `#${order._id.slice(-6).toUpperCase()}`,
    },
    {
      key: "status",
      title: "Status",
      render: (_: any, order: IOrder) => (
        <Badge
          variant={
            order.status === "delivered"
              ? "default"
              : order.status === "cancelled"
              ? "destructive"
              : "outline"
          }
        >
          {order.status}
        </Badge>
      ),
    },
    {
      key: "totalAmount",
      title: "Total",
      render: (_: any, order: IOrder) => `₹${order.totalAmount}`,
    },
    {
      key: "createdAt",
      title: "Date",
      render: (_: any, order: IOrder) =>
        new Date(order.createdAt).toLocaleDateString("en-IN"),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, order: IOrder) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelected(order);
            router.push(`/admin/ecommerce/orders/detail?id=${order._id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Orders</h1>
        </div>

        <DataTable<IOrder>
          data={orders}
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
        />

        
      </div>
    </AdminLayout>
  );
}
