import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { Lead, Rental, Customer } from '@shared/schema';

interface CrmDataContextType {
  // Data queries
  leads: Lead[] | undefined;
  rentals: Rental[] | undefined;
  vehicles: any[] | undefined;
  financings: any[] | undefined;
  customers: Customer[] | undefined;
  auditLogs: any[] | undefined;
  adminUsers: any[] | undefined;
  templates: any[] | undefined;
  customerEvents: any[] | undefined;
  investmentQuotas: any[] | undefined;
  investors: any[] | undefined;
  tradeInVehicles: any[] | undefined;
  vehicleRequests: any[] | undefined;
  plans: any[] | undefined;
  
  // Refetch functions
  refetch: {
    auditLogs: () => Promise<any>;
    customerEvents: () => Promise<any>;
  };
  
  // Loading states
  isLoading: {
    leads: boolean;
    rentals: boolean;
    vehicles: boolean;
    financings: boolean;
    customers: boolean;
    auditLogs: boolean;
    adminUsers: boolean;
    templates: boolean;
    customerEvents: boolean;
    quotas: boolean;
    investors: boolean;
    tradeInVehicles: boolean;
    vehicleRequests: boolean;
    plans: boolean;
  };
  
  // Error states
  isError: {
    leads: boolean;
    rentals: boolean;
  };
  
  // Invalidation helpers
  invalidate: {
    leads: () => Promise<void>;
    rentals: () => Promise<void>;
    vehicles: () => Promise<void>;
    financings: () => Promise<void>;
    customers: () => Promise<void>;
    auditLogs: () => Promise<void>;
    adminUsers: () => Promise<void>;
    templates: () => Promise<void>;
    customerEvents: () => Promise<void>;
    quotas: () => Promise<void>;
    investors: () => Promise<void>;
    tradeInVehicles: () => Promise<void>;
    vehicleRequests: () => Promise<void>;
    plans: () => Promise<void>;
    all: () => Promise<void>;
  };
}

const CrmDataContext = createContext<CrmDataContextType | undefined>(undefined);

export function CrmDataProvider({ children }: { children: ReactNode }) {
  // Single master query to prevent HTTP connection starvation on mobile (12 concurrent UI requests)
  const { data: dashboardData, isLoading: dashboardLoading, isError: dashboardError } = useQuery<any>({
    queryKey: ['/api/crm/dashboard'],
    staleTime: 30000, // 30 seconds to prevent aggressive refreshing when moving files
  });

  const leads = dashboardData?.leads;
  const vehicles = dashboardData?.vehicles;
  const financings = dashboardData?.financings;
  const customers = dashboardData?.customers;
  const adminUsers = dashboardData?.adminUsers;
  const templates = dashboardData?.templates;
  const investmentQuotas = dashboardData?.investmentQuotas;
  const investors = dashboardData?.investors;
  const tradeInVehicles = dashboardData?.tradeInVehicles;
  const plans = dashboardData?.plans;

  // We keep polling queries alive but they can fall back to dashboardData
  const rentalsQuery = useQuery<Rental[]>({
    queryKey: ['/api/rentals'],
    refetchInterval: 30000,
  });
  const rentals = rentalsQuery.data || dashboardData?.rentals;
  const rentalsLoading = rentalsQuery.isLoading && dashboardLoading;
  const rentalsError = rentalsQuery.isError;

  const vehicleRequestsQuery = useQuery<any[]>({
    queryKey: ['/api/vehicle-requests'],
    refetchInterval: 30000,
  });
  const vehicleRequests = vehicleRequestsQuery.data || dashboardData?.vehicleRequests;
  const vehicleRequestsLoading = vehicleRequestsQuery.isLoading && dashboardLoading;

  // Audit Logs and Customer Events remain as manual queries
  const auditLogsQuery = useQuery<any[]>({
    queryKey: ['/api/audit-logs'],
    enabled: false,
  });
  const auditLogs = auditLogsQuery.data;
  const auditLogsLoading = auditLogsQuery.isLoading;

  const customerEventsQuery = useQuery<any[]>({
    queryKey: ['/api/customer-events'],
    enabled: false,
  });
  const customerEvents = customerEventsQuery.data;
  const customerEventsLoading = customerEventsQuery.isLoading;

  // Invalidation helpers - we trigger the master dashboard query refresh
  const triggerMasterRefresh = () => queryClient.invalidateQueries({ queryKey: ['/api/crm/dashboard'] });
  
  const invalidate = {
    leads: async () => { triggerMasterRefresh(); },
    rentals: async () => { queryClient.invalidateQueries({ queryKey: ['/api/rentals'] }); triggerMasterRefresh(); },
    vehicles: async () => { triggerMasterRefresh(); },
    financings: async () => { triggerMasterRefresh(); },
    customers: async () => { triggerMasterRefresh(); },
    auditLogs: async () => { queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] }); },
    adminUsers: async () => { triggerMasterRefresh(); },
    templates: async () => { triggerMasterRefresh(); },
    customerEvents: async () => { queryClient.invalidateQueries({ queryKey: ['/api/customer-events'] }); },
    quotas: async () => { triggerMasterRefresh(); },
    investors: async () => { triggerMasterRefresh(); },
    tradeInVehicles: async () => { triggerMasterRefresh(); },
    vehicleRequests: async () => { queryClient.invalidateQueries({ queryKey: ['/api/vehicle-requests'] }); triggerMasterRefresh(); },
    plans: async () => { triggerMasterRefresh(); },
    all: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/crm/dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/rentals'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/customer-events'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/vehicle-requests'] }),
      ]);
    },
  };

  const value: CrmDataContextType = {
    leads,
    rentals,
    vehicles,
    financings,
    customers,
    auditLogs,
    adminUsers,
    templates,
    customerEvents,
    investmentQuotas,
    investors,
    tradeInVehicles,
    vehicleRequests,
    plans,
    refetch: {
      auditLogs: () => auditLogsQuery.refetch(),
      customerEvents: () => customerEventsQuery.refetch(),
    },
    isLoading: {
      leads: dashboardLoading,
      rentals: rentalsLoading,
      vehicles: dashboardLoading,
      financings: dashboardLoading,
      customers: dashboardLoading,
      auditLogs: auditLogsLoading,
      adminUsers: dashboardLoading,
      templates: dashboardLoading,
      customerEvents: customerEventsLoading,
      quotas: dashboardLoading,
      investors: dashboardLoading,
      tradeInVehicles: dashboardLoading,
      vehicleRequests: vehicleRequestsLoading,
      plans: dashboardLoading,
    },
    isError: {
      leads: dashboardError,
      rentals: rentalsError,
    },
    invalidate,
  };

  return (
    <CrmDataContext.Provider value={value}>
      {children}
    </CrmDataContext.Provider>
  );
}

export function useCrmData() {
  const context = useContext(CrmDataContext);
  if (!context) {
    throw new Error('useCrmData must be used within CrmDataProvider');
  }
  return context;
}
