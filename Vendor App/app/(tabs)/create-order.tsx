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
  Plus,
  X,
  ChevronDown
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { mockGoogleMapsService, PlacePrediction } from '../../services/googleMaps';

interface LocationSuggestion {
  id: string;
  description: string;
}

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
    vendor_id: '83a93a3f-2f6e-4bf6-9f78-1c3f9f42b7b1', // Mock vendor ID
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
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeLocationField, setActiveLocationField] = useState<'0' | '1' | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (field: keyof FormData, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = async (index: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      pickup_drop_location: {
        ...prev.pickup_drop_location,
        [index]: value
      }
    }));
    setSearchQuery(value);
    
    if (value.length > 2) {
      try {
        const predictions = await mockGoogleMapsService.getPlacePredictions(value);
        const suggestions = predictions.map((prediction, idx) => ({
          id: prediction.place_id,
          description: prediction.description
        }));
        setLocationSuggestions(suggestions);
        setShowLocationSuggestions(true);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const selectLocation = (suggestion: LocationSuggestion) => {
    if (activeLocationField) {
      handleLocationChange(activeLocationField, suggestion.description);
    }
    setShowLocationSuggestions(false);
    setSearchQuery('');
    setActiveLocationField(null);
  };

  const openLocationField = (index: '0' | '1') => {
    setActiveLocationField(index);
    setSearchQuery(formData.pickup_drop_location[index]);
    setShowLocationSuggestions(true);
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

  const [distance, setDistance] = useState<number>(0);

  const calculateTotal = () => {
    const costPerKm = parseFloat(formData.cost_per_km) || 0;
    const extraCostPerKm = parseFloat(formData.extra_cost_per_km) || 0;
    const driverAllowance = parseFloat(formData.driver_allowance) || 0;
    const extraDriverAllowance = parseFloat(formData.extra_driver_allowance) || 0;
    const permitCharges = parseFloat(formData.permit_charges) || 0;
    const hillCharges = parseFloat(formData.hill_charges) || 0;
    const tollCharges = parseFloat(formData.toll_charges) || 0;
    
    const baseKmAmount = distance * (costPerKm + extraCostPerKm);
    
    return baseKmAmount + driverAllowance + extraDriverAllowance + permitCharges + hillCharges + tollCharges;
  };

  // Calculate distance when locations change
  useEffect(() => {
    const calculateDistance = async () => {
      const origin = formData.pickup_drop_location['0'];
      const destination = formData.pickup_drop_location['1'];
      
      if (origin && destination) {
        try {
          const calculatedDistance = await mockGoogleMapsService.calculateDistance(origin, destination);
          if (calculatedDistance) {
            setDistance(calculatedDistance);
          }
        } catch (error) {
          console.error('Error calculating distance:', error);
          setDistance(0);
        }
      } else {
        setDistance(0);
      }
    };

    calculateDistance();
  }, [formData.pickup_drop_location['0'], formData.pickup_drop_location['1']]);

  const handleSubmit = () => {
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
    if (formData.send_to === 'NEAR_CITY' && !formData.near_city) {
      Alert.alert('Error', 'Please enter near city when sending to NEAR_CITY');
      return;
    }

    const total = calculateTotal();
    
    // Show order summary
    Alert.alert(
      'Order Summary',
      `Customer: ${formData.customer_name}
Phone: ${formData.customer_number}
From: ${formData.pickup_drop_location['0']}
To: ${formData.pickup_drop_location['1']}
Car Type: ${formData.car_type}
Date: ${formData.start_date_time.toLocaleDateString()}
Time: ${formData.start_date_time.toLocaleTimeString()}
Total Amount: ₹${total.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Order', 
          onPress: () => {
            // Here you would call your API
            Alert.alert('Success', 'Order created successfully!');
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
              hill_charges: '',
              toll_charges: '',
              pickup_notes: '',
              send_to: 'ALL',
              near_city: ''
            });
          }
        }
      ]
    );
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Create New Order</Text>
        <Text style={styles.headerSubtitle}>Fill in the order details</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          
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
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
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

          <View style={styles.inputContainer}>
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

          <View style={styles.inputContainer}>
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

        {/* Locations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#10B981" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Pickup Location (Source)"
              value={formData.pickup_drop_location['0']}
              onChangeText={(value) => handleLocationChange('0', value)}
              onFocus={() => openLocationField('0')}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <MapPin size={20} color="#EF4444" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Drop Location (Destination)"
              value={formData.pickup_drop_location['1']}
              onChangeText={(value) => handleLocationChange('1', value)}
              onFocus={() => openLocationField('1')}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Location Suggestions */}
          {showLocationSuggestions && (
            <View style={styles.suggestionsContainer}>
              {locationSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionItem}
                  onPress={() => selectLocation(suggestion)}
                >
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.suggestionText}>{suggestion.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Pricing Section - 2 columns for cost fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Details</Text>
          
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

          {/* Single column fields */}
          <View style={styles.inputContainer}>
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
          <Text style={styles.sectionTitle}>Driver Assignment</Text>
          
          <View style={styles.inputContainer}>
            <Car size={20} color="#6B7280" style={styles.inputIcon} />
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
              <TextInput
                style={styles.input}
                placeholder="Near City"
                value={formData.near_city}
                onChangeText={(value) => handleInputChange('near_city', value)}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}
        </View>

        {/* Additional Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          
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

        {/* Distance and Total Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Summary</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Distance:</Text>
              <Text style={styles.summaryValue}>{distance.toFixed(1)} km</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Fare:</Text>
              <Text style={styles.summaryValue}>₹{(distance * (parseFloat(formData.cost_per_km) || 0)).toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Extra Charges:</Text>
              <Text style={styles.summaryValue}>₹{(distance * (parseFloat(formData.extra_cost_per_km) || 0)).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Total Amount */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Create Order</Text>
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
              <X size={24} color="#6B7280" />
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
              <X size={24} color="#6B7280" />
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
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
    height: 52,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1F2937',
  },
  pickerButtonTextActive: {
    color: '#1F2937',
  },
  pickerButtonTextPlaceholder: {
    color: '#9CA3AF',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  totalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  submitButton: {
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
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
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
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
    borderBottomColor: '#F3F4F6',
  },
  modalOptionText: {
    fontSize: 18,
    color: '#1F2937',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
});