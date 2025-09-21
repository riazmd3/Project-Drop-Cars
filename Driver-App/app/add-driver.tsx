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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Save, Upload, CheckCircle, FileText, Image, Phone, Lock, MapPin, CreditCard } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { addDriverDetails, DriverDetails } from '@/services/driverService';
import * as ImagePicker from 'expo-image-picker';
import axiosInstance from '@/app/api/axiosInstance';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  // Function to check account status and redirect accordingly
  const checkAccountStatusAndRedirect = async () => {
    try {
      // Get current user data to check account status
      const response = await axiosInstance.post('/api/users/vehicleowner/login', {
        mobile_number: user?.primaryMobile || '',
        password: user?.password || ''
      });

      const accountStatus = response.data.account_status;
      const carCount = response.data.car_details_count ?? 0;
      const driverCount = response.data.car_driver_count ?? 0;

      console.log('🔍 After driver addition - Account status:', accountStatus);
      console.log('🔍 After driver addition - Car count:', carCount);
      console.log('🔍 After driver addition - Driver count:', driverCount);

      // Check if user needs to add more documents
      if (carCount === 0) {
        // No cars - redirect to add car
        console.log('🚗 No cars, redirecting to add car page');
        router.replace('/add-car');
        return;
      }

      if (driverCount === 0) {
        // Still no drivers (shouldn't happen, but just in case)
        console.log('👤 Still no drivers, staying on add driver page');
        return;
      }

      // Both cars and drivers are added, check account status
      if (accountStatus?.toLowerCase() !== 'active') {
        // Documents uploaded but account is not active - show verification page
        console.log('⏳ Documents uploaded but account not active, redirecting to verification');
        router.replace('/login');
        return;
      }

      // Everything is ready - go to dashboard
      console.log('✅ Everything ready, proceeding to dashboard');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('❌ Error checking account status:', error);
      // Fallback to dashboard if check fails
      router.replace('/(tabs)');
    }
  };

  // Simple input handlers
  const handleInputChange = (field: string, value: string) => {
    // Clear error if exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    setDriverData(prev => ({ ...prev, [field]: value }));
  };

  // Simple validation - just check if fields are not empty
  const validateAllFields = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!driverData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!driverData.primary_number.trim()) newErrors.primary_number = 'Primary phone number is required';
    if (!driverData.password.trim()) newErrors.password = 'Password is required';
    if (!driverData.licence_number.trim()) newErrors.licence_number = 'Driving licence number is required';
    if (!driverData.adress.trim()) newErrors.adress = 'Address is required';
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
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
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('⚠️ Driver registration already in progress, ignoring duplicate submission');
      return;
    }

    // Clear previous errors
    setErrors({});

    // Simple validation - just check if fields are not empty
    if (!validateAllFields()) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    // Check required images
    if (!driverImages.licence_front_img || !driverImages.rc_front_img || !driverImages.rc_back_img || !driverImages.insurance_img || !driverImages.fc_img || !driverImages.car_img) {
      Alert.alert('Error', 'Please upload all required images (Licence Front, RC Front, RC Back, Insurance, FC, Car Image)');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🚀 Starting driver registration (preventing duplicates)...');

      const payload: DriverDetails = {
        full_name: driverData.full_name.trim(),
        primary_number: driverData.primary_number.trim(), // Send as entered
        secondary_number: driverData.secondary_number.trim(),
        password: driverData.password.trim(),
        licence_number: driverData.licence_number.trim(), // Send as entered
        adress: driverData.adress.trim(),
        organization_id: user?.organizationId || 'org_001',
        vehicle_owner_id: user?.id || 'e5b9edb1-b4bb-48b8-a662-f7fd00abb6eb',
        licence_front_img_url: driverImages.licence_front_img,
        rc_front_img: driverImages.rc_front_img,
        rc_back_img: driverImages.rc_back_img,
        insurance_img: driverImages.insurance_img,
        fc_img: driverImages.fc_img,
        car_img: driverImages.car_img
      };

      await addDriverDetails(payload);

      Alert.alert(
        'Success',
        'Driver details added successfully!',
        [
          {
            text: 'OK',
            onPress: () => checkAccountStatusAndRedirect()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error adding driver:', error);
      
      // Check if it's a duplicate registration error
      if (error.message && error.message.includes('already registered')) {
        Alert.alert(
          'Driver Already Exists',
          'This driver is already registered. Redirecting to dashboard...',
          [
            {
              text: 'OK',
              onPress: () => checkAccountStatusAndRedirect()
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to add driver details');
      }
    } finally {
      setIsSubmitting(false);
    }
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
              placeholderTextColor="#9CA3AF"
              value={driverData.full_name}
              onChangeText={(text) => handleInputChange('full_name', text)}
            />
          </View>
          {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}

          <View style={styles.inputGroup}>
            <Phone color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.primary_number && styles.inputError]}
              placeholder="Primary Mobile Number (+91XXXXXXXXXX)"
              placeholderTextColor="#9CA3AF"
              value={driverData.primary_number}
              onChangeText={(text) => handleInputChange('primary_number', text)}
              keyboardType="phone-pad"
            />
          </View>
          {errors.primary_number && <Text style={styles.errorText}>{errors.primary_number}</Text>}
          <Text style={styles.helpText}>
            Enter your mobile number exactly as you want it stored
          </Text>

          <View style={styles.inputGroup}>
            <Phone color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.secondary_number && styles.inputError]}
              placeholder="Secondary Mobile Number (Optional)"
              placeholderTextColor="#9CA3AF"
              value={driverData.secondary_number}
              onChangeText={(text) => handleInputChange('secondary_number', text)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={driverData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
            />
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <View style={styles.inputGroup}>
            <CreditCard color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.licence_number && styles.inputError]}
              placeholder="Driving Licence Number (e.g., MH-12-1990-1234567)"
              placeholderTextColor="#9CA3AF"
              value={driverData.licence_number}
              onChangeText={(text) => handleInputChange('licence_number', text)}
              autoCapitalize="characters"
            />
          </View>
          {errors.licence_number && <Text style={styles.errorText}>{errors.licence_number}</Text>}
          <Text style={styles.helpText}>
            Enter your driving licence number exactly as it appears on your licence
          </Text>

          <View style={styles.inputGroup}>
            <MapPin color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.adress && styles.inputError]}
              placeholder="Address (e.g., 123 Main Street, Mumbai, Maharashtra)"
              placeholderTextColor="#9CA3AF"
              value={driverData.adress}
              onChangeText={(text) => handleInputChange('adress', text)}
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

          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator color="#FFFFFF" size={20} />
                <Text style={styles.saveButtonText}>Saving Driver...</Text>
              </>
            ) : (
              <>
                <Save color="#FFFFFF" size={20} />
                <Text style={styles.saveButtonText}>Save Driver & Continue</Text>
              </>
            )}
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
    textAlign: 'left'
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
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});


