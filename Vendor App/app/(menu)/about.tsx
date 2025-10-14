// import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Users, Car, MapPin, Download, Clock, Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';
// import { useRouter } from 'expo-router';

// const { width } = Dimensions.get('window');

// interface StatCardProps {
//   icon: React.ReactNode;
//   value: string;
//   label: string;
// }

// const StatCard = ({ icon, value, label }: StatCardProps) => (
//   <View style={styles.statCard}>
//     <View style={styles.iconContainer}>{icon}</View>
//     <Text style={styles.statValue}>{value}</Text>
//     <Text style={styles.statLabel}>{label}</Text>
//   </View>
// );

// interface FeatureItemProps {
//   icon: React.ReactNode;
//   title: string;
//   description: string;
// }

// const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
//   <View style={styles.featureItem}>
//     <View style={styles.featureIconContainer}>{icon}</View>
//     <View style={styles.featureContent}>
//       <Text style={styles.featureTitle}>{title}</Text>
//       <Text style={styles.featureDescription}>{description}</Text>
//     </View>
//   </View>
// );

// export default function About() {
//   const router = useRouter();

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <LinearGradient
//         colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
//         style={styles.header}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//       >
//         <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
//           <ArrowLeft color="#fff" size={24} strokeWidth={2} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>ARUNACHALA TRAVELS</Text>
//         <Text style={styles.headerSubtitle}>Your Trusted Travel Partner</Text>
//       </LinearGradient>

//       <View style={styles.content}>
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Who We Are</Text>
//           <Text style={styles.bodyText}>
//             ARUNACHALA TRAVELS is a trusted, independent cab service provider committed to delivering safe, reliable,
//             and affordable transportation solutions. Proudly serving the regions of Tamil Nadu, Puducherry, Andhra Pradesh,
//             Karnataka, Kerala, and Telangana, we aim to make travel seamless and stress-free for everyone.
//           </Text>
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Our Mission</Text>
//           <Text style={styles.bodyText}>
//             At the heart of ARUNACHALA TRAVELS is a mission to provide safe, transparent, and customer-focused service.
//             We believe every journey should be driven by honesty, care, and a commitment to satisfaction. Our dedicated
//             team ensures that each ride reflects our core values of excellence and integrity.
//           </Text>
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Why Choose Us</Text>
//           <View style={styles.statsGrid}>
//             <StatCard
//               icon={<Users color="#3b82f6" size={32} strokeWidth={2} />}
//               value="3000+"
//               label="Satisfied Customers"
//             />
//             <StatCard
//               icon={<Car color="#3b82f6" size={32} strokeWidth={2} />}
//               value="1420+"
//               label="Professional Drivers"
//             />
//             <StatCard
//               icon={<MapPin color="#3b82f6" size={32} strokeWidth={2} />}
//               value="170+"
//               label="Cities Covered"
//             />
//             <StatCard
//               icon={<Download color="#3b82f6" size={32} strokeWidth={2} />}
//               value="25,000+"
//               label="App Downloads"
//             />
//           </View>

//           <View style={styles.supportBanner}>
//             <Clock color="#fff" size={24} strokeWidth={2} />
//             <Text style={styles.supportText}>24x7 Customer Support</Text>
//           </View>

//           <Text style={styles.bodyText}>
//             With a growing network and a strong presence across South India, ARUNACHALA TRAVELS has become a go-to
//             travel partner for thousands of customers.
//           </Text>
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Our Commitment to Safety</Text>
//           <Text style={styles.safetySubtitle}>Your safety is our top priority.</Text>

//           <FeatureItem
//             icon={<CheckCircle color="#10b981" size={28} strokeWidth={2} />}
//             title="Secure Vehicles"
//             description="Our fleet is regularly maintained and equipped with essential safety features."
//           />

//           <FeatureItem
//             icon={<Shield color="#10b981" size={28} strokeWidth={2} />}
//             title="Trained Drivers"
//             description="All drivers undergo safety training and strictly follow local traffic regulations."
//           />

//           <FeatureItem
//             icon={<AlertCircle color="#10b981" size={28} strokeWidth={2} />}
//             title="Emergency Ready"
//             description="Every vehicle is stocked with a first aid kit and supported by a 24/7 emergency contact line for peace of mind."
//           />
//         </View>

//         <View style={styles.footer}>
//           <Text style={styles.footerText}>
//             Thank you for choosing ARUNACHALA TRAVELS for your journey
//           </Text>
//         </View>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   header: {
//     paddingTop: 60,
//     paddingBottom: 40,
//     paddingHorizontal: 24,
//     alignItems: 'center',
//     position: 'relative',
//   },
//   backButton: {
//     position: 'absolute',
//     top: 60,
//     left: 24,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
//   headerTitle: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#fff',
//     letterSpacing: 1,
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#e0f2fe',
//     textAlign: 'center',
//   },
//   content: {
//     padding: 20,
//   },
//   section: {
//     marginBottom: 32,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1e293b',
//     marginBottom: 16,
//   },
//   bodyText: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: '#475569',
//     marginBottom: 12,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//     gap: 12,
//   },
//   statCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 20,
//     alignItems: 'center',
//     width: (width - 56) / 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   iconContainer: {
//     marginBottom: 12,
//   },
//   statValue: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1e293b',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 13,
//     color: '#64748b',
//     textAlign: 'center',
//   },
//   supportBanner: {
//     backgroundColor: '#3b82f6',
//     borderRadius: 12,
//     padding: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 20,
//     shadowColor: '#3b82f6',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   supportText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginLeft: 12,
//   },
//   safetySubtitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#334155',
//     marginBottom: 20,
//   },
//   featureItem: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   featureIconContainer: {
//     marginRight: 16,
//     marginTop: 2,
//   },
//   featureContent: {
//     flex: 1,
//   },
//   featureTitle: {
//     fontSize: 17,
//     fontWeight: 'bold',
//     color: '#1e293b',
//     marginBottom: 6,
//   },
//   featureDescription: {
//     fontSize: 14,
//     lineHeight: 20,
//     color: '#64748b',
//   },
//   footer: {
//     backgroundColor: '#f1f5f9',
//     borderRadius: 12,
//     padding: 24,
//     alignItems: 'center',
//     marginTop: 20,
//     marginBottom: 20,
//   },
//   footerText: {
//     fontSize: 15,
//     color: '#475569',
//     textAlign: 'center',
//     fontStyle: 'italic',
//   },
// });


import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    console.log('[DEBUG] useEffect called - registering for notifications');
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          console.log('[DEBUG] Push token received:', token);
          setExpoPushToken(token);
        } else {
          console.log('[DEBUG] Push token not received');
        }
      })
      .catch(error => console.error('[ERROR] Failed to register for notifications:', error));
  }, []);

  async function registerForPushNotificationsAsync() {
    console.log('[DEBUG] registerForPushNotificationsAsync called');

    if (!Device.isDevice) {
      alert('Must use a physical device');
      console.log('[WARN] Not a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[DEBUG] Existing permission status:', existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('[DEBUG] Requested permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token!');
      console.log('[ERROR] Permission not granted');
      return null;
    }

    // Get Expo push token
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      console.log('[DEBUG] Expo Push Token:', token);
      return token;
    } catch (error) {
      console.error('[ERROR] Failed to get Expo push token:', error);
      return null;
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Get Token"
        onPress={() => {
          console.log('[DEBUG] Get Token button pressed');
          registerForPushNotificationsAsync()
            .then(token => {
              if (token) setExpoPushToken(token);
            })
            .catch(error => console.error('[ERROR] Button press failed:', error));
        }}
      />
      <Text style={{ marginTop: 10 }}>{expoPushToken}</Text>
    </View>
  );
}