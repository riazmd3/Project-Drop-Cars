// Simple Firebase configuration without push notifications
import { Platform } from 'react-native';

let auth, db, storage, analytics;

if (Platform.OS === 'web') {
  // Web platform - use Firebase Web SDK
  const { initializeApp } = require("firebase/app");
  const { getAnalytics } = require("firebase/analytics");
  const { getAuth, initializeAuth, getReactNativePersistence } = require("firebase/auth");
  const { getFirestore } = require("firebase/firestore");
  const { getStorage } = require("firebase/storage");
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;

  const firebaseConfig = {
    apiKey: "AIzaSyC9-gqpC4W4wZxVT_p_EEvG324fVCPGAfU",
    authDomain: "drop-cars-697fa.firebaseapp.com",
    projectId: "drop-cars-697fa",
    storageBucket: "drop-cars-697fa.firebasestorage.app",
    messagingSenderId: "74990666899",
    appId: "1:74990666899:web:0afa260818635c9395f966",
    measurementId: "G-16EG0EJVKG"
  };

  const app = initializeApp(firebaseConfig);
  
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    auth = getAuth(app);
  }
  
  db = getFirestore(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
} else {
  // React Native platform - simplified configuration
  console.log('🔥 Using simplified Firebase configuration for React Native');
  
  // For now, we'll use a mock configuration to avoid API key errors
  auth = {
    currentUser: null,
    signInWithEmailAndPassword: () => Promise.resolve({ user: null }),
    createUserWithEmailAndPassword: () => Promise.resolve({ user: null }),
    signOut: () => Promise.resolve(),
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    }
  };
  
  db = {
    collection: (name) => ({
      doc: (id) => ({
        set: () => Promise.resolve(),
        get: () => Promise.resolve({ exists: false }),
        update: () => Promise.resolve(),
        delete: () => Promise.resolve()
      })
    })
  };
  
  storage = {
    ref: () => ({
      put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('') } })
    })
  };
  
  analytics = {
    logEvent: () => {},
    setUserId: () => {},
    setUserProperties: () => {}
  };
}

export { auth, db, storage, analytics };
export default { auth, db, storage, analytics };
