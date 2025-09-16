"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  { id: "triangle", label: "Triangle", svg: "/graphic/triangle.svg" },
  { id: "square", label: "Square", svg: "/graphic/square.svg" },
  { id: "pentagon", label: "Pentagon", svg: "/graphic/pentagon.svg" },
  { id: "circle", label: "Circle", svg: "/graphic/circle.svg" },
];

const CORRECT_ID = "pentagon";

type Props = {
  onScore?: (points: number) => void;
  onNext?: () => void;
  nextLabel?: string;
  retryLabel?: string;
  homeLabel?: string;
};

export default function ShapesQuestionGame({
  onScore,
  onNext,
  nextLabel = "Next",
  retryLabel = "Retry",
  homeLabel = "Home",
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);

  // sounds
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

  const handleSelect = (opt: Option) => {
    if (attempted) return;
    setSelected(opt.id);
    setAttempted(true);

    const correct = opt.id === CORRECT_ID;
    setIsCorrect(correct);
    setFeedbackIdx(
      correct ? Math.floor(Math.random() * 8) + 1 : Math.floor(Math.random() * 4) + 1
    );

    if (correct) {
      correctSoundRef.current?.play().catch(() => {});
      onScore?.(10);
    } else {
      wrongSoundRef.current?.play().catch(() => {});
    }
  };

  const handleRetry = () => {
    setSelected(null);
    setAttempted(false);
    setIsCorrect(null);
    setFeedbackIdx(null);
  };

  const feedbackGraphic = useMemo(() => {
    if (feedbackIdx === null || isCorrect === null) return null;
    return isCorrect ? `/graphic/c${feedbackIdx}.svg` : `/graphic/w${feedbackIdx}.svg`;
  }, [feedbackIdx, isCorrect]);

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT: question + options */}
        <div className="flex-1">
          <motion.h3
            className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-6"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            Which figure has the most sides?
          </motion.h3>

          {/* Options grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {OPTIONS.map((opt) => {
              const chosen = selected === opt.id;
              const correct = opt.id === CORRECT_ID;

              let styleClass =
                "bg-gray-50 border border-gray-300 text-gray-800 hover:bg-gray-100";
              if (attempted) {
                if (chosen && correct)
                  styleClass = "bg-green-600 text-white border-green-700";
                else if (chosen && !correct)
                  styleClass = "bg-red-600 text-white border-red-700";
                else styleClass = "bg-gray-50 border-gray-200 text-gray-700";
              }

              return (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSelect(opt)}
                  disabled={attempted}
                  className={`rounded-xl p-4 text-lg font-semibold transition-all duration-200 w-full text-center flex flex-col items-center ${styleClass}`}
                >
                  <Image
                    src={opt.svg}
                    alt={opt.label}
                    width={80}
                    height={80}
                    className="object-contain mb-2"
                  />
                  <span>{opt.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback text */}
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
                    ? "A pentagon has 5 sides, which is more than triangle (3) and square (4)."
                    : "Remember: a circle has no sides, so it cannot be the answer."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: buttons + cartoon/coin */}
        <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col items-center md:items-end gap-6">
          {/* Buttons */}
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
                      <Image src="/graphic/coin.svg" alt="coin" width={50} height={50} />
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
