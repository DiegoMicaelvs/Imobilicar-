import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Car, DollarSign, LogOut, TrendingUp, Gift, Wallet, MessageCircle, UserPlus, User, Gauge, Zap, FileText, Download } from "lucide-react";
import placeholderLogo from "@assets/logo_imobile_1765389205488.png";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function CustomerPortal() {
  const [, setLocation] = useLocation();
  const [customer, setCustomer] = useState<any>(null);
  const [showDividendBreakdown, setShowDividendBreakdown] = useState(false);
  const [showBonusBreakdown, setShowBonusBreakdown] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se está logado e carregar dados do localStorage
    const storedAuth = localStorage.getItem("customer");
    if (!storedAuth) {
      setLocation("/login");
      return;
    }
    
    try {
      const authData = JSON.parse(storedAuth);
      // O login já retorna todos os dados do usuário (customer ou admin_user)
      const userData = authData.customer || authData;
      
      // Garantir compatibilidade: adicionar campos padrão se não existirem
      const normalizedUser = {
        ...userData,
        totalRentals: userData.totalRentals || 0,
        bonusBalance: userData.bonusBalance || "0",
        totalEarnings: userData.totalEarnings || "0",
        // Campos específicos de investidor (podem ser null)
        paymentDate: userData.paymentDate || null,
        bonusDate: userData.bonusDate || null,
        bonusValue: userData.bonusValue || null,
        monthlyDividend: userData.monthlyDividend || null,
      };
      
      setCustomer(normalizedUser);
    } catch (error) {
      console.error("Erro ao parsear dados do usuário:", error);
      setLocation("/login");
    }
  }, [setLocation]);

  // Buscar aluguéis do cliente
  const { data: rentals = [], isLoading: rentalsLoading } = useQuery({
    queryKey: ["/api/rentals"],
    enabled: !!customer,
  });

  // Buscar veículos disponíveis
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["/api/vehicles"],
    enabled: !!customer,
  });

  // Buscar veículos do investidor (se aplicável)
  // Usar customerId (para novos investidores em admin_users) ou id (para investidores antigos em customers)
  const investorOwnerId = customer?.customerId || customer?.id;
  const { data: investorVehicles = [], isLoading: investorVehiclesLoading } = useQuery({
    queryKey: [`/api/vehicles/investor/${investorOwnerId}`],
    enabled: !!investorOwnerId,
  });

  // Buscar quotas de investimento para calcular dividendos
  const { data: investmentQuotas = [] } = useQuery({
    queryKey: ["/api/investment-quotas"],
    enabled: !!customer?.id,
  });

  // Buscar dados atualizados do customer (inclui contrato do investidor)
  const { data: updatedCustomerData } = useQuery<{
    investorContractUrl?: string | null;
    investorContractFileName?: string | null;
    [key: string]: any;
  }>({
    queryKey: [`/api/customers/${investorOwnerId}`],
    enabled: !!investorOwnerId,
  });

  // Mesclar dados do localStorage com dados atualizados do banco
  const customerWithUpdates = updatedCustomerData ? {
    ...customer,
    investorContractUrl: updatedCustomerData.investorContractUrl,
    investorContractFileName: updatedCustomerData.investorContractFileName,
  } : customer;

  const handleLogout = () => {
    localStorage.removeItem("customer");
    // Disparar evento customizado para notificar outros componentes (Header)
    window.dispatchEvent(new Event("authChange"));
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    setLocation("/");
  };

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  // Filtrar aluguéis do cliente
  const myRentals = rentals?.filter((r: any) => r.customerId === customer.id) || [];
  
  // Verificar se é investidor: role INVESTIDOR da tabela admin_users
  const isInvestor = customer.role === 'INVESTIDOR';
  
  // Calcular dividendo mensal esperado baseado nos veículos do investidor
  const calculateMonthlyDividend = () => {
    // Priorizar cálculo baseado nos veículos (soma dos customDividend)
    if (investorVehicles && Array.isArray(investorVehicles) && investorVehicles.length > 0) {
      const vehiclesDividendSum = investorVehicles.reduce((total: number, vehicle: any) => {
        // Se o veículo tem dividendo customizado, usar esse valor
        if (vehicle.customDividend) {
          return total + parseFloat(vehicle.customDividend);
        }
        
        // Se não tem customDividend, buscar na quota baseado no FIPE value
        if (vehicle.fipeValue && investmentQuotas && Array.isArray(investmentQuotas)) {
          const fipeValue = parseFloat(vehicle.fipeValue);
          const matchingQuota = investmentQuotas.find((quota: any) => {
            const minValue = parseFloat(quota.minFipeValue);
            const maxValue = parseFloat(quota.maxFipeValue);
            const categoryMatch = quota.vehicleCategory === vehicle.category;
            return categoryMatch && fipeValue >= minValue && fipeValue <= maxValue;
          });
          
          if (matchingQuota) {
            // Usar o valor médio entre min e max dividend
            const minDiv = parseFloat(matchingQuota.minDividend);
            const maxDiv = parseFloat(matchingQuota.maxDividend);
            return total + ((minDiv + maxDiv) / 2);
          }
        }
        
        return total;
      }, 0);
      
      if (vehiclesDividendSum > 0) {
        return vehiclesDividendSum;
      }
    }
    
    // Fallback: Se não tem veículos com dividendo, usar o valor definido pelo admin
    if (customer.monthlyDividend) {
      return parseFloat(customer.monthlyDividend);
    }
    
    return 0;
  };
  
  const monthlyDividend = calculateMonthlyDividend();
  
  // Função para calcular dividendos acumulados (igual ao BI)
  const calculateAccruedDividends = () => {
    if (!customer?.createdAt || !customer?.paymentDate) return { total: 0, paymentsCount: 0 };
    
    if (monthlyDividend === 0) return { total: 0, paymentsCount: 0 };
    
    const createdDate = new Date(customer.createdAt);
    const today = new Date();
    const paymentDay = customer.paymentDate;
    
    // Contar quantos pagamentos já deveriam ter sido feitos
    let paymentsCount = 0;
    let currentDate = new Date(createdDate);
    
    // Ajustar para o primeiro dia de pagamento
    // Se foi criado antes do dia de pagamento do mês, o primeiro pagamento é no mesmo mês
    // Se foi criado depois, o primeiro pagamento é no mês seguinte
    if (currentDate.getDate() <= paymentDay) {
      currentDate.setDate(paymentDay);
    } else {
      // Próximo mês
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(paymentDay);
    }
    
    // Contar quantos dias de pagamento já passaram
    while (currentDate <= today) {
      paymentsCount++;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return { 
      total: paymentsCount * monthlyDividend,
      paymentsCount
    };
  };
  
  const accruedDividends = calculateAccruedDividends();
  
  // Função para calcular dividendo de um veículo específico
  const getVehicleDividend = (vehicle: any) => {
    if (vehicle.customDividend) {
      return parseFloat(vehicle.customDividend);
    }
    
    if (vehicle.fipeValue && investmentQuotas && Array.isArray(investmentQuotas)) {
      const fipeValue = parseFloat(vehicle.fipeValue);
      const matchingQuota = investmentQuotas.find((quota: any) => {
        const minValue = parseFloat(quota.minFipeValue);
        const maxValue = parseFloat(quota.maxFipeValue);
        const categoryMatch = quota.vehicleCategory === vehicle.category;
        return categoryMatch && fipeValue >= minValue && fipeValue <= maxValue;
      });
      
      if (matchingQuota) {
        const minDiv = parseFloat(matchingQuota.minDividend);
        const maxDiv = parseFloat(matchingQuota.maxDividend);
        return (minDiv + maxDiv) / 2;
      }
    }
    
    return 0;
  };
  
  // Calcular total acumulado já recebido
  const totalEarnings = parseFloat(customer.totalEarnings || "0");
  
  // Veículos disponíveis para aluguel
  const availableVehicles = vehicles?.filter((v: any) => v.available && v.isPubliclyVisible) || [];

  const memberSince = customer.createdAt ? format(new Date(customer.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "N/A";

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Portal */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-customer-name">Olá, {customer.name}!</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Bem-vindo ao seu portal Imobilicar</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto" data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        {isInvestor ? (
          // Layout para Investidor: Hero + KPI Grid
          <div className="space-y-6 mb-8">
            {/* Hero Overview */}
            <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-cyan-500/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Bem-vindo, {customer.name}!</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-primary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Investidor Parceiro
                      </Badge>
                      <span className="text-sm text-muted-foreground">desde {memberSince}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card 
                className="hover-elevate cursor-pointer transition-all" 
                onClick={() => setShowDividendBreakdown(true)}
                data-testid="card-monthly-dividend"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Dividendo Mensal</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-monthly-dividend">
                    R$ {monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investorVehicles?.length || 0} veículo(s)
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Dividendo Acumulado</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Total já pago</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-accrued-dividend">
                    R$ {accruedDividends.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {accruedDividends.paymentsCount} pagamento(s) realizado(s)
                  </p>
                </CardContent>
              </Card>

              {(() => {
                // Agregar datas de pagamento de todos os veículos
                const vehiclePaymentDates = (investorVehicles || [])
                  .map((v: any) => v.paymentDate)
                  .filter((d: any) => d != null && d > 0);
                const allPaymentDates = vehiclePaymentDates.length > 0 
                  ? vehiclePaymentDates 
                  : (customer.paymentDate ? [customer.paymentDate] : []);
                const uniquePaymentDates = [...new Set(allPaymentDates)].sort((a: number, b: number) => a - b);
                const paymentDatesFormatted = uniquePaymentDates.length > 0 
                  ? `Dia ${uniquePaymentDates.join('/')}`
                  : null;
                
                return (
                  <Card className="hover-elevate">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Dia de Pagamento</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Dividendos mensais</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400" data-testid="text-payment-date">
                        {paymentDatesFormatted || "—"}
                      </div>
                      {uniquePaymentDates.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {uniquePaymentDates.length === 1 
                            ? `Próximo pagamento em ${format(new Date(new Date().getFullYear(), new Date().getMonth(), uniquePaymentDates[0]), "dd 'de' MMMM", { locale: ptBR })}`
                            : `${uniquePaymentDates.length} datas de pagamento`
                          }
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              <Card className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Veículos</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Na frota Imobilicar</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {investorVehicles?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investorVehicles?.filter((v: any) => v.available).length || 0} disponíveis agora
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="hover-elevate cursor-pointer transition-all" 
                onClick={() => setShowBonusBreakdown(true)}
                data-testid="card-bonus"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Bônus por Agregar</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-bonus-value">
                    {(() => {
                      // Para investidores, bônus vem apenas dos veículos (não duplicar com customer.bonusValue)
                      const vehicleBonuses = investorVehicles?.filter((v: any) => v.bonusValue && parseFloat(v.bonusValue) > 0) || [];
                      const totalBonus = vehicleBonuses.reduce((sum: number, v: any) => sum + parseFloat(v.bonusValue || "0"), 0);
                      return totalBonus > 0 ? `R$ ${totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "—";
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1" data-testid="text-bonus-count">
                    {(() => {
                      const vehicleBonusCount = investorVehicles?.filter((v: any) => v.bonusValue && parseFloat(v.bonusValue) > 0).length || 0;
                      return vehicleBonusCount > 0 ? `${vehicleBonusCount} bônus configurado(s)` : "Nenhum bônus configurado";
                    })()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Layout para Cliente: 3 cards
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cliente Desde</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-member-since">{memberSince}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Aluguéis</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-rentals">{customer.totalRentals || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo de Bonificação</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary" data-testid="text-bonus-balance">
                  R$ {parseFloat(customer.bonusBalance || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Disponível para usar em aluguéis
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Abas de Conteúdo */}
        {isInvestor ? (
          // Investidor: apenas aba "Meus Veículos"
          <Tabs defaultValue="investor" className="w-full">
            <div className="w-full overflow-x-auto pb-2 -mb-2">
              <TabsList className="w-auto min-w-full inline-flex">
                <TabsTrigger value="investor" data-testid="tab-investor">Meus Veículos</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="investor">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Veículos</CardTitle>
                  <CardDescription>
                    Gerencie sua frota e acompanhe o desempenho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {investorVehiclesLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                  ) : investorVehicles && investorVehicles.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {investorVehicles.map((vehicle: any) => (
                          <Card key={vehicle.id} data-testid={`investor-vehicle-${vehicle.id}`} className="overflow-hidden hover-elevate">
                            {/* Vehicle Image Banner */}
                            <div className={`relative h-48 ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'bg-gray-900' : 'bg-muted'}`}>
                              <img 
                                src={vehicle.imageUrl && !vehicle.imageUrl.includes('placeholder') ? vehicle.imageUrl : placeholderLogo} 
                                alt={vehicle.name}
                                className={`w-full h-full ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'object-contain p-6' : 'object-cover'}`}
                              />
                              <div className="absolute top-3 right-3">
                                <Badge variant={vehicle.available ? "default" : "secondary"} className="bg-background/90 backdrop-blur-sm">
                                  {vehicle.available ? "Disponível" : "Indisponível"}
                                </Badge>
                              </div>
                            </div>

                            {/* Vehicle Details */}
                            <CardContent className="p-4 space-y-4">
                              <div>
                                <h4 className="font-bold text-lg mb-1">{vehicle.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {vehicle.brand} {vehicle.model} • {vehicle.year}
                                </p>
                              </div>

                              {/* Specifications Grid */}
                              <div className="grid grid-cols-2 gap-3 py-3 border-y">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <Car className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Categoria</p>
                                    <p className="text-sm font-medium">{vehicle.category || "Sedan"}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <Gauge className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Câmbio</p>
                                    <p className="text-sm font-medium">{vehicle.transmission || "Manual"}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Motor</p>
                                    <p className="text-sm font-medium">{vehicle.fuel || "—"}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Valor FIPE</p>
                                    <p className="text-sm font-medium">
                                      R$ {parseFloat(vehicle.fipeValue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Contact Button */}
                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <a href="https://wa.me/5511947348989" target="_blank" rel="noopener noreferrer">
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Falar com Administração
                                </a>
                              </Button>
                            </CardContent>
                          </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground mb-4">
                        Você ainda não possui veículos cadastrados como investidor.
                      </p>
                      <Button asChild>
                        <Link href="/investidor">
                          <Car className="h-4 w-4 mr-2" />
                          Cadastrar Primeiro Veículo
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Seção de Download dos Contratos por Veículo */}
                  {(investorVehicles as any[]).some((v: any) => v.investmentContractUrl) && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        Meus Contratos de Cessão
                      </h4>
                      <div className="space-y-3">
                        {investorVehicles.filter((v: any) => v.investmentContractUrl).map((vehicle: any) => (
                          <div key={vehicle.id} className="flex items-center gap-3 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                            <FileText className="h-8 w-8 text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{vehicle.brand} {vehicle.model}</p>
                              <p className="text-xs text-muted-foreground">
                                {vehicle.licensePlate} - {vehicle.investmentContractFileName || "contrato.pdf"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = vehicle.investmentContractUrl;
                                link.download = vehicle.investmentContractFileName || "contrato";
                                link.click();
                              }}
                              data-testid={`button-download-my-contract-${vehicle.id}`}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          // Cliente: tabs completas
          <Tabs defaultValue="rentals" className="w-full">
            <div className="w-full overflow-x-auto pb-2 -mb-2">
              <TabsList className="w-auto min-w-full inline-flex">
                <TabsTrigger value="rentals" data-testid="tab-rentals">Meus Aluguéis</TabsTrigger>
                <TabsTrigger value="vehicles" data-testid="tab-vehicles">Veículos Disponíveis</TabsTrigger>
                <TabsTrigger value="bonus" data-testid="tab-bonus">Bonificação</TabsTrigger>
                <TabsTrigger value="become-investor" data-testid="tab-become-investor">Seja Investidor</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="rentals">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Aluguéis</CardTitle>
                <CardDescription>
                  Todos os seus aluguéis realizados na Imobilicar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rentalsLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : myRentals.length > 0 ? (
                  <div className="space-y-4">
                    {myRentals.map((rental: any) => (
                      <Card key={rental.id} data-testid={`rental-card-${rental.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold">Aluguel #{rental.id.slice(0, 8)}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(rental.startDate), "dd/MM/yyyy")} - {format(new Date(rental.endDate), "dd/MM/yyyy")}
                              </p>
                              <p className="text-sm font-medium">
                                R$ {parseFloat(rental.totalPrice).toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                            <Badge variant={
                              rental.status === "completed" ? "default" :
                              rental.status === "active" ? "default" :
                              rental.status === "cancelled" ? "destructive" :
                              "secondary"
                            }>
                              {rental.status === "completed" ? "Concluído" :
                               rental.status === "active" ? "Ativo" :
                               rental.status === "cancelled" ? "Cancelado" :
                               rental.status === "approved" ? "Aprovado" :
                               "Pendente"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Você ainda não realizou nenhum aluguel.</p>
                    <Button className="mt-4" asChild>
                      <Link href="/veiculos">Ver Veículos Disponíveis</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>Veículos Disponíveis para Aluguel</CardTitle>
                <CardDescription>
                  Escolha o veículo ideal para sua próxima viagem
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vehiclesLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : availableVehicles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableVehicles.map((vehicle: any) => (
                      <Card key={vehicle.id} data-testid={`vehicle-card-${vehicle.id}`}>
                        <CardContent className="pt-6">
                          <img 
                            src={vehicle.imageUrl} 
                            alt={vehicle.name}
                            className="w-full h-40 object-cover rounded-md mb-4"
                          />
                          <h4 className="font-semibold mb-2">{vehicle.name}</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {vehicle.brand} {vehicle.model} - {vehicle.year}
                          </p>
                          <div className="flex flex-col gap-2">
                            <div className="text-lg font-bold text-primary">
                              R$ {parseFloat(vehicle.pricePerDay).toFixed(2).replace('.', ',')}
                              <span className="text-sm font-normal text-muted-foreground">/dia</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                asChild
                              >
                                <a href="https://wa.me/5511947348989" target="_blank" rel="noopener noreferrer">
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  WhatsApp
                                </a>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Tenho Interesse
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">Nenhum veículo disponível no momento.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonus">
            <Card>
              <CardHeader>
                <CardTitle>Seu Saldo de Bonificação</CardTitle>
                <CardDescription>
                  Use seu saldo de bonificação para obter descontos em aluguéis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-primary/10 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
                    <p className="text-3xl font-bold text-primary">
                      R$ {parseFloat(customer.bonusBalance || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Gift className="h-16 w-16 text-primary/30" />
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Como Funciona?</h4>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-semibold mb-1">Desconto Único</h5>
                      <p className="text-sm text-muted-foreground">
                        Seu saldo de bonificação pode ser usado para obter desconto em aluguéis. O valor será deduzido do total do aluguel.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-semibold mb-1">Uso Único</h5>
                      <p className="text-sm text-muted-foreground">
                        Uma vez utilizado em um aluguel, o saldo será zerado. Novos valores só serão adicionados quando o administrador conceder uma nova bonificação.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h5 className="font-semibold mb-1">Como Usar</h5>
                      <p className="text-sm text-muted-foreground">
                        Ao alugar um veículo, você verá a opção "Usar Bonificação" no formulário de aluguel. Marque a opção para aplicar o desconto.
                      </p>
                    </div>
                  </div>
                </div>

                {parseFloat(customer.bonusBalance || "0") > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      ✓ Você tem saldo disponível! Escolha um veículo para alugar e aproveite seu desconto.
                    </p>
                  </div>
                )}

                {parseFloat(customer.bonusBalance || "0") === 0 && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Você não possui saldo de bonificação no momento. Entre em contato com a administração para saber como pode ganhar bonificações.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="become-investor">
              <Card>
                <CardHeader>
                  <CardTitle>Programa de Investidores Imobilicar</CardTitle>
                  <CardDescription>
                    Cadastre seu veículo e ganhe renda extra com aluguéis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Renda Mensal Garantida</h4>
                        <p className="text-sm text-muted-foreground">
                          Receba dividendos fixos mensais baseados no valor FIPE do seu veículo, independente de estar alugado ou não.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Valorização do Patrimônio</h4>
                        <p className="text-sm text-muted-foreground">
                          Mantenha a propriedade do seu veículo enquanto ele gera renda. Toda a gestão é feita pela Imobilicar.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Gestão Completa</h4>
                        <p className="text-sm text-muted-foreground">
                          Cuidamos de tudo: manutenção, limpeza, seguros e documentação. Você só recebe os lucros.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Como Funciona?</h4>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li>1. Cadastre seu veículo com fotos e documentação</li>
                      <li>2. Aguarde aprovação da equipe Imobilicar</li>
                      <li>3. Defina o dia do mês para receber seus dividendos</li>
                      <li>4. Receba pagamentos mensais automaticamente</li>
                    </ol>
                  </div>

                  <div className="flex gap-4">
                    <Button className="flex-1" asChild data-testid="button-start-investor">
                      <Link href="/investidor">Cadastrar Meu Veículo</Link>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href="/veiculos">Ver Frota Atual</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialog de Detalhamento de Dividendos */}
      <Dialog open={showDividendBreakdown} onOpenChange={setShowDividendBreakdown}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Detalhamento de Dividendos
            </DialogTitle>
            <DialogDescription>
              Dividendos mensais por veículo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {investorVehicles && investorVehicles.length > 0 ? (
              <>
                <div className="space-y-3">
                  {investorVehicles.map((vehicle: any) => {
                    const vehicleDividend = getVehicleDividend(vehicle);
                    return (
                      <div 
                        key={vehicle.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        data-testid={`dividend-breakdown-${vehicle.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg overflow-hidden ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'bg-gray-900' : 'bg-muted'}`}>
                            <img 
                              src={!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? placeholderLogo : vehicle.imageUrl} 
                              alt={vehicle.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{vehicle.brand} {vehicle.model}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.licensePlate}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400">
                            R$ {vehicleDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.paymentDate ? `Dia ${vehicle.paymentDate}` : '/mês'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">Total Mensal</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      R$ {monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum veículo encontrado</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhamento de Bônus */}
      <Dialog open={showBonusBreakdown} onOpenChange={setShowBonusBreakdown}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              Detalhamento de Bônus
            </DialogTitle>
            <DialogDescription>
              Bônus por agregar veículos à frota
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {(() => {
              // Para investidores, bônus vem apenas dos veículos (não duplicar com customer.bonusValue)
              const vehiclesWithBonus = investorVehicles?.filter((v: any) => v.bonusValue && parseFloat(v.bonusValue) > 0) || [];
              
              if (vehiclesWithBonus.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum bônus configurado</p>
                    <p className="text-sm mt-2">Os bônus serão exibidos aqui quando configurados.</p>
                  </div>
                );
              }

              const totalBonus = vehiclesWithBonus.reduce((sum: number, v: any) => sum + parseFloat(v.bonusValue || "0"), 0);
              
              return (
                <>
                  <div className="space-y-3">
                    {/* Bônus por veículo */}
                    {vehiclesWithBonus.map((vehicle: any) => (
                      <div 
                        key={vehicle.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
                        data-testid={`bonus-breakdown-${vehicle.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg overflow-hidden ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'bg-gray-900' : 'bg-muted'}`}>
                            <img 
                              src={!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? placeholderLogo : vehicle.imageUrl} 
                              alt={vehicle.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{vehicle.brand} {vehicle.model}</p>
                            <p className="text-xs text-muted-foreground">
                              {vehicle.licensePlate}
                              {vehicle.bonusDate && ` • ${vehicle.bonusDate}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600 dark:text-purple-400">
                            R$ {parseFloat(vehicle.bonusValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {vehicle.bonusDate && (
                            <p className="text-xs text-muted-foreground">
                              Pagamento: {vehicle.bonusDate}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Total de Bônus</span>
                      <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        R$ {totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
