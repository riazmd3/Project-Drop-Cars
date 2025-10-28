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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { IndianRupee, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle } from 'lucide-react-native';
// Import Razorpay with error handling
let RazorpayCheckout: any = null;
try {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    RazorpayCheckout = require('react-native-razorpay').default;
    console.log('✅ Razorpay SDK loaded successfully for', Platform.OS);
  } else {
    console.warn('⚠️ Razorpay SDK only supports Android and iOS, current platform:', Platform.OS);
  }
} catch (error) {
  console.warn('⚠️ Razorpay SDK not available:', error);
  RazorpayCheckout = null;
}
import { 
  processWalletTopup,
  handleRazorpayPaymentSuccess,
  handleRazorpayPaymentFailure,
  getRazorpayOptions
} from '@/services/payment/paymentService';

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
  const [addAmount, setAddAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const quickAmounts = [500, 1000, 2000, 3000];

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

  // Handle wallet top-up with Razorpay
  const handleAddMoney = async (amount: number) => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not available. Please login again.');
      return;
    }

    try {
      setPaymentLoading(true);
      
      console.log('💰 Starting wallet top-up process:', { amount, userId: user.id });

      // Step 1: Create Razorpay order using the new API
      const orderResponse = await processTopup(amount, {
        name: user.fullName || 'Driver',
        email: `${user.primaryMobile}@dropcars.com`, // Fallback email 
        contact: user.primaryMobile
      });
      
      if (!orderResponse.success || !orderResponse.razorpay_order_id) {
        throw new Error('Failed to create Razorpay order');
      }

      console.log('✅ Razorpay order created:', orderResponse.razorpay_order_id);

      // Check if Razorpay SDK is available
      if (!RazorpayCheckout) {
        console.log('🔧 Razorpay SDK not available, using mock payment...');
        
        // Simulate successful payment
        const mockPaymentResponse = {
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_order_id: orderResponse.razorpay_order_id,
          razorpay_signature: `mock_signature_${Date.now()}`
        };

        await handlePaymentSuccess(mockPaymentResponse);

        Alert.alert(
          'Payment Successful! 🎉 (Mock)',
          `₹${amount} has been added to your wallet successfully.\n\nNote: Razorpay SDK is not available on this platform, so this is a mock payment for development.\n\nPayment ID: ${mockPaymentResponse.razorpay_payment_id}`,
          [{ text: 'OK' }]
        );
        
        setAddAmount('');
        return;
      }

      // Check if we're using mock data (backend not available)
      if (orderResponse.message.includes('mock') || orderResponse.message.includes('fallback')) {
        // Simulate payment success with mock data
        console.log('🔧 Using mock payment flow');
        
        // Simulate successful payment
        const mockPaymentResponse = {
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_order_id: orderResponse.razorpay_order_id,
          razorpay_signature: `mock_signature_${Date.now()}`
        };

        await handlePaymentSuccess(mockPaymentResponse);

        Alert.alert(
          'Payment Successful! 🎉 (Mock)',
          `₹${amount} has been added to your wallet successfully.\n\nThis is a mock payment for development.\n\nPayment ID: ${mockPaymentResponse.razorpay_payment_id}`,
          [{ text: 'OK' }]
        );
        
        setAddAmount('');
        return;
      }

      // Step 2: Prepare Razorpay options for real payment
      const razorpayOptions = getRazorpayOptions(
        orderResponse.razorpay_order_id,
        amount,
        `Wallet top-up of ₹${amount}`,
        {
          name: user.fullName || 'Driver',
          email: `${user.primaryMobile}@dropcars.com`,
          contact: user.primaryMobile
        }
      );

      console.warn('Razorpay debug: options prepared', {
        hasKey: !!razorpayOptions?.key,
        originalAmount: amount, // rupees entered by user
        razorpayAmount: razorpayOptions?.amount, // amount in paise sent to SDK
        currency: razorpayOptions?.currency,
        orderId: razorpayOptions?.order_id,
        platform: Platform.OS
      });

      // Step 3: Open Razorpay checkout
      console.log('🔧 Opening Razorpay checkout...');
      
      // Check if RazorpayCheckout is available
      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        throw new Error('Razorpay SDK not available. Using mock payment instead.');
      }
      
      const paymentData = await RazorpayCheckout.open(razorpayOptions);
      
      // Check if payment data is valid
      if (!paymentData || !paymentData.razorpay_payment_id) {
        throw new Error('Payment data is invalid or payment was cancelled.');
      }
      
      console.log('✅ Payment successful:', paymentData);

      // Step 4: Handle payment success
      await handlePaymentSuccess(paymentData);

      Alert.alert(
        'Payment Successful! 🎉',
        `₹${amount} has been added to your wallet successfully.\n\nPayment ID: ${paymentData.razorpay_payment_id}`,
        [{ text: 'OK' }]
      );
      
      setAddAmount('');

    } catch (error: any) {
      console.error('❌ Payment failed:', error);

      // Razorpay detailed error parsing
      let computedMessage: string | null = null;
      let parsedDetails: any = null;
      try {
        const rawDescription = error?.description || error?.error?.description;
        // rawDescription may already be an object or a JSON string
        if (typeof rawDescription === 'string') {
          try { parsedDetails = JSON.parse(rawDescription); } catch { parsedDetails = null; }
        } else if (rawDescription && typeof rawDescription === 'object') {
          parsedDetails = rawDescription;
        }
        const rzpErr = parsedDetails?.error || error?.error || {};
        console.warn('Razorpay debug: failure details', {
          code: rzpErr.code,
          step: rzpErr.step,
          reason: rzpErr.reason,
          source: rzpErr.source,
          description: rzpErr.description,
          metadata: rzpErr.metadata,
        });

        // Prefer backend-provided description when available
        if (rzpErr?.description) {
          const pid = rzpErr?.metadata?.payment_id || rzpErr?.metadata?.paymentId;
          const oid = rzpErr?.metadata?.order_id || rzpErr?.metadata?.orderId;
          computedMessage = `${rzpErr.description}${pid || oid ? `\n\nPayment ID: ${pid || '-'}\nOrder ID: ${oid || '-'}` : ''}`;
        } else if (rzpErr.code === 'BAD_REQUEST_ERROR' || rzpErr.reason === 'payment_error' || rzpErr.reason === 'payment_failed') {
          computedMessage = 'Payment failed. Please try again.';
        }
      } catch (parseErr) {
        console.warn('Razorpay debug: could not parse error description JSON', parseErr);
      }
      
      // Check if it's a Razorpay SDK issue and offer fallback
      if (error.message.includes('Razorpay SDK not available') || 
          error.message.includes('Cannot read property \'open\' of null')) {
        
        console.log('🔧 Razorpay SDK not available, using mock payment fallback...');
        
        try {
          // Use mock payment as fallback
          // Use mock payment as fallback
          const mockPaymentResponse = {
            razorpay_payment_id: `mock_pay_${Date.now()}`,
            razorpay_order_id: `mock_order_${Date.now()}`,
            razorpay_signature: `mock_signature_${Date.now()}`
          };

          await handlePaymentSuccess(mockPaymentResponse);

          Alert.alert(
            'Payment Successful! 🎉 (Mock)',
            `₹${amount} has been added to your wallet successfully.\n\nNote: Razorpay SDK is not available, so this is a mock payment for development.\n\nPayment ID: ${mockPaymentResponse.razorpay_payment_id}`,
            [{ text: 'OK' }]
          );
          
          setAddAmount('');
          return;
        } catch (fallbackError: any) {
          console.error('❌ Mock payment fallback also failed:', fallbackError);
          Alert.alert('Payment Failed', 'Both Razorpay and mock payment failed. Please try again later.');
          return;
        }
      }
      
      // Handle other payment failures
      handlePaymentFailure(error);
      
      let errorMessage = computedMessage || 'Payment failed. Please try again.';
      
      if (error.code === 'PAYMENT_CANCELLED') {
        errorMessage = 'Payment was cancelled by the user.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection. If the issue persists, contact our team at 7092959900 for payment verification.';
      } else if (error.message.includes('verification failed')) {
        errorMessage = 'Payment verification failed. Please contact our team at 7092959900 for payment verification.';
      } else if (error.message.includes('order creation failed')) {
        errorMessage = 'Unable to create payment order. Please try again.';
      } else if (error.message.includes('Payment data is invalid')) {
        errorMessage = 'Payment was cancelled or failed. Please try again.';
      } else if (error?.error?.reason === 'payment_cancelled') {
        errorMessage = 'UPI app cancelled the payment or timed out. Please retry.';
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
                color: isCredit ? colors.success : colors.error,
                backgroundColor: isCredit ? '#D1FAE5' : '#FEE2E2'
              }
            ]}>
              {transaction.entry_type}
            </Text>
          </View>
        </View>
        <Text style={[
          dynamicStyles.transactionAmount,
          { color: isCredit ? colors.success : colors.error }
        ]}>
          {isCredit ? '+' : '-'}₹{transaction.amount}
        </Text>
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

        <View style={dynamicStyles.addMoneySection}>
          <Text style={dynamicStyles.sectionTitle}>Add Money</Text>
          
          {/* Network Issue Fallback Info */}
          <View style={[dynamicStyles.networkInfoBanner]}>
            <AlertCircle color="#FFFFFF" size={18} />
            <Text style={dynamicStyles.networkInfoText}>
              If any network issue occurs in Razorpay payment, kindly use this number to GPay and call to verify the payment ID with our team: 
              <Text style={dynamicStyles.contactNumber}> 7092959900</Text>
            </Text>
          </View>
          
          <View style={dynamicStyles.amountInput}>
            <IndianRupee color={colors.textSecondary} size={20} />
            <TextInput
              style={dynamicStyles.input}
              placeholder="Enter amount"
              value={addAmount}
              onChangeText={(text) => {
                // Allow only numbers (integers only)
                const cleanText = text.replace(/[^0-9]/g, '');
                setAddAmount(cleanText);
              }}
              keyboardType="number-pad"
              placeholderTextColor={colors.textSecondary}
              editable={!paymentLoading}
              autoFocus={false}
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