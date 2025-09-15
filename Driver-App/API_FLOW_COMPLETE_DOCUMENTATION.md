# Complete API Flow Documentation

## 🎯 **Current System Overview**

This document provides a comprehensive overview of all API endpoints currently used in the Driver App for order management, assignment, and driver operations.

## 📊 **API Endpoints Summary**

### **1. Vehicle Owner Dashboard - Available Orders**

#### **Endpoint**: `GET /api/orders/vehicle_owner/pending`
- **Purpose**: Fetch available orders for vehicle owner
- **Authentication**: JWT token required
- **Used in**: `getAvailableBookings()` function
- **Status**: ✅ Working

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

#### **Endpoint**: `POST /api/assignments/acceptorder`
- **Purpose**: Accept an order by creating assignment with PENDING status
- **Authentication**: JWT token required
- **Used in**: `acceptOrder()` function
- **Status**: ✅ Working (with wallet balance validation)

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

#### **Endpoint**: `GET /api/assignments/vehicle_owner/{vehicle_owner_id}`
- **Purpose**: Get all assignments for a vehicle owner
- **Authentication**: JWT token required
- **Used in**: `getFutureRidesForVehicleOwner()` function
- **Status**: ✅ Working

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

#### **Endpoint**: `GET /api/orders/{order_id}`
- **Purpose**: Get detailed order information
- **Authentication**: JWT token required
- **Used in**: `getOrderDetails()` function
- **Status**: ⚠️ Partial (auth issues after logout)

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

#### **Endpoint**: `PATCH /api/assignments/{order_id}/assign-car-driver`
- **Purpose**: Assign driver and car to an order
- **Authentication**: JWT token required
- **Used in**: `assignCarDriverToOrder()` function
- **Status**: ✅ Working

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

### **6. Available Drivers**

#### **Endpoint**: `GET /api/assignments/available-drivers`
- **Purpose**: Get all available drivers for assignment
- **Authentication**: JWT token required
- **Used in**: `fetchAvailableDrivers()` function
- **Status**: ✅ Working

**Response Format**:
```json
[
  {
    "adress": "Hehehe,euehhwveg,ywhegwge",
    "created_at": "2025-09-14T11:03:07.842884+00:00",
    "driver_status": "ONLINE",
    "full_name": "New Driver 3",
    "hashed_password": "$2b$12$3HxbThbydeoidlJmZDSEPu33tB8rK48GURqUEFWBse4KlNAlLbOTi",
    "id": "c7bb9d10-9ed4-4955-a77c-94e56f820093",
    "licence_front_img": "https://storage.googleapis.com/drop-cars-files/car_driver/c7bb9d10-9ed4-4955-a77c-94e56f820093/license/2a09672d-ba77-4e2f-ae65-4aacd8d2b1f8",
    "licence_number": "HSHS36737373YEYE",
    "organization_id": "org_001",
    "primary_number": "9500820540",
    "secondary_number": null,
    "vehicle_owner_id": "ea5f69d5-cbca-4127-ae9b-e72877740329"
  }
]
```

### **7. Available Cars**

#### **Endpoint**: `GET /api/assignments/available-cars`
- **Purpose**: Get all available cars for assignment
- **Authentication**: JWT token required
- **Used in**: `fetchAvailableCars()` function
- **Status**: ✅ Working

**Response Format**:
```json
[
  {
    "car_img_url": "https://storage.googleapis.com/drop-cars-files/car_details/db356f34-b33c-4638-a6ee-1d351939c76b/car_img/489c3074-6e69-4b44-9a05-bdb8590314ad.jpeg",
    "car_name": "Honda City",
    "car_number": "TN32UE747373",
    "car_status": "ONLINE",
    "car_type": "SEDAN",
    "created_at": "2025-09-13T08:48:53.636045+00:00",
    "fc_img_url": "https://storage.googleapis.com/drop-cars-files/car_details/db356f34-b33c-4638-a6ee-1d351939c76b/fc_img/7896c2cb-ec8b-45be-a297-403dbf878441.jpeg",
    "id": "db356f34-b33c-4638-a6ee-1d351939c76b",
    "insurance_img_url": "https://storage.googleapis.com/drop-cars-files/car_details/db356f34-b33c-4638-a6ee-1d351939c76b/insurance_img/7780daf1-2182-4eda-b7ad-483605fff799.jpeg",
    "organization_id": "org_001",
    "rc_back_img_url": "https://storage.googleapis.com/drop-cars-files/car_details/db356f34-b33c-4638-a6ee-1d351939c76b/rc_back_img/748811b7-24e5-4e78-97ab-dc63342ae29c.jpeg",
    "rc_front_img_url": "https://storage.googleapis.com/drop-cars-files/car_details/db356f34-b33c-4638-a6ee-1d351939c76b/rc_front_img/aa19269c-5837-4461-a2e3-9dcd2fec1c92.jpeg",
    "vehicle_owner_id": "ea5f69d5-cbca-4127-ae9b-e72877740329"
  }
]
```

### **8. Driver Assignments (Fixed)**

#### **Endpoint**: `GET /api/assignments/all` + Filter
- **Purpose**: Get assignments for a specific driver
- **Authentication**: JWT token required
- **Used in**: `getDriverAssignmentsWithDetails()` function
- **Status**: ✅ Fixed

**Implementation**:
```typescript
// Get all assignments and filter by driver_id
const response = await axiosInstance.get('/api/assignments/all', { headers: authHeaders });
const driverAssignments = response.data.filter((assignment: any) => {
  const matchesDriver = assignment.driver_id === driverId;
  const isAssigned = assignment.assignment_status === 'ASSIGNED' || 
                    assignment.assignment_status === 'DRIVING' || 
                    assignment.assignment_status === 'COMPLETED';
  return matchesDriver && isAssigned;
});
```

### **9. Wallet Balance Check**

#### **Endpoint**: `GET /api/wallet/balance` (via paymentService)
- **Purpose**: Check wallet balance before order acceptance
- **Authentication**: JWT token required
- **Used in**: `acceptOrder()` function
- **Status**: ✅ Working

## 🔧 **Recent Fixes Applied**

### **1. Driver Assignment Fetching Fix**
- **Problem**: All driver assignment endpoints returned 404/401
- **Solution**: Use `/api/assignments/all` and filter by `driver_id`
- **Result**: Drivers can now see their assigned orders

### **2. Wallet Balance Validation**
- **Problem**: Orders failed due to insufficient balance
- **Solution**: Check wallet balance before order acceptance
- **Result**: Clear error messages for insufficient balance

### **3. Debug Log Optimization**
- **Problem**: Excessive debug logs cluttering console
- **Solution**: Removed unnecessary logs, kept essential ones
- **Result**: Cleaner console output focused on important information

## 🎯 **Complete Flow**

### **Vehicle Owner Flow**:
1. **Dashboard**: Fetch available orders via `/api/orders/vehicle_owner/pending`
2. **Accept Order**: Accept order via `/api/assignments/acceptorder` (with wallet balance check)
3. **Future Rides**: View assignments via `/api/assignments/vehicle_owner/{id}`
4. **Assign Driver**: Assign driver/car via `/api/assignments/{id}/assign-car-driver`

### **Driver Flow**:
1. **Login**: Driver logs in via `/api/users/cardriver/signin`
2. **Dashboard**: View assigned orders via `/api/assignments/all` (filtered by driver_id)
3. **Order Details**: Get order details via `/api/orders/{id}`

## 📋 **API Status Summary**

| Function | Endpoint | Method | Status | Notes |
|----------|----------|--------|--------|-------|
| Available Orders | `/api/orders/vehicle_owner/pending` | GET | ✅ Working | None |
| Order Acceptance | `/api/assignments/acceptorder` | POST | ✅ Working | With wallet validation |
| Future Rides | `/api/assignments/vehicle_owner/{id}` | GET | ✅ Working | None |
| Order Details | `/api/orders/{id}` | GET | ⚠️ Partial | Auth issues after logout |
| Driver Assignment | `/api/assignments/{id}/assign-car-driver` | PATCH | ✅ Working | None |
| Available Drivers | `/api/assignments/available-drivers` | GET | ✅ Working | None |
| Available Cars | `/api/assignments/available-cars` | GET | ✅ Working | None |
| Driver Assignments | `/api/assignments/all` + filter | GET | ✅ Fixed | Filtered by driver_id |
| Wallet Balance | `/api/wallet/balance` | GET | ✅ Working | None |

## 🚀 **Next Steps**

1. **Test Complete Flow**: Verify end-to-end functionality
2. **Fix Auth Issues**: Resolve token management after logout/login
3. **Add Error Handling**: Improve user feedback for all error cases
4. **Performance Optimization**: Reduce API calls where possible
5. **User Experience**: Add loading states and better error messages
