"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";

interface ContentDetail {
  _id: string;
  title: string;
  description?: string;
  type: string;
  approvalStatus: "pending" | "approved" | "rejected";
  tags: string[];
  s3Key?: string;
  thumbnailKey?: string;
  duration?: number;
  fileSize?: number;
  classId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
  chapterId: { _id: string; name: string };
  uploaderRole: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContentDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contentId = searchParams.get("id");

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  const fetchContent = async () => {
    if (!contentId) return;
    setLoading(true);
    try {
      const res = await api.get(`/content/${contentId}`);
      setContent(res.data.data);
    } catch (err) {
      console.error("Failed to fetch content:", err);
      toast.error("Failed to fetch content.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  const handleStatusChange = async (
    status: "pending" | "approved" | "rejected"
  ) => {
    if (!content) return;
    setStatusChanging(true);
    try {
      if (status === "approved") {
        const res = await api.patch(`/admin/content/${content._id}/approve`);
        setContent(res.data.data);
      } else if (status === "rejected") {
        const res = await api.patch(`/admin/content/${content._id}/reject`);
        setContent(res.data.data);
      }
      
      fetchContent();
      toast.success(`Content ${status}!`);
    } catch (err: any) {
      const code = err?.response?.status;
      const msg = err?.response?.data?.message || "Request failed.";
      toast.error(`Error ${code}: ${msg}`);
    } finally {
      setStatusChanging(false);
    }
  };

  if (loading || !content) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-gray-500">Loading content...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        {/* Title + Status */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold">{content.title}</h1>
          <Select
            value={content.approvalStatus}
            onValueChange={(value) =>
              handleStatusChange(value as ContentDetail["approvalStatus"])
            }
            disabled={statusChanging}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Thumbnail */}
        {content.thumbnailKey && (
          <Card className="overflow-hidden shadow-md">
            <Image
              width={800}
              height={400}
              src={
                process.env.NEXT_PUBLIC_AWS_STORAGE_URL +
                "/" +
                content.thumbnailKey
              }
              alt="Thumbnail"
              className="w-full h-full object-cover"
            />
          </Card>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Description:</strong> {content.description || "N/A"}
              </p>
              <p>
                <strong>Type:</strong> {content.type}
              </p>
              <p>
                <strong>Uploader Role:</strong> {content.uploaderRole}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(content.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {new Date(content.updatedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Class:</strong> {content.classId.name}
              </p>
              <p>
                <strong>Subject:</strong> {content.subjectId.name}
              </p>
              <p>
                <strong>Chapter:</strong> {content.chapterId.name}
              </p>
              {content.duration && (
                <p>
                  <strong>Duration:</strong> {Math.floor(content.duration / 60)}
                  :{String(Math.floor(content.duration % 60)).padStart(2, "0")}{" "}
                  mins
                </p>
              )}
              {content.fileSize && (
                <p>
                  <strong>File Size:</strong>{" "}
                  {(content.fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {content.tags?.length > 0 ? (
              content.tags.map((t, i) => <Badge key={i}>{t}</Badge>)
            ) : (
              <span className="text-gray-500 text-sm">No tags</span>
            )}
          </CardContent>
        </Card>

        {/* File Button */}
        {content.s3Key && (
          <div className="flex">
            <Button
              size="lg"
              onClick={() =>
                window.open(
                  process.env.NEXT_PUBLIC_AWS_STORAGE_URL + "/" + content.s3Key,
                  "_blank"
                )
              }
            >
              View / Download Content
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
