import axiosInstance from '@/app/api/axiosInstance';
import { getAuthHeaders } from '@/services/authService';

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
  estimated_price: number | null;
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
  const t0 = Date.now();
  const response = await axiosInstance.get('/api/orders/vehicle_owner/pending', {
    headers: authHeaders,
    params: { limit: params?.limit ?? 20, page: params?.page ?? 1 },
  });
  const ms = Date.now() - t0;
  console.log('⏱️ VO pending orders fetched in ms:', ms);

  const data: PendingOrder[] = Array.isArray(response.data) ? response.data : [];

  return data.map((o) => {
    const cities = Object.values(o.pickup_drop_location || {});
    const pickup_city = cities[0] || '';
    const drop_city = cities[1] || '';
    const total_amount = (o.vendor_price ?? o.estimated_price) ?? null;
    const per_km_price = o.trip_distance > 0 && total_amount != null
      ? Math.round(((total_amount as number) / o.trip_distance) * 100) / 100
      : (o.cost_per_km || null);
    return {
      ...o,
      pickup_city,
      drop_city,
      per_km_price: per_km_price === 0 ? null : per_km_price,
      total_amount,
    } as PendingOrderView;
  });
}


