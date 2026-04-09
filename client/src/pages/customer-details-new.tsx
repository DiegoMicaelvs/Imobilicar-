import { useState, useEffect, useRef } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Save, X, Plus, AlertTriangle, Wrench, Car, FileText, Printer, Trash2 } from "lucide-react";
import { type Customer, type Rental, type Vehicle, type CustomerEvent, type Financing } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDetails() {
  const [, params] = useRoute("/admin/cliente/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const customerId = params?.id;

  // Editing states
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingDriverType, setIsEditingDriverType] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tags, setTags] = useState("");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [status, setStatus] = useState("");
  const [driverType, setDriverType] = useState("");

  // Personal info fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  // Address fields
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
  const [eventVehicleId, setEventVehicleId] = useState("");

  // Contract
  const [selectedContractRentalId, setSelectedContractRentalId] = useState<string>("");

  // Event editing and deletion
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [editEventType, setEditEventType] = useState("");
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventDescription, setEditEventDescription] = useState("");
  const [editEventSeverity, setEditEventSeverity] = useState("baixa");
  const [editEventStatus, setEditEventStatus] = useState("aberto");

  // New rental dialog
  const [newRentalDialogOpen, setNewRentalDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState("");

  // Edit rental dialog
  const [editRentalDialogOpen, setEditRentalDialogOpen] = useState(false);
  const [editingRentalId, setEditingRentalId] = useState<string | null>(null);
  const [editRentalStartDate, setEditRentalStartDate] = useState("");
  const [editRentalEndDate, setEditRentalEndDate] = useState("");
  const [editRentalStatus, setEditRentalStatus] = useState("");

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

  const { data: currentRental } = useQuery<Rental | null>({
    queryKey: ["/api/customers", customerId, "/current-rental"],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}/current-rental`);
      if (!response.ok) throw new Error("Failed to fetch current rental");
      return response.json();
    },
    enabled: !!customerId,
  });

  const { data: avgDuration } = useQuery<{ averageDays: number }>({
    queryKey: ["/api/customers", customerId, "/average-duration"],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}/average-duration`);
      if (!response.ok) throw new Error("Failed to fetch average duration");
      return response.json();
    },
    enabled: !!customerId,
  });

  const { data: events } = useQuery<CustomerEvent[]>({
    queryKey: ["/api/customers", customerId, "/events"],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}/events`);
      if (!response.ok) throw new Error("Failed to fetch events");
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

  // Armazena o título original do documento uma única vez
  const originalTitleRef = useRef<string>(document.title);

  // Atualiza o título do documento para o nome do arquivo PDF quando um contrato é selecionado
  useEffect(() => {
    if (selectedContractRentalId && selectedContractRentalId !== "__NONE__") {
      const currentDate = format(new Date(), "dd-MM-yyyy");
      document.title = `Contrato de locação - ${currentDate}`;
    } else {
      document.title = originalTitleRef.current;
    }
    
    return () => {
      document.title = originalTitleRef.current;
    };
  }, [selectedContractRentalId]);

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

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/customer-events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "/events"] });
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso",
      });
      setEventDialogOpen(false);
      setEventType("");
      setEventTitle("");
      setEventDescription("");
      setEventSeverity("baixa");
      setEventVehicleId("");
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
      return await apiRequest("PATCH", `/api/customer-events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "/events"] });
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
      return await apiRequest("DELETE", `/api/customer-events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "/events"] });
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

  const handleSavePersonalInfo = () => {
    // Validação de campos obrigatórios
    if (!name.trim() || !email.trim() || !phone.trim() || !cpf.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    updateCustomerMutation.mutate(
      { name, email, phone, cpf },
      {
        onSuccess: () => {
          setIsEditingPersonalInfo(false);
        },
      }
    );
  };

  const handleSaveAddress = () => {
    updateCustomerMutation.mutate({ street, number, complement, neighborhood, city, state, zipCode });
    setIsEditingAddress(false);
  };

  const handleSaveDriverType = () => {
    updateCustomerMutation.mutate({ driverType });
    setIsEditingDriverType(false);
  };

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

  const handleCreateEvent = () => {
    createEventMutation.mutate({
      customerId,
      type: eventType,
      title: eventTitle,
      description: eventDescription,
      severity: eventSeverity,
      status: "aberto",
      vehicleId: eventVehicleId && eventVehicleId !== "__NONE__" ? eventVehicleId : undefined,
    });
  };

  const handleEditEvent = (event: CustomerEvent) => {
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

  // Calculate rental total price
  const calculateRentalPrice = () => {
    if (!selectedVehicleId || !rentalStartDate || !rentalEndDate) return "0.00";
    
    const vehicle = vehicles?.find(v => v.id === selectedVehicleId);
    if (!vehicle) return "0.00";
    
    const start = new Date(rentalStartDate);
    const end = new Date(rentalEndDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return "0.00";
    
    const total = days * Number(vehicle.pricePerDay);
    return total.toFixed(2);
  };

  const createRentalMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/rentals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Sucesso",
        description: "Aluguel criado com sucesso",
      });
      setNewRentalDialogOpen(false);
      setSelectedVehicleId("");
      setRentalStartDate("");
      setRentalEndDate("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar aluguel",
        variant: "destructive",
      });
    },
  });

  const handleCreateRental = () => {
    if (!customer || !selectedVehicleId || !rentalStartDate || !rentalEndDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const totalPrice = calculateRentalPrice();
    
    createRentalMutation.mutate({
      vehicleId: selectedVehicleId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerCpf: customer.cpf,
      startDate: new Date(rentalStartDate),
      endDate: new Date(rentalEndDate),
      totalPrice,
      isNegativado: customer.isNegativado || false,
      status: "approved",
    });
  };

  const updateRentalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/rentals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      toast({
        title: "Sucesso",
        description: "Aluguel atualizado com sucesso",
      });
      setEditRentalDialogOpen(false);
      setEditingRentalId(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar aluguel",
        variant: "destructive",
      });
    },
  });

  const handleEditRental = (rental: Rental) => {
    setEditingRentalId(rental.id);
    setEditRentalStartDate(format(new Date(rental.startDate), "yyyy-MM-dd"));
    setEditRentalEndDate(format(new Date(rental.endDate), "yyyy-MM-dd"));
    setEditRentalStatus(rental.status);
    setEditRentalDialogOpen(true);
  };

  const handleSaveEditRental = () => {
    if (!editingRentalId || !editRentalStartDate || !editRentalEndDate || !editRentalStatus) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const rental = rentals?.find(r => r.id === editingRentalId);
    if (!rental) return;

    const start = new Date(editRentalStartDate);
    const end = new Date(editRentalEndDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const vehicle = vehicles?.find(v => v.id === rental.vehicleId);
    const totalPrice = vehicle ? (days * Number(vehicle.pricePerDay)).toFixed(2) : rental.totalPrice;

    updateRentalMutation.mutate({
      id: editingRentalId,
      data: {
        startDate: start,
        endDate: end,
        status: editRentalStatus,
        totalPrice,
      },
    });
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

  const currentVehicle = currentRental && vehicles?.find(v => v.id === currentRental.vehicleId);

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
              <h1 className="text-2xl font-bold">Perfil do Cliente</h1>
              <p className="text-primary-foreground/80">Gestão Completa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="contract">Contrato</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Dados Pessoais</CardTitle>
                  {!isEditingPersonalInfo && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setName(customer.name);
                        setEmail(customer.email);
                        setPhone(customer.phone);
                        setCpf(customer.cpf);
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
                    </>
                  )}
                  <div>
                    <Label className="text-muted-foreground text-xs mb-2">Tipo de Motorista</Label>
                    {isEditingDriverType ? (
                      <div className="flex gap-2">
                        <Select value={driverType} onValueChange={setDriverType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="principal">Principal</SelectItem>
                            <SelectItem value="dependente">Dependente</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" onClick={handleSaveDriverType}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setIsEditingDriverType(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge>{customer.driverType === "principal" ? "Motorista Principal" : "Motorista Dependente"}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setDriverType(customer.driverType || "principal");
                            setIsEditingDriverType(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
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

              {/* Endereço */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Endereço</CardTitle>
                  {!isEditingAddress && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setStreet(customer.street || "");
                        setNumber(customer.number || "");
                        setComplement(customer.complement || "");
                        setNeighborhood(customer.neighborhood || "");
                        setCity(customer.city || "");
                        setState(customer.state || "");
                        setZipCode(customer.zipCode || "");
                        setIsEditingAddress(true);
                      }}
                      data-testid="button-edit-address"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditingAddress ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Rua"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="col-span-2"
                        />
                        <Input
                          placeholder="Nº"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                        />
                      </div>
                      <Input
                        placeholder="Complemento"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                      />
                      <Input
                        placeholder="Bairro"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Cidade"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                        <Input
                          placeholder="UF"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          maxLength={2}
                        />
                      </div>
                      <Input
                        placeholder="CEP"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveAddress} data-testid="button-save-address">
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingAddress(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {customer.street ? (
                        <>
                          <p>{customer.street}, {customer.number}</p>
                          {customer.complement && <p>{customer.complement}</p>}
                          <p>{customer.neighborhood}</p>
                          <p>{customer.city} - {customer.state}</p>
                          <p>CEP: {customer.zipCode}</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Endereço não cadastrado</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notas */}
              <div className="space-y-6">
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
                          placeholder="Notas sobre o cliente"
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
                          <span className="text-muted-foreground">Nenhuma nota</span>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Gasto</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">R$ {Number(customer.totalSpent).toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total de Aluguéis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{customer.totalRentals}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tempo Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{avgDuration?.averageDays || 0} dias</p>
                  <p className="text-xs text-muted-foreground mt-1">Por locação</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cliente desde</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{customer.createdAt && format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                </CardContent>
              </Card>
            </div>

            {currentVehicle && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Carro Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <img src={currentVehicle.imageUrl} alt={currentVehicle.name} className="w-32 h-20 object-cover rounded" />
                    <div>
                      <h3 className="font-semibold text-lg">{currentVehicle.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentVehicle.brand} {currentVehicle.model} - {currentVehicle.year}</p>
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">Período:</span> {currentRental && format(new Date(currentRental.startDate), "dd/MM/yyyy", { locale: ptBR })} - {currentRental && format(new Date(currentRental.endDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Eventos e Ocorrências</CardTitle>
                <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Evento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Novo Evento</DialogTitle>
                      <DialogDescription>
                        Registre sinistros, assistência 24h, manutenções e outros eventos relacionados ao cliente
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tipo de Evento</Label>
                        <Select value={eventType} onValueChange={setEventType}>
                          <SelectTrigger>
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
                        <Label>Veículo (Opcional)</Label>
                        <Select value={eventVehicleId} onValueChange={setEventVehicleId}>
                          <SelectTrigger data-testid="select-event-vehicle">
                            <SelectValue placeholder="Selecione um veículo ativo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__NONE__">Nenhum (sem veículo)</SelectItem>
                            {vehicles?.filter(v => v.available).map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.name} - {vehicle.brand} {vehicle.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="Título do evento"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          placeholder="Descreva o evento"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Gravidade</Label>
                        <Select value={eventSeverity} onValueChange={setEventSeverity}>
                          <SelectTrigger>
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
                    events.map((event) => {
                      const eventVehicle = event.vehicleId ? vehicles?.find(v => v.id === event.vehicleId) : null;
                      return (<div key={event.id} className="p-4 rounded-lg border" data-testid={`event-${event.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {event.type === "sinistro" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                              {event.type === "assistencia_24h" && <Wrench className="h-4 w-4 text-primary" />}
                              <h4 className="font-semibold">{event.title}</h4>
                              <Badge variant={event.severity === "critica" ? "destructive" : event.severity === "alta" ? "destructive" : "secondary"}>
                                {event.severity}
                              </Badge>
                              <Badge variant="outline">
                                {event.type.replace("_", " ")}
                              </Badge>
                              {eventVehicle && (
                                <Badge variant="outline" className="gap-1">
                                  <Car className="h-3 w-3" />
                                  {eventVehicle.name}
                                </Badge>
                              )}
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
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum evento registrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Histórico de Aluguéis</CardTitle>
                <Dialog open={newRentalDialogOpen} onOpenChange={setNewRentalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-rental">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Novo Aluguel
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Aluguel</DialogTitle>
                      <DialogDescription>
                        Crie um novo aluguel para {customer?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Veículo</Label>
                        <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                          <SelectTrigger data-testid="select-rental-vehicle">
                            <SelectValue placeholder="Selecione um veículo disponível" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles?.filter(v => v.available).map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.name} - R$ {Number(vehicle.pricePerDay).toFixed(2)}/dia
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          value={rentalStartDate}
                          onChange={(e) => setRentalStartDate(e.target.value)}
                          data-testid="input-rental-start-date"
                        />
                      </div>
                      <div>
                        <Label>Data de Término</Label>
                        <Input
                          type="date"
                          value={rentalEndDate}
                          onChange={(e) => setRentalEndDate(e.target.value)}
                          data-testid="input-rental-end-date"
                        />
                      </div>
                      {selectedVehicleId && rentalStartDate && rentalEndDate && (
                        <div className="p-4 bg-muted rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Valor Total:</span>
                            <span className="text-lg font-bold text-primary">R$ {calculateRentalPrice()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.ceil((new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) / (1000 * 60 * 60 * 24))} dia(s)
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setNewRentalDialogOpen(false)}
                        data-testid="button-cancel-rental"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateRental}
                        disabled={createRentalMutation.isPending}
                        data-testid="button-create-rental"
                      >
                        {createRentalMutation.isPending ? "Criando..." : "Criar Aluguel"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                                  <Badge 
                                    className="ml-1" 
                                    variant={
                                      rental.status === "completed" ? "default" : 
                                      rental.status === "pending" ? "secondary" : 
                                      rental.status === "approved" ? "default" :
                                      rental.status === "active" ? "default" :
                                      "destructive"
                                    }
                                  >
                                    {rental.status === "pending" ? "Pendente" : 
                                     rental.status === "approved" ? "Aprovado" :
                                     rental.status === "active" ? "Ativo" :
                                     rental.status === "completed" ? "Concluído" : 
                                     "Cancelado"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditRental(rental)}
                                data-testid={`button-edit-rental-${rental.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
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
          </TabsContent>

          <TabsContent value="plans" className="space-y-6 mt-6">
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
                                  <span className="ml-1">{format(new Date(financing.startDate), "dd/MM/yyyy", { locale: ptBR })}</span>
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
          </TabsContent>

          <TabsContent value="contract" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contrato de Locação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Label className="mb-2">Selecione o Aluguel para Gerar o Contrato</Label>
                  <Select value={selectedContractRentalId} onValueChange={setSelectedContractRentalId}>
                    <SelectTrigger data-testid="select-contract-rental">
                      <SelectValue placeholder="Selecione um aluguel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">Nenhum (limpar seleção)</SelectItem>
                      {rentals?.filter(r => r.status === "approved" || r.status === "completed").map((rental) => {
                        const vehicle = vehicles?.find(v => v.id === rental.vehicleId);
                        return (
                          <SelectItem key={rental.id} value={rental.id}>
                            {vehicle?.name} - {format(new Date(rental.startDate), "dd/MM/yyyy", { locale: ptBR })} a {format(new Date(rental.endDate), "dd/MM/yyyy", { locale: ptBR })}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedContractRentalId && selectedContractRentalId !== "__NONE__" && (() => {
                  const selectedRental = rentals?.find(r => r.id === selectedContractRentalId);
                  const contractVehicle = selectedRental && vehicles?.find(v => v.id === selectedRental.vehicleId);
                  
                  if (!selectedRental || !contractVehicle) return null;

                  const handleDownloadPdf = async () => {
                    try {
                      const response = await fetch(`/api/contracts/${selectedContractRentalId}/pdf`);
                      if (!response.ok) throw new Error('Failed to generate PDF');
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Contrato de locação - ${format(new Date(), "dd-MM-yyyy")}.pdf`;
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
                        description: "Erro ao gerar PDF do contrato",
                        variant: "destructive",
                      });
                    }
                  };

                  const handleDownloadWord = async () => {
                    try {
                      const response = await fetch(`/api/contracts/${selectedContractRentalId}/docx`);
                      if (!response.ok) throw new Error('Failed to generate Word document');
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Contrato de locação - ${format(new Date(), "dd-MM-yyyy")}.docx`;
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
                        description: "Erro ao gerar Word do contrato",
                        variant: "destructive",
                      });
                    }
                  };

                  return (
                    <div>
                      <div className="flex justify-end gap-2 mb-4">
                        <Button
                          variant="outline"
                          onClick={handleDownloadPdf}
                          data-testid="button-download-contract-pdf"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Baixar PDF
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDownloadWord}
                          data-testid="button-download-contract-word"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Baixar Word
                        </Button>
                      </div>

                      <div id="contract-content" className="border rounded-lg p-8 bg-card space-y-6">
                        {/* Cabeçalho */}
                        <div className="text-center border-b pb-4">
                          <h2 className="text-2xl font-bold">CONTRATO DE LOCAÇÃO DE VEÍCULO</h2>
                          <p className="text-sm text-muted-foreground mt-2">Imobilicar - Locadora de Veículos</p>
                        </div>

                        {/* Partes do Contrato */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-2">LOCADOR</h3>
                            <p className="text-sm">
                              <strong>Razão Social:</strong> Imobilicar Locadora de Veículos LTDA<br />
                              <strong>CNPJ:</strong> 12.345.678/0001-90<br />
                              <strong>Endereço:</strong> Rua das Locadoras, 123 - São Paulo - SP
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-lg mb-2">LOCATÁRIO</h3>
                            <p className="text-sm">
                              <strong>Nome:</strong> {customer.name}<br />
                              <strong>CPF:</strong> {customer.cpf}<br />
                              <strong>Email:</strong> {customer.email}<br />
                              <strong>Telefone:</strong> {customer.phone}<br />
                              {customer.street && (
                                <>
                                  <strong>Endereço:</strong> {customer.street}, {customer.number}
                                  {customer.complement && `, ${customer.complement}`} - {customer.neighborhood}<br />
                                  <strong>Cidade/UF:</strong> {customer.city} - {customer.state}<br />
                                  <strong>CEP:</strong> {customer.zipCode}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Dados do Veículo */}
                        <div>
                          <h3 className="font-semibold text-lg mb-2">OBJETO DO CONTRATO</h3>
                          <div className="bg-muted/50 p-4 rounded-md">
                            <p className="text-sm">
                              <strong>Veículo:</strong> {contractVehicle.name}<br />
                              <strong>Marca/Modelo:</strong> {contractVehicle.brand} {contractVehicle.model}<br />
                              <strong>Ano:</strong> {contractVehicle.year}<br />
                              <strong>Categoria:</strong> {contractVehicle.category}<br />
                              <strong>Transmissão:</strong> {contractVehicle.transmission}<br />
                              <strong>Combustível:</strong> {contractVehicle.fuel}<br />
                              <strong>Lugares:</strong> {contractVehicle.seats} pessoas
                            </p>
                          </div>
                        </div>

                        {/* Período e Valores */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-2">PERÍODO DE LOCAÇÃO</h3>
                            <p className="text-sm">
                              <strong>Data de Início:</strong> {format(new Date(selectedRental.startDate), "dd/MM/yyyy", { locale: ptBR })}<br />
                              <strong>Data de Término:</strong> {format(new Date(selectedRental.endDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-2">VALORES</h3>
                            <p className="text-sm">
                              <strong>Diária:</strong> R$ {Number(contractVehicle.pricePerDay).toFixed(2)}<br />
                              <strong>Valor Total:</strong> <span className="text-lg font-bold text-primary">R$ {Number(selectedRental.totalPrice).toFixed(2)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Cláusulas */}
                        <div>
                          <h3 className="font-semibold text-lg mb-2">CLÁUSULAS CONTRATUAIS</h3>
                          <div className="space-y-3 text-sm text-justify">
                            <p>
                              <strong>CLÁUSULA 1ª - DO OBJETO:</strong> O presente contrato tem por objeto a locação do veículo acima descrito, em perfeitas condições de uso, conservação e funcionamento.
                            </p>
                            <p>
                              <strong>CLÁUSULA 2ª - DO PRAZO:</strong> O prazo de locação será conforme especificado acima, podendo ser prorrogado mediante acordo entre as partes.
                            </p>
                            <p>
                              <strong>CLÁUSULA 3ª - DO PAGAMENTO:</strong> O LOCATÁRIO se compromete a efetuar o pagamento do valor total da locação no ato da retirada do veículo.
                            </p>
                            <p>
                              <strong>CLÁUSULA 4ª - DAS RESPONSABILIDADES:</strong> O LOCATÁRIO assume total responsabilidade pelo veículo durante o período de locação, incluindo multas, danos e furtos.
                            </p>
                            <p>
                              <strong>CLÁUSULA 5ª - DA DEVOLUÇÃO:</strong> O veículo deverá ser devolvido nas mesmas condições em que foi retirado, com o tanque de combustível no mesmo nível.
                            </p>
                            <p>
                              <strong>CLÁUSULA 6ª - DA QUILOMETRAGEM:</strong> A locação inclui quilometragem livre dentro do território nacional.
                            </p>
                          </div>
                        </div>

                        {/* Assinaturas */}
                        <div className="border-t pt-6 mt-8">
                          <div className="grid grid-cols-2 gap-8 mt-8">
                            <div className="text-center">
                              <div className="border-t border-foreground/20 pt-2 mt-16">
                                <p className="text-sm font-semibold">LOCADOR</p>
                                <p className="text-xs text-muted-foreground">Imobilicar Locadora</p>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="border-t border-foreground/20 pt-2 mt-16">
                                <p className="text-sm font-semibold">LOCATÁRIO</p>
                                <p className="text-xs text-muted-foreground">{customer.name}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-center text-xs text-muted-foreground mt-6">
                            São Paulo, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {(!selectedContractRentalId || selectedContractRentalId === "__NONE__") && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Selecione um aluguel para gerar o contrato</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Edição de Evento */}
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
                  value={editEventTitle}
                  onChange={(e) => setEditEventTitle(e.target.value)}
                  placeholder="Título do evento"
                  data-testid="input-edit-event-title"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editEventDescription}
                  onChange={(e) => setEditEventDescription(e.target.value)}
                  placeholder="Descreva o evento"
                  rows={3}
                  data-testid="textarea-edit-event-description"
                />
              </div>
              <div>
                <Label>Gravidade</Label>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditEventDialogOpen(false)}
                data-testid="button-cancel-edit-event"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditEvent}
                disabled={updateEventMutation.isPending}
                data-testid="button-save-edit-event"
              >
                {updateEventMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog de Confirmação de Exclusão */}
        <AlertDialog open={deleteEventDialogOpen} onOpenChange={setDeleteEventDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O evento será permanentemente excluído do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-event">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteEvent}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-event"
              >
                {deleteEventMutation.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Edição de Aluguel */}
        <Dialog open={editRentalDialogOpen} onOpenChange={setEditRentalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Aluguel</DialogTitle>
              <DialogDescription>
                Atualize as informações do aluguel
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={editRentalStartDate}
                  onChange={(e) => setEditRentalStartDate(e.target.value)}
                  data-testid="input-edit-rental-start-date"
                />
              </div>
              <div>
                <Label>Data de Término</Label>
                <Input
                  type="date"
                  value={editRentalEndDate}
                  onChange={(e) => setEditRentalEndDate(e.target.value)}
                  data-testid="input-edit-rental-end-date"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editRentalStatus} onValueChange={setEditRentalStatus}>
                  <SelectTrigger data-testid="select-edit-rental-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editRentalStartDate && editRentalEndDate && editingRentalId && (() => {
                const rental = rentals?.find(r => r.id === editingRentalId);
                const vehicle = rental && vehicles?.find(v => v.id === rental.vehicleId);
                if (!vehicle) return null;
                
                const start = new Date(editRentalStartDate);
                const end = new Date(editRentalEndDate);
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const total = days > 0 ? (days * Number(vehicle.pricePerDay)).toFixed(2) : "0.00";
                
                return (
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Novo Valor Total:</span>
                      <span className="text-lg font-bold text-primary">R$ {total}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {days} dia(s) × R$ {Number(vehicle.pricePerDay).toFixed(2)}
                    </p>
                  </div>
                );
              })()}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditRentalDialogOpen(false)}
                data-testid="button-cancel-edit-rental"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditRental}
                disabled={updateRentalMutation.isPending}
                data-testid="button-save-edit-rental"
              >
                {updateRentalMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
