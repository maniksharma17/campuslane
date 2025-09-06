"use client";

import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center bg-cover bg-center
                 bg-[url('/hero-mobile.png')] lg:bg-[url('/hero.png')]"
    >

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:pt-10 flex items-center justify-center">
        <div className="max-w-2xl text-center space-y-6">
          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight text-gray-900">
            Welcome to <br />
            <span className="bg-gradient-to-r from-indigo-400 to-blue-600 bg-clip-text text-transparent">
              Campus Lane
            </span>
          </h1>

          {/* Subheading */}
          <p className="alt-font text-xl sm:text-2xl lg:text-3xl text-orange-500 font-semibold tracking-wide">
            Learn, Play, Share – All in One Place!
          </p>

          {/* Supporting text */}
          <p className="text-base sm:text-lg lg:text-xl max-w-xl mx-auto text-gray-800 font-medium leading-relaxed">
            Interactive learning games, downloadable worksheets, and a platform
            for teachers to share knowledge.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-sm:px-8 lg:pt-6 mx-auto">
            <Button className="text-lg sm:text-2xl bg-gradient-to-b from-indigo-500 to-indigo-700 font-medium text-white px-6 py-3 sm:px-10 sm:py-6 rounded-full hover:scale-105 duration-300 transition-all">
              Join us
            </Button>

            <Button className="text-lg sm:text-2xl bg-gradient-to-b from-orange-500 to-orange-700 text-white font-medium px-6 py-3 sm:px-10 sm:py-6 rounded-full hover:scale-105 duration-300 transition-all">
              Explore
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
