"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, User, LogOut, Settings, ArrowRight, Bell, ClipboardList, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import usePaystack from '@/app/hooks/usePaystack'; // Import the custom hook we created

// --- Types based on your Go backend DTOs ---
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
  id: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  platform: 'Online' | 'In-Person';
}


// API configuration
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// --- Reusable Paystack Button using the custom hook ---
const PaystackScheduleButton = ({ userEmail, userName }: { userEmail: string; userName: string; }) => {
    const router = useRouter();
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const initializePayment = usePaystack(); // Use our custom hook

    // Securely verifies the transaction with your Go backend
    const verifyPaymentOnBackend = useCallback(async (reference: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${apiBaseUrl}/api/v1/payments/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reference })
            });
            return response.ok;
        } catch (error) {
            console.error("Backend payment verification failed:", error);
            return false;
        }
    }, []);

    // Create stable callback functions using useCallback
    const handlePaymentSuccess = useCallback((reference: any) => {
        setIsProcessingPayment(true);
        
        // Handle verification asynchronously but don't make the callback async
        verifyPaymentOnBackend(reference.reference).then((isVerified) => {
            if (isVerified) {
                alert('Payment verified! You can now schedule your appointment.');
                // Redirect to the actual schedule page after successful verification
                router.push('/schedule');
            } else {
                alert('Payment verification failed. Please copy your transaction reference and contact our support team for assistance.');
                setIsProcessingPayment(false);
            }
        }).catch((error) => {
            alert(`Payment verification failed. Please save your transaction reference (${reference.reference}) and contact our support team.`);
            setIsProcessingPayment(false);
        });
    }, [verifyPaymentOnBackend, router]);

    const handlePaymentClose = useCallback(() => {
        if (isProcessingPayment) {
            alert('Please wait while we verify your payment...');
            return;
        }
        alert('Payment cancelled. You can try again when you\'re ready.');
    }, [isProcessingPayment]);

    // This function is called when the user clicks the button
    const handlePayment = useCallback(() => {
        // Validate environment variable
        const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
        if (!publicKey) {
            alert('We\'re currently experiencing issues with our payment system. Please try again later or contact our support team.');
            return;
        }

        // Validate user data
        if (!userEmail || !userName) {
            alert('Your session information appears to be incomplete. Please try logging out and back in, or contact our support team if the issue persists.');
            return;
        }

        initializePayment({
            publicKey: publicKey,
            email: userEmail,
            amount: 200000, // 2000 KES in kobo
            currency: 'KES',
            reference: 'echo_' + Math.floor((Math.random() * 1000000000) + 1), // Unique ref
            metadata: {
                customer_name: userName,
                purpose: 'Appointment Booking Consultation Fee'
            },
            onSuccess: handlePaymentSuccess,
            onClose: handlePaymentClose,
        });
    }, [userEmail, userName, initializePayment, handlePaymentSuccess, handlePaymentClose]);

    return (
        <button 
            onClick={handlePayment} 
            disabled={isProcessingPayment}
            className="w-full group bg-slate-800 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:bg-slate-900 transition-all duration-300 flex items-center justify-between shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
        >
            <span>{isProcessingPayment ? 'Verifying Payment...' : 'Schedule Appointment'}</span>
            {!isProcessingPayment && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
        </button>
    );
};


// --- Main Dashboard Component ---
export default function PatientDashboardPage() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        window.location.href = '/auth/login';
        return;
      }
      try {
        const userResponse = await fetch(`${apiBaseUrl}/api/v1/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!userResponse.ok) { throw new Error('Failed to fetch user profile'); }
        const userData: UserResponse = await userResponse.json();
        setUser(userData);

        const mockAppointments: Appointment[] = [
          { id: 'appt1', doctorName: 'Dr. Evelyn Reed', specialization: 'Clinical Psychology', date: 'June 20, 2025', time: '11:00 AM EAT', platform: 'Online'},
          { id: 'appt2', doctorName: 'Dr. Samuel Chen', specialization: 'Behavioral Therapy', date: 'June 27, 2025', time: '2:30 PM EAT', platform: 'In-Person'},
        ];
        setAppointments(mockAppointments);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading your data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-slate-700">Loading your dashboard...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center"><Heart className="w-6 h-6 text-white" /></div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Echo Psychology</h1>
        </Link>
        <div className="flex items-center gap-4">
          <Bell className="w-6 h-6 text-slate-500 hover:text-emerald-600 cursor-pointer transition-colors" />
          <div className="relative group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center cursor-pointer"><span className="text-white font-bold text-lg">{user?.profile.first_name.charAt(0)}</span></div>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
              <Link href="/dashboard/profile" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50"><User size={16} /> My Profile</Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50"><Settings size={16} /> Settings</Link>
              <div className="border-t my-1"></div>
              <a href="#" onClick={() => { localStorage.removeItem('auth_token'); localStorage.removeItem('user_data'); window.location.href = '/auth/login'; }} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50"><LogOut size={16} /> Sign Out</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12"> <h2 className="text-4xl lg:text-5xl font-bold text-slate-800"> Welcome back, {user?.profile.first_name}! </h2> <p className="text-xl text-slate-600 mt-2"> Here is your personal wellness dashboard. </p> </header>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8"> <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100"> <h3 className="text-2xl font-bold text-slate-800 mb-6">Upcoming Appointments</h3> <div className="space-y-6"> {/* Appointment mapping */} </div> </div> </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
                <h3 className="text-2xl font-bold text-slate-800 mb-6">Quick Actions</h3>
                <div className="space-y-4">
                  
                  {/* Schedule Appointment - now leads to doctor selection */}
                  <Link href="/doctors" className="w-full group bg-emerald-500 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-600 transition-all duration-300 flex items-center justify-between">
                    <span>Schedule Appointment</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                  </Link>

                  <Link href="/appointments/history" className="w-full group bg-slate-100 text-slate-700 px-6 py-4 rounded-xl font-semibold text-lg hover:bg-slate-200 transition-all duration-300 flex items-center justify-between"><span>Appointment History</span><ClipboardList className="w-5 h-5 text-slate-400" /></Link>
                  <Link href="/doctors" className="w-full group bg-slate-100 text-slate-700 px-6 py-4 rounded-xl font-semibold text-lg hover:bg-slate-200 transition-all duration-300 flex items-center justify-between"><span>Find a Doctor</span><Search className="w-5 h-5 text-slate-400" /></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}