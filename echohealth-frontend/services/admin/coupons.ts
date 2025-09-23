
// --- Types ---
export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_amount: number;
  maximum_discount: number;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string;
}

export interface CreateCouponRequest {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_amount: number;
  maximum_discount: number;
  usage_limit: number;
  valid_from: string;
  valid_until: string;
}

export interface CouponUsage {
  user_id: number;
  used_at: string;
  discount_amount: number;
}

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }
  return null;
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/v1/admin/coupons${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
};

// --- API Functions ---

export const getCoupons = async (page: number, pageSize: number, isActive?: boolean) => {
  let endpoint = `?page=${page}&page_size=${pageSize}`;
  if (isActive !== undefined) {
    endpoint += `&is_active=${isActive}`;
  }
  return apiRequest(endpoint);
};

export const createCoupon = async (data: CreateCouponRequest) => {
  return apiRequest('', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getCoupon = async (id: number) => {
  return apiRequest(`/${id}`);
};

export const updateCoupon = async (id: number, data: CreateCouponRequest) => {
  return apiRequest(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const toggleCouponStatus = async (id: number, isActive: boolean) => {
  return apiRequest(`/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
  });
};

export const deleteCoupon = async (id: number) => {
  return apiRequest(`/${id}`, {
    method: 'DELETE',
  });
};

export const getCouponUsages = async (id: number, page: number, pageSize: number) => {
  return apiRequest(`/${id}/usages?page=${page}&page_size=${pageSize}`);
};
