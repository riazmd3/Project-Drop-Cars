import { getCurrentApiBaseUrl } from './environment';

// API Configuration
export const API_CONFIG = {
  // Base URL for the backend API (from environment)
  BASE_URL: getCurrentApiBaseUrl(),
  
  // API endpoints
  ENDPOINTS: {
    VENDOR_SIGNUP: '/api/users/vendor/signup',
    VENDOR_SIGNIN: '/api/users/vendor/signin',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // File upload limits
  UPLOAD_LIMITS: {
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  },
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get vendor signup URL
export const getVendorSignupUrl = (): string => {
  return getApiUrl(API_CONFIG.ENDPOINTS.VENDOR_SIGNUP);
};

// Helper function to get vendor signin URL
export const getVendorSigninUrl = (): string => {
  return getApiUrl(API_CONFIG.ENDPOINTS.VENDOR_SIGNIN);
};

// Helper function to get current API base URL
export const getApiBaseUrl = (): string => {
  return API_CONFIG.BASE_URL;
};
