import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Phone, Lock, FileText, Camera, Eye, EyeOff, ArrowRight, CircleCheck as CheckCircle, MapPin, Trash2 } from 'lucide-react-native';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import { pickImage, ImageInfo } from '../../utils/imageUtils';
import { validateFormData } from '../../utils/validation';

const { width, height } = Dimensions.get('window');

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    primary_number: '',
    secondary_number: '',
    address: '',
    aadhar_number: '',
    gpay_number: '',
    password: '',
    confirmPassword: '',
  });
  const [aadharImage, setAadharImage] = useState<ImageInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signUp, loading, error } = useVendorAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImagePick = async () => {
    try {
      const image = await pickImage();
      if (image) {
        setAadharImage(image);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image');
    }
  };

  const removeImage = () => {
    setAadharImage(null);
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.full_name.trim()) {
          Alert.alert('Error', 'Please enter your full name');
          return false;
        }
        if (!formData.primary_number.trim()) {
          Alert.alert('Error', 'Please enter your primary mobile number');
          return false;
        }
        if (!formData.address.trim()) {
          Alert.alert('Error', 'Please enter your address');
          return false;
        }
        return true;
      case 2:
        if (!formData.aadhar_number.trim()) {
          Alert.alert('Error', 'Please enter your Aadhar number');
          return false;
        }
        if (!formData.gpay_number.trim()) {
          Alert.alert('Error', 'Please enter your GPay number');
          return false;
        }
        return true;
      case 3:
        if (!formData.password.trim()) {
          Alert.alert('Error', 'Please enter a password');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSignUp();
      }
    }
  };

  const handleSignUp = async () => {
    // Validate all form data
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    try {
      const signUpData = {
        ...formData,
        aadhar_image: aadharImage ? aadharImage.uri : undefined,
      };

      const result = await signUp(signUpData);
      
      if (result) {
        // Redirect to success page instead of sign-in
        router.push('/(auth)/signup-success');
      }
    } catch (error) {
      // Alert.alert('Error', 'Failed to create account. Please try again.');
      console.log("Error to Signup")
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive,
            currentStep > step && styles.stepCircleCompleted
          ]}>
            {currentStep > step ? (
              <CheckCircle size={18} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 3 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Personal Information</Text>
        <Text style={styles.stepSubtitle}>Let's start with your basic details</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <User size={20} color="#3B82F6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.full_name}
            onChangeText={(value) => handleInputChange('full_name', value)}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Phone size={20} color="#3B82F6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Primary Mobile Number"
            value={formData.primary_number}
            onChangeText={(value) => handleInputChange('primary_number', value)}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Phone size={20} color="#6B7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Secondary Mobile Number"
            value={formData.secondary_number}
            onChangeText={(value) => handleInputChange('secondary_number', value)}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <MapPin size={20} color="#3B82F6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Address (Minimum 10 characters)"
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Identity & Payment</Text>
        <Text style={styles.stepSubtitle}>Add your identity and payment details</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <FileText size={20} color="#3B82F6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Aadhar Number (12 digits)"
            value={formData.aadhar_number}
            onChangeText={(value) => handleInputChange('aadhar_number', value)}
            keyboardType="numeric"
            maxLength={12}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Phone size={20} color="#3B82F6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="GPay Number"
            value={formData.gpay_number}
            onChangeText={(value) => handleInputChange('gpay_number', value)}
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.imageLabel}>Aadhar Front Image (Optional)</Text>
          <Text style={styles.imageSubtext}>Max size: 5MB, Format: JPG/PNG</Text>
          
          {aadharImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: aadharImage.uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <Trash2 size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick}>
              <Camera size={24} color="#3B82F6" />
              <Text style={styles.imagePickerText}>Select Image</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Secure Your Account</Text>
        <Text style={styles.stepSubtitle}>Create a strong password for your account</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Lock size={20} color="#3B82F6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry={!showPassword}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            {showPassword ? 
              <EyeOff size={20} color="#6B7280" /> : 
              <Eye size={20} color="#6B7280" />
            }
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#3B82F6" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
          >
            {showConfirmPassword ? 
              <EyeOff size={20} color="#6B7280" /> : 
              <Eye size={20} color="#6B7280" />
            }
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
        <Text style={styles.requirementItem}>• At least 6 characters long</Text>
        <Text style={styles.requirementItem}>• Include numbers and letters</Text>
        <Text style={styles.requirementItem}>• Avoid common passwords</Text>
      </View>
    </View>
  );


  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}></View>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSubtitle}>Join as a vendor partner</Text>
          </View>
          {renderStepIndicator()}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(currentStep - 1)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.nextButton, loading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={loading}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>
                    {loading ? 'Creating Account...' : 
                     currentStep === 3 ? 'Create Account' : 'Next'}
                  </Text>
                  {currentStep < 3 && <ArrowRight size={20} color="#FFFFFF" />}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Link href="/sign-in" style={styles.link}>
              <Text style={styles.linkTextBold}>Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    paddingTop: height * 0.06,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  stepCircleActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  contentSection: {
    flex: 1,
  },
  stepContent: {
    paddingTop: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    textAlignVertical: 'top',
    paddingVertical: 8,
  },
  eyeIcon: {
    padding: 8,
  },
  passwordRequirements: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    gap: 16,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  nextButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  linkText: {
    fontSize: 16,
    color: '#6B7280',
  },
  link: {
    color: '#3B82F6',
  },
  linkTextBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  footerSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  securityText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
    fontWeight: '500',
  },
  imageSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  imageSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 6,
    zIndex: 1,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  imagePickerText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});