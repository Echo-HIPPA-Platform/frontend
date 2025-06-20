"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Clock, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Type for a single day's availability
interface DayAvailability {
  isActive: boolean;
  startTime: string; // "HH:mm" format
  endTime: string;
}

// State shape for the entire week
type WeeklyAvailability = Record<string, DayAvailability>;

export default function ManageAvailabilityPage() {
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    monday: { isActive: false, startTime: '09:00', endTime: '17:00' },
    tuesday: { isActive: false, startTime: '09:00', endTime: '17:00' },
    wednesday: { isActive: false, startTime: '09:00', endTime: '17:00' },
    thursday: { isActive: false, startTime: '09:00', endTime: '17:00' },
    friday: { isActive: false, startTime: '09:00', endTime: '17:00' },
    saturday: { isActive: false, startTime: '10:00', endTime: '14:00' },
    sunday: { isActive: false, startTime: '10:00', endTime: '14:00' },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing availability on load
  useEffect(() => {
    const fetchCurrentAvailability = async () => {
      // TODO: Implement GET /api/v1/doctors/availability to pre-fill the form
      // For now, we start with a default state.
      setIsLoading(false);
    };
    fetchCurrentAvailability();
  }, []);

  const handleDayToggle = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], isActive: !prev[day].isActive }
    }));
  };

  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    const token = localStorage.getItem('authToken');

    // Create an array of API call promises for each active day
    const apiCalls = Object.entries(availability)
      .filter(([, details]) => details.isActive)
      .map(([day, details]) => {
        const payload = {
          day_of_week: day,
          start_time: details.startTime,
          end_time: details.endTime,
          slot_duration: 60, // Or make this configurable
          effective_from: new Date().toISOString(),
        };
        return fetch('/api/v1/doctors/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      });

    try {
      // Execute all calls concurrently
      const responses = await Promise.all(apiCalls);
      // Check if any of the calls failed
      for (const res of responses) {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'One or more availability updates failed.');
        }
      }
      alert('Availability saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Doctor Panel</h1>
        </Link>
        <Link href="/dashboard/doctor" className="font-semibold text-slate-600 hover:text-emerald-600 flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <h2 className="text-4xl font-bold text-gray-900">Manage Your Availability</h2>
            <p className="text-xl text-slate-600 mt-2">Set your weekly schedule so patients can book appointments.</p>
          </header>

          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200 space-y-6">
            {Object.entries(availability).map(([day, details]) => (
              <div key={day} className={`p-4 rounded-2xl transition-all duration-300 ${details.isActive ? 'bg-emerald-50' : 'bg-slate-50 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <label htmlFor={`toggle-${day}`} className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" id={`toggle-${day}`} className="sr-only" checked={details.isActive} onChange={() => handleDayToggle(day)} />
                      <div className={`block w-14 h-8 rounded-full ${details.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${details.isActive ? 'translate-x-6' : ''}`}></div>
                    </div>
                    <span className="ml-4 text-lg font-bold text-slate-800 capitalize">{day}</span>
                  </label>
                  <div className={`flex items-center gap-4 transition-opacity duration-300 ${details.isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <input type="time" value={details.startTime} onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)} className="p-2 border border-slate-300 rounded-md" />
                    <span>-</span>
                    <input type="time" value={details.endTime} onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)} className="p-2 border border-slate-300 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-6 border-t border-gray-200">
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70"
                >
                    <Save size={20} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}