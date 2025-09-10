"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Play } from "lucide-react";
import Image from "next/image";

type ContentItem = {
  _id: string;
  title: string;
  description?: string;
  thumbnailKey?: string;
  s3Key?: string;
  type?: string;
  createdAt?: string;
};

// Partial shape of progress returned by the API (keep optional to be defensive)
type ProgressPayload = {
  _id?: string;
  studentId?: string;
  contentId?: string;
  status?: "not_started" | "in_progress" | "completed";
  timeSpent?: number; // seconds
  lastWatchedSecond?: number;
  progressPercent?: number; // 0-100
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastPingRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const PING_INTERVAL_SEC = 15;
  const MAX_PING_SECONDS = 300; // must match server validator (anti-cheat)

  // Helpers
  const secondsToHms = (secs = 0) => {
    const s = Math.floor(secs % 60);
    const m = Math.floor((secs / 60) % 60);
    const h = Math.floor(secs / 3600);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // 1️⃣ Fetch content & mark open (open returns progress object)

  const [otherContent, setOtherContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    async function fetchOther() {
      try {
        const res = await api.get("/content");
        setOtherContent(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch other content", err);
      }
    }
    fetchOther();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchContent() {
      try {
        if (!id) return;
        const res = await api(`/content/${id}`);
        if (!mounted) return;
        setContent(res.data.data);

        // mark opened and capture returned progress (if server returns it)
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

  // Start ping interval when video is playing
  const startPingInterval = useCallback(() => {
    const video = videoRef.current;
    if (!video || !content) return;

    // If we have a server-side lastWatchedSecond, prefer it when starting
    const startingPoint =
      progress?.lastWatchedSecond ?? Math.floor(video.currentTime || 0);
    lastPingRef.current = Math.floor(startingPoint);

    // clear previous interval if any
    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(async () => {
      try {
        const v = videoRef.current;
        if (!v || v.paused || v.ended) return;
        const now = Math.floor(v.currentTime || 0);
        let elapsed = now - lastPingRef.current;
        if (elapsed <= 0) return;

        // bound elapsed to server-allowed maximum to avoid validation errors
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
    }, PING_INTERVAL_SEC * 1000);
  }, [content, progress]);

  // Stop interval and flush last ping
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

  // Handle video end (stop + mark complete)
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

  // Seek to last watched position when metadata loads (resume)
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v || !progress) return;
    const last = progress.lastWatchedSecond ?? 0;
    if (last > 0 && Math.abs(v.currentTime - last) > 1) {
      try {
        v.currentTime = last;
      } catch (e) {
        // some browsers may restrict seeking before user interaction
      }
    }
  };

  // Send final ping on unload (best-effort)
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const video = videoRef.current;
        if (!video || !content) return;
        const now = Math.floor(video.currentTime || 0);
        let elapsed = now - lastPingRef.current;
        if (elapsed <= 0) return;
        if (elapsed > MAX_PING_SECONDS) elapsed = MAX_PING_SECONDS;

        // sendBeacon only sends payload and cookies — it won't include Authorization headers.
        // It's a best-effort fallback; server should accept cookie or anonymous pings if possible.
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
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [content]);

  // Manual completion for non-video content
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

  // UI: progress bar width
  const progressPercent = Math.min(
    100,
    Math.max(0, progress?.progressPercent ?? 0)
  );
  const timeSpent = progress?.timeSpent ?? 0;
  const lastWatched = progress?.lastWatchedSecond ?? 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-primary/20 pt-20 flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!content) {
    return (
      <main className="min-h-screen bg-primary/20 pt-20 flex items-center justify-center">
        <p>Content not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-primary/10 pt-20">
  <Navbar />
  <div className="max-w-full lg:px-20 mx-auto px-4 sm:px-6 py-10">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      
      {/* Left: Content */}
      <div className="lg:col-span-2">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back
        </Button>

        {/* Content header */}
        <div className="flex flex-row justify-between rounded-xl border bg-gray-50 shadow p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
            {content.title}
          </h1>
          {content.description && (
            <p className="text-gray-700 mb-5">{content.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <Download size={16} /> Download
            </Button>

            {content.type !== "video" && !isCompleted && (
              <Button
                onClick={handleMarkComplete}
                className="py-2 rounded-lg"
              >
                Mark as Completed
              </Button>
            )}

            {isCompleted && (
              <span className="flex items-center gap-2 text-green-700 font-semibold">
                ✅ Completed
              </span>
            )}
          </div>
        </div>

        {/* Progress bar (videos only) */}
        {content.type === "video" && (
          <div className="rounded-xl border bg-gray-50 shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-2 text-sm font-medium">
              <span>Progress</span>
              <span>{progressPercent.toPrecision(2)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Content Viewer */}
        <div>
          {content.type === "video" && content.s3Key && (
            <video
              ref={videoRef}
              controls
              playsInline
              className="w-full rounded-xl"
              onPlay={startPingInterval}
              onPause={stopPingInterval}
              onEnded={handleVideoEnd}
              onLoadedMetadata={handleLoadedMetadata}
            >
              <source
                src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`}
                type="video/mp4"
              />
            </video>
          )}

          {content.type === "file" && content.s3Key && (
            <iframe
              src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`}
              className="w-full h-[80vh] border-0"
            />
          )}

          {content.type === "image" && content.s3Key && (
            <Image
              alt={content.title}
              width={400}
              height={400}
              src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`}
              className="w-full border-0 rounded-xl"
            />
          )}

          {content.type !== "video" && content.type !== "file" && content.type !== "image" && (
            <div className="p-6 text-gray-600">
              Preview not available. Please download the file.
            </div>
          )}
        </div>
      </div>

      {/* Right: Other Content */}
      <div>
        <h2 className="text-xl font-medium mb-4">Other Content</h2>
        <div className="space-y-3">
          {otherContent.map((item) => (
            <div
              key={item._id}
              onClick={() => router.push(`/content/${item._id}`)}
              className="flex items-center justify-between rounded-xl border bg-gray-50 shadow p-6 mb-6 hover:bg-gray-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {item.thumbnailKey && (
                  <Image
                    width={60}
                    height={60}
                    src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${item.thumbnailKey}`}
                    alt={item.title}
                    className="h-14 w-14 rounded object-cover flex-shrink-0"
                  />
                )}
                <p className="font-medium text-gray-800 line-clamp-1">
                  {item.title}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/content/${item._id}`);
                }}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-white hover:bg-primary/90 transition"
              >
                <Play size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</main>

  );
}
