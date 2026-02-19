import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { User, Phone, MapPin, Lock, Hash, Eye, EyeOff, Upload, CheckCircle, FileText } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { signupAndLogin } from '@/services/auth/signupService';
import * as ImagePicker from 'expo-image-picker';

const normalizeLocalUri = (uri: string) => (uri ? uri.replace('/useer/', '/user/') : uri);

interface SignupSinglePageProps {
  onSignupSuccess: (response: any) => void;
}

export default function SignupSinglePage({ onSignupSuccess }: SignupSinglePageProps) {
  const [fullName, setFullName] = useState('');
  const [primaryMobile, setPrimaryMobile] = useState('');
  const [secondaryMobile, setSecondaryMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFrontUri, setAadharFrontUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submitInProgress = useRef(false);
  const { login } = useAuth();

  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = normalizeLocalUri(result.assets[0].uri);
        setAadharFrontUri(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCreateAccount = async () => {
    if (submitInProgress.current) return;
    if (loading) return;

    const personalData = {
      fullName: fullName.trim(),
      primaryMobile: primaryMobile.trim(),
      secondaryMobile: secondaryMobile.trim(),
      password: password.trim(),
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      aadharNumber: aadharNumber.trim(),
    };

    if (!personalData.fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!personalData.primaryMobile || personalData.primaryMobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit primary mobile number');
      return;
    }
    if (!personalData.password || personalData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!personalData.address) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }
    if (!personalData.aadharNumber || personalData.aadharNumber.length !== 12) {
      Alert.alert('Error', 'Please enter a valid 12-digit Aadhar number');
      return;
    }
    if (!aadharFrontUri) {
      Alert.alert('Error', 'Please upload Aadhar front image');
      return;
    }
    if (!aadharFrontUri.startsWith('file://')) {
      Alert.alert('Error', 'Invalid image format. Please select the Aadhar image again.');
      return;
    }

    submitInProgress.current = true;
    setLoading(true);

    try {
      const normalizedDocs = { aadharFront: normalizeLocalUri(aadharFrontUri) };
      const { signup, login: loginResp } = await signupAndLogin(personalData, normalizedDocs);

      if (signup.status === 'success') {
        const userData = {
          id: signup.user_id,
          fullName: personalData.fullName,
          primaryMobile: personalData.primaryMobile,
          secondaryMobile: personalData.secondaryMobile,
          password: personalData.password,
          address: personalData.address,
          aadharNumber: personalData.aadharNumber,
          organizationId: undefined,
          languages: [],
          documents: normalizedDocs,
        };
        await login(userData, loginResp.access_token);
        onSignupSuccess({ signup, login: loginResp, userData });
      }
    } catch (error: any) {
      let errorMessage = 'Signup failed. Please try again.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Check your connection and try again.';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Server not found. Please try again later.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message && typeof error.message === 'string' && !error.message.startsWith('Signup failed:')) {
        errorMessage = error.message;
      } else if (error.response?.status === 400) {
        const data = error.response?.data;
        const detail = data?.detail ?? data?.message;
        errorMessage = typeof detail === 'string' ? detail : (detail ? String(detail) : errorMessage);
      } else if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' ? error.response.data.detail : String(error.response.data.detail);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
      submitInProgress.current = false;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Enter your details and upload Aadhar</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>

        <Text style={styles.label}>Full Name *</Text>
        <View style={styles.inputGroup}>
          <User color="#6B7280" size={20} />
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" />
        </View>

        <Text style={styles.label}>Primary Mobile *</Text>
        <View style={styles.inputGroup}>
          <Phone color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            value={primaryMobile}
            onChangeText={(t) => { const c = t.replace(/\D/g, ''); if (c.length <= 10) setPrimaryMobile(c); }}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="10-digit mobile"
          />
        </View>

        <Text style={styles.label}>Secondary Mobile (Optional)</Text>
        <View style={styles.inputGroup}>
          <Phone color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            value={secondaryMobile}
            onChangeText={(t) => { const c = t.replace(/\D/g, ''); if (c.length <= 10) setSecondaryMobile(c); }}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="10-digit mobile"
          />
        </View>

        <Text style={styles.label}>Password *</Text>
        <View style={styles.inputGroup}>
          <Lock color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="Min 6 characters"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            {showPassword ? <EyeOff color="#6B7280" size={20} /> : <Eye color="#6B7280" size={20} />}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Address *</Text>
        <View style={styles.inputGroup}>
          <MapPin color="#6B7280" size={20} />
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Street address" multiline numberOfLines={2} />
        </View>

        <Text style={styles.label}>City</Text>
        <View style={styles.inputGroup}>
          <MapPin color="#6B7280" size={20} />
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
        </View>

        <Text style={styles.label}>Pincode</Text>
        <View style={styles.inputGroup}>
          <MapPin color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            value={pincode}
            onChangeText={(t) => { const c = t.replace(/\D/g, ''); if (c.length <= 6) setPincode(c); }}
            keyboardType="numeric"
            maxLength={6}
            placeholder="6-digit pincode"
          />
        </View>

        <Text style={styles.label}>Aadhar Number *</Text>
        <View style={styles.inputGroup}>
          <Hash color="#6B7280" size={20} />
          <TextInput
            style={styles.input}
            value={aadharNumber}
            onChangeText={setAadharNumber}
            keyboardType="numeric"
            maxLength={12}
            placeholder="12-digit Aadhar"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document</Text>
        <Text style={styles.subtitle}>Upload Aadhar front image *</Text>
        <TouchableOpacity
          style={[styles.docCard, aadharFrontUri && styles.docCardUploaded]}
          onPress={pickDocument}
        >
          <View style={styles.docLeft}>
            <View style={[styles.docIcon, aadharFrontUri && styles.docIconUploaded]}>
              {aadharFrontUri ? <CheckCircle color="#FFFFFF" size={20} /> : <FileText color="#6B7280" size={20} />}
            </View>
            <View>
              <Text style={styles.docTitle}>Aadhar Front Image</Text>
              <Text style={styles.docStatus}>{aadharFrontUri ? 'Uploaded' : 'Tap to upload'}</Text>
            </View>
          </View>
          <Upload color={aadharFrontUri ? '#10B981' : '#6B7280'} size={20} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.createButton, loading && styles.createButtonDisabled]}
        onPress={handleCreateAccount}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.createButtonText}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 20 },
  title: { fontSize: 24, fontFamily: 'Inter-Bold', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#6B7280', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#1F2937', marginBottom: 16 },
  label: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#1F2937', marginBottom: 8 },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    paddingVertical: 0,
  },
  eyeBtn: { padding: 4 },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  docCardUploaded: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  docLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docIconUploaded: { backgroundColor: '#10B981' },
  docTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#1F2937' },
  docStatus: { fontSize: 12, fontFamily: 'Inter-Regular', color: '#6B7280', marginTop: 2 },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: { backgroundColor: '#9CA3AF' },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-SemiBold' },
});
