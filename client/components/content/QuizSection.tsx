"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play } from "lucide-react";
import { ContentItem } from "@/app/explore/[id]/page";

// Question type
type Question = {
  questionText: string;
  s3Key?: string;
  options: string[];
  correctOption: number;
  funFact?: string;
};

type QuizSectionProps = {
  content: ContentItem;
  onSubmitScore: (score: number) => void;
};

const POPPY_BTN =
  "bg-orange-500 border border-gray-700 text-white text-lg font-extrabold rounded-full px-6 py-3 shadow-[3px_5px_0_0_#111827] transition-all duration-300 hover:bg-orange-600 hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none";

const optionVariants: Variants = {
  initial: { opacity: 1, scale: 1 },
  wrong: {
    x: [0, -20, 20, -16, 16, -10, 10, 0],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
  chosenCorrect: { scale: [1, 1.1, 1], transition: { duration: 0.34 } },
};

export default function QuizSection({ content, onSubmitScore }: QuizSectionProps) {
  const router = useRouter();
  const questions: Question[] = content.questions || [];
  const total = questions.length;

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [selected, setSelected] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [lastWasCorrect, setLastWasCorrect] = useState<boolean | null>(null);
  const [feedbackIdx, setFeedbackIdx] = useState<number | null>(null);

  // Sounds
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null);
  const nextSoundRef = useRef<HTMLAudioElement | null>(null);
  const yaySoundRef = useRef<HTMLAudioElement | null>(null);
  const lostSoundRef = useRef<HTMLAudioElement | null>(null);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === "undefined") return;
    correctSoundRef.current = new Audio("/sounds/correct.mp3");
    wrongSoundRef.current = new Audio("/sounds/wrong.mp3");
    nextSoundRef.current = new Audio("/sounds/next.mp3");
    yaySoundRef.current = new Audio("/sounds/yay.mp3");
    lostSoundRef.current = new Audio("/sounds/lost.mp3");
    startSoundRef.current = new Audio("/sounds/start.mp3");
  }, []);

  const q = questions[current];

  const pickFeedbackIndex = (isCorrect: boolean) =>
    isCorrect ? Math.floor(Math.random() * 8) + 1 : Math.floor(Math.random() * 4) + 1;

  const handleSelect = (idx: number) => {
    if (attempted) return;
    const correct = idx === q.correctOption;
    setSelected(idx);
    setAttempted(true);
    setLastWasCorrect(correct);
    setFeedbackIdx(pickFeedbackIndex(correct));

    if (correct) {
      setScore((s) => s + 1);
      correctSoundRef.current?.play().catch(() => {});
    } else {
      wrongSoundRef.current?.play().catch(() => {});
    }
  };

  const handleNext = () => {
    nextSoundRef.current?.play().catch(() => {});
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAttempted(false);
      setLastWasCorrect(null);
      setFeedbackIdx(null);
    } else {
      setFinished(true);
      const finalScore = Math.round((score / total) * 100);
      if (finalScore >= 50) yaySoundRef.current?.play().catch(() => {});
      else lostSoundRef.current?.play().catch(() => {});
      onSubmitScore(finalScore);
    }
  };

  const handleRetry = () => {
    setSelected(null);
    setAttempted(false);
    setLastWasCorrect(null);
    setFeedbackIdx(null);
  };

  const handleRestart = () => {
    setStarted(false);
    setFinished(false);
    setScore(0);
    setCurrent(0);
    setSelected(null);
    setAttempted(false);
    setLastWasCorrect(null);
    setFeedbackIdx(null);
  };

  const renderMedia = (s3Key?: string) => {
    if (!s3Key) return null;
    const url = `${process.env.NEXT_PUBLIC_AWS_STORAGE_URL}/${s3Key}`;
    const ext = s3Key.split(".").pop()?.toLowerCase();

    if (!ext) return null;

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return (
        <Image
          width={400}
          height={400}
          src={url}
          alt="Question media"
          className="mt-4 rounded-xl max-h-72 object-contain mx-auto"
        />
      );
    }
    if (["mp3", "wav", "ogg"].includes(ext)) {
      return (
        <audio controls className="mt-4 w-full">
          <source src={url} type={`audio/${ext}`} />
        </audio>
      );
    }
    if (["mp4", "webm", "ogg"].includes(ext)) {
      return (
        <video
          controls
          className="mt-4 rounded-xl max-h-80 w-full object-contain mx-auto"
        >
          <source src={url} type={`video/${ext}`} />
        </video>
      );
    }
    return null;
  };

  const isCorrect = lastWasCorrect === true;
  const feedbackGraphic = useMemo(() => {
    if (feedbackIdx === null || lastWasCorrect === null) return null;
    return lastWasCorrect ? `/graphic/c${feedbackIdx}.svg` : `/graphic/w${feedbackIdx}.svg`;
  }, [feedbackIdx, lastWasCorrect]);

  // Finished screen
  if (finished) {
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 50;
    return (
      <section className="w-full bg-white rounded-3xl p-10 shadow-xl border border-slate-200 text-center">
        <h3 className={`text-3xl font-medium ${passed ? "text-emerald-600" : "text-rose-500"}`}>
          {passed ? "🎉 Yay! Great job!" : "😅 Better luck next time!"}
        </h3>
        <div
          className={`mt-6 mx-auto w-32 h-32 flex items-center justify-center rounded-full text-3xl font-bold shadow-inner ${
            passed ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
          }`}
        >
          {percentage}%
        </div>
        <p className="mt-4 text-lg text-slate-700">
          You scored <span className="font-semibold text-slate-900">{score}</span> out of {total}
        </p>
        <Button onClick={handleRestart} className="mt-8 px-6 py-3 text-xl rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-md">
          Restart Quiz
        </Button>
      </section>
    );
  }

  // Intro screen
  if (!started) {
    return (
      <section className="w-full bg-white rounded-2xl p-8 shadow-lg border border-slate-200 text-center">
        <h2 className="text-2xl font-semibold text-primary">Ready to Play?</h2>
        <p className="mt-4 text-slate-600">This quiz has <span className="font-medium">{total}</span> questions.</p>
        <Button
          size="lg"
          className="mt-6 w-fit mx-auto h-14 text-lg font-medium rounded-xl bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            setStarted(true);
            startSoundRef.current?.play().catch(() => {});
          }}
        >
          Start Quiz <Play height={20} width={20} fill="white" className="ml-4" />
        </Button>
      </section>
    );
  }

  // Question screen
  return (
    <section className="w-full bg-white rounded-2xl p-6 shadow-md border border-gray-200">
      <div className="mb-6">
        <Progress value={((current + 1) / total) * 100} />
        <p className="mt-2 text-sm text-slate-600">
          Question {current + 1} of {total}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT: Question + options + fun fact */}
        <div className="flex-1">
          <motion.h3
            className="text-xl md:text-3xl font-semibold tracking-wide text-gray-800 mb-4"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {q.questionText}
          </motion.h3>

          {renderMedia(q.s3Key)}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {q.options.map((opt, i) => {
              const chosen = selected === i;
              const correct = i === q.correctOption;

              let styleClass =
                "bg-gray-50 border border-gray-300 text-gray-800 hover:bg-gray-100";
              if (attempted) {
                if (chosen && correct) styleClass = "bg-green-600 text-white border-green-700";
                else if (chosen && !correct) styleClass = "bg-red-600 text-white border-red-700";
                else styleClass = "bg-gray-50 border-gray-200 text-gray-700";
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelect(i)}
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
                  className={`rounded-full p-4 text-base md:text-lg font-semibold transition-all duration-200 w-full text-left ${styleClass}`}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>

          {/* Fun Fact */}
          <AnimatePresence>
            {attempted && q.funFact && (
              <motion.div
                key="funfact"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={`mt-4 p-4 rounded-lg text-left border ${
                  isCorrect ? "border-green-400 bg-green-100" : "border-red-400 bg-red-100"
                }`}
              >
                <div className="font-semibold mb-1 text-gray-900">
                  {isCorrect ? "Correct!" : "Try again"}
                </div>
                <div className="text-sm text-gray-800">{q.funFact}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Buttons + cartoon/coin */}
        <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col items-center md:items-end gap-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button
              onClick={() => router.push("/fun-break/riddles")}
              className={`${POPPY_BTN} bg-gray-700 hover:bg-gray-800`}
            >
              Home
            </button>
            {attempted && !isCorrect && (
              <button onClick={handleRetry} className={`${POPPY_BTN} bg-red-500 hover:bg-red-600`}>
                Retry
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!attempted}
              className={`${POPPY_BTN} ${!attempted ? "opacity-60 pointer-events-none" : ""}`}
            >
              Next
            </button>
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {attempted && feedbackGraphic && (
              <motion.div
                key="cartoon"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full flex justify-center"
              >
                <div className="flex flex-row items-center justify-end gap-4">
                  <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center">
                    <Image
                      src={feedbackGraphic}
                      alt={isCorrect ? "correct" : "wrong"}
                      width={isCorrect ? 220 : 280}
                      height={isCorrect ? 220 : 280}
                      className="object-contain"
                    />
                  </div>
                  {isCorrect && (
                    <motion.div
                      initial={{ y: 18, opacity: 0, scale: 0.6 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="flex items-center gap-2 font-extrabold text-3xl text-gray-800"
                    >
                      <Image src="/graphic/coin.svg" alt="coin" width={50} height={50} />
                      +10
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
