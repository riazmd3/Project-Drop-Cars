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
import { MapPin, User, Phone, Car, ArrowRight, LogOut, RefreshCw } from 'lucide-react-native';
import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';
import { fetchAssignmentsForDriver, getVehicleOwnerAssignments } from '@/services/assignmentService';
import { setDriverOnline, setDriverOffline } from '@/services/carDriverService';

export default function QuickDashboardScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [tripStarted, setTripStarted] = useState(false);
  const [driverStatus, setDriverStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [driverOrders, setDriverOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch current driver status and assignments
  const loadDriverData = async () => {
    if (!user?.id) return;
    try {
      setOrdersLoading(true);
        
        // Fetch current driver status
        try {
          const authHeaders = await getAuthHeaders();
          const driverResponse = await axiosInstance.get(`/api/users/cardriver/${user.id}`, { 
            headers: authHeaders 
          });
          if (driverResponse.data?.driver_status) {
            const status = driverResponse.data.driver_status.toUpperCase();
            if (status === 'ONLINE' || status === 'OFFLINE') {
              setDriverStatus(status);
              console.log('🔍 Current driver status:', status);
            }
          }
        } catch (statusError) {
          console.log('⚠️ Could not fetch driver status, using default OFFLINE');
        }
        
        // Fetch assignments using multiple methods
        console.log('🔍 Fetching assignments for driver:', user.id);
        
        let assignments: any[] = [];
        
        // Method 1: Try driver-specific assignments
        try {
          assignments = await fetchAssignmentsForDriver(user.id);
          console.log('📋 Driver assignments received:', assignments);
        } catch (driverError) {
          console.log('⚠️ Driver assignments failed, trying vehicle owner assignments...');
        }
        
        // Method 2: If no driver assignments, try vehicle owner assignments
        if (assignments.length === 0 && user?.id) {
          try {
            const vehicleOwnerAssignments = await getVehicleOwnerAssignments(user.id);
            console.log('📋 Vehicle owner assignments received:', vehicleOwnerAssignments);
            
            // Filter assignments for this specific driver
            assignments = vehicleOwnerAssignments.filter(assignment => 
              assignment.driver_id === user.id
            );
            console.log('📋 Filtered assignments for driver:', assignments);
          } catch (vehicleOwnerError) {
            console.error('❌ Vehicle owner assignments failed:', vehicleOwnerError);
          }
        }
        
        const authHeaders = await getAuthHeaders();
        const detailedOrders: any[] = [];
        for (const a of assignments) {
          try {
            console.log('🔍 Fetching order details for assignment:', a.order_id);
            const res = await axiosInstance.get(`/api/orders/${a.order_id}`, { headers: authHeaders });
            if (res.data) {
              console.log('✅ Order details fetched:', res.data);
              detailedOrders.push({ 
                ...res.data, 
                assignment_id: a.id, 
                assignment_status: a.assignment_status || a.status 
              });
            }
          } catch (orderError) {
            console.error('❌ Failed to fetch order details:', orderError);
          }
        }
        console.log('📋 Final detailed orders:', detailedOrders);
        setDriverOrders(detailedOrders);
      } finally {
        setOrdersLoading(false);
      }
    };

  useEffect(() => {
    loadDriverData();
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDriverData();
    setRefreshing(false);
  };

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
        // Try to set driver online
        const res = await setDriverOnline(user.id);
        console.log('🟢 Online response:', res);
        
        // Check if the API call was successful
        if (res?.success || res?.status === 'online' || res?.message?.includes('success')) {
          setDriverStatus('ONLINE');
        } else if (res?.message?.includes('already') || res?.message?.includes('Current status: ONLINE')) {
          // Driver is already online, update local state
          setDriverStatus('ONLINE');
        }
      } else {
        // Try to set driver offline
        const res = await setDriverOffline(user.id);
        console.log('🔴 Offline response:', res);
        
        // Check if the API call was successful
        if (res?.success || res?.status === 'offline' || res?.message?.includes('success')) {
          setDriverStatus('OFFLINE');
        } else if (res?.message?.includes('already') || res?.message?.includes('Current status: OFFLINE')) {
          // Driver is already offline, update local state
          setDriverStatus('OFFLINE');
        }
      }
    } catch (e: any) {
      console.error('❌ Status toggle error:', e);
      // Check if it's a "already in that status" error
      if (e.message?.includes('already') || e.message?.includes('Current status')) {
        // Update local state to match the current status
        if (e.message?.includes('ONLINE')) {
          setDriverStatus('ONLINE');
        } else if (e.message?.includes('OFFLINE')) {
          setDriverStatus('OFFLINE');
        }
      } else {
        Alert.alert('Status Update Failed', e.message || 'Please try again');
      }
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    refreshButton: {
      padding: 8,
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
    noOrdersContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginBottom: 24,
    },
    noOrdersText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 8,
    },
    noOrdersSubtext: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 16,
    },
    refreshButtonSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
    },
    refreshButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <Text style={dynamicStyles.headerTitle}>Quick Driver Dashboard</Text>
          <Text style={dynamicStyles.headerSubtitle}>
            Welcome back, {user?.fullName || 'Driver'}!
          </Text>
        </View>
        <View style={dynamicStyles.headerActions}>
          <TouchableOpacity onPress={handleRefresh} style={dynamicStyles.refreshButton}>
            <RefreshCw color={colors.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={dynamicStyles.logoutButton}>
            <LogOut color={colors.error} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.welcomeCard}>
          <Text style={dynamicStyles.welcomeText}>Welcome, {user?.fullName || 'Driver'}</Text>
          <Text style={dynamicStyles.quickDriverText}>Quick Driver Mode</Text>
        </View>

        {nextAssignedOrder && (
          <View style={dynamicStyles.orderCard}>
            <Text style={dynamicStyles.orderTitle}>Assigned Trip #{nextAssignedOrder.order_id || nextAssignedOrder.booking_id}</Text>
            
            <View style={dynamicStyles.routeContainer}>
              <View style={dynamicStyles.routeRow}>
                <MapPin color={colors.success} size={16} />
                <Text style={dynamicStyles.routeText}>
                  {nextAssignedOrder.pickup_drop_location?.['0'] || 
                   nextAssignedOrder.pickup_drop_location?.pickup || 
                   nextAssignedOrder.pickup || 'Unknown'}
                </Text>
              </View>
              <View style={dynamicStyles.routeLine} />
              <View style={dynamicStyles.routeRow}>
                <MapPin color={colors.error} size={16} />
                <Text style={dynamicStyles.routeText}>
                  {nextAssignedOrder.pickup_drop_location?.['1'] || 
                   nextAssignedOrder.pickup_drop_location?.drop || 
                   nextAssignedOrder.drop || 'Unknown'}
                </Text>
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
          <View style={dynamicStyles.noOrdersContainer}>
            <Text style={dynamicStyles.noOrdersText}>No assigned trips yet.</Text>
            <Text style={dynamicStyles.noOrdersSubtext}>
              Total assignments found: {driverOrders.length}
            </Text>
            <TouchableOpacity onPress={handleRefresh} style={dynamicStyles.refreshButtonSmall}>
              <RefreshCw color={colors.primary} size={16} />
              <Text style={dynamicStyles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status toggle at bottom */}
        <View style={{ marginTop: 'auto', paddingVertical: 16 }}>
          <TouchableOpacity
            onPress={toggleStatus}
            style={{
              backgroundColor: driverStatus === 'ONLINE' ? '#10B981' : '#EF4444', // Green for ONLINE, Red for OFFLINE
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: driverStatus === 'ONLINE' ? '#10B981' : '#EF4444',
              shadowColor: driverStatus === 'ONLINE' ? '#10B981' : '#EF4444',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 16,
              fontFamily: 'Inter-SemiBold',
              textAlign: 'center'
            }}>
              {driverStatus === 'ONLINE' ? '🟢 ONLINE - Tap to go OFFLINE' : '🔴 OFFLINE - Tap to go ONLINE'}
            </Text>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 12,
              fontFamily: 'Inter-Regular',
              marginTop: 4,
              opacity: 0.9
            }}>
              {driverStatus === 'ONLINE' ? 'Available for orders' : 'Not available for orders'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}