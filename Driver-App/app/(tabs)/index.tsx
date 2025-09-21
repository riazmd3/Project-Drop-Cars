import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useDashboard, FutureRide } from '@/contexts/DashboardContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'expo-router';
import { Menu, Wallet, MapPin, Clock, User, Phone, Car, RefreshCw } from 'lucide-react-native';
import BookingCard from '@/components/BookingCard';
import DrawerNavigation from '@/components/DrawerNavigation';
import { fetchDashboardData, DashboardData, forceRefreshDashboardData } from '@/services/dashboardService';
import { getPendingOrders } from '@/services/assignmentService';

interface Booking {
  booking_id: string;
  pickup: string;
  drop: string;
  customer_name: string;
  customer_mobile: string;
  fare_per_km: number;
  distance_km: number;
  total_fare: number;
  status?: string; // Make status optional to match both interfaces
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { balance } = useWallet();
  const { colors } = useTheme();
  const { dashboardData, loading, error, fetchData, refreshData } = useDashboard();
  const { sendNewOrderNotification, sendOrderAssignedNotification } = useNotifications();
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  // Remove currentTrip concept from owner dashboard
  const [refreshing, setRefreshing] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);

  const canAcceptBookings = balance >= 1000;

  // Helper function to extract pickup and drop locations from the API response
  const getPickupDropLocations = (pickupDropLocation: any) => {
    if (!pickupDropLocation) return { pickup: 'Unknown', drop: 'Unknown' };
    
    // Handle array format: { "0": "Chennai", "1": "Gingee" }
    if (typeof pickupDropLocation === 'object' && pickupDropLocation['0'] && pickupDropLocation['1']) {
      return {
        pickup: pickupDropLocation['0'],
        drop: pickupDropLocation['1']
      };
    }
    
    // Handle object format: { pickup: "Chennai", drop: "Gingee" }
    if (pickupDropLocation.pickup && pickupDropLocation.drop) {
      return {
        pickup: pickupDropLocation.pickup,
        drop: pickupDropLocation.drop
      };
    }
    
    // Fallback
    return { pickup: 'Unknown', drop: 'Unknown' };
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 DashboardScreen mounted with:', {
      user: user ? { id: user.id, fullName: user.fullName, primaryMobile: user.primaryMobile } : null,
      dashboardData: dashboardData ? {
        user_info: dashboardData.user_info,
        carCount: dashboardData.cars?.length || 0,
        driverCount: dashboardData.drivers?.length || 0
      } : null,
      loading,
      error,
      pendingOrders: pendingOrders.length
    });
  }, [user, dashboardData, loading, error, pendingOrders]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    console.log('📱 DashboardScreen: fetchData called');
    fetchData();
  }, []);

  // Fetch pending orders when dashboard data is loaded
  useEffect(() => {
    if (dashboardData && !loading) {
      fetchPendingOrdersData();
    }
  }, [dashboardData, loading]);

  // Check for new orders and send notifications
  useEffect(() => {
    if (pendingOrders.length > 0 && previousOrderCount === 0) {
      // First time loading orders, just update count
      setPreviousOrderCount(pendingOrders.length);
    } else if (pendingOrders.length > previousOrderCount && previousOrderCount > 0) {
      // New orders received
      const newOrders = pendingOrders.slice(previousOrderCount);
      newOrders.forEach(order => {
        const locations = getPickupDropLocations(order.pickup_drop_location);
        sendNewOrderNotification({
          orderId: order.order_id.toString(),
          pickup: locations.pickup,
          drop: locations.drop,
          customerName: order.customer_name,
          customerMobile: order.customer_number,
          distance: order.trip_distance,
          fare: (order.cost_per_km * order.trip_distance) + order.driver_allowance + order.permit_charges + order.hill_charges + order.toll_charges,
          orderType: 'new'
        });
      });
      setPreviousOrderCount(pendingOrders.length);
    } else if (pendingOrders.length !== previousOrderCount) {
      // Update count if it changed
      setPreviousOrderCount(pendingOrders.length);
    }
  }, [pendingOrders, previousOrderCount, sendNewOrderNotification]);

  const fetchPendingOrdersData = async () => {
    try {
      setOrdersLoading(true);
      console.log('📋 Fetching pending orders for dashboard...');
      
      const orders = await getPendingOrders();
      console.log('✅ Pending orders loaded:', orders.length);
      
      setPendingOrders(orders);
    } catch (error) {
      console.error('❌ Failed to fetch pending orders:', error);
      // Don't show error alert, just log it
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Manual refresh triggered...');
      
      // Force refresh dashboard data to get latest cars and drivers
      await forceRefreshDashboardData();
      await refreshData();
      await fetchPendingOrdersData(); // Also refresh orders
      
      console.log('✅ Manual refresh completed successfully');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };




  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuButton: {
      padding: 8,
    },
    balanceContainer: {
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
      marginBottom: 4,
    },
    balanceLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    balanceAmount: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    refreshButton: {
      padding: 8,
      marginRight: 8,
    },
    walletButton: {
      padding: 8,
    },
    warningBanner: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    warningText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: '#92400E',
      textAlign: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    welcomeBanner: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    welcomeBannerTitle: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      marginBottom: 8,
      textAlign: 'center',
    },
    welcomeBannerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 4,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    statNumber: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    currentTripSection: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 16,
    },
    currentTripCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    tripHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    tripStatus: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.success,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    tripDetails: {
      marginBottom: 20,
    },
    tripRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    tripText: {
      marginLeft: 12,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    endTripButton: {
      backgroundColor: colors.error,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    endTripButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
    bookingsSection: {
      marginTop: 20,
    },
    noBookings: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 40,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    noBookingsText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    noBookingsSubtext: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    debugButton: {
      backgroundColor: colors.error,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 8,
    },
    debugButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    debugSection: {
      backgroundColor: '#F3F4F6',
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
      marginBottom: 16,
    },
    debugTitle: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: '#374151',
      marginBottom: 8,
    },
    debugText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: '#6B7280',
      marginBottom: 4,
    },
  });
  const handleAcceptBooking = (order: PendingOrder) => {
    if (!canAcceptBookings) {
      Alert.alert(
        'Insufficient Balance',
        'Your wallet balance is below ₹1000. Please add money to continue receiving bookings.',
        [{ text: 'Add Money', onPress: () => router.push('/(tabs)/wallet') }]
      );
      return;
    }

    const locations = getPickupDropLocations(order.pickup_drop_location);
    Alert.alert(
      'Accept Booking',
      `Accept trip from ${locations.pickup} to ${locations.drop}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => acceptBooking(order) }
      ]
    );
  };

  const { addFutureRide } = useDashboard();

  const acceptBooking = async (order: PendingOrder) => {
    try {
      // Show loading state for this specific order
      setProcessingOrderId(order.order_id.toString());
      
      // First check if the order is still available
      const isAvailable = await checkOrderAvailability(order.order_id.toString());
      
      if (!isAvailable) {
        Alert.alert(
          'Order No Longer Available',
          'This order has already been taken by another vehicle owner. Refreshing available orders...',
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh the orders list to remove already assigned orders
                fetchPendingOrdersData();
              }
            }
          ]
        );
        return;
      }
      
      // Call the new API to accept the order
      const acceptResponse = await acceptOrder({
        order_id: order.order_id.toString(),
        vehicle_owner_id: user?.id || '',
        acceptance_notes: `Order accepted by vehicle owner ${user?.fullName || 'Driver'}`
      });

      if (acceptResponse.success) {
        // Remove order from pending list
        setPendingOrders(prev => prev.filter(o => o.order_id !== order.order_id));

        const locations = getPickupDropLocations(order.pickup_drop_location);
        const ride: FutureRide = {
          id: order.order_id.toString(),
          booking_id: `B${order.order_id}`,
          pickup: locations.pickup,
          drop: locations.drop,
          customer_name: order.customer_name,
          customer_mobile: order.customer_number,
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().slice(0,5),
          distance: order.trip_distance,
          fare_per_km: order.cost_per_km,
          total_fare: (order.cost_per_km * order.trip_distance) + order.driver_allowance + order.permit_charges + order.hill_charges + order.toll_charges,
          status: 'confirmed',
          assigned_driver: null,
          assigned_vehicle: null,
        };

        addFutureRide(ride);

        // Send notification for accepted order
        sendOrderAssignedNotification({
          orderId: order.order_id.toString(),
          pickup: locations.pickup,
          drop: locations.drop,
          customerName: order.customer_name,
          customerMobile: order.customer_number,
          distance: order.trip_distance,
          fare: (order.cost_per_km * order.trip_distance) + order.driver_allowance + order.permit_charges + order.hill_charges + order.toll_charges,
          orderType: 'assigned'
        });

        Alert.alert(
          'Booking Accepted',
          `Order accepted successfully! SMS sent to customer: "DropCars: Your driver ${user?.fullName || 'Driver'} (${dashboardData?.cars?.[0]?.car_brand || 'Vehicle'} ${dashboardData?.cars?.[0]?.car_model || ''} - ${dashboardData?.cars?.[0]?.car_number || 'Number'}) has accepted your booking."`
        );
      } else {
        throw new Error(acceptResponse.message || 'Failed to accept order');
      }
    } catch (error: any) {
      console.error('❌ Error accepting order:', error);
      
      // Check if it's an "already assigned" error
      if (error.message.includes('already been accepted') || 
          error.message.includes('already assigned') ||
          error.message.includes('active assignment')) {
        
        Alert.alert(
          'Order Already Taken',
          'This order has already been accepted by another vehicle owner. Refreshing available orders...',
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh the orders list to remove already assigned orders
                fetchPendingOrdersData();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to accept order. Please try again.'
        );
      }
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={() => setShowDrawer(true)} style={dynamicStyles.menuButton}>
          <Menu color={colors.text} size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={dynamicStyles.balanceContainer}
        >
          <Text style={dynamicStyles.welcomeText}>
            Welcome back, {dashboardData?.user_info?.full_name || user?.fullName || 'Driver'}!
          </Text>
          <Text style={dynamicStyles.balanceLabel}>Available Balance</Text>
          <Text style={dynamicStyles.balanceAmount}>₹{dashboardData?.user_info?.wallet_balance || balance || 0}</Text>
        </TouchableOpacity>

        <View style={dynamicStyles.headerRight}>
          <TouchableOpacity onPress={handleRefresh} style={dynamicStyles.refreshButton} disabled={refreshing}>
            <RefreshCw color={colors.primary} size={20} style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/wallet')} style={dynamicStyles.walletButton}>
            <Wallet color={colors.primary} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {!canAcceptBookings && (
        <View style={dynamicStyles.warningBanner}>
          <Text style={dynamicStyles.warningText}>
            Wallet balance below ₹1000. Add money to receive bookings.
          </Text>
        </View>
      )}

      <ScrollView 
        style={dynamicStyles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={dynamicStyles.loadingContainer}>
            <Text style={dynamicStyles.loadingText}>Loading your dashboard...</Text>
          </View>
        ) : error ? (
          <View style={dynamicStyles.loadingContainer}>
            <Text style={dynamicStyles.loadingText}>Error: {error}</Text>
            <TouchableOpacity 
              style={[dynamicStyles.endTripButton, { marginTop: 16 }]}
              onPress={fetchData}
            >
              <Text style={dynamicStyles.endTripButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Welcome Banner */}
            <View style={dynamicStyles.welcomeBanner}>
              <Text style={dynamicStyles.welcomeBannerTitle}>
                🚗 Welcome to Drop Cars, {dashboardData?.user_info?.full_name || user?.fullName || 'Driver'}!
              </Text>
              <Text style={dynamicStyles.welcomeBannerSubtitle}>
                {dashboardData?.cars && dashboardData.cars.length > 0 
                  ? `Your ${dashboardData.cars[0].car_brand} ${dashboardData.cars[0].car_model} (${dashboardData.cars[0].car_number}) is ready for service. Start earning today!`
                  : 'Complete your profile setup to start earning!'
                }
              </Text>
            </View>

            {/* Quick Stats */}
            <View style={dynamicStyles.statsContainer}>
              <View style={dynamicStyles.statCard}>
                <Text style={dynamicStyles.statNumber}>₹{dashboardData?.user_info?.wallet_balance || balance || 0}</Text>
                <Text style={dynamicStyles.statLabel}>Wallet Balance</Text>
              </View>
              <View style={dynamicStyles.statCard}>
                <Text style={dynamicStyles.statNumber}>{dashboardData?.cars?.length || 0}</Text>
                <Text style={dynamicStyles.statLabel}>Vehicles</Text>
              </View>
              <View style={dynamicStyles.statCard}>
                <Text style={dynamicStyles.statNumber}>{dashboardData?.drivers?.length || 0}</Text>
                <Text style={dynamicStyles.statLabel}>Drivers</Text>
              </View>
            </View>


            {
              <View style={dynamicStyles.bookingsSection}>
                <Text style={dynamicStyles.sectionTitle}>Available Bookings</Text>
                {ordersLoading ? (
                  <View style={dynamicStyles.loadingContainer}>
                    <Text style={dynamicStyles.loadingText}>Loading pending orders...</Text>
                  </View>
                ) : pendingOrders.length > 0 ? (
                  pendingOrders.map((order) => {
                    const locations = getPickupDropLocations(order.pickup_drop_location);
                    return (
                      <BookingCard
                        key={order.order_id}
                        booking={{
                          booking_id: order.order_id.toString(),
                          pickup: locations.pickup,
                          drop: locations.drop,
                          customer_name: order.customer_name,
                          customer_mobile: order.customer_number,
                          fare_per_km: order.cost_per_km,
                          distance_km: order.trip_distance,
                          total_fare: (order.cost_per_km * order.trip_distance) + order.driver_allowance + order.permit_charges + order.hill_charges + order.toll_charges
                        }}
                        onAccept={() => handleAcceptBooking(order)}
                        disabled={!canAcceptBookings}
                        loading={processingOrderId === order.order_id.toString()}
                      />
                    );
                  })
                ) : (
                  <View style={dynamicStyles.noBookings}>
                    <Text style={dynamicStyles.noBookingsText}>No pending bookings available</Text>
                    <Text style={dynamicStyles.noBookingsSubtext}>New bookings will appear here</Text>
                  </View>
                )}
              </View>
            }
          </>
        )}
      </ScrollView>

      <DrawerNavigation 
        visible={showDrawer} 
        onClose={() => setShowDrawer(false)} 
      />
    </SafeAreaView>
  );
}