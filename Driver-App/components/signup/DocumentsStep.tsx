import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Upload, Check, FileText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { signupAccount, SignupData } from '@/services/signupService';

interface DocumentsStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onBack: () => void;
  formData: any;
}

const documentTypes = [
  { key: 'aadharFront', label: 'Aadhar Front Image', required: true },
];

export default function DocumentsStep({ data, onUpdate, onBack, formData }: DocumentsStepProps) {
  const [documents, setDocuments] = useState(data);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const pickDocument = async (documentKey: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const updatedDocuments = {
          ...documents,
          [documentKey]: result.assets[0].uri
        };
        setDocuments(updatedDocuments);
        onUpdate(updatedDocuments);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    const requiredDocs = documentTypes.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => !documents[doc.key]);

    if (missingDocs.length > 0) {
      Alert.alert('Error', 'Please upload Aadhar front image');
      return;
    }

    setLoading(true);

    try {
      // Map form data to match backend API structure
      const signupData: SignupData = {
        full_name: formData.personalDetails.fullName,
        primary_number: formData.personalDetails.primaryMobile,
        secondary_number: formData.personalDetails.secondaryMobile,
        password: formData.personalDetails.password,
        address: formData.personalDetails.address,
        gpay_number: formData.personalDetails.paymentMethod === 'GPay' ? formData.personalDetails.paymentNumber : undefined,
        aadhar_number: formData.personalDetails.aadharNumber,
        organization_id: formData.personalDetails.organizationId,
        aadhar_front_img: documents.aadharFront,
      };

      console.log('📤 Mapped signup data:', signupData);

      // Call signup API
      const response = await signupAccount(signupData);
      
      if (response.status === 'success') {
        // Create user object for local auth
        const userData = {
          id: response.user_id,
          fullName: formData.personalDetails.fullName,
          primaryMobile: formData.personalDetails.primaryMobile,
          secondaryMobile: formData.personalDetails.secondaryMobile,
          paymentMethod: formData.personalDetails.paymentMethod,
          paymentNumber: formData.personalDetails.paymentNumber,
          password: formData.personalDetails.password,
          address: formData.personalDetails.address,
          aadharNumber: formData.personalDetails.aadharNumber,
          organizationId: formData.personalDetails.organizationId,
          languages: formData.personalDetails.languages,
          documents: documents,
        };

        // Login with the new user data
        await login(userData, 'registration-token');
        
        // Show success message and redirect to car add page
        Alert.alert(
          'Account Created Successfully!',
          'Welcome to Drop Cars! Now let\'s add your first car.',
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/add-car')
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const DocumentUpload = ({ docType }: { docType: { key: string; label: string; required: boolean } }) => {
    const isUploaded = documents[docType.key];
    
    return (
      <TouchableOpacity
        style={[styles.documentCard, isUploaded && styles.uploadedCard]}
        onPress={() => pickDocument(docType.key)}
      >
        <View style={styles.documentLeft}>
          <View style={[styles.documentIcon, isUploaded && styles.uploadedIcon]}>
            {isUploaded ? (
              <Check color="#FFFFFF" size={20} />
            ) : (
              <FileText color="#6B7280" size={20} />
            )}
          </View>
          <View>
            <Text style={styles.documentTitle}>{docType.label}</Text>
            <Text style={styles.documentStatus}>
              {isUploaded ? 'Uploaded' : 'Required'}
            </Text>
          </View>
        </View>
        <Upload color={isUploaded ? "#10B981" : "#6B7280"} size={20} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Document Verification</Text>
      <Text style={styles.subtitle}>Upload your Aadhar front image for verification</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {documentTypes.map((docType) => (
          <DocumentUpload key={docType.key} docType={docType} />
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color="#6B7280" size={20} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  documentCard: {
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
  uploadedCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadedIcon: {
    backgroundColor: '#10B981',
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  documentStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});