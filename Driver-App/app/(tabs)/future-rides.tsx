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
import { fetchAvailableDrivers, fetchAvailableCars, assignDriverAndCar, AvailableDriver, AvailableCar } from '@/services/assignmentService';

// Removed local interface - using imported FutureRide from DashboardContext

// Removed sample data; now reads from shared context

export default function FutureRidesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { dashboardData, loading, error, futureRides, updateFutureRide } = useDashboard();
  const { sendOrderAssignedNotification } = useNotifications();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<FutureRide | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<AvailableDriver | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [availableCars, setAvailableCars] = useState<AvailableCar[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Dedupe rides by id (fallback to booking_id) to avoid duplicate entries
  const uniqueRides = useMemo(() => {
    const rideMap = new Map<string, FutureRide>();
    for (const ride of futureRides) {
      const key = ride.id || ride.booking_id;
      if (!rideMap.has(key)) {
        rideMap.set(key, ride);
      }
    }
    return Array.from(rideMap.values());
  }, [futureRides]);

  // Fetch available drivers and cars from assignment endpoints
  useEffect(() => {
    if (!loading && dashboardData) {
      fetchAvailableAssignments();
    }
  }, [loading, dashboardData]);

  const fetchAvailableAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      console.log('🔍 Fetching available drivers and cars for assignments...');
      
      // Fetch both drivers and cars in parallel
      const [drivers, cars] = await Promise.all([
        fetchAvailableDrivers(),
        fetchAvailableCars()
      ]);
      
      setAvailableDrivers(drivers);
      setAvailableCars(cars);
      
      console.log('✅ Available assignments loaded:', {
        drivers: drivers.length,
        cars: cars.length
      });
    } catch (error) {
      console.error('❌ Failed to fetch available assignments:', error);
      // Fallback to dashboard data if assignment endpoints fail
      // Convert dashboard data to assignment format
      const fallbackDrivers: AvailableDriver[] = (dashboardData?.drivers || []).map(driver => ({
        ...driver,
        is_available: true, // Assume available as fallback
        current_assignment: undefined
      }));
      
      const fallbackCars: AvailableCar[] = (dashboardData?.cars || []).map(car => ({
        ...car,
        is_available: true, // Assume available as fallback
        current_assignment: undefined
      }));
      
      setAvailableDrivers(fallbackDrivers);
      setAvailableCars(fallbackCars);
    } finally {
      setAssignmentsLoading(false);
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
      
      // Create assignment using the new service
      const assignment = await assignDriverAndCar({
        order_id: selectedRide.booking_id,
        driver_id: selectedDriver.id,
        car_id: vehicle.id,
        assigned_by: user?.id || 'unknown',
        assignment_notes: `Assigned by ${user?.fullName || 'Vehicle Owner'}`
      });
      
      console.log('✅ Assignment created successfully:', assignment);
      
      // Update the ride with assignment details
      const updatedRide: FutureRide = {
        ...selectedRide,
        assigned_driver: { ...selectedDriver },
        assigned_vehicle: vehicle,
        status: 'assigned',
      };

      updateFutureRide(updatedRide);
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
      
      // Refresh available assignments
      await fetchAvailableAssignments();
      
    } catch (error: any) {
      console.error('❌ Assignment failed:', error);
      Alert.alert(
        'Assignment Failed',
        error.message || 'Failed to assign driver and vehicle. Please try again.'
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
        <Text style={dynamicStyles.availabilityText}>Busy</Text>
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
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
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

  const RideCard = ({ ride }: { ride: FutureRide }) => (
    <View style={dynamicStyles.rideCard}>
      <View style={dynamicStyles.rideHeader}>
        <Text style={dynamicStyles.bookingId}>#{ride.booking_id}</Text>
        <View style={[
          dynamicStyles.statusBadge,
          ride.status === 'assigned' && dynamicStyles.assignedBadge
        ]}>
          <Text style={dynamicStyles.statusText}>
            {ride.status === 'assigned' ? 'ASSIGNED' : 'CONFIRMED'}
          </Text>
        </View>
      </View>

      <View style={dynamicStyles.routeContainer}>
        <View style={dynamicStyles.routeRow}>
          <MapPin color={colors.success} size={16} />
          <Text style={dynamicStyles.routeText}>{ride.pickup}</Text>
        </View>
        <View style={dynamicStyles.routeLine} />
        <View style={dynamicStyles.routeRow}>
          <MapPin color={colors.error} size={16} />
          <Text style={dynamicStyles.routeText}>{ride.drop}</Text>
        </View>
      </View>

      <View style={dynamicStyles.rideDetails}>
        <View style={dynamicStyles.detailRow}>
          <Clock color={colors.textSecondary} size={14} />
          <Text style={dynamicStyles.detailText}>{ride.date} at {ride.time}</Text>
        </View>
        <View style={dynamicStyles.detailRow}>
          <Car color={colors.textSecondary} size={14} />
          <Text style={dynamicStyles.detailText}>{ride.distance} km</Text>
        </View>
        <View style={dynamicStyles.detailRow}>
          <IndianRupee color={colors.textSecondary} size={14} />
          <Text style={dynamicStyles.detailText}>₹{ride.total_fare}</Text>
        </View>
      </View>

      <View style={dynamicStyles.customerInfo}>
        <Text style={dynamicStyles.customerName}>{ride.customer_name}</Text>
      </View>

      {ride.assigned_driver ? (
        <View style={dynamicStyles.assignedInfo}>
          <Text style={dynamicStyles.assignedText}>
            Driver: {ride.assigned_driver.full_name || ride.assigned_driver.name} ({ride.assigned_driver.primary_number || ride.assigned_driver.mobile})
          </Text>
          {ride.assigned_vehicle && (
            <Text style={dynamicStyles.assignedText}>
              Vehicle: {ride.assigned_vehicle.car_name} ({ride.assigned_vehicle.car_number})
            </Text>
          )}
        </View>
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

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Future Rides</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Welcome back, {dashboardData?.user_info?.full_name || user?.fullName || 'Driver'}! • Upcoming bookings
        </Text>
      </View>

      <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        {uniqueRides.map((ride) => (
          <RideCard key={ride.id || ride.booking_id} ride={ride} />
        ))}
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
                        {driver.is_available ? 'Select' : 'Busy'}
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
                        {car.is_available ? 'Select' : 'Busy'}
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