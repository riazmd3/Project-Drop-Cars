// src/api/axiosInstance.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://drop-cars-api-1049299844333.asia-south2.run.app',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor with auth tokens and FormData support
axiosInstance.interceptors.request.use(
  async (config) => {
    // Skip token validation for login and registration endpoints
    const isAuthEndpoint = config.url?.includes('/login') || 
                          config.url?.includes('/register') || 
                          config.url?.includes('/signup') ||
                          config.url?.includes('/auth/') ||
                          config.url?.includes('/driver/login');
    
    if (!isAuthEndpoint) {
      // Check for valid token before making request (only for non-auth endpoints)
      const token = await AsyncStorage.getItem('driverAuthToken');
      if (!token) {
        console.log('❌ No driver auth token found in Frontend-App');
        // Clear any existing data and redirect to login
        try {
          await AsyncStorage.multiRemove(['driverAuthToken', 'driverAuthInfo']);
        } catch (e) {
          console.error('Error clearing driver data:', e);
        }
        return Promise.reject(new Error('No driver authentication token found. Please login first.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // For auth endpoints, try to attach token if available (for refresh scenarios)
      const token = await AsyncStorage.getItem('driverAuthToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Ensure proper Content-Type for FormData (matches Postman form-data)
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      console.log('📤 FormData detected, setting Content-Type to multipart/form-data');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Frontend-App API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('❌ Authentication error detected, clearing tokens');
      AsyncStorage.multiRemove(['driverAuthToken', 'driverAuthInfo']).catch(e => 
        console.error('Error clearing tokens:', e)
      );
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
