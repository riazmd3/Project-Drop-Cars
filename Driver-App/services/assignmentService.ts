import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';

export interface AvailableDriver {
  id: string;
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  address: string;
  aadhar_number: string;
  organization_id: string;
  status: string;
  is_available: boolean;
  current_assignment?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailableCar {
  id: string;
  car_name: string;
  car_type: string;
  car_number: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  organization_id: string;
  vehicle_owner_id: string;
  is_available: boolean;
  current_assignment?: string;
  rc_front_img_url?: string;
  rc_back_img_url?: string;
  insurance_img_url?: string;
  fc_img_url?: string;
  car_img_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRequest {
  order_id: string;
  driver_id: string;
  car_id: string;
  assigned_by: string;
  assignment_notes?: string;
}

export interface AssignmentResponse {
  id: string;
  order_id: string;
  driver_id: string;
  car_id: string;
  assigned_by: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignment_notes?: string;
  assigned_at: string;
  updated_at: string;
}

export interface AcceptOrderRequest {
  order_id: string;
  vehicle_owner_id: string;
  acceptance_notes?: string;
}

export interface AcceptOrderResponse {
  success: boolean;
  message: string;
  order_id: string;
  accepted_at: string;
}

/**
 * Fetch all available drivers for assignment
 */
export const fetchAvailableDrivers = async (): Promise<AvailableDriver[]> => {
  try {
    console.log('👤 Fetching available drivers from assignment endpoint...');
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/assignments/available-drivers', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Available drivers fetched successfully:', response.data.length, 'drivers');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch available drivers:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Available drivers endpoint not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch available drivers');
    }
  }
};

/**
 * Fetch all available cars for assignment
 */
export const fetchAvailableCars = async (): Promise<AvailableCar[]> => {
  try {
    console.log('🚗 Fetching available cars from assignment endpoint...');
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/assignments/available-cars', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Available cars fetched successfully:', response.data.length, 'cars');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch available cars:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Available cars endpoint not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch available cars');
    }
  }
};

/**
 * Assign a driver and car to an order
 */
export const assignDriverAndCar = async (assignmentData: AssignmentRequest): Promise<AssignmentResponse> => {
  try {
    console.log('🔗 Assigning driver and car to order:', assignmentData.order_id);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/assignments/create', assignmentData, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Assignment created successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from assignment creation');
  } catch (error: any) {
    console.error('❌ Failed to create assignment:', error);
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Assignment failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Assignment endpoint not found.');
    } else if (error.response?.status === 409) {
      throw new Error('Driver or car is already assigned to another order.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to create assignment');
    }
  }
};

/**
 * Update assignment status
 */
export const updateAssignmentStatus = async (
  assignmentId: string, 
  status: 'in_progress' | 'completed' | 'cancelled'
): Promise<AssignmentResponse> => {
  try {
    console.log('📝 Updating assignment status:', assignmentId, 'to', status);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.patch(`/api/assignments/${assignmentId}/status`, {
      status: status
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Assignment status updated successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from status update');
  } catch (error: any) {
    console.error('❌ Failed to update assignment status:', error);
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Status update failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Assignment not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to update assignment status');
    }
  }
};

/**
 * Get assignment details by ID
 */
export const getAssignmentById = async (assignmentId: string): Promise<AssignmentResponse> => {
  try {
    console.log('🔍 Fetching assignment details:', assignmentId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/assignments/${assignmentId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Assignment details fetched successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from assignment fetch');
  } catch (error: any) {
    console.error('❌ Failed to fetch assignment details:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Assignment not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch assignment details');
    }
  }
};

/**
 * Get all assignments for the current user/organization
 */
export const fetchUserAssignments = async (): Promise<AssignmentResponse[]> => {
  try {
    console.log('📋 Fetching user assignments...');
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/assignments/user', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ User assignments fetched successfully:', response.data.length, 'assignments');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch user assignments:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('User assignments endpoint not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch user assignments');
    }
  }
};

/**
 * Check if a driver is available for assignment
 */
export const checkDriverAvailability = async (driverId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking driver availability:', driverId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/assignments/driver/${driverId}/availability`, {
      headers: authHeaders
    });

    if (response.data) {
      const isAvailable = response.data.is_available || false;
      console.log('✅ Driver availability checked:', driverId, 'is available:', isAvailable);
      return isAvailable;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Failed to check driver availability:', error);
    return false;
  }
};

/**
 * Check if a car is available for assignment
 */
export const checkCarAvailability = async (carId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking car availability:', carId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/assignments/car/${carId}/availability`, {
      headers: authHeaders
    });

    if (response.data) {
      const isAvailable = response.data.is_available || false;
      console.log('✅ Car availability checked:', carId, 'is available:', isAvailable);
      return isAvailable;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Failed to check car availability:', error);
    return false;
  }
};

/**
 * Accept an order using the new API endpoint
 */
export const acceptOrder = async (request: AcceptOrderRequest): Promise<AcceptOrderResponse> => {
  try {
    console.log('✅ Accepting order:', request.order_id);
    console.log('📋 Request data:', request);
    
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Auth headers:', authHeaders.Authorization ? 'Present' : 'Missing');
    
    // Try multiple endpoint variations to find the correct one
    const endpoints = [
      '/api/assignments/acceptorder',
      '/api/orders/accept',
      '/api/orders/accept-order',
      '/api/assignments/accept-order'
    ];
    
    let lastError: any = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        const response = await axiosInstance.post(endpoint, request, {
          headers: authHeaders
        });

        if (response.data) {
          console.log('✅ Order accepted successfully:', response.data);
          return response.data;
        }

        throw new Error('No response data received');
      } catch (error: any) {
        console.log(`❌ Endpoint ${endpoint} failed:`, {
          status: error.response?.status,
          message: error.response?.data?.detail || error.message
        });
        lastError = error;
        
        // If it's a 404, try the next endpoint
        if (error.response?.status === 404) {
          continue;
        }
        
        // For other errors, break and throw
        break;
      }
    }
    
    // If we get here, all endpoints failed
    throw lastError || new Error('All endpoints failed');
    
  } catch (error: any) {
    console.error('❌ Failed to accept order:', error);
    console.error('📊 Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Invalid request';
      throw new Error(`Invalid request: ${errorDetail}`);
    } else if (error.response?.status === 404) {
      throw new Error('Order acceptance endpoint not found. Please contact support.');
    } else if (error.response?.status === 409) {
      throw new Error('Order is already accepted by another vehicle owner.');
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
      throw new Error(error.message || 'Failed to accept order');
    }
  }
};

/**
 * Test function to debug order acceptance API connectivity
 */
export const testOrderAcceptanceAPI = async (): Promise<any> => {
  try {
    console.log('🧪 Testing order acceptance API connectivity...');
    
    const authHeaders = await getAuthHeaders();
    console.log('🔑 Auth token present:', !!authHeaders.Authorization);
    
    // Test different endpoints
    const testEndpoints = [
      '/api/assignments/acceptorder',
      '/api/orders/accept',
      '/api/orders/accept-order',
      '/api/assignments/accept-order',
      '/api/assignments',
      '/api/orders'
    ];
    
    const results = [];
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`🔍 Testing endpoint: ${endpoint}`);
        
        // Try GET first to see if endpoint exists
        const getResponse = await axiosInstance.get(endpoint, {
          headers: authHeaders
        });
        
        results.push({
          endpoint,
          method: 'GET',
          status: getResponse.status,
          success: true,
          data: getResponse.data
        });
        
      } catch (error: any) {
        results.push({
          endpoint,
          method: 'GET',
          status: error.response?.status,
          success: false,
          error: error.response?.data?.detail || error.message
        });
      }
    }
    
    console.log('📊 API Test Results:', results);
    return { success: true, results };
    
  } catch (error: any) {
    console.error('❌ API connectivity test failed:', error);
    return { success: false, error: error.message };
  }
};
