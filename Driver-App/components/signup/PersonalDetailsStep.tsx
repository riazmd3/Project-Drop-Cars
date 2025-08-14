import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { User, Phone, MapPin, ArrowRight, CreditCard, Lock, Hash } from 'lucide-react-native';

interface PersonalDetailsStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const languagesList = ["Tamil", "English", "Malayalam", "Hindi", "Telugu"];
const paymentMethods = ["GPay", "PhonePe"];

export default function PersonalDetailsStep({ data, onUpdate, onNext }: PersonalDetailsStepProps) {
  const [fullName, setFullName] = useState(data.fullName || '');
  const [primaryMobile, setPrimaryMobile] = useState(data.primaryMobile || '');
  const [secondaryMobile, setSecondaryMobile] = useState(data.secondaryMobile || '');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(data.paymentMethod || '');
  const [paymentNumber, setPaymentNumber] = useState(data.paymentNumber || '');
  const [password, setPassword] = useState(data.password || '');
  const [address, setAddress] = useState(data.address || '');
  const [aadharNumber, setAadharNumber] = useState(data.aadharNumber || '');
  const [organizationId, setOrganizationId] = useState(data.organizationId || 'org_001');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(data.languages || []);

  const toggleLanguage = (lang: string) => {
    let updated;
    if (selectedLanguages.includes(lang)) {
      updated = selectedLanguages.filter(l => l !== lang);
    } else {
      updated = [...selectedLanguages, lang];
    }
    setSelectedLanguages(updated);
  };

  const handleNext = () => {
    if (!fullName || !primaryMobile || !password || !address || !aadharNumber || selectedLanguages.length === 0) {
      Alert.alert('Error', 'Please fill all required fields and select at least one language');
      return;
    }

    if (primaryMobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit primary mobile number');
      return;
    }

    if (secondaryMobile && secondaryMobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit secondary mobile number');
      return;
    }

    if (aadharNumber.length !== 12) {
      Alert.alert('Error', 'Please enter a valid 12-digit Aadhar number');
      return;
    }

    if (selectedPaymentMethod && !paymentNumber) {
      Alert.alert('Error', 'Please enter payment number for selected payment method');
      return;
    }

    const personalData = {
      fullName,
      primaryMobile,
      secondaryMobile,
      paymentMethod: selectedPaymentMethod,
      paymentNumber,
      password,
      address,
      aadharNumber,
      organizationId,
      languages: selectedLanguages
    };

    onUpdate(personalData);
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Personal Details</Text>
      <Text style={styles.subtitle}>Let's start with your basic information</Text>

      <View style={styles.form}>
        {/* Full Name */}
        <View style={styles.inputGroup}>
          <User color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Primary Mobile */}
        <View style={styles.inputGroup}>
          <Phone color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Primary Mobile Number"
            value={primaryMobile}
            onChangeText={setPrimaryMobile}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Secondary Mobile */}
        <View style={styles.inputGroup}>
          <Phone color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Secondary Mobile Number (Optional)"
            value={secondaryMobile}
            onChangeText={setSecondaryMobile}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Payment Method Selection */}
        <Text style={styles.label}>Select Payment Method (Optional)</Text>
        <View style={styles.paymentMethodContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentOption, 
                selectedPaymentMethod === method && styles.selectedPayment
              ]}
              onPress={() => setSelectedPaymentMethod(method)}
            >
              <Text style={[
                styles.paymentOptionText,
                selectedPaymentMethod === method && styles.selectedPaymentText
              ]}>
                {selectedPaymentMethod === method ? '✔ ' : ''}{method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Number */}
        {selectedPaymentMethod && (
          <View style={styles.inputGroup}>
            <CreditCard color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder={`${selectedPaymentMethod} Number`}
              value={paymentNumber}
              onChangeText={setPaymentNumber}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        )}

        {/* Password */}
        <View style={styles.inputGroup}>
          <Lock color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <MapPin color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Aadhar Number */}
        <View style={styles.inputGroup}>
          <Hash color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Aadhar Number"
            value={aadharNumber}
            onChangeText={setAadharNumber}
            keyboardType="numeric"
            maxLength={12}
          />
        </View>

        {/* Organization ID */}
        <View style={styles.inputGroup}>
          <Hash color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            placeholder="Organization ID"
            value={organizationId}
            onChangeText={setOrganizationId}
          />
        </View>

        {/* Languages */}
        <Text style={styles.label}>Select Spoken Languages</Text>
        {languagesList.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.option, selectedLanguages.includes(lang) && styles.selected]}
            onPress={() => toggleLanguage(lang)}
          >
            <Text style={styles.optionText}>
              {selectedLanguages.includes(lang) ? '✔ ' : ''}{lang}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
          <ArrowRight color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingBottom: 20,
  },
  title: { 
    fontSize: 24, 
    fontFamily: 'Inter-Bold', 
    color: '#1F2937', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 14, 
    fontFamily: 'Inter-Regular', 
    color: '#6B7280', 
    marginBottom: 32 
  },
  form: { 
    flex: 1 
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 16, 
    fontFamily: 'Inter-Medium', 
    color: '#1F2937' 
  },
  label: { 
    fontSize: 16, 
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 10,
    marginTop: 8,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  selectedPayment: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  paymentOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedPaymentText: {
    color: '#FFFFFF',
  },
  option: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  selected: { 
    backgroundColor: '#DBEAFE', 
    borderColor: '#3B82F6' 
  },
  optionText: { 
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  nextButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontFamily: 'Inter-SemiBold', 
    marginRight: 8 
  },
});
