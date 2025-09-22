import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AsyncStorageTest() {
  const [testData, setTestData] = useState<string>('');
  const [retrievedData, setRetrievedData] = useState<string>('');

  const testAsyncStorage = async () => {
    try {
      console.log('🧪 Testing AsyncStorage...');
      
      // Test data
      const testValue = `Test data - ${new Date().toISOString()}`;
      setTestData(testValue);
      
      // Store data
      console.log('📝 Storing data:', testValue);
      await AsyncStorage.setItem('test_key', testValue);
      console.log('✅ Data stored successfully');
      
      // Retrieve data
      console.log('📖 Retrieving data...');
      const retrieved = await AsyncStorage.getItem('test_key');
      console.log('📖 Retrieved data:', retrieved);
      setRetrievedData(retrieved || 'No data found');
      
      if (retrieved === testValue) {
        Alert.alert('✅ Success', 'AsyncStorage is working correctly!');
        console.log('✅ AsyncStorage test passed');
      } else {
        Alert.alert('❌ Error', 'AsyncStorage test failed - data mismatch');
        console.error('❌ AsyncStorage test failed - data mismatch');
      }
      
    } catch (error) {
      console.error('❌ AsyncStorage test error:', error);
      Alert.alert('❌ Error', `AsyncStorage test failed: ${error.message}`);
    }
  };

  const clearTestData = async () => {
    try {
      await AsyncStorage.removeItem('test_key');
      setTestData('');
      setRetrievedData('');
      Alert.alert('✅ Cleared', 'Test data cleared successfully');
      console.log('✅ Test data cleared');
    } catch (error) {
      console.error('❌ Failed to clear test data:', error);
      Alert.alert('❌ Error', `Failed to clear: ${error.message}`);
    }
  };

  const checkAllKeys = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('🔑 All AsyncStorage keys:', keys);
      Alert.alert('🔑 Keys', `Found ${keys.length} keys:\n${keys.join('\n')}`);
    } catch (error) {
      console.error('❌ Failed to get keys:', error);
      Alert.alert('❌ Error', `Failed to get keys: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AsyncStorage Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Test Data:</Text>
        <Text style={styles.data}>{testData || 'No test data'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Retrieved Data:</Text>
        <Text style={styles.data}>{retrievedData || 'No retrieved data'}</Text>
      </View>
      
      <TouchableOpacity style={styles.button} onPress={testAsyncStorage}>
        <Text style={styles.buttonText}>Test AsyncStorage</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={clearTestData}>
        <Text style={styles.buttonText}>Clear Test Data</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={checkAllKeys}>
        <Text style={styles.buttonText}>Check All Keys</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  data: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
