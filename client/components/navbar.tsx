"use client";

import { useState } from "react";
import { ChevronDown, BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const menuItems = [
  {
    title: "For Students",
    items: [
      "Interactive Lessons",
      "Fun Quizzes",
      "Progress Tracking",
      "Achievement Badges",
    ],
  },
  {
    title: "For Teachers",
    items: [
      "Lesson Plans",
      "Student Analytics",
      "Content Library",
      "Assessment Tools",
    ],
  },
  {
    title: "For Parents",
    items: [
      "Progress Reports",
      "Learning Goals",
      "Time Management",
      "Safety Features",
    ],
  },
  {
    title: "Resources",
    items: ["Help Center", "Video Tutorials", "Community Forum", "Blog"],
  },
];

export default function Navbar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-1">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Image 
          src={'/logos/FULL LOGO HORIZONTAL COLOR.png'}
          width={200}
          height={100}
          alt="CampusLane"        
          />

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {menuItems.map((item) => (
              <div
                key={item.title}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.title)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button className="flex items-center space-x-1 px-4 py-2 text-gray-700 hover:text-indigo-500 font-medium text-md transition-colors duration-200 rounded-full hover:bg-indigo-50">
                  <span>{item.title}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {hoveredItem === item.title && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 transform transition-all duration-200 ease-out">
                    {item.items.map((subItem) => (
                      <a
                        key={subItem}
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
                      >
                        {subItem}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-gray-700 rounded-full"
            >
              Sign In
            </Button>
            <Button className="bg-gradient-to-b from-indigo-500 to-indigo-700 text-white px-6 rounded-full hover:scale-105 duration-300 transition-all">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 rounded-b-2xl shadow-lg">
            {menuItems.map((item) => (
              <div key={item.title} className="py-2">
                <div className="font-semibold text-gray-900 px-4 py-2">
                  {item.title}
                </div>
                {item.items.map((subItem) => (
                  <a
                    key={subItem}
                    href="#"
                    className="block px-8 py-2 text-sm text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg"
                  >
                    {subItem}
                  </a>
                ))}
              </div>
            ))}
            <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-gray-100">
              <Button variant="ghost" className="w-full text-gray-700 rounded-full">
                Sign In
              </Button>
              <Button className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full shadow-md">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
