import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Clock, IndianRupee, Car, User, Phone, RefreshCw, Navigation, ChevronDown, ChevronUp, FileText } from 'lucide-react-native';
import { getFutureRidesForVehicleOwner, getCompletedOrdersForVehicleOwner, FutureRideView } from '@/services/vehicle/vehicleOwnerService';

interface RideData {
  id: string;
  order_id: string | number; // Can be either string or number
  status: string;
  assignment_status: string;
  trip_status: string;
  assignment_id?: string;
  pickup_notes?: string | null;
  vendor_name?: string;
  vendor_phone?: string;
  assigned_driver_name?: string;
  assigned_driver_phone?: string;
  assigned_car_name?: string;
  assigned_car_number?: string;
  vendor_price?: number | null;
  closed_vendor_price?: number | null;
  closed_driver_price?: number | null;
  commision_amount?: number | null;
  pickup_city?: string;
  drop_city?: string;
  customer_name?: string;
  customer_number?: string;
  car_type?: string;
  trip_distance?: number;
  trip_time?: string;
  trip_type?: string;
  estimated_price?: number;
  total_amount?: number | null;
  start_date_time?: string;
  created_at?: string;
  assigned_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export default function RidesScreen() {
  const { colors, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'driving' | 'completed' | 'cancelled'>('driving');
  const [drivingRides, setDrivingRides] = useState<RideData[]>([]);
  const [completedRides, setCompletedRides] = useState<RideData[]>([]);
  const [cancelledRides, setCancelledRides] = useState<RideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  // Fetch all rides data
  const fetchRidesData = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching all rides data for Vehicle Owner...');
      
      // Fetch future rides (pending/driving orders)
      const futureRides = await getFutureRidesForVehicleOwner();
      console.log('🚗 Future rides fetched:', futureRides.length);
      
      // Fetch completed orders
      const completedOrders = await getCompletedOrdersForVehicleOwner();
      console.log('✅ Completed orders fetched:', completedOrders.length);
      console.log('📊 Completed orders data:', completedOrders);
      
      // Categorize the rides
      const driving: RideData[] = [];
      const completed: RideData[] = [];
      const cancelled: RideData[] = [];
      
      // Process future rides (these are driving/pending)
      futureRides.forEach(ride => {
        console.log('🔍 Future ride data structure:', {
          id: ride.id,
          order_id: ride.order_id,
          source_order_id: (ride as any).source_order_id,
          allFields: Object.keys(ride)
        });
        
        const rideData: RideData = {
          ...ride,
          order_id: ride.order_id || (ride as any).source_order_id || ride.id, // Use source_order_id as fallback
          status: ride.assignment_status?.toLowerCase() || 'pending',
          assignment_status: ride.assignment_status || 'PENDING',
          trip_status: ride.trip_status || 'PENDING',
        };
        
        if (rideData.assignment_status === 'PENDING' || rideData.assignment_status === 'ASSIGNED') {
          driving.push(rideData);
        }
      });
      
      // Process completed orders
      completedOrders.forEach(order => {
        console.log('🔍 Completed order data structure:', {
          id: order.id,
          order_id: order.order_id,
          source_order_id: (order as any).source_order_id,
          allFields: Object.keys(order)
        });
        
        const rideData: RideData = {
          ...order,
          order_id: order.order_id || (order as any).source_order_id || order.id, // Use source_order_id as fallback
          status: order.assignment_status?.toLowerCase() || 'completed',
          assignment_status: order.assignment_status || 'COMPLETED',
          trip_status: order.trip_status || 'COMPLETED',
        };
        
        console.log('🔄 Processing completed order:', {
          orderId: order.id,
          order_id: order.order_id,
          assignmentStatus: rideData.assignment_status,
          tripStatus: rideData.trip_status,
          status: rideData.status,
          allFields: Object.keys(order)
        });
        
        if (rideData.assignment_status === 'COMPLETED' || rideData.trip_status === 'COMPLETED') {
          completed.push(rideData);
          console.log('✅ Added to completed:', order.id);
        } else if (rideData.assignment_status === 'CANCELLED' || 
                   rideData.assignment_status === 'AUTO_CANCELLED' || 
                   rideData.assignment_status === 'CANCELLED_BY_VENDOR' ||
                   rideData.trip_status === 'CANCELLED') {
          cancelled.push(rideData);
          console.log('❌ Added to cancelled:', order.id, 'with status:', rideData.assignment_status);
        } else {
          console.log('⚠️ Order not categorized:', {
            orderId: order.id,
            assignmentStatus: rideData.assignment_status,
            tripStatus: rideData.trip_status
          });
        }
      });
      
      setDrivingRides(driving);
      setCompletedRides(completed);
      setCancelledRides(cancelled);
      
      console.log('📊 Rides categorized:', {
        driving: driving.length,
        completed: completed.length,
        cancelled: cancelled.length,
      });
      
    } catch (error: any) {
      console.error('❌ Failed to fetch rides data:', error);
      Alert.alert('Error', error.message || 'Failed to fetch rides data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRidesData();
    setRefreshing(false);
  };

  // Auto-load data when user is available
  useEffect(() => {
    if (user) {
      console.log('🔄 Auto-loading rides data...');
      fetchRidesData();
    }
  }, [user]);

  // Also load data when user changes (login/logout)
  useEffect(() => {
    if (user) {
      console.log('👤 User changed, refreshing rides data...');
      fetchRidesData();
    }
  }, [user?.id]); // Only trigger when user ID changes (login/logout)

  const getCurrentRides = (): RideData[] => {
    let rides: RideData[] = [];
    switch (activeTab) {
      case 'driving': rides = drivingRides; break;
      case 'completed': rides = completedRides; break;
      case 'cancelled': rides = cancelledRides; break;
      default: rides = [];
    }
    
    // Apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      rides = rides.filter(ride => {
        return [
          ride.order_id,
          ride.id,
          ride.customer_name,
          ride.customer_number,
          ride.pickup_city,
          ride.drop_city,
          ride.car_type,
          ride.trip_type,
          ride.assigned_driver_name,
          ride.assigned_car_name,
          ride.assigned_car_number,
        ].some(field => 
          field && String(field).toLowerCase().includes(searchTerm)
        );
      });
    }
    
    return rides;
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'driving': return 'Assigned';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Rides';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#F59E0B';
      case 'assigned': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '⏳';
      case 'assigned': return '🚗';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const getCancellationLabel = (assignmentStatus: string) => {
    switch (assignmentStatus) {
      case 'AUTO_CANCELLED':
        return 'Auto Cancelled';
      case 'CANCELLED_BY_VENDOR':
        return 'Cancelled by Vendor';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Cancelled';
    }
  };

  const renderRideCard = (ride: RideData) => {
    const isExpanded = expandedOrderId === ride.id.toString();
    const hasPickupNotes = ride.pickup_notes && ride.pickup_notes !== 'NILL' && ride.pickup_notes !== 'null';
    const isMulticity = String(ride.trip_type || '').toLowerCase().includes('multicity') || String(ride.trip_type || '').toLowerCase().includes('multy');
    
    // Parse date and time
    const parseDateTime = (dateStr?: string) => {
      if (!dateStr) return { date: '', time: '' };
      try {
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return { date: formattedDate, time: formattedTime };
      } catch {
        return { date: '', time: '' };
      }
    };
    
    const { date: pickupDate, time: pickupTime } = parseDateTime(ride.start_date_time);
    
    // Access fare breakdown fields
    const fareData = (ride as any);
    const pricePerKm = fareData.cost_per_km || fareData.price_per_km || 0;
    const driverAllowance = fareData.driver_allowance || 0;
    const permitCharge = fareData.permit_charges || fareData.permit_charge || 0;
    const hillsCharge = fareData.hill_charges || fareData.hills_charge || 0;
    const tollCharge = fareData.toll_charges || fareData.toll_charge || 0;
    const waitingCharge = isMulticity ? (fareData.waiting_charge || fareData.waiting_charges || 0) : null;
    
    return (
      <View key={`${ride.id}-${ride.order_id}-${ride.assignment_id || ride.id}`} style={[styles.rideCard, { backgroundColor: colors.surface }]}>
        {/* Header: Booking ID and Trip Type */}
        <View style={styles.rideHeader}>
          <Text style={[styles.orderIdBold, { color: colors.text }]}>
            Booking ID: #{ride.id}
          </Text>
          {ride.trip_type && (
            <Text style={styles.tripTypeBold}>{ride.trip_type}</Text>
          )}
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.locationRow}>
            <MapPin color="#10B981" size={18} />
            <Text style={[styles.routeTextBold, { color: '#10B981' }]}>
              From: {ride.pickup_city || 'Pickup Location'}
            </Text>
          </View>
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          <View style={styles.locationRow}>
            <MapPin color="#EF4444" size={18} />
            <Text style={[styles.routeTextBold, { color: '#EF4444' }]}>
              To: {ride.drop_city || 'Drop Location'}
            </Text>
          </View>
        </View>

        {/* Order Details in Bold Styling */}
        <View style={styles.detailsContainerBold}>
          {ride.trip_type && (
            <View style={styles.detailRowBold}>
              <Text style={[styles.detailLabelBold, { color: colors.textSecondary }]}>Trip Type:</Text>
              <Text style={[styles.detailValueBold, { color: colors.text }]}>{ride.trip_type}</Text>
            </View>
          )}
          {ride.car_type && (
            <View style={styles.detailRowBold}>
              <Text style={[styles.detailLabelBold, { color: colors.textSecondary }]}>Vehicle Type:</Text>
              <Text style={[styles.detailValueBold, { color: colors.text }]}>{ride.car_type}</Text>
            </View>
          )}
          {pickupDate && (
            <View style={styles.detailRowBold}>
              <Text style={[styles.detailLabelBold, { color: colors.textSecondary }]}>Date & Time:</Text>
              <Text style={[styles.detailValueBold, { color: colors.text }]}>{pickupDate} {pickupTime}</Text>
            </View>
          )}
          {ride.trip_distance !== undefined && (
            <View style={styles.detailRowBold}>
              <Text style={[styles.detailLabelBold, { color: colors.textSecondary }]}>Distance:</Text>
              <Text style={[styles.detailValueBold, { color: colors.text }]}>{ride.trip_distance || 0} km</Text>
            </View>
          )}
          {ride.trip_time && (
            <View style={styles.detailRowBold}>
              <Text style={[styles.detailLabelBold, { color: colors.textSecondary }]}>Duration:</Text>
              <Text style={[styles.detailValueBold, { color: colors.text }]}>{ride.trip_time}</Text>
            </View>
          )}
        </View>

        {/* Total Amount */}
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Total Amount</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IndianRupee color="#065F46" size={20} />
            <Text style={styles.totalFare}>{ride.total_amount || ride.estimated_price || 0}</Text>
          </View>
        </View>

        {/* Fare Breakdown Button */}
        <TouchableOpacity
          style={[styles.seeMoreButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => setExpandedOrderId(isExpanded ? null : ride.id.toString())}
        >
          <Text style={[styles.seeMoreText, { color: colors.primary }]}>
            {isExpanded ? 'Hide Fare Breakdown' : 'Fare Breakdown'}
          </Text>
          {isExpanded ? (
            <ChevronUp size={16} color={colors.primary} />
          ) : (
            <ChevronDown size={16} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* Expanded Details - Fare Breakdown */}
        {isExpanded && (
          <View style={[styles.expandedDetails, { borderTopColor: colors.border }]}>
            <Text style={[styles.expandedTitle, { color: colors.text }]}>Fare Breakdown</Text>
            
            {/* Fare Breakdown Details */}
            <View style={styles.expandedSection}>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Price per km:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>₹{pricePerKm}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Driver allowance:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>₹{driverAllowance}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Permit charge:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>₹{permitCharge}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Hills charge:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>₹{hillsCharge}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Toll charge:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>₹{tollCharge}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Waiting charge:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>
                  {isMulticity ? (waitingCharge ? `₹${waitingCharge}` : '₹0') : 'N/A'}
                </Text>
              </View>
            </View>
            
            {/* Order Details */}
            {/* <View style={styles.expandedSection}>
              <Text style={[styles.expandedTitle, { color: colors.text }]}>Order Details</Text>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Order ID:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.order_id || 'N/A'}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Car Type:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.car_type || 'N/A'}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Distance:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.trip_distance || 0} km</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Trip Time:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.trip_time || 'N/A'}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Estimated Price:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.estimated_price || 0}</Text>
              </View>
              {ride.vendor_price && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Vendor Price:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.vendor_price}</Text>
                </View>
              )}
              {ride.closed_vendor_price && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Final Vendor Price:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.closed_vendor_price}</Text>
                </View>
              )}
              {ride.closed_driver_price && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Driver Price:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.closed_driver_price}</Text>
                </View>
              )}
              {ride.commision_amount && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Commission:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>₹{ride.commision_amount}</Text>
                </View>
              )}
            </View> */}

            {/* Assignment Details */}
            {/* {ride.assigned_driver_name && (
              <View style={styles.expandedSection}>
                <Text style={[styles.expandedTitle, { color: colors.text }]}>Assignment Details</Text>
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Driver:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.assigned_driver_name}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Driver Phone:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.assigned_driver_phone || 'N/A'}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Car:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.assigned_car_name}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Car Number:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.assigned_car_number}</Text>
                </View>
                {ride.assigned_at && (
                  <View style={styles.expandedRow}>
                    <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Assigned At:</Text>
                    <Text style={[styles.expandedValue, { color: colors.text }]}>
                      {new Date(ride.assigned_at).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View> */}
            {/* )} */}

            {/* Vendor Details */}
            {/* {ride.vendor_name && (
              <View style={styles.expandedSection}>
                <Text style={[styles.expandedTitle, { color: colors.text }]}>Vendor Details</Text>
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Vendor Name:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.vendor_name}</Text>
                </View>
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Vendor Phone:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.vendor_phone}</Text>
                </View>
              </View>
            )} */}

            {/* Timestamps */}
            <View style={styles.expandedSection}>
              <Text style={[styles.expandedTitle, { color: colors.text }]}>Timestamps</Text>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Created:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>
                  {ride.created_at ? new Date(ride.created_at).toLocaleString() : 'N/A'}
                </Text>
              </View>
              {ride.completed_at && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Completed:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>
                    {new Date(ride.completed_at).toLocaleString()}
                  </Text>
                </View>
              )}
              {ride.cancelled_at && (
                <View style={styles.expandedRow}>
                  <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Cancelled:</Text>
                  <Text style={[styles.expandedValue, { color: colors.text }]}>
                    {new Date(ride.cancelled_at).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No {getTabTitle().toLowerCase()} rides
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {activeTab === 'driving' && 'No rides are currently in progress'}
        {activeTab === 'completed' && 'No rides have been completed yet'}
        {activeTab === 'cancelled' && 'No rides have been cancelled'}
      </Text>
    </View>
  );

  const renderTabButton = (tab: 'driving' | 'completed' | 'cancelled', label: string, count: number) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        { backgroundColor: activeTab === tab ? colors.primary : colors.surface },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        { color: activeTab === tab ? '#FFFFFF' : colors.textSecondary },
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Rides</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <RefreshCw size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('driving', 'Assigned', drivingRides.length)}
        {renderTabButton('completed', 'Completed', completedRides.length)}
        {renderTabButton('cancelled', 'Cancelled', cancelledRides.length)}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: colors.surface, 
            color: colors.text,
            borderColor: colors.border 
          }]}
          placeholder="Search by ID, customer, city, or driver..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading rides...
            </Text>
          </View>
        ) : getCurrentRides().length > 0 ? (
          <View style={styles.ridesList}>
            {getCurrentRides().map(renderRideCard)}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabButton: {
      flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
      borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
      fontSize: 14,
    fontWeight: '600',
    },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  scrollView: {
      flex: 1,
      paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
  },
  ridesList: {
    paddingBottom: 20,
    },
    rideCard: {
    borderRadius: 12,
      padding: 12,
      marginBottom: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
    borderRadius: 6,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
    },
    statusText: {
      fontSize: 12,
    fontWeight: '600',
  },
  orderId: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderIdBold: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  tripTypeBold: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#EF4444', // Red color
  },
  routeInfo: {
      marginBottom: 10,
    },
  routeLine: {
    width: 1,
    height: 12,
    marginLeft: 8,
    marginVertical: 2,
  },
  locationRow: {
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
    fontWeight: '500',
    flex: 1,
    },
  routeTextBold: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    flex: 1,
    marginLeft: 8,
  },
    rideDetails: {
      marginBottom: 12,
    },
    detailsContainerBold: {
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    marginBottom: 6,
    },
    detailRowBold: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    detailLabelBold: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      minWidth: 120,
    },
    detailValueBold: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      flex: 1,
    },
    detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  fareContainer: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#065F46',
    marginBottom: 4,
  },
  totalFare: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#065F46',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
      borderTopWidth: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
      fontSize: 14,
    marginLeft: 6,
    },
  priceInfo: {
    flexDirection: 'row',
      alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginLeft: 4,
  },
  emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
      marginBottom: 8,
    },
  emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
    lineHeight: 20,
    },
  // Pickup Notes Styles
  pickupNotesContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  pickupNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickupNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  pickupNotesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // See More/Less Button
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  // Expanded Details
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  expandedSection: {
    marginBottom: 20,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  expandedLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  expandedValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  });