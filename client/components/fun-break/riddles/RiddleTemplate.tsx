"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter } from "next/navigation";

export type Riddle = {
  riddle: string;
  options: string[];
  answer: string;
  funFact: string;
};

type Props = {
  data: Riddle;
  onAttempt?: (isCorrect: boolean) => void;
  onNext?: () => void;
  onRetry?: () => void;
  nextLabel?: string;
  retryLabel?: string;
  homeLabel?: string;
};

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

const optionVariants: Variants = {
  initial: { opacity: 1, scale: 1 },
  wrong: {
    x: [0, -20, 20, -16, 16, -10, 10, 0],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  chosenCorrect: { scale: [1, 1.1, 1], transition: { duration: 0.34 } },
};

export default function RiddleTemplate({
  data,
  onAttempt,
  onNext,
  onRetry,
  nextLabel = "Next",
  retryLabel = "Retry",
  homeLabel = "Home",
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [lastWasCorrect, setLastWasCorrect] = useState<boolean | null>(null);
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);

  // sounds
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!correctSoundRef.current && typeof Audio !== "undefined")
      correctSoundRef.current = new Audio("/sounds/correct.mp3");
    if (!wrongSoundRef.current && typeof Audio !== "undefined")
      wrongSoundRef.current = new Audio("/sounds/wrong.mp3");
  }, []);

  // reset state when parent passes new riddle
  useEffect(() => {
    setSelected(null);
    setAttempted(false);
    setLastWasCorrect(null);
    setFeedbackIdx(null);
  }, [data]);

  const pickFeedbackIndex = (isCorrect: boolean) =>
    isCorrect ? Math.floor(Math.random() * 8) + 1 : Math.floor(Math.random() * 4) + 1;

  const handleSelect = (option: string) => {
    if (attempted) return;
    setSelected(option);
    setAttempted(true);

    const correct = option === data.answer;
    setLastWasCorrect(correct);
    setFeedbackIdx(pickFeedbackIndex(correct));

    // sounds
    if (correct) correctSoundRef.current?.play().catch(() => {});
    else wrongSoundRef.current?.play().catch(() => {});

    onAttempt?.(correct);
  };

  const handleRetryInternal = () => {
    setSelected(null);
    setAttempted(false);
    setLastWasCorrect(null);
    setFeedbackIdx(null);
    onRetry?.();
  };

  const handleNextInternal = () => {
    onNext?.();
  };

  const isCorrect = lastWasCorrect === true;

  const feedbackGraphic = useMemo(() => {
    if (feedbackIdx === null || lastWasCorrect === null) return null;
    return lastWasCorrect ? `/graphic/c${feedbackIdx}.svg` : `/graphic/w${feedbackIdx}.svg`;
  }, [feedbackIdx, lastWasCorrect]);

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      {/* two-column responsive layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT column: question + options + fun fact (fun fact appears after attempt) */}
        <div className="flex-1">
          <motion.h3
            className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-6"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            {data.riddle}
          </motion.h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.options.map((opt, i) => {
              const chosen = selected === opt;
              const correct = opt === data.answer;

              let styleClass =
                "bg-gray-50 border border-gray-300 text-gray-800 hover:bg-gray-100 shadow-none";
              if (attempted) {
                if (chosen && correct) styleClass = "bg-green-600 text-white border-green-700";
                else if (chosen && !correct) styleClass = "bg-red-600 text-white border-red-700";
                else styleClass = "bg-gray-50 border-gray-200 text-gray-700";
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelect(opt)}
                  disabled={attempted}
                  whileTap={{ scale: 0.9 }}
                  variants={optionVariants}
                  animate={
                    attempted && chosen && !correct
                      ? "wrong"
                      : attempted && chosen && correct
                      ? "chosenCorrect"
                      : "initial"
                  }
                  aria-pressed={chosen}
                  className={`rounded-full p-4 text-base md:text-lg font-semibold transition-all duration-200 w-full text-left ${styleClass}`}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>

          {/* Fun fact below options */}
          <AnimatePresence>
            {attempted && (
              <motion.div
                key="funfact"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.28 }}
                className={`mt-4 p-4 rounded-lg text-left border ${
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

        {/* RIGHT column: buttons (top) + cartoon+coin (appear after attempt) */}
        <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col items-center md:items-end gap-6">
          {/* Buttons group (always visible) */}
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={() => router.push("/fun-break/riddles")}
              className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}
            >
              {homeLabel}
            </button>

            {/* Retry only shown after wrong attempt */}
            {attempted && !isCorrect && (
              <button onClick={handleRetryInternal} className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}>
                {retryLabel}
              </button>
            )}

            <button
              onClick={handleNextInternal}
              disabled={!attempted}
              className={`${POPPY_BTN} ${!attempted ? "opacity-60 pointer-events-none" : ""}`}
            >
              {nextLabel}
            </button>
          </div>

          {/* Cartoon + coin/streak area (only after attempt) */}
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
                <div className="flex flex-row items-center justify-end">
                  <div className="w-56 h-56 bg-white rounded-xl flex items-end">
                    <Image
                      src={feedbackGraphic}
                      alt={isCorrect ? "correct" : "wrong"}
                      width={isCorrect ? 200 : 300}
                      height={isCorrect ? 200: 300}
                      className="object-contain"
                    />
                  </div>

                  {/* coin + streak - visible only when correct */}
                  {isCorrect && (
                    <div className="flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ y: 18, opacity: 0, scale: 0.6 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="flex items-center gap-0 font-extrabold text-3xl text-gray-800"
                      >
                        <Image src="/graphic/coin.svg" alt="coin" width={50} height={50} />
                        <span>+10</span>
                      </motion.div>

                      
                    </div>
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
