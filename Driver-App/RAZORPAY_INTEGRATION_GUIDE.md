# Razorpay Integration Guide

## 🚀 Overview

This guide covers the complete Razorpay payment integration for the Drop Cars driver app, including wallet top-up, auto-deduction, and payment management.

## 🔧 Features Implemented

### 1. Wallet Management
- ✅ Real-time wallet balance tracking
- ✅ Transaction history with status tracking
- ✅ Backend API integration for wallet operations
- ✅ Automatic balance synchronization

### 2. Payment Processing
- ✅ Razorpay checkout integration
- ✅ Payment order creation on backend
- ✅ Payment verification and signature validation
- ✅ Error handling and retry mechanisms

### 3. Auto-Deduction System
- ✅ Trip payment deductions
- ✅ Commission deductions
- ✅ Payout processing
- ✅ Insufficient balance handling

## 📁 File Structure

```
services/
├── paymentService.ts          # Payment API integration
├── authService.ts            # Authentication utilities
└── axiosInstance.tsx         # API configuration

contexts/
└── WalletContext.tsx         # Wallet state management

components/
├── AutoDeductionModal.tsx    # Deduction confirmation modal
└── TransactionCard.tsx       # Transaction display component

app/(tabs)/
└── wallet.tsx               # Main wallet screen
```

## 🔑 Configuration

### 1. Razorpay Keys
```typescript
// services/paymentService.ts
const RAZORPAY_CONFIG = {
  key_id: 'rzp_test_1DP5mmOlF5G5ag', // Replace with your actual key
  key_secret: 'your_razorpay_secret_key', // Backend only
  currency: 'INR',
  company_name: 'Drop Cars',
  company_logo: 'https://i.imgur.com/3g7nmJC.png',
};
```

### 2. Environment Variables
```bash
# Add to your environment configuration
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## 💳 Payment Flow

### 1. Wallet Top-up Process
```
User enters amount → Create payment order → Open Razorpay → 
Payment completion → Verify signature → Update wallet → Success
```

### 2. Auto-Deduction Process
```
Trip completion → Calculate charges → Show deduction modal → 
Confirm deduction → Update wallet → Update trip status
```

## 🛠️ API Endpoints

### Backend Endpoints Required

#### 1. Payment Order Creation
```http
POST /api/payments/create-order
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 1000,
  "currency": "INR",
  "description": "Wallet top-up of ₹1000",
  "user_id": "user_123",
  "payment_type": "wallet_topup",
  "metadata": {
    "user_name": "John Doe",
    "user_mobile": "+919876543210"
  }
}
```

#### 2. Payment Verification
```http
POST /api/payments/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_order_id": "order_1234567890",
  "razorpay_signature": "signature_hash"
}
```

#### 3. Wallet Operations
```http
# Get Balance
GET /api/wallet/balance
Authorization: Bearer <token>

# Get Transactions
GET /api/wallet/transactions
Authorization: Bearer <token>

# Add Money
POST /api/wallet/add
Authorization: Bearer <token>

# Deduct Money
POST /api/wallet/deduct
Authorization: Bearer <token>
```

## 🔄 Usage Examples

### 1. Wallet Top-up
```typescript
import { useWallet } from '@/contexts/WalletContext';

const { addMoney } = useWallet();

// Add money to wallet
await addMoney(1000, 'Wallet top-up via Razorpay', {
  payment_method: 'razorpay',
  razorpay_payment_id: 'pay_1234567890'
});
```

### 2. Auto-Deduction
```typescript
import { useWallet } from '@/contexts/WalletContext';

const { deductMoney } = useWallet();

// Deduct trip payment
await deductMoney(500, 'Trip payment for ride #123', {
  trip_id: 'trip_123',
  distance: 25.5,
  duration: 45
});
```

### 3. Auto-Deduction Modal
```typescript
import AutoDeductionModal from '@/components/AutoDeductionModal';

const [showDeductionModal, setShowDeductionModal] = useState(false);
const [deductionData, setDeductionData] = useState(null);

// Show deduction modal
setDeductionData({
  amount: 500,
  description: 'Trip payment for ride #123',
  type: 'trip_payment',
  metadata: {
    trip_id: 'trip_123',
    distance: 25.5
  }
});
setShowDeductionModal(true);

// In JSX
<AutoDeductionModal
  visible={showDeductionModal}
  onClose={() => setShowDeductionModal(false)}
  onSuccess={() => {
    // Handle successful deduction
    console.log('Deduction successful');
  }}
  deductionData={deductionData}
/>
```

## 🎯 Integration Points

### 1. Trip Completion
```typescript
// In trip completion flow
const handleTripCompletion = async (tripData) => {
  const tripAmount = calculateTripAmount(tripData);
  
  // Show deduction modal
  setDeductionData({
    amount: tripAmount,
    description: `Trip payment for ${tripData.pickup} to ${tripData.drop}`,
    type: 'trip_payment',
    metadata: {
      trip_id: tripData.id,
      distance: tripData.distance,
      duration: tripData.duration
    }
  });
  setShowDeductionModal(true);
};
```

### 2. Commission Deduction
```typescript
// In commission calculation
const handleCommissionDeduction = async (commissionAmount) => {
  await deductMoney(
    commissionAmount,
    'Platform commission',
    {
      commission_type: 'platform_fee',
      percentage: 10
    }
  );
};
```

### 3. Payout Processing
```typescript
// In payout flow
const handlePayout = async (payoutAmount) => {
  await deductMoney(
    payoutAmount,
    'Earnings payout',
    {
      payout_type: 'earnings',
      period: 'weekly'
    }
  );
};
```

## 🔒 Security Considerations

### 1. Payment Verification
- Always verify payment signatures on backend
- Never trust client-side payment data
- Use webhooks for payment status updates

### 2. Wallet Security
- Validate all wallet operations on backend
- Implement proper authentication for all wallet APIs
- Log all wallet transactions for audit

### 3. Error Handling
- Handle network failures gracefully
- Implement retry mechanisms for failed payments
- Provide clear error messages to users

## 🐛 Troubleshooting

### Common Issues

#### 1. Payment Order Creation Failed
**Symptoms**: "Failed to create payment order"
**Solutions**:
- Check backend API endpoint
- Verify authentication token
- Check request payload format

#### 2. Payment Verification Failed
**Symptoms**: "Payment verification failed"
**Solutions**:
- Verify Razorpay signature on backend
- Check payment status in Razorpay dashboard
- Ensure webhook is properly configured

#### 3. Insufficient Balance
**Symptoms**: "Insufficient wallet balance"
**Solutions**:
- Prompt user to add money
- Check balance calculation logic
- Verify transaction history

#### 4. Network Errors
**Symptoms**: "Network error" or timeout
**Solutions**:
- Check internet connectivity
- Implement retry logic
- Show offline mode indicators

## 📊 Testing

### 1. Test Cards
```typescript
// Use these test cards for development
const TEST_CARDS = {
  success: '4111 1111 1111 1111',
  failure: '4000 0000 0000 0002',
  insufficient: '4000 0000 0000 9995'
};
```

### 2. Test Scenarios
- ✅ Successful payment flow
- ✅ Payment cancellation
- ✅ Network failure handling
- ✅ Insufficient balance scenarios
- ✅ Auto-deduction flows
- ✅ Transaction history updates

## 🔄 Webhook Integration

### 1. Webhook Endpoint
```http
POST /api/payments/webhook
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1234567890",
        "amount": 100000,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

### 2. Webhook Verification
```typescript
// Verify webhook signature
const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

## 📈 Analytics & Monitoring

### 1. Payment Metrics
- Success rate tracking
- Average transaction value
- Payment method distribution
- Error rate monitoring

### 2. Wallet Analytics
- Balance distribution
- Transaction frequency
- Top-up patterns
- Deduction trends

## 🚀 Production Checklist

### Before Go-Live
- [ ] Replace test keys with production keys
- [ ] Configure webhook endpoints
- [ ] Set up monitoring and alerts
- [ ] Test all payment flows
- [ ] Implement proper error handling
- [ ] Set up backup payment methods
- [ ] Configure fraud detection
- [ ] Test webhook reliability

### Security Checklist
- [ ] Implement proper authentication
- [ ] Validate all inputs
- [ ] Use HTTPS for all API calls
- [ ] Implement rate limiting
- [ ] Set up audit logging
- [ ] Configure firewall rules
- [ ] Regular security audits

## 📞 Support

### Razorpay Support
- Documentation: https://razorpay.com/docs/
- Support Email: help@razorpay.com
- Developer Community: https://razorpay.com/community/

### Internal Support
- Check console logs for detailed error information
- Use debug mode for API connectivity testing
- Review transaction history for payment status
- Contact backend team for API issues

## 🔄 Updates & Maintenance

### Regular Tasks
- Monitor payment success rates
- Update Razorpay SDK versions
- Review and update security measures
- Backup transaction data
- Monitor wallet balance accuracy

### Version Updates
- Test new Razorpay features
- Update integration code
- Migrate deprecated APIs
- Update documentation

---

This integration provides a complete payment solution for the Drop Cars driver app with secure wallet management and automated payment processing.
