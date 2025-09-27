import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { 
  MapPin, 
  User, 
  Phone, 
  Car, 
  ArrowRight, 
  LogOut, 
  RefreshCw,
  Clock,
  DollarSign,
  Navigation,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';
import axiosDriver from '@/app/api/axiosDriver';
import { setDriverOnline, setDriverOffline, startTrip, endTrip } from '@/services/driver/carDriverService';
import * as SecureStore from 'expo-secure-store';

interface DriverOrder {
  id: number;
  order_id: number;
  assignment_status: string;
  customer_name: string;
  customer_number: string;
  pickup_drop_location: Record<string, string>;
  start_date_time: string;
  trip_type: string;
  car_type: string;
  estimated_price: number;
  assigned_at: string;
  created_at: string;
  pickup?: string;
  drop?: string;
  customer_mobile?: string;
  total_fare?: number;
  assignment_id?: number;
  scheduled_at?: string;
}

export default function QuickDashboardScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  
  // State management
  const [driverStatus, setDriverStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [driverOrders, setDriverOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [activeTrip, setActiveTrip] = useState<DriverOrder | null>(null);
  const [tripActionLoading, setTripActionLoading] = useState<number | null>(null);
  
  // Animation values
  const statusAnimation = useState(new Animated.Value(0))[0];
  const pulseAnimation = useState(new Animated.Value(1))[0];

  // Get driver info from login data
  const driverInfo = {
    name: user?.fullName || 'Driver',
    phone: user?.primaryMobile || '',
    driverId: user?.id || '',
    status: user?.driver_status || 'OFFLINE'
  };

  // Debug authentication function
  const debugAuthentication = useCallback(async () => {
    try {
      const driverToken = await SecureStore.getItemAsync('driverAuthToken');
      console.log('🔍 Driver token exists:', !!driverToken);
      console.log('🔍 Driver token preview:', driverToken ? `${driverToken.substring(0, 20)}...` : 'None');
      
      if (!driverToken) {
        console.error('❌ No driver token found');
        return false;
      }
      
      // Test the API call with explicit headers
      const response = await axiosDriver.get('/api/assignments/driver/assigned-orders', {
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Debug API call successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Debug API call failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return false;
    }
  }, []);

  // Optimized data fetching with proper authentication
  const loadDriverData = useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ No user ID available');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Loading driver data...');
      
      // Check if driver token exists
      const driverToken = await SecureStore.getItemAsync('driverAuthToken');
      if (!driverToken) {
        console.error('❌ No driver token found');
        Alert.alert(
          'Authentication Error',
          'Driver token not found. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
        return;
      }
      
      console.log('🔑 Driver token found, making API call...');
      
      const response = await axiosDriver.get('/api/assignments/driver/assigned-orders');
      const orders = Array.isArray(response.data) ? response.data : [];
      
      console.log('📦 Raw API response:', response.data);
      console.log('📦 Orders count:', orders.length);
      
      // Optimized mapping
      const mappedOrders = orders.map((order: any) => ({
        ...order,
        pickup: Object.values(order.pickup_drop_location || {})[0] || 'Unknown',
        drop: Object.values(order.pickup_drop_location || {})[1] || 'Unknown',
        customer_mobile: order.customer_number,
        total_fare: order.estimated_price || 0,
        assignment_id: order.id,
        scheduled_at: order.start_date_time,
      }));
      
      setDriverOrders(mappedOrders);
      console.log('✅ Driver data loaded:', mappedOrders.length, 'orders');
      
    } catch (error: any) {
      console.error('❌ Failed to load driver data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      setDriverOrders([]);
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Driver token is invalid or expired. Please login again.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else if (error.message.includes('Network Error')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          `Failed to load orders: ${error.response?.data?.detail || error.message}`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, router]);

  // Optimized status toggle
  const toggleDriverStatus = useCallback(async () => {
    if (statusChanging) return;
    
    try {
      setStatusChanging(true);
      const newStatus = driverStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      
      // Animate status change
      Animated.sequence([
        Animated.timing(statusAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(statusAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // API call
      const response = newStatus === 'ONLINE' 
        ? await setDriverOnline(user?.id || '')
        : await setDriverOffline(user?.id || '');
      
      if (response.success !== false) {
        setDriverStatus(newStatus);
        console.log(`✅ Driver set ${newStatus.toLowerCase()}`);
      } else {
        throw new Error(response.message || 'Status update failed');
      }
      
    } catch (error: any) {
      console.error('❌ Status toggle failed:', error.message);
      Alert.alert(
        'Status Update Failed',
        error.message || 'Unable to update driver status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setStatusChanging(false);
    }
  }, [driverStatus, statusChanging, user?.id, statusAnimation]);

  // Initialize data
  useEffect(() => {
    if (user?.driver_status) {
      setDriverStatus(user.driver_status.toUpperCase() as 'ONLINE' | 'OFFLINE');
    }
    
    // Debug authentication first
    debugAuthentication().then((success) => {
      if (success) {
        loadDriverData();
      } else {
        console.log('🔍 Authentication debug failed, trying to load data anyway...');
        loadDriverData();
      }
    });
  }, [user?.driver_status, loadDriverData, debugAuthentication]);

  // Pulse animation for online status
  useEffect(() => {
    if (driverStatus === 'ONLINE') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [driverStatus, pulseAnimation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDriverData();
    setRefreshing(false);
  }, [loadDriverData]);

  const handleLogout = useCallback(async () => {
      Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('driverAuthToken');
            await SecureStore.deleteItemAsync('driverAuthInfo');
            logout();
            router.replace('/login');
            }
          }
        ]
      );
  }, [logout, router]);

  // Trip management functions
  const handleStartTrip = useCallback(async (order: DriverOrder) => {
    if (activeTrip) {
      Alert.alert(
        'Active Trip',
        'You already have an active trip. Please end the current trip first.',
        [{ text: 'OK' }]
      );
      return;
    }

    // For now, show an alert that trip start requires additional data
    // In a real implementation, you would navigate to a trip start screen
    Alert.alert(
      'Trip Start',
      'To start a trip, you need to:\n• Enter starting odometer reading\n• Take a speedometer photo\n\nThis feature requires a trip start screen with camera functionality.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Navigate to trip start screen or show input modal
            console.log('Navigate to trip start screen for order:', order.order_id);
            // For now, just show a placeholder
            Alert.alert('Info', 'Trip start screen would open here with camera and odometer input');
          }
        }
      ]
    );
  }, [activeTrip]);

  const handleEndTrip = useCallback(async (order: DriverOrder) => {
    // For now, show an alert that trip end requires additional data
    // In a real implementation, you would navigate to a trip end screen
    Alert.alert(
      'Trip End',
      'To end a trip, you need to:\n• Enter ending odometer reading\n• Enter contact number\n• Take end speedometer photo\n\nThis feature requires a trip end screen with camera functionality.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Navigate to trip end screen or show input modal
            console.log('Navigate to trip end screen for order:', order.order_id);
            // For now, just show a placeholder
            Alert.alert('Info', 'Trip end screen would open here with camera, odometer input, and contact form');
          }
        }
      ]
    );
  }, [loadDriverData]);

  const navigateToTrip = useCallback((order: DriverOrder) => {
    router.push({
      pathname: '/trip/start',
      params: {
        assignmentId: order.assignment_id,
        orderId: order.order_id,
        customerName: order.customer_name,
        pickup: order.pickup,
        drop: order.drop,
      }
    });
  }, [router]);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned': return <CheckCircle size={16} color="#10B981" />;
      case 'pending': return <Clock size={16} color="#F59E0B" />;
      default: return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
              <User size={24} color={colors.primary} />
            </View>
            <View style={styles.driverDetails}>
              <Text style={[styles.driverName, { color: colors.text }]}>
                {driverInfo.name}
              </Text>
              <Text style={[styles.driverPhone, { color: colors.textSecondary }]}>
                {driverInfo.phone}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Toggle */}
      <View style={[styles.statusSection, { backgroundColor: colors.surface }]}>
        <Animated.View 
          style={[
            styles.statusToggle,
            { 
              backgroundColor: driverStatus === 'ONLINE' ? '#10B981' : '#EF4444',
              transform: [{ scale: pulseAnimation }]
            }
          ]}
        >
          <TouchableOpacity
            onPress={toggleDriverStatus}
            disabled={statusChanging}
            style={styles.statusButton}
          >
            {statusChanging ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>
                  {driverStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
        
        <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
          {activeTrip 
            ? `Active trip: Order #${activeTrip.order_id}` 
            : driverStatus === 'ONLINE' 
              ? 'You are available for new trips' 
              : 'You are not available for new trips'
          }
        </Text>
        
        {activeTrip && (
          <View style={[styles.activeTripIndicator, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Text style={[styles.activeTripText, { color: '#92400E' }]}>
              🚗 Trip in progress - {activeTrip.pickup} to {activeTrip.drop}
            </Text>
          </View>
        )}
      </View>

      {/* Orders Section */}
      <View style={styles.ordersSection}>
        <View style={styles.ordersHeader}>
          <Text style={[styles.ordersTitle, { color: colors.text }]}>
            Assigned Orders ({driverOrders.length})
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={debugAuthentication} 
              style={[styles.debugButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.debugButtonText}>Debug</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
              <RefreshCw 
                size={20} 
                color={colors.primary} 
                style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
              />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading orders...
            </Text>
          </View>
        ) : driverOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Car size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Assigned Orders
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              You don't have any assigned orders at the moment.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            {driverOrders.map((order, index) => (
              <TouchableOpacity
                key={`${order.order_id}-${index}`}
                style={[styles.orderCard, { backgroundColor: colors.surface }]}
                onPress={() => navigateToTrip(order)}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={[styles.orderId, { color: colors.text }]}>
                      Order #{order.order_id}
                    </Text>
                    <View style={styles.statusBadge}>
                      {getStatusIcon(order.assignment_status)}
                      <Text style={[styles.statusText, { color: getStatusColor(order.assignment_status) }]}>
                        {order.assignment_status}
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={20} color={colors.textSecondary} />
                </View>

                <View style={styles.routeInfo}>
                  <View style={styles.locationRow}>
                    <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                      {order.pickup}
                    </Text>
                  </View>
                  <View style={styles.locationRow}>
                    <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                      {order.drop}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <User size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {order.customer_name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {order.customer_mobile}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Car size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {order.car_type} • {order.trip_type}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {formatDateTime(order.scheduled_at || order.start_date_time).date} at {formatDateTime(order.scheduled_at || order.start_date_time).time}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.fareContainer}>
                    <DollarSign size={20} color="#10B981" />
                    <Text style={styles.fareAmount}>₹{order.total_fare}</Text>
                  </View>
                  
                  {/* Show different buttons based on trip state */}
                  {activeTrip && activeTrip.order_id === order.order_id ? (
                    // Active trip - show end trip button
                    <TouchableOpacity 
                      style={[styles.endTripButton, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleEndTrip(order)}
                      disabled={tripActionLoading === order.order_id}
                    >
                      {tripActionLoading === order.order_id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <CheckCircle size={16} color="white" />
                          <Text style={styles.endTripText}>End Trip</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : activeTrip ? (
                    // Another trip is active - show disabled button
                    <TouchableOpacity 
                      style={[styles.startTripButton, { backgroundColor: '#9CA3AF' }]}
                      disabled={true}
                    >
                      <AlertCircle size={16} color="white" />
                      <Text style={styles.startTripText}>Trip Active</Text>
                    </TouchableOpacity>
                  ) : (
                    // No active trip - show start trip button
                    <TouchableOpacity 
                      style={[styles.startTripButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleStartTrip(order)}
                      disabled={tripActionLoading === order.order_id}
                    >
                      {tripActionLoading === order.order_id ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Navigation size={16} color="white" />
                          <Text style={styles.startTripText}>Start Trip</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
    paddingVertical: 16,
      borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    justifyContent: 'space-between',
    },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
      flex: 1,
    },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
      alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    },
  driverDetails: {
      flex: 1,
    },
  driverName: {
      fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
    },
  driverPhone: {
      fontSize: 14,
  },
  logoutButton: {
    padding: 8,
  },
  statusSection: {
      padding: 20,
    alignItems: 'center',
  },
  statusToggle: {
    borderRadius: 25,
    marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButton: {
      flexDirection: 'row',
      alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  statusText: {
    color: 'white',
      fontSize: 16,
    fontWeight: '600',
  },
  statusDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  activeTripIndicator: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeTripText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  ordersSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ordersHeader: {
    flexDirection: 'row',
      alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    gap: 8,
  },
  debugButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
      alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    },
  loadingText: {
    marginTop: 12,
      fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
      alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
      fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
      marginBottom: 8,
    },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    },
    orderHeader: {
      flexDirection: 'row',
    alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    orderInfo: {
      flex: 1,
    },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfo: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  locationText: {
      fontSize: 14,
    flex: 1,
    },
    orderDetails: {
    marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    marginBottom: 4,
    },
    detailText: {
      fontSize: 14,
    marginLeft: 8,
    },
  orderFooter: {
      flexDirection: 'row',
      alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  startTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
      paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    },
  startTripText: {
    color: 'white',
      fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  endTripButton: {
    flexDirection: 'row',
      alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  endTripText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    },
  });

