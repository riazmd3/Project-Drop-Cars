import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { IndianRupee, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle } from 'lucide-react-native';
import { Linking } from 'react-native';
// import { 
//   processWalletTopup,
//   handleRazorpayPaymentSuccess,
//   handleRazorpayPaymentFailure,
//   getRazorpayOptions
// } from '@/services/payment/paymentService';
//
// let RazorpayCheckout: any = null;
// try {
//   if (Platform.OS === 'android' || Platform.OS === 'ios') {
//     RazorpayCheckout = require('react-native-razorpay').default;
//     console.log('✅ Razorpay SDK loaded successfully for', Platform.OS);
//   } else {
//     console.warn('⚠️ Razorpay SDK only supports Android and iOS, current platform:', Platform.OS);
//   }
// } catch (error) {
//   console.warn('⚠️ Razorpay SDK not available:', error);
//   RazorpayCheckout = null;
// }

export default function WalletScreen() {
  const router = useRouter();
  const { 
    balance, 
    transactions, 
    loading, 
    error, 
    refreshBalance, 
    refreshTransactions,
    processWalletTopup: processTopup,
    handlePaymentSuccess,
    handlePaymentFailure,
    syncWithBackend 
  } = useWallet();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Manual UPI modal state
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [upiAmount, setUpiAmount] = useState('');
  const [upiError, setUpiError] = useState('');
  const quickUpiAmounts = [500, 1000, 2000, 3000];

  const handleUPIPayment = (amountValue: string | number) => {
    const amt = String(amountValue).trim();
    if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) {
      setUpiError('Enter a valid amount');
      return;
    }
    setUpiError('');
    setUpiModalVisible(false);
    // UPI ID as mobile number
    const upiBase = 'upi://pay';
    const params = [
      `pa=9500820541@axl`, // UPI ID or mobile
      `pn=DropCars`,
      `am=${amt}`,
      `cu=INR`
    ].join('&');
    const upiUrl = `${upiBase}?${params}`;
    Linking.openURL(upiUrl).catch(() => {
      Alert.alert('Error', 'No UPI app found. Please install a UPI payment app.');
    });
  };

  // Refresh wallet data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshBalance(), refreshTransactions()]);
    } catch (error: any) {
      console.error('❌ Refresh failed:', error);
      
      // Handle authentication errors
      if (error.message?.includes('No authentication token found') || 
          error.message?.includes('Authentication failed') || 
          error.message?.includes('401')) {
        console.log('🔐 Authentication error detected, redirecting to login');
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      }
    } finally {
      setRefreshing(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    balanceCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 24,
      marginTop: 20,
      alignItems: 'center',
    },
    balanceLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: '#E5E7EB',
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
    },
    lowBalanceWarning: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
    },
    warningText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    errorBanner: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 8,
      padding: 12,
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.error,
      marginLeft: 8,
    },
    networkInfoBanner: {
      backgroundColor: '#3B82F6',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    networkInfoText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
      flex: 1,
      marginLeft: 12,
      lineHeight: 20,
    },
    contactNumber: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: '#FEF3C7',
      fontWeight: 'bold',
    },
    addMoneySection: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    amountInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    quickAmounts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    quickAmountButton: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      minWidth: '48%',
    },
    quickAmountText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
    },
    addMoneyButton: {
      backgroundColor: colors.success,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addMoneyButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 8,
    },
    loadingButton: {
      opacity: 0.7,
    },
    transactionsSection: {
      marginTop: 24,
      marginBottom: 20,
    },
    transactionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionTitle: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    transactionDate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 2,
    },
    transactionTime: {
      fontSize: 11,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 1,
    },
    transactionStatus: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      marginTop: 2,
    },
    transactionAmountContainer: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
    transactionAmount: {
      fontSize: 15,
      fontFamily: 'Inter-Bold',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
  });

  // Helper function to format date and time
  const formatTransactionDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Format date (e.g., "Dec 15, 2024")
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      // Format time with AM/PM (e.g., "2:30 PM")
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      return { date: formattedDate, time: formattedTime };
    } catch (error) {
      console.warn('Failed to format date:', dateString, error);
      return { date: 'Invalid Date', time: 'Invalid Time' };
    }
  };

  const TransactionCard = ({ transaction }: { transaction: any }) => {
    const isCredit = transaction.entry_type === 'CREDIT';
    const isDebit = transaction.entry_type === 'DEBIT';
    
    const { date, time } = formatTransactionDateTime(transaction.created_at || transaction.date);
    
    return (
      <View style={dynamicStyles.transactionCard}>
        <View style={dynamicStyles.transactionLeft}>
          <View style={[
            dynamicStyles.transactionIcon,
            { backgroundColor: isCredit ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            {isCredit ? (
              <ArrowUpRight color={colors.success} size={16} />
            ) : (
              <ArrowDownLeft color={colors.error} size={16} />
            )}
          </View>
          <View style={dynamicStyles.transactionInfo}>
            <Text style={dynamicStyles.transactionTitle}>{transaction.notes || transaction.description}</Text>
            <Text style={dynamicStyles.transactionDate}>{date}</Text>
            <Text style={dynamicStyles.transactionTime}>{time}</Text>
            <Text style={[
              dynamicStyles.transactionStatus,
              { 
                color: isCredit ? colors.success : colors.error
              }
            ]}>
              {transaction.entry_type}
            </Text>
          </View>
        </View>
        <View style={[
          dynamicStyles.transactionAmountContainer,
          { backgroundColor: isCredit ? '#D1FAE5' : '#FEE2E2' }
        ]}>
          <Text style={[
            dynamicStyles.transactionAmount,
            { color: isCredit ? colors.success : colors.error }
          ]}>
            {isCredit ? '+' : '-'}₹{transaction.amount}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Wallet</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Welcome back, {user?.fullName || 'Vehicle Owner'}!
        </Text>
      </View>

      <ScrollView 
        style={dynamicStyles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={dynamicStyles.balanceCard}>
          <Text style={dynamicStyles.balanceLabel}>Available Balance</Text>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <Text style={dynamicStyles.balanceAmount}>₹{Math.round(Number(balance) || 0)}</Text>
          )}
          {balance < 1000 && (
            <View style={dynamicStyles.lowBalanceWarning}>
              <Text style={dynamicStyles.warningText}>
                Balance below ₹1000. Add money to receive bookings.
              </Text>
            </View>
          )}
        </View>

        {error && (
          <View style={dynamicStyles.errorBanner}>
            <AlertCircle color={colors.error} size={16} />
            <Text style={dynamicStyles.errorText}>{error}</Text>
          </View>
        )}

        {/* Add Money with UPI Button and Modal */}
        <TouchableOpacity style={{ marginTop: 24, alignSelf: 'center', backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }} onPress={() => { setUpiError(''); setUpiAmount(''); setUpiModalVisible(true); }}>
          <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Inter-SemiBold', marginRight: 10 }}>Tap to Add Money</Text>
          <Plus color="#FFF" size={20} />
        </TouchableOpacity>
        <Modal
          visible={upiModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setUpiModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24 }}>
              <Text style={[dynamicStyles.sectionTitle, { marginBottom: 10, textAlign: 'center' }]}>Add Money via UPI</Text>
              <Text style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 22 }}>Choose amount or enter custom, then select UPI app to pay to <Text style={{ fontWeight: 'bold', color: colors.primary }}>9500820542</Text></Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                {quickUpiAmounts.map((amt) => (
                  <TouchableOpacity key={amt} style={{ backgroundColor: '#EFF6FF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 2 }} onPress={() => handleUPIPayment(amt)}>
                    <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 22 }}>
                <IndianRupee color={colors.textSecondary} size={20} />
                <TextInput
                  style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.text, paddingVertical: 8, fontFamily: 'Inter-Regular' }}
                  value={upiAmount}
                  onChangeText={setUpiAmount}
                  placeholder="Custom amount"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={7}
                  autoFocus
                />
                <TouchableOpacity onPress={() => handleUPIPayment(upiAmount)} style={{ marginLeft: 10, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 16 }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Pay</Text>
                </TouchableOpacity>
              </View>
              {!!upiError && <Text style={{ color: '#EF4444', textAlign: 'center', marginBottom: 8 }}>{upiError}</Text>}
              <TouchableOpacity style={{ alignSelf: 'center', marginTop: 5 }} onPress={() => setUpiModalVisible(false)}>
                <Text style={{ color: colors.primary, fontSize: 15, fontFamily: 'Inter-SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Remove add-money/payment UI & logic. Only show balance and transaction history. */}

        <View style={dynamicStyles.transactionsSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={dynamicStyles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity onPress={refreshTransactions} disabled={loading}>
              <RefreshCw color={colors.primary} size={20} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={dynamicStyles.emptyState}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={dynamicStyles.emptyStateText}>Loading transactions...</Text>
            </View>
          ) : !transactions || transactions.length === 0 ? (
            <View style={dynamicStyles.emptyState}>
              <Text style={dynamicStyles.emptyStateText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}