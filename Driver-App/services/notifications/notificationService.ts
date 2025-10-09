import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import messaging from '@react-native-firebase/messaging';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  private firebaseToken: string | null = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification service
  async initialize(): Promise<void> {
    try {
      console.log('🔔 Initializing notification service...');
      
      // Request permissions
      await this.requestPermissions();
      
      // Get push tokens
      await this.getPushToken();
      await this.getFirebaseToken();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      this.setupFirebaseListeners();
      
      console.log('✅ Notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  // Request notification permissions
  private async requestPermissions(): Promise<void> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('⚠️ Notification permissions not granted');
          return;
        }
        
        console.log('✅ Notification permissions granted');
      } else {
        console.log('📱 Running on simulator, skipping permission request');
      }
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
    }
  }

  // Get Expo push token
  private async getPushToken(): Promise<void> {
    try {
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'f317ef72-93ae-427b-a6fa-1bee22c3138c', // Your actual Expo project ID
        });
        
        this.expoPushToken = token.data;
        console.log('📱 Expo push token:', this.expoPushToken);
        
        // Store token securely
        await SecureStore.setItemAsync('expoPushToken', this.expoPushToken);
        
        // Send token to backend (you can implement this)
        await this.sendTokenToBackend(this.expoPushToken);
      }
    } catch (error) {
      console.error('❌ Error getting push token:', error);
    }
  }

  // Get Firebase device token
  private async getFirebaseToken(): Promise<void> {
    try {
      if (Device.isDevice) {
        // Request permission for Firebase messaging
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          this.firebaseToken = token;
          console.log('🔥 Firebase device token:', this.firebaseToken);
          
          // Store token securely
          await SecureStore.setItemAsync('firebaseToken', this.firebaseToken);
          
          // Send token to backend
          await this.sendFirebaseTokenToBackend(this.firebaseToken);
        } else {
          console.warn('⚠️ Firebase messaging permission not granted');
        }
      }
    } catch (error) {
      console.error('❌ Error getting Firebase token:', error);
    }
  }

  // Send token to backend
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      console.log('📤 Sending push token to backend:', token);
      
      // Import axios at the top of the file if not already imported
      const axiosDriver = (await import('@/app/api/axiosDriver')).default;
      
      // Send token to backend for remote notifications
      await axiosDriver.post('/api/users/driver/push-token', { 
        expo_push_token: token,
        device_type: Platform.OS,
        app_version: '1.0.0'
      });
      
      console.log('✅ Push token sent to backend successfully');
    } catch (error) {
      console.error('❌ Failed to send token to backend:', error);
      // Don't throw error - app should still work without backend token registration
    }
  }

  // Send Firebase token to backend
  private async sendFirebaseTokenToBackend(token: string): Promise<void> {
    try {
      console.log('📤 Sending Firebase token to backend:', token);
      
      // Import axios at the top of the file if not already imported
      const axiosDriver = (await import('@/app/api/axiosDriver')).default;
      
      // Send Firebase token to backend for remote notifications
      await axiosDriver.post('/api/users/driver/firebase-token', { 
        firebase_token: token,
        device_type: Platform.OS,
        app_version: '1.0.0'
      });
      
      console.log('✅ Firebase token sent to backend successfully');
    } catch (error) {
      console.error('❌ Failed to send Firebase token to backend:', error);
      // Don't throw error - app should still work without backend token registration
    }
  }

  // Set up notification listeners
  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 Notification received in foreground:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification response (when user taps notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification response received:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Set up Firebase listeners
  private setupFirebaseListeners(): void {
    // Handle Firebase messages when app is in foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('🔥 Firebase message received in foreground:', remoteMessage);
      this.handleFirebaseMessage(remoteMessage);
    });

    // Handle Firebase messages when app is in background/quit
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('🔥 Firebase notification opened app:', remoteMessage);
      this.handleFirebaseNotificationOpened(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('🔥 App opened from Firebase notification:', remoteMessage);
          this.handleFirebaseNotificationOpened(remoteMessage);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh(token => {
      console.log('🔥 Firebase token refreshed:', token);
      this.firebaseToken = token;
      SecureStore.setItemAsync('firebaseToken', token);
      this.sendFirebaseTokenToBackend(token);
    });
  }

  // Handle notification received
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;
    console.log('📱 Notification received:', { title, body, data });
    
    // You can add custom logic here for handling notifications
    // For example, updating UI, playing sounds, etc.
  }

  // Handle notification response (user tap)
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { title, body, data } = response.notification.request.content;
    console.log('👆 Notification tapped:', { title, body, data });
    
    // Handle navigation or other actions based on notification data
    if (data?.orderId) {
      // Navigate to order details or take appropriate action
      console.log('🚗 Navigating to order:', data.orderId);
    }
  }

  // Handle Firebase message received
  private handleFirebaseMessage(remoteMessage: any): void {
    console.log('🔥 Firebase message received:', remoteMessage);
    
    // You can show a local notification or update UI based on the message
    if (remoteMessage.notification) {
      const { title, body } = remoteMessage.notification;
      console.log('🔥 Firebase notification:', { title, body });
      
      // Handle the notification data
      if (remoteMessage.data) {
        console.log('🔥 Firebase data:', remoteMessage.data);
        // Process the data (e.g., navigate to specific screen)
      }
    }
  }

  // Handle Firebase notification opened
  private handleFirebaseNotificationOpened(remoteMessage: any): void {
    console.log('🔥 Firebase notification opened:', remoteMessage);
    
    // Handle navigation or other actions based on notification data
    if (remoteMessage.data?.orderId) {
      console.log('🚗 Navigating to order from Firebase:', remoteMessage.data.orderId);
      // Navigate to order details or take appropriate action
    }
  }

  // Send local notification
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          priority: notification.priority || 'high',
        },
        trigger: null, // Send immediately
      });
      
      console.log('✅ Local notification sent:', notification.title);
    } catch (error) {
      console.error('❌ Failed to send local notification:', error);
    }
  }

  // Send new order notification
  async sendNewOrderNotification(orderData: OrderNotificationData): Promise<void> {
    try {
      const notification: NotificationData = {
        title: '🚗 New Order Available!',
        body: `From ${orderData.pickup} to ${orderData.drop} • ₹${orderData.fare}`,
        data: orderData,
        sound: true,
        priority: 'high',
      };
      
      await this.sendLocalNotification(notification);
      console.log('✅ New order notification sent for order:', orderData.orderId);
    } catch (error) {
      console.error('❌ Failed to send new order notification:', error);
    }
  }

  // Send order assigned notification
  async sendOrderAssignedNotification(orderData: OrderNotificationData): Promise<void> {
    try {
      const notification: NotificationData = {
        title: '✅ Order Assigned!',
        body: `You have been assigned to ${orderData.customerName}'s trip`,
        data: orderData,
        sound: true,
        priority: 'normal',
      };
      
      await this.sendLocalNotification(notification);
      console.log('✅ Order assigned notification sent for order:', orderData.orderId);
    } catch (error) {
      console.error('❌ Failed to send order assigned notification:', error);
    }
  }

  // Send order completed notification
  async sendOrderCompletedNotification(orderData: OrderNotificationData): Promise<void> {
    try {
      const notification: NotificationData = {
        title: '🎉 Trip Completed!',
        body: `You've earned ₹${orderData.fare} for this trip`,
        data: orderData,
        sound: true,
        priority: 'normal',
      };
      
      await this.sendLocalNotification(notification);
      console.log('✅ Order completed notification sent for order:', orderData.orderId);
    } catch (error) {
      console.error('❌ Failed to send order completed notification:', error);
    }
  }

  // Get stored push token
  async getStoredPushToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('expoPushToken');
    } catch (error) {
      console.error('❌ Error getting stored push token:', error);
      return null;
    }
  }

  // Get stored Firebase token
  async getStoredFirebaseToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('firebaseToken');
    } catch (error) {
      console.error('❌ Error getting stored Firebase token:', error);
      return null;
    }
  }

  // Get current Firebase token
  async getCurrentFirebaseToken(): Promise<string | null> {
    try {
      if (Device.isDevice) {
        const token = await messaging().getToken();
        return token;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting current Firebase token:', error);
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

  // Get notification permissions status
  async getPermissionsStatus(): Promise<Notifications.NotificationPermissionsStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('❌ Error getting permissions status:', error);
      // Return a fallback object with a valid PermissionStatus type
      return { status: 'undetermined', granted: false, expires: 'never' } as Notifications.NotificationPermissionsStatus;
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const status = await this.getPermissionsStatus();
      return status.granted;
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
