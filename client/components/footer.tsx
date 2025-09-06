"use client";
import { BookOpen, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";

const footerLinks = {
  Platform: ["Students", "Teachers", "Parents"],
  Resources: ["Help Center", "Tutorials", "Community", "Blog"],
  Company: ["About", "Careers", "Press", "Contact"],
};

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-500" },
  { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-sky-500" },
  { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-pink-500" },
  { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-500" },
];

export default function Footer() {
  return (
    <footer className="relative bg-indigo-600 text-white">
      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:px-12 lg:py-24 space-y-16">
        
        {/* CTA Panel */}
        <section className="rounded-3xl border border-white/10 bg-gray-50 backdrop-blur p-6 md:p-10 lg:p-14">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            
            {/* Left */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500 ring-1 ring-indigo-400/30">
                <BookOpen className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-black">
                  Learn smarter with CampusLane
                </p>
                <p className="mt-2 text-sm md:text-base text-gray-700 max-w-xl">
                  Interactive lessons, worksheets, quizzes, and progress insights—built for students,
                  teachers, and parents. Simple pricing, private by design.
                </p>
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button className="text-base md:text-lg bg-gradient-to-b from-indigo-500 to-indigo-700 font-medium text-white py-3 px-6 rounded-full hover:scale-105 duration-300 transition-all w-full sm:w-auto">
                Join us
              </Button>
              <Button className="text-base md:text-lg bg-gradient-to-b from-orange-500 to-orange-700 text-white font-medium py-3 px-6 rounded-full hover:scale-105 duration-300 transition-all w-full sm:w-auto">
                Explore
              </Button>
            </div>
          </div>
        </section>

        {/* Link Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src={"/logos/FULL LOGO VERTICAL WHITE.png"}
              width={180}
              height={100}
              alt="CampusLane"
              className="mb-4"
              priority
            />
            <p className="text-sm leading-relaxed text-gray-200 max-w-sm">
              Making learning fun and accessible for students, teachers, and parents.
            </p>
          </div>

          {/* Dynamic link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-medium mb-4">{title}</h4>
              <ul className="space-y-3 text-sm">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-200 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Bottom Bar */}
        <section className="border-t border-white/10 pt-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left */}
          <div className="text-xs md:text-sm text-gray-200 flex flex-col md:flex-row md:items-center gap-3">
            <span>© 2025 CampusLane. All rights reserved.</span>
            <span className="hidden md:inline text-gray-400">•</span>
            <nav className="flex flex-wrap gap-4">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="/cookies" className="hover:text-white transition-colors">
                Cookie settings
              </a>
            </nav>
          </div>

          {/* Right - Social */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label, color }, i) => (
              <a
                key={i}
                href={href}
                aria-label={label}
                className={`text-white ${color} transition-colors hover:-translate-y-0.5 will-change-transform`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </footer>
  );
}
