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
import { Car, Plus, ArrowLeft, Upload, CheckCircle, FileText, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { addCarDetailsWithLogin, testCarDetailsDataStructure, CarDetailsData } from '@/services/signupService';
import { useAuth } from '@/contexts/AuthContext';

const carTypes = ['SEDAN', 'HATCHBACK', 'SUV', 'INNOVA', 'INNOVA CRYSTA', 'OTHER'];

export default function AddCarPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [carData, setCarData] = useState({
    car_name: '',
    car_type: '',
    car_number: '',
    organization_id: user?.organizationId || 'org_123',
    vehicle_owner_id: user?.id || '2819b115-fbcc-42ec-a5b3-81633980d9ce',
    rc_front_img: null,
    rc_back_img: null,
    insurance_img: null,
    fc_img: null,
    car_img: null
  });

  const updateCarField = (field: string, value: string) => {
    setCarData(prev => ({ ...prev, [field]: value }));
  };

  const updateCarImage = (field: string, imageUri: string) => {
    setCarData(prev => ({ ...prev, [field]: imageUri }));
  };

  const pickImage = async (field: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        updateCarImage(field, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = ['car_name', 'car_type', 'car_number'];
    const requiredImages = ['rc_front_img', 'rc_back_img', 'insurance_img', 'fc_img', 'car_img'];
    
    const missingFields = requiredFields.filter(field => !carData[field as keyof typeof carData]);
    const missingImages = requiredImages.filter(field => !carData[field as keyof typeof carData]);
    
    if (missingFields.length > 0) {
      Alert.alert('Error', `Please fill in: ${missingFields.join(', ')}`);
      return;
    }
    
    if (missingImages.length > 0) {
      Alert.alert('Error', `Please upload: ${missingImages.join(', ')}`);
      return;
    }

    setLoading(true);

    try {
      console.log('🚗 Starting car details submission with JWT verification...');
      
      // Test data structure first
      const testData = testCarDetailsDataStructure(carData);
      console.log('🧪 Car details data structure test completed');
      
      // Create user data for login
      const userData = {
        id: user?.id || carData.vehicle_owner_id,
        fullName: user?.fullName || 'Vehicle Owner',
        primaryMobile: user?.primaryMobile || '',
        secondaryMobile: user?.secondaryMobile || '',
        paymentMethod: user?.paymentMethod || '',
        paymentNumber: user?.paymentNumber || '',
        password: user?.password || '',
        address: user?.address || '',
        aadharNumber: user?.aadharNumber || '',
        organizationId: user?.organizationId || carData.organization_id,
        languages: user?.languages || [],
        documents: user?.documents || {},
      };
      
      // Call the enhanced car details API with JWT verification and automatic login
      const response = await addCarDetailsWithLogin(carData, userData, async (enhancedUser, token) => {
        try {
          // Automatically login the user
          await login(enhancedUser, token);
          console.log('✅ User automatically logged in after car registration');
        } catch (loginError) {
          console.error('❌ Automatic login failed:', loginError);
          throw new Error('Car added but automatic login failed');
        }
      });
      
      if (response.status === 'success') {
        Alert.alert(
          'Car Added Successfully!',
          `Your ${carData.car_name} has been registered and you are now logged in.`,
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/my-cars')
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Car details submission failed:', error);
      Alert.alert('Error', error.message || 'Failed to add car. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ImageUpload = ({ field, label, required }: { 
    field: string; 
    label: string; 
    required: boolean; 
  }) => {
    const imageUri = carData[field as keyof typeof carData];
    const isUploaded = !!imageUri;
    
    return (
      <TouchableOpacity
        style={[styles.imageUploadCard, isUploaded && styles.uploadedImageCard]}
        onPress={() => pickImage(field)}
      >
        <View style={styles.imageUploadLeft}>
          <View style={[styles.imageUploadIcon, isUploaded && styles.uploadedImageIcon]}>
            {isUploaded ? (
              <CheckCircle color="#FFFFFF" size={20} />
            ) : (
              <FileText color="#6B7280" size={20} />
            )}
          </View>
          <View>
            <Text style={styles.imageUploadTitle}>{label}</Text>
            <Text style={styles.imageUploadStatus}>
              {isUploaded ? 'Uploaded' : required ? 'Required' : 'Optional'}
            </Text>
          </View>
        </View>
        <Upload color={isUploaded ? "#10B981" : "#6B7280"} size={20} />
      </TouchableOpacity>
    );
  };

  const CarTypeSelector = ({ selectedType, onSelect }: { selectedType: string; onSelect: (type: string) => void }) => (
    <View style={styles.typeSelector}>
      {carTypes.map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.typeButton,
            selectedType === type && styles.selectedTypeButton
          ]}
          onPress={() => onSelect(type)}
        >
          <Text style={[
            styles.typeButtonText,
            selectedType === type && styles.selectedTypeButtonText
          ]}>
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color="#6B7280" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Car</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Car Information</Text>
          
          <View style={styles.inputGroup}>
            <Car color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Car Name (e.g., Toyota Camry)"
              value={carData.car_name}
              onChangeText={(value) => updateCarField('car_name', value)}
            />
          </View>

          <Text style={styles.fieldLabel}>Car Type</Text>
          <CarTypeSelector
            selectedType={carData.car_type}
            onSelect={(type) => updateCarField('car_type', type)}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputIcon}>REG</Text>
            <TextInput
              style={styles.input}
              placeholder="Registration Number (e.g., MH-12-AB-1234)"
              value={carData.car_number}
              onChangeText={(value) => updateCarField('car_number', value.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          
          <ImageUpload 
            field="rc_front_img" 
            label="RC Front Image" 
            required={true} 
          />
          
          <ImageUpload 
            field="rc_back_img" 
            label="RC Back Image" 
            required={true} 
          />
          
          <ImageUpload 
            field="insurance_img" 
            label="Insurance Image" 
            required={true} 
          />
          
          <ImageUpload 
            field="fc_img" 
            label="FC Image" 
            required={true} 
          />
          
          <ImageUpload 
            field="car_img" 
            label="Car Image" 
            required={true} 
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🔐 JWT Verification & Auto-Login</Text>
          <Text style={styles.infoText}>
            After successful car registration, your JWT token will be verified and you'll be automatically logged in to the system.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Save color="#FFFFFF" size={20} />
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Car & Verifying JWT...' : 'Add Car & Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  inputIcon: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#6B7280',
    width: 20,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedTypeButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  imageUploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadedImageCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  imageUploadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageUploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadedImageIcon: {
    backgroundColor: '#10B981',
  },
  imageUploadTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  imageUploadStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});
