import { useEffect } from 'react';
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

  useEffect(() => {
    checkAuthStatus();
    const off = onSessionExpired(async () => {
      try { Alert.alert('Session expired', 'Please login again.'); } catch {}
      try { await SecureStore.deleteItemAsync('authToken'); } catch {}
      try { await SecureStore.deleteItemAsync('userData'); } catch {}
      try { await signout(); } catch {}
      router.replace('/login');
    });
    return off;
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    } catch (error) {
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