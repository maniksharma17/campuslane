"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    streetOptional: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India",
  });
  const [submitting, setSubmitting] = useState(false);

  // fetch cart
  useEffect(() => {
    async function fetchCart() {
      try {
        const res = await api.get("/cart");
        setCart(res.data.data);
      } catch (err) {
        console.error("cart fetch error", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCart();
  }, []);

  async function handleCheckout() {
    if (!cart || cart.items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // basic validation
    if (!address.name || !address.phone || !address.street || !address.city || !address.state || !address.zipcode) {
      alert("Please fill all required address fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/orders/checkout", {
        items: cart.items.map((i: any) => ({
          productId: i.productId._id || i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
        })),
        totalAmount: cart.items.reduce(
          (sum: number, i: any) => sum + i.price * i.quantity,
          0
        ),
        shippingAddress: address,
        paymentType: "COD", // fixed to COD
      });

      router.push("/shop/orders"); // redirect to orders page
    } catch (err) {
      console.error("checkout error", err);
      alert("Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6">Loading checkout...</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 pt-28">
        {/* Cart Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="font-medium">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {cart?.items?.length ? (
              <div className="space-y-4">
                {cart.items.map((item: any) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 border-b pb-4"
                  >
                    <Image
                      width={120}
                      height={120}
                      src={item.productId.images?.[0] || "/placeholder.png"}
                      alt={item.productId.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.productId.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                ))}

                <div className="flex justify-between font-bold text-lg mt-6">
                  <span>Total</span>
                  <span>
                    ₹
                    {cart.items.reduce(
                      (sum: number, i: any) =>
                        sum + i.price * i.quantity,
                      0
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p>Your cart is empty</p>
            )}
          </CardContent>
        </Card>

        {/* Checkout Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-medium">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={address.name}
                  onChange={(e) =>
                    setAddress({ ...address, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={address.phone}
                  onChange={(e) =>
                    setAddress({ ...address, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Street</Label>
              <Input
                value={address.street}
                onChange={(e) =>
                  setAddress({ ...address, street: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Street (Optional)</Label>
              <Input
                value={address.streetOptional}
                onChange={(e) =>
                  setAddress({ ...address, streetOptional: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Zipcode</Label>
                <Input
                  value={address.zipcode}
                  onChange={(e) =>
                    setAddress({ ...address, zipcode: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={address.country}
                  onChange={(e) =>
                    setAddress({ ...address, country: e.target.value })
                  }
                />
              </div>
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleCheckout}
              disabled={submitting || cart?.items?.length === 0}
            >
              {submitting ? "Processing..." : "Place Order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
