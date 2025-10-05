# API Troubleshooting Guide

This guide helps resolve the API errors you're experiencing with the assignment system.

## Current Issues Identified

Based on your error logs:
- **403 Forbidden** on `GET /api/orders/3` - Authentication/authorization issue
- **422 Unprocessable Entity** on `POST /api/assignments/acceptorder` - Request validation error
- **404 Not Found** on `GET /api/orders/4` - Order doesn't exist

## Fixed Issues

### 1. Order Acceptance Request Format
**Problem:** The `acceptOrder` function was only sending `order_id` but the API expects more fields.

**Solution:** Updated the function to send the complete request:
```typescript
{
  order_id: string,
  vehicle_owner_id: string,
  acceptance_notes?: string
}
```

### 2. Error Handling
**Problem:** Missing 422 error handling for validation errors.

**Solution:** Added specific handling for 422 Unprocessable Entity errors with detailed error messages.

### 3. Order Availability Check
**Problem:** 403 Forbidden errors were not being handled properly.

**Solution:** Added 403 error handling to treat forbidden orders as unavailable.

## Debug Tools Added

### 1. Debug API Button
- Added a "Debug API" button in the Future Rides screen
- Tests order acceptance with detailed logging
- Shows detailed error information in an alert

### 2. Enhanced Logging
- Added comprehensive logging for all API calls
- Detailed error information including status codes and response data
- Step-by-step debugging for order acceptance process

## How to Use the Debug Tools

1. **Open the Future Rides tab**
2. **Click "Debug API" button** - This will test order acceptance with order ID "3"
3. **Check the console logs** for detailed debugging information
4. **Review the alert popup** for error details

## Common Solutions

### Authentication Issues (403 Forbidden)
1. **Check if user is logged in properly**
2. **Verify the JWT token is valid**
3. **Ensure the user has permission to access the order**

### Validation Errors (422 Unprocessable Entity)
1. **Check if all required fields are provided**
2. **Verify the order_id exists and is valid**
3. **Ensure vehicle_owner_id is correct**
4. **Check if the order is already assigned**

### Order Not Found (404 Not Found)
1. **Verify the order_id exists**
2. **Check if the order has been deleted or moved**
3. **Ensure you're using the correct order ID format**

## Testing Steps

1. **Test Authentication:**
   ```typescript
   // Check if user is authenticated
   const isAuth = await isAuthenticated();
   console.log('User authenticated:', isAuth);
   ```

2. **Test Order Availability:**
   ```typescript
   // Test with a known order ID
   const isAvailable = await checkOrderAvailability("3");
   console.log('Order available:', isAvailable);
   ```

3. **Test Order Acceptance:**
   ```typescript
   // Test order acceptance with debug function
   const result = await debugOrderAcceptance("3", "your-vehicle-owner-id");
   console.log('Debug result:', result);
   ```

## API Endpoints Status

### Working Endpoints
- ✅ `POST /api/assignments/{order_id}/assign-car-driver` - New assignment endpoint
- ✅ `GET /api/assignments/vehicle_owner/{vehicle_owner_id}` - Future rides endpoint

### Potentially Problematic Endpoints
- ⚠️ `GET /api/orders/{order_id}` - May have permission issues
- ⚠️ `POST /api/assignments/acceptorder` - May have validation issues

## Next Steps

1. **Use the Debug API button** to test the current setup
2. **Check the console logs** for detailed error information
3. **Verify your authentication** is working properly
4. **Test with different order IDs** if available
5. **Contact backend team** if validation errors persist

## Error Code Reference

- **400 Bad Request:** Invalid request format
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Access denied (permission issue)
- **404 Not Found:** Resource doesn't exist
- **409 Conflict:** Resource already exists/assigned
- **422 Unprocessable Entity:** Validation error
- **500 Internal Server Error:** Server-side error

## Contact Information

If issues persist after following this guide:
1. Check the console logs for detailed error information
2. Use the Debug API button to gather specific error details
3. Contact the backend development team with the error details
