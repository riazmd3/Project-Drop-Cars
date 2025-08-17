import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
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
  Plus,
  X
} from 'lucide-react-native';

interface PricingModal {
  visible: boolean;
  type: string;
  title: string;
}

export default function CreateOrderScreen() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupLocation: '',
    dropLocation: '',
    driverPrice: { normal: '', extra: '' },
    kilometerCharges: { normal: '', extra: '' },
    hillCharges: { normal: '', extra: '' },
    permitCharges: { normal: '', extra: '' },
  });

  const [pricingModal, setPricingModal] = useState<PricingModal>({
    visible: false,
    type: '',
    title: '',
  });

  const [tempPricing, setTempPricing] = useState({ normal: '', extra: '' });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openPricingModal = (type: string, title: string) => {
    const currentPricing = formData[type as keyof typeof formData] as { normal: string; extra: string };
    setTempPricing(currentPricing);
    setPricingModal({
      visible: true,
      type,
      title,
    });
  };

  const savePricing = () => {
    setFormData(prev => ({
      ...prev,
      [pricingModal.type]: { ...tempPricing }
    }));
    setPricingModal({ visible: false, type: '', title: '' });
  };

  const calculateTotal = () => {
    const { driverPrice, kilometerCharges, hillCharges, permitCharges } = formData;
    
    const driverTotal = (parseFloat(driverPrice.normal || '0') + parseFloat(driverPrice.extra || '0'));
    const kmTotal = (parseFloat(kilometerCharges.normal || '0') + parseFloat(kilometerCharges.extra || '0'));
    const hillTotal = (parseFloat(hillCharges.normal || '0') + parseFloat(hillCharges.extra || '0'));
    const permitTotal = (parseFloat(permitCharges.normal || '0') + parseFloat(permitCharges.extra || '0'));
    
    return driverTotal + kmTotal + hillTotal + permitTotal;
  };

  const handleSubmit = () => {
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      Alert.alert('Error', 'Please fill in customer details');
      return;
    }

    if (!formData.pickupLocation.trim() || !formData.dropLocation.trim()) {
      Alert.alert('Error', 'Please enter pickup and drop locations');
      return;
    }

    const total = calculateTotal();
    if (total <= 0) {
      Alert.alert('Error', 'Please set pricing details');
      return;
    }

    // Show transaction details
    Alert.alert(
      'Order Summary',
      `Customer: ${formData.customerName}
Phone: ${formData.customerPhone}
From: ${formData.pickupLocation}
To: ${formData.dropLocation}
Total Amount: ₹${total.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm Order', 
          onPress: () => {
            Alert.alert('Success', 'Order created successfully!');
            // Reset form
            setFormData({
              customerName: '',
              customerPhone: '',
              pickupLocation: '',
              dropLocation: '',
              driverPrice: { normal: '', extra: '' },
              kilometerCharges: { normal: '', extra: '' },
              hillCharges: { normal: '', extra: '' },
              permitCharges: { normal: '', extra: '' },
            });
          }
        }
      ]
    );
  };

  const renderPricingButton = (type: string, title: string, icon: React.ReactNode) => {
    const pricing = formData[type as keyof typeof formData] as { normal: string; extra: string };
    const hasValue = pricing.normal || pricing.extra;
    
    return (
      <TouchableOpacity
        style={[styles.pricingButton, hasValue && styles.pricingButtonActive]}
        onPress={() => openPricingModal(type, title)}
      >
        <View style={styles.pricingButtonContent}>
          {icon}
          <View style={styles.pricingButtonText}>
            <Text style={[styles.pricingButtonTitle, hasValue && styles.pricingButtonTitleActive]}>
              {title}
            </Text>
            {hasValue && (
              <Text style={styles.pricingButtonValue}>
                N: ₹{pricing.normal || '0'} | E: ₹{pricing.extra || '0'}
              </Text>
            )}
          </View>
        </View>
        <Plus size={20} color={hasValue ? '#3B82F6' : '#6B7280'} />
      </TouchableOpacity>
    );
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

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Customer Name"
              value={formData.customerName}
              onChangeText={(value) => handleInputChange('customerName', value)}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Customer Mobile Number"
              value={formData.customerPhone}
              onChangeText={(value) => handleInputChange('customerPhone', value)}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#10B981" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Pickup Location"
              value={formData.pickupLocation}
              onChangeText={(value) => handleInputChange('pickupLocation', value)}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <MapPin size={20} color="#EF4444" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Drop Location"
              value={formData.dropLocation}
              onChangeText={(value) => handleInputChange('dropLocation', value)}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Details</Text>
          
          {renderPricingButton('driverPrice', 'Driver Price', <Car size={20} color="#3B82F6" />)}
          {renderPricingButton('kilometerCharges', 'Per KM Charges', <IndianRupee size={20} color="#F59E0B" />)}
          {renderPricingButton('hillCharges', 'Hill Charges', <Mountain size={20} color="#8B5CF6" />)}
          {renderPricingButton('permitCharges', 'Permit Charges', <FileText size={20} color="#EF4444" />)}
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{calculateTotal().toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Create Order</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Pricing Modal */}
      <Modal
        visible={pricingModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{pricingModal.title}</Text>
            <TouchableOpacity
              onPress={() => setPricingModal({ visible: false, type: '', title: '' })}
              style={styles.closeButton}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.pricingInputContainer}>
              <Text style={styles.pricingInputLabel}>Normal Price</Text>
              <View style={styles.inputContainer}>
                <IndianRupee size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={tempPricing.normal}
                  onChangeText={(value) => setTempPricing(prev => ({ ...prev, normal: value }))}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.pricingInputContainer}>
              <Text style={styles.pricingInputLabel}>Extra Price</Text>
              <View style={styles.inputContainer}>
                <IndianRupee size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={tempPricing.extra}
                  onChangeText={(value) => setTempPricing(prev => ({ ...prev, extra: value }))}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.savePricingButton} onPress={savePricing}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Save Pricing</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  pricingButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingButtonActive: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  pricingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  pricingButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  pricingButtonTitleActive: {
    color: '#3B82F6',
  },
  pricingButtonValue: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 4,
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
    paddingTop: 30,
  },
  pricingInputContainer: {
    marginBottom: 24,
  },
  pricingInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  savePricingButton: {
    marginTop: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
});