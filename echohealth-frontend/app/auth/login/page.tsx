"use client";

import React, { useState } from 'react';
import { Heart, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        
        // --- FIX: STORE THE AUTHENTICATION TOKEN ---
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          console.log('Auth token stored in localStorage.');
        }
        // --- END OF FIX ---

        const userRole = data.user?.role;
        console.log(`User role identified: ${userRole}. Redirecting...`);

        switch (userRole) {
          case 'patient':
            router.push('/dashboard/patient');
            break;
          case 'doctor':
            router.push('/dashboard/doctor');
            break;
          case 'admin':
            router.push('/dashboard/admin');
            break;
        }

      } else {
        setError(data.error || 'An unknown error occurred. Please try again.');
      }
    } catch (err) {
      console.error('Network or server error:', err);
      setError('Could not connect to the server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* UI Code is unchanged... */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Echo Psychology
          </h1>
        </Link>
      </nav>
      <main className="relative z-10 px-8 sm:px-20 py-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Welcome Back to
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent block">
                Echo Psychology
              </span>
            </h2>
            <p className="text-xl text-slate-600">
              Continue your journey to mental wellness
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 sm:p-12 border border-emerald-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    disabled={isLoading}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-700">
                    Remember me
                  </label>
                </div>
                <Link href="/auth/reset" className="text-sm text-emerald-600 hover:text-emerald-500">
                  Forgot password?
                </Link>
              </div>
              <div className="flex flex-col gap-4 pt-6">
                <button
                  type="submit"
                  className="w-full group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-75 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                  {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
                <div className="text-center">
                  <span className="text-slate-600">Don't have an account?</span>
                  <Link href="/auth/signup" className="ml-2 text-emerald-600 hover:text-emerald-500 font-medium">
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}