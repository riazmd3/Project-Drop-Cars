import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { notificationService, OrderNotificationData } from '@/services/notifications/notificationService';
import * as SecureStore from 'expo-secure-store';

interface NotificationContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  sendNewOrderNotification: (orderData: OrderNotificationData) => Promise<void>;
  sendOrderAssignedNotification: (orderData: OrderNotificationData) => Promise<void>;
  sendOrderCompletedNotification: (orderData: OrderNotificationData) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getNotificationStatus: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Initialize notification service and load settings
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      console.log('🔔 Starting notification initialization...');
      
      // Initialize notification service
      await notificationService.initialize();
      
      // Load notification settings from storage
      await loadNotificationSettings();
      
      // Print all tokens for debugging
      await notificationService.printAllTokens();
      
      console.log('✅ Notification context initialized');
    } catch (error) {
      console.error('❌ Failed to initialize notification context:', error);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const stored = await SecureStore.getItemAsync('notificationsEnabled');
      if (stored !== null) {
        setNotificationsEnabled(JSON.parse(stored));
      }
      
      // Check actual notification permissions
      const hasPermission = await notificationService.areNotificationsEnabled();
      setNotificationsEnabled(hasPermission);
    } catch (error) {
      console.error('❌ Failed to load notification settings:', error);
    }
  };

  const toggleNotifications = async () => {
    try {
      const newStatus = !notificationsEnabled;
      setNotificationsEnabled(newStatus);
      
      // Save to storage
      await SecureStore.setItemAsync('notificationsEnabled', JSON.stringify(newStatus));
      
      if (newStatus) {
        // Re-request permissions if enabling
        await notificationService.initialize();
      }
      
      console.log('✅ Notifications toggled:', newStatus);
    } catch (error) {
      console.error('❌ Failed to toggle notifications:', error);
    }
  };

  const sendNewOrderNotification = async (orderData: OrderNotificationData) => {
    if (!notificationsEnabled) {
      console.log('🔕 Notifications disabled, skipping new order notification');
      return;
    }
    
    try {
      await notificationService.sendNewOrderNotification(orderData);
    } catch (error) {
      console.error('❌ Failed to send new order notification:', error);
    }
  };

  const sendOrderAssignedNotification = async (orderData: OrderNotificationData) => {
    if (!notificationsEnabled) {
      console.log('🔕 Notifications disabled, skipping order assigned notification');
      return;
    }
    
    try {
      await notificationService.sendOrderAssignedNotification(orderData);
    } catch (error) {
      console.error('❌ Failed to send order assigned notification:', error);
    }
  };

  const sendOrderCompletedNotification = async (orderData: OrderNotificationData) => {
    if (!notificationsEnabled) {
      console.log('🔕 Notifications disabled, skipping order completed notification');
      return;
    }
    
    try {
      await notificationService.sendOrderCompletedNotification(orderData);
    } catch (error) {
      console.error('❌ Failed to send order completed notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  };

  const getNotificationStatus = async (): Promise<boolean> => {
    try {
      const status = await notificationService.areNotificationsEnabled();
      setNotificationsEnabled(status);
      return status;
    } catch (error) {
      console.error('❌ Failed to get notification status:', error);
      return false;
    }
  };

  return (
    <NotificationContext.Provider value={{
      notificationsEnabled,
      toggleNotifications,
      sendNewOrderNotification,
      sendOrderAssignedNotification,
      sendOrderCompletedNotification,
      clearAllNotifications,
      getNotificationStatus,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
