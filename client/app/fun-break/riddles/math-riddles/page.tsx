"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import RiddleTemplate, { Riddle } from "@/components/fun-break/riddles/RiddleTemplate";
import PuzzleRiddleTemplate, { PuzzleRiddle } from "@/components/fun-break/riddles/PuzzleRiddleTemplate";
import { MATH_RIDDLES } from "@/data/riddles/math";
import Image from "next/image";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

const SCORE_KEY = "mathRiddles:score";

export default function MathRiddlesPage() {
  const router = useRouter();
  const total = MATH_RIDDLES.length;

  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [score, setScore] = useState(0);

  const current: any = MATH_RIDDLES[index];

  // load saved score
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(SCORE_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n)) setScore(n);
    }
  }, []);

  // save score
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SCORE_KEY, String(score));
  }, [score]);

  const handleAttempt = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 10);
    }
  };

  const handleNext = () => {
    setCompleted((c) => c + 1);
    const next = index + 1;
    if (next >= total) {
      setIndex(total); // finished state
      return;
    }
    setIndex(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetry = () => {
    // child templates handle their own retry state
  };

  const progressFraction = Math.max(0, Math.min(1, completed / total));
  const finished = index >= total;

  return (
    <main className="min-h-screen bg-primary py-12 lg:py-24 px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-wider text-white drop-shadow">
            MATH PUZZLES
          </h1>

          {/* Score box */}
          <div className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg">
            <Image
              src="/graphic/coin.svg"
              alt="coin"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-2xl font-extrabold text-gray-800">
              {score}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between mb-2 text-white/80 text-sm">
            <span>
              Puzzle {Math.min(index + 1, total)} of {total}
            </span>
            <span>{completed} Completed</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-5 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: `${Math.round(progressFraction * 100)}%` }}
              animate={{ width: `${Math.round(progressFraction * 100)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg,#ff8a00 0%, #ff5e7a 50%, #ffbb00 100%)",
                boxShadow: "0 6px 16px rgba(255,110,60,0.18)",
              }}
            />
          </div>
        </div>

        {/* Puzzle Template or Finish Screen */}
        {!finished ? (
          current.interaction === "tap" ? (
            <RiddleTemplate
              key={index}
              data={current as Riddle}
              onAttempt={handleAttempt}
              onNext={handleNext}
              onRetry={handleRetry}
            />
          ) : (
            <PuzzleRiddleTemplate
              key={index}
              data={current as PuzzleRiddle}
              onAttempt={handleAttempt}
              onNext={handleNext}
              onRetry={handleRetry}
            />
          )
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            {((score / 10) / total) * 100 >= 50 ? (
              <h2 className="text-5xl font-semibold text-green-600">
                NICE WORK!
              </h2>
            ) : (
              <h2 className="text-5xl font-semibold text-red-500">
                TRY AGAIN!
              </h2>
            )}
            <p className="mt-4">
              You finished all riddles. You scored{" "}
              <span className="font-extrabold">{score}</span> points.
            </p>
            <p className="text-6xl font-extrabold mt-4 p-6 w-fit mx-auto">
              {score}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => {
                  setIndex(0);
                  setCompleted(0);
                  setScore(0);
                }}
                className={POPPY_BTN}
                type="button"
              >
                Restart
              </button>
              <button
                onClick={() => router.push("/fun-break/riddles")}
                className={`${POPPY_BTN} bg-gray-700`}
                type="button"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {/* Footer tip */}
        <p className="text-center text-white/70 text-sm mt-6">
          Tip: Score updates on correct puzzles. Progress updates when you
          press <span className="font-semibold">Next</span>.
        </p>
      </div>
    </main>
  );
}
