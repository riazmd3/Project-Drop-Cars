// Test the payment flow to verify amount handling
export const testPaymentFlow = () => {
  console.log('🧪 Testing payment flow...');
  
  const userAmount = 100; // User enters 100 rupees
  console.log('1. User enters:', userAmount, 'rupees');
  
  // Step 1: createRazorpayOrder converts to paise
  const orderAmount = userAmount * 100; // 10000 paise
  console.log('2. createRazorpayOrder converts to:', orderAmount, 'paise');
  
  // Step 2: getRazorpayOptions converts to paise again
  const razorpayAmount = userAmount * 100; // 10000 paise (this is correct)
  console.log('3. getRazorpayOptions converts to:', razorpayAmount, 'paise');
  
  // Step 3: Display in UI
  console.log('4. UI should show:', userAmount, 'rupees');
  console.log('5. Razorpay receives:', razorpayAmount, 'paise');
  
  // The issue is that somewhere the UI is showing 10000 instead of 100
  console.log('❌ If UI shows 10000, there\'s a display bug');
  console.log('✅ If UI shows 100, everything is correct');
};
