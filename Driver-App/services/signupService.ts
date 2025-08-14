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
  aadhar_front_img: string;
}

export interface SignupResponse {
  message: string;
  user_id: string;
  aadhar_img_url: string;
  status: string;
}

// Single signup API call (matching your working Postman request)
export const signupAccount = async (personalData: any, documents: any): Promise<SignupResponse> => {
  console.log('🚀 Starting signup process...');
  console.log('📤 Personal data received:', JSON.stringify(personalData, null, 2));
  console.log('📤 Documents received:', JSON.stringify(documents, null, 2));
  
  try {
    // Handle image data - convert local URI to base64 if needed
    let aadharImageData = documents.aadharFront;
    
    // If it's a local file URI, we need to handle it differently
    if (aadharImageData && aadharImageData.startsWith('file://')) {
      console.log('🖼️ Converting local image URI to base64...');
      // For now, we'll send the URI and let the backend handle it
      // In production, you might want to convert to base64 or use FormData
      aadharImageData = documents.aadharFront;
    }
    
    // Map form data to match backend API structure exactly
    const signupData: SignupData = {
      full_name: personalData.fullName || '',
      primary_number: personalData.primaryMobile || '',
      secondary_number: personalData.secondaryMobile || '',
      password: personalData.password || '',
      address: personalData.address || '',
      gpay_number: personalData.paymentNumber || '',
      aadhar_number: personalData.aadharNumber || '',
      organization_id: personalData.organizationId || 'org_001',
      aadhar_front_img: aadharImageData || '',
    };

    console.log('📤 Final signup data being sent:', JSON.stringify(signupData, null, 2));
    console.log('🔍 Data validation:');
    console.log('  - full_name:', typeof signupData.full_name, signupData.full_name);
    console.log('  - primary_number:', typeof signupData.primary_number, signupData.primary_number);
    console.log('  - password:', typeof signupData.password, signupData.password);
    console.log('  - address:', typeof signupData.address, signupData.address);
    console.log('  - gpay_number:', typeof signupData.gpay_number, signupData.gpay_number);
    console.log('  - aadhar_number:', typeof signupData.aadhar_number, signupData.aadhar_number);
    console.log('  - organization_id:', typeof signupData.organization_id, signupData.organization_id);
    console.log('  - aadhar_front_img:', typeof signupData.aadhar_front_img, signupData.aadhar_front_img);
    
    const response = await axiosInstance.post('/api/users/vehicleowner/signup', signupData);
    
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
  console.log('🧪 Testing signup data structure...');
  
  const testData = {
    full_name: personalData.fullName || '',
    primary_number: personalData.primaryMobile || '',
    secondary_number: personalData.secondaryMobile || '',
    password: personalData.password || '',
    address: personalData.address || '',
    gpay_number: personalData.paymentNumber || '',
    aadhar_number: personalData.aadharNumber || '',
    organization_id: personalData.organizationId || 'org_001',
    aadhar_front_img: documents.aadharFront || '',
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
    aadhar_front_img: !!testData.aadhar_front_img,
  });
  
  console.log('🔍 Field types:');
  Object.entries(testData).forEach(([key, value]) => {
    console.log(`  ${key}: ${typeof value} = "${value}"`);
  });
  
  return testData;
};
