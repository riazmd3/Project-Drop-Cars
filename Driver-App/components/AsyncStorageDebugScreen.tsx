import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorageDebugger from '@/utils/AsyncStorageDebugger';

export default function AsyncStorageDebugScreen() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runBasicTest = async () => {
    setIsLoading(true);
    try {
      const result = await AsyncStorageDebugger.testBasicOperations();
      setTestResults({ basicTest: result });
      Alert.alert(
        result ? '✅ Success' : '❌ Failed', 
        result ? 'AsyncStorage basic operations are working!' : 'AsyncStorage basic operations failed!'
      );
    } catch (error) {
      Alert.alert('❌ Error', `Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingData = async () => {
    setIsLoading(true);
    try {
      const keys = await AsyncStorageDebugger.checkExistingData();
      setTestResults({ existingData: keys });
      Alert.alert('📊 Data Check', `Found ${keys.length} keys in AsyncStorage`);
    } catch (error) {
      Alert.alert('❌ Error', `Check failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAppKeys = async () => {
    setIsLoading(true);
    try {
      const result = await AsyncStorageDebugger.testAppSpecificKeys();
      setTestResults({ appKeys: result });
      Alert.alert('✅ App Keys', 'App-specific keys test completed');
    } catch (error) {
      Alert.alert('❌ Error', `App keys test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullDiagnostic = async () => {
    setIsLoading(true);
    try {
      const results = await AsyncStorageDebugger.runFullDiagnostic();
      setTestResults(results);
      Alert.alert('🔬 Diagnostic Complete', 'Check console for detailed results');
    } catch (error) {
      Alert.alert('❌ Error', `Diagnostic failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      '⚠️ Warning',
      'This will clear ALL AsyncStorage data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await AsyncStorageDebugger.clearAllData();
              if (result) {
                setTestResults({ cleared: true });
                Alert.alert('✅ Cleared', 'All AsyncStorage data has been cleared');
              } else {
                Alert.alert('❌ Error', 'Failed to clear AsyncStorage data');
              }
            } catch (error) {
              Alert.alert('❌ Error', `Clear failed: ${error.message}`);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AsyncStorage Debug Tool</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runBasicTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Basic Operations</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={checkExistingData}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Check Existing Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={testAppKeys}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test App Keys</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={runFullDiagnostic}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Run Full Diagnostic</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={clearAllData}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Running tests...</Text>
        </View>
      )}
      
      {testResults && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          <Text style={styles.resultsText}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How to Use:</Text>
        <Text style={styles.infoText}>
          1. Run "Test Basic Operations" first to check if AsyncStorage is working
          {'\n'}2. Use "Check Existing Data" to see what's currently stored
          {'\n'}3. "Test App Keys" checks your app's specific storage keys
          {'\n'}4. "Run Full Diagnostic" performs all tests and shows detailed results
          {'\n'}5. Check the console for detailed logs
        </Text>
      </View>
    </ScrollView>
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
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#6C757D',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
