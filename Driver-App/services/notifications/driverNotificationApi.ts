import axiosDriver from '@/app/api/axiosDriver';

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
  // Try PATCH first, if it fails, fall back to POST
  try {
    const response = await axiosDriver.patch('/api/notifications/permissions/', payload);
    return response.data as NotificationResponse;
  } catch (error: any) {
    if (error?.response?.status === 405) {
      // If PATCH is not allowed, try POST to the main endpoint
      console.log('⚠️ PATCH not supported, trying POST to main endpoint');
      const response = await axiosDriver.post('/api/notifications/', payload);
      return response.data as NotificationResponse;
    }
    throw error;
  }
}
