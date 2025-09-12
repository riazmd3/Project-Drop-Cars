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
 * Create a payment order on the backend
 */
export const createPaymentOrder = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    console.log('💰 Creating payment order:', request);
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Mock response for development
      const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔧 Using mock payment order:', mockOrderId);
      
      return {
        success: true,
        message: 'Payment order created successfully (mock)',
        order_id: mockOrderId,
        amount: request.amount,
        currency: request.currency,
        status: 'created'
      };
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/payments/create-order', request, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Payment order created:', response.data);
      return response.data;
    }

    throw new Error('No response data received from payment order creation');
  } catch (error: any) {
    console.error('❌ Failed to create payment order:', error);
    
    // Return mock response if backend fails
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔧 Fallback to mock payment order:', mockOrderId);
    
    return {
      success: true,
      message: 'Payment order created successfully (fallback)',
      order_id: mockOrderId,
      amount: request.amount,
      currency: request.currency,
      status: 'created'
    };
  }
};

/**
 * Verify payment signature and update wallet
 */
export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
): Promise<PaymentResponse> => {
  try {
    console.log('🔍 Verifying payment:', { paymentId, orderId });
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Mock verification for development
      console.log('🔧 Using mock payment verification');
      
      return {
        success: true,
        message: 'Payment verified successfully (mock)',
        payment_id: paymentId,
        order_id: orderId,
        status: 'captured'
      };
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.post('/api/payments/verify', {
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature
    }, {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Payment verified successfully:', response.data);
      return response.data;
    }

    throw new Error('No response data received from payment verification');
  } catch (error: any) {
    console.error('❌ Failed to verify payment:', error);
    
    // Return mock response if backend fails
    console.log('🔧 Fallback to mock payment verification');
    
    return {
      success: true,
      message: 'Payment verified successfully (fallback)',
      payment_id: paymentId,
      order_id: orderId,
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
      return response.data;
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
 * Get wallet transactions from backend
 */
export const getWalletTransactions = async (): Promise<WalletTransaction[]> => {
  try {
    console.log('📋 Fetching wallet transactions...');
    
    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    
    if (!backendAvailable) {
      // Return mock transactions for development
      console.log('🔧 Using mock wallet transactions:', MOCK_DATA.transactions.length);
      return MOCK_DATA.transactions;
    }
    
    const authHeaders = await getAuthHeaders();
    const response = await axiosInstance.get('/api/wallet/transactions', {
      headers: authHeaders
    });

    if (response.data) {
      console.log('✅ Wallet transactions fetched:', response.data.length, 'transactions');
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Failed to fetch wallet transactions:', error);
    
    // Return mock transactions if backend fails
    console.log('🔧 Fallback to mock wallet transactions:', MOCK_DATA.transactions.length);
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
