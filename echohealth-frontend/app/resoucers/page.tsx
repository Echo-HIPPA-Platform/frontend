"use client";

import React, { useState, useEffect } from 'react';
// FIX: Added icons needed for the navigation bar
import { BookOpen, FileText, ExternalLink, Heart, Menu, X } from "lucide-react";
import Link from "next/link";

export default function Resources() {
  // --- FIX: Added state and effect for the mobile navigation menu ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Prevent background page scrolling when the mobile menu is open
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function to reset scroll on component unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  // Helper array for navigation links to keep the code DRY
  const navLinks = [
    { href: "/#services", label: "Services" },
    { href: "/#testimonials", label: "Stories" },
    { href: "/#contact", label: "Contact" },
    { href: "/resources", label: "Resources" },
  ];
  // --- END OF FIX ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      
      {/* --- FIX: Added Navigation Bar --- */}
      <nav className="relative z-20 flex justify-between items-center px-4 sm:px-8 md:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Echo Psychology
          </h1>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link key={link.label} href={link.href} className="text-slate-600 hover:text-emerald-600 transition-colors">
              {link.label}
            </Link>
          ))}
          <Link href="/auth/login" className="bg-emerald-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-emerald-600 transition-colors text-sm">
            Sign In
          </Link>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
            <Menu className="w-8 h-8 text-slate-700" />
          </button>
        </div>
      </nav>
      
      {/* FIX: Added Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white z-50 transform ${isMenuOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out md:hidden`}>
          <div className="flex justify-end p-6">
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                  <X className="w-8 h-8 text-slate-700" />
              </button>
          </div>
          <div className="flex flex-col items-center justify-center h-full gap-8 -mt-16 text-2xl font-semibold">
              {navLinks.map(link => (
                  <Link key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-slate-700 hover:text-emerald-600">
                      {link.label}
                  </Link>
              ))}
              <Link href="/auth/login" onClick={() => setIsMenuOpen(false)} className="mt-4 bg-emerald-500 text-white px-8 py-3 rounded-full">
                  Sign In
              </Link>
          </div>
      </div>
      {/* --- END OF FIX --- */}

      <main className="px-4 sm:px-8 md:px-20 py-16 sm:py-20 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Resources & Support
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            Explore helpful articles, guides, and trusted links to support your mental wellness journey.
          </p>
        </div>

        {/* Articles Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-emerald-700 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Articles
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-2 hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-800">Understanding Anxiety: Signs & Strategies</h3>
              <p className="text-slate-600 text-sm">Learn about common symptoms of anxiety and practical ways to manage it in daily life.</p>
              <Link href="#" className="text-emerald-600 font-semibold mt-2 hover:underline text-sm flex items-center gap-1">
                Read More <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-2 hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-800">Building Resilience: Tools for Tough Times</h3>
              <p className="text-slate-600 text-sm">Discover techniques to strengthen your resilience and cope with life's challenges.</p>
              <Link href="#" className="text-emerald-600 font-semibold mt-2 hover:underline text-sm flex items-center gap-1">
                Read More <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Downloadable Guides Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-emerald-700 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6" /> Downloadable Guides
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-2 hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-800">Self-Care Checklist (PDF)</h3>
              <p className="text-slate-600 text-sm">A printable checklist to help you build healthy self-care habits.</p>
              <a href="#" download className="text-emerald-600 font-semibold mt-2 hover:underline text-sm flex items-center gap-1">
                Download <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-2 hover:shadow-lg transition">
              <h3 className="text-lg font-bold text-slate-800">Mindfulness Workbook (PDF)</h3>
              <p className="text-slate-600 text-sm">Exercises and prompts to help you practice mindfulness every day.</p>
              <a href="#" download className="text-emerald-600 font-semibold mt-2 hover:underline text-sm flex items-center gap-1">
                Download <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* External Links Section */}
        <section>
          <h2 className="text-2xl font-semibold text-emerald-700 mb-6 flex items-center gap-2">
            <ExternalLink className="w-6 h-6" /> Trusted External Links
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <a href="https://www.who.int/mental_health/en/" target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-2 hover:shadow-lg transition border border-emerald-100">
              <span className="text-lg font-bold text-slate-800">World Health Organization: Mental Health</span>
              <span className="text-slate-600 text-sm">Global resources and information on mental health from the WHO.</span>
            </a>
            <a href="https://www.mhanational.org/" target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-2 hover:shadow-lg transition border border-emerald-100">
              <span className="text-lg font-bold text-slate-800">Mental Health America</span>
              <span className="text-slate-600 text-sm">Support, screening tools, and resources for mental wellness.</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}