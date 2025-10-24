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
  // For drivers, use POST to the main endpoint
  // Send token only when toggling ON, send empty string when toggling OFF
  try {
    const notificationsEnabled = (payload.permission1 ?? true) && (payload.permission2 ?? true);
    let token = '';
    
    // Only get token if notifications are being enabled
    if (notificationsEnabled) {
      try {
        const storedToken = await SecureStore.getItemAsync('expoPushToken');
        if (storedToken) {
          token = storedToken;
          console.log('📱 Notifications ON - using stored Expo push token');
        } else {
          console.warn('⚠️ Notifications ON but no token found, trying to get fresh token...');
          
          // Try to get a fresh token from notification service
          try {
            const { forceGenerateToken } = await import('./notificationService');
            const freshToken = await forceGenerateToken();
            if (freshToken) {
              token = freshToken;
              console.log('📱 Notifications ON - generated fresh Expo push token');
            }
          } catch (freshTokenError) {
            console.error('❌ Failed to generate fresh Expo push token:', freshTokenError);
          }
        }
      } catch (error) {
        console.error('❌ Error retrieving Expo push token from SecureStore:', error);
      }
    } else {
      console.log('📱 Notifications OFF - sending empty token');
    }
    
    // Update with new permissions and token (empty if notifications disabled)
    const updatePayload = {
      permission1: payload.permission1 ?? true,
      permission2: payload.permission2 ?? true,
      token: token // Empty string if notifications disabled, token if enabled
    };
    
    console.log('🔄 Updating driver notification permissions:', {
      ...updatePayload,
      token: token ? `${token.substring(0, 20)}...` : 'EMPTY (notifications disabled)',
      notificationsEnabled
    });
    
    const response = await axiosDriver.post('/api/notifications/', updatePayload);
    return response.data as NotificationResponse;
  } catch (error: any) {
    console.error('❌ Failed to update driver notification permissions:', error);
    throw error;
  }
}
