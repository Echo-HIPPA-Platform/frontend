"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Save, Edit3, ArrowLeft, CheckCircle, AlertCircle, Heart, Mail, Phone, Home, BookUser, Award, GraduationCap, Info, BriefcaseMedical, Clock } from "lucide-react";
import Link from 'next/link';

// --- Types (from your original code) ---
interface UserProfile { first_name: string; last_name: string; phone?: string; address?: string; /* ...other fields */ }
interface UserResponse { id: number; email: string; role: string; profile: UserProfile; is_active: boolean; }
interface DoctorProfile { id: number; license_number: string; specialization: string; years_of_experience: number; education: string; bio: string; verification_status: 'pending' | 'approved' | 'rejected' | 'suspended'; }

export default function DoctorProfilePage() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", phone: "", address: "",
    license_number: "", specialization: "", years_of_experience: 0, education: "", bio: "",
  });

  const fetchProfileData = async () => {
    // This data fetching logic from your original file is solid and remains.
    // ... (Your existing fetchProfileData logic)
  };
  useEffect(() => { fetchProfileData(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "years_of_experience" ? parseInt(value) || 0 : value }));
  };

  const handleSave = async () => {
    // This save logic from your original file is solid and remains.
    // ... (Your existing handleSave logic)
  };
  
  const handleCancel = () => {
    // Re-populate form with original data and exit edit mode
    setFormData({
        first_name: user?.profile?.first_name || "",
        last_name: user?.profile?.last_name || "",
        phone: user?.profile?.phone || "",
        address: user?.profile?.address || "",
        license_number: doctorProfile?.license_number || "",
        specialization: doctorProfile?.specialization || "",
        years_of_experience: doctorProfile?.years_of_experience || 0,
        education: doctorProfile?.education || "",
        bio: doctorProfile?.bio || "",
    });
    setIsEditing(false);
  };
  
  if (isLoading) { /* ... Loading UI ... */ }
  if (error && !user) { /* ... Error UI ... */ }

  const FormInput = ({ name, label, value, icon: Icon, disabled = false }: any) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <div className="relative">
            <Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" name={name} id={name} value={value} onChange={handleInputChange} disabled={disabled} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors disabled:bg-slate-50"/>
        </div>
    </div>
  );

  const FormTextarea = ({ name, label, value, icon: Icon, disabled = false, rows = 4 }: any) => (
    <div className="md:col-span-2">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <div className="relative">
            <Icon className="w-5 h-5 text-slate-400 absolute left-3 top-4" />
            <textarea name={name} id={name} value={value} onChange={handleInputChange} disabled={disabled} rows={rows} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors disabled:bg-slate-50"/>
        </div>
    </div>
  );

  const InfoRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex items-start gap-4 py-2">
        <Icon className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
        <div>
            <dt className="text-sm font-medium text-slate-500">{label}</dt>
            <dd className="text-md text-slate-800">{value || 'N/A'}</dd>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 sm:px-20 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
         <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Echo Psychology</h1>
        </Link>
        <Link href="/dashboard/doctor" className="font-semibold text-slate-600 hover:text-emerald-600 flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 p-4 sm:p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <div>
                <h2 className="text-4xl font-bold text-gray-900">My Profile</h2>
                <p className="text-lg text-slate-600 mt-1">View and edit your personal and professional information.</p>
            </div>
          </header>

          {/* Alerts */}
          <div className="mb-6">
            {error && <div className="flex items-center gap-2 p-4 bg-red-100 text-red-800 rounded-xl"><AlertCircle size={18} /> {error}</div>}
            {success && <div className="flex items-center gap-2 p-4 bg-green-100 text-green-800 rounded-xl"><CheckCircle size={18} /> {success}</div>}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mb-6 pb-6 border-b border-gray-200">
                {isEditing ? (
                    <>
                        <button onClick={handleCancel} className="bg-slate-100 text-slate-700 px-5 py-2 rounded-full font-semibold hover:bg-slate-200 transition-all duration-300">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-full font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-70">
                            <Save size={16}/> {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="group bg-slate-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-slate-900 transition-all duration-300 flex items-center gap-2">
                        <Edit3 size={16}/> Edit Profile
                    </button>
                )}
            </div>
            
            {isEditing ? (
                // --- EDITING FORM ---
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <h3 className="md:col-span-2 text-xl font-bold text-gray-900 border-b pb-2 mb-2">Personal Information</h3>
                    <FormInput name="first_name" label="First Name" value={formData.first_name} icon={User} />
                    <FormInput name="last_name" label="Last Name" value={formData.last_name} icon={User} />
                    <FormInput name="phone" label="Phone Number" value={formData.phone} icon={Phone} />
                    <FormInput name="address" label="Address" value={formData.address} icon={Home} />
                    
                    <h3 className="md:col-span-2 text-xl font-bold text-gray-900 border-b pb-2 mt-6 mb-2">Professional Details</h3>
                    <FormInput name="license_number" label="License Number" value={formData.license_number} icon={Award} />
                    <FormInput name="specialization" label="Specialization" value={formData.specialization} icon={BriefcaseMedical} />
                    <FormInput name="years_of_experience" label="Years of Experience" value={formData.years_of_experience} icon={Clock} />
                    <FormInput name="education" label="Education" value={formData.education} icon={GraduationCap} />
                    <FormTextarea name="bio" label="Biography" value={formData.bio} icon={Info} />
                </form>
            ) : (
                // --- VIEW MODE ---
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Personal Information</h3>
                        <dl className="space-y-4">
                            <InfoRow label="Full Name" value={`${user?.profile?.first_name} ${user?.profile?.last_name}`} icon={User} />
                            <InfoRow label="Email Address" value={user?.email} icon={Mail} />
                            <InfoRow label="Phone Number" value={user?.profile?.phone} icon={Phone} />
                            <InfoRow label="Address" value={user?.profile?.address} icon={Home} />
                        </dl>
                    </div>
                     <div>
                        <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Professional Details</h3>
                        <dl className="space-y-4">
                            <InfoRow label="License Number" value={doctorProfile?.license_number} icon={Award} />
                            <InfoRow label="Specialization" value={doctorProfile?.specialization} icon={BriefcaseMedical} />
                            <InfoRow label="Years of Experience" value={`${doctorProfile?.years_of_experience} years`} icon={Clock} />
                            <InfoRow label="Education" value={doctorProfile?.education} icon={GraduationCap} />
                        </dl>
                     </div>
                     <div className="md:col-span-2">
                        <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">Biography</h3>
                        <p className="text-slate-700 leading-relaxed">{doctorProfile?.bio || 'No biography provided.'}</p>
                     </div>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}