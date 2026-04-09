import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Car, Calendar, DollarSign, TrendingUp, Camera, Plus, Upload, AlertTriangle, Wrench, Pencil, Trash2, Eye } from "lucide-react";
import { type Vehicle, type Rental, type InvestorEvent, type VehicleInspection, type Customer } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import placeholderVehicle from "@assets/logo_imobile_1765389205488.png";

// Função para comprimir imagens mantendo alta qualidade visual
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validação de tamanho máximo do arquivo original (50MB)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      reject(new Error('Arquivo muito grande. Tamanho máximo: 50MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Função auxiliar para redimensionar com qualidade
        const resizeWithQuality = (maxDim: number, qual: number): string => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calcular novas dimensões mantendo aspect ratio
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height / width) * maxDim);
              width = maxDim;
            } else {
              width = Math.round((width / height) * maxDim);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Não foi possível processar a imagem');
          }

          // Configurar suavização de alta qualidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Aplicar filtro de nitidez leve
          ctx.filter = 'contrast(1.02) brightness(1.01)';
          
          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);
          
          // Retornar base64 com qualidade especificada
          return canvas.toDataURL('image/jpeg', qual);
        };

        // Estratégia de compressão inteligente em múltiplas etapas
        const maxTargetSize = 1.5 * 1024 * 1024; // 1.5MB em base64 (~1.1MB real)
        
        // Etapa 1: Tentar 1600px com qualidade 0.85 (ótima qualidade)
        let result = resizeWithQuality(1600, 0.85);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        // Etapa 2: Tentar 1280px com qualidade 0.80 (muito boa qualidade)
        result = resizeWithQuality(1280, 0.80);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        // Etapa 3: Tentar 1024px com qualidade 0.75 (boa qualidade)
        result = resizeWithQuality(1024, 0.75);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        // Etapa 4: Tentar 800px com qualidade 0.70 (qualidade aceitável)
        result = resizeWithQuality(800, 0.70);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        // Etapa 5: Última tentativa - 640px com qualidade 0.65 (qualidade mínima aceitável)
        result = resizeWithQuality(640, 0.65);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        // Etapa final: Forçar tamanho menor com qualidade mínima razoável
        result = resizeWithQuality(480, 0.60);
        resolve(result);
      };
      img.onerror = () => reject(new Error('Erro ao carregar a imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
};

interface VehicleStatistics {
  totalRentals: number;
  totalRevenue: number;
  expectedRevenue: number;
  completedRentals: number;
  activeRentals: number;
  totalEvents: number;
}

export default function VehicleDetails() {
  const [, params] = useRoute("/admin/veiculo/:id");
  const [, setLocation] = useLocation();
  const vehicleId = params?.id;
  const { toast } = useToast();

  // Estados para o dialog de adicionar foto
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [newInspectionType, setNewInspectionType] = useState<string>("");
  const [newImageType, setNewImageType] = useState<string>("");
  const [newImageUrl, setNewImageUrl] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");

  // Estados para o dialog de novo evento
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [eventCustomerId, setEventCustomerId] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSeverity, setEventSeverity] = useState("baixa");

  // Estados para gerenciamento de fotos
  const [viewingPhoto, setViewingPhoto] = useState<VehicleInspection | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<VehicleInspection | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [editImageType, setEditImageType] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editImageUrl, setEditImageUrl] = useState<string>("");

  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery<Vehicle>({
    queryKey: ["/api/vehicles", vehicleId],
    enabled: !!vehicleId,
  });

  const { data: statistics, isLoading: isLoadingStats } = useQuery<VehicleStatistics>({
    queryKey: ["/api/vehicles", vehicleId, "/statistics"],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${vehicleId}/statistics`);
      if (!response.ok) throw new Error("Failed to fetch statistics");
      return response.json();
    },
    enabled: !!vehicleId,
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery<any[]>({
    queryKey: ["/api/vehicles", vehicleId, "/events"],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${vehicleId}/events`);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: !!vehicleId,
  });

  const { data: rentals, isLoading: isLoadingRentals } = useQuery<Rental[]>({
    queryKey: ["/api/vehicles", vehicleId, "/rentals"],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${vehicleId}/rentals`);
      if (!response.ok) throw new Error("Failed to fetch rentals");
      return response.json();
    },
    enabled: !!vehicleId,
  });

  const { data: inspections, isLoading: isLoadingInspections } = useQuery<VehicleInspection[]>({
    queryKey: ["/api/vehicles", vehicleId, "/inspections"],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${vehicleId}/inspections`);
      if (!response.ok) throw new Error("Failed to fetch inspections");
      return response.json();
    },
    enabled: !!vehicleId,
  });

  // Query para buscar todos os clientes
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Mutation para criar novo evento
  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/customer-events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicleId, "/events"] });
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso",
      });
      setIsEventDialogOpen(false);
      setEventCustomerId("");
      setEventType("");
      setEventTitle("");
      setEventDescription("");
      setEventSeverity("baixa");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar evento",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar nova inspeção
  const createInspectionMutation = useMutation({
    mutationFn: async (data: { type: string; imageType: string; imageUrl: string; notes?: string }) => {
      return await apiRequest("POST", `/api/vehicles/${vehicleId}/inspections`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicleId, "/inspections"] });
      toast({
        title: "Foto adicionada",
        description: "A foto de vistoria foi adicionada com sucesso.",
      });
      setIsAddPhotoDialogOpen(false);
      setNewInspectionType("");
      setNewImageType("");
      setNewImageUrl("");
      setNewNotes("");
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar foto",
        description: "Ocorreu um erro ao adicionar a foto de vistoria.",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar foto
  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { imageType?: string; notes?: string | null; imageUrl?: string } }) => {
      return await apiRequest("PATCH", `/api/vehicle-inspections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicleId, "/inspections"] });
      toast({
        title: "Foto atualizada",
        description: "A foto de vistoria foi atualizada com sucesso.",
      });
      setEditingPhoto(null);
      setEditImageType("");
      setEditNotes("");
      setEditImageUrl("");
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar foto",
        description: "Ocorreu um erro ao atualizar a foto de vistoria.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar foto
  const deleteInspectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vehicle-inspections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicleId, "/inspections"] });
      toast({
        title: "Foto excluída",
        description: "A foto de vistoria foi excluída com sucesso.",
      });
      setDeletingPhotoId(null);
    },
    onError: () => {
      toast({
        title: "Erro ao excluir foto",
        description: "Ocorreu um erro ao excluir a foto de vistoria.",
        variant: "destructive",
      });
    },
  });

  const handleAddPhoto = () => {
    if (!newInspectionType || !newImageType || !newImageUrl) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createInspectionMutation.mutate({
      type: newInspectionType,
      imageType: newImageType,
      imageUrl: newImageUrl,
      notes: newNotes || undefined,
    });
  };

  const handleEditImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedImage = await compressImage(file);
      setEditImageUrl(compressedImage);
    } catch (error) {
      toast({
        title: "Erro ao processar foto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleEditPhoto = () => {
    if (!editingPhoto) return;

    // Ensure imageType is never empty - use state or fallback to original
    const finalImageType = editImageType || editingPhoto.imageType;
    
    if (!finalImageType) {
      toast({
        title: "Erro",
        description: "O tipo de foto é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const updateData: any = {
      imageType: finalImageType,
      notes: editNotes.trim() || null,
    };

    // Se uma nova imagem foi selecionada, inclui no update
    if (editImageUrl) {
      updateData.imageUrl = editImageUrl;
    }

    updateInspectionMutation.mutate({
      id: editingPhoto.id,
      data: updateData,
    });
  };

  const handleDeletePhoto = () => {
    if (!deletingPhotoId) return;
    deleteInspectionMutation.mutate(deletingPhotoId);
  };

  const handleCreateEvent = () => {
    if (!eventCustomerId || !eventType || !eventTitle) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha cliente, tipo e título do evento.",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate({
      customerId: eventCustomerId,
      vehicleId: vehicleId,
      type: eventType,
      title: eventTitle,
      description: eventDescription,
      severity: eventSeverity,
      status: "aberto",
    });
  };

  if (isLoadingVehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Veículo não encontrado</p>
          <Button onClick={() => setLocation("/admin")} className="mt-4" data-testid="button-back-admin">
            Voltar ao Admin
          </Button>
        </div>
      </div>
    );
  }

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      manutencao: "Manutenção",
      documentacao: "Documentação",
      pagamento: "Pagamento",
      inspecao: "Inspeção",
      outro: "Outro",
    };
    return types[type] || type;
  };

  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" => {
    if (severity === "critica" || severity === "alta") return "destructive";
    if (severity === "media") return "default";
    return "secondary";
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    if (status === "resolvido") return "default";
    if (status === "em_andamento") return "secondary";
    return "destructive";
  };

  const getRentalStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    if (status === "completed") return "default";
    if (status === "active") return "default";
    if (status === "cancelled") return "destructive";
    return "secondary";
  };

  const getRentalStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      active: "Ativo",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

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
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{vehicle.name}</h1>
              <p className="text-primary-foreground/80">{vehicle.brand} {vehicle.model} - {vehicle.year}</p>
            </div>
            <Badge 
              variant={vehicle.available ? "default" : "secondary"}
              data-testid="badge-availability"
            >
              {vehicle.available ? "Disponível" : "Alugado"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <Tabs defaultValue="informacoes" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="informacoes" data-testid="tab-informacoes">Informações</TabsTrigger>
            <TabsTrigger value="statistics" data-testid="tab-statistics">Estatísticas</TabsTrigger>
            <TabsTrigger value="vistoria" data-testid="tab-vistoria">Vistoria</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Eventos</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Histórico</TabsTrigger>
          </TabsList>

          {/* Tab 1 - Informações */}
          <TabsContent value="informacoes" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Veículo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Nome</Label>
                    <p className="font-semibold" data-testid="text-vehicle-name">{vehicle.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Marca</Label>
                      <p data-testid="text-vehicle-brand">{vehicle.brand}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Modelo</Label>
                      <p data-testid="text-vehicle-model">{vehicle.model}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Ano</Label>
                      <p data-testid="text-vehicle-year">{vehicle.year}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Categoria</Label>
                      <p data-testid="text-vehicle-category">{vehicle.category}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Transmissão</Label>
                      <p data-testid="text-vehicle-transmission">{vehicle.transmission}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Combustível</Label>
                      <p data-testid="text-vehicle-fuel">{vehicle.fuel}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Assentos</Label>
                      <p data-testid="text-vehicle-seats">{vehicle.seats}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Preço por Dia</Label>
                      <p className="font-semibold text-primary" data-testid="text-vehicle-price">
                        R$ {Number(vehicle.pricePerDay).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <div className="mt-1">
                      <Badge variant={vehicle.available ? "default" : "secondary"} data-testid="badge-vehicle-status">
                        {vehicle.available ? "Disponível" : "Alugado"}
                      </Badge>
                    </div>
                  </div>
                  {vehicle.isInvestorVehicle && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Veículo de Investidor</Label>
                      <div className="mt-1 space-y-1">
                        <Badge data-testid="badge-investor-vehicle">Veículo de Investidor</Badge>
                        {vehicle.investorPercentage && (
                          <p className="text-sm text-muted-foreground" data-testid="text-investor-percentage">
                            Porcentagem do investidor: {vehicle.investorPercentage}%
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Imagem do Veículo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`aspect-video relative rounded-md overflow-hidden ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'bg-gray-900' : 'bg-muted'}`}>
                    <img
                      src={vehicle.imageUrl && !vehicle.imageUrl.includes('placeholder') ? vehicle.imageUrl : placeholderVehicle}
                      alt={vehicle.name}
                      className="object-contain w-full h-full"
                      data-testid="img-vehicle"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2 - Estatísticas */}
          <TabsContent value="statistics" className="space-y-6 mt-6">
            {isLoadingStats ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando estatísticas...</p>
              </div>
            ) : statistics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Aluguéis</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-rentals">
                      {statistics.totalRentals}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aluguéis realizados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Receita Finalizada</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-revenue">
                      R$ {statistics.totalRevenue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      De aluguéis concluídos
                    </p>
                    {statistics.expectedRevenue && statistics.expectedRevenue > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-semibold">+R$ {statistics.expectedRevenue.toFixed(2)}</span> em aluguéis ativos
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Aluguéis Concluídos</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-completed-rentals">
                      {statistics.completedRentals}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aluguéis finalizados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Aluguéis Ativos</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-active-rentals">
                      {statistics.activeRentals}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aluguéis em andamento
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Eventos</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-events">
                      {statistics.totalEvents}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Eventos registrados
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Erro ao carregar estatísticas</p>
              </div>
            )}
          </TabsContent>

          {/* Tab 3 - Vistoria */}
          <TabsContent value="vistoria" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Fotos de Vistoria
                </CardTitle>
                <Dialog open={isAddPhotoDialogOpen} onOpenChange={setIsAddPhotoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" data-testid="button-add-inspection-photo">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Foto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Adicionar Foto de Vistoria</DialogTitle>
                      <DialogDescription>
                        Faça upload de uma nova foto de vistoria do veículo
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      {/* Tipo de Inspeção */}
                      <div className="space-y-2">
                        <Label htmlFor="inspection-type">
                          Tipo de Inspeção <span className="text-destructive">*</span>
                        </Label>
                        <Select value={newInspectionType} onValueChange={setNewInspectionType}>
                          <SelectTrigger id="inspection-type" data-testid="select-inspection-type">
                            <SelectValue placeholder="Selecione o tipo de inspeção" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="evaluation">Avaliação Inicial</SelectItem>
                            <SelectItem value="check-in">Check-in (Retirada)</SelectItem>
                            <SelectItem value="check-out">Check-out (Devolução)</SelectItem>
                            <SelectItem value="documents">Documentos</SelectItem>
                            <SelectItem value="event">Evento</SelectItem>
                            <SelectItem value="accident">Sinistro</SelectItem>
                            <SelectItem value="damage">Avaria</SelectItem>
                            <SelectItem value="maintenance">Manutenção</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tipo de Foto */}
                      <div className="space-y-2">
                        <Label htmlFor="image-type">
                          Tipo de Foto <span className="text-destructive">*</span>
                        </Label>
                        <Select value={newImageType} onValueChange={setNewImageType}>
                          <SelectTrigger id="image-type" data-testid="select-image-type">
                            <SelectValue placeholder="Selecione o tipo de foto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="front">Frontal</SelectItem>
                            <SelectItem value="back">Traseira</SelectItem>
                            <SelectItem value="right_side">Lateral Direita</SelectItem>
                            <SelectItem value="left_side">Lateral Esquerda</SelectItem>
                            <SelectItem value="dashboard">Painel</SelectItem>
                            <SelectItem value="interior">Interior</SelectItem>
                            <SelectItem value="document">Documento</SelectItem>
                            <SelectItem value="damage_detail">Detalhe de Avaria</SelectItem>
                            <SelectItem value="other">Outra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Upload de Imagem */}
                      <div className="space-y-2">
                        <Label htmlFor="image-upload">
                          Imagem <span className="text-destructive">*</span>
                        </Label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              
                              className="flex-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressedImage = await compressImage(file);
                                    setNewImageUrl(compressedImage);
                                  } catch (error) {
                                    toast({
                                      title: "Erro ao processar foto",
                                      description: error instanceof Error ? error.message : "Erro desconhecido",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              data-testid="input-inspection-image-upload"
                            />
                          </div>
                          {newImageUrl && (
                            <div className="mt-3 border rounded-lg p-2 bg-muted">
                              <img 
                                src={newImageUrl} 
                                alt="Preview" 
                                className="w-full max-h-64 object-contain rounded-md" 
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Descrição/Observações */}
                      <div className="space-y-2">
                        <Label htmlFor="notes">Descrição / Observações</Label>
                        <Textarea
                          id="notes"
                          placeholder="Adicione observações sobre esta foto (opcional)"
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                          rows={4}
                          data-testid="textarea-inspection-notes"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddPhotoDialogOpen(false)}
                        disabled={createInspectionMutation.isPending}
                        data-testid="button-cancel-add-photo"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddPhoto}
                        disabled={createInspectionMutation.isPending || !newInspectionType || !newImageType || !newImageUrl}
                        data-testid="button-confirm-add-photo"
                      >
                        {createInspectionMutation.isPending ? "Adicionando..." : "Adicionar Foto"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingInspections ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando inspeções...</p>
                  </div>
                ) : inspections && inspections.length > 0 ? (
                  <div className="space-y-8">
                    {/* Labels para tipos */}
                    {(() => {
                      const typeLabels = {
                        evaluation: 'Avaliação Inicial',
                        'check-in': 'Check-in',
                        'check-out': 'Check-out',
                        documents: 'Documentos',
                        event: 'Evento',
                        accident: 'Sinistro',
                        damage: 'Avaria',
                        maintenance: 'Manutenção',
                        other: 'Outro',
                      };

                      const imageTypeLabels = {
                        front: 'Frontal',
                        back: 'Traseira',
                        right_side: 'Lateral Direita',
                        left_side: 'Lateral Esquerda',
                        dashboard: 'Painel',
                        interior: 'Interior',
                        document: 'Documento',
                        damage_detail: 'Detalhe de Avaria',
                        other: 'Outra',
                      };

                      // Separar inspeções por aluguel (check-in/check-out) e outras
                      const inspectionsWithRental = inspections.filter(i => i.rentalId && (i.type === 'check-in' || i.type === 'check-out'));
                      const inspectionsWithoutRental = inspections.filter(i => !i.rentalId || (i.type !== 'check-in' && i.type !== 'check-out'));

                      // Agrupar por rentalId
                      const rentalGroups = new Map<string, { rental: Rental | undefined; checkin: VehicleInspection[]; checkout: VehicleInspection[] }>();
                      
                      inspectionsWithRental.forEach(inspection => {
                        if (!inspection.rentalId) return;
                        
                        if (!rentalGroups.has(inspection.rentalId)) {
                          const rental = rentals?.find(r => r.id === inspection.rentalId);
                          rentalGroups.set(inspection.rentalId, { rental, checkin: [], checkout: [] });
                        }
                        
                        const group = rentalGroups.get(inspection.rentalId)!;
                        if (inspection.type === 'check-in') {
                          group.checkin.push(inspection);
                        } else if (inspection.type === 'check-out') {
                          group.checkout.push(inspection);
                        }
                      });

                      // Ordenar fotos de cada grupo por data (mais recente primeiro)
                      rentalGroups.forEach(group => {
                        group.checkin.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        group.checkout.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                      });

                      // Renderizar Card de foto individual
                      const renderInspectionCard = (inspection: VehicleInspection) => (
                        <Card key={inspection.id} className="overflow-hidden group">
                          <div className="aspect-video relative bg-muted cursor-pointer" onClick={() => setViewingPhoto(inspection)}>
                            <img
                              src={inspection.imageUrl}
                              alt={`${imageTypeLabels[inspection.imageType as keyof typeof imageTypeLabels]}`}
                              className="object-cover w-full h-full transition-transform group-hover:scale-105"
                              data-testid={`img-inspection-${inspection.id}`}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <CardContent className="p-4 space-y-2">
                            <div>
                              <Label className="text-muted-foreground text-xs">Tipo de Foto</Label>
                              <p className="font-medium text-sm" data-testid={`text-image-type-${inspection.id}`}>
                                {imageTypeLabels[inspection.imageType as keyof typeof imageTypeLabels]}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Data e Hora</Label>
                              <p className="text-sm" data-testid={`text-inspection-date-${inspection.id}`}>
                                {format(new Date(inspection.createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              </p>
                            </div>
                            {inspection.notes && (
                              <div>
                                <Label className="text-muted-foreground text-xs">Observações</Label>
                                <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-inspection-notes-${inspection.id}`}>
                                  {inspection.notes}
                                </p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2" role="group" aria-label="Ações da foto">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Ensure all edit state is populated before opening dialog
                                  // and clear any previously uploaded image
                                  setEditImageType(inspection.imageType);
                                  setEditNotes(inspection.notes || "");
                                  setEditImageUrl("");
                                  setEditingPhoto(inspection);
                                }}
                                data-testid={`button-edit-inspection-${inspection.id}`}
                                aria-label={`Editar foto ${imageTypeLabels[inspection.imageType as keyof typeof imageTypeLabels]}`}
                              >
                                <Pencil className="h-3 w-3 mr-1" aria-hidden="true" />
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingPhotoId(inspection.id);
                                }}
                                data-testid={`button-delete-inspection-${inspection.id}`}
                                aria-label={`Excluir foto ${imageTypeLabels[inspection.imageType as keyof typeof imageTypeLabels]}`}
                              >
                                <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
                                Excluir
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );

                      return (
                        <>
                          {/* Seção 1: Aluguéis (Check-in e Check-out agrupados por usuário) */}
                          {rentalGroups.size > 0 && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">Vistorias de Aluguéis</h3>
                                <Badge variant="secondary">{rentalGroups.size} {rentalGroups.size === 1 ? 'aluguel' : 'aluguéis'}</Badge>
                              </div>
                              
                              {Array.from(rentalGroups.entries())
                                .sort(([, a], [, b]) => {
                                  // Ordenar por data do aluguel (mais recente primeiro)
                                  const dateA = a.rental ? new Date(a.rental.startDate).getTime() : 0;
                                  const dateB = b.rental ? new Date(b.rental.startDate).getTime() : 0;
                                  return dateB - dateA;
                                })
                                .map(([rentalId, group]) => {
                                  const { rental, checkin, checkout } = group;
                                  
                                  return (
                                    <Card key={rentalId} className="border-2">
                                      <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <CardTitle className="text-base">
                                                {rental?.customerName || 'Cliente não encontrado'}
                                              </CardTitle>
                                              {rental && (
                                                <Badge variant="outline">
                                                  {format(new Date(rental.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(rental.endDate), "dd/MM/yyyy", { locale: ptBR })}
                                                </Badge>
                                              )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                              CPF: {rental?.customerCpf || 'N/A'}
                                            </p>
                                          </div>
                                          <div className="flex gap-2 flex-wrap">
                                            {checkin.length > 0 && (
                                              <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                                                ✓ Check-in ({checkin.length})
                                              </Badge>
                                            )}
                                            {checkout.length > 0 && (
                                              <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                                                ✓ Check-out ({checkout.length})
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="space-y-6">
                                        {/* Check-in */}
                                        {checkin.length > 0 && (
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-semibold">Check-in</h4>
                                                <Badge variant="default" className="bg-chart-3 hover:bg-chart-3">Retirada</Badge>
                                              </div>
                                              <p className="text-sm text-muted-foreground">
                                                {format(new Date(checkin[0].createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                                              </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                              {checkin.map(renderInspectionCard)}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Check-out */}
                                        {checkout.length > 0 && (
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-semibold">Check-out</h4>
                                                <Badge variant="default" className="bg-chart-1 hover:bg-chart-1">Devolução</Badge>
                                              </div>
                                              <p className="text-sm text-muted-foreground">
                                                {format(new Date(checkout[0].createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                                              </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                              {checkout.map(renderInspectionCard)}
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                            </div>
                          )}

                          {/* Seção 2: Outras Vistorias (Avaliação, Documentos, Eventos, etc.) */}
                          {inspectionsWithoutRental.length > 0 && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">Outras Vistorias</h3>
                              </div>
                              
                              {['evaluation', 'documents', 'event', 'accident', 'damage', 'maintenance', 'other'].map(inspectionType => {
                                const typeInspections = inspectionsWithoutRental
                                  .filter(i => i.type === inspectionType)
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                
                                if (typeInspections.length === 0) return null;

                                return (
                                  <div key={inspectionType} className="space-y-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-semibold" data-testid={`badge-inspection-type-${inspectionType}`}>
                                          {typeLabels[inspectionType as keyof typeof typeLabels]}
                                        </h4>
                                        <Badge variant="outline">
                                          {typeInspections.length} {typeInspections.length === 1 ? 'foto' : 'fotos'}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {typeInspections.map(renderInspectionCard)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma foto de vistoria registrada</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      As fotos de vistoria aparecerão aqui quando forem enviadas
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4 - Eventos */}
          <TabsContent value="events" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Eventos do Veículo</CardTitle>
                <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-vehicle-event">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Evento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Novo Evento</DialogTitle>
                      <DialogDescription>
                        Registre sinistros, assistência 24h, manutenções e outros eventos relacionados ao veículo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Cliente</Label>
                        <Select value={eventCustomerId} onValueChange={setEventCustomerId}>
                          <SelectTrigger data-testid="select-event-customer">
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers?.filter(c => c.status === "active" || c.status === "vip").map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name} - {customer.cpf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tipo de Evento</Label>
                        <Select value={eventType} onValueChange={setEventType}>
                          <SelectTrigger data-testid="select-vehicle-event-type">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sinistro">Sinistro</SelectItem>
                            <SelectItem value="assistencia_24h">Assistência 24h</SelectItem>
                            <SelectItem value="manutencao">Manutenção</SelectItem>
                            <SelectItem value="multa">Multa</SelectItem>
                            <SelectItem value="dano">Dano ao Veículo</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="Título do evento"
                          data-testid="input-vehicle-event-title"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          placeholder="Descreva o evento"
                          rows={3}
                          data-testid="textarea-vehicle-event-description"
                        />
                      </div>
                      <div>
                        <Label>Gravidade</Label>
                        <Select value={eventSeverity} onValueChange={setEventSeverity}>
                          <SelectTrigger data-testid="select-vehicle-event-severity">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="critica">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsEventDialogOpen(false)} data-testid="button-cancel-vehicle-event">
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateEvent} data-testid="button-create-vehicle-event">
                        Criar Evento
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando eventos...</p>
                  </div>
                ) : events && events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((event) => {
                      const eventCustomer = event.customerId ? customers?.find(c => c.id === event.customerId) : null;
                      return (
                      <div 
                        key={event.id} 
                        className="p-4 rounded-lg border"
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {event.type === "sinistro" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                              {event.type === "assistencia_24h" && <Wrench className="h-4 w-4 text-primary" />}
                              <Badge variant="outline" data-testid={`badge-event-type-${event.id}`}>
                                {getEventTypeLabel(event.type)}
                              </Badge>
                              <Badge variant={getSeverityVariant(event.severity)} data-testid={`badge-event-severity-${event.id}`}>
                                {event.severity}
                              </Badge>
                              <Badge variant={getStatusVariant(event.status)} data-testid={`badge-event-status-${event.id}`}>
                                {event.status}
                              </Badge>
                              {eventCustomer && (
                                <Badge variant="outline" className="gap-1">
                                  {eventCustomer.name}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold mb-1" data-testid={`text-event-title-${event.id}`}>
                              {event.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2" data-testid={`text-event-description-${event.id}`}>
                              {event.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span data-testid={`text-event-date-${event.id}`}>
                                {format(new Date(event.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {event.cost && (
                                <span className="font-semibold" data-testid={`text-event-cost-${event.id}`}>
                                  Custo: R$ {Number(event.cost).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="empty-events">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum evento registrado para este veículo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4 - Histórico */}
          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Aluguéis</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRentals ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Carregando histórico...</p>
                  </div>
                ) : rentals && rentals.length > 0 ? (
                  <div className="space-y-4">
                    {rentals.map((rental) => (
                      <div 
                        key={rental.id} 
                        className="p-4 rounded-lg border"
                        data-testid={`rental-${rental.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold" data-testid={`text-rental-customer-${rental.id}`}>
                                {rental.customerName}
                              </h4>
                              <Badge variant={getRentalStatusVariant(rental.status)} data-testid={`badge-rental-status-${rental.id}`}>
                                {getRentalStatusLabel(rental.status)}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span data-testid={`text-rental-dates-${rental.id}`}>
                                  {format(new Date(rental.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(rental.endDate), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold" data-testid={`text-rental-price-${rental.id}`}>
                                  R$ {Number(rental.totalPrice).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="empty-rentals">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhum aluguel registrado para este veículo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Visualização de Foto em Tela Cheia */}
      <Dialog open={!!viewingPhoto} onOpenChange={(open) => !open && setViewingPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]" aria-describedby="photo-viewer-description">
          <DialogHeader>
            <DialogTitle>Visualização de Foto</DialogTitle>
            <DialogDescription id="photo-viewer-description">
              Visualize a foto de vistoria em tamanho ampliado com todos os detalhes
            </DialogDescription>
          </DialogHeader>
          {viewingPhoto && (
            <div className="space-y-4">
              <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                <img
                  src={viewingPhoto.imageUrl}
                  alt="Foto de inspeção"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo de Inspeção</Label>
                  <p className="font-medium">
                    {viewingPhoto.type === 'check-in' ? 'Check-in' :
                     viewingPhoto.type === 'check-out' ? 'Check-out' :
                     viewingPhoto.type === 'evaluation' ? 'Avaliação Inicial' :
                     viewingPhoto.type === 'documents' ? 'Documentos' :
                     viewingPhoto.type === 'accident' ? 'Sinistro' :
                     viewingPhoto.type === 'damage' ? 'Avaria' :
                     viewingPhoto.type === 'maintenance' ? 'Manutenção' :
                     viewingPhoto.type}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo de Foto</Label>
                  <p className="font-medium">
                    {viewingPhoto.imageType === 'front' ? 'Frontal' :
                     viewingPhoto.imageType === 'back' ? 'Traseira' :
                     viewingPhoto.imageType === 'right_side' ? 'Lateral Direita' :
                     viewingPhoto.imageType === 'left_side' ? 'Lateral Esquerda' :
                     viewingPhoto.imageType === 'dashboard' ? 'Painel' :
                     viewingPhoto.imageType === 'interior' ? 'Interior' :
                     viewingPhoto.imageType}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data e Hora</Label>
                  <p className="font-medium">
                    {format(new Date(viewingPhoto.createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
                {viewingPhoto.notes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="text-sm">{viewingPhoto.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Foto */}
      <Dialog open={!!editingPhoto} onOpenChange={(open) => {
        if (!open) {
          setEditingPhoto(null);
          setEditImageType("");
          setEditNotes("");
          setEditImageUrl("");
        }
      }}>
        <DialogContent aria-describedby="edit-photo-description">
          <DialogHeader>
            <DialogTitle>Editar Foto de Vistoria</DialogTitle>
            <DialogDescription id="edit-photo-description">
              Atualize o tipo de foto, observações ou substitua a imagem
            </DialogDescription>
          </DialogHeader>
          {editingPhoto && (
            <div className="space-y-4">
              <div className="aspect-video relative bg-muted rounded overflow-hidden">
                <img
                  src={editImageUrl || editingPhoto.imageUrl}
                  alt={`Foto de vistoria - ${editingPhoto.imageType}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-image-file">Substituir Foto (opcional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-image-file"
                      type="file"
                      accept="image/*"
                      
                      onChange={handleEditImageFile}
                      className="flex-1"
                      data-testid="input-edit-image-file"
                    />
                    {editImageUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditImageUrl("")}
                        data-testid="button-clear-new-image"
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  {editImageUrl && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Nova foto selecionada. Clique em "Salvar Alterações" para confirmar.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-image-type">
                    Tipo de Foto <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={editImageType || editingPhoto.imageType} 
                    onValueChange={setEditImageType}
                  >
                    <SelectTrigger id="edit-image-type" data-testid="select-edit-image-type">
                      <SelectValue placeholder="Selecione o tipo de foto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front">Frontal</SelectItem>
                      <SelectItem value="back">Traseira</SelectItem>
                      <SelectItem value="right_side">Lateral Direita</SelectItem>
                      <SelectItem value="left_side">Lateral Esquerda</SelectItem>
                      <SelectItem value="dashboard">Painel</SelectItem>
                      <SelectItem value="interior">Interior</SelectItem>
                      <SelectItem value="other">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Observações</Label>
                  <Textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Adicione observações sobre esta foto..."
                    rows={3}
                    data-testid="textarea-edit-notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingPhoto(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEditPhoto} 
                  disabled={updateInspectionMutation.isPending || !editImageType}
                  data-testid="button-save-edit"
                >
                  {updateInspectionMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deletingPhotoId} onOpenChange={(open) => !open && setDeletingPhotoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Foto de Vistoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhoto}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInspectionMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
