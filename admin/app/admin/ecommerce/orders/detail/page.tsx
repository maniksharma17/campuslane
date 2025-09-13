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
import { Loader2 } from "lucide-react";

interface IShippingAddress {
  name: string;
  phone: string;
  street: string;
  streetOptional?: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

interface IOrderItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
  };
  quantity: number;
  price: number;
}

interface IOrder {
  _id: string;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  shippingAddress: IShippingAddress;
  paymentType: "COD" | "Razorpay";
  paymentStatus: "pending" | "success" | "failed";
  paymentId?: string;
  deliveryRate: number;
  freeShipping: boolean;
  createdAt: string;
}

export default function OrderDetailPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">
          Order #{order._id.slice(-6).toUpperCase()}
        </h1>
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
              {order.status.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer + Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
                <p className="text-sm">{order.shippingAddress.name}</p>
                <p className="text-sm">{order.shippingAddress.phone}</p>
                <p className="text-sm">
                  {order.shippingAddress.street}
                  {order.shippingAddress.streetOptional
                    ? `, ${order.shippingAddress.streetOptional}`
                    : ""}
                </p>
                <p className="text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipcode}
                </p>
                <p className="text-sm">{order.shippingAddress.country}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Payment</h2>
                <p className="text-sm">
                  Type: <span className="font-medium">{order.paymentType}</span>
                </p>
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
                {order.paymentId && (
                  <p className="text-xs text-gray-500">
                    Payment ID: {order.paymentId}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 border-b pb-3"
                  >
                    <Image
                      src={
                        item.productId?.images?.[0]
                          ? `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${item.productId.images[0]}`
                          : "/placeholder.png"
                      }
                      alt={item.productId?.name ?? "Product"}
                      width={80}
                      height={80}
                      className="rounded object-cover w-20 h-20"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.productId?.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{order.totalAmount}</span>
            </div>

            {/* Admin Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline">Mark as Shipped</Button>
              <Button variant="destructive">Cancel Order</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
