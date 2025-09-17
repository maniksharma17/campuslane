"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import QuizSection from "@/components/content/QuizSection";
import {
  ArrowLeft,
  Download,
  Play,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import Image from "next/image";
import ContentCard from "@/components/content/ContentCard";
import Link from "next/link";

export interface Question {
  questionText: string;
  s3Key?: string;
  options: string[];
  correctOption: number;
}

export type ContentItem = {
  _id: string;
  title: string;
  description?: string;
  thumbnailKey?: string;
  s3Key?: string;
  type?: string;
  createdAt?: string;
  questions?: Question[];
  quizType?: "native" | "googleForm";
};

type ProgressPayload = {
  _id?: string;
  studentId?: string;
  contentId?: string;
  status?: "not_started" | "in_progress" | "completed";
  timeSpent?: number;
  lastWatchedSecond?: number;
  progressPercent?: number;
  quizScore?: number | null;
  completedAt?: string | null;
};

export default function ContentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);

  const [otherContent, setOtherContent] = useState<ContentItem[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastPingRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const PING_INTERVAL_SEC = 15;
  const MAX_PING_SECONDS = 300;

  const secondsToHms = (secs = 0) => {
    const s = Math.floor(secs % 60);
    const m = Math.floor((secs / 60) % 60);
    const h = Math.floor(secs / 3600);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  useEffect(() => {
    async function fetchOther() {
      try {
        const res = await api.get("/content");
        // ensure current item excluded and stable ordering
        const items = (res.data.data || []).filter(
          (c: ContentItem) => c._id !== id
        );
        setOtherContent(items);
      } catch (err) {
        console.error("Failed to fetch other content", err);
      }
    }
    fetchOther();
  }, [id]);

  useEffect(() => {
    let mounted = true;
    async function fetchContent() {
      try {
        if (!id) return;
        const res = await api(`/content/${id}`);
        if (!mounted) return;
        setContent(res.data.data);

        try {
          const openRes = await api.post("/progress/open", { contentId: id });
          if (openRes?.data?.data && mounted) {
            setProgress(openRes.data.data);
            setIsCompleted(openRes.data.data.status === "completed");
          }
        } catch (e) {
          console.warn("open progress failed", e);
        }
      } catch (err) {
        console.error("Failed to fetch content:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchContent();
    return () => {
      mounted = false;
    };
  }, [id]);

  const startPingInterval = useCallback(() => {
    const video = videoRef.current;
    if (!video || !content) return;

    const startingPoint =
      progress?.lastWatchedSecond ?? Math.floor(video.currentTime || 0);
    lastPingRef.current = Math.floor(startingPoint);

    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(async () => {
      try {
        const v = videoRef.current;
        if (!v || v.paused || v.ended) return;
        const now = Math.floor(v.currentTime || 0);
        let elapsed = now - lastPingRef.current;
        if (elapsed <= 0) return;
        if (elapsed > MAX_PING_SECONDS) elapsed = MAX_PING_SECONDS;

        lastPingRef.current = now;
        setPinging(true);

        const pingRes = await api.post("/progress/video/ping", {
          contentId: content._id,
          secondsSinceLastPing: elapsed,
        });

        if (pingRes?.data?.data) {
          setProgress(pingRes.data.data);
          setIsCompleted(pingRes.data.data.status === "completed");
        }
      } catch (err) {
        console.error("video ping failed", err);
      } finally {
        setPinging(false);
      }
    }, PING_INTERVAL_SEC * 1000) as unknown as number;
  }, [content, progress]);

  const stopPingInterval = useCallback(async () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const video = videoRef.current;
    if (!video || !content) return;

    try {
      const now = Math.floor(video.currentTime || 0);
      let elapsed = now - lastPingRef.current;
      if (elapsed <= 0) return;
      if (elapsed > MAX_PING_SECONDS) elapsed = MAX_PING_SECONDS;

      setPinging(true);
      const pingRes = await api.post("/progress/video/ping", {
        contentId: content._id,
        secondsSinceLastPing: elapsed,
      });

      if (pingRes?.data?.data) {
        setProgress(pingRes.data.data);
        setIsCompleted(pingRes.data.data.status === "completed");
      }
    } catch (err) {
      console.error("final video ping failed", err);
    } finally {
      setPinging(false);
    }
  }, [content]);

  const handleVideoEnd = useCallback(async () => {
    await stopPingInterval();
    if (!content) return;
    try {
      const res = await api.post("/progress/complete", {
        contentId: content._id,
      });
      if (res?.data?.data) {
        setProgress(res.data.data);
        setIsCompleted(res.data.data.status === "completed");
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("complete failed", err);
    }
  }, [content, stopPingInterval]);

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v || !progress) return;
    const last = progress.lastWatchedSecond ?? 0;
    if (last > 0 && Math.abs(v.currentTime - last) > 1) {
      try {
        v.currentTime = last;
      } catch (e) {}
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const video = videoRef.current;
        if (!video || !content) return;
        const now = Math.floor(video.currentTime || 0);
        let elapsed = now - lastPingRef.current;
        if (elapsed <= 0) return;
        if (elapsed > MAX_PING_SECONDS) elapsed = MAX_PING_SECONDS;

        if (navigator.sendBeacon) {
          const payload = JSON.stringify({
            contentId: content._id,
            secondsSinceLastPing: elapsed,
          });
          const url = `${
            process.env.NEXT_PUBLIC_API_BASE_URL || ""
          }/progress/video/ping`;
          navigator.sendBeacon(url, payload);
        }
      } catch {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [content]);

  const handleMarkComplete = async () => {
    if (!content) return;
    try {
      const res = await api.post("/progress/complete", {
        contentId: content._id,
      });
      if (res?.data?.data) {
        setProgress(res.data.data);
        setIsCompleted(res.data.data.status === "completed");
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("Failed to complete content:", err);
    }
  };

  const handleDownload = async () => {
    if (!content?.s3Key) return;
    const url = `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = content.title || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleQuizSubmit = async (finalScore: number) => {
    try {
      const res = await api.post("/progress/complete", {
        contentId: content?._id,
        quizScore: finalScore,
      });
      if (res?.data?.data) {
        setProgress(res.data.data);
        setIsCompleted(res.data.data.status === "completed");
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("quiz submit failed", err);
    }
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, progress?.progressPercent ?? 0)
  );
  const timeSpent = progress?.timeSpent ?? 0;
  const lastWatched = progress?.lastWatchedSecond ?? 0;

  // ---------- UI-only: full-width with 20px padding and responsive two-column layout ----------
  const VISIBLE_COUNT = 7;
  const placeholdersNeeded = Math.max(0, VISIBLE_COUNT - otherContent.length);
  const visibleOtherContent: ContentItem[] = [
    ...otherContent.slice(0, VISIBLE_COUNT),
    ...Array.from({ length: placeholdersNeeded }).map(
      (_, i) =>
        ({
          _id: `placeholder-${i}`,
          title: `Coming soon`,
          description: undefined,
          thumbnailKey: undefined,
          s3Key: undefined,
          type: "file",
        } as ContentItem)
    ),
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-100 w-full px-5">
        <Navbar />
        <div className="w-full max-w-screen-xl mx-auto lg:pt-36 px-3">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-white shadow">
                <Clock className="h-6 w-6 text-slate-600" />
              </div>
              <h2 className="mt-4 text-lg font-medium text-slate-700">
                Loading content…
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Fetching your lesson and progress.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="min-h-screen bg-neutral-100 w-full px-5">
        <Navbar />
        <div className="w-full max-w-screen-xl mx-auto lg:py-24 px-3">
          <div className="bg-white rounded-2xl p-8 shadow">
            <h3 className="text-xl font-semibold text-slate-800">
              Content not found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              The item you were looking for does not exist or may have been
              removed.
            </p>
            <div className="mt-6">
              <Button
                variant={"outline"}
                onClick={() => router.push("/content")}
              >
                Back to library
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 w-full px-5">
      <Navbar />

      <div className="w-full max-w-screen-xl mx-auto pt-6 lg:pt-24 pb-12">
        {/* Grid: main + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Main content (media / quiz / description / related) */}
          <section className="col-span-1 lg:col-span-8 space-y-8">
            {/* Header: back + title + meta + top actions */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-6">
                  <Button
                    variant={"outline"}
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 focus:outline-none rounded-md px-2 py-1"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="text-sm">Back</span>
                  </Button>

                  <div className="ml-2 sm:ml-0">
                    <h1 className="mt-4 text-2xl md:text-5xl font-semibold text-black leading-tight">
                      {content.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-black/80">
                      <span className="inline-flex items-center gap-2 uppercase">
                        <FileText className="h-4 w-4" />{" "}
                        {content.type ?? "file"}
                      </span>
                      {content.createdAt && (
                        <>
                          <span>•</span>
                          <time className="text-xs text-black/80 font-medium">
                            {new Date(content.createdAt).toLocaleDateString()}
                          </time>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Media / Quiz Card - large, centered, consistent look */}
            <div className=" rounded-2xl shadow overflow-hidden border border-slate-100">
              <div>
                {/* VIDEO */}
                {content.type === "video" && content.s3Key ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      controls
                      playsInline
                      className="w-full aspect-[16/9] bg-black"
                      onPlay={startPingInterval}
                      onPause={stopPingInterval}
                      onEnded={handleVideoEnd}
                      onLoadedMetadata={handleLoadedMetadata}
                      aria-label={content.title}
                    >
                      <source
                        src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`}
                        type="video/mp4"
                      />
                    </video>

                    {/* small overlay download on desktop */}
                  </div>
                ) : content.type === "quiz" && content.quizType === "native" ? (
                  // QUIZ CARD (styled to match player card)
                    <QuizSection
                      content={content}
                      onSubmitScore={handleQuizSubmit}
                    />
                ) : content.type === "file" && content.s3Key ? (
                  <iframe
                    title={content.title}
                    src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`}
                    className="w-full aspect-[16/9] border-0"
                  />
                ) : content.type === "image" && content.s3Key ? (
                  <div className="relative w-full aspect-[16/9] bg-black">
                    <Image
                      alt={content.title}
                      src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-700">
                    <p className="text-lg font-medium">Preview not available</p>
                    <p className="mt-2 text-sm">
                      This item cannot be previewed. Please download it to view.
                    </p>
                    {content.s3Key && (
                      <div className="mt-4">
                        <Button onClick={handleDownload}>Download</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs: About / Transcript / Resources (UI only - no switching logic) */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-800">
                    About this content
                  </h3>
                </div>
                <div className="mt-4 text-sm text-slate-600 leading-relaxed">
                  {content.description ?? (
                    <span className="text-slate-400">
                      No description provided.
                    </span>
                  )}
                </div>
              </div>

              {/* Related content (large grid, same-height cards) */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-medium text-black/80">
                    Related content
                  </h3>
                  <div className="text-xs text-black/70">
                    Top picks for you
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {visibleOtherContent.map((item) => {
                    return <ContentCard key={item._id} content={item} />;
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Sidebar (sticky) */}
          <aside className="col-span-1 lg:col-span-4">
            <div className="sticky top-[90px] space-y-2">
              {/* Quick actions & progress */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h4 className="text-sm font-medium text-slate-800">
                  Quick actions
                </h4>

                <div className="mt-4 flex flex-col gap-3">
                  {content.s3Key && (
                    <Button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Download /> Download
                    </Button>
                  )}

                  {content.type !== "video" && !isCompleted && (
                    <Button
                      variant={"outline"}
                      onClick={handleMarkComplete}
                      className="w-full"
                    >
                      Mark as completed
                    </Button>
                  )}

                  {isCompleted && (
                    <div className="w-full flex items-center bg-green-50 border border-green-400 justify-center gap-2 text-sm rounded-md py-2 px-4 text-green-700 font-medium">
                      <CheckCircle
                        height={16}
                        width={16}
                        className="text-green-700"
                      />{" "}
                      Completed
                    </div>
                  )}
                </div>

                {/* Progress summary */}
                {content.type === "video" && <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-medium text-slate-800">
                      Progress
                    </h5>
                    <div className="text-xs text-slate-500">
                      {progressPercent.toFixed(0)}%
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{secondsToHms(timeSpent)}</span>
                      <span aria-live="polite">
                        {pinging ? "Syncing…" : "Synced"}
                      </span>
                    </div>
                  </div>
                </div>}
              </div>
              <aside className="h-auto mt-4 lg:col-span-2 relative">
                      <div className="space-y-2">
                        <Link href="/fun-break">
                        <Image
                          src={"/folder/fun-break.png"}
                          alt="Fun Break"
                          width={100}
                          height={100}
                          className="object-contain border border-gray-300 bg-yellow-100 h-full w-full rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                        />
                        </Link>
                        
                        <Image
                          src={"/folder/interactive-games.png"}
                          alt="Fun Break"
                          width={100}
                          height={100}
                          className="object-contain border border-gray-300 bg-purple-200 h-full w-full rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                        />
                        <Image
                          src={"/folder/study-downloads.png"}
                          alt="Fun Break"
                          width={100}
                          height={100}
                          className="object-contain border border-gray-300 bg-white h-full w-full rounded-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                        />
                      </div>
                    </aside>
            </div>
            
          </aside>
        </div>
      </div>
    </main>
  );
}
