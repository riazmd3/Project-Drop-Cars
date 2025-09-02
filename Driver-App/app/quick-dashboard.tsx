import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { MapPin, User, Phone, Car, ArrowRight, LogOut } from 'lucide-react-native';
import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';
import { fetchAssignmentsForDriver } from '@/services/assignmentService';
import { setDriverOnline, setDriverOffline } from '@/services/carDriverService';

export default function QuickDashboardScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [tripStarted, setTripStarted] = useState(false);
  const [driverStatus, setDriverStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [driverOrders, setDriverOrders] = useState<any[]>([]);

  // Fetch assignments for this driver and resolve order details
  useEffect(() => {
    const loadAssignments = async () => {
      if (!user?.id) return;
      try {
        setOrdersLoading(true);
        const assignments = await fetchAssignmentsForDriver(user.id);
        const authHeaders = await getAuthHeaders();
        const detailedOrders: any[] = [];
        for (const a of assignments) {
          try {
            const res = await axiosInstance.get(`/api/orders/${a.order_id}`, { headers: authHeaders });
            if (res.data) {
              detailedOrders.push({ ...res.data, assignment_id: a.id, assignment_status: a.status });
            }
          } catch {}
        }
        setDriverOrders(detailedOrders);
      } finally {
        setOrdersLoading(false);
      }
    };
    loadAssignments();
  }, [user?.id]);

  // Sort by scheduled date/time ascending and pick the next one
  const nextAssignedOrder = useMemo(() => {
    if (!driverOrders || driverOrders.length === 0) return null;
    const sorted = [...driverOrders].sort((a, b) => {
      const da = new Date(a.scheduled_at || a.created_at || 0).getTime();
      const db = new Date(b.scheduled_at || b.created_at || 0).getTime();
      return da - db;
    });
    const now = new Date();
    const upcoming = sorted.find(o => new Date(o.scheduled_at || o.created_at || 0) >= now) || sorted[0];
    return upcoming;
  }, [driverOrders]);

  const handleStartTrip = () => {
    setTripStarted(true);
    if (!nextAssignedOrder) return;
    const farePerKm = nextAssignedOrder.cost_per_km || nextAssignedOrder.fare_per_km || 0;
    router.push({
      pathname: '/trip/start',
      params: {
        orderId: String(nextAssignedOrder.order_id || nextAssignedOrder.booking_id || ''),
        farePerKm: String(farePerKm)
      }
    });
  };

  const toggleStatus = async () => {
    if (!user?.id) return;
    try {
      if (driverStatus === 'OFFLINE') {
        const res = await setDriverOnline(user.id);
        if (res?.status === 'online' || res?.success) setDriverStatus('ONLINE');
      } else {
        const res = await setDriverOffline(user.id);
        if (res?.status === 'offline' || res?.success) setDriverStatus('OFFLINE');
      }
    } catch (e: any) {
      Alert.alert('Status Update Failed', e.message || 'Please try again');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    welcomeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    welcomeText: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    quickDriverText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    orderCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    orderTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    routeContainer: {
      marginBottom: 16,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    routeText: {
      marginLeft: 12,
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    routeLine: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginLeft: 8,
      marginVertical: 4,
    },
    customerInfo: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    customerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    customerText: {
      marginLeft: 12,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    fareInfo: {
      backgroundColor: '#D1FAE5',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    fareText: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: '#065F46',
    },
    startButton: {
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    startButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      marginRight: 8,
    },
    logoutButton: {
      padding: 8,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <Text style={dynamicStyles.headerTitle}>Quick Driver Dashboard</Text>
          <Text style={dynamicStyles.headerSubtitle}>Welcome back, {user?.name}!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={dynamicStyles.logoutButton}>
          <LogOut color={colors.error} size={24} />
        </TouchableOpacity>
      </View>

      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.welcomeCard}>
          <Text style={dynamicStyles.welcomeText}>Welcome, {user?.fullName || user?.name}</Text>
          <Text style={dynamicStyles.quickDriverText}>Quick Driver Mode</Text>
        </View>

        {nextAssignedOrder && (
          <View style={dynamicStyles.orderCard}>
            <Text style={dynamicStyles.orderTitle}>Assigned Trip #{nextAssignedOrder.order_id || nextAssignedOrder.booking_id}</Text>
            
            <View style={dynamicStyles.routeContainer}>
              <View style={dynamicStyles.routeRow}>
                <MapPin color={colors.success} size={16} />
                <Text style={dynamicStyles.routeText}>{nextAssignedOrder.pickup_drop_location?.pickup || nextAssignedOrder.pickup}</Text>
              </View>
              <View style={dynamicStyles.routeLine} />
              <View style={dynamicStyles.routeRow}>
                <MapPin color={colors.error} size={16} />
                <Text style={dynamicStyles.routeText}>{nextAssignedOrder.pickup_drop_location?.drop || nextAssignedOrder.drop}</Text>
              </View>
            </View>

            <View style={dynamicStyles.customerInfo}>
              <View style={dynamicStyles.customerRow}>
                <User color={colors.textSecondary} size={16} />
                <Text style={dynamicStyles.customerText}>{nextAssignedOrder.customer_name}</Text>
              </View>
              <View style={dynamicStyles.customerRow}>
                <Phone color={colors.textSecondary} size={16} />
                <Text style={dynamicStyles.customerText}>{nextAssignedOrder.customer_number || nextAssignedOrder.customer_mobile}</Text>
              </View>
              <View style={dynamicStyles.customerRow}>
                <Car color={colors.textSecondary} size={16} />
                <Text style={dynamicStyles.customerText}>
                  {(nextAssignedOrder.trip_distance || nextAssignedOrder.distance_km)} km • ₹{(nextAssignedOrder.cost_per_km || nextAssignedOrder.fare_per_km)}/km
                </Text>
              </View>
            </View>

            <View style={dynamicStyles.fareInfo}>
              <Text style={dynamicStyles.fareText}>₹{nextAssignedOrder.total_fare || ((nextAssignedOrder.cost_per_km || 0) * (nextAssignedOrder.trip_distance || 0))}</Text>
            </View>

            <TouchableOpacity style={dynamicStyles.startButton} onPress={handleStartTrip}>
              <Text style={dynamicStyles.startButtonText}>Start Trip</Text>
              <ArrowRight color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        )}

        {!nextAssignedOrder && !ordersLoading && (
          <Text style={{ color: colors.textSecondary }}>No assigned trips yet.</Text>
        )}

        {/* Status toggle at bottom */}
        <View style={{ marginTop: 'auto', paddingVertical: 16 }}>
          <TouchableOpacity
            onPress={toggleStatus}
            style={{
              backgroundColor: driverStatus === 'ONLINE' ? colors.success : colors.surface,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: driverStatus === 'ONLINE' ? colors.success : colors.border,
            }}
          >
            <Text style={{ color: driverStatus === 'ONLINE' ? '#FFFFFF' : colors.text }}>
              Driver Status: {driverStatus} (tap to toggle)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}