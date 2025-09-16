"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type RiddleProps = {
  riddle: string;
  options: string[];
  answer: string;
  funFact: string;
  onAttempt?: () => void; 
};

const DailyRiddleTemplate: React.FC<RiddleProps> = ({
  riddle,
  options,
  answer,
  funFact,
  onAttempt,
}) => {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  // preload sounds
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);

  if (!correctSoundRef.current) {
    correctSoundRef.current = new Audio("/sounds/correct.mp3");
  }
  if (!wrongSoundRef.current) {
    wrongSoundRef.current = new Audio("/sounds/wrong.mp3");
  }

  const handleSelect = (option: string) => {
    if (attempted) return;
    setSelected(option);
    setAttempted(true);
    onAttempt?.();

    if (option === answer) correctSoundRef.current?.play();
    else wrongSoundRef.current?.play();
  };

  const isCorrect = selected === answer;
  const handleRetry = () => {
    setSelected(null);
    setAttempted(false);
  };

  // Pick a random cartoon graphic for feedback
  const feedbackGraphic = isCorrect
    ? `/graphic/c${Math.floor(Math.random() * 8) + 1}.svg`
    : `/graphic/w${Math.floor(Math.random() * 4) + 1}.svg`;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg p-10 flex flex-col gap-8 border border-gray-200">
      {/* Riddle Question */}
      <motion.h2
        className="text-3xl lg:text-4xl font-semibold tracking-wide text-gray-800 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {riddle}
      </motion.h2>

      {/* Options */}
      <div className="grid grid-cols-2 gap-6">
        {options.map((option, idx) => {
          const isChosen = selected === option;
          const correct = option === answer;

          return (
            <motion.button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full border p-5 text-lg font-semibold transition-all duration-200 shadow-sm
                ${
                  !selected
                    ? "bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100 hover:shadow-md"
                    : isChosen
                    ? correct
                      ? "bg-green-500 text-white border-green-600"
                      : "bg-red-500 text-white border-red-600"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>

      {/* After attempt */}
      <AnimatePresence>
        {attempted && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            {/* Cartoon + Reward */}
            <div className="flex items-center gap-4">
              <Image
                src={feedbackGraphic}
                alt={isCorrect ? "Correct" : "Wrong"}
                width={250}
                height={250}
                className="object-contain"
              />
              {isCorrect && (
                <motion.div
                  key="reward"
                  initial={{ y: 40, opacity: 0, scale: 0.5 }}
                  animate={{ y: -10, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex items-center gap-2 font-extrabold text-2xl text-gray-800"
                >
                  <Image
                    src="/graphic/coin.svg"
                    alt="coin"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                  +10
                </motion.div>
              )}
            </div>

            {/* Fun Fact */}
            <div className="w-full p-6 rounded-2xl text-center font-medium text-gray-700 bg-gray-50 border border-gray-200 shadow-inner">
              {isCorrect ? (
                <span className="block text-green-600 text-lg font-bold mb-2">
                  Correct!
                </span>
              ) : (
                <span className="block text-red-600 text-lg font-bold mb-2">
                  Oops! Try again.
                </span>
              )}
              <div className="text-base text-gray-600">{funFact}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-4">
              {!isCorrect && (
                <button
                  onClick={handleRetry}
                  className="bg-red-500 text-white text-lg tracking-wide font-bold rounded-full px-8 py-4
                             shadow-[3px_5px_0_0_#111827] 
                             transition-all duration-300
                             hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => router.back()}
                className="bg-orange-500 text-white tracking-wide text-lg font-bold rounded-full px-8 py-4
                           shadow-[3px_5px_0_0_#111827] 
                           transition-all duration-300
                           hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
              >
                Home
              </button>
            </div>

            {/* Info note */}
            <p className="text-sm text-gray-500 mt-4">
              You already attempted today&apos;s riddle, so no more points will be
              given.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyRiddleTemplate;
