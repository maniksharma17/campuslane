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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


interface ContentDetail {
  _id: string;
  title: string;
  description?: string;
  type: "file" | "video" | "quiz" | "game" | "image";
  quizType?: "googleForm" | "native";
  googleFormUrl?: string;
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
  uploaderId?: any;
  createdAt: string;
  updatedAt: string;
  questions?: Array<{
    questionText: string;
    options: string[];
    correctOption: number;
    s3Key?: string;
  }>;
  feedback?: string;
}

export default function ContentDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contentId = searchParams.get("id");

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  // Feedback modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState("");
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);

  const fetchContent = async () => {
    if (!contentId) return;
    setLoading(true);
    try {
      const res = await api.get(`/content/${contentId}`);
      // API returns { data: content }
      const payload = res.data?.data || res.data || null;
      setContent(payload);
    } catch (err) {
      console.error("Failed to fetch content:", err);
      toast.error("Failed to fetch content.");
      // go back after small delay so admin isn't stranded
      setTimeout(() => router.back(), 600);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId]);

  const makeStatusRequest = async (action: "approve" | "reject", feedback?: string) => {
    if (!content) return null;
    setStatusChanging(true);
    try {
      const endpoint =
        action === "approve"
          ? `/admin/content/${content._id}/approve`
          : `/admin/content/${content._id}/reject`;

      const res = await api.patch(endpoint, { feedback });
      const updated = res.data?.data || res.data;
      setContent(updated);
      toast.success(`Content ${action === "approve" ? "approved" : "rejected"} successfully`);
      return updated;
    } catch (err: any) {
      console.error("Status change failed:", err);
      const code = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Request failed.";
      toast.error(`Error ${code}: ${msg}`);
      return null;
    } finally {
      setStatusChanging(false);
    }
  };

  const openFeedbackModal = (action: "approve" | "reject") => {
    setPendingAction(action);
    // If rejecting, require feedback — if approving, allow optional feedback
    setFeedbackValue(action === "reject" ? (content?.feedback || "") : (content?.feedback || ""));
    setFeedbackOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    if (!pendingAction || !content) return;
    // If rejecting, require non-empty feedback
    if (pendingAction === "reject" && (!feedbackValue || feedbackValue.trim() === "")) {
      toast.error("Please provide feedback when rejecting content.");
      return;
    }

    setFeedbackOpen(false);
    await makeStatusRequest(pendingAction, feedbackValue?.trim() || undefined);
    setPendingAction(null);
    setFeedbackValue("");
  };

  const handleStatusSelect = async (value: ContentDetail["approvalStatus"]) => {
    if (!content) return;
    if (value === content.approvalStatus) return;

    if (value === "approved") {
      // allow admin to optionally add feedback
      openFeedbackModal("approve");
    } else if (value === "rejected") {
      // require feedback
      openFeedbackModal("reject");
    } else {
      // set to pending - simply call API? We'll call reject->pending not provided; usually admins don't set pending back
      toast("Setting to pending is not allowed via this UI.");
    }
  };

  const renderBadge = (status: ContentDetail["approvalStatus"]) => {
    const color =
      status === "approved" ? "bg-green-100 text-green-800" : status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";
    return <Badge className={`px-3 py-1 ${color}`}>{status.toUpperCase()}</Badge>;
  };

  const fileUrl = (key?: string) => (key ? `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${key}` : undefined);

  const renderMediaPreview = (key?: string, className = "rounded") => {
    if (!key) return null;
    const url = fileUrl(key)!;
    const ext = key.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return <Image height={200} width={200} src={url} alt="preview" className={`w-full max-h-80 object-cover ${className}`} />;
    }
    if (["mp4", "webm", "mov"].includes(ext || "")) {
      return <video controls src={url} className={`w-full max-h-80 ${className}`} />;
    }
    if (["mp3", "wav", "ogg"].includes(ext || "")) {
      return (
        <div className="py-2">
          <audio controls src={url} className="w-full" />
        </div>
      );
    }
    // otherwise show link
    return (
      <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
        Open file
      </a>
    );
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
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{content.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              {renderBadge(content.approvalStatus)}
              <div className="text-sm text-muted-foreground">
                Uploaded by: <strong>{content.uploaderId.email ?? content.uploaderRole}</strong>{" "}
                <span className="mx-2">•</span>
                {new Date(content.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
          </div>
        </div>

        {/* Thumbnail & preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {content.thumbnailKey && (
              <Card className="overflow-hidden">
                <div className="w-full h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
                  <Image
                    src={fileUrl(content.thumbnailKey) || ""}
                    alt="thumbnail"
                    width={1200}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            )}

            {/* Description and preview area */}
            <Card>
              <CardHeader>
                <CardTitle>Preview & Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none text-sm">
                  {content.description || <span className="text-gray-500">No description provided.</span>}
                </div>

                {/* Content preview depending on type */}
                {content.type === "quiz" ? (
                  <>
                    {content.quizType === "googleForm" ? (
                      <div className="space-y-2">
                        <Label>Google Form</Label>
                        {content.googleFormUrl ? (
                          <a href={content.googleFormUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            Open Google Form
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">No Google Form URL provided.</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Label>Questions (Native Quiz)</Label>
                        {content.questions && content.questions.length > 0 ? (
                          <div className="space-y-4">
                            {content.questions.map((q, i) => (
                              <div key={i} className="p-4 border rounded-md bg-white">
                                <div className="flex justify-between items-start">
                                  <div className="font-medium">
                                    Q{i + 1}. {q.questionText}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Correct: {q.options[q.correctOption]}</div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {q.options.map((opt, oi) => (
                                    <div key={oi} className={`p-2 rounded ${oi === q.correctOption ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}>
                                      <div className="text-sm">{String.fromCharCode(65 + oi)}. {opt}</div>
                                    </div>
                                  ))}
                                </div>

                                {q.s3Key && (
                                  <div className="mt-3">
                                    <Label>Attached media</Label>
                                    <div className="mt-2">{renderMediaPreview(q.s3Key)}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No questions available.</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Non-quiz preview */}
                    <div className="space-y-3">
                      {content.s3Key ? (
                        <div>{renderMediaPreview(content.s3Key)}</div>
                      ) : (
                        <div className="text-sm text-gray-500">No file uploaded for this content.</div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: meta, academic context, actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Academic Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Class:</strong> {content.classId?.name || "—"}</p>
                <p><strong>Subject:</strong> {content.subjectId?.name || "—"}</p>
                <p><strong>Chapter:</strong> {content.chapterId?.name || "—"}</p>

                {typeof content.duration === "number" && (
                  <p>
                    <strong>Duration:</strong>{" "}
                    {Math.floor(content.duration / 60)}:{String(Math.floor(content.duration % 60)).padStart(2, "0")} mins
                  </p>
                )}

                {typeof content.fileSize === "number" && (
                  <p><strong>File Size:</strong> {(content.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags & Uploader</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  {content.tags && content.tags.length > 0 ? (
                    content.tags.map((t) => <Badge key={t}>{t}</Badge>)
                  ) : (
                    <span className="text-gray-500 text-sm">No tags</span>
                  )}
                </div>

                <div className="pt-3 text-sm">
                  <div><strong>Uploader Role:</strong> {content.uploaderRole}</div>
                  {content.uploaderId && <div><strong>Name:</strong> {content.uploaderId.name} / {content.uploaderId.email}</div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  {content.s3Key && (
                    <Button onClick={() => window.open(fileUrl(content.s3Key), "_blank")}>View/Download</Button>
                  )}

                  <Button onClick={() => openFeedbackModal("approve")} disabled={statusChanging} variant="default" className="bg-green-600">Approve</Button>
                  <Button onClick={() => openFeedbackModal("reject")} disabled={statusChanging} variant="destructive">Reject</Button>

                  {content.feedback && (
                    <div className="pt-2">
                      <Label>Previous feedback</Label>
                      <div className="mt-1 p-2 border rounded bg-gray-50 text-sm whitespace-pre-wrap">
                        {content.feedback}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feedback modal */}
        <Dialog open={feedbackOpen} onOpenChange={() => setFeedbackOpen(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{pendingAction === "approve" ? "Approve content" : "Reject content"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Provide feedback {pendingAction === "reject" ? "(required when rejecting)" : "(optional)"}</Label>
                <Textarea value={feedbackValue} onChange={(e) => setFeedbackValue(e.target.value)} placeholder="Write feedback for the uploader..." />
              </div>

              <div className="text-sm text-muted-foreground">
                This feedback will be saved with the content and visible to the uploader.
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setFeedbackOpen(false); setPendingAction(null); }}>Cancel</Button>
              <Button onClick={handleFeedbackSubmit} disabled={statusChanging}>
                {statusChanging ? "Processing..." : pendingAction === "approve" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
