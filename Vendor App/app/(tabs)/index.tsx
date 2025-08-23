import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import {
  Bell,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
  Eye,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Order {
  id: string;
  customerName: string;
  pickupLocation: string;
  dropLocation: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  distance: string;
  time: string;
  createdAt: string;
  carType: string;
  tripType: string;
}

interface VendorData {
  id: string;
  full_name: string;
  primary_number: string;
  account_status: string;
  branch_name: string;
}

export default function DashboardScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
          branch_name: storedData.organization_id || 'Drop Cars',
        });
      }
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  };

  const loadOrders = () => {
    // Mock orders data for car booking
    const mockOrders: Order[] = [
      {
        id: '1',
        customerName: 'Rahul Sharma',
        pickupLocation: 'Chennai Central Station',
        dropLocation: 'Vellore, Tamil Nadu',
        status: 'pending',
        amount: 2500,
        distance: '150 km',
        time: '3 hours',
        createdAt: '2024-01-15T10:30:00Z',
        carType: 'Sedan',
        tripType: 'Oneway'
      },
      {
        id: '2',
        customerName: 'Priya Patel',
        pickupLocation: 'Bangalore Airport',
        dropLocation: 'Mysore, Karnataka',
        status: 'accepted',
        amount: 3200,
        distance: '180 km',
        time: '4 hours',
        createdAt: '2024-01-15T09:15:00Z',
        carType: 'SUV',
        tripType: 'Oneway'
      },
      {
        id: '3',
        customerName: 'Amit Kumar',
        pickupLocation: 'Mumbai Central',
        dropLocation: 'Pune, Maharashtra',
        status: 'in_progress',
        amount: 1800,
        distance: '150 km',
        time: '3.5 hours',
        createdAt: '2024-01-15T08:45:00Z',
        carType: 'Innova',
        tripType: 'Round Trip'
      },
      {
        id: '4',
        customerName: 'Sneha Reddy',
        pickupLocation: 'Hyderabad Station',
        dropLocation: 'Warangal, Telangana',
        status: 'completed',
        amount: 2200,
        distance: '140 km',
        time: '2.5 hours',
        createdAt: '2024-01-14T16:20:00Z',
        carType: 'Sedan',
        tripType: 'Oneway'
      },
      {
        id: '5',
        customerName: 'Vikram Singh',
        pickupLocation: 'Delhi Airport',
        dropLocation: 'Agra, Uttar Pradesh',
        status: 'pending',
        amount: 2800,
        distance: '200 km',
        time: '4 hours',
        createdAt: '2024-01-15T11:00:00Z',
        carType: 'SUV',
        tripType: 'Oneway'
      }
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
      case 'accepted': return <Calendar size={16} color="#3B82F6" />;
      case 'in_progress': return <MapPin size={16} color="#8B5CF6" />;
      case 'completed': return <DollarSign size={16} color="#10B981" />;
      case 'cancelled': return <Eye size={16} color="#EF4444" />;
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

  const getDateLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const generateDateOptions = () => {
    const dates = [];
    for (let i = -2; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
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
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.branchSection}>
            <Text style={styles.branchName}>{vendorData.branch_name}</Text>
            <Text style={styles.accountStatus}>
              {vendorData.account_status === 'Active' ? '● Active' : '● Pending Verification'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Date Selection */}
        <View style={styles.dateSelectionContainer}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateScrollView}
          >
            {generateDateOptions().map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateOption,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateOption
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dateText,
                  selectedDate.toDateString() === date.toDateString() && styles.selectedDateText
                ]}>
                  {getDateLabel(date)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Orders */}
        <View style={styles.ordersContainer}>
          <View style={styles.ordersHeader}>
            <View>
              <Text style={styles.sectionTitle}>Orders</Text>
              <Text style={styles.sectionSubtitle}>Manage your car bookings</Text>
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
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerInitial}>
                      {order.customerName.charAt(0)}
                    </Text>
                  </View>
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

                <View style={styles.carInfo}>
                  <Text style={styles.carTypeText}>{order.carType} • {order.tripType}</Text>
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
  },
  branchSection: {
    flex: 1,
  },
  branchName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accountStatus: {
    fontSize: 14,
    color: '#E2E8F0',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateSelectionContainer: {
    marginTop: 24,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  dateScrollView: {
    flexGrow: 0,
  },
  dateOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDateOption: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedDateText: {
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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    gap: 4,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
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
  carInfo: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  carTypeText: {
    fontSize: 12,
    fontWeight: '500',
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