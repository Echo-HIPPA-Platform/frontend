"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('Dashboard page loading...');
    const userData = localStorage.getItem('user_data');
    const token = localStorage.getItem('auth_token');
    
    console.log('Auth check - userData:', userData ? 'exists' : 'missing');
    console.log('Auth check - token:', token ? 'exists' : 'missing');
    
    if (!userData || !token) {
      console.log('Missing auth data, redirecting to login');
      // If no user data or token, redirect to login
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      const role = user.role;
      console.log('User role found:', role);
      console.log('User data:', user);

      // Redirect to appropriate dashboard based on role
      switch (role) {
        case 'doctor':
          console.log('Redirecting to doctor dashboard');
          router.push('/dashboard/doctor');
          break;
        case 'patient':
          console.log('Redirecting to patient dashboard');
          router.push('/dashboard/patient');
          break;
        case 'admin':
          console.log('Redirecting to admin dashboard');
          router.push('/dashboard/admin');
          break;
        default:
          console.log('Unknown role, redirecting to patient dashboard as default');
          // If role is not recognized, redirect to patient dashboard as default
          router.push('/dashboard/patient');
          break;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      console.error('Raw user data:', userData);
      // If there's an error parsing user data, redirect to login
      router.push('/auth/login');
    }
  }, [router]);

  // Show a loading screen while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
          Echo Psychology
        </h2>
        <p className="text-slate-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
