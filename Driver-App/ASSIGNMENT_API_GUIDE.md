# Assignment API Integration Guide

This guide explains how to use the new assignment API endpoints for driver and car assignment in the future rides functionality.

## New API Endpoints

### 1. Assign Driver and Car to Order
**Endpoint:** `POST /api/assignments/{order_id}/assign-car-driver`

**Description:** Assigns a specific driver and car to an order.

**Request Body:**
```json
{
  "driver_id": "b156ce36-40e5-409f-a920-58f16d2e2eb0",
  "car_id": "783a38d1-5269-4a5f-91e9-4fe98eb58b95"
}
```

**Example Usage:**
```typescript
import { assignCarDriverToOrder } from '@/services/assignmentService';

const assignment = await assignCarDriverToOrder(
  "3", // order_id
  "b156ce36-40e5-409f-a920-58f16d2e2eb0", // driver_id
  "783a38d1-5269-4a5f-91e9-4fe98eb58b95"  // car_id
);
```

### 2. Get Future Rides for Vehicle Owner
**Endpoint:** `GET /api/assignments/vehicle_owner/{vehicle_owner_id}`

**Description:** Retrieves all future rides/assignments for a specific vehicle owner.

**Example Usage:**
```typescript
import { getFutureRidesForVehicleOwner } from '@/services/assignmentService';

const futureRides = await getFutureRidesForVehicleOwner("a6fa5487-d2af-4790-9659-217f553c676e");
```

## Implementation Details

### Updated Functions in assignmentService.ts

1. **`assignCarDriverToOrder(orderId, driverId, carId)`**
   - Uses the new API endpoint for direct assignment
   - Handles error responses appropriately
   - Returns assignment response data

2. **`getFutureRidesForVehicleOwner(vehicleOwnerId)`**
   - Fetches future rides from the new API endpoint
   - Returns array of future ride data
   - Handles authentication and error cases

### Updated Future Rides Screen

The future rides screen now:
- Uses the new `assignCarDriverToOrder` function for assignments
- Fetches future rides using the new API endpoint
- Includes a refresh button to manually fetch future rides
- Maintains backward compatibility with existing functionality

## API Base URL

The API base URL is configured in `app/api/axiosInstance.tsx`:
```
http://10.100.155.145:8000
```

## Error Handling

The new functions include comprehensive error handling for:
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 409 Conflict (already assigned)
- 500 Server Error

## Usage in Future Rides

1. **Automatic Assignment:** When a user selects a driver and car, the system automatically calls the new API endpoint
2. **Future Rides Refresh:** Users can manually refresh future rides using the new API
3. **Real-time Updates:** The system updates the UI immediately after successful assignments

## Testing

To test the new functionality:
1. Navigate to the Future Rides tab
2. Click "Assign Driver & Vehicle" on any unassigned ride
3. Select a driver from the modal
4. Select a vehicle from the vehicle modal
5. The assignment will be created using the new API endpoint
6. Use the "Refresh Future Rides" button to test the future rides API

## Notes

- The new API endpoints are more direct and efficient than the previous implementation
- All existing functionality is preserved
- The system gracefully handles API failures and falls back to existing methods when needed
- Authentication is handled automatically through the axios instance
