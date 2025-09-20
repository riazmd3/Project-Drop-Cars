# Complete API Documentation - Drop Cars Project

## Base URL
```
10.100.155.145:8000
```

## Authentication
All APIs require JWT Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. AUTHENTICATION APIs

### 1.1 Vehicle Owner Login
```
POST /api/users/vehicleowner/login
```
**Request Body:**
```json
{
  "mobile_number": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "access_token": "string",
  "token_type": "string",
  "account_status": "string",
  "car_driver_count": "number",
  "car_details_count": "number"
}
```

### 1.2 Vehicle Owner Signup
```
POST /api/users/vehicleowner/signup
```
**Request Body (FormData):**
```
full_name: string
primary_number: string
secondary_number?: string
password: string
address: string
aadhar_number: string
organization_id: string
aadhar_front_img: File
```

### 1.3 Car Driver Signup
```
POST /api/users/cardriver/signup
```
**Request Body:**
```json
{
  "full_name": "string",
  "primary_number": "string",
  "secondary_number": "string",
  "address": "string",
  "aadhar_number": "string",
  "organization_id": "string",
  "password": "string",
  "email": "string",
  "license_number": "string",
  "experience_years": "number",
  "vehicle_preferences": ["string"]
}
```

### 1.4 Car Driver Signin
```
POST /api/users/cardriver/signin
```
**Request Body:**
```json
{
  "primary_number": "string",
  "password": "string"
}
```

---

## 2. VEHICLE OWNER APIs

### 2.1 Get Vehicle Owner Profile
```
GET /api/users/vehicle-owner/me
```

### 2.2 Get Vehicle Owner Profile (Alternative)
```
GET /api/users/vehicleowner/profile
```

---

## 3. CAR MANAGEMENT APIs

### 3.1 Add Car Details
```
POST /api/users/cardetails/signup
```
**Request Body (FormData):**
```
car_name: string
car_type: string
car_number: string
organization_id: string
vehicle_owner_id: string
rc_front_img: File
rc_back_img: File
insurance_img: File
fc_img: File
car_img: File
```

### 3.2 Get Available Cars
```
GET /api/assignments/available-cars
```

### 3.3 Get Available Cars (Alternative)
```
GET /api/users/available-cars
```

### 3.4 Get All Cars
```
GET /api/users/cardetails/all
```

### 3.5 Get Cars by Organization
```
GET /api/users/cardetails/organization/{organization_id}
```

### 3.6 Get Cars by Vehicle Owner
```
GET /api/users/vehicle-owner/{vehicle_owner_id}/cars
```

---

## 4. DRIVER MANAGEMENT APIs

### 4.1 Get Available Drivers
```
GET /api/assignments/available-drivers
```

### 4.2 Get Available Drivers (Alternative)
```
GET /api/users/available-drivers
```

### 4.3 Get All Drivers
```
GET /api/users/cardriver/all
```

### 4.4 Get Driver by ID
```
GET /api/users/cardriver/{driver_id}
```

### 4.5 Get Drivers by Vehicle Owner
```
GET /api/users/cardriver/vehicle-owner/{vehicle_owner_id}
```

### 4.6 Get Drivers by Organization
```
GET /api/users/cardriver/organization/{organization_id}
```

### 4.7 Get Driver by Mobile
```
GET /api/users/cardriver/mobile/{mobile_number}
```

### 4.8 Update Driver Profile
```
PUT /api/users/cardriver/{driver_id}
```

### 4.9 Delete Driver
```
DELETE /api/users/cardriver/{driver_id}
```

### 4.10 Search Drivers
```
GET /api/users/cardriver/search
```
**Query Parameters:**
```
organization_id?: string
status?: string
vehicle_type?: string
experience_min?: number
experience_max?: number
location?: string
```

### 4.11 Set Driver Online
```
PUT /api/users/cardriver/online
```
**Request Body:**
```json
{
  "driver_id": "string"
}
```

### 4.12 Set Driver Offline
```
PUT /api/users/cardriver/offline
```
**Request Body:**
```json
{
  "driver_id": "string"
}
```

---

## 5. ORDER MANAGEMENT APIs

### 5.1 Get Pending Orders
```
GET /api/orders/vehicle_owner/pending
```

### 5.2 Get Pending Orders (Alternative)
```
GET /api/assignments/vehicle_owner/pending
```

### 5.3 Get All Pending Orders
```
GET /api/orders/pending-all
```

### 5.4 Get Order Details
```
GET /api/orders/{order_id}
```

---

## 6. ASSIGNMENT APIs

### 6.1 Accept Order
```
POST /api/assignments/acceptorder
```
**Request Body:**
```json
{
  "order_id": "number"
}
```

### 6.2 Update Assignment Status
```
PATCH /api/assignments/{assignment_id}/status
```
**Request Body:**
```json
{
  "assignment_status": "PENDING|ASSIGNED|DRIVING|COMPLETED|CANCELLED"
}
```

### 6.3 Assign Driver and Car to Order
```
PATCH /api/assignments/{assignment_id}/assign-car-driver
```
**Request Body:**
```json
{
  "driver_id": "string",
  "car_id": "string"
}
```

### 6.4 Get Assignment Details
```
GET /api/assignments/{assignment_id}
```

### 6.5 Get Assignments by Order
```
GET /api/assignments/order/{order_id}
```

### 6.6 Get Assignments by Vehicle Owner
```
GET /api/assignments/vehicle_owner/{vehicle_owner_id}
```

### 6.7 Get User Assignments
```
GET /api/assignments/user
```

### 6.8 Get Driver Assigned Orders
```
GET /api/assignments/driver/assigned-orders
```

### 6.9 Get Assignments for Driver
```
GET /api/assignments/driver/{driver_id}
```

### 6.10 Check Driver Availability
```
GET /api/assignments/driver/{driver_id}/availability
```

### 6.11 Check Car Availability
```
GET /api/assignments/car/{car_id}/availability
```

---

## 7. TRIP MANAGEMENT APIs

### 7.1 Start Driver Trip
```
POST /api/assignments/driver/start-trip/{assignment_id}
```
**Request Body (FormData):**
```
start_km: number
speedometer_img: File
```

### 7.2 End Driver Trip
```
POST /api/assignments/driver/end-trip/{assignment_id}
```
**Request Body (FormData):**
```
end_km: number
contact_number: string
close_speedometer_img: File
```

---

## 8. WALLET & PAYMENT APIs

### 8.1 Create Razorpay Order
```
POST /api/wallet/razorpay/order
```
**Request Body:**
```json
{
  "amount": "number",
  "currency": "string",
  "notes": "object"
}
```

### 8.2 Verify Razorpay Payment
```
POST /api/wallet/razorpay/verify
```
**Request Body:**
```json
{
  "razorpay_order_id": "string",
  "razorpay_payment_id": "string",
  "razorpay_signature": "string"
}
```

### 8.3 Get Wallet Balance
```
GET /api/wallet/balance
```

### 8.4 Get Wallet Ledger
```
GET /api/wallet/ledger
```

### 8.5 Deduct from Wallet
```
POST /api/wallet/deduct
```
**Request Body:**
```json
{
  "amount": "number",
  "description": "string",
  "metadata": "object"
}
```

### 8.6 Add to Wallet
```
POST /api/wallet/add
```
**Request Body:**
```json
{
  "amount": "number",
  "description": "string",
  "metadata": "object"
}
```

### 8.7 Process Trip Payment
```
POST /api/payments/trip-payment
```
**Request Body:**
```json
{
  "trip_id": "string",
  "amount": "number",
  "trip_details": "object"
}
```

### 8.8 Get Payment History
```
GET /api/payments/history
```

---

## 9. VENDOR APIs (Vendor App)

### 9.1 Vendor Signup
```
POST /api/users/vendor/signup
```

### 9.2 Vendor Signin
```
POST /api/users/vendor/signin
```

### 9.3 Create Quote
```
POST /api/orders/oneway/quote
```

### 9.4 Confirm Order
```
POST /api/orders/oneway/confirm
```

### 9.5 Get Vendor Orders
```
GET /api/orders/vendor
```

---

## 10. TEST & DEBUG APIs

### 10.1 Test Organization Connection
```
GET /api/users/cardetails/organization/test
```

### 10.2 Test Signup Connection
```
GET /api/users/vehicleowner/signup
```

### 10.3 Test Car Details Connection
```
GET /api/users/cardetails/signup
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "string",
  "data": "object|array"
}
```

### Error Response
```json
{
  "detail": "string",
  "message": "string",
  "status": "number"
}
```

### Assignment Response
```json
{
  "id": "string",
  "order_id": "string",
  "driver_id": "string",
  "car_id": "string",
  "assigned_by": "string",
  "status": "string",
  "assignment_status": "PENDING|ASSIGNED|DRIVING|COMPLETED|CANCELLED",
  "assignment_notes": "string",
  "assigned_at": "string",
  "updated_at": "string"
}
```

---

## Status Values

### Driver Status
- `ONLINE`
- `OFFLINE`
- `DRIVING`
- `BLOCKED`
- `PROCESSING`

### Car Status
- `ONLINE`
- `OFFLINE`
- `ACTIVE`
- `PROCESSING`

### Assignment Status
- `PENDING`
- `ASSIGNED`
- `DRIVING`
- `COMPLETED`
- `CANCELLED`

### Order Status
- `PENDING`
- `ACCEPTED`
- `IN_PROGRESS`
- `COMPLETED`

---

## Current Assignment Flow

### Two-Step Assignment Process:

1. **Accept Order** (Creates PENDING assignment):
   ```
   POST /api/assignments/acceptorder
   Body: { "order_id": 3 }
   ```

2. **Assign Driver and Car** (Changes to ASSIGNED):
   ```
   PATCH /api/assignments/{assignment_id}/assign-car-driver
   Body: {
     "driver_id": "b156ce36-40e5-409f-a920-58f16d2e2eb0",
     "car_id": "783a38d1-5269-4a5f-91e9-4fe98eb58b95"
   }
   ```

### Status Flow:
- **Order Status**: Remains `PENDING` throughout
- **Assignment Status**: `PENDING` → `ASSIGNED` → `DRIVING` → `COMPLETED`

This documentation covers all the APIs currently being used across your Driver App, Frontend App, and Vendor App with their complete parameter structures and expected responses.
