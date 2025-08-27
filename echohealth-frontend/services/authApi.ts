interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    profile?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  success?: boolean;
}

class AuthApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data;
    
    try {
      const text = await response.text();
      if (!text.trim()) {
        data = {};
      } else {
        data = JSON.parse(text);
      }
    } catch (error) {
      // If we can't parse JSON, likely got HTML error page
      if (response.status === 502) {
        throw new Error('Backend server is not available. Please check if the server is running.');
      } else if (response.status >= 500) {
        throw new Error(`Server error (${response.status}). Please try again later.`);
      } else {
        throw new Error(`Invalid response from server (${response.status})`);
      }
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      data,
      success: true,
      message: data.message,
    };
  }

  // Login user
  async login(loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginData.email.trim().toLowerCase(),
        password: loginData.password
      })
    });

    return this.handleResponse<LoginResponse>(response);
  }

  // Register user
  async register(registerData: any): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    return this.handleResponse<LoginResponse>(response);
  }

  // Request password reset
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    return this.handleResponse<void>(response);
  }

  // Reset password with token
  async resetPassword(resetData: ResetPasswordRequest): Promise<ApiResponse<void>> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData)
    });

    return this.handleResponse<void>(response);
  }

  // Logout user
  async logout(): Promise<ApiResponse<void>> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (!token) {
      return { success: true, message: 'Already logged out' };
    }

    const response = await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    // Clear local storage regardless of response
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');

    return this.handleResponse<void>(response);
  }

  // Get current user data from storage
  getCurrentUser() {
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return !!token;
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }
}

export const authApiService = new AuthApiService();
export type { LoginRequest, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest, ApiResponse };
