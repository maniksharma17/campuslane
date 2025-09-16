"use client";

import React, { useMemo } from "react";
import DailyRiddleTemplate from "@/components/fun-break/riddles/DailyRiddleTemplate";
import { DAILY_RIDDLES } from "@/data/riddles/daily";
import { motion } from "framer-motion";

const DailyRiddlePage = () => {
  const todayRiddle = useMemo(() => {
    // Get today as YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);

    // Create a deterministic number from today's string
    const hash = today
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Pick one riddle using the hash
    const index = hash % DAILY_RIDDLES.length;
    return DAILY_RIDDLES[index];
  }, []);

  return (
    <main className="min-h-screen bg-primary flex items-center justify-center py-12">
      <div className="flex-col gap-8 items-center justify-center">
        <motion.h1
          className="lg:text-6xl text-4xl text-center mb-12 tracking-wider font-extrabold text-white drop-shadow"
          initial={{ opacity: 0, scale: 0.8, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          DAILY RIDDLE
        </motion.h1>
        <DailyRiddleTemplate
          riddle={todayRiddle.riddle}
          options={todayRiddle.options}
          answer={todayRiddle.answer}
          funFact={todayRiddle.funFact}
        />
      </div>
    </main>
  );
};

export default DailyRiddlePage;
