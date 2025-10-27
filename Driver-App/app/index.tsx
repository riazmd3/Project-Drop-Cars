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
  const [sessionExpiredCleared, setSessionExpiredCleared] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    const off = onSessionExpired(async () => {
      try { Alert.alert('Session expired', 'Please login again.'); } catch {}
      
      // Mark that session was expired - this will prevent auto-login
      setSessionExpiredCleared(true);
      
      // Clear data based on current role
      if (userRole === 'owner') {
        try { 
          await SecureStore.deleteItemAsync('authToken'); 
          await SecureStore.deleteItemAsync('userData');
          await SecureStore.deleteItemAsync('loginResponse');
          await SecureStore.deleteItemAsync('ownerLastLogin');
        } catch {}
      } else if (userRole === 'driver') {
        try { 
          await signout(); 
          await SecureStore.deleteItemAsync('driverAuthToken');
          await SecureStore.deleteItemAsync('driverAuthInfo');
          await SecureStore.deleteItemAsync('driverLastLogin');
        } catch {}
      }
      
      setUserRole(null);
      router.replace('/login');
    });
    return off;
  }, []);

  const checkAuthStatus = async () => {
    try {
      // If session was explicitly expired, don't auto-login
      if (sessionExpiredCleared) {
        console.log('🛑 Session was expired, skipping auto-login');
        return;
      }
      
      // Check for Vehicle Owner authentication
      const voToken = await SecureStore.getItemAsync('authToken');
      const voUserData = await SecureStore.getItemAsync('userData');
      const voLastLogin = await SecureStore.getItemAsync('ownerLastLogin'); // Timestamp
      
      // Check for Quick Driver authentication
      const driverToken = await SecureStore.getItemAsync('driverAuthToken');
      const driverUserData = await SecureStore.getItemAsync('driverAuthInfo');
      const driverLastLogin = await SecureStore.getItemAsync('driverLastLogin'); // Timestamp
      
      console.log('🔍 Auth check:', {
        hasVOToken: !!voToken,
        hasVOUserData: !!voUserData,
        voLastLogin,
        hasDriverToken: !!driverToken,
        hasDriverUserData: !!driverUserData,
        driverLastLogin
      });
      
      // Determine which user logged in most recently
      const hasOwnerAuth = voToken && voUserData;
      const hasDriverAuth = driverToken && driverUserData;
      
      if (hasOwnerAuth && hasDriverAuth) {
        // Both tokens exist - check who logged in last
        const ownerTime = voLastLogin ? parseInt(voLastLogin) : 0;
        const driverTime = driverLastLogin ? parseInt(driverLastLogin) : 0;
        
        console.log('⚠️ Both auths exist, comparing timestamps:', {
          ownerTime,
          driverTime
        });
        
        if (driverTime > ownerTime) {
          // Driver logged in more recently
          console.log('✅ Driver logged in more recently, prioritizing driver');
          setUserRole('driver');
          const driverInfo = JSON.parse(driverUserData);
          setUser(driverInfo);
          router.replace('/quick-dashboard');
          return;
        } else {
          // Owner logged in more recently or equal
          console.log('✅ Vehicle Owner logged in more recently, prioritizing owner');
        }
      }
      
      // Check authentication based on current context
      // If both exist and owner is more recent, use owner
      if (hasOwnerAuth) {
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