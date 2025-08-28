interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  first_name: string;
  last_name: string;
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
  data?: T | string;
  message?: string;
  error?: string;
  success?: boolean;
}

interface ApiError {
  message: string;
  status: number;
  details?: string;
}

class AuthApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  }

  // Robust response handler
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: any = undefined;

    try {
      const text = await response.text();
      if (!text.trim()) {
        data = {};
      } else {
        try {
          data = JSON.parse(text);
        } catch {
          console.warn('Response is not valid JSON, returning raw text:', text);
          data = text; // fallback to plain text
        }
      }
    } catch (err) {
      console.error('Failed to read response body:', err);
      throw new Error('Failed to read response from server.');
    }

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'string' ? data : data?.message || data?.error) ||
        this.getErrorMessage(response.status);

      const apiError: ApiError = {
        message: errorMessage,
        status: response.status,
        details: typeof data === 'object' ? data?.details : undefined
      };

      throw new Error(JSON.stringify(apiError));
    }

    return {
      data,
      success: true,
      message: typeof data === 'object' ? data?.message : undefined,
    };
  }

  private getErrorMessage(status: number): string {
    switch (status) {
      case 400: return 'Invalid request. Please check your input.';
      case 401: return 'Authentication failed. Please check your credentials.';
      case 403: return 'Access denied. You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 429: return 'Too many requests. Please try again later.';
      case 500: return 'Internal server error. Please try again later.';
      case 502: return 'Backend server is not available. Please check if the server is running.';
      case 503: return 'Service temporarily unavailable. Please try again later.';
      default: return `Server error (${status}). Please try again later.`;
    }
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
  async register(registerData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    if (!this.isValidEmail(registerData.email)) {
      throw new Error('Invalid email format');
    }
    
    if (!this.isValidPassword(registerData.password)) {
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...registerData,
        email: registerData.email.trim().toLowerCase()
      })
    });

    return this.handleResponse<LoginResponse>(response);
  }

  // Request password reset
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    });

    return this.handleResponse<void>(response);
  }

  // Reset password with token
  async resetPassword(resetData: ResetPasswordRequest): Promise<ApiResponse<void>> {
    if (!this.isValidPassword(resetData.password)) {
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.');
    }

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
    if (!token) return { success: true, message: 'Already logged out' };

    const response = await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    // Clear storage regardless of response
    this.clearAuthData();

    return this.handleResponse<void>(response);
  }

  getCurrentUser() {
    const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    return !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  private isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
  }

  storeAuthData(token: string, userData: any, rememberMe = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('auth_token', token);
    storage.setItem('user_data', JSON.stringify(userData));
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }
}

export const authApiService = new AuthApiService();
export type { 
  LoginRequest, 
  RegisterRequest,
  LoginResponse, 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  ApiResponse,
  ApiError 
};
