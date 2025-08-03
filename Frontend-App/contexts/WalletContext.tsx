import React, { createContext, useContext, useState } from 'react';
import { Wallet, Transaction } from '@/types/wallet';
import { sendWalletLowBalanceNotification } from '@/services/notifications';

interface WalletContextType {
  wallet: Wallet | null;
  transactions: Transaction[];
  addFunds: (amount: number) => Promise<boolean>;
  deductFunds: (amount: number, description: string) => Promise<boolean>;
  canAcceptBooking: () => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<Wallet>({
    id: '1',
    userId: '2',
    balance: 250,
    minBalance: 100,
    isActive: true
  });

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      walletId: '1',
      type: 'credit',
      amount: 500,
      description: 'Wallet top-up via Razorpay',
      status: 'completed',
      razorpayOrderId: 'order_123',
      razorpayPaymentId: 'pay_456',
      createdAt: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      walletId: '1',
      type: 'debit',
      amount: 150,
      description: 'Booking acceptance fee',
      status: 'completed',
      createdAt: '2024-01-15T09:20:00Z'
    },
    {
      id: '3',
      walletId: '1',
      type: 'credit',
      amount: 120,
      description: 'Trip completed - Raj Patel',
      status: 'completed',
      createdAt: '2024-01-15T10:45:00Z'
    },
    {
      id: '4',
      walletId: '1',
      type: 'debit',
      amount: 18,
      description: 'Booking acceptance fee',
      status: 'completed',
      createdAt: '2024-01-15T11:10:00Z'
    }
  ]);

  const addFunds = async (amount: number): Promise<boolean> => {
    try {
      // Simulate Razorpay payment success
      const newTransaction: Transaction = {
        id: Math.random().toString(),
        walletId: wallet?.id || '1',
        type: 'credit',
        amount,
        description: 'Wallet top-up via Razorpay',
        status: 'completed',
        razorpayOrderId: `order_${Math.random().toString(36).substr(2, 9)}`,
        razorpayPaymentId: `pay_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setWallet(prev => prev ? { ...prev, balance: prev.balance + amount } : null);
      
      return true;
    } catch (error) {
      console.error('Add funds error:', error);
      return false;
    }
  };

  const deductFunds = async (amount: number, description: string): Promise<boolean> => {
    try {
      if (!wallet || wallet.balance < amount) {
        return false;
      }

      const newTransaction: Transaction = {
        id: Math.random().toString(),
        walletId: wallet.id,
        type: 'debit',
        amount,
        description,
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      const newBalance = wallet.balance - amount;
      setWallet(prev => prev ? { ...prev, balance: newBalance } : null);
      
      // Check if balance is low and send notification
      if (newBalance < wallet.minBalance) {
        await sendWalletLowBalanceNotification(newBalance, wallet.minBalance);
      }
      
      return true;
    } catch (error) {
      console.error('Deduct funds error:', error);
      return false;
    }
  };

  const canAcceptBooking = (): boolean => {
    return wallet ? wallet.balance >= wallet.minBalance : false;
  };

  return (
    <WalletContext.Provider value={{
      wallet,
      transactions,
      addFunds,
      deductFunds,
      canAcceptBooking
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