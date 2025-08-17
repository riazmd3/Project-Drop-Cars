import axiosInstance from '@/app/api/axiosInstance';
import authService from './authService';

// Car management interface for editing existing cars
export interface CarUpdateData {
  car_id: string;
  car_name?: string;
  car_type?: string;
  car_number?: string;
  organization_id: string;
  vehicle_owner_id: string;
  rc_front_img?: any; // File object for FormData
  rc_back_img?: any; // File object for FormData
  insurance_img?: any; // File object for FormData
  fc_img?: any; // File object for FormData
  car_img?: any; // File object for FormData
}

// Car list response interface
export interface CarListResponse {
  message: string;
  cars: CarDetails[];
  total_count: number;
}

// Car details interface for listing
export interface CarDetails {
  car_id: string;
  car_name: string;
  car_type: string;
  car_number: string;
  organization_id: string;
  vehicle_owner_id: string;
  rc_front_img_url?: string;
  rc_back_img_url?: string;
  insurance_img_url?: string;
  fc_img_url?: string;
  car_img_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Get all cars for a vehicle owner
export const getCars = async (): Promise<CarDetails[]> => {
  console.log('🚗 Fetching cars list...');
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await axiosInstance.get('/api/users/cardetails/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Cars list fetched successfully:', response.data);
    return response.data.cars || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch cars:', error);
    throw error;
  }
};

// Get specific car by ID
export const getCarById = async (carId: string): Promise<CarDetails> => {
  console.log(`🚗 Fetching car details for ID: ${carId}...`);
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await axiosInstance.get(`/api/users/cardetails/${carId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Car details fetched successfully:', response.data);
    return response.data.car_details;
  } catch (error: any) {
    console.error('❌ Failed to fetch car details:', error);
    throw error;
  }
};

// Update existing car
export const updateCar = async (carData: CarUpdateData): Promise<any> => {
  console.log('✏️ Starting car update...');
  console.log('📤 Car update data:', JSON.stringify(carData, null, 2));
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    if (!carData.car_id) {
      throw new Error('Car ID is required for updating');
    }

    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    
    // Helper function to append image files
    const appendImageFile = (fieldName: string, imageUri: string, defaultName: string) => {
      if (imageUri) {
        const imageName = imageUri.split('/').pop() || defaultName;
        const imageType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        
        formData.append(fieldName, {
          uri: imageUri,
          type: imageType,
          name: imageName
        } as any);
        
        console.log(`🖼️ ${fieldName} appended to FormData:`, { uri: imageUri, type: imageType, name: imageName });
      } else {
        console.log(`⚠️ ${fieldName} not provided, skipping...`);
      }
    };

    // Append image files if provided
    if (carData.rc_front_img) {
      appendImageFile('rc_front_img', carData.rc_front_img, 'rc_front.jpg');
    }
    if (carData.rc_back_img) {
      appendImageFile('rc_back_img', carData.rc_back_img, 'rc_back.jpg');
    }
    if (carData.insurance_img) {
      appendImageFile('insurance_img', carData.insurance_img, 'insurance.jpg');
    }
    if (carData.fc_img) {
      appendImageFile('fc_img', carData.fc_img, 'fc.jpg');
    }
    if (carData.car_img) {
      appendImageFile('car_img', carData.car_img, 'car.jpg');
    }

    // Append text fields (only if they are provided)
    formData.append('car_id', carData.car_id);
    if (carData.car_name) {
      formData.append('car_name', carData.car_name);
    }
    if (carData.car_type) {
      formData.append('car_type', carData.car_type);
    }
    if (carData.car_number) {
      formData.append('car_number', carData.car_number);
    }
    formData.append('organization_id', carData.organization_id || '');
    formData.append('vehicle_owner_id', carData.vehicle_owner_id || '');

    console.log('📤 FormData created for update with fields:', {
      car_id: carData.car_id,
      car_name: carData.car_name || 'Not updated',
      car_type: carData.car_type || 'Not updated',
      car_number: carData.car_number || 'Not updated',
      organization_id: carData.organization_id,
      vehicle_owner_id: carData.vehicle_owner_id,
      rc_front_img: carData.rc_front_img ? 'File attached' : 'No file',
      rc_back_img: carData.rc_back_img ? 'File attached' : 'No file',
      insurance_img: carData.insurance_img ? 'File attached' : 'No file',
      fc_img: carData.fc_img ? 'File attached' : 'No file',
      car_img: carData.car_img ? 'File attached' : 'No file'
    });

    // Make the API call
    const response = await axiosInstance.put(`/api/users/cardetails/${carData.car_id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Car update successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Car update failed:', error);
    throw error;
  }
};

// Delete car
export const deleteCar = async (carId: string): Promise<{ message: string }> => {
  console.log('🗑️ Starting car deletion...');
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await axiosInstance.delete(`/api/users/cardetails/${carId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Car deleted successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Car deletion failed:', error);
    throw error;
  }
};

// Set default car
export const setDefaultCar = async (carId: string): Promise<any> => {
  console.log(`⭐ Setting car ${carId} as default...`);
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await axiosInstance.patch(`/api/users/cardetails/${carId}/default`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Default car set successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to set default car:', error);
    throw error;
  }
};

// Test function to validate car update data structure
export const testCarUpdateDataStructure = (carData: CarUpdateData) => {
  console.log('🧪 Testing car update data structure...');
  console.log('📋 Data structure validation:');
  
  // Check required fields
  if (!carData.car_id) {
    console.log('  ❌ car_id: Missing (required for updates)');
    return false;
  }
  console.log(`  ✅ car_id: ${carData.car_id}`);
  
  if (!carData.organization_id) {
    console.log('  ❌ organization_id: Missing (required)');
    return false;
  }
  console.log(`  ✅ organization_id: ${carData.organization_id}`);
  
  if (!carData.vehicle_owner_id) {
    console.log('  ❌ vehicle_owner_id: Missing (required)');
    return false;
  }
  console.log(`  ✅ vehicle_owner_id: ${carData.vehicle_owner_id}`);
  
  // Check optional fields that can be updated
  if (carData.car_name) {
    console.log(`  ✅ car_name: ${carData.car_name} (will be updated)`);
  } else {
    console.log(`  ⚠️ car_name: Not provided (will not be updated)`);
  }
  
  if (carData.car_type) {
    console.log(`  ✅ car_type: ${carData.car_type} (will be updated)`);
  } else {
    console.log(`  ⚠️ car_type: Not provided (will not be updated)`);
  }
  
  if (carData.car_number) {
    console.log(`  ✅ car_number: ${carData.car_number} (will be updated)`);
  } else {
    console.log(`  ⚠️ car_number: Not provided (will not be updated)`);
  }
  
  // Check image fields
  const imageFields = ['rc_front_img', 'rc_back_img', 'insurance_img', 'fc_img', 'car_img'];
  for (const field of imageFields) {
    const imageUri = carData[field as keyof CarUpdateData];
    if (imageUri) {
      console.log(`  ✅ ${field}: File attached (will be updated)`);
    } else {
      console.log(`  ⚠️ ${field}: No file (will not be updated)`);
    }
  }
  
  console.log('✅ Car update data structure validation completed');
  return true;
};

// Test function to check car management API connectivity
export const testCarManagementConnection = async () => {
  try {
    console.log('🧪 Testing car management endpoint connectivity...');
    const response = await axiosInstance.get('/api/users/cardetails/list');
    console.log('✅ Car management endpoint accessible:', response.status);
    return true;
  } catch (error: any) {
    console.error('❌ Car management endpoint test failed:', error.message);
    return false;
  }
};
