import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CheckCircle,
  MapPin,
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  IndianRupee,
  Send,
  X,
  FileText,
  Mountain,
  ChevronDown
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const cities = [
  'Chennai',
  'Bangalore',
  'Mumbai',
  'Delhi',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Ahmedabad'
];

interface QuoteReviewProps {
  visible: boolean;
  onClose: () => void;
  quoteData: any;
  onConfirmOrder: (sendTo: string, nearCity?: string) => Promise<void>;
  isLoading: boolean;
}

export default function QuoteReview({
  visible,
  onClose,
  quoteData,
  onConfirmOrder,
  isLoading
}: QuoteReviewProps) {
  const [showSendToPicker, setShowSendToPicker] = useState(false);
  const [showNearCityPicker, setShowNearCityPicker] = useState(false);
  const [sendTo, setSendTo] = useState<'ALL' | 'NEAR_CITY'>('ALL');
  const [nearCity, setNearCity] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successScale] = useState(new Animated.Value(0));

  const handleConfirmOrder = async () => {
    if (sendTo === 'NEAR_CITY' && !nearCity) {
      Alert.alert('Error', 'Please select a near city when sending to NEAR_CITY');
      return;
    }

    try {
      await onConfirmOrder(sendTo, nearCity);
      
      // Show success animation
      setShowSuccess(true);
      Animated.spring(successScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start();

      // Auto close after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        successScale.setValue(0);
      }, 3000);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create order. Please try again.');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (!quoteData) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#5F6368" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Review & Confirm Order</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quote Summary */}
          <View style={styles.quoteSummary}>
            <View style={styles.quoteHeader}>
              <Text style={styles.quoteTitle}>Trip Quote</Text>
              <View style={styles.quoteBadge}>
                <Text style={styles.quoteBadgeText}>Generated</Text>
              </View>
            </View>
            
            <View style={styles.fareBreakdown}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance:</Text>
                <Text style={styles.fareValue}>{quoteData.fare.total_km} km</Text>
              </View>
              
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Base Fare:</Text>
                <Text style={styles.fareValue}>₹{quoteData.fare.base_km_amount.toFixed(2)}</Text>
              </View>
              
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Driver Allowance:</Text>
                <Text style={styles.fareValue}>₹{quoteData.fare.driver_allowance.toFixed(2)}</Text>
              </View>
              
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Extra Charges:</Text>
                <Text style={styles.fareValue}>₹{(quoteData.fare.permit_charges + quoteData.fare.hill_charges + quoteData.fare.toll_charges).toFixed(2)}</Text>
              </View>
              
              <View style={[styles.fareRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>₹{quoteData.fare.total_amount.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            
            {/* Customer Info */}
            <View style={styles.detailRow}>
              <User size={20} color="#4285F4" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Customer Name</Text>
                <Text style={styles.detailValue}>{quoteData.echo.customer_name}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Phone size={20} color="#34A853" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{quoteData.echo.customer_number}</Text>
              </View>
            </View>

            {/* Trip Info */}
            <View style={styles.detailRow}>
              <Car size={20} color="#FBBC04" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Car Type</Text>
                <Text style={styles.detailValue}>{quoteData.echo.car_type}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Calendar size={20} color="#EA4335" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDateTime(quoteData.echo.start_date_time).date}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Clock size={20} color="#EA4335" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{formatDateTime(quoteData.echo.start_date_time).time}</Text>
              </View>
            </View>

            {/* Locations */}
            <View style={styles.detailRow}>
              <MapPin size={20} color="#34A853" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pickup Location</Text>
                <Text style={styles.detailValue}>{quoteData.echo.pickup_drop_location['0']}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MapPin size={20} color="#EA4335" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Drop Location</Text>
                <Text style={styles.detailValue}>{quoteData.echo.pickup_drop_location['1']}</Text>
              </View>
            </View>

            {/* Pricing Details */}
            <View style={styles.detailRow}>
              <IndianRupee size={20} color="#4285F4" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Cost per KM</Text>
                <Text style={styles.detailValue}>₹{quoteData.echo.cost_per_km}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Car size={20} color="#34A853" style={styles.detailIcon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Driver Allowance</Text>
                <Text style={styles.detailValue}>₹{quoteData.echo.driver_allowance}</Text>
              </View>
            </View>

            {quoteData.echo.permit_charges > 0 && (
              <View style={styles.detailRow}>
                <FileText size={20} color="#FBBC04" style={styles.detailIcon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Permit Charges</Text>
                  <Text style={styles.detailValue}>₹{quoteData.echo.permit_charges}</Text>
                </View>
              </View>
            )}

            {quoteData.echo.hill_charges > 0 && (
              <View style={styles.detailRow}>
                <Mountain size={20} color="#FBBC04" style={styles.detailIcon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Hill Charges</Text>
                  <Text style={styles.detailValue}>₹{quoteData.echo.hill_charges}</Text>
                </View>
              </View>
            )}

            {quoteData.echo.toll_charges > 0 && (
              <View style={styles.detailRow}>
                <IndianRupee size={20} color="#FBBC04" style={styles.detailIcon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Toll Charges</Text>
                  <Text style={styles.detailValue}>₹{quoteData.echo.toll_charges}</Text>
                </View>
              </View>
            )}

            {quoteData.echo.pickup_notes && (
              <View style={styles.detailRow}>
                <FileText size={20} color="#9AA0A6" style={styles.detailIcon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Pickup Notes</Text>
                  <Text style={styles.detailValue}>{quoteData.echo.pickup_notes}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Driver Assignment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Assignment</Text>
            
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSendToPicker(true)}
            >
              <Send size={20} color="#5F6368" style={styles.pickerIcon} />
              <Text style={styles.pickerText}>
                {sendTo === 'NEAR_CITY' ? `NEAR_CITY - ${nearCity}` : sendTo}
              </Text>
              <ChevronDown size={20} color="#5F6368" />
            </TouchableOpacity>

            {sendTo === 'NEAR_CITY' && (
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowNearCityPicker(true)}
              >
                <MapPin size={20} color="#5F6368" style={styles.pickerIcon} />
                <Text style={styles.pickerText}>
                  {nearCity || 'Select Near City'}
                </Text>
                <ChevronDown size={20} color="#5F6368" />
              </TouchableOpacity>
            )}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity 
            style={[styles.confirmButton, isLoading && styles.disabledButton]} 
            onPress={handleConfirmOrder}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#34A853', '#2E7D32']}
              style={styles.gradientButton}
            >
              <Send size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>
                {isLoading ? 'Creating Order...' : 'Confirm & Create Order'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Send To Picker Modal */}
        <Modal
          visible={showSendToPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Driver Assignment</Text>
              <TouchableOpacity
                onPress={() => setShowSendToPicker(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#5F6368" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSendTo('ALL');
                  setNearCity('');
                  setShowSendToPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>ALL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setSendTo('NEAR_CITY');
                  setShowSendToPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>NEAR_CITY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Near City Picker Modal */}
        <Modal
          visible={showNearCityPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Near City</Text>
              <TouchableOpacity
                onPress={() => setShowNearCityPicker(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#5F6368" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.modalOption}
                  onPress={() => {
                    setNearCity(city);
                    setShowNearCityPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Success Animation */}
        {showSuccess && (
          <Modal
            visible={showSuccess}
            transparent={true}
            animationType="fade"
          >
            <View style={styles.successOverlay}>
              <Animated.View 
                style={[
                  styles.successContainer,
                  { transform: [{ scale: successScale }] }
                ]}
              >
                <CheckCircle size={80} color="#34A853" />
                <Text style={styles.successTitle}>Order Created!</Text>
                <Text style={styles.successSubtitle}>Your order has been successfully created and sent to drivers.</Text>
              </Animated.View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202124',
  },
  closeButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quoteSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quoteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202124',
  },
  quoteBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  quoteBadgeText: {
    color: '#34A853',
    fontSize: 14,
    fontWeight: '600',
  },
  fareBreakdown: {
    marginBottom: 20,
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
  },
  fareLabel: {
    fontSize: 16,
    color: '#5F6368',
    fontWeight: '500',
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
    fontSize: 20,
    color: '#34A853',
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  },
  detailValue: {
    fontSize: 16,
    color: '#202124',
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerIcon: {
    marginRight: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    color: '#202124',
    fontWeight: '500',
  },
  confirmButton: {
    marginVertical: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202124',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#202124',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124',
    marginTop: 20,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#5F6368',
    textAlign: 'center',
    lineHeight: 22,
  },
});
