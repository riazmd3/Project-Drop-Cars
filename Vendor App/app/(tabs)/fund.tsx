import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVendorAuth } from '../../hooks/useVendorAuth';
import { transferService, BalanceResponse, TransferStatistics, TransferTransaction } from '../../services/transferService';
import {
  Wallet,
  CreditCard,
  TrendingUp,
  Clock,
  FileText,
  DollarSign,
  ArrowRight,
  History,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';

export default function FundScreen() {
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [transferStats, setTransferStats] = useState<TransferStatistics | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferTransaction[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { getStoredToken } = useVendorAuth();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadBalanceData(),
      loadTransferStats(),
      loadTransferHistory(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const loadBalanceData = async () => {
    try {
      const authToken = await getStoredToken();
      if (authToken) {
        const balance = await transferService.checkBalance(authToken);
        setBalanceData(balance);
      }
    } catch (error) {
      console.error('Error loading balance data:', error);
    }
  };

  const loadTransferStats = async () => {
    try {
      const authToken = await getStoredToken();
      if (authToken) {
        const stats = await transferService.getTransferStatistics(authToken);
        setTransferStats(stats);
      }
    } catch (error) {
      console.error('Error loading transfer stats:', error);
    }
  };

  const loadTransferHistory = async () => {
    try {
      const authToken = await getStoredToken();
      if (authToken) {
        const history = await transferService.getTransferHistory(authToken, 0, 50);
        setTransferHistory(history.transactions);
      }
    } catch (error) {
      console.error('Error loading transfer history:', error);
    }
  };

  const handleTransferRequest = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    if (balanceData && parseFloat(transferAmount) > balanceData.wallet_balance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough wallet balance for this transfer');
      return;
    }

    setIsLoading(true);
    try {
      const authToken = await getStoredToken();
      if (authToken) {
        await transferService.requestTransfer(parseFloat(transferAmount), authToken);
        Alert.alert('Success', 'Transfer request submitted successfully');
        setShowTransferModal(false);
        setTransferAmount('');
        await loadAllData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit transfer request. Please try again.');
      console.error('Transfer request error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={16} color="#10B981" />;
      case 'Pending':
        return <Clock size={16} color="#F59E0B" />;
      case 'Rejected':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return '#10B981';
      case 'Pending':
        return '#F59E0B';
      case 'Rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#1E40AF', '#3B82F6', '#60A5FA']}
          style={styles.headerSection}
        >
          <View style={styles.headerContent}>
            <View style={styles.profileSection}>
              <View style={styles.profileImage}>
                <Wallet size={40} color="#FFFFFF" />
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Fund Management</Text>
                <Text style={styles.profilePhone}>Manage your wallet and transfers</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <RefreshCw size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Balance Cards */}
          <View style={styles.balanceContainer}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceIcon}>
                  <Wallet size={24} color="#3B82F6" />
                </View>
                <Text style={styles.balanceLabel}>Wallet Balance</Text>
              </View>
              <Text style={styles.balanceAmount}>
                ₹{balanceData?.wallet_balance?.toLocaleString() || '0'}
              </Text>
            </View>
            
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceIcon}>
                  <CreditCard size={24} color="#10B981" />
                </View>
                <Text style={styles.balanceLabel}>Bank Balance</Text>
              </View>
              <Text style={styles.balanceAmount}>
                ₹{balanceData?.bank_balance?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>

          {/* Total Balance */}
          <View style={styles.totalBalanceCard}>
            <Text style={styles.totalBalanceLabel}>Total Available Balance</Text>
            <Text style={styles.totalBalanceAmount}>
              ₹{balanceData?.total_balance?.toLocaleString() || '0'}
            </Text>
          </View>
        </LinearGradient>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowTransferModal(true)}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.actionButtonGradient}
              >
                <View style={styles.actionIcon}>
                  <ArrowRight size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionText}>Request Transfer</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowHistory(!showHistory)}
            >
              <LinearGradient
                colors={['#60A5FA', '#3B82F6']}
                style={styles.actionButtonGradient}
              >
                <View style={styles.actionIcon}>
                  <History size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.actionText}>
                  {showHistory ? 'Hide History' : 'Show History'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Transfer Statistics */}
          {transferStats && (
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Transfer Statistics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.statCardGradient}
                  >
                    <View style={styles.statIcon}>
                      <TrendingUp size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statValue}>{transferStats.total_approved}</Text>
                    <Text style={styles.statLabel}>Approved</Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.statCardGradient}
                  >
                    <View style={styles.statIcon}>
                      <Clock size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statValue}>{transferStats.total_pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.statCardGradient}
                  >
                    <View style={styles.statIcon}>
                      <FileText size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statValue}>{transferStats.total_rejected}</Text>
                    <Text style={styles.statLabel}>Rejected</Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    style={styles.statCardGradient}
                  >
                    <View style={styles.statIcon}>
                      <DollarSign size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statValue}>₹{transferStats.total_transferred?.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total Transferred</Text>
                  </LinearGradient>
                </View>
              </View>
            </View>
          )}

          {/* Transfer History */}
          {showHistory && transferHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>Recent Transfer History</Text>
              {transferHistory.map((transaction) => (
                <View key={transaction.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyAmount}>
                      <Text style={styles.amountText}>₹{transaction.requested_amount.toLocaleString()}</Text>
                      <Text style={styles.amountLabel}>Requested Amount</Text>
                    </View>
                    <View style={styles.historyStatus}>
                      {getStatusIcon(transaction.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.historyDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    {transaction.admin_notes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Notes:</Text>
                        <Text style={styles.detailValue}>{transaction.admin_notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* No History Message */}
          {showHistory && transferHistory.length === 0 && (
            <View style={styles.noHistoryContainer}>
              <Text style={styles.noHistoryText}>No transfer history available</Text>
              <Text style={styles.noHistorySubtext}>Your transfer requests will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Transfer Request Modal */}
      <Modal
        visible={showTransferModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Transfer</Text>
            <Text style={styles.modalSubtitle}>
              Transfer from wallet to bank balance
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.amountInput}
                value={transferAmount}
                onChangeText={setTransferAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTransferModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, isLoading && styles.disabledButton]}
                onPress={handleTransferRequest}
                disabled={isLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {isLoading ? 'Processing...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
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
    color: '#E2E8F0',
    marginBottom: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalBalanceCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  totalBalanceLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 8,
  },
  totalBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  historyContainer: {
    marginBottom: 32,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyAmount: {
    flex: 1,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  noHistoryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  noHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noHistorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1E40AF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});
