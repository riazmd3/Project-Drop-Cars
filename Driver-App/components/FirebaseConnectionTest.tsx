import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function FirebaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [isConnected, setIsConnected] = useState(false);

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing Firebase connection...');
      
      // Test write operation
      const testRef = doc(db, 'test', 'connection');
      await setDoc(testRef, {
        timestamp: new Date().toISOString(),
        test: true
      });
      
      // Test read operation
      const testSnap = await getDoc(testRef);
      
      if (testSnap.exists()) {
        setConnectionStatus('✅ Firebase connected successfully');
        setIsConnected(true);
      } else {
        setConnectionStatus('❌ Firebase write succeeded but read failed');
        setIsConnected(false);
      }
    } catch (error: any) {
      setConnectionStatus(`❌ Firebase connection failed: ${error.message}`);
      setIsConnected(false);
      console.error('Firebase connection test failed:', error);
    }
  };

  const clearTestData = async () => {
    try {
      const testRef = doc(db, 'test', 'connection');
      await setDoc(testRef, {
        timestamp: new Date().toISOString(),
        test: false
      });
      Alert.alert('Success', 'Test data cleared');
    } catch (error: any) {
      Alert.alert('Error', `Failed to clear test data: ${error.message}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      <Text style={[styles.status, { color: isConnected ? '#10B981' : '#EF4444' }]}>
        {connectionStatus}
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={testConnection}>
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearTestData}>
        <Text style={styles.buttonText}>Clear Test Data</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
