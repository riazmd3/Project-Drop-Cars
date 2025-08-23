import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService, getCompleteUserData } from '@/services/authService';

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
    console.log('🚀 AuthContext: Starting to load user data...');
    loadUserDataOnStart();
  }, []);

  const loadUserDataOnStart = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 AuthContext: Checking authentication...');
      const isAuth = await authService.isAuthenticated();
      console.log('🔐 AuthContext: Is authenticated:', isAuth);
      
      if (isAuth) {
        console.log('👤 AuthContext: User is authenticated, fetching user data...');
        const userData = await getCompleteUserData();
        console.log('📊 AuthContext: User data received:', userData);
        
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
          console.log('✅ AuthContext: User data loaded from auth service:', contextUser);
        } else {
          console.log('⚠️ AuthContext: No user data received from auth service');
        }
      } else {
        console.log('⚠️ AuthContext: User is not authenticated');
      }
    } catch (error) {
      console.error('❌ AuthContext: Failed to load user data on start:', error);
    } finally {
      setIsLoading(false);
      console.log('🏁 AuthContext: Finished loading user data');
    }
  };

  const login = async (userData: User, token: string) => {
    try {
      await SecureStore.setItemAsync('authToken', token);
      setUser(userData);
      console.log('✅ User logged in successfully:', userData);
    } catch (error) {
      throw new Error('Failed to save authentication data');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      console.log('✅ User logged out successfully');
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
        console.log('✅ User data refreshed:', contextUser);
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