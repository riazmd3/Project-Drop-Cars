import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { emitSessionExpired } from '@/utils/session';
// const API_BASE_URL = 'http://10.153.75.247:8000/';
// // Use same API base as VO
const API_BASE_URL = 'https://drop-cars-api-1049299844333.asia-south2.run.app';

const axiosDriver = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Reduced from 60s to 30s
  headers: {
    'Accept': 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300,
});

axiosDriver.interceptors.request.use(
  async (config: any) => {
    // Skip token validation for login and registration endpoints
    const isAuthEndpoint = config.url?.includes('/login') || 
                          config.url?.includes('/register') || 
                          config.url?.includes('/signup') ||
                          config.url?.includes('/signin') ||
                          config.url?.includes('/auth/') ||
                          config.url?.includes('/driver/login');
    
    if (!isAuthEndpoint) {
      // Check for valid token before making request (only for non-auth endpoints)
      const token = await SecureStore.getItemAsync('driverAuthToken');
      console.log('🔍 Driver token check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'None',
        endpoint: config.url
      });
      
      if (!token) {
        console.log('❌ No driver auth token found, emitting session expired');
        emitSessionExpired('No driver authentication token found');
        return Promise.reject(new Error('No driver authentication token found. Please login first.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // For auth endpoints, try to attach token if available (for refresh scenarios)
      const token = await SecureStore.getItemAsync('driverAuthToken');
      console.log('🔍 Driver auth endpoint token check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        endpoint: config.url
      });
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Quick self-check
    console.log('🚗 Driver request:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      authAttached: !!config.headers.Authorization,
      contentType: config.headers['Content-Type'],
    });
    return config;
  },
  (error) => Promise.reject(error)
);

axiosDriver.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('❌ Driver API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });
    
    // Only clear tokens for authentication-related errors
    const isAuthError = error.response?.status === 401 || 
                       error.response?.status === 403 ||
                       (error.response?.data?.detail && 
                        (error.response.data.detail.includes('token') || 
                         error.response.data.detail.includes('authentication') ||
                         error.response.data.detail.includes('expired')));
    
    if (isAuthError) {
      console.log('❌ Driver authentication error detected, clearing tokens');
      
      // Clear tokens and emit session expired for authentication errors only
      try { 
        await SecureStore.deleteItemAsync('driverAuthToken'); 
        console.log('🗑️ Cleared driverAuthToken');
      } catch (e) { 
        console.error('Error clearing driverAuthToken:', e); 
      }
      try { 
        await SecureStore.deleteItemAsync('driverAuthInfo'); 
        console.log('🗑️ Cleared driverAuthInfo');
      } catch (e) { 
        console.error('Error clearing driverAuthInfo:', e); 
      }
      
      // Emit session expired event
      emitSessionExpired('Driver session expired - Authentication error');
    } else {
      console.log('❌ Driver API error (non-auth), keeping tokens');
    }
    
    return Promise.reject(error);
  }
);

export default axiosDriver;


