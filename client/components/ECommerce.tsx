"use client";

import React from "react";
import { ShoppingCart, Package, Gift, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const ecommerceFeatures = [
  {
    icon: Package,
    title: "Curated Store",
    desc: "Hand-picked books, stationery, and digital tools for every learner.",
    color: "text-primary",
  },
  {
    icon: Gift,
    title: "Exclusive Discounts",
    desc: "Special offers for students and parents inside the platform.",
    color: "text-blue-600",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Get your study materials delivered to your doorstep quickly.",
    color: "text-pink-600",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "Multiple payment options with encrypted checkout for peace of mind.",
    color: "text-green-600",
  },
];

export default function EcommerceSection() {
  return (
    <section className="relative py-20 bg-primary">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="rounded-3xl shadow-2xl bg-card p-10 flex flex-col min-h-[500px] relative">
          {/* Header */}
          <div className="text-center sm:text-left">
            <p className="text-lg font-medium text-gray-700">
              CampusLane Store
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-medium leading-tight">
              Learning Made Easier with{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Built-in Ecommerce
              </span>
            </h2>

            <p className="mt-4 text-gray-600 text-base max-w-2xl">
              Browse and shop books, stationery, and digital resources—all in one
              place. CampusLane makes it simple to get everything you need to
              support your learning journey.
            </p>
          </div>

          {/* Features */}
          <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ecommerceFeatures.map((f) => (
              <li
                key={f.title}
                className="bg-white border rounded-2xl p-6 shadow hover:shadow-xl transition flex flex-col items-start"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 mb-4 ${f.color}`}
                >
                  <f.icon className="w-6 h-6" />
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {f.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">{f.desc}</p>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="mt-auto flex flex-col gap-4 md:flex-row items-center justify-between pt-12 border-t border-white/10">
            <p className="text-sm text-white/70 text-center md:text-left">
              Shop smart, save time, and stay focused on learning.
            </p>
            <Button
              className="flex items-center gap-3 bg-white border border-primary text-primary px-6 py-3 rounded-full text-lg min-w-[180px] hover:text-white hover:scale-105 transition"
              aria-label="Visit CampusLane store"
              onClick={() => (window.location.href = "/store")}
            >
              <ShoppingCart className="w-5 h-5" />
              Visit Store
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
