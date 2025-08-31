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

    // 2. Fetch available cars using new assignment endpoint
    let cars: CarDetail[] = [];
    try {
      console.log('🚗 Fetching available cars from assignment endpoint...');
      const carsResponse = await axiosInstance.get('/api/assignments/available-cars', {
        headers: authHeaders
      });
      cars = carsResponse.data || [];
      console.log('✅ Available cars fetched from assignment endpoint:', cars.length, 'cars');
    } catch (error) {
      console.warn('⚠️ Assignment cars endpoint failed, trying fallback endpoints...');
      
      // Fallback to organization endpoint
      if (ownerDetails.organization_id) {
        try {
          const carsResponse = await axiosInstance.get(`/api/users/cardetails/organization/${ownerDetails.organization_id}`, {
            headers: authHeaders
          });
          cars = carsResponse.data || [];
          console.log('✅ Car details fetched from organization endpoint:', cars.length, 'cars');
        } catch (orgError) {
          console.warn('⚠️ Organization cars endpoint failed, trying alternative...');
          
          // Try alternative endpoint
          try {
            const altCarsResponse = await axiosInstance.get('/api/users/vehicleowner/cars', {
              headers: authHeaders
            });
            if (altCarsResponse.data) {
              cars = altCarsResponse.data;
              console.log('✅ Car details fetched from alternative endpoint:', cars.length, 'cars');
            }
          } catch (altError) {
            console.warn('⚠️ Alternative car endpoint also failed:', altError);
          }
        }
      }
    }

    // 3. Fetch available drivers using new assignment endpoint
    let drivers: DriverDetail[] = [];
    try {
      console.log('👤 Fetching available drivers from assignment endpoint...');
      const driversResponse = await axiosInstance.get('/api/assignments/available-drivers', {
        headers: authHeaders
      });
      drivers = driversResponse.data || [];
      console.log('✅ Available drivers fetched from assignment endpoint:', drivers.length, 'drivers');
    } catch (error) {
      console.warn('⚠️ Assignment drivers endpoint failed, trying fallback endpoints...');
      
      // Fallback to organization endpoint
      if (ownerDetails.organization_id) {
        try {
          const driversResponse = await axiosInstance.get(`/api/users/cardriver/organization/${ownerDetails.organization_id}`, {
            headers: authHeaders
          });
          drivers = driversResponse.data || [];
          console.log('✅ Driver details fetched from organization endpoint:', drivers.length, 'drivers');
        } catch (orgError) {
          console.warn('⚠️ Organization drivers endpoint failed, trying alternative...');
          
          // Try alternative endpoint
          try {
            const altDriversResponse = await axiosInstance.get('/api/users/vehicleowner/drivers', {
              headers: authHeaders
            });
            if (altDriversResponse.data) {
              drivers = altDriversResponse.data;
              console.log('✅ Driver details fetched from alternative endpoint:', drivers.length, 'drivers');
            }
          } catch (altError) {
            console.warn('⚠️ Alternative driver endpoint also failed:', altError);
          }
        }
      }
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
