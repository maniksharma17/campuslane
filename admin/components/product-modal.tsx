"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { educationApi, uploadApi } from "@/lib/api";
import axios from "axios";
import { ecommerceApi } from "@/lib/api";
import Image from "next/image";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { IProduct, IProductVariant } from "@/types"; // <-- single source of truth for types
import mongoose from "mongoose";

type Mode = "add" | "edit" | "delete";

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  initialData?: Partial<IProduct>;
  // NOTE: submit receives a partial product (ids/optional props allowed)
  onSubmit: (payload?: Partial<IProduct>) => Promise<void> | void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

type VariantState = IProductVariant & {
  _localId: string;
  _newImagesFiles?: File[];
  _newPreviews?: string[];
  _expanded?: boolean;
};

export default function ProductModal({
  open,
  onClose,
  mode,
  initialData = {},
  onSubmit,
}: ProductModalProps) {
  // Basic info
  const [name, setName] = useState<string>(initialData.name ?? "");
  const [description, setDescription] = useState<string>(
    initialData.description ?? ""
  );
  const [category, setCategory] = useState<string | undefined>(
    initialData.category
      ? typeof initialData.category === "object"
        ? String((initialData.category as { _id: any })._id)
        : String(initialData.category)
      : undefined
  );
  const [isActive, setIsActive] = useState<boolean>(
    initialData.isActive ?? true
  );

  // Product images
  const [existingImages, setExistingImages] = useState<string[]>(
    initialData.images ?? []
  );
  const [imagesFiles, setImagesFiles] = useState<File[]>([]);
  const [imagesPreview, setImagesPreview] = useState<string[]>([]);

  // Variants
  const [variants, setVariants] = useState<VariantState[]>(
    (initialData.variants ?? []).map(
      (v) =>
        ({
          ...v,
          _localId: v._id ? String(v._id) : uid(),
          _newImagesFiles: [],
          _newPreviews: [],
          _expanded: true,
        } as VariantState)
    )
  );

  // categories select
  const [categoriesOptions, setCategoriesOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Additional details state
  const [gender, setGender] = useState<"Boys" | "Girls" | "Unisex" | undefined>(
    (initialData.gender as any) ?? undefined
  );
  const [classLevel, setClassLevel] = useState<string | undefined>(
    initialData.classLevel ?? undefined
  );
  const [school, setSchool] = useState<string | undefined>(
    initialData.school ? String(initialData.school) : undefined
  );
  const [brand, setBrand] = useState<string>(initialData.brand ?? "");

  // dropdown options
  const [classesOptions, setClassesOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [schoolsOptions, setSchoolsOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // fetch classes & schools
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [classesRes, schoolsRes] = await Promise.all([
          educationApi.getClasses({ page: 1, limit: 200 }),
          ecommerceApi.getSchools({ page: 1, limit: 200 }),
        ]);
        if (!mounted) return;
        const classItems = classesRes.data?.data ?? classesRes.data ?? [];
        const schoolItems = schoolsRes.data?.data ?? schoolsRes.data ?? [];
        setClassesOptions(
          classItems.map((c: any) => ({ value: c._id, label: c.name }))
        );
        setSchoolsOptions(
          schoolItems.map((s: any) => ({ value: s._id, label: s.name }))
        );
      } catch (err) {
        console.error("Failed to load classes/schools", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  const createdObjectUrls = useRef<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync initialData when modal opens or mode changes
  useEffect(() => {
    if (mode === "edit") {
      setName(initialData.name ?? "");
      setDescription(initialData.description ?? "");
      setCategory(
        initialData.category
          ? typeof initialData.category === "object"
            ? String((initialData.category as { _id: any })._id)
            : String(initialData.category)
          : undefined
      );
      setExistingImages(initialData.images ?? []);
      setImagesFiles([]);
      setImagesPreview([]);
      setVariants(
        (initialData.variants ?? []).map(
          (v) =>
            ({
              ...v,
              _localId: v._id ? String(v._id) : uid(),
              _newImagesFiles: [],
              _newPreviews: [],
              _expanded: true,
            } as VariantState)
        )
      );
      setIsActive(initialData.isActive ?? true);

      // ✅ New fields
      setGender(
        (initialData.gender as "Boys" | "Girls" | "Unisex") ?? undefined
      );
      setClassLevel(initialData.classLevel ?? undefined);
      setSchool(initialData.school ? String(initialData.school) : undefined);
      setBrand(initialData.brand ?? "");
    } else {
      // add mode or closed/opened fresh
      setName("");
      setDescription("");
      setCategory(undefined);
      setExistingImages([]);
      setImagesFiles([]);
      setImagesPreview([]);
      setVariants([]);
      setIsActive(true);

      // ✅ Reset new fields
      setGender(undefined);
      setClassLevel(undefined);
      setSchool(undefined);
      setBrand("");
    }

    // revoke previews previously created
    return () => {
      createdObjectUrls.current.forEach((u) => URL.revokeObjectURL(u));
      createdObjectUrls.current = [];
    };
  }, [mode, initialData, open]);

  // fetch categories for select
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await ecommerceApi.getCategories({ page: 1, limit: 200 });
        const items = res.data?.data ?? res.data ?? [];
        if (!mounted) return;
        setCategoriesOptions(
          items.map((c: any) => ({ value: c._id, label: c.name }))
        );
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // UPLOAD HELPERS
  const uploadToS3 = async (file: File) => {
    const { data } = await uploadApi.getPresignedUrl({
      contentType: file.type,
      fileSize: file.size,
      fileName: file.name,
    });
    await axios.put(data.data.url, file, {
      headers: { "Content-Type": file.type },
    });
    return data.data.key as string;
  };

  const uploadMultiple = async (files: File[] = []) => {
    if (!files || files.length === 0) return [] as string[];
    const uploads = await Promise.all(files.map((f) => uploadToS3(f)));
    return uploads;
  };

  // IMAGE PREVIEW / SELECT
  const onSelectProductImages = (fList: FileList | null) => {
    if (!fList) return;
    const files = Array.from(fList);
    const previews = files.map((f) => {
      const u = URL.createObjectURL(f);
      createdObjectUrls.current.push(u);
      return u;
    });
    setImagesFiles((prev) => [...prev, ...files]);
    setImagesPreview((prev) => [...prev, ...previews]);
  };

  const removeNewProductImage = (index: number) => {
    setImagesFiles((prev) => prev.filter((_, i) => i !== index));
    setImagesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // VARIANTS
  const addVariant = () => {
    const newV: VariantState = {
      _localId: uid(),
      name: "",
      price: 0,
      cutoffPrice: undefined,
      stock: 0,
      images: [],
      _newImagesFiles: [],
      _newPreviews: [],
      _expanded: true,
    };
    setVariants((p) => [...p, newV]);
  };

  const updateVariantField = (
    localId: string,
    field: keyof IProductVariant,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v._localId === localId ? { ...v, [field]: value } : v))
    );
  };

  const toggleVariantExpanded = (localId: string) => {
    setVariants((prev) =>
      prev.map((v) =>
        v._localId === localId ? { ...v, _expanded: !v._expanded } : v
      )
    );
  };

  const removeVariant = (localId: string) => {
    setVariants((prev) => prev.filter((v) => v._localId !== localId));
  };

  const onSelectVariantImages = (localId: string, files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const previews = arr.map((f) => {
      const u = URL.createObjectURL(f);
      createdObjectUrls.current.push(u);
      return u;
    });
    setVariants((prev) =>
      prev.map((v) =>
        v._localId === localId
          ? {
              ...v,
              _newImagesFiles: [...(v._newImagesFiles ?? []), ...arr],
              _newPreviews: [...(v._newPreviews ?? []), ...previews],
            }
          : v
      )
    );
  };

  const removeVariantNewImage = (localId: string, index: number) => {
    setVariants((prev) =>
      prev.map((v) =>
        v._localId === localId
          ? {
              ...v,
              _newImagesFiles: (v._newImagesFiles ?? []).filter(
                (_, i) => i !== index
              ),
              _newPreviews: (v._newPreviews ?? []).filter(
                (_, i) => i !== index
              ),
            }
          : v
      )
    );
  };

  const removeVariantExistingImage = (localId: string, index: number) => {
    setVariants((prev) =>
      prev.map((v) =>
        v._localId === localId
          ? { ...v, images: (v.images ?? []).filter((_, i) => i !== index) }
          : v
      )
    );
  };

  // validation
  const validate = () => {
    if (!name.trim()) {
      alert("Product name is required");
      return false;
    }
    if (!category) {
      alert("Please select a category");
      return false;
    }
    if (!variants || variants.length === 0) {
      alert("Add at least one variant");
      return false;
    }
    for (const v of variants) {
      if (!v.name?.trim()) {
        alert("Each variant must have a name");
        return false;
      }
      if (typeof v.price !== "number" || v.price < 0) {
        alert("Variant price must be a non-negative number");
        return false;
      }
      if (typeof v.stock !== "number" || v.stock < 0) {
        alert("Variant stock must be a non-negative number");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      if (mode === "delete") {
        setLoading(true);
        await onSubmit();
        onClose();
        return;
      }

      if (!validate()) return;

      setLoading(true);

      // upload product-level new images
      const uploadedProductImages = await uploadMultiple(imagesFiles);
      const finalProductImages = [
        ...(existingImages ?? []),
        ...(uploadedProductImages ?? []),
      ];

      // upload variant images (do parallel per variant)
      const variantPromises = variants.map(async (v) => {
        const newFiles = v._newImagesFiles ?? [];
        const uploaded = await uploadMultiple(newFiles);
        const finalVariantImages = [...(v.images ?? []), ...(uploaded ?? [])];
        return {
          name: v.name,
          price: Number(v.price),
          cutoffPrice:
            v.cutoffPrice !== undefined ? Number(v.cutoffPrice) : undefined,
          stock: Number(v.stock),
          images: finalVariantImages,
          id: (v as any).id,
        } as IProductVariant;
      });
      const finalVariants = await Promise.all(variantPromises);

      const payload: Partial<IProduct> = {
        name: name.trim(),
        description: description?.trim() || undefined,
        category: category!,
        images: finalProductImages,
        variants: finalVariants,
        isActive,
        gender,
        classLevel,
        school,
        brand: brand?.trim() || undefined,
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("submit error", err);
      alert("Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  // ----- UI -----
  // Full-screen DialogContent: override default layout so it covers entire viewport and is scrollable
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="z-50 m-0 overflow-y-scroll max-h-[90vh] max-w-7xl">
        <div className="flex-col bg-white">
          {/* header */}
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="text-lg font-semibold">
                {mode === "add"
                  ? "Add Product"
                  : mode === "edit"
                  ? "Edit Product"
                  : "Delete Product"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage product details, images and variants
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          {/* content (scrollable) */}
          <div className="overflow-y-auto p-6 space-y-6 flex-1">
            {/* Basic */}
            <section className="bg-white shadow-sm rounded-lg border p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-medium">Basic information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={category ?? ""}
                    onValueChange={(val) => setCategory(val || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Active</Label>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <span className="text-sm">Is Active</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Images */}
            <section className="bg-white shadow-sm rounded-lg border p-6">
              <h3 className="font-medium mb-2">Product images</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload multiple images. Keep existing images while adding new
                ones.
              </p>

              <div className="flex gap-4 flex-wrap">
                {/* existing images (S3 keys) */}
                {existingImages?.map((key, idx) => (
                  <div
                    key={`ex-${idx}`}
                    className="relative w-36 h-24 border rounded overflow-hidden"
                  >
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${key}`}
                      alt={String(idx)}
                      width={160}
                      height={108}
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600 shadow"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* new file previews (blob URLs) */}
                {imagesPreview.map((p, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="relative w-36 h-24 border rounded overflow-hidden"
                  >
                    {/* object URLs - use <img> to avoid Next image optimization issues */}
                    <Image
                      width={100}
                      height={100}
                      src={p}
                      alt={`preview-${idx}`}
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewProductImage(idx)}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600 shadow"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onSelectProductImages(e.target.files)}
                  />
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Upload images</span>
                </label>
              </div>
            </section>

            {/* Additional details */}
            <section className="bg-white shadow-sm rounded-lg border p-6">
              <h3 className="font-medium mb-4">Additional Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <Label>Gender</Label>
                  <Select
                    value={gender ?? ""}
                    onValueChange={(val) => setGender(val as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boys">Boys</SelectItem>
                      <SelectItem value="Girls">Girls</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Level */}
                <div>
                  <Label>Class Level</Label>
                  <Select
                    value={classLevel ?? ""}
                    onValueChange={(val) => setClassLevel(val || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classesOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* School */}
                <div>
                  <Label>School</Label>
                  <Select
                    value={school ?? ""}
                    onValueChange={(val) => setSchool(val || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolsOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand */}
                <div>
                  <Label>Brand</Label>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Enter brand name"
                  />
                </div>
              </div>
            </section>

            {/* Variants */}
            <section className="bg-white shadow-sm rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Variants</h3>
                <Button onClick={addVariant}>
                  <Plus className="mr-2 h-4 w-4" /> Add Variant
                </Button>
              </div>

              <div className="space-y-4">
                {variants.map((v) => (
                  <div key={v._localId} className="border rounded p-4 bg-white">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleVariantExpanded(v._localId)}
                          className="p-1 rounded bg-gray-100"
                        >
                          {v._expanded ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        <div>
                          <div className="font-medium">
                            {v.name || "Untitled variant"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Price: {v.price ?? "-"} • Stock: {v.stock ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => removeVariant(v._localId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {v._expanded && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <Label>Variant name</Label>
                          <Input
                            value={v.name}
                            onChange={(e) =>
                              updateVariantField(
                                v._localId,
                                "name",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <Label>Price</Label>
                          <Input
                            type="number"
                            value={String(v.price)}
                            onChange={(e) =>
                              updateVariantField(
                                v._localId,
                                "price",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>

                        <div>
                          <Label>Cutoff price</Label>
                          <Input
                            type="number"
                            value={String(v.cutoffPrice ?? "")}
                            onChange={(e) =>
                              updateVariantField(
                                v._localId,
                                "cutoffPrice",
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </div>

                        <div>
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            value={String(v.stock ?? 0)}
                            onChange={(e) =>
                              updateVariantField(
                                v._localId,
                                "stock",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>

                        {/* variant images area spans full width */}
                        <div className="md:col-span-4 mt-2">
                          <Label>Variant images</Label>
                          <div className="flex gap-3 flex-wrap mt-2">
                            {(v.images ?? []).map((key, i) => (
                              <div
                                key={`ex-${v._localId}-${i}`}
                                className="relative w-36 h-24 border rounded overflow-hidden"
                              >
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${key}`}
                                  alt={key}
                                  width={160}
                                  height={108}
                                  className="object-cover"
                                />
                                <button
                                  onClick={() =>
                                    removeVariantExistingImage(v._localId, i)
                                  }
                                  className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}

                            {(v._newPreviews ?? []).map((p, i) => (
                              <div
                                key={`new-${v._localId}-${i}`}
                                className="relative w-36 h-24 border rounded overflow-hidden"
                              >
                                <Image
                                  width={100}
                                  height={100}
                                  src={p}
                                  alt="preview"
                                  className="object-cover w-full h-full"
                                />
                                <button
                                  onClick={() =>
                                    removeVariantNewImage(v._localId, i)
                                  }
                                  className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-600"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}

                            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  onSelectVariantImages(
                                    v._localId,
                                    e.target.files
                                  )
                                }
                              />
                              <Plus className="h-4 w-4" />
                              <span className="text-sm">Upload</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* footer sticky */}
          <div className="border-t p-4 bg-white z-10">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant={mode === "delete" ? "destructive" : "default"}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : mode === "delete"
                  ? "Delete"
                  : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
