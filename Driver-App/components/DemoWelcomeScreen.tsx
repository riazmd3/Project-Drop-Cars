import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { 
  Play, 
  X, 
  Bell, 
  Menu, 
  Settings,
  ArrowRight,
  CheckCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import * as SecureStore from 'expo-secure-store';

interface DemoWelcomeScreenProps {
  isVisible: boolean;
  onStartDemo: () => void;
  onSkip: () => void;
}

const { width, height } = Dimensions.get('window');

export default function DemoWelcomeScreen({ isVisible, onStartDemo, onSkip }: DemoWelcomeScreenProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF', '#1E3A8A']}
          style={styles.header}
        >
          <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
            <X color="#FFFFFF" size={24} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🎭</Text>
            <Text style={styles.appName}>Drop Cars</Text>
            <Text style={styles.tagline}>Driver App</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.welcomeTitle}>Welcome to Drop Cars!</Text>
          <Text style={styles.welcomeSubtitle}>
            Let me show you around the app and demonstrate all the amazing features available to you.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Bell color="#3B82F6" size={24} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Smart Notifications</Text>
                <Text style={styles.featureDescription}>
                  Get real-time updates about bookings, payments, and important alerts
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Menu color="#10B981" size={24} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Easy Navigation</Text>
                <Text style={styles.featureDescription}>
                  Intuitive menu system to access all your driver tools and information
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Settings color="#F59E0B" size={24} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Customizable Settings</Text>
                <Text style={styles.featureDescription}>
                  Personalize your experience with flexible settings and preferences
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.demoInfo}>
            <View style={styles.demoInfoHeader}>
              <CheckCircle color="#10B981" size={20} />
              <Text style={styles.demoInfoTitle}>Interactive Demo</Text>
            </View>
            <Text style={styles.demoInfoText}>
              This demo will show you exactly how each feature works. You can interact with everything and see the app in action!
            </Text>
          </View>

          {/* Terms and Conditions Checkbox */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              {termsAccepted ? (
                <CheckCircle color="#10B981" size={20} fill="#10B981" />
              ) : (
                <View style={styles.checkboxEmpty} />
              )}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={() => {/* Open terms */}}>
                Terms & Conditions
              </Text>
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.startButton, 
                !termsAccepted && styles.startButtonDisabled
              ]}
              onPress={onStartDemo}
              disabled={!termsAccepted}
            >
              <Play color="#FFFFFF" size={20} />
              <Text style={styles.startButtonText}>Start Interactive Demo</Text>
              <ArrowRight color="#FFFFFF" size={20} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.skipButtonSecondary}
              onPress={onSkip}
            >
              <Text style={styles.skipButtonText}>Skip Demo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  content: {
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  demoInfo: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 24,
  },
  demoInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  demoInfoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxEmpty: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  termsText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  termsLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButtonSecondary: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
