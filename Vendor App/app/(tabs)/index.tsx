import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import {
  Bell,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Package,
  Clock,
  MapPin,
  Star,
  MoreVertical,
  Calendar,
  DollarSign,
  Users,
  ArrowRight,
  Eye,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Order {
  id: string;
  customerName: string;
  customerImage?: string;
  pickupLocation: string;
  dropLocation: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  distance: string;
  time: string;
  rating?: number;
  createdAt: string;
}

interface VendorData {
  id: string;
  full_name: string;
  primary_number: string;
  account_status: string;
  wallet_balance: number;
  total_orders: number;
  completed_orders: number;
  rating: number;
}

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { getStoredVendorData } = useVendorAuth();

  useEffect(() => {
    loadVendorData();
    loadOrders();
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
          wallet_balance: storedData.wallet_balance || 0,
          total_orders: 45, // Mock data
          completed_orders: 38, // Mock data
          rating: 4.8, // Mock data
        });
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  };

  const loadOrders = () => {
    // Mock orders data
    const mockOrders: Order[] = [
      {
        id: '1',
        customerName: 'Rahul Sharma',
        customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        pickupLocation: 'Mumbai Central Station',
        dropLocation: 'Bandra West, Mumbai',
        status: 'pending',
        amount: 450,
        distance: '12.5 km',
        time: '25 min',
        rating: 4.5,
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        customerName: 'Priya Patel',
        customerImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        pickupLocation: 'Andheri Metro Station',
        dropLocation: 'Juhu Beach, Mumbai',
        status: 'accepted',
        amount: 380,
        distance: '8.2 km',
        time: '18 min',
        rating: 4.8,
        createdAt: '2024-01-15T09:15:00Z',
      },
      {
        id: '3',
        customerName: 'Amit Kumar',
        customerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        pickupLocation: 'Dadar Railway Station',
        dropLocation: 'Worli, Mumbai',
        status: 'in_progress',
        amount: 520,
        distance: '15.3 km',
        time: '32 min',
        rating: 4.6,
        createdAt: '2024-01-15T08:45:00Z',
      },
    ];
    setOrders(mockOrders);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVendorData(), loadOrders()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#F59E0B" />;
      case 'accepted': return <Package size={16} color="#3B82F6" />;
      case 'in_progress': return <MapPin size={16} color="#8B5CF6" />;
      case 'completed': return <Star size={16} color="#10B981" />;
      case 'cancelled': return <MoreVertical size={16} color="#EF4444" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

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
        <View style={styles.headerTop}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.vendorName}>{vendorData.full_name}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.accountStatus}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: vendorData.account_status === 'Active' ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.statusText}>
              {vendorData.account_status === 'Active' ? 'Account Active' : 'Pending Verification'}
            </Text>
          </View>
          <Text style={styles.ratingText}>
            ⭐ {vendorData.rating} Rating
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.statGradient}
              >
                <View style={styles.statIcon}>
                  <Package size={24} color="#FFFFFF" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{vendorData.total_orders}</Text>
                  <Text style={styles.statLabel}>Total Orders</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.statGradient}
              >
                <View style={styles.statIcon}>
                  <Star size={24} color="#FFFFFF" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{vendorData.completed_orders}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.statGradient}
              >
                <View style={styles.statIcon}>
                  <DollarSign size={24} color="#FFFFFF" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>₹{vendorData.wallet_balance}</Text>
                  <Text style={styles.statLabel}>Balance</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.statGradient}
              >
                <View style={styles.statIcon}>
                  <TrendingUp size={24} color="#FFFFFF" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>+12%</Text>
                  <Text style={styles.statLabel}>Growth</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.actionGradient}
              >
                <Plus size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>New Order</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.actionGradient}
              >
                <Calendar size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.actionGradient}
              >
                <TrendingUp size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Analytics</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.actionGradient}
              >
                <Users size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.ordersContainer}>
          <View style={styles.ordersHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <Text style={styles.sectionSubtitle}>Manage your active deliveries</Text>
            </View>
            <View style={styles.ordersActions}>
              <TouchableOpacity style={styles.actionIcon}>
                <Search size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIcon}>
                <Filter size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <ArrowRight size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          {orders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.customerInfo}>
                  <Image
                    source={{ uri: order.customerImage }}
                    style={styles.customerAvatar}
                  />
                  <View>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
                  </View>
                </View>
                <View style={styles.orderStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                    {getStatusIcon(order.status)}
                    <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <MoreVertical size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.locationRow}>
                  <View style={styles.locationItem}>
                    <View style={[styles.locationDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {order.pickupLocation}
                    </Text>
                  </View>
                  <View style={styles.locationItem}>
                    <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {order.dropLocation}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{order.distance}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{order.time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <DollarSign size={14} color="#6B7280" />
                    <Text style={styles.metaText}>₹{order.amount}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity style={styles.viewButton}>
                    <Eye size={16} color="#3B82F6" />
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  accountStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
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
  ratingText: {
    fontSize: 14,
    color: '#FCD34D',
    fontWeight: '600',
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
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ordersContainer: {
    marginBottom: 30,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  ordersActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  orderDetails: {
    gap: 16,
  },
  locationRow: {
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderActions: {
    alignItems: 'flex-end',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
});