import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  Star,
  Calendar,
  Package,
  IndianRupee,
  ChevronRight,
  LogOut,
  Settings,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import { pickImage } from '../../utils/imageUtils';

const { width, height } = Dimensions.get('window');

interface VendorProfile {
  id: string;
  full_name: string;
  primary_number: string;
  secondary_number?: string;
  address: string;
  aadhar_number: string;
  gpay_number: string;
  organization_id?: string;
  aadhar_front_img?: string;
  wallet_balance: number;
  account_status: string;
  created_at: string;
  rating: number;
  total_orders: number;
  total_earnings: number;
  completed_orders: number;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const { getStoredVendorData, signOut } = useVendorAuth();

  // Editable fields
  const [editData, setEditData] = useState({
    full_name: '',
    secondary_number: '',
    address: '',
    gpay_number: '',
  });

  useEffect(() => {
    loadProfile();
    animateScreen();
  }, []);

  const loadProfile = async () => {
    try {
      const storedData = await getStoredVendorData();
      if (storedData) {
        const profileData: VendorProfile = {
          ...storedData,
          rating: 4.8,
          total_orders: 156,
          total_earnings: 45250,
          completed_orders: 142,
        };
        setProfile(profileData);
        setEditData({
          full_name: profileData.full_name,
          secondary_number: profileData.secondary_number || '',
          address: profileData.address,
          gpay_number: profileData.gpay_number,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const animateScreen = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would typically make an API call to update the profile
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      full_name: profile?.full_name || '',
      secondary_number: profile?.secondary_number || '',
      address: profile?.address || '',
      gpay_number: profile?.gpay_number || '',
    });
    setIsEditing(false);
  };

  const handleImagePick = async () => {
    try {
      const image = await pickImage();
      if (image) {
        Alert.alert('Success', 'Profile image updated!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile image');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Inactive': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Profile Image */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Bell size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Settings size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={handleImagePick}>
              {profile.aadhar_front_img ? (
                <Image source={{ uri: profile.aadhar_front_img }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <User size={40} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.full_name}</Text>
              <Text style={styles.profilePhone}>{profile.primary_number}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(profile.account_status) }]} />
                <Text style={styles.statusText}>{profile.account_status}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.editButton}
              onPress={isEditing ? handleSave : handleEdit}
            >
              {isEditing ? (
                <Save size={20} color="#FFFFFF" />
              ) : (
                <Edit3 size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statGradient}
            >
              <Package size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{profile.total_orders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.statGradient}
            >
              <Star size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{profile.completed_orders}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.statGradient}
            >
              <IndianRupee size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>₹{profile.total_earnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statGradient}
            >
              <Star size={24} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.statValue}>{profile.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </LinearGradient>
          </View>
        </ScrollView>
      </View>

      {/* Profile Details */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <User size={20} color="#6B7280" />
              <Text style={styles.fieldLabelText}>Full Name</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editData.full_name}
                onChangeText={(text) => setEditData({ ...editData, full_name: text })}
                placeholder="Enter full name"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.full_name}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <Phone size={20} color="#6B7280" />
              <Text style={styles.fieldLabelText}>Primary Number</Text>
            </View>
            <Text style={styles.fieldValue}>{profile.primary_number}</Text>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <Phone size={20} color="#6B7280" />
              <Text style={styles.fieldLabelText}>Secondary Number</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editData.secondary_number}
                onChangeText={(text) => setEditData({ ...editData, secondary_number: text })}
                placeholder="Enter secondary number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.secondary_number || 'Not provided'}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <MapPin size={20} color="#6B7280" />
              <Text style={styles.fieldLabelText}>Address</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={editData.address}
                onChangeText={(text) => setEditData({ ...editData, address: text })}
                placeholder="Enter address"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.address}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <FileText size={20} color="#6B7280" />
              <Text style={styles.fieldLabelText}>Aadhar Number</Text>
            </View>
            <Text style={styles.fieldValue}>{profile.aadhar_number}</Text>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <CreditCard size={20} color="#6B7280" />
              <Text style={styles.fieldLabelText}>GPay Number</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editData.gpay_number}
                onChangeText={(text) => setEditData({ ...editData, gpay_number: text })}
                placeholder="Enter GPay number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.gpay_number}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <Shield size={20} color="#6B7280" />
              <Text style={styles.fieldLabelText}>Account Status</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(profile.account_status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(profile.account_status) }]}>
                {profile.account_status}
              </Text>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.fieldLabelText}>Member Since</Text>
            </View>
            <Text style={styles.fieldValue}>
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <X size={20} color="#6B7280" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

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
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 4,
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
    color: '#E5E7EB',
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
    color: '#E5E7EB',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 12,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsScroll: {
    alignItems: 'center',
  },
  statCard: {
    width: width * 0.4,
    height: 100,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  statGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  fieldContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  textInput: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
