"use client";

import React, { useState, useEffect } from 'react';
import { Heart, User, Calendar, Clock, ArrowLeft, Video, Edit, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
// --- FIX: Uncommented the modal import ---
import RescheduleModal from '@/app/components/RescheduleModal'; 
import VideoCallModal from '@/app/components/VideoCallModal';
// --- END OF FIX ---

// --- Types (assuming they are defined as before) ---
interface AppointmentDetails {
    id: number;
    patient: { id: number; profile: { first_name: string; last_name: string; } };
    doctor: { id: number; profile: { first_name: string; last_name: string; } };
    appointment_type: string;
    status: string;
    scheduled_at: string;
    duration: number;
    notes: string;
}

export default function AppointmentDetailsPage() {
    const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const params = useParams();
    const { id } = params;

    useEffect(() => {
        if (!id) return;
        const fetchAppointment = async () => {
            // Using mock data...
            const mockAppointment: AppointmentDetails = {
                id: Number(id),
                patient: { id: 201, profile: { first_name: 'Sarah', last_name: 'M.' } },
                doctor: { id: 101, profile: { first_name: 'Evelyn', last_name: 'Reed' } },
                appointment_type: 'initial_consultation',
                status: 'scheduled',
                scheduled_at: new Date(new Date().setHours(11, 0, 0)).toISOString(),
                duration: 60,
                notes: 'Patient is seeking help for recurring anxiety and stress related to work.'
            };
            setAppointment(mockAppointment);
            setIsLoading(false);
        };
        fetchAppointment();
    }, [id]);

    const handleStartCall = () => {
        setShowVideoModal(true);
    };

    if (isLoading) return <div>Loading Appointment...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!appointment) return <div>Appointment not found.</div>;
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
            {/* --- FIX: Uncommented the conditional rendering of the modal --- */}
            {isModalOpen && <RescheduleModal appointment={appointment} onClose={() => setIsModalOpen(false)} />}
            {/* --- END OF FIX --- */}
            {/* Video Call Modal */}
            {showVideoModal && (
                <VideoCallModal
                    appointmentId={appointment.id}
                    onClose={() => setShowVideoModal(false)}
                    userToken={typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}
                />
            )}

            <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
                <Link href="/dashboard/doctor" className="font-semibold text-slate-600 hover:text-emerald-600 flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Appointment Details</h1>
                <div/>
            </nav>

            <main className="relative z-10 p-8 sm:p-12">
                <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Left Side: Patient Info (unchanged) */}
                        <div className="md:col-span-1 border-r pr-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Patient Information</h3>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center text-2xl font-bold text-blue-700">
                                    {appointment.patient.profile.first_name.charAt(0)}{appointment.patient.profile.last_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-slate-800">{appointment.patient.profile.first_name} {appointment.patient.profile.last_name}</p>
                                    <p className="text-sm text-slate-500">Patient ID: {appointment.patient.id}</p>
                                </div>
                            </div>
                            <h4 className="font-semibold text-slate-700 mb-2">Reason for Visit</h4>
                            <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">{appointment.notes || 'No notes provided.'}</p>
                        </div>

                        {/* Right Side: Appointment Details & Actions (unchanged) */}
                        <div className="md:col-span-2">
                             <h3 className="text-xl font-bold text-gray-900 mb-4">Session Details</h3>
                             <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-emerald-600" />
                                    <span className="text-slate-700">{new Date(appointment.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                 <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-emerald-600" />
                                    <span className="text-slate-700">{new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({appointment.duration} minutes)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-emerald-600" />
                                    <span className="text-slate-700 capitalize">{appointment.appointment_type.replace('_', ' ')}</span>
                                </div>
                             </div>
                             
                             <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                                <button onClick={handleStartCall} className="flex-1 group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                                    <Video size={20}/> Start Virtual Call
                                </button>
                                <button onClick={() => setIsModalOpen(true)} className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-full font-semibold text-lg hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-2">
                                    <Edit size={20}/> Reschedule
                                </button>
                                <button className="flex-1 bg-red-50 text-red-700 px-6 py-3 rounded-full font-semibold text-lg hover:bg-red-100 transition-all duration-300 flex items-center justify-center gap-2">
                                    <XCircle size={20}/> Cancel
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}