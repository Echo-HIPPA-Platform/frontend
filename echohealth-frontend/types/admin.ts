// Admin Dashboard Types
export interface AdminDashboardStats {
  total_users: number;
  total_doctors: number;
  pending_doctors: number;
  approved_doctors: number;
  active_sessions: number;
  total_consultations: number;
  revenue_this_month: number;
  growth_rate: number;
}

export interface UserResponse {
  id: number;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  is_active: boolean;
  profile: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
  last_login?: string;
}

export interface DoctorResponse {
  id: number;
  user: UserResponse;
  specialization: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  kyc_status: 'incomplete' | 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Activity Log Types
export interface ActivityLog {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  action: string;
  details: string;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, any>;
}

export interface ActivityLogFilters {
  level?: string;
  action?: string;
  user_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface UserRegistrationData extends ChartDataPoint {
  doctors: number;
  patients: number;
  total: number;
}

export interface ConsultationData extends ChartDataPoint {
  completed: number;
  pending: number;
  cancelled: number;
}

export interface RevenueData extends ChartDataPoint {
  revenue: number;
  consultations: number;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  response_time: number;
  error_rate: number;
}

// Reports Types
export interface ReportData {
  user_registrations: UserRegistrationData[];
  consultation_stats: ConsultationData[];
  revenue_analytics: RevenueData[];
  system_metrics: SystemMetrics;
  top_specializations: Array<{
    specialization: string;
    count: number;
    percentage: number;
  }>;
  geographic_distribution: Array<{
    country: string;
    users: number;
    doctors: number;
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
