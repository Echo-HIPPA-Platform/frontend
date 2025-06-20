"use client";

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, ShieldCheck, BarChart2, Check, X, UserX, CheckCircle, Ban, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';

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
  created_at: string;
}

// --- Main Admin Dashboard Component ---
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [doctors, setDoctors] = useState<DoctorResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'doctors' | 'users'>('doctors');

  const fetchAdminData = async () => {
    // This function will be re-used to refresh data after updates
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }
    try {
      const [statsRes, doctorsRes, usersRes] = await Promise.all([
        fetch('/api/v1/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/v1/admin/doctors', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/v1/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!statsRes.ok || !doctorsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch admin data. Ensure the backend server is running and you are logged in as an admin.');
      }
      
      const statsData = await statsRes.json();
      const doctorsData = await doctorsRes.json();
      const usersData = await usersRes.json();
      
      setStats(statsData);
      setDoctors(doctorsData.doctors || []);
      setUsers(usersData.users || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDoctorVerification = async (doctorId: number, action: 'approved' | 'rejected' | 'suspended') => {
    const token = localStorage.getItem('authToken');
    let reason = '';
    if (action === 'rejected' || action === 'suspended') {
        reason = prompt(`Please provide a reason for this action (${action}):`) || "";
        if (reason.trim() === '') {
            alert('A reason is required to perform this action.');
            return;
        }
    }
    try {
        const response = await fetch(`/api/v1/admin/doctors/${doctorId}/verify`, {
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

  const handleUserStatusToggle = async (userId: number, currentStatus: boolean) => {
    const token = localStorage.getItem('authToken');
    const newStatus = !currentStatus;
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user account?`)) return;

    try {
        const response = await fetch(`/api/v1/admin/users/${userId}/status`, {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
         <Link href="/" className="flex items-center gap-3"> <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-gray-900 rounded-full flex items-center justify-center"> <ShieldCheck className="w-6 h-6 text-white" /> </div> <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1> </Link>
        <a href="/api/v1/auth/logout" className="font-semibold text-slate-600 hover:text-red-600 transition-colors">Sign Out</a>
      </nav>

      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12"> <h2 className="text-4xl lg:text-5xl font-bold text-gray-900"> Dashboard </h2> <p className="text-xl text-slate-600 mt-2"> System overview and management tools. </p> </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"> <StatCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} /> <StatCard title="Total Doctors" value={stats?.total_doctors ?? 0} icon={UserCheck} /> <StatCard title="Pending Applications" value={stats?.pending_doctors ?? 0} icon={Clock} /> <StatCard title="Key Metrics" value="View All" icon={BarChart2} /> </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
            <div className="flex border-b border-gray-200 mb-6"> <button onClick={() => setActiveTab('doctors')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'doctors' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}> Doctor Management </button> <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-lg font-semibold transition-colors ${activeTab === 'users' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}> User Management </button> </div>
            
            <div className="overflow-x-auto">
              {activeTab === 'doctors' && (
                <table className="min-w-full bg-white">
                    {/* Doctor Table JSX from previous response (it's already correct) */}
                </table>
              )}

              {activeTab === 'users' && (
                <table className="min-w-full bg-white">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email / Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Account Status</th>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {/* --- FIX: Display Doctor Actions in the User Table --- */}
                                            {user.role === 'doctor' && doctorProfile && (
                                                <>
                                                    {doctorProfile.verification_status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleDoctorVerification(doctorProfile.id, 'approved')} className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200" title="Approve Doctor"><Check size={16} /></button>
                                                            <button onClick={() => handleDoctorVerification(doctorProfile.id, 'rejected')} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200" title="Reject Doctor"><X size={16} /></button>
                                                        </>
                                                    )}
                                                    {doctorProfile.verification_status === 'approved' && (
                                                        <button onClick={() => handleDoctorVerification(doctorProfile.id, 'suspended')} className="p-2 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-200" title="Suspend Doctor"><Ban size={16} /></button>
                                                    )}
                                                    {(doctorProfile.verification_status === 'rejected' || doctorProfile.verification_status === 'suspended') && (
                                                        <button onClick={() => handleDoctorVerification(doctorProfile.id, 'approved')} className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200" title="Re-Approve Doctor"><CheckCircle size={16} /></button>
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
        </div>
      </main>
    </div>
  );
}