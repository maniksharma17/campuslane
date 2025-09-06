"use client";

import { useEffect, useState } from "react";
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
import { uploadApi } from "@/lib/api";
import axios from "axios";
import Image from "next/image";

interface Category {
  _id?: string;
  name: string;
  description?: string;
  image?: string; // stored key
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "delete";
  initialData?: Partial<Category>;
  onSubmit: (values?: { name: string; description?: string; image?: string }) => Promise<void> | void;
}

export default function CategoryModal({
  open,
  onClose,
  mode,
  initialData = {},
  onSubmit,
}: CategoryModalProps) {
  const [form, setForm] = useState<{ name: string; description?: string }>({
    name: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit") {
      setForm({ name: initialData.name || "", description: initialData.description || "" });
      if (initialData.image) {
        setPreviewUrl(`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${initialData.image}`);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setForm({ name: "", description: "" });
      setPreviewUrl(null);
    }
    setImageFile(null);
  }, [mode, initialData, open]);

  const handleChange = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const uploadToS3 = async (file: File) => {
    const { data } = await uploadApi.getPresignedUrl({
      contentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    });
    // put directly
    await axios.put(data.data.url, file, {
      headers: { "Content-Type": file.type },
    });
    // return key
    return data.data.key;
  };

  const handleSubmit = async () => {
    try {
      if (mode === "delete") {
        setLoading(true);
        await onSubmit();
        onClose();
        return;
      }

      if (!form.name?.trim()) {
        alert("Name is required");
        return;
      }

      setLoading(true);

      let uploadedKey: string | undefined;
      if (imageFile) {
        uploadedKey = await uploadToS3(imageFile);
      }

      // build payload: prefer uploadedKey, else keep existing image key (edit)
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        image: uploadedKey !== undefined ? uploadedKey : initialData.image,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add Category"}
            {mode === "edit" && "Edit Category"}
            {mode === "delete" && "Delete Category"}
          </DialogTitle>
        </DialogHeader>

        {mode === "delete" ? (
          <p className="text-red-600">
            Are you sure you want to delete this category? This action cannot be undone.
          </p>
        ) : (
          <form className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Image (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImageFile(f);
                  if (f) setPreviewUrl(URL.createObjectURL(f));
                }}
              />
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="preview"
                  width={100}
                  height={100}
                  className="w-36 h-24 object-cover rounded mt-2 border"
                />
              )}
            </div>
          </form>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={mode === "delete" ? "destructive" : "default"} onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : mode === "delete" ? "Delete" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
