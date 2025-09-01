import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/api';
import { History as HistoryIcon, ArrowUpRight, Clock, CircleCheck as CheckCircle, Circle as XCircle, Filter } from 'lucide-react-native';

// Mock data store
// import { getTransferHistory } from '../store/mockData';

export default function HistoryScreen() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  // const loadHistory = () => {
  //   setTransfers(getTransferHistory());
  // };

    const loadHistory = async () => {
      try {
        // await requestTransfer(transferAmount);
        const response = await api.get('/transfer/history?skip=0&limit=100');
        setTransfers(response.data["transactions"]);

      } catch (error) {
        Alert.alert('Error', 'Failed to create transfer request');
      }
    };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={20} color="#10B981" />;
      case 'Rejected':
        return <XCircle size={20} color="#EF4444" />;
      case 'Pending':
        return <Clock size={20} color="#F59E0B" />;
      default:
        return <Clock size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return '#10B981';
      case 'Rejected':
        return '#EF4444';
      case 'Pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return '#10B98120';
      case 'Rejected':
        return '#EF444420';
      case 'Pending':
        return '#F59E0B20';
      default:
        return '#6B728020';
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    if (filter === 'all') return true;
    return transfer.status.toLowerCase() === filter.toLowerCase();
  });

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

  const FilterButton = ({ status, label }: { status: string; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === status && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === status && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <HistoryIcon size={20} color="#3B82F6" />
            </View>
            <Text style={styles.headerTitle}>Transfer History</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Filter size={16} color="#6B7280" />
            <Text style={styles.filterTitle}>Filter by status</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterButtons}>
              <FilterButton status="all" label="All" />
              <FilterButton status="pending" label="Pending" />
              <FilterButton status="approved" label="Approved" />
              <FilterButton status="rejected" label="Rejected" />
            </View>
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredTransfers.length === 0 ? (
            <View style={styles.emptyState}>
              <HistoryIcon size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No transfers found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' 
                  ? 'Your transfer history will appear here'
                  : `No ${filter} transfers found`
                }
              </Text>
            </View>
          ) : (
            <View style={styles.transferList}>
              {filteredTransfers.map((transfer) => (
                <View key={transfer.id} style={styles.transferCard}>
                  <View style={styles.transferHeader}>
                    <View style={styles.transferIcon}>
                      <ArrowUpRight size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.transferInfo}>
                      <Text style={styles.transferAmount}>
                        ${transfer.requested_amount.toLocaleString()}
                      </Text>
                      <Text style={styles.transferDate}>
                        {formatDate(transfer.created_at)}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBackgroundColor(transfer.status) }
                    ]}>
                      {getStatusIcon(transfer.status)}
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(transfer.status) }
                      ]}>
                        {transfer.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transferDetails}>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>Wallet Before</Text>
                      <Text style={styles.balanceValue}>
                        ${transfer.wallet_balance_before.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>Bank Before</Text>
                      <Text style={styles.balanceValue}>
                        ${transfer.bank_balance_before.toLocaleString()}
                      </Text>
                    </View>
                    
                    {transfer.status === 'Approved' && (
                      <>
                        <View style={styles.separator} />
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>Wallet After</Text>
                          <Text style={[styles.balanceValue, { color: '#10B981' }]}>
                            ${transfer.wallet_balance_after.toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.balanceRow}>
                          <Text style={styles.balanceLabel}>Bank After</Text>
                          <Text style={[styles.balanceValue, { color: '#10B981' }]}>
                            ${transfer.bank_balance_after.toLocaleString()}
                          </Text>
                        </View>
                      </>
                    )}

                    {transfer.admin_notes && (
                      <>
                        <View style={styles.separator} />
                        <View style={styles.notesSection}>
                          <Text style={styles.notesLabel}>Admin Notes:</Text>
                          <Text style={styles.notesText}>{transfer.admin_notes}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  transferList: {
    gap: 16,
    paddingBottom: 20,
  },
  transferCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  transferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transferIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F620',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transferInfo: {
    flex: 1,
  },
  transferAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  transferDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transferDetails: {
    gap: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  notesSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
});