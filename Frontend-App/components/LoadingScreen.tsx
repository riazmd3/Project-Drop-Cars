import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Car } from 'lucide-react-native';

export function LoadingScreen() {
  return (
    <LinearGradient
      colors={['#3B82F6', '#1E40AF']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Car color="#FFFFFF" size={64} strokeWidth={2} />
        <Text style={styles.title}>Drop Cars</Text>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    marginTop: 8,
  },
});