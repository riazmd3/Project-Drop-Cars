import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Shield,
  ArrowRight,
  RefreshCw
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import axiosDriver from '@/app/api/axiosDriver';
import axiosInstance from '@/app/api/axiosInstance';

interface DriverVerificationPageProps {
  accountStatus?: string;
  onRefresh?: () => void;
  onLogout?: () => void;
  isLoading?: boolean;
}

export default function DriverVerificationPage({ 
  accountStatus: propAccountStatus, 
  onRefresh: propOnRefresh,
  onLogout: propOnLogout,
  isLoading: propIsLoading = false
}: DriverVerificationPageProps) {
  const router = useRouter();
  const [accountStatus, setAccountStatus] = useState(propAccountStatus || 'PROCESSING');
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [rotateAnim] = useState(new Animated.Value(0));

  // Fetch account status if not provided as prop
  useEffect(() => {
    if (!propAccountStatus) {
      fetchAccountStatus();
    }
  }, []);

  // Spin animation for loading state
  useEffect(() => {
    if (isLoading) {
      const spin = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    }
  }, [isLoading]);

  const fetchAccountStatus = async () => {
    try {
      setIsLoading(true);
      const driverLoginStr = await SecureStore.getItemAsync('driverLoginResponse');
      if (driverLoginStr) {
        const driverLogin = JSON.parse(driverLoginStr);
        const status = driverLogin.driver_status || 'PROCESSING';
        setAccountStatus(status);
      }
    } catch (error) {
      console.error('❌ Error fetching driver account status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Refreshing driver account status...');
      
      if (propOnRefresh) {
        propOnRefresh();
      } else {
        try {
          // Get driver user data and stored password to call signin API
          const driverUserStr = await SecureStore.getItemAsync('driverUser');
          const tempPassword = await SecureStore.getItemAsync('driverTempPassword');
          
          if (!driverUserStr) {
            console.warn('⚠️ No driver user data found');
            await fetchAccountStatus();
            return;
          }
          
          const driverUser = JSON.parse(driverUserStr);
          
          // Format mobile number to 10 digits only
          const formatMobileNumber = (phone: string): string => {
            if (!phone || !phone.trim()) return '';
            let cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '').trim();
            if (!cleanPhone) return '';
            return cleanPhone.slice(-10);
          };
          
          const mobileNumber = formatMobileNumber(driverUser.primary_number || '');
          
          if (!mobileNumber || !tempPassword) {
            console.warn('⚠️ Missing mobile number or password');
            Alert.alert('Session Expired', 'Please login again to refresh your account status.');
            await fetchAccountStatus();
            return;
          }
          
          console.log('🔄 Calling driver signin API to get fresh account status...');
          
          // Call driver signin API to get latest status
          // Use axiosInstance for unauthenticated signin requests
          // NOTE: Driver API uses 'primary_number' not 'mobile_number'
          const response = await axiosInstance.post('/api/users/cardriver/signin', {
            primary_number: mobileNumber,
            password: tempPassword
          });
          
          if (response.data && response.data.driver_status) {
            const newStatus = response.data.driver_status;
            setAccountStatus(newStatus);
            
            // Update stored driver login response with fresh data
            await SecureStore.setItemAsync('driverLoginResponse', JSON.stringify(response.data));
            
            // Update driver auth token if provided
            if (response.data.access_token) {
              await SecureStore.setItemAsync('driverAuthToken', response.data.access_token);
            }
            
            console.log('✅ Driver account status updated:', newStatus);
            
            // If status is now ONLINE, redirect to dashboard
            if (newStatus === 'ONLINE') {
              setTimeout(() => {
                router.replace('/quick-dashboard');
              }, 2000);
            }
          }
        } catch (apiError: any) {
          console.warn('⚠️ Could not refresh from API:', apiError);
          console.error('API error details:', {
            message: apiError.message,
            status: apiError.response?.status,
            data: apiError.response?.data
          });
          Alert.alert('Refresh Failed', 'Could not refresh account status. Please try again.');
          // Fallback to local data
          await fetchAccountStatus();
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing driver account status:', error);
      Alert.alert('Error', 'Could not refresh account status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (propOnLogout) {
      propOnLogout();
    } else {
      router.replace('/quick-login');
    }
  };

  const getStatusInfo = () => {
    switch (accountStatus?.toUpperCase()) {
      case 'ONLINE':
        return {
          icon: <CheckCircle color="#10B981" size={64} />,
          title: 'Account Verified!',
          subtitle: 'Your driver account has been successfully verified',
          message: 'Welcome to Drop Cars Driver App! Your documents have been approved and you can now access all features.',
          buttonText: 'Go to Dashboard',
          buttonAction: () => router.replace('/quick-dashboard'),
          backgroundColor: '#F0FDF4',
          borderColor: '#10B981',
          showRefresh: false
        };
      
      case 'PROCESSING':
        return {
          icon: <Clock color="#F59E0B" size={64} />,
          title: 'Account Under Verification',
          subtitle: 'Our team is reviewing your documents',
          message: 'Thank you for submitting your documents. Our verification team is currently reviewing your information. This process usually takes 8-48 hours. You will be notified once verification is complete.',
          buttonText: 'Refresh Status',
          buttonAction: handleRefresh,
          backgroundColor: '#FFFBEB',
          borderColor: '#F59E0B',
          showRefresh: true
        };
      
      case 'PENDING':
        return {
          icon: <FileText color="#3B82F6" size={64} />,
          title: 'Documents Pending',
          subtitle: 'Please complete your profile setup',
          message: 'Your driver account is pending document verification. Please ensure all required documents are uploaded and your profile is complete.',
          buttonText: 'Complete Profile',
          buttonAction: () => router.push('/add-driver?flow=signup'),
          backgroundColor: '#EFF6FF',
          borderColor: '#3B82F6',
          showRefresh: false
        };
      
      case 'OFFLINE':
      case 'REJECTED':
        return {
          icon: <AlertCircle color="#EF4444" size={64} />,
          title: 'Verification Failed',
          subtitle: 'Please review and resubmit your documents',
          message: 'Your driver account verification was unsuccessful. Please review the feedback provided and resubmit your documents. Contact support if you need assistance.',
          buttonText: 'Resubmit Documents',
          buttonAction: () => router.push('/add-driver'),
          backgroundColor: '#FEF2F2',
          borderColor: '#EF4444',
          showRefresh: false
        };
      
      default:
        return {
          icon: <Shield color="#6B7280" size={64} />,
          title: 'Account Status Unknown',
          subtitle: 'Please contact support',
          message: 'We couldn\'t determine your account status. Please contact our support team for assistance.',
          buttonText: 'Contact Support',
          buttonAction: () => router.push('/quick-login'),
          backgroundColor: '#F9FAFB',
          borderColor: '#6B7280',
          showRefresh: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient 
        colors={['#10B981', '#059669']} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Drop Cars</Text>
          <Text style={styles.headerSubtitle}>Driver Account Verification</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, { backgroundColor: statusInfo.backgroundColor, borderColor: statusInfo.borderColor }]}>
          <View style={styles.iconContainer}>
            {statusInfo.icon}
          </View>
          
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{statusInfo.message}</Text>
          </View>

          {statusInfo.showRefresh && (
            <View style={styles.refreshInfo}>
              <RefreshCw color="#F59E0B" size={16} />
              <Text style={styles.refreshText}>
                You can refresh to check if your status has been updated
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: statusInfo.borderColor }]}
            onPress={statusInfo.buttonAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Animated.View style={{
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }],
                  marginRight: 8,
                }}>
                  <RefreshCw color="#FFFFFF" size={20} />
                </Animated.View>
                <Text style={styles.primaryButtonText}>Checking Status...</Text>
              </>
            ) : (
              <>
                <Text style={styles.primaryButtonText}>{statusInfo.buttonText}</Text>
                <ArrowRight color="#FFFFFF" size={20} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {accountStatus?.toUpperCase() === 'PROCESSING' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>Our team reviews your submitted documents</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>Verification typically takes 24-48 hours</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>You'll receive a notification once approved</Text>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoBullet} />
                <Text style={styles.infoText}>After approval, you can start driving</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  statusCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
    textAlign: 'center',
  },
  refreshInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  refreshText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  actionContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: 8,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 20,
    flex: 1,
  },
});

