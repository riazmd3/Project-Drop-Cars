// React Native Firebase configuration
import { Platform } from 'react-native';

// For React Native, we use @react-native-firebase packages
// The configuration is automatically loaded from google-services.json (Android) and GoogleService-Info.plist (iOS)

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
  // React Native platform - use @react-native-firebase packages
  try {
    const authModule = require('@react-native-firebase/auth').default;
    const firestoreModule = require('@react-native-firebase/firestore').default;
    const storageModule = require('@react-native-firebase/storage').default;
    const analyticsModule = require('@react-native-firebase/analytics').default;

    auth = authModule();
    db = firestoreModule();
    storage = storageModule();
    analytics = analyticsModule();
  } catch (error) {
    console.warn('⚠️ React Native Firebase modules not available, using fallback:', error.message);
    // Fallback to web SDK if React Native Firebase is not properly configured
    const { initializeApp } = require("firebase/app");
    const { getAuth } = require("firebase/auth");
    const { getFirestore } = require("firebase/firestore");
    const { getStorage } = require("firebase/storage");

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
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    analytics = null;
  }
}

export { auth, db, storage, analytics };
export default { auth, db, storage, analytics };
