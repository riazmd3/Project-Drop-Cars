import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getWalletBalance, 
  getWalletTransactions, 
  addToWallet, 
  deductFromWallet,
  WalletBalance,
  WalletTransaction 
} from '@/services/paymentService';

interface Transaction {
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

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addMoney: (amount: number, description?: string, metadata?: Record<string, any>) => Promise<void>;
  deductMoney: (amount: number, description: string, metadata?: Record<string, any>) => Promise<void>;
  syncWithBackend: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    syncWithBackend();
  }, []);

  const syncWithBackend = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch balance and transactions in parallel
      const [balanceData, transactionsData] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions()
      ]);

      setBalance(balanceData.balance);
      setTransactions(transactionsData);
      
      console.log('✅ Wallet synced with backend:', {
        balance: balanceData.balance,
        transactions: transactionsData.length
      });
    } catch (error: any) {
      console.error('❌ Failed to sync wallet with backend:', error);
      setError(error.message);
      
      // Fallback to local data if backend fails
      setBalance(1500);
      setTransactions([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      const balanceData = await getWalletBalance();
      setBalance(balanceData.balance);
      console.log('✅ Balance refreshed:', balanceData.balance);
    } catch (error: any) {
      console.error('❌ Failed to refresh balance:', error);
      setError(error.message);
    }
  };

  const refreshTransactions = async () => {
    try {
      const transactionsData = await getWalletTransactions();
      setTransactions(transactionsData);
      console.log('✅ Transactions refreshed:', transactionsData.length);
    } catch (error: any) {
      console.error('❌ Failed to refresh transactions:', error);
      setError(error.message);
    }
  };

  const addMoney = async (amount: number, description: string = 'Wallet Top-up', metadata?: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend API to add money
      const response = await addToWallet(amount, description, metadata);
      
      if (response.success) {
        // Update local state
        const newTransaction: Transaction = {
          id: response.payment_id || Date.now().toString(),
          type: 'credit',
          amount,
          description,
          date: new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          payment_id: response.payment_id,
          order_id: response.order_id,
          status: 'completed',
          metadata
        };

        setBalance(prev => prev + amount);
        setTransactions(prev => [newTransaction, ...prev]);
        
        console.log('✅ Money added successfully:', { amount, newBalance: balance + amount });
      } else {
        throw new Error(response.message || 'Failed to add money');
      }
    } catch (error: any) {
      console.error('❌ Failed to add money:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deductMoney = async (amount: number, description: string, metadata?: Record<string, any>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend API to deduct money
      const response = await deductFromWallet(amount, description, metadata);
      
      if (response.success) {
        // Update local state
        const newTransaction: Transaction = {
          id: response.payment_id || Date.now().toString(),
          type: 'debit',
          amount,
          description,
          date: new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          payment_id: response.payment_id,
          order_id: response.order_id,
          status: 'completed',
          metadata
        };

        setBalance(prev => prev - amount);
        setTransactions(prev => [newTransaction, ...prev]);
        
        console.log('✅ Money deducted successfully:', { amount, newBalance: balance - amount });
      } else {
        throw new Error(response.message || 'Failed to deduct money');
      }
    } catch (error: any) {
      console.error('❌ Failed to deduct money:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WalletContext.Provider value={{ 
      balance, 
      transactions, 
      loading, 
      error,
      refreshBalance,
      refreshTransactions,
      addMoney, 
      deductMoney,
      syncWithBackend
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}