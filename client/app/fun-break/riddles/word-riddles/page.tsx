"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import RiddleTemplate, { Riddle } from "@/components/fun-break/riddles/RiddleTemplate";
import { WORD_RIDDLES } from "@/data/riddles/word";
import Image from "next/image";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

const SCORE_KEY = "funRiddles:score";
const AWARDED_KEY = "funRiddles:awarded"; 

export default function NatureRiddlesPage() {
  const router = useRouter();
  const total = WORD_RIDDLES.length;

  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [score, setScore] = useState(0);

  // which riddle indexes were already awarded points (persisted)
  const [awardedSet, setAwardedSet] = useState<Set<number>>(new Set());

  // whether the current riddle has been attempted (used to gate Next)
  const [attempted, setAttempted] = useState(false);

  const current: Riddle = WORD_RIDDLES[index];

  // load score + awarded indexes on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedScore = localStorage.getItem(SCORE_KEY);
    const savedAwarded = localStorage.getItem(AWARDED_KEY);

    if (savedScore) {
      const n = parseInt(savedScore, 10);
      if (!Number.isNaN(n)) setScore(n);
    }

    if (savedAwarded) {
      try {
        const arr = JSON.parse(savedAwarded) as Array<number | string>;
        const nums = arr.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
        setAwardedSet(new Set(nums));
      } catch {
        setAwardedSet(new Set());
      }
    }
  }, []);

  const handleNext = useCallback(() => {
    setCompleted((c) => c + 1);
    const next = index + 1;
    
    setIndex(next);
    // reset per-riddle attempt local flag
    setAttempted(false);
    // scroll to top for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  const handleRetry = () => {
    // child handles resetting its own UI; parent clears attempted flag so Next gating is correct
    setAttempted(false);
  };

  // persist score + awardedSet when they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SCORE_KEY, String(score));
    localStorage.setItem(AWARDED_KEY, JSON.stringify(Array.from(awardedSet)));
  }, [score, awardedSet]);

  // progress fraction
  const progressFraction = Math.max(0, Math.min(1, completed / total));

  // keyboard shortcuts: 'n' => Next (only when attempted), 'r' => Retry
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" || e.key === "N") {
        if (attempted) handleNext();
      } else if (e.key === "r" || e.key === "R") {
        handleRetry();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [attempted, index, handleNext]); // re-register when attempted/index changes

  // Called by child when user attempts an option (correct or wrong)
  const handleAttempt = (isCorrect: boolean) => {
    // mark that user attempted current riddle (used for gating Next)
    setAttempted(true);

    // if correct and not yet awarded, award once
    if (isCorrect) {
      // award points
      setScore((prev) => {
        const newScore = prev + 10;
        return newScore;
      });
    }
    // if not correct or already awarded, do nothing to score
  };

  const finished = index >= total;

  return (
    <main className="min-h-screen bg-primary py-12 lg:py-24 px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-wide text-white drop-shadow">
            WORD RIDDLES
          </h1>

          {/* score box */}
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

        {/* progress */}
        <div>
          <div className="flex justify-between mb-2 text-white/80 text-sm">
            {index < total && <span>
              Riddle {index + 1} of {total}
            </span>}
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

        {/* riddle template */}
        {!finished ? (
          <RiddleTemplate
            key={index}
            data={current}
            onAttempt={handleAttempt}
            onNext={handleNext}
            onRetry={handleRetry}
          />
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            {
              ((score/10)/total)*100 >= 50
              ? <h2 className="text-5xl font-semibold text-green-600">NICE WORK!</h2>
              : <h2 className="text-5xl font-semibold text-red-500">TRY AGAIN!</h2>
            }
            <p className="mt-4">
              You finished all riddles. You scored {" "} 
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
                  setAwardedSet(new Set());
                }}
                className={POPPY_BTN}
                type="button"
              >
                Restart
              </button>
              <button
                onClick={() => router.push("/fun-break/riddles")}
                className={`${POPPY_BTN}`}
                type="button"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {/* footer tip */}
        <p className="text-center text-white/70 text-sm mt-6">
          Tip: Each riddle awards points only once. Score is saved in your
          progress.
        </p>
      </div>
    </main>
  );
}
