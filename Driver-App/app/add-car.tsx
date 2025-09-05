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
import { ArrowLeft, Car, Save, Upload, CheckCircle, FileText, Image, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { addCarDetails, testCarDetailsDataStructure } from '@/services/signupService';
import * as ImagePicker from 'expo-image-picker';
import axiosInstance from '@/app/api/axiosInstance';

export default function AddCarScreen() {
  const [carData, setCarData] = useState({
    name: '',
    type: '',
    registration: '',
    model: '',
    year: '',
    color: '',
  });
  
  const [carImages, setCarImages] = useState({
    rcFront: '',
    rcBack: '',
    insurance: '',
    fc: '',
    carImage: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  const carTypes = ['HATCHBACK', 'SEDAN', 'NEW SEDAN', 'SUV', 'INNOVA', 'INNOVA CRYSTA'];

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

      console.log('🔍 After car addition - Account status:', accountStatus);
      console.log('🔍 After car addition - Car count:', carCount);
      console.log('🔍 After car addition - Driver count:', driverCount);

      // Check if user needs to add more documents
      if (carCount === 0) {
        // Still no cars (shouldn't happen, but just in case)
        console.log('🚗 Still no cars, staying on add car page');
        return;
      }

      if (driverCount === 0) {
        // Cars added but no drivers - redirect to add driver
        console.log('👤 Cars added but no drivers, redirecting to add driver page');
        router.replace('/add-driver');
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
    
    setCarData(prev => ({ ...prev, [field]: value }));
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
        setCarImages(prev => ({
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
    const imageUri = carImages[imageKey as keyof typeof carImages];
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

    // Simple validation - just check if fields are not empty
    if (!carData.name || !carData.type || !carData.registration || !carData.year) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    // Check required images
    if (!carImages.rcFront || !carImages.rcBack || !carImages.insurance || !carImages.fc || !carImages.carImage) {
      Alert.alert('Error', 'Please upload all required images (RC Front, RC Back, Insurance, FC, Car Image)');
      return;
    }

    try {
      const payload = {
        car_name: carData.name.trim(),
        car_type: carData.type,
        car_number: carData.registration.trim(), // Send as entered
        organization_id: user?.organizationId || 'org_001',
        vehicle_owner_id: user?.id || 'e5b9edb1-b4bb-48b8-a662-f7fd00abb6eb',
        rc_front_img: carImages.rcFront,
        rc_back_img: carImages.rcBack,
        insurance_img: carImages.insurance,
        fc_img: carImages.fc,
        car_img: carImages.carImage
      };

      testCarDetailsDataStructure(payload);
      await addCarDetails(payload);

      Alert.alert(
        'Success',
        'Car details added successfully!',
        [
          {
            text: 'OK',
            onPress: () => checkAccountStatusAndRedirect()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error adding car:', error);
      Alert.alert('Error', error.message || 'Failed to add car details');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Your First Car</Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Step 1/3</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Drop Cars!</Text>
          <Text style={styles.welcomeSubtitle}>
            Hi {user?.fullName}, let's get you started by adding your first car and driver.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Car Details</Text>
          
          <View style={styles.inputGroup}>
            <Car color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Car Name (e.g., Toyota Camry)"
              value={carData.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <View style={styles.inputGroup}>
            <Car color="#6B7280" size={20} />
            <TouchableOpacity 
              style={[styles.dropdownButton, errors.type && styles.inputError]}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={[styles.dropdownText, !carData.type && styles.placeholderText]}>
                {carData.type || 'Select Car Type'}
              </Text>
              <ChevronDown color="#6B7280" size={20} />
            </TouchableOpacity>
          </View>
          {showTypeDropdown && (
            <View style={styles.dropdown}>
              {carTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCarData(prev => ({ ...prev, type }));
                    setShowTypeDropdown(false);
                    if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
                  }}
                >
                  <Text style={styles.dropdownItemText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

          <View style={styles.inputGroup}>
            <Car color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.registration && styles.inputError]}
              placeholder="Registration Number (e.g., MH 12 AB 1234)"
              value={carData.registration}
              onChangeText={(text) => handleInputChange('registration', text)}
              autoCapitalize="characters"
            />
          </View>
          {errors.registration && <Text style={styles.errorText}>{errors.registration}</Text>}
          <Text style={styles.helpText}>
            Enter your car registration number exactly as it appears on your RC
          </Text>

          <View style={styles.inputGroup}>
            <Car color="#6B7280" size={20} />
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              placeholder="Model Year (e.g., 2023)"
              value={carData.year}
              onChangeText={(text) => handleInputChange('year', text)}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
          {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}

          <View style={styles.inputGroup}>
            <Car color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Color (e.g., White, Black, Red)"
              value={carData.color}
              onChangeText={(text) => handleInputChange('color', text)}
            />
          </View>

          <Text style={styles.sectionTitle}>Required Documents & Images</Text>
          <Text style={styles.sectionSubtitle}>
            Please upload clear images of all required documents
          </Text>

          <ImageUploadField
            title="RC Front Image"
            description="Registration Certificate front side"
            imageKey="rcFront"
            isRequired={true}
          />

          <ImageUploadField
            title="RC Back Image"
            description="Registration Certificate back side"
            imageKey="rcBack"
            isRequired={true}
          />

          <ImageUploadField
            title="Insurance Image"
            description="Valid insurance certificate"
            imageKey="insurance"
            isRequired={true}
          />

          <ImageUploadField
            title="FC Image"
            description="Fitness Certificate"
            imageKey="fc"
            isRequired={true}
          />

          <ImageUploadField
            title="Car Image"
            description="Clear photo of your car"
            imageKey="carImage"
            isRequired={true}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save color="#FFFFFF" size={20} />
            <Text style={styles.saveButtonText}>Save Car & Continue</Text>
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
  dropdownButton: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
    fontStyle: 'italic',
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


