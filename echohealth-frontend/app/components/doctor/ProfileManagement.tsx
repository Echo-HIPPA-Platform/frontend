"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Edit2, X, Check, AlertCircle } from 'lucide-react';

interface DoctorProfile {
  id: number;
  email: string;
  profile: {
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    bio?: string;
  };
  doctor_profile?: {
    specialization: string;
    license_number?: string;
    education?: string;
    experience_years?: number;
    consultation_fee?: number;
  };
}

interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  bio?: string;
  specialization?: string;
  license_number?: string;
  education?: string;
  experience_years?: number;
  consultation_fee?: number;
}

interface ProfileManagementProps {
  doctorProfile: DoctorProfile;
  onUpdate: (updatedProfile: DoctorProfile) => void;
}

export default function ProfileManagement({ doctorProfile, onUpdate }: ProfileManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    first_name: doctorProfile.profile.first_name || '',
    last_name: doctorProfile.profile.last_name || '',
    phone: doctorProfile.profile.phone || '',
    address: doctorProfile.profile.address || '',
    city: doctorProfile.profile.city || '',
    state: doctorProfile.profile.state || '',
    zip_code: doctorProfile.profile.zip_code || '',
    bio: doctorProfile.profile.bio || '',
    specialization: doctorProfile.doctor_profile?.specialization || '',
    license_number: doctorProfile.doctor_profile?.license_number || '',
    education: doctorProfile.doctor_profile?.education || '',
    experience_years: doctorProfile.doctor_profile?.experience_years || 0,
    consultation_fee: doctorProfile.doctor_profile?.consultation_fee || 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      first_name: doctorProfile.profile.first_name || '',
      last_name: doctorProfile.profile.last_name || '',
      phone: doctorProfile.profile.phone || '',
      address: doctorProfile.profile.address || '',
      city: doctorProfile.profile.city || '',
      state: doctorProfile.profile.state || '',
      zip_code: doctorProfile.profile.zip_code || '',
      bio: doctorProfile.profile.bio || '',
      specialization: doctorProfile.doctor_profile?.specialization || '',
      license_number: doctorProfile.doctor_profile?.license_number || '',
      education: doctorProfile.doctor_profile?.education || '',
      experience_years: doctorProfile.doctor_profile?.experience_years || 0,
      consultation_fee: doctorProfile.doctor_profile?.consultation_fee || 0,
    });
  }, [doctorProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      onUpdate(updatedProfile);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: doctorProfile.profile.first_name || '',
      last_name: doctorProfile.profile.last_name || '',
      phone: doctorProfile.profile.phone || '',
      address: doctorProfile.profile.address || '',
      city: doctorProfile.profile.city || '',
      state: doctorProfile.profile.state || '',
      zip_code: doctorProfile.profile.zip_code || '',
      bio: doctorProfile.profile.bio || '',
      specialization: doctorProfile.doctor_profile?.specialization || '',
      license_number: doctorProfile.doctor_profile?.license_number || '',
      education: doctorProfile.doctor_profile?.education || '',
      experience_years: doctorProfile.doctor_profile?.experience_years || 0,
      consultation_fee: doctorProfile.doctor_profile?.consultation_fee || 0,
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Doctor Profile</h2>
            <p className="text-sm text-gray-600">Manage your personal and professional information</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{doctorProfile.profile.first_name || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{doctorProfile.profile.last_name || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{doctorProfile.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{doctorProfile.profile.phone || 'Not provided'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Bio
            </label>
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Tell patients about yourself, your approach to healthcare, and your experience..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{doctorProfile.profile.bio || 'Not provided'}</p>
            )}
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{doctorProfile.doctor_profile?.specialization || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{doctorProfile.doctor_profile?.license_number || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{doctorProfile.doctor_profile?.experience_years || 0} years</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Fee ($)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  name="consultation_fee"
                  value={formData.consultation_fee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">${doctorProfile.doctor_profile?.consultation_fee || 0}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="border-t pt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 inline mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
