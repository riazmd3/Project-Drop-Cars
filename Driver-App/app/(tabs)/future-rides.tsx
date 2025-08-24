import React, { useState, useEffect } from 'react';
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
import { useDashboard } from '@/contexts/DashboardContext';
import { MapPin, Clock, IndianRupee, User, Phone, Car, X } from 'lucide-react-native';

// Type definitions
interface FutureRide {
  id: string;
  booking_id: string;
  pickup: string;
  drop: string;
  customer_name: string;
  customer_mobile: string;
  date: string;
  time: string;
  distance: number;
  fare_per_km: number;
  total_fare: number;
  status: string;
  assigned_driver: any | null;
}

// Sample future rides data - replace with real API data later
const sampleFutureRides: FutureRide[] = [
  {    
    id: '1',
    booking_id: 'B125',
    pickup: 'Adyar',
    drop: 'Velachery',
    customer_name: 'Lakshmi Devi', 
    customer_mobile: '9988776655',
    date: '2025-01-21',
    time: '10:00',
    distance: 25,
    fare_per_km: 12,
    total_fare: 300,
    status: 'confirmed',
    assigned_driver: null
  },
  {
    id: '2',
    booking_id: 'B126',
    pickup: 'T Nagar',
    drop: 'Tambaram',
    customer_name: 'Ravi Shankar',
    customer_mobile: '9876543210',
    date: '2025-01-22',
    time: '14:30',
    distance: 35,
    fare_per_km: 10,
    total_fare: 350,
    status: 'confirmed',
    assigned_driver: null
  },
];

export default function FutureRidesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { dashboardData, loading, error } = useDashboard();
  const [rides, setRides] = useState<FutureRide[]>(sampleFutureRides);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<FutureRide | null>(null);

  // Get available drivers from dashboard data
  const availableDrivers = dashboardData?.drivers || [];

  const generateQuickId = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const assignDriver = (ride: FutureRide, driver: any) => {
    const quickId = generateQuickId();
    
    const updatedRides = rides.map(r => 
      r.id === ride.id 
        ? { ...r, assigned_driver: { ...driver, quickId }, status: 'assigned' }
        : r
    );
    
    setRides(updatedRides);
    setShowAssignModal(false);
    setSelectedRide(null);
    
    Alert.alert(
      'Driver Assigned',
      `${driver.full_name} has been assigned to trip ${ride.booking_id}\n\nQuick ID: ${quickId}\nMobile: ${driver.primary_number}\n\nThe driver can now login using Quick Driver mode.`
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
            Assigned to: {ride.assigned_driver.full_name || ride.assigned_driver.name} ({ride.assigned_driver.primary_number || ride.assigned_driver.mobile})
          </Text>
          <Text style={dynamicStyles.assignedText}>
            Quick ID: {ride.assigned_driver.quickId}
          </Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={dynamicStyles.assignButton}
          onPress={() => {
            setSelectedRide(ride);
            setShowAssignModal(true);
          }}
        >
          <Text style={dynamicStyles.assignButtonText}>Assign Driver</Text>
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
        {rides.map((ride) => (
          <RideCard key={ride.id} ride={ride} />
        ))}
      </ScrollView>

      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Assign Driver</Text>
              <TouchableOpacity 
                onPress={() => setShowAssignModal(false)}
                style={dynamicStyles.closeButton}
              >
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {availableDrivers.length > 0 ? (
                availableDrivers.map((driver) => (
                  <View key={driver.id} style={dynamicStyles.driverCard}>
                    <View style={dynamicStyles.driverInfo}>
                      <Text style={dynamicStyles.driverName}>{driver.full_name}</Text>
                      <Text style={dynamicStyles.driverMobile}>{driver.primary_number}</Text>
                    </View>
                    <TouchableOpacity
                      style={dynamicStyles.selectButton}
                      onPress={() => selectedRide && assignDriver(selectedRide, driver)}
                    >
                      <Text style={dynamicStyles.selectButtonText}>Select</Text>
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
    </SafeAreaView>
  );
}