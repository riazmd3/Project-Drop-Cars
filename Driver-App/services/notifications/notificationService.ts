import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// CRITICAL: Set notification handler ONLY ONCE at module level
console.log('🔔 Setting up SINGLE notification handler...');

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔 DRIVER APP: Foreground notification handler CALLED', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      state: 'FOREGROUND',
      timestamp: new Date().toISOString()
    });
    
    // THIS IS WHAT MAKES NOTIFICATIONS SHOW IN FOREGROUND
    return {
      shouldShowAlert: true,    // THIS SHOWS THE BANNER
      shouldPlaySound: true,    // THIS PLAYS SOUND
      shouldSetBadge: true,     // THIS SETS BADGE
      shouldShowBanner: true,   // THIS SHOWS BANNER
      shouldShowList: true,     // THIS SHOWS IN LIST
    };
  },
});

// Android channel setup
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    showBadge: true,
  });
}

console.log('✅ SINGLE notification handler configured');

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  priority?: 'default' | 'normal' | 'high';
}

export interface OrderNotificationData {
  orderId: string;
  pickup: string;
  drop: string;
  customerName: string;
  customerMobile: string;
  distance: number;
  fare: number;
  orderType: 'new' | 'assigned' | 'completed' | 'cancelled';
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private isInitialized = false;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔔 Notification service already initialized');
      return;
    }

    try {
      console.log('🔔 Initializing notification service (SIMPLE VERSION)...');

      // 1. Request permissions FIRST
      await this.requestPermissions();
      
      // 2. Get push token
      await this.getPushToken();

      // 3. Set up listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('✅ Notification service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  // REMOVED: setupNotificationHandler() - Handler is already set at module level

  private async requestPermissions(): Promise<void> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Running on simulator, notifications may not work');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📱 Current notification permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('📱 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.error('❌ Notification permissions NOT granted');
        return;
      }
      
      console.log('✅ Notification permissions granted');
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
    }
  }

  private async getPushToken(): Promise<void> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Simulator - skipping push token');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token.data;
      
      console.log('📱 Expo Push Token:', this.expoPushToken);
      await SecureStore.setItemAsync('expoPushToken', this.expoPushToken);

      // Try to save to backend
      try {
        const { upsertNotificationSettings } = await import('./notificationApi');
        await upsertNotificationSettings({ 
          permission1: true, 
          permission2: true, 
          token: this.expoPushToken 
        });
        console.log('✅ Token saved to backend');
      } catch (e) {
        console.warn('⚠️ Could not save token to backend:', e);
      }

    } catch (error) {
      console.error('❌ Error getting push token:', error);
    }
  }

  private setupNotificationListeners(): void {
    console.log('🔔 Setting up notification listeners...');
    
    // Listener for when notification is received
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 NOTIFICATION RECEIVED IN FOREGROUND:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      });
    });

    // Listener for when user taps notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 NOTIFICATION TAPPED:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data
      });
    });

    console.log('✅ Notification listeners set up');
  }

  // Handle backend notifications
  async handleBackendNotification(notificationData: any): Promise<void> {
    try {
      console.log('📱 Processing backend notification:', notificationData);
      
      // Extract notification content
      const { title, body, data, sound = true, priority = 'high' } = notificationData;
      
      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'New Notification',
          body: body || 'You have a new notification',
          data: data || {},
          sound: sound,
          priority: priority,
        },
        trigger: null, // Send immediately
      });
      
      console.log('✅ Backend notification processed successfully');
    } catch (error) {
      console.error('❌ Failed to process backend notification:', error);
    }
  }

  // Get current push token for backend
  async getCurrentPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Simulator - no push token available');
        return null;
      }

      // Try to get from storage first
      let token = await SecureStore.getItemAsync('expoPushToken');
      
      if (!token) {
        // Generate new token if not found
        const newToken = await Notifications.getExpoPushTokenAsync();
        token = newToken.data;
        await SecureStore.setItemAsync('expoPushToken', token);
        console.log('📱 Generated new push token');
      }
      
      return token;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  // Update notification settings on backend
  async updateNotificationSettings(permission1: boolean, permission2: boolean): Promise<void> {
    try {
      const token = await this.getCurrentPushToken();
      
      if (!token) {
        console.error('❌ No push token available for backend update');
        return;
      }

      const { upsertNotificationSettings } = await import('./notificationApi');
      await upsertNotificationSettings({ 
        permission1, 
        permission2, 
        token 
      });
      
      console.log('✅ Notification settings updated on backend');
    } catch (error) {
      console.error('❌ Failed to update notification settings:', error);
    }
  }

  // Debug notification setup
  async debugNotificationSetup(): Promise<void> {
    console.log('🔍 DEBUGGING NOTIFICATION SETUP...');
    
    // Check permissions
    const permissions = await Notifications.getPermissionsAsync();
    console.log('📱 Permissions:', permissions);
    
    // Check if device
    console.log('📱 Is real device:', Device.isDevice);
    
    // Check token
    const token = await this.getCurrentPushToken();
    console.log('📱 Push token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
    
    // Check backend settings
    try {
      const { getNotificationSettings } = await import('./notificationApi');
      const settings = await getNotificationSettings();
      console.log('📱 Backend settings:', settings);
    } catch (error) {
      console.log('📱 Backend settings error:', error);
    }
  }
}

// Export singleton
export const notificationService = NotificationService.getInstance();

// Backend notification functions
export const handleBackendNotification = async (notificationData: any): Promise<void> => {
  await notificationService.handleBackendNotification(notificationData);
};

export const getCurrentPushToken = async (): Promise<string | null> => {
  return await notificationService.getCurrentPushToken();
};

export const updateNotificationSettings = async (permission1: boolean, permission2: boolean): Promise<void> => {
  await notificationService.updateNotificationSettings(permission1, permission2);
};

export const debugNotificationSetup = async (): Promise<void> => {
  await notificationService.debugNotificationSetup();
};

// CRITICAL: Call this immediately when your app starts
export const initializeNotifications = async (): Promise<void> => {
  console.log('🚀 INITIALIZING NOTIFICATIONS ON APP START...');
  await notificationService.initialize();
};