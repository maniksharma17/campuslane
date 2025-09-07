"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, usersApi } from "@/lib/api";
import Spinner from "@/components/ui/spinner";
import { AdminLayout } from "@/components/layout/admin-layout";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  avatar?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export default function TeacherApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get("teacherId");

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTeacher = useCallback(async () => {
      try {
        const res = await usersApi.getTeacherById(teacherId as string);
        setTeacher(res.data.data);
      } catch (err) {
        console.error("Error fetching teacher:", err);
      } finally {
        setLoading(false)
      }
  }, [teacherId])

  useEffect(() => {
    if (teacherId) fetchTeacher();
  }, [teacherId, fetchTeacher]);

  const handleApproval = async (status: "approved" | "rejected") => {
    if (!teacherId) return;
    try {
      setLoading(true);
      if(status==="approved") {
        await usersApi.approveTeacher(teacher?._id as string);
      } else {
        await usersApi.rejectTeacher(teacher?._id as string);
      }
      
      fetchTeacher();
    } catch (err) {
      console.error("Error updating teacher approval:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!teacher) return <Spinner />;

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

      {/* Teacher Info Layout */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Left: Profile Info */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {teacher.name}
            </CardTitle>
            
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">{teacher.email}</p>
            {teacher.phone && (
              <p className="text-sm text-gray-600">📞 {teacher.phone}</p>
            )}
            {teacher.city && (
              <p className="text-sm text-gray-600">
                📍 {teacher.city}, {teacher.state}, {teacher.country}{" "}
                {teacher.pincode}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Last updated: {new Date(teacher.updatedAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Right: Status + Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm capitalize">
              {teacher.approvalStatus === "approved"
                ? "✅ Approved"
                : teacher.approvalStatus === "rejected"
                ? "❌ Rejected"
                : "⏳ Pending"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Created: {new Date(teacher.createdAt).toLocaleDateString()}
            </p>

            {teacher.approvalStatus === "pending" && (
              <div className="flex gap-3 mt-4">
                <Button
                  size="sm"
                  onClick={() => handleApproval("approved")}
                  disabled={loading}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleApproval("rejected")}
                  disabled={loading}
                >
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      
    </div>
  </AdminLayout>
);


}
