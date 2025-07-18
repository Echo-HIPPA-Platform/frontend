"use client";

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Plus, X, Save, User, GraduationCap, Award, Shield } from 'lucide-react';

interface KYCVerificationProps {
  doctorId: number;
  currentStatus?: 'pending' | 'approved' | 'rejected' | 'incomplete';
  onSubmit?: (data: KYCData) => void;
  onStatusChange?: (newStatus: 'pending' | 'approved' | 'rejected' | 'incomplete') => void;
}

interface KYCData {
  primarySpecialization: string;
  additionalSpecializations: string[];
  licenseNumber: string;
  yearsOfExperience: number;
  education: string;
  bio: string;
  documents: {
    medicalLicense: File | null;
    diploma: File | null;
    certifications: File[];
    idDocument: File | null;
  };
}

const specializations = [
  'Clinical Psychology',
  'Behavioral Therapy',
  'Family Therapy',
  'Child Psychology',
  'Addiction Counseling',
  'Trauma Therapy',
  'Cognitive Behavioral Therapy (CBT)',
  'Psychotherapy',
  'Marriage Counseling',
  'Grief Counseling',
  'Anxiety Disorders',
  'Depression Treatment',
  'Eating Disorders',
  'PTSD Treatment',
  'Substance Abuse',
  'Neuropsychology',
  'Forensic Psychology',
  'Sports Psychology',
  'Health Psychology',
  'Geriatric Psychology'
];

export default function KYCVerification({ doctorId, currentStatus = 'incomplete', onSubmit, onStatusChange }: KYCVerificationProps) {
  const [formData, setFormData] = useState<KYCData>({
    primarySpecialization: '',
    additionalSpecializations: [],
    licenseNumber: '',
    yearsOfExperience: 0,
    education: '',
    bio: '',
    documents: {
      medicalLicense: null,
      diploma: null,
      certifications: [],
      idDocument: null
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);

  const handleInputChange = (field: keyof KYCData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileUpload = (field: keyof KYCData['documents'], file: File | File[]) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const addSpecialization = (spec: string) => {
    if (!formData.additionalSpecializations.includes(spec) && spec !== formData.primarySpecialization) {
      setFormData(prev => ({
        ...prev,
        additionalSpecializations: [...prev.additionalSpecializations, spec]
      }));
    }
    setShowSpecializationDropdown(false);
  };

  const removeSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      additionalSpecializations: prev.additionalSpecializations.filter(s => s !== spec)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.primarySpecialization) {
      newErrors.primarySpecialization = 'Primary specialization is required';
    }
    if (!formData.licenseNumber) {
      newErrors.licenseNumber = 'Medical license number is required';
    }
    if (formData.yearsOfExperience < 0) {
      newErrors.yearsOfExperience = 'Years of experience must be 0 or greater';
    }
    if (!formData.education) {
      newErrors.education = 'Education details are required';
    }
    if (!formData.bio || formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters long';
    }
    if (!formData.documents.medicalLicense) {
      newErrors.medicalLicense = 'Medical license document is required';
    }
    if (!formData.documents.diploma) {
      newErrors.diploma = 'Diploma/degree document is required';
    }
    if (!formData.documents.idDocument) {
      newErrors.idDocument = 'ID document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically upload files and submit data to your backend
      console.log('Submitting KYC data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSubmit) {
        onSubmit(formData);
      }
      
      // Update status to pending after successful submission
      if (onStatusChange) {
        onStatusChange('pending');
      }
      
      // Success message will be shown in the pending state UI
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert('There was an error submitting your verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <AlertCircle className="w-5 h-5" />;
      case 'pending': return <AlertCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-emerald-100 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-full">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">KYC Verification</h3>
            <p className="text-slate-600">Complete your profile verification to start seeing patients</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(currentStatus)}`}>
          {getStatusIcon(currentStatus)}
          <span className="font-semibold capitalize">{currentStatus}</span>
        </div>
      </div>

      {currentStatus === 'approved' ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-slate-800 mb-2">Verification Complete!</h4>
          <p className="text-slate-600">Your profile has been verified and approved by our admin team.</p>
        </div>
      ) : currentStatus === 'pending' ? (
        <div className="text-center py-12">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          <h4 className="text-2xl font-bold text-slate-800 mb-4">Account Under Review</h4>
          <p className="text-lg text-slate-600 mb-6 max-w-md mx-auto">
            Thank you for submitting your verification documents! Our admin team is currently reviewing your profile.
          </p>
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">ℹ</span>
              </div>
              <h5 className="font-semibold text-blue-900">What happens next?</h5>
            </div>
            <ul className="text-left text-blue-800 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Our team will verify your medical license and credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Review process typically takes 1-2 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>You'll receive an email notification once approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>After approval, you can start seeing patients</span>
              </li>
            </ul>
          </div>
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-600">
              <strong>Need help?</strong> Contact our support team at{' '}
              <a href="mailto:support@echopsychology.com" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                support@echopsychology.com
              </a>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Primary Specialization */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Award className="w-4 h-4 inline mr-2" />
              Primary Specialization *
            </label>
            <select
              value={formData.primarySpecialization}
              onChange={(e) => handleInputChange('primarySpecialization', e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
            >
              <option value="">Select your primary specialization</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            {errors.primarySpecialization && (
              <p className="text-red-600 text-sm mt-1">{errors.primarySpecialization}</p>
            )}
          </div>

          {/* Additional Specializations */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional Specializations (Optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.additionalSpecializations.map(spec => (
                <span key={spec} className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                  {spec}
                  <X 
                    className="w-4 h-4 cursor-pointer hover:text-emerald-600" 
                    onClick={() => removeSpecialization(spec)}
                  />
                </span>
              ))}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpecializationDropdown(!showSpecializationDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Specialization
              </button>
              {showSpecializationDropdown && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                  {specializations
                    .filter(spec => !formData.additionalSpecializations.includes(spec) && spec !== formData.primarySpecialization)
                    .map(spec => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => addSpecialization(spec)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors"
                      >
                        {spec}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Medical License Number *
            </label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              placeholder="e.g., PSY-2023-001"
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
            />
            {errors.licenseNumber && (
              <p className="text-red-600 text-sm mt-1">{errors.licenseNumber}</p>
            )}
          </div>

          {/* Years of Experience */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Years of Experience *
            </label>
            <input
              type="number"
              min="0"
              value={formData.yearsOfExperience}
              onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
            />
            {errors.yearsOfExperience && (
              <p className="text-red-600 text-sm mt-1">{errors.yearsOfExperience}</p>
            )}
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <GraduationCap className="w-4 h-4 inline mr-2" />
              Education *
            </label>
            <input
              type="text"
              value={formData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              placeholder="e.g., PhD Psychology, Harvard University"
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
            />
            {errors.education && (
              <p className="text-red-600 text-sm mt-1">{errors.education}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Professional Bio * (minimum 50 characters)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell patients about your approach, experience, and what makes you unique..."
              rows={4}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
            />
            <p className="text-sm text-slate-500 mt-1">{formData.bio.length} characters</p>
            {errors.bio && (
              <p className="text-red-600 text-sm mt-1">{errors.bio}</p>
            )}
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Required Documents
            </h4>

            {/* Medical License */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Medical License Document *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload('medicalLicense', e.target.files?.[0] || null)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
              />
              {errors.medicalLicense && (
                <p className="text-red-600 text-sm mt-1">{errors.medicalLicense}</p>
              )}
            </div>

            {/* Diploma */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Diploma/Degree Document *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload('diploma', e.target.files?.[0] || null)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
              />
              {errors.diploma && (
                <p className="text-red-600 text-sm mt-1">{errors.diploma}</p>
              )}
            </div>

            {/* ID Document */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Government ID Document *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload('idDocument', e.target.files?.[0] || null)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
              />
              {errors.idDocument && (
                <p className="text-red-600 text-sm mt-1">{errors.idDocument}</p>
              )}
            </div>

            {/* Additional Certifications */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Certifications (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => handleFileUpload('certifications', Array.from(e.target.files || []))}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 transition-colors"
              />
              <p className="text-sm text-slate-500 mt-1">Upload any additional certifications or training certificates</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-200">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting for Review...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Submit for Admin Review
                </>
              )}
            </button>
            <p className="text-sm text-slate-600 text-center mt-3">
              Your documents will be reviewed within 1-2 business days. You'll receive an email notification once your profile is approved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
