import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { loginVehicleOwner } from '@/services/signupService';

export default function LoginTest() {
  const [mobileNumber, setMobileNumber] = useState('9500820541');
  const [password, setPassword] = useState('9500820541');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleTestLogin = async () => {
    if (!mobileNumber || !password) {
      Alert.alert('Error', 'Please enter both mobile number and password');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      console.log('🧪 Testing login with:', { mobileNumber, password: '***' });
      
      const loginResponse = await loginVehicleOwner(mobileNumber, password);
      
      console.log('🧪 Login test response:', loginResponse);
      setResponse(loginResponse);
      
      Alert.alert(
        'Login Test Results',
        `Car Details Count: ${loginResponse.car_details_count}\nCar Driver Count: ${loginResponse.car_driver_count}\nAccount Status: ${loginResponse.account_status}`
      );
    } catch (error: any) {
      console.error('🧪 Login test failed:', error);
      Alert.alert('Login Test Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Login Response Test</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mobile Number:</Text>
        <TextInput
          style={styles.input}
          value={mobileNumber}
          onChangeText={setMobileNumber}
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleTestLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Login'}
        </Text>
      </TouchableOpacity>

      {response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Response Data:</Text>
          <Text style={styles.responseText}>
            {JSON.stringify(response, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1F2937',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  responseContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  responseText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    lineHeight: 16,
  },
});
