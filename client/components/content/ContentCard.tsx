"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type ContentItem = {
  _id: string;
  title: string;
  description?: string;
  thumbnailKey?: string;
  fileUrl?: string;
  videoUrl?: string;
  type?: string;
  createdAt?: string;
};

type Progress = {
  status: "in_progress" | "completed" | "not_started";
  completed: boolean;
  lastWatchedSeconds?: number;
  progressPercent?: number; // 0-100
};

export default function ContentCard({ content }: { content: ContentItem }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);

  const thumbnailUrl = content.thumbnailKey
    ? `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.thumbnailKey}`
    : "/images/content-placeholder.png";

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await api.get(`/progress/content/${content._id}`);
        // Map API response to Progress type
        const p: Progress = res.data.data?.[0]
          ? {
              status: res.data.data[0].status,
              completed: res.data.data[0].completed,
              lastWatchedSeconds: res.data.data[0].lastWatchedSeconds,
              progressPercent: res.data.data[0].progressPercent,
            }
          : { status: "not_started", completed: false };
        setProgress(p);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    }
    fetchProgress();
  }, [content._id]);

  const onPlay = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (content.videoUrl) {
      window.open(content.videoUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(`/explore/${content._id}`);
    }
  };

  // Use progressPercent from API if available
  const progressPercentage = progress?.progressPercent ?? 0;

  return (
    <article className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Image & Play */}
      <div className="relative h-40 md:h-48 w-full">
        <Image
          src={thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onPlay}
            aria-label={`Play ${content.title}`}
            className="pointer-events-auto bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition transform hover:scale-105"
          >
            <Play className="h-6 w-6 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {content.type === "video" &&
        progress &&
        progress.status !== "not_started" && (
          <div className="w-full h-2 bg-gray-200">
            <div
              className="h-2 bg-green-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

      {/* Content Info */}
      <div className="p-4">
        <h3 className="text-md font-semibold text-gray-800 mb-1 truncate">
          {content.title}
        </h3>
        {content.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {content.description || ""}
          </p>
        )}

        {progress &&
          progress.status !== "not_started" && (
            <span
              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                progress.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {progress.status === "completed" ? "Completed" : "In Progress"}
            </span>
          )}

        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-400">
            {content.createdAt
              ? new Date(content.createdAt).toLocaleDateString()
              : ""}
          </div>

          <div className="flex items-center space-x-2">
            {content.fileUrl && (
              <a
                href={content.fileUrl}
                download
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border border-gray-100 hover:bg-gray-50 transition"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </a>
            )}

            <button
              onClick={onPlay}
              aria-label="Open / Play"
              className="inline-flex rounded-full items-center gap-2 px-3 py-3 bg-primary text-sm hover:bg-primary/90 transition"
            >
              <Play className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
