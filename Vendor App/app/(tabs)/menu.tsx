import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import {
  User,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  Bell,
  Shield,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  CreditCard,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface VendorData {
  id: string;
  full_name: string;
  primary_number: string;
  account_status: string;
}

export default function MenuScreen() {
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const { getStoredVendorData, signOut } = useVendorAuth();

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      const storedData = await getStoredVendorData();
      if (storedData) {
        setVendorData({
          id: storedData.id,
          full_name: storedData.full_name,
          primary_number: storedData.primary_number,
          account_status: storedData.account_status,
        });
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  };

  const handleLogout = () => {
    signOut();
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'View and edit your profile',
      icon: User,
      iconColor: '#3B82F6',
      action: () => console.log('Navigate to Profile'),
    },
    {
      id: 'orders',
      title: 'Orders',
      subtitle: 'Manage your deliveries',
      icon: Package,
      iconColor: '#10B981',
      action: () => console.log('Navigate to Orders'),
    },
    {
      id: 'earnings',
      title: 'Earnings',
      subtitle: 'Track your income',
      icon: DollarSign,
      iconColor: '#F59E0B',
      action: () => console.log('Navigate to Earnings'),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'View performance insights',
      icon: TrendingUp,
      iconColor: '#8B5CF6',
      action: () => console.log('Navigate to Analytics'),
    },
    {
      id: 'schedule',
      title: 'Schedule',
      subtitle: 'Manage your availability',
      icon: Calendar,
      iconColor: '#06B6D4',
      action: () => console.log('Navigate to Schedule'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences',
      icon: Settings,
      iconColor: '#6B7280',
      action: () => console.log('Navigate to Settings'),
    },
    {
      id: 'support',
      title: 'Support',
      subtitle: 'Get help and contact us',
      icon: HelpCircle,
      iconColor: '#EF4444',
      action: () => console.log('Navigate to Support'),
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App information',
      icon: Info,
      iconColor: '#8B5CF6',
      action: () => console.log('Navigate to About'),
    },
  ];

  if (!vendorData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1E293B', '#334155']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileSection}>
            <View style={styles.profileImage}>
              <Shield size={40} color="#FFFFFF" />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{vendorData.full_name}</Text>
              <Text style={styles.profilePhone}>{vendorData.primary_number}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: vendorData.account_status === 'Active' ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.statusText}>
                  {vendorData.account_status === 'Active' ? 'Account Active' : 'Pending Verification'}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Main Menu</Text>
          
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.iconColor}20` }]}>
                  <item.icon size={24} color={item.iconColor} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact & Support</Text>
          
          <View style={styles.contactCard}>
            <TouchableOpacity style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Phone size={20} color="#3B82F6" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Call Support</Text>
                <Text style={styles.contactValue}>+91 98765 43210</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Mail size={20} color="#10B981" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@dropcars.com</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Globe size={20} color="#F59E0B" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>www.dropcars.com</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.appSection}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.appCard}>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>Drop Cars Vendor</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appDescription}>
                Professional delivery management app for vendors
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactSection: {
    marginBottom: 32,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appSection: {
    marginBottom: 32,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 40,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});