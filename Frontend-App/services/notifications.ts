import axios from 'axios';

const API_BASE_URL = 'https://drop-cars-api-1049299844333.asia-south2.run.app';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});

// Add auth interceptor
axiosInstance.interceptors.request.use(
  async (config: any) => {
    // Get token from AsyncStorage (you'll need to import AsyncStorage)
    const token = await import('@react-native-async-storage/async-storage').then(
      (AsyncStorage) => AsyncStorage.default.getItem('driverAuthToken')
    );
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface NotificationSettings {
  sub: string;
  permission1: boolean;
  permission2: boolean;
  token: string;
}

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const response = await axiosInstance.get('/api/notifications/');
    return response.data as NotificationSettings;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function upsertNotificationSettings(payload: { 
  permission1: boolean; 
  permission2: boolean; 
  token: string 
}): Promise<NotificationSettings> {
  const response = await axiosInstance.post('/api/notifications/', payload);
  return response.data as NotificationSettings;
}

export async function updateNotificationPermissions(payload: { 
  permission1?: boolean; 
  permission2?: boolean 
}): Promise<NotificationSettings> {
  // For drivers, use POST to the main endpoint since PATCH might not be supported
  // We need to get the current token first, then update with new permissions
  try {
    // First, get current settings to preserve the token
    const currentSettings = await getNotificationSettings();
    const token = currentSettings?.token || '';
    
    // Update with new permissions and existing token
    const updatePayload = {
      permission1: payload.permission1 ?? currentSettings?.permission1 ?? true,
      permission2: payload.permission2 ?? currentSettings?.permission2 ?? true,
      token: token
    };
    
    console.log('🔄 Updating notification permissions:', updatePayload);
    const response = await axiosInstance.post('/api/notifications/', updatePayload);
    return response.data as NotificationSettings;
  } catch (error: any) {
    console.error('❌ Failed to update notification permissions:', error);
    throw error;
  }
}