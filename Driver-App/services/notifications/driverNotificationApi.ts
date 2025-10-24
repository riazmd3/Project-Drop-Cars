import axiosDriver from '@/app/api/axiosDriver';
import * as SecureStore from 'expo-secure-store';

export interface NotificationResponse {
  sub: string;
  permission1: boolean;
  permission2: boolean;
  token: string;
}

export async function getDriverNotificationSettings(): Promise<NotificationResponse | null> {
  try {
    const response = await axiosDriver.get('/api/notifications/');
    return response.data as NotificationResponse;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function upsertDriverNotificationSettings(payload: { 
  permission1: boolean; 
  permission2: boolean; 
  token: string 
}): Promise<NotificationResponse> {
  const response = await axiosDriver.post('/api/notifications/', payload);
  return response.data as NotificationResponse;
}

export async function updateDriverNotificationPermissions(payload: { 
  permission1?: boolean; 
  permission2?: boolean 
}): Promise<NotificationResponse> {
  // For drivers, use POST to the main endpoint since PATCH might not be supported
  // We need to get the current token first, then update with new permissions
  try {
    // First, get current settings to preserve the token
    const currentSettings = await getDriverNotificationSettings();
    
    // Get token from current settings, or fall back to stored Expo push token
    let token = currentSettings?.token || '';
    
    // If no token from current settings, try to get it from SecureStore
    if (!token) {
      try {
        const storedToken = await SecureStore.getItemAsync('expoPushToken');
        if (storedToken) {
          token = storedToken;
          console.log('📱 Using stored Expo push token for notification update');
        } else {
          console.warn('⚠️ No Expo push token found in SecureStore, trying to get fresh token...');
          
          // Try to get a fresh token from notification service
          try {
            const { notificationService } = await import('./notificationService');
            await notificationService.initialize(); // This will generate a new token if needed
            const freshToken = await SecureStore.getItemAsync('expoPushToken');
            if (freshToken) {
              token = freshToken;
              console.log('📱 Generated fresh Expo push token for notification update');
            }
          } catch (freshTokenError) {
            console.error('❌ Failed to generate fresh Expo push token:', freshTokenError);
          }
        }
      } catch (error) {
        console.error('❌ Error retrieving Expo push token from SecureStore:', error);
      }
    }
    
    // Update with new permissions and token
    const updatePayload = {
      permission1: payload.permission1 ?? currentSettings?.permission1 ?? true,
      permission2: payload.permission2 ?? currentSettings?.permission2 ?? true,
      token: token
    };
    
    console.log('🔄 Updating driver notification permissions:', {
      ...updatePayload,
      token: token ? `${token.substring(0, 20)}...` : 'EMPTY'
    });
    
    const response = await axiosDriver.post('/api/notifications/', updatePayload);
    return response.data as NotificationResponse;
  } catch (error: any) {
    console.error('❌ Failed to update driver notification permissions:', error);
    throw error;
  }
}
