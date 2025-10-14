import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, Clock, IndianRupee, User, Phone, Car } from 'lucide-react-native';

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
}

interface BookingCardProps {
  booking: Booking;
  onAccept: (booking: Booking) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function BookingCard({ booking, onAccept, disabled, loading }: BookingCardProps) {
  const { colors } = useTheme();
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
  const loc = safePickLoc((booking as any).pickup_drop_location);
  const cities = Object.values(loc || {});
  const pickup = booking.pickup || String(cities[0] ?? '');
  const drop = booking.drop || String(cities[1] ?? '');

  const displayPrice = toNumber((booking as any).estimated_price ?? (booking as any).vendor_price ?? (booking as any).total_fare);
  const customerNumber = (booking as any).customer_number || (booking as any).customer_mobile || '';
  const carType = (booking as any).car_type || booking.car_type || '';
  const tripType = (booking as any).trip_type || booking.trip_type || '';
  const nearCity = (booking as any).pick_near_city || (booking as any).near_city || '';
  const startDateTime = (booking as any).start_date_time || '';
  const estimatedTime = (booking as any).trip_time || booking.trip_time || '';
  const createdAt = (booking as any).created_at || '';
  const maxAssignMs = Number((booking as any).max_time_to_assign_order || 0);
  const expiresAt = (booking as any).expires_at || '';
  const computeDeadline = (): string => {
    try {
      if (expiresAt) {
        const d = new Date(expiresAt);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (createdAt && maxAssignMs > 0) {
        const d = new Date(new Date(createdAt).getTime() + maxAssignMs);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return '';
  };
  const deadlineTime = computeDeadline();
  const dynamicStyles = StyleSheet.create({
    card: {
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
    disabledCard: {
      opacity: 0.6,
    },
    header: {
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
    fareContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#D1FAE5',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    totalFare: {
      marginLeft: 4,
      fontSize: 16,
      fontFamily: 'Inter-Bold',
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
    detailsContainer: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    detailText: {
      marginLeft: 8,
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    tripInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 8,
      marginBottom: 16,
    },
    tripInfoText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      textAlign: 'center',
    },
    acceptButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    acceptButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
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
  });
  return (
    <View style={[dynamicStyles.card, disabled && dynamicStyles.disabledCard]}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.bookingId}>#{booking.order_id}</Text>
        <View style={dynamicStyles.fareContainer}>
          <IndianRupee color={colors.success} size={16} />
          <Text style={dynamicStyles.totalFare}>₹{displayPrice}</Text>
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

      <View style={dynamicStyles.detailsContainer}>
        <View style={dynamicStyles.detailRow}>
          <User color={colors.textSecondary} size={14} />
          <Text style={dynamicStyles.detailText}>{booking.customer_name}</Text>
        </View>
        <View style={dynamicStyles.detailRow}>
          <Phone color={colors.textSecondary} size={14} />
          <Text style={dynamicStyles.detailText}>{customerNumber}</Text>
        </View>
        {!!carType && (
          <View style={dynamicStyles.detailRow}>
            <Car color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>Car Type: {carType}</Text>
          </View>
        )}
        {!!tripType && (
          <View style={dynamicStyles.detailRow}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>Trip: {tripType}</Text>
          </View>
        )}
        {!!nearCity && (
          <View style={dynamicStyles.detailRow}>
            <MapPin color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>City: {nearCity}</Text>
          </View>
        )}
        {!!startDateTime && (
          <View style={dynamicStyles.detailRow}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>Start: {new Date(startDateTime).toLocaleString()}</Text>
          </View>
        )}
        {!!estimatedTime && (
          <View style={dynamicStyles.detailRow}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>Estimated time: {estimatedTime}</Text>
          </View>
        )}
        {!!deadlineTime && (
          <View style={dynamicStyles.detailRow}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={dynamicStyles.detailText}>Max assign by: {deadlineTime}</Text>
          </View>
        )}
      </View>

      {!!((booking as any).trip_distance || booking.fare_per_km) && (
        <View style={dynamicStyles.tripInfo}>
          <Text style={dynamicStyles.tripInfoText}>
            {(booking as any).trip_distance ?? 0} km {booking.fare_per_km ? `• ₹${booking.fare_per_km}/km` : ''}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          dynamicStyles.acceptButton,
          disabled && dynamicStyles.disabledButton,
          loading && dynamicStyles.loadingButton
        ]}
        onPress={() => onAccept(booking)}
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
  );
}