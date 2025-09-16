"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import useSound from "use-sound";
import Image from "next/image";
import { ContentItem } from "@/app/explore/[id]/page";
import { Play } from "lucide-react";

type Question = {
  questionText: string;
  s3Key?: string;
  options: string[];
  correctOption: number;
};

type QuizSectionProps = {
  content: ContentItem;
  onSubmitScore: (score: number) => void;
};

export default function QuizSection({
  content,
  onSubmitScore,
}: QuizSectionProps) {
  const questions = content.questions || [];
  const total = questions.length;

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // Sounds
  const [playCorrect] = useSound("/sounds/correct.mp3");
  const [playWrong] = useSound("/sounds/wrong.mp3");
  const [playNext] = useSound("/sounds/next.mp3");
  const [playYay] = useSound("/sounds/yay.mp3");
  const [playBetterLuck] = useSound("/sounds/lost.mp3");
  const [playStart] = useSound("/sounds/start.mp3");

  const handleAnswer = (index: number) => {
    const isCorrect = index === questions[current].correctOption;
    if (isCorrect) {
      playCorrect();
      setScore((s) => s + 1);
    } else {
      playWrong();
    }

    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      playNext();
    } else {
      setFinished(true);
      const finalScore = Math.round(
        ((score + (isCorrect ? 1 : 0)) / total) * 100
      );

      if (finalScore >= 50) {
        playYay();
      } else {
        playBetterLuck();
      }

      onSubmitScore(finalScore);
    }
  };

  // Detect media type from file extension
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
          Your browser does not support the audio element.
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
          Your browser does not support the video tag.
        </video>
      );
    }

    return null;
  };

  // Finished screen
  if (finished) {
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 50;

  return (
    <section className="w-full bg-white rounded-3xl p-10 shadow-xl border border-slate-200 text-center">
      {/* Heading with emoji */}
      <h3
        className={`text-3xl font-medium ${
          passed ? "text-emerald-600" : "text-rose-500"
        }`}
      >
        {passed ? "🎉 Yay! Great job!" : "😅 Better luck next time!"}
      </h3>

      {/* Score card */}
      <div
        className={`mt-6 mx-auto w-32 h-32 flex items-center justify-center rounded-full text-3xl font-bold shadow-inner ${
          passed
            ? "bg-emerald-100 text-emerald-600"
            : "bg-rose-100 text-rose-600"
        }`}
      >
        {percentage}%
      </div>

      {/* Details */}
      <p className="mt-4 text-lg text-slate-700">
        You scored{" "}
        <span className="font-semibold text-slate-900">{score}</span> out of{" "}
        {total}
      </p>

      {/* Restart */}
      <Button
        className="mt-8 px-6 py-3 text-xl rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-md"
        onClick={() => {
          setStarted(false);
          setFinished(false);
          setScore(0);
          setCurrent(0);
        }}
      >
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
        <p className="mt-4 text-slate-600">
          This quiz has <span className="font-medium">{total}</span> questions.
        </p>
        <Button
          size="lg"
          className="mt-6 w-fit mx-auto h-14 text-lg font-medium rounded-xl bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            setStarted(true);
            playStart();
          }}
        >
          Start Quiz{" "}
          <Play height={20} width={20} fill="white" className="ml-4" />
        </Button>
      </section>
    );
  }

  // Quiz content
  const q = questions[current];
  return (
    <section className="w-full bg-white rounded-2xl p-8 shadow-lg border border-slate-200 flex flex-col justify-center">

      {/* Progress bar */}
      <div className="mt-4">
        <Progress value={((current + 1) / total) * 100} />
        <p className="mt-2 text-sm text-slate-600">
          Question {current + 1} of {total}
        </p>
      </div>

      {/* Question */}
      <div className="mt-6">
        <p className="text-lg font-medium text-slate-900">{q.questionText}</p>
        {renderMedia(q.s3Key)}
      </div>

      {/* Options */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            className={`
        w-full h-16 px-4
        flex items-center justify-center text-center
        text-md sm:text-lg font-semibold
        rounded-2xl
        bg-primary text-white
        hover:scale-105 hover:shadow-lg
        focus:outline-none focus:ring-4 focus:ring-pink-300
        transition-transform duration-200 ease-out
      `}
          >
            {opt}
          </button>
        ))}
      </div>
    </section>
  );
}
