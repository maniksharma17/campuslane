"use client";

import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

const RiddlesPage = () => {
  const cards = [
    { src: "/folder/fun-riddles.png", href: '/fun-tricky-riddles' },
    { src: "/folder/math-riddles.png", href: '/math-riddles' },
    { src: "/folder/nature-riddles.png", href: '/nature-riddles' },
    { src: "/folder/word-riddles.png", href: '/word-riddles' },
  ];
  const router = useRouter();
  // Skeleton loading state
  const [loadedImages, setLoadedImages] = useState<boolean[]>(
    Array(cards.length).fill(false)
  );

  return (
    <main className="min-h-screen bg-primary">
      <section className="flex flex-col gap-10 items-center justify-center py-8 lg:py-16 lg:px-20 lg:max-w-5xl mx-auto">
        {/* Heading */}
        <motion.h1
          className="lg:text-7xl text-4xl tracking-wider font-extrabold text-white drop-shadow"
          initial={{ opacity: 0, scale: 0.8, y: -40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          RIDDLE TIME!
        </motion.h1>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link href={'riddles/daily'}>
          <Button
            className="bg-orange-500 border border-gray-700 text-white text-xl p-6 font-extrabold rounded-full 
             shadow-[3px_5px_0_0_#111827] 
             transition-all duration-300 
             hover:bg-font-600
             hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none "
          >
            Solve Daily Riddle
          </Button>
          </Link>
          
        </motion.div>

        {/* Responsive smaller cards */}
        <motion.div
          className="grid grid-cols-2 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.15 },
            },
          }}
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              className="flex aspect-video items-center justify-center rounded-2xl shadow-lg 
                        border border-gray-200 hover:scale-105 hover:drop-shadow-lg transition-all duration-300 cursor-pointer mx-auto relative overflow-hidden"
              variants={{
                hidden: { opacity: 0, scale: 0.9, y: 30 },
                visible: { opacity: 1, scale: 1, y: 0 },
              }}
              whileHover={{ scale: 1.08, rotate: -1 }}
              onClick={()=>{router.push(`riddles/${card.href}`)}}
            >
              {/* Skeleton */}
              {!loadedImages[idx] && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-2xl" />
              )}
              <Image
                src={card.src}
                alt="Riddle Category"
                width={800}
                height={800}
                className="object-contain rounded-2xl"
                onLoadingComplete={() =>
                  setLoadedImages((prev) => {
                    const updated = [...prev];
                    updated[idx] = true;
                    return updated;
                  })
                }
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
};

export default RiddlesPage;
