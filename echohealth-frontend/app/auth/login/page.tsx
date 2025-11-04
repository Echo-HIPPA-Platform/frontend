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

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

    try {
      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Invalid email or password. Please try again.');
      }

      // Store authentication data
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server. Please try again.');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      const role = data.user?.role;

      // Small delay to ensure localStorage is set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect based on role
      switch (role) {
        case 'doctor':
          router.push('/dashboard/doctor');
          break;
        case 'patient':
          router.push('/dashboard/patient');
          break;
        case 'admin':
          router.push('/dashboard/admin');
          break;
        default:
          router.push('/dashboard');
          break;
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
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
          <h2 className="text-4xl font-bold text-slate-800 mb-4 text-center">
            Sign in to
            <span className="block bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Echo Psychology
            </span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
            {error && <p className="text-red-500 text-sm">{error}</p>}

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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
                  placeholder="Enter your email"
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
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div className="mt-6 text-center space-y-4">
              <p className="text-slate-600">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

