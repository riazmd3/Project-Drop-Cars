import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';

export interface CarDetail {
  id: string;
  car_name: string;
  car_type: string;
  car_number: string;
  organization_id: string;
  vehicle_owner_id: string;
  rc_front_img?: string;
  rc_back_img?: string;
  insurance_img?: string;
  fc_img?: string;
  car_img?: string;
  created_at: string;
  updated_at: string;
}

export interface DriverDetail {
  id: string;
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  licence_number: string;
  adress: string;
  organization_id: string;
  vehicle_owner_id: string;
  licence_front_img?: string;
  rc_front_img?: string;
  rc_back_img?: string;
  insurance_img?: string;
  fc_img?: string;
  car_img?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  user_info: {
    id: string;
    full_name: string;
    primary_mobile: string;
    organization_id: string;
    account_status: string;
    car_details_count: number;
    car_driver_count: number;
  };
  cars: CarDetail[];
  drivers: DriverDetail[];
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    console.log('📊 Fetching dashboard data...');
    
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Using JWT token:', authHeaders.Authorization?.substring(0, 20) + '...');

    // Fetch user profile and counts
    const profileResponse = await axiosInstance.get('/api/users/vehicleowner/profile', {
      headers: authHeaders
    });

    console.log('✅ Profile data received:', profileResponse.data);

    const userInfo = profileResponse.data;
    
    // Fetch car details
    let cars: CarDetail[] = [];
    if (userInfo.car_details_count > 0) {
      try {
        const carsResponse = await axiosInstance.get('/api/users/vehicleowner/cars', {
          headers: authHeaders
        });
        cars = carsResponse.data || [];
        console.log('✅ Car details fetched:', cars.length, 'cars');
      } catch (error) {
        console.error('❌ Failed to fetch car details:', error);
        cars = [];
      }
    }

    // Fetch driver details
    let drivers: DriverDetail[] = [];
    if (userInfo.car_driver_count > 0) {
      try {
        const driversResponse = await axiosInstance.get('/api/users/vehicleowner/drivers', {
          headers: authHeaders
        });
        drivers = driversResponse.data || [];
        console.log('✅ Driver details fetched:', drivers.length, 'drivers');
      } catch (error) {
        console.error('❌ Failed to fetch driver details:', error);
        drivers = [];
      }
    }

    const dashboardData: DashboardData = {
      user_info: {
        id: userInfo.id || userInfo.user_id,
        full_name: userInfo.full_name,
        primary_mobile: userInfo.primary_mobile || userInfo.mobile_number,
        organization_id: userInfo.organization_id,
        account_status: userInfo.account_status,
        car_details_count: userInfo.car_details_count || 0,
        car_driver_count: userInfo.car_driver_count || 0
      },
      cars,
      drivers
    };

    console.log('📊 Dashboard data assembled:', {
      user: dashboardData.user_info,
      carCount: dashboardData.cars.length,
      driverCount: dashboardData.drivers.length
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
