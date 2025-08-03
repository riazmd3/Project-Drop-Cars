export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  minBalance: number;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}