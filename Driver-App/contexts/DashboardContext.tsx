import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DashboardData, fetchDashboardData } from '@/services/dashboardService';

export interface FutureRide {
  id: string;
  booking_id: string;
  pickup: string;
  drop: string;
  customer_name: string;
  customer_mobile: string;
  date: string;
  time: string;
  distance: number;
  fare_per_km: number;
  total_fare: number;
  status: string;
  assigned_driver: any | null;
}

interface DashboardContextType {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  futureRides: FutureRide[];
  addFutureRide: (ride: FutureRide) => void;
  updateFutureRide: (ride: FutureRide) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [futureRides, setFutureRides] = useState<FutureRide[]>([]);

  // Auto-fetch data when context is created
  useEffect(() => {
    console.log('🚀 DashboardContext created, auto-fetching data...');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Fetching dashboard data from context...');
      const data = await fetchDashboardData();
      setDashboardData(data);
      console.log('✅ Dashboard data loaded in context:', {
        user: data.user_info,
        carCount: data.cars.length,
        driverCount: data.drivers.length
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch dashboard data in context:', error);
      const errorMessage = error.message || 'Failed to load dashboard data';
      setError(errorMessage);
      
      // If it's an authentication error, we might want to redirect to login
      if (error.message?.includes('Authentication failed') || error.message?.includes('401')) {
        console.log('🔐 Authentication error detected, user may need to login again');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  const clearError = () => {
    setError(null);
  };

  const addFutureRide = (ride: FutureRide) => {
    setFutureRides(prev => {
      const exists = prev.find(r => (r.id || r.booking_id) === (ride.id || ride.booking_id));
      if (exists) {
        return prev;
      }
      return [ride, ...prev];
    });
  };

  const updateFutureRide = (ride: FutureRide) => {
    setFutureRides(prev => prev.map(r => (r.id === ride.id ? ride : r)));
  };

  return (
    <DashboardContext.Provider value={{
      dashboardData,
      loading,
      error,
      fetchData,
      refreshData,
      clearError,
      futureRides,
      addFutureRide,
      updateFutureRide
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
