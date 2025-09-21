import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { MapPin, User, Phone, Car, ArrowRight, LogOut, RefreshCw } from 'lucide-react-native';
import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';
import { getPendingOrders, getDriverAssignmentsWithDetails, fetchAssignmentsForDriver, updateAssignmentStatus } from '@/services/assignmentService';
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
        
        // First, try to use driver_status from user object (from login response)
        if (user.driver_status) {
          const status = user.driver_status.toUpperCase();
          if (status === 'ONLINE' || status === 'OFFLINE') {
            setDriverStatus(status);
            console.log('🔍 Using driver status from login:', status);
          }
        } else {
          // If no status in user object, try to fetch from API
        try {
          const authHeaders = await getAuthHeaders();
          const driverResponse = await axiosInstance.get(`/api/users/cardriver/${user.id}`, { 
            headers: authHeaders 
          });
          if (driverResponse.data?.driver_status) {
            const status = driverResponse.data.driver_status.toUpperCase();
            if (status === 'ONLINE' || status === 'OFFLINE') {
              setDriverStatus(status);
                console.log('🔍 Current driver status from API:', status);
              }
            }
          } catch (statusError) {
            console.log('⚠️ Could not fetch driver status, using default ONLINE');
            setDriverStatus('ONLINE'); // Default to ONLINE instead of OFFLINE
          }
        }
        
        // Fetch assignments using the new enhanced function
        let detailedOrders: any[] = [];
        let errorMessages: string[] = [];
        
        try {
          // Use the new function that tries multiple approaches and enriches data
          detailedOrders = await getDriverAssignmentsWithDetails(user.id);
          
          
          if (detailedOrders.length === 0) {
            errorMessages.push('No assignments found for this driver');
          }
        } catch (driverError: any) {
          console.error('❌ Driver assignments failed:', driverError);
          errorMessages.push(`Assignment fetch failed: ${driverError.message}`);
          
          // Fallback: Try the old method
          try {
            const assignments = await fetchAssignmentsForDriver(user.id);
            
            // If we got assignments, enrich them with order details
            if (assignments.length > 0) {
        const authHeaders = await getAuthHeaders();
        for (const a of assignments) {
          try {
            const res = await axiosInstance.get(`/api/orders/${a.order_id}`, { headers: authHeaders });
            if (res.data) {
              detailedOrders.push({ 
                ...res.data, 
                assignment_id: a.id, 
                assignment_status: a.assignment_status || a.status 
              });
            }
                } catch (orderError: any) {
            console.error('❌ Failed to fetch order details:', orderError);
                  errorMessages.push(`Order details fetch failed: ${orderError.message}`);
                }
              }
            } else {
              errorMessages.push('No assignments found via fallback method');
            }
          } catch (fallbackError: any) {
            console.error('❌ Fallback method also failed:', fallbackError);
            errorMessages.push(`Fallback method failed: ${fallbackError.message}`);
          }
        }
        
        setDriverOrders(detailedOrders);
        
        // Show error alert if there were issues
        if (errorMessages.length > 0 && detailedOrders.length === 0) {
          const errorMessage = `Failed to load driver assignments:\n\n${errorMessages.join('\n')}\n\nDriver ID: ${user.id}\n\nCheck console logs for detailed information.`;
          
          Alert.alert(
            'Assignment Loading Failed',
            errorMessage,
            [
              { text: 'OK' },
              { 
                text: 'Retry', 
                onPress: () => {
                  loadDriverData();
                }
              },
              {
                text: 'Debug',
                onPress: () => {
                  handleDebugAssignments();
                }
              }
            ]
          );
        }
      } finally {
        setOrdersLoading(false);
      }
    };

  useEffect(() => {
    loadDriverData();
    fetchDriverStatus();
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDriverData();
    setRefreshing(false);
  };

  const handleDebugAssignments = async () => {
    if (!user?.id) {
      Alert.alert('Debug Error', 'No user ID available');
      return;
    }

    try {
      console.log('🧪 Testing driver assignments for driver:', user.id);
      
      // Test the new function
      const assignments = await getDriverAssignmentsWithDetails(user.id);
      console.log('📊 Driver assignments debug result:', assignments);
      
      // Create detailed debug message
      let debugMessage = `Driver ID: ${user.id}\n`;
      debugMessage += `Found ${assignments.length} assignments\n\n`;
      
      if (assignments.length > 0) {
        debugMessage += 'Assignments:\n';
        assignments.forEach((assignment, index) => {
          debugMessage += `${index + 1}. Order ${assignment.order_id} - ${assignment.assignment_status}\n`;
          debugMessage += `   Driver: ${assignment.driver_id}\n`;
          debugMessage += `   Car: ${assignment.car_id}\n`;
          debugMessage += `   Customer: ${assignment.customer_name}\n\n`;
        });
      } else {
        debugMessage += 'No assignments found. This could mean:\n';
        debugMessage += '• Driver has no assigned orders\n';
        debugMessage += '• Assignments exist but not in ASSIGNED status\n';
        debugMessage += '• API endpoint issues\n';
        debugMessage += '• Driver ID mismatch\n\n';
        debugMessage += 'Check console logs for detailed information.';
      }
      
      Alert.alert(
        'Driver Assignments Debug',
        debugMessage,
        [
          { text: 'OK' },
          { 
            text: 'Refresh', 
            onPress: () => {
              loadDriverData();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Driver assignments debug failed:', error);
      
      let errorMessage = `Debug failed: ${error.message}\n\n`;
      errorMessage += 'Possible causes:\n';
      errorMessage += '• Network connectivity issues\n';
      errorMessage += '• Authentication problems\n';
      errorMessage += '• API endpoint not available\n';
      errorMessage += '• Invalid driver ID\n\n';
      errorMessage += 'Check console logs for detailed error information.';
      
      Alert.alert('Debug Error', errorMessage, [
        { text: 'OK' },
        { 
          text: 'Retry', 
          onPress: () => {
            handleDebugAssignments();
          }
        }
      ]);
    }
  };

  // Sort all orders by scheduled date/time ascending
  const sortedOrders = useMemo(() => {
    if (!driverOrders || driverOrders.length === 0) {
      return [];
    }
    return [...driverOrders].sort((a, b) => {
      const da = new Date(a.scheduled_at || a.created_at || 0).getTime();
      const db = new Date(b.scheduled_at || b.created_at || 0).getTime();
      return da - db;
    });
  }, [driverOrders]);

  // Get the next available order (not started)
  const nextAssignedOrder = useMemo(() => {
    if (sortedOrders.length === 0) return null;
    const now = new Date();
    return sortedOrders.find(o => {
      const isNotStarted = o.assignment_status === 'ASSIGNED' || o.assignment_status === 'PENDING';
      const isUpcoming = new Date(o.scheduled_at || o.created_at || 0) >= now;
      return isNotStarted && isUpcoming;
    }) || sortedOrders.find(o => o.assignment_status === 'ASSIGNED' || o.assignment_status === 'PENDING') || null;
  }, [sortedOrders]);

  // Get current active trip (if any) - prioritize DRIVING status
  const currentTrip = useMemo(() => {
    return sortedOrders.find(o => o.assignment_status === 'DRIVING' || o.assignment_status === 'STARTED');
  }, [sortedOrders]);

  const handleStartTrip = async (order: any) => {
    try {
    setTripStarted(true);
      const farePerKm = order.cost_per_km || order.fare_per_km || 0;
      
      // Update assignment status to DRIVING
      await updateAssignmentStatus(order.assignment_id || order.id, 'DRIVING');
      
      // Navigate to trip start screen
    router.push({
      pathname: '/trip/start',
      params: {
          orderId: String(order.order_id || order.booking_id || ''),
          assignmentId: String(order.assignment_id || order.id || ''),
        farePerKm: String(farePerKm)
      }
    });
    } catch (error) {
      console.error('❌ Failed to start trip:', error);
      Alert.alert('Error', 'Failed to start trip. Please try again.');
    }
  };

  const handleEndTrip = async (order: any) => {
    try {
      // Update assignment status to COMPLETED
      await updateAssignmentStatus(order.assignment_id || order.id, 'COMPLETED');
      
      // Navigate to trip end screen
      router.push({
        pathname: '/trip/end',
        params: {
          orderId: String(order.order_id || order.booking_id || ''),
          assignmentId: String(order.assignment_id || order.id || '')
        }
      });
    } catch (error) {
      console.error('❌ Failed to end trip:', error);
      Alert.alert('Error', 'Failed to end trip. Please try again.');
    }
  };

  const fetchDriverStatus = async () => {
    if (!user?.id) return;
    try {
      console.log('📊 Fetching driver status for:', user.id);
      // Fetch current driver status from API
      const response = await axiosInstance.get(`/api/users/cardriver/${user.id}`);
      console.log('📊 Driver status response:', response.data);
      
      if (response.data && response.data.driver_status) {
        setDriverStatus(response.data.driver_status);
        console.log('✅ Driver status updated to:', response.data.driver_status);
      } else {
        console.log('⚠️ No driver_status in response, using default ONLINE');
        setDriverStatus('ONLINE'); // Default to ONLINE if no status found
      }
    } catch (error) {
      console.error('❌ Failed to fetch driver status:', error);
      // If API fails, check if we have status from login response
      if (user.driver_status) {
        setDriverStatus(user.driver_status as 'ONLINE' | 'OFFLINE');
        console.log('📊 Using driver status from user object:', user.driver_status);
      } else {
        console.log('⚠️ No driver status available, defaulting to ONLINE');
        setDriverStatus('ONLINE'); // Default to ONLINE if all else fails
      }
    }
  };

  const toggleStatus = async () => {
    if (!user?.id) return;
    
    console.log('🔄 Toggling status from:', driverStatus);
    
    try {
      let newStatus = driverStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      let response;
      
      if (newStatus === 'ONLINE') {
        console.log('🟢 Setting driver online...');
        response = await setDriverOnline(user.id);
        console.log('🟢 Online response:', response);
      } else {
        console.log('🔴 Setting driver offline...');
        response = await setDriverOffline(user.id);
        console.log('🔴 Offline response:', response);
      }
        
        // Check if the API call was successful
      if (response?.success || response?.status === newStatus.toLowerCase() || response?.message?.includes('success')) {
        setDriverStatus(newStatus as 'ONLINE' | 'OFFLINE');
        console.log('✅ Status updated to:', newStatus);
      } else if (response?.message?.includes('already') || response?.message?.includes('Current status')) {
        // Driver is already in the target status, update local state
        setDriverStatus(newStatus as 'ONLINE' | 'OFFLINE');
        console.log('✅ Status already set to:', newStatus);
      } else {
        console.log('⚠️ API response unclear, refreshing status...');
        // Refresh status to get current state
        setTimeout(() => {
          fetchDriverStatus();
        }, 500);
      }
      
    } catch (error: any) {
      console.error('❌ Status toggle error:', error);
      
      // Check if it's a "already in that status" error
      if (error.message?.includes('already') || error.message?.includes('Current status')) {
        // Extract the current status from error message
        if (error.message?.includes('ONLINE')) {
          setDriverStatus('ONLINE' as 'ONLINE' | 'OFFLINE');
          console.log('✅ Status set to ONLINE from error message');
        } else if (error.message?.includes('OFFLINE')) {
          setDriverStatus('OFFLINE' as 'ONLINE' | 'OFFLINE');
          console.log('✅ Status set to OFFLINE from error message');
        }
      } else {
        console.error('❌ Toggle failed, refreshing status...');
        // Refresh status to get current state
        setTimeout(() => {
          fetchDriverStatus();
        }, 500);
        Alert.alert('Status Update Failed', error.message || 'Please try again');
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
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 100, // Add extra padding for floating button
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
    ordersSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    statusBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-Bold',
      textTransform: 'uppercase',
    },
    headerSection: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    orderCountText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    ordersList: {
      marginBottom: 20,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    orderInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginTop: 2,
    },
    orderDetails: {
      marginTop: 12,
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 12,
      gap: 8,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
    statusContainer: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      paddingVertical: 16,
      zIndex: 1000,
    },
    statusToggle: {
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statusToggleText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
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

      <ScrollView 
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        {/* Header with order count */}
        <View style={dynamicStyles.headerSection}>
          <Text style={dynamicStyles.welcomeText}>Welcome, {user?.fullName || 'Driver'}</Text>
          <Text style={dynamicStyles.orderCountText}>
            {sortedOrders.length} Assigned Trip{sortedOrders.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Current Active Trip */}
        {currentTrip && (
          <View style={[dynamicStyles.orderCard, { borderColor: colors.success, borderWidth: 2 }]}>
            <View style={dynamicStyles.statusBadge}>
              <Text style={[dynamicStyles.statusText, { color: colors.success }]}>CURRENT TRIP</Text>
            </View>
            <Text style={dynamicStyles.orderTitle}>Active Trip #{currentTrip.order_id || currentTrip.booking_id}</Text>
            
            <View style={dynamicStyles.routeContainer}>
              <View style={dynamicStyles.routeRow}>
                <MapPin color={colors.success} size={16} />
                <Text style={dynamicStyles.routeText}>
                  {currentTrip.pickup_drop_location?.['0'] || 
                   currentTrip.pickup_drop_location?.pickup || 
                   currentTrip.pickup || 'Unknown'}
                </Text>
              </View>
              <View style={dynamicStyles.routeLine} />
              <View style={dynamicStyles.routeRow}>
                <MapPin color={colors.error} size={16} />
                <Text style={dynamicStyles.routeText}>
                  {currentTrip.pickup_drop_location?.['1'] || 
                   currentTrip.pickup_drop_location?.drop || 
                   currentTrip.drop || 'Unknown'}
                </Text>
              </View>
            </View>

            <View style={dynamicStyles.customerInfo}>
              <View style={dynamicStyles.customerRow}>
                <User color={colors.textSecondary} size={16} />
                <Text style={dynamicStyles.customerText}>{currentTrip.customer_name}</Text>
              </View>
              <View style={dynamicStyles.customerRow}>
                <Phone color={colors.textSecondary} size={16} />
                <Text style={dynamicStyles.customerText}>{currentTrip.customer_number || currentTrip.customer_mobile}</Text>
              </View>
            </View>

            <TouchableOpacity style={[dynamicStyles.startButton, { backgroundColor: colors.error }]} onPress={() => handleEndTrip(currentTrip)}>
              <Text style={dynamicStyles.startButtonText}>End Trip</Text>
              <ArrowRight color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        )}

        {/* Orders List */}
        {sortedOrders.length > 0 ? (
          <View style={dynamicStyles.ordersList}>
            {sortedOrders.map((order, index) => {
              const isCurrentTrip = order.assignment_status === 'DRIVING' || order.assignment_status === 'STARTED';
              const canStart = order.assignment_status === 'ASSIGNED' || order.assignment_status === 'PENDING';
              const isCompleted = order.assignment_status === 'COMPLETED';
              
              // Debug logging for trip status detection
              console.log(`🔍 Order ${order.order_id} status:`, {
                assignment_status: order.assignment_status,
                isCurrentTrip,
                canStart,
                isCompleted
              });
              
              return (
                <View key={order.id || order.assignment_id || index} style={[
                  dynamicStyles.orderCard,
                  isCurrentTrip && { borderColor: colors.success, borderWidth: 2 },
                  isCompleted && { opacity: 0.6, backgroundColor: colors.surface }
                ]}>
                  {/* Order Header */}
                  <View style={dynamicStyles.orderHeader}>
                    <View style={dynamicStyles.orderInfo}>
                      <Text style={dynamicStyles.orderTitle}>Trip #{order.order_id || order.booking_id}</Text>
                      <Text style={dynamicStyles.customerName}>{order.customer_name}</Text>
                    </View>
                    <View style={[
                      dynamicStyles.statusBadge,
                      { backgroundColor: isCurrentTrip ? colors.success : isCompleted ? colors.textSecondary : colors.primary }
                    ]}>
                      <Text style={[dynamicStyles.statusText, { color: '#FFFFFF' }]}>
                        {isCurrentTrip ? 'ACTIVE' : order.assignment_status === 'ASSIGNED' ? 'READY' : order.assignment_status}
                      </Text>
                    </View>
                  </View>

                  {/* Route */}
                  <View style={dynamicStyles.routeContainer}>
                    <View style={dynamicStyles.routeRow}>
                      <MapPin color={colors.success} size={16} />
                      <Text style={dynamicStyles.routeText}>
                        {order.pickup || 'Pickup Location'}
                      </Text>
                    </View>
                    <View style={dynamicStyles.routeLine} />
                    <View style={dynamicStyles.routeRow}>
                      <MapPin color={colors.error} size={16} />
                      <Text style={dynamicStyles.routeText}>
                        {order.drop || 'Drop Location'}
                      </Text>
                    </View>
                  </View>

                  {/* Order Details */}
                  <View style={dynamicStyles.orderDetails}>
                    <View style={dynamicStyles.detailRow}>
                      <Phone color={colors.textSecondary} size={14} />
                      <Text style={dynamicStyles.detailText}>{order.customer_mobile}</Text>
                    </View>
                    <View style={dynamicStyles.detailRow}>
                      <Car color={colors.textSecondary} size={14} />
                      <Text style={dynamicStyles.detailText}>
                        {order.car_type} • {order.trip_type}
                      </Text>
                    </View>
                    <View style={dynamicStyles.detailRow}>
                      <Text style={[dynamicStyles.detailText, { fontWeight: 'bold', color: colors.success }]}>
                        ₹{order.total_fare || order.estimated_price || 0}
                      </Text>
                    </View>
                  </View>

                  {/* Action Button */}
                  {isCurrentTrip ? (
                    <TouchableOpacity style={[dynamicStyles.actionButton, { backgroundColor: colors.error }]} onPress={() => handleEndTrip(order)}>
                      <Text style={dynamicStyles.actionButtonText}>End Trip</Text>
                      <ArrowRight color="#FFFFFF" size={16} />
                    </TouchableOpacity>
                  ) : canStart ? (
                    <TouchableOpacity style={[dynamicStyles.actionButton, { backgroundColor: colors.success }]} onPress={() => handleStartTrip(order)}>
                      <Text style={dynamicStyles.actionButtonText}>Start Trip</Text>
                      <ArrowRight color="#FFFFFF" size={16} />
                    </TouchableOpacity>
                  ) : isCompleted ? (
                    <View style={[dynamicStyles.actionButton, { backgroundColor: colors.textSecondary }]}>
                      <Text style={dynamicStyles.actionButtonText}>Completed</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : !ordersLoading ? (
          <View style={dynamicStyles.noOrdersContainer}>
            <Text style={dynamicStyles.noOrdersText}>No assigned trips yet</Text>
            <Text style={dynamicStyles.noOrdersSubtext}>
              Check back later for new assignments
            </Text>
          </View>
        ) : null}

        {/* Status Toggle at Bottom */}
        <View style={dynamicStyles.statusContainer}>
          <TouchableOpacity
            onPress={toggleStatus}
            style={[
              dynamicStyles.statusToggle,
              { backgroundColor: driverStatus === 'ONLINE' ? colors.success : colors.error }
            ]}
          >
            <Text style={dynamicStyles.statusToggleText}>
              {driverStatus === 'ONLINE' ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}