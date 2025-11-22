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
import { MapPin, Clock, IndianRupee, User, Phone, Car, AlertCircle, X, FileText } from 'lucide-react-native';

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
  buttonText?: string; // Custom button text (e.g., "Accept Booking", "Insufficient Balance", "Assign Driver and Car...")
}

export default function BookingCard({ booking, onAccept, disabled, loading, buttonText }: BookingCardProps) {
  const { colors } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
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

  const formatRoundedDuration = (raw: string): string => {
    if (!raw) return '';
    try {
      const segments = String(raw).split('+');
      let totalMinutes = 0;
      segments.forEach((seg) => {
        const s = seg.toLowerCase();
        const hMatch = s.match(/(\d+)\s*(?:hours?|hrs?|h)\b/);
        const mMatch = s.match(/(\d+)\s*(?:minutes?|mins?|m)\b/);
        const h = hMatch ? Number(hMatch[1]) : 0;
        const m = mMatch ? Number(mMatch[1]) : 0;
        totalMinutes += h * 60 + m;
      });
      const roundedHours = Math.round(totalMinutes / 60);
      return roundedHours > 0 ? `${roundedHours} hrs` : '0 hrs';
    } catch {
      return raw;
    }
  };

  // Helper function to format car type for display
  const formatCarType = (carType: string | null | undefined): string => {
    if (!carType) return '';
    
    const type = String(carType).trim();
    
    // Pattern 1: X_PLUS_Y (e.g., SUV_6_PLUS_1, INNOVA_7_PLUS_1, 7_PLUS_1)
    // Match any text before _PLUS_ or just numbers before _PLUS_
    const plusPattern1 = /^(.+?)_(\d+)_PLUS_(\d+)$/i;
    const plusMatch1 = type.match(plusPattern1);
    
    if (plusMatch1) {
      const base = plusMatch1[1].replace(/_/g, ' ');
      const first = plusMatch1[2];
      const second = plusMatch1[3];
      // If base is just a number or empty, show only the (X+Y) format
      if (base.trim() === '' || /^\d+$/.test(base.trim())) {
        return `(${first}+${second})`;
      }
      return `${base} (${first}+${second})`;
    }
    
    // Pattern 2: X_PLUS_Y with any case variations (PLUS, plus, Plus)
    const plusPattern2 = /^(.+?)_(\d+)_(PLUS|plus|Plus)_(\d+)$/i;
    const plusMatch2 = type.match(plusPattern2);
    
    if (plusMatch2) {
      const base = plusMatch2[1].replace(/_/g, ' ');
      const first = plusMatch2[2];
      const second = plusMatch2[4];
      if (base.trim() === '' || /^\d+$/.test(base.trim())) {
        return `(${first}+${second})`;
      }
      return `${base} (${first}+${second})`;
    }
    
    // Pattern 3: Just numbers with PLUS (e.g., 7_PLUS_1 -> (7+1))
    const justNumbersPattern = /^(\d+)_PLUS_(\d+)$/i;
    const justNumbersMatch = type.match(justNumbersPattern);
    if (justNumbersMatch) {
      return `(${justNumbersMatch[1]}+${justNumbersMatch[2]})`;
    }
    
    // Pattern: NEW_SEDAN_2022_MODEL or similar
    if (type.includes('NEW_SEDAN_2022_MODEL')) {
      return 'NEW SEDAN (2022 MODEL)';
    }
    
    // For other cases, replace underscores with spaces and check for "plus" patterns
    let formatted = type.replace(/_/g, ' ');
    // Try to find "plus" patterns in the formatted string (e.g., "7 Plus 1" -> "(7+1)")
    const plusTextPattern = /(\d+)\s+(?:plus|PLUS|Plus)\s+(\d+)/gi;
    formatted = formatted.replace(plusTextPattern, '($1+$2)');
    
    return formatted;
  };
  
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
    if (acknowledgeInterest) {
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
      padding: 12,
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
      padding: 14,
    },
    modalSection: {
      marginBottom: 8,
    },
    modalLabel: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
      marginBottom: 2,
    },
    modalValue: {
      fontSize: 15,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 6,
    },
    infoTable: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoCellLabel: {
      flex: 1,
      paddingRight: 10,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    infoCellValue: {
      flex: 1,
      paddingLeft: 10,
      backgroundColor: colors.background,
    },
    infoLabel: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'left',
    },
    infoValuePositive: {
      color: '#22c55e',
    },
    cityStart: {
      color: '#22c55e',
      fontFamily: 'Inter-Bold',
    },
    cityEnd: {
      color: '#3b82f6',
      fontFamily: 'Inter-Bold',
    },
    cityEndRed: {
      color: '#EF4444',
      fontFamily: 'Inter-Bold',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
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
      color: colors.text,
      lineHeight: 18,
    },
    link: {
      textDecorationLine: 'underline',
      color: colors.primary,
    },
    modalButtons: {
      flexDirection: 'row',
      marginTop: 6,
      justifyContent: 'space-between',
      paddingBottom: 0,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
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
      paddingVertical: 12,
      alignItems: 'center',
      paddingBottom: 0,
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
              <Text style={dynamicStyles.detailValue}>{formatCarType(carType)}</Text>
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
              <Text style={dynamicStyles.detailValue}>{formatRoundedDuration(estimatedTime)}</Text>
          </View>
        )}
          
          {tripDistance > 0 && (
          <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>Trip Distance:</Text>
              <Text style={dynamicStyles.detailValue}>{tripDistance} km</Text>
          </View>
        )}
          
          {/* Pickup Notes */}
          {booking.pickup_notes && booking.pickup_notes !== 'NILL' && booking.pickup_notes !== 'null' && (
            <View style={dynamicStyles.detailRow}>
              <FileText size={16} color="#EF4444" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={dynamicStyles.detailLabel}>Pickup Notes:</Text>
                <Text style={[dynamicStyles.detailValue, { marginTop: 4, color: '#EF4444' }]}>{booking.pickup_notes}</Text>
              </View>
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
            {buttonText || (disabled ? 'Insufficient Balance' : 'Accept Booking')}
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
              {/* Trip Details Table */}
              <View style={dynamicStyles.modalSection}>
                <View style={dynamicStyles.infoTable}>
                  {/* Row 1: From → To */}
                  <View style={dynamicStyles.infoRow}>
                    <View style={dynamicStyles.infoCellLabel}>
                      <Text style={dynamicStyles.infoLabel}>From → To</Text>
                    </View>
                    <View style={dynamicStyles.infoCellValue}>
                      <Text style={dynamicStyles.infoValue}>
                        {allCities.length > 0 ? (
                          <Text>
                            {/* Start city - Green */}
                            <Text style={{ color: '#10B981', fontWeight: 'bold' }}>From: {allCities[0]}</Text>
                            {/* Middle cities - Blue (stops) */}
                            {allCities.length > 2 && allCities.slice(1, -1).map((city, idx) => (
                              <Text key={`stop-${idx}`}>
                                <Text> → </Text>
                                <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>{city}</Text>
                              </Text>
                            ))}
                            {/* End city - Red */}
                            {allCities.length > 1 && (
                              <>
                                <Text> → </Text>
                                <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>To: {allCities[allCities.length - 1]}</Text>
                              </>
                            )}
                          </Text>
                        ) : startCity && endCity ? (
                          <Text>
                            <Text style={{ color: '#10B981', fontWeight: 'bold' }}>From: {startCity}</Text>
                            <Text> → </Text>
                            <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>To: {endCity}</Text>
                          </Text>
                        ) : pickup && drop ? (
                          <Text>
                            <Text style={{ color: '#10B981', fontWeight: 'bold' }}>From: {pickup}</Text>
                            <Text> → </Text>
                            <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>To: {drop}</Text>
                          </Text>
                        ) : (
                          <Text>N/A</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Row 2: Trip Type */}
                  {tripType && (
                    <View style={dynamicStyles.infoRow}>
                      <View style={dynamicStyles.infoCellLabel}>
                        <Text style={dynamicStyles.infoLabel}>Trip Type</Text>
                      </View>
                      <View style={dynamicStyles.infoCellValue}>
                        <Text style={dynamicStyles.infoValue}>{tripType}</Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Row 3: Car Type */}
                  {carType && (
                    <View style={dynamicStyles.infoRow}>
                      <View style={dynamicStyles.infoCellLabel}>
                        <Text style={dynamicStyles.infoLabel}>Car Type</Text>
                      </View>
                      <View style={dynamicStyles.infoCellValue}>
                        <Text style={[dynamicStyles.infoValue, { color: '#3B82F6' }]}>{formatCarType(carType)}</Text>
                      </View>
                    </View>
                  )}
                  
                  {/* Row 4: KM & Time */}
                  {(tripDistance > 0 || estimatedTime) && (
                    <View style={[dynamicStyles.infoRow, !pickupDate && !(assignmentWindowDuration || deadlineTime) && dynamicStyles.infoRowLast]}>
                      <View style={dynamicStyles.infoCellLabel}>
                        <Text style={dynamicStyles.infoLabel}>Distance & Duration</Text>
                      </View>
                      <View style={dynamicStyles.infoCellValue}>
                        <Text style={[dynamicStyles.infoValue, { color: '#000000' }]}>
                          {tripDistance || 0}kms - {formatRoundedDuration(estimatedTime)}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {pickupDate && (
                    <View style={[dynamicStyles.infoRow, !(assignmentWindowDuration || deadlineTime) && dynamicStyles.infoRowLast]}>
                      <View style={dynamicStyles.infoCellLabel}>
                        <Text style={dynamicStyles.infoLabel}>Pickup Date & Time</Text>
                      </View>
                      <View style={dynamicStyles.infoCellValue}>
                        <Text style={dynamicStyles.infoValue}>{pickupDate}{pickupTime ? ` • ${pickupTime}` : ''}</Text>
                      </View>
                    </View>
                  )}
                  {(assignmentWindowDuration || deadlineTime) && (
                    <View style={[dynamicStyles.infoRow, dynamicStyles.infoRowLast]}>
                      <View style={dynamicStyles.infoCellLabel}>
                        <Text style={dynamicStyles.infoLabel}>Driver & Car Assignment Time</Text>
                      </View>
                      <View style={dynamicStyles.infoCellValue}>
                        <Text style={[dynamicStyles.infoValue, dynamicStyles.infoValuePositive]}>
                          {assignmentWindowDuration || ''}{(assignmentWindowDuration && deadlineTime) ? ' - ' : ''}{deadlineTime || ''}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Pickup Notes - Above Terms and Conditions */}
              {booking.pickup_notes && booking.pickup_notes !== 'NILL' && booking.pickup_notes !== 'null' && (
                <View style={dynamicStyles.modalSection}>
                  <View style={dynamicStyles.detailRow}>
                    <FileText size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[dynamicStyles.detailLabel, { color: colors.text }]}>Pickup Notes:</Text>
                      <Text style={[dynamicStyles.detailValue, { marginTop: 4, color: '#EF4444' }]}>{booking.pickup_notes}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Terms acknowledgement */}
              <View style={dynamicStyles.modalSection}>
                <View style={dynamicStyles.checkboxRow}>
                  <TouchableOpacity
                    style={[dynamicStyles.checkbox, acknowledgeInterest && dynamicStyles.checkboxChecked]}
                    onPress={() => setAcknowledgeInterest(!acknowledgeInterest)}
                  >
                    {acknowledgeInterest && <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={dynamicStyles.checkboxText}>
                    I accept the Drop Cars <Text style={dynamicStyles.link} onPress={() => setShowTermsModal(true)}>Terms and Conditions</Text>.
                  </Text>
                </View>
              </View>

              

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
                  <Text style={dynamicStyles.cancelButtonText}>Back</Text>
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

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { maxWidth: 420 }]}> 
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalHeaderText}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)} style={dynamicStyles.modalCloseButton}>
                <X color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={dynamicStyles.modalBody}>
              <View style={dynamicStyles.modalSection}>
                <Text style={dynamicStyles.modalValue}>
                I am interested in this trip and agree to follow all Drop Cars rules.
I understand that the required wallet amount for this trip will be held until the trip is completed.
I agree that if I fail to assign driver and vehicle details within the given time, or if I do not complete the trip after accepting, the held amount will be deducted as penalty.
</Text>
<Text style={dynamicStyles.modalValue}>
I also understand that approaching or dealing with the customer directly outside the Drop Cars platform will result in permanent termination of my account.
                </Text>
                <Text style={[dynamicStyles.modalLabel, { marginTop: 8 }]}>Penalties</Text>
                <Text style={dynamicStyles.modalValue}>-> Penalties may apply up to ₹1000 or more as per Drop Cars Rules.</Text>
                {/* <Text style={dynamicStyles.modalValue}>2) Assignment penalty up to ₹500</Text>
                <Text style={dynamicStyles.modalValue}>3) On Time/App related penalty up to ₹500</Text> */}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}