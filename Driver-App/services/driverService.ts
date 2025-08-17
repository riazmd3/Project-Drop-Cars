import axiosInstance from '@/app/api/axiosInstance';
import authService from './authService';

// Driver API interface matching your backend structure
export interface DriverData {
  driver_name: string;
  mobile_number: string;
  aadhar_number?: string;
  rc_front_img?: any; // File object for FormData
  rc_back_img?: any; // File object for FormData
  spoken_languages: string[];
  organization_id: string;
  vehicle_owner_id: string;
  driver_id?: string; // For editing existing drivers
}

// Driver response interface
export interface DriverResponse {
  message: string;
  driver_id: string;
  status: string;
  driver_details: {
    driver_name: string;
    mobile_number: string;
    aadhar_number?: string;
    rc_front_img_url?: string;
    rc_back_img_url?: string;
    spoken_languages: string[];
    organization_id: string;
    vehicle_owner_id: string;
    status: string;
  };
}

// Get all drivers for a vehicle owner
export const getDrivers = async (): Promise<DriverResponse[]> => {
  console.log('👥 Fetching drivers list...');
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await axiosInstance.get('/api/users/drivers/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Drivers list fetched successfully:', response.data);
    return response.data.drivers || [];
  } catch (error: any) {
    console.error('❌ Failed to fetch drivers:', error);
    throw error;
  }
};

// Add new driver
export const addDriver = async (driverData: DriverData): Promise<DriverResponse> => {
  console.log('👤 Starting driver registration...');
  console.log('📤 Driver data received:', JSON.stringify(driverData, null, 2));
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
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
    if (driverData.rc_front_img) {
      appendImageFile('rc_front_img', driverData.rc_front_img, 'rc_front.jpg');
    }
    if (driverData.rc_back_img) {
      appendImageFile('rc_back_img', driverData.rc_back_img, 'rc_back.jpg');
    }

    // Append text fields
    formData.append('driver_name', driverData.driver_name || '');
    formData.append('mobile_number', driverData.mobile_number || '');
    if (driverData.aadhar_number) {
      formData.append('aadhar_number', driverData.aadhar_number);
    }
    formData.append('spoken_languages', JSON.stringify(driverData.spoken_languages || []));
    formData.append('organization_id', driverData.organization_id || '');
    formData.append('vehicle_owner_id', driverData.vehicle_owner_id || '');

    console.log('📤 FormData created with fields:', {
      driver_name: driverData.driver_name,
      mobile_number: driverData.mobile_number,
      aadhar_number: driverData.aadhar_number || 'Not provided',
      rc_front_img: driverData.rc_front_img ? 'File attached' : 'No file',
      rc_back_img: driverData.rc_back_img ? 'File attached' : 'No file',
      spoken_languages: driverData.spoken_languages,
      organization_id: driverData.organization_id,
      vehicle_owner_id: driverData.vehicle_owner_id
    });

    // Make the API call
    const response = await axiosInstance.post('/api/users/drivers/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Driver registration successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Driver registration failed:', error);
    throw error;
  }
};

// Edit existing driver
export const editDriver = async (driverData: DriverData): Promise<DriverResponse> => {
  console.log('✏️ Starting driver update...');
  console.log('📤 Driver update data:', JSON.stringify(driverData, null, 2));
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    if (!driverData.driver_id) {
      throw new Error('Driver ID is required for editing');
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
    if (driverData.rc_front_img) {
      appendImageFile('rc_front_img', driverData.rc_front_img, 'rc_front.jpg');
    }
    if (driverData.rc_back_img) {
      appendImageFile('rc_back_img', driverData.rc_back_img, 'rc_back.jpg');
    }

    // Append text fields
    formData.append('driver_id', driverData.driver_id);
    formData.append('driver_name', driverData.driver_name || '');
    formData.append('mobile_number', driverData.mobile_number || '');
    if (driverData.aadhar_number) {
      formData.append('aadhar_number', driverData.aadhar_number);
    }
    formData.append('spoken_languages', JSON.stringify(driverData.spoken_languages || []));
    formData.append('organization_id', driverData.organization_id || '');
    formData.append('vehicle_owner_id', driverData.vehicle_owner_id || '');

    console.log('📤 FormData created for update with fields:', {
      driver_id: driverData.driver_id,
      driver_name: driverData.driver_name,
      mobile_number: driverData.mobile_number,
      aadhar_number: driverData.aadhar_number || 'Not provided',
      rc_front_img: driverData.rc_front_img ? 'File attached' : 'No file',
      rc_back_img: driverData.rc_back_img ? 'File attached' : 'No file',
      spoken_languages: driverData.spoken_languages,
      organization_id: driverData.organization_id,
      vehicle_owner_id: driverData.vehicle_owner_id
    });

    // Make the API call
    const response = await axiosInstance.put(`/api/users/drivers/${driverData.driver_id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Driver update successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Driver update failed:', error);
    throw error;
  }
};

// Delete driver
export const deleteDriver = async (driverId: string): Promise<{ message: string }> => {
  console.log('🗑️ Starting driver deletion...');
  
  try {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const response = await axiosInstance.delete(`/api/users/drivers/${driverId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Driver deleted successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Driver deletion failed:', error);
    throw error;
  }
};

// Test function to validate driver data structure
export const testDriverDataStructure = (driverData: DriverData) => {
  console.log('🧪 Testing driver data structure...');
  console.log('📋 Data structure validation:');
  
  // Check required text fields
  const requiredTextFields = ['driver_name', 'mobile_number', 'organization_id', 'vehicle_owner_id'];
  for (const field of requiredTextFields) {
    const value = driverData[field as keyof DriverData];
    if (!value || value.toString().trim().length === 0) {
      console.log(`  ❌ ${field}: Missing or empty`);
      return false;
    }
    console.log(`  ✅ ${field}: ${value}`);
  }
  
  // Check optional fields
  if (driverData.aadhar_number) {
    console.log(`  ✅ aadhar_number: ${driverData.aadhar_number}`);
  } else {
    console.log(`  ⚠️ aadhar_number: Not provided (optional)`);
  }
  
  // Check spoken languages
  if (driverData.spoken_languages && driverData.spoken_languages.length > 0) {
    console.log(`  ✅ spoken_languages: ${driverData.spoken_languages.join(', ')}`);
  } else {
    console.log(`  ⚠️ spoken_languages: Not provided (optional)`);
  }
  
  // Check image fields
  const imageFields = ['rc_front_img', 'rc_back_img'];
  for (const field of imageFields) {
    const imageUri = driverData[field as keyof DriverData];
    if (imageUri) {
      console.log(`  ✅ ${field}: File attached`);
    } else {
      console.log(`  ⚠️ ${field}: No file (optional)`);
    }
  }
  
  console.log('✅ Driver data structure validation completed');
  return true;
};

// Test function to check driver API connectivity
export const testDriverConnection = async () => {
  try {
    console.log('🧪 Testing driver endpoint connectivity...');
    const response = await axiosInstance.get('/api/users/drivers/list');
    console.log('✅ Driver endpoint accessible:', response.status);
    return true;
  } catch (error: any) {
    console.error('❌ Driver endpoint test failed:', error.message);
    return false;
  }
};
