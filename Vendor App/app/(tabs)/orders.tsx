import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText, Calendar, Car, User, ArrowRight,
  CircleCheck as CheckCircle, Circle as XCircle,
  CircleAlert as AlertCircle
} from 'lucide-react-native';
import OrderDetails from '../../components/OrderDetails';
import api from '../api/api';

interface Order {
  order_id: number;
  customer_name: string;
  customer_number: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: { [key: string]: string };
  start_date_time: string;
  status?: string;
  trip_status?: string;
  fare: {
    total_km: number;
    total_amount: number;
  };
  created_at: string;
  trip_distance?: number;
    vendor_price?: number;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/vendor');
      console.log('Orders:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return '#F59E0B';
      case 'DRIVER_ASSIGNED': return '#3B82F6';
      case 'TRIP_STARTED': return '#10B981';
      case 'TRIP_COMPLETED': return '#059669';
      case 'CANCELLED': return '#DC2626';
      case 'PENDING': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <AlertCircle size={16} color="#F59E0B" />;
      case 'DRIVER_ASSIGNED': return <Car size={16} color="#3B82F6" />;
      case 'TRIP_STARTED': return <CheckCircle size={16} color="#10B981" />;
      case 'TRIP_COMPLETED': return <CheckCircle size={16} color="#059669" />;
      case 'CANCELLED': return <XCircle size={16} color="#DC2626" />;
      case 'PENDING': return <AlertCircle size={16} color="#6B7280" />;
      default: return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const getLocationEntries = (locations: { [key: string]: string }) => {
    return Object.entries(locations || {}).sort(([a], [b]) => parseInt(a) - parseInt(b));
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const status = item.status || item.trip_status || 'UNKNOWN';
    const locations = getLocationEntries(item.pickup_drop_location);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdText}>#{item.order_id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(status)}20` }]}>
              {getStatusIcon(status)}
              <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                {status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <ArrowRight size={20} color="#9CA3AF" />
        </View>

        <View style={styles.orderContent}>
          <View style={styles.customerInfo}>
            <User size={16} color="#1E40AF" />
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>

          <View style={styles.tripInfo}>
            <View style={styles.tripTypeContainer}>
              <Car size={16} color="#6B7280" />
              <Text style={styles.tripTypeText}>
                {item.trip_type} • {item.car_type}
              </Text>
            </View>

            <View style={styles.dateTimeContainer}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {formatDate(item.start_date_time)} at {formatTime(item.start_date_time)}
              </Text>
            </View>
          </View>

          <View style={styles.routeInfo}>
            <View style={styles.routeItem}>
              <View style={[styles.routeDot, styles.routeDotStart]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {locations[0]?.[1] || 'Pickup Location'}
              </Text>
            </View>

            {locations.length > 2 && (
              <View style={styles.routeItem}>
                <View style={[styles.routeDot, styles.routeDotMiddle]} />
                <Text style={styles.routeText} numberOfLines={1}>
                  +{locations.length - 2} more stops
                </Text>
              </View>
            )}

            <View style={styles.routeItem}>
              <View style={[styles.routeDot, styles.routeDotEnd]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {locations[locations.length - 1]?.[1] || 'Drop Location'}
              </Text>
            </View>
          </View>

          <View style={styles.fareInfo}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Distance</Text>
              <Text style={styles.fareValue}>
                {item.fare?.total_km || item.trip_distance} km
              </Text>
            </View>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <Text style={styles.fareValue}>
                ₹{item.fare?.total_amount || item.vendor_price}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#059669', '#10B981', '#34D399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <FileText size={32} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSubtitle}>{orders.length} total bookings</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.order_id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ordersList}
          />
        )}
      </View>

      {/* Order Details Modal */}
      <OrderDetails
        visible={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        order={selectedOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  ordersList: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  orderContent: {
    gap: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    marginLeft: 8,
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripTypeText: {
    fontSize: 14,
    color: '#5F6368',
    marginLeft: 6,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#5F6368',
    marginLeft: 6,
  },
  routeInfo: {
    paddingVertical: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  routeDotStart: {
    backgroundColor: '#10B981',
  },
  routeDotMiddle: {
    backgroundColor: '#F59E0B',
  },
  routeDotEnd: {
    backgroundColor: '#DC2626',
  },
  routeText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  fareInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  fareItem: {
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 4,
  },
  fareValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
});