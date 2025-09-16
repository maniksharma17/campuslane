"use client";

import React from "react";
import Image from "next/image";
import { Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

type ContentItem = {
  _id: string;
  title: string;
  description?: string;
  thumbnailKey?: string;
  fileUrl?: string;
  videoUrl?: string;
  type?: string;
  createdAt?: string;
  progress?: Progress | null; // 👈 backend now provides this
};

type Progress = {
  status: "in_progress" | "completed" | "not_started";
  completed: boolean;
  lastWatchedSeconds?: number;
  progressPercent?: number; // 0-100
};

export default function ContentCard({ content }: { content: ContentItem }) {
  const router = useRouter();

  const progress = content.progress ?? {
    status: "not_started",
    completed: false,
  };

  const thumbnailUrl = content.thumbnailKey
    ? `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${content.thumbnailKey}`
    : "/images/content-placeholder.png";

  const progressPercentage = progress?.progressPercent ?? 0;

  const handleOpen = () => {
    router.push(`/explore/${content._id}`);
  };

  return (
    <article
      onClick={handleOpen}
      className="bg-white relative rounded-xl shadow-sm overflow-visible border border-gray-300 hover:shadow-md hover:-translate-y-1 transition cursor-pointer"
    >
      {/* Status badge */}
      {progress && progress.status !== "not_started" && (
        <div
          className={`absolute -top-2 -right-2 z-40 px-2.5 py-1 text-xs font-bold rounded-full shadow-md ${
            progress.status === "completed"
              ? "bg-green-500 text-white"
              : "bg-yellow-400 text-white"
          }`}
        >
          {progress.status === "completed" ? "Completed" : "In Progress"}
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative rounded-t-xl aspect-video w-full border-b">
        <Image
          src={thumbnailUrl}
          alt={content.title}
          fill
          className="object-cover rounded-t-xl"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
        />
      </div>

      {/* Progress bar (only for videos) */}
      {content.type === "video" && progress.status !== "not_started" && (
        <div className="w-full h-1.5 bg-gray-200 rounded-full">
          <div
            className="h-1.5 bg-green-400 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Content Info */}
      <div className="p-4 space-y-2">
        <h3 className="text-base font-medium text-gray-800 leading-snug">
          {content.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          <span className="flex items-center gap-1 uppercase">
            <FileText className="h-3 w-3" /> {content.type}
          </span>
          <span>
            {content.createdAt
              ? new Date(content.createdAt).toLocaleDateString()
              : ""}
          </span>
        </div>

        {/* Download button if file available */}
        {content.fileUrl && (
          <a
            href={content.fileUrl}
            download
            rel="noopener noreferrer"
            className="inline-flex mt-2 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border border-gray-200 hover:bg-gray-50 transition"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        )}
      </div>
    </article>
  );
}
