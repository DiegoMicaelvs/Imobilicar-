import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, ChevronDown, Car, DollarSign, HandCoins, User, Camera, FileText, CreditCard, Check, ArrowLeft, ArrowRight, X, Zap, Star, Gift, Edit, Download, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/pages/crm/utils/fileUtils";
import { useRentalWizard } from "./RentalWizardContext";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";
import SignatureCanvas from "@/pages/crm/components/shared/SignatureCanvas";
import ContractStep from "@/pages/crm/components/shared/ContractStep";
import FileUploadZone from "@/pages/crm/components/shared/FileUploadZone";

export default function RentalWizard() {
  const { toast } = useToast();
  const {
    currentStep,
    setCurrentStep,
    customerData,
    setCustomerData,
    hasGuarantor,
    setHasGuarantor,
    guarantorData,
    setGuarantorData,
    selectedVehicle,
    setSelectedVehicle,
    rentalStartDate,
    setRentalStartDate,
    rentalEndDate,
    setRentalEndDate,
    agreedRentalValue,
    setAgreedRentalValue,
    selectedPlans,
    setSelectedPlans,
    checkInPhotos,
    setCheckInPhotos,
    vehicleChecklist,
    setVehicleChecklist,
    contractData,
    setContractData,
    paymentData,
    setPaymentData,
    signatureDialogOpen,
    setSignatureDialogOpen,
    customerSignature,
    setCustomerSignature,
    inspectorSignature,
    setInspectorSignature,
    currentSignatureType,
    setCurrentSignatureType,
    inspectionPdfData,
    setInspectionPdfData,
    isGeneratingPdf,
    setIsGeneratingPdf,
    processingPendingRequest,
    setProcessingPendingRequest,
    pendingRequestId,
    setPendingRequestId,
    resetWizard,
  } = useRentalWizard();

  const { vehicles, plans, templates, invalidate } = useCrmData();

  // Validation function for rental wizard steps
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Step 1: Validate customer data
        if (!customerData?.name || !customerData?.cpf || !customerData?.email || 
            !customerData?.phone || !customerData?.driverLicense || !customerData?.emergencyContact ||
            !customerData?.street || !customerData?.neighborhood || !customerData?.city || 
            !customerData?.state || !customerData?.zipCode) {
          toast({
            title: "Dados incompletos",
            description: "Preencha todos os campos obrigatórios (*) do cadastro.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 2:
        // Step 2: Validate vehicle and dates
        if (!selectedVehicle) {
          toast({
            title: "Veículo não selecionado",
            description: "Selecione um veículo para locação.",
            variant: "destructive",
          });
          return false;
        }
        if (!rentalStartDate || !rentalEndDate) {
          toast({
            title: "Período não definido",
            description: "Informe as datas de início e fim do aluguel.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 3:
        // Step 3: Validate check-in photos
        const requiredPhotos = ["frente", "fundo", "lateral_esquerda", "lateral_direita"];
        const missingPhotos = requiredPhotos.filter(photo => !checkInPhotos[photo]);
        if (missingPhotos.length > 0) {
          toast({
            title: "Fotos incompletas",
            description: `Tire as 4 fotos obrigatórias do veículo.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 4:
        // Step 4: Contract - optional validation
        return true;
      
      case 5:
        // Step 5: Validate payment data
        if (!paymentData?.method) {
          toast({
            title: "Método de pagamento não selecionado",
            description: "Selecione o método de pagamento.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const createRentalMutation = useMutation({
    mutationFn: async (data: any) => {
      if (processingPendingRequest && pendingRequestId) {
        return await apiRequest("PATCH", `/api/rentals/${pendingRequestId}/process`, data);
      }
      return await apiRequest("POST", "/api/rentals/complete", data);
    },
    onSuccess: () => {
      invalidate.rentals();
      invalidate.customers();
      invalidate.vehicles();
      toast({
        title: processingPendingRequest ? "Solicitação processada!" : "Aluguel criado!",
        description: processingPendingRequest ? "Solicitação aprovada e processada com sucesso." : "Aluguel registrado com sucesso.",
      });
      resetWizard();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar aluguel",
        description: error.message || "Ocorreu um erro ao criar o aluguel.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      {/* Stepper */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto pb-2">
        {[
          { step: 1, icon: User, label: "Cadastro" },
          { step: 2, icon: Car, label: "Veículo" },
          { step: 3, icon: Camera, label: "Check-in" },
          { step: 4, icon: FileText, label: "Contrato" },
          { step: 5, icon: CreditCard, label: "Pagamento" },
        ].map((item, index) => (
          <div key={item.step} className="flex items-center flex-1 min-w-[60px] sm:min-w-[80px]">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${
                currentStep > item.step 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : currentStep === item.step
                  ? "border-primary text-primary"
                  : "border-muted text-muted-foreground"
              }`} data-testid={`wizard-step-${item.step}`}>
                {currentStep > item.step ? (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-center hidden sm:block">{item.label}</p>
            </div>
            {index < 4 && (
              <div className={`flex-1 h-0.5 mx-1 sm:mx-2 ${
                currentStep > item.step ? "bg-primary" : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Test Data Fill Button */}
      <div className="flex justify-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const mockImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
            
            setCustomerData({
              name: "João da Silva Teste",
              cpf: "123.456.789-00",
              email: "joao.teste@email.com",
              phone: "(11) 98765-4321",
              driverLicense: "12345678900",
              emergencyContact: "Maria Silva - (11) 91234-5678",
              street: "Rua das Flores, 123",
              complement: "Apto 45",
              neighborhood: "Centro",
              city: "São Paulo",
              state: "SP",
              zipCode: "01234-567"
            });
            
            if (vehicles && vehicles.length > 0) {
              const availableVehicle = vehicles.find(v => v.available);
              if (availableVehicle) {
                setSelectedVehicle(availableVehicle);
              }
            }
            
            setCheckInPhotos({
              frente: mockImage,
              fundo: mockImage,
              lateral_direita: mockImage,
              lateral_esquerda: mockImage,
              notes: "Veículo em bom estado geral"
            });
            
            setContractData({
              fileName: "contrato-teste.pdf",
              fileUrl: mockImage
            });
            
            setPaymentData({
              method: "pix",
              amount: "150.00",
              date: new Date().toISOString().split('T')[0],
              notes: "Pagamento via PIX realizado",
              proofUrl: mockImage,
              proofFileName: "comprovante-pix.jpg"
            });
            
            setGuarantorData({
              name: "Maria da Silva Avalista",
              cpf: "987.654.321-00",
              rg: "12.345.678-9",
              email: "maria.avalista@email.com",
              phone: "(11) 99999-8888",
              street: "Avenida Paulista, 1000",
              complement: "Sala 500",
              neighborhood: "Bela Vista",
              city: "São Paulo",
              state: "SP",
              zipCode: "01310-100"
            });
            
            toast({
              title: "Dados de teste preenchidos!",
              description: "Todos os campos foram preenchidos. Navegue pelas etapas para revisar.",
            });
          }}
          data-testid="button-fill-test-data"
        >
          🧪 Preencher Dados de Teste
        </Button>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Customer Registration */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 1: Cadastro do Cliente</h3>
              <p className="text-sm text-muted-foreground">Preencha os dados pessoais do cliente</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo *</label>
                <Input
                  placeholder="Digite o nome completo"
                  value={customerData?.name || ""}
                  onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                  data-testid="input-customer-name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">CPF *</label>
                <Input
                  placeholder="000.000.000-00"
                  value={customerData?.cpf || ""}
                  onChange={(e) => setCustomerData({...customerData, cpf: e.target.value})}
                  data-testid="input-customer-cpf"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">RG</label>
                <Input
                  placeholder="00.000.000-0"
                  value={customerData?.rg || ""}
                  onChange={(e) => setCustomerData({...customerData, rg: e.target.value})}
                  data-testid="input-customer-rg"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={customerData?.email || ""}
                  onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                  data-testid="input-customer-email"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone *</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={customerData?.phone || ""}
                  onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                  data-testid="input-customer-phone"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">CNH (Carteira de Motorista) *</label>
                <Input
                  placeholder="Número da CNH"
                  value={customerData?.driverLicense || ""}
                  onChange={(e) => setCustomerData({...customerData, driverLicense: e.target.value})}
                  data-testid="input-customer-cnh"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Contato de Emergência *</label>
                <Input
                  placeholder="Nome e telefone"
                  value={customerData?.emergencyContact || ""}
                  onChange={(e) => setCustomerData({...customerData, emergencyContact: e.target.value})}
                  data-testid="input-customer-emergency"
                />
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-semibold mb-3">Endereço Completo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Rua *</label>
                  <Input
                    placeholder="Nome da rua"
                    value={customerData?.street || ""}
                    onChange={(e) => setCustomerData({...customerData, street: e.target.value})}
                    data-testid="input-customer-street"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complemento</label>
                  <Input
                    placeholder="Apto, bloco, etc."
                    value={customerData?.complement || ""}
                    onChange={(e) => setCustomerData({...customerData, complement: e.target.value})}
                    data-testid="input-customer-complement"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bairro *</label>
                  <Input
                    placeholder="Nome do bairro"
                    value={customerData?.neighborhood || ""}
                    onChange={(e) => setCustomerData({...customerData, neighborhood: e.target.value})}
                    data-testid="input-customer-neighborhood"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade *</label>
                  <Input
                    placeholder="Nome da cidade"
                    value={customerData?.city || ""}
                    onChange={(e) => setCustomerData({...customerData, city: e.target.value})}
                    data-testid="input-customer-city"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado *</label>
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    value={customerData?.state || ""}
                    onChange={(e) => setCustomerData({...customerData, state: e.target.value.toUpperCase()})}
                    data-testid="input-customer-state"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">CEP *</label>
                  <Input
                    placeholder="00000-000"
                    value={customerData?.zipCode || ""}
                    onChange={(e) => setCustomerData({...customerData, zipCode: e.target.value})}
                    data-testid="input-customer-zipcode"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Vehicle Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 2: Escolha de Veículo</h3>
              <p className="text-sm text-muted-foreground">
                {processingPendingRequest 
                  ? "Dados já preenchidos pela solicitação do cliente - você pode revisar ou prosseguir" 
                  : "Selecione o veículo para locação"}
              </p>
            </div>
            
            {processingPendingRequest && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">Solicitação do Cliente</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        O cliente já escolheu o veículo, período e planos adicionais. Você pode revisar os dados ou prosseguir direto para a etapa de check-in.
                      </p>
                      
                      {selectedVehicle && (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-primary" />
                            <span className="font-medium">Veículo:</span>
                            <span>{selectedVehicle.name} ({selectedVehicle.brand} {selectedVehicle.model})</span>
                          </div>
                          
                          {rentalStartDate && rentalEndDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-medium">Período:</span>
                              <span>
                                {format(new Date(rentalStartDate), "dd/MM/yyyy", { locale: ptBR })} até {format(new Date(rentalEndDate), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                          
                          {selectedPlans.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Zap className="h-4 w-4 text-primary mt-0.5" />
                              <span className="font-medium">Planos:</span>
                              <span>{selectedPlans.length} plano(s) selecionado(s)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles?.filter(v => v.available).map((vehicle: any) => (
                <Card 
                  key={vehicle.id}
                  className={`cursor-pointer transition-all ${
                    selectedVehicle?.id === vehicle.id 
                      ? "border-primary bg-primary/5" 
                      : "hover-elevate"
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                  data-testid={`card-select-vehicle-${vehicle.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{vehicle.name}</CardTitle>
                        <CardDescription>{vehicle.brand} {vehicle.model}</CardDescription>
                      </div>
                      {selectedVehicle?.id === vehicle.id && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Valor/dia:</span>
                        <span className="font-semibold">R$ {Number(vehicle.pricePerDay).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">{vehicle.category}</Badge>
                        <Badge variant="outline">{vehicle.year}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedVehicle && (
              <>
                {/* Rental Period */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Período de Locação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data de Início *</label>
                        <Input
                          type="date"
                          value={rentalStartDate}
                          onChange={(e) => setRentalStartDate(e.target.value)}
                          data-testid="input-rental-start-date"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data de Término *</label>
                        <Input
                          type="date"
                          value={rentalEndDate}
                          onChange={(e) => setRentalEndDate(e.target.value)}
                          data-testid="input-rental-end-date"
                        />
                      </div>
                    </div>
                    
                    {rentalStartDate && rentalEndDate && (() => {
                      const days = Math.ceil((new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) / (1000 * 60 * 60 * 24));
                      const baseValue = days * Number(selectedVehicle.pricePerDay);
                      
                      return (
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                          <p className="text-sm font-medium mb-2">Resumo do Aluguel</p>
                          <div className="flex items-baseline gap-2 mb-2">
                            <p className="text-3xl font-bold text-primary">
                              R$ {baseValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {days} diária{days !== 1 ? 's' : ''} × R$ {Number(selectedVehicle.pricePerDay).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </p>
                          
                          {/* Agreed Value Input */}
                          <div className="mt-4 space-y-2">
                            <label className="text-sm font-medium">Valor Acordado (Opcional)</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder={`Padrão: R$ ${baseValue.toFixed(2)}`}
                              value={agreedRentalValue || ""}
                              onChange={(e) => setAgreedRentalValue(parseFloat(e.target.value) || 0)}
                              data-testid="input-agreed-rental-value"
                            />
                            <p className="text-xs text-muted-foreground">
                              Deixe vazio para usar o valor padrão ou informe um valor personalizado
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
                
                {/* Rental Plans */}
                {plans && plans.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Planos Adicionais (Opcional)</CardTitle>
                      <CardDescription>Selecione planos extras para o aluguel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {plans.map((plan: any) => (
                        <div 
                          key={plan.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedPlans.includes(plan.id) 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover-elevate"
                          }`}
                          onClick={() => {
                            if (selectedPlans.includes(plan.id)) {
                              setSelectedPlans(selectedPlans.filter(p => p !== plan.id));
                            } else {
                              setSelectedPlans([...selectedPlans, plan.id]);
                            }
                          }}
                          data-testid={`card-select-plan-${plan.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{plan.name}</h4>
                                {plan.isPopular && <Badge variant="default" className="h-5"><Star className="h-3 w-3 mr-1" />Popular</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                              <p className="font-semibold text-primary">R$ {Number(plan.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}/dia</p>
                            </div>
                            {selectedPlans.includes(plan.id) && (
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Step 3: Check-in Photos and Checklist */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 3: Vistoria Completa do Veículo</h3>
              <p className="text-sm text-muted-foreground">Fotos obrigatórias e checklist detalhado de inspeção</p>
            </div>

            {/* Required Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fotos Obrigatórias do Veículo</CardTitle>
                <CardDescription>Tire as 4 fotos principais do veículo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "frente", label: "Vista Frontal" },
                    { key: "fundo", label: "Vista Traseira" },
                    { key: "lateral_esquerda", label: "Lateral Esquerda" },
                    { key: "lateral_direita", label: "Lateral Direita" },
                  ].map((photo) => (
                    <div key={photo.key} className="space-y-2">
                      <label className="text-sm font-medium">{photo.label} *</label>
                      <div className="relative">
                        {checkInPhotos[photo.key] ? (
                          <div className="space-y-2">
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-primary">
                              <img 
                                src={checkInPhotos[photo.key]} 
                                alt={photo.label}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  const input = document.getElementById(`photo-input-${photo.key}`) as HTMLInputElement;
                                  if (input) input.click();
                                }}
                                data-testid={`button-change-photo-${photo.key}`}
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                Trocar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const newPhotos = {...checkInPhotos};
                                  delete newPhotos[photo.key];
                                  setCheckInPhotos(newPhotos);
                                }}
                                data-testid={`button-remove-photo-${photo.key}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </Button>
                            </div>
                            <input
                              id={`photo-input-${photo.key}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressedImage = await compressImage(file);
                                    setCheckInPhotos({
                                      ...checkInPhotos,
                                      [photo.key]: compressedImage
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Erro ao processar foto",
                                      description: error instanceof Error ? error.message : "Erro desconhecido",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                              <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                              <p className="text-xs text-muted-foreground mb-3">Nenhuma foto anexada</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const input = document.getElementById(`photo-input-${photo.key}`) as HTMLInputElement;
                                if (input) input.click();
                              }}
                              data-testid={`button-upload-photo-${photo.key}`}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Adicionar Foto
                            </Button>
                            <input
                              id={`photo-input-${photo.key}`}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressedImage = await compressImage(file);
                                    setCheckInPhotos({
                                      ...checkInPhotos,
                                      [photo.key]: compressedImage
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Erro ao processar foto",
                                      description: error instanceof Error ? error.message : "Erro desconhecido",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist Externo - Lataria e Estrutura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Antena', 'Para-Choque Dianteiro', 'Para-Choque Traseiro', 'Capô', 'Teto',
                  'Porta Dianteira Direita', 'Porta Traseira Direita', 'Porta Dianteira Esquerda', 'Porta Traseira Esquerda',
                  'Retrovisor Direito', 'Retrovisor Esquerdo', 'Faróis Dianteiros', 'Lanternas Traseiras',
                  'Para-Brisa Dianteiro', 'Vidros Laterais', 'Vidro Traseiro', 'Pintura Geral'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <input
                      type="checkbox"
                      checked={vehicleChecklist[item]?.checked ?? true}
                      onChange={(e) => setVehicleChecklist({
                        ...vehicleChecklist,
                        [item]: { ...vehicleChecklist[item], checked: e.target.checked }
                      })}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item}</p>
                      {!vehicleChecklist[item]?.checked && (
                        <Input
                          placeholder="Observações sobre o problema..."
                          value={vehicleChecklist[item]?.notes || ""}
                          onChange={(e) => setVehicleChecklist({
                            ...vehicleChecklist,
                            [item]: { ...vehicleChecklist[item], notes: e.target.value }
                          })}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Equipamentos de Sinalização e Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Chave De Roda', 'Triângulo', 'Documento Do Veículo'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <input
                      type="checkbox"
                      checked={vehicleChecklist[item]?.checked ?? true}
                      onChange={(e) => setVehicleChecklist({
                        ...vehicleChecklist,
                        [item]: { ...vehicleChecklist[item], checked: e.target.checked }
                      })}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item}</p>
                      {!vehicleChecklist[item]?.checked && (
                        <Input
                          placeholder="Observações sobre o problema..."
                          value={vehicleChecklist[item]?.notes || ""}
                          onChange={(e) => setVehicleChecklist({
                            ...vehicleChecklist,
                            [item]: { ...vehicleChecklist[item], notes: e.target.value }
                          })}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist de Itens Elétricos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Faróis Baixo/Alto', 'Luz De Ré', 'Luz De Freio', 'Luzes De Seta', 'Luz De Placa',
                  'Limpador De Para-Brisa', 'Lavador De Para-Brisa', 'Painel De Instrumentos', 'Ar-Condicionado / Ventilação'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <input
                      type="checkbox"
                      checked={vehicleChecklist[item]?.checked ?? true}
                      onChange={(e) => setVehicleChecklist({
                        ...vehicleChecklist,
                        [item]: { ...vehicleChecklist[item], checked: e.target.checked }
                      })}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item}</p>
                      {!vehicleChecklist[item]?.checked && (
                        <Input
                          placeholder="Observações sobre o problema..."
                          value={vehicleChecklist[item]?.notes || ""}
                          onChange={(e) => setVehicleChecklist({
                            ...vehicleChecklist,
                            [item]: { ...vehicleChecklist[item], notes: e.target.value }
                          })}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist Interno - Acabamento e Conforto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Bancos (Dianteiros/Traseiros)', 'Tapetes', 'Painel', 'Alavanca De Câmbio',
                  'Vidros Elétricos', 'Travas Elétricas', 'Espelhos Internos'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <input
                      type="checkbox"
                      checked={vehicleChecklist[item]?.checked ?? true}
                      onChange={(e) => setVehicleChecklist({
                        ...vehicleChecklist,
                        [item]: { ...vehicleChecklist[item], checked: e.target.checked }
                      })}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item}</p>
                      {!vehicleChecklist[item]?.checked && (
                        <Input
                          placeholder="Observações sobre o problema..."
                          value={vehicleChecklist[item]?.notes || ""}
                          onChange={(e) => setVehicleChecklist({
                            ...vehicleChecklist,
                            [item]: { ...vehicleChecklist[item], notes: e.target.value }
                          })}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checklist Mecânica Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Nível De Óleo', 'Nível Da Água (Radiador)', 'Nível Do Fluido De Freio', 'Nível Do Fluido De Direção',
                  'Vazamentos Visíveis', 'Funcionamento Do Motor', 'Funcionamento Dos Freios',
                  'Funcionamento Da Direção', 'Funcionamento Da Embreagem'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 rounded-lg hover-elevate">
                    <input
                      type="checkbox"
                      checked={vehicleChecklist[item]?.checked ?? true}
                      onChange={(e) => setVehicleChecklist({
                        ...vehicleChecklist,
                        [item]: { ...vehicleChecklist[item], checked: e.target.checked }
                      })}
                      className="mt-1 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item}</p>
                      {!vehicleChecklist[item]?.checked && (
                        <Input
                          placeholder="Observações sobre o problema..."
                          value={vehicleChecklist[item]?.notes || ""}
                          onChange={(e) => setVehicleChecklist({
                            ...vehicleChecklist,
                            [item]: { ...vehicleChecklist[item], notes: e.target.value }
                          })}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Inspection Summary */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-primary">Resumo da Inspeção</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Object.keys(vehicleChecklist).filter(k => vehicleChecklist[k]?.checked).length} itens verificados (OK) de {45} totais.
                      {Object.keys(vehicleChecklist).filter(k => !vehicleChecklist[k]?.checked && vehicleChecklist[k]?.notes).length > 0 && (
                        <span className="block mt-1 text-destructive font-medium">
                          ⚠️ {Object.keys(vehicleChecklist).filter(k => !vehicleChecklist[k]?.checked && vehicleChecklist[k]?.notes).length} item(ns) com problema identificado
                        </span>
                      )}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setSignatureDialogOpen(true);
                      }}
                      data-testid="button-download-inspection-pdf"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Vistoria em PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Step 4: Contract */}
        {currentStep === 4 && (
          <ContractStep 
            templates={templates || []}
            customerData={customerData}
            selectedVehicle={selectedVehicle}
            rentalStartDate={rentalStartDate}
            rentalEndDate={rentalEndDate}
            agreedRentalValue={agreedRentalValue}
            guarantorData={guarantorData}
            contractData={contractData}
            setContractData={setContractData}
          />
        )}
        
        {/* Step 5: Payment */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 5: Pagamento</h3>
              <p className="text-sm text-muted-foreground">Registre a forma de pagamento e anexe o comprovante</p>
            </div>
            
            {/* Agreed Value Summary */}
            {agreedRentalValue > 0 && selectedVehicle && rentalStartDate && rentalEndDate && (() => {
              const days = Math.ceil((new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) / (1000 * 60 * 60 * 24));
              
              // Sync payment amount with agreed rental value
              if (paymentData?.amount !== agreedRentalValue.toFixed(2)) {
                setTimeout(() => {
                  setPaymentData({...paymentData, amount: agreedRentalValue.toFixed(2)});
                }, 0);
              }
              
              return (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium mb-2">Valor Acordado na Locação</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-3xl font-bold text-primary">
                      R$ {agreedRentalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {days} diária{days !== 1 ? 's' : ''} × R$ {Number(selectedVehicle.pricePerDay).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Período: {new Date(rentalStartDate).toLocaleDateString('pt-BR')} até {new Date(rentalEndDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              );
            })()}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento *</label>
                <Select
                  value={paymentData?.method || ""}
                  onValueChange={(value) => setPaymentData({...paymentData, method: value})}
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Selecione o método de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data do Pagamento</label>
                <Input
                  type="date"
                  value={paymentData?.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                  data-testid="input-payment-date"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Input
                  placeholder="Notas sobre o pagamento..."
                  value={paymentData?.notes || ""}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  data-testid="input-payment-notes"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Comprovante (Opcional)</label>
                <FileUploadZone
                  currentFile={paymentData?.proofFileName ? {
                    name: paymentData.proofFileName,
                    url: paymentData.proofUrl
                  } : null}
                  onFileChange={(fileData) => {
                    if (fileData) {
                      setPaymentData({
                        ...paymentData,
                        proofUrl: fileData.url,
                        proofFileName: fileData.name
                      });
                    } else {
                      const newPaymentData = {...paymentData};
                      delete newPaymentData.proofUrl;
                      delete newPaymentData.proofFileName;
                      setPaymentData(newPaymentData);
                    }
                  }}
                  accept="image/*,.pdf"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          data-testid="button-wizard-prev"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        {currentStep < 5 ? (
          <Button
            onClick={() => {
              if (validateStep(currentStep)) {
                setCurrentStep(prev => Math.min(5, prev + 1));
              }
            }}
            data-testid="button-wizard-next"
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (validateStep(5)) {
                createRentalMutation.mutate({
                  customerData,
                  vehicleId: selectedVehicle?.id,
                  checkInPhotos,
                  contractData,
                  paymentData,
                  startDate: new Date(rentalStartDate).toISOString(),
                  endDate: new Date(rentalEndDate).toISOString(),
                  selectedPlanIds: selectedPlans,
                });
              }
            }}
            disabled={createRentalMutation.isPending}
            data-testid="button-wizard-finish"
          >
            {createRentalMutation.isPending ? "Salvando..." : "Finalizar"}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinaturas Digitais</DialogTitle>
            <DialogDescription>
              Colete as assinaturas do cliente e do vistoriador antes de gerar o PDF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Signature */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assinatura do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                {customerSignature ? (
                  <div className="space-y-3">
                    <img src={customerSignature} alt="Assinatura do Cliente" className="border rounded p-2 w-full h-40 object-contain bg-white" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCustomerSignature("")}
                      className="w-full"
                    >
                      Limpar e Refazer
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentSignatureType("customer");
                      const canvas = document.getElementById('signature-canvas-customer') as HTMLCanvasElement;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                      }
                    }}
                    className="w-full"
                    data-testid="button-sign-customer"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Clicar para Assinar
                  </Button>
                )}
                
                {!customerSignature && currentSignatureType === "customer" && (
                  <SignatureCanvas
                    onSave={(signature) => {
                      setCustomerSignature(signature);
                    }}
                    canvasId="signature-canvas-customer"
                  />
                )}
              </CardContent>
            </Card>

            {/* Inspector Signature */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assinatura do Vistoriador</CardTitle>
              </CardHeader>
              <CardContent>
                {inspectorSignature ? (
                  <div className="space-y-3">
                    <img src={inspectorSignature} alt="Assinatura do Vistoriador" className="border rounded p-2 w-full h-40 object-contain bg-white" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectorSignature("")}
                      className="w-full"
                    >
                      Limpar e Refazer
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentSignatureType("inspector");
                      const canvas = document.getElementById('signature-canvas-inspector') as HTMLCanvasElement;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                      }
                    }}
                    className="w-full"
                    data-testid="button-sign-inspector"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Clicar para Assinar
                  </Button>
                )}
                
                {!inspectorSignature && currentSignatureType === "inspector" && (
                  <SignatureCanvas
                    onSave={(signature) => {
                      setInspectorSignature(signature);
                    }}
                    canvasId="signature-canvas-inspector"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignatureDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!customerSignature || !inspectorSignature) {
                  toast({
                    title: "Assinaturas incompletas",
                    description: "Por favor, colete ambas as assinaturas antes de continuar.",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  setIsGeneratingPdf(true);
                  
                  const response = await fetch('/api/generate-inspection-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customerData,
                      selectedVehicle,
                      checkInPhotos,
                      vehicleChecklist,
                      customerSignature,
                      inspectorSignature,
                    }),
                  });
                  
                  if (!response.ok) throw new Error('Erro ao gerar PDF');
                  
                  const blob = await response.blob();
                  
                  // Convert blob to base64
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64data = reader.result as string;
                    const fileName = `vistoria-${selectedVehicle?.plate || 'veiculo'}-${new Date().toISOString().split('T')[0]}.pdf`;
                    
                    setInspectionPdfData({
                      fileName,
                      fileUrl: base64data
                    });
                  };
                  reader.readAsDataURL(blob);
                  
                  // Download the file
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `vistoria-${selectedVehicle?.plate || 'veiculo'}-${new Date().toISOString().split('T')[0]}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  
                  setSignatureDialogOpen(false);
                  toast({
                    title: "PDF gerado e salvo!",
                    description: "Relatório de vistoria com assinaturas baixado e salvo nos dados do aluguel.",
                  });
                } catch (error) {
                  toast({
                    title: "Erro ao gerar PDF",
                    description: error instanceof Error ? error.message : "Erro desconhecido",
                    variant: "destructive",
                  });
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              disabled={!customerSignature || !inspectorSignature || isGeneratingPdf}
              data-testid="button-generate-signed-pdf"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar PDF com Assinaturas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
