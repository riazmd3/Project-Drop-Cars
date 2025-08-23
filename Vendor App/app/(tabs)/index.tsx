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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import { getVendorOrdersUrl } from '../../config/api';
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
  CheckCircle,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Order {
  order_id: number;
  vendor_id: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: {
    [key: string]: string;
  };
  start_date_time: string;
  customer_name: string;
  customer_number: string;
  cost_per_km: number;
  extra_cost_per_km: number;
  driver_allowance: number;
  extra_driver_allowance: number;
  permit_charges: number;
  extra_permit_charges: number;
  hill_charges: number;
  toll_charges: number;
  pickup_notes: string;
  trip_status: string;
  pick_near_city: string;
  trip_distance: number;
  trip_time: string;
  estimated_price: number;
  vendor_price: number;
  platform_fees_percent: number;
  created_at: string;
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
  const [newOrderNotification, setNewOrderNotification] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const { getStoredVendorData, getStoredToken } = useVendorAuth();

  useEffect(() => {
    loadVendorData();
    loadOrders();
  }, []);

  // Check for new orders every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [orders, lastOrderCount]);

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

  const loadOrders = async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please sign in again.');
        return;
      }

      const response = await fetch(getVendorOrdersUrl(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const ordersData: Order[] = await response.json();
      
      // Sort orders by creation date (latest first)
      const sortedOrders = ordersData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setOrders(sortedOrders);
      
      // Check if there are new orders
      if (ordersData.length > lastOrderCount && lastOrderCount > 0) {
        setNewOrderNotification(true);
        setTimeout(() => setNewOrderNotification(false), 5000); // Hide after 5 seconds
      }
      
      setLastOrderCount(ordersData.length);
      
      // Set the latest date as selected
      if (ordersData.length > 0) {
        const latestOrderDate = new Date(ordersData[0].start_date_time);
        setSelectedDate(latestOrderDate);
      }
      
    } catch (error) {
      console.error('Error loading orders:', error);
      // Fallback to mock data if API fails
      loadMockOrders();
    }
  };

  const loadMockOrders = () => {
    // Mock orders data for car booking
    const mockOrders: Order[] = [
      {
        order_id: 1,
        vendor_id: '1',
        trip_type: 'Oneway',
        car_type: 'Sedan',
        pickup_drop_location: { '0': 'Chennai Central Station', '1': 'Vellore, Tamil Nadu' },
        start_date_time: '2024-01-15T10:30:00Z',
        customer_name: 'Rahul Sharma',
        customer_number: '9876543210',
        cost_per_km: 10,
        extra_cost_per_km: 0,
        driver_allowance: 0,
        extra_driver_allowance: 0,
        permit_charges: 0,
        extra_permit_charges: 0,
        hill_charges: 0,
        toll_charges: 0,
        pickup_notes: '',
        trip_status: 'PENDING',
        pick_near_city: '',
        trip_distance: 150,
        trip_time: '3 hours',
        estimated_price: 2500,
        vendor_price: 2500,
        platform_fees_percent: 0,
        created_at: '2024-01-15T10:30:00Z',
      },
      {
        order_id: 2,
        vendor_id: '1',
        trip_type: 'Oneway',
        car_type: 'SUV',
        pickup_drop_location: { '0': 'Bangalore Airport', '1': 'Mysore, Karnataka' },
        start_date_time: '2024-01-15T09:15:00Z',
        customer_name: 'Priya Patel',
        customer_number: '9876543211',
        cost_per_km: 10,
        extra_cost_per_km: 0,
        driver_allowance: 0,
        extra_driver_allowance: 0,
        permit_charges: 0,
        extra_permit_charges: 0,
        hill_charges: 0,
        toll_charges: 0,
        pickup_notes: '',
        trip_status: 'ACCEPTED',
        pick_near_city: '',
        trip_distance: 180,
        trip_time: '4 hours',
        estimated_price: 3200,
        vendor_price: 3200,
        platform_fees_percent: 0,
        created_at: '2024-01-15T09:15:00Z',
      },
      {
        order_id: 3,
        vendor_id: '1',
        trip_type: 'Round Trip',
        car_type: 'Innova',
        pickup_drop_location: { '0': 'Mumbai Central', '1': 'Pune, Maharashtra' },
        start_date_time: '2024-01-15T08:45:00Z',
        customer_name: 'Amit Kumar',
        customer_number: '9876543212',
        cost_per_km: 10,
        extra_cost_per_km: 0,
        driver_allowance: 0,
        extra_driver_allowance: 0,
        permit_charges: 0,
        extra_permit_charges: 0,
        hill_charges: 0,
        toll_charges: 0,
        pickup_notes: '',
        trip_status: 'IN_PROGRESS',
        pick_near_city: '',
        trip_distance: 150,
        trip_time: '3.5 hours',
        estimated_price: 1800,
        vendor_price: 1800,
        platform_fees_percent: 0,
        created_at: '2024-01-15T08:45:00Z',
      },
      {
        order_id: 4,
        vendor_id: '1',
        trip_type: 'Oneway',
        car_type: 'Sedan',
        pickup_drop_location: { '0': 'Hyderabad Station', '1': 'Warangal, Telangana' },
        start_date_time: '2024-01-14T16:20:00Z',
        customer_name: 'Sneha Reddy',
        customer_number: '9876543213',
        cost_per_km: 10,
        extra_cost_per_km: 0,
        driver_allowance: 0,
        extra_driver_allowance: 0,
        permit_charges: 0,
        extra_permit_charges: 0,
        hill_charges: 0,
        toll_charges: 0,
        pickup_notes: '',
        trip_status: 'COMPLETED',
        pick_near_city: '',
        trip_distance: 140,
        trip_time: '2.5 hours',
        estimated_price: 2200,
        vendor_price: 2200,
        platform_fees_percent: 0,
        created_at: '2024-01-14T16:20:00Z',
      },
      {
        order_id: 5,
        vendor_id: '1',
        trip_type: 'Oneway',
        car_type: 'SUV',
        pickup_drop_location: { '0': 'Delhi Airport', '1': 'Agra, Uttar Pradesh' },
        start_date_time: '2024-01-15T11:00:00Z',
        customer_name: 'Vikram Singh',
        customer_number: '9876543214',
        cost_per_km: 10,
        extra_cost_per_km: 0,
        driver_allowance: 0,
        extra_driver_allowance: 0,
        permit_charges: 0,
        extra_permit_charges: 0,
        hill_charges: 0,
        toll_charges: 0,
        pickup_notes: '',
        trip_status: 'PENDING',
        pick_near_city: '',
        trip_distance: 200,
        trip_time: '4 hours',
        estimated_price: 2800,
        vendor_price: 2800,
        platform_fees_percent: 0,
        created_at: '2024-01-15T11:00:00Z',
      },
    ];
    setOrders(mockOrders);
  };

  const checkForNewOrders = async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      const response = await fetch(getVendorOrdersUrl(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const ordersData: Order[] = await response.json();
        if (ordersData.length > lastOrderCount) {
          setNewOrderNotification(true);
          setTimeout(() => setNewOrderNotification(false), 5000);
          setLastOrderCount(ordersData.length);
          // Refresh the orders list
          loadOrders();
        }
      }
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  };

  const filterOrdersByDate = (orders: Order[], selectedDate: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.start_date_time);
      return orderDate.toDateString() === selectedDate.toDateString();
    });
  };

  const getFilteredOrders = () => {
    return filterOrdersByDate(orders, selectedDate);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVendorData(), loadOrders()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'ACCEPTED': return '#3B82F6';
      case 'IN_PROGRESS': return '#8B5CF6';
      case 'COMPLETED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'ACCEPTED': return 'Accepted';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} color="#F59E0B" />;
      case 'ACCEPTED': return <Calendar size={16} color="#3B82F6" />;
      case 'IN_PROGRESS': return <MapPin size={16} color="#8B5CF6" />;
      case 'COMPLETED': return <DollarSign size={16} color="#10B981" />;
      case 'CANCELLED': return <Eye size={16} color="#EF4444" />;
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

      {/* New Order Notification */}
      {newOrderNotification && (
        <View style={styles.newOrderBanner}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.newOrderText}>New order received successfully!</Text>
        </View>
      )}

      <ScrollView 
        style={[styles.content, { marginTop: newOrderNotification ? 0 : 10 }]}
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

          {/* Summary Section */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Orders</Text>
              <Text style={styles.summaryValue}>{getFilteredOrders().length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Profit</Text>
              <Text style={styles.summaryValue}>
                ₹{getFilteredOrders().reduce((total, order) => total + (order.vendor_price - order.estimated_price), 0)}
              </Text>
            </View>
          </View>

          {getFilteredOrders().map((order) => (
            <TouchableOpacity key={order.order_id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerInitial}>
                      {order.customer_name.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.customerName}>{order.customer_name}</Text>
                    <Text style={styles.orderTime}>{formatTime(order.start_date_time)}</Text>
                  </View>
                </View>
                <View style={styles.orderStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.trip_status)}20` }]}>
                    {getStatusIcon(order.trip_status)}
                    <Text style={[styles.orderStatusText, { color: getStatusColor(order.trip_status) }]}>
                      {getStatusText(order.trip_status)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.locationRow}>
                  <View style={styles.locationItem}>
                    <View style={[styles.locationDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {order.pickup_drop_location['0']}
                    </Text>
                  </View>
                  <View style={styles.locationItem}>
                    <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {order.pickup_drop_location['1']}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{order.trip_distance} km</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{order.trip_time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <DollarSign size={14} color="#6B7280" />
                    <Text style={styles.metaText}>₹{order.vendor_price}</Text>
                  </View>
                </View>

                {/* Price and Profit Information */}
                <View style={styles.priceInfo}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Estimated Price:</Text>
                    <Text style={styles.estimatedPrice}>₹{order.estimated_price}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Your Price:</Text>
                    <Text style={styles.vendorPrice}>₹{order.vendor_price}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Profit:</Text>
                    <Text style={styles.profitText}>₹{order.vendor_price - order.estimated_price}</Text>
                  </View>
                </View>

                <View style={styles.carInfo}>
                  <Text style={styles.carTypeText}>{order.car_type} • {order.trip_type}</Text>
                </View>

                {order.pickup_notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{order.pickup_notes}</Text>
                  </View>
                )}

                <View style={styles.orderActions}>
                  <TouchableOpacity style={styles.viewButton}>
                    <Eye size={16} color="#3B82F6" />
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {getFilteredOrders().length === 0 && (
            <View style={styles.noOrdersContainer}>
              <Text style={styles.noOrdersText}>No orders for {getDateLabel(selectedDate)}</Text>
              <Text style={styles.noOrdersSubtext}>Orders will appear here when they are created</Text>
            </View>
          )}
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
  newOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
  },
  newOrderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
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
  priceInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  estimatedPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  vendorPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  profitText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
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
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  noOrdersContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noOrdersText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  noOrdersSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});