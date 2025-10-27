import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { 
  Play, 
  Bell, 
  Menu, 
  Settings,
  ArrowRight,
  CheckCircle
} from 'lucide-react-native';

import * as SecureStore from 'expo-secure-store';

interface DemoWelcomeScreenProps {
  isVisible: boolean;
  onStartDemo: () => void;
  onSkip: () => void;
}

export default function DemoWelcomeScreen({ isVisible, onStartDemo, onSkip }: DemoWelcomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🎭</Text>
            <Text style={styles.appName}>Drop Cars</Text>
            <Text style={styles.tagline}>Driver App</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <>
              <Text style={styles.welcomeTitle}>Welcome to Drop Cars!</Text>
              <Text style={styles.welcomeSubtitle}>
                Your complete driver management solution. Manage bookings, track earnings, and stay connected with customers.
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
              </View>
            </>
          )}

          {/* Step 2: Features */}
          {currentStep === 2 && (
            <>
              <Text style={styles.welcomeTitle}>Powerful Features</Text>
              <Text style={styles.welcomeSubtitle}>
                Everything you need to manage your driver operations efficiently.
              </Text>

              <View style={styles.featuresList}>
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
            </>
          )}

          {/* Step 3: Terms & Conditions */}
          {currentStep === 3 && (
            <>
              <Text style={styles.welcomeTitle}>Terms & Conditions</Text>
              <Text style={styles.welcomeSubtitle}>
                Please read and accept our terms and conditions to continue.
              </Text>

              <View style={styles.termsFullContainer}>
                <ScrollView style={styles.termsScrollView}>
                  <Text style={styles.termsContent}>
                    By using Drop Cars Driver App, you agree to:{'\n\n'}
                    • Maintain vehicle safety and compliance{'\n'}
                    • Follow all traffic and local regulations{'\n'}
                    • Provide accurate trip information{'\n'}
                    • Treat customers with respect and professionalism{'\n'}
                    • Report any issues promptly{'\n'}
                    • Keep your account information secure{'\n\n'}
                    Drop Cars is committed to providing a safe and reliable platform for drivers and customers alike.
                  </Text>
                </ScrollView>

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
                    <Text style={styles.termsLink}>
                      Terms & Conditions
                    </Text>
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep < totalSteps ? (
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={() => setCurrentStep(currentStep + 1)}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <ArrowRight color="#FFFFFF" size={20} />
              </TouchableOpacity>
            ) : (
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
            )}
          </View>

          {/* Step Indicators */}
          <View style={styles.stepIndicators}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  currentStep === index + 1 && styles.stepDotActive
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F9FAFB',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
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
  termsFullContainer: {
    flex: 1,
    marginBottom: 20,
  },
  termsScrollView: {
    maxHeight: 150,
    marginBottom: 16,
  },
  termsContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
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
    marginBottom: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
});
