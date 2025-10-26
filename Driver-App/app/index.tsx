import { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { onSessionExpired } from '@/utils/session';
import { useCarDriver } from '@/contexts/CarDriverContext';

export default function IndexScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { signout } = useCarDriver();
  const [userRole, setUserRole] = useState<'owner' | 'driver' | null>(null);

  useEffect(() => {
    checkAuthStatus();
    const off = onSessionExpired(async () => {
      try { Alert.alert('Session expired', 'Please login again.'); } catch {}
      
      // Clear data based on current role
      if (userRole === 'owner') {
        try { await SecureStore.deleteItemAsync('authToken'); } catch {}
        try { await SecureStore.deleteItemAsync('userData'); } catch {}
      } else if (userRole === 'driver') {
        try { await signout(); } catch {}
      }
      
      setUserRole(null);
      router.replace('/login');
    });
    return off;
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for Vehicle Owner authentication
      const voToken = await SecureStore.getItemAsync('authToken');
      const voUserData = await SecureStore.getItemAsync('userData');
      
      // Check for Quick Driver authentication
      const driverToken = await SecureStore.getItemAsync('driverAuthToken');
      const driverUserData = await SecureStore.getItemAsync('driverAuthInfo');
      
      console.log('🔍 Auth check:', {
        hasVOToken: !!voToken,
        hasVOUserData: !!voUserData,
        hasDriverToken: !!driverToken,
        hasDriverUserData: !!driverUserData
      });
      
      // Check authentication based on current context
      // Prioritize vehicle owner authentication first
      if (voToken && voUserData) {
        // Vehicle Owner logged in - prioritize vehicle owner authentication
        console.log('✅ Vehicle Owner authentication found');
        setUserRole('owner');
        setUser(JSON.parse(voUserData));
        
        // Fetch login response to get car/driver counts and account status
        try {
          const loginDataStr = await SecureStore.getItemAsync('loginResponse');
          if (loginDataStr) {
            const loginData = JSON.parse(loginDataStr);
            const carCount = loginData.car_details_count ?? 0;
            const driverCount = loginData.car_driver_count ?? 0;
            const accountStatus = loginData.account_status || 'Inactive';
            
            console.log('📊 Account status:', {
              carCount,
              driverCount,
              accountStatus
            });
            
            // Determine where to redirect based on counts and status
            // PRIORITY: Check document completion FIRST, then account status
            if (carCount === 0) {
              console.log('🚗 No cars → redirect to add-car');
              router.replace('/add-car?flow=signup');
            } else if (driverCount === 0) {
              console.log('👤 No drivers → redirect to add-driver');
              router.replace('/add-driver?flow=signup');
            } else if (accountStatus === 'Inactive' || accountStatus?.toLowerCase() !== 'active') {
              console.log('⏳ Documents complete but account not active → redirect to verification');
              router.replace('/verification');
            } else {
              console.log('✅ All good → redirect to dashboard');
              router.replace('/(tabs)');
            }
          } else {
            // No login response data, default to dashboard
            console.log('ℹ️ No login response data, defaulting to dashboard');
            router.replace('/(tabs)');
          }
        } catch (error) {
          console.error('❌ Error checking login data:', error);
          router.replace('/(tabs)');
        }
      } else if (driverToken && driverUserData) {
        // Driver logged in - only if no vehicle owner auth
        console.log('✅ Driver authentication found');
        setUserRole('driver');
        const driverInfo = JSON.parse(driverUserData);
        setUser(driverInfo);
        router.replace('/quick-dashboard');
      } else {
        // No authentication found
        console.log('❌ No authentication found');
        setUserRole(null);
        router.replace('/login');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUserRole(null);
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      {/* Loading screen - could add a logo/spinner here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
  },
});