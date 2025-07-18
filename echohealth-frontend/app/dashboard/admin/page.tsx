"use client";

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, ShieldCheck, BarChart2, Check, X, UserX, CheckCircle, Ban, ToggleLeft, ToggleRight, Menu, Settings, FileText, Activity } from 'lucide-react';
import Link from 'next/link';
import ActivityLogComponent from '../../../components/admin/ActivityLog';
import ChartsAndReportsComponent from '../../../components/admin/ChartsAndReports';
import AdminSettingsComponent from '../../../components/admin/Settings';

// --- Types based on your Go backend DTOs ---
interface AdminDashboardStats {
  total_users: number;
  total_doctors: number;
  pending_doctors: number;
  approved_doctors: number;
}

interface UserResponse {
  id: number;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  is_active: boolean;
  profile: {
    first_name: string;
    last_name: string;
  };
}

interface DoctorResponse {
  id: number; // This is the DoctorProfile ID
  user: UserResponse;
  specialization: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  kyc_status: 'incomplete' | 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// --- Main Admin Dashboard Component ---
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'doctors' | 'users'>('doctors');
  const [activeSection, setActiveSection] = useState('dashboard');

  const fetchAdminData = async () => {
    // This function will be re-used to refresh data after updates
    setIsLoading(true);
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      console.log('Fetching admin data from:', apiBaseUrl);
      console.log('Using token:', token ? 'Present' : 'Missing');
      
      const [statsRes, doctorsRes, usersRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/v1/admin/doctors`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/api/v1/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      console.log('Response statuses:', {
        stats: statsRes.status,
        doctors: doctorsRes.status,
        users: usersRes.status
      });

      // Handle each response separately for better error handling
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const doctorsData = doctorsRes.ok ? await doctorsRes.json() : null;
      const usersData = usersRes.ok ? await usersRes.json() : null;
      
      console.log('Fetched data:', { statsData, doctorsData, usersData });
      console.log('Response status details:', {
        statsOk: statsRes.ok,
        doctorsOk: doctorsRes.ok,
        usersOk: usersRes.ok
      });
      
      // Set data even if some endpoints fail
      if (statsData) setStats(statsData);
      
      let doctorsArray: DoctorResponse[] = [];
      let usersArray: UserResponse[] = [];
      
      if (doctorsData) {
        doctorsArray = doctorsData.doctors || doctorsData || [];
        console.log('Setting doctors data:', doctorsArray);
      }
      
      if (usersData) {
        usersArray = usersData.users || usersData || [];
        console.log('Setting users data:', usersArray);
        setUsers(usersArray);
        
        // If we have users but no doctors data, create doctor profiles from users with doctor role
        if ((!doctorsData || doctorsArray.length === 0) && usersArray.length > 0) {
          const doctorUsers = usersArray.filter(user => user.role === 'doctor');
          console.log('Found doctor users without doctor profiles:', doctorUsers);
          
          // Create mock doctor profiles for users with doctor role
          const mockDoctorProfiles = doctorUsers.map(user => ({
            id: user.id, // Use user ID as doctor profile ID for now
            user: user,
            specialization: 'Not specified', // Default specialization
            verification_status: 'pending' as const,
            kyc_status: 'incomplete' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          
          console.log('Created mock doctor profiles:', mockDoctorProfiles);
          doctorsArray = mockDoctorProfiles;
        }
      }
      
      setDoctors(doctorsArray);
      
      // Only throw error if critical endpoints fail
      if (!usersRes.ok) {
        throw new Error(`Failed to fetch users data. Status: ${usersRes.status}`);
      }

    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message);
      
      // Add some mock data for development/testing
      const mockStats = {
        total_users: 25,
        total_doctors: 8,
        pending_doctors: 3,
        approved_doctors: 5
      };
      
      const mockDoctors = [
        {
          id: 1,
          user: {
            id: 101,
            email: 'dr.smith@example.com',
            role: 'doctor' as const,
            is_active: true,
            profile: {
              first_name: 'John',
              last_name: 'Smith'
            }
          },
          specialization: 'Clinical Psychology',
          verification_status: 'pending' as const,
          kyc_status: 'pending' as const,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          user: {
            id: 102,
            email: 'dr.johnson@example.com',
            role: 'doctor' as const,
            is_active: true,
            profile: {
              first_name: 'Sarah',
              last_name: 'Johnson'
            }
          },
          specialization: 'Behavioral Therapy',
          verification_status: 'approved' as const,
          kyc_status: 'approved' as const,
          created_at: '2024-01-10T14:20:00Z',
          updated_at: '2024-01-12T09:15:00Z'
        },
        {
          id: 3,
          user: {
            id: 103,
            email: 'dr.wilson@example.com',
            role: 'doctor' as const,
            is_active: true,
            profile: {
              first_name: 'Michael',
              last_name: 'Wilson'
            }
          },
          specialization: 'Family Therapy',
          verification_status: 'pending' as const,
          kyc_status: 'rejected' as const,
          rejection_reason: 'Medical license document unclear',
          created_at: '2024-01-20T16:45:00Z',
          updated_at: '2024-01-22T11:30:00Z'
        }
      ];
      
      const mockUsers = [
        {
          id: 101,
          email: 'dr.smith@example.com',
          role: 'doctor' as const,
          is_active: true,
          profile: {
            first_name: 'John',
            last_name: 'Smith'
          }
        },
        {
          id: 102,
          email: 'dr.johnson@example.com',
          role: 'doctor' as const,
          is_active: true,
          profile: {
            first_name: 'Sarah',
            last_name: 'Johnson'
          }
        },
        {
          id: 103,
          email: 'dr.wilson@example.com',
          role: 'doctor' as const,
          is_active: true,
          profile: {
            first_name: 'Michael',
            last_name: 'Wilson'
          }
        },
        {
          id: 201,
          email: 'patient@example.com',
          role: 'patient' as const,
          is_active: true,
          profile: {
            first_name: 'Jane',
            last_name: 'Doe'
          }
        }
      ];
      
      console.log('Using mock data for development');
      setStats(mockStats);
      setDoctors(mockDoctors);
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDoctorVerification = async (doctorId: number, action: 'approved' | 'rejected' | 'suspended') => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    let reason = '';
    if (action === 'rejected' || action === 'suspended') {
        reason = prompt(`Please provide a reason for this action (${action}):`) || "";
        if (reason.trim() === '') {
            alert('A reason is required to perform this action.');
            return;
        }
    }
    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/v1/admin/doctors/${doctorId}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ action, reason }),
        });
        if (!response.ok) throw new Error(`Failed to update doctor status.`);
        alert(`Doctor has been successfully ${action}.`);
        fetchAdminData(); // Refresh all data to ensure UI consistency
    } catch (err: any) {
        alert(`Error: ${err.message}`);
    }
  };

  const handleKYCApproval = async (doctorId: number, action: 'approved' | 'rejected') => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    let reason = '';
    if (action === 'rejected') {
        reason = prompt('Please provide a reason for rejecting this KYC application:') || '';
        if (reason.trim() === '') {
            alert('A reason is required to reject a KYC application.');
            return;
        }
    }

    if (!confirm(`Are you sure you want to ${action === 'approved' ? 'approve' : 'reject'} this KYC application?`)) return;

    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/v1/admin/doctors/${doctorId}/kyc`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ action, reason }),
        });
        if (!response.ok) throw new Error(`Failed to update KYC status.`);
        alert(`KYC application has been successfully ${action}.`);
        fetchAdminData(); // Refresh all data to ensure UI consistency
    } catch (err: any) {
        alert(`Error: ${err.message}`);
    }
  };

  const handleUserStatusToggle = async (userId: number, currentStatus: boolean) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const newStatus = !currentStatus;
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user account?`)) return;

    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${apiBaseUrl}/api/v1/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ is_active: newStatus }),
        });
        if (!response.ok) throw new Error(`Failed to update user status.`);
        alert(`User account has been successfully ${newStatus ? 'activated' : 'deactivated'}.`);
        fetchAdminData(); // Refresh all data
    } catch (err: any) {
        alert(`Error: ${err.message}`);
    }
  };
  
  // Helper components remain the same
  const StatCard = ({ title, value, icon: Icon }: { title: string; value: number | string; icon: React.ElementType }) => ( <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200 shadow-md"> <div className="flex items-center gap-4"> <div className="p-3 bg-emerald-100 rounded-full"><Icon className="w-6 h-6 text-emerald-600" /></div> <div> <p className="text-sm font-medium text-slate-500">{title}</p> <p className="text-2xl font-bold text-gray-900">{value}</p> </div> </div> </div> );
  const StatusBadge = ({ status }: { status: string }) => { const statusMap: { [key: string]: string } = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800', suspended: 'bg-slate-100 text-slate-800', }; return ( <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span> ); };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Admin Dashboard...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 flex">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-full bg-white/90 backdrop-blur-sm border-r border-gray-200 z-10">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-gray-900 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveSection('dashboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'dashboard'
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <BarChart2 className="w-5 h-5" />
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('verify-doctors')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'verify-doctors'
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  Verify Doctors
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'settings'
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('reports')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'reports'
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  Reports
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('activity')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'activity'
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-slate-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  Activity Log
                </button>
              </li>
            </ul>
          </nav>
          
          {/* Sign Out */}
          <div className="p-4 border-t border-gray-200">
            <a
              href="/api/v1/auth/logout"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
              Sign Out
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <>
              <header className="mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-xl text-slate-600 mt-2">System overview and management tools.</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} />
                <StatCard title="Total Doctors" value={stats?.total_doctors ?? 0} icon={UserCheck} />
                <StatCard title="Pending Applications" value={stats?.pending_doctors ?? 0} icon={Clock} />
                <StatCard title="Key Metrics" value="View All" icon={BarChart2} />
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
                <div className="flex border-b border-gray-200 mb-6">
                  <button onClick={() => setActiveTab('doctors')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'doctors' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>
                    Doctor Management
                  </button>
                  <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'users' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>
                    User Management
                  </button>
                </div>
            
            <div className="overflow-x-auto">
              {activeTab === 'doctors' && (
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email / Specialization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Verification Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">KYC Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {doctors.filter(doctor => doctor.user.role === 'doctor').map(doctor => (
                      <tr key={doctor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doctor.user.profile.first_name} {doctor.user.profile.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          <div>{doctor.user.email}</div>
                          <div className="text-slate-500">{doctor.specialization}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <StatusBadge status={doctor.verification_status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={doctor.kyc_status} />
                            {doctor.kyc_status === 'rejected' && doctor.rejection_reason && (
                              <div className="text-xs text-red-600 mt-1">
                                Reason: {doctor.rejection_reason}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(doctor.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* KYC Actions */}
                            {doctor.kyc_status === 'pending' && (
                              <>
                                <button onClick={() => handleKYCApproval(doctor.id, 'approved')} className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200" title="Approve KYC">
                                  <Check size={16} />
                                </button>
                                <button onClick={() => handleKYCApproval(doctor.id, 'rejected')} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200" title="Reject KYC">
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            
                            {/* Doctor Verification Actions */}
                            {doctor.verification_status === 'pending' && doctor.kyc_status === 'approved' && (
                              <>
                                <button onClick={() => handleDoctorVerification(doctor.id, 'approved')} className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200" title="Approve Doctor">
                                  <UserCheck size={16} />
                                </button>
                                <button onClick={() => handleDoctorVerification(doctor.id, 'rejected')} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200" title="Reject Doctor">
                                  <UserX size={16} />
                                </button>
                              </>
                            )}
                            
                            {doctor.verification_status === 'approved' && (
                              <button onClick={() => handleDoctorVerification(doctor.id, 'suspended')} className="p-2 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200" title="Suspend Doctor">
                                <Ban size={16} />
                              </button>
                            )}
                            
                            {(doctor.verification_status === 'rejected' || doctor.verification_status === 'suspended') && (
                              <button onClick={() => handleDoctorVerification(doctor.id, 'approved')} className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200" title="Re-Approve Doctor">
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'users' && (
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email / Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">KYC Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map(user => {
                            // Find the corresponding doctor profile for this user, if it exists
                            const doctorProfile = doctors.find(d => d.user.id === user.id);

                            return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.profile.first_name} {user.profile.last_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        <div>{user.email}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="capitalize font-medium text-slate-800">{user.role}</span>
                                            {doctorProfile && <StatusBadge status={doctorProfile.verification_status} />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {user.role === 'doctor' && doctorProfile ? (
                                            <div className="flex flex-col gap-1">
                                                <StatusBadge status={doctorProfile.kyc_status} />
                                                {doctorProfile.kyc_status === 'rejected' && doctorProfile.rejection_reason && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        Reason: {doctorProfile.rejection_reason}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {/* --- KYC Actions for Doctors --- */}
                                            {user.role === 'doctor' && doctorProfile && (
                                                <>
                                                    {/* KYC Actions */}
                                                    {doctorProfile.kyc_status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleKYCApproval(doctorProfile.id, 'approved')} className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200" title="Approve KYC">
                                                                <Check size={16} />
                                                            </button>
                                                            <button onClick={() => handleKYCApproval(doctorProfile.id, 'rejected')} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200" title="Reject KYC">
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {/* Doctor Verification Actions */}
                                                    {doctorProfile.verification_status === 'pending' && doctorProfile.kyc_status === 'approved' && (
                                                        <>
                                                            <button onClick={() => handleDoctorVerification(doctorProfile.id, 'approved')} className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200" title="Approve Doctor">
                                                                <UserCheck size={16} />
                                                            </button>
                                                            <button onClick={() => handleDoctorVerification(doctorProfile.id, 'rejected')} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200" title="Reject Doctor">
                                                                <UserX size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {doctorProfile.verification_status === 'approved' && (
                                                        <button onClick={() => handleDoctorVerification(doctorProfile.id, 'suspended')} className="p-2 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200" title="Suspend Doctor">
                                                            <Ban size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    {(doctorProfile.verification_status === 'rejected' || doctorProfile.verification_status === 'suspended') && (
                                                        <button onClick={() => handleDoctorVerification(doctorProfile.id, 'approved')} className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200" title="Re-Approve Doctor">
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            
                                            {/* --- User Account Activation/Deactivation --- */}
                                            {user.role !== 'admin' && (
                                                <button onClick={() => handleUserStatusToggle(user.id, user.is_active)} className={`p-2 rounded-md ${user.is_active ? 'text-red-700 bg-red-100 hover:bg-red-200' : 'text-green-700 bg-green-100 hover:bg-green-200'}`} title={user.is_active ? 'Deactivate Account' : 'Activate Account'}>
                                                    {user.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
              )}
            </div>
          </div>
            </>
          )}
          
          {/* Verify Doctors Section */}
          {activeSection === 'verify-doctors' && (
            <>
              <header className="mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Verify Doctors</h2>
                <p className="text-xl text-slate-600 mt-2">Review and approve doctor applications.</p>
              </header>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email / Specialization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Verification Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">KYC Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Application Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {doctors.filter(doctor => doctor.verification_status === 'pending' || doctor.kyc_status === 'pending').map(doctor => (
                        <tr key={doctor.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {doctor.user.profile.first_name} {doctor.user.profile.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            <div>{doctor.user.email}</div>
                            <div className="text-slate-500">{doctor.specialization}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <StatusBadge status={doctor.verification_status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={doctor.kyc_status} />
                              {doctor.kyc_status === 'rejected' && doctor.rejection_reason && (
                                <div className="text-xs text-red-600 mt-1">
                                  Reason: {doctor.rejection_reason}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {new Date(doctor.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                            <div className="flex justify-end items-center gap-2">
                              {/* KYC Actions */}
                              {doctor.kyc_status === 'pending' && (
                                <>
                                  <button onClick={() => handleKYCApproval(doctor.id, 'approved')} className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200" title="Approve KYC">
                                    <Check size={16} />
                                  </button>
                                  <button onClick={() => handleKYCApproval(doctor.id, 'rejected')} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200" title="Reject KYC">
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                              
                              {/* Doctor Verification Actions */}
                              {doctor.verification_status === 'pending' && doctor.kyc_status === 'approved' && (
                                <>
                                  <button onClick={() => handleDoctorVerification(doctor.id, 'approved')} className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200" title="Approve Doctor">
                                    <UserCheck size={16} />
                                  </button>
                                  <button onClick={() => handleDoctorVerification(doctor.id, 'rejected')} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200" title="Reject Doctor">
                                    <UserX size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
          {/* Settings Section */}
          {activeSection === 'settings' && (
            <>
              <header className="mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Settings</h2>
                <p className="text-xl text-slate-600 mt-2">System configuration and preferences.</p>
              </header>
              <AdminSettingsComponent />
            </>
          )}
          
          {/* Reports Section */}
          {activeSection === 'reports' && (
            <>
              <header className="mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Reports</h2>
                <p className="text-xl text-slate-600 mt-2">Analytics and reporting dashboard.</p>
              </header>
              <ChartsAndReportsComponent />
            </>
          )}
          
          {/* Activity Log Section */}
          {activeSection === 'activity' && (
            <>
              <header className="mb-12">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">Activity Log</h2>
                <p className="text-xl text-slate-600 mt-2">System activity and audit trail.</p>
              </header>
              <ActivityLogComponent />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
