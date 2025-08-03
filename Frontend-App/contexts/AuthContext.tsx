import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy users for demonstration
const dummyUsers: User[] = [
  {
    id: '1',
    phone: '9876543210',
    name: 'John Vendor',
    type: 'vendor',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    phone: '9876543211',
    name: 'Mike Driver',
    type: 'driver',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, mpin: string, userType: 'vendor' | 'driver'): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Allow 0000 MPIN for testing
      if (mpin === '0000') {
        const testUser: User = {
          id: Math.random().toString(),
          phone,
          name: userType === 'vendor' ? 'Test Vendor' : 'Test Driver',
          type: userType,
          isVerified: true,
          createdAt: new Date().toISOString()
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(testUser));
        setUser(testUser);
        return true;
      }

      // Find user in dummy data
      const foundUser = dummyUsers.find(u => u.phone === phone && u.type === userType);
      if (foundUser && mpin === '1234') {
        await AsyncStorage.setItem('user', JSON.stringify(foundUser));
        setUser(foundUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (phone: string, name: string, mpin: string, userType: 'vendor' | 'driver'): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const newUser: User = {
        id: Math.random().toString(),
        phone,
        name,
        type: userType,
        isVerified: true,
        createdAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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