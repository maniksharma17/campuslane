"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Import your mini games
import NumberRiddleGame from "@/components/fun-break/puzzles/NumberRiddleGame";
import OddOneOutGame from "@/components/fun-break/puzzles/OddOneOut";
import ArrangeNumbersGame from "@/components/fun-break/puzzles/ArrangeNumbersGame";
import SpotTheDifferenceGame from "@/components/fun-break/puzzles/SpotTheDifference";
import CatLegsGame from "@/components/fun-break/puzzles/CatsLegsGame";
import MysteryNumberGame from "@/components/fun-break/puzzles/MysteryNumberGame";
import HiddenNumbersGame from "@/components/fun-break/puzzles/HiddenNumbersGame";
import RiddleObjectGame from "@/components/fun-break/puzzles/RiddleObject";
import MissingSequenceGame from "@/components/fun-break/puzzles/MissingSequenceGame";
import ShapesQuestionGame from "@/components/fun-break/puzzles/ShapeGame";

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

export default function AllGamesPage() {
  const router = useRouter();

  const games = [
    { id: 1, title: "Puzzle 1: Number Riddle", comp: NumberRiddleGame },
    { id: 2, title: "Puzzle 2: Odd One Out", comp: OddOneOutGame },
    { id: 3, title: "Puzzle 3: Arrange Numbers", comp: ArrangeNumbersGame },
    { id: 4, title: "Puzzle 4: Spot the Difference", comp: SpotTheDifferenceGame },
    { id: 5, title: "Puzzle 5: Cat Legs", comp: CatLegsGame },
    { id: 6, title: "Puzzle 6: Mystery Number", comp: MysteryNumberGame },
    { id: 7, title: "Puzzle 7: Hidden Number", comp: HiddenNumbersGame },
    { id: 8, title: "Puzzle 8: Riddle Object", comp: RiddleObjectGame },
    { id: 9, title: "Puzzle 9: Missing Sequence", comp: MissingSequenceGame },
    { id: 10, title: "Puzzle 10: Shape Question", comp: ShapesQuestionGame },
  ];

  const total = games.length;

  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(false);

  const GameComp = games[index]?.comp;

  // ✅ Score handler supports both forms: onScore(points) OR onScore(eventId, points)
  const handleScoreUpdate = (eventIdOrPoints: string | number, points?: number) => {
    if (typeof eventIdOrPoints === "number") {
      setScore((prev) => prev + eventIdOrPoints);
    } else if (typeof eventIdOrPoints === "string" && typeof points === "number") {
      setScore((prev) => prev + points);
    }
  };

  const handleNext = useCallback(() => {
    setCompleted((c) => c + 1);
    setIndex((i) => i + 1);
    setAttempted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleRetry = () => {
    setAttempted(false);
  };

  const finished = index >= total;
  const progressFraction = Math.max(0, Math.min(1, completed / total));

  return (
    <main className="min-h-screen bg-primary py-12 lg:py-24 px-4 flex items-center justify-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-wide text-white drop-shadow">
            FUN PUZZLE CHALLENGE
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
            <span className="text-2xl font-extrabold text-gray-800">{score}</span>
          </div>
        </div>

        {/* progress */}
        <div>
          <div className="flex justify-between mb-2 text-white/80 text-sm">
            {index < total && (
              <span>
                Puzzle {index + 1} of {total}
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

        {/* game content */}
        {!finished ? (
          <div>
            <h2 className="text-3xl tracking-wider font-semibold uppercase mb-6 text-white">{games[index].title}</h2>
            <GameComp onScore={handleScoreUpdate} onNext={handleNext} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            {((score / 10) / total) * 100 >= 50 ? (
              <h2 className="text-5xl font-semibold text-green-600">NICE WORK!</h2>
            ) : (
              <h2 className="text-5xl font-semibold text-red-500">TRY AGAIN!</h2>
            )}
            <p className="mt-4">
              You finished all puzzles. You scored{" "}
              <span className="font-extrabold">{score}</span> points.
            </p>
            <p className="text-6xl font-extrabold mt-4 p-6 w-fit mx-auto">{score}</p>
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
          Tip: Each puzzle awards points once. Your progress is saved while playing.
        </p>
      </div>
    </main>
  );
}
