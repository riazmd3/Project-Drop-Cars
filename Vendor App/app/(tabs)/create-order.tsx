import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Phone, 
  MapPin, 
  IndianRupee,
  Car,
  Mountain,
  FileText,
  Calendar,
  Clock,
  X,
  ChevronDown,
  Calculator,
  Send
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { mockGoogleMapsService, PlacePrediction } from '../../services/googleMaps';
import { orderService, OrderQuoteRequest, OrderQuoteResponse, OrderConfirmRequest } from '../../services/orderService';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import LocationPicker from '../../components/LocationPicker';
import QuoteReview from '../../components/QuoteReview';

const { width } = Dimensions.get('window');

interface FormData {
  vendor_id: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: { [key: string]: string };
  start_date_time: Date;
  customer_name: string;
  customer_number: string;
  cost_per_km: string;
  extra_cost_per_km: string;
  driver_allowance: string;
  extra_driver_allowance: string;
  permit_charges: string;
  extra_permit_charges: string;
  hill_charges: string;
  toll_charges: string;
  pickup_notes: string;
  send_to: string;
  near_city: string;
}



const carTypes = [
  'Hatchback',
  'Sedan', 
  'New Sedan',
  'SUV',
  'Innova',
  'Innova Crysta'
];



export default function CreateOrderScreen() {
  const [formData, setFormData] = useState<FormData>({
    vendor_id: '83a93a3f-2f6e-4bf6-9f78-1c3f9f42b7b1',
    trip_type: 'Oneway',
    car_type: 'Sedan',
    pickup_drop_location: { '0': '', '1': '' },
    start_date_time: new Date(),
    customer_name: '',
    customer_number: '',
    cost_per_km: '',
    extra_cost_per_km: '',
    driver_allowance: '',
    extra_driver_allowance: '',
    permit_charges: '',
    extra_permit_charges: '',
    hill_charges: '',
    toll_charges: '',
    pickup_notes: '',
    send_to: 'ALL',
    near_city: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCarTypePicker, setShowCarTypePicker] = useState(false);
  const [showSendToPicker, setShowSendToPicker] = useState(false);
  const [activeLocationField, setActiveLocationField] = useState<'0' | '1' | null>(null);
  const [quoteResponse, setQuoteResponse] = useState<OrderQuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showQuoteReview, setShowQuoteReview] = useState(false);
  
  // Get vendor auth hook
  const { getStoredToken, getStoredVendorData } = useVendorAuth();

  const handleInputChange = (field: keyof FormData, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (index: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      pickup_drop_location: {
        ...prev.pickup_drop_location,
        [index]: value
      }
    }));
  };

  const openLocationPicker = (index: '0' | '1') => {
    setActiveLocationField(index);
    setShowLocationPicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('start_date_time', selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const currentDate = formData.start_date_time;
      const newDateTime = new Date(currentDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      handleInputChange('start_date_time', newDateTime);
    }
  };

  const getQuote = async () => {
    // Validation
    if (!formData.customer_name.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }
    if (!formData.customer_number.trim()) {
      Alert.alert('Error', 'Please enter customer number');
      return;
    }
    if (!formData.pickup_drop_location['0'] || !formData.pickup_drop_location['1']) {
      Alert.alert('Error', 'Please enter pickup and drop locations');
      return;
    }
    if (!formData.cost_per_km) {
      Alert.alert('Error', 'Please enter cost per km');
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare request data
      const quoteRequest: OrderQuoteRequest = {
        vendor_id: formData.vendor_id,
        trip_type: formData.trip_type,
        car_type: formData.car_type,
        pickup_drop_location: formData.pickup_drop_location,
        start_date_time: formData.start_date_time.toISOString(),
        customer_name: formData.customer_name,
        customer_number: formData.customer_number,
        cost_per_km: parseFloat(formData.cost_per_km),
        extra_cost_per_km: parseFloat(formData.extra_cost_per_km) || 0,
        driver_allowance: parseFloat(formData.driver_allowance) || 0,
        extra_driver_allowance: parseFloat(formData.extra_driver_allowance) || 0,
        permit_charges: parseFloat(formData.permit_charges) || 0,
        extra_permit_charges: parseFloat(formData.extra_permit_charges) || 0,
        hill_charges: parseFloat(formData.hill_charges) || 0,
        toll_charges: parseFloat(formData.toll_charges) || 0,
        pickup_notes: formData.pickup_notes
      };

      // Call the real API
      const response = await orderService.createQuote(quoteRequest);
      setQuoteResponse(response);
      setShowQuoteReview(true);
    } catch (error) {
      console.error('Error creating quote:', error);
      Alert.alert('Error', 'Failed to generate quote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmOrder = async (sendTo: string, nearCity?: string) => {
    if (sendTo === 'NEAR_CITY' && !nearCity) {
      Alert.alert('Error', 'Please select a near city when sending to NEAR_CITY');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get access token
      const accessToken = await getStoredToken();
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.');
      }

      // Prepare confirm request
      const confirmRequest: OrderConfirmRequest = {
        vendor_id: formData.vendor_id,
        trip_type: formData.trip_type,
        car_type: formData.car_type,
        pickup_drop_location: formData.pickup_drop_location,
        start_date_time: formData.start_date_time.toISOString(),
        customer_name: formData.customer_name,
        customer_number: formData.customer_number,
        cost_per_km: parseFloat(formData.cost_per_km),
        extra_cost_per_km: parseFloat(formData.extra_cost_per_km) || 0,
        driver_allowance: parseFloat(formData.driver_allowance) || 0,
        extra_driver_allowance: parseFloat(formData.extra_driver_allowance) || 0,
        permit_charges: parseFloat(formData.permit_charges) || 0,
        extra_permit_charges: parseFloat(formData.extra_permit_charges) || 0,
        hill_charges: parseFloat(formData.hill_charges) || 0,
        toll_charges: parseFloat(formData.toll_charges) || 0,
        pickup_notes: formData.pickup_notes,
        send_to: sendTo as 'ALL' | 'NEAR_CITY',
        near_city: nearCity
      };

      // Call the real API
      const response = await orderService.confirmOrder(confirmRequest, accessToken);
      console.log('Order created successfully:', response);
      
      // Reset form
      setFormData({
        vendor_id: '83a93a3f-2f6e-4bf6-9f78-1c3f9f42b7b1',
        trip_type: 'Oneway',
        car_type: 'Sedan',
        pickup_drop_location: { '0': '', '1': '' },
        start_date_time: new Date(),
        customer_name: '',
        customer_number: '',
        cost_per_km: '',
        extra_cost_per_km: '',
        driver_allowance: '',
        extra_driver_allowance: '',
        permit_charges: '',
        extra_permit_charges: '',
        hill_charges: '',
        toll_charges: '',
        pickup_notes: '',
        send_to: 'ALL',
        near_city: ''
      });
      setQuoteResponse(null);
      setShowQuoteReview(false);
      
    } catch (error) {
      console.error('Error confirming order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <View style={styles.container}>
      {/* Modern Blue Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6', '#60A5FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Car size={32} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create New Order</Text>
            <Text style={styles.headerSubtitle}>Plan your perfect trip</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={24} color="#1E40AF" />
            <Text style={styles.sectionTitle}>Customer Details</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Customer Name"
              value={formData.customer_name}
              onChangeText={(value) => handleInputChange('customer_name', value)}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Customer Mobile Number"
              value={formData.customer_number}
              onChangeText={(value) => handleInputChange('customer_number', value)}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Trip Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Car size={24} color="#1E40AF" />
            <Text style={styles.sectionTitle}>Trip Details</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Car size={20} color="#6B7280" style={styles.inputIcon} />
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCarTypePicker(true)}
            >
              <Text style={[styles.pickerButtonText, formData.car_type ? styles.pickerButtonTextActive : styles.pickerButtonTextPlaceholder]}>
                {formData.car_type || 'Select Car Type'}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Calendar size={20} color="#6B7280" style={styles.inputIcon} />
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {formatDateTime(formData.start_date_time).date}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Clock size={20} color="#6B7280" style={styles.inputIcon} />
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {formatDateTime(formData.start_date_time).time}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Locations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color="#1E40AF" />
            <Text style={styles.sectionTitle}>Locations</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#1E40AF" style={styles.inputIcon} />
            <TouchableOpacity
              style={styles.locationInputButton}
              onPress={() => openLocationPicker('0')}
            >
              <Text style={[styles.locationInputText, formData.pickup_drop_location['0'] ? styles.locationInputTextActive : styles.locationInputTextPlaceholder]}>
                {formData.pickup_drop_location['0'] || 'Pickup Location (Source)'}
              </Text>
              <MapPin size={20} color="#1E40AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MapPin size={20} color="#1E40AF" style={styles.inputIcon} />
            <TouchableOpacity
              style={styles.locationInputButton}
              onPress={() => openLocationPicker('1')}
            >
              <Text style={[styles.locationInputText, formData.pickup_drop_location['1'] ? styles.locationInputTextActive : styles.locationInputTextPlaceholder]}>
                {formData.pickup_drop_location['1'] || 'Drop Location (Destination)'}
              </Text>
              <MapPin size={20} color="#1E40AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IndianRupee size={24} color="#1E40AF" />
            <Text style={styles.sectionTitle}>Pricing Details</Text>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <IndianRupee size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Cost per KM"
                value={formData.cost_per_km}
                onChangeText={(value) => handleInputChange('cost_per_km', value)}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <IndianRupee size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Extra Cost per KM"
                value={formData.extra_cost_per_km}
                onChangeText={(value) => handleInputChange('extra_cost_per_km', value)}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Car size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Driver Allowance"
                value={formData.driver_allowance}
                onChangeText={(value) => handleInputChange('driver_allowance', value)}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Car size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Extra Driver Allowance"
                value={formData.extra_driver_allowance}
                onChangeText={(value) => handleInputChange('extra_driver_allowance', value)}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <FileText size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Permit Charges"
                value={formData.permit_charges}
                onChangeText={(value) => handleInputChange('permit_charges', value)}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <FileText size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Extra Permit Charges"
                value={formData.extra_permit_charges}
                onChangeText={(value) => handleInputChange('extra_permit_charges', value)}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

            <View style={styles.inputContainer}>
              <Mountain size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Hill Charges"
                value={formData.hill_charges}
                onChangeText={(value) => handleInputChange('hill_charges', value)}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

          <View style={styles.inputContainer}>
            <IndianRupee size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Toll Charges"
              value={formData.toll_charges}
              onChangeText={(value) => handleInputChange('toll_charges', value)}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Driver Assignment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Send size={24} color="#1E40AF" />
            <Text style={styles.sectionTitle}>Driver Assignment</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Send size={20} color="#6B7280" style={styles.inputIcon} />
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSendToPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {formData.send_to === 'NEAR_CITY' ? `NEAR_CITY - ${formData.near_city}` : formData.send_to}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {formData.send_to === 'NEAR_CITY' && (
            <View style={styles.inputContainer}>
              <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowSendToPicker(true)}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.near_city || 'Select Near City'}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Additional Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={24} color="#1E40AF" />
            <Text style={styles.sectionTitle}>Additional Notes</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <FileText size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Pickup Notes (Optional)"
              value={formData.pickup_notes}
              onChangeText={(value) => handleInputChange('pickup_notes', value)}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Quote Button */}
        <TouchableOpacity 
          style={[styles.quoteButton, isLoading && styles.disabledButton]} 
          onPress={getQuote}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#1E40AF', '#3B82F6']}
            style={styles.gradientButton}
          >
            <Calculator size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>
              {isLoading ? 'Generating Quote...' : 'Get Quote'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>




      </ScrollView>

      {/* Car Type Picker Modal */}
      <Modal
        visible={showCarTypePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Car Type</Text>
            <TouchableOpacity
              onPress={() => setShowCarTypePicker(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#5F6368" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {carTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange('car_type', type);
                  setShowCarTypePicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

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
                handleInputChange('send_to', 'ALL');
                setShowSendToPicker(false);
              }}
            >
              <Text style={styles.modalOptionText}>ALL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                handleInputChange('send_to', 'NEAR_CITY');
                setShowSendToPicker(false);
              }}
            >
              <Text style={styles.modalOptionText}>NEAR_CITY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* Location Picker */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={(location) => {
          if (activeLocationField) {
            handleLocationChange(activeLocationField, location);
          }
          setShowLocationPicker(false);
        }}
        title={activeLocationField === '0' ? 'Select Pickup Location' : 'Select Drop Location'}
        placeholder="Search for a location..."
        initialValue={activeLocationField ? formData.pickup_drop_location[activeLocationField] : ''}
      />

      {/* Quote Review */}
      <QuoteReview
        visible={showQuoteReview}
        onClose={() => setShowQuoteReview(false)}
        quoteData={quoteResponse}
        onConfirmOrder={confirmOrder}
        isLoading={isLoading}
      />

      {/* Date and Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.start_date_time}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={formData.start_date_time}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#202124',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#202124',
    fontWeight: '500',
  },
  pickerButtonTextActive: {
    color: '#202124',
  },
  pickerButtonTextPlaceholder: {
    color: '#9AA0A6',
  },

  quoteButton: {
    marginVertical: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmButton: {
    marginTop: 20,
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
  closeButton: {
    padding: 8,
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

  locationInputButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
  },
  locationInputText: {
    fontSize: 16,
    color: '#202124',
    flex: 1,
  },
  locationInputTextActive: {
    color: '#202124',
  },
  locationInputTextPlaceholder: {
    color: '#9AA0A6',
  },
});