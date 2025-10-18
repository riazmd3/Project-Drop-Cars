import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle, Search, ListFilter as Filter, Calendar, DollarSign, ArrowLeft, IndianRupee } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import api from "../../app/api/api"
interface WalletTransaction {
  id: string;
  vendor_id: string;
  order_id: number | null;
  entry_type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance_before: number;
  balance_after: number;
  notes: string;
  created_at: string;
}

export default function WalletHistoryScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [currentBalance, setCurrentBalance] = useState(0);

  const fetchWalletHistory = async () => {
  try {
    const response = await api.get<WalletTransaction[]>(`/vendor/wallet/history`);

    const data = response.data;
    setTransactions(data);
    setFilteredTransactions(data);

    // Set current balance from the most recent transaction
    if (data.length > 0) {
      setCurrentBalance(data[0].balance_after);
    }
  } catch (error) {
    console.error('Error fetching wallet history:', error);
    Alert.alert('Error', 'Failed to load wallet history. Please try again.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};


  useEffect(() => {
    fetchWalletHistory();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    // Filter by transaction type
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(transaction => transaction.entry_type === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(transaction =>
        transaction.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.order_id && transaction.order_id.toString().includes(searchQuery))
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedFilter, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletHistory();
  };

  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'INR',
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0,
  //   }).format(amount);
  // };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: 'CREDIT' | 'DEBIT') => {
    return type === 'CREDIT' 
      ? <ArrowUpCircle size={24} color="#10b981" />
      : <ArrowDownCircle size={24} color="#ef4444" />;
  };

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIcon}>
          {getTransactionIcon(item.entry_type)}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {item.entry_type === 'CREDIT' ? 'Money Received' : 'Money Sent'}
          </Text>
          <Text style={styles.transactionNotes}>{item.notes}</Text>
          {item.order_id && (
            <Text style={styles.orderId}>Order #{item.order_id}</Text>
          )}
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            { color: item.entry_type === 'CREDIT' ? '#10b981' : '#ef4444' }
          ]}>
            {item.entry_type === 'CREDIT' ? '+' : '-'}{(item.amount)}
          </Text>
        </View>
      </View>
      <View style={styles.transactionFooter}>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Balance After: </Text>
            <IndianRupee size={10} />
          <Text style={styles.balanceAmount}>{(item.balance_after)}</Text>
        </View>
        <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
      </View>
    </View>
  );

  const FilterButton = ({ 
    title, 
    type, 
    isSelected 
  }: { 
    title: string; 
    type: 'ALL' | 'CREDIT' | 'DEBIT'; 
    isSelected: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isSelected && styles.filterButtonActive]}
      onPress={() => setSelectedFilter(type)}
    >
      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading wallet history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet History</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.subtitle}>Transaction History</Text>
          <View style={styles.balanceContainer}>
            <IndianRupee size={20} color="#10b981" />
            <Text style={styles.currentBalance}>{(currentBalance)}</Text>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <FilterButton title="All" type="ALL" isSelected={selectedFilter === 'ALL'} />
          <FilterButton title="Received" type="CREDIT" isSelected={selectedFilter === 'CREDIT'} />
          <FilterButton title="Sent" type="DEBIT" isSelected={selectedFilter === 'DEBIT'} />
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No transactions found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Your transaction history will appear here'}
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  currentBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 20,
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionIcon: {
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionNotes: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  balanceAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});