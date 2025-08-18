import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  LogOut,
  Star,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  HelpCircle,
  Info,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface VendorProfile {
  id: string;
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  address: string;
  gpay_number: string;
  organization_id?: string;
  account_status: string;
  wallet_balance: number;
  total_orders: number;
  completed_orders: number;
  rating: number;
  created_at: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<VendorProfile>>({});
  const { getStoredVendorData, signOut } = useVendorAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedData = await getStoredVendorData();
      if (storedData) {
        const profileData: VendorProfile = {
          id: storedData.id,
          full_name: storedData.full_name,
          primary_number: storedData.primary_number,
          secondary_number: storedData.secondary_number,
          address: storedData.address,
          gpay_number: storedData.gpay_number,
          organization_id: storedData.organization_id,
          account_status: storedData.account_status,
          wallet_balance: storedData.wallet_balance || 0,
          total_orders: 45, // Mock data
          completed_orders: 38, // Mock data
          rating: 4.8, // Mock data
          created_at: storedData.created_at,
        };
        setProfile(profileData);
        setEditData(profileData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would implement the API call to update the profile
    setProfile(prev => ({ ...prev, ...editData } as VendorProfile));
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditData(profile || {});
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof VendorProfile, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleImagePick = () => {
    // Here you would implement image picking functionality
    Alert.alert('Image Picker', 'Image picker functionality would be implemented here');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: signOut },
      ]
    );
  };

  if (!profile) {
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
          <View style={styles.profileImageSection}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePick}>
              <View style={styles.profileImage}>
                <User size={40} color="#FFFFFF" />
              </View>
              <View style={styles.cameraIcon}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {isEditing ? editData.full_name : profile.full_name}
              </Text>
              <Text style={styles.profilePhone}>{profile.primary_number}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: profile.account_status === 'Active' ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.statusText}>
                  {profile.account_status === 'Active' ? 'Account Active' : 'Pending Verification'}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Edit3 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Package size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{profile.total_orders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Star size={24} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{profile.completed_orders}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <DollarSign size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>₹{profile.wallet_balance}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <TrendingUp size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{profile.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Profile Sections */}
        <View style={styles.sectionsContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            
            <View style={styles.sectionContent}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.inputField}
                    value={editData.full_name}
                    onChangeText={(value) => handleInputChange('full_name', value)}
                    placeholder="Enter full name"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.full_name}</Text>
                )}
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Primary Number</Text>
                <Text style={styles.fieldValue}>{profile.primary_number}</Text>
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Secondary Number</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.inputField}
                    value={editData.secondary_number}
                    onChangeText={(value) => handleInputChange('secondary_number', value)}
                    placeholder="Enter secondary number"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.secondary_number || 'Not provided'}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Account Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Account Information</Text>
            </View>
            
            <View style={styles.sectionContent}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Address</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.inputField}
                    value={editData.address}
                    onChangeText={(value) => handleInputChange('address', value)}
                    placeholder="Enter address"
                    multiline
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.address}</Text>
                )}
              </View>
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>GPay Number</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.inputField}
                    value={editData.gpay_number}
                    onChangeText={(value) => handleInputChange('gpay_number', value)}
                    placeholder="Enter GPay number"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.gpay_number}</Text>
                )}
              </View>
              
              {profile.organization_id && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Organization ID</Text>
                  <Text style={styles.fieldValue}>{profile.organization_id}</Text>
                </View>
              )}
              
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Member Since</Text>
                <Text style={styles.fieldValue}>
                  {new Date(profile.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Settings size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Calendar size={20} color="#3B82F6" />
                <Text style={styles.actionText}>View Schedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={styles.actionText}>Analytics</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <HelpCircle size={20} color="#F59E0B" />
                <Text style={styles.actionText}>Support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Info size={20} color="#8B5CF6" />
                <Text style={styles.actionText}>About</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit Actions */}
          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <X size={20} color="#6B7280" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
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
  },
  profileImageSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 16,
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
    fontSize: 14,
    color: '#E2E8F0',
  },
  editButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginTop: -20,
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionsContainer: {
    gap: 24,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  sectionContent: {
    padding: 20,
    gap: 16,
  },
  fieldRow: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  fieldValue: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  inputField: {
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  quickActions: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: (width - 64) / 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
