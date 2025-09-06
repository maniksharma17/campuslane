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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadApi } from "@/lib/api";

type Mode = "add" | "edit" | "delete";

export interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  role?: "teacher";
  approvalStatus?: "pending" | "approved" | "rejected";
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TeacherModalProps {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  initialData?: Partial<Teacher>;
  onSubmit: (values?: Partial<Teacher>) => Promise<void> | void;
}

export default function TeacherModal({
  open,
  onClose,
  mode,
  initialData = {},
  onSubmit,
}: TeacherModalProps) {
  const [formData, setFormData] = useState<Partial<Teacher>>({});
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);

  const approvalOptions = ["pending", "approved", "rejected"];

  useEffect(() => {
    if (mode === "edit") {
      setFormData(initialData);
    } else {
      setFormData({ role: "teacher", approvalStatus: "pending" });
    }
    setAvatarFile(null);
    setUploadProgress(undefined);
  }, [mode, initialData, open]);

  const handleChange = (name: keyof Teacher, value: any) => {
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

      // validations for teacher
      if (!formData.name || !formData.email) {
        alert("Name and Email are required.");
        return;
      }

      setLoading(true);

      let uploadedAvatarKey: string | undefined;
      if (avatarFile) {
        uploadedAvatarKey = await uploadToS3(avatarFile);
      }

      const finalData: Partial<Teacher> = {
        ...formData,
        role: "teacher",
        avatar: uploadedAvatarKey || formData.avatar,
      };

      await onSubmit(finalData);
      onClose();
    } catch (err) {
      console.error("teacher modal error:", err);
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
            {mode === "add" && "Add Teacher"}
            {mode === "edit" && "Edit Teacher"}
            {mode === "delete" && "Delete Teacher"}
          </DialogTitle>
        </DialogHeader>

        {mode === "delete" ? (
          <div className="py-4">
            <p className="text-sm text-red-600">
              Are you sure you want to delete{" "}
              <strong>{initialData?.name || "this teacher"}</strong>? This action cannot be undone.
            </p>
          </div>
        ) : (
          <form className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Teacher name"
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

              <div className="flex-1">
                <Label>Approval Status</Label>
                <Select
                  value={formData.approvalStatus || "pending"}
                  onValueChange={(val) => handleChange("approvalStatus", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {approvalOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
