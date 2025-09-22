// src/api/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Authenticated Axios instance
const api = axios.create({
  baseURL: "http://172.20.10.7:8000/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from AsyncStorage to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log("Token from AsyncStorage:", token);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get token from AsyncStorage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - maybe redirect to login');
    }
    return Promise.reject(error);
  }
);

// Public (unauthenticated) Axios instance
const publicApi = axios.create({
  baseURL: 'http://172.20.10.7:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Export both
export default api;        // Use this for authenticated requests
export { publicApi };     // Use this for public requests (e.g. `/data`)
