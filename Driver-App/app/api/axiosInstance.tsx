import axios from 'axios';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { emitSessionExpired } from '@/utils/session';

// For React Native, use machine IP instead of localhost
// const API_BASE_URL = 'http://10.59.192.145:8000/';
const API_BASE_URL = 'https://drop-cars-api-1049299844333.asia-south2.run.app';
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

    // Skip token validation for login and registration endpoints
    const isAuthEndpoint = config.url?.includes('/login') || 
                          config.url?.includes('/register') || 
                          config.url?.includes('/signup') ||
                          config.url?.includes('/signin') ||
                          config.url?.includes('/auth/');
    
    if (!isAuthEndpoint) {
      // Check for valid token before making request (only for non-auth endpoints)
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        // On fresh app open (no token), do NOT emit session expired. Just block the request.
        console.log('❌ No auth token found, blocking non-auth request without emitting session event');
        return Promise.reject(new Error('No authentication token found. Please login first.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // For auth endpoints, try to attach token if available (for refresh scenarios)
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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

const removeAccessToken = async () => {
  try {
    await SecureStore.deleteItemAsync('authToken');
    console.log('🗑️ Cleared authToken');
  } catch (error) {
    console.error('Error clearing authToken:', error);
  }

  try {
    await SecureStore.deleteItemAsync('userData');
    console.log('🗑️ Cleared userData');
  } catch (error) {
    console.error('Error clearing userData:', error);
  }
};

let isShowingAuthAlert = false;
const showAuthAlert = (title: string, message: string) => {
  if (isShowingAuthAlert) return;
  isShowingAuthAlert = true;

  Alert.alert(title, message, [
    {
      text: 'OK',
      onPress: () => {
        isShowingAuthAlert = false;
      },
    },
  ]);
};

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
  async (error: any) => {
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
    
    // Only clear tokens and emit session expired for AUTHENTICATION errors (401, 403)
    // NOT for client errors (400, 404, etc.) or other errors (500, network issues)
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    
    if (isAuthError) {
      console.log('🔐 Authentication error detected (401/403), clearing tokens...');

      const errorDetail = error.response?.data?.detail || 'Unauthorized access';
      const isForceLogout = errorDetail === 'Force Logout Action Raised';
      const alertTitle = isForceLogout ? 'Force Logout' : 'Session Expired';
      const alertMessage = isForceLogout
        ? 'Admin raised a force logout. Please login again with your credentials.'
        : 'Your session has expired. Please login again.';

      showAuthAlert(alertTitle, alertMessage);
      await removeAccessToken();

      // Emit session expired event
      emitSessionExpired(
        isForceLogout ? 'Force logout - token version changed' : 'Session expired - Please login again'
      );
    } else {
      // For non-auth errors (400, 404, 500, etc.), just log them without clearing tokens
      console.log('⚠️ Non-authentication error, keeping tokens intact:', {
        status: error.response?.status,
        message: error.response?.data?.detail || error.message
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;