import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';

export interface CarDetail {
  id: string;
  car_name: string;
  car_type: string;
  car_number: string;
  car_brand: string;
  car_model: string;
  car_year: number;
  organization_id: string;
  vehicle_owner_id: string;
  rc_front_img_url?: string;
  rc_back_img_url?: string;
  insurance_img_url?: string;
  fc_img_url?: string;
  car_img_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DriverDetail {
  id: string;
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  address: string;
  aadhar_number: string;
  organization_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleOwnerDetails {
  id: string;
  full_name: string;
  primary_mobile: string;
  secondary_mobile?: string;
  wallet_balance: number;
  organization_id: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  user_info: VehicleOwnerDetails;
  cars: CarDetail[];
  drivers: DriverDetail[];
  summary: {
    total_cars: number;
    total_drivers: number;
    wallet_balance: number;
  };
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    console.log('📊 Fetching dashboard data...');
    
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Using JWT token:', authHeaders.Authorization?.substring(0, 20) + '...');

    // 1. Fetch vehicle owner details
    console.log('👤 Fetching vehicle owner details...');
    const ownerResponse = await axiosInstance.get('/api/users/vehicle-owner/me', {
      headers: authHeaders
    });

    if (!ownerResponse.data) {
      throw new Error('Failed to fetch vehicle owner details');
    }

    const ownerDetails: VehicleOwnerDetails = ownerResponse.data;
    console.log('✅ Vehicle owner details received:', ownerDetails);

    // 2. Fetch all cars for the vehicle owner (not just available ones)
    let cars: CarDetail[] = [];
    try {
      console.log('🚗 Fetching all cars for vehicle owner...');
      
      // Try multiple endpoints to get all cars
      const carEndpoints = [
        `/api/users/vehicle-owner/${ownerDetails.id}/cars`,
        `/api/users/vehicleowner/cars`,
        `/api/users/cardetails/organization/${ownerDetails.organization_id}`,
        `/api/users/vehicle-owner/cars`,
        `/api/cars/owner/${ownerDetails.id}`,
        `/api/assignments/available-cars` // Fallback to available cars only
      ];
      
      for (const endpoint of carEndpoints) {
        try {
          console.log(`🔍 Trying car endpoint: ${endpoint}`);
          const carsResponse = await axiosInstance.get(endpoint, {
            headers: authHeaders
          });
          
          if (carsResponse.data && Array.isArray(carsResponse.data)) {
            cars = carsResponse.data;
            console.log(`✅ Cars fetched from ${endpoint}:`, cars.length, 'cars');
            break; // Use the first successful endpoint
          }
        } catch (endpointError) {
          console.log(`❌ Car endpoint ${endpoint} failed:`, endpointError.response?.status);
          continue; // Try next endpoint
        }
      }
      
      if (cars.length === 0) {
        console.warn('⚠️ No cars found from any endpoint');
      }
    } catch (error) {
      console.error('❌ All car endpoints failed:', error);
    }

    // 3. Fetch all drivers for the vehicle owner (not just available ones)
    let drivers: DriverDetail[] = [];
    try {
      console.log('👤 Fetching all drivers for vehicle owner...');
      
      // Try multiple endpoints to get all drivers
      const driverEndpoints = [
        `/api/users/vehicle-owner/${ownerDetails.id}/drivers`,
        `/api/users/vehicleowner/drivers`,
        `/api/users/cardriver/organization/${ownerDetails.organization_id}`,
        `/api/users/vehicle-owner/drivers`,
        `/api/drivers/owner/${ownerDetails.id}`,
        `/api/assignments/available-drivers` // Fallback to available drivers only
      ];
      
      for (const endpoint of driverEndpoints) {
        try {
          console.log(`🔍 Trying driver endpoint: ${endpoint}`);
          const driversResponse = await axiosInstance.get(endpoint, {
            headers: authHeaders
          });
          
          if (driversResponse.data && Array.isArray(driversResponse.data)) {
            drivers = driversResponse.data;
            console.log(`✅ Drivers fetched from ${endpoint}:`, drivers.length, 'drivers');
            break; // Use the first successful endpoint
          }
        } catch (endpointError) {
          console.log(`❌ Driver endpoint ${endpoint} failed:`, endpointError.response?.status);
          continue; // Try next endpoint
        }
      }
      
      if (drivers.length === 0) {
        console.warn('⚠️ No drivers found from any endpoint');
      }
    } catch (error) {
      console.error('❌ All driver endpoints failed:', error);
    }

    const dashboardData: DashboardData = {
      user_info: ownerDetails,
      cars,
      drivers,
      summary: {
        total_cars: cars.length,
        total_drivers: drivers.length,
        wallet_balance: ownerDetails.wallet_balance
      }
    };

    console.log('📊 Dashboard data assembled:', {
      user: dashboardData.user_info,
      carCount: dashboardData.cars.length,
      driverCount: dashboardData.drivers.length,
      walletBalance: dashboardData.user_info.wallet_balance
    });

    return dashboardData;

  } catch (error: any) {
    console.error('❌ Failed to fetch dashboard data:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch dashboard data');
    }
  }
};

export const refreshDashboardData = async (): Promise<DashboardData> => {
  console.log('🔄 Refreshing dashboard data...');
  return fetchDashboardData();
};

/**
 * Force refresh dashboard data (useful after adding new cars/drivers)
 */
export const forceRefreshDashboardData = async (): Promise<DashboardData> => {
  console.log('🔄 Force refreshing dashboard data...');
  
  // Clear any cached data and fetch fresh data
  try {
    const freshData = await fetchDashboardData();
    console.log('✅ Dashboard data force refreshed successfully');
    return freshData;
  } catch (error) {
    console.error('❌ Force refresh failed:', error);
    throw error;
  }
};

/**
 * Debug function to test car and driver endpoints
 */
export const debugCarDriverEndpoints = async (): Promise<any> => {
  try {
    console.log('🧪 Testing car and driver endpoints...');
    
    const authHeaders = await getAuthHeaders();
    
    // Get vehicle owner details first
    const ownerResponse = await axiosInstance.get('/api/users/vehicle-owner/me', {
      headers: authHeaders
    });
    
    const ownerDetails = ownerResponse.data;
    console.log('👤 Vehicle owner details:', ownerDetails);
    
    // Test car endpoints
    const carEndpoints = [
      `/api/users/vehicle-owner/${ownerDetails.id}/cars`,
      `/api/users/vehicleowner/cars`,
      `/api/users/cardetails/organization/${ownerDetails.organization_id}`,
      `/api/users/vehicle-owner/cars`,
      `/api/cars/owner/${ownerDetails.id}`,
      `/api/assignments/available-cars`
    ];
    
    const carResults = [];
    for (const endpoint of carEndpoints) {
      try {
        const response = await axiosInstance.get(endpoint, { headers: authHeaders });
        carResults.push({
          endpoint,
          status: response.status,
          count: response.data?.length || 0,
          success: true
        });
      } catch (error) {
        carResults.push({
          endpoint,
          status: error.response?.status,
          error: error.message,
          success: false
        });
      }
    }
    
    // Test driver endpoints
    const driverEndpoints = [
      `/api/users/vehicle-owner/${ownerDetails.id}/drivers`,
      `/api/users/vehicleowner/drivers`,
      `/api/users/cardriver/organization/${ownerDetails.organization_id}`,
      `/api/users/vehicle-owner/drivers`,
      `/api/drivers/owner/${ownerDetails.id}`,
      `/api/assignments/available-drivers`
    ];
    
    const driverResults = [];
    for (const endpoint of driverEndpoints) {
      try {
        const response = await axiosInstance.get(endpoint, { headers: authHeaders });
        driverResults.push({
          endpoint,
          status: response.status,
          count: response.data?.length || 0,
          success: true
        });
      } catch (error) {
        driverResults.push({
          endpoint,
          status: error.response?.status,
          error: error.message,
          success: false
        });
      }
    }
    
    return {
      owner: ownerDetails,
      cars: carResults,
      drivers: driverResults
    };
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    throw error;
  }
};

// New function to fetch pending orders
export interface PendingOrder {
  order_id: number;
  vendor_id: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: {
    pickup: string;
    drop: string;
  };
  start_date_time: string;
  customer_name: string;
  customer_number: string;
  cost_per_km: number;
  extra_cost_per_km: number;
  driver_allowance: number;
  extra_driver_allowance: number;
  permit_charges: number;
  extra_permit_charges: number;
  hill_charges: number;
  toll_charges: number;
  pickup_notes?: string;
  trip_status: string;
  pick_near_city: string;
  trip_distance: number;
  trip_time: string;
  platform_fees_percent: number;
  created_at: string;
}

export const fetchPendingOrders = async (): Promise<PendingOrder[]> => {
  try {
    console.log('📋 Fetching pending orders...');
    
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Using JWT token for pending orders:', authHeaders.Authorization?.substring(0, 20) + '...');
    // Fetch pending orders directly
    const response = await axiosInstance.get('/api/orders/pending-all', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Pending orders fetched:', response.data.length, 'orders');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch pending orders:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch pending orders');
    }
  }
};
