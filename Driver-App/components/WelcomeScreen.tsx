import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Car, 
  MapPin, 
  Star, 
  ArrowRight, 
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.8);

  const welcomeSteps = [
    {
      icon: <CheckCircle size={80} color="#10B981" />,
      title: `Welcome to Drop Cars, ${user?.fullName || 'Driver'}!`,
      subtitle: "Your Professional Journey Starts Here",
      description: "Drop Cars is India's premier vehicle rental platform connecting vehicle owners with customers. Start earning by providing reliable transportation services.",
      color: ['#10B981', '#059669']
    },
    {
      icon: <Car size={80} color="#3B82F6" />,
      title: "Step 1: Accept Bookings",
      subtitle: "View & Accept Available Orders",
      description: "Browse pending bookings on your dashboard. Each booking shows pickup/drop locations, customer details, and fare. Accept orders that match your schedule and route.",
      color: ['#3B82F6', '#1E40AF']
    },
    {
      icon: <MapPin size={80} color="#8B5CF6" />,
      title: "Step 2: Assign Driver & Vehicle",
      subtitle: "Match Orders with Your Resources",
      description: "After accepting an order, assign one of your registered drivers and vehicles. Ensure your driver is available and vehicle is ready for the trip.",
      color: ['#8B5CF6', '#7C3AED']
    },
    {
      icon: <Clock size={80} color="#F59E0B" />,
      title: "Step 3: Track Trip Progress",
      subtitle: "Monitor Real-time Trip Status",
      description: "Your assigned driver can start/end trips with odometer readings. Track trip progress, distance covered, and fare calculation in real-time.",
      color: ['#F59E0B', '#D97706']
    },
    {
      icon: <TrendingUp size={80} color="#EF4444" />,
      title: "Step 4: Earn & Grow",
      subtitle: "Maximize Your Revenue",
      description: "Earn from every completed trip. Build your reputation with quality service. Access detailed analytics and expand your fleet to increase earnings.",
      color: ['#EF4444', '#DC2626']
    }
  ];

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const nextStep = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipWelcome = () => {
    onComplete();
  };

  const currentStepData = welcomeSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={currentStepData.color as [string, string]} 
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={skipWelcome} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            {welcomeSteps.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.progressDot, 
                  index === currentStep && styles.progressDotActive
                ]} 
              />
            ))}
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            {currentStepData.icon}
          </Animated.View>

          <Animated.View 
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
            <Text style={styles.description}>{currentStepData.description}</Text>
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.nextButton} 
            onPress={nextStep}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === welcomeSteps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              {currentStep + 1} of {welcomeSteps.length}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});
