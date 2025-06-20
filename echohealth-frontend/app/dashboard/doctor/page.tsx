"use client";

import React, { useState, useEffect } from 'react';
import { Heart, User, LogOut, Settings, Calendar, Clock, ArrowRight, ShieldCheck, BriefcaseMedical, Edit3, UserCheck } from 'lucide-react';
import Link from 'next/link';

// --- Types (assuming they are defined as before) ---
interface UserProfile { first_name: string; last_name: string; }
interface UserResponse { id: number; email: string; role: string; profile: UserProfile; }
interface Appointment { id: number; patient: UserResponse; appointment_type: string; scheduled_at: string; }
interface Availability { day_of_week: string; start_time: string; end_time: string; }


export default function DoctorDashboardPage() {
  const [doctor, setDoctor] = useState<UserResponse | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Your existing fetch logic using mock data...
      // This part remains unchanged.
      const mockDoctor: UserResponse = {
        id: 101, email: 'e.reed@example.com', role: 'doctor',
        profile: { first_name: 'Evelyn', last_name: 'Reed' }
      };
      const mockAppointments: Appointment[] = [
        { id: 1, patient: { id: 201, email: 'sarah.m@example.com', role: 'patient', profile: { first_name: 'Sarah', last_name: 'M.' } }, appointment_type: 'initial_consultation', scheduled_at: new Date(new Date().setHours(11, 0, 0)).toISOString() },
        { id: 2, patient: { id: 202, email: 'michael.r@example.com', role: 'patient', profile: { first_name: 'Michael', last_name: 'R.' } }, appointment_type: 'therapy_session', scheduled_at: new Date(new Date().setHours(14, 0, 0)).toISOString() },
      ];
      const mockAvailability: Availability[] = [
        { day_of_week: 'monday', start_time: '09:00', end_time: '17:00' },
        { day_of_week: 'tuesday', start_time: '09:00', end_time: '17:00' },
        { day_of_week: 'wednesday', start_time: '10:00', end_time: '18:00' },
        { day_of_week: 'friday', start_time: '09:00', end_time: '15:00' },
      ];
      setDoctor(mockDoctor);
      setAppointments(mockAppointments);
      setAvailability(mockAvailability);
      setIsLoading(false);
    };
    fetchDashboardData();
  }, []);

  // StatCard component remains unchanged...
  const StatCard = ({ title, value, icon: Icon }: { title: string; value: number | string; icon: React.ElementType }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200 shadow-md">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-100 rounded-full">
          <Icon className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Doctor Dashboard...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-8">{error}</div>;
  
  const todayAppointments = appointments.filter(a => new Date(a.scheduled_at).toDateString() === new Date().toDateString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      {/* Navigation (unchanged) */}
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Doctor Panel</h1>
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center cursor-pointer">
              <span className="text-white font-bold text-lg">{doctor?.profile.first_name.charAt(0)}</span>
            </div>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
              {/* Dropdown links (unchanged) */}
              <Link href="/dashboard/profile" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><User size={16} /> My Profile</Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Settings size={16} /> Settings</Link>
              <div className="border-t my-1"></div>
              <a href="/api/v1/auth/logout" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><LogOut size={16} /> Sign Out</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content (unchanged until the appointments list) */}
      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Welcome back, Dr. {doctor?.profile.last_name}!</h2>
            <p className="text-xl text-slate-600 mt-2">Here’s what your day and week look like.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard title="Appointments Today" value={todayAppointments.length} icon={Calendar} />
            <StatCard title="Total This Week" value={appointments.length} icon={BriefcaseMedical} />
            <StatCard title="Pending Notes" value={2} icon={Edit3} />
            <StatCard title="Messages" value={5} icon={UserCheck} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Today's Schedule</h3>
                <div className="space-y-4">
                  {todayAppointments.length > 0 ? todayAppointments
                    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                    .map(appt => (
                      <div key={appt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-100 rounded-full">
                            <Clock className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-sm text-slate-600">{appt.patient.profile.first_name} {appt.patient.profile.last_name}</p>
                          </div>
                        </div>
                        
                        {/* --- FIX: Replaced button with Link component --- */}
                        <Link href={`/dashboard/appointments/${appt.id}`} className="text-emerald-600 hover:text-emerald-800 font-semibold text-sm flex items-center gap-1">
                            View Details <ArrowRight size={14} />
                        </Link>
                        {/* --- END OF FIX --- */}

                      </div>
                    )) : <p className="text-slate-500 text-center py-8">No appointments scheduled for today.</p>}
                </div>
              </div>
            </div>

            {/* Availability Sidebar (unchanged) */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Your Weekly Availability</h3>
                <div className="space-y-3 mb-6">
                  {availability.map(day => (
                    <div key={day.day_of_week} className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-700 capitalize">{day.day_of_week}</span>
                      <span className="font-mono text-gray-600">{day.start_time} - {day.end_time}</span>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/doctor/availability" className="w-full group bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-slate-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                  Manage Availability
                  <Edit3 className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}