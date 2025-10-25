import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// CRITICAL: Set notification handler ONLY ONCE at module level
console.log('🔔 Setting up SINGLE notification handler...');

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🔔🔔🔔 NOTIFICATION HANDLER CALLED 🔔🔔🔔');
    console.log('📱 Notification details:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      identifier: notification.request.identifier,
      state: 'FOREGROUND',
      timestamp: new Date().toISOString()
    });
    
    // CRITICAL: This is what makes notifications show when app is open
    const result = {
      shouldShowAlert: true,    // Shows the notification banner
      shouldPlaySound: true,    // Plays notification sound
      shouldSetBadge: true,     // Updates app badge
      shouldShowBanner: true,   // Shows banner
      shouldShowList: true,     // Shows in notification list
    };
    
    console.log('🔔 Handler returning:', result);
    return result;
  },
});

// Android channel setup
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default Notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    showBadge: true,
    enableLights: true,
    enableVibrate: true,
    bypassDnd: true,
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
  private notificationListeners: Notifications.Subscription[] = [];

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
      console.log('🔔 Initializing notification service (NO AUTO TOKEN)...');

      // 1. Configure notifications first
      await this.configureNotifications();

      // 2. Request permissions
      await this.requestPermissions();
      
      // 3. REMOVED: Automatic token generation - only generate when user toggles
      // await this.getPushToken();

      // 4. Set up listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('✅ Notification service initialized (no auto token)');

    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  private async configureNotifications(): Promise<void> {
    try {
      console.log('🔔 Configuring notification behavior...');
      
      // Set the notification categories and behavior
      await Notifications.setNotificationCategoryAsync('default', [
        {
          identifier: 'view',
          buttonTitle: 'View',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: {
            isDestructive: true,
          },
        },
      ]);

      // Configure how notifications are presented when app is foregrounded
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('default', [
          {
            identifier: 'default_actions',
            buttonTitle: 'Options',
            options: {
              opensAppToForeground: true,
            },
          },
        ]);
      }

      console.log('✅ Notification behavior configured');
    } catch (error) {
      console.error('❌ Error configuring notifications:', error);
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
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
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

      // Use the new method for Expo Go and development builds
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '31f4ffee-37b4-4db6-a102-1cd99bd74f8e' // Actual project ID from app.json
      });
        
        this.expoPushToken = token.data;
        
      console.log('📱 Expo Push Token:', this.expoPushToken);
        await SecureStore.setItemAsync('expoPushToken', this.expoPushToken);
      console.log('✅ Token stored locally (will be sent via toggle button)');

    } catch (error) {
      console.error('❌ Error getting push token:', error);
      // Try without explicit project ID as fallback
      try {
        console.log('📱 Retrying without explicit project ID...');
        const fallbackToken = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = fallbackToken.data;
        console.log('📱 Expo Push Token (fallback):', this.expoPushToken);
        await SecureStore.setItemAsync('expoPushToken', this.expoPushToken);
        console.log('✅ Fallback token stored successfully');
      } catch (fallbackError) {
        console.error('❌ Fallback token generation also failed:', fallbackError);
      }
    }
  }

  private setupNotificationListeners(): void {
    console.log('🔔 Setting up notification listeners...');
    
    // Remove any existing listeners first
    this.removeNotificationListeners();
    
    // SINGLE listener for when notification is received in foreground
    const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 NOTIFICATION RECEIVED IN FOREGROUND:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
        identifier: notification.request.identifier,
        timestamp: new Date().toISOString()
      });
      
      // You can add custom handling here for foreground notifications
      this.handleForegroundNotification(notification);
    });

    // Listener for when user taps notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 NOTIFICATION TAPPED:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data,
        actionIdentifier: response.actionIdentifier,
        timestamp: new Date().toISOString()
      });
      
      this.handleNotificationResponse(response);
    });

    // Store listeners for cleanup
    this.notificationListeners.push(receivedListener);
    this.notificationListeners.push(responseListener);

    console.log('✅ Notification listeners set up');
  }

  private handleForegroundNotification(notification: Notifications.Notification): void {
    try {
      console.log('🎯 Handling foreground notification:', notification.request.identifier);
      
      // You can add custom logic here for handling foreground notifications
      // For example, update UI, show custom in-app banner, etc.
      
    const { title, body, data } = notification.request.content;
      
      // Example: Show custom in-app notification
      this.showInAppNotification(title || '', body || '', data);
    
    } catch (error) {
      console.error('❌ Error handling foreground notification:', error);
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    try {
      console.log('🎯 Handling notification response');
      
      const { notification, actionIdentifier } = response;
      const { data } = notification.request.content;
      
      // Handle different action types
      switch (actionIdentifier) {
        case 'view':
          console.log('👀 View action triggered');
          // Navigate to relevant screen
          break;
        case 'dismiss':
          console.log('❌ Dismiss action triggered');
          // Handle dismiss action
          break;
        default:
          console.log('🔘 Default notification tap');
          // Handle default tap behavior
          break;
      }
      
      // You can add navigation logic here based on the notification data
      if (data?.screen) {
        console.log('🧭 Navigating to screen:', data.screen);
        // navigation.navigate(data.screen, data.params);
      }
      
    } catch (error) {
      console.error('❌ Error handling notification response:', error);
    }
  }

  private showInAppNotification(title: string, body: string, data: any): void {
    // This is where you can show a custom in-app notification component
    // instead of or in addition to the system notification
    
    console.log('📱 Showing in-app notification:', {
      title,
      body,
      data
    });
    
    // Example: You could use a state management solution to show a custom banner
    // notificationStore.showBanner({ title, body, data });
  }

  // SIMPLIFIED: Send notification
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      console.log('📱 Sending local notification:', notification.title);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          priority: notification.priority || 'high',
          // Additional iOS specific options
          ...(Platform.OS === 'ios' && {
            subtitle: notification.data?.subtitle || '',
            badge: 1,
            launchImageName: 'default',
          }),
          // Additional Android specific options
          ...(Platform.OS === 'android' && {
            vibrate: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            autoDismiss: true,
          }),
        },
        trigger: null, // Send immediately
      });
      
      console.log('✅ Local notification sent successfully with ID:', notificationId);
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
      
      // Additional debug info
      const channels = await Notifications.getNotificationChannelsAsync();
      console.log('📱 Available channels:', channels);
      
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
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '31f4ffee-37b4-4db6-a102-1cd99bd74f8e' // Actual project ID from app.json
      });
      this.expoPushToken = token.data;
      await SecureStore.setItemAsync('expoPushToken', this.expoPushToken);
      console.log('📱 Generated and stored new push token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Failed to get current push token:', error);
      // Try without explicit project ID as fallback
      try {
        console.log('📱 Retrying getCurrentPushToken without explicit project ID...');
        const fallbackToken = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = fallbackToken.data;
        await SecureStore.setItemAsync('expoPushToken', this.expoPushToken);
        console.log('📱 Generated and stored fallback push token:', this.expoPushToken);
        return this.expoPushToken;
      } catch (fallbackError) {
        console.error('❌ Fallback getCurrentPushToken also failed:', fallbackError);
      return null;
    }
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
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }

  // Test foreground notification
  async testForegroundNotification(): Promise<void> {
    try {
      console.log('🧪 Testing foreground notification...');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 FOREGROUND TEST',
          body: 'This notification should appear when app is open!',
          data: { 
            test: true, 
            timestamp: Date.now(),
            screen: 'TestScreen'
          },
          sound: true,
          priority: 'high',
          // iOS specific
          ...(Platform.OS === 'ios' && {
            subtitle: 'Test Subtitle',
            badge: 1,
          }),
          // Android specific
          ...(Platform.OS === 'android' && {
            vibrate: [0, 250, 250, 250],
          }),
        },
        trigger: null, // Send immediately
      });
      
      console.log('✅ Foreground test notification sent with ID:', notificationId);
    } catch (error) {
      console.error('❌ Failed to send foreground test notification:', error);
    }
  }

  // Check if notification handler is properly set up
  async checkNotificationSetup(): Promise<void> {
    try {
      console.log('🔍 Checking notification setup...');
      
      // Check permissions
      const permissions = await Notifications.getPermissionsAsync();
      console.log('📱 Permissions:', permissions);
      
      // Check if we have a token
      const token = await this.getCurrentPushToken();
      console.log('📱 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      // Check Android channels
      if (Platform.OS === 'android') {
        const channels = await Notifications.getNotificationChannelsAsync();
        console.log('📱 Android channels:', channels);
      }
      
      // Test if handler is working
      console.log('🧪 Sending test notification to check handler...');
      await this.testForegroundNotification();
      
    } catch (error) {
      console.error('❌ Failed to check notification setup:', error);
    }
  }

  // Clean up listeners
  removeNotificationListeners(): void {
    console.log('🧹 Removing notification listeners...');
    this.notificationListeners.forEach(listener => {
      listener.remove();
    });
    this.notificationListeners = [];
    console.log('✅ Notification listeners removed');
  }

  // Get notification settings
  async getNotificationSettings(): Promise<any> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      const channels = await Notifications.getNotificationChannelsAsync();
      
      return {
        permissions: settings,
        channels: channels,
        token: this.expoPushToken,
        isInitialized: this.isInitialized,
      };
    } catch (error) {
      console.error('❌ Failed to get notification settings:', error);
      return null;
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

// Test foreground notification
export const testForegroundNotification = async (): Promise<void> => {
  return await notificationService.testForegroundNotification();
};

// Check notification setup
export const checkNotificationSetup = async (): Promise<void> => {
  return await notificationService.checkNotificationSetup();
};

// Clean up notifications
export const cleanupNotifications = async (): Promise<void> => {
  await notificationService.clearAllNotifications();
};

// Get notification settings for debugging
export const getNotificationSettings = async (): Promise<any> => {
  return await notificationService.getNotificationSettings();
};