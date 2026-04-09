import { useQuery } from "@tanstack/react-query";
import { Vehicle, Rental, Customer, VehicleRequest, InvestmentQuota, Financing, AdminUser, InvestorPayment } from "@shared/schema";

export function useAdminData(isAuthenticated: boolean, sellerId?: string) {
    const vehicles = useQuery<Vehicle[]>({
        queryKey: ["/api/vehicles"],
        enabled: isAuthenticated,
    });

    const rentals = useQuery<Rental[]>({
        queryKey: ["/api/rentals"],
        enabled: isAuthenticated,
    });

    const investors = useQuery<Customer[]>({
        queryKey: ["/api/investors"],
        enabled: isAuthenticated,
    });

    const vehicleRequests = useQuery<(VehicleRequest & { investor?: Customer })[]>({
        queryKey: ["/api/vehicle-requests"],
        enabled: isAuthenticated,
    });

    const customers = useQuery<Customer[]>({
        queryKey: ["/api/customers"],
        enabled: isAuthenticated,
    });

    const duplicateInvestors = useQuery<{ cpf: string; investors: Customer[] }[]>({
        queryKey: ["/api/investors/duplicates"],
        enabled: isAuthenticated,
    });

    const investmentQuotas = useQuery<InvestmentQuota[]>({
        queryKey: ["/api/investment-quotas"],
        enabled: isAuthenticated,
    });

    const financings = useQuery<Financing[]>({
        queryKey: ["/api/financings"],
        enabled: isAuthenticated,
    });

    const auditLogs = useQuery<any[]>({
        queryKey: ["/api/audit-logs"],
        enabled: false, // Carregamento manual na aba de Logs
    });

    const adminUsers = useQuery<Omit<AdminUser, 'password'>[]>({
        queryKey: ["/api/admin/users"],
        enabled: isAuthenticated,
    });

    const customerEvents = useQuery<any[]>({
        queryKey: ["/api/customer-events"],
        enabled: false, // Carregamento manual na aba de Eventos
    });

    const operationalExpenses = useQuery<any[]>({
        queryKey: ["/api/operational-expenses"],
        enabled: isAuthenticated,
    });

    const dividendSummary = useQuery<{
        currentPeriod: any;
        cumulative: any;
    }>({
        queryKey: ["/api/admin/dividends/summary"],
        enabled: isAuthenticated,
    });

    const allPayments = useQuery<InvestorPayment[]>({
        queryKey: ["/api/investor-payments", investors.data?.map(i => i.id).join(',') ?? ""],
        enabled: isAuthenticated && !!investors.data && investors.data.length > 0,
        queryFn: async () => {
            if (!investors.data || investors.data.length === 0) return [];
            const allPaymentPromises = investors.data.map(investor =>
                fetch(`/api/investors/${investor.id}/payments`).then(res => res.json())
            );
            const paymentsByInvestor = await Promise.all(allPaymentPromises);
            return paymentsByInvestor.flat();
        },
    });

    const tradeInVehicles = useQuery<any[]>({ queryKey: ["/api/trade-in-vehicles"], enabled: isAuthenticated });

    const financingProposals = useQuery<any[]>({
        queryKey: ["/api/financing-proposals/seller", sellerId],
        queryFn: async () => {
            const response = await fetch(`/api/financing-proposals/seller/${sellerId}`);
            if (!response.ok) throw new Error("Failed to fetch proposals");
            const data = await response.json();
            return data.filter((p: any) => p.status === "approved" && !p.dismissedAt);
        },
        enabled: isAuthenticated && !!sellerId,
        refetchInterval: 30000,
    });

    return {
        vehicles, rentals, investors, vehicleRequests, customers,
        duplicateInvestors, investmentQuotas, financings, auditLogs,
        adminUsers, customerEvents, operationalExpenses, dividendSummary,
        allPayments, tradeInVehicles, financingProposals,
        isLoading: vehicles.isLoading || rentals.isLoading || investors.isLoading || customers.isLoading || allPayments.isLoading,
    };
}
