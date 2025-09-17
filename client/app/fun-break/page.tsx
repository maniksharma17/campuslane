"use client";
import { useAuthStore } from "@/lib/store/auth";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import Footer from "@/components/footer";

const FunBreakPage = () => {
  const { user } = useAuthStore();

  // card animations (staggered fade/scale-in)
  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  };

  return (
    <main className="min-h-screen bg-primary">
      <section className="flex flex-col gap-10 items-center justify-center py-8 lg:py-24 lg:px-20 max-w-5xl mx-auto">
        
        {/* Headings */}
        <motion.div
          className="space-y-2 text-center"
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {user && (
            <h1 className="lg:text-4xl text-2xl font-medium text-white drop-shadow">
              Hi, {user?.name.split(" ")[0]}
            </h1>
          )}
          <motion.h1
            className="lg:text-7xl text-4xl font-extrabold tracking-wide text-white drop-shadow mb-12"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
          >
            LET&apos;S HAVE FUN !
          </motion.h1>
        </motion.div>

        {/* Responsive smaller cards */}
        <div className="grid grid-cols-2 gap-6">
          {[
            { src: "/folder/riddle-cover.png", href: "riddles" },
            { src: "/folder/puzzles-cover.png", href: "puzzles" },
            { src: "/folder/jokes-cover.png", href: "jokes" },
            { src: "/folder/tongue-twisters-cover.png", href: "tongue-twisters" },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              className="flex aspect-video items-center justify-center rounded-2xl shadow-lg 
                        border border-gray-200 hover:drop-shadow-lg transition-all duration-300 cursor-pointer
                        mx-auto"
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.08, rotate: -1 }}
            >
              <Link href={`/fun-break/${card.href}`}>
                <Image
                  src={card.src}
                  alt="Fun Break"
                  width={400}
                  height={400}
                  className="object-contain rounded-2xl"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default FunBreakPage;
