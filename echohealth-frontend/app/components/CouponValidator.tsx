"use client";

import React, { useState } from 'react';
import { Tag, Check, X, AlertCircle, Loader2 } from 'lucide-react';

interface CouponValidationResponse {
  valid: boolean;
  discount_amount: number;
  final_amount: number;
  message: string;
  coupon_id?: number;
  code?: string;
}

interface CouponValidatorProps {
  amount: number; // Amount in cents
  onCouponApplied: (couponData: CouponValidationResponse) => void;
  onCouponRemoved: () => void;
  disabled?: boolean;
}

export default function CouponValidator({ amount, onCouponApplied, onCouponRemoved, disabled = false }: CouponValidatorProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResponse | null>(null);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

      const response = await fetch(`${apiBaseUrl}/api/v1/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate coupon');
      }

      if (data.valid) {
        setAppliedCoupon(data);
        onCouponApplied(data);
        setError(null);
      } else {
        setError(data.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setError(error instanceof Error ? error.message : 'Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setError(null);
    onCouponRemoved();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating && !appliedCoupon) {
      validateCoupon();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag className="w-5 h-5 text-emerald-600" />
        <h3 className="text-lg font-medium text-gray-900">Have a coupon?</h3>
      </div>

      {appliedCoupon ? (
        // Applied coupon display
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">
                  Coupon Applied: {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-600">
                  {appliedCoupon.message}
                </p>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              disabled={disabled}
              className="p-1 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
              title="Remove coupon"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Original amount:</span>
            <span className="text-gray-900">${(amount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Discount:</span>
            <span className="text-green-600">-${(appliedCoupon.discount_amount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
            <span className="text-gray-900">Total:</span>
            <span className="text-emerald-600">${(appliedCoupon.final_amount / 100).toFixed(2)}</span>
          </div>
        </div>
      ) : (
        // Coupon input form
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Enter coupon code"
              disabled={disabled || isValidating}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              maxLength={50}
            />
            <button
              onClick={validateCoupon}
              disabled={disabled || isValidating || !couponCode.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Enter your coupon code to see if you qualify for a discount
          </p>
        </div>
      )}
    </div>
  );
}
