import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { notificationService, OrderNotificationData } from '@/services/notifications/notificationService';
import { getNotificationSettings, updateNotificationPermissions } from '@/services/notifications/notificationApi';
import * as SecureStore from 'expo-secure-store';

interface NotificationContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getNotificationStatus: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [permission1, setPermission1] = useState<boolean>(true);
  const [permission2, setPermission2] = useState<boolean>(true);

  // Initialize notification service and load settings
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      console.log('🔔 Starting notification initialization...');
      
      // Initialize notification service
      await notificationService.initialize();
      
      // Load notification settings from backend (fallback to local storage)
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
      const remote = await getNotificationSettings();
      if (remote) {
        setPermission1(!!remote.permission1);
        setPermission2(!!remote.permission2);
        setNotificationsEnabled(!!(remote.permission1 || remote.permission2));
      } else {
        const stored = await SecureStore.getItemAsync('notificationsEnabled');
        if (stored !== null) {
          setNotificationsEnabled(JSON.parse(stored));
        }
        const hasPermission = await notificationService.areNotificationsEnabled();
        setNotificationsEnabled(hasPermission);
      }
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

  // Dedicated setters for permission1 and permission2
  const setPermission = async (key: 'permission1' | 'permission2', value: boolean) => {
    try {
      const payload = key === 'permission1' ? { permission1: value } : { permission2: value };
      const res = await updateNotificationPermissions(payload);
      setPermission1(!!res.permission1);
      setPermission2(!!res.permission2);
      setNotificationsEnabled(!!(res.permission1 || res.permission2));
    } catch (error) {
      console.error('❌ Failed to update notification permission:', error);
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
