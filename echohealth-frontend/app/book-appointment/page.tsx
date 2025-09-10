"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, User, ArrowLeft, Calendar, Clock, MapPin, Star, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import usePaystack from '@/app/hooks/usePaystack';

// Types
interface Doctor {
  id: number;
  profile: {
    first_name: string;
    last_name: string;
  };
  doctor_profile?: {
    specialization: string;
    years_of_experience: number;
    bio: string;
  };
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

// API configuration
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export default function BookAppointmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedType, setSelectedType] = useState<'online' | 'in-person'>('online');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializePayment = usePaystack();

  // Mock doctors data (same as in doctors page)
  const mockDoctors: Doctor[] = [
    {
      id: 1,
      profile: {
        first_name: 'Dr. Evelyn',
        last_name: 'Reed'
      },
      doctor_profile: {
        specialization: 'Clinical Psychology',
        years_of_experience: 8,
        bio: 'Specializing in anxiety, depression, and trauma therapy. I believe in a collaborative approach to healing.'
      }
    },
    {
      id: 2,
      profile: {
        first_name: 'Dr. Samuel',
        last_name: 'Chen'
      },
      doctor_profile: {
        specialization: 'Behavioral Therapy',
        years_of_experience: 6,
        bio: 'Focused on cognitive behavioral therapy and mindfulness-based interventions.'
      }
    },
    {
      id: 3,
      profile: {
        first_name: 'Dr. Maya',
        last_name: 'Williams'
      },
      doctor_profile: {
        specialization: 'Family Therapy',
        years_of_experience: 10,
        bio: 'Helping families and couples build stronger relationships through effective communication.'
      }
    },
    {
      id: 4,
      profile: {
        first_name: 'Dr. Michael',
        last_name: 'Johnson'
      },
      doctor_profile: {
        specialization: 'Child Psychology',
        years_of_experience: 5,
        bio: 'Specialized in working with children and adolescents facing emotional and behavioral challenges.'
      }
    }
  ];

  // Available time slots
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const userResponse = await fetch(`${apiBaseUrl}/api/v1/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!userResponse.ok) throw new Error('Failed to fetch user profile');
        const userData: UserResponse = await userResponse.json();
        setUser(userData);

        // Get selected doctor from localStorage
        const selectedDoctorId = localStorage.getItem('selected_doctor_id');
        if (selectedDoctorId) {
          const doctor = mockDoctors.find(d => d.id === parseInt(selectedDoctorId));
          if (doctor) {
            setSelectedDoctor(doctor);
          }
        }

        // If no doctor selected, redirect to doctors page
        if (!selectedDoctorId) {
          router.push('/doctors');
          return;
        }

      } catch (err: any) {
        setError(err.message || 'An error occurred while loading data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

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

  const handlePaymentSuccess = useCallback((reference: any) => {
    console.log("Payment successful. Verifying on backend...");
    setIsProcessingPayment(true);
    
    verifyPaymentOnBackend(reference.reference).then((isVerified) => {
      if (isVerified) {
        // Create appointment in backend (placeholder)
        alert(`Payment verified! Your appointment with ${selectedDoctor?.profile.first_name} ${selectedDoctor?.profile.last_name} has been scheduled for ${selectedDate} at ${selectedTime}.`);
        
        // Clear selected doctor and redirect to dashboard
        localStorage.removeItem('selected_doctor_id');
        router.push('/dashboard/patient');
      } else {
        alert('Payment could not be verified. Please contact support.');
        setIsProcessingPayment(false);
      }
    }).catch((error) => {
      console.error('Payment verification error:', error);
      alert('Payment verification failed. Please contact support.');
      setIsProcessingPayment(false);
    });
  }, [selectedDoctor, selectedDate, selectedTime, verifyPaymentOnBackend, router]);

  const handlePaymentClose = useCallback(() => {
    console.log('Payment popup closed by user.');
  }, []);

  const validateCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiBaseUrl}/api/v1/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: couponCode.trim() })
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        setAppliedCoupon({
          code: couponCode.trim(),
          discount: result.discount
        });
        setCouponError('');
      } else {
        setCouponError(result.error || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError('Failed to validate coupon code');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  }, [couponCode]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  }, []);

  const handleBookAppointment = useCallback(async () => {
    if (!selectedDate || !selectedTime || !user || !selectedDoctor) {
      alert('Please fill in all required fields.');
      return;
    }

    // Calculate final amount after coupon discount
    const originalAmount = 200000; // 2000 KES in kobo
    const discountAmount = appliedCoupon ? (originalAmount * appliedCoupon.discount / 100) : 0;
    const finalAmount = originalAmount - discountAmount;

    // If 100% discount, bypass payment and create appointment directly
    if (appliedCoupon && appliedCoupon.discount === 100) {
      try {
        setIsProcessingPayment(true);
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${apiBaseUrl}/api/v1/appointments/create-free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            doctor_id: selectedDoctor.id,
            appointment_date: selectedDate,
            appointment_time: selectedTime,
            appointment_type: selectedType,
            notes: notes,
            coupon_code: appliedCoupon.code
          })
        });

        if (response.ok) {
          alert(`Appointment booked successfully with ${selectedDoctor?.profile.first_name} ${selectedDoctor?.profile.last_name} for ${selectedDate} at ${selectedTime}. No payment required!`);
          localStorage.removeItem('selected_doctor_id');
          router.push('/dashboard/patient');
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create appointment');
        }
      } catch (error) {
        console.error('Appointment creation error:', error);
        alert('Failed to create appointment. Please try again.');
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    // Regular payment flow
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      alert('Payment configuration error. Please contact support.');
      return;
    }

    initializePayment({
      publicKey: publicKey,
      email: user.email,
      amount: finalAmount,
      currency: 'KES',
      reference: 'echo_' + Math.floor((Math.random() * 1000000000) + 1),
      metadata: {
        customer_name: `${user.profile.first_name} ${user.profile.last_name}`,
        doctor_name: `${selectedDoctor.profile.first_name} ${selectedDoctor.profile.last_name}`,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_type: selectedType,
        purpose: 'Appointment Booking',
        coupon_code: appliedCoupon?.code || '',
        original_amount: originalAmount,
        discount_amount: discountAmount
      },
      onSuccess: handlePaymentSuccess,
      onClose: handlePaymentClose,
    });
  }, [user, selectedDoctor, selectedDate, selectedTime, selectedType, notes, appliedCoupon, initializePayment, handlePaymentSuccess, handlePaymentClose, router]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p>Loading appointment booking...</p>
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
        <Link href="/doctors" className="flex items-center gap-3">
          <ArrowLeft className="w-6 h-6 text-emerald-600" />
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Echo Psychology
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{user?.profile.first_name.charAt(0)}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 p-8 sm:p-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Book Your Appointment
            </h2>
            <p className="text-xl text-slate-600">
              Schedule your session with {selectedDoctor?.profile.first_name} {selectedDoctor?.profile.last_name}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Info */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 sticky top-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">
                      {selectedDoctor?.profile.first_name.charAt(3)}{selectedDoctor?.profile.last_name.charAt(3)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {selectedDoctor?.profile.first_name} {selectedDoctor?.profile.last_name}
                  </h3>
                  <p className="text-emerald-600 font-semibold mb-2">
                    {selectedDoctor?.doctor_profile?.specialization}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-slate-600 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">4.9 (127 reviews)</span>
                  </div>
                  <p className="text-slate-600 text-sm">
                    {selectedDoctor?.doctor_profile?.bio}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100">
                <div className="space-y-6">
                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Appointment Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedType('online')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                          selectedType === 'online'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">💻</span>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Online</div>
                          <div className="text-sm opacity-75">Video consultation</div>
                        </div>
                      </button>
                      <button
                        onClick={() => setSelectedType('in-person')}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                          selectedType === 'in-person'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold">In-Person</div>
                          <div className="text-sm opacity-75">At our clinic</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                    />
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Select Time
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                            selectedTime === time
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any specific concerns or topics you'd like to discuss..."
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                      rows={3}
                    />
                  </div>

                  {/* Pricing */}
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-600">Consultation Fee</span>
                      <span className="text-2xl font-bold text-slate-800">KES 2,000</span>
                    </div>

                    {/* Coupon Code */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Coupon Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
                          disabled={!!appliedCoupon || isValidatingCoupon}
                        />
                        {appliedCoupon ? (
                          <button
                            onClick={removeCoupon}
                            className="px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={validateCoupon}
                            disabled={isValidatingCoupon || !couponCode.trim()}
                            className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50"
                          >
                            {isValidatingCoupon ? 'Validating...' : 'Apply'}
                          </button>
                        )}
                      </div>
                      {couponError && (
                        <p className="text-sm text-red-600 mt-2">{couponError}</p>
                      )}
                      {appliedCoupon && (
                        <p className="text-sm text-emerald-700 mt-2">Coupon applied: {appliedCoupon.code} ({appliedCoupon.discount}% off)</p>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="space-y-2 text-slate-700">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span>KES 2,000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Discount</span>
                        <span>{appliedCoupon ? `${appliedCoupon.discount}%` : '—'}</span>
                      </div>
                      <div className="border-t pt-2 flex items-center justify-between font-semibold">
                        <span>Total</span>
                        <span>{appliedCoupon && appliedCoupon.discount === 100 ? 'KES 0' : 'KES ' + (2000 - Math.round(2000 * (appliedCoupon?.discount || 0) / 100))}</span>
                      </div>
                    </div>

                    <div className="text-sm text-slate-500 mt-4">
                      • 50-minute session
                      • {selectedType === 'online' ? 'Secure video call' : 'In-person consultation'}
                      • Professional mental health support
                    </div>
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={handleBookAppointment}
                    disabled={!selectedDate || !selectedTime || isProcessingPayment}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-3"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay & Book Appointment
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
