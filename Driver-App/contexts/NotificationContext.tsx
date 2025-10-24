import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { notificationService, OrderNotificationData } from '@/services/notifications/notificationService';
import { getNotificationSettings, updateNotificationPermissions, upsertNotificationSettings, updateNotificationSettings } from '@/services/notifications/notificationApi';
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
        // Toggle state is determined by whether token exists (not empty)
        const hasToken = !!(remote.token && remote.token.trim() !== '');
        setNotificationsEnabled(hasToken);
        console.log('📱 Loaded notification settings from backend:', {
          permission1: remote.permission1,
          permission2: remote.permission2,
          hasToken: hasToken,
          tokenPreview: remote.token ? `${remote.token.substring(0, 20)}...` : 'EMPTY'
        });
      } else {
        // No remote settings, check local storage
        const stored = await SecureStore.getItemAsync('notificationsEnabled');
        if (stored !== null) {
          setNotificationsEnabled(JSON.parse(stored));
        } else {
          // Default to checking if we have a token
          const token = await SecureStore.getItemAsync('expoPushToken');
          setNotificationsEnabled(!!token);
        }
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
      
      // Always ensure notification service is initialized
      await notificationService.initialize();
      
      // Update backend with new permissions and token
      try {
        const res = await updateNotificationSettings({ 
          permission1: newStatus, 
          permission2: newStatus
        });
        setPermission1(!!res.permission1);
        setPermission2(!!res.permission2);
        console.log('✅ Backend notification settings updated:', { 
          permission1: res.permission1, 
          permission2: res.permission2,
          token: res.token ? `${res.token.substring(0, 20)}...` : 'EMPTY'
        });
      } catch (backendError) {
        console.warn('⚠️ Failed to update backend notification settings:', backendError);
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
