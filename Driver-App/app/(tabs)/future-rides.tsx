import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; 
import { useNotifications } from '@/contexts/NotificationContext';
import { MapPin, Clock, IndianRupee, User, Phone, Car, RefreshCw, UserPlus, X, CheckCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';
import { RefreshControl } from 'react-native';
import axiosInstance from '@/app/api/axiosInstance';
import { fetchAvailableDrivers, assignCarDriverToOrder, AvailableDriver, AvailableCar } from '@/services/orders/assignmentService';

// Simple interface for the new API response
interface FutureRide {
  id: number;
  source: string;
  source_order_id: number;
  vendor_id: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: {
    "0": string;
    "1": string;
  };
  start_date_time: string;
  customer_name: string;
  customer_number: string;
  trip_status: string;
  pick_near_city: string;
  trip_distance: number;
  trip_time: string;
  estimated_price: number;
  vendor_price: number;
  platform_fees_percent: number;
  closed_vendor_price: number | null;
  closed_driver_price: number | null;
  commision_amount: number | null;
  created_at: string;
  assignment_id: number;
  assignment_status: string;
  assigned_at: string | null;
  expires_at: string;
  max_time_to_assign_order?: string;
  cancelled_at: string | null;
  completed_at: string | null;
  assignment_created_at: string;
  vendor_name: string;
  vendor_phone: string;
  assigned_driver_name: string | null;
  assigned_driver_phone: string | null;
  assigned_car_name: string | null;
  assigned_car_number: string | null;
  pickup_notes?: string;
}

export default function FutureRidesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { } = useNotifications();
  const [futureRides, setFutureRides] = useState<FutureRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // global tick to refresh countdowns
  const [tick, setTick] = useState(0);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Assignment modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<FutureRide | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<AvailableDriver | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Simple API fetch function
  const fetchFutureRides = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching future rides from /api/orders/vehicle-owner/pending...');

      const response = await axiosInstance.get('/api/orders/vehicle-owner/pending');
      const ridesArray = Array.isArray(response.data) ? response.data : [];

      console.log('✅ Future rides fetched successfully:', ridesArray.length, 'rides');
      setFutureRides(ridesArray);
    } catch (error: any) {
      console.error('❌ Failed to fetch future rides:', error);
      setError(error.message || 'Failed to fetch future rides');
    } finally {
      setLoading(false);
    }
  };

  // Simple search state
  const [search, setSearch] = useState('');
  const normalized = (s: string) => String(s || '').toLowerCase();
  const filteredFutureRides = futureRides.filter((r) => {
    const q = normalized(search);
    if (!q) return true;
    
    // Get pickup and drop locations
    const pickupLocation = r.pickup_drop_location?.["0"] || '';
    const dropLocation = r.pickup_drop_location?.["1"] || '';
    
    return [
      r.id,
      r.source_order_id,
      r.customer_name,
      r.customer_number,
      r.trip_type,
      r.car_type,
      r.pick_near_city,
      r.start_date_time,
      r.trip_time,
      r.source,
      pickupLocation,
      dropLocation,
    ].some((v: any) => normalized(v).includes(q));
  });

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFutureRides();
    setRefreshing(false);
  };

  // Auto-load data when user is available
  useEffect(() => {
    if (user) {
      console.log('🔄 Auto-loading future rides data...');
      fetchFutureRides();
    }
  }, [user]);

  // Also load data when user changes (login/logout)
  useEffect(() => {
    if (user) {
      console.log('👤 User changed, refreshing future rides data...');
      fetchFutureRides();
    }
  }, [user?.id]);

  // Refresh when tab/screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        console.log('📌 Future Rides focused, refreshing...');
        fetchFutureRides();
      }
    }, [user?.id])
  );

  // Ticker for countdowns
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch available drivers and cars for assignment
  const fetchAvailableAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      console.log('🔄 Fetching available drivers and cars...');
      
      // Always fetch drivers from service
      const driversResponse = await fetchAvailableDrivers();
      // Fetch cars from API: /api/assignments/available-cars (VO priority-aware source)
      let carsResponse: AvailableCar[] = [];
      try {
        const carsApi = await axiosInstance.get('/api/assignments/available-cars');
        if (carsApi?.data && Array.isArray(carsApi.data)) {
          carsResponse = carsApi.data as AvailableCar[];
        }
      } catch (carsErr) {
        console.warn('⚠️ Fallback: available cars API failed, showing empty list', carsErr);
        carsResponse = [];
      }
      
      setAvailableDrivers(driversResponse || []);
      setAvailableCars(carsResponse || []);
      
      console.log('✅ Available assignments fetched:', {
        drivers: driversResponse?.length || 0,
        cars: carsResponse?.length || 0
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch available assignments:', error);
      Alert.alert('Error', 'Failed to fetch available drivers and cars');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Handle assign driver button press
  const handleAssignDriver = (ride: FutureRide) => {
    setSelectedRide(ride);
    setSelectedDriver(null);
    fetchAvailableAssignments();
    setShowAssignModal(true);
  };

  // Handle driver selection
  const handleDriverSelect = (driver: AvailableDriver) => {
    setSelectedDriver(driver);
    setShowAssignModal(false);
    setShowVehicleModal(true);
  };

  // Handle assignment confirmation
  const handleConfirmAssignment = async (car: AvailableCar) => {
    if (!selectedRide || !selectedDriver) {
      Alert.alert('Error', 'Please select both driver and car');
      return;
    }

    try {
      setAssignmentsLoading(true);
      console.log('🔄 Assigning driver and car to order...');

      await assignCarDriverToOrder(
        selectedRide.assignment_id,
        selectedDriver.id,
        car.id
      );

      // Update the ride in the list
      setFutureRides(prev => prev.map(ride => 
        ride.id === selectedRide.id 
          ? {
              ...ride,
              assignment_status: 'ASSIGNED',
              assigned_driver_name: selectedDriver.full_name,
              assigned_driver_phone: selectedDriver.primary_number,
              assigned_car_name: car.car_name,
              assigned_car_number: car.car_number
            }
          : ride
      ));

      // Notification removed

      Alert.alert('Success', 'Driver and car assigned successfully!');
      setShowVehicleModal(false);
      setSelectedRide(null);
      setSelectedDriver(null);
      
      console.log('✅ Assignment completed successfully');
    } catch (error: any) {
      console.error('❌ Failed to assign driver and car:', error);
      
      // Check for specific "Updated" error message
      if (error?.response?.data?.detail === "Updated") {
        Alert.alert(
          'Quick Driver Assignment', 
          'This order has been updated and assigned to a quick driver. Please check the updated status.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh the data to show updated status
                fetchFutureRides();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to assign driver and car');
      }
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Helper function to get pickup and drop locations
  const getPickupDrop = (pickupDropLocation: any) => {
    if (!pickupDropLocation) return { pickup: 'Unknown', drop: '' };
    if (typeof pickupDropLocation === 'object') {
      const has0 = Object.prototype.hasOwnProperty.call(pickupDropLocation, '0');
      const has1 = Object.prototype.hasOwnProperty.call(pickupDropLocation, '1');
      if (has0 && has1) {
        return { pickup: String(pickupDropLocation['0'] || 'Unknown'), drop: String(pickupDropLocation['1'] || '') };
      }
      if (has0) {
        return { pickup: String(pickupDropLocation['0'] || 'Unknown'), drop: '' };
      }
      if (pickupDropLocation.pickup || pickupDropLocation.drop) {
        return { pickup: String(pickupDropLocation.pickup || 'Unknown'), drop: String(pickupDropLocation.drop || '') };
      }
    }
    return { pickup: 'Unknown', drop: '' };
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid Date';
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return '#F59E0B';
      case 'ASSIGNED': return '#10B981';
      case 'COMPLETED': return '#6B7280';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Compute assignment time remaining for a ride
  const getAssignmentRemaining = (ride: FutureRide): string => {
    if (!ride.created_at || !ride.max_time_to_assign_order || !ride.assignment_created_at) {
      return "Assignment window expired";
    }
  
    const createdAt = new Date(ride.created_at);
    const maxAssignTime = new Date(ride.max_time_to_assign_order);
    
    // Fix timezone issue - ensure assignment_created_at is treated as UTC
    const assignmentCreatedAtString = ride.assignment_created_at.endsWith('Z') 
      ? ride.assignment_created_at 
      : ride.assignment_created_at + 'Z';
    const assignmentCreatedAt = new Date(assignmentCreatedAtString);
    
    // Step 1: Calculate total difference between created_at and max_time_to_assign_order
    const diffMs = maxAssignTime.getTime() - createdAt.getTime();
    
    // Step 2: Calculate assignment end time
    const assignmentEndTime = new Date(assignmentCreatedAt.getTime() + diffMs);
    
    // Step 3: Calculate remaining time from now
    const now = new Date();
    const remainingMs = assignmentEndTime.getTime() - now.getTime();
    
    // If the time is past due, mark as expired (no overdue countdown)
    if (remainingMs <= 0) {
      return "Assignment window expired";
    }
    
    const remainingMinutes = Math.floor(remainingMs / 60000);
    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
    return `${remainingMinutes}m ${remainingSeconds}s`;
  };
  // Render ride card
  const renderRideCard = (ride: FutureRide) => {
    const { pickup, drop } = getPickupDrop(ride.pickup_drop_location);
    const isHourly = String(ride.trip_type || '').toLowerCase().includes('hour');
    
    const remaining = getAssignmentRemaining(ride);
    
    return (
      <View key={ride.id} style={[styles.rideCard, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <View style={styles.rideHeader}>
          <View style={styles.statusBadge}>
            <Text style={[styles.statusText, { color: getStatusColor(ride.assignment_status) }]}>
              {ride.assignment_status}
            </Text>
          </View>
          <Text style={[styles.orderId, { color: colors.textSecondary }]}>
            Order #{ride.source_order_id}
          </Text>
        </View>

        {/* Assignment countdown (only for accepted orders without driver/car assigned) */}
        {remaining !== '' && !ride.assigned_driver_name && !ride.assigned_car_name && (
          <View style={styles.assignmentTimer}>
            <Text style={styles.timerText}>
              {remaining === 'Assignment window expired'
                ? 'Assignment window expired'
                : remaining
                  ? `Assign driver & car in ${remaining}`
                  : ''}
            </Text>
          </View>
        )}

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
              {pickup}
            </Text>
          </View>
          {!isHourly && !!drop && (
            <View style={styles.routeRow}>
              <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                {drop}
              </Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          {/* Trip Type */}
          {!!ride.trip_type && (
            <View style={styles.detailRow}>
              <Car size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>Trip: {ride.trip_type}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <User size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {ride.customer_name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {ride.customer_number}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Car size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {ride.car_type}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {ride.trip_distance} km • {ride.trip_time}
            </Text>
          </View>
          {/* Pickup Notes */}
          {ride.pickup_notes && (
            <View style={styles.detailRow}>
              <FileText size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Notes: {ride.pickup_notes}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.rideFooter}>
          <View style={styles.timeContainer}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formatDate(ride.start_date_time)}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <IndianRupee size={16} color="#10B981" />
            <Text style={styles.priceText}>
              {ride.vendor_price}
            </Text>
          </View>
        </View>

        {/* See More Button */}
        <TouchableOpacity 
          style={[styles.seeMoreButton, { backgroundColor: colors.background }]}
          onPress={() => setExpandedOrderId(expandedOrderId === ride.id ? null : ride.id)}
        >
          <Text style={[styles.seeMoreText, { color: colors.primary }]}>
            {expandedOrderId === ride.id ? 'See Less' : 'See More'}
          </Text>
          {expandedOrderId === ride.id ? (
            <ChevronUp size={16} color={colors.primary} />
          ) : (
            <ChevronDown size={16} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* Expanded Details Drawer */}
        {expandedOrderId === ride.id && (
          <View style={[styles.expandedDetails, { backgroundColor: colors.background }]}>
            <Text style={[styles.expandedTitle, { color: colors.text }]}>Order Details</Text>
            
            {/* Order Information */}
            <View style={styles.expandedSection}>
              <Text style={[styles.expandedSectionTitle, { color: colors.text }]}>Order Information</Text>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Order ID:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.source_order_id}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Source:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.source}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Trip Status:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.trip_status}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Pick Near City:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.pick_near_city}</Text>
              </View>
            </View>

            {/* Pricing Information */}
            <View style={styles.expandedSection}>
              <Text style={[styles.expandedSectionTitle, { color: colors.text }]}>Pricing</Text>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Estimated Price:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.estimated_price}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Vendor Price:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.vendor_price}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Platform Fees:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.platform_fees_percent}%</Text>
              </View>
              {ride.closed_vendor_price && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Closed Vendor Price:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.closed_vendor_price}</Text>
                </View>
              )}
              {ride.closed_driver_price && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Closed Driver Price:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.closed_driver_price}</Text>
                </View>
              )}
            </View>

            {/* Assignment Information */}
            <View style={styles.expandedSection}>
              <Text style={[styles.expandedSectionTitle, { color: colors.text }]}>Assignment</Text>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Assignment ID:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.assignment_id}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Status:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.assignment_status}</Text>
              </View>
              {ride.assigned_at && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Assigned At:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{formatDate(ride.assigned_at)}</Text>
                </View>
              )}
              {ride.expires_at && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Expires At:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{formatDate(ride.expires_at)}</Text>
                </View>
              )}
            </View>

            {/* Timestamps */}
            <View style={styles.expandedSection}>
              <Text style={[styles.expandedSectionTitle, { color: colors.text }]}>Timestamps</Text>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Created:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{formatDate(ride.created_at)}</Text>
              </View>
              {ride.assignment_created_at && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Assignment Created:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{formatDate(ride.assignment_created_at)}</Text>
                </View>
              )}
              {ride.cancelled_at && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Cancelled:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{formatDate(ride.cancelled_at)}</Text>
                </View>
              )}
              {ride.completed_at && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Completed:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{formatDate(ride.completed_at)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Assignment Info or Assign Button */}
        {ride.assigned_driver_name ? (
          <View style={[styles.assignmentInfo, { backgroundColor: colors.background }]}>
            <Text style={[styles.assignmentTitle, { color: colors.text }]}>
              Assigned Driver
            </Text>
            <Text style={[styles.assignmentText, { color: colors.textSecondary }]}>
              {ride.assigned_driver_name} • {ride.assigned_driver_phone}
            </Text>
            {ride.assigned_car_name && (
              <Text style={[styles.assignmentText, { color: colors.textSecondary }]}>
                {ride.assigned_car_name} • {ride.assigned_car_number}
              </Text>
            )}
            {/* Vendor info only after driver & car are assigned */}
            {!!(ride.vendor_name && ride.vendor_phone) && (
              <Text style={[styles.assignmentText, { color: colors.textSecondary }]}>Vendor: {ride.vendor_name} • {ride.vendor_phone}</Text>
            )}
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.assignButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAssignDriver(ride)}
            disabled={assignmentsLoading || getAssignmentRemaining(ride) === 'Assignment window expired'}
          >
            {assignmentsLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <UserPlus color="#FFFFFF" size={20} />
            )}
            <Text style={styles.assignButtonText}>
              {assignmentsLoading ? 'Loading...' : (getAssignmentRemaining(ride) === 'Assignment window expired' ? 'Assignment expired' : 'Assign Driver & Car')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Car size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Future Rides
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        You don't have any upcoming rides at the moment.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={fetchFutureRides}>
        <RefreshCw size={20} color="#FFFFFF" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.error }]}>
        Error Loading Rides
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {error}
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={fetchFutureRides}>
        <RefreshCw size={20} color="#FFFFFF" />
        <Text style={styles.refreshButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Future Rides</Text>
        <TouchableOpacity onPress={fetchFutureRides} disabled={loading}>
          <RefreshCw size={24} color={loading ? colors.textSecondary : colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && futureRides.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading future rides...
            </Text>
          </View>
        ) : error ? (
          renderErrorState()
        ) : futureRides.length > 0 ? (
          <View style={styles.ridesContainer}>
            {/* Search input */}
            <View style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 12,
              backgroundColor: colors.surface,
            }}>
              <TextInput
                placeholder="Search by ID, customer, city, or location..."
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={setSearch}
                style={{ color: colors.text }}
              />
            </View>

            {filteredFutureRides.map(renderRideCard)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Driver Assignment Modal */}
      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Driver
              </Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {assignmentsLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.modalLoadingText, { color: colors.textSecondary }]}>
                    Loading drivers...
                  </Text>
                </View>
              ) : availableDrivers.length > 0 ? (
                availableDrivers.map((driver) => (
                  <TouchableOpacity
                    key={driver.id}
                    style={[styles.driverCard, { backgroundColor: colors.background }]}
                    onPress={() => handleDriverSelect(driver)}
                  >
                    <View style={styles.driverInfo}>
                      <Text style={[styles.driverName, { color: colors.text }]}>
                        {driver.full_name}
                      </Text>
                      <Text style={[styles.driverDetails, { color: colors.textSecondary }]}>
                        {driver.primary_number}
                      </Text>
                      <Text style={[styles.driverStatus, { color: '#10B981' }]}>
                        {driver.driver_status}
                      </Text>
                    </View>
                    <CheckCircle color={colors.primary} size={24} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.modalEmpty}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    No available drivers found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Car Assignment Modal */}
      <Modal
        visible={showVehicleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Car
              </Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            {selectedDriver && (
              <View style={[styles.selectedDriverInfo, { backgroundColor: colors.background }]}>
                <Text style={[styles.selectedDriverText, { color: colors.text }]}>
                  Selected Driver: {selectedDriver.full_name}
                </Text>
      </View>
            )}

            <ScrollView style={styles.modalScrollView}>
              {assignmentsLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.modalLoadingText, { color: colors.textSecondary }]}>
                    Assigning...
                  </Text>
                </View>
              ) : availableCars.length > 0 ? (
                // Filter and sort cars: by compatibility and priority
                (availableCars
                  .filter((car) => {
                    if (!selectedRide) return true;
                    const rank = (type: string) => {
                      switch ((type || '').toUpperCase()) {
                        case 'INNOVA_CRYSTA': return 5; // highest priority
                        case 'INNOVA': return 4;
                        case 'SUV': return 3;
                        case 'NEW_SEDAN': return 2;
                        case 'SEDAN': return 2;
                        case 'HATCHBACK': return 1;
                        default: return 0;
                      }
                    };
                    // Only include cars with good status if provided
                    const status = String((car as any)?.car_status || (car as any)?.status || '').toUpperCase();
                    const statusOk = !status || ['AVAILABLE', 'ONLINE', 'IDLE', 'FREE'].includes(status);
                    return statusOk && rank(car.car_type) >= rank(selectedRide.car_type);
                  })
                  .sort((a, b) => {
                    const pr = (type: string) => {
                      switch ((type || '').toUpperCase()) {
                        case 'INNOVA_CRYSTA': return 5;
                        case 'INNOVA': return 4;
                        case 'SUV': return 3;
                        case 'NEW_SEDAN': return 2;
                        case 'SEDAN': return 2;
                        case 'HATCHBACK': return 1;
                        default: return 0;
                      }
                    };
                    // Higher priority first
                    return pr(b.car_type) - pr(a.car_type);
                  }))
                  .map((car) => (
                  <TouchableOpacity
                    key={car.id}
                    style={[styles.carCard, { backgroundColor: colors.background }]}
                    onPress={() => handleConfirmAssignment(car)}
                    disabled={assignmentsLoading}
                  >
                    <View style={styles.carInfo}>
                      <Text style={[styles.carName, { color: colors.text }]}>
                        {car.car_name} ({car.car_type})
                      </Text>
                      <Text style={[styles.carDetails, { color: colors.textSecondary }]}>
                        {car.car_number}
                      </Text>
                      {!!(car as any)?.car_status && (
                        <Text style={[styles.carDetails, { color: colors.textSecondary }]}>
                          Status: {(car as any).car_status}
                        </Text>
                      )}
                    </View>
                    <CheckCircle color={colors.primary} size={24} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.modalEmpty}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    No available cars found
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

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
      paddingHorizontal: 20,
    paddingVertical: 16,
      borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    },
  title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
  },
  scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    paddingTop: 16,
  },
  ridesContainer: {
    gap: 16,
    paddingBottom: 20,
    },
    rideCard: {
    borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    },
    rideHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
    },
  orderId: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    },
    routeContainer: {
      marginBottom: 12,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  locationText: {
    fontSize: 16,
      fontFamily: 'Inter-Medium',
    flex: 1,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
      marginBottom: 12,
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
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
      borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
      paddingTop: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  assignmentInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  assignmentTitle: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  assignmentText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
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
    marginTop: 16,
    },
    assignButton: {
    marginTop: 12,
    borderRadius: 8,
      paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
      alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    },
    assignButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
    assignmentTimer: {
      marginTop: 8,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: '#FEE2E2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
    },
    timerText: {
      fontSize: 13,
      fontFamily: 'Inter-SemiBold',
      color: '#B91C1C',
      textAlign: 'center',
    },
    expiredTimer: {
      backgroundColor: '#FEE2E2',
      borderColor: '#FCA5A5',
    },
    expiredText: {
      color: '#B91C1C',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    },
    modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 12,
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    },
    driverCard: {
      flexDirection: 'row',
      alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    },
    driverInfo: {
      flex: 1,
    },
    driverName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
    },
  driverDetails: {
    fontSize: 14,
      fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  driverStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  selectedDriverInfo: {
    marginHorizontal: 20,
    padding: 12,
      borderRadius: 8,
    marginBottom: 16,
    },
  selectedDriverText: {
    fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
  carCard: {
    flexDirection: 'row',
      alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
      marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  carInfo: {
      flex: 1,
  },
  carName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  carDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  seeMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  expandedDetails: {
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expandedTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  expandedSection: {
    marginBottom: 16,
  },
  expandedSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  expandedLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  expandedValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'right',
  },
  });