"use client";

import React, { useState, useEffect } from 'react';
import { Heart, User, LogOut, Settings, ArrowRight, Star, MapPin, Calendar, Clock, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface DoctorProfile {
  id: number;
  user_id: number;
  license_number: string;
  specialization: string;
  years_of_experience: number;
  education: string;
  bio: string;
  verification_status: string;
}

interface Doctor {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  profile: {
    first_name: string;
    last_name: string;
  };
  doctor_profile?: DoctorProfile;
}

interface UserResponse {
  id: number;
  email: string;
  role: string;
  profile: {
    first_name: string;
    last_name: string;
  };
}

export default function DoctorsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  // Mock data for now - replace with actual API call
  const mockDoctors: Doctor[] = [
    {
      id: 1,
      email: 'dr.reed@echopsychology.com',
      role: 'doctor',
      is_active: true,
      profile: {
        first_name: 'Dr. Evelyn',
        last_name: 'Reed'
      },
      doctor_profile: {
        id: 1,
        user_id: 1,
        license_number: 'PSY-2019-001',
        specialization: 'Clinical Psychology',
        years_of_experience: 8,
        education: 'PhD Psychology, Harvard University',
        bio: 'Specializing in anxiety, depression, and trauma therapy. I believe in a collaborative approach to healing.',
        verification_status: 'approved'
      }
    },
    {
      id: 2,
      email: 'dr.chen@echopsychology.com',
      role: 'doctor',
      is_active: true,
      profile: {
        first_name: 'Dr. Samuel',
        last_name: 'Chen'
      },
      doctor_profile: {
        id: 2,
        user_id: 2,
        license_number: 'PSY-2020-002',
        specialization: 'Behavioral Therapy',
        years_of_experience: 6,
        education: 'PhD Clinical Psychology, Stanford University',
        bio: 'Focused on cognitive behavioral therapy and mindfulness-based interventions.',
        verification_status: 'approved'
      }
    },
    {
      id: 3,
      email: 'dr.williams@echopsychology.com',
      role: 'doctor',
      is_active: true,
      profile: {
        first_name: 'Dr. Maya',
        last_name: 'Williams'
      },
      doctor_profile: {
        id: 3,
        user_id: 3,
        license_number: 'PSY-2018-003',
        specialization: 'Family Therapy',
        years_of_experience: 10,
        education: 'PhD Marriage and Family Therapy, UCLA',
        bio: 'Helping families and couples build stronger relationships through effective communication.',
        verification_status: 'approved'
      }
    },
    {
      id: 4,
      email: 'dr.johnson@echopsychology.com',
      role: 'doctor',
      is_active: true,
      profile: {
        first_name: 'Dr. Michael',
        last_name: 'Johnson'
      },
      doctor_profile: {
        id: 4,
        user_id: 4,
        license_number: 'PSY-2021-004',
        specialization: 'Child Psychology',
        years_of_experience: 5,
        education: 'PhD Child Psychology, Columbia University',
        bio: 'Specialized in working with children and adolescents facing emotional and behavioral challenges.',
        verification_status: 'approved'
      }
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const userResponse = await fetch('/api/v1/users/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!userResponse.ok) throw new Error('Failed to fetch user profile');
        const userData: UserResponse = await userResponse.json();
        setUser(userData);

        // TODO: Replace with actual API call to fetch doctors
        // const doctorsResponse = await fetch('/api/v1/doctors', {
        //   headers: { 'Authorization': `Bearer ${token}` },
        // });
        // const doctorsData = await doctorsResponse.json();
        // setDoctors(doctorsData);

        // Using mock data for now
        setDoctors(mockDoctors);
        setFilteredDoctors(mockDoctors);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    let filtered = doctors;

    if (searchTerm) {
      filtered = filtered.filter(doctor => 
        doctor.profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.doctor_profile?.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSpecialization) {
      filtered = filtered.filter(doctor => 
        doctor.doctor_profile?.specialization === selectedSpecialization
      );
    }

    setFilteredDoctors(filtered);
  }, [searchTerm, selectedSpecialization, doctors]);

  const specializations = Array.from(new Set(doctors.map(d => d.doctor_profile?.specialization).filter(Boolean)));

  const handleBookAppointment = (doctorId: number) => {
    // Store selected doctor in localStorage for the booking process
    localStorage.setItem('selected_doctor_id', doctorId.toString());
    router.push('/book-appointment');
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-slate-700">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p>Loading doctors...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-8">
      {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
        <Link href="/dashboard/patient" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Echo Psychology
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center cursor-pointer">
              <span className="text-white font-bold text-lg">{user?.profile.first_name.charAt(0)}</span>
            </div>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
              <Link href="/dashboard/profile" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50">
                <User size={16} /> My Profile
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50">
                <Settings size={16} /> Settings
              </Link>
              <div className="border-t my-1"></div>
              <a href="/api/v1/auth/logout" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50">
                <LogOut size={16} /> Sign Out
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
              Find Your Perfect Doctor
            </h2>
            <p className="text-xl text-slate-600">
              Browse our network of verified mental health professionals and book your appointment.
            </p>
          </header>

          {/* Search and Filter */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Doctors</label>
                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Specialization</label>
                <div className="relative">
                  <Filter className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                  >
                    <option value="">All Specializations</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map(doctor => (
              <div key={doctor.id} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 hover:shadow-2xl transition-all duration-300">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">
                      {doctor.profile.first_name.charAt(3)}{doctor.profile.last_name.charAt(3)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {doctor.profile.first_name} {doctor.profile.last_name}
                  </h3>
                  <p className="text-emerald-600 font-semibold mb-2">
                    {doctor.doctor_profile?.specialization}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-slate-600 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">4.9 (127 reviews)</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{doctor.doctor_profile?.years_of_experience} years experience</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Online & In-Person</span>
                  </div>
                </div>

                <p className="text-slate-600 text-sm mb-6 line-clamp-3">
                  {doctor.doctor_profile?.bio}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleBookAppointment(doctor.id)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Book Appointment
                  </button>
                  <Link
                    href={`/doctors/${doctor.id}`}
                    className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    View Profile
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">
                No doctors found matching your criteria. Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
