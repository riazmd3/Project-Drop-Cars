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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle, Copy, X, CreditCard } from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { getRazorpayOptions } from '@/services/payment/paymentService';

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
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // QR modal state
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Razorpay amount input modal state
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [razorpayAmount, setRazorpayAmount] = useState('');
  const [processingRazorpay, setProcessingRazorpay] = useState(false);

  const handleUPICopy = () => {
    const upiId = '7200217986-1@okbizaxis';
    try {
      Clipboard.setString(upiId);
      Alert.alert('Copied!', 'UPI ID copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      Alert.alert('Error', 'Failed to copy UPI ID');
    }
  };

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  const handleRazorpayPayment = async () => {
    const amount = parseFloat(razorpayAmount);
    
    if (!razorpayAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amount < 1) {
      Alert.alert('Invalid Amount', 'Minimum amount is ₹1');
      return;
    }

    if (!RazorpayCheckout) {
      Alert.alert('Error', 'Razorpay is not available on this platform');
      return;
    }

    try {
      setProcessingRazorpay(true);
      setShowAmountModal(false);

      // Get user data for Razorpay
      const userData = {
        name: user?.fullName || 'User',
        email: (user as any)?.email || `${user?.primaryMobile || 'user'}@dropcars.in`,
        contact: user?.primaryMobile || '9999999999'
      };

      console.log('💰 Starting Razorpay payment for amount:', amount);
      
      // Create Razorpay order
      const orderResponse = await processTopup(amount, userData);
      
      if (!orderResponse.success || !orderResponse.razorpay_order_id) {
        throw new Error('Failed to create Razorpay order');
      }

      // Get Razorpay options
      const options = getRazorpayOptions(
        orderResponse.razorpay_order_id,
        amount * 100, // Convert to paise
        'Wallet Top-up',
        userData
      );

      console.log('🔧 Opening Razorpay checkout with options:', options);

      // Open Razorpay checkout
      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          console.log('✅ Razorpay payment success:', data);
          
          // Handle payment success
          await handlePaymentSuccess({
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature
          });

          // Refresh wallet data
          await refreshBalance();
          await refreshTransactions();

          Alert.alert('Success', `₹${amount} added to your wallet successfully!`);
          setRazorpayAmount('');
        })
        .catch(async (error: any) => {
          console.error('❌ Razorpay payment error:', error);
          
          // Handle payment failure
          handlePaymentFailure(error);
          
          if (error.error?.code === 'BAD_REQUEST_ERROR') {
            Alert.alert('Payment Failed', error.error?.description || 'Invalid payment details');
          } else if (error.error?.code === 'NETWORK_ERROR') {
            Alert.alert('Network Error', 'Please check your internet connection and try again');
          } else if (error.error?.code !== 'PAYMENT_CANCELLED') {
            Alert.alert('Payment Failed', error.error?.description || 'Payment could not be processed');
          }
        });
    } catch (error: any) {
      console.error('❌ Error processing Razorpay payment:', error);
      Alert.alert('Error', error.message || 'Failed to process payment. Please try again.');
    } finally {
      setProcessingRazorpay(false);
    }
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

        {/* Add Money Buttons Section */}
        <View style={{ marginTop: 24, gap: 12 }}>
          {/* Add Money via UPI Button - Opens QR Code Modal */}
          <TouchableOpacity 
            style={[dynamicStyles.addMoneyButton, { paddingHorizontal: 24, backgroundColor: colors.primary }]}
            onPress={handleShowQR}
          >
            <Text style={dynamicStyles.addMoneyButtonText}>Add Money via UPI</Text>
            <Copy color="#FFFFFF" size={20} style={{ marginLeft: 10 }} />
          </TouchableOpacity>

          {/* Add Money via Razorpay Button */}
          <TouchableOpacity 
            style={[dynamicStyles.addMoneyButton, { paddingHorizontal: 24, backgroundColor: colors.success }]}
            onPress={() => setShowAmountModal(true)}
            disabled={processingRazorpay}
          >
            <Text style={dynamicStyles.addMoneyButtonText}>Add Money</Text>
            <CreditCard color="#FFFFFF" size={20} style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>

        {/* QR Code Modal */}
        <Modal
          visible={showQRModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQRModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: colors.background, borderRadius: 20, padding: 24, width: '90%', maxWidth: 400, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.text }}>Scan QR Code to Pay</Text>
                <TouchableOpacity 
                  onPress={() => setShowQRModal(false)}
                  style={{ padding: 4 }}
                >
                  <X color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              
              <View style={{ width: 280, height: 280, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                <Image 
                  source={require('../../assets/images/Qrcodepay.jpeg')}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error('QR Code image load error:', error);
                  }}
                />
              </View>
              
              <View style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontFamily: 'Inter-Medium', color: colors.textSecondary, marginBottom: 8 }}>UPI ID:</Text>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}
                  onPress={handleUPICopy}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16, fontFamily: 'Inter-Bold', color: colors.primary, textAlign: 'center' }}>7200217986-1@okbizaxis</Text>
                  <Copy color={colors.primary} size={18} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textSecondary }}>Drop Cars</Text>
              </View>
              
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, width: '100%' }}
                onPress={handleUPICopy}
              >
                <Copy color="#FFFFFF" size={18} />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-SemiBold', marginLeft: 8 }}>Copy UPI ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Razorpay Amount Input Modal */}
        <Modal
          visible={showAmountModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAmountModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: colors.background, borderRadius: 20, padding: 24, width: '90%', maxWidth: 400 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontFamily: 'Inter-Bold', color: colors.text }}>Add Money</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowAmountModal(false);
                    setRazorpayAmount('');
                  }}
                  style={{ padding: 4 }}
                  disabled={processingRazorpay}
                >
                  <X color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              
              <Text style={{ fontSize: 14, fontFamily: 'Inter-Medium', color: colors.textSecondary, marginBottom: 12 }}>
                Enter amount to add to your wallet
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 18, fontFamily: 'Inter-Bold', color: colors.text }}>₹</Text>
                <TextInput
                  style={{ flex: 1, marginLeft: 10, fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text }}
                  value={razorpayAmount}
                  onChangeText={(text) => {
                    // Allow only numbers and one decimal point
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = cleaned.split('.');
                    if (parts.length > 2) return;
                    setRazorpayAmount(cleaned);
                  }}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  editable={!processingRazorpay}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[100, 500, 1000, 2000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 10, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => setRazorpayAmount(amt.toString())}
                    disabled={processingRazorpay}
                  >
                    <Text style={{ textAlign: 'center', fontSize: 14, fontFamily: 'Inter-SemiBold', color: colors.text }}>₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: colors.success, 
                  borderRadius: 12, 
                  paddingVertical: 14, 
                  marginTop: 20,
                  opacity: processingRazorpay ? 0.7 : 1
                }}
                onPress={handleRazorpayPayment}
                disabled={processingRazorpay}
              >
                {processingRazorpay ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-SemiBold', marginLeft: 8 }}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <CreditCard color="#FFFFFF" size={18} />
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter-SemiBold', marginLeft: 8 }}>Proceed to Pay</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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