"use client";

import React, { useState, useEffect } from 'react';
import { Coupon, CreateCouponRequest } from '@/services/admin/coupons';

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCouponRequest) => void;
  coupon: Coupon | null;
}

// Helper to format dates for datetime-local input
const toLocalISOString = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  // Adjust for timezone offset
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - tzOffset);
  return localDate.toISOString().slice(0, 16);
};

export default function CouponFormModal({ isOpen, onClose, onSave, coupon }: CouponFormModalProps) {
  const [formData, setFormData] = useState<CreateCouponRequest>({} as CreateCouponRequest);

  useEffect(() => {
    if (coupon) {
      // Convert cents to dollars for editing
      setFormData({
        ...coupon,
        discount_value: coupon.discount_type === 'fixed' ? coupon.discount_value / 100 : coupon.discount_value,
        minimum_amount: coupon.minimum_amount / 100,
        maximum_discount: coupon.maximum_discount / 100,
      });
    } else {
      // Reset for new coupon
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        minimum_amount: 0,
        maximum_discount: 0,
        usage_limit: 1,
        valid_from: '',
        valid_until: '',
      } as CreateCouponRequest);
    }
  }, [coupon, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setFormData(prev => ({
      ...prev,
      [name]: isNumber ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert dollars to cents before saving
    const dataToSave: CreateCouponRequest = {
      ...formData,
      discount_value: formData.discount_type === 'fixed' ? Math.round(formData.discount_value * 100) : formData.discount_value,
      minimum_amount: Math.round(formData.minimum_amount * 100),
      maximum_discount: Math.round(formData.maximum_discount * 100),
      // Ensure date is in UTC format
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : '',
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : '',
    };
    onSave(dataToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{coupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Code</label>
              <input name="code" value={formData.code || ''} onChange={handleChange} className="w-full border rounded-md px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Description</label>
              <input name="description" value={formData.description || ''} onChange={handleChange} className="w-full border rounded-md px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Discount Type</label>
              <select name="discount_type" value={formData.discount_type || 'percentage'} onChange={handleChange} className="w-full border rounded-md px-3 py-2">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Discount Value {formData.discount_type === 'fixed' ? '($)' : '(%)'}</label>
              <input type="number" step="0.01" name="discount_value" value={formData.discount_value || 0} onChange={handleChange} className="w-full border rounded-md px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Minimum Amount ($)</label>
              <input type="number" step="0.01" name="minimum_amount" value={formData.minimum_amount || 0} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Maximum Discount ($)</label>
              <input type="number" step="0.01" name="maximum_discount" value={formData.maximum_discount || 0} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Usage Limit</label>
              <input type="number" name="usage_limit" value={formData.usage_limit || 0} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Valid From</label>
              <input type="datetime-local" name="valid_from" value={toLocalISOString(formData.valid_from)} onChange={handleChange} className="w-full border rounded-md px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Valid Until</label>
              <input type="datetime-local" name="valid_until" value={toLocalISOString(formData.valid_until)} onChange={handleChange} className="w-full border rounded-md px-3 py-2" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}