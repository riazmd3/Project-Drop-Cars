import axiosInstance from '@/app/api/axiosInstance';

// Single API call interface matching your working Postman request
export interface SignupData {
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  password: string;
  address: string;
  gpay_number: string;
  aadhar_number: string;
  organization_id: string;
  aadhar_front_img: any; // File object for FormData
}

export interface SignupResponse {
  message: string;
  user_id: string;
  aadhar_img_url: string;
  status: string;
}

// Single signup API call using FormData for file upload
export const signupAccount = async (personalData: any, documents: any): Promise<SignupResponse> => {
  console.log('🚀 Starting signup process with FormData...');
  console.log('📤 Personal data received:', JSON.stringify(personalData, null, 2));
  console.log('📤 Documents received:', JSON.stringify(documents, null, 2));
  
  try {
    // Create FormData for multipart/form-data upload
    const formData = new FormData();
    
    // Append the image file
    if (documents.aadharFront) {
      const imageUri = documents.aadharFront;
      const imageName = imageUri.split('/').pop() || 'aadhar.jpg';
      const imageType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      formData.append('aadhar_front_img', {
        uri: imageUri,
        type: imageType,
        name: imageName
      } as any);
      
      console.log('🖼️ Image appended to FormData:', { uri: imageUri, type: imageType, name: imageName });
    }
    
    // Helper function to format phone numbers for backend
    const formatPhoneForBackend = (phone: string): string => {
      if (!phone) return '';
      // Remove +91 prefix if present and ensure it's properly formatted
      const cleanPhone = phone.replace(/^\+91/, '');
      // Add +91 prefix back
      return `+91${cleanPhone}`;
    };

    // Append all other fields
    formData.append('full_name', personalData.fullName || '');
    formData.append('primary_number', formatPhoneForBackend(personalData.primaryMobile || ''));
    formData.append('secondary_number', personalData.secondaryMobile ? formatPhoneForBackend(personalData.secondaryMobile) : '');
    formData.append('password', personalData.password || '');
    formData.append('address', personalData.address || '');
    formData.append('gpay_number', formatPhoneForBackend(personalData.paymentNumber || ''));
    formData.append('aadhar_number', personalData.aadharNumber || '');
    formData.append('organization_id', personalData.organizationId || 'org_001');
    
    console.log('📤 FormData created with fields:', {
      full_name: personalData.fullName,
      primary_number: personalData.primaryMobile,
      secondary_number: personalData.secondaryMobile,
      password: personalData.password,
      address: personalData.address,
      gpay_number: personalData.paymentNumber,
      aadhar_number: personalData.aadharNumber,
      organization_id: personalData.organizationId,
      aadhar_front_img: documents.aadharFront ? 'File attached' : 'No file'
    });
    
    // Make the API call with FormData
    const response = await axiosInstance.post('/api/users/vehicleowner/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Signup API response received:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Signup failed with error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      }
    });

    // Provide specific error messages based on error type
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - server is taking too long to respond. Please try again.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error - please check your internet connection and try again.');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Server not found - please check if the backend server is running.');
    } else if (error.response?.status === 422) {
      const errorDetails = error.response.data?.detail || error.response.data?.message || 'Invalid data provided';
      console.error('🔍 422 Validation Error Details:', errorDetails);
      throw new Error(`Validation error: ${errorDetails}. Check all required fields.`);
    } else if (error.response?.status === 400) {
      throw new Error(`Bad request: ${error.response.data?.message || 'Invalid data provided'}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error - please try again later or contact support.');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error(`Signup failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
};

// Test function to check API connectivity
export const testSignupConnection = async () => {
  try {
    console.log('🧪 Testing signup endpoint connectivity...');
    const response = await axiosInstance.get('/api/users/vehicleowner/signup');
    console.log('✅ Signup endpoint accessible:', response.status);
    return true;
  } catch (error: any) {
    console.error('❌ Signup endpoint test failed:', error.message);
    return false;
  }
};

// Test function to validate data structure
export const testSignupDataStructure = (personalData: any, documents: any) => {
  console.log('🧪 Testing signup data structure for FormData...');
  
  const testData = {
    full_name: personalData.fullName || '',
    primary_number: personalData.primaryMobile || '',
    secondary_number: personalData.secondaryMobile || '',
    password: personalData.password || '',
    address: personalData.address || '',
    gpay_number: personalData.paymentNumber || '',
    aadhar_number: personalData.aadharNumber || '',
    organization_id: personalData.organizationId || 'org_001',
    aadhar_front_img: documents.aadharFront ? 'File will be attached' : 'No file',
  };
  
  console.log('📊 Data Structure Test:');
  console.log('✅ Required fields present:', {
    full_name: !!testData.full_name,
    primary_number: !!testData.primary_number,
    password: !!testData.password,
    address: !!testData.address,
    gpay_number: !!testData.gpay_number,
    aadhar_number: !!testData.aadhar_number,
    organization_id: !!testData.organization_id,
    aadhar_front_img: !!documents.aadharFront,
  });
  
  console.log('🔍 Field values:');
  Object.entries(testData).forEach(([key, value]) => {
    if (key !== 'aadhar_front_img') {
      console.log(`  ${key}: ${typeof value} = "${value}"`);
    } else {
      console.log(`  ${key}: ${documents.aadharFront ? 'File attached' : 'No file'}`);
    }
  });
  
  console.log('🖼️ Image details:', {
    uri: documents.aadharFront,
    type: documents.aadharFront ? (documents.aadharFront.endsWith('.png') ? 'image/png' : 'image/jpeg') : 'N/A',
    name: documents.aadharFront ? documents.aadharFront.split('/').pop() : 'N/A'
  });
  
  return testData;
};

// Car Details API interface matching your Postman request
export interface CarDetailsData {
  car_name: string;
  car_type: string;
  car_number: string;
  organization_id: string;
  vehicle_owner_id: string;
  rc_front_img: any; // File object for FormData
  rc_back_img: any; // File object for FormData
  insurance_img: any; // File object for FormData
  fc_img: any; // File object for FormData
  car_img: any; // File object for FormData
}

export interface CarDetailsResponse {
  message: string;
  car_id: string;
  status: string;
  car_details: {
    car_name: string;
    car_type: string;
    car_number: string;
    organization_id: string;
    vehicle_owner_id: string;
    rc_front_img_url: string;
    rc_back_img_url: string;
    insurance_img_url: string;
    fc_img_url: string;
    car_img_url: string;
  };
}

// Car details API call using FormData for multiple file uploads
export const addCarDetails = async (carData: CarDetailsData): Promise<CarDetailsResponse> => {
  console.log('🚗 Starting car details registration with FormData...');
  console.log('📤 Car data received:', JSON.stringify(carData, null, 2));
  
  try {
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
    
    // Append all image files
    appendImageFile('rc_front_img', carData.rc_front_img, 'rc_front.jpg');
    appendImageFile('rc_back_img', carData.rc_back_img, 'rc_back.jpg');
    appendImageFile('insurance_img', carData.insurance_img, 'insurance.jpg');
    appendImageFile('fc_img', carData.fc_img, 'fc.jpg');
    appendImageFile('car_img', carData.car_img, 'car.jpg');
    
    // Append text fields
    formData.append('car_name', carData.car_name || '');
    formData.append('car_type', carData.car_type || '');
    formData.append('car_number', carData.car_number || '');
    formData.append('organization_id', carData.organization_id || '');
    formData.append('vehicle_owner_id', carData.vehicle_owner_id || '');
    
    console.log('📤 FormData created with fields:', {
      car_name: carData.car_name,
      car_type: carData.car_type,
      car_number: carData.car_number,
      organization_id: carData.organization_id,
      vehicle_owner_id: carData.vehicle_owner_id,
      rc_front_img: carData.rc_front_img ? 'File attached' : 'No file',
      rc_back_img: carData.rc_back_img ? 'File attached' : 'No file',
      insurance_img: carData.insurance_img ? 'File attached' : 'No file',
      fc_img: carData.fc_img ? 'File attached' : 'No file',
      car_img: carData.car_img ? 'File attached' : 'No file'
    });
    
    // Make the API call with FormData
    const response = await axiosInstance.post('/api/users/cardetails/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Car details API response received:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Car details registration failed with error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      }
    });

    // Provide specific error messages based on error type
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - server is taking too long to respond. Please try again.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error - please check your internet connection and try again.');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Server not found - please check if the backend server is running.');
    } else if (error.response?.status === 422) {
      const errorDetails = error.response.data?.detail || error.response.data?.message || 'Invalid data provided';
      console.error('🔍 422 Validation Error Details:', errorDetails);
      throw new Error(`Validation error: ${errorDetails}. Check all required fields.`);
    } else if (error.response?.status === 400) {
      throw new Error(`Bad request: ${error.response.data?.message || 'Invalid data provided'}`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error - please try again later or contact support.');
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error(`Car details registration failed: ${error.message || 'Unknown error occurred'}`);
    }
  }
};

// Test function to check car details API connectivity
export const testCarDetailsConnection = async () => {
  try {
    console.log('🧪 Testing car details endpoint connectivity...');
    const response = await axiosInstance.get('/api/users/cardetails/signup');
    console.log('✅ Car details endpoint accessible:', response.status);
    return true;
  } catch (error: any) {
    console.error('❌ Car details endpoint test failed:', error.message);
    return false;
  }
};

// Test function to validate car details data structure
export const testCarDetailsDataStructure = (carData: CarDetailsData) => {
  console.log('🧪 Testing car details data structure for FormData...');
  
  const testData = {
    car_name: carData.car_name || '',
    car_type: carData.car_type || '',
    car_number: carData.car_number || '',
    organization_id: carData.organization_id || '',
    vehicle_owner_id: carData.vehicle_owner_id || '',
    rc_front_img: carData.rc_front_img ? 'File will be attached' : 'No file',
    rc_back_img: carData.rc_back_img ? 'File will be attached' : 'No file',
    insurance_img: carData.insurance_img ? 'File will be attached' : 'No file',
    fc_img: carData.fc_img ? 'File will be attached' : 'No file',
    car_img: carData.car_img ? 'File will be attached' : 'No file',
  };
  
  console.log('📊 Car Details Data Structure Test:');
  console.log('✅ Required fields present:', {
    car_name: !!testData.car_name,
    car_type: !!testData.car_type,
    car_number: !!testData.car_number,
    organization_id: !!testData.organization_id,
    vehicle_owner_id: !!testData.vehicle_owner_id,
    rc_front_img: !!carData.rc_front_img,
    rc_back_img: !!carData.rc_back_img,
    insurance_img: !!carData.insurance_img,
    fc_img: !!carData.fc_img,
    car_img: !!carData.car_img,
  });
  
  console.log('🔍 Field values:');
  Object.entries(testData).forEach(([key, value]) => {
    if (key.includes('_img')) {
      console.log(`  ${key}: ${carData[key as keyof CarDetailsData] ? 'File attached' : 'No file'}`);
    } else {
      console.log(`  ${key}: ${typeof value} = "${value}"`);
    }
  });
  
  console.log('🖼️ Image details:');
  const imageFields = ['rc_front_img', 'rc_back_img', 'insurance_img', 'fc_img', 'car_img'];
  imageFields.forEach(field => {
    const imageUri = carData[field as keyof CarDetailsData];
    if (imageUri) {
      console.log(`  ${field}:`, {
        uri: imageUri,
        type: imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg',
        name: imageUri.split('/').pop()
      });
    } else {
      console.log(`  ${field}: No image provided`);
    }
  });
  
  return testData;
};
