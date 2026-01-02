import axios from 'axios';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { emitSessionExpired } from '@/utils/session';


// const API_BASE_URL = 'http://10.59.192.145:8000/';

const API_BASE_URL = 'https://drop-cars-api-207918408785.asia-south2.run.app';

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
        // On fresh app open (no driver token), do NOT emit session expired. Just block the request.
        console.log('❌ No driver auth token found, blocking non-auth request without emitting session event');
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

const clearDriverSession = async () => {
  try {
    await SecureStore.deleteItemAsync('driverAuthToken');
    console.log('🗑️ Cleared driverAuthToken');
  } catch (error) {
    console.error('Error clearing driverAuthToken:', error);
  }

  try {
    await SecureStore.deleteItemAsync('driverAuthInfo');
    console.log('🗑️ Cleared driverAuthInfo');
  } catch (error) {
    console.error('Error clearing driverAuthInfo:', error);
  }
};

let isShowingDriverAlert = false;
const showDriverAuthAlert = (title: string, message: string) => {
  if (isShowingDriverAlert) return;
  isShowingDriverAlert = true;

  Alert.alert(title, message, [
    {
      text: 'OK',
      onPress: () => {
        isShowingDriverAlert = false;
      },
    },
  ]);
};

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

      const errorDetail = error.response?.data?.detail || 'Unauthorized access';
      const isForceLogout = errorDetail === 'Force Logout Action Raised';
      const alertTitle = isForceLogout ? 'Force Logout' : 'Session Expired';
      const alertMessage = isForceLogout
        ? 'Admin raised a force logout for drivers. Please login again.'
        : 'Your driver session has expired. Please login again.';

      showDriverAuthAlert(alertTitle, alertMessage);
      await clearDriverSession();
      
      // Emit session expired event
      emitSessionExpired(
        isForceLogout ? 'Driver force logout - token version changed' : 'Driver session expired - Authentication error'
      );
    } else {
      console.log('❌ Driver API error (non-auth), keeping tokens');
    }
    
    return Promise.reject(error);
  }
);

export default axiosDriver;


