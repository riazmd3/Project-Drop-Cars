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
import { MapPin, Clock, IndianRupee, Car, User, Phone, RefreshCw } from 'lucide-react-native';
import axiosInstance from '@/app/api/axiosInstance';
import * as SecureStore from 'expo-secure-store';

interface CompletedTrip {
  id: string;
  order_id: string;
  pickup: string;
  drop: string;
  customer_name: string;
  customer_mobile: string;
  date: string;
  time: string;
  distance: number;
  fare: number;
  status: string;
  driver_name?: string;
  car_details?: string;
  assignment_id: string;
}

export default function RidesScreen() {
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const { user } = useAuth();

  // Fetch completed trips for Vehicle Owner
  const fetchCompletedTrips = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching completed trips for Vehicle Owner...');
      
      if (!user?.id) {
        console.log('⚠️ No user ID available for fetching trips');
        setCompletedTrips([]);
        return;
      }
      
      // Get Vehicle Owner ID from JWT token
      const authToken = await SecureStore.getItemAsync('authToken');
      if (!authToken) {
        console.log('⚠️ No auth token available');
        setCompletedTrips([]);
        return;
      }
      
      // Try multiple endpoints to get completed assignments
      let response;
      try {
        // First try: Get all assignments for this Vehicle Owner
        console.log('🔍 Trying /api/assignments/vehicle_owner/{id}...');
        response = await axiosInstance.get(`/api/assignments/vehicle_owner/${user.id}`);
      } catch (firstError: any) {
        console.log('⚠️ First endpoint failed, trying alternative...');
        try {
          // Second try: Get assignments using a different endpoint
          console.log('🔍 Trying /api/assignments/vehicle-owner/{id}...');
          response = await axiosInstance.get(`/api/assignments/vehicle-owner/${user.id}`);
        } catch (secondError: any) {
          console.log('⚠️ Second endpoint failed, trying orders endpoint...');
          // Third try: Get from orders endpoint and filter
          response = await axiosInstance.get('/api/orders/vehicle_owner/pending');
          // This will return pending orders, but we'll handle it gracefully
        }
      }
      
      console.log('📊 Raw completed assignments response:', {
        status: response.status,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'N/A'
      });
      
      const allAssignments = Array.isArray(response.data) ? response.data : [];
      
      // Filter for completed assignments only
      const completedAssignments = allAssignments.filter((assignment: any) => 
        assignment.assignment_status === 'COMPLETED' || 
        assignment.status === 'COMPLETED' ||
        assignment.assignment_status === 'completed' ||
        assignment.status === 'completed'
      );
      
      console.log('📊 Filtered completed assignments:', {
        totalAssignments: allAssignments.length,
        completedAssignments: completedAssignments.length,
        statuses: allAssignments.map((a: any) => a.assignment_status || a.status)
      });
      
      // If no completed assignments found, show a message
      if (completedAssignments.length === 0) {
        console.log('ℹ️ No completed assignments found. This could mean:');
        console.log('• No trips have been completed yet');
        console.log('• API endpoint returns different data structure');
        console.log('• All assignments are still in progress');
      }
      
      // Transform data for display
      const completedTrips: CompletedTrip[] = completedAssignments.map((assignment: any) => {
        console.log('🔄 Processing completed assignment:', {
          id: assignment.id,
          order_id: assignment.order_id,
          assignment_status: assignment.assignment_status,
          vehicle_owner_id: assignment.vehicle_owner_id
        });
        
        // Handle pickup_drop_location JSON parsing
        let pickup = 'Pickup Location';
        let drop = 'Drop Location';
        
        if (assignment.pickup_drop_location) {
          try {
            const location = typeof assignment.pickup_drop_location === 'string' 
              ? JSON.parse(assignment.pickup_drop_location) 
              : assignment.pickup_drop_location;
            const cities = Object.values(location || {});
            pickup = (cities[0] as string) || pickup;
            drop = (cities[1] as string) || drop;
          } catch (e) {
            console.log('⚠️ Failed to parse pickup_drop_location:', e);
          }
        }
        
        return {
          id: assignment.id,
          order_id: assignment.order_id || assignment.booking_id,
          pickup: pickup,
          drop: drop,
          customer_name: assignment.customer_name || 'Customer',
          customer_mobile: assignment.customer_number || assignment.customer_mobile || 'N/A',
          date: assignment.start_date_time ? new Date(assignment.start_date_time).toLocaleDateString() : 'N/A',
          time: assignment.start_date_time ? new Date(assignment.start_date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          distance: assignment.trip_distance || assignment.distance || 0,
          fare: assignment.estimated_price || assignment.total_fare || 0,
          status: assignment.assignment_status || 'COMPLETED',
          driver_name: assignment.driver_name || 'Driver',
          car_details: assignment.car_details || 'Car',
          assignment_id: assignment.id
        };
      });
      
      console.log('✅ Completed trips processed:', {
        totalAssignments: allAssignments.length,
        completedAssignments: completedAssignments.length,
        completedTrips: completedTrips.length,
        trips: completedTrips.map(t => ({ id: t.id, order_id: t.order_id, status: t.status }))
      });
      
      setCompletedTrips(completedTrips);
    } catch (error: any) {
      console.error('❌ Error fetching completed trips:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      setCompletedTrips([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompletedTrips();
    setRefreshing(false);
  };

  // Debug function to test API endpoints
  const handleDebugAPI = async () => {
    if (!user?.id) {
      Alert.alert('Debug Error', 'No user ID available');
      return;
    }

    try {
      console.log('🧪 Testing API endpoints for Vehicle Owner:', user.id);
      
      // Test multiple endpoints
      const endpoints = [
        `/api/assignments/vehicle_owner/${user.id}`,
        `/api/assignments/vehicle-owner/${user.id}`,
        '/api/orders/vehicle_owner/pending',
        '/api/assignments/vehicle-owner/completed'
      ];
      
      let results = '';
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Testing ${endpoint}...`);
          const response = await axiosInstance.get(endpoint);
          results += `✅ ${endpoint}: ${response.status} - ${Array.isArray(response.data) ? response.data.length : 'N/A'} items\n`;
          console.log(`✅ ${endpoint} success:`, response.data);
        } catch (error: any) {
          results += `❌ ${endpoint}: ${error.response?.status || 'Error'} - ${error.message}\n`;
          console.log(`❌ ${endpoint} failed:`, error.message);
        }
      }
      
      Alert.alert(
        'API Endpoint Test Results',
        results,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Debug Error', `Debug failed: ${error.message}`);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCompletedTrips();
  }, []);

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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
    },
    debugButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
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
      backgroundColor: '#D1FAE5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: '#065F46',
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
    },
    customerName: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
  const RideCard = ({ ride }: { ride: CompletedTrip }) => (
    <View style={dynamicStyles.rideCard}>
      <View style={dynamicStyles.rideHeader}>
        <Text style={dynamicStyles.bookingId}>#{ride.order_id}</Text>
        <View style={dynamicStyles.statusBadge}>
          <Text style={dynamicStyles.statusText}>{ride.status.toUpperCase()}</Text>
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
          <Text style={dynamicStyles.detailText}>₹{ride.fare}</Text>
        </View>
      </View>

      <View style={dynamicStyles.customerInfo}>
        <Text style={dynamicStyles.customerName}>{ride.customer_name}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerContent}>
          <Text style={dynamicStyles.headerTitle}>My Trips</Text>
          <Text style={dynamicStyles.headerSubtitle}>Welcome back, {user?.fullName}! • Completed Trips</Text>
        </View>
        <TouchableOpacity onPress={handleDebugAPI} style={dynamicStyles.debugButton}>
          <RefreshCw color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={dynamicStyles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={dynamicStyles.loadingContainer}>
            <Text style={dynamicStyles.loadingText}>Loading completed trips...</Text>
          </View>
        ) : completedTrips.length > 0 ? (
          completedTrips.map((trip) => (
            <RideCard key={trip.id} ride={trip} />
          ))
        ) : (
          <View style={dynamicStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>No completed trips yet</Text>
            <Text style={dynamicStyles.emptySubtext}>
              Your completed trips will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}