"use client";

import React, { useState, useEffect } from 'react';
import { Heart, User, LogOut, Settings, Calendar, Clock, ArrowRight, BriefcaseMedical, Edit3, UserCheck } from 'lucide-react';
import Link from 'next/link';
import KYCVerification from '@/app/components/KYCVerification';

// --- Types ---
interface UserProfile { 
  first_name: string; 
  last_name: string; 
}

interface UserResponse { 
  id: number; 
  email: string; 
  role: string; 
  profile: UserProfile; 
}

interface Appointment { 
  id: number; 
  patient: UserResponse; 
  appointment_type: string; 
  scheduled_at: string; 
  status?: string;
}

interface Availability {
  id?: number;
  user_id?: number;
  day_of_week: string;
  day_of_week_int?: number;
  start_hour: number;
  start_minute: number;
  end_hour: number;
  end_minute: number;
  created_at?: string;
  updated_at?: string;
}

interface DashboardStats {
  doctor_name: string;
  total_users: number;
  total_patients: number;
  total_doctors: number;
  pending_doctors: number;
  approved_doctors: number;
  suspended_doctors: number;
  active_users: number;
  inactive_users: number;
  recent_audit_logs: number;
  total_patients_for_doctor: number;
  total_pending_notes: number;
  total_messages: number;
}

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const apiBaseUrl = API_BASE_URL + '/api/v1';

// API utility functions
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }
  return null;
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const url = `${apiBaseUrl}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  
  return response.json();
};

export default function DoctorDashboardPage() {
  const [doctor, setDoctor] = useState<UserResponse | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected' | 'incomplete'>('incomplete');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch doctor profile
        const doctorData = await apiRequest('/users/me');
        setDoctor(doctorData);

        // Fetch appointments (you'll need to implement this endpoint in your backend)
        try {
          const appointmentsData = await apiRequest('/appointments');
          setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
        } catch (err) {
          console.warn('Appointments endpoint not available yet, using empty array');
          setAppointments([]);
        }

        // Fetch availability from the new backend endpoint
        try {
          const availabilityData = await apiRequest('/doctors/me/availability');
          setAvailability(availabilityData);
        } catch (err) {
          console.error('Failed to fetch availability:', err);
          setAvailability([]); // Fallback to empty array on error
        }

        // Fetch current KYC status
        try {
          const kycData = await apiRequest('/doctors/me/kyc-status');
          if (kycData && kycData.kyc_status) {
            setKycStatus(kycData.kyc_status);
          }
        } catch (err) {
          console.error('Failed to fetch KYC status:', err);
          // Keep default status of 'incomplete'
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        
        // Fallback to mock data for development (only if doctor data failed)
        if (!doctor) {
          const mockDoctor: UserResponse = {
            id: 101, 
            email: 'e.reed@example.com', 
            role: 'doctor',
            profile: { first_name: 'Evelyn', last_name: 'Reed' }
          };
          setDoctor(mockDoctor);
        }
        setAppointments([]);
        setAvailability([]); // Ensure availability is empty on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Clear tokens and redirect regardless of API response
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  };

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
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading Doctor Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const todayAppointments = appointments.filter(a => 
    new Date(a.scheduled_at).toDateString() === new Date().toDateString()
  );

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
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center cursor-pointer">
              <span className="text-white font-bold text-lg">
                {doctor?.profile.first_name.charAt(0)}
              </span>
            </div>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
              <Link href="/dashboard/profile" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <User size={16} /> My Profile
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Settings size={16} /> Settings
              </Link>
              <div className="border-t my-1"></div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-8 mt-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Some data may be using fallback values due to: {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Welcome back, Dr. {doctor?.profile.last_name}!
            </h2>
            <p className="text-xl text-slate-600 mt-2">
              Here&apos;s what your day and week look like.
            </p>
          </header>

          {/* KYC Verification Section */}
          <KYCVerification 
            doctorId={doctor?.id || 0}
            currentStatus={kycStatus}
            onSubmit={(data) => {
              console.log('KYC data submitted:', data);
              // Here you would send the data to your backend
            }}
            onStatusChange={(newStatus) => {
              console.log('KYC status changed to:', newStatus);
              setKycStatus(newStatus);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard title="Appointments Today" value={todayAppointments.length} icon={Calendar} />
            <StatCard title="Total Patients" value={dashboardStats?.total_patients_for_doctor || 0} icon={BriefcaseMedical} />
            <StatCard title="Pending Notes" value={dashboardStats?.total_pending_notes || 0} icon={Edit3} />
            <StatCard title="Messages" value={dashboardStats?.total_messages || 0} icon={UserCheck} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Today&apos;s Schedule</h3>
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
                            <p className="font-bold text-slate-800">
                              {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-sm text-slate-600">
                              {appt.patient.profile.first_name} {appt.patient.profile.last_name}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                              {appt.appointment_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        
                        <Link 
                          href={`/dashboard/appointments/${appt.id}`} 
                          className="text-emerald-600 hover:text-emerald-800 font-semibold text-sm flex items-center gap-1"
                        >
                          View Details <ArrowRight size={14} />
                        </Link>
                      </div>
                    )) : (
                      <p className="text-slate-500 text-center py-8">
                        No appointments scheduled for today.
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Availability Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Your Weekly Availability</h3>
                <div className="space-y-3 mb-6">
                  {availability.length > 0 ? availability.map(day => (
                    <div key={day.day_of_week_int} className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-700 capitalize">{day.day_of_week}</span>
                      <span className="font-mono text-gray-600">{`${String(day.start_hour).padStart(2, '0')}:${String(day.start_minute).padStart(2, '0')} - ${String(day.end_hour).padStart(2, '0')}:${String(day.end_minute).padStart(2, '0')}`}</span>
                    </div>
                  )) : (
                    <p className="text-slate-500 text-center py-4">No availability set</p>
                  )}
                </div>
                <Link 
                  href="/dashboard/doctor/availability" 
                  className="w-full group bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-slate-900 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
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