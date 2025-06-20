"use client";

import React, { useState, useEffect } from 'react';
import { Heart, User, Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

// --- Types based on your Go backend DTOs ---
interface Doctor {
  id: number;
  user: {
    id: number;
    profile: {
      first_name: string;
      last_name: string;
    }
  };
  specialization: string;
  bio: string;
  avatarUrl: string;
}

// --- Main Schedule Page Component ---
export default function SchedulePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const mockDoctors: Doctor[] = [
          { id: 1, user: { id: 101, profile: { first_name: 'Evelyn', last_name: 'Reed' } }, specialization: 'Clinical Psychology', bio: 'Specializes in cognitive-behavioral therapy and mindfulness.', avatarUrl: '/avatars/doctor-1.jpg' },
          { id: 2, user: { id: 102, profile: { first_name: 'Samuel', last_name: 'Chen' } }, specialization: 'Behavioral Therapy', bio: 'Focused on helping clients overcome anxiety and stress.', avatarUrl: '/avatars/doctor-2.jpg' },
          { id: 3, user: { id: 103, profile: { first_name: 'Aisha', last_name: 'Khan' } }, specialization: 'Family Counseling', bio: 'Experienced in resolving family conflicts and improving communication.', avatarUrl: '/avatars/doctor-3.jpg' },
        ];
        setDoctors(mockDoctors);
        if(mockDoctors.length > 0) {
          setSelectedDoctor(mockDoctors[0]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const availableTimes = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"];

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      alert('Please select a doctor, date, and time.');
      return;
    }
    setIsBooking(true);
    
    // Simulating API call for now
    setTimeout(() => {
        alert(`Booking confirmed with Dr. ${selectedDoctor.user.profile.last_name} on ${format(selectedDate, 'PPP')} at ${selectedTime}!`);
        setIsBooking(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Echo Psychology
          </h1>
        </Link>
        <Link href="/dashboard/patient" className="font-semibold text-slate-700 hover:text-emerald-600 transition-colors">
          Back to Dashboard
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-16">
            {/* Style Change: Increased text contrast and impact */}
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Schedule Your Session
            </h2>
            <p className="text-xl text-slate-600 mt-3 max-w-2xl mx-auto">
              Choose a therapist and find a time that works for you.
            </p>
          </header>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 sm:p-12 border border-emerald-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              
              {/* Left Column: Doctor Selection */}
              <div className="lg:col-span-1">
                {/* Style Change: Increased heading contrast */}
                <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Choose Your Therapist</h3>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {isLoading && <p>Loading doctors...</p>}
                  {error && <p className="text-red-500">{error}</p>}
                  {doctors.map(doctor => (
                    <div
                      key={doctor.id}
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setSelectedTime(null);
                      }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-4 ${
                        selectedDoctor?.id === doctor.id
                          ? 'bg-emerald-50 border-emerald-500 shadow-lg'
                          : 'bg-white border-gray-200 hover:border-emerald-400 hover:shadow-md'
                      }`}
                    >
                       <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0"></div>
                       <div className="flex-1">
                          <p className="font-bold text-slate-800">Dr. {doctor.user.profile.first_name} {doctor.user.profile.last_name}</p>
                          <p className="text-sm text-emerald-600 font-medium">{doctor.specialization}</p>
                       </div>
                       {selectedDoctor?.id === doctor.id && <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0"/>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Date and Time Selection */}
              <div className="lg:col-span-2">
                {/* Style Change: Increased heading contrast */}
                <h3 className="text-2xl font-bold text-gray-900 mb-6">2. Select a Date & Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <div>
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={{ before: new Date() }}
                      className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm"
                      // --- Style Change: Enhanced Calendar styling ---
                      classNames={{
                        caption: 'flex justify-center py-2 mb-4 relative items-center',
                        caption_label: 'text-lg font-bold text-slate-800',
                        nav: 'space-x-1 flex items-center',
                        nav_button: 'h-7 w-7 bg-transparent p-1 rounded-full hover:bg-slate-100 transition-colors',
                        table: 'w-full border-collapse',
                        head_row: 'flex font-medium text-slate-500 text-xs uppercase tracking-wider',
                        head_cell: 'w-full pb-2',
                        row: 'flex w-full mt-2',
                        cell: 'w-full text-center',
                        day: 'h-10 w-10 p-0 rounded-full hover:bg-emerald-100 text-slate-700 font-medium transition-colors',
                        day_selected: 'text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500',
                        day_today: 'bg-emerald-100 text-emerald-700 font-bold',
                        day_outside: 'text-slate-400 opacity-50',
                        day_disabled: 'text-slate-300 opacity-50',
                      }}
                      // --- End of Style Change ---
                    />
                  </div>
                  {/* Time Slots */}
                  <div>
                    {selectedDate && (
                       <div>
                         <h4 className="font-bold text-slate-800 mb-4">
                           Available Slots for <span className="text-emerald-600">{format(selectedDate, 'PPP')}</span>
                         </h4>
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                           {availableTimes.map(time => (
                             <button
                               key={time}
                               onClick={() => setSelectedTime(time)}
                               // --- Style Change: Bolder text and improved hover/active states ---
                               className={`p-3 rounded-lg border-2 text-center font-semibold transition-all duration-200 ${
                                 selectedTime === time
                                   ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg -translate-y-1'
                                   : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-600'
                               }`}
                             >
                               {time}
                             </button>
                           ))}
                         </div>
                       </div>
                    )}
                  </div>
                </div>

                {/* Booking Confirmation */}
                <div className="mt-8 border-t border-slate-200 pt-8">
                   <button
                     onClick={handleBooking}
                     disabled={!selectedDoctor || !selectedDate || !selectedTime || isBooking}
                     className="w-full group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isBooking ? 'Confirming...' : 'Confirm Booking'}
                     {!isBooking && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}