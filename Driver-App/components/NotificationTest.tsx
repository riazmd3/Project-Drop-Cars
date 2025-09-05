import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, CheckCircle, XCircle, Car } from 'lucide-react-native';

export default function NotificationTest() {
  const { 
    notificationsEnabled, 
    toggleNotifications, 
    sendNewOrderNotification,
    sendOrderAssignedNotification,
    sendOrderCompletedNotification,
    clearAllNotifications 
  } = useNotifications();

  const testNewOrder = () => {
    sendNewOrderNotification({
      orderId: 'TEST001',
      pickup: 'Airport Terminal 1',
      drop: 'Downtown Mall',
      customerName: 'John Doe',
      customerMobile: '9876543210',
      distance: 25,
      fare: 500,
      orderType: 'new'
    });
    Alert.alert('Test', 'New order notification sent!');
  };

  const testOrderAssigned = () => {
    sendOrderAssignedNotification({
      orderId: 'TEST002',
      pickup: 'Central Station',
      drop: 'Tech Park',
      customerName: 'Jane Smith',
      customerMobile: '9876543211',
      distance: 15,
      fare: 300,
      orderType: 'assigned'
    });
    Alert.alert('Test', 'Order assigned notification sent!');
  };

  const testOrderCompleted = () => {
    sendOrderCompletedNotification({
      orderId: 'TEST003',
      pickup: 'Shopping Center',
      drop: 'Residential Area',
      customerName: 'Mike Johnson',
      customerMobile: '9876543212',
      distance: 8,
      fare: 200,
      orderType: 'completed'
    });
    Alert.alert('Test', 'Order completed notification sent!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Notification Test Panel</Text>
      
      <View style={styles.statusContainer}>
        <Bell color={notificationsEnabled ? '#10B981' : '#EF4444'} size={24} />
        <Text style={[styles.statusText, { color: notificationsEnabled ? '#10B981' : '#EF4444' }]}>
          {notificationsEnabled ? 'Notifications Enabled' : 'Notifications Disabled'}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.toggleButton, { backgroundColor: notificationsEnabled ? '#EF4444' : '#10B981' }]}
        onPress={toggleNotifications}
      >
        <Text style={styles.buttonText}>
          {notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
        </Text>
      </TouchableOpacity>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test Notifications</Text>
        
        <TouchableOpacity style={[styles.testButton, { backgroundColor: '#3B82F6' }]} onPress={testNewOrder}>
          <Car color="#FFFFFF" size={20} />
          <Text style={styles.testButtonText}>Test New Order</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.testButton, { backgroundColor: '#10B981' }]} onPress={testOrderAssigned}>
          <CheckCircle color="#FFFFFF" size={20} />
          <Text style={styles.testButtonText}>Test Order Assigned</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.testButton, { backgroundColor: '#F59E0B' }]} onPress={testOrderCompleted}>
          <CheckCircle color="#FFFFFF" size={20} />
          <Text style={styles.testButtonText}>Test Order Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.testButton, { backgroundColor: '#6B7280' }]} onPress={clearAllNotifications}>
          <XCircle color="#FFFFFF" size={20} />
          <Text style={styles.testButtonText}>Clear All Notifications</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instructions}>
        Use these buttons to test different types of notifications. 
        Make sure notifications are enabled in your device settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1F2937',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructions: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
