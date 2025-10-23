import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Clock, IndianRupee, Car, User, Phone, RefreshCw, Navigation, ChevronDown, ChevronUp, FileText } from 'lucide-react-native';
import { getFutureRidesForVehicleOwner, getCompletedOrdersForVehicleOwner, FutureRideView } from '@/services/vehicle/vehicleOwnerService';

interface RideData {
  id: string;
  order_id: number;
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
  const [activeTab, setActiveTab] = useState<'driving' | 'completed' | 'cancelled'>('driving');
  const [drivingRides, setDrivingRides] = useState<RideData[]>([]);
  const [completedRides, setCompletedRides] = useState<RideData[]>([]);
  const [cancelledRides, setCancelledRides] = useState<RideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { colors } = useTheme();
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
        const rideData: RideData = {
          ...ride,
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
        const rideData: RideData = {
          ...order,
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

  const getCurrentRides = () => {
    switch (activeTab) {
      case 'driving': return drivingRides;
      case 'completed': return completedRides;
      case 'cancelled': return cancelledRides;
      default: return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'driving': return 'Driving';
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
    console.log('🎨 Rendering ride card:', {
      id: ride.id,
      order_id: ride.order_id,
      status: ride.status,
      assignment_status: ride.assignment_status,
      trip_status: ride.trip_status,
      allFields: Object.keys(ride)
    });
    
    const isExpanded = expandedOrderId === ride.id.toString();
    const hasPickupNotes = ride.pickup_notes && ride.pickup_notes !== 'NILL' && ride.pickup_notes !== 'null';
    
    return (
      <View key={`${ride.id}-${ride.order_id}-${ride.assignment_id || ride.id}`} style={[styles.rideCard, { backgroundColor: colors.surface }]}>
        <View style={styles.rideHeader}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>{getStatusIcon(ride.status)}</Text>
            <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
              {activeTab === 'cancelled' ? getCancellationLabel(ride.assignment_status) : ride.status.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.orderId, { color: colors.textSecondary }]}>
            Order #{ride.order_id || ride.id || 'N/A'}
          </Text>
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
              {ride.pickup_city || 'Pickup Location'}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
              {ride.drop_city || 'Drop Location'}
            </Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.detailRow}>
            <User size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {ride.customer_name || 'Customer'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {ride.customer_number || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Car size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {ride.car_type || 'Car Type'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Navigation size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {ride.trip_distance || 0} km
            </Text>
          </View>
        </View>

        {/* Pickup Notes */}
        {hasPickupNotes && (
          <View style={styles.pickupNotesContainer}>
            <View style={styles.pickupNotesHeader}>
              <FileText size={16} color={colors.primary} />
              <Text style={[styles.pickupNotesLabel, { color: colors.primary }]}>Pickup Notes:</Text>
            </View>
            <Text style={[styles.pickupNotesText, { color: colors.text }]}>
              {ride.pickup_notes}
            </Text>
          </View>
        )}

        <View style={styles.rideFooter}>
          <View style={styles.timeInfo}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {ride.start_date_time ? new Date(ride.start_date_time).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.priceInfo}>
            <IndianRupee size={16} color="#10B981" />
            <Text style={styles.priceText}>
              {ride.total_amount || ride.estimated_price || 0}
            </Text>
          </View>
        </View>

        {/* See More/Less Button */}
        <TouchableOpacity
          style={styles.seeMoreButton}
          onPress={() => setExpandedOrderId(isExpanded ? null : ride.id.toString())}
        >
          <Text style={[styles.seeMoreText, { color: colors.primary }]}>
            {isExpanded ? 'See Less' : 'See More'}
          </Text>
          {isExpanded ? (
            <ChevronUp size={16} color={colors.primary} />
          ) : (
            <ChevronDown size={16} color={colors.primary} />
          )}
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.expandedSection}>
              <Text style={[styles.expandedTitle, { color: colors.text }]}>Order Details</Text>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Order ID:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.order_id || 'N/A'}</Text>
              </View>
              <View style={styles.expandedRow}>
                <Text style={[styles.expandedLabel, { color: colors.textSecondary }]}>Trip Type:</Text>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ride.trip_type || 'N/A'}</Text>
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
            </View>

            {/* Assignment Details */}
            {ride.assigned_driver_name && (
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
              </View>
            )}

            {/* Vendor Details */}
            {ride.vendor_name && (
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
            )}

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
        activeTab === tab && { backgroundColor: colors.primary },
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
        {renderTabButton('driving', 'Driving', drivingRides.length)}
        {renderTabButton('completed', 'Completed', completedRides.length)}
        {renderTabButton('cancelled', 'Cancelled', cancelledRides.length)}
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
    backgroundColor: '#F3F4F6',
  },
  tabButtonText: {
      fontSize: 14,
    fontWeight: '600',
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
      padding: 16,
      marginBottom: 16,
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
    backgroundColor: '#F3F4F6',
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
  routeInfo: {
      marginBottom: 12,
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
    rideDetails: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
    marginBottom: 6,
    },
    detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
      borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderTopColor: '#E5E7EB',
  },
  expandedSection: {
    marginBottom: 20,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
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