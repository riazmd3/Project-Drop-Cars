import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.type === 'vendor') {
          router.replace('/(vendor)/(tabs)');
        } else {
          router.replace('/(driver)/(tabs)');
        }
      } else {
        router.replace('/auth');
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
});