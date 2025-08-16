import axiosInstance from '@/app/api/axiosInstance';
import * as SecureStore from 'expo-secure-store';

// Authentication interfaces matching your backend
export interface LoginRequest {
  mobile_number: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  account_status: string;
  car_driver_count: number;
  car_details_count: number;
}

export interface JWTVerificationResponse {
  verified: boolean;
  user_id: string;
  organization_id: string;
  token: string;
  message: string;
}

// Authentication service class
class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login vehicle owner and get JWT token
  async loginVehicleOwner(mobileNumber: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Starting vehicle owner login...');
      
      const response = await axiosInstance.post('/api/users/vehicleowner/login', {
        mobile_number: mobileNumber,
        password: password
      });
      
      console.log('✅ Login successful:', response.data);
      
      // Store the access token securely
      if (response.data.access_token) {
        await this.setToken(response.data.access_token);
        console.log('🔒 Access token stored securely');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid mobile number or password');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'Login failed');
      } else {
        throw new Error(`Login failed: ${error.message || 'Unknown error occurred'}`);
      }
    }
  }

  // Set authentication token
  async setToken(token: string): Promise<void> {
    this.token = token;
    await SecureStore.setItemAsync('authToken', token);
  }

  // Get stored authentication token
  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await SecureStore.getItemAsync('authToken');
    }
    return this.token;
  }

  // Clear authentication token
  async clearToken(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync('authToken');
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Verify JWT token by making an authenticated request
  async verifyToken(): Promise<JWTVerificationResponse> {
    try {
      console.log('🔐 Verifying JWT token...');
      
      const token = await this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Make an authenticated request to verify the token
      // Using a protected endpoint to validate the token
      const response = await axiosInstance.get('/api/users/cardetails/organization/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If we get here, the token is valid
      // Extract user info from the token
      const userInfo = await this.decodeToken(token);
      
      return {
        verified: true,
        user_id: userInfo.user_id,
        organization_id: userInfo.organization_id,
        token: token,
        message: 'Token verified successfully'
      };
    } catch (error: any) {
      console.error('❌ JWT verification failed:', error);
      
      if (error.response?.status === 401) {
        // Token is invalid, clear it
        await this.clearToken();
        throw new Error('JWT token is invalid or expired');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied - insufficient permissions');
      } else {
        throw new Error(`JWT verification failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Decode JWT token to extract user information
  private async decodeToken(token: string): Promise<{ user_id: string; organization_id: string }> {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        return {
          user_id: payload.sub || payload.user_id || payload.vehicle_owner_id || 'unknown',
          organization_id: payload.organization_id || payload.org_id || 'unknown'
        };
      }
      throw new Error('Invalid token format');
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      return {
        user_id: 'unknown',
        organization_id: 'unknown'
      };
    }
  }

  // Get authenticated headers for API requests
  async getAuthHeaders(): Promise<{ Authorization: string }> {
    const token = await this.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  // Refresh token if needed (for future implementation)
  async refreshToken(): Promise<boolean> {
    try {
      // This would call a refresh endpoint if your backend supports it
      // For now, we'll just verify the current token
      await this.verifyToken();
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await this.clearToken();
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  }

  // Get user profile information
  async getUserProfile(): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axiosInstance.get('/api/users/vehicleowner/profile', { headers });
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to get user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export individual functions for backward compatibility
export const loginVehicleOwner = (mobileNumber: string, password: string) => 
  authService.loginVehicleOwner(mobileNumber, password);

export const verifyJWTToken = (token: string) => authService.verifyToken();
export const isAuthenticated = () => authService.isAuthenticated();
export const getAuthHeaders = () => authService.getAuthHeaders();
export const logout = () => authService.logout();
export const getUserProfile = () => authService.getUserProfile();

export default authService;
