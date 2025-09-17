"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import TongueTwisterTemplate from "@/components/fun-break/tongue-twisters/TongueTwisterTemplate";
import { TONGUE_TWISTERS } from "@/data/tongue-twisters/index";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";


export default function FunTongueTwistersPage() {
  const router = useRouter();
  const total = TONGUE_TWISTERS.length;

  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(0);

  const current: any = TONGUE_TWISTERS[index];
  const finished = index >= total;

  const handleNext = useCallback(() => {
    setCompleted((c) => c + 1);
    setIndex((i) => i + 1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // keyboard shortcut: N for next, ArrowRight for next, ArrowLeft for previous
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "n" || e.key === "ArrowRight") {
        if (!finished) handleNext();
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, finished]);

  const progressFraction = Math.max(0, Math.min(1, completed / total));

  return (
    <main className="min-h-screen bg-primary py-12 lg:py-24 px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-wide text-white drop-shadow">
            TONGUE TWISTERS
          </h1>

          <div className="text-white/80 text-sm">
            {finished
              ? "Done!"
              : `Twister ${index + 1} of ${total}`}
          </div>
        </div>

        {/* progress */}
        <div>
          <div className="flex justify-between mb-2 text-white/80 text-sm">
            <span>{completed} Completed</span>
            <span>{Math.round(progressFraction * 100)}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden shadow-inner">
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

        {/* content */}
        {!finished && current ? (
          <TongueTwisterTemplate
            key={current.id}
            data={current}
            onNext={handleNext}
            nextLabel="Next"
            homeLabel="Home"
          />
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <h2 className="text-5xl font-semibold text-green-600">ALL DONE</h2>
            <p className="mt-4">You finished the {total} tongue twisters!</p>
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
                onClick={() => router.push("/fun-break")}
                className={POPPY_BTN}
                type="button"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {/* footer tip */}
        <p className="text-center text-white/70 text-sm mt-6">
          Tip: Press <kbd>N</kbd> or <kbd>→</kbd> for next, <kbd>←</kbd> for previous.
        </p>
      </div>
    </main>
  );
}
