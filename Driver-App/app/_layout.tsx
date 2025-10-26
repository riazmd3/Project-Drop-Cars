import { useEffect } from 'react';
import '@/utils/quietConsole';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CarDriverProvider } from '@/contexts/CarDriverContext';
import { DemoProvider } from '@/contexts/DemoContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
// Initialize notifications on app startup (CRITICAL FIX)
import { setupNotificationListeners } from '@/services/notifications/notificationService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Initialize notification listeners on app startup (CRITICAL FIX)
  useEffect(() => {
    console.log('🚀 APP START: Setting up notification listeners...');
    const listeners = setupNotificationListeners();
    
    // Cleanup listeners on unmount
    return () => {
      if (listeners.receivedListener) {
        listeners.receivedListener.remove();
      }
      if (listeners.responseListener) {
        listeners.responseListener.remove();
      }
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }
//Successfull Preview Build without nativ directory(done in cloud expo)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <DemoProvider>
          <AuthProvider>
            <WalletProvider>
              <DashboardProvider>
                <NotificationProvider>
                  <CarDriverProvider>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="quick-login" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="car-driver" />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                  </CarDriverProvider>
                </NotificationProvider>
              </DashboardProvider>
            </WalletProvider>
          </AuthProvider>
        </DemoProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}