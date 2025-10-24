import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Shield,
  ArrowRight,
  RefreshCw,
  ArrowLeft
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function VerificationScreen() {
  const router = useRouter();
  const { user, refreshUserData } = useAuth();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const accountStatus = user?.account_status || 'pending';

  // Auto-redirect when account becomes ACTIVE
  useEffect(() => {
    if (accountStatus?.toLowerCase() === 'active') {
      console.log('✅ Account is ACTIVE - redirecting to dashboard');
      router.replace('/(tabs)');
    }
  }, [accountStatus, router]);
  
  // Debug logging
  console.log('🔍 Verification page - Account status:', accountStatus);
  console.log('🔍 Verification page - User data:', user);

  const handleRefresh = async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing user data...');
      await refreshUserData();
      console.log('✅ User data refreshed successfully');
      
      // Check if status changed after refresh
      const updatedStatus = user?.account_status;
      console.log('📊 Updated account status:', updatedStatus);
      
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      // You could add a toast notification here if needed
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    try {
      console.log('🔙 Going back...');
      router.back();
    } catch (error) {
      console.log('⚠️ Back navigation failed, redirecting to login');
      router.replace('/login');
    }
  };

  const getStatusInfo = () => {
    switch (accountStatus?.toLowerCase()) {
      case 'active':
        return {
          icon: <CheckCircle color="#10B981" size={64} />,
          title: 'Account Verified!',
          subtitle: 'Your account has been successfully verified',
          message: 'Welcome to Drop Cars! Your documents have been approved and you can now access all features.',
          buttonText: 'Go to Dashboard',
          buttonAction: () => router.replace('/(tabs)'),
          backgroundColor: '#F0FDF4',
          borderColor: '#10B981',
          showRefresh: false
        };
      case 'pending':
      case 'under_review':
        return {
          icon: <Clock color="#F59E0B" size={64} />,
          title: 'Under Review',
          subtitle: 'Your documents are being verified',
          message: 'We are currently reviewing your submitted documents. This process usually takes 24-48 hours. You will be notified once the verification is complete. Pull down to refresh status.',
          buttonText: 'Refresh Status',
          buttonAction: handleRefresh,
          backgroundColor: '#FFFBEB',
          borderColor: '#F59E0B',
          showRefresh: false
        };
      case 'rejected':
        return {
          icon: <AlertCircle color="#EF4444" size={64} />,
          title: 'Verification Failed',
          subtitle: 'Your documents need to be resubmitted',
          message: 'Unfortunately, your documents could not be verified. Please check the requirements and resubmit your documents.',
          buttonText: 'Resubmit Documents',
          buttonAction: () => router.replace('/signup'),
          backgroundColor: '#FEF2F2',
          borderColor: '#EF4444',
          showRefresh: false
        };
      default:
        return {
          icon: <FileText color="#6B7280" size={64} />,
          title: 'Verification Required',
          subtitle: 'Your account is being processed',
          message: 'Your account is currently being processed. Please wait while we verify your information. Pull down to refresh status.',
          buttonText: 'Refresh Status',
          buttonAction: handleRefresh,
          backgroundColor: '#F9FAFB',
          borderColor: '#6B7280',
          showRefresh: false
        };
    }
  };

  const statusInfo = getStatusInfo();

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    refreshButton: {
      padding: 8,
      marginLeft: 12,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    statusCard: {
      backgroundColor: statusInfo.backgroundColor,
      borderRadius: 16,
      padding: 24,
      marginVertical: 20,
      borderWidth: 2,
      borderColor: statusInfo.borderColor,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    message: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    actionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginRight: 8,
    },
    infoSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginTop: 20,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoIcon: {
      marginRight: 12,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity onPress={handleBack} style={dynamicStyles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Account Verification</Text>
        <TouchableOpacity 
          onPress={handleRefresh} 
          style={dynamicStyles.refreshButton}
          disabled={refreshing}
        >
          <RefreshCw 
            color={colors.text} 
            size={24} 
            style={refreshing ? { transform: [{ rotate: '180deg' }] } : {}}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={dynamicStyles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={dynamicStyles.statusCard}>
          <View style={dynamicStyles.iconContainer}>
            {statusInfo.icon}
          </View>
          
          <Text style={dynamicStyles.title}>{statusInfo.title}</Text>
          <Text style={dynamicStyles.subtitle}>{statusInfo.subtitle}</Text>
          <Text style={dynamicStyles.message}>{statusInfo.message}</Text>
          
          <TouchableOpacity 
            style={[dynamicStyles.actionButton, (isLoading || refreshing) && { opacity: 0.6 }]}
            onPress={statusInfo.buttonAction}
            disabled={isLoading || refreshing}
          >
            <Text style={dynamicStyles.actionButtonText}>{statusInfo.buttonText}</Text>
            {isLoading || refreshing ? (
              <RefreshCw color="#FFFFFF" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowRight color="#FFFFFF" size={20} />
            )}
          </TouchableOpacity>
        </View>

        <View style={dynamicStyles.infoSection}>
          <Text style={dynamicStyles.infoTitle}>What happens next?</Text>
          
          <View style={dynamicStyles.infoItem}>
            <FileText color={colors.textSecondary} size={20} style={dynamicStyles.infoIcon} />
            <Text style={dynamicStyles.infoText}>
              We review your submitted documents and information
            </Text>
          </View>
          
          <View style={dynamicStyles.infoItem}>
            <Shield color={colors.textSecondary} size={20} style={dynamicStyles.infoIcon} />
            <Text style={dynamicStyles.infoText}>
              Our team verifies your identity and credentials
            </Text>
          </View>
          
          <View style={dynamicStyles.infoItem}>
            <CheckCircle color={colors.textSecondary} size={20} style={dynamicStyles.infoIcon} />
            <Text style={dynamicStyles.infoText}>
              You'll receive a notification once verification is complete
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
