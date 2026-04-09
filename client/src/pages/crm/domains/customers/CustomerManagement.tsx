import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Gift, Edit, X, KeyRound, User, Mail, Phone, MapPin, CreditCard, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";

export default function CustomerManagement() {
  const { toast } = useToast();
  const { customers, rentals, financings, vehicles, vehicleRequests, customerEvents, isLoading, invalidate } = useCrmData();
  
  // State variables
  const [customerTypeFilter, setCustomerTypeFilter] = useState<"all" | "rental" | "financing" | "investor">("all");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchCpf, setSearchCpf] = useState("");
  const [bonusDialogOpen, setBonusDialogOpen] = useState<Record<string, boolean>>({});
  const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<any>(null);
  const [customerEditData, setCustomerEditData] = useState<any>({});
  const [customerPasswordDialogOpen, setCustomerPasswordDialogOpen] = useState(false);
  const [selectedCustomerForPassword, setSelectedCustomerForPassword] = useState<any>(null);
  const [newCustomerPassword, setNewCustomerPassword] = useState("");

  // Initialize customerEditData when a customer is selected
  useEffect(() => {
    if (selectedCustomerForEdit) {
      setCustomerEditData({
        cpf: selectedCustomerForEdit.cpf || "",
        name: selectedCustomerForEdit.name || "",
        email: selectedCustomerForEdit.email || "",
        phone: selectedCustomerForEdit.phone || "",
        rg: selectedCustomerForEdit.rg || "",
        street: selectedCustomerForEdit.street || "",
        complement: selectedCustomerForEdit.complement || "",
        neighborhood: selectedCustomerForEdit.neighborhood || "",
        city: selectedCustomerForEdit.city || "",
        state: selectedCustomerForEdit.state || "",
        zipCode: selectedCustomerForEdit.zipCode || "",
        driverLicense: selectedCustomerForEdit.driverLicense || "",
        emergencyContact: selectedCustomerForEdit.emergencyContact || "",
        paymentDate: selectedCustomerForEdit.paymentDate,
        bonusDate: selectedCustomerForEdit.bonusDate || "",
        bonusValue: selectedCustomerForEdit.bonusValue || "",
        monthlyDividend: selectedCustomerForEdit.monthlyDividend || "",
        status: selectedCustomerForEdit.status || "active"
      });
    }
  }, [selectedCustomerForEdit]);

  // Mutations
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Check for duplicate CPF if CPF is being changed
      if (data.cpf && selectedCustomerForEdit && data.cpf !== selectedCustomerForEdit.cpf) {
        const existingCustomer = customers?.find(c => c.cpf === data.cpf && c.id !== id);
        if (existingCustomer) {
          throw new Error("Já existe um cliente cadastrado com este CPF.");
        }
      }
      return await apiRequest("PATCH", `/api/customers/${id}`, data);
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidate.customers(),
        invalidate.customerEvents(),
        invalidate.rentals()
      ]);
      const isBonusUpdate = 'bonusBalance' in variables.data;
      toast({
        title: "Cliente atualizado",
        description: isBonusUpdate 
          ? "A bonificação foi atualizada com sucesso!" 
          : "As informações foram salvas com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    },
  });

  const updateCustomerPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return await apiRequest("PATCH", `/api/customers/${id}`, { password });
    },
    onSuccess: async () => {
      await invalidate.customers();
      toast({
        title: "Senha atualizada!",
        description: "Senha do cliente atualizada com sucesso.",
      });
      setCustomerPasswordDialogOpen(false);
      setSelectedCustomerForPassword(null);
      setNewCustomerPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message || "Ocorreu um erro ao atualizar a senha.",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: async () => {
      await Promise.all([
        invalidate.vehicles(),
        invalidate.customerEvents()
      ]);
      toast({
        title: "Veículo removido",
        description: "O veículo foi removido da frota com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover veículo",
        description: error.message || "Ocorreu um erro ao remover o veículo.",
        variant: "destructive",
      });
    },
  });

  // Filter customers - apenas clientes que usaram pelo menos um serviço
  const filteredCustomers = (customers || []).filter((customer: any) => {
    const hasRentals = rentals?.some((r: any) => r.customerCpf === customer.cpf);
    const hasFinancing = financings?.some((f: any) => f.customerCpf === customer.cpf);
    const hasInvestorVehicles = vehicles?.some((v: any) => v.ownerId === customer.id && v.isInvestorVehicle);
    const hasVehicleRequest = vehicleRequests?.some((vr: any) => vr.investorCpf === customer.cpf && vr.status !== "rejected");
    const isInvestor = hasInvestorVehicles || hasVehicleRequest;
    
    // Apenas clientes com pelo menos um serviço utilizado
    const hasUsedAnyService = hasRentals || hasFinancing || isInvestor;
    
    // Se não usou nenhum serviço, não exibir
    if (!hasUsedAnyService) return false;
    
    // Aplicar filtros específicos de tipo
    if (customerTypeFilter === "rental" && !hasRentals) return false;
    if (customerTypeFilter === "financing" && !hasFinancing) return false;
    if (customerTypeFilter === "investor" && !isInvestor) return false;
    
    // Aplicar filtros de busca manual
    if (searchName && !customer.name?.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchEmail && !customer.email?.toLowerCase().includes(searchEmail.toLowerCase())) return false;
    if (searchCpf && !customer.cpf?.includes(searchCpf)) return false;
    
    return true;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Gestão completa de clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Customer Type Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Button
              variant={customerTypeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomerTypeFilter("all")}
              data-testid="button-filter-all-customers"
            >
              Todos
            </Button>
            <Button
              variant={customerTypeFilter === "rental" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomerTypeFilter("rental")}
              className={customerTypeFilter === "rental" ? "" : "border-blue-500 text-blue-600"}
              data-testid="button-filter-rental-customers"
            >
              Aluguel
            </Button>
            <Button
              variant={customerTypeFilter === "financing" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomerTypeFilter("financing")}
              className={customerTypeFilter === "financing" ? "" : "border-purple-500 text-purple-600"}
              data-testid="button-filter-financing-customers"
            >
              Financiamento
            </Button>
            <Button
              variant={customerTypeFilter === "investor" ? "default" : "outline"}
              size="sm"
              onClick={() => setCustomerTypeFilter("investor")}
              className={customerTypeFilter === "investor" ? "" : "border-cyan-500 text-cyan-600"}
              data-testid="button-filter-investor-customers"
            >
              Investidor
            </Button>
          </div>

          {/* Search Filters */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  placeholder="Buscar por nome..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  data-testid="input-search-customer-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  placeholder="Buscar por email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  data-testid="input-search-customer-email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CPF</label>
                <Input
                  placeholder="Buscar por CPF..."
                  value={searchCpf}
                  onChange={(e) => setSearchCpf(e.target.value)}
                  data-testid="input-search-customer-cpf"
                />
              </div>
            </div>
            {(searchName || searchEmail || searchCpf) && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchName("");
                    setSearchEmail("");
                    setSearchCpf("");
                  }}
                  data-testid="button-clear-customer-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>

          {/* Loading state */}
          {isLoading.customers ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {customerTypeFilter === "all" 
                  ? "Nenhum cliente com serviços utilizados encontrado. Clientes aparecem aqui apenas após usarem aluguel, financiamento ou investimento."
                  : customerTypeFilter === "rental"
                  ? "Nenhum cliente de aluguel encontrado."
                  : customerTypeFilter === "financing"
                  ? "Nenhum cliente de financiamento encontrado."
                  : "Nenhum investidor encontrado."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCustomers.map((customer: any) => (
                <Card key={customer.id} className="overflow-hidden hover-elevate transition-all" data-testid={`card-customer-${customer.id}`}>
                  <div className="p-6 space-y-6">
                    {/* Header com Avatar e Nome */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <CardTitle className="text-2xl font-bold tracking-tight">{customer.name}</CardTitle>
                            {/* Queridômetro - Rating System */}
                            <div className="flex items-center gap-0.5" title="Queridômetro - Avaliação do Cliente">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCustomerMutation.mutate({
                                      id: customer.id,
                                      data: { rating: star === customer.rating ? 0 : star }
                                    });
                                  }}
                                  className="transition-all hover:scale-110"
                                  data-testid={`button-rating-${customer.id}-${star}`}
                                >
                                  <Star
                                    className={`h-5 w-5 transition-colors ${
                                      star <= (customer.rating || 0)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300 dark:text-gray-600 hover:text-yellow-200"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              customer.status === "active" 
                                ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                                : customer.status === "inactive"
                                ? "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                                : customer.status === "vip"
                                ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                : "bg-red-500/10 text-red-600 border border-red-500/20"
                            }`}>
                              {customer.status === "active" 
                                ? "✓ Ativo" 
                                : customer.status === "inactive"
                                ? "○ Inativo"
                                : customer.status === "vip"
                                ? "★ VIP"
                                : customer.status === "blocked"
                                ? "⊗ Bloqueado"
                                : customer.status}
                            </div>
                            {customer.createdAt && (
                              <span className="text-xs text-muted-foreground">
                                Cliente desde {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Customer Type Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const hasRentals = rentals?.some((r: any) => r.customerCpf === customer.cpf);
                          const hasFinancing = financings?.some((f: any) => f.customerCpf === customer.cpf);
                          const hasInvestorVehicles = vehicles?.some((v: any) => v.ownerId === customer.id && v.isInvestorVehicle);
                          const hasVehicleRequest = vehicleRequests?.some((vr: any) => vr.investorCpf === customer.cpf && vr.status !== "rejected");
                          const isInvestor = hasInvestorVehicles || hasVehicleRequest;
                          
                          return (
                            <>
                              {hasRentals && (
                                <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950">
                                  Aluguel
                                </Badge>
                              )}
                              {isInvestor && (
                                <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950">
                                  Investimento
                                </Badge>
                              )}
                              {hasFinancing && (
                                <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950">
                                  Financiamento
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Informações de Contato */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">CPF</p>
                          <p className="font-mono font-medium truncate">{customer.cpf}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium truncate">{customer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="font-medium">{customer.phone}</p>
                        </div>
                      </div>
                      {customer.rg && (
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">RG</p>
                            <p className="font-medium">{customer.rg}</p>
                          </div>
                        </div>
                      )}
                      {customer.street && (
                        <div className="flex items-center gap-3 md:col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">Endereço</p>
                            <p className="font-medium truncate">
                              {customer.street}
                              {customer.complement && `, ${customer.complement}`}
                              {customer.neighborhood && `, ${customer.neighborhood}`}
                              {customer.city && ` - ${customer.city}`}
                              {customer.state && `/${customer.state}`}
                              {customer.zipCode && ` - ${customer.zipCode}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bonificação (se houver) */}
                    {customer.bonusBalance !== undefined && customer.bonusBalance > 0 && (
                      <div className="mt-4">
                        <div className="p-4 rounded-lg border bg-card inline-block">
                          <div className="flex items-center gap-2 mb-2">
                            <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <p className="text-xs font-medium text-muted-foreground">Bonificação</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            R$ {Number(customer.bonusBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">disponível</p>
                        </div>
                      </div>
                    )}

                    {/* Edit Customer Button */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomerForEdit(customer);
                          setCustomerEditData({
                            cpf: customer.cpf,
                            name: customer.name,
                            email: customer.email,
                            phone: customer.phone,
                            rg: customer.rg || "",
                            street: customer.street || "",
                            complement: customer.complement || "",
                            neighborhood: customer.neighborhood || "",
                            city: customer.city || "",
                            state: customer.state || "",
                            zipCode: customer.zipCode || "",
                            driverLicense: customer.driverLicense || "",
                            emergencyContact: customer.emergencyContact || "",
                            paymentDate: customer.paymentDate || null,
                            bonusDate: customer.bonusDate || "",
                            bonusValue: customer.bonusValue || "",
                            monthlyDividend: customer.monthlyDividend || "",
                            status: customer.status || "active"
                          });
                          setEditCustomerDialogOpen(true);
                        }}
                        data-testid={`button-edit-customer-${customer.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Informações
                      </Button>
                    </div>

                    {/* Investor Info (without cancel button) */}
                    {(() => {
                      const hasInvestorVehicles = vehicles?.some((v: any) => v.ownerId === customer.id && v.isInvestorVehicle);
                      const investorVehicles = vehicles?.filter((v: any) => v.ownerId === customer.id && v.isInvestorVehicle) || [];
                      
                      if (!hasInvestorVehicles) return null;
                      
                      return (
                        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium text-sm text-orange-600 dark:text-orange-400">
                                Investidor Ativo
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {investorVehicles.length} veículo{investorVehicles.length !== 1 ? 's' : ''} em investimento
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Password Dialog */}
      <Dialog open={customerPasswordDialogOpen} onOpenChange={setCustomerPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha de {selectedCustomerForPassword?.name}</DialogTitle>
            <DialogDescription>
              Digite uma nova senha para o cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Senha</label>
              <Input 
                type="password" 
                placeholder="Mínimo 6 caracteres"
                value={newCustomerPassword}
                onChange={(e) => setNewCustomerPassword(e.target.value)}
                data-testid="input-customer-password" 
              />
              <p className="text-xs text-muted-foreground">
                A senha será atualizada e o cliente poderá fazer login com a nova senha.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={() => {
                if (!newCustomerPassword || newCustomerPassword.length < 6) {
                  toast({
                    title: "Senha inválida",
                    description: "A senha deve ter no mínimo 6 caracteres.",
                    variant: "destructive",
                  });
                  return;
                }
                updateCustomerPasswordMutation.mutate({ 
                  id: selectedCustomerForPassword.id, 
                  password: newCustomerPassword 
                });
              }}
              disabled={updateCustomerPasswordMutation.isPending}
              data-testid="button-confirm-edit-password"
            >
              {updateCustomerPasswordMutation.isPending ? "Atualizando..." : "Atualizar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog (Contextual) */}
      <Dialog open={editCustomerDialogOpen} onOpenChange={setEditCustomerDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {selectedCustomerForEdit?.name}</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedCustomerForEdit && (() => {
              // Determine customer type
              const hasRentals = rentals?.some((r: any) => r.customerCpf === selectedCustomerForEdit.cpf);
              const hasFinancing = financings?.some((f: any) => f.customerCpf === selectedCustomerForEdit.cpf);
              const hasInvestorVehicles = vehicles?.some((v: any) => v.ownerId === selectedCustomerForEdit.id && v.isInvestorVehicle);
              const hasVehicleRequest = vehicleRequests?.some((vr: any) => vr.investorCpf === selectedCustomerForEdit.cpf && vr.status !== "rejected");
              const isInvestor = hasInvestorVehicles || hasVehicleRequest;
              
              return (
                <>
                  {/* Section: Personal Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome Completo *</label>
                        <Input
                          value={customerEditData.name || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, name: e.target.value })}
                          placeholder="Nome do cliente"
                          data-testid="input-edit-customer-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">CPF *</label>
                        <Input
                          value={customerEditData.cpf || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          data-testid="input-edit-customer-cpf"
                        />
                        <p className="text-xs text-muted-foreground">
                          Altere apenas se necessário. O CPF é usado para login.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email *</label>
                        <Input
                          type="email"
                          value={customerEditData.email || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, email: e.target.value })}
                          placeholder="email@exemplo.com"
                          data-testid="input-edit-customer-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefone *</label>
                        <Input
                          value={customerEditData.phone || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                          data-testid="input-edit-customer-phone"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">RG</label>
                        <Input
                          value={customerEditData.rg || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, rg: e.target.value })}
                          placeholder="00.000.000-0"
                          data-testid="input-edit-customer-rg"
                        />
                      </div>
                      {(hasRentals || hasFinancing) && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CNH</label>
                          <Input
                            value={customerEditData.driverLicense || ""}
                            onChange={(e) => setCustomerEditData({ ...customerEditData, driverLicense: e.target.value })}
                            placeholder="Número da CNH"
                            data-testid="input-edit-customer-cnh"
                          />
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={customerEditData.status || "active"}
                          onValueChange={(value) => setCustomerEditData({ ...customerEditData, status: value })}
                        >
                          <SelectTrigger data-testid="select-edit-customer-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="blocked">Bloqueado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Section: Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">CEP</label>
                        <Input
                          value={customerEditData.zipCode || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, zipCode: e.target.value })}
                          placeholder="00000-000"
                          data-testid="input-edit-customer-cep"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Rua</label>
                        <Input
                          value={customerEditData.street || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, street: e.target.value })}
                          placeholder="Nome da rua"
                          data-testid="input-edit-customer-street"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Complemento</label>
                        <Input
                          value={customerEditData.complement || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, complement: e.target.value })}
                          placeholder="Apt, casa, etc."
                          data-testid="input-edit-customer-complement"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bairro</label>
                        <Input
                          value={customerEditData.neighborhood || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, neighborhood: e.target.value })}
                          placeholder="Nome do bairro"
                          data-testid="input-edit-customer-neighborhood"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cidade</label>
                        <Input
                          value={customerEditData.city || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, city: e.target.value })}
                          placeholder="Nome da cidade"
                          data-testid="input-edit-customer-city"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Estado</label>
                        <Input
                          value={customerEditData.state || ""}
                          onChange={(e) => setCustomerEditData({ ...customerEditData, state: e.target.value })}
                          placeholder="UF"
                          maxLength={2}
                          data-testid="input-edit-customer-state"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Investor Data (for investors only) */}
                  {isInvestor && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950">
                          Investidor
                        </Badge>
                        Configurações de Investimento
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Dia de Pagamento dos Dividendos</label>
                          <Select
                            value={customerEditData.paymentDate?.toString() || ""}
                            onValueChange={(value) => setCustomerEditData({ ...customerEditData, paymentDate: value ? parseInt(value) : null })}
                          >
                            <SelectTrigger data-testid="select-edit-payment-day">
                              <SelectValue placeholder="Selecione o dia (1-31)" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  Dia {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Dia em que os dividendos serão creditados
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Data do Bônus Único</label>
                          <Input
                            type="text"
                            value={customerEditData.bonusDate || ""}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length > 8) value = value.slice(0, 8);
                              if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                              if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5);
                              setCustomerEditData({ ...customerEditData, bonusDate: value });
                            }}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            data-testid="input-edit-bonus-date"
                          />
                          <p className="text-xs text-muted-foreground">
                            Data específica do pagamento único do bônus
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Valor do Bônus Único</label>
                          <Input
                            type="text"
                            value={customerEditData.bonusValue || ""}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^\d,]/g, '');
                              setCustomerEditData({ ...customerEditData, bonusValue: value });
                            }}
                            placeholder="R$ 0,00"
                            data-testid="input-edit-bonus-value"
                          />
                          <p className="text-xs text-muted-foreground">
                            Valor único do bônus a ser pago na data especificada
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Valor do Dividendo Mensal</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={customerEditData.monthlyDividend || ""}
                            onChange={(e) => setCustomerEditData({ ...customerEditData, monthlyDividend: e.target.value })}
                            placeholder="R$ 0,00"
                            data-testid="input-edit-monthly-dividend"
                          />
                          <p className="text-xs text-muted-foreground">
                            Valor fixo mensal de dividendo a ser pago ao investidor
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Contato de Emergência</label>
                          <Input
                            value={customerEditData.emergencyContact || ""}
                            onChange={(e) => setCustomerEditData({ ...customerEditData, emergencyContact: e.target.value })}
                            placeholder="(00) 00000-0000"
                            data-testid="input-edit-emergency-contact"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section: Rental Information (for customers with rentals) */}
                  {hasRentals && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950">
                          Aluguel
                        </Badge>
                        Histórico de Aluguéis
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Total de Aluguéis:</span> {selectedCustomerForEdit.totalRentals || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Total Gasto:</span> R$ {Number(selectedCustomerForEdit.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Section: Financing Information (for customers with financing) */}
                  {hasFinancing && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950">
                          Financiamento
                        </Badge>
                        Contratos de Financiamento
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Este cliente possui {financings?.filter((f: any) => f.customerCpf === selectedCustomerForEdit.cpf).length} contrato(s) de financiamento ativo(s).
                        </p>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (!customerEditData.cpf || !customerEditData.name || !customerEditData.email || !customerEditData.phone) {
                  toast({
                    title: "Campos obrigatórios",
                    description: "CPF, nome, email e telefone são obrigatórios.",
                    variant: "destructive",
                  });
                  return;
                }
                
                updateCustomerMutation.mutate({
                  id: selectedCustomerForEdit.id,
                  data: {
                    cpf: customerEditData.cpf,
                    name: customerEditData.name,
                    email: customerEditData.email,
                    phone: customerEditData.phone,
                    rg: customerEditData.rg || null,
                    street: customerEditData.street || null,
                    complement: customerEditData.complement || null,
                    neighborhood: customerEditData.neighborhood || null,
                    city: customerEditData.city || null,
                    state: customerEditData.state || null,
                    zipCode: customerEditData.zipCode || null,
                    driverLicense: customerEditData.driverLicense || null,
                    emergencyContact: customerEditData.emergencyContact || null,
                    paymentDate: customerEditData.paymentDate,
                    bonusDate: customerEditData.bonusDate || null,
                    bonusValue: customerEditData.bonusValue ? customerEditData.bonusValue.replace(',', '.') : null,
                    monthlyDividend: customerEditData.monthlyDividend || null,
                    status: customerEditData.status
                  }
                });
                setEditCustomerDialogOpen(false);
              }}
              disabled={updateCustomerMutation.isPending}
              data-testid="button-confirm-edit-customer"
            >
              {updateCustomerMutation.isPending ? "Atualizando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
