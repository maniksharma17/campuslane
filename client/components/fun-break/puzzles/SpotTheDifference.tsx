"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

type Props = {
  originalSrc?: string;
  modifiedSrc?: string;
  onScore?: (eventIdOrPoints: string | number, points?: number) => void;
  onNext?: () => void;
  nextLabel?: string;
  retryLabel?: string;
  homeLabel?: string;
  imageWidth?: number;
  imageHeight?: number;
};

type DiffSpot = { id: number; xPct: number; yPct: number; rPct: number };

const DIFFERENCES: DiffSpot[] = [
  { id: 1, xPct: 22.31, yPct: 28.28, rPct: 8.06 },
  { id: 2, xPct: 99.0, yPct: 8, rPct: 15.44 },
  { id: 3, xPct: 57.1, yPct: 60.59, rPct: 8.6 },
  { id: 4, xPct: 30.46, yPct: 66.51, rPct: 7.49 },
  { id: 5, xPct: 48.5, yPct: 97.0, rPct: 7.74 },
];

export default function SpotTheDifferenceGame({
  originalSrc = "/graphic/garden_original.png",
  modifiedSrc = "/graphic/garden_modified.png",
  onScore,
  onNext,
  nextLabel = "Next",
  retryLabel = "Retry",
  homeLabel = "Home",
  imageWidth = 1600,
  imageHeight = 900,
}: Props) {
  const router = useRouter();
  const modRef = useRef<HTMLDivElement | null>(null);

  const [foundIds, setFoundIds] = useState<number[]>([]);
  const [justFoundId, setJustFoundId] = useState<number | null>(null);
  const [missPulse, setMissPulse] = useState(false);
  const completedRef = useRef(false);

  // sounds
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const missSoundRef = useRef<HTMLAudioElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof Audio !== "undefined") {
      try {
        correctSoundRef.current = new Audio("/sounds/correct.mp3");
        missSoundRef.current = new Audio("/sounds/wrong.mp3");
        successSoundRef.current = new Audio("/sounds/success.mp3");
      } catch {}
    }
  }, []);

  const fireScore = (eventId: string, points: number) => {
    if (!onScore) return;
    try {
      onScore(eventId, points);
    } catch {
      try {
        // legacy fallback
        // @ts-ignore
        onScore(points);
      } catch {}
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (completedRef.current) return;

    const container = modRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const imgW = rect.width;
    const imgH = rect.height;

    for (const d of DIFFERENCES) {
      if (foundIds.includes(d.id)) continue;
      const diffX = (d.xPct / 100) * imgW;
      const diffY = (d.yPct / 100) * imgH;
      const rPx = (d.rPct / 100) * imgW;
      const dx = clickX - diffX;
      const dy = clickY - diffY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= rPx) {
        setFoundIds((s) => [...s, d.id]);
        setJustFoundId(d.id);
        correctSoundRef.current?.play().catch(() => {});
        window.setTimeout(() => setJustFoundId(null), 900);
        return;
      }
    }

    setMissPulse(true);
    missSoundRef.current?.play().catch(() => {});
    window.setTimeout(() => setMissPulse(false), 380);
  };

  useEffect(() => {
    if (foundIds.length === DIFFERENCES.length && !completedRef.current) {
      completedRef.current = true;
      successSoundRef.current?.play().catch(() => {});
      fireScore("spot-diff:complete", 10);
    }
  }, [foundIds]);

  const handleRetry = () => {
    setFoundIds([]);
    setJustFoundId(null);
    completedRef.current = false;
  };

  const renderFoundNumber = (d: DiffSpot) => {
    const style: React.CSSProperties = {
      left: `${d.xPct - 5}%`,
      top: `${d.yPct - 6}%`,
      transform: "translate(-200%, -200%)",
    };
    const isJustFound = justFoundId === d.id;
    return (
      <motion.div
        key={`num-${d.id}`}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: isJustFound ? [1.3, 1] : 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={style}
        className="absolute font-extrabold text-white text-5xl drop-shadow-lg pointer-events-none select-none"
      >
        {d.id}
      </motion.div>
    );
  };

  const completed = foundIds.length === DIFFERENCES.length;

  // random cartoon character on completion
  const feedbackGraphic = useMemo(() => {
    if (!completed) return null;
    const idx = Math.floor(Math.random() * 8) + 1;
    return `/graphic/c${idx}.svg`;
  }, [completed]);

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <h3 className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-6">
        Spot the Differences
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        {/* Original */}
        <div className="relative rounded-2xl w-full aspect-video">
          <Image
            src={originalSrc}
            alt=""
            className="rounded-2xl"
            fill
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Modified */}
        <div
          ref={modRef}
          onClick={handleClick}
          className="relative rounded-2xl w-full aspect-video"
        >
          <Image
            src={modifiedSrc}
            alt=""
            className="rounded-2xl"
            fill
            style={{ objectFit: "contain" }}
          />
          {DIFFERENCES.map((d) =>
            foundIds.includes(d.id) ? renderFoundNumber(d) : null
          )}
        </div>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        Found <span className="font-semibold">{foundIds.length}</span> of{" "}
        <span className="font-semibold">{DIFFERENCES.length}</span>
      </div>

      {/* Buttons + cartoon + coin below images */}
      <div className="flex flex-col items-center gap-6">
        <AnimatePresence>
          {completed && feedbackGraphic && (
            <motion.div
              key="success-block"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35 }}
              className="flex flex-row items-center gap-4"
            >
              <div className="w-48 h-48 bg-white rounded-xl flex items-end justify-center">
                <Image
                  src={feedbackGraphic}
                  alt="success"
                  width={180}
                  height={180}
                />
              </div>
              <motion.div
                initial={{ y: 18, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="flex items-center gap-0 font-extrabold text-3xl text-gray-800"
              >
                <Image
                  src="/graphic/coin.svg"
                  alt="coin"
                  width={50}
                  height={50}
                />
                <span>+10</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            onClick={() => router.push("/fun-break")}
            className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}
          >
            {homeLabel}
          </button>

          <button
            onClick={handleRetry}
            className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}
          >
            {retryLabel}
          </button>

          <button
            onClick={() => onNext?.()}
            disabled={!completed}
            className={`${POPPY_BTN} ${
              !completed ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
