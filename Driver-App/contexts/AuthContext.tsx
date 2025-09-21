import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService, getCompleteUserData } from '@/services/authService';
import FirebaseUserService from '@/services/firebaseService';

interface User {
  id: string;
  fullName: string;
  primaryMobile: string;
  secondaryMobile?: string;
  password: string;
  address: string;
  aadharNumber: string;
  organizationId: string;
  languages: string[];
  documents: any;
  driver_status?: string; // Add driver status for drivers
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadUserDataOnStart();
  }, []);

  const loadUserDataOnStart = async () => {
    try {
      setIsLoading(true);
      
      // First try to load from Firebase/local storage
      const authData = await FirebaseUserService.loadAuthToken();
      if (authData.success) {
        const userData = authData.userData;
        const contextUser: User = {
          id: userData.id,
          fullName: userData.fullName || userData.full_name,
          primaryMobile: userData.primaryMobile || userData.primary_mobile,
          secondaryMobile: userData.secondaryMobile || userData.secondary_mobile,
          password: '',
          address: userData.address,
          aadharNumber: userData.aadharNumber || userData.aadhar_number,
          organizationId: userData.organizationId || userData.organization_id,
          languages: userData.languages || [],
          documents: userData.documents || {},
          driver_status: userData.driver_status
        };
        setUser(contextUser);
        console.log('✅ User data loaded from Firebase/local storage:', contextUser);
        return;
      }

      // Fallback to auth service
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const userData = await getCompleteUserData();
        if (userData) {
          // Convert auth service user data to context user format
          const contextUser: User = {
            id: userData.id,
            fullName: userData.fullName,
            primaryMobile: userData.primaryMobile,
            secondaryMobile: userData.secondaryMobile,
            password: '',
            address: userData.address,
            aadharNumber: userData.aadharNumber,
            organizationId: userData.organizationId,
            languages: userData.languages,
            documents: {}
          };
          setUser(contextUser);
          
          // Save to Firebase for future use
          await FirebaseUserService.saveUserData(contextUser, 'vehicle_owner');
          console.log('✅ User data loaded from auth service and saved to Firebase:', contextUser);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load user data on start:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token: string) => {
    try {
      // Save to SecureStore
      await SecureStore.setItemAsync('authToken', token);
      
      // Save to Firebase and local storage
      await FirebaseUserService.saveAuthToken(token, userData);
      await FirebaseUserService.saveUserData(userData, 'vehicle_owner');
      
      setUser(userData);
      console.log('✅ User logged in successfully and saved to Firebase:', userData);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw new Error('Failed to save authentication data');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      await FirebaseUserService.clearUserData();
      setUser(null);
      console.log('✅ User logged out successfully and cleared Firebase data');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUserData = async () => {
    try {
      const userData = await getCompleteUserData();
      if (userData) {
        const contextUser: User = {
          id: userData.id,
          fullName: userData.fullName,
          primaryMobile: userData.primaryMobile,
          secondaryMobile: userData.secondaryMobile,
          password: '',
          address: userData.address,
          aadharNumber: userData.aadharNumber,
          organizationId: userData.organizationId,
          languages: userData.languages,
          documents: {}
        };
        setUser(contextUser);
        
        // Update Firebase with refreshed data
        await FirebaseUserService.saveUserData(contextUser, 'vehicle_owner');
        console.log('✅ User data refreshed and updated in Firebase:', contextUser);
      }
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser, refreshUserData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}