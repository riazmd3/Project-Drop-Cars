import React from 'react';
import { SafeAreaView, Platform, StatusBar, StyleSheet, ViewStyle } from 'react-native';

export function SafeArea({ style, children }: { style?: ViewStyle; children: React.ReactNode }) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#F9FAFB',
  },
}); 