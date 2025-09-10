"use client";

import { useState, useEffect } from "react";
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
import { uploadApi } from "@/lib/api";
import axios from "axios";
import { useAuthStore } from "@/lib/auth"; // ✅ import auth store

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

interface CommonModalProps {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "delete";
  title: string;
  initialData?: Record<string, any>;
  fields?: Field[];
  onSubmit: (values?: Record<string, any>) => Promise<void> | void;
  fileUploadAllowed: boolean;
}

export default function CommonModal({
  open,
  onClose,
  mode,
  title,
  initialData = {},
  fields = [],
  onSubmit,
  fileUploadAllowed,
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
  const [detectedType, setDetectedType] = useState<"file" | "video" | "image" | null>(null);

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
      setDuration(video.duration);
      URL.revokeObjectURL(video.src);
    };
  } else if (selectedFile.type.startsWith("image/")) {
    setDetectedType("image");
    setDuration(null);
  } else {
    setDetectedType("file"); // default for PDFs, docs, etc.
    setDuration(null);
  }
};


  useEffect(() => {
    if (mode === "edit") {
      setFormData(initialData);
    } else {
      setFormData({});
    }
    setThumbnail(null);
    setFile(null);
    setUploadProgress({});
  }, [mode, initialData, open]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadToS3 = async (file: File, type: "thumbnail" | "file") => {
    const { data } = await uploadApi.getPresignedUrl({
      contentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    });

    await axios.put(data.data.url, file, {
      headers: { "Content-Type": file.type },
    });

    return data.data.key;
  };

  const handleSubmit = async () => {
    try {
      // ✅ Require thumbnail if neither exists in edit/add mode
      if (mode !== "delete" && !thumbnail && !initialData.thumbnailKey) {
        alert("Thumbnail is required.");
        return;
      }

      setLoading(true);

      let uploadedThumbnail: string | undefined;
      let uploadedFile: string | undefined;

      if (thumbnail) {
        uploadedThumbnail = await uploadToS3(thumbnail, "thumbnail");
      }
      if (file) {
        uploadedFile = await uploadToS3(file, "file");
      }

      const { admin } = useAuthStore.getState();

      const finalData = {
        ...formData,
        thumbnailKey:
          mode === "edit"
            ? thumbnail
              ? uploadedThumbnail
              : initialData.thumbnailKey
            : uploadedThumbnail,
        s3Key:
          mode === "edit"
            ? file
              ? uploadedFile
              : initialData.s3Key
            : uploadedFile,

        uploaderId: admin.id,
        uploaderRole: "admin",
        approvalStatus: "approved",
        isAdminContent: true,

        fileSize,
        duration,
      };

      if (mode === "delete") {
        await onSubmit();
      } else {
        await onSubmit(finalData);
      }

      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && `Add ${title}`}
            {mode === "edit" && `Edit ${title}`}
            {mode === "delete" && `Delete ${title}`}
          </DialogTitle>
        </DialogHeader>

        {mode === "delete" ? (
          <p className="text-red-600">
            Are you sure you want to delete this {title.toLowerCase()}? This
            action cannot be undone.
          </p>
        ) : (
          <form className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1">
                <Label>{field.label}</Label>

                {field.type === "text" && (
                  <Input
                    type="text"
                    required={field.required}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}

                {field.type === "number" && (
                  <Input
                    type="number"
                    required={field.required}
                    value={formData[field.name] || ""}
                    onChange={(e) =>
                      handleChange(field.name, Number(e.target.value))
                    }
                  />
                )}

                {field.type === "textarea" && (
                  <Textarea
                    required={field.required}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  />
                )}

                {field.type === "select" && "options" in field && (
                  <Select
                    value={formData[field.name] || ""}
                    onValueChange={(value) => handleChange(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}

            {/* Thumbnail Upload */}
            <div className="space-y-1">
              <Label>Thumbnail (required)</Label>
              <Input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              />
              {uploadProgress.thumbnail !== undefined && (
                <div className="h-2 bg-gray-200 rounded">
                  <div
                    className="h-2 bg-blue-500 rounded"
                    style={{ width: `${uploadProgress.thumbnail}%` }}
                  />
                </div>
              )}
            </div>

            {/* File Upload */}
            {fileUploadAllowed && (
              <div className="space-y-1">
                <Label>File</Label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                />

                {uploadProgress.file !== undefined && (
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-2 bg-green-500 rounded"
                      style={{ width: `${uploadProgress.file}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            {file && (
              <p className="text-sm text-gray-600">
                Size: {(fileSize! / (1024 * 1024)).toFixed(2)} MB{" "}
                {duration !== null &&
                  `(Duration: ${Math.floor(duration / 60)}:${String(
                    Math.floor(duration % 60)
                  ).padStart(2, "0")})`}
              </p>
            )}
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={mode === "delete" ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing..." : mode === "delete" ? "Delete" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
