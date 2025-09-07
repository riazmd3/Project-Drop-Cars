// services/orderService.ts
import api from '../app/api/api';

// Define types for better TypeScript support
interface QuoteData {
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
  extra_permit_charges: number;
  hill_charges: number;
  toll_charges: number;
  pickup_notes: string;
  send_to?: string;
  near_city?: string;
}

interface FormData {
  vendor_id: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: { [key: string]: string };
  start_date_time: Date;
  customer_name: string;
  customer_number: string;
  cost_per_km: string;
  extra_cost_per_km: string;
  driver_allowance: string;
  extra_driver_allowance: string;
  permit_charges: string;
  extra_permit_charges: string;
  hill_charges: string;
  toll_charges: string;
  pickup_notes: string;
}

// Quote API functions
export const getOnewayQuote = async (quoteData: QuoteData) => {
  try {
    console.log('Making oneway quote request to:', '/orders/oneway/quote');
    console.log('Request data:', quoteData);
    const response = await api.post('/orders/oneway/quote', quoteData);
    console.log('Oneway quote response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting oneway quote:', error);
    throw error;
  }
};

export const getRoundTripQuote = async (quoteData: QuoteData) => {
  try {
    console.log('Making round trip quote request to:', '/orders/roundtrip/quote');
    console.log('Request data:', quoteData);
    const response = await api.post('/orders/roundtrip/quote', quoteData);
    console.log('Round trip quote response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting round trip quote:', error);
    throw error;
  }
};

export const getMulticityQuote = async (quoteData: QuoteData) => {
  try {
    console.log('Making multicity quote request to:', '/orders/multicity/quote');
    console.log('Request data:', quoteData);
    const response = await api.post('/orders/multicity/quote', quoteData);
    console.log('Multicity quote response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting multicity quote:', error);
    throw error;
  }
};

// Order confirmation API functions
export const confirmOnewayOrder = async (orderData: QuoteData) => {
  try {
    const response = await api.post('/orders/oneway/confirm', orderData);
    return response.data;
  } catch (error) {
    console.error('Error confirming oneway order:', error);
    throw error;
  }
};

export const confirmRoundTripOrder = async (orderData: QuoteData) => {
  try {
    const response = await api.post('/orders/roundtrip/confirm', orderData);
    return response.data;
  } catch (error) {
    console.error('Error confirming round trip order:', error);
    throw error;
  }
};

export const confirmMulticityOrder = async (orderData: QuoteData) => {
  try {
    const response = await api.post('/orders/multicity/confirm', orderData);
    return response.data;
  } catch (error) {
    console.error('Error confirming multicity order:', error);
    throw error;
  }
};

// Generic functions that automatically determine the endpoint based on trip type
export const getQuote = async (quoteData: QuoteData) => {
  const { trip_type } = quoteData;
  
  switch (trip_type) {
    case 'Oneway':
      return getOnewayQuote(quoteData);
    case 'Round Trip':
      return getRoundTripQuote(quoteData);
    case 'Multicity':
      return getMulticityQuote(quoteData);
    default:
      throw new Error(`Unsupported trip type: ${trip_type}`);
  }
};

export const confirmOrder = async (orderData: QuoteData) => {
  const { trip_type } = orderData;
  
  switch (trip_type) {
    case 'Oneway':
      return confirmOnewayOrder(orderData);
    case 'Round Trip':
      return confirmRoundTripOrder(orderData);
    case 'Multicity':
      return confirmMulticityOrder(orderData);
    default:
      throw new Error(`Unsupported trip type: ${trip_type}`);
  }
};

// Helper function to format form data for API
export const formatOrderData = (formData: FormData, sendTo: string = 'ALL', nearCity: string = ''): QuoteData => {
  return {
    vendor_id: formData.vendor_id,
    trip_type: formData.trip_type === 'Round Trip' ? 'Round Trip' : formData.trip_type,
    car_type: formData.car_type,
    pickup_drop_location: formData.pickup_drop_location,
    start_date_time: formData.start_date_time.toISOString(),
    customer_name: formData.customer_name,
    customer_number: formData.customer_number,
    cost_per_km: parseFloat(formData.cost_per_km),
    extra_cost_per_km: parseFloat(formData.extra_cost_per_km) || 0,
    driver_allowance: parseFloat(formData.driver_allowance) || 0,
    extra_driver_allowance: parseFloat(formData.extra_driver_allowance) || 0,
    permit_charges: parseFloat(formData.permit_charges) || 0,
    extra_permit_charges: parseFloat(formData.extra_permit_charges) || 0,
    hill_charges: parseFloat(formData.hill_charges) || 0,
    toll_charges: parseFloat(formData.toll_charges) || 0,
    pickup_notes: formData.pickup_notes,
    ...(sendTo === 'NEAR_CITY' && nearCity && { near_city: nearCity }),
    ...(sendTo && { send_to: sendTo })
  };
};