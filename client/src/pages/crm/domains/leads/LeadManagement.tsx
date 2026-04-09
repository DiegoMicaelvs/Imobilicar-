import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Mail, Phone, Car, User, Tag, Trash2, Download } from "lucide-react";
import ExcelJS from "exceljs";
import placeholderLogo from "@assets/logo_imobile_1765389205488.png";
import type { Lead } from "@shared/schema";
import { insertLeadSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LeadManagement() {
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(50);
  const { toast } = useToast();

  // Use CrmData context instead of local useQuery
  const { leads, vehicles, isLoading, invalidate } = useCrmData();
  const leadsLoading = isLoading.leads;

  // Lead form setup
  const leadForm = useForm({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      source: "website",
      status: "new",
      interest: "rental",
      notes: "",
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      invalidate.leads();
      invalidate.customers();
      leadForm.reset();
      setLeadDialogOpen(false);
      toast({
        title: "Lead criado",
        description: "Lead adicionado com sucesso ao CRM",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar lead. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/leads/${id}`, data);
    },
    onSuccess: () => {
      invalidate.leads();
      invalidate.customers();
      toast({
        title: "Lead atualizado",
        description: "Status do lead atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar lead. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete lead mutation
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      invalidate.leads();
      invalidate.customers();
      setDetailDialogOpen(false);
      setSelectedLead(null);
      toast({
        title: "Lead excluído",
        description: "Lead removido com sucesso do CRM",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao excluir lead. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleCreateLead = (data: any) => {
    createLeadMutation.mutate(data);
  };

  const handleUpdateLeadStatus = (leadId: string, status: string) => {
    updateLeadMutation.mutate({ id: leadId, data: { status } });
  };

  const handleDeleteLead = (leadId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.")) {
      deleteLeadMutation.mutate(leadId);
    }
  };

  const handleExportToExcel = async () => {
    if (!leads || leads.length === 0) {
      toast({
        title: "Nenhum lead para exportar",
        description: "Não há leads cadastrados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const getInterestLabel = (interest: string) => {
      if (interest === "Com opção de compra") return "Locação com opção de compra";
      if (interest === "investor" || interest === "Ser Investidor" || interest === "Investimento") return "Investimento";
      if (interest === "both" || interest === "Ambos") return "Aluguel + Investimento";
      if (interest === "rental") return "Locação Simples";
      return interest || "Locação Simples";
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case "new": return "Novo";
        case "contacted": return "Contatado";
        case "qualified": return "Qualificado";
        case "converted": return "Convertido";
        case "lost": return "Perdido";
        default: return status;
      }
    };

    const getOrigemLabel = (source: string) => {
      switch (source) {
        case "website": return "Site";
        case "phone": return "Telefone";
        case "email": return "Email";
        case "referral": return "Indicação";
        case "social": return "Redes Sociais";
        case "other": return "Outro";
        default: return source || "";
      }
    };

    const exportData = leads.map((lead: any) => {
      let vehicle = lead.vehicleId ? vehicles?.find((v: any) => v.id === lead.vehicleId) : null;

      // Se não encontrou pelo ID, tenta buscar pelo nome do veículo
      if (!vehicle && lead.vehicleName) {
        vehicle = vehicles?.find((v: any) => v.name === lead.vehicleName);
      }

      return {
        "Nome": lead.name || "",
        "Email": lead.email || "",
        "Telefone": lead.phone || "",
        "CPF": lead.cpf || "",
        "Interesse": getInterestLabel(lead.interest),
        "Status": getStatusLabel(lead.status),
        "Origem": getOrigemLabel(lead.source),
        "Veículo de Interesse": vehicle?.name || lead.vehicleName || "",
        "Placa": vehicle?.licensePlate || "",
        "Observações": lead.notes || "",
        "Data de Cadastro": lead.createdAt
          ? format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : "",
      };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leads");

    const columnWidths = [30, 35, 16, 16, 28, 14, 16, 35, 12, 50, 18];
    const headers = Object.keys(exportData[0] || {});

    worksheet.columns = headers.map((header, i) => ({
      header,
      key: header,
      width: columnWidths[i] || 20,
    }));

    worksheet.spliceRows(1, 0,
      ["RELATÓRIO DE LEADS - IMOBILICAR"],
      [`Exportado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
      [`Total de Leads: ${leads.length}`],
      [],
    );

    worksheet.mergeCells("A1:K1");
    worksheet.mergeCells("A2:K2");
    worksheet.mergeCells("A3:K3");

    const headerRow = worksheet.getRow(5);
    headerRow.values = headers;

    exportData.forEach((row: Record<string, string>) => {
      worksheet.addRow(headers.map((h) => row[h]));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = format(new Date(), "dd-MM-yyyy", { locale: ptBR });
    link.download = `leads_${today}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `${leads.length} leads exportados para Excel com sucesso!`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "default";
      case "qualified":
        return "default";
      case "contacted":
        return "secondary";
      case "converted":
        return "default";
      case "lost":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const filteredLeads = leads?.filter((lead: any) => {
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesSearch = !searchTerm ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const totalFiltered = filteredLeads?.length || 0;
  const visibleLeads = filteredLeads?.slice(0, visibleCount);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Leads</CardTitle>
            <CardDescription>
              Gestão de leads e oportunidades. Mostrando <strong>{visibleLeads?.length || 0}</strong> de <strong>{totalFiltered}</strong> leads.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              data-testid="button-export-leads"
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="truncate">Exportar</span>
            </Button>
            <Button
              onClick={() => setLeadDialogOpen(true)}
              data-testid="button-add-lead"
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="truncate">Adicionar Lead</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Leads</label>
              <Input
                placeholder="Nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-filter-leads-search"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="select-filter-leads-status">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="qualified">Qualificado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-px bg-muted px-2" />
          {leadsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando leads...</p>
            </div>
          ) : visibleLeads && visibleLeads.length > 0 ? (
            <div className="space-y-4">
              {visibleLeads.map((lead: any) => {
                // Find vehicle if vehicleId exists
                const vehicleOfInterest = lead.vehicleId
                  ? vehicles?.find((v: any) => v.id === lead.vehicleId)
                  : null;

                return (
                  <Card
                    key={lead.id}
                    className={`hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 border-l-4 ${lead.interest === "Com opção de compra"
                        ? "border-l-purple-500"
                        : lead.interest === "investor" || lead.interest === "Ser Investidor" || lead.interest === "Investimento"
                          ? "border-l-cyan-500"
                          : lead.interest === "both" || lead.interest === "Ambos"
                            ? "border-l-amber-500"
                            : "border-l-blue-500"
                      }`}
                    onClick={() => {
                      setSelectedLead(lead);
                      setDetailDialogOpen(true);
                    }}
                    data-testid={`card-lead-${lead.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left side - Vehicle image if available */}
                        {vehicleOfInterest && (
                          <div className={`relative w-40 h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 border-muted shadow-lg group ${!vehicleOfInterest.imageUrl || vehicleOfInterest.imageUrl.includes('placeholder') ? 'bg-gray-900' : ''}`}>
                            <img
                              src={vehicleOfInterest.imageUrl && !vehicleOfInterest.imageUrl.includes('placeholder') ? vehicleOfInterest.imageUrl : placeholderLogo}
                              alt={lead.vehicleName || 'Veículo de interesse'}
                              className={`w-full h-full ${!vehicleOfInterest.imageUrl || vehicleOfInterest.imageUrl.includes('placeholder') ? 'object-contain p-3' : 'object-cover group-hover:scale-110'} transition-transform duration-300`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}

                        {/* Middle - Lead info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-xl mb-1">{lead.name}</CardTitle>
                                {lead.interest === "Com opção de compra" ? (
                                  <Badge
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-sm"
                                    data-testid={`badge-lead-interest-${lead.id}`}
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    Locação com opção de compra
                                  </Badge>
                                ) : lead.interest === "investor" || lead.interest === "Ser Investidor" || lead.interest === "Investimento" ? (
                                  <Badge
                                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-0 shadow-sm"
                                    data-testid={`badge-lead-interest-${lead.id}`}
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    Investimento
                                  </Badge>
                                ) : lead.interest === "both" || lead.interest === "Ambos" ? (
                                  <Badge
                                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-sm"
                                    data-testid={`badge-lead-interest-${lead.id}`}
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    Aluguel + Investimento
                                  </Badge>
                                ) : (
                                  <Badge
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm"
                                    data-testid={`badge-lead-interest-${lead.id}`}
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    Locação Simples
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Status selector */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={lead.status}
                                onValueChange={(value) => handleUpdateLeadStatus(lead.id, value)}
                              >
                                <SelectTrigger className="w-[150px]" data-testid={`select-lead-status-${lead.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">Novo</SelectItem>
                                  <SelectItem value="contacted">Contatado</SelectItem>
                                  <SelectItem value="qualified">Qualificado</SelectItem>
                                  <SelectItem value="converted">Convertido</SelectItem>
                                  <SelectItem value="lost">Perdido</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Contact info grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="text-muted-foreground truncate">{lead.email}</span>
                            </div>

                            {lead.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0">
                                  <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-muted-foreground">{lead.phone}</span>
                              </div>
                            )}

                            {lead.createdAt && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="text-muted-foreground">
                                  {format(new Date(lead.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                            )}

                            {lead.vehicleName && (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                                  <Car className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-muted-foreground truncate font-medium">
                                  {lead.vehicleName}
                                  {vehicleOfInterest?.licensePlate && (
                                    <span className="ml-2 font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      {vehicleOfInterest.licensePlate}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {lead.notes && (
                      <CardContent className="pt-0">
                        <div className="bg-muted/50 rounded-lg p-4 border border-muted-foreground/10">
                          <p className="text-sm text-muted-foreground leading-relaxed italic">
                            "{lead.notes}"
                          </p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
              
              {visibleCount < totalFiltered && (
                <div className="flex justify-center pt-6 pb-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setVisibleCount(prev => prev + 50)}
                    className="w-full sm:w-auto hover-elevate transition-all"
                  >
                    Carregar Mais (Mostrando {visibleCount} de {totalFiltered})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum lead cadastrado ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes do Lead</DialogTitle>
            <DialogDescription>
              Informações completas do lead selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (() => {
            const vehicleOfInterest = selectedLead.vehicleId
              ? vehicles?.find((v: any) => v.id === selectedLead.vehicleId)
              : null;

            return (
              <div className="space-y-6">
                {/* Header com avatar e nome */}
                <div className="flex items-start gap-4 pb-6 border-b">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">{selectedLead.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.interest === "Com opção de compra" ? (
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                          <Tag className="h-3 w-3 mr-1" />
                          Locação com opção de compra
                        </Badge>
                      ) : selectedLead.interest === "investor" || selectedLead.interest === "Ser Investidor" || selectedLead.interest === "Investimento" ? (
                        <Badge className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-0">
                          <Tag className="h-3 w-3 mr-1" />
                          Investimento
                        </Badge>
                      ) : selectedLead.interest === "both" || selectedLead.interest === "Ambos" ? (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
                          <Tag className="h-3 w-3 mr-1" />
                          Aluguel + Investimento
                        </Badge>
                      ) : (
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                          <Tag className="h-3 w-3 mr-1" />
                          Locação Simples
                        </Badge>
                      )}
                      <Badge variant={selectedLead.status === "converted" ? "default" : "secondary"}>
                        {selectedLead.status === "new" && "Novo"}
                        {selectedLead.status === "contacted" && "Contatado"}
                        {selectedLead.status === "qualified" && "Qualificado"}
                        {selectedLead.status === "converted" && "Convertido"}
                        {selectedLead.status === "lost" && "Perdido"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Informações de Contato */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    Informações de Contato
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="font-medium">{selectedLead.email}</p>
                      </div>
                    </div>

                    {selectedLead.phone && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0">
                            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="font-medium">{selectedLead.phone}</p>
                        </div>
                      </div>
                    )}

                    {selectedLead.cpf && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">CPF</p>
                        <p className="font-medium">{selectedLead.cpf}</p>
                      </div>
                    )}

                    {selectedLead.source && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Origem</p>
                        <p className="font-medium capitalize">{selectedLead.source}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Veículo de Interesse */}
                {vehicleOfInterest && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                        <Car className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Veículo de Interesse
                    </h4>
                    <div className="flex gap-4 p-4 rounded-xl border-2 border-muted bg-muted/30">
                      <div className={`relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 border-muted shadow-md ${!vehicleOfInterest.imageUrl || vehicleOfInterest.imageUrl.includes('placeholder') ? 'bg-gray-900' : ''}`}>
                        <img
                          src={vehicleOfInterest.imageUrl && !vehicleOfInterest.imageUrl.includes('placeholder') ? vehicleOfInterest.imageUrl : placeholderLogo}
                          alt={vehicleOfInterest.name}
                          className={`w-full h-full ${!vehicleOfInterest.imageUrl || vehicleOfInterest.imageUrl.includes('placeholder') ? 'object-contain p-2' : 'object-cover'}`}
                        />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-lg mb-1">{vehicleOfInterest.name}</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {vehicleOfInterest.brand && <p>Marca: <span className="font-medium text-foreground">{vehicleOfInterest.brand}</span></p>}
                          {vehicleOfInterest.year && <p>Ano: <span className="font-medium text-foreground">{vehicleOfInterest.year}</span></p>}
                          {vehicleOfInterest.category && <p>Categoria: <span className="font-medium text-foreground">{vehicleOfInterest.category}</span></p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data de Criação */}
                {selectedLead.createdAt && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      Data de Cadastro
                    </h4>
                    <p className="text-muted-foreground">
                      {format(new Date(selectedLead.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}

                {/* Observações */}
                {selectedLead.notes && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Observações</h4>
                    <div className="bg-muted/50 rounded-xl p-4 border border-muted-foreground/10">
                      <p className="text-muted-foreground leading-relaxed italic">
                        "{selectedLead.notes}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Delete button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    disabled={deleteLeadMutation.isPending}
                    data-testid={`button-delete-lead-${selectedLead.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleteLeadMutation.isPending ? "Excluindo..." : "Excluir Lead"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Lead Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Lead</DialogTitle>
            <DialogDescription>
              Cadastre um novo lead no sistema CRM
            </DialogDescription>
          </DialogHeader>
          <Form {...leadForm}>
            <form onSubmit={leadForm.handleSubmit(handleCreateLead)} id="lead-form" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={leadForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-lead-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leadForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-lead-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leadForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-lead-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leadForm.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-lead-source">
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="website">Site</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="referral">Indicação</SelectItem>
                          <SelectItem value="social">Redes Sociais</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leadForm.control}
                  name="interest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interesse</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-lead-interest">
                            <SelectValue placeholder="Selecione o interesse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="rental">Alugar Veículo</SelectItem>
                          <SelectItem value="investor">Ser Investidor</SelectItem>
                          <SelectItem value="both">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={leadForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-lead-status">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">Novo</SelectItem>
                          <SelectItem value="contacted">Contatado</SelectItem>
                          <SelectItem value="qualified">Qualificado</SelectItem>
                          <SelectItem value="converted">Convertido</SelectItem>
                          <SelectItem value="lost">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={leadForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="textarea-lead-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => leadForm.handleSubmit(handleCreateLead)()}
                  disabled={createLeadMutation.isPending}
                  data-testid="button-submit-lead"
                >
                  {createLeadMutation.isPending ? "Salvando..." : "Salvar Lead"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
