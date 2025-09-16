"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

const optionVariants: Variants = {
  initial: { opacity: 1, scale: 1 },
  wrong: {
    x: [0, -16, 16, -12, 12, -6, 6, 0],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  chosenCorrect: { scale: [1, 1.08, 1], transition: { duration: 0.34 } },
};

type Option = {
  label: string;
  img: string;
  correct?: boolean;
};

type Props = {
  onScore?: (points: number) => void;
  onNext: () => void;
  nextLabel?: string;
  retryLabel?: string;
  homeLabel?: string;
};

const OPTIONS: Option[] = [
  { label: "Cat", img: "/graphic/cat.svg" },
  { label: "Dog", img: "/graphic/dog.svg" },
  { label: "Cow", img: "/graphic/cow.svg" },
  { label: "Car", img: "/graphic/car.svg", correct: true },
];

export default function OddOneOutGame({
  onScore,
  onNext,
  nextLabel = "Next",
  retryLabel = "Retry",
  homeLabel = "Home",
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Option | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);

  // sounds
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio !== "undefined") {
      correctSoundRef.current = new Audio("/sounds/correct.mp3");
      wrongSoundRef.current = new Audio("/sounds/wrong.mp3");
    }
  }, []);

  const handleSelect = (opt: Option) => {
    if (attempted) return;
    setSelected(opt);
    setAttempted(true);

    const correct = !!opt.correct;
    setIsCorrect(correct);

    const idxPick = correct
      ? Math.floor(Math.random() * 8) + 1
      : Math.floor(Math.random() * 4) + 1;
    setFeedbackIdx(idxPick);

    if (correct) {
      correctSoundRef.current?.play().catch(() => {});
      onScore?.(10);
    } else {
      wrongSoundRef.current?.play().catch(() => {});
    }
  };

  const handleRetryInternal = () => {
    setSelected(null);
    setAttempted(false);
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
        {/* LEFT column: question + options + fun fact */}
        <div className="flex-1">
          <motion.h3
            className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-6"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            Find the odd one out!
          </motion.h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {OPTIONS.map((opt, i) => {
              const chosen = selected?.label === opt.label;
              const correct = !!opt.correct;

              let styleClass =
                "bg-gray-50 border border-gray-300 text-gray-800 hover:bg-gray-100";
              if (attempted) {
                if (chosen && correct) styleClass = "bg-green-600 text-white border-green-700";
                else if (chosen && !correct) styleClass = "bg-red-600 text-white border-red-700";
                else styleClass = "bg-white border-gray-200 text-gray-700";
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
                  className={`flex flex-col w-fit items-center justify-center p-4 rounded-2xl shadow-md transition-all duration-200 ${styleClass}`}
                >
                  <Image
                    src={opt.img}
                    alt={opt.label}
                    width={150}
                    height={150}
                    className="object-contain mb-2"
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Feedback message */}
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
                  {isCorrect ? "Correct!" : "Try again"}
                </div>
                <div className="text-sm text-gray-800">
                  {isCorrect
                    ? "Cars don’t belong to the animal group — that’s the odd one out!"
                    : "Hint: Three are animals, one is not."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT column: buttons + feedback cartoon */}
        <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col items-center md:items-end gap-6">
          {/* Buttons group */}
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={() => router.push("/fun-break")}
              className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}
            >
              {homeLabel}
            </button>

            {attempted && !isCorrect && (
              <button
                onClick={handleRetryInternal}
                className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}
              >
                {retryLabel}
              </button>
            )}

            <button
              onClick={onNext}
              disabled={!attempted}
              className={`${POPPY_BTN} ${!attempted ? "opacity-60 pointer-events-none" : ""}`}
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
                <div className="flex flex-row items-center justify-end">
                  <div className="w-56 h-56 bg-white rounded-xl flex items-end">
                    <Image
                      src={feedbackGraphic}
                      alt={isCorrect ? "correct" : "wrong"}
                      width={isCorrect ? 200 : 300}
                      height={isCorrect ? 200 : 300}
                      className="object-contain"
                    />
                  </div>
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
