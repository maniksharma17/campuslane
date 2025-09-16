"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

const CORRECT_ORDER = ["5", "10", "15", "20", "25"];

type Props = {
  onScore?: (points: number) => void;
  onNext: () => void;
  nextLabel?: string;
  retryLabel?: string;
  homeLabel?: string;
};

export default function ArrangeNumbersGame({
  onScore,
  onNext,
  nextLabel = "Next",
  retryLabel = "Retry",
  homeLabel = "Home",
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState(["15", "5", "25", "10", "20"]);
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = () => {
    if (submitted) return;
    const correct = JSON.stringify(items) === JSON.stringify(CORRECT_ORDER);
    setIsCorrect(correct);
    setSubmitted(true);

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

  const handleRetry = () => {
    setItems(["15", "5", "25", "10", "20"]);
    setSubmitted(false);
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
        {/* LEFT column: question + draggable cards + feedback */}
        <div className="flex-1">
          <motion.h3
            className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-6"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            Arrange the numbers in ascending order:
          </motion.h3>
          <p className="mb-6 text-lg text-gray-700">15, 5, 25, 10, 20</p>

          {/* Draggable numbers */}
          <Reorder.Group
            axis="x"
            onReorder={setItems}
            values={items}
            className="flex gap-4 flex-wrap justify-center mb-6"
          >
            {items.map((num) => (
              <Reorder.Item
                key={num}
                value={num}
                whileDrag={{ scale: 1.1 }}
                className={`cursor-grab select-none px-8 py-6 rounded-2xl text-3xl font-extrabold border-2 shadow-md transition-all ${
                  submitted
                    ? isCorrect
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "bg-red-100 border-red-500 text-red-700"
                    : "bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100"
                }`}
              >
                {num}
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Feedback message */}
          <AnimatePresence>
            {submitted && (
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
                  {isCorrect ? "Correct!" : "Wrong Order"}
                </div>
                <div className="text-sm text-gray-800">
                  {isCorrect
                    ? "Nicely done! Numbers are in perfect order."
                    : "Try rearranging them again."}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT column: buttons + feedback cartoon */}
        <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col items-center md:items-end gap-6">
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={() => router.push("/fun-break")}
              className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}
            >
              {homeLabel}
            </button>

            {submitted && !isCorrect && (
              <button
                onClick={handleRetry}
                className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}
              >
                {retryLabel}
              </button>
            )}

            <button
              onClick={submitted ? onNext : handleSubmit}
              className={`${POPPY_BTN} ${!submitted ? "bg-orange-500" : ""}`}
            >
              {submitted ? nextLabel : "Submit"}
            </button>
          </div>

          {/* Cartoon + coin */}
          <AnimatePresence>
            {submitted && feedbackGraphic && (
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
