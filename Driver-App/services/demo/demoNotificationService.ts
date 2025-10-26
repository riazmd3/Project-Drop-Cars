import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

export interface DemoNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  delay?: number;
}

export class DemoNotificationService {
  private static instance: DemoNotificationService;
  private demoNotifications: DemoNotification[] = [];

  private constructor() {
    this.setupDemoNotifications();
  }

  public static getInstance(): DemoNotificationService {
    if (!DemoNotificationService.instance) {
      DemoNotificationService.instance = new DemoNotificationService();
    }
    return DemoNotificationService.instance;
  }

  private setupDemoNotifications() {
    this.demoNotifications = [
      {
        id: 'demo_welcome',
        title: '🎉 Welcome to Drop Cars!',
        body: 'Your account is ready. Start exploring the app!',
        data: { type: 'welcome', demo: true },
        delay: 2000
      },
      {
        id: 'demo_booking',
        title: '📋 New Booking Available',
        body: 'A new trip request is waiting for you. Tap to view details.',
        data: { type: 'booking', demo: true },
        delay: 5000
      },
      {
        id: 'demo_payment',
        title: '💰 Payment Received',
        body: '₹1,500 has been added to your wallet from your last trip.',
        data: { type: 'payment', demo: true },
        delay: 8000
      },
      {
        id: 'demo_reminder',
        title: '⏰ Trip Reminder',
        body: 'Your scheduled trip starts in 30 minutes. Please be ready!',
        data: { type: 'reminder', demo: true },
        delay: 11000
      }
    ];
  }

  public async startDemoNotifications(): Promise<void> {
    console.log('🎭 Starting demo notifications...');
    
    for (const notification of this.demoNotifications) {
      setTimeout(() => {
        this.sendDemoNotification(notification);
      }, notification.delay || 0);
    }
  }

  private async sendDemoNotification(notification: DemoNotification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
        },
        trigger: null, // Send immediately
      });
      
      console.log(`🎭 Demo notification sent: ${notification.title}`);
    } catch (error) {
      console.error('❌ Error sending demo notification:', error);
    }
  }

  public async simulateRealNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, demo: true },
        },
        trigger: null,
      });
      
      console.log(`🎭 Simulated notification: ${title}`);
    } catch (error) {
      console.error('❌ Error simulating notification:', error);
    }
  }

  public getDemoNotifications(): DemoNotification[] {
    return this.demoNotifications;
  }
}

export const demoNotificationService = DemoNotificationService.getInstance();
