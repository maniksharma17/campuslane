"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export type TongueTwister = {
  id: number;
  text: string;
  stars: number;
  challenge: string;
  normal: string;
  slow: string;
};

type Props = {
  data: TongueTwister;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  homeLabel?: string;
};

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

export default function TongueTwisterTemplate({
  data,
  onNext,
  onBack,
  nextLabel = "Next",
  backLabel = "Back",
  homeLabel = "Home",
}: Props) {
  const router = useRouter();

  const [audioNormal] = useState<HTMLAudioElement | null>(
    new Audio(data.normal)
  );
  const [audioSlow] = useState<HTMLAudioElement | null>(
    typeof Audio !== "undefined" ? new Audio(data.slow) : null
  );

  console.log(audioSlow)

  // recording state
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handlePlayNormal = () => audioNormal?.play().catch(() => {});
  const handlePlaySlow = () => audioSlow?.play().catch(() => {});

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic permission denied or error:", err);
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-6">

      {/* Stars + Challenge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex text-yellow-400 text-5xl font-light">
          {"★".repeat(data.stars)}{"☆".repeat(3 - data.stars)}
        </div>
        <span className="text-sm text-gray-600">{data.challenge}</span>
      </div>

      <motion.h3
        className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-4"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {data.text}
      </motion.h3>

      
      

      {/* Recording + Navigation controls */}
      <div className="flex items-center justify-between gap-4 mb-6 mt-10">
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handlePlayNormal}
            className={`border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-green-700 bg-green-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none`}
          >
            Normal
          </button>
          <button
            onClick={handlePlaySlow}
            className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}
          >
            Slow
          </button>
          {!recording ? (
            <button
              onClick={handleStartRecording}
              className={`${POPPY_BTN} bg-blue-500 hover:bg-blue-700`}
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className={`${POPPY_BTN} bg-red-600 hover:bg-red-700`}
            >
              Stop Recording
            </button>
          )}
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={onBack}
            className={`${POPPY_BTN} bg-orange-500 hover:bg-orange-600`}
          >
            {backLabel}
          </button>
          <button
            onClick={onNext}
            className={`${POPPY_BTN}`}
          >
            {nextLabel}
          </button>
        </div>
      </div>

      {/* Recorded playback */}
      {recordedUrl && (
        <div className="mt-4">
          <audio controls src={recordedUrl} className="w-full" />
        </div>
      )}

      
    </div>
  );
}
