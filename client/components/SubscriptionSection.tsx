"use client";

import React from "react";
import {
  Star,
  Download,
  BarChart3,
  ShieldCheck,
  ShoppingCart,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const planFeatures = [
  {
    icon: Star,
    title: "Unlimited access",
    desc: "All lessons, worksheets & quizzes.",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    icon: Download,
    title: "Offline downloads",
    desc: "Save PDFs & videos to study offline.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure & private",
    desc: "Kid-safe, privacy-first platform.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: BarChart3,
    title: "Parental monitoring",
    desc: "Track progress and get weekly reports.",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: Gamepad2,
    title: "Interactive games",
    desc: "Fun activities to reinforce learning.",
    color: "bg-purple-100 text-purple-600",
  },
];

export default function SubscriptionCard() {
  return (
    <section className="relative py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-gray-200 shadow-xl bg-white p-10 flex flex-col min-h-[600px] relative">
          {/* Header */}
          <div>
            <p className="text-lg font-semibold text-primary">
              All-access plan
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-gray-900 leading-tight">
              Unlock everything for{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                ₹300 / month
              </span>
            </h2>

            <p className="mt-4 text-gray-600 text-base max-w-2xl">
              One simple plan for students: lessons, worksheets, quizzes,
              progress tracking, and parental monitoring — all in one place.
              Cancel anytime.
            </p>
          </div>

          {/* Features */}
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {planFeatures.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <div className="mt-1">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${f.color}`}
                  >
                    <f.icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {f.title}
                  </p>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="mt-auto flex flex-col gap-2 md:flex-row items-center justify-between pt-10">
            <p className="text-xs text-gray-500">
              Monthly billing. Secure payments. No hidden fees.
            </p>
            <Button
              className="flex items-center gap-3 bg-gradient-to-b from-primary to-primary/80 text-white px-6 py-3 rounded-full shadow-lg text-lg min-w-[180px]"
              aria-label="Buy subscription for ₹300 per month"
              onClick={() => (window.location.href = "/checkout?plan=monthly")}
            >
              <ShoppingCart className="w-4 h-4" />
              Buy Now — ₹300 / month
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
