import { 
  AdminDashboardStats, 
  UserResponse, 
  DoctorResponse, 
  ActivityLog, 
  ActivityLogFilters, 
  ReportData, 
  ApiResponse 
} from '../types/admin';

class AdminApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      data,
      success: true,
      message: data.message,
      pagination: data.pagination,
    };
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/dashboard`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<AdminDashboardStats>(response);
  }

  // User Management
  async getUsers(): Promise<ApiResponse<UserResponse[]>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/users`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<UserResponse[]>(response);
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    });
    return this.handleResponse<void>(response);
  }

  // Doctor Management
  async getDoctors(): Promise<ApiResponse<DoctorResponse[]>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/doctors`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<DoctorResponse[]>(response);
  }

  async updateDoctorVerification(
    doctorId: number, 
    action: 'approved' | 'rejected' | 'suspended', 
    reason?: string
  ): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/doctors/${doctorId}/verify`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ action, reason }),
    });
    return this.handleResponse<void>(response);
  }

  async updateDoctorKyc(
    doctorId: number, 
    action: 'approved' | 'rejected', 
    reason?: string
  ): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/doctors/${doctorId}/kyc`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ action, reason }),
    });
    return this.handleResponse<void>(response);
  }

  // Activity Logs
  async getActivityLogs(filters?: ActivityLogFilters): Promise<ApiResponse<ActivityLog[]>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}/api/v1/admin/activity-logs${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    
    return this.handleResponse<ActivityLog[]>(response);
  }

  // Reports and Analytics
  async getReportsData(): Promise<ApiResponse<ReportData>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/reports`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ReportData>(response);
  }

  async getUserRegistrationStats(period: string = '30d'): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/analytics/user-registrations?period=${period}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getConsultationStats(period: string = '30d'): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/analytics/consultations?period=${period}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getRevenueStats(period: string = '30d'): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/analytics/revenue?period=${period}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  async getSystemMetrics(): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/system/metrics`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<any>(response);
  }

  // Export functionality
  async exportActivityLogs(filters?: ActivityLogFilters): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}/api/v1/admin/activity-logs/export${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  async exportReports(reportType: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/admin/reports/export?type=${reportType}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }
}

export const adminApiService = new AdminApiService();
