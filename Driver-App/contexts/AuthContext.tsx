import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name: string;
  primaryMobile: string;
  secondaryMobile?: string;
  paymentMethod?: string;
  paymentNumber?: string;
  password: string;
  address: string;
  aadharNumber: string;
  languages: string[];
  documents: any;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (userData: User, token: string) => {
    try {
      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.deleteItemAsync('userData');
      setUser(userData);
    } catch (error) {
      throw new Error('Failed to save authentication data');
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userData');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
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