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
  
  const router = useRouter();
  const { user } = useAuth();

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
    // Check required text fields
    if (!driverData.full_name || !driverData.primary_number || !driverData.password || !driverData.licence_number || !driverData.adress) {
      Alert.alert('Error', 'Please fill all required driver details');
      return;
    }

    // Check required images
    if (!driverImages.licence_front_img) {
      Alert.alert('Error', 'Please upload the driving licence front image');
      return;
    }

    try {
      const payload: DriverDetails = {
        full_name: driverData.full_name,
        primary_number: driverData.primary_number,
        secondary_number: driverData.secondary_number || '',
        password: driverData.password,
        licence_number: driverData.licence_number,
        adress: driverData.adress,
        organization_id: user?.organizationId || 'org_001',
        vehicle_owner_id: user?.id || 'e5b9edb1-b4bb-48b8-a662-f7fd00abb6eb', // Use actual user ID
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
              style={styles.input}
              placeholder="Full Name (e.g., John Doe)"
              value={driverData.full_name}
              onChangeText={(text) => setDriverData(prev => ({ ...prev, full_name: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Phone color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Primary Mobile Number (+91XXXXXXXXXX)"
              value={driverData.primary_number}
              onChangeText={(text) => {
                // Format phone number to match backend expectation
                let formattedText = text.replace(/[^\d]/g, ''); // Remove non-digits
                if (formattedText.length > 0 && !formattedText.startsWith('+91')) {
                  formattedText = '+91' + formattedText;
                }
                setDriverData(prev => ({ ...prev, primary_number: formattedText }));
              }}
              keyboardType="phone-pad"
              maxLength={13}
            />
          </View>

          <View style={styles.inputGroup}>
            <Phone color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Secondary Mobile Number (Optional)"
              value={driverData.secondary_number}
              onChangeText={(text) => {
                // Format phone number to match backend expectation
                let formattedText = text.replace(/[^\d]/g, ''); // Remove non-digits
                if (formattedText.length > 0 && !formattedText.startsWith('+91')) {
                  formattedText = '+91' + formattedText;
                }
                setDriverData(prev => ({ ...prev, secondary_number: formattedText }));
              }}
              keyboardType="phone-pad"
              maxLength={13}
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={driverData.password}
              onChangeText={(text) => setDriverData(prev => ({ ...prev, password: text }))}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <CreditCard color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Driving Licence Number (e.g., DL-0123456789)"
              value={driverData.licence_number}
              onChangeText={(text) => setDriverData(prev => ({ ...prev, licence_number: text.toUpperCase() }))}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <MapPin color="#6B7280" size={20} />
            <TextInput
              style={styles.input}
              placeholder="Address (e.g., 123 Main Street, Mumbai, Maharashtra)"
              value={driverData.adress}
              onChangeText={(text) => setDriverData(prev => ({ ...prev, adress: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

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


