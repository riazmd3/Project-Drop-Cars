# Current API Flow Analysis & Issues

## 🚨 **Critical Issues Identified**

### 1. **Order Acceptance Failing**
- **Error**: `Failed to accept order: 400: Insufficient balance. Required: 83.76 INR`
- **Root Cause**: Wallet balance insufficient for order acceptance
- **Impact**: Orders cannot be accepted, blocking the entire flow

### 2. **Assignment Success But No Driver Orders**
- **Issue**: Assignment shows success but driver sees no orders
- **Root Cause**: Driver assignment API returns success but driver dashboard can't fetch assignments
- **Error**: `User not found` when trying to fetch driver assignments

### 3. **Authentication Token Issues**
- **Issue**: After logout/login, authentication tokens are not properly maintained
- **Error**: `No authentication token found. Please login first.`

## 📊 **Current API Flow Documentation**

### **1. Vehicle Owner Dashboard - Available Orders**

#### **API Endpoint**: `GET /api/orders/vehicle_owner/pending`
```typescript
// Used in: getAvailableBookings()
const response = await axiosInstance.get('/api/orders/vehicle_owner/pending', {
  headers: authHeaders
});
```

**Response Format**:
```json
[
  {
    "assigned_at": null,
    "assignment_status": "PENDING",
    "cancelled_at": null,
    "car_id": null,
    "car_type": "Sedan",
    "completed_at": null,
    "cost_per_km": 0,
    "created_at": "2025-09-13T11:40:31.269002Z",
    "customer_name": "customer 2 Roundtrip",
    "customer_number": "9876543210",
    "driver_allowance": 0,
    "driver_id": null,
    "estimated_price": 8376,
    "expires_at": null,
    "extra_cost_per_km": 0,
    "extra_driver_allowance": 0,
    "extra_permit_charges": 0,
    "hill_charges": 0,
    "id": null,
    "order_created_at": "2025-09-13T11:40:31.269002Z",
    "order_id": 2,
    "permit_charges": 0,
    "pick_near_city": "ALL",
    "pickup_drop_location": {"0": "Chennai", "1": "Bangalore", "3": "Chennai"},
    "pickup_notes": null,
    "platform_fees_percent": 10,
    "start_date_time": "2025-08-13T12:00:00Z",
    "toll_charges": 0,
    "trip_distance": 673,
    "trip_status": "PENDING",
    "trip_time": "7 hours 3 mins + 6 hours 53 mins",
    "trip_type": "Round Trip",
    "vehicle_owner_id": "ea5f69d5-cbca-4127-ae9b-e72877740329",
    "vendor_id": "a6fa5487-d2af-4790-9659-217f553c676e",
    "vendor_price": 8376
  }
]
```

### **2. Order Acceptance**

#### **API Endpoint**: `POST /api/assignments/acceptorder`
```typescript
// Used in: acceptOrder()
const response = await axiosInstance.post('/api/assignments/acceptorder', {
  order_id: orderId,
  vehicle_owner_id: vehicleOwnerId,
  acceptance_notes: "Order accepted by vehicle owner Driver"
}, {
  headers: authHeaders
});
```

**Request Body**:
```json
{
  "order_id": "2",
  "vehicle_owner_id": "ea5f69d5-cbca-4127-ae9b-e72877740329",
  "acceptance_notes": "Order accepted by vehicle owner Driver"
}
```

**Success Response**:
```json
{
  "assigned_at": null,
  "assignment_status": "PENDING",
  "cancelled_at": null,
  "car_id": null,
  "completed_at": null,
  "created_at": "2025-09-14T11:57:56.556086",
  "driver_id": null,
  "expires_at": "2025-09-14T12:57:56.556086",
  "id": 13,
  "order_id": 6,
  "vehicle_owner_id": "ea5f69d5-cbca-4127-ae9b-e72877740329"
}
```

**Error Response**:
```json
{
  "detail": "Failed to accept order: 400: Insufficient balance. Required: 83.76 INR"
}
```

### **3. Future Rides - Assignment Data**

#### **API Endpoint**: `GET /api/assignments/vehicle_owner/{vehicle_owner_id}`
```typescript
// Used in: getFutureRidesForVehicleOwner()
const response = await axiosInstance.get(`/api/assignments/vehicle_owner/${vehicleOwnerId}`, {
  headers: authHeaders
});
```

**Response Format**:
```json
[
  {
    "assigned_at": null,
    "assignment_status": "PENDING",
    "cancelled_at": null,
    "car_id": null,
    "completed_at": null,
    "created_at": "2025-09-14T11:30:34.916679",
    "driver_id": null,
    "expires_at": "2025-09-14T12:30:34.916679",
    "id": 12,
    "order_id": 10,
    "vehicle_owner_id": "ea5f69d5-cbca-4127-ae9b-e72877740329"
  }
]
```

### **4. Future Rides - Order Details**

#### **API Endpoint**: `GET /api/orders/{order_id}`
```typescript
// Used in: getOrderDetails()
const response = await axiosInstance.get(`/api/orders/${orderId}`, {
  headers: authHeaders
});
```

**Response Format**:
```json
{
  "assigned_at": null,
  "assignment_status": "PENDING",
  "cancelled_at": null,
  "car_id": null,
  "completed_at": null,
  "created_at": "2025-09-14T10:44:28.448654",
  "driver_id": null,
  "expires_at": "2025-09-14T11:44:28.448654",
  "id": 10,
  "order_id": 12,
  "vehicle_owner_id": "ea5f69d5-cbca-4127-ae9b-e72877740329"
}
```

### **5. Driver & Car Assignment**

#### **API Endpoint**: `PATCH /api/assignments/{order_id}/assign-car-driver`
```typescript
// Used in: assignCarDriverToOrder()
const response = await axiosInstance.patch(`/api/assignments/${orderId}/assign-car-driver`, {
  driver_id: driverId,
  car_id: carId
}, {
  headers: authHeaders
});
```

**Request Body**:
```json
{
  "driver_id": "668202bf-0051-4809-91f3-6b746aaa3549",
  "car_id": "db356f34-b33c-4638-a6ee-1d351939c76b"
}
```

**Success Response**:
```json
{
  "assigned_at": "2025-09-14T11:58:44.555464",
  "assignment_status": "ASSIGNED",
  "cancelled_at": null,
  "car_id": "db356f34-b33c-4638-a6ee-1d351939c76b",
  "completed_at": null,
  "created_at": "2025-09-14T10:44:28.448654",
  "driver_id": "668202bf-0051-4809-91f3-6b746aaa3549",
  "expires_at": "2025-09-14T11:44:28.448654",
  "id": 10,
  "order_id": 12,
  "vehicle_owner_id": "ea5f69d5-cbca-4127-ae9b-e72877740329"
}
```

### **6. Available Drivers & Cars**

#### **API Endpoint**: `GET /api/assignments/available-drivers`
```typescript
// Used in: fetchAvailableDrivers()
const response = await axiosInstance.get('/api/assignments/available-drivers', {
  headers: authHeaders
});
```

#### **API Endpoint**: `GET /api/assignments/available-cars`
```typescript
// Used in: fetchAvailableCars()
const response = await axiosInstance.get('/api/assignments/available-cars', {
  headers: authHeaders
});
```

### **7. Driver Dashboard - Assignment Fetching**

#### **API Endpoints** (Multiple attempts):
1. `GET /api/assignments/driver/{driver_id}` - **404 Not Found**
2. `GET /api/assignments/by-driver/{driver_id}` - **404 Not Found**
3. `GET /api/assignments?driver_id={driver_id}` - **404 Not Found**
4. `GET /api/assignments/all` - **401 User not found**

**Issue**: None of these endpoints work for fetching driver assignments.

## 🔧 **Required Fixes**

### **1. Fix Wallet Balance Issue**
- Add wallet balance check before order acceptance
- Show clear error message about insufficient balance
- Provide wallet top-up option

### **2. Fix Driver Assignment Fetching**
- Implement correct API endpoint for driver assignments
- Ensure driver can see their assigned orders
- Fix authentication token management

### **3. Fix Order ID Mapping**
- The assignment API uses different order IDs than expected
- Order 10 in assignment maps to order 12 in orders API
- Need to fix the mapping logic

### **4. Improve Error Handling**
- Add proper error messages for each failure case
- Implement retry mechanisms for failed requests
- Add loading states and user feedback

## 📋 **API Endpoint Summary**

| Function | Endpoint | Method | Status | Issues |
|----------|----------|--------|--------|--------|
| Available Orders | `/api/orders/vehicle_owner/pending` | GET | ✅ Working | None |
| Order Acceptance | `/api/assignments/acceptorder` | POST | ⚠️ Partial | Wallet balance required |
| Future Rides | `/api/assignments/vehicle_owner/{id}` | GET | ✅ Working | None |
| Order Details | `/api/orders/{id}` | GET | ⚠️ Partial | Auth issues after logout |
| Driver Assignment | `/api/assignments/{id}/assign-car-driver` | PATCH | ✅ Working | None |
| Available Drivers | `/api/assignments/available-drivers` | GET | ✅ Working | None |
| Available Cars | `/api/assignments/available-cars` | GET | ✅ Working | None |
| Driver Assignments | Multiple endpoints | GET | ❌ Broken | All return 404/401 |

## 🎯 **Next Steps**

1. **Fix wallet balance validation**
2. **Implement correct driver assignment fetching API**
3. **Fix authentication token management**
4. **Add proper error handling and user feedback**
5. **Test complete flow end-to-end**
