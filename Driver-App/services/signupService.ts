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
