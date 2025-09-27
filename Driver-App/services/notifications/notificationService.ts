import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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
      
      // Get push token
      await this.getPushToken();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
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
          projectId: 'your-project-id', // Replace with your actual Expo project ID
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

  // Send token to backend
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // TODO: Implement API call to send token to your backend
      console.log('📤 Sending push token to backend:', token);
      
      // Example API call:
      // await axiosInstance.post('/api/users/driver/push-token', { token });
    } catch (error) {
      console.error('❌ Failed to send token to backend:', error);
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
  async getPermissionsStatus(): Promise<Notifications.PermissionStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('❌ Error getting permissions status:', error);
      return { status: 'undetermined', granted: false, expires: 'never' };
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

// Export types
export type { NotificationData, OrderNotificationData };
