# Development Mode Guide

## 🚀 Using Razorpay Integration Without Backend

This guide explains how to use the Razorpay integration in development mode when you don't have the backend APIs ready yet.

## 🔧 How It Works

### **Automatic Fallback System**
The payment service automatically detects when the backend is not available and switches to mock mode:

1. **Backend Detection**: Checks `/api/health` endpoint
2. **Mock Data**: Uses local mock data for wallet operations
3. **Simulated Payments**: Simulates payment flows without real Razorpay
4. **Real Integration**: Automatically switches to real APIs when backend is available

## 📱 Testing the Wallet Features

### **1. Wallet Top-up (Mock Mode)**
```typescript
// Navigate to Wallet screen
// Enter any amount (e.g., ₹500)
// Tap "Add Money"
// You'll see: "Payment Successful! 🎉 (Mock)"
// Balance will increase immediately
// Transaction will appear in history
```

### **2. Auto-Deduction (Mock Mode)**
```typescript
// Use TripCompletionExample component
// Complete a trip
// Deduction modal will appear
// Confirm deduction
// Balance will decrease
// Transaction will be recorded
```

### **3. Transaction History**
```typescript
// All mock transactions are stored locally
// Transactions persist during app session
// Real transactions will replace mock data when backend is ready
```

## 🔍 Console Logs

### **Mock Mode Indicators**
```
🔧 Backend not available, using mock data
🔧 Using mock payment order: order_1234567890_abc123
🔧 Using mock wallet balance: 1500
🔧 Using mock wallet transactions: 3
🔧 Using mock payment flow
```

### **Real Mode Indicators**
```
✅ Payment order created: {...}
✅ Wallet balance fetched: {...}
✅ Payment verified successfully: {...}
```

## 🛠️ Development Features

### **Mock Data Management**
```typescript
import { resetMockData } from '@/services/paymentService';

// Reset mock data to initial state
resetMockData();
```

### **Initial Mock Data**
```typescript
const MOCK_DATA = {
  wallet_balance: 1500,
  transactions: [
    {
      id: '1',
      type: 'credit',
      amount: 2000,
      description: 'Initial Balance',
      date: '2025-01-20 10:30 AM',
      status: 'completed'
    },
    // ... more transactions
  ]
};
```

## 🎯 Testing Scenarios

### **1. Normal Flow**
- ✅ Add money to wallet
- ✅ View transaction history
- ✅ Auto-deduct for trips
- ✅ Check balance updates

### **2. Error Handling**
- ✅ Network failures
- ✅ Insufficient balance
- ✅ Payment cancellations

### **3. Edge Cases**
- ✅ Large amounts
- ✅ Zero amounts
- ✅ Invalid inputs

## 🔄 Switching to Production

### **When Backend is Ready**

1. **Update API Endpoints**: Ensure all required endpoints are implemented
2. **Configure Razorpay Keys**: Replace test keys with production keys
3. **Test Real Integration**: The app will automatically switch to real APIs
4. **Verify Webhooks**: Set up Razorpay webhooks for payment updates

### **Required Backend Endpoints**
```http
GET /api/health                    # Health check
POST /api/payments/create-order    # Create payment order
POST /api/payments/verify          # Verify payment
GET /api/wallet/balance           # Get wallet balance
GET /api/wallet/transactions      # Get transaction history
POST /api/wallet/add              # Add money to wallet
POST /api/wallet/deduct           # Deduct money from wallet
```

## 🚨 Important Notes

### **Development Mode**
- ✅ No real payments are processed
- ✅ All data is stored locally
- ✅ Perfect for UI/UX testing
- ✅ No backend dependency

### **Production Mode**
- ✅ Real payments via Razorpay
- ✅ Backend data persistence
- ✅ Secure payment verification
- ✅ Webhook integration

## 🧪 Testing Checklist

### **Before Backend Integration**
- [ ] Test wallet top-up flow
- [ ] Test auto-deduction flow
- [ ] Verify transaction history
- [ ] Check balance calculations
- [ ] Test error scenarios
- [ ] Verify UI responsiveness

### **After Backend Integration**
- [ ] Test real payment flow
- [ ] Verify backend data sync
- [ ] Test webhook integration
- [ ] Verify payment verification
- [ ] Test error handling
- [ ] Performance testing

## 🔧 Configuration

### **Environment Variables**
```bash
# Development (optional)
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=your_test_secret

# Production (required)
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_live_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### **API Base URL**
```typescript
// In axiosInstance.tsx
const API_BASE_URL = 'http://your-backend-url:port';
```

## 📊 Monitoring

### **Development Logs**
- Check console for mock mode indicators
- Verify transaction flow
- Monitor balance updates
- Test error scenarios

### **Production Monitoring**
- Payment success rates
- API response times
- Error rates
- Webhook delivery

## 🎉 Benefits

### **Development Benefits**
- ✅ No backend dependency
- ✅ Fast development cycle
- ✅ Easy testing
- ✅ UI/UX validation

### **Production Benefits**
- ✅ Seamless transition
- ✅ Real payment processing
- ✅ Secure transactions
- ✅ Scalable architecture

---

## 🚀 Ready to Use!

The Razorpay integration is now ready for development without requiring a backend. You can:

1. **Test all wallet features** immediately
2. **Develop UI/UX** without backend delays
3. **Validate user flows** with mock data
4. **Switch to production** seamlessly when ready

**Start testing the wallet features now!** 🎯
