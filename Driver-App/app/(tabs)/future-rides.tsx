import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; 
import { useNotifications } from '@/contexts/NotificationContext';
import { MapPin, Clock, IndianRupee, User, Phone, Car, RefreshCw, UserPlus, X, CheckCircle } from 'lucide-react-native';
import { RefreshControl } from 'react-native';
import axiosInstance from '@/app/api/axiosInstance';
import { fetchAvailableDrivers, fetchAvailableCars, assignCarDriverToOrder, AvailableDriver, AvailableCar } from '@/services/orders/assignmentService';

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
  cancelled_at: string | null;
  completed_at: string | null;
  assignment_created_at: string;
  vendor_name: string;
  vendor_phone: string;
  assigned_driver_name: string | null;
  assigned_driver_phone: string | null;
  assigned_car_name: string | null;
  assigned_car_number: string | null;
}

export default function FutureRidesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { sendOrderAssignedNotification } = useNotifications();
  const [futureRides, setFutureRides] = useState<FutureRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch available drivers and cars for assignment
  const fetchAvailableAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      console.log('🔄 Fetching available drivers and cars...');

      const [driversResponse, carsResponse] = await Promise.all([
        fetchAvailableDrivers(),
        fetchAvailableCars()
      ]);

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

      // Send notification
      sendOrderAssignedNotification({
        orderId: selectedRide.source_order_id.toString(),
        pickup: getPickupDrop(selectedRide.pickup_drop_location).pickup,
        drop: getPickupDrop(selectedRide.pickup_drop_location).drop,
        customerName: selectedRide.customer_name,
        customerMobile: selectedRide.customer_number,
        distance: selectedRide.trip_distance,
        fare: selectedRide.vendor_price,
        orderType: 'assigned'
      });

      Alert.alert('Success', 'Driver and car assigned successfully!');
      setShowVehicleModal(false);
      setSelectedRide(null);
      setSelectedDriver(null);
      
      console.log('✅ Assignment completed successfully');
    } catch (error: any) {
      console.error('❌ Failed to assign driver and car:', error);
      Alert.alert('Error', error.message || 'Failed to assign driver and car');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Helper function to get pickup and drop locations
  const getPickupDrop = (pickupDropLocation: any) => {
    if (!pickupDropLocation) return { pickup: 'Unknown', drop: 'Unknown' };
    
    // Handle the format from API: { "0": "gingee", "1": "Tiruvannamalai" }
    if (pickupDropLocation["0"] && pickupDropLocation["1"]) {
      return {
        pickup: pickupDropLocation["0"],
        drop: pickupDropLocation["1"]
      };
    }
    
    return { pickup: 'Unknown', drop: 'Unknown' };
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

  // Render ride card
  const renderRideCard = (ride: FutureRide) => {
    const { pickup, drop } = getPickupDrop(ride.pickup_drop_location);
    
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

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routeRow}>
            <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
              {pickup}
            </Text>
          </View>
          <View style={styles.routeRow}>
            <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
              {drop}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
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
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.assignButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAssignDriver(ride)}
            disabled={assignmentsLoading}
          >
            {assignmentsLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <UserPlus color="#FFFFFF" size={20} />
            )}
            <Text style={styles.assignButtonText}>
              {assignmentsLoading ? 'Loading...' : 'Assign Driver & Car'}
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
            {futureRides.map(renderRideCard)}
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
                availableCars.map((car) => (
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
});
