import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import axiosInstance from '@/app/api/axiosInstance';

export default function NetworkTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBasicConnectivity = async () => {
    setLoading(true);
    addResult('🔍 Testing basic connectivity...');
    
    try {
      // Test 1: Basic GET request
      addResult('📡 Testing GET request to /api/users/vehicleowner/signup...');
      const response = await axiosInstance.get('/api/users/vehicleowner/signup');
      addResult(`✅ GET successful: ${response.status} ${response.statusText}`);
    } catch (error: any) {
      addResult(`❌ GET failed: ${error.message}`);
      if (error.code) addResult(`   Code: ${error.code}`);
      if (error.response?.status) addResult(`   Status: ${error.response.status}`);
    }

    try {
      // Test 2: Test with a simple endpoint
      addResult('📡 Testing simple endpoint...');
      const response = await axiosInstance.get('/');
      addResult(`✅ Root endpoint: ${response.status}`);
    } catch (error: any) {
      addResult(`❌ Root endpoint failed: ${error.message}`);
    }

    setLoading(false);
  };

  const testSignupEndpoint = async () => {
    setLoading(true);
    addResult('📡 Testing signup endpoint specifically...');
    
    try {
      // Create a minimal test payload
      const testData = new FormData();
      testData.append('full_name', 'Test User');
      testData.append('primary_number', '+919876543210');
      testData.append('password', 'testpass123');
      testData.append('address', 'Test Address');
      testData.append('aadhar_number', '123456789012');
      testData.append('organization_id', 'org_001');
      
      // Add a dummy image file
      const dummyImage = {
        uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        type: 'image/jpeg',
        name: 'test.jpg'
      } as any;
      
      testData.append('aadhar_front_img', dummyImage);
      
      addResult('📤 Sending test signup request...');
      const response = await axiosInstance.post('/api/users/vehicleowner/signup', testData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      addResult(`✅ Signup test successful: ${response.status}`);
      addResult(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error: any) {
      addResult(`❌ Signup test failed: ${error.message}`);
      if (error.code) addResult(`   Code: ${error.code}`);
      if (error.response?.status) addResult(`   Status: ${error.response.status}`);
      if (error.response?.data) addResult(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    
    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Connectivity Test</Text>
      <Text style={styles.subtitle}>Testing connection to backend at http://10.138.138.145:8000</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={testBasicConnectivity}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : 'Test Basic Connectivity'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={testSignupEndpoint}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : 'Test Signup Endpoint'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
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
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  testButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginBottom: 8,
    lineHeight: 18,
  },
});
