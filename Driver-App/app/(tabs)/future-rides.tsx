import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; 
import { useDashboard, FutureRide } from '@/contexts/DashboardContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { MapPin, Clock, IndianRupee, User, Phone, Car, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import { RefreshControl } from 'react-native';
import { fetchAvailableDrivers, fetchAvailableCars, getOrderAssignments, assignCarDriverToOrder, AvailableDriver, AvailableCar } from '@/services/orders/assignmentService';
import { getPendingOrders as getVOPendingOrders, getFutureRidesForVehicleOwner } from '@/services/vehicle/vehicleOwnerService';

// Removed local interface - using imported FutureRide from DashboardContext

// Removed sample data; now reads from shared context

export default function FutureRidesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { dashboardData, loading, error, futureRides, updateFutureRide, refreshData } = useDashboard();
  const { sendOrderAssignedNotification } = useNotifications();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<FutureRide | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<AvailableDriver | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [pendingOrdersLoading, setPendingOrdersLoading] = useState(false);
  const [apiFutureRides, setApiFutureRides] = useState<FutureRide[]>([]);
  const [apiRidesLoading, setApiRidesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Combine context rides and API rides, dedupe by id (fallback to booking_id)
  const uniqueRides = useMemo(() => {
    const rideMap = new Map<string, FutureRide>();
    
    // Add context rides first
    for (const ride of futureRides) {
      const key = ride.id || ride.booking_id;
      if (!rideMap.has(key)) {
        rideMap.set(key, ride);
      }
    }
    
    // Add API rides (these will override context rides if they have the same key)
    for (const ride of apiFutureRides) {
      const key = ride.id || ride.booking_id;
      rideMap.set(key, ride);
    }
    
    return Array.from(rideMap.values());
  }, [futureRides, apiFutureRides]);

  // Auto-fetch on mount and when dashboard data loads
  useEffect(() => {
    if (dashboardData && !loading) {
      fetchAvailableAssignments();
      fetchFutureRidesFromAPI();
    }
  }, [dashboardData, loading]);

  const fetchFutureRidesFromAPI = async () => {
    try {
      setApiRidesLoading(true);

      // Fetch via VO endpoint using token-sub-decoded owner ID
      const apiRides = await getFutureRidesForVehicleOwner();
      const ridesArray = Array.isArray(apiRides) ? apiRides : [];

      const processedRides: FutureRide[] = ridesArray.map((ride: any) => ({
        id: ride.id?.toString?.() || ride.assignment_id?.toString?.() || ride.booking_id?.toString?.(),
        booking_id: ride.booking_id?.toString?.() || ride.order_id?.toString?.() || ride.id?.toString?.(),
        pickup: ride.pickup || ride.pickup_city || ride.pickup_location || 'Unknown',
        drop: ride.drop || ride.drop_city || ride.drop_location || 'Unknown',
        date: ride.date || ride.created_at?.slice?.(0,10) || '',
        time: ride.time || ride.created_at?.slice?.(11,16) || '',
        distance: typeof ride.trip_distance === 'string' ? parseFloat(ride.trip_distance) || 0 : (ride.trip_distance || 0),
        fare_per_km: typeof ride.cost_per_km === 'string' ? parseFloat(ride.cost_per_km) || 0 : (ride.cost_per_km || 0),
        total_fare: typeof ride.estimated_price === 'string' ? parseFloat(ride.estimated_price) || 0 : (ride.estimated_price || 0),
        customer_name: ride.customer_name || '',
        customer_mobile: ride.customer_number || '',
        status: ride.assignment_status || ride.status || 'confirmed',
        assigned_driver: ride.assigned_driver || null,
        assigned_vehicle: ride.assigned_vehicle || null,
        assignment_id: ride.assignment_id || ride.id,
        expires_at: ride.expires_at,
        created_at: ride.created_at
      } as any));

      console.log('📋 Future rides loaded (VO):', processedRides.length);
      setApiFutureRides(processedRides);

    } catch (error) {
      console.error('❌ Failed to fetch future rides from API:', error);
      setApiFutureRides([]);
    } finally {
      setApiRidesLoading(false);
    }
  };
  

  const fetchPendingOrders = async () => {
    try {
      setPendingOrdersLoading(true);
      console.log('📋 Fetching pending orders...');
      
      const orders = await getVOPendingOrders();
      console.log('📋 Raw pending orders:', orders);
      
      // Check assignment status for each order
      const ordersWithAssignmentStatus = await Promise.all(
        orders.map(async (order) => {
          try {
            const assignments = await getOrderAssignments(String(order.id || order.order_id));
            const hasAssignedStatus = assignments.some(assignment => 
              assignment.assignment_status === 'ASSIGNED' || 
              assignment.assignment_status === 'DRIVING' || 
              assignment.assignment_status === 'COMPLETED'
            );
            
            return {
              ...order,
              isAssigned: hasAssignedStatus,
              assignments: assignments
            };
          } catch (error) {
            console.error('❌ Failed to check assignment status for order:', order.id, error);
            return {
              ...order,
              isAssigned: false,
              assignments: []
            };
          }
        })
      );
      
      console.log('📋 Orders with assignment status:', ordersWithAssignmentStatus);
      setPendingOrders(ordersWithAssignmentStatus);
    } catch (error) {
      console.error('❌ Failed to fetch pending orders:', error);
      setPendingOrders([]);
    } finally {
      setPendingOrdersLoading(false);
    }
  };

  const fetchAvailableAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      console.log('🔍 Fetching available drivers and cars for assignments...');
      
      // Fetch both drivers and cars in parallel
      const [drivers, cars] = await Promise.all([
        fetchAvailableDrivers(),
        fetchAvailableCars()
      ]);
      
      console.log('🔍 Raw drivers from API:', drivers);
      console.log('🔍 Dashboard drivers for comparison:', dashboardData?.drivers);
      
      // Process drivers to ensure they're marked as available
      const processedDrivers = drivers.map(driver => ({
        ...driver,
        is_available: true, // Mark all fetched drivers as available
        current_assignment: undefined
      }));
      
      // Process cars to ensure they're marked as available
      const processedCars = cars.map(car => ({
        ...car,
        is_available: true, // Mark all fetched cars as available
        current_assignment: undefined
      }));
      
      setAvailableDrivers(processedDrivers);
      setAvailableCars(processedCars);
      
      console.log('✅ Available assignments loaded:', {
        drivers: processedDrivers.length,
        cars: processedCars.length
      });
      
      // Debug: Log driver availability details
      console.log('🔍 Driver availability details:', processedDrivers.map(d => ({
        id: d.id,
        name: d.full_name,
        status: d.status,
        is_available: d.is_available,
        driver_status: d.driver_status
      })));
    } catch (error) {
      console.error('❌ Failed to fetch available assignments:', error);
      // Fallback to dashboard data if assignment endpoints fail
      // Convert dashboard data to assignment format
      const fallbackDrivers: AvailableDriver[] = (dashboardData?.drivers || [])
        .filter(driver => {
          // Include all drivers regardless of status - let the assignment logic handle availability
          const status = driver.driver_status;
          return status !== 'OFFLINE' && status !== 'INACTIVE'; // Only exclude explicitly offline/inactive drivers
        })
        .map(driver => ({
          ...driver,
          address: driver.adress, // Map adress to address
          aadhar_number: driver.licence_number, // Map licence_number to aadhar_number
          status: driver.driver_status, // Map driver_status to status
          updated_at: driver.created_at, // Use created_at as updated_at fallback
          is_available: true, // Always show as available for assignment
          current_assignment: undefined
        }));
      
      const fallbackCars: AvailableCar[] = (dashboardData?.cars || [])
        .filter(car => {
          // Check if car has a status property (from API) or assume it's available
          const carStatus = (car as any).car_status || (car as any).status;
          return !carStatus || carStatus === 'ONLINE' || carStatus === 'PROCESSING' || carStatus === 'ACTIVE';
        })
        .map(car => ({
          ...car,
          is_available: true, // Assume available as fallback
          current_assignment: undefined
        }));
      
      setAvailableDrivers(fallbackDrivers);
      setAvailableCars(fallbackCars);
      
      // Debug: Log fallback driver availability details
      console.log('🔍 Fallback driver availability details:', fallbackDrivers.map(d => ({
        id: d.id,
        name: d.full_name,
        status: d.status,
        is_available: d.is_available,
        driver_status: d.driver_status
      })));
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing future rides data...');
      await Promise.all([
        fetchAvailableAssignments(),
        fetchFutureRidesFromAPI(),
        fetchPendingOrders()
      ]);
      
      // Also refresh dashboard data to get latest future rides
      if (refreshData) {
        await refreshData();
      }
      
      console.log('✅ Future rides data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing future rides data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Removed quick ID generation - drivers use their passwords instead

  const selectDriver = (driver: AvailableDriver) => {
    setSelectedDriver(driver);
    setShowAssignModal(false);
    setShowVehicleModal(true);
  };

  const assignVehicle = async (vehicle: AvailableCar) => {
    if (!selectedRide || !selectedDriver) return;
    
    try {
      console.log('🔗 Creating assignment for order:', selectedRide.booking_id);
      console.log('👤 Selected Driver:', {
        id: selectedDriver.id,
        name: selectedDriver.full_name,
        mobile: selectedDriver.primary_number
      });
      console.log('🚗 Selected Vehicle:', {
        id: vehicle.id,
        name: vehicle.car_name,
        number: vehicle.car_number
      });
      
      // Validate that we have valid IDs
      if (!selectedDriver.id || selectedDriver.id === 'undefined' || selectedDriver.id === 'null') {
        Alert.alert(
          'Invalid Driver',
          'Please select a valid driver before assigning the vehicle.',
          [{ text: 'OK' }]
        );
        return;
      }
      if (!vehicle.id || vehicle.id === 'undefined' || vehicle.id === 'null') {
        Alert.alert(
          'Invalid Vehicle',
          'Please select a valid vehicle before proceeding.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Check if order is already assigned
      try {
        const existingAssignments = await getOrderAssignments(selectedRide.booking_id);
        
        if (existingAssignments && existingAssignments.length > 0) {
          const assignedOrder = existingAssignments.find(assignment => 
            assignment.assignment_status === 'ASSIGNED' || 
            assignment.assignment_status === 'DRIVING' || 
            assignment.assignment_status === 'COMPLETED'
          );
          
          if (assignedOrder) {
            Alert.alert(
              'Order Already Assigned',
              `This order is already assigned to:\n\nDriver: ${assignedOrder.driver_id}\nCar: ${assignedOrder.car_id}\nStatus: ${assignedOrder.assignment_status}\n\nPlease refresh the list to see updated assignments.`,
              [
                { text: 'OK' },
                { 
                  text: 'Refresh', 
                  onPress: () => {
                    fetchFutureRidesFromAPI();
                  }
                }
              ]
            );
            return;
          }
        }
      } catch (checkError: any) {
        // Proceed anyway if check fails
      }
      
      // Use the new API endpoint for assigning driver and car
      // Use assignment_id from the ride (this is the assignment ID from the database)
      const assignmentId = selectedRide.assignment_id || selectedRide.booking_id || selectedRide.id;
      console.log('🔗 Using assignment ID for assignment:', assignmentId);
      
      const assignment = await assignCarDriverToOrder(
        assignmentId,
        selectedDriver.id,
        vehicle.id
      );
      
      console.log('✅ Assignment created successfully:', assignment);
      
      // Update the ride with assignment details
      const updatedRide: FutureRide = {
        ...selectedRide,
        assigned_driver: { ...selectedDriver },
        assigned_vehicle: vehicle,
        status: 'assigned',
      };

      // Update both context and API state
      updateFutureRide(updatedRide);
      
      // Update the API rides state
      setApiFutureRides(prevRides => 
        prevRides.map(ride => 
          ride.id === selectedRide.id ? updatedRide : ride
        )
      );
      
      setShowAssignModal(false);
      setShowVehicleModal(false);
      setSelectedRide(null);
      setSelectedDriver(null);
      
      // Send notification for order assignment
      sendOrderAssignedNotification({
        orderId: selectedRide.booking_id,
        pickup: selectedRide.pickup,
        drop: selectedRide.drop,
        customerName: selectedRide.customer_name,
        customerMobile: selectedRide.customer_mobile,
        distance: selectedRide.distance,
        fare: selectedRide.total_fare,
        orderType: 'assigned'
      });
      
      Alert.alert(
        'Assignment Complete',
        `Driver: ${selectedDriver.full_name}\nVehicle: ${vehicle.car_name} (${vehicle.car_number})\nTrip: ${selectedRide.booking_id}\n\nMobile: ${selectedDriver.primary_number}\n\nThe driver can now login using their registered password.`
      );
      
      // Refresh available assignments and future rides
      await fetchAvailableAssignments();
      await fetchFutureRidesFromAPI();
      
    } catch (error: any) {
      console.error('❌ Assignment failed:', error);
      
      let errorMessage = 'Failed to assign driver and vehicle.\n\n';
      let errorTitle = 'Assignment Failed';
      
      if (error.message.includes('already assigned')) {
        errorTitle = 'Order Already Assigned';
        errorMessage = `This order is already assigned to another driver and car.\n\n${error.message}\n\nPlease refresh the list to see updated assignments.`;
      } else if (error.message.includes('Invalid driver ID')) {
        errorTitle = 'Invalid Driver';
        errorMessage = 'The selected driver is invalid. Please select a different driver.';
      } else if (error.message.includes('Invalid car ID')) {
        errorTitle = 'Invalid Vehicle';
        errorMessage = 'The selected vehicle is invalid. Please select a different vehicle.';
      } else if (error.message.includes('Authentication failed')) {
        errorTitle = 'Authentication Error';
        errorMessage = 'Your session has expired. Please login again.';
      } else if (error.message.includes('Order not found')) {
        errorTitle = 'Order Not Found';
        errorMessage = 'This order no longer exists. Please refresh the list.';
      } else if (error.message.includes('Server error')) {
        errorTitle = 'Server Error';
        errorMessage = 'Server is temporarily unavailable. Please try again later.';
      } else {
        errorMessage += `Error: ${error.message}\n\nPlease check your connection and try again.`;
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'OK' },
          { 
            text: 'Refresh', 
            onPress: () => {
              fetchFutureRidesFromAPI();
            }
          }
        ]
      );
    }
  };

  const handleCloseModal = () => {
    setShowAssignModal(false);
    setShowVehicleModal(false);
    setSelectedRide(null);
    setSelectedDriver(null);
  };

  const openAssignmentModal = (ride: FutureRide) => {
    setSelectedRide(ride);
    setShowAssignModal(true);
  };

  const getAvailabilityStatus = (isAvailable: boolean) => {
    return isAvailable ? (
      <View style={[dynamicStyles.availabilityBadge, { backgroundColor: '#10B981' }]}>
        <CheckCircle color="#FFFFFF" size={12} />
        <Text style={dynamicStyles.availabilityText}>Available</Text>
      </View>
    ) : (
      <View style={[dynamicStyles.availabilityBadge, { backgroundColor: '#EF4444' }]}>
        <AlertCircle color="#FFFFFF" size={12} />
        <Text style={dynamicStyles.availabilityText}>Unavailable</Text>
      </View>
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
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 4,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    rideCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    rideHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    bookingId: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    statusBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    assignedBadge: {
      backgroundColor: colors.success,
    },
    routeContainer: {
      marginBottom: 12,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    routeText: {
      marginLeft: 8,
      fontSize: 14,
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
    rideDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      marginLeft: 4,
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    customerInfo: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      marginBottom: 12,
    },
    customerName: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    customerMobile: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginTop: 2,
    },
    assignButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    assignButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
    assignedInfo: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
    },
    assignedText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    driverCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    driverInfo: {
      flex: 1,
    },
    driverName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    driverMobile: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 2,
    },
    selectButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    selectButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
    },
    noDriversContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginBottom: 12,
    },
    noDriversText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    noDriversSubtext: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    errorText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
    availabilityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 4,
    },
    availabilityText: {
      marginLeft: 4,
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
    },
    selectButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.6,
    },
    selectButtonTextDisabled: {
      color: colors.textSecondary,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>Loading future rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={dynamicStyles.container}>
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={dynamicStyles.retryButton}>
            <Text style={dynamicStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const RideCard = ({ ride }: { ride: FutureRide }) => {
    // Use the same robust mapping as BookingCard
    const toNumber = (v: any): number => {
      if (v === null || v === undefined || v === '') return 0;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const safePickLoc = (v: any): Record<string, string> => {
      if (!v) return {};
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return {}; }
      }
      return v;
    };

    // Derive fields robustly in case parent passes raw VO pending order
    const loc = safePickLoc((ride as any).pickup_drop_location);
    const cities = Object.values(loc || {});
    const pickup = ride.pickup || String(cities[0] ?? '');
    const drop = ride.drop || String(cities[1] ?? '');

    const displayPrice = toNumber((ride as any).estimated_price ?? (ride as any).vendor_price ?? ride.total_fare);
    const customerNumber = (ride as any).customer_number || (ride as any).customer_mobile || ride.customer_mobile || '';
    const orderId = (ride as any).order_id || ride.booking_id || ride.id;
    const tripDistance = toNumber((ride as any).trip_distance ?? ride.distance);
    const farePerKm = toNumber((ride as any).fare_per_km ?? ride.fare_per_km);

    return (
      <View style={dynamicStyles.rideCard}>
        <View style={dynamicStyles.rideHeader}>
          <Text style={dynamicStyles.bookingId}>#{orderId}</Text>
          <View style={[
            dynamicStyles.statusBadge,
            ride.status === 'assigned' && dynamicStyles.assignedBadge,
            ride.status === 'pending_assignment' && { backgroundColor: colors.warning }
          ]}>
            <Text style={dynamicStyles.statusText}>
              {ride.status === 'assigned' ? 'ASSIGNED' : 
               ride.status === 'pending_assignment' ? 'PENDING ASSIGNMENT' : 'CONFIRMED'}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.routeContainer}>
          <View style={dynamicStyles.routeRow}>
            <MapPin color={colors.success} size={16} />
            <Text style={dynamicStyles.routeText}>{pickup}</Text>
          </View>
          <View style={dynamicStyles.routeLine} />
          <View style={dynamicStyles.routeRow}>
            <MapPin color={colors.error} size={16} />
            <Text style={dynamicStyles.routeText}>{drop}</Text>
          </View>
        </View>

        <View style={dynamicStyles.rideDetails}>
          <View style={dynamicStyles.detailRow}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>{ride.date} at {ride.time}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Car color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>{tripDistance} km</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <IndianRupee color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>₹{displayPrice}</Text>
          </View>
          {farePerKm > 0 && (
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailText}>₹{farePerKm}/km</Text>
            </View>
          )}
        </View>

        <View style={dynamicStyles.customerInfo}>
          <Text style={dynamicStyles.customerName}>{ride.customer_name}</Text>
          {customerNumber && (
            <Text style={dynamicStyles.customerMobile}>{customerNumber}</Text>
          )}
        </View>

        {ride.assigned_driver && ride.assigned_vehicle ? (
          <View style={dynamicStyles.assignedInfo}>
            <Text style={dynamicStyles.assignedText}>
              Driver: {ride.assigned_driver.full_name || ride.assigned_driver.name} ({ride.assigned_driver.primary_number || ride.assigned_driver.mobile})
            </Text>
            <Text style={dynamicStyles.assignedText}>
              Vehicle: {ride.assigned_vehicle.car_name} ({ride.assigned_vehicle.car_number})
            </Text>
          </View>
        ) : ride.status === 'pending_assignment' ? (
          <TouchableOpacity 
            style={[dynamicStyles.assignButton, { backgroundColor: colors.warning }]}
            onPress={() => openAssignmentModal(ride)}
          >
            <Text style={dynamicStyles.assignButtonText}>Assign Driver & Vehicle</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={dynamicStyles.assignButton}
            onPress={() => openAssignmentModal(ride)}
          >
            <Text style={dynamicStyles.assignButtonText}>Assign Driver & Vehicle</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Future Rides</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Welcome back, {dashboardData?.user_info?.full_name || user?.fullName || 'Driver'}! • {uniqueRides.length} upcoming bookings
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity 
            style={[dynamicStyles.assignButton, { flex: 1, backgroundColor: colors.warning }]}
            onPress={handleRefresh}
          >
            <Text style={dynamicStyles.assignButtonText}>Refresh All Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={dynamicStyles.content} 
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
        {apiRidesLoading ? (
          <View style={dynamicStyles.loadingContainer}>
            <Text style={dynamicStyles.loadingText}>Loading future rides from API...</Text>
          </View>
        ) : uniqueRides.length > 0 ? (
          uniqueRides.map((ride) => (
            <RideCard key={ride.id || ride.booking_id} ride={ride} />
          ))
        ) : (
          <View style={dynamicStyles.loadingContainer}>
            <Text style={dynamicStyles.loadingText}>No future rides available</Text>
            <Text style={[dynamicStyles.loadingText, { fontSize: 14, marginTop: 8 }]}>
              Use the "Refresh Future Rides" button to load assignments from the API
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Assign Driver</Text>
              <TouchableOpacity 
                onPress={handleCloseModal}
                style={dynamicStyles.closeButton}
              >
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {assignmentsLoading ? (
                <View style={dynamicStyles.loadingContainer}>
                  <Text style={dynamicStyles.loadingText}>Loading available drivers...</Text>
                </View>
              ) : availableDrivers.length > 0 ? (
                availableDrivers.map((driver) => (
                  <View key={driver.id} style={dynamicStyles.driverCard}>
                    <View style={dynamicStyles.driverInfo}>
                      <Text style={dynamicStyles.driverName}>{driver.full_name}</Text>
                      <Text style={dynamicStyles.driverMobile}>{driver.primary_number}</Text>
                      {getAvailabilityStatus(driver.is_available)}
                    </View>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.selectButton,
                        !driver.is_available && dynamicStyles.selectButtonDisabled
                      ]}
                      onPress={() => selectDriver(driver)}
                      disabled={!driver.is_available}
                    >
                      <Text style={[
                        dynamicStyles.selectButtonText,
                        !driver.is_available && dynamicStyles.selectButtonTextDisabled
                      ]}>
                        {driver.is_available ? 'Select' : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={dynamicStyles.noDriversContainer}>
                  <User color={colors.textSecondary} size={32} />
                  <Text style={dynamicStyles.noDriversText}>No Drivers Available</Text>
                  <Text style={dynamicStyles.noDriversSubtext}>
                    Add drivers to your account first to assign them to rides
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showVehicleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Select Vehicle</Text>
              <TouchableOpacity 
                onPress={handleCloseModal}
                style={dynamicStyles.closeButton}
              >
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {assignmentsLoading ? (
                <View style={dynamicStyles.loadingContainer}>
                  <Text style={dynamicStyles.loadingText}>Loading available vehicles...</Text>
                </View>
              ) : availableCars.length > 0 ? (
                availableCars.map((car) => (
                  <View key={car.id} style={dynamicStyles.driverCard}>
                    <View style={dynamicStyles.driverInfo}>
                      <Text style={dynamicStyles.driverName}>{car.car_name}</Text>
                      <Text style={dynamicStyles.driverMobile}>{car.car_number}</Text>
                      {getAvailabilityStatus(car.is_available)}
                    </View>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.selectButton,
                        !car.is_available && dynamicStyles.selectButtonDisabled
                      ]}
                      onPress={() => assignVehicle(car)}
                      disabled={!car.is_available}
                    >
                      <Text style={[
                        dynamicStyles.selectButtonText,
                        !car.is_available && dynamicStyles.selectButtonTextDisabled
                      ]}>
                        {car.is_available ? 'Select' : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={dynamicStyles.noDriversContainer}>
                  <Car color={colors.textSecondary} size={32} />
                  <Text style={dynamicStyles.noDriversText}>No Vehicles Available</Text>
                  <Text style={dynamicStyles.noDriversSubtext}>
                    Add vehicles to your account first to assign them to rides
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}