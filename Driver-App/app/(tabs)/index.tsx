import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
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
import WelcomeScreen from '@/components/WelcomeScreen';
import { fetchDashboardData, DashboardData, forceRefreshDashboardData } from '@/services/orders/dashboardService';
import { getPendingOrders, PendingOrder } from '@/services/orders/assignmentService';
import { updateNotificationSettings } from '@/services/notifications/notificationApi';
import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/auth/authService';

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

// Enhanced debug version of parse/filter logic:
function parseCityListField(field: string | null | undefined): string[] {
  if (!field) return [];
  let raw = field.trim();
  // Remove brackets if array-like
  if (raw.startsWith('[') && raw.endsWith(']')) {
    raw = raw.slice(1, -1);
  }
  // Remove quotes
  raw = raw.replace(/['\"]/g, '');
  return raw.split(',').map(c => c.trim()).filter(Boolean);
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { balance, refreshBalance } = useWallet();
  const { colors, isDarkMode } = useTheme();
  const { dashboardData, loading, error, fetchData, refreshData, futureRides } = useDashboard();
  const { notificationsEnabled, getNotificationStatus } = useNotifications();
  const router = useRouter();
  const [showDrawer, setShowDrawer] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  // Remove currentTrip concept from owner dashboard
  const [refreshing, setRefreshing] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  // Available Bookings filters
  const [availableTab, setAvailableTab] = useState<'all' | 'nearcity'>('all');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [showCityModal, setShowCityModal] = useState(false);
  const [selectAllCities, setSelectAllCities] = useState(true);

  const CITY_STORAGE_KEY = 'vo_nearcity_selected_cities';

  // Master list of cities (can be moved to a separate module later)
  const MASTER_CITIES: string[] = [
    'Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Tiruppur','Vellore','Erode','Thoothukudi','Dindigul','Thanjavur','Hosur','Nagercoil','Avadi','Kancheepuram','Kumbakonam','Cuddalore','Karaikudi','Sivakasi','Ariyalur','Jayankondam','Varadarajanpettai','Udayarpalayam','Chengalpattu','Madurantakam','Mamallapuram','Tirukalukundram','Acharapakkam','Mettupalayam','Pollachi','Valparai','Annur','Karamadai','Sulur','Kinathukadavu','Chidambaram','Virudhachalam','Panruti','Nellikuppam','Parangipettai','Bhuvanagiri','Dharmapuri','Harur','Palacode','Pennagaram','Karimangalam','Palani','Kodaikanal','Oddanchatram','Nilakottai','Vedasandur','Batlagundu','Gobichettipalayam','Sathyamangalam','Bhavani','Perundurai','Anthiyur','Kallakurichi','Sankarapuram','Chinnasalem','Thiagadurgam','Sriperumbudur','Uthiramerur','Walajabad','Colachel','Kuzhithurai','Padmanabhapuram','Anjugramam','Tiruvannamalai','Tiruvannamalai District','Katpadi','Jolarpettai','Nagapattinam','Kanchipuram','Rameswaram','Villupuram','Gingee'
  ];

  // Compute available balance after reserving future rides' estimated totals
  const reservedForFuture = (futureRides || []).reduce((sum, r) => sum + Number((r as any).total_fare ?? 0), 0);
  const currentWallet = Number(dashboardData?.user_info?.wallet_balance ?? balance ?? 0);
  const availableBalance = Math.max(0, currentWallet - reservedForFuture);
  const canAcceptOrder = (order: PendingOrder) => {
    const chargesToDeduct = Number((order as any).charges_to_deduct ?? 0);
    const totalFare = Number(order.estimated_price ?? 0);
    // Use charges_to_deduct if available, otherwise fall back to total fare
    const amountToCheck = chargesToDeduct > 0 ? chargesToDeduct : totalFare;
    return availableBalance >= amountToCheck;
  };

  // Helper function to extract pickup and drop locations from the API response
  const getPickupDropLocations = (pickupDropLocation: any) => {
    if (!pickupDropLocation) return { pickup: 'Unknown', drop: '' };
    if (typeof pickupDropLocation === 'object') {
      // Numeric-key shape
      const has0 = Object.prototype.hasOwnProperty.call(pickupDropLocation, '0');
      const has1 = Object.prototype.hasOwnProperty.call(pickupDropLocation, '1');
      if (has0 && has1) {
        return { pickup: String(pickupDropLocation['0'] || 'Unknown'), drop: String(pickupDropLocation['1'] || '') };
      }
      if (has0) {
        return { pickup: String(pickupDropLocation['0'] || 'Unknown'), drop: '' };
      }
      // Named-key shape
      if (pickupDropLocation.pickup || pickupDropLocation.drop) {
        return { pickup: String(pickupDropLocation.pickup || 'Unknown'), drop: String(pickupDropLocation.drop || '') };
      }
    }
    return { pickup: 'Unknown', drop: '' };
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

  // Auto-load data when user is available after login
  useEffect(() => {
    if (user && !loading && !dashboardData) {
      console.log('🔄 User available, auto-loading dashboard data...');
      fetchData();
      fetchPendingOrdersData();
    }
  }, [user, loading, dashboardData]);

  // Also load data when user changes (login/logout)
  useEffect(() => {
    if (user) {
      console.log('👤 User changed, refreshing dashboard data...');
      fetchData();
      fetchPendingOrdersData();
      
      // Automatically send notification token on login (same as toggle ON)
      const sendNotificationTokenOnLogin = async () => {
        try {
          console.log('📱 Sending notification token on login...');
          await updateNotificationSettings({ 
            permission1: true, 
            permission2: true
          });
          console.log('✅ Notification token sent successfully on login');
        } catch (error) {
          console.warn('⚠️ Failed to send notification token on login:', error);
          // Don't block login if notification token sending fails
        }
      };
      
      sendNotificationTokenOnLogin();
    }
  }, [user?.id]); // Only trigger when user ID changes (login/logout)


  // Check for new orders and send notifications
  useEffect(() => {
    if (pendingOrders.length > 0 && previousOrderCount === 0) {
      // First time loading orders, just update count
      setPreviousOrderCount(pendingOrders.length);
    } else if (pendingOrders.length > previousOrderCount && previousOrderCount > 0) {
      // New orders received
          // New orders detected - notifications removed
      setPreviousOrderCount(pendingOrders.length);
    } else if (pendingOrders.length !== previousOrderCount) {
      // Update count if it changed
      setPreviousOrderCount(pendingOrders.length);
    }
  }, [pendingOrders, previousOrderCount]);

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

  // nearcity city list derived from pending orders (exclude 'ALL')
  const nearcityOptions = Array.from(
    new Set([
      ...MASTER_CITIES,
      ...pendingOrders
        .map(o => ((o.pick_near_city || o.near_city || '').trim()))
        .filter(city => city && city.toUpperCase() !== 'ALL')
    ])
  ).sort();

  // Replace SecureStore persistence with API fetching and updating
  useEffect(() => {
    // On mount/first render, fetch selected cities from server
    (async () => {
      try {
        // Only fetch if user is present (check user?.id)
        if (!user) return;
        const headers = await getAuthHeaders();
        const res = await axiosInstance.get('/api/cities/vehicle-owner/selected', { headers });
        const data = res.data;
        // The API returns: { "Chennai": true, "Vellore": true, ... }
        if (data && typeof data === 'object') {
          setSelectedCities(Object.entries(data)
            .filter(([_, v]: [any, any]) => v)
            .map(([city]) => city)
          );
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to fetch city selection: ' + String(e));
      }
    })();
  }, [user?.id]);

  // When city selection changes, send it to backend
  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        // Only update when not first mount
        if(!selectedCities) return;
        const headers = await getAuthHeaders();
        // POST/PUT is fine, backend will accept either
        await axiosInstance.post('/api/cities/vehicle-owner/selected', selectedCities, {
          headers,
        });
      } catch (e) {
        Alert.alert('Error', 'Failed to update city selection: ' + String(e));
      }
    })();
  }, [JSON.stringify(selectedCities), user?.id]);

  // Update toggleCitySelection to just update state (effect syncs to API)
  const toggleCitySelection = (city: string) => {
    setSelectedCities(prev => {
      const exists = prev.includes(city);
      if (exists) {
        return prev.filter(c => c !== city);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, city];
    });
  };

  const isTripTypenearcity = (t: any) => {
    const val = String(t || '').toLowerCase();
    return val.includes('multi'); // handles 'Multy City', 'nearcity', etc.
  };

  const getNearCity = (o: PendingOrder) => (o.pick_near_city || o.near_city || '').toUpperCase();
  const isNearCityMode = (o: PendingOrder) => String((o as any).send_to || '').toUpperCase() === 'NEAR_CITY';
  const hasCityTarget = (o: PendingOrder) => {
    const city = getNearCity(o);
    return city !== '' && city !== 'ALL';
  };

  // Bookings filter: above bookings list, show the selected cities as chips similar to above.
  {availableTab === 'nearcity' && selectedCities.length > 0 && (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 10, marginTop: 4 }}>
      {selectedCities.map(city => (
        <View key={city} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '22', borderRadius: 20, marginRight: 8, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ color: colors.primary, marginRight: 4 }}>{city}</Text>
          <TouchableOpacity onPress={() => setSelectedCities(selectedCities.filter(x => x !== city))}>
            <Text style={{ color: colors.error, fontWeight: '700', fontSize: 15 }}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )}

  // Enhanced debug version of parse/filter logic:
  const debugOrderMatch: Array<{order_id:number, pick_near_city:any, pickCitiesArr:string[], selectedCities:string[], didMatch:boolean}> = [];
  const filteredOrders: PendingOrder[] = (() => {
    if (!pendingOrders) return [];
    let orders = pendingOrders.filter(o => {
      const pickCitiesArr = parseCityListField(o.pick_near_city ? String(o.pick_near_city) : '');
      const isAll = pickCitiesArr.some(city => city.trim().toUpperCase() === 'ALL');
      let didMatch = false;
      
      // If "All" is selected in the city selector, show all orders
      if (selectAllCities) {
        didMatch = true;
      } 
      // If order has "ALL" in pick_near_city, always show it
      else if (isAll) {
        didMatch = true;
      } 
      // If specific cities are selected, check if order matches
      else if (selectedCities.length > 0) {
        didMatch = selectedCities.some(sel =>
          pickCitiesArr.some(pick => pick.trim().toLowerCase() === sel.trim().toLowerCase())
        );
      }
      // If no cities selected, show all orders
      else {
        didMatch = true;
      }
      
      debugOrderMatch.push({
        order_id: Number(o.order_id),
        pick_near_city: o.pick_near_city,
        pickCitiesArr,
        selectedCities: [...selectedCities],
        didMatch
      });
      return didMatch;
    });
    if (bookingSearch.trim()) {
      const searchTerm = bookingSearch.toLowerCase().trim();
      orders = orders.filter(o => {
        const locations = getPickupDropLocations(o.pickup_drop_location);
        return [
          String(o.order_id),
          locations.pickup,
          locations.drop
        ].some(field => field && String(field).toLowerCase().includes(searchTerm));
      });
    }
    return orders;
  })();

  // Tab counts
  const allTabCount = pendingOrders.filter(o => {
    const isMulti = isTripTypenearcity(o.trip_type) || isNearCityMode(o) || hasCityTarget(o);
    const pickCity = getNearCity(o);
    if (isMulti && pickCity !== 'ALL') return false;
    return true;
  }).length;
  
  // nearcity count should only show selected cities
  const multiTabCount = (() => {
    if (selectedCities.length === 0) return 0;
    const onlynearcity = pendingOrders.filter(o => isTripTypenearcity(o.trip_type) || isNearCityMode(o) || hasCityTarget(o));
    const setSel = new Set(selectedCities.map(c => c.toUpperCase()));
    return onlynearcity.filter(o => setSel.has(getNearCity(o))).length;
  })();

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Manual refresh triggered...');
      
      // Force refresh dashboard data to get latest cars and drivers
      await forceRefreshDashboardData();
      await refreshData();
      await fetchPendingOrdersData(); // Also refresh orders
      // Refresh wallet balance to reflect latest amount
      try { await refreshBalance(); } catch {}
      
      console.log('✅ Manual refresh completed successfully');
    } catch (error: any) {
      console.error('❌ Refresh failed:', error);
      
      // Handle authentication errors
      if (error.message?.includes('No authentication token found') || 
          error.message?.includes('Authentication failed') || 
          error.message?.includes('401')) {
        console.log('🔐 Authentication error detected, redirecting to login');
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
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
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 60,
    },
    menuButton: {
      padding: 8,
    },
    balanceContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginHorizontal: 4,
    },
    balanceAmount: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    testButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 20,
      minWidth: 90,
    },
    testButtonText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '600',
    },
    refreshButton: {
      padding: 6,
    },
    walletButton: {
      padding: 6,
    },
    warningBanner: {
      backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    warningText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: isDarkMode ? '#FCD34D' : '#92400E',
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
      marginTop: 10,
      marginBottom: 10,
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
    searchContainer: {
      marginBottom: 12,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
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
    termsButton: {
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      alignSelf: 'center',
    },
    termsButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
  });
  const handleAcceptBooking = (order: PendingOrder) => {
    if (processingOrderId && processingOrderId !== order.order_id.toString()) return;
    if (!canAcceptOrder(order)) {
      Alert.alert(
        'Insufficient Balance',
        'Not enough available balance after reserving for your future rides. Add money to accept this booking.',
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

  // Just-in-time order availability check (VO token)
  const isOrderFree = async (orderId: number): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const res = await axiosInstance.get(`/api/assignments/order/${orderId}`, { headers });
      const list = Array.isArray(res.data) ? res.data : [];
      const active = list.some((a: any) => a?.assignment_status && a.assignment_status !== 'CANCELLED');
      return !active;
    } catch (e) {
      console.warn('isOrderFree check failed', e);
      return false;
    }
  };

  const acceptBooking = async (order: PendingOrder) => {
    try {
      // Show loading state for this specific order
      setProcessingOrderId(order.order_id.toString());
      // Pre-check order availability just-in-time
      const free = await isOrderFree(Number(order.order_id));
      if (!free) {
        setPendingOrders(prev => prev.filter(o => o.order_id !== order.order_id));
        await fetchPendingOrdersData();
        Alert.alert('Order Already Taken', 'Refreshing orders...');
        return;
      }
      
      // Accept with VO token
      const headers = await getAuthHeaders();
      const acceptResponse = await axiosInstance.post('/api/assignments/acceptorder', { order_id: Number(order.order_id) }, { headers });

      if (acceptResponse && (acceptResponse.data?.success === true || acceptResponse.data?.id || acceptResponse.data)) {
        // Remove order from pending list
        setPendingOrders(prev => prev.filter(o => o.order_id !== order.order_id));
        await fetchPendingOrdersData();

        const locations = getPickupDropLocations(order.pickup_drop_location);
        
        // Get the assignment ID from the API response
        const assignmentId = acceptResponse.data?.id || acceptResponse.data?.assignment_id || `B${order.order_id}`;
        
        console.log('🔍 Accept order response data:', acceptResponse.data);
        console.log('🔍 Using assignment ID:', assignmentId);
        console.log('🔍 Original order ID:', order.order_id);
        
        const ride: FutureRide = {
          id: assignmentId, // Use the assignment ID as the main ID
          booking_id: `B${order.order_id}`, // Keep the B-prefixed booking ID
          assignment_id: assignmentId, // Set the assignment_id for assignment operations
          pickup: locations.pickup,
          drop: locations.drop,
          customer_name: order.customer_name,
          customer_mobile: order.customer_number,
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().slice(0,5),
          distance: order.trip_distance,
          fare_per_km: order.cost_per_km,
          total_fare: order.estimated_price,
          status: 'confirmed',
          assigned_driver: null,
          assigned_vehicle: null,
        };

        addFutureRide(ride);

        // Notification removed

        Alert.alert(
          'Booking Accepted',
          'Order accepted successfully! Check Future rides to assign the car.'
        );
      } else {
        console.log('❌ Accept order response:', acceptResponse);
        Alert.alert('Error', 'Failed to accept order. Please try again.');
        return;
      }
    } catch (error: any) {
      console.error('❌ Error accepting order:', error);
      const backendMsg = error?.response?.data?.detail || error?.response?.data?.message || '';

      // Treat backend "already has an active assignment" as already taken
      const alreadyTaken = (
        error?.message?.includes('already been accepted') ||
        error?.message?.includes('already assigned') ||
        error?.message?.includes('active assignment') ||
        backendMsg?.includes('already been accepted') ||
        backendMsg?.includes('already assigned') ||
        backendMsg?.includes('active assignment')
      );

      if (alreadyTaken) {
        Alert.alert(
          'Order Already Taken',
          'This order already has an active assignment. Refreshing available orders...',
          [
            {
              text: 'OK',
              onPress: () => {
                // Remove locally and refresh list
                setPendingOrders(prev => prev.filter(o => o.order_id !== order.order_id));
                fetchPendingOrdersData();
              }
            }
          ]
        );
      } else if (backendMsg?.toLowerCase?.().includes('insufficient balance')) {
        Alert.alert('Insufficient Balance', 'Please top up your wallet.');
      } else {
        Alert.alert('Error', backendMsg || error.message || 'Failed to accept order. Please try again.');
      }
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }
  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={[dynamicStyles.header, { justifyContent: 'space-between', alignItems: 'center' }]}>
  <TouchableOpacity onPress={() => setShowDrawer(true)} style={dynamicStyles.menuButton}>
    <Menu color={colors.text} size={24} />
  </TouchableOpacity>
  <Text style={{ fontSize: 18, fontFamily: 'Inter-Bold', color: colors.text, flex: 1, textAlign: 'center' }}>
    Hi! {dashboardData?.user_info?.full_name || user?.fullName || 'Vehicle Owner'}
  </Text>
  <TouchableOpacity
    style={{ padding: 6, flexDirection: 'row', alignItems: 'center', minWidth: 120, justifyContent: 'flex-end' }}
    onPress={() => router.push('/(tabs)/wallet')}
  >
    <Text style={{ fontSize: 18, color: colors.primary, fontFamily: 'Inter-Bold' }}>₹{Math.round(Number(dashboardData?.user_info?.wallet_balance || balance || 0))}</Text>
          <Text style={{ fontSize: 15, color:'rgb(15, 187, 35)', fontFamily: 'Inter-SemiBold', marginLeft: 8 }}>| Add money</Text>
  </TouchableOpacity>
</View>
      {currentWallet < 1000 && (
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
              <View style={dynamicStyles.bookingsSection}>
                <Text style={dynamicStyles.sectionTitle}>Available Bookings</Text>
              
              {/* Select City Button */}
                <TouchableOpacity
                  onPress={() => setShowCityModal(true)}
                  style={{
                    backgroundColor: colors.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                    borderRadius: 8,
                  marginBottom: 12,
                  alignItems: 'center',
                  width: '100%',
                  }}
                >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Select City to Receive Bookings</Text>
              </TouchableOpacity>

              {/* Selected Cities Display */}
              {(selectAllCities || selectedCities.length > 0) && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                  {selectAllCities && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '22', borderRadius: 20, marginRight: 8, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 5 }}>
                      <Text style={{ color: colors.primary, marginRight: 4, fontWeight: '600' }}>All</Text>
                      <TouchableOpacity onPress={() => {
                        setSelectAllCities(false);
                        setSelectedCities([]);
                      }}>
                        <Text style={{ color: colors.error, fontWeight: '700', fontSize: 15 }}>✕</Text>
                </TouchableOpacity>
              </View>
                  )}
                  {selectedCities.map(city => (
                    <View key={city} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '22', borderRadius: 20, marginRight: 8, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 5 }}>
                      <Text style={{ color: colors.primary, marginRight: 4, fontWeight: '600' }}>{city}</Text>
                      <TouchableOpacity onPress={() => setSelectedCities(selectedCities.filter(x => x !== city))}>
                        <Text style={{ color: colors.error, fontWeight: '700', fontSize: 15 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            
              {/* City Selection Modal */}
              <Modal visible={showCityModal} transparent animationType="fade">
                <View style={{
                  flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center'
                }}>
                  <View style={{ backgroundColor: colors.surface, padding: 18, borderRadius: 12, width: 320, maxHeight: '80%' }}>
                    {/* Header with title and close button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <Text style={{ fontWeight: '700', fontSize: 17, color: colors.text, flex: 1 }}>Select City to Receive Bookings</Text>
                      <TouchableOpacity onPress={() => setShowCityModal(false)} style={{ padding: 4 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 20, fontWeight: 'bold' }}>×</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Search Field */}
                    <TextInput
                      style={[dynamicStyles.searchInput, { marginBottom: 10 }]}
                      value={citySearch}
                      onChangeText={setCitySearch}
                      placeholder="Search City..."
                      placeholderTextColor={colors.textSecondary}
                    />
                    
                    {/* All checkbox */}
                    <TouchableOpacity
                      onPress={() => {
                        if (selectAllCities) {
                          setSelectAllCities(false);
                          setSelectedCities([]);
                        } else {
                          setSelectAllCities(true);
                          setSelectedCities([]);
                        }
                      }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 4,
                        marginBottom: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderWidth: 2,
                        borderColor: selectAllCities ? colors.primary : colors.border,
                        backgroundColor: selectAllCities ? colors.primary : 'transparent',
                        borderRadius: 4,
                        marginRight: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {selectAllCities && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                      </View>
                      <Text style={{ color: selectAllCities ? colors.primary : colors.text, fontWeight: selectAllCities ? '700' : '400', fontSize: 16 }}>All</Text>
                    </TouchableOpacity>

                    {/* Chips for selected cities */}
                    {selectedCities.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 10 }}>
                        {selectedCities.map(city => (
                          <View key={city} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '22', borderRadius: 20, marginRight: 8, paddingHorizontal: 12, paddingVertical: 5 }}>
                            <Text style={{ color: colors.primary, marginRight: 4 }}>{city}</Text>
                            <TouchableOpacity onPress={() => setSelectedCities(selectedCities.filter(x => x !== city))}>
                              <Text style={{ color: colors.error, fontWeight: '700', fontSize: 15 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                        ))}
                      </ScrollView>
              )}
            
                    {/* Selectable city list */}
                    <ScrollView style={{ maxHeight: 220 }}>
                      {MASTER_CITIES.filter(city => city.toLowerCase().includes(citySearch.toLowerCase()))
                        .map(city => {
                          const isSelected = selectAllCities || selectedCities.includes(city);
                          return (
                        <TouchableOpacity
                          key={city}
                          onPress={() => {
                                if (selectAllCities) {
                                  // If All is selected, deselect it and select this city
                                  setSelectAllCities(false);
                                  setSelectedCities([city]);
                                } else if (selectedCities.includes(city)) {
                                  setSelectedCities(selectedCities.filter(c => c !== city));
                                } else {
                                  setSelectedCities([...selectedCities, city]);
                                }
                          }}
                          style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            paddingVertical: 9,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                              }}>
                              <View style={{
                                width: 20,
                                height: 20,
                                borderWidth: 2,
                                borderColor: isSelected ? colors.primary : colors.border,
                                backgroundColor: isSelected ? colors.primary : 'transparent',
                                borderRadius: 4,
                                marginRight: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {isSelected && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                              </View>
                              <Text style={{ color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '400', fontSize: 16 }}>{city}</Text>
                        </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                    <TouchableOpacity
                      onPress={() => setShowCityModal(false)}
                      style={{ marginTop: 16, alignSelf: 'flex-end' }}
                    >
                      <Text style={{ color: 'rgb(15, 187, 35)', fontWeight: '700', fontSize: 15 }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            
              {/* Search Input */}
              <View style={dynamicStyles.searchContainer}>
                <TextInput
                  style={dynamicStyles.searchInput}
                  placeholder="Search by ID, from city, or to city..."
                  placeholderTextColor={colors.textSecondary}
                  value={bookingSearch}
                  onChangeText={setBookingSearch}
                />
              </View>
            
              {/* Bookings list */}
              {ordersLoading ? (
                <View style={dynamicStyles.loadingContainer}>
                  <Text style={dynamicStyles.loadingText}>Loading pending orders...</Text>
                </View>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                    const locations = getPickupDropLocations(order.pickup_drop_location);
                    return (
                      <BookingCard
                        key={order.order_id}
                        booking={{
                          order_id: Number(order.order_id),
                          pickup: locations.pickup,
                          drop: locations.drop,
                          customer_name: undefined as any,
                          customer_number: undefined as any,
                          estimated_price: Number(order.estimated_price),
                          trip_distance: Number(order.trip_distance ?? 0),
                          fare_per_km: Number(order.cost_per_km ?? 0),
                          car_type: String(order.car_type || ''),
                          trip_type: String(order.trip_type || ''),
                          pick_near_city: String((order as any).pick_near_city || (order as any).near_city || ''),
                          start_date_time: String(order.start_date_time || ''),
                          trip_time: String(((order as any).trip_time) || ''),
                          created_at: String((order as any).created_at || ''),
                          max_time_to_assign_order: String((order as any).max_time_to_assign_order || ''),
                          expires_at: String((order as any).expires_at || ''),
                          charges_to_deduct: Number((order as any).charges_to_deduct || 0),
                          pickup_notes: String((order as any).pickup_notes || ''),
                          pickup_drop_location: order.pickup_drop_location, // Pass raw location for multicity parsing
                        }}
                        onAccept={() => handleAcceptBooking(order)}
                        disabled={!canAcceptOrder(order) || processingOrderId === order.order_id.toString()}
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
          </>
        )}
      </ScrollView>
      {/* DrawerNavigation must be rendered outside ScrollView */}
      <DrawerNavigation 
        visible={showDrawer} 
        onClose={() => setShowDrawer(false)} 
      />
    </SafeAreaView>
  );
}