import { Platform } from 'react-native';
import { db } from '../firebase-simple';

// Import Firebase functions based on platform
let collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, getDocs, orderBy, limit;

if (Platform.OS === 'web') {
  // Web platform - use Firebase Web SDK
  const firestore = require('firebase/firestore');
  collection = firestore.collection;
  doc = firestore.doc;
  setDoc = firestore.setDoc;
  getDoc = firestore.getDoc;
  updateDoc = firestore.updateDoc;
  deleteDoc = firestore.deleteDoc;
  query = firestore.query;
  where = firestore.where;
  getDocs = firestore.getDocs;
  orderBy = firestore.orderBy;
  limit = firestore.limit;
} else {
  // React Native platform - use @react-native-firebase
  try {
    const firestore = require('@react-native-firebase/firestore').default;
    collection = firestore.collection;
    doc = firestore.doc;
    setDoc = firestore.setDoc;
    getDoc = firestore.getDoc;
    updateDoc = firestore.updateDoc;
    deleteDoc = firestore.deleteDoc;
    query = firestore.query;
    where = firestore.where;
    getDocs = firestore.getDocs;
    orderBy = firestore.orderBy;
    limit = firestore.limit;
  } catch (error) {
    console.warn('⚠️ React Native Firebase not available, using web SDK fallback');
    const firestore = require('firebase/firestore');
    collection = firestore.collection;
    doc = firestore.doc;
    setDoc = firestore.setDoc;
    getDoc = firestore.getDoc;
    updateDoc = firestore.updateDoc;
    deleteDoc = firestore.deleteDoc;
    query = firestore.query;
    where = firestore.where;
    getDocs = firestore.getDocs;
    orderBy = firestore.orderBy;
    limit = firestore.limit;
  }
}
import AsyncStorage from '@react-native-async-storage/async-storage';

// User data storage service
export class FirebaseUserService {
  static COLLECTION_NAME = 'users';
  static VEHICLE_OWNERS_COLLECTION = 'vehicle_owners';
  static DRIVERS_COLLECTION = 'drivers';

  // Save user data to Firebase and local storage
  static async saveUserData(userData, userType = 'vehicle_owner') {
    try {
      console.log('💾 Saving user data to Firebase:', { userType, userId: userData.id });
      
      // Always save to local storage first (fast and reliable)
      await AsyncStorage.setItem('user_data', JSON.stringify({
        ...userData,
        userType,
        lastUpdated: new Date().toISOString()
      }));

      // Try to save to Firebase (with timeout)
      try {
        const collectionName = userType === 'driver' ? this.DRIVERS_COLLECTION : this.VEHICLE_OWNERS_COLLECTION;
        const userRef = doc(db, collectionName, userData.id);
        
        // Add timeout to prevent hanging
        const firebasePromise = setDoc(userRef, {
          ...userData,
          lastUpdated: new Date().toISOString(),
          platform: 'react_native'
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 5000)
        );
        
        await Promise.race([firebasePromise, timeoutPromise]);
        console.log('✅ User data saved to Firebase successfully');
      } catch (firebaseError) {
        console.warn('⚠️ Firebase save failed, using local storage only:', firebaseError.message);
      }

      console.log('✅ User data saved successfully');
      return { success: true, data: userData };
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
      throw error;
    }
  }

  // Load user data from Firebase or local storage
  static async loadUserData(userId, userType = 'vehicle_owner') {
    try {
      console.log('📱 Loading user data:', { userId, userType });
      
      // Try local storage first (fast and reliable)
      try {
        const localData = await AsyncStorage.getItem('user_data');
        if (localData) {
          const userData = JSON.parse(localData);
          console.log('✅ User data loaded from local storage');
          
          // Try to sync with Firebase in background (don't wait for it)
          this.syncWithFirebase(userData, userType).catch(error => {
            console.warn('⚠️ Background Firebase sync failed:', error.message);
          });
          
          return { success: true, data: userData, source: 'local' };
        }
      } catch (localError) {
        console.warn('⚠️ Local storage load failed:', localError.message);
      }
      
      // Fallback to Firebase if local storage fails
      try {
        const collectionName = userType === 'driver' ? this.DRIVERS_COLLECTION : this.VEHICLE_OWNERS_COLLECTION;
        const userRef = doc(db, collectionName, userId);
        
        // Add timeout to prevent hanging
        const firebasePromise = getDoc(userRef);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 3000)
        );
        
        const userSnap = await Promise.race([firebasePromise, timeoutPromise]);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log('✅ User data loaded from Firebase');
          
          // Update local storage with fresh data
          await AsyncStorage.setItem('user_data', JSON.stringify({
            ...userData,
            userType,
            lastUpdated: new Date().toISOString()
          }));
          
          return { success: true, data: userData, source: 'firebase' };
        } else {
          throw new Error('User not found in Firebase');
        }
      } catch (firebaseError) {
        console.warn('⚠️ Firebase load failed:', firebaseError.message);
        throw new Error('No user data found. Please login again.');
      }
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      throw new Error('No user data found. Please login again.');
    }
  }

  // Background sync with Firebase (non-blocking)
  static async syncWithFirebase(userData, userType = 'vehicle_owner') {
    try {
      const collectionName = userType === 'driver' ? this.DRIVERS_COLLECTION : this.VEHICLE_OWNERS_COLLECTION;
      const userRef = doc(db, collectionName, userData.id);
      
      await setDoc(userRef, {
        ...userData,
        lastUpdated: new Date().toISOString(),
        platform: 'react_native'
      });
      
      console.log('✅ Background Firebase sync completed');
    } catch (error) {
      console.warn('⚠️ Background Firebase sync failed:', error.message);
    }
  }

  // Update user data
  static async updateUserData(userId, updates, userType = 'vehicle_owner') {
    try {
      console.log('🔄 Updating user data:', { userId, updates });
      
      const collectionName = userType === 'driver' ? this.DRIVERS_COLLECTION : this.VEHICLE_OWNERS_COLLECTION;
      const userRef = doc(db, collectionName, userId);
      
      await updateDoc(userRef, {
        ...updates,
        lastUpdated: new Date().toISOString()
      });

      // Update local storage
      const localData = await AsyncStorage.getItem('user_data');
      if (localData) {
        const userData = JSON.parse(localData);
        const updatedData = { ...userData, ...updates };
        await AsyncStorage.setItem('user_data', JSON.stringify(updatedData));
      }

      console.log('✅ User data updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update user data:', error);
      throw error;
    }
  }

  // Clear user data
  static async clearUserData() {
    try {
      console.log('🗑️ Clearing user data');
      
      // Clear local storage
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('authToken');
      
      console.log('✅ User data cleared successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
      throw error;
    }
  }

  // Get user by mobile number
  static async getUserByMobile(mobileNumber, userType = 'vehicle_owner') {
    try {
      console.log('🔍 Searching user by mobile:', { mobileNumber, userType });
      
      const collectionName = userType === 'driver' ? this.DRIVERS_COLLECTION : this.VEHICLE_OWNERS_COLLECTION;
      const q = query(
        collection(db, collectionName),
        where('primary_mobile', '==', mobileNumber),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = { id: userDoc.id, ...userDoc.data() };
        console.log('✅ User found by mobile number');
        return { success: true, data: userData };
      } else {
        console.log('⚠️ No user found with this mobile number');
        return { success: false, message: 'User not found' };
      }
    } catch (error) {
      console.error('❌ Failed to search user by mobile:', error);
      throw error;
    }
  }

  // Save authentication token
  static async saveAuthToken(token, userData) {
    try {
      console.log('🔐 Saving authentication token');
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      console.log('✅ Authentication token saved');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save authentication token:', error);
      throw error;
    }
  }

  // Load authentication token
  static async loadAuthToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        console.log('✅ Authentication token loaded');
        return { 
          success: true, 
          token, 
          userData: JSON.parse(userData) 
        };
      } else {
        console.log('⚠️ No authentication token found');
        return { success: false, message: 'No token found' };
      }
    } catch (error) {
      console.error('❌ Failed to load authentication token:', error);
      return { success: false, error: error.message };
    }
  }
}

export default FirebaseUserService;
