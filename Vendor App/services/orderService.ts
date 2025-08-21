import { getCreateQuoteUrl, getConfirmOrderUrl } from '../config/api';

// Types for the order API
export interface OrderQuoteRequest {
  vendor_id: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: { [key: string]: string };
  start_date_time: string;
  customer_name: string;
  customer_number: string;
  cost_per_km: number;
  extra_cost_per_km: number;
  driver_allowance: number;
  extra_driver_allowance: number;
  permit_charges: number;
  hill_charges: number;
  toll_charges: number;
  pickup_notes: string;
}

export interface OrderQuoteResponse {
  fare: {
    total_km: number;
    base_km_amount: number;
    driver_allowance: number;
    extra_driver_allowance: number;
    permit_charges: number;
    hill_charges: number;
    toll_charges: number;
    total_amount: number;
  };
  echo: OrderQuoteRequest;
}

export interface OrderConfirmRequest extends OrderQuoteRequest {
  send_to: 'ALL' | 'NEAR_CITY';
  near_city?: string;
}

export interface OrderConfirmResponse {
  order_id: number;
  trip_status: string;
  pick_near_city: string;
  fare: {
    total_km: number;
    base_km_amount: number;
    driver_allowance: number;
    extra_driver_allowance: number;
    permit_charges: number;
    hill_charges: number;
    toll_charges: number;
    total_amount: number;
  };
}

export class OrderService {
  private static instance: OrderService;

  private constructor() {}

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * Create a quote for a oneway trip
   */
  public async createQuote(request: OrderQuoteRequest): Promise<OrderQuoteResponse> {
    try {
      const response = await fetch(getCreateQuoteUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result: OrderQuoteResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  /**
   * Confirm and create the order
   */
  public async confirmOrder(request: OrderConfirmRequest, accessToken: string): Promise<OrderConfirmResponse> {
    try {
      const response = await fetch(getConfirmOrderUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result: OrderConfirmResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const orderService = OrderService.getInstance();
