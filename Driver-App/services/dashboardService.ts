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
  adress: string; // Note: API uses 'adress' not 'address'
  licence_number: string; // Note: API uses 'licence_number' not 'aadhar_number'
  organization_id: string;
  driver_status: string; // Note: API uses 'driver_status' not 'status'
  licence_front_img: string;
  created_at: string;
}

export interface VehicleOwnerDetails {
  id: string;
  full_name: string;
  primary_mobile: string;
  secondary_mobile?: string;
  wallet_balance: number;
  organization_id: string;
  vehicle_owner_id: string;
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
    console.log('Fetching dashboard data...');
    
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

    // 2. Fetch all cars for the vehicle owner (organization endpoints removed)
    let cars: CarDetail[] = [];
    try {
      console.log('🚗 Fetching all cars for vehicle owner...');
      
      const carEndpoints = [
        `/api/assignments/available-cars`,
        `/api/users/vehicle-owner/${ownerDetails.id}/cars`,
        `/api/users/cardetails/all`
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
        } catch (endpointError: any) {
          console.log(`❌ Car endpoint ${endpoint} failed:`, endpointError.response?.status || endpointError.message);
          continue; // Try next endpoint
        }
      }
      
      if (cars.length === 0) {
        console.warn('⚠️ No cars found from any endpoint');
      }
    } catch (error) {
      console.error('❌ All car endpoints failed:', error);
    }

    // 3. Fetch all drivers for the vehicle owner (organization endpoints removed)
    let drivers: DriverDetail[] = [];
    try {
      console.log('👤 Fetching all drivers for vehicle owner...');
      
      const driverEndpoints = [
        `/api/users/cardriver/all`,
        `/api/assignments/available-drivers`,
        `/api/users/cardriver/vehicle-owner/${ownerDetails.id}`
      ];
      
      for (const endpoint of driverEndpoints) {
        try {
          console.log(`🔍 Trying driver endpoint: ${endpoint}`);
          const driversResponse = await axiosInstance.get(endpoint, {
            headers: authHeaders
          });
          
          if (driversResponse.data && Array.isArray(driversResponse.data)) {
            console.log(`🔍 Raw API response from ${endpoint}:`, driversResponse.data.length, 'drivers');
            console.log('🔍 Raw driver data sample:', driversResponse.data[0]);
            
            // Map the response data to ensure consistent field names
            drivers = driversResponse.data.map((driver: any) => {
              // Get the raw status from the API response
              const rawStatus = driver.driver_status || driver.status || 'PROCESSING';
              
              // Normalize the status to match AccountStatusEnum exactly
              let driverStatus = rawStatus.toString().trim().toUpperCase();
              
              // Validate against the known AccountStatusEnum values
              const validStatuses = ['ONLINE', 'OFFLINE', 'DRIVING', 'BLOCKED', 'PROCESSING'];
              if (!validStatuses.includes(driverStatus)) {
                console.warn(`⚠️ Unknown driver status: "${rawStatus}" for driver ${driver.full_name}, defaulting to PROCESSING`);
                driverStatus = 'PROCESSING';
              }
              
              // Log the status mapping for debugging
              console.log(`🔍 Driver ${driver.full_name}: "${rawStatus}" -> "${driverStatus}"`);
              
              return {
                ...driver,
                // Map 'status' to 'driver_status' with proper status handling
                driver_status: driverStatus,
                // Map 'address' to 'adress' if needed (API inconsistency)
                adress: driver.adress || driver.address || '',
                // Map 'aadhar_number' to 'licence_number' if needed
                licence_number: driver.licence_number || driver.aadhar_number || driver.license_number || '',
                // Ensure licence_front_img exists
                licence_front_img: driver.licence_front_img || driver.license_front_img || ''
              };
            });
            console.log(`✅ Drivers fetched from ${endpoint}:`, drivers.length, 'drivers');
            console.log('🔍 Driver statuses:', drivers.map(d => ({ name: d.full_name, status: d.driver_status })));
            console.log('🔍 Driver count by status:', {
              ONLINE: drivers.filter(d => d.driver_status === 'ONLINE').length,
              OFFLINE: drivers.filter(d => d.driver_status === 'OFFLINE').length,
              PROCESSING: drivers.filter(d => d.driver_status === 'PROCESSING').length,
              DRIVING: drivers.filter(d => d.driver_status === 'DRIVING').length,
              BLOCKED: drivers.filter(d => d.driver_status === 'BLOCKED').length,
              OTHER: drivers.filter(d => !['ONLINE', 'OFFLINE', 'PROCESSING', 'DRIVING', 'BLOCKED'].includes(d.driver_status)).length
            });
            break; // Use the first successful endpoint
          }
        } catch (endpointError: any) {
          console.log(`❌ Driver endpoint ${endpoint} failed:`, endpointError.response?.status || endpointError.message);
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

    console.log('Dashboard data assembled:', {
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
 * Fetch available drivers from the specific API endpoint
 */
export const fetchAvailableDrivers = async (): Promise<DriverDetail[]> => {
  try {
    console.log('👥 Fetching available drivers from API...');
    
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Using JWT token for available drivers:', authHeaders.Authorization?.substring(0, 20) + '...');

    const response = await axiosInstance.get('/api/users/available-drivers', {
      headers: authHeaders
    });

    if (response.data && Array.isArray(response.data)) {
      // Map the response data to ensure consistent field names
      const drivers = response.data.map((driver: any) => {
        // Get the raw status from the API response
        const rawStatus = driver.driver_status || driver.status || 'PROCESSING';
        
        // Normalize the status to match AccountStatusEnum exactly
        let driverStatus = rawStatus.toString().trim().toUpperCase();
        
        // Validate against the known AccountStatusEnum values
        const validStatuses = ['ONLINE', 'OFFLINE', 'DRIVING', 'BLOCKED', 'PROCESSING'];
        if (!validStatuses.includes(driverStatus)) {
          console.warn(`⚠️ Unknown driver status: "${rawStatus}" for driver ${driver.full_name}, defaulting to PROCESSING`);
          driverStatus = 'PROCESSING';
        }
        
        // Log the status mapping for debugging
        console.log(`🔍 Available Driver ${driver.full_name}: "${rawStatus}" -> "${driverStatus}"`);
        
        return {
          ...driver,
          // Map 'status' to 'driver_status' with proper status handling
          driver_status: driverStatus,
          // Map 'address' to 'adress' if needed (API inconsistency)
          adress: driver.adress || driver.address || '',
          // Map 'aadhar_number' to 'licence_number' if needed
          licence_number: driver.licence_number || driver.aadhar_number || driver.license_number || '',
          // Ensure licence_front_img exists
          licence_front_img: driver.licence_front_img || driver.license_front_img || ''
        };
      });
      
      console.log(`✅ Available drivers fetched successfully:`, drivers.length, 'drivers');
      console.log('🔍 Available driver statuses:', drivers.map(d => ({ name: d.full_name, status: d.driver_status })));
      return drivers;
    }

    console.warn('⚠️ No available drivers data received or data is not an array');
    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch available drivers:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch available drivers');
    }
  }
};

/**
 * Debug function to test driver count issue
 */
export const debugDriverCountIssue = async (): Promise<any> => {
  try {
    console.log('🧪 Starting driver count debug test...');
    
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Using JWT token:', authHeaders.Authorization?.substring(0, 20) + '...');

    // First get vehicle owner details
    const ownerResponse = await axiosInstance.get('/api/users/vehicle-owner/me', {
      headers: authHeaders
    });

    const ownerDetails = ownerResponse.data;
    console.log('👤 Vehicle owner details:', ownerDetails);

    const driverEndpoints = [
      `/api/users/cardriver/organization/${ownerDetails.organization_id}`,
      `/api/users/cardriver/all`,
      `/api/assignments/available-drivers`,
      `/api/users/cardriver/vehicle-owner/${ownerDetails.id}`,
    ];

    const testResults = {
      drivers: [] as any[]
    };

    // Test driver endpoints
    for (const endpoint of driverEndpoints) {
      try {
        console.log(`🔍 Testing driver endpoint: ${endpoint}`);
        const response = await axiosInstance.get(endpoint, {
          headers: authHeaders
        });

        const result = {
          endpoint,
          status: response.status,
          success: true,
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
          data: response.data,
          error: null,
          statusBreakdown: Array.isArray(response.data) ? {
            ONLINE: response.data.filter((d: any) => (d.driver_status || d.status || '').toString().toUpperCase() === 'ONLINE').length,
            OFFLINE: response.data.filter((d: any) => (d.driver_status || d.status || '').toString().toUpperCase() === 'OFFLINE').length,
            PROCESSING: response.data.filter((d: any) => (d.driver_status || d.status || '').toString().toUpperCase() === 'PROCESSING').length,
            DRIVING: response.data.filter((d: any) => (d.driver_status || d.status || '').toString().toUpperCase() === 'DRIVING').length,
            BLOCKED: response.data.filter((d: any) => (d.driver_status || d.status || '').toString().toUpperCase() === 'BLOCKED').length,
            OTHER: response.data.filter((d: any) => {
              const status = (d.driver_status || d.status || '').toString().toUpperCase();
              return !['ONLINE', 'OFFLINE', 'PROCESSING', 'DRIVING', 'BLOCKED'].includes(status);
            }).length
          } : null
        };

        testResults.drivers.push(result);
        console.log(`✅ Driver endpoint ${endpoint}: ${response.status} - ${Array.isArray(response.data) ? response.data.length : 'N/A'} items`);
        if (result.statusBreakdown) {
          console.log(`📊 Status breakdown:`, result.statusBreakdown);
        }

      } catch (error: any) {
        const result = {
          endpoint,
          status: error.response?.status || 'Network Error',
          success: false,
          dataType: 'error',
          dataLength: 'N/A',
          data: null,
          error: error.message || error.response?.data || 'Unknown error',
          statusBreakdown: null
        };

        testResults.drivers.push(result);
        console.log(`❌ Driver endpoint ${endpoint}: ${error.response?.status || 'Error'} - ${error.message}`);
      }
    }

    console.log('🧪 Driver count debug test completed:', testResults);
    return testResults;

  } catch (error: any) {
    console.error('❌ Driver count debug test failed:', error);
    throw error;
  }
};

/**
 * Debug function to test car and driver endpoints
 */
export const debugCarDriverEndpoints = async (): Promise<any> => {
  try {
    console.log('🧪 Starting car and driver endpoint debug test...');
    
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Using JWT token:', authHeaders.Authorization?.substring(0, 20) + '...');

    // First get vehicle owner details
    const ownerResponse = await axiosInstance.get('/api/users/vehicle-owner/me', {
      headers: authHeaders
    });

    const ownerDetails = ownerResponse.data;
    console.log('👤 Vehicle owner details:', ownerDetails);

    const carEndpoints = [
      `/api/users/cardetails/organization/${ownerDetails.organization_id}`,
      `/api/assignments/available-cars`,
      `/api/users/vehicle-owner/${ownerDetails.id}/cars`,
      `/api/users/vehicleowner/cars`,
      `/api/cars/owner/${ownerDetails.id}`,
      `/api/users/cardetails/all`
    ];

    const driverEndpoints = [
      `/api/users/cardriver/organization/${ownerDetails.organization_id}`,
      `/api/assignments/available-drivers`,
      `/api/users/cardriver/all`,
    ];

    const testResults = {
      cars: [] as any[],
      drivers: [] as any[]
    };

    // Test car endpoints
    for (const endpoint of carEndpoints) {
      try {
        console.log(`🔍 Testing car endpoint: ${endpoint}`);
        const response = await axiosInstance.get(endpoint, {
          headers: authHeaders
        });

        const result = {
          endpoint,
          status: response.status,
          success: true,
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
          data: response.data,
          error: null
        };

        testResults.cars.push(result);
        console.log(`✅ Car endpoint ${endpoint}: ${response.status} - ${Array.isArray(response.data) ? response.data.length : 'N/A'} items`);

      } catch (error: any) {
        const result = {
          endpoint,
          status: error.response?.status || 'Network Error',
          success: false,
          dataType: 'error',
          dataLength: 'N/A',
          data: null,
          error: error.message || error.response?.data || 'Unknown error'
        };

        testResults.cars.push(result);
        console.log(`❌ Car endpoint ${endpoint}: ${error.response?.status || 'Error'} - ${error.message}`);
      }
    }

    // Test driver endpoints
    for (const endpoint of driverEndpoints) {
      try {
        console.log(`🔍 Testing driver endpoint: ${endpoint}`);
        const response = await axiosInstance.get(endpoint, {
          headers: authHeaders
        });

        const result = {
          endpoint,
          status: response.status,
          success: true,
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
          data: response.data,
          error: null
        };

        testResults.drivers.push(result);
        console.log(`✅ Driver endpoint ${endpoint}: ${response.status} - ${Array.isArray(response.data) ? response.data.length : 'N/A'} items`);

      } catch (error: any) {
        const result = {
          endpoint,
          status: error.response?.status || 'Network Error',
          success: false,
          dataType: 'error',
          dataLength: 'N/A',
          data: null,
          error: error.message || error.response?.data || 'Unknown error'
        };

        testResults.drivers.push(result);
        console.log(`❌ Driver endpoint ${endpoint}: ${error.response?.status || 'Error'} - ${error.message}`);
      }
    }

    console.log('🧪 Debug test completed:', testResults);
    return testResults;

  } catch (error: any) {
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
      // Filter by status: keep only truly pending orders
      const filtered = response.data.filter((order: any) => {
        const rawStatus = (order.trip_status || order.status || '').toString();
        const status = rawStatus.trim().toUpperCase();
        // Backend status set includes: COMPLETED, ACCEPTED, IN_PROGRESS, PENDING
        // We only show PENDING here
        const isPending = status === 'PENDING';
        if (!isPending) {
          // Omit ACCEPTED / IN_PROGRESS / COMPLETED from pending list
          return false;
        }
        return true;
      });
      console.log('✅ Filtered pending orders:', filtered.length);
      return filtered;
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
