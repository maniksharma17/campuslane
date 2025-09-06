"use client";

import Image from "next/image";

export default function DownloadAppPage() {
  return (
    <main
      className="bg-white sm:min-h-screen flex flex-col border-t lg:bg-cover lg:bg-center"
      style={{
        backgroundImage: "url('/bg-4.png')",
      }}
    >
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-center lg:text-left">
          {/* Left: Logo + Text + CTAs */}
          <div className="flex flex-col items-center lg:items-start">
            {/* Logo */}
            <Image
              src="/logos/FULL LOGO VERTICAL COLOR.png"
              alt="CampusLane Logo"
              width={220}
              height={120}
              className="mb-8"
              priority
            />

            <h1 className="text-4xl md:text-5xl font-semibold bg-gradient-to-r from-indigo-500 to-indigo-700 bg-clip-text text-transparent leading-tight">
              Learn Anywhere, Anytime
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-lg">
              Download the <span className="font-semibold">CampusLane</span> app for{" "}
              <span className="text-indigo-600">Android</span> and{" "}
              <span className="text-purple-600">iOS</span>.  
              Access lessons, worksheets, quizzes, progress tracking, and parental monitoring on the go.
            </p>

            {/* Store Buttons */}
            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
              <a
                href="#"
                aria-label="Download CampusLane on Google Play"
                className="flex items-center gap-3 bg-gray-50 border text-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
              >
                <Image
                  src="/google-play.png"
                  alt="Google Play"
                  width={28}
                  height={28}
                />
                <span className="text-sm font-medium">Get it on Google Play</span>
              </a>

              <a
                href="#"
                aria-label="Download CampusLane on App Store"
                className="flex items-center gap-3 bg-gray-50 border text-black px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition"
              >
                <Image
                  src="/app-store.png"
                  alt="App Store"
                  width={28}
                  height={28}
                />
                <span className="text-sm font-medium">Download on the App Store</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
