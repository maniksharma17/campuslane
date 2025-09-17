"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export type Joke = {
  id: string;
  content: string;
  explanation: string;
  developerInstruction: string;
  video: string;
};

type Props = {
  data: Joke;
  onNext?: () => void;
  nextLabel?: string;
  homeLabel?: string;
};

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

export default function JokeTemplate({
  data,
  onNext,
  nextLabel = "Next Joke",
  homeLabel = "Home",
}: Props) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);

  // sound for joke reveal
  const laughSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!laughSoundRef.current && typeof Audio !== "undefined") {
      laughSoundRef.current = new Audio("/sounds/laugh.mp3");
    }
  }, []);

  const handleReveal = () => {
    setRevealed(true);
    laughSoundRef.current?.play().catch(() => {});
  };

  const handleNextInternal = () => {
    setRevealed(false);
    onNext?.();
  };

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-md border border-gray-200">
      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT COLUMN - Joke content */}
        <div className="flex-1 p-6">
          <motion.h3
            className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-6"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            {data.content.split("?")[0] + "?"}
          </motion.h3>

          {!revealed ? (
            <motion.div className="space-x-2">
              <motion.button
                onClick={handleReveal}
                whileTap={{ scale: 0.95 }}
                className={`${POPPY_BTN} bg-blue-500 hover:bg-blue-600`}
              >
                Reveal Punchline
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/fun-break/jokes")}
                className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}
              >
                {homeLabel}
              </motion.button>
              
            </motion.div>
          ) : (
            <AnimatePresence>
              {revealed && (
                <motion.div
                  key="punchline"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.32 }}
                  className="my-4 p-4 rounded-lg text-left border border-green-400 bg-green-100"
                >
                  <div className="font-semibold mb-2 text-gray-900">
                    Punchline
                  </div>
                  <div className="text-lg text-gray-800">
                    {data.content.split("?")[1]?.trim()}
                  </div>

                  {/* Explanation */}
                  <div className="mt-3 text-sm text-gray-700">
                    <strong>Why it’s funny: </strong>
                    {data.explanation}
                  </div>
                </motion.div>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/fun-break/jokes")}
                className={`${POPPY_BTN} mr-4`}
              >
                {homeLabel}
              </motion.button>
              
            </AnimatePresence>
          )}
        </div>

        {/* RIGHT COLUMN - Video + controls */}
        <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col items-center gap-6">
          {/* Buttons */}

          {/* Joke video */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                key="video-block"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.32 }}
                className="w-full h-full flex justify-center"
              >
                <video
                  src={`${data.video}`}
                  autoPlay
                  loop
                  muted={false}
                  playsInline
                  className="aspect-video rounded-r-xl object-cover"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
