import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { useWallet } from '@/contexts/WalletContext';
import { fetchPendingOrders, PendingOrder } from '@/services/dashboardService';

export default function ConnectionTest() {
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard();
  const { balance } = useWallet();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  useEffect(() => {
    if (dashboardData && !dashboardLoading) {
      fetchPendingOrdersData();
    }
  }, [dashboardData, dashboardLoading]);

  const fetchPendingOrdersData = async () => {
    try {
      const orders = await fetchPendingOrders();
      setPendingOrders(orders);
    } catch (error) {
      console.error('❌ Failed to fetch pending orders in ConnectionTest:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Connection Test & Debug Info</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Auth Context</Text>
        <Text style={styles.label}>Loading: {authLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.label}>User ID: {user?.id || 'null'}</Text>
        <Text style={styles.label}>Full Name: {user?.fullName || 'null'}</Text>
        <Text style={styles.label}>Mobile: {user?.primaryMobile || 'null'}</Text>
        <Text style={styles.label}>Address: {user?.address || 'null'}</Text>
        <Text style={styles.label}>Languages: {user?.languages?.join(', ') || 'null'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Dashboard Context</Text>
        <Text style={styles.label}>Loading: {dashboardLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.label}>Error: {dashboardError || 'None'}</Text>
        <Text style={styles.label}>Dashboard Data: {dashboardData ? 'Loaded' : 'null'}</Text>
        {dashboardData && (
          <>
            <Text style={styles.label}>User ID: {dashboardData.user_info?.id || 'null'}</Text>
            <Text style={styles.label}>Full Name: {dashboardData.user_info?.full_name || 'null'}</Text>
            <Text style={styles.label}>Mobile: {dashboardData.user_info?.primary_number || 'null'}</Text>
            <Text style={styles.label}>Address: {dashboardData.user_info?.address || 'null'}</Text>
            <Text style={styles.label}>Wallet Balance: ₹{dashboardData.user_info?.wallet_balance || 0}</Text>
            <Text style={styles.label}>Aadhar: {dashboardData.user_info?.aadhar_number || 'null'}</Text>
            <Text style={styles.label}>Organization ID: {dashboardData.user_info?.organization_id || 'null'}</Text>
            <Text style={styles.label}>Actual Cars: {dashboardData.cars?.length || 0}</Text>
            <Text style={styles.label}>Actual Drivers: {dashboardData.drivers?.length || 0}</Text>
            <Text style={styles.label}>Summary - Total Cars: {dashboardData.summary?.total_cars || 0}</Text>
            <Text style={styles.label}>Summary - Total Drivers: {dashboardData.summary?.total_drivers || 0}</Text>
            <Text style={styles.label}>Summary - Wallet: ₹{dashboardData.summary?.wallet_balance || 0}</Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Pending Orders</Text>
        <Text style={styles.label}>Orders Count: {pendingOrders?.length || 0}</Text>
        {pendingOrders && pendingOrders.length > 0 && (
          <>
            <Text style={styles.label}>First Order ID: {pendingOrders[0]?.order_id || 'null'}</Text>
            <Text style={styles.label}>First Order Pickup: {pendingOrders[0]?.pickup_drop_location?.pickup || 'null'}</Text>
            <Text style={styles.label}>First Order Drop: {pendingOrders[0]?.pickup_drop_location?.drop || 'null'}</Text>
            <Text style={styles.label}>First Order Customer: {pendingOrders[0]?.customer_name || 'null'}</Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Wallet Context</Text>
        <Text style={styles.label}>Balance: ₹{balance || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Raw Data</Text>
        <Text style={styles.code}>
          {JSON.stringify({
            auth: { user, loading: authLoading },
            dashboard: { dashboardData, loading: dashboardLoading, error: dashboardError },
            wallet: { balance }
          }, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4,
    color: '#333',
  },
});


