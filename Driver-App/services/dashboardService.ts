import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';
import { authService } from '@/services/authService';

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
    
    // First, try to get user data from auth service
    const userData = await authService.getUserData();
    console.log('🔍 User data from auth service:', userData);
    
    if (!userData) {
      throw new Error('No user data found. Please login again.');
    }

    // Try to get auth headers for additional API calls
    let authHeaders;
    try {
      authHeaders = await getAuthHeaders();
      console.log('🔐 Using JWT token:', authHeaders.Authorization?.substring(0, 20) + '...');
    } catch (error) {
      console.warn('⚠️ Could not get auth headers, using basic user data only');
    }

    // Create basic dashboard data from user data
    const dashboardData: DashboardData = {
      user_info: {
        id: userData.id,
        full_name: userData.fullName,
        primary_mobile: userData.primaryMobile,
        organization_id: userData.organizationId,
        account_status: 'active', // Default to active
        car_details_count: 0, // Will be updated if API calls succeed
        car_driver_count: 0   // Will be updated if API calls succeed
      },
      cars: [],
      drivers: []
    };

    // If we have auth headers, try to fetch additional data
    if (authHeaders) {
      try {
        // Try to fetch user profile for additional info
        const profileResponse = await axiosInstance.get('/api/users/vehicleowner/profile', {
          headers: authHeaders
        });
        
        if (profileResponse.data) {
          console.log('✅ Profile data received:', profileResponse.data);
          const profileData = profileResponse.data;
          
          // Update dashboard data with profile info
          dashboardData.user_info = {
            ...dashboardData.user_info,
            full_name: profileData.full_name || userData.fullName,
            primary_mobile: profileData.primary_mobile || profileData.mobile_number || userData.primaryMobile,
            organization_id: profileData.organization_id || userData.organizationId,
            account_status: profileData.account_status || 'active',
            car_details_count: profileData.car_details_count || 0,
            car_driver_count: profileData.car_driver_count || 0
          };
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch profile data, using basic user data:', error);
      }

      // Try to fetch car details
      try {
        const carsResponse = await axiosInstance.get('/api/users/vehicleowner/cars', {
          headers: authHeaders
        });
        if (carsResponse.data) {
          dashboardData.cars = carsResponse.data;
          console.log('✅ Car details fetched:', dashboardData.cars.length, 'cars');
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch car details, using empty array:', error);
      }

      // Try to fetch driver details
      try {
        const driversResponse = await axiosInstance.get('/api/users/vehicleowner/drivers', {
          headers: authHeaders
        });
        if (driversResponse.data) {
          dashboardData.drivers = driversResponse.data;
          console.log('✅ Driver details fetched:', dashboardData.drivers.length, 'drivers');
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch driver details, using empty array:', error);
      }
    }

    console.log('📊 Final dashboard data assembled:', {
      user: dashboardData.user_info,
      carCount: dashboardData.cars.length,
      driverCount: dashboardData.drivers.length
    });

    return dashboardData;

  } catch (error: any) {
    console.error('❌ Failed to fetch dashboard data:', error);
    
    if (error.message?.includes('No user data found')) {
      throw new Error('Please login again to access dashboard data.');
    } else if (error.response?.status === 401) {
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
