"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import axios from "axios";
import { useAuthStore } from "@/lib/store/auth";
import Image from "next/image";

export type Field =
  | {
      name: string;
      label: string;
      type: "text" | "textarea" | "number";
      required?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: { value: string; label: string }[];
      required?: boolean;
    };

type ContentTypeString = "file" | "video" | "quiz" | "game" | "image";

interface CommonModalProps {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "delete";
  title: string;
  initialData?: Record<string, any>;
  fields?: Field[]; // additional fields to render (merged with type-specific)
  onSubmit: (values?: Record<string, any>) => Promise<void> | void;
  fileUploadAllowed?: boolean;
  defaultType?: ContentTypeString;
}

const CONTENT_TYPES: ContentTypeString[] = [
  "file",
  "video",
  "quiz",
  "game",
  "image",
];

export default function CommonModal({
  open,
  onClose,
  mode,
  title,
  initialData = {},
  fields = [],
  onSubmit,
  fileUploadAllowed = true,
  defaultType = "file",
}: CommonModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Upload states
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    thumbnail?: number;
    file?: number;
  }>({});
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [detectedType, setDetectedType] = useState<ContentTypeString | null>(
    null
  );

  // chosen content type tab inside modal
  const [selectedType, setSelectedType] =
    useState<ContentTypeString>(initialData?.type || defaultType);

  // local error text
  const [localError, setLocalError] = useState<string | null>(null);

  // load initialData when editing
  useEffect(() => {
    if (mode === "edit") {
      setFormData({
        ...initialData,
        tags: initialData?.tags ? (initialData.tags as string[]).join(", ") : "",
      });
      setSelectedType((initialData?.type as ContentTypeString) || defaultType);
    } else {
      setFormData({});
      setSelectedType(defaultType);
    }
    setThumbnail(null);
    setFile(null);
    setUploadProgress({});
    setFileSize(null);
    setDuration(null);
    setDetectedType(null);
    setLocalError(null);
  }, [mode, initialData, open, defaultType]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (!selectedFile) {
      setFileSize(null);
      setDuration(null);
      setDetectedType(null);
      return;
    }

    setFileSize(selectedFile.size);

    if (selectedFile.type.startsWith("video/")) {
      setDetectedType("video");
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = URL.createObjectURL(selectedFile);
      video.onloadedmetadata = () => {
        setDuration(Math.floor(video.duration));
        URL.revokeObjectURL(video.src);
      };
    } else if (selectedFile.type.startsWith("image/")) {
      setDetectedType("image");
      setDuration(null);
    } else {
      // treat other files as general 'file'
      setDetectedType("file");
      setDuration(null);
    }
  };

  const uploadToS3 = async (fileToUpload: File, kind: "thumbnail" | "file") => {
    // returns key
    const { data } = await api.post("/admin/presign", {
      contentType: fileToUpload.type,
      fileSize: fileToUpload.size,
      fileName: fileToUpload.name,
    });

    const url = data.data?.url;
    const key = data.data?.key;

    if (!url || !key) throw new Error("Presign failed");

    await axios.put(url, fileToUpload, {
      headers: { "Content-Type": fileToUpload.type },
      onUploadProgress: (evt) => {
        const pct = evt.total ? Math.round((evt.loaded * 100) / evt.total) : 0;
        setUploadProgress((prev) => ({ ...prev, [kind]: pct }));
      },
    });

    return key;
  };

  const handleSubmit = async () => {
    setLocalError(null);

    if (mode === "delete") {
      setLoading(true);
      try {
        await onSubmit?.();
        onClose();
      } catch (err: any) {
        console.error(err);
        setLocalError(err?.response?.data?.message || err.message || "Delete failed");
      } finally {
        setLoading(false);
      }
      return;
    }

    // validation
    if (!formData.title && !initialData.title) {
      setLocalError("Title is required.");
      return;
    }

    // thumbnail required unless editing and initial thumbnail exists
    if (!thumbnail && !initialData.thumbnailKey) {
      setLocalError("Thumbnail is required.");
      return;
    }

    setLoading(true);

    try {
      // upload thumbnail if selected
      let uploadedThumbnail: string | undefined = initialData.thumbnailKey;
      let uploadedFileKey: string | undefined = initialData.s3Key;

      if (thumbnail) {
        uploadedThumbnail = await uploadToS3(thumbnail, "thumbnail");
      }

      // upload file if provided (or required)
      const typeToUse: ContentTypeString =
        (detectedType as ContentTypeString) || (selectedType as ContentTypeString);

      // If there's a file selected and file uploads are allowed, upload it
      if (file && fileUploadAllowed) {
        uploadedFileKey = await uploadToS3(file, "file");
      }

      // Prepare final metadata to pass up to parent (parent will call /content)
      const authState = useAuthStore.getState();
      const uploaderId = authState.user?._id || authState.user?._id || undefined;
      const uploaderRole = authState.user?.role || "teacher";

      const finalData: Record<string, any> = {
        ...initialData, // preserve e.g. _id when editing
        ...formData,
        type: typeToUse,
        thumbnailKey: uploadedThumbnail,
        s3Key: uploadedFileKey,
        fileSize: fileSize ?? initialData.fileSize,
        duration: (detectedType === "video") ? duration ?? initialData.duration : 0,
        uploaderId: formData.uploaderId || uploaderId,
        uploaderRole: formData.uploaderRole || uploaderRole,
        approvalStatus:
          formData.approvalStatus ||
          "pending",
        isAdminContent: false,
      };

      // Normalize tags -> array
      if (typeof finalData.tags === "string") {
        finalData.tags = finalData.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
      } else if (!finalData.tags) {
        finalData.tags = [];
      }

      // Quiz-specific validation
      if (typeToUse === "quiz") {
        if (!finalData.quizType) {
          setLocalError("Quiz Type is required for quizzes.");
          setLoading(false);
          return;
        }
        if (finalData.quizType === "googleForm" && !finalData.googleFormUrl) {
          setLocalError("Google Form URL is required for Google Form quizzes.");
          setLoading(false);
          return;
        }
      }

      // Call parent onSubmit with final metadata (parent will call /content)
      await onSubmit(finalData);
      onClose();
    } catch (err: any) {
      console.error("upload error", err);
      setLocalError(
        err?.response?.data?.message || err?.message || "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // Build UI fields for a selected type
  const renderTypeSpecificFields = (type: ContentTypeString) => {
    if (type === "video") {
      return (
        <>
            
          <div>
            <Label>Video File</Label>
            <Input type="file" accept="video/*" onChange={handleFileSelect} />
          </div>
        </>
      );
    }

    if (type === "quiz") {
      return (
        <>
          <div>
            <Label>Quiz Type</Label>
            <Select
              value={formData.quizType || ""}
              onValueChange={(value) => handleChange("quizType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select quiz type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="googleForm">Google Form</SelectItem>
                <SelectItem value="native">Native (JSON)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.quizType === "googleForm" && (
            <div>
              <Label>Google Form URL</Label>
              <Input
                type="text"
                value={formData.googleFormUrl || ""}
                onChange={(e) => handleChange("googleFormUrl", e.target.value)}
                placeholder="https://forms.gle/..."
              />
            </div>
          )}

          {formData.quizType === "native" && (
            <div>
              <Label>Quiz JSON</Label>
              <Input type="file" accept="application/json" onChange={handleFileSelect} />
              <p className="text-sm text-muted-foreground mt-1">
                Upload a JSON file containing the quiz payload.
              </p>
            </div>
          )}
        </>
      );
    }

    if (type === "image") {
      return (
        <>
          <div>
            <Label>Image File</Label>
            <Input type="file" accept="image/*" onChange={handleFileSelect} />
          </div>
        </>
      );
    }

    if (type === "game" || type === "file") {
      return (
        <>
          <div>
            <Label>File</Label>
            <Input type="file" onChange={handleFileSelect} />
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center font-medium justify-between">
            <span>
              {mode === "add" && "Add"}
              {mode === "edit" && "Edit"}
              {mode === "delete" && "Delete"} {title}
            </span>
          </DialogTitle>
        </DialogHeader>

        {mode === "delete" ? (
          <div className="text-center text-red-600">
            <p>Are you sure you want to delete this {title.toLowerCase()}?</p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Type tabs */}
            <div>
              <Label>Content Type</Label>
              <Tabs
                value={selectedType}
                onValueChange={(v: string) => {
                  setSelectedType(v as ContentTypeString);
                  handleChange("type", v);
                }}
              >
                <TabsList className="grid grid-cols-5 gap-2">
                  {CONTENT_TYPES.map((t) => (
                    <TabsTrigger key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Form grid */}
            <form className="grid grid-cols-1 gap-4">
              {/* Title */}
              <div>
                <Label>Title</Label>
                <Input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Tags (comma separated)</Label>
                <Input
                  value={formData.tags || ""}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="math, algebra, easy"
                />
              </div>

              {/* Type-specific */}
              {renderTypeSpecificFields(selectedType)}

              {/* Thumbnail (required) */}
              <div>
                <Label>Thumbnail (required)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                />
                {uploadProgress.thumbnail !== undefined && (
                  <div className="mt-2 h-2 bg-slate-200 rounded">
                    <div
                      className="h-2 bg-primary rounded"
                      style={{ width: `${uploadProgress.thumbnail}%` }}
                    />
                  </div>
                )}

                {/* preview */}
                {thumbnail && (
                  <div className="mt-2">
                    <Image
                      width={200}
                      height={200}
                      src={URL.createObjectURL(thumbnail)}
                      alt="thumb-preview"
                      className="h-24 rounded object-cover"
                    />
                  </div>
                )}

                {!thumbnail && initialData.thumbnailKey && (
                  <div className="mt-2">
                    <Image
                      width={200}
                      height={200}
                      src={typeof initialData.thumbnailKey === "string" ? `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${initialData.thumbnailKey}` : ""}
                      alt="existing-thumb"
                      className="h-24 rounded object-cover"
                    />
                  </div>
                )}
              </div>

              {/* File upload progress */}
              {file && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    File: {file.name} • {((fileSize ?? 0) / (1024 * 1024)).toPrecision(2)} MB
                  </p>
                  {uploadProgress.file !== undefined && (
                    <div className="mt-2 h-2 bg-slate-200 rounded">
                      <div
                        className="h-2 bg-green-600 rounded"
                        style={{ width: `${uploadProgress.file}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {localError && (
                <div className="text-sm text-red-600">{localError}</div>
              )}
            </form>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {mode === "delete" ? (
              <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
                {loading ? "Deleting..." : "Delete"}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Processing..." : mode === "edit" ? "Save changes" : "Upload"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
