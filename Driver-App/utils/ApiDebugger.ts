// API Debugger utility to help identify backend validation issues
import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';

export const testSignupAPI = async () => {
  console.log('🧪 Testing Signup API...');
  
  try {
    // Test with minimal valid data
    const testData = new FormData();
    testData.append('full_name', 'Test User');
    testData.append('primary_number', '9876543210');
    testData.append('password', 'test123');
    testData.append('address', 'Test Address');
    testData.append('aadhar_number', '123456789012');
    testData.append('organization_id', 'org_001');
    
    console.log('📤 Sending test signup data...');
    
    const response = await axiosInstance.post('/api/users/vehicleowner/signup', testData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
    
    console.log('✅ Signup API test successful:', response.data);
    return { success: true, data: response.data };
    
  } catch (error: any) {
    console.error('❌ Signup API test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.response?.data || error.message };
  }
};

export const testWalletBalanceAPI = async () => {
  console.log('🧪 Testing Wallet Balance API...');
  
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await axiosInstance.get('/api/wallet/balance', {
      headers: authHeaders
    });
    
    console.log('✅ Wallet Balance API test successful:', response.data);
    return { success: true, data: response.data };
    
  } catch (error: any) {
    console.error('❌ Wallet Balance API test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.response?.data || error.message };
  }
};

export const testRazorpayVerifyAPI = async () => {
  console.log('🧪 Testing Razorpay Verify API...');
  
  try {
    const authHeaders = await getAuthHeaders();
    
    // Test with mock data
    const testPayload = {
      rp_order_id: 'order_test123',
      rp_payment_id: 'pay_test123',
      rp_signature: 'test_signature123'
    };
    
    const response = await axiosInstance.post('/api/wallet/razorpay/verify', testPayload, {
      headers: authHeaders
    });
    
    console.log('✅ Razorpay Verify API test successful:', response.data);
    return { success: true, data: response.data };
    
  } catch (error: any) {
    console.error('❌ Razorpay Verify API test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.response?.data || error.message };
  }
};

export const runAllAPITests = async () => {
  console.log('🚀 Running all API tests...');
  
  const results = {
    signup: await testSignupAPI(),
    walletBalance: await testWalletBalanceAPI(),
    razorpayVerify: await testRazorpayVerifyAPI()
  };
  
  console.log('📊 API Test Results:', results);
  return results;
};
