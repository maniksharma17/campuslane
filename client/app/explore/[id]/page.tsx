"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
    const startingPoint = progress?.lastWatchedSecond ?? Math.floor(video.currentTime || 0);
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
      const res = await api.post("/progress/complete", { contentId: content._id });
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
          const payload = JSON.stringify({ contentId: content._id, secondsSinceLastPing: elapsed });
          const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/progress/video/ping`;
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
      const res = await api.post("/progress/complete", { contentId: content._id });
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
  const progressPercent = Math.min(100, Math.max(0, progress?.progressPercent ?? 0));
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
    <main className="min-h-screen bg-primary/20 pt-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button className="mb-2" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-semibold mb-4">{content.title}</h1>
        {content.description && (
          <p className="text-lg text-gray-700 mb-6">{content.description}</p>
        )}

        {/* Progress bar & stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Progress</div>
            <div className="text-sm text-gray-600">{progressPercent}%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="text-sm text-gray-600 flex gap-4">
            <div>Time spent: {secondsToHms(timeSpent)}</div>
            <div>Last watched: {secondsToHms(lastWatched)}</div>
            {progress?.completedAt && (
              <div>Completed: {new Date(progress.completedAt).toLocaleString()}</div>
            )}
          </div>
        </div>

        <div className="mb-6">
          {content.type === "video" && content.s3Key && (
            <div>
              <video
                ref={videoRef}
                controls
                playsInline
                className="w-full rounded-lg shadow-lg"
                onPlay={startPingInterval}
                onPause={stopPingInterval}
                onEnded={handleVideoEnd}
                onLoadedMetadata={handleLoadedMetadata}
              >
                <source
                  src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>

              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const v = videoRef.current;
                    if (!v) return;
                    try {
                      v.currentTime = lastWatched;
                      v.focus();
                    } catch (e) {
                      /* ignore */
                    }
                  }}
                >
                  Resume
                </Button>

                <div className="text-sm text-gray-600">{pinging ? "Saving..." : ""}</div>
              </div>
            </div>
          )}

          {content.type === "file" && content.s3Key && (
            <iframe
              src={`${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.s3Key}`}
              className="w-full h-[80vh] border rounded-lg"
            />
          )}

          {content.type !== "video" && content.type !== "file" && (
            <p>Preview not available. Please download the file.</p>
          )}
        </div>

        <div className="flex gap-4 items-center">
          <Button variant="outline" onClick={handleDownload}>
            Download
          </Button>

          {content.type !== "video" && !isCompleted && (
            <Button onClick={handleMarkComplete}>Mark as Completed</Button>
          )}

          {isCompleted && (
            <span className="text-green-600 font-medium">✅ Completed</span>
          )}

          {progress?.quizScore != null && (
            <div className="text-sm text-gray-700">Quiz: {progress.quizScore}%</div>
          )}
        </div>
      </div>
    </main>
  );
}
