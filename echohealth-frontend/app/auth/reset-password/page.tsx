"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApiService } from '../../../services/authApi';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    // Check if token exists
    if (!token) {
      setError('Invalid or missing reset token');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApiService.resetPassword({
        token,
        password: formData.password
      });
      
      console.log('Reset password response:', response);
      setIsSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++;
    
    return {
      score: strength,
      label: strength < 2 ? 'Weak' : strength < 4 ? 'Medium' : 'Strong',
      color: strength < 2 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-500' : 'bg-green-500'
    };
  };

  if (isSuccess) {
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
                Password Reset Successfully
              </h2>
              
              <p className="text-slate-600 mb-8">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>

              <Link
                href="/auth/login"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block"
              >
                Sign In Now
              </Link>
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
            Set New
            <span className="block bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Password
            </span>
          </h2>
          
          <p className="text-slate-600 text-center mb-8">
            Choose a strong password for your account.
          </p>

          {!token && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 text-sm text-center">
                Don't have a reset token?{' '}
                <Link href="/auth/forgot-password" className="font-medium text-yellow-700 hover:text-yellow-600 underline">
                  Request a new password reset
                </Link>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
                  placeholder="Enter new password"
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
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      getPasswordStrength(formData.password).score < 2 ? 'text-red-600' : 
                      getPasswordStrength(formData.password).score < 4 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrength(formData.password).label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < getPasswordStrength(formData.password).score 
                            ? getPasswordStrength(formData.password).color 
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">
              <p className="font-medium mb-2">Password requirements:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-slate-300'}`} />
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${/(?=.*[a-z])/.test(formData.password) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  One lowercase letter
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${/(?=.*[A-Z])/.test(formData.password) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  One uppercase letter
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${/(?=.*\d)/.test(formData.password) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  One number
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${/(?=.*[!@#$%^&*])/.test(formData.password) ? 'bg-green-500' : 'bg-slate-300'}`} />
                  One special character
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
              disabled={isLoading || !formData.password || !formData.confirmPassword || !token}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
