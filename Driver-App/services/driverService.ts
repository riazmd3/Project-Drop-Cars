import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';

export interface DriverDetails {
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  password: string;
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
}

export interface DriverResponse {
  message: string;
  driver_id: string;
  status: string;
}

export const addDriverDetails = async (driverData: DriverDetails): Promise<DriverResponse> => {
  try {
    console.log('🚗 Starting driver details registration...');
    console.log('📤 Driver data received:', driverData);

    // Create FormData for file uploads
    const formData = new FormData();

    // Add text fields
    formData.append('full_name', driverData.full_name);
    formData.append('primary_number', driverData.primary_number);
    if (driverData.secondary_number) {
      formData.append('secondary_number', driverData.secondary_number);
    }
    formData.append('password', driverData.password);
    formData.append('licence_number', driverData.licence_number);
    formData.append('adress', driverData.adress);
    formData.append('organization_id', driverData.organization_id);
    formData.append('vehicle_owner_id', driverData.vehicle_owner_id);

    // Add image files if they exist
    if (driverData.licence_front_img) {
      formData.append('licence_front_img', {
        uri: driverData.licence_front_img,
        type: 'image/jpeg',
        name: 'licence_front.jpg'
      } as any);
      console.log('🖼️ licence_front_img appended to FormData');
    }

    if (driverData.rc_front_img) {
      formData.append('rc_front_img', {
        uri: driverData.rc_front_img,
        type: 'image/jpeg',
        name: 'rc_front.jpg'
      } as any);
      console.log('🖼️ rc_front_img appended to FormData');
    }

    if (driverData.rc_back_img) {
      formData.append('rc_back_img', {
        uri: driverData.rc_back_img,
        type: 'image/jpeg',
        name: 'rc_back.jpg'
      } as any);
      console.log('🖼️ rc_back_img appended to FormData');
    }

    if (driverData.insurance_img) {
      formData.append('insurance_img', {
        uri: driverData.insurance_img,
        type: 'image/jpeg',
        name: 'insurance.jpg'
      } as any);
      console.log('🖼️ insurance_img appended to FormData');
    }

    if (driverData.fc_img) {
      formData.append('fc_img', {
        uri: driverData.fc_img,
        type: 'image/jpeg',
        name: 'fc.jpg'
      } as any);
      console.log('🖼️ fc_img appended to FormData');
    }

    if (driverData.car_img) {
      formData.append('car_img', {
        uri: driverData.car_img,
        type: 'image/jpeg',
        name: 'car.jpg'
      } as any);
      console.log('🖼️ car_img appended to FormData');
    }

    console.log('📤 FormData created with fields:', {
      full_name: driverData.full_name,
      primary_number: driverData.primary_number,
      licence_number: driverData.licence_number,
      adress: driverData.adress,
      organization_id: driverData.organization_id,
      vehicle_owner_id: driverData.vehicle_owner_id,
      licence_front_img: driverData.licence_front_img ? 'File attached' : 'Not provided',
      rc_front_img: driverData.rc_front_img ? 'File attached' : 'Not provided',
      rc_back_img: driverData.rc_back_img ? 'File attached' : 'Not provided',
      insurance_img: driverData.insurance_img ? 'File attached' : 'Not provided',
      fc_img: driverData.fc_img ? 'File attached' : 'Not provided',
      car_img: driverData.car_img ? 'File attached' : 'Not provided'
    });

    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    console.log('🔐 Using JWT token:', authHeaders.Authorization?.substring(0, 20) + '...');

    // Log the exact request being sent
    console.log('📤 Sending request to backend:', {
      url: '/api/users/cardriver/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: authHeaders.Authorization?.substring(0, 20) + '...'
      },
      formDataSummary: {
        textFields: {
          full_name: driverData.full_name,
          primary_number: driverData.primary_number,
          licence_number: driverData.licence_number,
          adress: driverData.adress,
          organization_id: driverData.organization_id,
          vehicle_owner_id: driverData.vehicle_owner_id
        },
        imageFiles: {
          licence_front_img: !!driverData.licence_front_img,
          rc_front_img: !!driverData.rc_front_img,
          rc_back_img: !!driverData.rc_back_img,
          insurance_img: !!driverData.insurance_img,
          fc_img: !!driverData.fc_img,
          car_img: !!driverData.car_img
        }
      }
    });

    // Make API call
    const response = await axiosInstance.post('/api/users/cardriver/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...authHeaders
      },
    });

    console.log('✅ Driver details API response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    // Log detailed error information for debugging
    if (response.status >= 400) {
      console.log('❌ Backend error details:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      // Log the actual error detail content
      if (response.data?.detail) {
        console.log('❌ Error detail content:', JSON.stringify(response.data.detail, null, 2));
      }
    }

    // Check if response is successful
    if (response.status >= 200 && response.status < 300) {
      const responseData = response.data;
      
      if (!responseData) {
        console.error('❌ Response data is null or undefined');
        throw new Error('Invalid response from server');
      }

      // Validate response structure
      if (responseData.status === 'success' || responseData.driver_id) {
        console.log('✅ Driver details registration successful');
        return responseData;
      } else {
        console.log('⚠️ Response structure unexpected, but status is successful');
        return responseData;
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error: any) {
    console.error('❌ Driver details registration failed with error:', error);
    
    if (error.response?.status === 400 || error.response?.status === 422) {
      // Handle validation errors
      const errorData = error.response.data;
      console.log('🔍 Processing validation error:', JSON.stringify(errorData, null, 2));
      
      if (errorData?.detail) {
        // Handle different detail formats
        if (Array.isArray(errorData.detail)) {
          // Extract field-specific errors
          const fieldErrors = errorData.detail.map((err: any) => {
            if (err.loc && err.msg) {
              return `${err.loc.join('.')}: ${err.msg}`;
            }
            return err.msg || err;
          }).join(', ');
          throw new Error(`Validation Error: ${fieldErrors}`);
        } else if (typeof errorData.detail === 'string') {
          throw new Error(`Validation Error: ${errorData.detail}`);
        } else {
          throw new Error(`Validation Error: ${JSON.stringify(errorData.detail)}`);
        }
      } else if (errorData?.message) {
        throw new Error(`Validation Error: ${errorData.message}`);
      } else {
        throw new Error('Validation Error: Please check your input data');
      }
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(error.message || 'Failed to register driver details');
    }
  }
};

export const getDriverDetails = async (driverId: string) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get(`/api/users/cardriver/${driverId}`, {
      headers: authHeaders
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get driver details:', error);
    throw new Error('Failed to fetch driver details');
  }
};

export const updateDriverDetails = async (driverId: string, driverData: Partial<DriverDetails>) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.put(`/api/users/cardriver/${driverId}`, driverData, {
      headers: authHeaders
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to update driver details:', error);
    throw new Error('Failed to update driver details');
  }
};
