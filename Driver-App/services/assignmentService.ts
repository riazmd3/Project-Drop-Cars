import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';
import { extractUserIdFromJWT, isJWTExpired } from '@/utils/jwtDecoder';
import { getWalletBalance } from '@/services/paymentService';

/**
 * Get vehicle owner ID from JWT token
 */
const getVehicleOwnerIdFromToken = async (): Promise<string> => {
  try {
    const authHeaders = await getAuthHeaders();
    const token = authHeaders.Authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Check if token is expired
    const isExpired = isJWTExpired(token);
    if (isExpired) {
      console.log('⚠️ JWT token is expired, user needs to login again');
      throw new Error('JWT token has expired. Please login again.');
    }
    
    const vehicleOwnerId = extractUserIdFromJWT(token);
    if (!vehicleOwnerId) {
      throw new Error('Could not extract vehicle owner ID from token');
    }
    
    console.log('🔑 Extracted vehicle owner ID from JWT:', vehicleOwnerId);
    return vehicleOwnerId;
  } catch (error: any) {
    console.error('❌ Failed to get vehicle owner ID from token:', error);
    throw new Error('Failed to get vehicle owner ID from authentication token');
  }
};

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
  assignment_status: 'PENDING' | 'ASSIGNED' | 'DRIVING' | 'COMPLETED' | 'CANCELLED';
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
  assignment_id?: string;
  id?: string;
}

/**
 * Fetch all available drivers for assignment
 */
export const fetchAvailableDrivers = async (): Promise<AvailableDriver[]> => {
  try {
    console.log('👤 Fetching available drivers from assignment endpoint...');
    
    const authHeaders = await getAuthHeaders();
    
    // Try the assignment endpoint first
    let response;
    try {
      response = await axiosInstance.get('/api/assignments/available-drivers', {
        headers: authHeaders
      });
    } catch (assignmentError) {
      console.log('⚠️ Assignment endpoint failed, trying users endpoint...');
      // Fallback to users endpoint
      response = await axiosInstance.get('/api/users/available-drivers', {
        headers: authHeaders
      });
    }

    if (response.data) {
      console.log('✅ Available drivers fetched successfully:', response.data.length, 'drivers');
      
      // Filter and log driver availability details
      const availableDrivers = response.data.filter((driver: any) => {
        // Handle different API response formats
        const driverStatus = driver.driver_status || driver.status;
        const isAvailable = driver.is_available !== false;
        const hasCurrentAssignment = driver.current_assignment;
        
        // A driver is available if:
        // 1. Their status is ONLINE or PROCESSING (both can be assigned)
        // 2. They don't have a current assignment
        // 3. They are not explicitly marked as unavailable
        const isAvailableForAssignment = (driverStatus === 'ONLINE' || driverStatus === 'online' || 
                                        driverStatus === 'PROCESSING' || driverStatus === 'processing') &&
                                        !hasCurrentAssignment &&
                                        isAvailable;
        
        console.log(`🔍 Driver ${driver.full_name}:`, {
          driver_status: driver.driver_status,
          status: driver.status,
          is_available: driver.is_available,
          current_assignment: driver.current_assignment,
          is_available_for_assignment: isAvailableForAssignment
        });
        
        return isAvailableForAssignment;
      });
      
      // Map the data to the expected AvailableDriver format
      const mappedDrivers: AvailableDriver[] = availableDrivers.map((driver: any) => ({
        id: driver.id,
        full_name: driver.full_name,
        primary_number: driver.primary_number,
        secondary_number: driver.secondary_number,
        address: driver.adress || driver.address || '',
        aadhar_number: driver.licence_number || driver.aadhar_number || '',
        organization_id: driver.organization_id,
        status: driver.driver_status || driver.status || 'PROCESSING',
        is_available: driver.is_available !== false,
        current_assignment: driver.current_assignment,
        created_at: driver.created_at,
        updated_at: driver.updated_at || driver.created_at
      }));
      
      console.log(`✅ Filtered to ${mappedDrivers.length} truly available drivers`);
      return mappedDrivers;
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
    
    // Try the assignment endpoint first
    let response;
    try {
      response = await axiosInstance.get('/api/assignments/available-cars', {
        headers: authHeaders
      });
    } catch (assignmentError) {
      console.log('⚠️ Assignment endpoint failed, trying users endpoint...');
      // Fallback to users endpoint
      response = await axiosInstance.get('/api/users/available-cars', {
        headers: authHeaders
      });
    }

    if (response.data) {
      console.log('✅ Available cars fetched successfully:', response.data.length, 'cars');
      
      // Filter and log car availability details
      const availableCars = response.data.filter((car: any) => {
        // Handle different API response formats
        const carStatus = car.car_status || car.status;
        const isAvailable = car.is_available !== false;
        const hasCurrentAssignment = car.current_assignment;
        
        // A car is available if:
        // 1. Their status is ONLINE, PROCESSING, or ACTIVE (all can be assigned)
        // 2. They don't have a current assignment
        // 3. They are not explicitly marked as unavailable
        const isAvailableForAssignment = (carStatus === 'ONLINE' || carStatus === 'online' ||
                                        carStatus === 'PROCESSING' || carStatus === 'processing' || 
                                        carStatus === 'ACTIVE' || carStatus === 'active') &&
                                        !hasCurrentAssignment &&
                                        isAvailable;
        
        console.log(`🔍 Car ${car.car_name}:`, {
          car_status: car.car_status,
          status: car.status,
          is_available: car.is_available,
          current_assignment: car.current_assignment,
          is_available_for_assignment: isAvailableForAssignment
        });
        
        return isAvailableForAssignment;
      });
      
      // Map the data to the expected AvailableCar format
      const mappedCars: AvailableCar[] = availableCars.map((car: any) => ({
        id: car.id,
        car_name: car.car_name,
        car_number: car.car_number,
        car_type: car.car_type,
        vehicle_owner_id: car.vehicle_owner_id,
        organization_id: car.organization_id,
        status: car.car_status || car.status || 'PROCESSING',
        is_available: car.is_available !== false,
        current_assignment: car.current_assignment,
        created_at: car.created_at,
        updated_at: car.updated_at || car.created_at
      }));
      
      console.log(`✅ Filtered to ${mappedCars.length} truly available cars`);
      return mappedCars;
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
 * Accept an order (creates assignment with PENDING status)
 */
export const acceptOrder = async (request: AcceptOrderRequest): Promise<AcceptOrderResponse> => {
  try {
    console.log('🔗 Accepting order:', request.order_id);
    console.log('📋 Request data:', request);
    
    // Get order details to check estimated price
    let orderDetails;
    try {
      orderDetails = await getOrderDetails(request.order_id);
      console.log('📋 Order details for balance check:', {
        order_id: request.order_id,
        estimated_price: orderDetails.estimated_price,
        vendor_price: orderDetails.vendor_price
      });
    } catch (orderError) {
      console.log('⚠️ Could not fetch order details for balance check, proceeding anyway');
    }
    
    // Check wallet balance if order details are available
    if (orderDetails && (orderDetails.estimated_price || orderDetails.vendor_price)) {
      try {
        const walletResponse = await getWalletBalance();
        const walletBalance = walletResponse.balance || 0;
        const requiredAmount = orderDetails.estimated_price || orderDetails.vendor_price || 0;
        
        console.log('💰 Wallet balance check:', {
          required: requiredAmount,
          available: walletBalance,
          sufficient: walletBalance >= requiredAmount
        });
        
        if (walletBalance < requiredAmount) {
          throw new Error(`Insufficient wallet balance. Required: ₹${requiredAmount}, Available: ₹${walletBalance}. Please add funds to your wallet.`);
        }
      } catch (balanceError: any) {
        if (balanceError.message.includes('Insufficient wallet balance')) {
          throw balanceError; // Re-throw balance error
        }
        console.log('⚠️ Could not check wallet balance, proceeding anyway:', balanceError.message);
      }
    }
    
    // Get vehicle owner ID from JWT token
    const vehicleOwnerId = await getVehicleOwnerIdFromToken();
    console.log('🔑 Using vehicle owner ID from JWT:', vehicleOwnerId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/assignments/acceptorder', {
      order_id: parseInt(request.order_id) // Just order_id as integer
    }, {
      headers: authHeaders
    });

    if (response.data) {
      // Check if the response contains an error message
      if (response.data.detail && response.data.detail.includes('Could not validate credentials')) {
        throw new Error('Authentication failed. Please login again.');
      }
      
      console.log('✅ Order accepted successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from order acceptance');
  } catch (error: any) {
    console.error('❌ Failed to accept order:', error);
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Order acceptance failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Order not found.');
    } else if (error.response?.status === 409) {
      throw new Error('Order is already assigned or accepted.');
    } else if (error.response?.status === 422) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Validation error';
      throw new Error(`Order acceptance validation failed: ${errorDetail}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to accept order');
    }
  }
};

/**
 * Update assignment status (PENDING → ASSIGNED → DRIVING → COMPLETED)
 */
export const updateAssignmentStatus = async (
  assignmentId: string, 
  status: 'PENDING' | 'ASSIGNED' | 'DRIVING' | 'COMPLETED' | 'CANCELLED'
): Promise<AssignmentResponse> => {
  try {
    console.log('📝 Updating assignment status:', assignmentId, 'to', status);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.patch(`/api/assignments/${assignmentId}/status`, {
      assignment_status: status
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
 * Assign a driver and car to an order
 */
export const assignDriverAndCar = async (assignmentData: AssignmentRequest): Promise<AssignmentResponse> => {
  try {
    console.log('🔗 Assigning driver and car to order:', assignmentData.order_id);
    console.log('👤 Driver ID:', assignmentData.driver_id);
    console.log('🚗 Car ID:', assignmentData.car_id);
    
    // Use the direct assignment API that assigns driver and car in one call
    const response = await assignCarDriverToOrder(
      assignmentData.order_id,
      assignmentData.driver_id,
      assignmentData.car_id
    );
    
    console.log('✅ Driver and car assigned successfully:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Failed to assign driver and car:', error);
    throw error;
  }
};

/**
 * Get pending orders for vehicle owner (orders available for assignment)
 */
export const getPendingOrders = async (): Promise<any[]> => {
  try {
    console.log('📋 Fetching pending orders for vehicle owner...');
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/assignments/vehicle_owner/pending', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Pending orders fetched successfully:', response.data.length, 'orders');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch pending orders:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Pending orders endpoint not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch pending orders');
    }
  }
};

/**
 * Get available bookings for vehicle owner (new API endpoint)
 * GET /api/orders/vehicle_owner/pending
 */
export const getAvailableBookings = async (): Promise<any[]> => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/orders/vehicle_owner/pending', {
      headers: authHeaders
    });

    if (response.data) {
      // Filter out already assigned orders
      const availableOrders = response.data.filter((order: any) => {
        const isAssigned = order.assignment_status === 'ASSIGNED' || 
                          order.assignment_status === 'DRIVING' || 
                          order.assignment_status === 'COMPLETED' ||
                          order.driver_id !== null ||
                          order.car_id !== null;
        
        return !isAssigned;
      });
      
      console.log('📋 Available bookings:', availableOrders.length, 'out of', response.data.length);
      return availableOrders;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch available bookings:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Available bookings endpoint not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch available bookings');
    }
  }
};

/**
 * Get assignments for a specific order
 */
export const getOrderAssignments = async (orderId: string): Promise<AssignmentResponse[]> => {
  try {
    console.log('🔍 Fetching assignments for order:', orderId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/assignments/order/${orderId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Order assignments fetched successfully:', response.data);
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch order assignments:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Order not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch order assignments');
    }
  }
};

/**
 * Get assignments for a vehicle owner
 */
export const getVehicleOwnerAssignments = async (vehicleOwnerId: string): Promise<AssignmentResponse[]> => {
  try {
    console.log('🔍 Fetching assignments for vehicle owner:', vehicleOwnerId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/assignments/vehicle_owner/${vehicleOwnerId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Vehicle owner assignments fetched successfully:', response.data);
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch vehicle owner assignments:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Vehicle owner not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch vehicle owner assignments');
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
 * Get assignments for a specific driver with order details
 * This function fetches assignments and enriches them with order information
 */
export const getDriverAssignmentsWithDetails = async (driverId: string): Promise<any[]> => {
  try {
    console.log('📋 Fetching driver assignments for driver:', driverId);
    
    // Validate driver ID
    if (!driverId || driverId === 'undefined' || driverId === 'null') {
      throw new Error('Invalid driver ID provided for assignment lookup');
    }
    
    // Use the CORRECT endpoint for driver assigned orders
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/assignments/driver/assigned-orders', { 
      headers: authHeaders 
    });
    
    console.log('📋 Driver assigned orders response:', response.data);
    
    if (Array.isArray(response.data)) {
      console.log('📋 Found driver assignments:', response.data.length);
      
      if (response.data.length === 0) {
        return [];
      }
      
      // Use data directly from assigned orders response (no need for assignment details API)
      const enrichedAssignments = response.data.map((assignment: any) => {
        return {
          // Assignment data
          assignment_id: assignment.id,
          assignment_status: assignment.assignment_status,
          expires_at: assignment.expires_at,
          created_at: assignment.created_at,
          assigned_at: assignment.assigned_at,
          
          // Order data
          order_id: assignment.order_id,
          driver_id: assignment.driver_id,
          car_id: assignment.car_id,
          
          // Order details from assignment response
          pickup: assignment.pickup_drop_location?.['0'] || 'Pickup Location',
          drop: assignment.pickup_drop_location?.['1'] || 'Drop Location',
          distance: assignment.trip_distance || 0,
          total_fare: assignment.estimated_price || 0,
          customer_name: assignment.customer_name || 'Customer Name',
          customer_mobile: assignment.customer_number || '0000000000',
          
          // Additional fields from response
          car_type: assignment.car_type,
          trip_type: assignment.trip_type,
          start_date_time: assignment.start_date_time,
          
          // Computed fields
          id: assignment.id.toString(),
          booking_id: assignment.order_id.toString(),
          date: new Date(assignment.created_at).toLocaleDateString(),
          time: new Date(assignment.created_at).toLocaleTimeString(),
          status: assignment.assignment_status === 'ASSIGNED' ? 'assigned' : 'pending',
          assigned_driver: assignment.driver_id,
          assigned_vehicle: assignment.car_id
        };
      });
      
      console.log('✅ Driver assignments fetched:', enrichedAssignments.length);
      return enrichedAssignments;
    }
    
    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch driver assignments:', error);
    throw new Error(error.message || 'Failed to fetch driver assignments with details');
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
      // Check if the response contains an error message
      if (response.data.detail && response.data.detail.includes('Could not validate credentials')) {
        console.log('❌ Authentication failed for order availability check');
        return false;
      }
      
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
    
    // If we get 403 Forbidden, it might be an authentication issue
    if (error.response?.status === 403) {
      console.log('❌ Access forbidden to order, considering it unavailable');
      return false;
    }
    
    // If we can't check due to other errors, assume it's available and let the accept call fail
    return true;
  }
};

/**
 * Accept an order by creating an assignment (LEGACY - use the new acceptOrder function above)
 */
export const acceptOrderLegacy = async (request: AcceptOrderRequest): Promise<AcceptOrderResponse> => {
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
 * Assign a driver and car to a specific order using the new API endpoint
 * POST /api/assignments/{order_id}/assign-car-driver
 */
export const assignCarDriverToOrder = async (
  assignmentId: string,
  driverId: string,
  carId: string
): Promise<AssignmentResponse> => {
  try {
    console.log('🔗 Assigning driver and car to assignment:', assignmentId);
    console.log('👤 Driver ID:', driverId);
    console.log('🚗 Car ID:', carId);
    
    // Validate inputs
    if (!driverId || driverId === 'undefined' || driverId === 'null') {
      throw new Error('Invalid driver ID provided');
    }
    if (!carId || carId === 'undefined' || carId === 'null') {
      throw new Error('Invalid car ID provided');
    }
    if (!assignmentId || assignmentId === 'undefined' || assignmentId === 'null') {
      throw new Error('Invalid assignment ID provided');
    }
    
    // Check if assignment is already assigned before attempting assignment
    try {
      const assignmentDetails = await getAssignmentDetails(assignmentId);
      
      if (assignmentDetails && assignmentDetails.assignment_status === 'ASSIGNED') {
        console.warn('⚠️ Assignment already assigned:', {
          assignment_id: assignmentId,
          assignment_status: assignmentDetails.assignment_status,
          driver_id: assignmentDetails.driver_id,
          car_id: assignmentDetails.car_id
        });
        throw new Error(`Assignment ${assignmentId} is already assigned to driver ${assignmentDetails.driver_id} and car ${assignmentDetails.car_id}`);
      }
    } catch (checkError: any) {
      if (checkError.message.includes('already assigned')) {
        throw checkError; // Re-throw assignment error
      }
    }
    
    const authHeaders = await getAuthHeaders();
    
    const requestData = {
      driver_id: driverId,
      car_id: carId
    };
    
    const response = await axiosInstance.patch(`/api/assignments/${assignmentId}/assign-car-driver`, requestData, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Driver and car assigned successfully:', response.data);
      
      // Validate that the response contains the correct driver and car IDs
      if (response.data.driver_id && response.data.driver_id !== driverId) {
        console.warn('⚠️ Warning: Response driver ID does not match requested driver ID');
        console.warn('Requested:', driverId, 'Received:', response.data.driver_id);
      }
      if (response.data.car_id && response.data.car_id !== carId) {
        console.warn('⚠️ Warning: Response car ID does not match requested car ID');
        console.warn('Requested:', carId, 'Received:', response.data.car_id);
      }
      
      return response.data;
    }

    throw new Error('No response data received from assignment');
  } catch (error: any) {
    console.error('❌ Failed to assign driver and car:', error);
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Assignment failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Order not found.');
    } else if (error.response?.status === 409) {
      throw new Error('Order is already assigned.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to assign driver and car');
    }
  }
};

/**
 * Get future rides for a specific vehicle owner
 * GET /api/assignments/vehicle_owner/{vehicle_owner_id}
 */
export const getFutureRidesForVehicleOwner = async (vehicleOwnerId?: string): Promise<any[]> => {
  try {
    // If no vehicle owner ID provided, get it from JWT token
    const ownerId = vehicleOwnerId || await getVehicleOwnerIdFromToken();
    console.log('📋 Fetching future rides for vehicle owner:', ownerId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/assignments/vehicle_owner/${ownerId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Future rides fetched successfully:', response.data.length, 'rides');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch future rides:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Vehicle owner not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch future rides');
    }
  }
};

/**
 * Get order details by order ID
 * GET /api/orders/{order_id}
 */
export const getOrderDetails = async (orderId: string): Promise<any> => {
  try {
    console.log('🔍 Fetching order details for order:', orderId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/orders/${orderId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Order details fetched successfully:', response.data);
      return response.data;
    }

    throw new Error('No order data received');
  } catch (error: any) {
    console.error('❌ Failed to fetch order details:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Order not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch order details');
    }
  }
};

/**
 * Get assignment details by assignment ID
 */
export const getAssignmentDetails = async (assignmentId: string): Promise<any> => {
  try {
    console.log('🔍 Fetching assignment details for assignment:', assignmentId);
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/assignments/${assignmentId}`, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Assignment details fetched successfully:', response.data);
      return response.data;
    }

    throw new Error('No assignment details received from server');
  } catch (error: any) {
    console.error('❌ Failed to fetch assignment details:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Assignment not found.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to fetch assignment details');
  }
};

/**
 * Get future rides with complete order details
 */
export const getFutureRidesWithDetails = async (): Promise<any[]> => {
  try {
    console.log('📋 Fetching future rides with complete details...');
    
    // Get assignments
    const assignments = await getFutureRidesForVehicleOwner();
    
    if (assignments.length === 0) {
      return [];
    }
    
    // Fetch order details for each assignment
    const ridesWithDetails = await Promise.all(
      assignments.map(async (assignment: any) => {
        try {
          const orderDetails = await getOrderDetails(assignment.order_id.toString());
          
          return {
            // Assignment data
            assignment_id: assignment.id,
            assignment_status: assignment.assignment_status,
            expires_at: assignment.expires_at,
            created_at: assignment.created_at,
            assigned_at: assignment.assigned_at,
            
            // Order data
            order_id: assignment.order_id,
            driver_id: assignment.driver_id,
            car_id: assignment.car_id,
            
            // Order details
            pickup: orderDetails.pickup_location || orderDetails.pickup || 'Pickup Location',
            drop: orderDetails.drop_location || orderDetails.drop || 'Drop Location',
            distance: orderDetails.distance || '0 km',
            total_fare: orderDetails.total_fare || orderDetails.fare || '0',
            customer_name: orderDetails.customer_name || 'Customer Name',
            customer_mobile: orderDetails.customer_mobile || orderDetails.customer_phone || '0000000000',
            
            // Computed fields
            id: assignment.id.toString(),
            booking_id: assignment.order_id.toString(),
            date: new Date(assignment.created_at).toLocaleDateString(),
            time: new Date(assignment.created_at).toLocaleTimeString(),
            status: assignment.assignment_status === 'PENDING' ? 'pending_assignment' : 'assigned',
            assigned_driver: assignment.driver_id ? { id: assignment.driver_id } : null,
            assigned_vehicle: assignment.car_id ? { id: assignment.car_id } : null,
          };
        } catch (orderError) {
          console.error(`❌ Failed to fetch details for order ${assignment.order_id}:`, orderError);
          
          // Return basic assignment data if order details fail
          return {
            assignment_id: assignment.id,
            assignment_status: assignment.assignment_status,
            expires_at: assignment.expires_at,
            created_at: assignment.created_at,
            order_id: assignment.order_id,
            driver_id: assignment.driver_id,
            car_id: assignment.car_id,
            pickup: 'Pickup Location',
            drop: 'Drop Location',
            distance: '0 km',
            total_fare: '0',
            customer_name: 'Customer Name',
            customer_mobile: '0000000000',
            id: assignment.id.toString(),
            booking_id: assignment.order_id.toString(),
            date: new Date(assignment.created_at).toLocaleDateString(),
            time: new Date(assignment.created_at).toLocaleTimeString(),
            status: assignment.assignment_status === 'PENDING' ? 'pending_assignment' : 'assigned',
            assigned_driver: assignment.driver_id ? { id: assignment.driver_id } : null,
            assigned_vehicle: assignment.car_id ? { id: assignment.car_id } : null,
          };
        }
      })
    );
    
    console.log('✅ Future rides with details fetched successfully:', ridesWithDetails.length, 'rides');
    return ridesWithDetails;
    
  } catch (error: any) {
    console.error('❌ Failed to fetch future rides with details:', error);
    throw error;
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

/**
 * Debug function to test specific order acceptance with detailed logging
 */
export const debugOrderAcceptance = async (orderId: string, vehicleOwnerId?: string): Promise<any> => {
  try {
    console.log('🐛 Debugging order acceptance for order:', orderId);
    
    // Get vehicle owner ID from JWT token if not provided
    const ownerId = vehicleOwnerId || await getVehicleOwnerIdFromToken();
    console.log('🐛 Vehicle owner ID from JWT:', ownerId);
    
    // Check authentication
    const authHeaders = await getAuthHeaders();
    console.log('🔑 Auth headers:', authHeaders);
    
    // Test order availability first
    console.log('🔍 Step 1: Checking order availability...');
    try {
      const orderResponse = await axiosInstance.get(`/api/orders/${orderId}`, {
        headers: authHeaders
      });
      console.log('✅ Order details:', orderResponse.data);
    } catch (orderError: any) {
      console.error('❌ Order check failed:', {
        status: orderError.response?.status,
        statusText: orderError.response?.statusText,
        data: orderError.response?.data,
        message: orderError.message
      });
    }
    
    // Test acceptorder endpoint
    console.log('🔍 Step 2: Testing acceptorder endpoint...');
    const acceptRequest = {
      order_id: orderId,
      vehicle_owner_id: ownerId, // Use the ID from JWT token
      acceptance_notes: 'Debug test acceptance'
    };
    
    console.log('📋 Accept request data:', acceptRequest);
    
    const acceptResponse = await axiosInstance.post('/api/assignments/acceptorder', acceptRequest, {
      headers: authHeaders
    });
    
    console.log('✅ Accept order response:', acceptResponse.data);
    return { success: true, data: acceptResponse.data };
    
  } catch (error: any) {
    console.error('❌ Debug order acceptance failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method
    });
    
    return { 
      success: false, 
      error: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      }
    };
  }
};

