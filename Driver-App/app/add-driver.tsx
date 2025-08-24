import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Save, Upload, CheckCircle, FileText, Image, Phone, Lock, MapPin, CreditCard } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { addDriverDetails, DriverDetails } from '@/services/driverService';
import * as ImagePicker from 'expo-image-picker';
import { fetchDashboardData } from '@/services/dashboardService';

export default function AddDriverScreen() {
  const [driverData, setDriverData] = useState({
    full_name: '',
    primary_number: '',
    secondary_number: '',
    password: '',
    licence_number: '',
    adress: '',
  });
  
  const [driverImages, setDriverImages] = useState({
    licence_front_img: '',
    rc_front_img: '',
    rc_back_img: '',
    insurance_img: '',
    fc_img: '',
    car_img: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const router = useRouter();
  const { user } = useAuth();

  // Validation functions
  const validateFullName = (name: string): string => {
    if (!name.trim()) return 'Full name is required';
    if (name.length < 2) return 'Full name must be at least 2 characters';
    if (name.length > 100) return 'Full name must be less than 100 characters';
    return '';
  };

  const validatePhoneNumber = (number: string): string => {
    if (!number.trim()) return 'Phone number is required';
    
    // Format: +91XXXXXXXXXX
    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(number)) {
      return 'Invalid format. Use: +91XXXXXXXXXX (10 digits after +91)';
    }
    
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password.trim()) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password.length > 50) return 'Password must be less than 50 characters';
    return '';
  };

  const validateLicenceNumber = (licence: string): string => {
    if (!licence.trim()) return 'Driving licence number is required';
    
    // Format: SS-NN-YYYY-NNNNNNN (State Code + RTO + Year + Serial)
    const licenceRegex = /^[A-Z]{2}-\d{2}-\d{4}-\d{7}$/;
    if (!licenceRegex.test(licence)) {
      return 'Invalid format. Use: SS-NN-YYYY-NNNNNNN (e.g., MH-12-1990-1234567)';
    }
    
    return '';
  };

  const validateAddress = (address: string): string => {
    if (!address.trim()) return 'Address is required';
    if (address.length < 10) return 'Address must be at least 10 characters';
    if (address.length > 200) return 'Address must be less than 200 characters';
    return '';
  };

  const validateAllFields = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    newErrors.full_name = validateFullName(driverData.full_name);
    newErrors.primary_number = validatePhoneNumber(driverData.primary_number);
    newErrors.password = validatePassword(driverData.password);
    newErrors.licence_number = validateLicenceNumber(driverData.licence_number);
    newErrors.adress = validateAddress(driverData.adress);
    
    setErrors(newErrors);
    
    return !Object.values(newErrors).some(error => error !== '');
  };

  const pickImage = async (imageKey: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setDriverImages(prev => ({
          ...prev,
          [imageKey]: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const ImageUploadField = ({ 
    title, 
    description, 
    imageKey, 
    isRequired = true 
  }: { 
    title: string; 
    description: string; 
    imageKey: string; 
    isRequired?: boolean;
  }) => {
    const imageUri = driverImages[imageKey as keyof typeof driverImages];
    const isUploaded = !!imageUri;
    
    return (
      <TouchableOpacity
        style={[styles.imageUploadField, isUploaded && styles.uploadedField]}
        onPress={() => pickImage(imageKey)}
      >
        <View style={styles.imageUploadLeft}>
          <View style={[styles.imageUploadIcon, isUploaded && styles.uploadedIcon]}>
            {isUploaded ? (
              <CheckCircle color="#FFFFFF" size={20} />
            ) : (
              <Image color="#6B7280" size={20} />
            )}
          </View>
          <View style={styles.imageUploadText}>
            <Text style={styles.imageUploadTitle}>
              {title} {isRequired && <Text style={styles.required}>*</Text>}
            </Text>
            <Text style={styles.imageUploadDescription}>{description}</Text>
          </View>
        </View>
        <Upload color={isUploaded ? "#10B981" : "#6B7280"} size={20} />
      </TouchableOpacity>
    );
  };

  const handleSave = async () => {
    // Clear previous errors
    setErrors({});

    // Validate all fields
    if (!validateAllFields()) {
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
      return;
    }

    // Check required images
    if (!driverImages.licence_front_img) {
      Alert.alert('Error', 'Please upload the driving licence front image');
      return;
    }

    try {
      const payload: DriverDetails = {
        full_name: driverData.full_name.trim(),
        primary_number: driverData.primary_number,
        secondary_number: driverData.secondary_number || '',
        password: driverData.password,
        licence_number: driverData.licence_number,
        adress: driverData.adress.trim(),
        organization_id: user?.organizationId || 'org_001',
        vehicle_owner_id: user?.id || 'e5b9edb1-b4bb-48b8-a662-f7fd00abb6eb',
        licence_front_img: driverImages.licence_front_img,
        rc_front_img: driverImages.rc_front_img || '',
        rc_back_img: driverImages.rc_back_img || '',
        insurance_img: driverImages.insurance_img || '',
        fc_img: driverImages.fc_img || '',
        car_img: driverImages.car_img || ''
      };

      // Debug user ID
      console.log('🔍 Current user ID:', user?.id);
      console.log('🔍 Using vehicle_owner_id:', payload.vehicle_owner_id);

      await addDriverDetails(payload);

      // Show success message and redirect to dashboard
      Alert.alert(
        'Success',
        'Driver added successfully! You can now access the dashboard.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add driver');
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digits
    let cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }
    
    // Add +91 prefix
    return cleaned.length > 0 ? `+91${cleaned}` : '';
  };

  const formatLicenceNumber = (text: string) => {
    // Remove all non-alphanumeric characters
    let cleaned = text.replace(/[^A-Za-z0-9]/g, '');
    
    // Format as SS-NN-YYYY-NNNNNNN
    if (cleaned.length <= 2) return cleaned.toUpperCase();
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2).toUpperCase()}-${cleaned.slice(2)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2).toUpperCase()}-${cleaned.slice(2, 4)}-${cleaned.slice(4)}`;
    if (cleaned.length <= 15) return `${cleaned.slice(0, 2).toUpperCase()}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    
    return `${cleaned.slice(0, 2).toUpperCase()}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 15)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Your First Driver</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step 2/3</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Driver Registration</Text>
          <Text style={styles.welcomeSubtitle}>
            Hi {user?.fullName}, let's add your first driver to complete the setup.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Driver Details</Text>
          
          <View style={styles.inputGroup}>
            <User color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.full_name && styles.inputError]}
              placeholder="Full Name (e.g., John Doe)"
              value={driverData.full_name}
              onChangeText={(text) => {
                setDriverData(prev => ({ ...prev, full_name: text }));
                if (errors.full_name) setErrors(prev => ({ ...prev, full_name: '' }));
              }}
            />
          </View>
          {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}

          <View style={styles.inputGroup}>
            <Phone color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.primary_number && styles.inputError]}
              placeholder="Primary Mobile Number (+91XXXXXXXXXX)"
              value={driverData.primary_number}
              onChangeText={(text) => {
                const formatted = formatPhoneNumber(text);
                setDriverData(prev => ({ ...prev, primary_number: formatted }));
                if (errors.primary_number) setErrors(prev => ({ ...prev, primary_number: '' }));
              }}
              keyboardType="phone-pad"
              maxLength={13}
            />
          </View>
          {errors.primary_number && <Text style={styles.errorText}>{errors.primary_number}</Text>}
          <Text style={styles.helpText}>
            Format: +91XXXXXXXXXX (10 digits after +91)
          </Text>

          <View style={styles.inputGroup}>
            <Phone color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Secondary Mobile Number (Optional)"
              value={driverData.secondary_number}
              onChangeText={(text) => {
                const formatted = formatPhoneNumber(text);
                setDriverData(prev => ({ ...prev, secondary_number: formatted }));
              }}
              keyboardType="phone-pad"
              maxLength={13}
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Password"
              value={driverData.password}
              onChangeText={(text) => {
                setDriverData(prev => ({ ...prev, password: text }));
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              secureTextEntry
            />
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <View style={styles.inputGroup}>
            <CreditCard color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.licence_number && styles.inputError]}
              placeholder="Driving Licence Number (e.g., MH-12-1990-1234567)"
              value={driverData.licence_number}
              onChangeText={(text) => {
                const formatted = formatLicenceNumber(text);
                setDriverData(prev => ({ ...prev, licence_number: formatted }));
                if (errors.licence_number) setErrors(prev => ({ ...prev, licence_number: '' }));
              }}
              autoCapitalize="characters"
              maxLength={19}
            />
          </View>
          {errors.licence_number && <Text style={styles.errorText}>{errors.licence_number}</Text>}
          <Text style={styles.helpText}>
            Format: SS-NN-YYYY-NNNNNNN (State Code + RTO + Year + Serial)
          </Text>

          <View style={styles.inputGroup}>
            <MapPin color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.adress && styles.inputError]}
              placeholder="Address (e.g., 123 Main Street, Mumbai, Maharashtra)"
              value={driverData.adress}
              onChangeText={(text) => {
                setDriverData(prev => ({ ...prev, adress: text }));
                if (errors.adress) setErrors(prev => ({ ...prev, adress: '' }));
              }}
              multiline
              numberOfLines={3}
            />
          </View>
          {errors.adress && <Text style={styles.errorText}>{errors.adress}</Text>}

          <Text style={styles.sectionTitle}>Required Documents & Images</Text>
          <Text style={styles.sectionSubtitle}>
            Please upload clear images of all required documents
          </Text>

          <ImageUploadField
            title="Driving Licence Front Image"
            description="Front side of driving licence"
            imageKey="licence_front_img"
            isRequired={true}
          />

          <ImageUploadField
            title="RC Front Image"
            description="Registration Certificate front side (Optional)"
            imageKey="rc_front_img"
            isRequired={false}
          />

          <ImageUploadField
            title="RC Back Image"
            description="Registration Certificate back side (Optional)"
            imageKey="rc_back_img"
            isRequired={false}
          />

          <ImageUploadField
            title="Insurance Image"
            description="Valid insurance certificate (Optional)"
            imageKey="insurance_img"
            isRequired={false}
          />

          <ImageUploadField
            title="FC Image"
            description="Fitness Certificate (Optional)"
            imageKey="fc_img"
            isRequired={false}
          />

          <ImageUploadField
            title="Car Image"
            description="Clear photo of your car (Optional)"
            imageKey="car_img"
            isRequired={false}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save color="#FFFFFF" size={20} />
            <Text style={styles.saveButtonText}>Save Driver & Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  stepIndicator: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  welcomeSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
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
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  helpText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  imageUploadField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  uploadedField: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  imageUploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageUploadIcon: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 8,
  },
  uploadedIcon: {
    backgroundColor: '#10B981',
  },
  imageUploadText: {
    marginLeft: 12,
  },
  imageUploadTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  required: {
    color: '#EF4444',
  },
  imageUploadDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});


