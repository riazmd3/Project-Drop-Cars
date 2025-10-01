import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/auth/authService';
import * as SecureStore from 'expo-secure-store';
import { extractUserIdFromJWT } from '@/utils/jwtDecoder';

const toNumber = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const safePickLoc = (v: any): Record<string, string> => {
  if (!v) return {};
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return {}; }
  }
  return v;
};

export interface PendingOrder {
  id: string | null;
  order_id: number;
  vehicle_owner_id: string;
  driver_id: string | null;
  car_id: string | null;
  assignment_status: string; // PENDING
  assigned_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  vendor_id: string;
  trip_type: string; // Oneway, Roundtrip, etc.
  car_type: string; // Sedan, SUV, etc.
  pickup_drop_location: Record<string, string>; // { "0": "CityA", "1": "CityB" }
  start_date_time: string;
  customer_name: string;
  customer_number: string;
  cost_per_km: number; // may be 0
  extra_cost_per_km: number;
  driver_allowance: number;
  extra_driver_allowance: number;
  permit_charges: number;
  extra_permit_charges: number;
  hill_charges: number;
  toll_charges: number;
  pickup_notes: string | null;
  trip_status: string; // PENDING
  pick_near_city: string;
  trip_distance: number; // km
  trip_time: string;
  platform_fees_percent: number;
  estimated_price: number ;
  vendor_price: number | null;
  order_created_at: string;
}

export interface PendingOrderView extends PendingOrder {
  pickup_city: string;
  drop_city: string;
  per_km_price: number | null; // derived when backend sends 0
  total_amount: number | null; // vendor_price || estimated_price
}

export async function getPendingOrders(params?: { limit?: number; page?: number }): Promise<PendingOrderView[]> {
  const authHeaders = await getAuthHeaders(); // VO Bearer token
  console.warn('VO pending orders fetch start', { hasAuth: !!(authHeaders as any)?.Authorization });
  const t0 = Date.now();
  const response = await axiosInstance.get('/api/orders/vehicle_owner/pending', {
    headers: authHeaders,
    params: { limit: params?.limit ?? 20, page: params?.page ?? 1 },
  }); 
  console.log('VO pending orders fetch response:', response.data);
  const ms = Date.now() - t0;
  console.log('⏱️ VO pending orders fetched in ms:', ms);

  const data: PendingOrder[] = Array.isArray(response.data) ? response.data : [];
  console.warn('VO pending orders count:', data.length);
  if (data.length > 0) {
    const sample = data[0];
    console.warn('VO pending sample:', {
      order_id: sample.order_id,
      trip_type: sample.trip_type,
      car_type: sample.car_type,
      estimated_price: sample.estimated_price,
      vendor_price: sample.vendor_price,
      distance: sample.trip_distance,
      time: sample.trip_time,
    });
    console.log('sample types', {
      vendor_price: typeof (sample as any)?.vendor_price,
      estimated_price: typeof (sample as any)?.estimated_price,
      trip_distance: typeof (sample as any)?.trip_distance,
      pickup_drop_location: typeof (sample as any)?.pickup_drop_location,
    });
  }

  return data.map((o) => {
    const loc = safePickLoc((o as any).pickup_drop_location);
    const cities = Object.values(loc || {});
    const pickup_city = cities[0] || '';
    const drop_city = cities[1] || '';

    const vendor = toNumber((o as any).vendor_price) ?? undefined;
    const estimate = toNumber((o as any).estimated_price) ?? undefined;
    const total_amount = vendor ?? estimate ?? null;

    const distance = toNumber((o as any).trip_distance) ?? toNumber((o as any).distance) ?? 0;
    const cost_per_km = toNumber((o as any).cost_per_km);

    const per_km_price = total_amount != null && distance > 0
      ? Math.round(((total_amount as number) / (distance as number)) * 100) / 100
      : cost_per_km;

    return {
      ...o,
      pickup_city,
      drop_city,
      total_amount,
      per_km_price: per_km_price === 0 ? null : per_km_price,
    } as PendingOrderView;
  });
}

export interface FutureRide {
  id: string;
  order_id: number;
  vehicle_owner_id: string;
  driver_id: string | null;
  car_id: string | null;
  assignment_status: string;
  assigned_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  vendor_id: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: Record<string, string>;
  start_date_time: string;
  customer_name: string;
  customer_number: string;
  cost_per_km: number;
  extra_cost_per_km: number;
  driver_allowance: number;
  extra_driver_allowance: number;
  permit_charges: number;
  extra_permit_charges: number;
  hill_charges: number;
  toll_charges: number;
  pickup_notes: string | null;
  trip_status: string;
  pick_near_city: string;
  trip_distance: number;
  trip_time: string;
  platform_fees_percent: number;
  estimated_price: number;
  vendor_price: number | null;
  order_created_at: string;
  pickup_city?: string;
  drop_city?: string;
  total_amount?: number | null;
  per_km_price?: number | null;
}

export interface FutureRideView extends FutureRide {
  pickup_city: string;
  drop_city: string;
  total_amount: number | null;
  per_km_price: number | null;
}

// Get future rides (pending orders) using the correct API
export async function getFutureRidesForVehicleOwner(): Promise<FutureRideView[]> {
  try {
    console.log('🚗 Fetching future rides (pending orders) for Vehicle Owner...');

    // Get Auth headers (VO Bearer token)
    const authHeaders = await getAuthHeaders();
    console.log('🔑 Auth headers ready:', !!(authHeaders as any)?.Authorization);

    // Get current user ID from token
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const currentUserId = extractUserIdFromJWT(token);
    if (!currentUserId) {
      throw new Error('Could not extract user ID from token');
    }

    console.log('🔍 Current user ID:', currentUserId);

    // Fetch pending orders using the correct API
    const response = await axiosInstance.get('/api/orders/vehicle-owner/pending', {
      headers: authHeaders,
    });

    const data: PendingOrder[] = Array.isArray(response.data) ? response.data : [];
    console.log(`✅ Future rides fetched: ${data.length} orders (before filtering)`);

    // Filter orders to only show those belonging to the current user
    const filteredData = data.filter((order) => {
      // Check if the order belongs to the current user
      const orderBelongsToUser = order.vendor_id === currentUserId;
      
      // Also filter out orders with alphanumeric IDs (like B43) as they seem to be from other accounts
      const hasValidId = order.id && typeof order.id === 'number' && order.id > 0;
      
      return orderBelongsToUser && hasValidId;
    });

    console.log(`🔍 Filtered future rides: ${filteredData.length} orders (after filtering)`);

    if (filteredData.length > 0) {
      console.log('📦 Sample filtered future ride:', {
        id: filteredData[0].id,
        vendor_id: filteredData[0].vendor_id,
        currentUserId,
        trip_type: filteredData[0].trip_type,
        car_type: filteredData[0].car_type,
        estimated_price: filteredData[0].estimated_price,
        vendor_price: filteredData[0].vendor_price,
        trip_distance: filteredData[0].trip_distance,
        pickup_drop_location: filteredData[0].pickup_drop_location,
      });
    }

    // Map the data to FutureRideView format
    return filteredData.map((order) => {
      const loc = safePickLoc(order.pickup_drop_location);
      const cities = Object.values(loc || {});
      const pickup_city = cities[0] || 'Unknown';
      const drop_city = cities[1] || 'Unknown';

      const vendor = toNumber(order.vendor_price) ?? undefined;
      const estimate = toNumber(order.estimated_price) ?? undefined;
      const total_amount = vendor ?? estimate ?? 0;

      const distance = toNumber(order.trip_distance) ?? 0;
      const cost_per_km = toNumber(order.cost_per_km);

      const per_km_price = total_amount > 0 && distance > 0
        ? Math.round((total_amount / distance) * 100) / 100
        : cost_per_km;

      return {
        ...order,
        pickup_city,
        drop_city,
        total_amount,
        per_km_price: per_km_price === 0 ? null : per_km_price,
      } as FutureRideView;
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch future rides:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      console.warn('⚠️ No pending orders found');
      return [];
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch future rides');
    }
  }
}

// Get completed/cancelled orders using the non-pending API
export async function getCompletedOrdersForVehicleOwner(): Promise<FutureRideView[]> {
  try {
    console.log('📋 Fetching completed orders for Vehicle Owner...');

    // Get Auth headers (VO Bearer token)
    const authHeaders = await getAuthHeaders();
    console.log('🔑 Auth headers ready:', !!(authHeaders as any)?.Authorization);

    // Get current user ID from token
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const currentUserId = extractUserIdFromJWT(token);
    if (!currentUserId) {
      throw new Error('Could not extract user ID from token');
    }

    console.log('🔍 Current user ID:', currentUserId);

    // Fetch non-pending orders using the correct API
    const response = await axiosInstance.get('/api/orders/vehicle-owner/non-pending', {
      headers: authHeaders,
    });

    const data: PendingOrder[] = Array.isArray(response.data) ? response.data : [];
    console.log(`✅ Completed orders fetched: ${data.length} orders (before filtering)`);

    // Filter orders to only show those belonging to the current user
    const filteredData = data.filter((order) => {
      // Check if the order belongs to the current user
      const orderBelongsToUser = order.vendor_id === currentUserId;
      
      // Also filter out orders with alphanumeric IDs (like B43) as they seem to be from other accounts
      const hasValidId = order.id && typeof order.id === 'number' && order.id > 0;
      
      return orderBelongsToUser && hasValidId;
    });

    console.log(`🔍 Filtered completed orders: ${filteredData.length} orders (after filtering)`);

    if (filteredData.length > 0) {
      console.log('📦 Sample filtered completed order:', {
        id: filteredData[0].id,
        vendor_id: filteredData[0].vendor_id,
        currentUserId,
        trip_status: filteredData[0].trip_status,
        assignment_status: filteredData[0].assignment_status,
        estimated_price: filteredData[0].estimated_price,
        vendor_price: filteredData[0].vendor_price,
        trip_distance: filteredData[0].trip_distance,
      });
    }

    // Map the data to FutureRideView format
    return filteredData.map((order) => {
      const loc = safePickLoc(order.pickup_drop_location);
      const cities = Object.values(loc || {});
      const pickup_city = cities[0] || 'Unknown';
      const drop_city = cities[1] || 'Unknown';

      const vendor = toNumber(order.vendor_price) ?? undefined;
      const estimate = toNumber(order.estimated_price) ?? undefined;
      const total_amount = vendor ?? estimate ?? 0;

      const distance = toNumber(order.trip_distance) ?? 0;
      const cost_per_km = toNumber(order.cost_per_km);

      const per_km_price = total_amount > 0 && distance > 0
        ? Math.round((total_amount / distance) * 100) / 100
        : cost_per_km;

      return {
        ...order,
        pickup_city,
        drop_city,
        total_amount,
        per_km_price: per_km_price === 0 ? null : per_km_price,
      } as FutureRideView;
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch completed orders:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 404) {
      console.warn('⚠️ No completed orders found');
      return [];
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.message || 'Failed to fetch completed orders');
    }
  }
}
