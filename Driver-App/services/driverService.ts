import axiosInstance from '@/app/api/axiosInstance';
import authService, { getAuthHeaders } from './authService';

// Driver details interface for listing
export interface DriverDetails {
  driver_id: string;
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  licence_number: string;
  adress: string;
  organization_id: string;
  vehicle_owner_id: string;
  licence_front_img_url?: string;
  rc_front_img_url?: string;
  rc_back_img_url?: string;
  insurance_img_url?: string;
  fc_img_url?: string;
  car_img_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  password?: string; // Added for compatibility
}

// Driver login interfaces
export interface DriverLoginRequest {
  mobile_number: string;
  password: string;
}

export interface DriverLoginResponse {
  access_token: string;
  token_type: string;
  driver_id: string;
  full_name: string;
  primary_number: string;
  status: string;
  message: string;
  driver_status?: string;
}

// Get all drivers for a vehicle owner - using only /api/users/available-drivers
export const getDrivers = async (): Promise<DriverDetails[]> => {
  console.log('👨‍💼 Fetching drivers list...');
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await axiosInstance.get('/api/users/available-drivers', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 100,
        offset: 0,
        status: 'all'
      }
    });

    console.log('✅ Drivers list fetched successfully:', response.data);
    return response.data.drivers || response.data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch drivers:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      params: error.config?.params
    });
    
    // Provide more specific error messages
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Driver listing failed: ${errorDetail}. Please check if you have drivers registered.`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Driver listing endpoint not found. Please check the API configuration.');
    } else {
      throw new Error(`Failed to fetch drivers: ${error.message}`);
    }
  }
};

// Driver login function
export const loginDriver = async (mobileNumber: string, password: string): Promise<DriverLoginResponse> => {
  try {
    console.log('🚗 Starting driver login...');
    console.log('📱 Mobile (input):', mobileNumber);
    
    // Format phone number for backend - send 10 digits only
    const formatPhoneForBackend = (phone: string): string => {
      if (!phone || !phone.trim()) return '';
      // Remove +91 prefix and any non-digit characters, keep only 10 digits
      const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '').trim();
      if (!cleanPhone) return '';
      // Return only the last 10 digits (in case there are more)
      return cleanPhone.slice(-10);
    };

    const payload = {
      primary_number: formatPhoneForBackend(mobileNumber),
      password,
    };

    console.log('🔐 Attempting driver login with payload:', { ...payload, password: '***' });

    const response = await axiosInstance.post('/api/users/cardriver/signin', payload);

    console.log('✅ Driver login successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Driver login failed:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid mobile number or password');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.detail || 'Login failed');
    } else if (error.response?.status === 404) {
      throw new Error('Driver not found. Please check your mobile number.');
    } else {
      throw new Error(`Login failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
};

// Add driver details function
export const addDriverDetails = async (driverData: DriverDetails): Promise<any> => {
  try {
    console.log('👤 Adding driver details:', driverData);
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.post('/api/drivers', driverData, {
      headers: authHeaders
    });

    console.log('✅ Driver details added successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to add driver details:', error);
    throw error;
  }
};