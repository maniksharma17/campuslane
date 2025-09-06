"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { api } from "@/lib/api";
import Spinner from "@/components/ui/spinner";
import { AdminLayout } from "@/components/layout/admin-layout";

interface ProductVariant {
  name: string;
  price: number;
  cutoffPrice?: number;
  stock: number;
  images?: string[];
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  images: string[];
  variants: ProductVariant[];
  school?: string;
  gender?: "Boys" | "Girls" | "Unisex";
  classLevel?: {
    name: string
  };
  subject?: string;
  brand?: string;
  type?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/products/${productId}`);
        setProduct(res.data.data);
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    }
    if (productId) fetchProduct();
  }, [productId]);

  if (!product) return <Spinner />;

  return (
    <AdminLayout>
      <div className="p-6 mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.back()}
        >
          ← Back
        </Button>

        {/* Product Header */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                {product.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.description && (
                <p className="text-sm text-gray-600">{product.description}</p>
              )}
              <p className="text-xs text-gray-500">
                Last updated: {new Date(product.updatedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {product.isActive ? "✅ Active" : "❌ Inactive"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Created: {new Date(product.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Images Section */}
        {product.images?.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {product.images.map((img, i) => (
                  <Image
                    key={i}
                    src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${img}`}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="rounded-lg border object-contain w-full h-48"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Variants Section */}
        {product.variants?.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {product.variants.map((variant, idx) => (
                  <Card key={idx} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{variant.name}</h4>
                    <p className="text-sm text-gray-700">
                      ₹{variant.price}
                      {variant.cutoffPrice && (
                        <span className="line-through ml-2 text-gray-400">
                          ₹{variant.cutoffPrice}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock: {variant.stock}
                    </p>

                    {variant.images && variant.images?.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {variant.images.map((img, j) => (
                          <Image
                            key={j}
                            src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${img}`}
                            alt={variant.name}
                            width={80}
                            height={80}
                            className="rounded border object-contain"
                          />
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Section */}
<Card>
  <CardHeader>
    <CardTitle className="text-lg font-semibold">Details</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <tbody>
          {product.brand && (
            <tr className="border-b">
              <td className="py-2 px-3 font-medium text-gray-700 w-40">
                Brand
              </td>
              <td className="py-2 px-3">{product.brand}</td>
            </tr>
          )}
          {product.type && (
            <tr className="border-b">
              <td className="py-2 px-3 font-medium text-gray-700">Type</td>
              <td className="py-2 px-3">{product.type}</td>
            </tr>
          )}
          {product.gender && (
            <tr className="border-b">
              <td className="py-2 px-3 font-medium text-gray-700">Gender</td>
              <td className="py-2 px-3">{product.gender}</td>
            </tr>
          )}
          {product.classLevel && (
            <tr className="border-b">
              <td className="py-2 px-3 font-medium text-gray-700">
                Class Level
              </td>
              <td className="py-2 px-3">{product.classLevel.name}</td>
            </tr>
          )}
          {product.subject && (
            <tr className="border-b">
              <td className="py-2 px-3 font-medium text-gray-700">Subject</td>
              <td className="py-2 px-3">{product.subject}</td>
            </tr>
          )}
          {product.category && (
            <tr className="border-b">
              <td className="py-2 px-3 font-medium text-gray-700">Category</td>
              <td className="py-2 px-3">
                {typeof product.category === "object"
                  ? (product.category as any).name ||
                    (product.category as any)._id
                  : product.category}
              </td>
            </tr>
          )}
          {product.school && (
            <tr className="border-b">
              <td className="py-2 px-3 font-medium text-gray-700">School</td>
              <td className="py-2 px-3">
                {typeof product.school === "object"
                  ? (product.school as any).name ||
                    (product.school as any)._id
                  : product.school}
              </td>
            </tr>
          )}
          <tr>
            <td className="py-2 px-3 font-medium text-gray-700">Created At</td>
            <td className="py-2 px-3">
              {new Date(product.createdAt).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td className="py-2 px-3 font-medium text-gray-700">Updated At</td>
            <td className="py-2 px-3">
              {new Date(product.updatedAt).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </CardContent>
</Card>

      </div>
    </AdminLayout>
  );
}
