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
      
      // Filter and log driver availability details
      const availableDrivers = response.data.filter((driver: any) => {
        const isAvailable = driver.is_available !== false && 
                           driver.status !== 'busy' && 
                           driver.status !== 'DRIVING' &&
                           driver.status !== 'BLOCKED' &&
                           !driver.current_assignment;
        
        console.log(`🔍 Driver ${driver.full_name}:`, {
          status: driver.status,
          is_available: driver.is_available,
          current_assignment: driver.current_assignment,
          is_available_for_assignment: isAvailable
        });
        
        return isAvailable;
      });
      
      console.log(`✅ Filtered to ${availableDrivers.length} truly available drivers`);
      return availableDrivers;
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
 * Get assignments for a specific driver
 */
export const fetchAssignmentsForDriver = async (driverId: string): Promise<AssignmentResponse[]> => {
  try {
    console.log('📋 Fetching assignments for driver:', driverId);
    const authHeaders = await getAuthHeaders();

    // Try the most likely endpoint first
    const endpoints = [
      `/api/assignments/driver/${driverId}`,
      `/api/assignments/by-driver/${driverId}`,
      `/api/assignments?driver_id=${encodeURIComponent(driverId)}`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axiosInstance.get(endpoint, { headers: authHeaders });
        if (Array.isArray(response.data)) {
          console.log('✅ Driver assignments fetched:', response.data.length);
          return response.data;
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          continue;
        }
        throw error;
      }
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch assignments for driver:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    throw new Error(error.message || 'Failed to fetch assignments for driver');
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
 * Check if an order is still available for acceptance
 */
export const checkOrderAvailability = async (orderId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking order availability:', orderId);
    
    const authHeaders = await getAuthHeaders();
    
    // Try to get order details to check if it's still available
    const response = await axiosInstance.get(`/api/orders/${orderId}`, {
      headers: authHeaders
    });

    if (response.data) {
      const order = response.data;
      const isAvailable = order.trip_status === 'PENDING' || 
                         order.trip_status === 'AVAILABLE' || 
                         order.trip_status === 'OPEN' ||
                         !order.trip_status;
      
      console.log('✅ Order availability check:', { orderId, status: order.trip_status, isAvailable });
      return isAvailable;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Failed to check order availability:', error);
    
    // If the order is not found (404), it's not available
    if (error.response?.status === 404) {
      console.log('❌ Order not found, considering it unavailable');
      return false;
    }
    
    // If we can't check due to other errors, assume it's available and let the accept call fail
    return true;
  }
};

/**
 * Accept an order by creating an assignment
 */
export const acceptOrder = async (request: AcceptOrderRequest): Promise<AcceptOrderResponse> => {
  try {
    console.log('✅ Accepting order:', request.order_id);
    console.log('📋 Request data:', request);
    
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Auth headers:', authHeaders.Authorization ? 'Present' : 'Missing');
    
    // First, try to get available drivers and cars for this vehicle owner
    let driverId: string | null = null;
    let carId: string | null = null;
    
    try {
      // Get available drivers
      const availableDrivers = await fetchAvailableDrivers();
      if (availableDrivers.length > 0) {
        // Find a driver that belongs to this vehicle owner
        const ownerDriver = availableDrivers.find(driver => 
          driver.organization_id === request.vehicle_owner_id || 
          driver.id === request.vehicle_owner_id
        );
        driverId = ownerDriver?.id || availableDrivers[0].id;
        console.log('🔍 Selected driver from available drivers:', driverId);
      } else {
        console.log('⚠️ No available drivers found, trying organization drivers...');
        
        // Fallback: Get drivers from organization endpoint
        try {
          const orgDriversResponse = await axiosInstance.get(`/api/users/cardriver/organization/${request.vehicle_owner_id}`, {
            headers: authHeaders
          });
          
          if (orgDriversResponse.data && orgDriversResponse.data.length > 0) {
            // Find an ONLINE driver
            const onlineDriver = orgDriversResponse.data.find((driver: any) => 
              driver.driver_status === 'ONLINE' || driver.status === 'ONLINE'
            );
            
            if (onlineDriver) {
              driverId = onlineDriver.id;
              console.log('🔍 Selected ONLINE driver from organization:', driverId);
            } else {
              // Use any driver as fallback
              driverId = orgDriversResponse.data[0].id;
              console.log('🔍 Selected any driver from organization as fallback:', driverId);
            }
          }
        } catch (orgError) {
          console.log('⚠️ Could not fetch organization drivers:', orgError);
        }
      }
      
      // Get available cars
      const availableCars = await fetchAvailableCars();
      if (availableCars.length > 0) {
        // Find a car that belongs to this vehicle owner
        const ownerCar = availableCars.find(car => 
          car.vehicle_owner_id === request.vehicle_owner_id
        );
        carId = ownerCar?.id || availableCars[0].id;
        console.log('🔍 Selected car from available cars:', carId);
      } else {
        console.log('⚠️ No available cars found, trying organization cars...');
        
        // Fallback: Get cars from organization endpoint
        try {
          const orgCarsResponse = await axiosInstance.get(`/api/users/cardetails/organization/${request.vehicle_owner_id}`, {
            headers: authHeaders
          });
          
          if (orgCarsResponse.data && orgCarsResponse.data.length > 0) {
            carId = orgCarsResponse.data[0].id;
            console.log('🔍 Selected car from organization:', carId);
          }
        } catch (orgError) {
          console.log('⚠️ Could not fetch organization cars:', orgError);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch available drivers/cars, proceeding with fallback');
    }
    
    // If we couldn't get specific IDs, use the vehicle_owner_id as fallback
    if (!driverId) {
      driverId = request.vehicle_owner_id;
      console.log('⚠️ Using vehicle_owner_id as driver_id fallback');
    }
    if (!carId) {
      carId = request.vehicle_owner_id;
      console.log('⚠️ Using vehicle_owner_id as car_id fallback');
    }
    
    // Before creating assignment, check if driver is actually available
    if (driverId) {
      try {
        const isDriverAvailable = await checkDriverAvailability(driverId);
        if (!isDriverAvailable) {
          console.log('⚠️ Driver is not available, trying to find another driver...');
          
          // Try to get another driver from organization
          try {
            const orgDriversResponse = await axiosInstance.get(`/api/users/cardriver/organization/${request.vehicle_owner_id}`, {
              headers: authHeaders
            });
            
            if (orgDriversResponse.data && orgDriversResponse.data.length > 0) {
              // Find an ONLINE driver that's different from the current one
              const alternativeDriver = orgDriversResponse.data.find((driver: any) => 
                driver.id !== driverId && 
                (driver.driver_status === 'ONLINE' || driver.status === 'ONLINE')
              );
              
              if (alternativeDriver) {
                driverId = alternativeDriver.id;
                console.log('🔍 Switched to alternative ONLINE driver:', driverId);
              }
            }
          } catch (orgError) {
            console.log('⚠️ Could not find alternative driver:', orgError);
          }
        }
      } catch (availabilityError) {
        console.log('⚠️ Could not check driver availability, proceeding anyway:', availabilityError);
      }
    }
    
    // Try to create an assignment
    const assignmentData: AssignmentRequest = {
      order_id: request.order_id,
      driver_id: driverId || request.vehicle_owner_id,
      car_id: carId || request.vehicle_owner_id,
      assigned_by: request.vehicle_owner_id,
      assignment_notes: request.acceptance_notes
    };
    
    console.log('🔗 Creating assignment with data:', assignmentData);
    
    const response = await assignDriverAndCar(assignmentData);
    
    if (response) {
      console.log('✅ Order accepted successfully via assignment creation:', response);
      return {
        success: true,
        message: 'Order accepted successfully',
        order_id: request.order_id,
        accepted_at: new Date().toISOString()
      };
    }

    throw new Error('No response data received from assignment creation');
    
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
      
      // Check if it's an "already assigned" error
      if (errorDetail.includes('already has an active assignment') || 
          errorDetail.includes('already assigned') ||
          errorDetail.includes('AssignmentStatusEnum.PENDING')) {
        throw new Error('This order has already been accepted by another vehicle owner. Please refresh to see available orders.');
      }
      
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
