import axiosInstance from '@/app/api/axiosInstance';

// Updated interface to match your working Postman request
export interface SignupData {
  primary_number: string;
  secondary_number?: string;
  password: string;
  address: string;
  gpay_number?: string;
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

export const signupAccount = async (data: SignupData): Promise<SignupResponse> => {
  console.log('🚀 Starting signup process...');
  console.log('📤 Signup data:', JSON.stringify(data, null, 2));
  
  try {
    console.log('🌐 Making API call to signup endpoint...');
    
    const response = await axiosInstance.post('/api/users/vehicleowner/signup', data);
    
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
