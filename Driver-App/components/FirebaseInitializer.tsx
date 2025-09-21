import React, { useEffect, useState } from 'react';
import app from '../firebase-simple';

interface FirebaseInitializerProps {
  children: React.ReactNode;
}

export default function FirebaseInitializer({ children }: FirebaseInitializerProps) {
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        console.log('🔥 Initializing Firebase...');
        
        // Check if Firebase app is initialized
        if (app) {
          console.log('✅ Firebase initialized successfully');
        } else {
          console.warn('⚠️ Firebase app not initialized');
        }
      } catch (error: any) {
        console.error('❌ Firebase initialization failed:', error);
        // Still allow app to continue even if Firebase fails
      }
    };

    initializeFirebase();
  }, []);

  // Always render children, even if Firebase fails
  return <>{children}</>;
}
