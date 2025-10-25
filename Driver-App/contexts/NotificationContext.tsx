import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getNotificationSettings, updateNotificationSettings } from '@/services/notifications/notificationApi';

interface NotificationContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getNotificationStatus: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission1, setPermission1] = useState<boolean>(false);
  const [permission2, setPermission2] = useState<boolean>(false);

  // Load notification settings (VENDOR APP APPROACH)
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const remote = await getNotificationSettings();
      if (remote) {
        setPermission1(!!remote.permission1);
        setPermission2(!!remote.permission2);
        // Master is enabled if token exists
        const hasToken = !!(remote.token && remote.token.trim() !== '');
        setNotificationsEnabled(hasToken);
        console.log('📱 Loaded notification settings:', {
          permission1: remote.permission1,
          permission2: remote.permission2,
          hasToken: hasToken,
          tokenPreview: remote.token ? `${remote.token.substring(0, 20)}...` : 'EMPTY'
        });
      } else {
        // No settings exist yet
        setNotificationsEnabled(false);
        setPermission1(false);
        setPermission2(false);
      }
    } catch (error) {
      console.error('❌ Failed to load notification settings:', error);
      setNotificationsEnabled(false);
    }
  };

  const toggleNotifications = async () => {
    try {
      const newStatus = !notificationsEnabled;
      setNotificationsEnabled(newStatus);
      
      // Update backend with new permissions and token (VENDOR APP APPROACH)
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
        // Revert on error
        setNotificationsEnabled(!newStatus);
      }
      
      console.log('✅ Notifications toggled:', newStatus);
    } catch (error) {
      console.error('❌ Failed to toggle notifications:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Simple approach - no complex clearing needed
      console.log('📱 Notification clearing not implemented (vendor app approach)');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  };

  const getNotificationStatus = async (): Promise<boolean> => {
    return notificationsEnabled;
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