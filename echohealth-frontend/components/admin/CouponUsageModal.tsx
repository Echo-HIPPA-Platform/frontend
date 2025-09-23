"use client";

import React, { useState, useEffect } from 'react';
import { getCouponUsages, CouponUsage } from '@/services/admin/coupons';

interface CouponUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponId: number | null;
}

export default function CouponUsageModal({ isOpen, onClose, couponId }: CouponUsageModalProps) {
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isOpen && couponId) {
      fetchUsages();
    }
  }, [isOpen, couponId, page, pageSize]);

  const fetchUsages = async () => {
    if (!couponId) return;
    setIsLoading(true);
    try {
      const data = await getCouponUsages(couponId, page, pageSize);
      setUsages(data.usages || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Coupon Usage History</h3>
        {isLoading ? (
          <div className="text-center py-12">Loading usages...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">Error: {error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">User ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Discount Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usages.map((usage, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{usage.user_id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {new Date(usage.used_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        ${usage.discount_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                <span className="text-sm text-slate-600">Page {page} of {Math.ceil(total / pageSize)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total} className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">Close</button>
        </div>
      </div>
    </div>
  );
}
