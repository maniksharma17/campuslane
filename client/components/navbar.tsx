"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

const menuItems = [
  {
    title: "For Students",
    items: [
      "Interactive Lessons",
      "Fun Quizzes",
      "Progress Tracking",
    ],
  },
  {
    title: "For Teachers",
    items: [
      "Student Analytics",
      "Content Library",
    ],
  },
  {
    title: "For Parents",
    items: [
      "Progress Reports",
      "Subscription Plans"
    ],
  },
  {
    title: "Resources",
    items: ["Help Center", "Commmnity Forum", "Blog"],
  },
];

export default function Navbar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // your auth store - expects { user, isAuthenticated, signOut? }
  const { user, isAuthenticated, logout } = useAuthStore();

  const userName = (user?.name || user?.name || "User").toString();
  const avatarLetter = userName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = async () => {
    try {
      // if store provides signOut, call it
      if (typeof logout === "function") await logout();
      // then navigate to home or auth page
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/");
    }
  };

  return (
    <nav className="bg-white fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-1">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/explore" className="flex items-center">
            <Image
              src={"/logos/FULL LOGO HORIZONTAL COLOR.png"}
              width={200}
              height={100}
              alt="CampusLane"
              priority
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {menuItems.map((item) => (
              <div key={item.title} className="relative group">
                <button
                  type="button"
                  className="flex items-center space-x-1 px-4 py-2 text-gray-700 
                   hover:text-indigo-500 font-medium text-md 
                   transition-colors duration-200 rounded-full hover:bg-indigo-50"
                >
                  <span>{item.title}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Dropdown appears when parent is hovered */}
                <div
                  className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl 
                   border border-gray-100 py-3 z-40 opacity-0 invisible 
                   group-hover:opacity-100 group-hover:visible 
                   transition-all duration-200 ease-out"
                >
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
              </div>
            ))}
          </div>

          {/* CTA / Profile (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" className="text-gray-700 rounded-full">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button className=" bg-primary text-white px-6 rounded-full hover:scale-105 duration-300 transition-all">
                  <Link href="/auth">Get Started</Link>
                </Button>
              </>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((s) => !s)}
                  className="flex items-center space-x-3 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                    {avatarLetter}
                  </div>
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                    {userName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-40">
                    <Link href="/profile">
                      <p className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">
                        Profile
                      </p>
                    </Link>
                    {user?.role === "teacher" && (
                      <Link href="/dashboard/classes">
                        <p className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50">
                          Dashboard
                        </p>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
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
              {!isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full text-gray-700 rounded-full"
                  >
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full shadow-md">
                    <Link href="/auth/register">Get Started</Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-3 px-2">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                    {avatarLetter}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {userName}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{user?.name || user?.email?.split("@")[0]}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
