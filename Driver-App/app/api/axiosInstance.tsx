import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Determine API base URL dynamically for device/simulator environments
// Priority: ENV override -> Expo devtools LAN IP -> Android emulator -> iOS simulator -> fallback
const resolveBaseUrl = (): string => {
	// Allow override via env at build time if provided
	// @ts-ignore - process may be polyfilled by Metro
	const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
	if (typeof envUrl === 'string' && envUrl.length > 0) {
		return envUrl;
	}

	// Use your machine's IP as default (works for both emulator and physical device)
	return 'http://10.100.155.145:8000';
};

const API_BASE_URL = resolveBaseUrl();

console.log('🔧 API Config:', { baseURL: API_BASE_URL });

const axiosInstance = axios.create({
	baseURL: API_BASE_URL,
	timeout: 120000, // Increased timeout to 60 seconds for file uploads
	headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
	},
	// Add retry configuration
	maxRedirects: 5,
});

// Request interceptor with logging
axiosInstance.interceptors.request.use(
	async (config: any) => {
		const token = await SecureStore.getItemAsync('authToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		
		// Ensure proper handling for FormData: let Axios set the Content-Type boundary
		if (config.data instanceof FormData) {
			// Do NOT set multipart header manually; Axios will set correct boundary
			delete (config.headers as any)['Content-Type'];
			// Increase timeout for file uploads
			config.timeout = 120000; // 2 minutes for file uploads
			console.log('📤 FormData detected, letting Axios set Content-Type boundary, timeout 120s');
		}

		// Log AFTER adjustments so we see the actual outgoing headers
		console.log('🚀 Request:', {
			method: config.method?.toUpperCase(),
			url: `${config.baseURL || API_BASE_URL}${config.url}`,
			data: config.data instanceof FormData ? 'FormData (file upload)' : config.data,
			contentType: (config.headers as any)['Content-Type'],
			timeout: config.timeout,
		});

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
				timeout: response.config?.timeout,
			},
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
			// Check if it's a timeout
			isTimeout: error.code === 'ECONNABORTED',
			// Check if it's a network error
			isNetworkError: error.code === 'ERR_NETWORK',
		});
		
		return Promise.reject(error);
	}
);

export default axiosInstance;
