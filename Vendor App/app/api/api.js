// src/api/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the Axios instance
const api = axios.create({
  baseURL: "http://34.126.222.137:8000/api", // Your backend IP + port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token from AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken'); // get token async
    console.log("Token from AsyncStorage:", token); // Debug log
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get token from AsyncStorage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized access - maybe redirect to login');
      // Add your logout or redirect logic here if needed
    }
    return Promise.reject(error);
  }
);

export default api;
