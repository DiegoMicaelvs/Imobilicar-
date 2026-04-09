import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertVehicle, InsertCustomer } from "@shared/schema";

export function useAdminMutations() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const createVehicle = useMutation({
        mutationFn: async (data: InsertVehicle) => {
            return await apiRequest("POST", "/api/vehicles", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
            toast({ title: "Veículo cadastrado", description: "O veículo foi adicionado com sucesso!" });
        },
    });

    const updateVehicle = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: InsertVehicle }) => {
            return await apiRequest("PATCH", `/api/vehicles/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
            toast({ title: "Veículo atualizado", description: "As informações do veículo foram atualizadas com sucesso!" });
        },
    });

    const deleteVehicle = useMutation({
        mutationFn: async (id: string) => {
            return await apiRequest("DELETE", `/api/vehicles/${id}`, undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
            toast({ title: "Veículo excluído", description: "O veículo foi removido com sucesso!" });
        },
    });

    const createCustomer = useMutation({
        mutationFn: async (data: InsertCustomer) => {
            const response = await apiRequest("POST", "/api/customers", data);
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
            toast({ title: "Cliente adicionado", description: "O cliente foi adicionado com sucesso!" });
        },
    });

    const updateCustomer = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCustomer> }) => {
            return await apiRequest("PATCH", `/api/customers/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
            toast({ title: "Cliente atualizado", description: "As informações do cliente foram atualizadas com sucesso!" });
        },
    });

    const deleteCustomer = useMutation({
        mutationFn: async (id: string) => {
            return await apiRequest("DELETE", `/api/customers/${id}`, undefined);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
            toast({ title: "Cliente removido", description: "O cliente foi removido com sucesso!" });
        },
    });

    const approveRental = useMutation({
        mutationFn: async (rentalId: string) => {
            const response = await apiRequest("POST", `/api/rentals/${rentalId}/approve`, {});
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
            toast({ title: "Aluguel aprovado", description: "O aluguel foi aprovado e o cliente foi criado no CRM!" });
        },
    });

    const updateRentalStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            return await apiRequest("PATCH", `/api/rentals/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
            toast({ title: "Status atualizado", description: "O status do aluguel foi atualizado com sucesso!" });
        },
    });

    const approveInvestor = useMutation({
        mutationFn: async ({ id, dailyPrice }: { id: string; dailyPrice?: string }) => {
            return await apiRequest("POST", `/api/investors/${id}/approve`, dailyPrice ? { dailyPrice } : {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vehicle-requests"] });
            toast({ title: "Investidor aprovado", description: "O investidor e seus veículos foram aprovados com sucesso!" });
        },
    });

    const rejectInvestor = useMutation({
        mutationFn: async (id: string) => {
            return await apiRequest("POST", `/api/investors/${id}/reject`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vehicle-requests"] });
            toast({ title: "Investidor rejeitado", description: "O investidor e seus veículos foram rejeitados." });
        },
    });

    const uploadInvestmentPayment = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            return await apiRequest("POST", `/api/investors/${id}/payments`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/investor-payments"] });
            toast({ title: "Pagamento registrado", description: "O pagamento do investidor foi registrado com sucesso!" });
        },
    });

    const approveFinancing = useMutation({
        mutationFn: async (financingId: string) => {
            return await apiRequest("PATCH", `/api/financings/${financingId}`, { approvalStatus: "approved" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/financings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
            queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
            toast({ title: "Financiamento aprovado", description: "O financiamento foi aprovado com sucesso!" });
        },
    });

    const rejectFinancing = useMutation({
        mutationFn: async (financingId: string) => {
            return await apiRequest("PATCH", `/api/financings/${financingId}`, { approvalStatus: "rejected" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/financings"] });
            queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
            toast({ title: "Financiamento rejeitado", description: "O financiamento foi rejeitado." });
        },
    });

    const createAdminUser = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) throw new Error("Erro ao criar usuário");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            toast({ title: "Usuário criado", description: "Novo administrador criado com sucesso." });
        },
    });

    return {
        createVehicle,
        updateVehicle,
        deleteVehicle,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        approveRental,
        updateRentalStatus,
        approveInvestor,
        rejectInvestor,
        uploadInvestmentPayment,
        approveFinancing,
        rejectFinancing,
        createAdminUser,
    };
}
