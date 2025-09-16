"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

type Option = {
  id: string;
  label: string;
  svg: string;
};

const OPTIONS: Option[] = [
  { id: "binoculars", label: "Binoculars", svg: "/graphic/binoculars.svg" },
  { id: "glasses", label: "Glasses", svg: "/graphic/glasses.svg" },
  { id: "telescope", label: "Telescope", svg: "/graphic/telescope.svg" },
  { id: "camera", label: "Camera", svg: "/graphic/camera.svg" },
];

type Props = {
  onScore?: (eventIdOrPoints: string | number, points?: number) => void;
  onNext?: () => void;
  nextLabel?: string;
  retryLabel?: string;
  homeLabel?: string;
};

export default function RiddleObjectGame({
  onScore,
  onNext,
  nextLabel = "Next",
  retryLabel = "Retry",
  homeLabel = "Home",
}: Props) {
  const router = useRouter();
  const [attempted, setAttempted] = useState(false);
  const [chosen, setChosen] = useState<Option | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);

  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio !== "undefined") {
      try {
        correctSoundRef.current = new Audio("/sounds/correct.mp3");
        wrongSoundRef.current = new Audio("/sounds/wrong.mp3");
      } catch {}
    }
  }, []);

  const CORRECT_ID = "binoculars";

  const fireScore = (eventId: string, points: number) => {
    if (!onScore) return;
    try {
      onScore(eventId, points);
    } catch {
      try {
        // @ts-ignore
        onScore(points);
      } catch {}
    }
  };

  const handleSelect = (opt: Option) => {
    if (attempted) return;
    setChosen(opt);
    setAttempted(true);

    const correct = opt.id === CORRECT_ID;
    setIsCorrect(correct);

    const idxPick = correct
      ? Math.floor(Math.random() * 8) + 1
      : Math.floor(Math.random() * 4) + 1;
    setFeedbackIdx(idxPick);

    if (correct) {
      correctSoundRef.current?.play().catch(() => {});
      fireScore("riddle-object:complete", 10);
    } else {
      wrongSoundRef.current?.play().catch(() => {});
    }
  };

  const handleRetry = () => {
    setAttempted(false);
    setChosen(null);
    setIsCorrect(null);
    setFeedbackIdx(null);
  };

  const feedbackGraphic = useMemo(() => {
    if (feedbackIdx === null || isCorrect === null) return null;
    return isCorrect
      ? `/graphic/c${feedbackIdx}.svg`
      : `/graphic/w${feedbackIdx}.svg`;
  }, [feedbackIdx, isCorrect]);

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT */}
        <div className="flex-1">
          <motion.h3
            className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-6"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            “I have two eyes but cannot cry. I help you see far in the sky. What
            am I?”
          </motion.h3>

          {/* Drop zone */}
          <div
            className={`w-full min-h-[140px] mb-6 border-2 border-dashed rounded-xl flex items-center justify-center p-4 ${
              attempted
                ? isCorrect
                  ? "border-green-400 bg-green-50"
                  : "border-red-400 bg-red-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            {attempted && chosen ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm"
              >
                <img
                  src={chosen.svg}
                  alt={chosen.label}
                  width={48}
                  height={48}
                />
                <span
                  className={
                    isCorrect ? "text-green-600 font-bold" : "text-red-600 font-bold"
                  }
                >
                  {chosen.label}
                </span>
              </motion.div>
            ) : (
              <p className="text-gray-500">Choose an option below</p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {OPTIONS.map((opt) => {
              const chosenNow = chosen?.id === opt.id;
              const correct = opt.id === CORRECT_ID;
              let styleClass =
                "bg-gray-50 border border-gray-300 text-gray-800 hover:bg-gray-100";
              if (attempted) {
                if (chosenNow && correct)
                  styleClass = "bg-green-600 text-white border-green-700";
                else if (chosenNow && !correct)
                  styleClass = "bg-red-600 text-white border-red-700";
                else styleClass = "bg-gray-50 border-gray-200 text-gray-700";
              }

              return (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.95 }}
                  disabled={attempted}
                  onClick={() => handleSelect(opt)}
                  className={`rounded-xl p-4 text-base md:text-lg font-semibold transition-all duration-200 w-full text-left flex items-center gap-3 ${styleClass}`}
                >
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img src={opt.svg} alt={opt.label} width={44} height={44} />
                  </div>
                  <div>{opt.label}</div>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {attempted && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.28 }}
                className={`mt-4 p-4 rounded-lg text-left border ${
                  isCorrect
                    ? "border-green-400 bg-green-100"
                    : "border-red-400 bg-red-100"
                }`}
              >
                <div className="font-semibold mb-1 text-gray-900">
                  {isCorrect ? "Correct!" : "Not quite"}
                </div>
                <div className="text-sm text-gray-800">
                  {isCorrect
                    ? "Binoculars have two 'eyes' (lenses) and help you see distant objects."
                    : "Try again — think about something with two lenses used to see far."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col items-center md:items-end gap-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={() => router.push("/fun-break")}
              className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}
            >
              {homeLabel}
            </button>
            {attempted && !isCorrect && (
              <button
                onClick={handleRetry}
                className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}
              >
                {retryLabel}
              </button>
            )}
            <button
              onClick={() => onNext?.()}
              disabled={!attempted}
              className={`${POPPY_BTN} ${
                !attempted ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {nextLabel}
            </button>
          </div>

          {/* Cartoon + coin */}
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
                <div className="flex flex-row items-center justify-end gap-4">
                  <div className="w-56 h-56 bg-white rounded-xl flex items-end justify-center">
                    <Image
                      src={feedbackGraphic}
                      alt={isCorrect ? "correct" : "wrong"}
                      width={200}
                      height={200}
                    />
                  </div>
                  {isCorrect && (
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
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
