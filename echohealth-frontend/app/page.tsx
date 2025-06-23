"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Users, Calendar, MessageCircle, Star, CheckCircle, ArrowRight, Phone, Mail, MapPin, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Data for the page
  const testimonials = [
    { text: "Echo Psychology helped me find my voice again. The therapists here truly listen and care.", name: "Sarah M.", rating: 5 },
    { text: "A safe space where I could be vulnerable and work through my challenges with compassion.", name: "Michael R.", rating: 5 },
    { text: "The group therapy sessions changed my perspective. I felt supported every step of the way.", name: "Jennifer L.", rating: 5 }
  ];

  const services = [
    { icon: MessageCircle, title: "Individual Counseling", description: "Work one-on-one with our licensed therapists to explore personal challenges, develop coping strategies, and achieve meaningful growth in a confidential space.", color: "bg-gradient-to-br from-emerald-50 to-teal-50" },
    { icon: Users, title: "Group Therapy", description: "Join a supportive community and share experiences in a safe group setting. Benefit from collective wisdom and mutual encouragement.", color: "bg-gradient-to-br from-blue-50 to-cyan-50" },
    { icon: Heart, title: "Stress & Anxiety Management", description: "Learn practical strategies and techniques to manage stress and reduce anxiety, empowering you to regain balance and peace of mind.", color: "bg-gradient-to-br from-rose-50 to-pink-50" },
    { icon: Users, title: "Couples & Family Therapy", description: "Enhance communication, resolve conflicts, and build stronger relationships with the support of our experienced therapists.", color: "bg-gradient-to-br from-amber-50 to-orange-50" }
  ];

  const navLinks = [
    { href: "#services", label: "Services" },
    { href: "#testimonials", label: "Stories" },
    { href: "#contact", label: "Contact" },
    { href: "/resoucers", label: "Resources" },
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
        clearInterval(interval);
        document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen, testimonials.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
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
      
      {/* Mobile Menu Overlay */}
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

      <main className="relative z-10">
        {/* Hero Section */}
        <section className={`px-4 sm:px-8 md:px-20 py-16 sm:py-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Heart className="w-4 h-4" />
                  Your journey to wellness starts here
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
                  Your Safe Space for
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent block">
                    Mental Wellness
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  At Echo Psychology, we create a warm, secure environment where you can explore your thoughts and emotions. Our compassionate team of licensed professionals guides you with personalized care.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
                  <button className="group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Schedule Session
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="bg-white text-slate-700 px-8 py-4 rounded-full font-semibold text-lg border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300">
                    Learn More
                  </button>
                </div>
                <div className="flex flex-col items-center sm:flex-row sm:justify-center lg:justify-start gap-4 sm:gap-8 text-sm text-slate-500">
                  <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Licensed Professionals</div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Confidential & Secure</div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Flexible Scheduling</div>
                </div>
              </div>
              <div className="flex-1 flex justify-center mt-12 lg:mt-0">
                <div className="relative">
                  <div className="w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-200/50 to-teal-200/50 flex items-center justify-center p-4">
                      <div className="text-center">
                        <Heart className="w-16 h-16 sm:w-24 sm:h-24 text-emerald-500 mx-auto mb-4" />
                        <p className="text-emerald-700 font-medium">A serene and welcoming therapy space</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full blur-sm opacity-60 animate-pulse"></div>
                  <div className="absolute -bottom-6 -left-6 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-sm opacity-60 animate-pulse delay-1000"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="px-4 sm:px-8 md:px-20 py-20 bg-white/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-slate-800 mb-4">
                Comprehensive Care Tailored to You
              </h3>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                We provide evidence-based services with warmth, empathy, and expertise. 
                Every step of your journey is supported with compassion and understanding.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <div key={index} className={`${service.color} p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-white/50`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
                        <IconComponent className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-2xl font-semibold text-slate-800 mb-3">{service.title}</h4>
                        <p className="text-slate-600 leading-relaxed">{service.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="px-4 sm:px-8 md:px-20 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-4xl font-bold text-slate-800 mb-4">
              Stories of Hope & Healing
            </h3>
            <p className="text-xl text-slate-600 mb-12">
              Real experiences from clients who found their path to wellness with us
            </p>
            <div className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-2xl">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white fill-current" />
              </div>
              <div className="transition-all duration-500 ease-in-out">
                <p className="text-xl sm:text-2xl text-slate-700 italic mb-6 leading-relaxed">
                  "{testimonials[currentTestimonial].text}"
                </p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-lg font-semibold text-emerald-600">
                  — {testimonials[currentTestimonial].name}
                </p>
              </div>
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button key={index} onClick={() => setCurrentTestimonial(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentTestimonial ? 'bg-emerald-500' : 'bg-slate-300'}`}/>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-8 md:px-20 py-20 bg-gradient-to-r from-emerald-500 to-teal-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h3 className="text-4xl font-bold mb-6">
              Ready to Begin Your Journey?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Your well-being is our priority. Take the first step towards improved mental health today. We're here to support you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-emerald-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg">
                <Calendar className="w-5 h-5 inline mr-2" />
                Book Your Appointment
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-emerald-600 transition-all duration-300">
                <Phone className="w-5 h-5 inline mr-2" />
                Call Us Today
              </button>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="px-4 sm:px-8 md:px-20 py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-slate-800 mb-4">
                We're Here When You Need Us
              </h3>
              <p className="text-xl text-slate-600">
                Reach out today. Your mental health journey starts with a simple conversation.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Phone className="w-8 h-8 text-emerald-600" /></div>
                <h4 className="text-xl font-semibold text-slate-800 mb-2">Call Us</h4>
                <p className="text-slate-600 mb-4">Speak with our caring team</p>
                <p className="text-emerald-600 font-semibold">+254747107807</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-8 h-8 text-blue-600" /></div>
                <h4 className="text-xl font-semibold text-slate-800 mb-2">Email Us</h4>
                <p className="text-slate-600 mb-4">Get in touch anytime</p>
                <p className="text-blue-600 font-semibold">barbaraoluoch@echopsychology.com</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"><MapPin className="w-8 h-8 text-rose-600" /></div>
                <h4 className="text-xl font-semibold text-slate-800 mb-2">Visit Us</h4>
                <p className="text-slate-600 mb-4">Comfortable, private location</p>
                <p className="text-rose-600 font-semibold">Virtual & Accessible</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white px-4 sm:px-8 md:px-20 py-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Echo Psychology</h1>
          </div>
          <p className="text-slate-400 mb-6">
            Creating safe spaces for mental wellness and personal growth
          </p>
          <p className="text-sm text-slate-500">
            © 2025 Echo Psychology Services. All rights reserved. | Licensed & Confidential
          </p>
        </div>
      </footer>
    </div>
  );
}