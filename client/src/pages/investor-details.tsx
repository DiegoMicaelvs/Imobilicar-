import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Save, X, Plus, Wrench, Car, FileText, Trash2, Search, DollarSign, AlertTriangle, Camera } from "lucide-react";
import { type Customer, type Vehicle, type InvestorEvent, type InvestmentQuota, type VehicleInspection, insertVehicleSchema, type InsertVehicle } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface FipeBrand {
  name: string;
  code: string;
}

interface FipeModel {
  name: string;
  code: string;
}

interface FipeYear {
  name: string;
  code: string;
}

interface FipePrice {
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
}

export default function InvestorDetails() {
  const [, params] = useRoute("/admin/investidor/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const investorId = params?.id;

  // Editing states
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [status, setStatus] = useState("");

  // Personal info fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [isMainDriver, setIsMainDriver] = useState(true);
  const [paymentDate, setPaymentDate] = useState<number | null>(null);
  const [bonusDate, setBonusDate] = useState<string>("");
  const [bonusValue, setBonusValue] = useState<string>("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Event dialog
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventType, setEventType] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventSeverity, setEventSeverity] = useState("baixa");

  // Event editing and deletion
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingCessionContract, setDownloadingCessionContract] = useState(false);
  const [selectedVehicleForContract, setSelectedVehicleForContract] = useState<string | null>(null);
  const [editEventType, setEditEventType] = useState("");
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventDescription, setEditEventDescription] = useState("");
  const [editEventSeverity, setEditEventSeverity] = useState("baixa");
  const [editEventStatus, setEditEventStatus] = useState("aberto");

  // Add vehicle dialog
  const [addVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false);

  // Damage photos dialog
  const [damagePhotosDialogOpen, setDamagePhotosDialogOpen] = useState(false);
  const [selectedVehicleForDamage, setSelectedVehicleForDamage] = useState<Vehicle | null>(null);

  // FIPE API states
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModel[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeYear[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [fipeValue, setFipeValue] = useState<string>("");
  const [manualBrandInput, setManualBrandInput] = useState<string>("");
  const [manualModelInput, setManualModelInput] = useState<string>("");
  const [manualDividend, setManualDividend] = useState<string>("");
  
  const lastBrandRequestRef = useRef<string>("");
  const lastModelRequestRef = useRef<string>("");
  const lastConsultaRequestRef = useRef<string>("");

  const { data: investor, isLoading: isLoadingInvestor } = useQuery<Customer>({
    queryKey: ["/api/investors", investorId],
    enabled: !!investorId,
  });

  const { data: events } = useQuery<InvestorEvent[]>({
    queryKey: ["/api/investors", investorId, "/events"],
    queryFn: async () => {
      const response = await fetch(`/api/investors/${investorId}/events`);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: !!investorId,
  });

  const { data: investorVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/investors", investorId, "/vehicles"],
    queryFn: async () => {
      const response = await fetch(`/api/investors/${investorId}/vehicles`);
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      return response.json();
    },
    enabled: !!investorId,
  });

  // Buscar cotas de investimento
  const { data: investmentQuotas } = useQuery<InvestmentQuota[]>({
    queryKey: ["/api/investment-quotas"],
    enabled: !!investorId,
  });

  // Buscar inspeções/avarias dos veículos do investidor
  const { data: vehicleInspections } = useQuery<VehicleInspection[]>({
    queryKey: ["/api/investors", investorId, "/vehicle-inspections"],
    queryFn: async () => {
      if (!investorVehicles || investorVehicles.length === 0) return [];
      
      const allInspections: VehicleInspection[] = [];
      for (const vehicle of investorVehicles) {
        try {
          const response = await fetch(`/api/vehicles/${vehicle.id}/inspections`);
          if (response.ok) {
            const inspections = await response.json();
            allInspections.push(...inspections);
          }
        } catch (error) {
          console.error(`Error fetching inspections for vehicle ${vehicle.id}:`, error);
        }
      }
      return allInspections;
    },
    enabled: !!investorVehicles && investorVehicles.length > 0,
  });

  // Função para obter fotos de avaria de um veículo
  const getDamagePhotos = (vehicleId: string): VehicleInspection[] => {
    if (!vehicleInspections) return [];
    return vehicleInspections.filter(
      (inspection) => 
        inspection.vehicleId === vehicleId && 
        inspection.imageType?.startsWith('damage_')
    );
  };

  // Função para obter notas de avaria de um veículo
  const getDamageNotes = (vehicleId: string): string | null => {
    if (!vehicleInspections) return null;
    const notesInspection = vehicleInspections.find(
      (inspection) => 
        inspection.vehicleId === vehicleId && 
        inspection.imageType === 'notes' &&
        inspection.notes
    );
    return notesInspection?.notes || null;
  };

  // Calcular valor a pagar baseado nas cotas de investimento
  const calculateNextPayment = () => {
    if (!investorVehicles || !investmentQuotas) return 0;
    
    let totalDividend = 0;
    
    // Para cada veículo do investidor, encontrar a cota correspondente
    investorVehicles.forEach(vehicle => {
      const fipeValue = vehicle.fipeValue ? Number(vehicle.fipeValue) : 0;
      
      // Encontrar a cota que corresponde à categoria e faixa de valor FIPE
      const matchingQuota = investmentQuotas.find(quota => 
        quota.category === vehicle.category &&
        fipeValue >= Number(quota.minValue) &&
        fipeValue <= Number(quota.maxValue)
      );
      
      if (matchingQuota) {
        totalDividend += Number(matchingQuota.dividendAmount);
      }
    });
    
    return totalDividend;
  };

  const nextPaymentValue = calculateNextPayment();

  const updateInvestorMutation = useMutation({
    mutationFn: async (data: Partial<Customer>) => {
      return await apiRequest("PATCH", `/api/investors/${investorId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors", investorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      toast({
        title: "Sucesso",
        description: "Investidor atualizado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar investidor",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/investor-events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors", investorId, "/events"] });
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso",
      });
      setEventDialogOpen(false);
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

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/investor-events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors", investorId, "/events"] });
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso",
      });
      setEditEventDialogOpen(false);
      setEditingEventId(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar evento",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await apiRequest("DELETE", `/api/investor-events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors", investorId, "/events"] });
      toast({
        title: "Sucesso",
        description: "Evento excluído com sucesso",
      });
      setDeleteEventDialogOpen(false);
      setEventToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir evento",
        variant: "destructive",
      });
    },
  });

  // Add vehicle form
  const addVehicleForm = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      year: 2024,
      category: "",
      transmission: "",
      fuel: "",
      seats: 5,
      pricePerDay: "",
      imageUrl: "",
      available: true,
      isInvestorVehicle: true,
      ownerId: investorId || "",
      investorPercentage: 70,
    },
  });

  // Calcular dividendo para veículo sendo adicionado (baseado em FIPE e categoria)
  const category = addVehicleForm.watch("category");
  const matchingQuota = useMemo(() => {
    if (!investmentQuotas || !fipeValue || !category) return null;
    
    const cleanFipeValue = fipeValue
      .replace(/[^\d,.]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    const fipeVal = parseFloat(cleanFipeValue);
    if (isNaN(fipeVal)) return null;

    return investmentQuotas.find(quota => {
      const minVal = parseFloat(quota.minValue.trim());
      const maxVal = parseFloat(quota.maxValue.trim());
      return quota.category === category && fipeVal >= minVal && fipeVal <= maxVal;
    });
  }, [investmentQuotas, fipeValue, category]);

  // Limpar e recarregar estados FIPE ao abrir/fechar dialog
  useEffect(() => {
    if (addVehicleDialogOpen) {
      // Limpar estados ao abrir
      setSelectedBrand("");
      setSelectedModel("");
      setSelectedYear("");
      setFipeValue("");
      setFipeBrands([]);
      setFipeModels([]);
      setFipeYears([]);
      setManualBrandInput("");
      setManualModelInput("");
      setManualDividend("");
      clearFipeFormFields();
      // Carregar marcas
      fetchFipeBrands();
    } else {
      // Limpar estados ao fechar
      setSelectedBrand("");
      setSelectedModel("");
      setSelectedYear("");
      setFipeValue("");
      setFipeBrands([]);
      setFipeModels([]);
      setFipeYears([]);
      setManualBrandInput("");
      setManualModelInput("");
      setManualDividend("");
      clearFipeFormFields();
    }
  }, [addVehicleDialogOpen]);

  const addVehicleMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      return await apiRequest("POST", "/api/vehicles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investors", investorId, "/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      toast({
        title: "Veículo adicionado",
        description: "Veículo adicionado ao investidor com sucesso!",
      });
      setAddVehicleDialogOpen(false);
      addVehicleForm.reset();
      // Limpar estados FIPE ao fechar
      setSelectedBrand("");
      setSelectedModel("");
      setSelectedYear("");
      setFipeValue("");
      setFipeBrands([]);
      setFipeModels([]);
      setFipeYears([]);
      setManualBrandInput("");
      setManualModelInput("");
      setManualDividend("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o veículo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // FIPE API Functions
  const clearFipeFormFields = () => {
    addVehicleForm.setValue("name", "");
    addVehicleForm.setValue("brand", "");
    addVehicleForm.setValue("model", "");
    addVehicleForm.setValue("year", new Date().getFullYear());
    addVehicleForm.setValue("fuel", "");
  };

  const fetchFipeBrands = async () => {
    setLoadingFipe(true);
    try {
      const response = await fetch("https://parallelum.com.br/fipe/api/v2/cars/brands");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setFipeBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar marcas FIPE:", error);
      setFipeBrands([]);
      toast({
        title: "Erro ao carregar marcas FIPE",
        description: "Não foi possível carregar a lista de marcas. Você pode preencher os dados manualmente.",
        variant: "destructive",
      });
    } finally {
      setLoadingFipe(false);
    }
  };

  const fetchFipeModels = async (brandId: string) => {
    lastBrandRequestRef.current = brandId;
    lastConsultaRequestRef.current = "";
    setFipeModels([]);
    setFipeYears([]);
    setSelectedModel("");
    setSelectedYear("");
    setFipeValue("");
    clearFipeFormFields();
    
    try {
      setLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      
      if (lastBrandRequestRef.current === brandId) {
        setFipeModels(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar modelos FIPE:", error);
      if (lastBrandRequestRef.current === brandId) {
        setFipeModels([]);
      }
    } finally {
      setLoadingFipe(false);
    }
  };

  const fetchFipeYears = async (brandId: string, modelId: string) => {
    lastModelRequestRef.current = `${brandId}-${modelId}`;
    lastConsultaRequestRef.current = "";
    setFipeYears([]);
    setSelectedYear("");
    setFipeValue("");
    clearFipeFormFields();
    
    try {
      setLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models/${modelId}/years`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      
      if (lastModelRequestRef.current === `${brandId}-${modelId}`) {
        setFipeYears(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar anos FIPE:", error);
      if (lastModelRequestRef.current === `${brandId}-${modelId}`) {
        setFipeYears([]);
      }
    } finally {
      setLoadingFipe(false);
    }
  };

  const consultarFipe = async () => {
    if (!selectedBrand || !selectedModel || !selectedYear) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione marca, modelo e ano para consultar a FIPE",
        variant: "destructive",
      });
      return;
    }

    const requestBrand = selectedBrand;
    const requestModel = selectedModel;
    const requestYear = selectedYear;
    const requestKey = `${requestBrand}-${requestModel}-${requestYear}`;
    lastConsultaRequestRef.current = requestKey;

    try {
      setLoadingFipe(true);
      const response = await fetch(
        `https://parallelum.com.br/fipe/api/v2/cars/brands/${requestBrand}/models/${requestModel}/years/${requestYear}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: FipePrice = await response.json();

      if (lastConsultaRequestRef.current !== requestKey) {
        return;
      }

      const brandName = fipeBrands.find(b => b.code === requestBrand)?.name || "";
      const modelName = fipeModels.find(m => m.code === requestModel)?.name || "";

      addVehicleForm.setValue("name", `${brandName} ${modelName} ${data.modelYear}`);
      addVehicleForm.setValue("brand", brandName);
      addVehicleForm.setValue("model", modelName);
      addVehicleForm.setValue("year", data.modelYear);

      const fuelMap: { [key: string]: string } = {
        "Gasolina": "Gasolina",
        "Álcool": "Etanol", 
        "Diesel": "Diesel",
        "Flex": "Flex",
        "Elétrico": "Elétrico",
        "Híbrido": "Híbrido",
      };
      const fuelValue = fuelMap[data.fuel] || "Flex";
      addVehicleForm.setValue("fuel", fuelValue);

      setFipeValue(data.price);
    } catch (error) {
      if (lastConsultaRequestRef.current === requestKey) {
        setFipeValue("");
        toast({
          title: "Erro ao consultar FIPE",
          description: "Não foi possível buscar o valor do veículo",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingFipe(false);
    }
  };

  const handleSavePersonalInfo = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !cpf.trim()) {
      toast({
        title: "Erro",
        description: "Nome, email, telefone e CPF são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    updateInvestorMutation.mutate(
      { 
        name, 
        email, 
        phone, 
        cpf,
        emergencyContact: emergencyContact || null,
        driverLicense: driverLicense || null,
        isMainDriver,
        paymentDate: paymentDate,
        bonusDate: bonusDate || null,
        bonusValue: bonusValue || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
      },
      {
        onSuccess: () => {
          setIsEditingPersonalInfo(false);
        },
      }
    );
  };

  const handleSaveStatus = () => {
    updateInvestorMutation.mutate({ status });
    setIsEditingStatus(false);
  };

  const handleCreateEvent = () => {
    createEventMutation.mutate({
      investorId,
      type: eventType,
      title: eventTitle,
      description: eventDescription,
      severity: eventSeverity,
      status: "aberto",
    });
  };

  const handleEditEvent = (event: InvestorEvent) => {
    setEditingEventId(event.id);
    setEditEventType(event.type);
    setEditEventTitle(event.title);
    setEditEventDescription(event.description);
    setEditEventSeverity(event.severity);
    setEditEventStatus(event.status);
    setEditEventDialogOpen(true);
  };

  const handleSaveEditEvent = () => {
    if (!editingEventId) return;
    
    updateEventMutation.mutate({
      id: editingEventId,
      data: {
        type: editEventType,
        title: editEventTitle,
        description: editEventDescription,
        severity: editEventSeverity,
        status: editEventStatus,
      },
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteEventDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (!eventToDelete) return;
    deleteEventMutation.mutate(eventToDelete);
  };

  if (isLoadingInvestor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Investidor não encontrado</p>
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
              <h1 className="text-2xl font-bold">Perfil do Investidor</h1>
              <p className="text-primary-foreground/80">Gestão Completa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="vehicles">Veículos</TabsTrigger>
            <TabsTrigger value="contract">Contrato</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Dados Pessoais</CardTitle>
                  {!isEditingPersonalInfo && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setName(investor.name);
                        setEmail(investor.email);
                        setPhone(investor.phone);
                        setCpf(investor.cpf);
                        setEmergencyContact(investor.emergencyContact || "");
                        setDriverLicense(investor.driverLicense || "");
                        setIsMainDriver(investor.isMainDriver ?? true);
                        setPaymentDate(investor.paymentDate ?? null);
                        setBonusDate(investor.bonusDate || "");
                        setBonusValue(investor.bonusValue || "");
                        setStreet(investor.street || "");
                        setNumber(investor.number || "");
                        setComplement(investor.complement || "");
                        setNeighborhood(investor.neighborhood || "");
                        setCity(investor.city || "");
                        setState(investor.state || "");
                        setZipCode(investor.zipCode || "");
                        setIsEditingPersonalInfo(true);
                      }}
                      data-testid="button-edit-personal-info"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingPersonalInfo ? (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-xs">Nome</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nome completo"
                          data-testid="input-edit-name"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Email</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                          data-testid="input-edit-email"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Telefone</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          data-testid="input-edit-phone"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">CPF</Label>
                        <Input
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          placeholder="000.000.000-00"
                          data-testid="input-edit-cpf"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Número de Emergência</Label>
                        <Input
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="(00) 00000-0000"
                          data-testid="input-edit-emergency-contact"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">CNH</Label>
                        <Input
                          value={driverLicense}
                          onChange={(e) => setDriverLicense(e.target.value)}
                          placeholder="Número da CNH"
                          data-testid="input-edit-driver-license"
                        />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs mb-2">Tipo de Motorista</Label>
                        <Select value={isMainDriver ? "true" : "false"} onValueChange={(val) => setIsMainDriver(val === "true")}>
                          <SelectTrigger data-testid="select-driver-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Motorista Principal</SelectItem>
                            <SelectItem value="false">Motorista Dependente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs mb-2">Data de Pagamento (Dividendos)</Label>
                        <Select 
                          value={paymentDate?.toString() || "none"} 
                          onValueChange={(val) => setPaymentDate(val === "none" ? null : parseInt(val))}
                        >
                          <SelectTrigger data-testid="select-payment-date">
                            <SelectValue placeholder="Selecione o dia do mês" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não definido</SelectItem>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                Dia {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs mb-2">Data do Bônus (DD/MM/AAAA)</Label>
                        <Input 
                          type="text"
                          placeholder="DD/MM/AAAA"
                          value={bonusDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                            if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
                            setBonusDate(value);
                          }}
                          maxLength={10}
                          data-testid="input-bonus-date"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Data específica do pagamento único</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs mb-2">Valor do Bônus (R$)</Label>
                        <Input 
                          type="text"
                          placeholder="0,00"
                          value={bonusValue}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d,]/g, '');
                            const numValue = value.replace(',', '.');
                            setBonusValue(numValue);
                          }}
                          data-testid="input-bonus-value"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Valor único a ser pago na data acima</p>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Endereço</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground text-xs">CEP</Label>
                            <Input
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              placeholder="00000-000"
                              data-testid="input-edit-zipcode"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Rua</Label>
                            <Input
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              placeholder="Nome da rua"
                              data-testid="input-edit-street"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Número</Label>
                            <Input
                              value={number}
                              onChange={(e) => setNumber(e.target.value)}
                              placeholder="123"
                              data-testid="input-edit-number"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Complemento</Label>
                            <Input
                              value={complement}
                              onChange={(e) => setComplement(e.target.value)}
                              placeholder="Apto, Bloco, etc"
                              data-testid="input-edit-complement"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Bairro</Label>
                            <Input
                              value={neighborhood}
                              onChange={(e) => setNeighborhood(e.target.value)}
                              placeholder="Nome do bairro"
                              data-testid="input-edit-neighborhood"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Cidade</Label>
                            <Input
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Nome da cidade"
                              data-testid="input-edit-city"
                            />
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Estado</Label>
                            <Input
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              placeholder="UF"
                              data-testid="input-edit-state"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={handleSavePersonalInfo} data-testid="button-save-personal-info">
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingPersonalInfo(false)} data-testid="button-cancel-personal-info">
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-xs">Nome</Label>
                        <p className="font-semibold">{investor.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Email</Label>
                        <p>{investor.email}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Telefone</Label>
                        <p>{investor.phone}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">CPF</Label>
                        <p>{investor.cpf}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Número de Emergência</Label>
                        <p>{investor.emergencyContact || "Não informado"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">CNH</Label>
                        <p>{investor.driverLicense || "Não informado"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Tipo de Motorista</Label>
                        <p>{investor.isMainDriver ? "Motorista Principal" : "Motorista Dependente"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Data de Pagamento (Dividendos)</Label>
                        <p>{investor.paymentDate ? `Dia ${investor.paymentDate} de cada mês` : "Não definido"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Data do Bônus</Label>
                        <p>{investor.bonusDate || "Não definido"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Valor do Bônus</Label>
                        <p>{investor.bonusValue ? `R$ ${parseFloat(investor.bonusValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Não definido"}</p>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Endereço</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground text-xs">CEP</Label>
                            <p>{investor.zipCode || "Não informado"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Rua</Label>
                            <p>{investor.street || "Não informado"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Número</Label>
                            <p>{investor.number || "Não informado"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Complemento</Label>
                            <p>{investor.complement || "Não informado"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Bairro</Label>
                            <p>{investor.neighborhood || "Não informado"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Cidade</Label>
                            <p>{investor.city || "Não informado"}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-xs">Estado</Label>
                            <p>{investor.state || "Não informado"}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Seção de Documentos Anexados */}
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Documentos Anexados</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <Label className="text-muted-foreground text-xs">Comprovante de Residência</Label>
                            {investor.proofOfResidenceUrl ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-medium">Sim</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => window.open(investor.proofOfResidenceUrl!, '_blank')}
                                  data-testid="button-view-proof-of-residence"
                                >
                                  Visualizar
                                </Button>
                              </div>
                            ) : (
                              <span className="text-red-600 font-medium">Não</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <Label className="text-muted-foreground text-xs">CNH (Documento)</Label>
                            {investor.cnhImageUrl ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-medium">Sim</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => window.open(investor.cnhImageUrl!, '_blank')}
                                  data-testid="button-view-cnh-document"
                                >
                                  Visualizar
                                </Button>
                              </div>
                            ) : (
                              <span className="text-red-600 font-medium">Não</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <Label className="text-muted-foreground text-xs">RG (Documento)</Label>
                            {investor.rgImageUrl ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-medium">Sim</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => window.open(investor.rgImageUrl!, '_blank')}
                                  data-testid="button-view-rg-document"
                                >
                                  Visualizar
                                </Button>
                              </div>
                            ) : (
                              <span className="text-red-600 font-medium">Não</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <Label className="text-muted-foreground text-xs">Contrato de Investidor</Label>
                            {investor.investorContractUrl ? (
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-medium">Sim</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => window.open(investor.investorContractUrl!, '_blank')}
                                  data-testid="button-view-investor-contract"
                                >
                                  Visualizar
                                </Button>
                              </div>
                            ) : (
                              <span className="text-red-600 font-medium">Não</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Status</CardTitle>
                  {!isEditingStatus && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setStatus(investor.status || "pending");
                        setIsEditingStatus(true);
                      }}
                      data-testid="button-edit-status"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingStatus ? (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-xs mb-2">Status do Investidor</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={handleSaveStatus} data-testid="button-save-status">
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingStatus(false)} data-testid="button-cancel-status">
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label className="text-muted-foreground text-xs mb-2">Status Atual</Label>
                        <Badge variant={
                          investor.status === "approved" ? "default" :
                          investor.status === "rejected" ? "destructive" :
                          investor.status === "inactive" ? "secondary" :
                          "secondary"
                        }>
                          {investor.status === "pending" ? "Pendente" :
                           investor.status === "approved" ? "Aprovado" :
                           investor.status === "rejected" ? "Rejeitado" :
                           investor.status === "inactive" ? "Inativo" :
                           investor.status}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Valor a Pagar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    R$ {nextPaymentValue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {investor.paymentDate 
                      ? `Pagamento todo dia ${investor.paymentDate}`
                      : "Dia de pagamento não definido"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Ganho</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {Number(investor.totalEarnings || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receita total acumulada
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Veículos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{investorVehicles?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Veículos cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Membro Desde</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {investor.createdAt ? format(new Date(investor.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Data de cadastro
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Veículos do Investidor */}
            {investorVehicles && investorVehicles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Veículos do Investidor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {investorVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="p-4 border rounded-lg space-y-2">
                        <div className="aspect-video relative rounded-md overflow-hidden bg-muted">
                          <img
                            src={vehicle.imageUrl}
                            alt={vehicle.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <h4 className="font-semibold">{vehicle.name}</h4>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                          <p className="text-muted-foreground">Ano: {vehicle.year}</p>
                          <p className="font-semibold">R$ {Number(vehicle.pricePerDay).toFixed(2)}/dia</p>
                          <Badge variant={vehicle.available ? "default" : "secondary"}>
                            {vehicle.available ? "Disponível" : "Alugado"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Eventos do Investidor</CardTitle>
                <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                  <Button onClick={() => setEventDialogOpen(true)} data-testid="button-add-event">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Evento
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Evento</DialogTitle>
                      <DialogDescription>
                        Adicione um novo evento ao histórico do investidor
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tipo de Evento</Label>
                        <Select value={eventType} onValueChange={setEventType}>
                          <SelectTrigger data-testid="select-event-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manutencao">Manutenção</SelectItem>
                            <SelectItem value="documentacao">Documentação</SelectItem>
                            <SelectItem value="pagamento">Pagamento</SelectItem>
                            <SelectItem value="inspecao">Inspeção</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Título</Label>
                        <Input
                          placeholder="Ex: Manutenção preventiva realizada"
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          data-testid="input-event-title"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          placeholder="Descreva os detalhes do evento"
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          data-testid="textarea-event-description"
                        />
                      </div>
                      <div>
                        <Label>Severidade</Label>
                        <Select value={eventSeverity} onValueChange={setEventSeverity}>
                          <SelectTrigger data-testid="select-event-severity">
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
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateEvent}>
                        Criar Evento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events && events.length > 0 ? (
                    events.map((event) => (
                      <div key={event.id} className="p-4 rounded-lg border" data-testid={`event-${event.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {event.type === "manutencao" && <Wrench className="h-4 w-4 text-primary" />}
                              {event.type === "documentacao" && <FileText className="h-4 w-4 text-primary" />}
                              {event.type === "pagamento" && <FileText className="h-4 w-4 text-primary" />}
                              {event.type === "inspecao" && <Car className="h-4 w-4 text-primary" />}
                              <h4 className="font-semibold">{event.title}</h4>
                              <Badge variant={event.severity === "critica" ? "destructive" : event.severity === "alta" ? "destructive" : "secondary"}>
                                {event.severity}
                              </Badge>
                              <Badge variant="outline">
                                {event.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Status: {event.status}</span>
                              <span>{format(new Date(event.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditEvent(event)}
                              data-testid={`button-edit-event-${event.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteEvent(event.id)}
                              data-testid={`button-delete-event-${event.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum evento registrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <CardTitle>Veículos do Investidor</CardTitle>
                <Button
                  onClick={() => setAddVehicleDialogOpen(true)}
                  data-testid="button-add-vehicle-to-investor"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Veículo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {investorVehicles && investorVehicles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {investorVehicles.map((vehicle) => (
                        <Card key={vehicle.id} data-testid={`vehicle-${vehicle.id}`}>
                          <CardContent className="p-0">
                            <div className="aspect-video relative rounded-t-lg overflow-hidden bg-muted">
                              <img
                                src={vehicle.imageUrl}
                                alt={vehicle.name}
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute top-2 right-2">
                                <Badge variant={vehicle.available ? "default" : "secondary"}>
                                  {vehicle.available ? "Disponível" : "Alugado"}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-4 space-y-3">
                              <div>
                                <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                                <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Ano:</span>
                                  <span className="ml-1 font-medium">{vehicle.year}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Categoria:</span>
                                  <span className="ml-1 font-medium">{vehicle.category}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Transmissão:</span>
                                  <span className="ml-1 font-medium">{vehicle.transmission}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Combustível:</span>
                                  <span className="ml-1 font-medium">{vehicle.fuel}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Assentos:</span>
                                  <span className="ml-1 font-medium">{vehicle.seats}</span>
                                </div>
                                {vehicle.licensePlate && (
                                  <div>
                                    <span className="text-muted-foreground">Placa:</span>
                                    <span className="ml-1 font-medium">{vehicle.licensePlate}</span>
                                  </div>
                                )}
                                {vehicle.fipeValue && Number(vehicle.fipeValue) > 0 && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Valor FIPE:</span>
                                    <span className="ml-1 font-medium">R$ {Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                                {vehicle.customDividend && Number(vehicle.customDividend) > 0 && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Dividendo Mensal:</span>
                                    <span className="ml-1 font-medium text-green-600">R$ {Number(vehicle.customDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                              </div>
                              <div className="pt-2 border-t">
                                <p className="text-lg font-bold text-primary">
                                  R$ {Number(vehicle.pricePerDay).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/dia</span>
                                </p>
                              </div>
                              
                              {/* Informações Adicionais do Veículo */}
                              {(vehicle.temDocumento !== null || vehicle.ipvaStatus || vehicle.licenciamentoPago !== null || 
                                vehicle.hasInsurance || vehicle.taFinanciado !== null || vehicle.eDeLeilao !== null || vehicle.temRastreador !== null) && (
                                <div className="pt-2 border-t space-y-2">
                                  <p className="text-sm font-semibold text-muted-foreground">Informações Adicionais</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {vehicle.temDocumento !== null && (
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Tem documento:</span>
                                        <span className={`font-medium ${vehicle.temDocumento ? 'text-green-600' : 'text-red-600'}`}>
                                          {vehicle.temDocumento ? 'Sim' : 'Não'}
                                        </span>
                                        {vehicle.observacoesDocumento && (
                                          <span className="text-muted-foreground italic">{vehicle.observacoesDocumento}</span>
                                        )}
                                      </div>
                                    )}
                                    {vehicle.ipvaStatus && (
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">IPVA:</span>
                                        <span className={`font-medium ${vehicle.ipvaStatus === 'sim' ? 'text-green-600' : vehicle.ipvaStatus === 'isento' ? 'text-blue-600' : 'text-red-600'}`}>
                                          {vehicle.ipvaStatus === 'sim' ? 'Pago' : vehicle.ipvaStatus === 'isento' ? 'Isento' : 'Não Pago'}
                                        </span>
                                        {vehicle.ipvaValue && vehicle.ipvaStatus === 'sim' && (
                                          <span className="text-muted-foreground">R$ {Number(vehicle.ipvaValue).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                                        )}
                                      </div>
                                    )}
                                    {vehicle.licenciamentoPago !== null && (
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Licenciamento:</span>
                                        <span className={`font-medium ${vehicle.licenciamentoPago ? 'text-green-600' : 'text-red-600'}`}>
                                          {vehicle.licenciamentoPago ? 'Pago' : 'Não Pago'}
                                        </span>
                                        {vehicle.observacoesLicenciamento && (
                                          <span className="text-muted-foreground italic">{vehicle.observacoesLicenciamento}</span>
                                        )}
                                      </div>
                                    )}
                                    {vehicle.hasInsurance !== undefined && vehicle.hasInsurance !== null && (
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Seguro:</span>
                                        <span className={`font-medium ${vehicle.hasInsurance ? 'text-green-600' : 'text-red-600'}`}>
                                          {vehicle.hasInsurance ? 'Sim' : 'Não'}
                                        </span>
                                      </div>
                                    )}
                                    {vehicle.taFinanciado !== null && (
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Financiado:</span>
                                        <span className={`font-medium ${vehicle.taFinanciado ? 'text-orange-600' : 'text-green-600'}`}>
                                          {vehicle.taFinanciado ? 'Sim' : 'Não'}
                                        </span>
                                        {vehicle.observacoesFinanciado && (
                                          <span className="text-muted-foreground italic">{vehicle.observacoesFinanciado}</span>
                                        )}
                                      </div>
                                    )}
                                    {vehicle.eDeLeilao !== null && (
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Leilão:</span>
                                        <span className={`font-medium ${vehicle.eDeLeilao ? 'text-orange-600' : 'text-green-600'}`}>
                                          {vehicle.eDeLeilao ? 'Sim' : 'Não'}
                                        </span>
                                        {vehicle.observacoesLeilao && (
                                          <span className="text-muted-foreground italic">{vehicle.observacoesLeilao}</span>
                                        )}
                                      </div>
                                    )}
                                    {vehicle.temRastreador !== null && (
                                      <div className="flex flex-col">
                                        <span className="text-muted-foreground">Rastreador:</span>
                                        <span className={`font-medium ${vehicle.temRastreador ? 'text-green-600' : 'text-red-600'}`}>
                                          {vehicle.temRastreador ? 'Sim' : 'Não'}
                                        </span>
                                        {vehicle.localizacaoRastreador && (
                                          <span className="text-muted-foreground italic">{vehicle.localizacaoRastreador}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {vehicle.problemaMecanico && (
                                    <div className="pt-2 border-t">
                                      <span className="text-xs text-muted-foreground">Problemas Mecânicos/Elétricos:</span>
                                      <p className="text-xs italic text-orange-600">{vehicle.problemaMecanico}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Seção de Avarias */}
                              {(() => {
                                const damagePhotos = getDamagePhotos(vehicle.id);
                                const damageNotes = getDamageNotes(vehicle.id);
                                const hasDamages = damagePhotos.length > 0 || damageNotes;
                                
                                return hasDamages ? (
                                  <div className="pt-2 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full border-orange-500/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                                      onClick={() => {
                                        setSelectedVehicleForDamage(vehicle);
                                        setDamagePhotosDialogOpen(true);
                                      }}
                                      data-testid={`button-view-damages-${vehicle.id}`}
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Ver Avarias ({damagePhotos.length} {damagePhotos.length === 1 ? 'foto' : 'fotos'})
                                    </Button>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum veículo cadastrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contrato de Parceria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2 mb-4">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!investorId) {
                        toast({
                          title: "Erro",
                          description: "ID do investidor não encontrado",
                          variant: "destructive",
                        });
                        return;
                      }

                      setDownloadingPdf(true);
                      try {
                        const response = await fetch(`/api/investor-contracts/${investorId}/pdf`);
                        
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => null);
                          const errorMessage = errorData?.error || 'Falha ao gerar PDF';
                          throw new Error(errorMessage);
                        }
                        
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Contrato de Parceria - ${format(new Date(), "dd-MM-yyyy")}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        
                        toast({
                          title: "Sucesso",
                          description: "PDF gerado e baixado com sucesso",
                        });
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: error instanceof Error ? error.message : "Erro ao gerar PDF do contrato",
                          variant: "destructive",
                        });
                      } finally {
                        setDownloadingPdf(false);
                      }
                    }}
                    disabled={downloadingPdf || downloadingDocx}
                    data-testid="button-download-contract-pdf"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {downloadingPdf ? "Gerando..." : "Baixar PDF"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!investorId) {
                        toast({
                          title: "Erro",
                          description: "ID do investidor não encontrado",
                          variant: "destructive",
                        });
                        return;
                      }

                      setDownloadingDocx(true);
                      try {
                        const response = await fetch(`/api/investor-contracts/${investorId}/docx`);
                        
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => null);
                          const errorMessage = errorData?.error || 'Falha ao gerar documento Word';
                          throw new Error(errorMessage);
                        }
                        
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Contrato de Parceria - ${format(new Date(), "dd-MM-yyyy")}.docx`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        
                        toast({
                          title: "Sucesso",
                          description: "Word gerado e baixado com sucesso",
                        });
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: error instanceof Error ? error.message : "Erro ao gerar Word do contrato",
                          variant: "destructive",
                        });
                      } finally {
                        setDownloadingDocx(false);
                      }
                    }}
                    disabled={downloadingPdf || downloadingDocx}
                    data-testid="button-download-contract-word"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {downloadingDocx ? "Gerando..." : "Baixar Word"}
                  </Button>
                </div>

                {/* Botão para Contrato de Cessão de Veículo (IMOBILICAR 2025) */}
                {investorVehicles && investorVehicles.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold text-sm mb-3">Contrato de Cessão de Veículo para Frota</h4>
                    <div className="flex flex-wrap gap-2">
                      {investorVehicles.map((vehicle: Vehicle) => (
                        <Button
                          key={vehicle.id}
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            if (!investor) {
                              toast({
                                title: "Erro",
                                description: "Dados do investidor não encontrados",
                                variant: "destructive",
                              });
                              return;
                            }

                            setSelectedVehicleForContract(String(vehicle.id));
                            setDownloadingCessionContract(true);
                            try {
                              const response = await fetch('/api/generate-investor-contract-docx', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  customer: {
                                    name: investor.name,
                                    cpf: investor.cpf,
                                    rg: investor.rg || '',
                                    phone: investor.phone,
                                    email: investor.email,
                                    street: investor.street || '',
                                    complement: investor.number || '',
                                    neighborhood: investor.neighborhood || '',
                                    city: investor.city || '',
                                    state: investor.state || '',
                                    zipCode: investor.zipCode || '',
                                  },
                                  vehicle: {
                                    brand: vehicle.brand || '',
                                    model: vehicle.model || vehicle.name || '',
                                    year: vehicle.year || '',
                                    plate: vehicle.licensePlate || '',
                                    renavam: vehicle.renavam || '',
                                    chassi: '',
                                  },
                                  customDividend: vehicle.customDividend ? String(vehicle.customDividend) : '0',
                                  bonusValue: investor.bonusValue ? String(investor.bonusValue) : '0',
                                  debitosVeiculo: '',
                                }),
                              });
                              
                              if (!response.ok) {
                                throw new Error('Falha ao gerar contrato de cessão');
                              }
                              
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `Contrato de Cessao - ${investor.name} - ${vehicle.licensePlate || vehicle.name} - ${format(new Date(), "dd-MM-yyyy")}.docx`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                              
                              toast({
                                title: "Sucesso",
                                description: `Contrato de cessão gerado para ${vehicle.brand} ${vehicle.model || vehicle.name}`,
                              });
                            } catch (error) {
                              toast({
                                title: "Erro",
                                description: error instanceof Error ? error.message : "Erro ao gerar contrato de cessão",
                                variant: "destructive",
                              });
                            } finally {
                              setDownloadingCessionContract(false);
                              setSelectedVehicleForContract(null);
                            }
                          }}
                          disabled={downloadingCessionContract}
                          data-testid={`button-cession-contract-${vehicle.id}`}
                        >
                          <Car className="h-4 w-4 mr-2" />
                          {downloadingCessionContract && selectedVehicleForContract === String(vehicle.id) 
                            ? "Gerando..." 
                            : `${vehicle.brand || ''} ${vehicle.model || vehicle.name || ''} - ${vehicle.licensePlate || ''}`}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Clique em um veículo para gerar o contrato de cessão no modelo IMOBILICAR 2025. 
                      As tabelas "Itens Verificados" e "Item de revisão/ajuste" ficam em branco para preenchimento manual.
                    </p>
                  </div>
                )}

                <div className="border rounded-lg p-8 bg-card space-y-6">
                  {/* Cabeçalho */}
                  <div className="text-center border-b pb-4">
                    <h2 className="text-2xl font-bold">CONTRATO DE PARCERIA - INVESTIMENTO EM VEÍCULOS</h2>
                    <p className="text-sm text-muted-foreground mt-2">Imobilicar - Locadora de Veículos</p>
                  </div>

                  {/* Partes do Contrato */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">CONTRATANTE</h3>
                      <p className="text-sm">
                        <strong>Razão Social:</strong> Imobilicar Locadora de Veículos LTDA<br />
                        <strong>CNPJ:</strong> 12.345.678/0001-90<br />
                        <strong>Endereço:</strong> Rua das Locadoras, 123 - São Paulo - SP<br />
                        <strong>Email:</strong> contato@imobilicar.com.br<br />
                        <strong>Telefone:</strong> (11) 3456-7890
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">INVESTIDOR PARCEIRO</h3>
                      <p className="text-sm">
                        <strong>Nome:</strong> {investor.name}<br />
                        <strong>CPF:</strong> {investor.cpf}<br />
                        <strong>Email:</strong> {investor.email}<br />
                        <strong>Telefone:</strong> {investor.phone}<br />
                        <strong>Data de Cadastro:</strong> {investor.createdAt ? format(new Date(investor.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Dados da Parceria */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">OBJETO DO CONTRATO</h3>
                    <div className="bg-muted/50 p-4 rounded-md">
                      <p className="text-sm text-justify">
                        O presente contrato tem por objeto estabelecer parceria de investimento em veículos, 
                        onde o INVESTIDOR PARCEIRO disponibiliza veículos de sua propriedade para locação 
                        através da plataforma Imobilicar, recebendo percentual sobre os valores das locações realizadas.
                      </p>
                    </div>
                  </div>

                  {/* Veículos do Investidor */}
                  {investorVehicles && investorVehicles.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">VEÍCULOS CADASTRADOS</h3>
                      <div className="space-y-2">
                        {investorVehicles.map((vehicle, index) => (
                          <div key={vehicle.id} className="bg-muted/30 p-3 rounded-md text-sm">
                            <p><strong>Veículo {index + 1}:</strong> {vehicle.name}</p>
                            <p><strong>Marca/Modelo:</strong> {vehicle.brand} {vehicle.model} - {vehicle.year}</p>
                            <p><strong>Categoria:</strong> {vehicle.category} | <strong>Transmissão:</strong> {vehicle.transmission} | <strong>Combustível:</strong> {vehicle.fuel}</p>
                            <p><strong>Diária:</strong> R$ {Number(vehicle.pricePerDay).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Valores e Percentuais */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">ESTATÍSTICAS</h3>
                      <p className="text-sm">
                        <strong>Total de Veículos:</strong> {investorVehicles?.length || 0}<br />
                        <strong>Total Ganho Acumulado:</strong> <span className="text-lg font-bold text-primary">R$ {Number(investor.totalEarnings || 0).toFixed(2)}</span>
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">PERCENTUAL DO INVESTIDOR</h3>
                      <p className="text-sm">
                        <strong>Participação:</strong> <span className="text-2xl font-bold text-primary">70%</span><br />
                        <span className="text-xs text-muted-foreground">sobre o valor de cada locação</span>
                      </p>
                    </div>
                  </div>

                  {/* Cláusulas */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2">CLÁUSULAS CONTRATUAIS</h3>
                    <div className="space-y-3 text-sm text-justify">
                      <p>
                        <strong>CLÁUSULA 1ª - DO OBJETO:</strong> O presente contrato tem por objeto estabelecer parceria para locação de veículos de propriedade do INVESTIDOR PARCEIRO através da plataforma Imobilicar.
                      </p>
                      <p>
                        <strong>CLÁUSULA 2ª - DA PARTICIPAÇÃO:</strong> O INVESTIDOR PARCEIRO receberá 70% (setenta por cento) do valor de cada locação realizada com seus veículos, sendo os 30% (trinta por cento) restantes destinados à CONTRATANTE para cobrir custos operacionais, marketing e gestão da plataforma.
                      </p>
                      <p>
                        <strong>CLÁUSULA 3ª - DOS PAGAMENTOS:</strong> Os pagamentos ao INVESTIDOR PARCEIRO serão realizados mensalmente, até o 5º dia útil do mês subsequente, mediante transferência bancária para conta indicada.
                      </p>
                      <p>
                        <strong>CLÁUSULA 4ª - DA MANUTENÇÃO:</strong> O INVESTIDOR PARCEIRO é responsável pela manutenção preventiva e corretiva dos veículos, mantendo-os em perfeitas condições de uso, higiene e documentação regular.
                      </p>
                      <p>
                        <strong>CLÁUSULA 5ª - DO SEGURO:</strong> Todos os veículos deverão possuir seguro contra terceiros e cobertura completa, cujos custos serão de responsabilidade do INVESTIDOR PARCEIRO.
                      </p>
                      <p>
                        <strong>CLÁUSULA 6ª - DA GESTÃO:</strong> A CONTRATANTE é responsável por toda gestão das locações, incluindo: cadastro e verificação de clientes, cobranças, suporte ao cliente e gestão da plataforma digital.
                      </p>
                      <p>
                        <strong>CLÁUSULA 7ª - DA RESCISÃO:</strong> Qualquer das partes poderá rescindir este contrato mediante aviso prévio de 30 (trinta) dias, ficando assegurados os direitos e obrigações até a data da rescisão.
                      </p>
                      <p>
                        <strong>CLÁUSULA 8ª - DA EXCLUSIVIDADE:</strong> Durante a vigência deste contrato, os veículos cadastrados ficam em regime de exclusividade para locação através da plataforma Imobilicar.
                      </p>
                      <p>
                        <strong>CLÁUSULA 9ª - DAS RESPONSABILIDADES:</strong> A CONTRATANTE responde por danos causados aos veículos durante o período de locação quando houver comprovação de negligência na seleção de locatários.
                      </p>
                    </div>
                  </div>

                  {/* Assinaturas */}
                  <div className="border-t pt-6 mt-8">
                    <div className="grid grid-cols-2 gap-8 mt-8">
                      <div className="text-center">
                        <div className="border-t border-foreground/20 pt-2 mt-16">
                          <p className="text-sm font-semibold">CONTRATANTE</p>
                          <p className="text-xs text-muted-foreground">Imobilicar Locadora de Veículos LTDA</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="border-t border-foreground/20 pt-2 mt-16">
                          <p className="text-sm font-semibold">INVESTIDOR PARCEIRO</p>
                          <p className="text-xs text-muted-foreground">{investor.name}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-8">
                      São Paulo, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={editEventDialogOpen} onOpenChange={setEditEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>
              Atualize as informações do evento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Evento</Label>
              <Select value={editEventType} onValueChange={setEditEventType}>
                <SelectTrigger data-testid="select-edit-event-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="documentacao">Documentação</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                  <SelectItem value="inspecao">Inspeção</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título</Label>
              <Input
                value={editEventTitle}
                onChange={(e) => setEditEventTitle(e.target.value)}
                data-testid="input-edit-event-title"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={editEventDescription}
                onChange={(e) => setEditEventDescription(e.target.value)}
                data-testid="textarea-edit-event-description"
              />
            </div>
            <div>
              <Label>Severidade</Label>
              <Select value={editEventSeverity} onValueChange={setEditEventSeverity}>
                <SelectTrigger data-testid="select-edit-event-severity">
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
            <div>
              <Label>Status</Label>
              <Select value={editEventStatus} onValueChange={setEditEventStatus}>
                <SelectTrigger data-testid="select-edit-event-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEventDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditEvent} data-testid="button-save-edit-event">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={deleteEventDialogOpen} onOpenChange={setDeleteEventDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-event">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent} data-testid="button-confirm-delete-event">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Vehicle Dialog */}
      <Dialog open={addVehicleDialogOpen} onOpenChange={setAddVehicleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Veículo ao Investidor</DialogTitle>
            <DialogDescription>
              Cadastre um novo veículo para {investor?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...addVehicleForm}>
            <form onSubmit={addVehicleForm.handleSubmit((data) => {
              if (!investorId) {
                toast({
                  title: "Erro",
                  description: "ID do investidor não encontrado. Tente novamente.",
                  variant: "destructive",
                });
                return;
              }
              
              // Extrair valor FIPE numérico para salvar
              const cleanFipeValue = fipeValue
                ? fipeValue.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
                : null;
              
              // Preparar dividendo customizado se fornecido
              const customDividend = manualDividend && !matchingQuota
                ? manualDividend
                : null;
              
              addVehicleMutation.mutate({
                ...data,
                available: true,
                isInvestorVehicle: true,
                ownerId: investorId,
                investorPercentage: 70,
                fipeValue: cleanFipeValue,
                customDividend: customDividend,
              });
            })} className="space-y-4">
              {/* Seção FIPE API */}
              <div className="col-span-2 p-4 rounded-lg bg-muted border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Consulta FIPE</h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Marca FIPE</Label>
                    <Input
                      placeholder="Pesquisar marca..."
                      value={manualBrandInput}
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        setManualBrandInput(e.target.value);
                        
                        if (fipeBrands.length === 0 && searchTerm) {
                          fetchFipeBrands();
                        }
                        
                        const matchedBrand = fipeBrands.find(brand => 
                          brand.name.toLowerCase().includes(searchTerm)
                        );
                        
                        if (matchedBrand) {
                          setSelectedBrand(matchedBrand.code);
                          fetchFipeModels(matchedBrand.code);
                        } else if (!searchTerm) {
                          setSelectedBrand("");
                          setFipeModels([]);
                          setFipeYears([]);
                          setSelectedModel("");
                          setSelectedYear("");
                        }
                      }}
                      data-testid="input-manual-brand-search"
                    />
                    <Select 
                      value={selectedBrand} 
                      onValueChange={(value) => {
                        setSelectedBrand(value);
                        setManualBrandInput("");
                        fetchFipeModels(value);
                      }}
                      disabled={loadingFipe}
                    >
                      <SelectTrigger data-testid="select-fipe-brand">
                        <SelectValue placeholder={loadingFipe ? "Carregando marcas..." : "Ou selecione da lista"} />
                      </SelectTrigger>
                      <SelectContent>
                        {fipeBrands.map((brand) => (
                          <SelectItem key={brand.code} value={brand.code}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Modelo FIPE</Label>
                    <Input
                      placeholder="Pesquisar modelo..."
                      value={manualModelInput}
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        setManualModelInput(e.target.value);
                        
                        const matchedModel = fipeModels.find(model => 
                          model.name.toLowerCase().includes(searchTerm)
                        );
                        
                        if (matchedModel) {
                          setSelectedModel(matchedModel.code);
                          fetchFipeYears(selectedBrand, matchedModel.code);
                        } else if (!searchTerm) {
                          setSelectedModel("");
                          setFipeYears([]);
                          setSelectedYear("");
                        }
                      }}
                      disabled={!selectedBrand}
                      data-testid="input-manual-model-search"
                    />
                    <Select 
                      value={selectedModel} 
                      onValueChange={(value) => {
                        setSelectedModel(value);
                        setManualModelInput("");
                        fetchFipeYears(selectedBrand, value);
                      }}
                      disabled={!selectedBrand || loadingFipe}
                    >
                      <SelectTrigger data-testid="select-fipe-model">
                        <SelectValue placeholder={loadingFipe ? "Carregando modelos..." : "Ou selecione da lista"} />
                      </SelectTrigger>
                      <SelectContent>
                        {fipeModels.map((model) => (
                          <SelectItem key={model.code} value={model.code}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ano FIPE</Label>
                    <Select 
                      value={selectedYear} 
                      onValueChange={setSelectedYear}
                      disabled={!selectedModel || loadingFipe}
                    >
                      <SelectTrigger data-testid="select-fipe-year">
                        <SelectValue placeholder={loadingFipe ? "Carregando anos..." : "Selecione o ano"} />
                      </SelectTrigger>
                      <SelectContent>
                        {fipeYears.map((year) => (
                          <SelectItem key={year.code} value={year.code}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={consultarFipe}
                    disabled={!selectedBrand || !selectedModel || !selectedYear || loadingFipe}
                    className="w-full"
                    data-testid="button-consult-fipe"
                  >
                    {loadingFipe ? "Consultando..." : "Consultar FIPE"}
                  </Button>

                  {fipeValue && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Valor FIPE Consultado:</p>
                      <p className="text-lg font-bold text-primary" data-testid="fipe-value-display">{fipeValue}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Campos do Formulário Preenchidos pela FIPE */}
              <div className="grid grid-cols-2 gap-4 col-span-2">
                <FormField
                  control={addVehicleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nome do Veículo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Chevrolet Onix 2024" 
                          {...field} 
                          data-testid="input-vehicle-name"
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Chevrolet" 
                          {...field} 
                          data-testid="input-vehicle-brand"
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Onix" 
                          {...field} 
                          data-testid="input-vehicle-model"
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 2024" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 2024)}
                          value={field.value}
                          data-testid="input-vehicle-year"
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle-category">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Econômico">Econômico</SelectItem>
                          <SelectItem value="Hatch">Hatch</SelectItem>
                          <SelectItem value="Sedan">Sedan</SelectItem>
                          <SelectItem value="SUV">SUV</SelectItem>
                          <SelectItem value="Pickup">Pickup</SelectItem>
                          <SelectItem value="Van">Van</SelectItem>
                          <SelectItem value="Minivan">Minivan</SelectItem>
                          <SelectItem value="Utilitário">Utilitário</SelectItem>
                          <SelectItem value="Esportivo">Esportivo</SelectItem>
                          <SelectItem value="Luxo">Luxo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmissão</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle-transmission">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Automático">Automático</SelectItem>
                          <SelectItem value="CVT">CVT</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="fuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Combustível</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle-fuel">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Flex">Flex</SelectItem>
                          <SelectItem value="Gasolina">Gasolina</SelectItem>
                          <SelectItem value="Etanol">Etanol</SelectItem>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Elétrico">Elétrico</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assentos</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Ex: 5" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                          value={field.value}
                          data-testid="input-vehicle-seats" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="pricePerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço por Dia (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 150.00" {...field} data-testid="input-vehicle-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addVehicleForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input placeholder="https://exemplo.com/imagem.jpg" {...field} data-testid="input-vehicle-image" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Display Dividendo Imobilicar */}
              {fipeValue && category && (
                <div className="col-span-2">
                  {matchingQuota ? (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20" data-testid="dividend-display">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-primary">Dividendo Imobilicar</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Com base no valor FIPE de <span className="font-medium text-foreground">{fipeValue}</span> e categoria{" "}
                        <span className="font-medium text-foreground">{category}</span>, a Imobilicar pagará:
                      </p>
                      <div className="text-2xl font-bold text-primary" data-testid="dividend-amount">
                        R$ {Number(matchingQuota.dividendAmount).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor mensal fixo pago pela Imobilicar ao investidor
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted border border-border" data-testid="no-dividend-display">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold text-muted-foreground">Dividendo Imobilicar</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Não há cota de dividendo cadastrada para a combinação de valor FIPE <span className="font-medium">{fipeValue}</span> e categoria{" "}
                        <span className="font-medium">{category}</span>.
                      </p>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Definir Dividendo Manual (Admin)</Label>
                        <div className="flex gap-2 items-center">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            placeholder="Ex: 2000.00"
                            value={manualDividend}
                            onChange={(e) => setManualDividend(e.target.value)}
                            data-testid="input-manual-dividend"
                            className="flex-1"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Este dividendo será salvo como valor customizado para este veículo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddVehicleDialogOpen(false)}
                  data-testid="button-cancel-add-vehicle"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={addVehicleMutation.isPending}
                  data-testid="button-submit-add-vehicle"
                >
                  {addVehicleMutation.isPending ? "Salvando..." : "Adicionar Veículo"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Fotos de Avarias */}
      <Dialog open={damagePhotosDialogOpen} onOpenChange={setDamagePhotosDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Avarias do Veículo
            </DialogTitle>
            <DialogDescription>
              {selectedVehicleForDamage?.name} - {selectedVehicleForDamage?.licensePlate || "Sem placa"}
            </DialogDescription>
          </DialogHeader>

          {selectedVehicleForDamage && (
            <div className="space-y-6">
              {/* Notas de Avaria */}
              {(() => {
                const damageNotes = getDamageNotes(selectedVehicleForDamage.id);
                return damageNotes ? (
                  <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                    <h4 className="font-medium text-sm text-orange-700 dark:text-orange-300 mb-2">Descrição das Avarias</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{damageNotes}</p>
                  </div>
                ) : null;
              })()}

              {/* Galeria de Fotos */}
              {(() => {
                const damagePhotos = getDamagePhotos(selectedVehicleForDamage.id);
                return damagePhotos.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Fotos das Avarias ({damagePhotos.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {damagePhotos.map((photo, index) => (
                        <div key={photo.id} className="space-y-2">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-orange-500/50 bg-muted">
                            <img
                              src={photo.imageUrl}
                              alt={`Avaria ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(photo.imageUrl, '_blank')}
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-medium text-orange-600">Foto {index + 1}</span>
                            {photo.createdAt && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(photo.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Clique em uma foto para ampliar
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma foto de avaria registrada</p>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDamagePhotosDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
