import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Phone, Chrome as Home, CreditCard as Edit, Shield, CreditCard, Wallet, Settings, LogOut, FileText, ChevronRight } from 'lucide-react-native';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  isDestructive = false 
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemContent}>
      <View style={styles.menuItemIcon}>
        {icon}
      </View>
      <View style={styles.menuItemText}>
        <Text style={[
          styles.menuItemTitle,
          isDestructive && styles.menuItemTitleDestructive
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
    <ChevronRight size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

export default function MenuScreen() {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userSession');
              router.replace('/(auth)/sign-in');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleFeaturePress = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} feature will be available in the next update!`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Menu</Text>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <User size={32} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Vendor Name</Text>
            <Text style={styles.profilePhone}>+91 9876543210</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <MenuItem
            icon={<Home size={20} color="#3B82F6" />}
            title="Home"
            subtitle="Go to dashboard"
            onPress={() => router.push('/(tabs)')}
          />
          
          <MenuItem
            icon={<User size={20} color="#10B981" />}
            title="Profile"
            subtitle="View and edit profile"
            onPress={() => handleFeaturePress('Profile')}
          />
          
          <MenuItem
            icon={<Edit size={20} color="#F59E0B" />}
            title="Update Account"
            subtitle="Update personal information"
            onPress={() => handleFeaturePress('Update Account')}
          />
          
          <MenuItem
            icon={<Shield size={20} color="#8B5CF6" />}
            title="Account Status"
            subtitle="Verification and status"
            onPress={() => handleFeaturePress('Account Status')}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Financial</Text>
          
          <MenuItem
            icon={<CreditCard size={20} color="#EF4444" />}
            title="Bank Balance"
            subtitle="View bank account balance"
            onPress={() => handleFeaturePress('Bank Balance')}
          />
          
          <MenuItem
            icon={<Wallet size={20} color="#06B6D4" />}
            title="Wallet Balance"
            subtitle="Check wallet balance"
            onPress={() => handleFeaturePress('Wallet Balance')}
          />
          
          <MenuItem
            icon={<FileText size={20} color="#84CC16" />}
            title="Bills"
            subtitle="View transaction history"
            onPress={() => handleFeaturePress('Bills')}
          />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <MenuItem
            icon={<Settings size={20} color="#6B7280" />}
            title="Settings"
            subtitle="App preferences"
            onPress={() => handleFeaturePress('Settings')}
          />
          
          <MenuItem
            icon={<LogOut size={20} color="#EF4444" />}
            title="Logout"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            isDestructive
          />
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceSectionTitle}>Quick Balance Overview</Text>
          <View style={styles.balanceCards}>
            <View style={styles.balanceCard}>
              <CreditCard size={24} color="#3B82F6" />
              <Text style={styles.balanceCardTitle}>Bank Account</Text>
              <Text style={styles.balanceCardValue}>₹25,450</Text>
            </View>
            <View style={styles.balanceCard}>
              <Wallet size={24} color="#10B981" />
              <Text style={styles.balanceCardTitle}>Wallet</Text>
              <Text style={styles.balanceCardValue}>₹3,280</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
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
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  menuSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuItemTitleDestructive: {
    color: '#EF4444',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceSection: {
    marginTop: 32,
    marginBottom: 40,
  },
  balanceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    marginLeft: 4,
  },
  balanceCards: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  balanceCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
});