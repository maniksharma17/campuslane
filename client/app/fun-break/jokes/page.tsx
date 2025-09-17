"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import JokeTemplate, { Joke } from "@/components/fun-break/jokes/JokeTemplate";
import { FUN_JOKES } from "@/data/jokes/jokes"; 

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

export default function FunJokesPage() {
  const router = useRouter();
  const total = FUN_JOKES.length;

  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(0);

  const current: Joke = FUN_JOKES[index];
  const finished = index >= total;

  const handleNext = useCallback(() => {
    setCompleted((c) => c + 1);
    const next = index + 1;
    setIndex(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  // keyboard shortcut: press "n" for next
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "n" || e.key === "N") && !finished) {
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, finished]);

  // progress fraction
  const progressFraction = Math.max(0, Math.min(1, completed / total));

  return (
    <main className="min-h-screen bg-primary py-12 lg:py-24 px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-wide text-white drop-shadow">
            FUN JOKES
          </h1>
        </div>

        {/* progress */}
        <div>
          <div className="flex justify-between mb-2 text-white/80 text-sm">
            {index < total && (
              <span>
                Joke {index + 1} of {total}
              </span>
            )}
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

        {/* joke template */}
        {!finished ? (
          <JokeTemplate key={index} data={current} onNext={handleNext} />
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <h2 className="text-5xl font-semibold text-green-600">ALL DONE</h2>
            <p className="mt-4">You finished all {total} jokes.</p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => {
                  setIndex(0);
                  setCompleted(0);
                }}
                className={POPPY_BTN}
                type="button"
              >
                Restart
              </button>
              <button
                onClick={() => router.push("/fun-break/jokes")}
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
          Tip: Press <kbd>N</kbd> to quickly skip to the next joke.
        </p>
      </div>
    </main>
  );
}
