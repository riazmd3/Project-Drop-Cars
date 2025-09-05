# Order Acceptance Troubleshooting Guide

## 🚨 Issue Description
When trying to accept an order in the Home dashboard, the driver app encounters an error that prevents the order from being accepted and moved to Future Rides.

## 🔧 Fixes Applied

### 1. Enhanced Error Handling
- **File**: `services/assignmentService.ts`
- **Changes**: 
  - Added multiple endpoint fallback mechanism
  - Improved error logging with detailed information
  - Added specific error messages for different HTTP status codes
  - Added timeout and network error handling

### 2. Improved Order Acceptance Flow
- **File**: `app/(tabs)/index.tsx`
- **Changes**:
  - Added validation for required data (user ID, order ID)
  - Enhanced error messages with retry options
  - Improved success flow with clear next steps
  - Added debug mode for troubleshooting

### 3. API Connectivity Testing
- **File**: `services/assignmentService.ts`
- **Changes**:
  - Added `testOrderAcceptanceAPI()` function
  - Tests multiple endpoint variations
  - Provides detailed logging for debugging

## 🐛 Common Error Scenarios

### 1. 404 - Endpoint Not Found
**Symptoms**: "Order acceptance endpoint not found"
**Causes**: 
- Incorrect API endpoint path
- Backend route not configured
- API base URL mismatch

**Solutions**:
- Check API base URL in `axiosInstance.tsx`
- Verify backend routes are properly configured
- Use debug mode to test endpoint connectivity

### 2. 401 - Authentication Failed
**Symptoms**: "Authentication failed. Please login again"
**Causes**:
- Expired JWT token
- Missing or invalid authorization header
- User session expired

**Solutions**:
- Re-login to refresh token
- Check token storage in SecureStore
- Verify authorization headers are being sent

### 3. 400 - Bad Request
**Symptoms**: "Invalid request" with specific details
**Causes**:
- Missing required fields (order_id, vehicle_owner_id)
- Invalid data format
- Validation errors

**Solutions**:
- Check request payload structure
- Verify all required fields are present
- Ensure data types match expected format

### 4. 409 - Conflict
**Symptoms**: "Order is already accepted by another vehicle owner"
**Causes**:
- Order already accepted by another driver
- Race condition between multiple drivers

**Solutions**:
- Refresh pending orders list
- Check if order is still available
- Try accepting a different order

### 5. 500 - Server Error
**Symptoms**: "Server error. Please try again later"
**Causes**:
- Backend server issues
- Database connection problems
- Internal server errors

**Solutions**:
- Wait and retry
- Check backend server status
- Contact support if persistent

## 🔍 Debug Mode

### How to Enable
1. Long press on the balance container in the dashboard
2. Debug button will appear in the header
3. Tap debug button to run API connectivity tests

### What Debug Mode Does
- Tests multiple endpoint variations
- Checks authentication status
- Logs detailed error information
- Provides connectivity test results

### Debug Output
Check console logs for:
- `🧪 Testing order acceptance API connectivity...`
- `🔍 Testing endpoint: /api/assignments/acceptorder`
- `📊 API Test Results: [...]`
- `❌ Endpoint failed: {...}`

## 📋 Expected Flow

### 1. Order Acceptance Process
```
User taps "Accept Booking" 
→ Validation checks (balance, user ID, order ID)
→ API call to accept order endpoint
→ Success: Order moved to Future Rides
→ Failure: Show specific error message with retry option
```

### 2. Future Rides Assignment
```
Order in Future Rides tab
→ Assign driver and vehicle
→ Driver can login and start trip
→ Trip completion
```

## 🛠️ Manual Testing Steps

### 1. Test API Connectivity
```javascript
// In debug mode, check console for:
✅ Testing endpoint: /api/assignments/acceptorder
✅ Order accepted successfully: {...}
```

### 2. Test Order Acceptance
```javascript
// Check for these logs:
🚀 Starting order acceptance process...
📋 Order details: {...}
✅ Order accepted successfully: {...}
```

### 3. Test Error Handling
```javascript
// Check for detailed error logs:
❌ Failed to accept order: {...}
📊 Error details: {...}
```

## 🔧 Configuration Check

### 1. API Base URL
**File**: `app/api/axiosInstance.tsx`
```javascript
const API_BASE_URL = 'http://10.138.138.145:8000'; // Verify this is correct
```

### 2. Endpoint Paths
**File**: `services/assignmentService.ts`
```javascript
const endpoints = [
  '/api/assignments/acceptorder',
  '/api/orders/accept',
  '/api/orders/accept-order',
  '/api/assignments/accept-order'
];
```

### 3. Authentication
**File**: `services/assignmentService.ts`
```javascript
const authHeaders = await getAuthHeaders();
// Verify token is present and valid
```

## 📞 Support Information

### When to Contact Support
- All endpoints return 404 errors
- Persistent 500 server errors
- Authentication issues that persist after re-login
- Orders not appearing in Future Rides after successful acceptance

### Information to Provide
- Error message from alert
- Console logs from debug mode
- Steps to reproduce the issue
- Device and app version information

## 🎯 Success Criteria

### Order Acceptance Success
- ✅ Order disappears from pending orders
- ✅ Order appears in Future Rides tab
- ✅ Success alert shows with next steps
- ✅ Customer receives SMS notification

### Debug Mode Success
- ✅ At least one endpoint responds successfully
- ✅ Authentication token is valid
- ✅ No network connectivity issues
- ✅ Detailed logs available for troubleshooting

## 🔄 Rollback Plan

If issues persist after these fixes:

1. **Revert to original endpoint**: Use only `/api/assignments/acceptorder`
2. **Disable debug mode**: Remove debug functionality
3. **Simplify error handling**: Use basic error messages
4. **Check backend logs**: Verify server-side issues

## 📚 Additional Resources

- [Assignment System README](./ASSIGNMENT_SYSTEM_README.md)
- [API Documentation](./VEHICLE_OWNER_API.md)
- [JWT Verification Guide](./JWT_VERIFICATION_GUIDE.md)
- [Notifications README](./NOTIFICATIONS_README.md)
