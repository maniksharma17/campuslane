"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadApi } from "@/lib/api";

type Mode = "add" | "edit" | "delete";

export interface Student {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  role?: "student";
  age?: number;
  studentCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StudentModalProps {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  initialData?: Partial<Student>;
  onSubmit: (values?: Partial<Student>) => Promise<void> | void;
}

export default function StudentModal({
  open,
  onClose,
  mode,
  initialData = {},
  onSubmit,
}: StudentModalProps) {
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [loading, setLoading] = useState(false);

  // file states
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    if (mode === "edit") {
      setFormData(initialData);
    } else {
      setFormData({ role: "student" });
    }
    setAvatarFile(null);
    setUploadProgress(undefined);
  }, [mode, initialData, open]);

  const handleChange = (name: keyof Student, value: any) => {
    setFormData((p) => ({ ...(p || {}), [name]: value }));
  };

  const uploadToS3 = async (file: File) => {
    const { data } = await uploadApi.getPresignedUrl({
      contentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    });

    const putUrl = data.data.url;
    await axios.put(putUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (ev) => {
        const percent = Math.round((ev.loaded * 100) / (ev.total || 1));
        setUploadProgress(percent);
      },
    });

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

      // validations for student
      if (!formData.name || !formData.email) {
        alert("Name and Email are required.");
        return;
      }
      if (!formData.studentCode || (formData.studentCode || "").trim() === "") {
        alert("studentCode is required for students.");
        return;
      }
      if (formData.age === undefined || formData.age === null) {
        alert("Age is required for students.");
        return;
      }

      setLoading(true);

      let uploadedAvatarKey: string | undefined;
      if (avatarFile) {
        uploadedAvatarKey = await uploadToS3(avatarFile);
      }

      const finalData: Partial<Student> = {
        ...formData,
        role: "student",
      };

      await onSubmit(finalData);
      onClose();
    } catch (err) {
      console.error("student modal error:", err);
      alert("Something went wrong. See console.");
    } finally {
      setLoading(false);
      setUploadProgress(undefined);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add Student"}
            {mode === "edit" && "Edit Student"}
            {mode === "delete" && "Delete Student"}
          </DialogTitle>
        </DialogHeader>

        {mode === "delete" ? (
          <div className="py-4">
            <p className="text-sm text-red-600">
              Are you sure you want to delete{" "}
              <strong>{initialData?.name || "this student"}</strong>? This
              action cannot be undone.
            </p>
          </div>
        ) : (
          <form className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Student name"
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email"
                required
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Phone"
                />
              </div>

              <div className="w-28">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={formData.age ?? ""}
                  onChange={(e) =>
                    handleChange("age", e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Age"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label>City</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>
              <div className="w-36">
                <Label>Pincode</Label>
                <Input
                  value={formData.pincode || ""}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                />
              </div>
            </div>
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
