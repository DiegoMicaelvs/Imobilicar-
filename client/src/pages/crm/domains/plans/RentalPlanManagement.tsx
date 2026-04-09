import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";
import { formatCurrency } from "@/pages/crm/utils/formatters";

interface RentalPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  isActive: boolean;
}

export default function RentalPlanManagement() {
  const { toast } = useToast();
  const { plans, isLoading, invalidate } = useCrmData();
  
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RentalPlan | null>(null);
  const [planFormData, setPlanFormData] = useState<Partial<RentalPlan>>({});

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: async (data: Partial<RentalPlan>) => {
      return await apiRequest("POST", "/api/rental-plans", data);
    },
    onSuccess: () => {
      invalidate.plans();
      toast({
        title: "Plano criado!",
        description: "Plano adicionado com sucesso.",
      });
      setPlanDialogOpen(false);
      setPlanFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message || "Ocorreu um erro ao criar o plano.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RentalPlan> }) => {
      return await apiRequest("PATCH", `/api/rental-plans/${id}`, data);
    },
    onSuccess: () => {
      invalidate.plans();
      toast({
        title: "Plano atualizado!",
        description: "Plano atualizado com sucesso.",
      });
      setPlanDialogOpen(false);
      setEditingPlan(null);
      setPlanFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Ocorreu um erro ao atualizar o plano.",
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/rental-plans/${id}`, {});
    },
    onSuccess: () => {
      invalidate.plans();
      toast({
        title: "Plano removido!",
        description: "Plano removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover plano",
        description: error.message || "Ocorreu um erro ao remover o plano.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <div>
          <CardTitle>Planos e Serviços Adicionais</CardTitle>
          <CardDescription>
            Gerencie serviços adicionais que podem ser contratados junto com o aluguel
          </CardDescription>
        </div>
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-plan">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
              <DialogDescription>
                Adicione serviços que os clientes podem contratar junto com o aluguel
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Serviço</label>
                <Input
                  placeholder="Ex: Seguro Premium, GPS, Cadeirinha de Bebê"
                  value={planFormData.name || ""}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  data-testid="input-plan-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  placeholder="Descreva o serviço"
                  value={planFormData.description || ""}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  data-testid="input-plan-description"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço Adicional (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={planFormData.price || ""}
                  onChange={(e) => setPlanFormData({ ...planFormData, price: e.target.value })}
                  data-testid="input-plan-price"
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={() => {
                      if (editingPlan) {
                        updatePlanMutation.mutate({
                          id: editingPlan.id,
                          data: planFormData
                        });
                      } else {
                        createPlanMutation.mutate(planFormData);
                      }
                      setPlanFormData({});
                      setEditingPlan(null);
                    }}
                    data-testid="button-save-plan"
                  >
                    {editingPlan ? "Salvar" : "Criar"}
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading.plans ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="space-y-4">
            {plans.map((plan: any) => (
              <Card key={plan.id} className="hover-elevate" data-testid={`card-plan-${plan.id}`}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        + R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanFormData(plan);
                        setPlanDialogOpen(true);
                      }}
                      data-testid={`button-edit-plan-${plan.id}`}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updatePlanMutation.mutate({
                          id: plan.id,
                          data: { isActive: !plan.isActive }
                        });
                      }}
                      data-testid={`button-toggle-plan-${plan.id}`}
                    >
                      {plan.isActive ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja remover ${plan.name}?`)) {
                          deletePlanMutation.mutate(plan.id);
                        }
                      }}
                      data-testid={`button-delete-plan-${plan.id}`}
                    >
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum plano cadastrado ainda.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
