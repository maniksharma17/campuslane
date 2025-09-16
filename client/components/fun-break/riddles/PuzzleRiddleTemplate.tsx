"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

export type PuzzleRiddle = {
  id: number;
  riddle: string;
  options: string[];
  answer: string;
  funFact: string;
  interaction: "puzzle";
};

type Props = {
  data: PuzzleRiddle;
  onAttempt?: (isCorrect: boolean) => void;
  onNext?: () => void;
  onRetry?: () => void;
  nextLabel?: string;
  retryLabel?: string;
  homeLabel?: string;
};

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

const optionBase =
  "rounded-full p-4 text-base md:text-lg font-semibold transition-all duration-200 w-full text-left";

const optionDefaultStyle =
  "bg-gray-50 border border-gray-300 text-gray-800 hover:bg-gray-100 shadow-none";

const optionChosenCorrect = "bg-green-600 text-white border-green-700 shadow-sm";
const optionChosenWrong = "bg-red-600 text-white border-red-700 shadow-sm";
const optionDisabled = "bg-gray-50 border-gray-200 text-gray-700";

const optionVariants: Variants = {
  initial: { opacity: 1, scale: 1 },
  wrong: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  chosenCorrect: {
    scale: [1, 1.06, 1],
    transition: { duration: 0.36 },
  },
};

export default function PuzzleRiddleTemplate({
  data,
  onAttempt,
  onNext,
  onRetry,
  nextLabel = "Next",
  retryLabel = "Retry",
  homeLabel = "Home",
}: Props) {
  const router = useRouter();

  // UI state
  const [attempted, setAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [dropped, setDropped] = useState<{ opt: string; idx: number } | null>(
    null
  );

  // refs
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  // sounds (preload on client)
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);
  const dropSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // wrap in try/catch in case files missing
    try {
      if (!correctSoundRef.current) correctSoundRef.current = new Audio("/sounds/correct.mp3");
      if (!wrongSoundRef.current) wrongSoundRef.current = new Audio("/sounds/wrong.mp3");
      if (!dropSoundRef.current) dropSoundRef.current = new Audio("/sounds/drop.mp3");
      // don't autoplay — only play on events
    } catch (err) {
      // ignore if audio files aren't available
      // console.warn("Audio preload failed", err);
    }
  }, []);

  // pick a random feedback cartoon index for this attempt (stable once picked)
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);
  useEffect(() => {
    if (!attempted) setFeedbackIdx(null);
  }, [attempted, data.id]);

  // compute feedback graphic path
  const feedbackGraphic = useMemo(() => {
    if (!attempted || feedbackIdx === null) return null;
    return isCorrect ? `/graphic/c${feedbackIdx}.svg` : `/graphic/w${feedbackIdx}.svg`;
  }, [attempted, isCorrect, feedbackIdx]);

  // helper: when an option is dropped (or clicked) into drop zone
  const handleDrop = (opt: string, idx: number) => {
    if (attempted) return;
    // stable feedback index
    const idxPick = Math.floor(Math.random() * (opt === data.answer ? 8 : 4)) + 1;
    setFeedbackIdx(idxPick);

    const correct = opt === data.answer;
    setDropped({ opt, idx });
    setIsCorrect(correct);
    setAttempted(true);

    // play drop sound then correct/wrong
    try {
      dropSoundRef.current?.play().catch(() => {});
    } catch {}
    // small timeout so drop sound plays first
    window.setTimeout(() => {
      try {
        if (correct) correctSoundRef.current?.play().catch(() => {});
        else wrongSoundRef.current?.play().catch(() => {});
      } catch {}
    }, 90);

    onAttempt?.(correct);
  };

  const handleRetryInternal = () => {
    setAttempted(false);
    setIsCorrect(null);
    setDropped(null);
    setFeedbackIdx(null);
    onRetry?.();
  };

  const handleNextInternal = () => {
    onNext?.();
  };

  // Result text for screen readers
  const resultText =
    attempted && isCorrect ? "Correct answer" : attempted && isCorrect === false ? "Wrong answer" : "";

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT: question + drop zone + options + fun fact */}
        <div className="flex-1">
          <motion.h3
            className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-6"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            {data.riddle}
          </motion.h3>

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            aria-label="Answer drop zone"
            className={`w-full min-h-[140px] mb-4 border-2 border-dashed rounded-xl flex items-center justify-center transition-colors p-4 ${
              attempted
                ? isCorrect
                  ? "border-green-400 bg-green-50"
                  : "border-red-400 bg-red-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="w-full flex items-center justify-center">
              {!attempted ? (
                <p className="text-gray-500">Drag your answer here</p>
              ) : (
                // animate the snapped option into the drop zone using same layoutId
                <motion.div
                  layoutId={dropped ? `opt-layout-${dropped.idx}` : undefined}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm"
                >
                  <span className={isCorrect ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {dropped?.opt}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Draggable options grid (hidden after attempt) */}
          {!attempted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.options.map((opt, i) => {
                const layoutId = `opt-layout-${i}`;
                return (
                  <motion.div
                    key={i}
                    layoutId={layoutId}
                    drag
                    dragElastic={0.8}
                    whileTap={{ scale: 0.95 }}
                    onDragEnd={(_, info) => {
                      if (!dropZoneRef.current) return;
                      const rect = dropZoneRef.current.getBoundingClientRect();
                      const inside =
                        info.point.x >= rect.left &&
                        info.point.x <= rect.right &&
                        info.point.y >= rect.top &&
                        info.point.y <= rect.bottom;
                      if (inside) {
                        handleDrop(opt, i);
                      }
                    }}
                    onDoubleClick={() => handleDrop(opt, i)} // quick fallback
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleDrop(opt, i);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Option ${opt}`}
                    className={`${optionBase} ${optionDefaultStyle} cursor-grab px-6 py-4`}
                  >
                    {opt}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Fun fact below options (appears after attempt) */}
          <AnimatePresence>
            {attempted && (
              <motion.div
                key="funfact"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.28 }}
                className={`mt-4 p-4 rounded-lg border ${
                  isCorrect ? "border-green-400 bg-green-100" : "border-red-400 bg-red-100"
                }`}
              >
                <div className="font-semibold mb-1 text-gray-900">
                  {isCorrect ? "Correct!" : "Try again"}
                </div>
                <div className="text-sm text-gray-800">{data.funFact}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: buttons + feedback cartoon */}
        <div className="w-full md:w-[420px] flex-shrink-0 flex flex-col items-center md:items-end gap-6">
          {/* Buttons (always visible) */}
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={() => router.push("/fun-break/riddles")}
              className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}
              type="button"
            >
              {homeLabel}
            </button>

            {attempted && !isCorrect && (
              <button
                onClick={handleRetryInternal}
                className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}
                type="button"
              >
                {retryLabel}
              </button>
            )}

            <button
              onClick={handleNextInternal}
              disabled={!attempted}
              className={`${POPPY_BTN} ${!attempted ? "opacity-60 pointer-events-none" : ""}`}
              type="button"
            >
              {nextLabel}
            </button>
          </div>

          {/* Cartoon + coin (bigger) */}
          <AnimatePresence>
            {attempted && feedbackGraphic && (
              <motion.div
                key="cartoon-block"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.32 }}
                className="w-full flex justify-center"
              >
                <div className="flex flex-row items-center justify-end gap-6">
                  {/* Cartoon container - bigger when wrong */}
                  <div
                    className={`flex items-center justify-center overflow-hidden ${
                      isCorrect ? "w-56 h-56" : "w-72 h-72"
                    }`}
                  >
                    <Image
                      src={feedbackGraphic}
                      alt={isCorrect ? "correct" : "wrong"}
                      width={isCorrect ? 220 : 300}
                      height={isCorrect ? 220 : 300}
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* coin + streak - visible only when correct */}
                  {isCorrect && (
                    <motion.div
                      initial={{ y: 18, opacity: 0, scale: 0.6 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex items-center gap-2 font-extrabold text-3xl text-gray-800">
                        <Image src="/graphic/coin.svg" alt="coin" width={64} height={64} />
                        <span>+10</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Screen-reader friendly announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {resultText}
      </div>
    </div>
  );
}
