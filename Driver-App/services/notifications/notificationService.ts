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
      console.log('✅ Token stored locally (will be sent via toggle button)');

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

  // SIMPLIFIED: Send notification
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      console.log('📱 Sending local notification:', notification.title);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          priority: notification.priority || 'high',
        },
        trigger: null,
      });
      
      console.log('✅ Local notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send local notification:', error);
    }
  }

  // Print all tokens for debugging
  async printAllTokens(): Promise<void> {
    try {
      console.log('🔍 PRINTING ALL NOTIFICATION TOKENS...');
      const storedToken = await SecureStore.getItemAsync('expoPushToken');
      console.log('📱 Stored token:', storedToken ? `${storedToken.substring(0, 20)}...` : 'NOT FOUND');
      const currentToken = await this.getCurrentPushToken();
      console.log('📱 Current token:', currentToken ? `${currentToken.substring(0, 20)}...` : 'NOT FOUND');
      const permissions = await Notifications.getPermissionsAsync();
      console.log('📱 Permissions:', permissions);
    } catch (error) {
      console.error('❌ Failed to print tokens:', error);
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      return permissions.granted;
    } catch (error) {
      console.error('❌ Failed to check notification status:', error);
      return false;
    }
  }

  // Get current push token
  async getCurrentPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Simulator - cannot get push token');
        return null;
      }
      const token = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token.data;
      await SecureStore.setItemAsync('expoPushToken', this.expoPushToken);
      console.log('📱 Generated and stored new push token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Failed to get current push token:', error);
      return null;
    }
  }

  // Force generate and store token
  async forceGenerateToken(): Promise<string | null> {
    try {
      console.log('🔄 Force generating new push token...');
      await this.requestPermissions();
      const token = await this.getCurrentPushToken();
      if (token) {
        console.log('✅ Force generated token successfully:', token);
      } else {
        console.error('❌ Failed to force generate token');
      }
      return token;
    } catch (error) {
      console.error('❌ Error force generating token:', error);
      return null;
    }
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }
}

// Export singleton
export const notificationService = NotificationService.getInstance();

// CRITICAL: Call this immediately when your app starts
export const initializeNotifications = async (): Promise<void> => {
  console.log('🚀 INITIALIZING NOTIFICATIONS ON APP START...');
  await notificationService.initialize();
};

// Force generate token
export const forceGenerateToken = async (): Promise<string | null> => {
  return await notificationService.forceGenerateToken();
};