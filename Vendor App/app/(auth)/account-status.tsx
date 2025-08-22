import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  AlertTriangle, 
  XCircle, 
  Phone, 
  Mail, 
  ArrowLeft,
  Clock,
  Shield
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface AccountStatusProps {
  status: 'inactive' | 'blocked';
  message?: string;
}

export default function AccountStatusScreen({ status, message }: AccountStatusProps) {
  const handleGoBack = () => {
    router.back();
  };

  const handleContactSupport = () => {
    // Here you can implement phone call or email functionality
    // For now, just show the contact information
  };

  const isInactive = status === 'inactive';
  const isBlocked = status === 'blocked';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isInactive ? ['#F59E0B', '#D97706'] : ['#EF4444', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Status</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Status Icon */}
          <View style={styles.iconContainer}>
            {isInactive ? (
              <Clock size={80} color="#FFFFFF" />
            ) : (
              <XCircle size={80} color="#FFFFFF" />
            )}
          </View>

          {/* Status Title */}
          <Text style={styles.statusTitle}>
            {isInactive ? 'Account Inactive' : 'Account Blocked'}
          </Text>

          {/* Status Message */}
          <Text style={styles.statusMessage}>
            {message || (
              isInactive 
                ? 'Your account is currently inactive and requires verification.'
                : 'Your account has been blocked due to policy violations.'
            )}
          </Text>

          {/* Status Details */}
          <View style={styles.statusCard}>
            {isInactive ? (
              <>
                <View style={styles.detailRow}>
                  <Clock size={20} color="#F59E0B" />
                  <Text style={styles.detailText}>
                    Account will be activated within 24 hours after verification
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Shield size={20} color="#F59E0B" />
                  <Text style={styles.detailText}>
                    Our team is reviewing your documents
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <AlertTriangle size={20} color="#EF4444" />
                  <Text style={styles.detailText}>
                    Your account has been suspended
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Shield size={20} color="#EF4444" />
                  <Text style={styles.detailText}>
                    Contact support for assistance
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Contact Information */}
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Need Help?</Text>
            <Text style={styles.contactSubtitle}>
              Contact our support team for assistance
            </Text>
            
            <View style={styles.contactMethods}>
              <View style={styles.contactMethod}>
                <Phone size={20} color="#3B82F6" />
                <Text style={styles.contactLabel}>Call Support</Text>
                <Text style={styles.contactValue}>+91 98765 43210</Text>
              </View>
              
              <View style={styles.contactMethod}>
                <Mail size={20} color="#3B82F6" />
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@dropcars.com</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleContactSupport}
            >
              <Text style={styles.primaryButtonText}>
                {isInactive ? 'Contact Support' : 'Get Help'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleGoBack}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 30,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusMessage: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
    maxWidth: width * 0.8,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    backdropFilter: 'blur(10px)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
    flex: 1,
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    width: '100%',
    backdropFilter: 'blur(10px)',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  contactMethods: {
    gap: 16,
  },
  contactMethod: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.9,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtons: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
