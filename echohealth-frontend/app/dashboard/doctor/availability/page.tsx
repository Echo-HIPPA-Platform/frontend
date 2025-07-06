
"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, Save, Clock, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- Types ---
interface AvailabilitySlot {
  day_of_week: string;
  start_hour: number;
  start_minute: number;
  end_hour: number;
  end_minute: number;
}

// API utility functions (re-using from DoctorDashboardPage for consistency)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }
  return null;
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      throw new Error('Authentication failed');
    }
    throw new Error(`API request failed: ${response.status}`);
  }
  
  return response.json();
};

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DoctorAvailabilityPage() {
  const router = useRouter();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest('/doctors/me/availability');
        setAvailability(data);
      } catch (err) {
        console.error('Failed to fetch availability:', err);
        setError(err instanceof Error ? err.message : 'Failed to load availability');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  const handleAddSlot = () => {
    setAvailability([...availability, { day_of_week: 'monday', start_hour: 9, start_minute: 0, end_hour: 17, end_minute: 0 }]);
  };

  const handleRemoveSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof AvailabilitySlot, value: string | number) => {
    const newAvailability = [...availability];
    // Ensure numeric fields are parsed as numbers
    if (['start_hour', 'start_minute', 'end_hour', 'end_minute'].includes(field as string)) {
      newAvailability[index][field] = Number(value) as any; // Type assertion needed due to string|number union
    } else {
      newAvailability[index][field] = value as any; // Type assertion needed
    }
    setAvailability(newAvailability);
  };

  const handleSaveAvailability = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiRequest('/doctors/me/availability', {
        method: 'POST',
        body: JSON.stringify(availability),
      });
      setSuccessMessage('Availability saved successfully!');
    } catch (err) {
      console.error('Failed to save availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to save availability');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading Availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <Link href="/dashboard/doctor" className="flex items-center gap-3">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-800">Back to Dashboard</h1>
        </Link>
      </nav>

      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Manage Your Weekly Availability</h2>
          <p className="text-slate-600 mb-8">Set the days and times you are available for appointments. Patients will only be able to book within these slots.</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4" role="alert">
              {successMessage}
            </div>
          )}

          <div className="space-y-6 mb-8">
            {availability.length === 0 && !isLoading && (
              <p className="text-slate-500 text-center py-8">No availability slots added yet. Click 'Add Slot' to begin.</p>
            )}
            {availability.map((slot, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 w-full">
                  <label htmlFor={`day-${index}`} className="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
                  <select
                    id={`day-${index}`}
                    name="day_of_week"
                    value={slot.day_of_week}
                    onChange={(e) => handleChange(index, 'day_of_week', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label htmlFor={`start-hour-${index}`} className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id={`start-hour-${index}`}
                      name="start_hour"
                      value={slot.start_hour}
                      onChange={(e) => handleChange(index, 'start_hour', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      min="0" max="23"
                    />
                    <input
                      type="number"
                      id={`start-minute-${index}`}
                      name="start_minute"
                      value={slot.start_minute}
                      onChange={(e) => handleChange(index, 'start_minute', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      min="0" max="59"
                    />
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <label htmlFor={`end-hour-${index}`} className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id={`end-hour-${index}`}
                      name="end_hour"
                      value={slot.end_hour}
                      onChange={(e) => handleChange(index, 'end_hour', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      min="0" max="23"
                    />
                    <input
                      type="number"
                      id={`end-minute-${index}`}
                      name="end_minute"
                      value={slot.end_minute}
                      onChange={(e) => handleChange(index, 'end_minute', e.target.value)}
                      className="w-1/2 p-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      min="0" max="59"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(index)}
                  className="mt-6 sm:mt-0 p-2 text-red-600 hover:text-red-800 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleAddSlot}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              <Plus className="w-5 h-5" /> Add Slot
            </button>
            <button
              type="button"
              onClick={handleSaveAvailability}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              <Save className="w-5 h-5" /> {isSaving ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
