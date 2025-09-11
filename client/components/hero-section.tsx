"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center bg-cover bg-center
                 bg-[url('/hero-mobile.png')] lg:bg-[url('/hero.png')]"
    >
      {/* Blurred Mesh Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top-left blob - Bigger & Softer */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-gradient-to-r from-primary/30 via-purple-300 to-pink-300 rounded-full blur-[180px] opacity-60" />

        {/* Bottom-right blob - Bigger & Softer */}
        <div className="absolute bottom-[-20%] right-[-20%] w-[700px] h-[400px] bg-gradient-to-r from-orange-300 via-yellow-200 to-pink-200 rounded-full blur-[200px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 lg:pt-10">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[70vh]">
          {/* LEFT: Text Content */}
          <div className="space-y-6 text-left">
            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-medium leading-tight text-gray-900">
              Where{" "}
              <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                Learning
              </span>{" "}
              Feels Like Playtime!
            </h1>

            {/* Subheading */}
            <p className="alt-font text-xl sm:text-2xl lg:text-3xl text-orange-600 font-semibold tracking-wide">
              Your all-in-one hub for smarter learning.
            </p>

            {/* Supporting text */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-800 font-medium leading-relaxed max-w-lg">
              Interactive lessons make learning fun and effortless — with
              teachers uploading engaging content and parents tracking progress
              in real time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth">
                <Button className="text-lg sm:text-2xl bg-gradient-to-b from-primary to-indigo-800 font-medium text-white px-6 py-3 sm:px-10 sm:py-6 rounded-full hover:scale-105 duration-300 transition-all">
                  Get Started
                </Button>
              </Link>

              <Button className="text-lg sm:text-2xl bg-gradient-to-b from-orange-500 to-orange-700 text-white font-medium px-6 py-3 sm:px-10 sm:py-6 rounded-full hover:scale-105 duration-300 transition-all">
                Browse Activities
              </Button>
            </div>
          </div>

          {/* RIGHT: Empty space for illustration */}
          <div className="hidden lg:block"></div>
        </div>
      </div>
    </section>
  );
}
