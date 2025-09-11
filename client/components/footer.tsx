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
  { icon: Facebook, href: "#", label: "Facebook", hover: "hover:text-blue-500" },
  { icon: Twitter, href: "#", label: "Twitter", hover: "hover:text-sky-400" },
  { icon: Instagram, href: "#", label: "Instagram", hover: "hover:text-pink-500" },
  { icon: Youtube, href: "#", label: "YouTube", hover: "hover:text-red-500" },
];

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-primary via-primary/95 to-primary/90 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-r from-primary/60 via-secondary/40 to-pink-400 rounded-full blur-[180px] opacity-20" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-r from-secondary/50 via-yellow-200 to-pink-300 rounded-full blur-[200px] opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:px-12 lg:py-24 space-y-16">
        {/* CTA Panel */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-xl shadow-xl p-6 md:p-10 lg:p-14">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/20 ring-1 ring-white/30 shadow-md">
                <BookOpen className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl lg:text-3xl font-bold text-white">
                  Smarter Learning Starts Here
                </p>
                <p className="mt-2 text-base text-white/80 max-w-xl">
                  Join thousands of students and parents using CampusLane to stay ahead. 
                  One subscription gives you unlimited access to interactive lessons, 
                  real-time progress tracking, and expert-designed worksheets.
                </p>
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button className="text-base md:text-lg bg-white text-primary font-medium py-3 px-6 rounded-full hover:bg-primary hover:text-white hover:shadow-lg duration-300 transition-all w-full sm:w-auto">
                Get Started
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
            <p className="text-sm leading-relaxed text-white/70 max-w-sm">
              Learning that fits your life. No distractions, no fluff—just 
              quality education that works for students, parents, and teachers.
            </p>
          </div>

          {/* Dynamic link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold mb-4">{title}</h4>
              <ul className="space-y-3 text-sm">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-white/70 hover:text-white transition-colors"
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
          <div className="text-xs md:text-sm text-white/60 flex flex-col md:flex-row md:items-center gap-3">
            <span>© 2025 CampusLane. All rights reserved.</span>
            <span className="hidden md:inline text-white/40">•</span>
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

          {/* Social */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label, hover }, i) => (
              <a
                key={i}
                href={href}
                aria-label={label}
                className={`text-white/80 ${hover} transition-transform hover:-translate-y-0.5`}
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
