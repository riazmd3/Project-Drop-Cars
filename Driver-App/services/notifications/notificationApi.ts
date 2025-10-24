import axiosInstance from '@/app/api/axiosInstance';
import { authService } from '@/services/auth/authService';
import * as SecureStore from 'expo-secure-store';

export interface NotificationResponse {
  sub: string;
  permission1: boolean;
  permission2: boolean;
  token: string;
}

export async function getNotificationSettings(): Promise<NotificationResponse | null> {
  try {
    const headers = await authService.getAuthHeaders();
    const res = await axiosInstance.get('/api/notifications/', { headers });
    return res.data as NotificationResponse;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function upsertNotificationSettings(payload: { permission1: boolean; permission2: boolean; token: string }): Promise<NotificationResponse> {
  const headers = await authService.getAuthHeaders();
  const res = await axiosInstance.post('/api/notifications/', payload, { headers });
  return res.data as NotificationResponse;
}

export async function updateNotificationSettings(payload: { 
  permission1?: boolean; 
  permission2?: boolean 
}): Promise<NotificationResponse> {
  // For vehicle owners, use POST to the main endpoint
  // Send token only when toggling ON, send empty string when toggling OFF
  const headers = await authService.getAuthHeaders();
  
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
    
    console.log('🔄 Updating vehicle owner notification permissions:', {
      ...updatePayload,
      token: token ? `${token.substring(0, 20)}...` : 'EMPTY (notifications disabled)',
      notificationsEnabled
    });
    
    const res = await axiosInstance.post('/api/notifications/', updatePayload, { headers });
    return res.data as NotificationResponse;
  } catch (error: any) {
    console.error('❌ Failed to update vehicle owner notification permissions:', error);
    throw error;
  }
}

export async function updateNotificationPermissions(payload: { permission1?: boolean; permission2?: boolean }): Promise<NotificationResponse> {
  const headers = await authService.getAuthHeaders();
  const res = await axiosInstance.patch('/api/notifications/permissions/', payload, { headers });
  return res.data as NotificationResponse;
}
