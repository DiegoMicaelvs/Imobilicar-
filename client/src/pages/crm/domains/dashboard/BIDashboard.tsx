import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Edit, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";

export default function BIDashboard() {
  const { toast } = useToast();
  const { adminUsers, isLoading, invalidate } = useCrmData();
  
  // Estados para gerenciamento de vendas
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [selectedUserForSales, setSelectedUserForSales] = useState<any>(null);
  const [salesAmount, setSalesAmount] = useState("1");
  const [salesRevenue, setSalesRevenue] = useState("");
  
  // Estados para gerenciamento de metas
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedUserForGoal, setSelectedUserForGoal] = useState<any>(null);
  const [goalAmount, setGoalAmount] = useState("1");
  const [goalPeriod, setGoalPeriod] = useState("daily");
  
  // Estados para gerenciamento de receita
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [selectedUserForRevenue, setSelectedUserForRevenue] = useState<any>(null);
  const [revenueAmount, setRevenueAmount] = useState("");
  
  // Estado para dialog de gerenciamento de metas
  const [salesManagementDialogOpen, setSalesManagementDialogOpen] = useState(false);

  // Mutation para adicionar vendas
  const addSalesMutation = useMutation({
    mutationFn: async ({ id, amount, revenue }: { id: string; amount: number; revenue?: string }) => {
      return await apiRequest("POST", `/api/admin/users/${id}/sales`, { amount, revenue });
    },
    onSuccess: () => {
      invalidate.adminUsers();
      toast({
        title: "Vendas registradas!",
        description: "Vendas registradas com sucesso.",
      });
      setSalesDialogOpen(false);
      setSalesAmount("1");
      setSalesRevenue("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar vendas",
        description: error.message || "Ocorreu um erro ao registrar as vendas.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar meta
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, salesGoal, goalPeriod }: { id: string; salesGoal: number; goalPeriod: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, { salesGoal, goalPeriod });
    },
    onSuccess: () => {
      invalidate.adminUsers();
      toast({
        title: "Meta atualizada!",
        description: "Meta de vendas atualizada com sucesso.",
      });
      setGoalDialogOpen(false);
      setGoalAmount("1");
      setGoalPeriod("daily");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar meta",
        description: error.message || "Ocorreu um erro ao atualizar a meta.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar receita
  const updateRevenueMutation = useMutation({
    mutationFn: async ({ id, salesRevenue }: { id: string; salesRevenue: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, { salesRevenue });
    },
    onSuccess: () => {
      invalidate.adminUsers();
      toast({
        title: "Receita atualizada!",
        description: "Receita total atualizada com sucesso.",
      });
      setRevenueDialogOpen(false);
      setRevenueAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar receita",
        description: error.message || "Ocorreu um erro ao atualizar a receita.",
        variant: "destructive",
      });
    },
  });

  // Filtrar apenas vendedores
  const vendors = (adminUsers ?? []).filter((u: any) => u.role === 'VENDEDOR');

  if (isLoading.adminUsers) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>BI Dashboard - Metas de Vendas</CardTitle>
            <CardDescription>
              Acompanhe as metas de vendas e desempenho dos vendedores
            </CardDescription>
          </div>
          <Button 
            variant="outline"
            onClick={() => setSalesManagementDialogOpen(true)}
            data-testid="button-manage-sales"
          >
            <Target className="h-4 w-4 mr-2" />
            Gerenciar Metas
          </Button>
        </CardHeader>
        <CardContent>
          {vendors.length > 0 ? (
            <div className="space-y-4">
              {vendors.map((user: any) => (
                <Card key={user.id} className="hover-elevate" data-testid={`card-sales-goal-${user.id}`}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {user.name}
                          <Badge variant="default" className="bg-blue-500">Vendedor</Badge>
                          {!user.isActive && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100">
                        Metas de Vendas
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Meta {user.goalPeriod === 'daily' ? 'Diária' : user.goalPeriod === 'weekly' ? 'Semanal' : user.goalPeriod === 'monthly' ? 'Mensal' : user.goalPeriod === 'yearly' ? 'Anual' : 'Diária'}
                          </p>
                          <p className="text-lg font-bold" data-testid={`text-goal-${user.id}`}>{user.salesGoal || 1} vendas</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Vendas {user.goalPeriod === 'daily' ? 'Hoje' : user.goalPeriod === 'weekly' ? 'Esta Semana' : user.goalPeriod === 'monthly' ? 'Este Mês' : user.goalPeriod === 'yearly' ? 'Este Ano' : 'Hoje'}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold" data-testid={`text-sales-count-${user.id}`}>{user.salesCount || 0} vendas</p>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() => {
                                  if ((user.salesCount || 0) > 0) {
                                    addSalesMutation.mutate({ 
                                      id: user.id, 
                                      amount: -1
                                    });
                                  }
                                }}
                                disabled={addSalesMutation.isPending || (user.salesCount || 0) === 0}
                                data-testid={`button-decrease-sale-${user.id}`}
                                title="Diminuir 1 venda"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() => {
                                  addSalesMutation.mutate({ 
                                    id: user.id, 
                                    amount: 1
                                  });
                                }}
                                disabled={addSalesMutation.isPending}
                                data-testid={`button-increase-sale-${user.id}`}
                                title="Adicionar 1 venda"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Receita Total</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid={`text-revenue-${user.id}`}>
                            R$ {parseFloat(user.salesRevenue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Progresso</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold" data-testid={`text-progress-${user.id}`}>
                              {Math.round(((user.salesCount || 0) / (user.salesGoal || 1)) * 100)}%
                            </p>
                            {(user.salesCount || 0) >= (user.salesGoal || 1) && (
                              <Badge variant="default" className="bg-green-500" data-testid={`badge-goal-achieved-${user.id}`}>✓ Meta Atingida</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Histórico Permanente */}
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                        <h5 className="font-semibold text-xs mb-3 text-blue-800 dark:text-blue-200">
                          Histórico Permanente
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Total de Vendas</p>
                            <p className="text-base font-bold text-blue-700 dark:text-blue-300" data-testid={`text-total-sales-${user.id}`}>
                              {user.totalSales || 0} vendas
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Metas Batidas</p>
                            <p className="text-base font-bold text-purple-700 dark:text-purple-300" data-testid={`text-goals-achieved-${user.id}`}>
                              {user.totalGoalsAchieved || 0} vezes
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedUserForSales(user);
                            setSalesAmount("1");
                            setSalesRevenue("");
                            setSalesDialogOpen(true);
                          }}
                          data-testid={`button-add-sale-${user.id}`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar Venda
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedUserForGoal(user);
                            setGoalAmount(String(user.salesGoal || 1));
                            setGoalPeriod(user.goalPeriod || "daily");
                            setGoalDialogOpen(true);
                          }}
                          data-testid={`button-edit-goal-${user.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Meta
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedUserForRevenue(user);
                            setRevenueAmount(user.salesRevenue || "0");
                            setRevenueDialogOpen(true);
                          }}
                          data-testid={`button-edit-revenue-${user.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Receita
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum vendedor cadastrado no sistema.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Adicionar Vendas */}
      <Dialog open={salesDialogOpen} onOpenChange={setSalesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Vendas para {selectedUserForSales?.name}</DialogTitle>
            <DialogDescription>
              Adicione vendas ao contador do vendedor e atualize a receita
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade de Vendas</label>
              <Input 
                type="number" 
                min="1" 
                value={salesAmount}
                onChange={(e) => setSalesAmount(e.target.value)}
                data-testid="input-sales-amount" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Receita Total (R$)</label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={salesRevenue}
                onChange={(e) => setSalesRevenue(e.target.value)}
                placeholder="Valor total da receita gerada"
                data-testid="input-sales-revenue" 
              />
              <p className="text-xs text-muted-foreground">
                Opcional: Informe o valor total de receita gerado por essas vendas
              </p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                Vendas {selectedUserForSales?.goalPeriod === 'daily' ? 'Hoje' : selectedUserForSales?.goalPeriod === 'weekly' ? 'Esta Semana' : selectedUserForSales?.goalPeriod === 'monthly' ? 'Este Mês' : selectedUserForSales?.goalPeriod === 'yearly' ? 'Este Ano' : 'Atuais'}:
              </p>
              <p className="text-2xl font-bold">{selectedUserForSales?.salesCount || 0} vendas</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={() => {
                const amount = parseInt(salesAmount);
                if (!amount || amount < 1) {
                  toast({
                    title: "Valor inválido",
                    description: "Informe uma quantidade válida de vendas.",
                    variant: "destructive",
                  });
                  return;
                }
                const revenue = salesRevenue && salesRevenue.trim() !== "" ? parseFloat(salesRevenue).toFixed(2) : undefined;
                addSalesMutation.mutate({ id: selectedUserForSales.id, amount, revenue });
              }}
              disabled={addSalesMutation.isPending}
              data-testid="button-confirm-add-sale"
            >
              {addSalesMutation.isPending ? "Registrando..." : "Registrar Vendas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Meta */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta de {selectedUserForGoal?.name}</DialogTitle>
            <DialogDescription>
              Defina a meta de vendas e o período
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meta de Vendas</label>
              <Input 
                type="number" 
                min="1" 
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                data-testid="input-sales-goal" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período da Meta</label>
              <Select 
                value={goalPeriod} 
                onValueChange={setGoalPeriod}
              >
                <SelectTrigger data-testid="select-goal-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diária</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Meta atual: {selectedUserForGoal?.salesGoal || 1} vendas por {
                  selectedUserForGoal?.goalPeriod === 'daily' ? 'dia' :
                  selectedUserForGoal?.goalPeriod === 'weekly' ? 'semana' :
                  selectedUserForGoal?.goalPeriod === 'monthly' ? 'mês' :
                  selectedUserForGoal?.goalPeriod === 'yearly' ? 'ano' : 'dia'
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={() => {
                const goal = parseInt(goalAmount);
                if (!goal || goal < 1) {
                  toast({
                    title: "Valor inválido",
                    description: "Informe uma meta válida.",
                    variant: "destructive",
                  });
                  return;
                }
                updateGoalMutation.mutate({ 
                  id: selectedUserForGoal.id, 
                  salesGoal: goal,
                  goalPeriod: goalPeriod 
                });
              }}
              disabled={updateGoalMutation.isPending}
              data-testid="button-confirm-edit-goal"
            >
              {updateGoalMutation.isPending ? "Salvando..." : "Salvar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Receita */}
      <Dialog open={revenueDialogOpen} onOpenChange={setRevenueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Receita de {selectedUserForRevenue?.name}</DialogTitle>
            <DialogDescription>
              Ajuste o valor total de receita gerada pelo vendedor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Receita Total (R$)</label>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                value={revenueAmount}
                onChange={(e) => setRevenueAmount(e.target.value)}
                data-testid="input-revenue-amount" 
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Receita atual: R$ {parseFloat(selectedUserForRevenue?.salesRevenue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={() => {
                const revenue = parseFloat(revenueAmount);
                if (isNaN(revenue) || revenue < 0) {
                  toast({
                    title: "Valor inválido",
                    description: "Informe um valor válido para a receita.",
                    variant: "destructive",
                  });
                  return;
                }
                updateRevenueMutation.mutate({ id: selectedUserForRevenue.id, salesRevenue: revenue.toFixed(2) });
              }}
              disabled={updateRevenueMutation.isPending}
              data-testid="button-confirm-edit-revenue"
            >
              {updateRevenueMutation.isPending ? "Salvando..." : "Salvar Receita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Gerenciar Metas de Vendedores */}
      <Dialog open={salesManagementDialogOpen} onOpenChange={setSalesManagementDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciamento de Metas de Vendedores</DialogTitle>
            <DialogDescription>
              Visualize e gerencie as metas de todos os vendedores do sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {vendors.length > 0 ? (
              <div className="space-y-4">
                {vendors.map((vendor: any) => {
                  const progress = Math.round(((vendor.salesCount || 0) / (vendor.salesGoal || 1)) * 100);
                  const goalReached = (vendor.salesCount || 0) >= (vendor.salesGoal || 1);
                  
                  return (
                    <Card key={vendor.id} className="hover-elevate" data-testid={`sales-management-card-${vendor.id}`}>
                      <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {vendor.name}
                              {goalReached && (
                                <Badge variant="default" className="bg-green-500">✓ Meta Atingida</Badge>
                              )}
                              {!vendor.isActive && (
                                <Badge variant="secondary">Inativo</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {vendor.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-muted-foreground">
                              Meta {vendor.goalPeriod === 'daily' ? 'Diária' : vendor.goalPeriod === 'weekly' ? 'Semanal' : vendor.goalPeriod === 'monthly' ? 'Mensal' : vendor.goalPeriod === 'yearly' ? 'Anual' : 'Diária'}
                            </p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {vendor.salesGoal || 1}
                            </p>
                            <p className="text-xs text-muted-foreground">vendas</p>
                          </div>
                          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                            <p className="text-xs text-muted-foreground">
                              Vendas {vendor.goalPeriod === 'daily' ? 'Hoje' : vendor.goalPeriod === 'weekly' ? 'Esta Semana' : vendor.goalPeriod === 'monthly' ? 'Este Mês' : vendor.goalPeriod === 'yearly' ? 'Este Ano' : 'Hoje'}
                            </p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {vendor.salesCount || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">vendas</p>
                          </div>
                          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-xs text-muted-foreground">Progresso</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                              {progress}%
                            </p>
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${goalReached ? 'bg-green-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-xs text-muted-foreground">Metas no Mês</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {vendor.monthlyGoalsAchieved || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">dias atingidos</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4 border-t">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedUserForSales(vendor);
                              setSalesAmount("1");
                              setSalesDialogOpen(true);
                              setSalesManagementDialogOpen(false);
                            }}
                            data-testid={`button-quick-add-sale-${vendor.id}`}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Registrar Venda
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedUserForGoal(vendor);
                              setGoalAmount(String(vendor.salesGoal || 1));
                              setGoalPeriod(vendor.goalPeriod || "daily");
                              setGoalDialogOpen(true);
                              setSalesManagementDialogOpen(false);
                            }}
                            data-testid={`button-quick-edit-goal-${vendor.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Meta
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum vendedor cadastrado no sistema.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
