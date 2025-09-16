"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

type Props = {
  src?: string;
  onScore?: (eventIdOrPoints: string | number, points?: number) => void;
  onNext?: () => void;
  nextLabel?: string;
  retryLabel?: string;
  homeLabel?: string;
  imageWidth?: number; // hint for aspect / sizing (defaults to 1600)
  imageHeight?: number; // (defaults to 900)
};

type Spot = { id: number; xPct: number; yPct: number; rPct: number; label: string };

// Converted coords -> percentages (original map used maxX=3966, maxY=1849)
const SPOTS: Spot[] = [
  { id: 1, xPct: 59.36, yPct: 92.0, rPct: 7.04, label: "clock" }, 
  { id: 2, xPct: 92.0, yPct: 69.66, rPct: 6.30, label: "blackboard" }, 
  { id: 3, xPct: 46.85, yPct: 33.65, rPct: 5.77, label: "book" }, 
  { id: 4, xPct: 30.46, yPct: 71.61, rPct: 5.35, label: "dress" }, 
  { id: 5, xPct: 63.34, yPct: 33.86, rPct: 5.55, label: "window" },
];

export default function HiddenNumbersGame({
  src = "/graphic/classroom.png",
  onScore,
  onNext,
  nextLabel = "Next",
  retryLabel = "Retry",
  homeLabel = "Home",
  imageWidth = 1600,
  imageHeight = 900,
}: Props) {
  const router = useRouter();
  const imgRef = useRef<HTMLDivElement | null>(null);

  const [found, setFound] = useState<Set<number>>(new Set());
  const [justFound, setJustFound] = useState<number | null>(null);
  const completedRef = useRef(false);
  const [missPulse, setMissPulse] = useState(false);

  // sounds
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const missSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof Audio !== "undefined") {
      try {
        correctSoundRef.current = new Audio("/sounds/correct.mp3");
        successSoundRef.current = new Audio("/sounds/success.mp3");
        missSoundRef.current = new Audio("/sounds/wrong.mp3");
      } catch {}
    }
  }, []);

  // safe scorer
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

  // click detection (responsive)
  const handleClick = (e: React.MouseEvent) => {
    if (completedRef.current) return;
    const container = imgRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    for (const s of SPOTS) {
      if (found.has(s.id)) continue;
      const sx = (s.xPct / 100) * w;
      const sy = (s.yPct / 100) * h;
      const rPx = (s.rPct / 100) * w;
      const dx = clickX - sx;
      const dy = clickY - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= rPx) {
        // reveal
        setFound((prev) => new Set(prev).add(s.id));
        setJustFound(s.id);
        correctSoundRef.current?.play().catch(() => {});
        // transient highlight
        window.setTimeout(() => setJustFound(null), 900);
        return;
      }
    }

    // miss
    setMissPulse(true);
    missSoundRef.current?.play().catch(() => {});
    window.setTimeout(() => setMissPulse(false), 350);
  };

  // award once on complete
  useEffect(() => {
    if (found.size === SPOTS.length && !completedRef.current) {
      completedRef.current = true;
      successSoundRef.current?.play().catch(() => {});
      fireScore("hidden-numbers:complete", 10);
    }
  }, [found]);

  const handleRetry = () => {
    setFound(new Set());
    setJustFound(null);
    completedRef.current = false;
  };

  const completed = found.size === SPOTS.length;

  // render subtle number (blended) or glowing when found
  const renderNumber = (s: Spot) => {
    const left = `${s.xPct}%`;
    const top = `${s.yPct}%`;
    const isFound = found.has(s.id);
    const isJust = justFound === s.id;
    const diameterPct = s.rPct * 2;
    const style: React.CSSProperties = {
      left,
      top,
      transform: "translate(-50%, -50%)",
      width: `${diameterPct}%`,
      height: `${(diameterPct * imageHeight) / imageWidth}%`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    };

    // blended look when not found: low opacity with subtle shadow; when found: bright + glow
    return (
      <motion.div
        key={`n-${s.id}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: isJust ? [1.18, 1] : 1, opacity: 1 }}
        transition={{ duration: 0.28 }}
        style={style}
        className="absolute select-none"
        aria-hidden
      >
        <div
          className={`font-extrabold text-center leading-none ${
            isFound ? "text-white text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" : "text-white text-3xl"
          }`}
          // subtle stroke for readability
          style={{
            WebkitTextStroke: isFound ? "0.5px rgba(0,0,0,0.5)" : "0.4px rgba(0,0,0,0.35)",
            opacity: isFound ? 1 : 0.18, // blend when not found
            transition: "opacity 220ms ease",
            textShadow: isFound ? "0 8px 24px rgba(255,215,80,0.16)" : "none",
            transform: "translateY(-2%)",
          }}
        >
          {s.id}
        </div>
      </motion.div>
    );
  };

  // choose a random cartoon/star when completed
  const rewardGraphic = useMemo(() => {
    if (!completed) return null;
    const idx = Math.floor(Math.random() * 8) + 1;
    return `/graphic/c${idx}.svg`;
  }, [completed]);

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT: big image (16:9) — no captions */}
        <div className="flex-1">
          <div
            ref={imgRef}
            onClick={handleClick}
            className={`relative w-full rounded-lg overflow-hidden border cursor-crosshair aspect-[16/9] ${missPulse ? "ring-2 ring-red-200 animate-[pulse_0.35s]" : ""}`}
            role="button"
            aria-label="Classroom image — tap to find hidden numbers"
          >
            <Image src={src} alt="" fill style={{ objectFit: "cover" }} />

            {/* render numbers overlay (on top of the image) */}
            {SPOTS.map((s) => renderNumber(s))}
          </div>

          <div className="mt-3 text-sm text-gray-700">
            Found <span className="font-semibold">{found.size}</span> of <span className="font-semibold">{SPOTS.length}</span>
          </div>
        </div>

        {/* RIGHT: buttons + reward area */}
        <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col items-center md:items-end gap-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button onClick={() => router.push("/fun-break")} className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}>
              {homeLabel}
            </button>

            <button onClick={handleRetry} className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}>
              {retryLabel}
            </button>

            <button onClick={() => onNext?.()} disabled={!completed} className={`${POPPY_BTN} ${!completed ? "opacity-60 pointer-events-none" : ""}`}>
              {nextLabel}
            </button>
          </div>

          <AnimatePresence>
            {completed && rewardGraphic && (
              <AnimatePresence>
            {completed && rewardGraphic && (
              <motion.div
                key="cartoon-block"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.32 }}
                className="w-full flex justify-center"
              >
                <div className="flex flex-row items-center justify-end">
                  <div className="w-56 h-56 bg-white rounded-xl flex items-end justify-center">
                    <Image
                      src={rewardGraphic}
                      alt={"Reward Image"}
                      width={200}
                      height={200}
                      className="object-contain"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-1">
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
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
