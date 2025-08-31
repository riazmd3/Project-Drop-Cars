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

/**
 * Create a payment order on the backend
 */
export const createPaymentOrder = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    console.log('💰 Creating payment order:', request);
    
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
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Payment order creation failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to create payment order');
    }
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
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Payment verification failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to verify payment');
    }
  }
};

/**
 * Get wallet balance from backend
 */
export const getWalletBalance = async (): Promise<WalletBalance> => {
  try {
    console.log('💰 Fetching wallet balance...');
    
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
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch wallet balance');
    }
  }
};

/**
 * Get wallet transactions from backend
 */
export const getWalletTransactions = async (): Promise<WalletTransaction[]> => {
  try {
    console.log('📋 Fetching wallet transactions...');
    
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
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch wallet transactions');
    }
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
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Wallet deduction failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 409) {
      throw new Error('Insufficient wallet balance.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to deduct from wallet');
    }
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
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Wallet addition failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to add to wallet');
    }
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
    
    if (error.response?.status === 400) {
      const errorDetail = error.response.data?.detail || error.response.data?.message || 'Bad request';
      throw new Error(`Trip payment failed: ${errorDetail}`);
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 409) {
      throw new Error('Insufficient wallet balance for trip payment.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to process trip payment');
    }
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (): Promise<PaymentResponse[]> => {
  try {
    console.log('📋 Fetching payment history...');
    
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
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch payment history');
    }
  }
};
