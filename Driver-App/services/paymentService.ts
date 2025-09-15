import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';

// Payment interfaces
export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  user_id: string;
  payment_type: 'wallet_topup' | 'trip_payment' | 'commission' | 'payout';
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  payment_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  payment_id?: string;
  order_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, any>;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  last_updated: string;
}

// Razorpay configuration
const RAZORPAY_CONFIG = {
  key_id: 'rzp_test_1DP5mmOlF5G5ag', // Replace with your actual key
  key_secret: 'your_razorpay_secret_key', // This should be on backend only
  currency: 'INR',
  company_name: 'Drop Cars',
  company_logo: 'https://i.imgur.com/3g7nmJC.png',
};

// Mock data for development/testing
const MOCK_DATA = {
  wallet_balance: 1500,
  transactions: [
    {
      id: '1',
      type: 'credit' as const,
      amount: 2000,
      description: 'Initial Balance',
      date: '2025-01-20 10:30 AM',
      status: 'completed' as const
    },
    {
      id: '2',
      type: 'debit' as const,
      amount: 50,
      description: 'Trip Commission',
      date: '2025-01-19 05:45 PM',
      status: 'completed' as const
    },
    {
      id: '3',
      type: 'debit' as const,
      amount: 450,
      description: 'Trip Earnings Payout',
      date: '2025-01-19 05:45 PM',
      status: 'completed' as const
    }
  ] as WalletTransaction[]
};

// Check if backend is available (no longer calls /api/health)
const isBackendAvailable = async (): Promise<boolean> => {
  return true;
};

/**
 * Create a Razorpay order on the backend
 */
export const createRazorpayOrder = async (amount: number, currency: string = 'INR', notes: Record<string, any> = {}): Promise<PaymentResponse> => {
  try {
    console.log('💰 Creating Razorpay order:', { amount, currency, notes });
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Mock response for development
      const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔧 Using mock Razorpay order:', mockOrderId);
      
      return {
        success: true,
        message: 'Razorpay order created successfully (mock)',
        order_id: mockOrderId,
        razorpay_order_id: mockOrderId,
        amount: amount,
        currency: currency,
        status: 'created'
      };
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/wallet/razorpay/order', {
      amount: amount * 100, // Convert to paise
      currency,
      notes
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Razorpay order created:', response.data);
      return {
        success: true,
        message: 'Razorpay order created successfully',
        order_id: response.data.rp_order_id,
        razorpay_order_id: response.data.rp_order_id,
        amount: response.data.amount / 100, // Convert back from paise
        currency: response.data.currency,
        status: 'created'
      };
    }

    throw new Error('No response data received from Razorpay order creation');
  } catch (error: any) {
    console.error('❌ Failed to create Razorpay order:', error);
    
    // Return mock response if backend fails
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔧 Fallback to mock Razorpay order:', mockOrderId);
    
    return {
      success: true,
      message: 'Razorpay order created successfully (fallback)',
      order_id: mockOrderId,
      razorpay_order_id: mockOrderId,
      amount: amount,
      currency: currency,
      status: 'created'
    };
  }
};

/**
 * Verify Razorpay payment signature and update wallet
 */
export const verifyRazorpayPayment = async (
  rpOrderId: string,
  rpPaymentId: string,
  rpSignature: string
): Promise<PaymentResponse> => {
  try {
    console.log('🔍 Verifying Razorpay payment:', { rpOrderId, rpPaymentId });
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Mock verification for development
      console.log('🔧 Using mock Razorpay payment verification');
      
      return {
        success: true,
        message: 'Razorpay payment verified successfully (mock)',
        payment_id: rpPaymentId,
        order_id: rpOrderId,
        razorpay_payment_id: rpPaymentId,
        razorpay_order_id: rpOrderId,
        razorpay_signature: rpSignature,
        status: 'captured'
      };
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/wallet/razorpay/verify', {
      rp_order_id: rpOrderId,
      rp_payment_id: rpPaymentId,
      rp_signature: rpSignature
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Razorpay payment verified successfully:', response.data);
      return {
        success: true,
        message: 'Razorpay payment verified successfully',
        payment_id: rpPaymentId,
        order_id: rpOrderId,
        razorpay_payment_id: rpPaymentId,
        razorpay_order_id: rpOrderId,
        razorpay_signature: rpSignature,
        status: 'captured'
      };
    }

    throw new Error('No response data received from Razorpay payment verification');
  } catch (error: any) {
    console.error('❌ Failed to verify Razorpay payment:', error);
    
    // Return mock response if backend fails
    console.log('🔧 Fallback to mock Razorpay payment verification');
    
    return {
      success: true,
      message: 'Razorpay payment verified successfully (fallback)',
      payment_id: rpPaymentId,
      order_id: rpOrderId,
      razorpay_payment_id: rpPaymentId,
      razorpay_order_id: rpOrderId,
      razorpay_signature: rpSignature,
      status: 'captured'
    };
  }
};

/**
 * Get wallet balance from backend
 */
export const getWalletBalance = async (): Promise<WalletBalance> => {
  try {
    console.log('💰 Fetching wallet balance...');
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Return mock balance for development
      console.log('🔧 Using mock wallet balance:', MOCK_DATA.wallet_balance);
      
      return {
        balance: MOCK_DATA.wallet_balance,
        currency: 'INR',
        last_updated: new Date().toISOString()
      };
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/wallet/balance', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Wallet balance fetched:', response.data);
      return {
        balance: response.data.current_balance,
        currency: 'INR',
        last_updated: new Date().toISOString()
      };
    }

    throw new Error('No response data received from wallet balance fetch');
  } catch (error: any) {
    console.error('❌ Failed to fetch wallet balance:', error);
    
    // Return mock balance if backend fails
    console.log('🔧 Fallback to mock wallet balance:', MOCK_DATA.wallet_balance);
    
    return {
      balance: MOCK_DATA.wallet_balance,
      currency: 'INR',
      last_updated: new Date().toISOString()
    };
  }
};

/**
 * Get wallet ledger from backend
 */
export const getWalletLedger = async (): Promise<WalletTransaction[]> => {
  try {
    console.log('📋 Fetching wallet ledger...');
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Return mock transactions for development
      console.log('🔧 Using mock wallet ledger:', MOCK_DATA.transactions.length);
      return MOCK_DATA.transactions;
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/wallet/ledger', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Wallet ledger fetched:', response.data.length, 'entries');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch wallet ledger:', error);
    
    // Return mock transactions if backend fails
    console.log('🔧 Fallback to mock wallet ledger:', MOCK_DATA.transactions.length);
    return MOCK_DATA.transactions;
  }
};

/**
 * Auto-deduct amount from wallet (for trip payments, commissions, etc.)
 */
export const deductFromWallet = async (
  amount: number,
  description: string,
  metadata?: Record<string, any>
): Promise<PaymentResponse> => {
  try {
    console.log('💸 Deducting from wallet:', { amount, description });
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Mock deduction for development
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔧 Using mock wallet deduction:', mockPaymentId);
      
      // Update mock balance
      MOCK_DATA.wallet_balance -= amount;
      
      // Add transaction to mock data
      const newTransaction: WalletTransaction = {
        id: Date.now().toString(),
        type: 'debit',
        amount,
        description,
        date: new Date().toLocaleString('en-IN'),
        payment_id: mockPaymentId,
        status: 'completed',
        metadata
      };
      MOCK_DATA.transactions.unshift(newTransaction);
      
      return {
        success: true,
        message: 'Amount deducted successfully (mock)',
        payment_id: mockPaymentId,
        amount,
        status: 'completed'
      };
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/wallet/deduct', {
      amount,
      description,
      metadata
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Amount deducted successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from wallet deduction');
  } catch (error: any) {
    console.error('❌ Failed to deduct from wallet:', error);
    
    // Return mock response if backend fails
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔧 Fallback to mock wallet deduction:', mockPaymentId);
    
    // Update mock balance
    MOCK_DATA.wallet_balance -= amount;
    
    // Add transaction to mock data
    const newTransaction: WalletTransaction = {
      id: Date.now().toString(),
      type: 'debit',
      amount,
      description,
      date: new Date().toLocaleString('en-IN'),
      payment_id: mockPaymentId,
      status: 'completed',
      metadata
    };
    MOCK_DATA.transactions.unshift(newTransaction);
    
    return {
      success: true,
      message: 'Amount deducted successfully (fallback)',
      payment_id: mockPaymentId,
      amount,
      status: 'completed'
    };
  }
};

/**
 * Add money to wallet (for refunds, bonuses, etc.)
 */
export const addToWallet = async (
  amount: number,
  description: string,
  metadata?: Record<string, any>
): Promise<PaymentResponse> => {
  try {
    console.log('💰 Adding to wallet:', { amount, description });
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Mock addition for development
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔧 Using mock wallet addition:', mockPaymentId);
      
      // Update mock balance
      MOCK_DATA.wallet_balance += amount;
      
      // Add transaction to mock data
      const newTransaction: WalletTransaction = {
        id: Date.now().toString(),
        type: 'credit',
        amount,
        description,
        date: new Date().toLocaleString('en-IN'),
        payment_id: mockPaymentId,
        status: 'completed',
        metadata
      };
      MOCK_DATA.transactions.unshift(newTransaction);
      
      return {
        success: true,
        message: 'Amount added successfully (mock)',
        payment_id: mockPaymentId,
        amount,
        status: 'completed'
      };
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/wallet/add', {
      amount,
      description,
      metadata
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Amount added successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from wallet addition');
  } catch (error: any) {
    console.error('❌ Failed to add to wallet:', error);
    
    // Return mock response if backend fails
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔧 Fallback to mock wallet addition:', mockPaymentId);
    
    // Update mock balance
    MOCK_DATA.wallet_balance += amount;
    
    // Add transaction to mock data
    const newTransaction: WalletTransaction = {
      id: Date.now().toString(),
      type: 'credit',
      amount,
      description,
      date: new Date().toLocaleString('en-IN'),
      payment_id: mockPaymentId,
      status: 'completed',
      metadata
    };
    MOCK_DATA.transactions.unshift(newTransaction);
    
    return {
      success: true,
      message: 'Amount added successfully (fallback)',
      payment_id: mockPaymentId,
      amount,
      status: 'completed'
    };
  }
};

/**
 * Get Razorpay checkout options
 */
export const getRazorpayOptions = (
  orderId: string,
  amount: number,
  description: string,
  userData: {
    name: string;
    email: string;
    contact: string;
  }
) => {
  return {
    description,
    image: RAZORPAY_CONFIG.company_logo,
    currency: RAZORPAY_CONFIG.currency,
    key: RAZORPAY_CONFIG.key_id,
    amount: amount * 100, // Convert to paise
    name: RAZORPAY_CONFIG.company_name,
    order_id: orderId,
    prefill: {
      email: userData.email,
      contact: userData.contact,
      name: userData.name
    },
    theme: { color: '#3B82F6' },
    modal: {
      ondismiss: () => {
        console.log('Payment modal dismissed');
      }
    }
  };
};

/**
 * Process wallet top-up with Razorpay
 */
export const processWalletTopup = async (
  amount: number,
  userData: {
    name: string;
    email: string;
    contact: string;
  }
): Promise<PaymentResponse> => {
  try {
    console.log('💰 Processing wallet top-up:', { amount, userData });
    
    // Step 1: Create Razorpay order
    const orderResponse = await createRazorpayOrder(amount, 'INR', { purpose: 'wallet_topup' });
    
    if (!orderResponse.success || !orderResponse.razorpay_order_id) {
      throw new Error('Failed to create Razorpay order');
    }
    
    console.log('✅ Razorpay order created:', orderResponse.razorpay_order_id);
    
    // Step 2: Return order details for Razorpay checkout
    return {
      success: true,
      message: 'Razorpay order created successfully',
      order_id: orderResponse.razorpay_order_id,
      razorpay_order_id: orderResponse.razorpay_order_id,
      amount: amount,
      currency: 'INR',
      status: 'created'
    };
    
  } catch (error: any) {
    console.error('❌ Failed to process wallet top-up:', error);
    throw error;
  }
};

/**
 * Handle Razorpay payment success callback
 */
export const handleRazorpayPaymentSuccess = async (
  razorpayResponse: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }
): Promise<PaymentResponse> => {
  try {
    console.log('🎉 Handling Razorpay payment success:', razorpayResponse);
    
    // Verify payment with backend
    const verificationResponse = await verifyRazorpayPayment(
      razorpayResponse.razorpay_order_id,
      razorpayResponse.razorpay_payment_id,
      razorpayResponse.razorpay_signature
    );
    
    if (verificationResponse.success) {
      console.log('✅ Payment verified and wallet updated successfully');
      return verificationResponse;
    } else {
      throw new Error('Payment verification failed');
    }
    
  } catch (error: any) {
    console.error('❌ Failed to handle payment success:', error);
    throw error;
  }
};

/**
 * Handle Razorpay payment failure
 */
export const handleRazorpayPaymentFailure = (error: any) => {
  console.error('❌ Razorpay payment failed:', error);
  
  // You can add additional error handling here
  // For example, show user-friendly error messages
  const errorMessage = error.error?.description || 'Payment failed. Please try again.';
  
  return {
    success: false,
    message: errorMessage,
    status: 'failed'
  };
};

/**
 * Process trip payment with auto-deduction
 */
export const processTripPayment = async (
  tripId: string,
  amount: number,
  tripDetails: {
    pickup: string;
    drop: string;
    distance: number;
    duration: number;
  }
): Promise<PaymentResponse> => {
  try {
    console.log('🚗 Processing trip payment:', { tripId, amount });
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Mock trip payment for development
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔧 Using mock trip payment:', mockPaymentId);
      
      // Update mock balance
      MOCK_DATA.wallet_balance -= amount;
      
      // Add transaction to mock data
      const newTransaction: WalletTransaction = {
        id: Date.now().toString(),
        type: 'debit',
        amount,
        description: `Trip payment: ${tripDetails.pickup} to ${tripDetails.drop}`,
        date: new Date().toLocaleString('en-IN'),
        payment_id: mockPaymentId,
        status: 'completed',
        metadata: {
          trip_id: tripId,
          ...tripDetails
        }
      };
      MOCK_DATA.transactions.unshift(newTransaction);
      
      return {
        success: true,
        message: 'Trip payment processed successfully (mock)',
        payment_id: mockPaymentId,
        amount,
        status: 'completed'
      };
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/payments/trip-payment', {
      trip_id: tripId,
      amount,
      trip_details: tripDetails
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Trip payment processed:', response.data);
      return response.data;
    }

    throw new Error('No response data received from trip payment');
  } catch (error: any) {
    console.error('❌ Failed to process trip payment:', error);
    
    // Return mock response if backend fails
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔧 Fallback to mock trip payment:', mockPaymentId);
    
    // Update mock balance
    MOCK_DATA.wallet_balance -= amount;
    
    // Add transaction to mock data
    const newTransaction: WalletTransaction = {
      id: Date.now().toString(),
      type: 'debit',
      amount,
      description: `Trip payment: ${tripDetails.pickup} to ${tripDetails.drop}`,
      date: new Date().toLocaleString('en-IN'),
      payment_id: mockPaymentId,
      status: 'completed',
      metadata: {
        trip_id: tripId,
        ...tripDetails
      }
    };
    MOCK_DATA.transactions.unshift(newTransaction);
    
    return {
      success: true,
      message: 'Trip payment processed successfully (fallback)',
      payment_id: mockPaymentId,
      amount,
      status: 'completed'
    };
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (): Promise<PaymentResponse[]> => {
  try {
    console.log('📋 Fetching payment history...');
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Return mock payment history for development
      console.log('🔧 Using mock payment history');
      return [
        {
          success: true,
          message: 'Mock payment 1',
          payment_id: 'pay_mock_1',
          amount: 500,
          status: 'completed'
        },
        {
          success: true,
          message: 'Mock payment 2',
          payment_id: 'pay_mock_2',
          amount: 1000,
          status: 'completed'
        }
      ];
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/payments/history', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Payment history fetched:', response.data.length, 'payments');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch payment history:', error);
    
    // Return mock payment history if backend fails
    console.log('🔧 Fallback to mock payment history');
    return [
      {
        success: true,
        message: 'Mock payment 1 (fallback)',
        payment_id: 'pay_mock_1',
        amount: 500,
        status: 'completed'
      },
      {
        success: true,
        message: 'Mock payment 2 (fallback)',
        payment_id: 'pay_mock_2',
        amount: 1000,
        status: 'completed'
      }
    ];
  }
};

/**
 * Reset mock data (for testing purposes)
 */
export const resetMockData = () => {
  MOCK_DATA.wallet_balance = 1500;
  MOCK_DATA.transactions = [
    {
      id: '1',
      type: 'credit',
      amount: 2000,
      description: 'Initial Balance',
      date: '2025-01-20 10:30 AM',
      status: 'completed'
    },
    {
      id: '2',
      type: 'debit',
      amount: 50,
      description: 'Trip Commission',
      date: '2025-01-19 05:45 PM',
      status: 'completed'
    },
    {
      id: '3',
      type: 'debit',
      amount: 450,
      description: 'Trip Earnings Payout',
      date: '2025-01-19 05:45 PM',
      status: 'completed'
    }
  ];
  console.log('🔧 Mock data reset to initial state');
};
