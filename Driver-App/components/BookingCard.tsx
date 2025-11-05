import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, Clock, IndianRupee, User, Phone, Car, AlertCircle, X } from 'lucide-react-native';

interface Booking {
  order_id: number;
  pickup: string;
  drop: string;
  customer_name: string;
  customer_number: string;
  estimated_price: number;
  trip_distance?: number;
  fare_per_km?: number;
  car_type?: string;
  trip_type?: string;
  pick_near_city?: string;
  start_date_time?: string;
  trip_time?: string;
  created_at?: string;
  max_time_to_assign_order?: string;
  expires_at?: string;
  charges_to_deduct?: number;
  pickup_notes?: string;
  pickup_drop_location?: any; // Add this to access raw location data
}

interface BookingCardProps {
  booking: Booking;
  onAccept: (booking: Booking) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function BookingCard({ booking, onAccept, disabled, loading }: BookingCardProps) {
  const { colors } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acknowledgeInterest, setAcknowledgeInterest] = useState(false);
  const [acknowledgePenalties, setAcknowledgePenalties] = useState(false);
  console.log('booking data', booking);

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
  // Priority: use booking.pickup_drop_location if available, otherwise parse from booking props
  const rawLocation = booking.pickup_drop_location || (booking as any).pickup_drop_location;
  const loc = safePickLoc(rawLocation);
  
  // Parse all cities for multicity trips - extract ALL numeric keys (0, 1, 2, 3, etc.)
  const getAllCities = (): string[] => {
    const cities: string[] = [];
    
    // First, try to get from pickup_drop_location object
    if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
      // Extract all numeric keys (0, 1, 2, 3, etc.) and sort them
      const allKeys = Object.keys(loc);
      const numericKeys = allKeys
        .filter(k => {
          const num = Number(k);
          return !isNaN(num) && isFinite(num) && num >= 0;
        })
        .map(k => Number(k))
        .sort((a, b) => a - b);
      
      if (numericKeys.length > 0) {
        // Add cities in order based on numeric keys (preserve duplicates for proper ordering)
        numericKeys.forEach(key => {
          const cityValue = loc[String(key)];
          const city = cityValue ? String(cityValue).trim() : '';
          if (city) {
            cities.push(city);
          }
        });
        
        if (cities.length > 0) {
          return cities;
        }
      }
      
      // Fallback to named keys
      if (loc.pickup) cities.push(String(loc.pickup));
      if (loc.drop && loc.drop !== loc.pickup) cities.push(String(loc.drop));
      if (cities.length > 0) return cities;
    }
    
    // Final fallback: use booking pickup/drop props
    const pickup = booking.pickup || '';
    const drop = booking.drop || '';
    if (pickup) cities.push(pickup);
    if (drop && drop !== pickup) cities.push(drop);
    
    return cities;
  };
  
  const allCities = getAllCities();
  const isMulticity = allCities.length > 2;
  const startCity = allCities[0] || booking.pickup || '';
  const endCity = allCities.length > 1 ? allCities[allCities.length - 1] : (booking.drop || '');
  const middleCities = allCities.length > 2 ? allCities.slice(1, -1) : [];
  
  // For display, use parsed cities or fallback to props
  const pickup = startCity;
  const drop = endCity;

  const displayPrice = toNumber((booking as any).estimated_price ?? (booking as any).vendor_price ?? (booking as any).total_fare);
  const customerNumber = (booking as any).customer_number || (booking as any).customer_mobile || '';
  const carType = (booking as any).car_type || booking.car_type || '';
  const tripType = (booking as any).trip_type || booking.trip_type || '';
  const nearCity = (booking as any).pick_near_city || (booking as any).near_city || '';
  const startDateTime = (booking as any).start_date_time || '';
  const estimatedTime = (booking as any).trip_time || booking.trip_time || '';
  const chargesToDeduct = Number(booking.charges_to_deduct || 0);
  const isHourlyRental = String(tripType || '').toLowerCase().includes('hour');
  const createdAt = booking.created_at || '';
  const maxTimeToAssign = booking.max_time_to_assign_order || '';
  const expiresAt = booking.expires_at || '';
  
  // Parse date and time from start_date_time
  const getPickupDate = (): string => {
    if (!startDateTime) return '';
    try {
      const date = new Date(startDateTime);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };
  
  const getPickupTime = (): string => {
    if (!startDateTime) return '';
    try {
      const date = new Date(startDateTime);
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };
  
  const pickupDate = getPickupDate();
  const pickupTime = getPickupTime();
  const tripDistance = toNumber((booking as any).trip_distance || 0);
  
  const computeDeadline = (): string => {
    try {
      console.log('🕐 Computing deadline:', { 
        createdAt, 
        maxTimeToAssign, 
        expiresAt,
        bookingData: booking 
      });
      
      // If expires_at is provided, use it directly
      if (expiresAt) {
        const d = new Date(expiresAt);
        const deadline = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log('🕐 Using expires_at deadline:', deadline);
        return deadline;
      }
      // If max_time_to_assign_order is provided as a timestamp, use it directly
      if (maxTimeToAssign) {
        const d = new Date(maxTimeToAssign);
        const deadline = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log('🕐 Using max_time_to_assign_order deadline:', deadline);
        return deadline;
      }
      
      console.log('🕐 No deadline data available');
    } catch (error) {
      console.error('Error computing deadline:', error);
    }
    return '';
  };
  const deadlineTime = computeDeadline();

  // Calculate maximum assignment window duration
  const getAssignmentWindowDuration = (): string => {
    try {
      if (!createdAt || !maxTimeToAssign) {
        return '';
      }

      const createdDate = new Date(createdAt);
      const maxAssignDate = new Date(maxTimeToAssign);
      const diffMs = maxAssignDate.getTime() - createdDate.getTime();
      
      if (diffMs <= 0) return '';
      
      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating assignment window:', error);
      return '';
    }
  };

  const assignmentWindowDuration = getAssignmentWindowDuration();

  // Calculate time remaining for assignment
  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        const createdAt = booking.created_at;
        const maxTimeToAssign = booking.max_time_to_assign_order;
        
        console.log('⏰ Calculating time remaining:', { 
          createdAt, 
          maxTimeToAssign,
          bookingOrderId: booking.order_id 
        });
        
        if (!createdAt || !maxTimeToAssign) {
          console.log('⏰ Missing data for time calculation');
          setTimeRemaining('');
          return;
        }

        const createdDate = new Date(createdAt);
        const maxAssignDate = new Date(maxTimeToAssign);
        const now = new Date();
        
        console.log('⏰ Date calculations:', {
          createdDate: createdDate.toISOString(),
          maxAssignDate: maxAssignDate.toISOString(),
          now: now.toISOString()
        });
        
        const timeDiff = maxAssignDate.getTime() - now.getTime();
        
        console.log('⏰ Time difference (ms):', timeDiff);
        
        if (timeDiff <= 0) {
          console.log('⏰ Time expired');
          setTimeRemaining('EXPIRED');
          return;
        }
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        let timeString = '';
        if (hours > 0) {
          timeString = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
          timeString = `${minutes}m ${seconds}s`;
        } else {
          timeString = `${seconds}s`;
        }
        
        console.log('⏰ Calculated time remaining:', timeString);
        setTimeRemaining(timeString);
      } catch (error) {
        console.error('Error calculating time remaining:', error);
        setTimeRemaining('');
      }
    };

    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [booking]);

  const handleAcceptPress = () => {
    setShowConfirmModal(true);
  };
  
  const handleConfirmAccept = () => {
    if (acknowledgeInterest && acknowledgePenalties) {
      setShowConfirmModal(false);
      setAcknowledgeInterest(false);
      setAcknowledgePenalties(false);
      onAccept(booking);
    }
  };

  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    disabledCard: {
      opacity: 0.6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    bookingId: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    tripTypeText: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: '#EF4444', // Red color
    },
    routeContainer: {
      marginBottom: 8,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    routeText: {
      marginLeft: 8,
      fontSize: 15,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      flex: 1,
    },
    routeTextGreen: {
      color: '#10B981', // Green for start
    },
    routeTextRed: {
      color: '#EF4444', // Red for end
    },
    routeTextBlue: {
      color: '#3B82F6', // Blue for middle cities
    },
    routeLine: {
      width: 1,
      height: 12,
      backgroundColor: colors.border,
      marginLeft: 8,
      marginVertical: 2,
    },
    detailsContainer: {
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.textSecondary,
      minWidth: 120,
    },
    detailValue: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      flex: 1,
    },
    fareContainer: {
      backgroundColor: '#D1FAE5',
      borderRadius: 10,
      paddingVertical: 3,
      paddingHorizontal: 5,
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
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: '#065F46',
    },
    acceptButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    acceptButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-Bold',
    },
    disabledButton: {
      backgroundColor: '#9CA3AF',
    },
    disabledButtonText: {
      color: '#E5E7EB',
    },
    loadingButton: {
      backgroundColor: colors.primary,
      opacity: 0.8,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      maxHeight: '90%',
    },
    modalHeader: {
      backgroundColor: colors.primary,
      padding: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalHeaderText: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      flex: 1,
    },
    modalCloseButton: {
      padding: 4,
      color: 'red',
    },
    modalBody: {
      padding: 20,
    },
    modalSection: {
      marginBottom: 20,
    },
    modalLabel: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    modalValue: {
      fontSize: 15,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 12,
    },
    termsContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    termsText: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 4,
      marginRight: 12,
      marginTop: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    checkboxText: {
      flex: 1,
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: 'red',
      lineHeight: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      marginTop: 8,
      justifyContent: 'space-between',
      paddingBottom: 50,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 15,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    confirmButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      paddingBottom: 10,
    },
    confirmButtonText: {
      fontSize: 15,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    confirmButtonDisabled: {
      opacity: 0.5,
    },
  });
  return (
    <>
      <View style={[dynamicStyles.card, disabled && dynamicStyles.disabledCard]}>
        {/* Header: Booking ID and Trip Type */}
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.bookingId}>Booking ID: #{booking.order_id}</Text>
          {tripType && (
            <Text style={dynamicStyles.tripTypeText}>{tripType}</Text>
          )}
        </View>

        {/* Route: From/To with multicity support */}
        <View style={dynamicStyles.routeContainer}>
          {allCities.length > 0 && (
            <>
              {/* Start city - Green */}
              <View style={dynamicStyles.routeRow}>
                <MapPin color="#10B981" size={18} />
                <Text style={[dynamicStyles.routeText, dynamicStyles.routeTextGreen]}>
                  From: {startCity}
                </Text>
              </View>
              
              {/* Middle cities - Blue (only show if there are 3+ cities) */}
              {allCities.length > 2 && middleCities.map((city, idx) => (
                <View key={`middle-${idx}-${city}`}>
                  <View style={dynamicStyles.routeLine} />
                  <View style={dynamicStyles.routeRow}>
                    <MapPin color="#3B82F6" size={18} />
                    <Text style={[dynamicStyles.routeText, dynamicStyles.routeTextBlue]}>
                      {city}
                    </Text>
                  </View>
                </View>
              ))}
              
              {/* End city - Red (always show if different from start or if there are multiple cities) */}
              {allCities.length > 1 && (
                <>
                  <View style={dynamicStyles.routeLine} />
                  <View style={dynamicStyles.routeRow}>
                    <MapPin color="#EF4444" size={18} />
                    <Text style={[dynamicStyles.routeText, dynamicStyles.routeTextRed]}>
                      To: {endCity}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* Details Section */}
        <View style={dynamicStyles.detailsContainer}>
          {carType && (
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Vehicle Type:</Text>
              <Text style={dynamicStyles.detailValue}>{carType}</Text>
            </View>
          )}
          {pickupDate && (
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Pick Up Date:</Text>
              <Text style={dynamicStyles.detailValue}>{pickupDate}</Text>
            </View>
          )}
          
          {pickupTime && (
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Pick Up Time:</Text>
              <Text style={dynamicStyles.detailValue}>{pickupTime}</Text>
            </View>
          )}
          
          {estimatedTime && (
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Trip Duration:</Text>
              <Text style={dynamicStyles.detailValue}>{estimatedTime}</Text>
            </View>
          )}
          
          {tripDistance > 0 && (
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Trip Distance:</Text>
              <Text style={dynamicStyles.detailValue}>{tripDistance} km</Text>
            </View>
          )}
        </View>

        {/* Fare - Above Accept Button */}
        <View style={dynamicStyles.fareContainer}>
          <Text style={dynamicStyles.fareLabel}>Total Fare</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IndianRupee color="#065F46" size={20} />
            <Text style={dynamicStyles.totalFare}>{displayPrice}</Text>
          </View>
        </View>

        {/* Accept Button */}
        <TouchableOpacity
          style={[
            dynamicStyles.acceptButton,
            disabled && dynamicStyles.disabledButton,
            loading && dynamicStyles.loadingButton
          ]}
          onPress={handleAcceptPress}
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={dynamicStyles.acceptButtonText}>Accepting...</Text>
            </>
          ) : (
            <Text style={[dynamicStyles.acceptButtonText, disabled && dynamicStyles.disabledButtonText]}>
              {disabled ? 'Insufficient Balance' : 'Accept Booking'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowConfirmModal(false);
          setAcknowledgeInterest(false);
          setAcknowledgePenalties(false);
        }}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            {/* Modal Header */}
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalHeaderText}>
                Booking Response Details #{booking.order_id}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowConfirmModal(false);
                  setAcknowledgeInterest(false);
                  setAcknowledgePenalties(false);
                }}
                style={dynamicStyles.modalCloseButton}
              >
                <X color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={dynamicStyles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Trip Details */}
              <View style={dynamicStyles.modalSection}>
                <Text style={dynamicStyles.modalLabel}>Trip:</Text>
                <Text style={dynamicStyles.modalValue}>
                  {startCity && endCity ? `${startCity} → ${endCity}` : pickup && drop ? `${pickup} → ${drop}` : 'N/A'}
                  {tripType && `, ${tripType}`}
                  {carType && ` For ${carType}`}
                </Text>

                {pickupDate && (
                  <>
                    <Text style={dynamicStyles.modalLabel}>Pickup:</Text>
                    <Text style={dynamicStyles.modalValue}>
                      {pickupDate} At {pickup || startCity}
                    </Text>
                  </>
                )}

                {endCity && (
                  <>
                    <Text style={dynamicStyles.modalLabel}>Drop Location:</Text>
                    <Text style={dynamicStyles.modalValue}>{endCity}</Text>
                  </>
                )}
              </View>

              {/* Terms and Conditions */}
              <View style={dynamicStyles.modalSection}>
                <Text style={[dynamicStyles.modalLabel, { marginBottom: 8 }]}>Terms and Conditions</Text>
                <View style={dynamicStyles.termsContainer}>
                  <Text style={dynamicStyles.termsText}>
                    I'm interested in this trip and will comply with all the terms and conditions of Drop Cars.
                  </Text>
                  <Text style={dynamicStyles.termsText}>
                    I acknowledge and agree to the penalties in case of any non-compliance or delays from my side: Unallocation penalty up to ₹2000, Assignment penalty up to ₹500, On Time/App Related penalty up to ₹500.
                  </Text>
                </View>
              </View>

              {/* Checkboxes */}
              <View style={dynamicStyles.checkboxRow}>
                <TouchableOpacity
                  style={[dynamicStyles.checkbox, acknowledgeInterest && dynamicStyles.checkboxChecked]}
                  onPress={() => setAcknowledgeInterest(!acknowledgeInterest)}
                >
                  {acknowledgeInterest && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                </TouchableOpacity>
                <Text style={dynamicStyles.checkboxText}>
                I'm interested in this trip and comply with all terms and conditions of Drop Cars And I acknowledge and agree to the penalty in case of any non-compliance from my side and unallocation and assignment penalty as per terms.
                </Text>
              </View>

              {/* <View style={dynamicStyles.checkboxRow}>
                <TouchableOpacity
                  style={[dynamicStyles.checkbox, acknowledgePenalties && dynamicStyles.checkboxChecked]}
                  onPress={() => setAcknowledgePenalties(!acknowledgePenalties)}
                >
                  {acknowledgePenalties && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                </TouchableOpacity>
                <Text style={dynamicStyles.checkboxText}>
                  I acknowledge and agree to the above penalties in case of any non-compliance or delays from my side.
                </Text>
              </View> */}

              {/* Action Buttons */}
              <View style={dynamicStyles.modalButtons}>
                <TouchableOpacity
                  style={[dynamicStyles.cancelButton, { marginRight: 6 }]}
                  onPress={() => {
                    setShowConfirmModal(false);
                    setAcknowledgeInterest(false);
                    setAcknowledgePenalties(false);
                  }}
                >
                  <Text style={dynamicStyles.cancelButtonText}>Do not Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    dynamicStyles.confirmButton,
                    { marginLeft: 6 },
                    (!acknowledgeInterest) && dynamicStyles.confirmButtonDisabled
                  ]}
                  onPress={handleConfirmAccept}
                  disabled={!acknowledgeInterest }
                >
                  <Text style={dynamicStyles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}