import axiosInstance from '@/app/api/axiosInstance';
import authService, { getAuthHeaders } from './authService';

// Order interface for pending orders
export interface PendingOrder {
  id: string;
  order_id: string;
  pickup_location: string;
  drop_location: string;
  distance: number;
  estimated_price: number;
  customer_name: string;
  customer_mobile: string;
  car_type: string;
  trip_type: string;
  start_date_time: string;
  status: string;
  created_at: string;
  updated_at: string;
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
