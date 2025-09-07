"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TeacherModal, { Teacher } from "@/components/teacher-modal";
import { usersApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function TeacherDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get("teacherId");

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTeacher = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await usersApi.getTeacherById(teacherId);
      setTeacher(res.data.data);
    } catch (err) {
      console.error("Error fetching teacher:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const handleSubmit = async (values?: Partial<Teacher>) => {
    if (!teacher) return;
    try {
      await usersApi.updateTeacher(teacher._id!, values);
      await fetchTeacher();
    } catch (err) {
      console.error("teacher update error:", err);
    }
  };

  if (loading || !teacher) {
    return (
      <AdminLayout>
        <div className="p-6">Loading teacher details...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 mx-auto space-y-6">
        {/* Back */}
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{teacher.name}</h1>
          <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>

        {/* Teacher Info as Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full border border-gray-200 text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium bg-gray-50 w-1/3">Email</td>
                  <td className="px-4 py-2">{teacher.email}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium bg-gray-50">Phone</td>
                  <td className="px-4 py-2">{teacher.phone || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium bg-gray-50">City</td>
                  <td className="px-4 py-2">{teacher.city || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium bg-gray-50">State</td>
                  <td className="px-4 py-2">{teacher.state || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium bg-gray-50">Country</td>
                  <td className="px-4 py-2">{teacher.country || "-"}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium bg-gray-50">Approval Status</td>
                  <td className="px-4 py-2">
                    {teacher.approvalStatus === "approved" && (
                      <span className="bg-green-200 text-xs px-2 py-1 rounded">Approved</span>
                    )}
                    {teacher.approvalStatus === "pending" && (
                      <span className="bg-yellow-200 text-xs px-2 py-1 rounded">Pending</span>
                    )}
                    {teacher.approvalStatus === "rejected" && (
                      <span className="bg-red-200 text-xs px-2 py-1 rounded">Rejected</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium bg-gray-50">Created</td>
                  <td className="px-4 py-2">
                    {new Date(teacher.createdAt as Date).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium bg-gray-50">Updated</td>
                  <td className="px-4 py-2">
                    {new Date(teacher.updatedAt as Date).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <TeacherModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode="edit"
          initialData={teacher}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
