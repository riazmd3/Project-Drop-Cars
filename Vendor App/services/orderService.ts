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
  max_time_to_assign_order: number;
  toll_charge_update: boolean;
  cost_per_km?: number;
  extra_cost_per_km?: number;
  driver_allowance?: number;
  extra_driver_allowance?: number;
  permit_charges?: number;
  extra_permit_charges?: number;
  hill_charges?: number;
  toll_charges?: number;
  pickup_notes: string;
  send_to?: string;
  near_city?: string;
  // Hourly rental fields
  package_hours?: number;
  cost_per_pack?: number;
  extra_cost_per_pack?: number;
  additional_cost_per_hour?: number;
  extra_additional_cost_per_hour?: number;
  pick_near_city?: string;
}

interface FormData {
  vendor_id: string;
  trip_type: string;
  car_type: string;
  pickup_drop_location: { [key: string]: string };
  start_date_time: Date;
  customer_name: string;
  customer_number: string;
  max_time_hours: string;
  max_time_minutes: string;
  toll_charge_update: boolean;
  // Common
  pickup_notes: string;
  // Regular trip
  cost_per_km?: string;
  extra_cost_per_km?: string;
  driver_allowance?: string;
  extra_driver_allowance?: string;
  permit_charges?: string;
  extra_permit_charges?: string;
  hill_charges?: string;
  toll_charges?: string;
  // Hourly rental
  package_hours?: string;
  cost_per_pack?: string;
  extra_cost_per_pack?: string;
  additional_cost_per_hour?: string;
  extra_additional_cost_per_hour?: string;
}

// ----------------------
// Quote API functions
// ----------------------

export const getOnewayQuote = async (quoteData: QuoteData) => {
  const response = await api.post('/orders/oneway/quote', quoteData);
  return response.data;
};

export const getRoundTripQuote = async (quoteData: QuoteData) => {
  const response = await api.post('/orders/roundtrip/quote', quoteData);
  return response.data;
};

export const getMulticityQuote = async (quoteData: QuoteData) => {
  const response = await api.post('/orders/multicity/quote', quoteData);
  return response.data;
};

export const getHourlyQuote = async (quoteData: QuoteData) => {
  const response = await api.post('/orders/hourly/quote', quoteData);
  return response.data;
};

// ----------------------
// Order Confirmation
// ----------------------

export const confirmOnewayOrder = async (orderData: QuoteData) => {
  const response = await api.post('/orders/oneway/confirm', orderData);
  return response.data;
};

export const confirmRoundTripOrder = async (orderData: QuoteData) => {
  const response = await api.post('/orders/roundtrip/confirm', orderData);
  return response.data;
};

export const confirmMulticityOrder = async (orderData: QuoteData) => {
  const response = await api.post('/orders/multicity/confirm', orderData);
  return response.data;
};

export const confirmHourlyOrder = async (orderData: QuoteData) => {
  const response = await api.post('/orders/hourly/confirm', orderData);
  return response.data;
};

// ----------------------
// Generic Dispatcher
// ----------------------

export const getQuote = async (quoteData: QuoteData) => {
  switch (quoteData.trip_type) {
    case 'Oneway':
      return getOnewayQuote(quoteData);
    case 'Round Trip':
      return getRoundTripQuote(quoteData);
    case 'Multy City':
      return getMulticityQuote(quoteData);
    default:
      throw new Error(`Unsupported trip type: ${quoteData.trip_type}`);
  }
};

export const confirmOrder = async (orderData: QuoteData) => {
  switch (orderData.trip_type) {
    case 'Oneway':
      return confirmOnewayOrder(orderData);
    case 'Round Trip':
      return confirmRoundTripOrder(orderData);
    case 'Multy City':
      return confirmMulticityOrder(orderData);
    case 'Hourly Rental':
      return confirmHourlyOrder(orderData);
    default:
      throw new Error(`Unsupported trip type: ${orderData.trip_type}`);
  }
};

// ----------------------
// Data Formatters
// ----------------------

export const formatOrderData = (
  formData: FormData,
  sendTo: string = 'ALL',
  nearCity: string = ''
): QuoteData => {
  // Convert hours and minutes to total minutes
  const hours = parseInt(formData.max_time_hours || '0');
  const minutes = parseInt(formData.max_time_minutes || '0');
  const totalMinutes = (hours * 60) + minutes;

  return {
    vendor_id: formData.vendor_id,
    trip_type: formData.trip_type,
    car_type: formData.car_type,
    pickup_drop_location: formData.pickup_drop_location,
    start_date_time: formData.start_date_time.toISOString(),
    customer_name: formData.customer_name,
    customer_number: formData.customer_number,
    max_time_to_assign_order: totalMinutes,
    toll_charge_update: formData.toll_charge_update,
    pickup_notes: formData.pickup_notes,
    ...(formData.cost_per_km && { cost_per_km: parseFloat(formData.cost_per_km) }),
    ...(formData.extra_cost_per_km && { extra_cost_per_km: parseFloat(formData.extra_cost_per_km) }),
    ...(formData.driver_allowance && { driver_allowance: parseFloat(formData.driver_allowance) }),
    ...(formData.extra_driver_allowance && { extra_driver_allowance: parseFloat(formData.extra_driver_allowance) }),
    ...(formData.permit_charges && { permit_charges: parseFloat(formData.permit_charges) }),
    ...(formData.extra_permit_charges && { extra_permit_charges: parseFloat(formData.extra_permit_charges) }),
    ...(formData.hill_charges && { hill_charges: parseFloat(formData.hill_charges) }),
    ...(formData.toll_charges && { toll_charges: parseFloat(formData.toll_charges) }),
    ...(sendTo && { send_to: sendTo }),
    ...(sendTo === 'NEAR_CITY' && nearCity && { near_city: nearCity }),
  };
};

export const formatHourlyOrderData = (
  formData: FormData,
  sendTo: string = 'ALL',
  nearCity: string = ''
): QuoteData => {
  // Convert hours and minutes to total minutes
  const hours = parseInt(formData.max_time_hours || '0');
  const minutes = parseInt(formData.max_time_minutes || '0');
  const totalMinutes = (hours * 60) + minutes;

  return {
    vendor_id: formData.vendor_id,
    trip_type: "Hourly Rental",
    car_type: formData.car_type,
    pickup_drop_location: formData.pickup_drop_location,
    start_date_time: formData.start_date_time.toISOString(),
    customer_name: formData.customer_name,
    customer_number: formData.customer_number,
    max_time_to_assign_order: totalMinutes,
    toll_charge_update: formData.toll_charge_update,
    pickup_notes: formData.pickup_notes,
    package_hours: parseInt(formData.package_hours || '0'),
    cost_per_pack: parseFloat(formData.cost_per_pack || '0'),
    extra_cost_per_pack: parseFloat(formData.extra_cost_per_pack || '0'),
    additional_cost_per_hour: parseFloat(formData.additional_cost_per_hour || '0'),
    extra_additional_cost_per_hour: parseFloat(formData.extra_additional_cost_per_hour || '0'),
    pick_near_city: sendTo === 'NEAR_CITY' ? nearCity : 'ALL',
    send_to: sendTo,
  };
};