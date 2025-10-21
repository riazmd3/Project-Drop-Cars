import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { 
  getNotificationSettings, 
  updateNotificationPermissions,
  upsertNotificationSettings,
  NotificationSettings 
} from '@/services/notifications';

interface NotificationContextType {
  notificationsEnabled: boolean;
  permission1: boolean;
  permission2: boolean;
  toggleNotifications: () => Promise<void>;
  setPermission1: (value: boolean) => Promise<void>;
  setPermission2: (value: boolean) => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [permission1, setPermission1State] = useState(true); // Priority Alerts
  const [permission2, setPermission2State] = useState(true); // General Alerts
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      const settings = await getNotificationSettings();
      if (settings) {
        setPermission1State(!!settings.permission1);
        setPermission2State(!!settings.permission2);
        setNotificationsEnabled(!!(settings.permission1 || settings.permission2));
        console.log('✅ Notification settings loaded:', settings);
      } else {
        console.log('ℹ️ No notification settings found, using defaults');
      }
    } catch (error) {
      console.error('❌ Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPermission = async (key: 'permission1' | 'permission2', value: boolean) => {
    try {
      setLoading(true);
      const payload = key === 'permission1' ? { permission1: value } : { permission2: value };
      const res = await updateNotificationPermissions(payload);
      setPermission1State(!!res.permission1);
      setPermission2State(!!res.permission2);
      setNotificationsEnabled(!!(res.permission1 || res.permission2));
      console.log(`✅ Permission ${key} updated to ${value}`);
    } catch (error: any) {
      console.error(`❌ Failed to update permission ${key}:`, error);
      Alert.alert('Error', `Failed to update notification setting: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    try {
      setLoading(true);
      const newStatus = !notificationsEnabled;
      // This master toggle will set both permissions to the new status
      const res = await updateNotificationPermissions({ 
        permission1: newStatus, 
        permission2: newStatus 
      });
      setPermission1State(!!res.permission1);
      setPermission2State(!!res.permission2);
      setNotificationsEnabled(!!(res.permission1 || res.permission2));
      console.log('✅ Notifications master toggled:', newStatus);
    } catch (error: any) {
      console.error('❌ Failed to toggle notifications:', error);
      Alert.alert('Error', `Failed to toggle notifications: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notificationsEnabled,
      permission1,
      permission2,
      toggleNotifications,
      setPermission1: (value) => setPermission('permission1', value),
      setPermission2: (value) => setPermission('permission2', value),
      loading,
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
