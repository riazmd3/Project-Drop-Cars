import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// For React Native, use machine IP instead of localhost
const API_BASE_URL = 'https://drop-cars-api-1049299844333.asia-south2.run.app/'; // Physical Emulatorm,kjuvb8

console.log('🔧 API Config:', { baseURL: API_BASE_URL });

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout to 60 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Add retry configuration
  maxRedirects: 5,
  // Treat only 2xx as success so 4xx surfaces to catch blocks
  validateStatus: (status) => status >= 200 && status < 300,
});

// Mask sensitive values in logs
const mask = (key: string, value: any) => {
  const k = (key || '').toLowerCase();
  if (k.includes('password') || k.includes('token') || k.includes('authorization')) {
    return '***';
  }
  return value;
};

// Request interceptor with logging
axiosInstance.interceptors.request.use(
  async (config: any) => {
    console.log('🚀 Request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      data: config.data instanceof FormData ? 'FormData (file upload)' : config.data,
      contentType: config.headers['Content-Type'],
      timeout: config.timeout
    });

    // Align with authService storage key
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🔐 Auth attached:', !!config.headers.Authorization);
    
    // Ensure proper Content-Type for FormData (matches Postman form-data)
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      // Increase timeout for file uploads
      config.timeout = 120000; // 2 minutes for file uploads
      console.log('📤 FormData detected, setting Content-Type to multipart/form-data and timeout to 120s');

      // React Native FormData does not expose entries(); it keeps an internal _parts array
      // We will log keys and basic meta only (masking sensitive text)
      const parts = (config.data as any)?._parts;
      if (Array.isArray(parts)) {
        const debugParts = parts.map((p: any) => {
          const [key, value] = p || [];
          if (!key) return null;
          if (value && typeof value === 'object' && (value.uri || value.name)) {
            return { key, value: { uri: !!value.uri, name: value.name || 'file', type: value.type || 'binary' } };
          }
          return { key, value: mask(key, value) };
        }).filter(Boolean);
        console.log('🧾 FormData fields:', debugParts);
      }
    }
    
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response interceptor with enhanced error logging
axiosInstance.interceptors.response.use(
  (response: any) => {
    console.log('✅ Response:', { 
      status: response.status, 
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
      config: {
        url: response.config?.url,
        method: response.config?.method,
        timeout: response.config?.timeout
      }
    });
    return response;
  },
  (error: any) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      timeout: error.config?.timeout,
      data: error.response?.data,
      // Check if we got a partial response
      isPartialResponse: error.response?.status >= 200 && error.response?.status < 300,
      // Check if it's a timeout
      isTimeout: error.code === 'ECONNABORTED',
      // Check if it's a network error
      isNetworkError: error.code === 'ERR_NETWORK'
    });
    
    // If we got a successful response but axios still treats it as an error
    if (error.response?.status >= 200 && error.response?.status < 300) {
      console.log('🔄 Converting partial success response to success');
      return Promise.resolve(error.response);
    }
    
    // Don't convert 4xx and 5xx errors to success
    if (error.response?.status >= 400) {
      console.log('❌ HTTP error response, not converting to success:', error.response.status);
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;