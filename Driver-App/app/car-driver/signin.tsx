import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useCarDriver } from '@/contexts/CarDriverContext';
import { CarDriverSigninRequest } from '@/services/driver/carDriverService';
import { ArrowLeft, Phone, Lock, Eye, EyeOff, Car } from 'lucide-react-native';

export default function CarDriverSigninScreen() {
  const { colors } = useTheme();
  const { signin, isLoading, error, clearError } = useCarDriver();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<CarDriverSigninRequest>({
    primary_number: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof CarDriverSigninRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.primary_number.trim()) {
      Alert.alert('Error', 'Please enter your mobile number');
      return false;
    }

    if (formData.primary_number.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }

    return true;
  };

  const handleSignin = async () => {
    if (!validateForm()) return;

    try {
      clearError();
      await signin(formData);
      
      Alert.alert(
        'Welcome Back! 🚗',
        'You have successfully signed in.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/car-driver/dashboard')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Signin Failed', error.message || 'Something went wrong. Please try again.');
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      justifyContent: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoIcon: {
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 40,
    },
    formContainer: {
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    passwordToggle: {
      padding: 4,
    },
    signinButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 20,
    },
    signinButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
    },
    loadingButton: {
      opacity: 0.7,
    },
    signupLink: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
    },
    signupText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    signupButton: {
      marginLeft: 4,
    },
    signupButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    errorText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.error,
      textAlign: 'center',
      marginBottom: 20,
    },
    forgotPasswordLink: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    forgotPasswordText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={dynamicStyles.backButton}
        >
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Driver Sign In</Text>
      </View>

      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.logoContainer}>
          <Car color={colors.primary} size={64} style={dynamicStyles.logoIcon} />
          <Text style={dynamicStyles.title}>Welcome Back</Text>
          <Text style={dynamicStyles.subtitle}>
            Sign in to your driver account to continue
          </Text>
        </View>

        <View style={dynamicStyles.formContainer}>
          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.inputLabel}>Mobile Number</Text>
            <View style={dynamicStyles.inputWrapper}>
              <Phone color={colors.textSecondary} size={20} style={dynamicStyles.inputIcon} />
              <TextInput
                style={dynamicStyles.input}
                placeholder="Enter your mobile number"
                value={formData.primary_number}
                onChangeText={(value) => handleInputChange('primary_number', value)}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={dynamicStyles.inputContainer}>
            <Text style={dynamicStyles.inputLabel}>Password</Text>
            <View style={dynamicStyles.inputWrapper}>
              <Lock color={colors.textSecondary} size={20} style={dynamicStyles.inputIcon} />
              <TextInput
                style={dynamicStyles.input}
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={dynamicStyles.passwordToggle}
              >
                {showPassword ? (
                  <EyeOff color={colors.textSecondary} size={20} />
                ) : (
                  <Eye color={colors.textSecondary} size={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {error && <Text style={dynamicStyles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[
            dynamicStyles.signinButton,
            isLoading && dynamicStyles.loadingButton
          ]}
          onPress={handleSignin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={dynamicStyles.signinButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={dynamicStyles.forgotPasswordLink}>
          <Text style={dynamicStyles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={dynamicStyles.signupLink}>
          <Text style={dynamicStyles.signupText}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => router.push('/car-driver/signup')}
            style={dynamicStyles.signupButton}
          >
            <Text style={dynamicStyles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
