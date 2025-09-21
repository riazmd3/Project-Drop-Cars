import axiosInstance from '@/app/api/axiosInstance';
import authService, { getAuthHeaders } from './authService';

// Order interface for pending orders
export interface PendingOrder {
  id: string;
  order_id: string;
  pickup_location: string;
  drop_location: string;
  pickup_drop_location: string; // Added for compatibility
  distance: number;
  trip_distance: number; // Added for compatibility
  estimated_price: number;
  cost_per_km: number; // Added for compatibility
  customer_name: string;
  customer_mobile: string;
  customer_number: string; // Added for compatibility
  car_type: string;
  trip_type: string;
  start_date_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  driver_allowance: number; // Added for compatibility
  permit_charges: number; // Added for compatibility
  hill_charges: number; // Added for compatibility
  toll_charges: number; // Added for compatibility
}

// Get pending orders for vehicle owner - using only /api/orders/vehicle_owner/pending
export const getPendingOrders = async (): Promise<PendingOrder[]> => {
  console.log('📋 Fetching pending orders for vehicle owner...');
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await axiosInstance.get('/api/orders/vehicle_owner/pending', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

// Get driver assignments with details (for compatibility)
export const getDriverAssignmentsWithDetails = async (driverId: string): Promise<any[]> => {
  try {
    console.log('📋 Fetching driver assignments with details for driver:', driverId);
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.get(`/api/assignments/driver/${driverId}`, {
      headers: authHeaders
    });

    return response.data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch driver assignments:', error);
    return [];
  }
};

// Fetch assignments for driver (for compatibility)
export const fetchAssignmentsForDriver = async (driverId: string): Promise<any[]> => {
  try {
    console.log('📋 Fetching assignments for driver:', driverId);
    return await getDriverAssignmentsWithDetails(driverId);
  } catch (error: any) {
    console.error('❌ Failed to fetch assignments for driver:', error);
    return [];
  }
};

// Get order assignments (for compatibility)
export const getOrderAssignments = async (orderId: string): Promise<any[]> => {
  try {
    console.log('📋 Fetching order assignments for order:', orderId);
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.get(`/api/assignments/order/${orderId}`, {
      headers: authHeaders
    });

    return response.data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch order assignments:', error);
    return [];
  }
};

// Get future rides with details (for compatibility)
export const getFutureRidesWithDetails = async (): Promise<any[]> => {
  try {
    console.log('🚗 Fetching future rides with details...');
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.get('/api/orders/vehicle_owner/future', {
      headers: authHeaders
    });

    return response.data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch future rides with details:', error);
    return [];
  }
};

// Fetch available drivers (for compatibility)
export const fetchAvailableDrivers = async (): Promise<any[]> => {
  try {
    console.log('👥 Fetching available drivers from assignment service...');
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.get('/api/users/available-drivers', {
      headers: authHeaders
    });

    return response.data || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch available drivers:', error);
    return [];
  }
};

// Check order availability (for compatibility)
export const checkOrderAvailability = async (orderId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking order availability for order:', orderId);
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.get(`/api/orders/${orderId}/availability`, {
      headers: authHeaders
    });

    return response.data?.available || false;
  } catch (error: any) {
    console.error('❌ Failed to check order availability:', error);
      return false;
  }
};

export const acceptOrder = async (orderData: {
  order_id: string;
  driver_id?: string;
  car_id?: string;
  vehicle_owner_id?: string;
}): Promise<any> => {
  try {
    console.log('✅ Accepting order:', orderData);
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.post('/api/orders/accept', orderData, {
              headers: authHeaders
            });
            
    console.log('✅ Order accepted successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to accept order:', error);
    throw error;
  }
};

export const updateAssignmentStatus = async (assignmentId: string, status: string): Promise<any> => {
  try {
    console.log('🔄 Updating assignment status:', { assignmentId, status });
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.put(`/api/assignments/${assignmentId}/status`, {
      status: status
    }, {
      headers: authHeaders
    });

    console.log('✅ Assignment status updated successfully:', response.data);
      return response.data;
  } catch (error: any) {
    console.error('❌ Failed to update assignment status:', error);
    throw error;
  }
};

// Add missing functions for compatibility
export const startDriverTrip = async (tripId: string, startKm?: number, odometerPhoto?: any): Promise<any> => {
  try {
    console.log('🚗 Starting driver trip:', tripId);
    const authHeaders = await getAuthHeaders();
    
    const payload: any = {};
    if (startKm !== undefined) payload.start_km = startKm;
    if (odometerPhoto) payload.odometer_photo = odometerPhoto;
    
    const response = await axiosInstance.post(`/api/trips/${tripId}/start`, payload, {
      headers: authHeaders
    });

    console.log('✅ Driver trip started successfully:', response.data);
      return response.data;
  } catch (error: any) {
    console.error('❌ Failed to start driver trip:', error);
    throw error;
  }
};

export const endDriverTrip = async (tripId: string, endKm?: number, contactNumber?: string, odometerPhoto?: any): Promise<any> => {
  try {
    console.log('🏁 Ending driver trip:', tripId);
    const authHeaders = await getAuthHeaders();
    
    const payload: any = {};
    if (endKm !== undefined) payload.end_km = endKm;
    if (contactNumber) payload.contact_number = contactNumber;
    if (odometerPhoto) payload.odometer_photo = odometerPhoto;
    
    const response = await axiosInstance.post(`/api/trips/${tripId}/end`, payload, {
          headers: authHeaders
        });
        
    console.log('✅ Driver trip ended successfully:', response.data);
    return response.data;
      } catch (error: any) {
    console.error('❌ Failed to end driver trip:', error);
    throw error;
  }
};
