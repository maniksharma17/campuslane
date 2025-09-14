"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ecommerceApi } from "@/lib/api";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type RawItem = {
  _id?: string;
  productId?: string | Record<string, any>;
  variantId?: string | Record<string, any>;
  name?: string;
  price?: number;
  quantity?: number;
  variant?: { images: string[]; name: string };
};

type RawOrder = {
  _id: string;
  items?: RawItem[];
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  shippingAddress?: Record<string, any>;
  paymentType?: string;
  paymentStatus?: string;
  deliveryRate?: number;
  freeShipping?: boolean;
};

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export default function OrderDetailPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState<RawOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("");

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res = await ecommerceApi.getOrderById(orderId);
        setOrder(res.data.data);
      } catch (err) {
        console.error("fetch order error", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  async function handleSaveEdit() {
    if (!order) return;
    try {
      await ecommerceApi.updateOrderStatus(order._id, editStatus);
      setOrder({ ...order, status: editStatus });
      setEditOpen(false);
    } catch (err) {
      console.error("update order error", err);
    }
  }

  if (loading)
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      </AdminLayout>
    );

  if (!order)
    return (
      <AdminLayout>
        <div className="p-6 text-center text-gray-500">
          Order not found or has been deleted.
        </div>
      </AdminLayout>
    );

  const statusIndex = STATUS_FLOW.indexOf(order.status || "pending");

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            Order #{order._id.slice(-6).toUpperCase()}
          </h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditStatus(order.status || "pending");
              setEditOpen(true);
            }}
          >
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between">
            <CardTitle className="text-xl">Order Summary</CardTitle>
            <Badge
              variant={
                order.status === "delivered"
                  ? "default"
                  : order.status === "cancelled"
                  ? "destructive"
                  : "outline"
              }
              className="text-sm"
            >
              {order.status?.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Progress Bar */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {STATUS_FLOW.map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`rounded-full w-8 h-8 flex items-center justify-center text-xs ${
                      idx <= statusIndex
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-sm capitalize">{s.replace(/_/g, " ")}</span>
                  {idx < STATUS_FLOW.length - 1 && (
                    <div
                      className={`h-0.5 w-8 ${
                        idx < statusIndex ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Shipping + Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
                <div className="text-sm space-y-1">
                  <p>{order.shippingAddress?.name}</p>
                  <p>{order.shippingAddress?.phone}</p>
                  <p>
                    {order.shippingAddress?.street}
                    {order.shippingAddress?.streetOptional &&
                      `, ${order.shippingAddress.streetOptional}`}
                  </p>
                  <p>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                    {order.shippingAddress?.zipcode}
                  </p>
                  <p>{order.shippingAddress?.country}</p>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Payment</h2>
                <p className="text-sm">Type: {order.paymentType}</p>
                <p className="text-sm">
                  Status:{" "}
                  <span
                    className={
                      order.paymentStatus === "success"
                        ? "text-green-600 font-medium"
                        : order.paymentStatus === "failed"
                        ? "text-red-600 font-medium"
                        : "text-gray-600"
                    }
                  >
                    {order.paymentStatus}
                  </span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Items</h2>
              <div className="space-y-4">
                {order.items?.map((item) => {
                  const variant = item.variant ?? {};
                  return (
                    <div
                      key={item._id}
                      className="flex items-center gap-4 border-b pb-3"
                    >
                      <Image
                        src={
                          variant.images?.[0]
                            ? `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${variant.images[0]}`
                            : "/placeholder.png"
                        }
                        alt={variant.name ?? item.name ?? "Product"}
                        width={80}
                        height={80}
                        className="rounded object-cover w-20 h-20"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Variant: {variant.name ?? "-"}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">
                        ₹{(item.price ?? 0) * (item.quantity ?? 1)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{order.totalAmount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
