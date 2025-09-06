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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { uploadApi } from "@/lib/api";

type Mode = "add" | "edit" | "delete";

interface School {
  _id?: string;
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SchoolModalProps {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  initialData?: Partial<School>;
  onSubmit: (values?: Partial<School>) => Promise<void> | void;
}

export default function SchoolModal({
  open,
  onClose,
  mode,
  initialData = {},
  onSubmit,
}: SchoolModalProps) {
  const [formData, setFormData] = useState<Partial<School>>({});
  const [loading, setLoading] = useState(false);

  // file states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    if (mode === "edit") {
      setFormData(initialData);
    } else {
      setFormData({});
    }
    setLogoFile(null);
    setUploadProgress(undefined);
  }, [mode, initialData, open]);

  const handleChange = (name: keyof School, value: any) => {
    setFormData((p) => ({ ...(p || {}), [name]: value }));
  };

  const uploadToS3 = async (file: File) => {
    // get presigned url
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

    // presigned response key
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

      // validate
      if (!formData.name || formData.name.trim() === "") {
        alert("Name is required");
        return;
      }
      if (!logoFile && !initialData.logo && mode === "add") {
        alert("Logo is required for a school.");
        return;
      }

      setLoading(true);

      let uploadedLogoKey: string | undefined;
      if (logoFile) {
        uploadedLogoKey = await uploadToS3(logoFile);
      }

      const finalData: Partial<School> = {
        ...formData,
        // prefer newly uploaded file; else keep existing logo key (string)
        logo: uploadedLogoKey ? uploadedLogoKey : initialData.logo,
      };

      await onSubmit(finalData);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Check console.");
    } finally {
      setLoading(false);
      setUploadProgress(undefined);
    }
  };

  const logoPreview =
    logoFile && typeof logoFile !== "string"
      ? URL.createObjectURL(logoFile)
      : initialData.logo
      ? `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${initialData.logo}`
      : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add School"}
            {mode === "edit" && "Edit School"}
            {mode === "delete" && "Delete School"}
          </DialogTitle>
        </DialogHeader>

        {mode === "delete" ? (
          <div className="py-4">
            <p className="text-sm text-red-600">
              Are you sure you want to delete{" "}
              <strong>{initialData?.name || "this school"}</strong>? This action
              cannot be undone.
            </p>
          </div>
        ) : (
          <form className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="School name"
                required
              />
            </div>

            <div>
              <Label>Address</Label>
              <Textarea
                value={formData.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Address (street / area)"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label>City</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="w-36">
                <Label>Pincode</Label>
                <Input
                  value={formData.pincode || ""}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  placeholder="Pincode"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label>State</Label>
                <Input
                  value={formData.state || ""}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="flex-1">
                <Label>Country</Label>
                <Input
                  value={formData.country || ""}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>

            <div>
              <Label>Logo {mode === "add" ? "(required)" : "(optional)"}</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
              {uploadProgress !== undefined && (
                <div className="h-2 bg-gray-200 rounded mt-2">
                  <div
                    className="h-2 bg-blue-600 rounded"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {logoPreview && (
                <div className="mt-3 w-40 h-24 relative rounded overflow-hidden border">
                  {/* next/image needs a static src or remote domain configured - using simple <img> fallback ensures preview works */}
                  {/* Using next/image for remote display when final key is present */}
                  {initialData?.logo && !logoFile ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${initialData.logo}`}
                      alt="logo"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Image
                      width={100}
                      height={100}
                      src={logoPreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )}
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
