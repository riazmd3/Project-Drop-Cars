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
import { User, Phone, MapPin, ArrowRight, Lock, Hash, AlertCircle } from 'lucide-react-native';

interface PersonalDetailsStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}



// Helper function to validate Indian mobile numbers
const validateIndianMobile = (phone: string): boolean => {
  // Remove +91 prefix if present
  const cleanPhone = phone.replace(/^\+91/, '');
  
  // Check if it's exactly 10 digits and starts with 6, 7, 8, or 9
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleanPhone);
};

// Helper function to format phone number for display
const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If it's 10 digits, add +91 prefix
  if (cleanPhone.length === 10) {
    return `+91${cleanPhone}`;
  }
  
  // If it already has +91 and 10 digits, return as is
  if (phone.startsWith('+91') && cleanPhone.length === 13) {
    return phone;
  }
  
  // Otherwise return the cleaned number
  return cleanPhone;
};

export default function PersonalDetailsStep({ data, onUpdate, onNext }: PersonalDetailsStepProps) {
  const [fullName, setFullName] = useState(data.fullName || '');
  const [primaryMobile, setPrimaryMobile] = useState(data.primaryMobile || '');
  const [secondaryMobile, setSecondaryMobile] = useState(data.secondaryMobile || '');
  const [password, setPassword] = useState(data.password || '');
  const [address, setAddress] = useState(data.address || '');
  const [aadharNumber, setAadharNumber] = useState(data.aadharNumber || '');
  const [organizationId, setOrganizationId] = useState(data.organizationId || 'org_001');
  
  // Validation error states
  const [primaryMobileError, setPrimaryMobileError] = useState<string | null>(null);
  const [secondaryMobileError, setSecondaryMobileError] = useState<string | null>(null);
  const [aadharNumberError, setAadharNumberError] = useState<string | null>(null);




  // Function to validate mobile number and clear errors
  const validateMobileNumber = (mobile: string, isPrimary: boolean = true) => {
    if (!mobile) {
      if (isPrimary) {
        setPrimaryMobileError(null);
      } else {
        setSecondaryMobileError(null);
      }
      return true;
    }

    if (!validateIndianMobile(mobile)) {
      const errorMessage = 'Must start with 6, 7, 8, or 9';
      if (isPrimary) {
        setPrimaryMobileError(errorMessage);
      } else {
        setSecondaryMobileError(errorMessage);
      }
      return false;
    }

    // Clear error if validation passes
    if (isPrimary) {
      setPrimaryMobileError(null);
    } else {
      setSecondaryMobileError(null);
    }
    return true;
  };

  // Function to validate Aadhar number
  const validateAadharNumber = (aadhar: string) => {
    if (!aadhar) {
      setAadharNumberError(null);
      return true;
    }

    if (aadhar.length !== 12) {
      setAadharNumberError('Must be exactly 12 digits');
      return false;
    }

    if (!/^\d{12}$/.test(aadhar)) {
      setAadharNumberError('Must contain only digits');
      return false;
    }

    setAadharNumberError(null);
    return true;
  };

  const handleNext = () => {
    // Clear all errors first
    setPrimaryMobileError(null);
    setSecondaryMobileError(null);
    setAadharNumberError(null);

    if (!fullName || !primaryMobile || !password || !address || !aadharNumber) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    // Validate all fields
    const isPrimaryMobileValid = validateMobileNumber(primaryMobile, true);
    const isSecondaryMobileValid = secondaryMobile ? validateMobileNumber(secondaryMobile, false) : true;
    const isAadharValid = validateAadharNumber(aadharNumber);

    if (!isPrimaryMobileValid || !isSecondaryMobileValid || !isAadharValid) {
      return; // Don't proceed if validation fails
    }

    const personalData = {
      fullName,
      primaryMobile,
      secondaryMobile,
      password,
      address,
      aadharNumber,
      organizationId,

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
            style={[styles.input, primaryMobileError && styles.inputError]}
            placeholder="Primary Mobile Number (10 digits)"
            value={primaryMobile}
            onChangeText={(text) => {
              // Allow only digits and +91 prefix
              const cleanText = text.replace(/[^\d+]/g, '');
              if (cleanText.startsWith('+91') || cleanText.length <= 10) {
                setPrimaryMobile(cleanText);
                // Validate in real-time
                validateMobileNumber(cleanText, true);
              }
            }}
            onBlur={() => validateMobileNumber(primaryMobile, true)}
            keyboardType="phone-pad"
            maxLength={13}
          />
        </View>
        <Text style={styles.helperText}>Enter 10-digit mobile number starting with 6, 7, 8, or 9</Text>
        {primaryMobileError && (
          <View style={styles.errorContainer}>
            <AlertCircle color="#EF4444" size={16} />
            <Text style={styles.errorText}>{primaryMobileError}</Text>
          </View>
        )}

        {/* Secondary Mobile */}
        <View style={styles.inputGroup}>
          <Phone color="#6B7280" size={20} />
          <TextInput
            style={[styles.input, secondaryMobileError && styles.inputError]}
            placeholder="Secondary Mobile Number (Optional)"
            value={secondaryMobile}
            onChangeText={(text) => {
              // Allow only digits and +91 prefix
              const cleanText = text.replace(/[^\d+]/g, '');
              if (cleanText.startsWith('+91') || cleanText.length <= 10) {
                setSecondaryMobile(cleanText);
                // Validate in real-time
                validateMobileNumber(cleanText, false);
              }
            }}
            onBlur={() => validateMobileNumber(secondaryMobile, false)}
            keyboardType="phone-pad"
            maxLength={13}
          />
        </View>
        {secondaryMobile && (
          <Text style={styles.helperText}>Enter 10-digit mobile number starting with 6, 7, 8, or 9</Text>
        )}
        {secondaryMobileError && (
          <View style={styles.errorContainer}>
            <AlertCircle color="#EF4444" size={16} />
            <Text style={styles.errorText}>{secondaryMobileError}</Text>
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
            style={[styles.input, aadharNumberError && styles.inputError]}
            placeholder="Aadhar Number"
            value={aadharNumber}
            onChangeText={(text) => {
              setAadharNumber(text);
              // Validate in real-time
              validateAadharNumber(text);
            }}
            onBlur={() => validateAadharNumber(aadharNumber)}
            keyboardType="numeric"
            maxLength={12}
          />
        </View>
        {aadharNumberError && (
          <View style={styles.errorContainer}>
            <AlertCircle color="#EF4444" size={16} />
            <Text style={styles.errorText}>{aadharNumberError}</Text>
          </View>
        )}

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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 8
  },
  helperText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 44,
    marginBottom: 8
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 44,
  },
});
