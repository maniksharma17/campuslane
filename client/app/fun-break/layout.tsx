"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, X, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FunBreakLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // preload audio
    audioRef.current = new Audio("/music/fun-break.mp3");
    audioRef.current.loop = true;
    return () => {
      audioRef.current?.play();
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      {/* Top-right control bar */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-50">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="p-3 rounded-full bg-white shadow hover:bg-gray-100 transition"
          aria-label="Go Back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-white shadow hover:bg-gray-100 transition"
          aria-label={isPlaying ? "Pause music" : "Play music"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 text-gray-700" />
          ) : (
            <Play className="h-6 w-6 text-gray-700" />
          )}
        </button>

        {/* Close (go home maybe) */}
        <button
          onClick={() => router.push("/explore")}
          className="p-3 rounded-full bg-white shadow hover:bg-gray-100 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Main content */}
      {children}
    </div>
  );
}
