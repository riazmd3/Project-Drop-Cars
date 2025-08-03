export interface Booking {
  id: string;
  vendorId: string;
  driverId?: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropLocation: string;
  driverPricing: {
    fare: number;
    distance: number;
    estimatedTime: string;
  };
  vendorPricing: {
    customerAmount: number;
    commission: number;
  };
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  assignedDriver?: {
    name: string;
    phone: string;
    carDetails: {
      name: string;
      type: string;
      number: string;
    };
  };
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}