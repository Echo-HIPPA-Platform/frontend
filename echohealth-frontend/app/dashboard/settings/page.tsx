"use client";

import React, { useState, useEffect } from 'react';
import { Heart, User, Lock, Save, ArrowLeft, Shield, Calendar, Bell, Banknote } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('security');
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('');
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
        const token = localStorage.getItem('authToken');
        // TODO: Create a backend endpoint GET /api/v1/doctors/settings
        const mockPaymentMethod = "+254 712 345 678";
        setPaymentMethod(mockPaymentMethod);
    };
    fetchSettings();
  }, []);

  // --- FIX: This function was missing ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  // --- END OF FIX ---

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
        setPasswordError("New password must be at least 8 characters long.");
        return;
    }

    setIsPasswordSaving(true);
    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch('/api/v1/users/me/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword,
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update password.');

        setPasswordSuccess('Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
        setPasswordError(err.message);
    } finally {
        setIsPasswordSaving(false);
    }
  };

  const handlePaymentSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);
    setIsPaymentSaving(true);
    const token = localStorage.getItem('authToken');

    try {
        // TODO: Implement this API call
        console.log("Saving payment method:", paymentMethod);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPaymentSuccess('Payment method updated successfully!');
    } catch (err: any) {
        setPaymentError(err.message);
    } finally {
        setIsPaymentSaving(false);
    }
  };

  // Helper component for styled form inputs
  const FormInput = ({ name, label, type = "password", value, onChange }: any) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type={type} name={name} id={name} value={value} onChange={onChange} required className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"/>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
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

      <main className="relative z-10 p-4 sm:p-8 md:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900">Settings</h2>
            <p className="text-lg text-slate-600 mt-1">Manage your account, payments, and notification preferences.</p>
          </header>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* Sidebar Navigation */}
            <aside className="md:w-1/3 lg:w-1/4">
              <div className="space-y-2">
                 <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                    <User size={20} /> My Profile
                 </Link>
                 <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-left transition-colors ${activeTab === 'security' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                    <Shield size={20} /> Account Security
                 </button>
                 <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-left transition-colors ${activeTab === 'payments' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                    <Banknote size={20} /> Payment Settings
                 </button>
                 <Link href="/dashboard/doctor/availability" className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                    <Calendar size={20} /> Availability
                 </Link>
                 <button disabled className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-left text-slate-400 cursor-not-allowed">
                    <Bell size={20} /> Notifications
                 </button>
              </div>
            </aside>

            {/* Content Area */}
            <div className="flex-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
                    {activeTab === 'security' && (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h3>
                            <p className="text-slate-600 mb-6">Choose a strong, unique password to keep your account secure.</p>
                            {passwordError && <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg">{passwordError}</div>}
                            {passwordSuccess && <div className="p-4 mb-4 text-sm text-green-800 bg-green-100 rounded-lg">{passwordSuccess}</div>}
                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <FormInput name="currentPassword" label="Current Password" value={passwordData.currentPassword} onChange={handleInputChange} />
                                <FormInput name="newPassword" label="New Password" value={passwordData.newPassword} onChange={handleInputChange} />
                                <FormInput name="confirmPassword" label="Confirm New Password" value={passwordData.confirmPassword} onChange={handleInputChange} />
                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={isPasswordSaving} className="group bg-slate-800 text-white px-6 py-3 rounded-full font-semibold text-lg hover:bg-slate-900 disabled:opacity-70 flex items-center gap-2">
                                        <Save size={20} /> {isPasswordSaving ? 'Saving...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Settings</h3>
                            <p className="text-slate-600 mb-6">Enter your preferred method for receiving payments. Payouts are processed monthly.</p>
                            {paymentError && <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg">{paymentError}</div>}
                            {paymentSuccess && <div className="p-4 mb-4 text-sm text-green-800 bg-green-100 rounded-lg">{paymentSuccess}</div>}
                            <form onSubmit={handlePaymentSave} className="space-y-6">
                                <div>
                                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-2">Payment Method (e.g., M-Pesa Number)</label>
                                    <input name="paymentMethod" id="paymentMethod" placeholder="+254 7XX XXX XXX" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required className="w-full p-3 rounded-xl border border-slate-200" />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={isPaymentSaving} className="group bg-slate-800 text-white px-6 py-3 rounded-full font-semibold text-lg hover:bg-slate-900 disabled:opacity-70 flex items-center gap-2">
                                        <Save size={20} /> {isPaymentSaving ? 'Saving...' : 'Save Payment Method'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}