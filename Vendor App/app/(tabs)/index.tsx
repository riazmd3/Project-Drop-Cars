import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Menu,
  Bell,
  User, 
  Phone, 
  IndianRupee,
  TrendingUp,
  Package,
  Clock,
  MapPin,
  ChevronRight,
  Eye,
  Calendar,
  Navigation,
  Star,
  MoreVertical,
  Filter,
  Search
} from 'lucide-react-native';
import { useVendorAuth } from '../../hooks/useVendorAuth';

const { width, height } = Dimensions.get('window');

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropLocation: string;
  driverPrice: number;
  vendorPrice: number;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  distance: number;
  rating?: number;
  customerImage?: string;
}

interface VendorData {
  id: string;
  full_name: string;
  primary_number: string;
  wallet_balance: number;
  account_status: string;
  total_orders: number;
  total_earnings: number;
  rating: number;
  completed_orders: number;
  pending_orders: number;
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const { getStoredVendorData } = useVendorAuth();

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      customerName: 'Rahul Kumar',
      customerPhone: '+91 9876543210',
      pickupLocation: 'MG Road, Bangalore',
      dropLocation: 'Whitefield, Bangalore',
      driverPrice: 450,
      vendorPrice: 500,
      status: 'confirmed',
      createdAt: '2024-01-15 14:30',
      distance: 15.2,
      rating: 4.8,
      customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '2',
      customerName: 'Priya Sharma',
      customerPhone: '+91 8765432109',
      pickupLocation: 'Koramangala, Bangalore',
      dropLocation: 'Electronic City, Bangalore',
      driverPrice: 320,
      vendorPrice: 380,
      status: 'in-progress',
      createdAt: '2024-01-15 13:15',
      distance: 12.8,
      rating: 4.9,
      customerImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '3',
      customerName: 'Amit Patel',
      customerPhone: '+91 7654321098',
      pickupLocation: 'HSR Layout, Bangalore',
      dropLocation: 'Indiranagar, Bangalore',
      driverPrice: 280,
      vendorPrice: 320,
      status: 'completed',
      createdAt: '2024-01-15 11:45',
      distance: 9.5,
      rating: 5.0,
      customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '4',
      customerName: 'Sneha Reddy',
      customerPhone: '+91 6543210987',
      pickupLocation: 'Jayanagar, Bangalore',
      dropLocation: 'Marathahalli, Bangalore',
      driverPrice: 380,
      vendorPrice: 420,
      status: 'pending',
      createdAt: '2024-01-15 10:20',
      distance: 14.1,
      rating: 4.7,
      customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    }
  ]);

  useEffect(() => {
    loadVendorData();
    animateHeader();
  }, []);

  const loadVendorData = async () => {
    try {
      const storedData = await getStoredVendorData();
      if (storedData) {
        setVendorData({
          ...storedData,
          total_orders: orders.length,
          total_earnings: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.vendorPrice, 0),
          rating: 4.8,
          completed_orders: orders.filter(o => o.status === 'completed').length,
          pending_orders: orders.filter(o => o.status === 'pending').length,
        });
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  };

  const animateHeader = () => {
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

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'in-progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#F59E0B" />;
      case 'confirmed': return <Package size={16} color="#3B82F6" />;
      case 'in-progress': return <Navigation size={16} color="#8B5CF6" />;
      case 'completed': return <Star size={16} color="#10B981" />;
      case 'cancelled': return <Clock size={16} color="#EF4444" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const totalEarnings = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.vendorPrice, 0);

  const todayOrders = orders.length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Gradient */}
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
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setMenuVisible(!menuVisible)}
            >
              <Menu size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Vendor Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                {vendorData?.account_status === 'Active' ? '🟢 Active Account' : '🟡 Pending Verification'}
              </Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>
                Welcome back, {vendorData?.full_name || 'Vendor'}! 👋
              </Text>
              <Text style={styles.welcomeSubtext}>
                Here's your business overview for today
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Star size={20} color="#FFD700" fill="#FFD700" />
              <Text style={styles.ratingText}>{vendorData?.rating || 4.8}</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Enhanced Stats Cards */}
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
              <View style={styles.statIconContainer}>
                <IndianRupee size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>₹{totalEarnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
              <View style={styles.statTrend}>
                <TrendingUp size={16} color="#FFFFFF" />
                <Text style={styles.statTrendText}>+12.5%</Text>
              </View>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <Package size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>{todayOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
              <View style={styles.statTrend}>
                <TrendingUp size={16} color="#FFFFFF" />
                <Text style={styles.statTrendText}>+8.2%</Text>
              </View>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <Star size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>{completedOrders}</Text>
              <Text style={styles.statLabel}>Completed</Text>
              <View style={styles.statTrend}>
                <TrendingUp size={16} color="#FFFFFF" />
                <Text style={styles.statTrendText}>+15.3%</Text>
              </View>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statGradient}
            >
              <View style={styles.statIconContainer}>
                <Clock size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.statValue}>{pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
              <View style={styles.statTrend}>
                <Clock size={16} color="#FFFFFF" />
                <Text style={styles.statTrendText}>Awaiting</Text>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard}>
            <LinearGradient
              colors={['#EC4899', '#BE185D']}
              style={styles.quickActionGradient}
            >
              <Package size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>New Order</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <LinearGradient
              colors={['#06B6D4', '#0891B2']}
              style={styles.quickActionGradient}
            >
              <Calendar size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Schedule</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <LinearGradient
              colors={['#84CC16', '#65A30D']}
              style={styles.quickActionGradient}
            >
              <TrendingUp size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard}>
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              style={styles.quickActionGradient}
            >
              <User size={24} color="#FFFFFF" />
              <Text style={styles.quickActionText}>Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Orders Section */}
      <View style={styles.ordersSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <Text style={styles.sectionSubtitle}>Manage your deliveries</Text>
          </View>
          <View style={styles.sectionActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Search size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Filter size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {orders.map((order, index) => (
            <Animated.View
              key={order.id}
              style={[
                styles.orderCard,
                {
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50 * (index + 1), 0],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.orderHeader}>
                <View style={styles.customerInfo}>
                  {order.customerImage ? (
                    <Image source={{ uri: order.customerImage }} style={styles.customerAvatar} />
                  ) : (
                    <View style={styles.customerAvatarPlaceholder}>
                      <User size={20} color="#6B7280" />
                    </View>
                  )}
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    <Text style={styles.customerPhone}>{order.customerPhone}</Text>
                  </View>
                </View>
                <View style={styles.orderActions}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    {getStatusIcon(order.status)}
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <MoreVertical size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.locationContainer}>
                <View style={styles.locationRow}>
                  <View style={styles.locationDot} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {order.pickupLocation}
                  </Text>
                </View>
                <View style={styles.locationLine} />
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, styles.dropDot]} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {order.dropLocation}
                  </Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.priceContainer}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Driver</Text>
                    <Text style={styles.priceValue}>₹{order.driverPrice}</Text>
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Vendor</Text>
                    <Text style={styles.vendorPrice}>₹{order.vendorPrice}</Text>
                  </View>
                </View>
                <View style={styles.orderMeta}>
                  <View style={styles.distanceContainer}>
                    <Navigation size={14} color="#6B7280" />
                    <Text style={styles.distanceText}>{order.distance} km</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.timeText}>{order.createdAt}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Enhanced Hamburger Menu Overlay */}
      {menuVisible && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              style={styles.menuHeader}
            >
              <View style={styles.profileSection}>
                <View style={styles.avatar}>
                  <User size={32} color="#FFFFFF" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{vendorData?.full_name || 'Vendor Name'}</Text>
                  <Text style={styles.profilePhone}>{vendorData?.primary_number || '+91 9876543210'}</Text>
                  <Text style={styles.profileStatus}>
                    {vendorData?.account_status === 'Active' ? '🟢 Active' : '🟡 Pending'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <User size={20} color="#3B82F6" />
                <Text style={styles.menuItemText}>Profile</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Package size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Orders</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <IndianRupee size={20} color="#F59E0B" />
                <Text style={styles.menuItemText}>Earnings</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <TrendingUp size={20} color="#8B5CF6" />
                <Text style={styles.menuItemText}>Analytics</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Calendar size={20} color="#06B6D4" />
                <Text style={styles.menuItemText}>Schedule</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerCenter: {
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsScroll: {
    alignItems: 'center',
  },
  statCard: {
    width: width * 0.8, // Adjust width for horizontal scroll
    height: 120,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  statGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statTrendText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    width: '48%', // Two columns
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  ordersSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
  },
  ordersList: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  customerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 8,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  dropDot: {
    backgroundColor: '#EF4444',
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  vendorPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  menuContent: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  menuHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
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
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  profileStatus: {
    fontSize: 13,
    color: '#E5E7EB',
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});