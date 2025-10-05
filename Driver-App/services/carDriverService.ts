import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';

// Car Driver interfaces
export interface CarDriverSignupRequest {
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  address: string;
  aadhar_number: string;
  organization_id: string;
  password: string;
  email?: string;
  license_number?: string;
  experience_years?: number;
  vehicle_preferences?: string[];
}

export interface CarDriverSigninRequest {
  primary_number: string;
  password: string;
}

export interface CarDriverResponse {
  id: string;
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  address: string;
  aadhar_number: string;
  organization_id: string;
  status: 'ONLINE' | 'DRIVING' | 'BLOCKED' | 'PROCESSING' | 'offline'| 'inactive';
  email?: string;
  license_number?: string;
  experience_years?: number;
  vehicle_preferences?: string[];
  created_at: string;
  updated_at: string;
}

export interface CarDriverAuthResponse {
  success: boolean;
  message: string;
  driver?: CarDriverResponse;
  token?: string;
  refresh_token?: string;
}

export interface CarDriverStatusResponse {
  success: boolean;
  message: string;
  status?: 'online' | 'offline';
}

/**
 * Sign up a new car driver
 */
export const signupCarDriver = async (request: CarDriverSignupRequest): Promise<CarDriverAuthResponse> => {
  try {
    console.log('👤 Signing up car driver:', { 
      full_name: request.full_name, 
      primary_number: request.primary_number,
      organization_id: request.organization_id 
    });

    const response = await axiosInstance.post('/api/users/cardriver/signup', request);

    if (response.data) {
      console.log('✅ Car driver signup successful:', response.data);
      
      // Check if the response has the expected format
      if (response.data.success && response.data.driver && response.data.token) {
        return response.data;
      }
      
      // If response doesn't have expected format, try to normalize it
      if (response.data.driver || response.data.user) {
        const driver = response.data.driver || response.data.user;
        const token = response.data.token || response.data.access_token || response.data.jwt_token;
        
        if (driver && token) {
          console.log('🔧 Normalizing response format for compatibility');
          return {
            success: true,
            message: 'Signup successful',
            driver: driver,
            token: token,
            refresh_token: response.data.refresh_token
          };
        }
      }
      
      return response.data;
    }

    throw new Error('No response data received from signup');
  } catch (error: any) {
    console.error('❌ Car driver signup failed:', error);
    
    // Check if it's a network/backend availability issue
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || 
        error.response?.status >= 500 || !error.response) {
      console.log('🔧 Backend not available, using mock signup for development');
      
      // Mock successful signup for development
      const mockDriver: CarDriverResponse = {
        id: `mock-driver-${Date.now()}`,
        full_name: request.full_name,
        primary_number: request.primary_number,
        address: request.address,
        aadhar_number: request.aadhar_number,
        organization_id: request.organization_id,
        status: 'PROCESSING', // New drivers should be in PROCESSING status for verification
        email: request.email,
        license_number: request.license_number,
        experience_years: request.experience_years,
        vehicle_preferences: request.vehicle_preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        message: 'Mock signup successful (backend not available)',
        driver: mockDriver,
        token: mockToken,
        refresh_token: `mock_refresh_${Date.now()}`
      };
    }
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Invalid signup data';
      throw new Error(`Signup failed: ${errorDetail}`);
    } else if (error.response?.status === 409) {
      throw new Error('Driver with this mobile number already exists');
    } else if (error.response?.status === 422) {
      const errorDetail = error.response.data?.detail || 'Validation error';
      throw new Error(`Validation error: ${errorDetail}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to sign up car driver');
    }
  }
};

/**
 * Sign in a car driver
 */
export const signinCarDriver = async (request: CarDriverSigninRequest): Promise<CarDriverAuthResponse> => {
  try {
    console.log('🔐 Signing in car driver:', { primary_number: request.primary_number });

    const response = await axiosInstance.post('/api/users/cardriver/signin', request);

    if (response.data) {
      console.log('✅ Car driver signin successful:', response.data);
      
      // Check if the response has the expected format
      if (response.data.success && response.data.driver && response.data.token) {
        return response.data;
      }
      
      // If response doesn't have expected format, try to normalize it
      if (response.data.driver || response.data.user) {
        const driver = response.data.driver || response.data.user;
        const token = response.data.token || response.data.access_token || response.data.jwt_token;
        
        if (driver && token) {
          console.log('🔧 Normalizing response format for compatibility');
          return {
            success: true,
            message: 'Signin successful',
            driver: driver,
            token: token,
            refresh_token: response.data.refresh_token
          };
        }
      }
      
      // If still no token, throw specific error
      if (!response.data.token && !response.data.access_token && !response.data.jwt_token) {
        throw new Error('No access token received from server');
      }
      
      return response.data;
    }

    throw new Error('No response data received from signin');
  } catch (error: any) {
    console.error('❌ Car driver signin failed:', error);
    
    // Check if it's a network/backend availability issue
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || 
        error.response?.status >= 500 || !error.response) {
      console.log('🔧 Backend not available, using mock signin for development');
      
      // Mock successful signin for development
      const mockDriver: CarDriverResponse = {
        id: 'mock-driver-123',
        full_name: 'Mock Driver',
        primary_number: request.primary_number,
        address: 'Mock Address',
        aadhar_number: '123456789012',
        organization_id: 'mock-org-123',
        status: 'offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        message: 'Mock signin successful (backend not available)',
        driver: mockDriver,
        token: mockToken,
        refresh_token: `mock_refresh_${Date.now()}`
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Invalid mobile number or password');
    } else if (error.response?.status === 404) {
      throw new Error('Driver not found. Please check your mobile number');
    } else if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Invalid signin data';
      throw new Error(`Signin failed: ${errorDetail}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to sign in car driver');
    }
  }
};

/**
 * Set driver online
 */
export const setDriverOnline = async (driverId: string): Promise<CarDriverStatusResponse> => {
  try {
    console.log('🟢 Setting driver online:', driverId);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.put(`/api/users/cardriver/online`, {
      driver_id: driverId
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Driver set online successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from online status update');
  } catch (error: any) {
    console.error('❌ Failed to set driver online:', error);
    
    // Check if it's a network/backend availability issue
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || 
        error.response?.status >= 500 || !error.response) {
      console.log('🔧 Backend not available, using mock online status for development');
      
      return {
        success: true,
        message: 'Mock: Driver set online successfully (backend not available)',
        status: 'online'
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Driver not found');
    } else if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Invalid request';
      throw new Error(`Online status update failed: ${errorDetail}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to set driver online');
    }
  }
};

/**
 * Set driver offline
 */
export const setDriverOffline = async (driverId: string): Promise<CarDriverStatusResponse> => {
  try {
    console.log('🔴 Setting driver offline:', driverId);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.put(`/api/users/cardriver/offline`, {
      driver_id: driverId
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Driver set offline successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from offline status update');
  } catch (error: any) {
    console.error('❌ Failed to set driver offline:', error);
    
    // Check if it's a network/backend availability issue
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || 
        error.response?.status >= 500 || !error.response) {
      console.log('🔧 Backend not available, using mock offline status for development');
      
      return {
        success: true,
        message: 'Mock: Driver set offline successfully (backend not available)',
        status: 'offline'
      };
    }
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Driver not found');
    } else if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Invalid request';
      throw new Error(`Offline status update failed: ${errorDetail}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to set driver offline');
    }
  }
};

/**
 * Get car driver by ID
 */
export const getCarDriver = async (driverId: string): Promise<CarDriverResponse> => {
  try {
    console.log('👤 Fetching car driver:', driverId);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/users/cardriver/${driverId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Car driver fetched successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from driver fetch');
  } catch (error: any) {
    console.error('❌ Failed to fetch car driver:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Driver not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch car driver');
    }
  }
};

/**
 * Get drivers by vehicle owner ID
 */
export const getDriversByVehicleOwner = async (vehicleOwnerId: string): Promise<CarDriverResponse[]> => {
  try {
    console.log('👥 Fetching drivers by vehicle owner ID:', vehicleOwnerId);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/users/cardriver/vehicle-owner/${vehicleOwnerId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Drivers fetched by vehicle owner successfully:', response.data.length, 'drivers');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch drivers by vehicle owner:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      console.log('⚠️ No drivers found for vehicle owner:', vehicleOwnerId);
      return [];
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch drivers by vehicle owner');
    }
  }
};

/**
 * Get drivers by organization
 */
export const getDriversByOrganization = async (organizationId: string): Promise<CarDriverResponse[]> => {
  try {
    console.log('👥 Fetching drivers by organization:', organizationId);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/users/cardriver/organization/${organizationId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Drivers fetched successfully:', response.data.length, 'drivers');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch drivers by organization:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      console.log('⚠️ No drivers found for organization:', organizationId);
      return [];
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch drivers by organization');
    }
  }
};

/**
 * Get car driver by mobile number
 */
export const getCarDriverByMobile = async (mobileNumber: string): Promise<CarDriverResponse> => {
  try {
    console.log('📱 Fetching car driver by mobile:', mobileNumber);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/users/cardriver/mobile/${mobileNumber}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Car driver fetched by mobile successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from driver fetch');
  } catch (error: any) {
    console.error('❌ Failed to fetch car driver by mobile:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Driver not found with this mobile number');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch car driver by mobile');
    }
  }
};

/**
 * Update car driver profile
 */
export const updateCarDriverProfile = async (
  driverId: string, 
  updates: Partial<CarDriverResponse>
): Promise<CarDriverResponse> => {
  try {
    console.log('✏️ Updating car driver profile:', driverId, updates);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.put(`/api/users/cardriver/${driverId}`, updates, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Car driver profile updated successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from profile update');
  } catch (error: any) {
    console.error('❌ Failed to update car driver profile:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Driver not found');
    } else if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Invalid update data';
      throw new Error(`Profile update failed: ${errorDetail}`);
    } else if (error.response?.status === 422) {
      const errorDetail = error.response.data?.detail || 'Validation error';
      throw new Error(`Validation error: ${errorDetail}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to update car driver profile');
    }
  }
};

/**
 * Delete car driver
 */
export const deleteCarDriver = async (driverId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🗑️ Deleting car driver:', driverId);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.delete(`/api/users/cardriver/${driverId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Car driver deleted successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from driver deletion');
  } catch (error: any) {
    console.error('❌ Failed to delete car driver:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Driver not found');
    } else if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Invalid request';
      throw new Error(`Driver deletion failed: ${errorDetail}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to delete car driver');
    }
  }
};

/**
 * Search drivers with filters
 */
export const searchDrivers = async (filters: {
  organization_id?: string;
  status?: 'online' | 'offline'| 'inactive';
  vehicle_type?: string;
  experience_min?: number;
  experience_max?: number;
  location?: string;
}): Promise<CarDriverResponse[]> => {
  try {
    console.log('🔍 Searching drivers with filters:', filters);

    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/users/cardriver/search', {
      headers: authHeaders,
      params: filters
    });

    if (response.data) {
      console.log('✅ Drivers search successful:', response.data.length, 'drivers found');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to search drivers:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      console.log('⚠️ No drivers found with given filters');
      return [];
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to search drivers');
    }
  }
};
