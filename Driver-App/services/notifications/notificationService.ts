import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// Shared Android channel ID for custom sound (NEW v2 channel)
export const ANDROID_NOTIFICATION_CHANNEL_ID = 'dropcars-custom-sound-v2';

// Set up Android channel with custom sound BEFORE handler
async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
      name: 'DropCars Alerts (New)',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      // IMPORTANT: this must match the filename configured in app.json "sounds"
      // and the file bundled in ./assets, e.g. "./assets/notification_tone.wav"
      sound: 'notification_tone.wav',
      enableVibrate: true,
    });
    console.log(`✅ Android channel '${ANDROID_NOTIFICATION_CHANNEL_ID}' configured with custom sound`);
  }
}

// Configure handler AFTER channel setup
async function setupNotificationHandler() {
  await setupAndroidChannel(); // Channel first!
  
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('🔔 Notification received in handler:', notification);
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        // These are Android-only, safe to include
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
  console.log('✅ Notification handler configured');
}

// Initialize notification setup once at module load
setupNotificationHandler();

// Register for push notifications and get token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // REMOVED: Duplicate channel setup - already done in setupNotificationHandler()

    if (!Device.isDevice) {
      Alert.alert('Error', 'Push notifications only work on physical devices');
      return null;
    }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Push notification permission is required for this feature.');
      return null;
    }

        const token = await Notifications.getExpoPushTokenAsync();
        
    return token.data;
    } catch (error) {
    console.error('Error getting push token:', error);
    Alert.alert('Error', 'Failed to get push notification token');
    return null;
  }
}

// Set up notification listeners (foreground + tap logging)
export const setupNotificationListeners = () => {
  console.log('🔔 Setting up notification listeners...');
  
  // Listener for when notification is received in foreground
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📱 NOTIFICATION RECEIVED IN FOREGROUND:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
      identifier: notification.request.identifier,
      timestamp: new Date().toISOString()
    });
  });

  // Listener for when user taps notification
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 NOTIFICATION TAPPED:', {
      title: response.notification.request.content.title,
      data: response.notification.request.content.data,
      actionIdentifier: response.actionIdentifier
    });
  });

  console.log('✅ Notification listeners set up successfully');
  return { receivedListener, responseListener };
};

/** Expected values for checklist (match app.json and code) */
export const CUSTOM_SOUND_EXPECTED = {
  channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
  soundFile: 'notification_tone.wav',
  /** In app.json plugin use filename only: "notification_tone.wav" (not ./assets/...) */
  soundsJsonValue: 'notification_tone.wav',
} as const;

/**
 * Verify custom sound setup at runtime. Use in Settings checklist.
 * On Android: checks that the channel exists and has custom sound.
 * On iOS: channel API not used; returns platform info only.
 */
export async function verifyCustomSoundSetup(): Promise<{
  platform: string;
  channelExists: boolean;
  channelHasCustomSound: boolean;
  message: string;
}> {
  if (Platform.OS !== 'android') {
    return {
      platform: Platform.OS,
      channelExists: true,
      channelHasCustomSound: true,
      message: 'iOS: verify app.json sounds and test with "Test Notification Sound".',
    };
  }
  try {
    const channel = await Notifications.getNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID);
    if (!channel) {
      return {
        platform: 'android',
        channelExists: false,
        channelHasCustomSound: false,
        message: 'Channel not found. Reopen app so channel is created, or reinstall build.',
      };
    }
    const hasCustom = channel.sound === 'custom';
    return {
      platform: 'android',
      channelExists: true,
      channelHasCustomSound: hasCustom,
      message: hasCustom
        ? 'Channel exists with custom sound.'
        : 'Channel exists but sound is not custom (default). Check app.json plugin and rebuild.',
    };
  } catch (e) {
    return {
      platform: 'android',
      channelExists: false,
      channelHasCustomSound: false,
      message: `Error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// Simple test notification using the custom sound/channel
export async function testForegroundNotification(): Promise<void> {
  try {
    console.log('🧪 Testing notification...');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { test: true },
        // For iOS and Android < 8, this name must match the bundled sound file
        sound: 'notification_tone.wav',
      },
      // For Android 8+, channelId must be set so the channel's custom sound is used
      trigger: Platform.OS === 'android'
        ? { seconds: 1, channelId: ANDROID_NOTIFICATION_CHANNEL_ID }
        : null, // Immediate on iOS
    });
    console.log('✅ Test notification sent');
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
  }
}