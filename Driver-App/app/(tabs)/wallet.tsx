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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { IndianRupee, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle } from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { 
  createPaymentOrder, 
  verifyPayment, 
  getRazorpayOptions,
  PaymentRequest 
} from '@/services/paymentService';

export default function WalletScreen() {
  const { 
    balance, 
    addMoney, 
    transactions, 
    loading, 
    error, 
    refreshBalance, 
    refreshTransactions,
    syncWithBackend 
  } = useWallet();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [addAmount, setAddAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const quickAmounts = [100, 500, 1000, 2000];

  // Refresh wallet data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshBalance(), refreshTransactions()]);
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle wallet top-up with Razorpay
  const handleAddMoney = async (amount: number) => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not available. Please login again.');
      return;
    }

    try {
      setPaymentLoading(true);
      
      console.log('💰 Starting wallet top-up process:', { amount, userId: user.id });

      // Create payment order on backend
      const paymentRequest: PaymentRequest = {
        amount,
        currency: 'INR',
        description: `Wallet top-up of ₹${amount}`,
        user_id: user.id,
        payment_type: 'wallet_topup',
        metadata: {
          user_name: user.fullName,
          user_mobile: user.primaryMobile
        }
      };

      const orderResponse = await createPaymentOrder(paymentRequest);
      
      if (!orderResponse.success || !orderResponse.order_id) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      console.log('✅ Payment order created:', orderResponse);

      // Prepare Razorpay options
      const razorpayOptions = getRazorpayOptions(
        orderResponse.order_id,
        amount,
        `Wallet top-up of ₹${amount}`,
        {
          name: user.fullName || 'Driver',
          email: `${user.primaryMobile}@dropcars.com`, // Fallback email
          contact: user.primaryMobile
        }
      );

      console.log('🔧 Razorpay options:', razorpayOptions);

      // Open Razorpay checkout
      const paymentData = await RazorpayCheckout.open(razorpayOptions);
      
      console.log('✅ Payment successful:', paymentData);

      // Verify payment with backend
      const verificationResponse = await verifyPayment(
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id,
        paymentData.razorpay_signature
      );

      if (verificationResponse.success) {
        // Add money to wallet
        await addMoney(amount, `Wallet top-up via Razorpay`, {
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          payment_method: 'razorpay'
        });

        Alert.alert(
          'Payment Successful! 🎉',
          `₹${amount} has been added to your wallet successfully.\n\nPayment ID: ${paymentData.razorpay_payment_id}`,
          [{ text: 'OK' }]
        );
        
        setAddAmount('');
      } else {
        throw new Error(verificationResponse.message || 'Payment verification failed');
      }

    } catch (error: any) {
      console.error('❌ Payment failed:', error);
      
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.code === 'PAYMENT_CANCELLED') {
        errorMessage = 'Payment was cancelled by the user.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('verification failed')) {
        errorMessage = 'Payment verification failed. Please contact support.';
      } else if (error.message.includes('order creation failed')) {
        errorMessage = 'Unable to create payment order. Please try again.';
      }
      
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setPaymentLoading(false);
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
    transactionStatus: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      marginTop: 2,
    },
    transactionAmount: {
      fontSize: 16,
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

  const TransactionCard = ({ transaction }: { transaction: any }) => (
    <View style={dynamicStyles.transactionCard}>
      <View style={dynamicStyles.transactionLeft}>
        <View style={[
          dynamicStyles.transactionIcon,
          { backgroundColor: transaction.type === 'credit' ? '#D1FAE5' : '#FEE2E2' }
        ]}>
          {transaction.type === 'credit' ? (
            <ArrowUpRight color={colors.success} size={16} />
          ) : (
            <ArrowDownLeft color={colors.error} size={16} />
          )}
        </View>
        <View style={dynamicStyles.transactionInfo}>
          <Text style={dynamicStyles.transactionTitle}>{transaction.description}</Text>
          <Text style={dynamicStyles.transactionDate}>{transaction.date}</Text>
          {transaction.status && (
            <Text style={[
              dynamicStyles.transactionStatus,
              { 
                color: transaction.status === 'completed' ? colors.success : 
                       transaction.status === 'pending' ? colors.warning : colors.error 
              }
            ]}>
              {transaction.status.toUpperCase()}
            </Text>
          )}
        </View>
      </View>
      <Text style={[
        dynamicStyles.transactionAmount,
        { color: transaction.type === 'credit' ? colors.success : colors.error }
      ]}>
        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Wallet</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Welcome back, {user?.fullName || 'Driver'}!
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
            <Text style={dynamicStyles.balanceAmount}>₹{balance}</Text>
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

        <View style={dynamicStyles.addMoneySection}>
          <Text style={dynamicStyles.sectionTitle}>Add Money</Text>
          
          <View style={dynamicStyles.amountInput}>
            <IndianRupee color={colors.textSecondary} size={20} />
            <TextInput
              style={dynamicStyles.input}
              placeholder="Enter amount"
              value={addAmount}
              onChangeText={setAddAmount}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
              editable={!paymentLoading}
            />
          </View>

          <View style={dynamicStyles.quickAmounts}>
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={dynamicStyles.quickAmountButton}
                onPress={() => setAddAmount(amount.toString())}
                disabled={paymentLoading}
              >
                <Text style={dynamicStyles.quickAmountText}>₹{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              dynamicStyles.addMoneyButton,
              { opacity: (addAmount && parseInt(addAmount) > 0 && !paymentLoading) ? 1 : 0.5 }
            ]}
            onPress={() => handleAddMoney(parseInt(addAmount))}
            disabled={!addAmount || parseInt(addAmount) <= 0 || paymentLoading}
          >
            {paymentLoading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={dynamicStyles.addMoneyButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <Plus color="#FFFFFF" size={20} />
                <Text style={dynamicStyles.addMoneyButtonText}>Add Money</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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
          ) : transactions.length === 0 ? (
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