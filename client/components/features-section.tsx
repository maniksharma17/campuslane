"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, BarChart3, Shield, Gamepad2, Trophy, BookOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Clock,
    title: "Learn Anytime",
    description:
      "Access fun lessons 24/7 from anywhere! Perfect for after school, weekends, or whenever inspiration strikes.",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    icon: BookOpen,
    title: "Teacher Content",
    description:
      "Curriculum-aligned lessons created by experienced educators. High-quality content that makes learning exciting!",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description:
      "Watch your child grow with detailed progress reports and achievement tracking that celebrates every milestone!",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description:
      "Kid-safe platform with parental controls and privacy protection. Learn with confidence in a secure environment.",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: Gamepad2,
    title: "Gamified Learning",
    description:
      "Earn points, unlock badges, and level up! Learning becomes an adventure with our game-based approach.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description: "Celebrate amazing success with digital certificates, colorful badges, and fun rewards that motivate continued learning!",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: Users,
    title: "Parent Monitoring",
    description:
      "Stay connected with real-time updates on your child’s learning journey and engage with their education.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description:
      "Personalized learning paths that adapt to each child’s pace and style for optimal educational outcomes.",
    color: "bg-teal-100 text-teal-600",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4">
            Why Kids{" "}
            <span className="bg-gradient-to-r font-extrabold from-red-300 to-pink-300 bg-clip-text text-transparent">
              Love
            </span>{" "}
            Learning Here
          </h2>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            Discover what makes our platform fun, safe, and engaging for kids — and empowering for parents and teachers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-8">
          {features.map((feature) => (
            <div key={feature.title}>
              <Card className="bg-white border border-indigo-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 flex flex-col items-start">
                  <div className={`p-4 rounded-2xl flex items-center justify-center mb-4 shadow-inner ${feature.color}`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <p className="text-xl font-bold text-indigo-900 mb-2">
                    {feature.title}
                  </p>
                  <p className="text-indigo-800/80 leading-relaxed tracking-wide text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
