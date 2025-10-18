import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { emitSessionExpired } from '@/utils/session';
const API_BASE_URL = 'http://10.153.75.247:8000/';
// Use same API base as VO
// const API_BASE_URL = 'https://drop-cars-api-1049299844333.asia-south2.run.app/';

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
    const token = await SecureStore.getItemAsync('driverAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    console.error('❌ Driver API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      try { SecureStore.deleteItemAsync('driverAuthToken'); } catch {}
      try { SecureStore.deleteItemAsync('driverAuthInfo'); } catch {}
      emitSessionExpired('Session expired');
    }
    return Promise.reject(error);
  }
);

export default axiosDriver;


