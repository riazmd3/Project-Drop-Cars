import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { Moon, Sun, LogOut, ChevronRight, User, Bell, Shield, Car, Users, X, Phone, Mail, Globe, CheckCircle, XCircle, Circle } from 'lucide-react-native';
import {
  testForegroundNotification,
  verifyCustomSoundSetup,
  CUSTOM_SOUND_EXPECTED,
} from '@/services/notifications/notificationService';

const { height: screenHeight } = Dimensions.get('window');

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { notificationsEnabled, toggleNotifications } = useNotifications();
  const { dashboardData, loading } = useDashboard();
  const router = useRouter();
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Custom sound checklist: manual checkboxes (key = item id)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    app_json_sounds: false,
    app_json_channel: false,
    asset_exists: false,
    android_channel: false,
    push_payload: false,
    dev_build: false,
    test_played: false,
  });
  const [verifyResult, setVerifyResult] = useState<{
    channelExists: boolean;
    channelHasCustomSound: boolean;
    message: string;
  } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const runVerification = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyCustomSoundSetup();
      setVerifyResult({
        channelExists: result.channelExists,
        channelHasCustomSound: result.channelHasCustomSound,
        message: result.message,
      });
      setChecklist((prev) => ({
        ...prev,
        android_channel: result.channelExists && result.channelHasCustomSound,
      }));
    } catch (e) {
      setVerifyResult({
        channelExists: false,
        channelHasCustomSound: false,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setVerifying(false);
    }
  };

  const allChecked = Object.values(checklist).every(Boolean);

  // Support contact functions
  const handleCallSupport = () => {
    const phoneNumber = '+917200217986';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmailSupport = () => {
    const email = 'dropcars.in@gmail.com';
    const subject = 'Support Request - Drop Cars Driver App';
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`);
  };

  const handleOpenWebsite = () => {
    const website = 'https://www.dropcars.in';
    Linking.openURL(website);
  };

  const termsAndConditions = `DROP CARS – DRIVER PARTNER APP
TERMS & CONDITIONS

By joining and using the Drop Cars Driver Partner App, the driver agrees to the following terms.

1. Registration & Eligibility

Drivers must pay a ₹1000 yearly attachment fee to join the Drop Cars platform.

Drivers must upload valid documents:

Driving Licence

RC Front & Back

Insurance

Fitness Certificate

Vehicle Permit

Clear Car Photo

Any fake, edited, or invalid documents will result in account suspension.

2. Wallet Rules

Drivers must maintain a wallet balance to accept trips.

The wallet is used to deduct:

10% commission (from KM fare only)

Extra charges applied by vendor

Applicable penalties

Drivers must add money via UPI before accepting any trip.

3. Debit Logic (Very Important)

3.1 Commission
10% commission is charged only on the KM fare.
Example: If KM fare = ₹13 → Commission = ₹1.30/km.

3.2 Extras – Full Debit
Any value entered by the vendor in the “Extra” fields is fully deducted from the driver wallet:

Extra Cost Per KM

Extra Driver Allowance

Extra Hill Charge

Extra Permit Charge

3.3 No-Debit Charges
These do not reduce driver wallet balance:

Base Driver Allowance

Base Hill Charge

Base Permit Charge

4. Trip Acceptance

Driver can accept a trip only if required wallet balance is available.

Once accepted, the required amount is held in the wallet until the trip is completed.

After acceptance, the driver must assign driver name, driver contact, and vehicle details within the time shown in the app.

5. Assignment Rules

If the driver does not assign vehicle and driver details within the given time, the held wallet amount will be deducted as a penalty.

This penalty cannot be reversed unless approved by admin.

6. Trip Completion

If the driver accepts but does not complete the trip (no-show, cancellation, withdrawal), the held wallet amount is deducted as penalty.

Repeated failure to complete trips will result in temporary or permanent account block.

7. Driver Responsibilities

Follow the exact route and instructions mentioned in the trip details.

Follow any additional notes or requirements set by the vendor.

Maintain professional behaviour with customers and vendors.

Keep the vehicle clean, insured, and roadworthy.

Do not collect additional amount from the customer outside the app fare.

8. Penalties

Penalties as displayed in the app during acceptance:

Unallocation Penalty: up to ₹2000

Assignment Penalty: up to ₹500

On-time / App-related Penalty: up to ₹500

Penalties depend on severity and may be automatically deducted.

9. Prohibited Activities

The following will lead to immediate suspension:

Fake documents

Fake trip acceptance

Misuse of wallet or app features

Sharing customer or vendor numbers publicly

Rude or unsafe behaviour

Attempting to avoid commissions or deductions

Overcharging customers

10. Account Suspension & Removal

Drop Cars reserves the right to suspend or remove the driver account in cases of:

Repeated penalties

Misuse of app

Fraudulent behaviour

Multiple trip failures

Safety issues reported by customer or vendor

11. Support & Resolution

For disputes, wallet issues, or trip problems, drivers may contact Drop Cars Support.
All penalty and deduction decisions are subject to Drop Cars Admin approval.

-> Contact Us

For any queries or support, contact us at:
📧 support@dropcars.com
📞 +917200217986
`;

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
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
      marginBottom: 12,
      marginLeft: 4,
    },
    settingItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    settingSubtitle: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 2,
    },
    logoutButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#FEE2E2',
    },
    logoutButtonText: {
      color: colors.error,
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 8,
    },
    profileCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    profileAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    profileAvatarText: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    profileSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
    profileStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      height: screenHeight * 0.8,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      padding: 8,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    termsText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      lineHeight: 22,
    },
    supportCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    supportItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    supportIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    supportContent: {
      flex: 1,
    },
    supportTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 2,
    },
    supportValue: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
    appInfoCard: {
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    appName: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    appVersion: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
    },
  });

  type SettingItemProps = {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  };

  const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity style={dynamicStyles.settingItem} onPress={onPress}>
      <View style={dynamicStyles.settingLeft}>
        <View style={dynamicStyles.settingIcon}>{icon}</View>
        <View>
          <Text style={dynamicStyles.settingTitle}>{title}</Text>
          {subtitle && <Text style={dynamicStyles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <ChevronRight color={colors.textSecondary} size={20} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Settings</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Welcome back, {(dashboardData?.user_info?.full_name || user?.fullName || 'Driver')}!
        </Text>
      </View>

      <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Preferences</Text>
          
          <SettingItem
            icon={isDarkMode ? <Moon color={colors.textSecondary} size={20} /> : <Sun color={colors.textSecondary} size={20} />}
            title="Dark Mode"
            subtitle="Switch between light and dark themes"
            rightComponent={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDarkMode ? '#FFFFFF' : '#F3F4F6'}
              />
            }
          />

          {/* Quick test for notification sound */}
          <SettingItem
            icon={<Bell color={colors.textSecondary} size={20} />}
            title="Test Notification Sound"
            subtitle="Send a test notification with custom sound"
            onPress={() => {
              testForegroundNotification().catch((err) => {
                console.error('Failed to send test notification:', err);
                Alert.alert('Error', 'Failed to send test notification. Please check console logs.');
              });
            }}
          />
        </View>

        {/* Custom notification sound checklist – verify all criteria before build */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Custom sound checklist</Text>
          <Text style={[dynamicStyles.settingSubtitle, { marginBottom: 12, marginLeft: 4 }]}>
            Tick each item when verified. Use “Run checks” for auto-verification on this device.
          </Text>
          <View style={[dynamicStyles.settingItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
            {[
              {
                id: 'app_json_sounds',
                label: `app.json plugin has sounds: ["${CUSTOM_SOUND_EXPECTED.soundsJsonValue}"]`,
                manual: true,
              },
              {
                id: 'app_json_channel',
                label: `app.json plugin has defaultChannel: "${CUSTOM_SOUND_EXPECTED.channelId}"`,
                manual: true,
              },
              {
                id: 'asset_exists',
                label: `File assets/${CUSTOM_SOUND_EXPECTED.soundFile} exists in project`,
                manual: true,
              },
              {
                id: 'android_channel',
                label: Platform.OS === 'android' ? 'Android channel exists with custom sound' : 'N/A (iOS)',
                manual: false,
              },
              {
                id: 'push_payload',
                label: 'Push payload includes sound + android.channelId (see CUSTOM_NOTIFICATION_SOUND_CHECKLIST.md)',
                manual: true,
              },
              {
                id: 'dev_build',
                label: 'Using development build (not Expo Go)',
                manual: true,
              },
              {
                id: 'test_played',
                label: 'Test notification played custom sound (tap Test above first)',
                manual: true,
              },
            ].map((item) => {
              const checked = checklist[item.id];
              const isAuto = item.id === 'android_channel';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                  onPress={() => (item.manual || isAuto) && toggleCheck(item.id)}
                  disabled={false}
                >
                  {checked ? (
                    <CheckCircle color={colors.primary} size={22} style={{ marginRight: 10 }} />
                  ) : (
                    <Circle color={colors.textSecondary} size={22} style={{ marginRight: 10 }} />
                  )}
                  <Text style={[dynamicStyles.settingSubtitle, { flex: 1, color: colors.text }]} numberOfLines={3}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {verifyResult && (
              <Text style={[dynamicStyles.settingSubtitle, { marginTop: 8, color: colors.textSecondary }]}>
                Run result: {verifyResult.message}
              </Text>
            )}
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
                onPress={runVerification}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '600' }}>Run checks</Text>
                )}
              </TouchableOpacity>
              <View style={{ justifyContent: 'center' }}>
                <Text style={[dynamicStyles.settingSubtitle, { color: allChecked ? colors.primary : colors.textSecondary }]}>
                  {allChecked ? '✓ All checked' : `${Object.values(checklist).filter(Boolean).length}/${Object.keys(checklist).length}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Account</Text>
          
          {/* Profile Card */}
          <View style={[dynamicStyles.profileCard, { backgroundColor: colors.surface }]}>
            <View style={dynamicStyles.profileHeader}>
              <View style={[dynamicStyles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Text style={dynamicStyles.profileAvatarText}>
                  {(dashboardData?.user_info?.full_name || user?.fullName || 'V').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={dynamicStyles.profileInfo}>
                <Text style={[dynamicStyles.profileName, { color: colors.text }]}>
                  {dashboardData?.user_info?.full_name || user?.fullName || 'Vehicle Owner'}
                </Text>
                <Text style={[dynamicStyles.profileSubtitle, { color: colors.textSecondary }]}>
                  Vehicle Owner
                </Text>
              </View>
            </View>
            
            <View style={dynamicStyles.profileStats}>
              <View style={dynamicStyles.statItem}>
                <Car color={colors.primary} size={20} />
                <Text style={[dynamicStyles.statValue, { color: colors.text }]}>
                  {dashboardData?.cars?.length || 0}
                </Text>
                <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                  Total Cars
                </Text>
              </View>
              <View style={dynamicStyles.statItem}>
                <Users color={colors.primary} size={20} />
                <Text style={[dynamicStyles.statValue, { color: colors.text }]}>
                  {dashboardData?.drivers?.length || 0}
                </Text>
                <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>
                  Total Drivers
                </Text>
              </View>
            </View>
          </View>

          {/* <SettingItem
            icon={<User color={colors.textSecondary} size={20} />}
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon')}
          /> */}

          <SettingItem
            icon={<Shield color={colors.textSecondary} size={20} />}
            title="Privacy & Security"
            subtitle="View Terms and Conditions"
            onPress={() => setShowTermsModal(true)}
          />
        </View>

        {/* Support & Help Section */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Support & Help</Text>
          
          <View style={[dynamicStyles.supportCard, { backgroundColor: colors.surface }]}>
            <TouchableOpacity style={dynamicStyles.supportItem} onPress={handleCallSupport}>
              <View style={[dynamicStyles.supportIcon, { backgroundColor: '#3B82F6' }]}>
                <Phone color="#FFFFFF" size={20} />
              </View>
              <View style={dynamicStyles.supportContent}>
                <Text style={[dynamicStyles.supportTitle, { color: colors.text }]}>Call Support</Text>
                <Text style={[dynamicStyles.supportValue, { color: colors.text }]}>+91 7200217986</Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={dynamicStyles.supportItem} onPress={handleEmailSupport}>
              <View style={[dynamicStyles.supportIcon, { backgroundColor: '#3B82F6' }]}>
                <Mail color="#FFFFFF" size={20} />
              </View>
              <View style={dynamicStyles.supportContent}>
                <Text style={[dynamicStyles.supportTitle, { color: colors.text }]}>Email Support</Text>
                <Text style={[dynamicStyles.supportValue, { color: colors.text }]}>dropcars.in@gmail.com</Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={dynamicStyles.supportItem} onPress={handleOpenWebsite}>
              <View style={[dynamicStyles.supportIcon, { backgroundColor: '#3B82F6' }]}>
                <Globe color="#FFFFFF" size={20} />
              </View>
              <View style={dynamicStyles.supportContent}>
                <Text style={[dynamicStyles.supportTitle, { color: colors.text }]}>Website</Text>
                <Text style={[dynamicStyles.supportValue, { color: colors.text }]}>www.dropcars.in</Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Information Section */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>App Information</Text>
          
          <View style={[dynamicStyles.appInfoCard, { backgroundColor: colors.surface }]}>
            <Text style={[dynamicStyles.appName, { color: colors.text }]}>Drop Cars Driver App</Text>
            <Text style={[dynamicStyles.appVersion, { color: colors.textSecondary }]}>Version 0.1</Text>
          </View>
        </View>

        <View style={dynamicStyles.section}>
          <TouchableOpacity style={dynamicStyles.logoutButton} onPress={handleLogout}>
            <LogOut color={colors.error} size={20} />
            <Text style={dynamicStyles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                Terms and Conditions
              </Text>
              <TouchableOpacity 
                onPress={() => setShowTermsModal(false)}
                style={dynamicStyles.closeButton}
              >
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={dynamicStyles.modalContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={[dynamicStyles.termsText, { color: colors.text }]}>
                {termsAndConditions}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}