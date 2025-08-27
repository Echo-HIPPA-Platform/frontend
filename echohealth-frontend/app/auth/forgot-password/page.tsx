"use client";

import React, { useState } from 'react';
import { Heart, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { authApiService } from '../../../services/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApiService.forgotPassword(email);
      console.log('Forgot password response:', response);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Check Your Email
              </h2>
              
              <p className="text-slate-600 mb-6">
                If your email is registered with us, you'll receive a password reset link shortly.
              </p>
              
              <p className="text-sm text-slate-500 mb-8">
                Didn't receive an email? Check your spam folder or try again.
              </p>

              <div className="space-y-4">
                <Link
                  href="/auth/login"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block"
                >
                  Back to Sign In
                </Link>
                
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full text-emerald-600 hover:text-emerald-700 font-medium transition-colors py-2"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          {/* Back button */}
          <Link 
            href="/auth/login" 
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>

          <h2 className="text-4xl font-bold text-slate-800 mb-4 text-center">
            Reset Your
            <span className="block bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Password
            </span>
          </h2>
          
          <p className="text-slate-600 text-center mb-8">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Remember your password?{' '}
                <Link 
                  href="/auth/login" 
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
