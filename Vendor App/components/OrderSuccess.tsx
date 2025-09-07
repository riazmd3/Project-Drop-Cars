import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import { CircleCheck as CheckCircle, MapPin, Calendar, Clock, Car, User, Phone, IndianRupee, FileText, ArrowRight, Chrome as Home, Route, Truck } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OrderSuccessProps {
  visible: boolean;
  onClose: () => void;
  orderData: any;
}

export default function OrderSuccess({
  visible,
  onClose,
  orderData
}: OrderSuccessProps) {
  // Early return if not visible or no order data
  if (!visible || !orderData) {
    return null;
  }
  console.log('orderData................', orderData);

  
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(height)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && orderData) {
      // Reset animations
      checkmarkScale.setValue(0);
      checkmarkOpacity.setValue(0);
      contentSlide.setValue(height);
      backgroundOpacity.setValue(0);

      // Start animation sequence
      Animated.sequence([
        // Fade in background
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Animate checkmark
        Animated.parallel([
          Animated.spring(checkmarkScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.timing(checkmarkOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        // Slide up content
        Animated.spring(contentSlide, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
      ]).start();
    }
  }, [visible, orderData]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const getLocationEntries = () => {
    if (!orderData?.echo?.pickup_drop_location) return [];
    return Object.entries(orderData.echo.pickup_drop_location)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));
  };

  const getLocationLabel = (index: string, isLast: boolean, tripType: string) => {
    const position = parseInt(index);
    if (position === 0) return 'Pickup Location';
    if (tripType === 'Round Trip' && isLast) return 'Return to Pickup';
    if (isLast) return 'Final Destination';
    return `Stop ${position}`;
  };

  if (!orderData) return null;

  const locations = getLocationEntries();
  const tripType = orderData.echo?.trip_type || 'Oneway';



  const getTripTypeColors = (): readonly [ColorValue, ColorValue, ...ColorValue[]] => {
    switch (tripType) {
      case 'Round Trip': return ['#7C3AED', '#A855F7', '#C084FC'];
      case 'Multicity': return ['#DC2626', '#EF4444', '#F87171'];
      default: return ['#059669', '#10B981', '#34D399'];
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        
        {/* Animated Background */}
        <Animated.View 
          style={[
            styles.backgroundGradient,
            { opacity: backgroundOpacity }
          ]}
        >
          <LinearGradient
            colors={getTripTypeColors()}
            style={styles.gradientFull}
          />
        </Animated.View>

        {/* Success Animation */}
        <View style={styles.successContainer}>
          <Animated.View 
            style={[
              styles.checkmarkContainer,
              {
                transform: [{ scale: checkmarkScale }],
                opacity: checkmarkOpacity,
              }
            ]}
          >
            <View style={styles.checkmarkCircle}>
              <CheckCircle size={120} color="#FFFFFF" strokeWidth={3} />
            </View>
          </Animated.View>

          <Text style={styles.successTitle}>Order Created Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Order #{orderData.order_id} has been confirmed and sent to drivers
          </Text>
        </View>

        {/* Content Card */}
        <Animated.View 
          style={[
            styles.contentCard,
            { transform: [{ translateY: contentSlide }] }
          ]}
        >
          <View style={styles.cardHandle} />
          
          <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
            {/* Order Summary */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <FileText size={24} color="#1E40AF" />
                <Text style={styles.sectionTitle}>Order Summary</Text>
              </View>
              
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Order ID</Text>
                  <Text style={styles.summaryValue}>#{orderData.order_id}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Status</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{orderData.trip_status}</Text>
                  </View>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Driver Assignment</Text>
                  <Text style={styles.summaryValue}>{orderData.pick_near_city}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trip Type</Text>
                  <Text style={styles.summaryValue}>{tripType}</Text>
                </View>
              </View>
            </View>

            {/* Customer Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={24} color="#1E40AF" />
                <Text style={styles.sectionTitle}>Customer Details</Text>
              </View>
              
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <User size={20} color="#1E40AF" style={styles.detailIcon} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Customer Name</Text>
                    <Text style={styles.detailValue}>{orderData.echo.customer_name || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Phone size={20} color="#1E40AF" style={styles.detailIcon} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Phone Number</Text>
                    <Text style={styles.detailValue}>{orderData.echo.customer_number}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Car size={20} color="#1E40AF" style={styles.detailIcon} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Vehicle Type</Text>
                    <Text style={styles.detailValue}>{orderData.echo.car_type}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Calendar size={20} color="#1E40AF" style={styles.detailIcon} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Journey Date & Time</Text>
                    <Text style={styles.detailValue}>
                      {formatDateTime(orderData.echo.start_date_time).date} at {formatDateTime(orderData.echo.start_date_time).time}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Route Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Route size={24} color="#1E40AF" />
                <Text style={styles.sectionTitle}>Route Details</Text>
                <View style={styles.routeBadge}>
                  <Text style={styles.routeBadgeText}>{locations.length} stops</Text>
                </View>
              </View>
              
              <View style={styles.routeCard}>
                {locations.map(([index, location], position) => (
                  <View key={index} style={[styles.routeItem, position === locations.length - 1 && styles.lastRouteItem]}>
                    <View style={styles.routeIndicator}>
                      <View style={[
                        styles.routeDot,
                        position === 0 ? styles.routeDotStart : 
                        position === locations.length - 1 ? styles.routeDotEnd : styles.routeDotMiddle
                      ]} />
                      {position < locations.length - 1 && <View style={styles.routeLine} />}
                    </View>
                    <View style={styles.routeContent}>
                      <Text style={styles.routeLabel}>
                        {getLocationLabel(index, position === locations.length - 1, tripType)}
                      </Text>
                      <Text style={styles.routeLocation}>{String(location)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Fare Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IndianRupee size={24} color="#1E40AF" />
                <Text style={styles.sectionTitle}>Fare Breakdown</Text>
              </View>
              
              <View style={styles.fareCard}>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Total Distance</Text>
                  <Text style={styles.fareValue}>{orderData.fare.total_km} km</Text>
                </View>
                
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Base Amount</Text>
                  <Text style={styles.fareValue}>₹{orderData.fare.base_km_amount}</Text>
                </View>

                {orderData.fare.driver_allowance > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Driver Allowance</Text>
                    <Text style={styles.fareValue}>₹{orderData.fare.driver_allowance}</Text>
                  </View>
                )}

                {orderData.fare.extra_driver_allowance > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Extra Driver Allowance</Text>
                    <Text style={styles.fareValue}>₹{orderData.fare.extra_driver_allowance}</Text>
                  </View>
                )}

                {orderData.fare.permit_charges > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Permit Charges</Text>
                    <Text style={styles.fareValue}>₹{orderData.fare.permit_charges}</Text>
                  </View>
                )}

                {orderData.fare.hill_charges > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Hill Charges</Text>
                    <Text style={styles.fareValue}>₹{orderData.fare.hill_charges}</Text>
                  </View>
                )}

                {orderData.fare.toll_charges > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Toll Charges</Text>
                    <Text style={styles.fareValue}>₹{orderData.fare.toll_charges}</Text>
                  </View>
                )}
                
                <View style={[styles.fareRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{orderData.fare.total_amount}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.homeButton}
                onPress={onClose}
              >
                <LinearGradient
                  colors={getTripTypeColors()}
                  style={styles.gradientButton}
                >
                  <Home size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Create New Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientFull: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  checkmarkContainer: {
    marginBottom: 40,
  },
  checkmarkCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  successSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contentCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#202124',
    marginLeft: 12,
    flex: 1,
  },
  routeBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  summaryCard: {
    backgroundColor: '#F8FDF9',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#D1FAE5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  detailIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#5F6368',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#202124',
    fontWeight: '600',
    lineHeight: 22,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  lastRouteItem: {
    marginBottom: 0,
  },
  routeIndicator: {
    alignItems: 'center',
    marginRight: 16,
    width: 24,
  },
  routeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
  },
  routeDotStart: {
    backgroundColor: '#10B981',
  },
  routeDotMiddle: {
    backgroundColor: '#F59E0B',
  },
  routeDotEnd: {
    backgroundColor: '#DC2626',
  },
  routeLine: {
    width: 3,
    height: 36,
    backgroundColor: '#D1D5DB',
    position: 'absolute',
    top: 14,
    borderRadius: 2,
  },
  routeContent: {
    flex: 1,
    paddingTop: -2,
  },
  routeLabel: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '500',
    marginBottom: 4,
  },
  routeLocation: {
    fontSize: 16,
    color: '#202124',
    fontWeight: '600',
    lineHeight: 22,
  },
  fareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E8EAED',
    backgroundColor: '#F8FDF9',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '500',
    flex: 1,
  },
  fareValue: {
    fontSize: 16,
    color: '#202124',
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 18,
    color: '#202124',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 24,
    color: '#059669',
    fontWeight: 'bold',
  },
  actionContainer: {
    paddingVertical: 24,
  },
  homeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});