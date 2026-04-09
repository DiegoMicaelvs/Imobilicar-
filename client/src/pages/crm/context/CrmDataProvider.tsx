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
  // All queries
  const { data: leads, isLoading: leadsLoading, isError: leadsError } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: rentals, isLoading: rentalsLoading, isError: rentalsError } = useQuery<Rental[]>({
    queryKey: ['/api/rentals'],
    refetchInterval: 30000,
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<any[]>({
    queryKey: ['/api/vehicles'],
  });

  const { data: financings, isLoading: financingsLoading } = useQuery<any[]>({
    queryKey: ['/api/financings'],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<any[]>({
    queryKey: ['/api/customers'],
  });

  const auditLogsQuery = useQuery<any[]>({
    queryKey: ['/api/audit-logs'],
    enabled: false,
  });
  const auditLogs = auditLogsQuery.data;
  const auditLogsLoading = auditLogsQuery.isLoading;

  const { data: adminUsers, isLoading: adminUsersLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ['/api/contract-templates'],
  });

  const customerEventsQuery = useQuery<any[]>({
    queryKey: ['/api/customer-events'],
    enabled: false,
  });
  const customerEvents = customerEventsQuery.data;
  const customerEventsLoading = customerEventsQuery.isLoading;

  const { data: investmentQuotas, isLoading: quotasLoading } = useQuery<any[]>({
    queryKey: ['/api/investment-quotas'],
  });

  const { data: investors, isLoading: investorsLoading } = useQuery<any[]>({
    queryKey: ['/api/investors'],
  });

  const { data: tradeInVehicles, isLoading: tradeInVehiclesLoading } = useQuery<any[]>({
    queryKey: ['/api/trade-in-vehicles'],
  });

  const { data: vehicleRequests, isLoading: vehicleRequestsLoading } = useQuery<any[]>({
    queryKey: ['/api/vehicle-requests'],
    refetchInterval: 30000,
  });

  const { data: plans, isLoading: plansLoading } = useQuery<any[]>({
    queryKey: ['/api/rental-plans'],
  });

  // Invalidation helpers
  const invalidate = {
    leads: () => queryClient.invalidateQueries({ queryKey: ['/api/leads'] }),
    rentals: () => queryClient.invalidateQueries({ queryKey: ['/api/rentals'] }),
    vehicles: () => queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] }),
    financings: () => queryClient.invalidateQueries({ queryKey: ['/api/financings'] }),
    customers: () => queryClient.invalidateQueries({ queryKey: ['/api/customers'] }),
    auditLogs: () => queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] }),
    adminUsers: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] }),
    templates: () => queryClient.invalidateQueries({ queryKey: ['/api/contract-templates'] }),
    customerEvents: () => queryClient.invalidateQueries({ queryKey: ['/api/customer-events'] }),
    quotas: () => queryClient.invalidateQueries({ queryKey: ['/api/investment-quotas'] }),
    investors: () => queryClient.invalidateQueries({ queryKey: ['/api/investors'] }),
    tradeInVehicles: () => queryClient.invalidateQueries({ queryKey: ['/api/trade-in-vehicles'] }),
    vehicleRequests: () => queryClient.invalidateQueries({ queryKey: ['/api/vehicle-requests'] }),
    plans: () => queryClient.invalidateQueries({ queryKey: ['/api/rental-plans'] }),
    all: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/leads'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/rentals'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/financings'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/customers'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/contract-templates'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/customer-events'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/investment-quotas'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/investors'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/trade-in-vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/vehicle-requests'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/rental-plans'] }),
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
      leads: leadsLoading,
      rentals: rentalsLoading,
      vehicles: vehiclesLoading,
      financings: financingsLoading,
      customers: customersLoading,
      auditLogs: auditLogsLoading,
      adminUsers: adminUsersLoading,
      templates: templatesLoading,
      customerEvents: customerEventsLoading,
      quotas: quotasLoading,
      investors: investorsLoading,
      tradeInVehicles: tradeInVehiclesLoading,
      vehicleRequests: vehicleRequestsLoading,
      plans: plansLoading,
    },
    isError: {
      leads: leadsError,
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
