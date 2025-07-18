const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  first_name: string;
  last_name: string;
}

export interface User {
  id: number;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  is_active: boolean;
  profile?: {
    first_name: string;
    last_name: string;
    // ... other profile fields
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        error: data.error || data.message || 'An error occurred',
        message: data.message,
        details: data.details,
      };
      throw error;
    }

    return data;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/v1/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/v1/users/me');
  }

  async updateProfile(profileData: any): Promise<User> {
    return this.request<User>('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: { old_password: string; new_password: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/v1/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }
}

export const apiClient = new ApiClient();

// Auth utility functions
export const authUtils = {
  storeAuth: (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  getStoredUser: (): User | null => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  getStoredToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    return !!(token && user);
  },

  redirectToDashboard: (role: string) => {
    switch (role) {
      case 'doctor':
        return '/dashboard/doctor';
      case 'patient':
        return '/dashboard/patient';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  },
};

export default apiClient;
