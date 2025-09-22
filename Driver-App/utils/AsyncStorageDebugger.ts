import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage debugging utility
export class AsyncStorageDebugger {
  static async testBasicOperations() {
    try {
      console.log('🧪 Testing AsyncStorage basic operations...');
      
      // Test 1: Set and Get
      const testKey = 'debug_test_key';
      const testValue = `Test value - ${Date.now()}`;
      
      console.log('📝 Setting test value:', testValue);
      await AsyncStorage.setItem(testKey, testValue);
      
      console.log('📖 Getting test value...');
      const retrievedValue = await AsyncStorage.getItem(testKey);
      console.log('📖 Retrieved value:', retrievedValue);
      
      if (retrievedValue === testValue) {
        console.log('✅ Basic set/get test passed');
      } else {
        console.error('❌ Basic set/get test failed - values don\'t match');
        return false;
      }
      
      // Test 2: JSON operations
      const jsonKey = 'debug_json_key';
      const jsonValue = { 
        id: '123', 
        name: 'Test User', 
        timestamp: Date.now() 
      };
      
      console.log('📝 Setting JSON value:', jsonValue);
      await AsyncStorage.setItem(jsonKey, JSON.stringify(jsonValue));
      
      console.log('📖 Getting JSON value...');
      const retrievedJson = await AsyncStorage.getItem(jsonKey);
      const parsedJson = JSON.parse(retrievedJson || '{}');
      console.log('📖 Retrieved JSON:', parsedJson);
      
      if (JSON.stringify(parsedJson) === JSON.stringify(jsonValue)) {
        console.log('✅ JSON operations test passed');
      } else {
        console.error('❌ JSON operations test failed');
        return false;
      }
      
      // Test 3: Multiple keys
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', 'value3'];
      
      console.log('📝 Setting multiple keys...');
      for (let i = 0; i < keys.length; i++) {
        await AsyncStorage.setItem(keys[i], values[i]);
      }
      
      console.log('📖 Getting multiple keys...');
      const retrievedValues = await AsyncStorage.multiGet(keys);
      console.log('📖 Retrieved values:', retrievedValues);
      
      let multiGetPassed = true;
      for (let i = 0; i < keys.length; i++) {
        if (retrievedValues[i][1] !== values[i]) {
          multiGetPassed = false;
          break;
        }
      }
      
      if (multiGetPassed) {
        console.log('✅ Multiple keys test passed');
      } else {
        console.error('❌ Multiple keys test failed');
        return false;
      }
      
      // Test 4: Remove operations
      console.log('🗑️ Testing remove operations...');
      await AsyncStorage.removeItem(testKey);
      await AsyncStorage.removeItem(jsonKey);
      await AsyncStorage.multiRemove(keys);
      
      const removedValue = await AsyncStorage.getItem(testKey);
      if (removedValue === null) {
        console.log('✅ Remove operations test passed');
      } else {
        console.error('❌ Remove operations test failed');
        return false;
      }
      
      console.log('✅ All AsyncStorage tests passed!');
      return true;
      
    } catch (error) {
      console.error('❌ AsyncStorage test failed:', error);
      return false;
    }
  }
  
  static async checkExistingData() {
    try {
      console.log('🔍 Checking existing AsyncStorage data...');
      
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔑 All keys:', allKeys);
      
      if (allKeys.length > 0) {
        console.log('📖 Getting all data...');
        const allData = await AsyncStorage.multiGet(allKeys);
        
        allData.forEach(([key, value]) => {
          console.log(`📄 ${key}:`, value ? (value.length > 100 ? `${value.substring(0, 100)}...` : value) : 'null');
        });
      } else {
        console.log('📭 No data found in AsyncStorage');
      }
      
      return allKeys;
    } catch (error) {
      console.error('❌ Failed to check existing data:', error);
      return [];
    }
  }
  
  static async clearAllData() {
    try {
      console.log('🗑️ Clearing all AsyncStorage data...');
      await AsyncStorage.clear();
      console.log('✅ All AsyncStorage data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear AsyncStorage:', error);
      return false;
    }
  }
  
  static async testAppSpecificKeys() {
    try {
      console.log('🧪 Testing app-specific AsyncStorage keys...');
      
      const appKeys = [
        'user_data',
        'authToken', 
        'carDriver',
        'carDriverToken',
        'test_key'
      ];
      
      for (const key of appKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          console.log(`📄 ${key}:`, value ? (value.length > 100 ? `${value.substring(0, 100)}...` : value) : 'null');
        } catch (error) {
          console.error(`❌ Error reading ${key}:`, error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to test app-specific keys:', error);
      return false;
    }
  }
  
  static async runFullDiagnostic() {
    console.log('🔬 Running full AsyncStorage diagnostic...');
    
    const results = {
      basicOperations: false,
      existingData: [],
      appSpecificKeys: false,
      clearData: false
    };
    
    // Test basic operations
    results.basicOperations = await this.testBasicOperations();
    
    // Check existing data
    results.existingData = await this.checkExistingData();
    
    // Test app-specific keys
    results.appSpecificKeys = await this.testAppSpecificKeys();
    
    console.log('📊 Diagnostic results:', results);
    return results;
  }
}

export default AsyncStorageDebugger;
