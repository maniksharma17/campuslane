"use client";

import React, { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import Navbar from "@/components/navbar";
import { Pencil, Save, X, Check, Trash, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ----------------- Types -----------------
interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  role: "student" | "teacher" | "parent";
  age?: number;
  classLevel?: string; // either an id or "other"
  classOther?: string;
  studentCode?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
}

interface IClass {
  _id: string;
  name: string;
}

// Raw API shape for a link request
interface ILinkRequestAPI {
  _id: string;
  parentId: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  studentId?: string;
  studentCode?: string;
  status?: "pending" | "approved" | "rejected";
  requestedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
}

// Normalized request used in UI
interface ILinkRequest {
  _id: string;
  parentName: string;
  parentEmail?: string;
  parentPhone?: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
}

// Raw recent/progress API shape
interface IRecentAPI {
  _id: string;
  contentId: {
    _id: string;
    title?: string;
    type?: string;
    s3Key?: string;
    thumbnailKey?: string;
  };
  status?: "in_progress" | "completed" | string;
  progressPercent?: number;
  updatedAt?: string;
}

// Normalized recent item for UI
interface IRecentItem {
  _id: string;
  contentId: {
    _id: string;
    title: string;
    type?: string;
    s3Key?: string;
    thumbnailKey?: string;
  };
  status?: string;
  progressPercent?: number;
  updatedAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const userId = authUser?._id;

  // Profile related
  const [profile, setProfile] = useState<IUser | null>(null);
  const [original, setOriginal] = useState<IUser | null>(null);
  const [classes, setClasses] = useState<IClass[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Right column: requests + recent
  const [requests, setRequests] = useState<ILinkRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [recent, setRecent] = useState<IRecentItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Snack / Undo
  const [snack, setSnack] = useState<{
    text: string;
    action?: string;
    onAction?: () => void;
  } | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      if (!userId) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        const [userRes, classesRes] = await Promise.all([
          api.get(`/admin/students/${userId}`),
          api.get("/classes"),
        ]);

        if (!mounted) return;
        const userData: IUser = userRes.data.data;
        setProfile(userData);
        setOriginal(userData);
        setClasses(classesRes.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Fetch requests & recent only for students
  useEffect(() => {
    let mounted = true;
    if (!profile || profile.role !== "student") return;

    const fetchRightColumn = async () => {
      setLoadingRequests(true);
      setLoadingRecent(true);
      try {
        const [reqRes, recentRes] = await Promise.all([
          api.get("/parent/links/pending"), // returns list of pending links for the student
          api.get("/progress/recent?limit=6"), // returns recent items
        ]);

        if (!mounted) return;

        // Normalize requests coming from API (parentId object -> parentName etc.)
        const apiRequests: ILinkRequestAPI[] = reqRes.data.data || [];
        const normalizedRequests: ILinkRequest[] = apiRequests.map((r) => ({
          _id: r._id,
          parentName: r.parentId?.name || "Parent",
          parentEmail: r.parentId?.email,
          parentPhone: r.parentId?.phone,
          status: r.status,
          createdAt: r.requestedAt || r.createdAt,
        }));

        setRequests(normalizedRequests);

        // Normalize recent items to our shape (use fields as-provided by API)
        const apiRecent: IRecentAPI[] = recentRes.data.data || [];
        const recentItems: IRecentItem[] = apiRecent.map((r) => ({
          _id: r._id,
          contentId: {
            _id: r.contentId?._id || "",
            title: r.contentId?.title || "Untitled",
            type: r.contentId?.type,
            s3Key: r.contentId?.s3Key,
            thumbnailKey: r.contentId?.thumbnailKey,
          },
          status: r.status,
          progressPercent:
            typeof r.progressPercent === "number" ? r.progressPercent : 0,
          updatedAt: r.updatedAt,
        }));

        setRecent(recentItems);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) {
          setLoadingRequests(false);
          setLoadingRecent(false);
        }
      }
    };

    fetchRightColumn();
    return () => {
      mounted = false;
    };
  }, [profile]);

  const handleChange = (field: keyof IUser, value: any) => {
    setProfile((p) => (p ? { ...p, [field]: value } : p));
  };

  const handleEdit = () => {
    setError("");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setProfile(original);
    setIsEditing(false);
    setError("");
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError("");

    const payload: Partial<IUser> = { ...profile };
    if (payload.classLevel !== "other") {
      payload.classOther = "";
    } else {
      payload.classLevel = "other";
      payload.classOther = payload.classOther ?? "";
    }

    try {
      const res = await api.patch(`/admin/students/${profile._id}`, payload);
      const updated: IUser = res.data.data;
      setProfile(updated);
      setOriginal(updated);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Requests actions (optimistic with undo) ----------
  const performRequestAction = async (
    id: string,
    action: "approve" | "reject" | "delete"
  ) => {
    const existing = requests.find((r) => r._id === id);
    if (!existing) return;

    // Optimistic remove
    setRequests((prev) => prev.filter((r) => r._id !== id));

    // set snack with undo
    setSnack({
      text:
        action === "approve"
          ? `Accepted request from ${existing.parentName}`
          : action === "reject"
          ? `Rejected request from ${existing.parentName}`
          : `Deleted request from ${existing.parentName}`,
      action: "Undo",
      onAction: () => {
        // restore immediately
        setRequests((prev) => [existing, ...prev]);
        setSnack(null);
        if (undoTimeoutRef.current) {
          window.clearTimeout(undoTimeoutRef.current);
          undoTimeoutRef.current = null;
        }
      },
    });

    // if user doesn't undo in 5s, call API
    const timeoutId = window.setTimeout(async () => {
      try {
        if (action === "approve") {
          await api.patch(`/parent/links/${id}/approve`);
        } else if (action === "reject") {
          await api.patch(`/parent/links/${id}/reject`);
        } else {
          await api.delete(`/parent/links/${id}`);
        }

        // confirm snack text (auto-dismiss shortly)
        setSnack({
          text:
            action === "approve"
              ? "Request accepted"
              : action === "reject"
              ? "Request rejected"
              : "Request deleted",
        });
        window.setTimeout(() => setSnack(null), 2000);
      } catch (err) {
        console.error(err);
        // revert on failure
        setRequests((prev) => [existing, ...prev]);
        setSnack({ text: "Action failed. Please try again." });
        window.setTimeout(() => setSnack(null), 3000);
      } finally {
        undoTimeoutRef.current = null;
      }
    }, 5000);

    undoTimeoutRef.current = timeoutId as unknown as number;
  };

  // ---------- Recent item navigation ----------
  const openProgress = (item?: IRecentItem) => {
    if (item?.contentId?._id) {
      router.push(`/progress/${item.contentId._id}`);
    } else {
      router.push(`/students/${userId}/progress`);
    }
  };

  // Cleanup on unmount for undo timeout
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  // ---------- Small helpers ----------
  const awsBase = process.env.NEXT_PUBLIC_AWS_STORAGE_URL || "";

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  // ---------- Render ----------
  if (loadingProfile) return <p className="p-6">Loading profile...</p>;
  if (!profile)
    return <p className="p-6 text-red-500">{error || "Profile not found"}</p>;

  return (
    <div className="min-h-screen bg-primary/10">
      <Navbar />

      <main className="max-w-full mx-auto px-6 py-8 lg:pt-28 lg:px-20">
        <div className="flex flex-col md:flex-row gap-10">
          {/* LEFT: Profile */}
          <section className="w-full md:w-1/2 px-0 md:px-4 space-y-6 bg-gray-50 lg:p-6 rounded-lg border shadow">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-medium text-gray-800">
                  Profile
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your personal information
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="flex items-center gap-1 px-3 py-1 text-sm"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-white"
                    >
                      <Save className="h-4 w-4" />{" "}
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1 text-sm"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 mb-1">Full name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Email</label>
                <Input value={profile.email} disabled className="opacity-80" />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Phone</label>
                <Input
                  value={profile.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              {profile.role === "student" && (
                <>
                  <div>
                    <label className="block text-gray-700 mb-1">Age</label>
                    <Input
                      type="number"
                      value={profile.age ?? ""}
                      onChange={(e) =>
                        handleChange("age", Number(e.target.value))
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">Class</label>
                    <Select
                      disabled={!isEditing}
                      value={profile.classLevel ?? ""}
                      onValueChange={(v) => handleChange("classLevel", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-gray-700 mb-1">Location</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder="PIN Code"
                    value={profile.pincode || ""}
                    onChange={(e) => handleChange("pincode", e.target.value)}
                    disabled={!isEditing}
                  />
                  <Input
                    placeholder="City"
                    value={profile.city || ""}
                    onChange={(e) => handleChange("city", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <Input
                    placeholder="State"
                    value={profile.state || ""}
                    onChange={(e) => handleChange("state", e.target.value)}
                    disabled={!isEditing}
                  />
                  <Input
                    placeholder="Country"
                    value={profile.country || ""}
                    onChange={(e) => handleChange("country", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </section>

          {/* RIGHT: Requests + Recent */}
          <aside className="w-full md:w-1/2 flex flex-col gap-6">
            {/* Requests */}
            {profile.role === "student" && (
              <div className="bg-gray-50 rounded-xl p-4 shadow border space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Requests</h2>
                  <p className="text-sm text-gray-500">
                    {loadingRequests
                      ? "Loading..."
                      : `${requests.length} pending`}
                  </p>
                </div>

                {loadingRequests ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
                    <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No pending requests
                  </div>
                ) : (
                  requests.map((r) => (
                    <div
                      key={r._id}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {r.parentName
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="flex flex-col">
                          <div className="font-semibold">{r.parentName}</div>
                          <div className="text-xs text-gray-500">
                            {r.parentEmail || "Wants to link"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => performRequestAction(r._id, "approve")}
                          className="p-2 rounded-md hover:bg-green-50"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => performRequestAction(r._id, "reject")}
                          className="p-2 rounded-md hover:bg-red-50"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                        <button
                          onClick={() => performRequestAction(r._id, "delete")}
                          className="p-2 rounded-md hover:bg-gray-100"
                        >
                          <Trash className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Recent */}
            {profile.role === "student" && (
              <div className="bg-gray-50 rounded-xl p-4 flex-1 shadow border flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-medium">Recent</h2>
                  <Button
                    onClick={() => router.push(`/progress`)}
                    className="text-sm px-3 py-1"
                  >
                    View Progress <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {loadingRecent ? (
                  <div className="space-y-3">
                    <div className="h-24 bg-gray-100 animate-pulse rounded-md" />
                    <div className="h-24 bg-gray-100 animate-pulse rounded-md" />
                    <div className="h-24 bg-gray-100 animate-pulse rounded-md" />
                  </div>
                ) : recent.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No recent activity yet
                  </div>
                ) : (
                  <ul className="space-y-3 overflow-y-scroll">
                    {recent
                      .sort(
                        (a, b) =>
                          new Date(b.updatedAt || "").getTime() -
                          new Date(a.updatedAt || "").getTime()
                      )
                      .slice(0, 5)
                      .map((it) => (
                        <li
                          key={it._id}
                          onClick={() => openProgress(it)}
                          className="flex flex-col gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {it.contentId.thumbnailKey ? (
                                <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                                  <Image
                                    width={64}
                                    height={64}
                                    src={`${awsBase}/${it.contentId.thumbnailKey}`}
                                    alt={it.contentId.title}
                                    className="object-cover h-full w-full"
                                  />
                                </div>
                              ) : (
                                <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center">
                                  <span className="text-lg font-semibold">
                                    {it.contentId.title
                                      ?.slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}

                              <div className="flex flex-col">
                                <div className="font-semibold text-sm">
                                  {it.contentId.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 capitalize">
                                  {it.contentId.type} •{" "}
                                  {formatDate(it.updatedAt)}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  it.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {it.status === "completed"
                                  ? "Completed"
                                  : "In Progress"}
                              </span>

                              
                            </div>
                          </div>

                          {it.contentId.type === "video" &&
                            typeof it.progressPercent === "number" && (
                              <div className="w-full h-3 bg-gray-200 rounded-full mt-1">
                                <div
                                  className={`h-3 rounded-full ${
                                    it.status === "completed"
                                      ? "bg-green-500"
                                      : "bg-green-400"
                                  }`}
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        Math.round(it.progressPercent)
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>
                            )}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </aside>
        </div>

        {/* Snack bar */}
        {snack && (
          <div className="fixed right-6 bottom-6 bg-white border rounded-lg px-4 py-2 shadow-lg flex items-center gap-3 text-sm">
            <div className="font-medium">{snack.text}</div>
            {snack.action && (
              <button
                onClick={snack.onAction}
                className="text-primary font-semibold"
              >
                {snack.action}
              </button>
            )}
            <button
              onClick={() => setSnack(null)}
              className="text-gray-400"
              aria-label="close"
            >
              ✕
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
