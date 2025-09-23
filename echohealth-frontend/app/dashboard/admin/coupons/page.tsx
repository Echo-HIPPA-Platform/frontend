"use client";

import React, { useState, useEffect } from 'react';
import { getCoupons, toggleCouponStatus, deleteCoupon, createCoupon, updateCoupon, Coupon, CreateCouponRequest } from '@/services/admin/coupons';
import { Plus, Edit, Trash, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import CouponFormModal from '@/components/admin/CouponFormModal';
import CouponUsageModal from '@/components/admin/CouponUsageModal';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [selectedCouponIdForUsage, setSelectedCouponIdForUsage] = useState<number | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const isActive = filter === 'all' ? undefined : filter === 'active';
      const data = await getCoupons(page, pageSize, isActive);
      setCoupons(data.coupons || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, pageSize, filter]);

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    if (confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this coupon?`)) {
      try {
        await toggleCouponStatus(id, !isActive);
        fetchCoupons();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(id);
        fetchCoupons();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleOpenModal = (coupon: Coupon | null) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedCoupon(null);
    setIsModalOpen(false);
  };

  const handleSaveCoupon = async (data: CreateCouponRequest) => {
    try {
      if (selectedCoupon) {
        await updateCoupon(selectedCoupon.id, data);
      } else {
        await createCoupon(data);
      }
      fetchCoupons();
      handleCloseModal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleOpenUsageModal = (id: number) => {
    setSelectedCouponIdForUsage(id);
    setIsUsageModalOpen(true);
  };

  const handleCloseUsageModal = () => {
    setSelectedCouponIdForUsage(null);
    setIsUsageModalOpen(false);
  };

  return (
    <div>
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Coupon Management</h2>
          <p className="text-lg text-slate-600 mt-1">Create, view, and manage discount coupons.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={20} />
          Create Coupon
        </button>
      </header>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>All</button>
            <button onClick={() => setFilter('active')} className={`px-3 py-1 rounded-md text-sm ${filter === 'active' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Active</button>
            <button onClick={() => setFilter('inactive')} className={`px-3 py-1 rounded-md text-sm ${filter === 'inactive' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Inactive</button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading coupons...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">Error: {error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Discount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Usage</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Expires</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map(coupon => (
                    <tr key={coupon.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{coupon.code}</div>
                        <div className="text-xs text-slate-500">{coupon.description}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {coupon.usage_count} / {coupon.usage_limit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {new Date(coupon.valid_until).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={() => handleToggleStatus(coupon.id, coupon.is_active)} className={`p-2 rounded-md ${coupon.is_active ? 'text-red-700 bg-red-100 hover:bg-red-200' : 'text-green-700 bg-green-100 hover:bg-green-200'}`} title={coupon.is_active ? 'Deactivate' : 'Activate'}>
                            {coupon.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                          <button onClick={() => handleOpenUsageModal(coupon.id)} className="p-2 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200" title="View Usages">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleOpenModal(coupon)} className="p-2 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(coupon.id)} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200" title="Delete">
                            <Trash size={16} />
                          </button>
                        </div>
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
      </div>
      <CouponFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveCoupon} 
        coupon={selectedCoupon} 
      />
      <CouponUsageModal
        isOpen={isUsageModalOpen}
        onClose={handleCloseUsageModal}
        couponId={selectedCouponIdForUsage}
      />
    </div>
  );
}