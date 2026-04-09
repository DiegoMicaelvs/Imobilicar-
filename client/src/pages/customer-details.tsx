import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import { type Customer, type Rental, type Vehicle, type Financing } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDetails() {
  const [, params] = useRoute("/admin/cliente/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const customerId = params?.id;

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tags, setTags] = useState("");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [status, setStatus] = useState("");

  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    enabled: !!customerId,
  });

  const { data: rentals, isLoading: isLoadingRentals } = useQuery<Rental[]>({
    queryKey: ["/api/customers", customerId, "/rentals"],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}/rentals`);
      if (!response.ok) throw new Error("Failed to fetch rentals");
      return response.json();
    },
    enabled: !!customerId,
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: financings } = useQuery<Financing[]>({
    queryKey: ["/api/customers", customerId, "/financings"],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}/financings`);
      if (!response.ok) throw new Error("Failed to fetch financings");
      return response.json();
    },
    enabled: !!customerId,
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      return await apiRequest("PATCH", `/api/customers/${customerId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cliente",
        variant: "destructive",
      });
    },
  });

  const handleSaveNotes = () => {
    updateCustomerMutation.mutate({ notes });
    setIsEditingNotes(false);
  };

  const handleSaveTags = () => {
    const tagArray = tags.split(",").map(t => t.trim()).filter(t => t);
    updateCustomerMutation.mutate({ tags: tagArray });
    setIsEditingTags(false);
  };

  const handleSaveStatus = () => {
    updateCustomerMutation.mutate({ status });
    setIsEditingStatus(false);
  };

  if (isLoadingCustomer || isLoadingRentals) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Cliente não encontrado</p>
          <Button onClick={() => setLocation("/admin")} className="mt-4">
            Voltar ao Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-6">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/admin")}
              className="text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-back-admin"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Detalhes do Cliente</h1>
              <p className="text-primary-foreground/80">CRM - Gestão de Clientes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Cliente */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome</Label>
                  <p className="font-semibold">{customer.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p>{customer.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Telefone</Label>
                  <p>{customer.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">CPF</Label>
                  <p>{customer.cpf}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs mb-2">Status</Label>
                  {isEditingStatus ? (
                    <div className="flex gap-2">
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="blocked">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={handleSaveStatus} data-testid="button-save-status">
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setIsEditingStatus(false)} data-testid="button-cancel-status">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                        {customer.status === "active" ? "Ativo" : customer.status === "vip" ? "VIP" : customer.status === "inactive" ? "Inativo" : "Bloqueado"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setStatus(customer.status);
                          setIsEditingStatus(true);
                        }}
                        data-testid="button-edit-status"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {customer.isNegativado && (
                  <div>
                    <Badge variant="destructive">Cliente Negativado</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Total Gasto</Label>
                  <p className="text-2xl font-bold text-primary">R$ {Number(customer.totalSpent).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Total de Aluguéis</Label>
                  <p className="text-2xl font-bold">{customer.totalRentals}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Cliente desde</Label>
                  <p>{customer.createdAt && format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                {customer.lastRentalAt && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Último Aluguel</Label>
                    <p>{format(new Date(customer.lastRentalAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tags</CardTitle>
                {!isEditingTags && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setTags(customer.tags?.join(", ") || "");
                      setIsEditingTags(true);
                    }}
                    data-testid="button-edit-tags"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditingTags ? (
                  <div className="space-y-2">
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Digite as tags separadas por vírgula"
                      data-testid="input-tags"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTags} data-testid="button-save-tags">
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingTags(false)} data-testid="button-cancel-tags">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">Nenhuma tag adicionada</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notas</CardTitle>
                {!isEditingNotes && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setNotes(customer.notes || "");
                      setIsEditingNotes(true);
                    }}
                    data-testid="button-edit-notes"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione notas sobre o cliente"
                      rows={4}
                      data-testid="textarea-notes"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveNotes} data-testid="button-save-notes">
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)} data-testid="button-cancel-notes">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {customer.notes || (
                      <span className="text-muted-foreground">Nenhuma nota adicionada</span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Aluguéis e Planos Contratados */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Aluguéis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rentals && rentals.length > 0 ? (
                    rentals.map((rental) => {
                      const vehicle = vehicles?.find(v => v.id === rental.vehicleId);
                      return (
                        <div
                          key={rental.id}
                          className="p-4 rounded-lg border"
                          data-testid={`rental-${rental.id}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{vehicle?.name || "Veículo não encontrado"}</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground text-xs">Início:</span>
                                  <span className="ml-1">{format(new Date(rental.startDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Fim:</span>
                                  <span className="ml-1">{format(new Date(rental.endDate), "dd/MM/yyyy", { locale: ptBR })}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Valor Total:</span>
                                  <span className="ml-1 font-semibold">R$ {Number(rental.totalPrice).toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Status:</span>
                                  <Badge className="ml-1" variant={rental.status === "completed" ? "default" : rental.status === "pending" ? "secondary" : "destructive"}>
                                    {rental.status === "pending" ? "Pendente" : rental.status === "completed" ? "Concluído" : "Cancelado"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum aluguel encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Planos Contratados (Financiamentos) */}
            <Card>
              <CardHeader>
                <CardTitle>Planos Contratados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financings && financings.length > 0 ? (
                    financings.map((financing) => {
                      const vehicle = vehicles?.find(v => v.id === financing.vehicleId);
                      return (
                        <div
                          key={financing.id}
                          className="p-4 rounded-lg border"
                          data-testid={`financing-${financing.id}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{vehicle?.name || "Veículo não encontrado"}</h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground text-xs">Valor do Veículo:</span>
                                  <span className="ml-1 font-semibold">R$ {Number(financing.vehicleValue).toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Taxa de Juros:</span>
                                  <span className="ml-1">{Number(financing.interestRate).toFixed(2)}% a.m.</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Prazo:</span>
                                  <span className="ml-1">{financing.installments} meses</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Parcela Mensal:</span>
                                  <span className="ml-1 font-semibold text-primary">R$ {Number(financing.monthlyInstallment).toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Data de Início:</span>
                                  <span className="ml-1">{financing.startDate ? format(new Date(financing.startDate), "dd/MM/yyyy", { locale: ptBR }) : "Não definida"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground text-xs">Status:</span>
                                  <Badge 
                                    className="ml-1" 
                                    variant={
                                      financing.status === "ativo" ? "default" : 
                                      financing.status === "pago" ? "default" : 
                                      "secondary"
                                    }
                                  >
                                    {financing.status === "ativo" ? "Ativo" : financing.status === "pago" ? "Pago" : "Cancelado"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum plano contratado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
