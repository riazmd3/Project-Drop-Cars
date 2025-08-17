import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
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
  Eye
} from 'lucide-react-native';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropLocation: string;
  driverPrice: number;
  vendorPrice: number;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed';
  createdAt: string;
  distance: number;
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
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
      distance: 15.2
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
      distance: 12.8
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
      distance: 9.5
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
      distance: 14.1
    }
  ]);

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
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
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
      {/* Header with Hamburger Menu */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setMenuVisible(!menuVisible)}
          >
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.welcomeText}>Welcome back, Vendor!</Text>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <IndianRupee size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>₹{totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Package size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{todayOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{completedOrders}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Orders Section */}
      <View style={styles.ordersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {orders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.orderTime}>{order.createdAt}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
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
                  <Text style={styles.priceLabel}>Driver: ₹{order.driverPrice}</Text>
                  <Text style={styles.vendorPrice}>Vendor: ₹{order.vendorPrice}</Text>
                </View>
                <View style={styles.distanceContainer}>
                  <Text style={styles.distanceText}>{order.distance} km</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Hamburger Menu Overlay */}
      {menuVisible && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.menuHeader}
            >
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
            
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <User size={20} color="#3B82F6" />
                <Text style={styles.menuItemText}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Package size={20} color="#10B981" />
                <Text style={styles.menuItemText}>Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <IndianRupee size={20} color="#F59E0B" />
                <Text style={styles.menuItemText}>Earnings</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  welcomeText: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: '22%',
    backdropFilter: 'blur(10px)',
  },
  statIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#E5E7EB',
    textAlign: 'center',
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
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
  orderInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  vendorPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  distanceContainer: {
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
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 16,
    fontWeight: '500',
  },
});