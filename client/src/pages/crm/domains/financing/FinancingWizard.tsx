import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Car, DollarSign, User, Camera, FileText, CreditCard, Check, ArrowLeft, ArrowRight,
  Calendar, ClipboardList, X, Download, AlertCircle, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { processFileUpload, compressImage } from "@/pages/crm/utils/fileUtils";
import { formatCPF, formatPhone, formatCEP } from "@/pages/crm/utils/formatters";
import { fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipePrice } from "@/pages/crm/utils/fipeApi";
import PhotoUploadZone from "@/pages/crm/components/shared/PhotoUploadZone";
import FileUploadZone from "@/pages/crm/components/shared/FileUploadZone";
import ChecklistRenderer from "@/pages/crm/components/shared/ChecklistRenderer";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";
import { useFinancingWizard } from "./FinancingWizardContext";
import { uploadVideoFile } from "@/pages/crm/utils/videoUtils";
import placeholderLogo from "@assets/logo_imobile_1765389205488.png";

export default function FinancingWizard() {
  const { toast } = useToast();
  const { vehicles, financings, isLoading, invalidate } = useCrmData();
  const wizard = useFinancingWizard();

  // Destructure wizard state
  const {
    currentStep, setCurrentStep,
    customerData, setCustomerData,
    guarantorData, setGuarantorData,
    selectedVehicle, setSelectedVehicle,
    vehicleValue, setVehicleValue,
    downPaymentType, setDownPaymentType,
    downPaymentInstallments, setDownPaymentInstallments,
    selectedRateType, setSelectedRateType,
    rateSettings,
    simulationValidUntil, setSimulationValidUntil,
    dueDateDay, setDueDateDay,
    entryPercent, setEntryPercent,
    entryValue, setEntryValue,
    financingCalculation, setFinancingCalculation,
    financingDocuments, setFinancingDocuments,
    checkInPhotos, setCheckInPhotos,
    vehicleChecklist, setVehicleChecklist,
    financingApprovalStatus, setFinancingApprovalStatus,
    contractData, setContractData,
    paymentData, setPaymentData,
    inspectionPdfData, setInspectionPdfData,
    hasTradeIn, setHasTradeIn, tradeInVehicleData, setTradeInVehicleData,
    tradeInAcceptanceStatus, setTradeInAcceptanceStatus,
    tradeInFipeValue, setTradeInFipeValue,
    tradeInAcceptedValue, setTradeInAcceptedValue,
    tradeInDocuments, setTradeInDocuments,
    tradeInFipeBrands, setTradeInFipeBrands,
    tradeInFipeModels, setTradeInFipeModels,
    tradeInFipeYears, setTradeInFipeYears,
    tradeInSelectedBrand, setTradeInSelectedBrand,
    tradeInSelectedModel, setTradeInSelectedModel,
    tradeInSelectedYear, setTradeInSelectedYear,
    tradeInLoadingFipe, setTradeInLoadingFipe,
    confessionVideoData, setConfessionVideoData,
    resetWizard,
  } = wizard;

  const [calculationDetailsDialogOpen, setCalculationDetailsDialogOpen] = useState(false);
  const [proposalPdfData, setProposalPdfData] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [inspectorSignature, setInspectorSignature] = useState<string | null>(null);

  // Vehicle search state
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");

  // Counter-proposal dialog state
  const [counterProposalDialogOpen, setCounterProposalDialogOpen] = useState(false);
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposedVehicleValue, setProposedVehicleValue] = useState(vehicleValue);
  const [proposedDownPaymentType, setProposedDownPaymentType] = useState<"split" | "full">(downPaymentType);
  const [proposedDownPaymentInstallments, setProposedDownPaymentInstallments] = useState(downPaymentInstallments);
  const [proposedRateType, setProposedRateType] = useState(selectedRateType);

  // Approved proposal state
  const [approvedProposalAlertOpen, setApprovedProposalAlertOpen] = useState(false);
  const [approvedProposal, setApprovedProposal] = useState<any>(null);

  // Video recording states
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [confirmVideoRecordOpen, setConfirmVideoRecordOpen] = useState(false);

  // Get seller ID and role for checking approved proposals (memoized)
  const adminAuthData = localStorage.getItem('adminAuth');
  const sellerId = adminAuthData ? JSON.parse(adminAuthData).user?.id : null;
  const userRole = adminAuthData ? JSON.parse(adminAuthData).user?.role : null;
  const isAdmin = userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'manager';

  // Query for approved proposals (filtered server-side by sellerId)
  const { data: approvedProposals = [] } = useQuery<any[]>({
    queryKey: ['/api/financing-proposals', 'seller', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const response = await fetch(`/api/financing-proposals/seller/${sellerId}`);
      if (!response.ok) throw new Error('Failed to fetch proposals');
      return response.json();
    },
    enabled: !!sellerId,
  });

  // Check for approved proposals on mount
  useEffect(() => {
    if (!sellerId || !approvedProposals.length) return;

    const myApprovedProposal = approvedProposals.find(
      p => p.sellerId === sellerId && p.status === 'approved' && !p.dismissedAt
    );

    if (myApprovedProposal && !approvedProposal) {
      setApprovedProposal(myApprovedProposal);
      setApprovedProposalAlertOpen(true);
    }
  }, [approvedProposals, sellerId]);

  // Carregar marcas FIPE para veículo de troca quando habilitado
  useEffect(() => {
    if (hasTradeIn && tradeInFipeBrands.length === 0) {
      setTradeInLoadingFipe(true);
      fetchFipeBrands()
        .then(brands => setTradeInFipeBrands(brands))
        .catch(error => {
          console.error("Erro ao carregar marcas FIPE:", error);
          toast({
            title: "Erro ao carregar marcas",
            description: "Não foi possível carregar a lista de marcas FIPE",
            variant: "destructive"
          });
        })
        .finally(() => setTradeInLoadingFipe(false));
    }
  }, [hasTradeIn]);

  // Carregar modelos quando marca for selecionada
  useEffect(() => {
    if (tradeInSelectedBrand) {
      setTradeInLoadingFipe(true);
      setTradeInSelectedModel("");
      setTradeInSelectedYear("");
      setTradeInFipeModels([]);
      setTradeInFipeYears([]);

      fetchFipeModels(tradeInSelectedBrand)
        .then(models => setTradeInFipeModels(models))
        .catch(error => {
          console.error("Erro ao carregar modelos:", error);
          toast({
            title: "Erro ao carregar modelos",
            description: "Não foi possível carregar os modelos",
            variant: "destructive"
          });
        })
        .finally(() => setTradeInLoadingFipe(false));
    }
  }, [tradeInSelectedBrand]);

  // Carregar anos quando modelo for selecionado
  useEffect(() => {
    if (tradeInSelectedBrand && tradeInSelectedModel) {
      setTradeInLoadingFipe(true);
      setTradeInSelectedYear("");
      setTradeInFipeYears([]);

      fetchFipeYears(tradeInSelectedBrand, tradeInSelectedModel)
        .then(years => setTradeInFipeYears(years))
        .catch(error => {
          console.error("Erro ao carregar anos:", error);
          toast({
            title: "Erro ao carregar anos",
            description: "Não foi possível carregar os anos disponíveis",
            variant: "destructive"
          });
        })
        .finally(() => setTradeInLoadingFipe(false));
    }
  }, [tradeInSelectedModel]);

  // Função para consultar valor FIPE do veículo de troca
  const handleConsultTradeInFipe = async () => {
    if (!tradeInSelectedBrand || !tradeInSelectedModel || !tradeInSelectedYear) {
      toast({
        title: "Dados incompletos",
        description: "Selecione marca, modelo e ano para consultar o valor FIPE",
        variant: "destructive"
      });
      return;
    }

    setTradeInLoadingFipe(true);
    try {
      const fipeData = await fetchFipePrice(tradeInSelectedBrand, tradeInSelectedModel, tradeInSelectedYear);

      setTradeInFipeValue(fipeData.price);
      setTradeInVehicleData({
        ...tradeInVehicleData,
        brand: fipeData.brand,
        model: fipeData.model,
        year: fipeData.modelYear.toString(),
      });

      toast({
        title: "Consulta realizada!",
        description: `Valor FIPE: ${fipeData.price}`,
      });
    } catch (error) {
      console.error("Erro ao consultar FIPE:", error);
      toast({
        title: "Erro na consulta",
        description: "Não foi possível consultar o valor FIPE",
        variant: "destructive"
      });
    } finally {
      setTradeInLoadingFipe(false);
    }
  };

  // Load approved proposal into wizard
  const loadApprovedProposal = () => {
    if (!approvedProposal) return;

    try {
      const proposedTerms = JSON.parse(approvedProposal.proposedTerms);

      // Find the vehicle
      const vehicle = (vehicles || []).find(v => v.id === approvedProposal.vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }

      // Set calculation values
      setVehicleValue(proposedTerms.vehicleValue);
      setDownPaymentType(proposedTerms.downPaymentType);
      setDownPaymentInstallments(proposedTerms.downPaymentInstallments);

      // Find the rate type that matches the approved interest rate
      const rateType = [1, 2, 3, 4].find(
        n => Math.abs(rateSettings[`rate${n}` as keyof typeof rateSettings] - proposedTerms.interestRate) < 0.01
      ) || 1;
      setSelectedRateType(rateType);

      // Set customer data
      setCustomerData({
        ...customerData,
        name: approvedProposal.customerName,
        cpf: approvedProposal.customerCpf,
        phone: approvedProposal.customerPhone,
      });

      // Set financing calculation to pass step 2 validation
      // Use exact values from approved proposal to maintain consistency
      // downPaymentInstallment is the total 30% financed portion (after trade-in)
      const totalInstallmentPortion = proposedTerms.downPaymentInstallmentValue * proposedTerms.downPaymentInstallments;

      setFinancingCalculation({
        vehicleValue: proposedTerms.vehicleValue,
        downPaymentType: proposedTerms.downPaymentType,
        downPaymentInstallments: proposedTerms.downPaymentInstallments,
        interestRate: proposedTerms.interestRate,
        downPayment: proposedTerms.downPayment,
        downPaymentCash: proposedTerms.downPaymentCash,
        downPaymentInstallment: totalInstallmentPortion / (1 + 0.081), // Remove fee to get original amount
        downPaymentInstallmentValue: proposedTerms.downPaymentInstallmentValue,
        financeAmount: proposedTerms.financeAmount,
        monthlyPayment: proposedTerms.monthlyPayment,
        simulationValidUntil,
        dueDateDay,
        entryPercent,
      });

      // Move to step 2 (calculator)
      setCurrentStep(2);

      toast({
        title: "Proposta aprovada carregada!",
        description: "Os dados da proposta aprovada foram carregados. Você pode continuar o processo de financiamento.",
      });

      setApprovedProposalAlertOpen(false);
    } catch (error) {
      console.error("Erro ao carregar proposta aprovada:", error);
      toast({
        title: "Erro ao carregar proposta",
        description: "Não foi possível carregar os dados da proposta aprovada.",
        variant: "destructive",
      });
    }
  };

  const interestRate = rateSettings[`rate${selectedRateType}` as keyof typeof rateSettings];

  // Filtrar veículos que NÃO estão em financiamentos ativos
  const availableVehicles = useMemo(() => {
    if (!vehicles) return [];

    const financingsList = financings || [];

    // IDs de veículos que já estão em financiamentos ativos
    const vehiclesInActiveFinancing = financingsList
      .filter((f: any) => f.approvalStatus !== 'rejected' && f.approvalStatus !== 'completed' && f.approvalStatus !== 'cancelled')
      .map((f: any) => f.vehicleId);

    // Retornar apenas veículos disponíveis e que NÃO estão em financiamentos ativos
    return vehicles.filter(v => 
      // Mostra veículos que não estejam explicitamente indisponíveis e que não estejam em financiamentos ativos
      v.available !== false && !vehiclesInActiveFinancing.includes(v.id)
    );
  }, [vehicles, financings]);

  // Filtrar veículos com base na pesquisa
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearchTerm.trim()) return availableVehicles;

    const searchLower = vehicleSearchTerm.toLowerCase().trim();
    const searchNormalized = searchLower.replace(/[-\s]/g, '');

    return availableVehicles.filter(vehicle => {
      const plateNormalized = vehicle.licensePlate?.toLowerCase().replace(/[-\s]/g, '') || '';

      return vehicle.name?.toLowerCase().includes(searchLower) ||
        vehicle.brand?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        plateNormalized.includes(searchNormalized) ||
        vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
        vehicle.year?.toString().includes(searchLower);
    });
  }, [availableVehicles, vehicleSearchTerm]);

  // Trade-in calculations
  const tradeInValue = hasTradeIn && tradeInAcceptedValue ?
    parseFloat(tradeInAcceptedValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0 : 0;

  const downPayment = entryValue;
  const remainingDownPayment = Math.max(0, downPayment - tradeInValue);
  const excessTradeIn = Math.max(0, tradeInValue - downPayment);

  const downPaymentCash = downPaymentType === "full" ? remainingDownPayment : remainingDownPayment * 0.70;
  const downPaymentInstallment = downPaymentType === "full" ? 0 : remainingDownPayment * 0.30;
  const installmentFeeRate = 0.081;
  const downPaymentInstallmentValue = downPaymentType === "full" ? 0 : (downPaymentInstallment * (1 + installmentFeeRate)) / downPaymentInstallments;

  const financeAmount = Math.max(0, vehicleValue - downPayment - excessTradeIn);
  const months = 48;

  const monthlyRate = interestRate / 100;
  const monthlyPayment = financeAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

  // Counter-proposal calculations (based on proposed values)
  const proposedInterestRate = rateSettings[`rate${proposedRateType}` as keyof typeof rateSettings];
  const proposedDownPayment = entryValue;
  const proposedRemainingDownPayment = Math.max(0, proposedDownPayment - tradeInValue);
  const proposedDownPaymentCash = proposedDownPaymentType === "full" ? proposedRemainingDownPayment : proposedRemainingDownPayment * 0.70;
  const proposedDownPaymentInstallment = proposedDownPaymentType === "full" ? 0 : proposedRemainingDownPayment * 0.30;
  const proposedDownPaymentInstallmentValue = proposedDownPaymentType === "full" ? 0 : (proposedDownPaymentInstallment * (1 + installmentFeeRate)) / proposedDownPaymentInstallments;
  const proposedFinanceAmount = Math.max(0, proposedVehicleValue - proposedDownPayment - excessTradeIn);
  const proposedMonthlyRate = proposedInterestRate / 100;
  const proposedMonthlyPayment = proposedFinanceAmount * (proposedMonthlyRate * Math.pow(1 + proposedMonthlyRate, months)) / (Math.pow(1 + proposedMonthlyRate, months) - 1);

  // Create counter-proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async (proposalData: any) => {
      return await apiRequest("POST", "/api/financing-proposals", proposalData);
    },
    onSuccess: (data: any) => {
      const isAutoApproved = data.status === 'approved';
      toast({
        title: isAutoApproved ? "Proposta aprovada automaticamente!" : "Proposta enviada!",
        description: isAutoApproved
          ? "Como administrador, sua proposta foi aprovada automaticamente. Você pode continuar com o financiamento."
          : "A proposta foi enviada para aprovação do gerente. Você será notificado assim que for revisada.",
      });
      setCounterProposalDialogOpen(false);
      setProposalNotes("");

      // Se foi auto-aprovada, atualizar o estado para mostrar o alerta
      if (isAutoApproved) {
        setApprovedProposal(data);
        setApprovedProposalAlertOpen(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar proposta",
        description: error.message || "Não foi possível enviar a proposta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Dismiss approved proposal mutation
  const dismissProposalMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      return await apiRequest("POST", `/api/financing-proposals/${proposalId}/dismiss`, {});
    },
    onSuccess: () => {
      setApprovedProposalAlertOpen(false);
      setApprovedProposal(null);
      // Invalidate all queries to refetch with updated dismissedAt
      if (sellerId) {
        // Invalidate FinancingWizard query
        queryClient.invalidateQueries({ queryKey: ['/api/financing-proposals', 'seller', sellerId] });
        // Invalidate vendor workspace query (admin.tsx)
        queryClient.invalidateQueries({ queryKey: ['/api/financing-proposals/seller', sellerId] });
      }
      toast({
        title: "Proposta marcada para depois",
        description: "Você pode retomar esta venda mais tarde.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao marcar proposta",
        description: error.message || "Não foi possível marcar a proposta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitProposal = () => {
    if (!sellerId) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar uma proposta.",
        variant: "destructive",
      });
      return;
    }

    // Vendedor precisa preencher dados do cliente, admin não
    if (!isAdmin && (!customerData?.name || !customerData?.cpf || !customerData?.phone)) {
      toast({
        title: "Dados do cliente incompletos",
        description: "Preencha os dados do cliente na etapa 3 antes de solicitar uma proposta.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVehicle) {
      toast({
        title: "Veículo não selecionado",
        description: "Selecione um veículo na etapa 1 antes de solicitar uma proposta.",
        variant: "destructive",
      });
      return;
    }

    // Vendedor precisa justificar, admin não
    if (!isAdmin && !proposalNotes.trim()) {
      toast({
        title: "Justificativa obrigatória",
        description: "Adicione uma justificativa para a contra proposta.",
        variant: "destructive",
      });
      return;
    }

    const originalCalculation = {
      vehicleValue,
      downPaymentType,
      downPaymentInstallments,
      interestRate,
      downPayment,
      downPaymentCash,
      downPaymentInstallmentValue,
      financeAmount,
      monthlyPayment,
      tradeInValue,
    };

    const proposedTerms = {
      vehicleValue: proposedVehicleValue,
      downPaymentType: proposedDownPaymentType,
      downPaymentInstallments: proposedDownPaymentInstallments,
      interestRate: proposedInterestRate,
      downPayment: proposedDownPayment,
      downPaymentCash: proposedDownPaymentCash,
      downPaymentInstallmentValue: proposedDownPaymentInstallmentValue,
      financeAmount: proposedFinanceAmount,
      monthlyPayment: proposedMonthlyPayment,
      tradeInValue,
    };

    createProposalMutation.mutate({
      sellerId,
      userRole,
      customerName: customerData?.name || 'A definir',
      customerCpf: customerData?.cpf || '000.000.000-00',
      customerPhone: customerData?.phone || '(00) 00000-0000',
      vehicleId: selectedVehicle.id,
      vehicleName: selectedVehicle.name,
      originalCalculation: JSON.stringify(originalCalculation),
      proposedTerms: JSON.stringify(proposedTerms),
      proposalNotes: proposalNotes?.trim() || 'Proposta criada por administrador',
    });
  };

  // Validation function
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!selectedVehicle) {
          toast({
            title: "Veículo não selecionado",
            description: "Selecione um veículo para continuar com o financiamento.",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 2:
        if (!financingCalculation?.vehicleValue || !financingCalculation?.monthlyPayment) {
          toast({
            title: "Cálculo não realizado",
            description: "Complete os cálculos de financiamento antes de prosseguir.",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 3:
        if (!customerData?.name || !customerData?.cpf || !customerData?.email ||
          !customerData?.phone || !customerData?.driverLicense || !customerData?.emergencyContact ||
          !customerData?.street || !customerData?.neighborhood || !customerData?.city ||
          !customerData?.state || !customerData?.zipCode) {
          toast({
            title: "Dados incompletos",
            description: "Preencha todos os campos obrigatórios (*) do cadastro do cliente.",
            variant: "destructive",
          });
          return false;
        }

        if (!guarantorData?.name || !guarantorData?.cpf || !guarantorData?.rg ||
          !guarantorData?.email || !guarantorData?.phone ||
          !guarantorData?.street || !guarantorData?.neighborhood ||
          !guarantorData?.city || !guarantorData?.state || !guarantorData?.zipCode) {
          toast({
            title: "Dados do avalista incompletos",
            description: "O avalista é obrigatório. Preencha todos os campos obrigatórios (*) do avalista.",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 4:
        return true;

      case 5:
        if (!paymentData?.cashPaymentMethod) {
          toast({
            title: "Forma de pagamento não informada",
            description: "Selecione a forma de pagamento da entrada à vista.",
            variant: "destructive",
          });
          return false;
        }
        if (financingCalculation?.downPaymentType === 'split' && !paymentData?.installmentPaymentMethod) {
          toast({
            title: "Forma de pagamento das parcelas não informada",
            description: "Selecione a forma de pagamento das parcelas da entrada.",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 6:
        if (!contractData?.fileUrl) {
          toast({
            title: "Contrato não gerado",
            description: "Gere ou faça upload do contrato de financiamento para continuar.",
            variant: "destructive",
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const createFinancingMutation = useMutation({
    mutationFn: async (data: any) => {
      // Debug: Verificar se os documentos estão chegando
      console.log('[FINANCING] Documentos recebidos:', {
        cnh: data.financingDocuments?.cnh ? 'PRESENTE' : 'AUSENTE',
        residence: data.financingDocuments?.residence ? 'PRESENTE' : 'AUSENTE',
        others: data.financingDocuments?.others?.length || 0,
        financingDocuments: data.financingDocuments
      });

      const payload: any = {
        vehicleId: data.vehicleId,
        customerId: data.customerData?.id || null,

        customerName: data.customerData?.name || "",
        customerEmail: data.customerData?.email || "",
        customerPhone: data.customerData?.phone || "",
        customerCpf: data.customerData?.cpf || "",
        customerRg: data.customerData?.rg || null,
        customerDriverLicense: data.customerData?.driverLicense || null,
        customerEmergencyContact: data.customerData?.emergencyContact || null,
        customerStreet: data.customerData?.street || null,
        customerComplement: data.customerData?.complement || null,
        customerNeighborhood: data.customerData?.neighborhood || null,
        customerCity: data.customerData?.city || null,
        customerState: data.customerData?.state || null,
        customerZipCode: data.customerData?.zipCode || null,
        customerPaymentDate: data.customerData?.paymentDate || null,
        customerFirstContactDate: data.customerData?.firstContactDate || null,
        customerClosingDate: data.customerData?.closingDate || null,

        hasGuarantor: true,
        guarantorName: data.guarantorData?.name || null,
        guarantorCpf: data.guarantorData?.cpf || null,
        guarantorRg: data.guarantorData?.rg || null,
        guarantorEmail: data.guarantorData?.email || null,
        guarantorPhone: data.guarantorData?.phone || null,
        guarantorDriverLicense: data.guarantorData?.driverLicense || null,
        guarantorDocumentUrl: data.financingDocuments?.guarantorDocument || null,
        guarantorDocumentFileName: data.financingDocuments?.guarantorDocumentFileName || null,
        guarantorResidenceUrl: data.financingDocuments?.guarantorResidence || null,
        guarantorResidenceFileName: data.financingDocuments?.guarantorResidenceFileName || null,
        guarantorStreet: data.guarantorData?.street || null,
        guarantorComplement: data.guarantorData?.complement || null,
        guarantorNeighborhood: data.guarantorData?.neighborhood || null,
        guarantorCity: data.guarantorData?.city || null,
        guarantorState: data.guarantorData?.state || null,
        guarantorZipCode: data.guarantorData?.zipCode || null,

        vehicleValue: data.financingCalculation?.vehicleValue?.toString() || "0",
        downPaymentType: data.financingCalculation?.downPaymentType || "split",
        downPaymentTotal: data.financingCalculation?.downPayment?.toString() || "0",
        downPaymentCash: data.financingCalculation?.downPaymentCash?.toString() || "0",
        downPaymentFinanced: data.financingCalculation?.downPaymentInstallment?.toString() || "0",
        downPaymentInstallments: data.financingCalculation?.downPaymentInstallments || 3,
        downPaymentInstallmentValue: data.financingCalculation?.downPaymentInstallmentValue?.toString() || "0",
        principalAmount: data.financingCalculation?.financeAmount?.toString() || "0",
        interestRate: data.financingCalculation?.interestRate?.toString() || "0",
        installments: 48,
        monthlyInstallment: data.financingCalculation?.monthlyPayment?.toString() || "0",
        totalCost: ((data.financingCalculation?.financeAmount || 0) + (data.financingCalculation?.monthlyPayment || 0) * 48).toString(),
        totalInterest: ((data.financingCalculation?.monthlyPayment || 0) * 48 - (data.financingCalculation?.financeAmount || 0)).toString(),
        simulationValidUntil: data.financingCalculation?.simulationValidUntil || null,

        cnhDocumentUrl: data.financingDocuments?.cnh || null,
        cnhDocumentFileName: data.financingDocuments?.cnhFileName || null,
        proofOfResidenceUrl: data.financingDocuments?.residence || null,
        proofOfResidenceFileName: data.financingDocuments?.residenceFileName || null,
        guaranteesUrls: data.financingDocuments?.guarantees || [],
        guaranteesFileNames: data.financingDocuments?.guaranteesFileNames || [],
        otherDocumentsUrls: data.financingDocuments?.others || [],
        otherDocumentsFileNames: data.financingDocuments?.othersFileNames || [],
        approvalStatus: "pending",
        approvalNotes: null,

        checkInPhotos: JSON.stringify(data.checkInPhotos || {}),
        checkInNotes: data.checkInPhotos?.notes || null,

        contractUrl: data.contractData?.fileUrl || null,
        contractFileName: data.contractData?.fileName || null,

        // Pagamentos detalhados
        cashPaymentMethod: data.paymentData?.cashPaymentMethod || null,
        cashPaymentDate: data.paymentData?.cashPaymentDate || null,
        cashProofUrl: data.paymentData?.cashProofUrl || null,
        cashProofFileName: data.paymentData?.cashProofFileName || null,
        installmentPaymentMethod: data.paymentData?.installmentPaymentMethod || null,
        installmentNotes: data.paymentData?.installmentNotes || null,
        generalPaymentNotes: data.paymentData?.generalNotes || null,

        // Campos antigos mantidos para compatibilidade
        paymentMethod: data.paymentData?.method || data.paymentData?.cashPaymentMethod || null,
        paymentProofUrl: data.paymentData?.proofUrl || data.paymentData?.cashProofUrl || null,
        paymentNotes: data.paymentData?.notes || data.paymentData?.generalNotes || null,

        startDate: new Date().toISOString(),
        dueDay: data.financingCalculation?.dueDateDay || 10,
      };

      if (data.tradeInVehicleData && data.tradeInAcceptanceStatus === "accepted") {
        // Incluir foto frontal do veículo de troca
        const photosUrls = [];
        if (data.tradeInDocuments?.photo) {
          photosUrls.push(data.tradeInDocuments.photo);
        }

        payload.tradeInAcceptanceStatus = "accepted";
        payload.tradeInVehicle = {
          plate: data.tradeInVehicleData.plate || null,
          brand: data.tradeInVehicleData.brand || "",
          model: data.tradeInVehicleData.model || "",
          year: data.tradeInVehicleData.year || "",
          category: data.tradeInVehicleData.category || null,
          mileage: data.tradeInVehicleData.mileage || null,
          fipeValue: data.tradeInFipeValue || null,
          acceptedValue: data.tradeInAcceptedValue || "0",
          cautelarUrl: data.tradeInDocuments?.cautelar?.fileUrl || null,
          crlvUrl: data.tradeInDocuments?.crlv?.fileUrl || null,
          laudoMecanicoUrl: data.tradeInDocuments?.laudoMecanico?.fileUrl || null,
          photosUrls,
        };
      }
      const res = await apiRequest("POST", "/api/financings", payload);
      return await res.json();
    },
    onSuccess: () => {
      // The actual logic is now directly inside the mutate() call inline onSuccess to prevent React Query stale closure issues
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar financiamento",
        description: error.message || "Ocorreu um erro ao criar o financiamento.",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      {/* Stepper */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto pb-2">
        <div className="flex items-center w-full gap-0">
          {[
            { step: 1, icon: Car, label: "Veículo" },
            { step: 2, icon: DollarSign, label: "Calculadora" },
            { step: 3, icon: User, label: "Cadastro" },
            { step: 4, icon: FileText, label: "Documentação" },
            { step: 5, icon: CreditCard, label: "Pagamento" },
            { step: 6, icon: FileText, label: "Contrato" },
          ].map((item, index) => (
            <div key={item.step} className="flex items-center flex-1 min-w-[45px] sm:min-w-[70px]">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${currentStep > item.step
                  ? "bg-primary border-primary text-primary-foreground"
                  : currentStep === item.step
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground"
                  }`} data-testid={`wizard-step-${item.step}`}>
                  {currentStep > item.step ? (
                    <Check className="h-3 w-3 sm:h-5 sm:w-5" />
                  ) : (
                    <item.icon className="h-3 w-3 sm:h-5 sm:w-5" />
                  )}
                </div>
                <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1 text-center hidden sm:block">{item.label}</p>
              </div>
              {index < 5 && (
                <div className={`flex-1 h-0.5 mx-0.5 sm:mx-1 ${currentStep > item.step ? "bg-primary" : "bg-muted"
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo das etapas */}
      <div className="min-h-[400px]">
        {/* Etapa 1: Escolha do Veículo */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 1: Escolha do Veículo</h3>
              <p className="text-sm text-muted-foreground">Selecione o veículo disponível para financiamento</p>
            </div>

            {/* Campo de busca de veículos */}
            <div className="relative">
              <Input
                placeholder="Pesquisar por nome, marca, modelo, placa ou ano..."
                value={vehicleSearchTerm}
                onChange={(e) => setVehicleSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-vehicle-search"
              />
              <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {vehicleSearchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setVehicleSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {vehicleSearchTerm && (
              <p className="text-sm text-muted-foreground">
                {filteredVehicles.length} veículo(s) encontrado(s)
              </p>
            )}

            {isLoading.vehicles ? (
              <p className="text-center text-muted-foreground">Carregando veículos...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {availableVehicles.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">Nenhum veículo disponível para financiamento.</p>
                    <p className="text-sm text-muted-foreground mt-2">Marque veículos como "Disponível para Financiamento" ou cadastre veículos de investidor.</p>
                    <p className="text-sm text-muted-foreground mt-2">Veículos já financiados não aparecem nesta lista.</p>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">Nenhum veículo encontrado para "{vehicleSearchTerm}".</p>
                    <Button
                      variant="ghost"
                      onClick={() => setVehicleSearchTerm("")}
                      className="mt-2 text-primary"
                    >
                      Limpar pesquisa
                    </Button>
                  </div>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <Card
                      key={vehicle.id}
                      className={`cursor-pointer transition-all ${selectedVehicle?.id === vehicle.id ? 'ring-2 ring-primary' : 'hover-elevate'
                        }`}
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        // Atualizar valor do veículo na calculadora
                        if (vehicle.fipeValue) {
                          setVehicleValue(Number(vehicle.fipeValue));
                        }
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {vehicle.brand} {vehicle.model} ({vehicle.year})
                            </p>
                            {vehicle.fipeValue && (
                              <p className="text-sm font-medium text-primary mt-1">
                                Valor FIPE: R$ {Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                          {selectedVehicle?.id === vehicle.id && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(() => {
                          const isPlaceholder = !vehicle.imageUrl || vehicle.imageUrl.includes('placeholder');
                          return (
                            <div className={`aspect-video w-full rounded-lg overflow-hidden ${isPlaceholder ? 'bg-gray-900' : 'bg-muted'}`}>
                              <img
                                src={isPlaceholder ? placeholderLogo : vehicle.imageUrl}
                                alt={vehicle.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">Categoria:</span> {vehicle.category}</div>
                          <div><span className="font-medium">Câmbio:</span> {vehicle.transmission}</div>
                          <div><span className="font-medium">Combustível:</span> {vehicle.fuel}</div>
                          <div><span className="font-medium">Ocupantes:</span> {vehicle.seats}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Etapa 2: Calculadora de Financiamento */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 2: Calculadora de Financiamento</h3>
              <p className="text-sm text-muted-foreground">Configure os valores e condições do financiamento</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor do Veículo (R$) {!isAdmin && <span className="text-xs text-muted-foreground">(Somente leitura)</span>}</label>
                <CurrencyInput
                  value={vehicleValue}
                  onChange={(value) => setVehicleValue(parseFloat(value) || 0)}
                  placeholder="Ex: 50.000,00"
                  data-testid="input-vehicle-value"
                  disabled={!isAdmin}
                />
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground">
                    Para alterar o valor, use o botão "Solicitar Contra Proposta"
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Entrada</label>
                <Select value={downPaymentType} onValueChange={(v: any) => setDownPaymentType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="split">70% à vista + 30% parcelado</SelectItem>
                    <SelectItem value="full">100% à vista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da Entrada (R$)</label>
                <CurrencyInput
                  value={entryValue}
                  onChange={(value) => {
                    const numValue = parseFloat(value) || 0;
                    setEntryValue(numValue);
                    if (vehicleValue > 0) {
                      setEntryPercent(Math.round((numValue / vehicleValue) * 100));
                    }
                  }}
                  placeholder="Ex: 15.000,00"
                  data-testid="input-entry-value"
                />
                <p className="text-xs text-muted-foreground">
                  {vehicleValue > 0 ? ((entryValue / vehicleValue) * 100).toFixed(1) : 0}% do valor do veículo
                </p>
              </div>
            </div>

            {/* Condições do Financiamento - Parcelas, Taxa e Vencimento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {downPaymentType === "split" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parcelas da Entrada</label>
                  <Select value={downPaymentInstallments.toString()} onValueChange={(v) => setDownPaymentInstallments(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Taxa de Juros</label>
                <Select value={selectedRateType.toString()} onValueChange={(v) => setSelectedRateType(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(n => (
                      <SelectItem key={n} value={n.toString()}>
                        Taxa {n}: {rateSettings[`rate${n}` as keyof typeof rateSettings].toFixed(2)}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dia de Vencimento das Parcelas</label>
                <Select value={dueDateDay.toString()} onValueChange={(v) => setDueDateDay(Number(v))}>
                  <SelectTrigger data-testid="select-due-date-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Veículo de Troca */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-md">Veículo de Troca</CardTitle>
                <CardDescription>
                  Cliente possui um veículo para dar como entrada?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tem veículo de troca?</label>
                  <Select
                    value={hasTradeIn ? "sim" : "nao"}
                    onValueChange={(v) => {
                      const newValue = v === "sim";
                      setHasTradeIn(newValue);
                      if (!newValue) {
                        setTradeInVehicleData(null);
                        setTradeInAcceptedValue("");
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-has-trade-in">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="sim">Sim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasTradeIn && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-semibold text-sm">Dados do Veículo do Cliente</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Marca *</label>
                        <Select
                          value={tradeInSelectedBrand}
                          onValueChange={setTradeInSelectedBrand}
                          disabled={tradeInLoadingFipe}
                        >
                          <SelectTrigger data-testid="select-trade-in-brand">
                            <SelectValue placeholder="Selecione a marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {tradeInFipeBrands.map((brand) => (
                              <SelectItem key={brand.code} value={brand.code}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Modelo *</label>
                        <Select
                          value={tradeInSelectedModel}
                          onValueChange={setTradeInSelectedModel}
                          disabled={!tradeInSelectedBrand || tradeInLoadingFipe}
                        >
                          <SelectTrigger data-testid="select-trade-in-model">
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {tradeInFipeModels.map((model) => (
                              <SelectItem key={model.code} value={model.code}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ano *</label>
                        <Select
                          value={tradeInSelectedYear}
                          onValueChange={setTradeInSelectedYear}
                          disabled={!tradeInSelectedModel || tradeInLoadingFipe}
                        >
                          <SelectTrigger data-testid="select-trade-in-year">
                            <SelectValue placeholder="Selecione o ano" />
                          </SelectTrigger>
                          <SelectContent>
                            {tradeInFipeYears.map((year) => (
                              <SelectItem key={year.code} value={year.code}>
                                {year.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Consultar Valor FIPE</label>
                        <Button
                          type="button"
                          onClick={handleConsultTradeInFipe}
                          disabled={!tradeInSelectedYear || tradeInLoadingFipe}
                          className="w-full"
                          data-testid="button-consult-trade-in-fipe"
                        >
                          {tradeInLoadingFipe ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Consultando...
                            </>
                          ) : (
                            "Consultar Tabela FIPE"
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Placa</label>
                        <Input
                          placeholder="ABC-1234"
                          value={tradeInVehicleData?.plate || ""}
                          onChange={(e) => setTradeInVehicleData({
                            ...tradeInVehicleData,
                            plate: e.target.value
                          })}
                          data-testid="input-trade-in-plate"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Quilometragem (KM)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 50000"
                          value={tradeInVehicleData?.mileage || ""}
                          onChange={(e) => setTradeInVehicleData({
                            ...tradeInVehicleData,
                            mileage: e.target.value
                          })}
                          data-testid="input-trade-in-mileage"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Categoria</label>
                        <Select
                          value={tradeInVehicleData?.category || ""}
                          onValueChange={(value) => setTradeInVehicleData({
                            ...tradeInVehicleData,
                            category: value
                          })}
                        >
                          <SelectTrigger data-testid="select-trade-in-category">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
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
                      </div>
                    </div>

                    {tradeInFipeValue && (
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Valor FIPE Consultado:</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tradeInVehicleData?.brand} {tradeInVehicleData?.model} ({tradeInVehicleData?.year})
                            </p>
                          </div>
                          <p className="text-2xl font-bold text-primary">{tradeInFipeValue}</p>
                        </div>
                      </div>
                    )}

                    {/* Informações do Veículo */}
                    <Card className="border-muted">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Informações do Veículo</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Tem documento? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <label className="text-sm font-medium">Tem documento?</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.temDocumento === true ? "default" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  temDocumento: true
                                })}
                                data-testid="button-trade-in-documento-sim"
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.temDocumento === false ? "destructive" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  temDocumento: false
                                })}
                                data-testid="button-trade-in-documento-nao"
                              >
                                Não
                              </Button>
                            </div>
                            {tradeInVehicleData?.temDocumento !== null && tradeInVehicleData?.temDocumento !== undefined && (
                              <Textarea
                                placeholder="Observações sobre documento..."
                                value={tradeInVehicleData?.observacoesDocumento || ""}
                                onChange={(e) => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  observacoesDocumento: e.target.value
                                })}
                                rows={2}
                                className="mt-2"
                                data-testid="input-trade-in-documento-obs"
                              />
                            )}
                          </div>

                          {/* IPVA */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <label className="text-sm font-medium">IPVA</label>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.ipvaStatus === 'sim' ? "default" : "outline"}
                                onClick={() => {
                                  const fipeClean = tradeInFipeValue?.replace(/[^\d,]/g, '').replace(',', '.') || "0";
                                  const fipeNumeric = parseFloat(fipeClean) || 0;
                                  const ipva4Percent = (fipeNumeric * 0.04).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  setTradeInVehicleData({
                                    ...tradeInVehicleData,
                                    ipvaStatus: 'sim',
                                    ipvaValue: ipva4Percent
                                  });
                                }}
                                data-testid="button-trade-in-ipva-pago"
                              >
                                Pago
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.ipvaStatus === 'nao' ? "destructive" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  ipvaStatus: 'nao',
                                  ipvaValue: ""
                                })}
                                data-testid="button-trade-in-ipva-nao"
                              >
                                Não Pago
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.ipvaStatus === 'isento' ? "secondary" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  ipvaStatus: 'isento',
                                  ipvaValue: ""
                                })}
                                data-testid="button-trade-in-ipva-isento"
                              >
                                Isento
                              </Button>
                            </div>
                            {tradeInVehicleData?.ipvaStatus === 'sim' && (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-muted-foreground">4% do valor FIPE (editável)</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">R$</span>
                                  <Input
                                    value={tradeInVehicleData?.ipvaValue || ""}
                                    onChange={(e) => setTradeInVehicleData({
                                      ...tradeInVehicleData,
                                      ipvaValue: e.target.value
                                    })}
                                    placeholder="0,00"
                                    data-testid="input-trade-in-ipva-value"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Licenciamento pago? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <label className="text-sm font-medium">Licenciamento pago?</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.licenciamentoPago === true ? "default" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  licenciamentoPago: true
                                })}
                                data-testid="button-trade-in-licenciamento-sim"
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.licenciamentoPago === false ? "destructive" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  licenciamentoPago: false
                                })}
                                data-testid="button-trade-in-licenciamento-nao"
                              >
                                Não
                              </Button>
                            </div>
                            {tradeInVehicleData?.licenciamentoPago !== null && tradeInVehicleData?.licenciamentoPago !== undefined && (
                              <Textarea
                                placeholder="Observações sobre licenciamento..."
                                value={tradeInVehicleData?.observacoesLicenciamento || ""}
                                onChange={(e) => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  observacoesLicenciamento: e.target.value
                                })}
                                rows={2}
                                className="mt-2"
                                data-testid="input-trade-in-licenciamento-obs"
                              />
                            )}
                          </div>

                          {/* Tem seguro? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <label className="text-sm font-medium">Tem seguro?</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.hasInsurance === true ? "default" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  hasInsurance: true
                                })}
                                data-testid="button-trade-in-seguro-sim"
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.hasInsurance === false ? "destructive" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  hasInsurance: false
                                })}
                                data-testid="button-trade-in-seguro-nao"
                              >
                                Não
                              </Button>
                            </div>
                            {tradeInVehicleData?.hasInsurance !== null && tradeInVehicleData?.hasInsurance !== undefined && (
                              <Textarea
                                placeholder="Observações sobre seguro..."
                                value={tradeInVehicleData?.observacoesSeguro || ""}
                                onChange={(e) => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  observacoesSeguro: e.target.value
                                })}
                                rows={2}
                                className="mt-2"
                                data-testid="input-trade-in-seguro-obs"
                              />
                            )}
                          </div>

                          {/* Tá financiado? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <label className="text-sm font-medium">Tá financiado?</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.taFinanciado === true ? "default" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  taFinanciado: true
                                })}
                                data-testid="button-trade-in-financiado-sim"
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.taFinanciado === false ? "destructive" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  taFinanciado: false,
                                  observacoesFinanciado: ""
                                })}
                                data-testid="button-trade-in-financiado-nao"
                              >
                                Não
                              </Button>
                            </div>
                            {tradeInVehicleData?.taFinanciado === true && (
                              <Textarea
                                placeholder="Observações sobre financiamento..."
                                value={tradeInVehicleData?.observacoesFinanciado || ""}
                                onChange={(e) => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  observacoesFinanciado: e.target.value
                                })}
                                rows={2}
                                className="mt-2"
                                data-testid="input-trade-in-financiado-obs"
                              />
                            )}
                          </div>

                          {/* É de leilão? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <label className="text-sm font-medium">É de leilão?</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.eDeLeilao === true ? "default" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  eDeLeilao: true
                                })}
                                data-testid="button-trade-in-leilao-sim"
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.eDeLeilao === false ? "destructive" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  eDeLeilao: false,
                                  observacoesLeilao: ""
                                })}
                                data-testid="button-trade-in-leilao-nao"
                              >
                                Não
                              </Button>
                            </div>
                            {tradeInVehicleData?.eDeLeilao === true && (
                              <Textarea
                                placeholder="Observações sobre leilão..."
                                value={tradeInVehicleData?.observacoesLeilao || ""}
                                onChange={(e) => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  observacoesLeilao: e.target.value
                                })}
                                rows={2}
                                className="mt-2"
                                data-testid="input-trade-in-leilao-obs"
                              />
                            )}
                          </div>

                          {/* Tem rastreador? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <label className="text-sm font-medium">Tem rastreador?</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.temRastreador === true ? "default" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  temRastreador: true
                                })}
                                data-testid="button-trade-in-rastreador-sim"
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.temRastreador === false ? "destructive" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  temRastreador: false,
                                  localizacaoRastreador: ""
                                })}
                                data-testid="button-trade-in-rastreador-nao"
                              >
                                Não
                              </Button>
                            </div>
                            {tradeInVehicleData?.temRastreador === true && (
                              <Input
                                placeholder="Localização do rastreador..."
                                value={tradeInVehicleData?.localizacaoRastreador || ""}
                                onChange={(e) => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  localizacaoRastreador: e.target.value
                                })}
                                className="mt-2"
                                data-testid="input-trade-in-rastreador-localizacao"
                              />
                            )}
                          </div>

                          {/* Tem multas? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <label className="text-sm font-medium">Tem multas?</label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.temMultas === true ? "default" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  temMultas: true
                                })}
                                data-testid="button-trade-in-multas-sim"
                              >
                                Sim
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={tradeInVehicleData?.temMultas === false ? "destructive" : "outline"}
                                onClick={() => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  temMultas: false,
                                  observacoesMultas: ""
                                })}
                                data-testid="button-trade-in-multas-nao"
                              >
                                Não
                              </Button>
                            </div>
                            {tradeInVehicleData?.temMultas !== null && tradeInVehicleData?.temMultas !== undefined && (
                              <Textarea
                                placeholder="Observações sobre multas..."
                                value={tradeInVehicleData?.observacoesMultas || ""}
                                onChange={(e) => setTradeInVehicleData({
                                  ...tradeInVehicleData,
                                  observacoesMultas: e.target.value
                                })}
                                rows={2}
                                className="mt-2"
                                data-testid="input-trade-in-multas-obs"
                              />
                            )}
                          </div>
                        </div>

                        {/* Algum problema mecânico ou elétrico? */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Algum problema mecânico ou elétrico?</label>
                          <Textarea
                            placeholder="Descreva qualquer problema mecânico ou elétrico..."
                            value={tradeInVehicleData?.problemaMecanico || ""}
                            onChange={(e) => setTradeInVehicleData({
                              ...tradeInVehicleData,
                              problemaMecanico: e.target.value
                            })}
                            rows={3}
                            data-testid="input-trade-in-problema-mecanico"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor Aceito como Entrada (R$) *</label>
                      <CurrencyInput
                        value={tradeInAcceptedValue}
                        onChange={(value) => {
                          setTradeInAcceptedValue(value);
                          if (value && parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) > 0) {
                            setTradeInAcceptanceStatus("accepted");
                          } else {
                            setTradeInAcceptanceStatus("pending");
                          }
                        }}
                        placeholder="Ex: 15.000,00"
                        data-testid="input-trade-in-accepted-value"
                      />
                      <p className="text-xs text-muted-foreground">
                        Valor que será aceito como parte da entrada do financiamento
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Foto do Veículo (Frontal)</label>
                      <PhotoUploadZone
                        photoUrl={tradeInDocuments?.photo || null}
                        onPhotoChange={(url) => setTradeInDocuments({
                          ...tradeInDocuments,
                          photo: url
                        })}
                        label="Foto Frontal"
                        photoKey="trade-in-photo"
                      />
                      <p className="text-xs text-muted-foreground">
                        Adicione uma foto frontal do veículo do cliente
                      </p>
                    </div>

                    <div className="space-y-2">
                      <FileUploadZone
                        fileData={tradeInDocuments?.cautelar || null}
                        onFileChange={(fileData) => setTradeInDocuments({
                          ...tradeInDocuments,
                          cautelar: fileData
                        })}
                        label="Documento Cautelar (Opcional)"
                        accept="image/*,.pdf"
                        testId="trade-in-cautelar"
                      />
                    </div>

                    <div className="space-y-2">
                      <FileUploadZone
                        fileData={tradeInDocuments?.laudoMecanico || null}
                        onFileChange={(fileData) => setTradeInDocuments({
                          ...tradeInDocuments,
                          laudoMecanico: fileData
                        })}
                        label="Laudo Mecânico (Opcional)"
                        accept="image/*,.pdf"
                        testId="trade-in-laudo-mecanico"
                      />
                    </div>

                    <div className="space-y-2">
                      <FileUploadZone
                        fileData={tradeInDocuments?.crlv || null}
                        onFileChange={(fileData) => setTradeInDocuments({
                          ...tradeInDocuments,
                          crlv: fileData
                        })}
                        label="CRLV (Opcional)"
                        accept="image/*,.pdf"
                        testId="trade-in-crlv"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Entrada Total ({entryPercent}%)</CardDescription>
                  <CardTitle className="text-2xl">R$ {downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardTitle>
                  {tradeInValue > 0 && (
                    <div className="text-xs mt-2 space-y-1">
                      <p className="text-green-600 dark:text-green-400">- Trade-in: R$ {tradeInValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="font-semibold">A pagar: R$ {remainingDownPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  {downPaymentType === "full" ? (
                    <p>100% à vista: R$ {(tradeInValue > 0 ? remainingDownPayment : downPayment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  ) : (
                    <>
                      <p>À vista (70%): R$ {downPaymentCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p>Parcelado (30%): {downPaymentInstallments}x de R$ {downPaymentInstallmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Valor Financiado</CardDescription>
                  <CardTitle className="text-2xl">R$ {financeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardTitle>
                  <p className="text-xs text-muted-foreground">{100 - entryPercent}% do valor do veículo</p>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p>48 parcelas de R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Parcela Mensal</CardDescription>
                  <CardTitle className="text-2xl text-primary">R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardTitle>
                  <p className="text-xs text-muted-foreground">Com juros de {interestRate.toFixed(2)}% a.m.</p>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  <p>Vencimento: Dia {dueDateDay} de cada mês</p>
                  <p className="mt-1">Válido até: {format(simulationValidUntil, "dd/MM/yyyy", { locale: ptBR })}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-2">
              <Button
                variant="outline"
                onClick={() => setCalculationDetailsDialogOpen(true)}
                className="flex-1 w-full"
                data-testid="button-financing-details"
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Detalhamento</span>
              </Button>

              {!isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setProposedVehicleValue(vehicleValue);
                    setProposedDownPaymentType(downPaymentType);
                    setProposedDownPaymentInstallments(downPaymentInstallments);
                    setProposedRateType(selectedRateType);
                    setCounterProposalDialogOpen(true);
                  }}
                  className="flex-1 w-full"
                  data-testid="button-counter-proposal"
                >
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Contra Proposta</span>
                </Button>
              )}

              <Button
                onClick={() => {
                  setFinancingCalculation({
                    vehicleValue,
                    downPaymentType,
                    downPaymentInstallments,
                    interestRate,
                    downPayment,
                    downPaymentCash,
                    downPaymentInstallment,
                    downPaymentInstallmentValue,
                    financeAmount,
                    monthlyPayment,
                    simulationValidUntil,
                    dueDateDay,
                    entryPercent
                  });
                  toast({
                    title: "Cálculo salvo!",
                    description: "Valores do financiamento salvos com sucesso.",
                  });
                }}
                className="flex-1 w-full"
              >
                <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Confirmar Cálculo</span>
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 3: Cadastro do Cliente */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Etapa 3: Cadastro do Cliente</h3>
                <p className="text-sm text-muted-foreground">Dados pessoais, CNH e endereço completo</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomerData({
                    name: "João Silva Santos",
                    cpf: "123.456.789-00",
                    email: "joao.silva@email.com",
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

                  // Preencher dados do avalista
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
                    title: "Dados preenchidos!",
                    description: "Formulário preenchido com dados de teste.",
                  });
                }}
                data-testid="button-fill-test-data"
              >
                Preencher Dados de Teste
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo *</label>
                <Input
                  placeholder="Nome completo"
                  value={customerData?.name || ""}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CPF *</label>
                <Input
                  placeholder="000.000.000-00"
                  value={customerData?.cpf || ""}
                  onChange={(e) => setCustomerData({ ...customerData, cpf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">RG</label>
                <Input
                  placeholder="00.000.000-0"
                  value={customerData?.rg || ""}
                  onChange={(e) => setCustomerData({ ...customerData, rg: e.target.value })}
                  data-testid="input-financing-customer-rg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={customerData?.email || ""}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone *</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={customerData?.phone || ""}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CNH *</label>
                <Input
                  placeholder="Número da CNH"
                  value={customerData?.driverLicense || ""}
                  onChange={(e) => setCustomerData({ ...customerData, driverLicense: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contato de Emergência *</label>
                <Input
                  placeholder="Nome e telefone"
                  value={customerData?.emergencyContact || ""}
                  onChange={(e) => setCustomerData({ ...customerData, emergencyContact: e.target.value })}
                />
              </div>
            </div>

            {/* Campos de Datas */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-md font-semibold mb-3">Datas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Venda</label>
                  <Input
                    type="date"
                    value={customerData?.firstContactDate || ""}
                    onChange={(e) => setCustomerData({ ...customerData, firstContactDate: e.target.value })}
                    data-testid="input-first-contact-date"
                  />
                  <p className="text-xs text-muted-foreground">
                    Data em que a venda foi realizada
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Retirada</label>
                  <Input
                    type="date"
                    value={customerData?.closingDate || ""}
                    onChange={(e) => setCustomerData({ ...customerData, closingDate: e.target.value })}
                    data-testid="input-closing-date"
                  />
                  <p className="text-xs text-muted-foreground">
                    Data de retirada do veículo
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-3">Endereço Completo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Rua *</label>
                  <Input
                    placeholder="Nome da rua e número"
                    value={customerData?.street || ""}
                    onChange={(e) => setCustomerData({ ...customerData, street: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complemento</label>
                  <Input
                    placeholder="Apto, bloco, etc."
                    value={customerData?.complement || ""}
                    onChange={(e) => setCustomerData({ ...customerData, complement: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bairro *</label>
                  <Input
                    placeholder="Bairro"
                    value={customerData?.neighborhood || ""}
                    onChange={(e) => setCustomerData({ ...customerData, neighborhood: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade *</label>
                  <Input
                    placeholder="Cidade"
                    value={customerData?.city || ""}
                    onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado *</label>
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    value={customerData?.state || ""}
                    onChange={(e) => setCustomerData({ ...customerData, state: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CEP *</label>
                  <Input
                    placeholder="00000-000"
                    value={customerData?.zipCode || ""}
                    onChange={(e) => setCustomerData({ ...customerData, zipCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Seção de Avalista - OBRIGATÓRIO */}
            <div className="mt-8 pt-8 border-t-2 border-primary">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-8 bg-primary rounded"></div>
                <h4 className="text-lg font-bold text-primary">Dados do Avalista (Obrigatório)</h4>
              </div>

              <div className="p-6 bg-muted/50 rounded-lg space-y-4">
                <p className="text-sm text-muted-foreground">
                  Todos os financiamentos requerem um avalista. Preencha os dados completos abaixo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome Completo *</label>
                    <Input
                      placeholder="Digite o nome completo"
                      value={guarantorData?.name || ""}
                      onChange={(e) => setGuarantorData({ ...guarantorData, name: e.target.value })}
                      data-testid="input-guarantor-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">CPF *</label>
                    <Input
                      placeholder="000.000.000-00"
                      value={guarantorData?.cpf || ""}
                      onChange={(e) => setGuarantorData({ ...guarantorData, cpf: e.target.value })}
                      data-testid="input-guarantor-cpf"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">RG *</label>
                    <Input
                      placeholder="00.000.000-0"
                      value={guarantorData?.rg || ""}
                      onChange={(e) => setGuarantorData({ ...guarantorData, rg: e.target.value })}
                      data-testid="input-guarantor-rg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={guarantorData?.email || ""}
                      onChange={(e) => setGuarantorData({ ...guarantorData, email: e.target.value })}
                      data-testid="input-guarantor-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefone *</label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={guarantorData?.phone || ""}
                      onChange={(e) => setGuarantorData({ ...guarantorData, phone: e.target.value })}
                      data-testid="input-guarantor-phone"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <h6 className="text-sm font-semibold mb-3">Endereço do Avalista</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Rua *</label>
                      <Input
                        placeholder="Nome da rua"
                        value={guarantorData?.street || ""}
                        onChange={(e) => setGuarantorData({ ...guarantorData, street: e.target.value })}
                        data-testid="input-guarantor-street"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Complemento</label>
                      <Input
                        placeholder="Apto, bloco, etc."
                        value={guarantorData?.complement || ""}
                        onChange={(e) => setGuarantorData({ ...guarantorData, complement: e.target.value })}
                        data-testid="input-guarantor-complement"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bairro *</label>
                      <Input
                        placeholder="Nome do bairro"
                        value={guarantorData?.neighborhood || ""}
                        onChange={(e) => setGuarantorData({ ...guarantorData, neighborhood: e.target.value })}
                        data-testid="input-guarantor-neighborhood"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cidade *</label>
                      <Input
                        placeholder="Nome da cidade"
                        value={guarantorData?.city || ""}
                        onChange={(e) => setGuarantorData({ ...guarantorData, city: e.target.value })}
                        data-testid="input-guarantor-city"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estado *</label>
                      <Input
                        placeholder="UF"
                        maxLength={2}
                        value={guarantorData?.state || ""}
                        onChange={(e) => setGuarantorData({ ...guarantorData, state: e.target.value.toUpperCase() })}
                        data-testid="input-guarantor-state"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">CEP *</label>
                      <Input
                        placeholder="00000-000"
                        value={guarantorData?.zipCode || ""}
                        onChange={(e) => setGuarantorData({ ...guarantorData, zipCode: e.target.value })}
                        data-testid="input-guarantor-zipcode"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Etapa 4: Documentação */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 4: Documentação e Anexos</h3>
              <p className="text-sm text-muted-foreground">Anexe os documentos necessários para análise</p>
            </div>

            <div className="space-y-4">
              <FileUploadZone
                fileData={financingDocuments?.cnh ? { fileName: financingDocuments.cnhFileName || "CNH anexada", fileUrl: financingDocuments.cnh } : null}
                onFileChange={(fileData) => {
                  setFinancingDocuments({
                    ...financingDocuments,
                    cnh: fileData?.fileUrl || null,
                    cnhFileName: fileData?.fileName || null
                  });
                }}
                label="CNH (Carteira de Motorista) *"
                description="PDF ou imagem da CNH do cliente"
                accept="image/*,.pdf"
                testId="financing-cnh-upload"
              />

              <FileUploadZone
                fileData={financingDocuments?.residence ? { fileName: financingDocuments.residenceFileName || "Comprovante anexado", fileUrl: financingDocuments.residence } : null}
                onFileChange={(fileData) => {
                  setFinancingDocuments({
                    ...financingDocuments,
                    residence: fileData?.fileUrl || null,
                    residenceFileName: fileData?.fileName || null
                  });
                }}
                label="Comprovante de Residência *"
                description="PDF ou imagem do comprovante de residência"
                accept="image/*,.pdf"
                testId="financing-residence-upload"
              />

              {/* Seção de Documentos do Avalista */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Documentos do Avalista
                  </CardTitle>
                  <CardDescription>Anexe os documentos do avalista para análise</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUploadZone
                    fileData={financingDocuments?.guarantorDocument ? { fileName: financingDocuments.guarantorDocumentFileName || "Documento anexado", fileUrl: financingDocuments.guarantorDocument } : null}
                    onFileChange={(fileData) => {
                      setFinancingDocuments({
                        ...financingDocuments,
                        guarantorDocument: fileData?.fileUrl || null,
                        guarantorDocumentFileName: fileData?.fileName || null
                      });
                    }}
                    label="Documento com Foto (CNH ou RG) *"
                    description="PDF ou imagem do documento com foto do avalista"
                    accept="image/*,.pdf"
                    testId="financing-guarantor-document-upload"
                  />

                  <FileUploadZone
                    fileData={financingDocuments?.guarantorResidence ? { fileName: financingDocuments.guarantorResidenceFileName || "Comprovante anexado", fileUrl: financingDocuments.guarantorResidence } : null}
                    onFileChange={(fileData) => {
                      setFinancingDocuments({
                        ...financingDocuments,
                        guarantorResidence: fileData?.fileUrl || null,
                        guarantorResidenceFileName: fileData?.fileName || null
                      });
                    }}
                    label="Comprovante de Residência *"
                    description="PDF ou imagem do comprovante de residência do avalista"
                    accept="image/*,.pdf"
                    testId="financing-guarantor-residence-upload"
                  />
                </CardContent>
              </Card>

              {/* Seção de Vídeo Confissão */}
              <Card className="border-secondary/30 bg-secondary/5">
                <CardHeader>
                  <CardTitle className="text-md flex items-center gap-2">
                    <Camera className="h-4 w-4 text-secondary-foreground" />
                    Vídeo de Confissão de Ciência
                  </CardTitle>
                  <CardDescription>Grave um vídeo do cliente confirmando a ciência das condições (ou faça upload de um arquivo de vídeo).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {confessionVideoData?.url ? (
                    <div className="space-y-4">
                      <div className="rounded-lg overflow-hidden bg-black aspect-video relative max-w-[600px] mx-auto">
                        <video
                          key={confessionVideoData.url}
                          src={confessionVideoData.url}
                          controls
                          playsInline
                          preload="auto"
                          className="w-full h-full object-contain bg-black"
                          data-testid="video-confession-preview-wizard"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Vídeo anexado ({confessionVideoData.fileName})
                        </p>
                        <Button
                          variant="destructive" size="sm"
                          onClick={() => setConfessionVideoData(null)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remover Vídeo
                        </Button>
                      </div>
                    </div>
                  ) : isRecordingVideo ? (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-[600px] mx-auto">
                        <video
                          autoPlay
                          muted
                          playsInline
                          ref={(videoElement) => {
                            if (videoElement && webcamStream && videoElement.srcObject !== webcamStream) {
                              videoElement.srcObject = webcamStream;
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          Gravando...
                        </div>
                      </div>
                      <div className="flex justify-center gap-4">
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                              mediaRecorder.stop();
                            }
                          }}
                          disabled={isSavingRecording}
                        >
                          {isSavingRecording ? "Salvando..." : "Parar Gravação e Salvar"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (webcamStream) webcamStream.getTracks().forEach(track => track.stop());
                            setIsRecordingVideo(false);
                            setWebcamStream(null);
                          }}
                          disabled={isSavingRecording}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-24 flex-col gap-2"
                        onClick={() => setConfirmVideoRecordOpen(true)}
                      >
                        <Camera className="h-6 w-6" />
                        Gravar com WebCam
                      </Button>
                      <div className="flex flex-col h-24 relative border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors items-center justify-center cursor-pointer">
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                          <span>Anexar Vídeo</span>
                        </div>
                        <input
                          type="file"
                          accept="video/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setConfessionVideoData({ blob: file, url, fileName: file.name });
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {financingDocuments?.others && financingDocuments.others.length > 0 && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Outros Documentos Anexados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {financingDocuments.others.map((doc: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                          <span className="text-sm">{financingDocuments.othersFileNames?.[index] || `Documento ${index + 1}`}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newOthers = [...financingDocuments.others];
                              const newOthersFileNames = [...(financingDocuments.othersFileNames || [])];
                              newOthers.splice(index, 1);
                              newOthersFileNames.splice(index, 1);
                              setFinancingDocuments({
                                ...financingDocuments,
                                others: newOthers,
                                othersFileNames: newOthersFileNames
                              });
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Garantias e Outros Documentos (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;

                      try {
                        const results = await Promise.all(
                          files.map(file => processFileUpload(file))
                        );
                        const fileNames = files.map(file => file.name);
                        setFinancingDocuments({
                          ...financingDocuments,
                          others: [...(financingDocuments.others || []), ...results],
                          othersFileNames: [...(financingDocuments.othersFileNames || []), ...fileNames]
                        });
                        toast({
                          title: "Documentos anexados",
                          description: `${files.length} documento(s) adicionado(s) com sucesso.`,
                        });
                        e.target.value = '';
                      } catch (error) {
                        console.error('Erro ao processar arquivos:', error);
                        toast({
                          title: "Erro ao processar arquivos",
                          description: "Ocorreu um erro ao anexar os documentos.",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-2">Selecione múltiplos arquivos se necessário</p>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={async () => {
                if (!selectedVehicle || !financingCalculation) {
                  toast({
                    title: "Erro",
                    description: "Selecione um veículo e configure os valores primeiro.",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  // Calcular tabela de amortização
                  const amortizationTable = [];
                  let balance = financingCalculation.financeAmount;
                  const startDate = new Date();

                  for (let i = 1; i <= 48; i++) {
                    const interest = balance * (financingCalculation.interestRate / 100);
                    const amortization = financingCalculation.monthlyPayment - interest;
                    balance -= amortization;

                    const dueDate = new Date(startDate);
                    dueDate.setMonth(dueDate.getMonth() + i);
                    dueDate.setDate(financingCalculation.dueDateDay || 10);

                    // Desconto progressivo para antecipação (mesma lógica da calculadora)
                    const discountPercentage = Math.min(5, (48 - i) * 0.12);
                    const discountedPayment = financingCalculation.monthlyPayment * (1 - discountPercentage / 100);

                    amortizationTable.push({
                      installment: i,
                      dueDate: dueDate.toISOString(),
                      interest,
                      amortization,
                      balance: Math.max(0, balance),
                      payment: financingCalculation.monthlyPayment,
                      discountPercentage,
                      discountedPayment
                    });
                  }

                  // Preparar dados para a API
                  const proposalData = {
                    customer: customerData,
                    vehicle: selectedVehicle,
                    vehicleValue: financingCalculation.vehicleValue,
                    interestRate: financingCalculation.interestRate,
                    term: 48,
                    startDate: new Date().toISOString(),
                    dueDay: financingCalculation.dueDateDay || 10,
                    summary: {
                      downPaymentTotal: financingCalculation.downPayment,
                      downPaymentCash: financingCalculation.downPaymentCash,
                      downPaymentFinanced: financingCalculation.downPaymentInstallment,
                      downPaymentInstallments: financingCalculation.downPaymentInstallments,
                      downPaymentInstallmentValue: financingCalculation.downPaymentInstallmentValue,
                      principal: financingCalculation.financeAmount,
                      monthlyInstallment: financingCalculation.monthlyPayment,
                      installments: 48,
                      totalCost: financingCalculation.downPayment + (financingCalculation.monthlyPayment * 48),
                      totalInterest: (financingCalculation.monthlyPayment * 48) - financingCalculation.financeAmount
                    },
                    amortizationTable
                  };

                  // Chamar API para gerar PDF
                  const response = await fetch('/api/financings/generate-proposal', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(proposalData),
                  });

                  if (!response.ok) {
                    throw new Error('Erro ao gerar proposta');
                  }

                  // Fazer download do PDF e salvar no estado
                  const blob = await response.blob();
                  const fileName = `proposta-financiamento-${customerData?.name?.replace(/\s+/g, '-')?.toLowerCase() || 'cliente'}.pdf`;

                  // Converter blob para base64 para salvar no estado
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64data = reader.result as string;
                    setProposalPdfData({
                      fileName,
                      fileUrl: base64data
                    });
                  };
                  reader.readAsDataURL(blob);

                  // Baixar o arquivo também
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);

                  toast({
                    title: "Proposta gerada e salva!",
                    description: "PDF baixado e salvo nos dados do financiamento.",
                  });
                } catch (error) {
                  console.error('Erro ao gerar proposta:', error);
                  toast({
                    title: "Erro ao gerar proposta",
                    description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
                    variant: "destructive",
                  });
                }
              }}
              className="w-full"
              data-testid="button-generate-proposal"
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerar e Baixar Proposta (PDF)
            </Button>

            {/* Proposta em PDF Gerada */}
            {proposalPdfData?.fileUrl && (
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-100">Proposta de Financiamento Gerada</p>
                        <p className="text-sm text-muted-foreground mt-1">{proposalPdfData.fileName}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Proposta com tabela de amortização salva com sucesso
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Baixar PDF novamente
                          const link = document.createElement('a');
                          link.href = proposalPdfData.fileUrl;
                          link.download = proposalPdfData.fileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        data-testid="button-download-saved-proposal-pdf"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Deseja refazer a proposta de financiamento?')) {
                            setProposalPdfData(null);
                          }
                        }}
                        data-testid="button-redo-proposal-pdf"
                      >
                        Refazer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Etapa 6: Contrato */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 6: Contrato de Financiamento</h3>
              <p className="text-sm text-muted-foreground">Gerar ou fazer upload do contrato</p>
            </div>

            {contractData?.fileUrl ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <FileText className="h-12 w-12 text-primary mb-2" />
                      <p className="font-medium">{contractData.fileName}</p>
                      <p className="text-sm text-muted-foreground">Contrato anexado</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setContractData(null)}
                    >
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium">Upload do Contrato</label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await processFileUpload(file);
                            setContractData({
                              fileName: file.name,
                              fileUrl: base64
                            });
                          } catch (error) {
                            console.error('Erro ao processar arquivo:', error);
                          }
                        }
                      }}
                      className="mt-2"
                    />
                  </div>

                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">ou</p>
                  </div>

                  <Button
                    onClick={async () => {
                      try {
                        // Preparar dados do financiamento
                        const financingData = {
                          customerName: customerData?.name,
                          customerCpf: customerData?.cpf,
                          customerRg: customerData?.rg,
                          customerPhone: customerData?.phone,
                          customerEmail: customerData?.email,
                          customerStreet: customerData?.street,
                          customerComplement: customerData?.complement,
                          customerNeighborhood: customerData?.neighborhood,
                          customerCity: customerData?.city,
                          customerState: customerData?.state,
                          customerZipCode: customerData?.zipCode,
                          guarantorName: guarantorData?.name,
                          guarantorCpf: guarantorData?.cpf,
                          guarantorRg: guarantorData?.rg,
                          guarantorPhone: guarantorData?.phone,
                          guarantorEmail: guarantorData?.email,
                          guarantorStreet: guarantorData?.street,
                          guarantorComplement: guarantorData?.complement,
                          guarantorNeighborhood: guarantorData?.neighborhood,
                          guarantorCity: guarantorData?.city,
                          guarantorState: guarantorData?.state,
                          guarantorZipCode: guarantorData?.zipCode,
                          vehicleValue: financingCalculation?.vehicleValue,
                          monthlyPayment: financingCalculation?.monthlyPayment,
                          downPaymentCash: financingCalculation?.downPaymentCash,
                          paymentDueDate: financingCalculation?.dueDateDay,
                          tradeInAcceptanceStatus: tradeInAcceptanceStatus,
                          tradeInVehicle: (tradeInAcceptanceStatus === "accepted" && tradeInVehicleData) ? {
                            brand: tradeInVehicleData.brand,
                            model: tradeInVehicleData.model,
                            year: tradeInVehicleData.year,
                            plate: tradeInVehicleData.plate,
                            mileage: tradeInVehicleData.mileage,
                            category: tradeInVehicleData.category,
                            fipeValue: tradeInFipeValue,
                            acceptedValue: tradeInAcceptedValue,
                          } : null,
                        };

                        const vehicleData = {
                          brand: selectedVehicle?.brand,
                          model: selectedVehicle?.model,
                          year: selectedVehicle?.year,
                          licensePlate: selectedVehicle?.licensePlate,
                          color: selectedVehicle?.color,
                          renavam: selectedVehicle?.renavam,
                          chassisNumber: selectedVehicle?.chassisNumber,
                          mileage: selectedVehicle?.mileage,
                          hasInsurance: selectedVehicle?.hasInsurance,
                          insuranceValue: selectedVehicle?.insuranceValue,
                          ipvaStatus: selectedVehicle?.ipvaStatus,
                          ipvaValue: selectedVehicle?.ipvaValue,
                        };

                        // Fazer chamada à API
                        const response = await fetch('/api/financings/generate-contract-docx', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            financingData,
                            vehicleData,
                            paymentProof: paymentData?.cashProofUrl || null,
                          }),
                        });

                        if (!response.ok) {
                          throw new Error('Erro ao gerar contrato');
                        }

                        // Fazer download do arquivo
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `contrato-${customerData?.name?.replace(/\s+/g, '-') || 'cliente'}.docx`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);

                        toast({
                          title: "Contrato gerado!",
                          description: "O contrato foi gerado e baixado com sucesso.",
                        });
                      } catch (error) {
                        console.error('Erro ao gerar contrato:', error);
                        toast({
                          title: "Erro ao gerar contrato",
                          description: "Não foi possível gerar o contrato. Verifique os dados e tente novamente.",
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid="button-generate-contract-docx"
                  >
                    Gerar Contrato Automaticamente
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Etapa 5: Pagamento */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Etapa 5: Formalização do Pagamento</h3>
              <p className="text-sm text-muted-foreground">Registro das formas de pagamento conforme acordo</p>
            </div>

            {/* Resumo dos Valores Acordados */}
            <Card className="bg-muted/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Valores Acordados</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Restaurar valores da calculadora
                      if (financingCalculation) {
                        setVehicleValue(financingCalculation.vehicleValue);
                        setDownPaymentType(financingCalculation.downPaymentType);
                        setDownPaymentInstallments(financingCalculation.downPaymentInstallments);
                        setDueDateDay(financingCalculation.dueDateDay || 10);

                        // Encontrar qual selectedRateType corresponde à taxa salva
                        const savedRate = financingCalculation.interestRate;
                        let rateType = 1;
                        Object.entries(rateSettings).forEach(([key, value]) => {
                          if (Math.abs(value - savedRate) < 0.01) {
                            rateType = parseInt(key.replace('rate', ''));
                          }
                        });
                        setSelectedRateType(rateType);
                      }
                      // Voltar para a etapa da calculadora
                      setCurrentStep(2);
                      toast({
                        title: "Modo de edição",
                        description: "Ajuste os valores e confirme novamente o cálculo.",
                      });
                    }}
                    data-testid="button-edit-calculation"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Editar Valores
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Valor do Veículo:</p>
                    <p className="font-bold text-lg">R$ {financingCalculation?.vehicleValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa de Juros:</p>
                    <p className="font-bold text-lg">{(financingCalculation?.interestRate || 0).toFixed(2)}% a.m.</p>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Entrada Total ({financingCalculation?.entryPercent || entryPercent}%):</span>
                    <span className="font-bold">R$ {financingCalculation?.downPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                  </div>
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-xs text-muted-foreground">• À vista ({financingCalculation?.downPaymentType === 'full' ? '100%' : '70%'}):</span>
                    <span className="font-semibold text-sm">R$ {financingCalculation?.downPaymentCash?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                  </div>
                  {financingCalculation?.downPaymentType === 'split' && (
                    <>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-xs text-muted-foreground">• Parcelado (30%):</span>
                        <span className="font-semibold text-sm">R$ {financingCalculation?.downPaymentInstallment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span className="text-xs text-muted-foreground">• {financingCalculation?.downPaymentInstallments}x de:</span>
                        <span className="font-semibold text-sm">R$ {financingCalculation?.downPaymentInstallmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Financiamento Principal (80%):</span>
                    <span className="font-bold">R$ {financingCalculation?.financeAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                  </div>
                  <div className="flex justify-between items-center pl-4 mt-1">
                    <span className="text-xs text-muted-foreground">• 48 parcelas de:</span>
                    <span className="font-semibold text-sm">R$ {financingCalculation?.monthlyPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pagamento da Entrada à Vista */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Pagamento da Entrada à Vista
                </CardTitle>
                <CardDescription>
                  Valor: R$ {financingCalculation?.downPaymentCash?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de Pagamento *</label>
                    <Select
                      value={paymentData?.cashPaymentMethod || ""}
                      onValueChange={(v) => setPaymentData({ ...paymentData, cashPaymentMethod: v })}
                    >
                      <SelectTrigger data-testid="select-cash-payment-method">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão de Débito</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data do Pagamento</label>
                    <Input
                      type="date"
                      value={paymentData?.cashPaymentDate || ""}
                      onChange={(e) => setPaymentData({ ...paymentData, cashPaymentDate: e.target.value })}
                      data-testid="input-cash-payment-date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Comprovante de Pagamento</label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const base64 = await processFileUpload(file);
                          setPaymentData({
                            ...paymentData,
                            cashProofUrl: base64,
                            cashProofFileName: file.name
                          });
                        } catch (error) {
                          console.error('Erro ao processar arquivo:', error);
                        }
                      }
                    }}
                    data-testid="input-cash-proof"
                  />
                  {paymentData?.cashProofFileName && (
                    <p className="text-xs text-muted-foreground mt-1">Anexado: {paymentData.cashProofFileName}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pagamento da Entrada Parcelada (se aplicável) */}
            {financingCalculation?.downPaymentType === 'split' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Forma de Pagamento das Parcelas da Entrada
                  </CardTitle>
                  <CardDescription>
                    {financingCalculation?.downPaymentInstallments}x de R$ {financingCalculation?.downPaymentInstallmentValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'} (Total: R$ {financingCalculation?.downPaymentInstallment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma de Pagamento das Parcelas *</label>
                    <Select
                      value={paymentData?.installmentPaymentMethod || ""}
                      onValueChange={(v) => setPaymentData({ ...paymentData, installmentPaymentMethod: v })}
                    >
                      <SelectTrigger data-testid="select-installment-payment-method">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="boleto">Boleto Bancário</SelectItem>
                        <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                        <SelectItem value="cheque_pre">Cheque Pré-Datado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Observações sobre o Parcelamento</label>
                    <Textarea
                      placeholder="Ex: Cartão final 1234, vencimento todo dia 15..."
                      value={paymentData?.installmentNotes || ""}
                      onChange={(e) => setPaymentData({ ...paymentData, installmentNotes: e.target.value })}
                      rows={2}
                      data-testid="textarea-installment-notes"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informações sobre o Financiamento Principal */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Financiamento Principal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Saldo Financiado:</span>{' '}
                    <span className="font-bold">R$ {financingCalculation?.financeAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Parcelas:</span>{' '}
                    <span className="font-bold">48x de R$ {financingCalculation?.monthlyPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    ℹ️ As parcelas do financiamento principal serão cobradas mensalmente com vencimento no dia {financingCalculation?.dueDateDay || 10} de cada mês.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Observações Gerais */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações Gerais do Pagamento</label>
              <Textarea
                placeholder="Informações adicionais sobre o processo de pagamento..."
                value={paymentData?.generalNotes || ""}
                onChange={(e) => setPaymentData({ ...paymentData, generalNotes: e.target.value })}
                rows={3}
                data-testid="textarea-general-notes"
              />
            </div>

            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Todas as etapas foram preenchidas! Clique em "Finalizar" para registrar o financiamento.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 pb-8 border-t mt-8">
        {currentStep > 1 ? (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            data-testid="button-wizard-previous"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        ) : <div className="hidden sm:block" />}
        {currentStep < 6 ? (
          <Button
            onClick={() => {
              if (validateStep(currentStep)) {
                setCurrentStep(currentStep + 1);
              }
            }}
            className="w-full sm:w-auto"
            data-testid="button-wizard-next"
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              if (!validateStep(6)) {
                return;
              }

              // Debug: Log completo dos dados antes da mutação
              console.log('[WIZARD] Dados antes da mutação:', {
                financingDocuments,
                paymentData,
                proposalPdfData, // Verificar se não está vazando para outros lugares
              });

              createFinancingMutation.mutate({
                customerData,
                hasGuarantor: true, // Avalista sempre obrigatório em financiamentos
                guarantorData,
                vehicleId: selectedVehicle?.id,
                financingCalculation,
                financingDocuments,
                checkInPhotos,
                vehicleChecklist,
                inspectionPdfData,
                contractData,
                paymentData,
                tradeInVehicleData,
                tradeInAcceptanceStatus,
                tradeInFipeValue,
                tradeInAcceptedValue,
                tradeInDocuments,
              }, {
                onSuccess: async (data: any) => {
                  if (confessionVideoData?.blob) {
                    toast({
                      title: "Salvando vídeo de confissão...",
                      description: "Aguarde enquanto o vídeo é enviado.",
                    });
                    try {
                      await uploadVideoFile(data.id, confessionVideoData.blob, (progress) => {
                        console.log(progress); // Optional console progress
                      });
                      toast({
                        title: "Vídeo salvo!",
                        description: "O vídeo de confissão foi anexado ao financiamento com sucesso.",
                      });
                    } catch (error) {
                      console.error("Erro no upload do vídeo", error);
                      toast({
                        title: "Vídeo salvo parcialmente",
                        description: "O financiamento foi concluído, mas houve um erro no envio do vídeo de confissão.",
                        variant: "destructive"
                      });
                    }
                  }

                  invalidate.financings();
                  invalidate.vehicles();
                  invalidate.customers();
                  toast({
                    title: "Financiamento criado!",
                    description: "Financiamento registrado com sucesso.",
                  });
                  resetWizard();
                }
              });
            }}
            disabled={createFinancingMutation.isPending}
          >
            {createFinancingMutation.isPending ? "Salvando..." : "Finalizar"}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Dialog de Detalhamento do Financiamento */}
      <Dialog open={calculationDetailsDialogOpen} onOpenChange={setCalculationDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Detalhamento do Financiamento</DialogTitle>
            <DialogDescription>
              Resumo completo dos valores e condições calculadas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Informações do Veículo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Veículo Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelo:</span>
                  <span className="font-semibold">{selectedVehicle?.name || "Não selecionado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor do Veículo:</span>
                  <span className="font-bold text-lg">
                    R$ {vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Trade-in */}
            {hasTradeIn && tradeInAcceptanceStatus === "accepted" && tradeInValue > 0 && (
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="h-5 w-5 text-blue-600" />
                    Veículo de Troca
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Aceito:</span>
                    <span className="font-bold text-blue-600">
                      R$ {tradeInValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {excessTradeIn > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Excedente (desconto adicional):</span>
                      <span className="font-bold text-green-600">
                        R$ {excessTradeIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Entrada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Entrada ({financingCalculation?.entryPercent || entryPercent}% do valor)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Entrada Total:</span>
                  <span className="font-bold">
                    R$ {downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {tradeInValue > 0 && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-muted-foreground">(-) Trade-in:</span>
                    <span className="text-blue-600">
                      - R$ {Math.min(tradeInValue, downPayment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Entrada Restante:</span>
                  <span className="text-primary">
                    R$ {remainingDownPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="mt-4 space-y-2 bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Entrada à Vista (70%):</span>
                    <span className="font-semibold">
                      R$ {downPaymentCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {downPaymentType === "split" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Entrada Parcelada (30%):</span>
                        <span className="font-semibold">
                          R$ {downPaymentInstallment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm text-muted-foreground">
                          Parcelas da Entrada ({downPaymentInstallments}x):
                        </span>
                        <span className="font-bold text-primary">
                          R$ {downPaymentInstallmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        * Taxa de 8,1% sobre a entrada parcelada
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Financiamento */}
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Condições do Financiamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Valor a Financiar:</span>
                  <span className="font-bold text-primary">
                    R$ {financeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Juros (ao mês):</span>
                  <span className="font-semibold">{interestRate.toFixed(2)}%</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prazo:</span>
                  <span className="font-semibold">48 meses</span>
                </div>

                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Parcela Mensal:</span>
                  <span className="text-primary">
                    R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dia de Vencimento:</span>
                  <span className="font-medium">Dia {dueDateDay || 10}</span>
                </div>
              </CardContent>
            </Card>

            {/* Resumo Final */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Resumo Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor do Veículo:</span>
                  <span>R$ {vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entrada à Vista:</span>
                  <span>R$ {downPaymentCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {downPaymentType === "split" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entrada Parcelada ({downPaymentInstallments}x):</span>
                    <span>
                      {downPaymentInstallments}x R$ {downPaymentInstallmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Financiamento (48x):</span>
                  <span>
                    48x R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {simulationValidUntil && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Simulação válida até: {format(new Date(simulationValidUntil), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Contra Proposta */}
      <Dialog open={counterProposalDialogOpen} onOpenChange={setCounterProposalDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Solicitar Contra Proposta de Financiamento</DialogTitle>
            <DialogDescription>
              Proponha valores alternativos para aprovação do gerente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Informações do Cliente e Veículo */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliente:</p>
                    <p className="font-semibold">{customerData?.name || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Veículo:</p>
                    <p className="font-semibold">{selectedVehicle?.name || "Não selecionado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna Esquerda - Valores Originais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Valores Originais</h3>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Valor do Veículo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      R$ {vehicleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Entrada Total ({proposedDownPayment > 0 ? entryPercent : 20}%)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xl font-bold">
                      R$ {downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="text-xs space-y-1">
                      <p>À vista: R$ {downPaymentCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      {downPaymentType === "split" && (
                        <p>Parcelado: {downPaymentInstallments}x de R$ {downPaymentInstallmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Financiamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor financiado:</span>
                      <span className="font-semibold">R$ {financeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de juros:</span>
                      <span className="font-semibold">{interestRate.toFixed(2)}% a.m.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Parcela mensal:</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna Direita - Valores Propostos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Valores Propostos</h3>

                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Valor do Veículo Proposto (R$)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CurrencyInput
                      value={proposedVehicleValue}
                      onChange={(value) => setProposedVehicleValue(parseFloat(value) || 0)}
                      placeholder="Ex: 50.000,00"
                      data-testid="input-proposed-vehicle-value"
                    />
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Tipo de Entrada Proposta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={proposedDownPaymentType} onValueChange={(v: any) => setProposedDownPaymentType(v)}>
                      <SelectTrigger data-testid="select-proposed-down-payment-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="split">70% à vista + 30% parcelado</SelectItem>
                        <SelectItem value="full">100% à vista</SelectItem>
                      </SelectContent>
                    </Select>

                    {proposedDownPaymentType === "split" && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Parcelas da Entrada</label>
                        <Select
                          value={proposedDownPaymentInstallments.toString()}
                          onValueChange={(v) => setProposedDownPaymentInstallments(Number(v))}
                        >
                          <SelectTrigger data-testid="select-proposed-installments">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                              <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Taxa de Juros Proposta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={proposedRateType.toString()} onValueChange={(v) => setProposedRateType(Number(v))}>
                      <SelectTrigger data-testid="select-proposed-rate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            Taxa {n}: {rateSettings[`rate${n}` as keyof typeof rateSettings].toFixed(2)}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Resumo da Proposta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entrada total:</span>
                      <span className="font-semibold">R$ {proposedDownPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor a financiar:</span>
                      <span className="font-semibold">R$ {proposedFinanceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Parcela mensal:</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {proposedMonthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Comparativo */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Comparativo de Valores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Entrada Total</p>
                    <p className="text-sm line-through text-muted-foreground">
                      R$ {downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      R$ {proposedDownPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Valor Financiado</p>
                    <p className="text-sm line-through text-muted-foreground">
                      R$ {financeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      R$ {proposedFinanceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Parcela Mensal</p>
                    <p className="text-sm line-through text-muted-foreground">
                      R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      R$ {proposedMonthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Justificativa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Justificativa da Contra Proposta {(userRole !== 'admin' && userRole !== 'manager') && '*'}
                </CardTitle>
                <CardDescription>
                  {(userRole === 'admin' || userRole === 'manager')
                    ? 'Justificativa opcional para administradores'
                    : 'Explique o motivo da alteração dos valores propostos (obrigatório para vendedores)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={(userRole === 'admin' || userRole === 'manager')
                    ? 'Justificativa opcional...'
                    : 'Explique o motivo da contra proposta, incluindo o contexto da negociação com o cliente...'}
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  rows={4}
                  data-testid="textarea-proposal-notes"
                />
              </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCounterProposalDialogOpen(false);
                  setProposalNotes("");
                }}
                data-testid="button-cancel-proposal"
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitProposal}
                disabled={createProposalMutation.isPending}
                data-testid="button-submit-proposal"
                className="w-full sm:w-auto"
              >
                {createProposalMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {(userRole === 'admin' || userRole === 'manager')
                      ? 'Confirmar Proposta'
                      : 'Enviar Proposta para Aprovação'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approved Proposal Alert */}
      <Dialog open={approvedProposalAlertOpen} onOpenChange={setApprovedProposalAlertOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Proposta Aprovada!</DialogTitle>
            <DialogDescription>
              Você tem uma proposta de financiamento aprovada pelo gerente. Deseja carregar os dados para continuar?
            </DialogDescription>
          </DialogHeader>

          {approvedProposal && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Detalhes da Proposta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <span className="font-medium">Cliente:</span> {approvedProposal.customerName}
                    </div>
                    <div>
                      <span className="font-medium">Veículo:</span> {approvedProposal.vehicleName}
                    </div>
                    <div>
                      <span className="font-medium">CPF:</span> {approvedProposal.customerCpf}
                    </div>
                    <div>
                      <span className="font-medium">Telefone:</span> {approvedProposal.customerPhone}
                    </div>
                  </div>

                  {approvedProposal.adminNotes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="font-medium text-xs mb-1">Observações do Gerente:</p>
                      <p className="text-muted-foreground">{approvedProposal.adminNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (approvedProposal?.id) {
                      dismissProposalMutation.mutate(approvedProposal.id);
                    }
                  }}
                  disabled={dismissProposalMutation.isPending}
                  className="flex-1"
                  data-testid="button-dismiss-approved-proposal"
                >
                  {dismissProposalMutation.isPending ? "Processando..." : "Talvez Mais Tarde"}
                </Button>
                <Button
                  onClick={loadApprovedProposal}
                  className="flex-1"
                  data-testid="button-load-approved-proposal"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Carregar Proposta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Gravação de Vídeo */}
      <Dialog open={confirmVideoRecordOpen} onOpenChange={setConfirmVideoRecordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Gravar com WebCam
            </DialogTitle>
            <DialogDescription className="pt-2">
              Deseja começar a gravar o vídeo? O navegador vai pedir acesso à sua câmera e microfone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmVideoRecordOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                setConfirmVideoRecordOpen(false);
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                  setWebcamStream(stream);
                  setIsRecordingVideo(true);
                  setIsSavingRecording(false);
                  setRecordedChunks([]);

                  const mimePreferences = [
                    'video/webm;codecs=vp9,opus',
                    'video/webm;codecs=vp8,opus',
                    'video/webm',
                    'video/mp4'
                  ];

                  let selectedMimeType = '';
                  for (const mime of mimePreferences) {
                    if (MediaRecorder.isTypeSupported(mime)) {
                      selectedMimeType = mime;
                      break;
                    }
                  }

                  const recorderOptions = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
                  const recorder = new MediaRecorder(stream, recorderOptions);

                  const chunks: Blob[] = [];
                  recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) chunks.push(e.data);
                  };

                  recorder.onstop = () => {
                    setIsSavingRecording(true);
                    stream.getTracks().forEach(track => track.stop());
                    setWebcamStream(null);

                    const finalMimeType = chunks[0]?.type || selectedMimeType || 'video/webm';
                    const blob = new Blob(chunks, { type: finalMimeType });
                    setRecordedChunks([]);

                    const url = URL.createObjectURL(blob);
                    const extension = finalMimeType.includes('mp4') ? 'mp4' : 'webm';

                    setConfessionVideoData({ blob, url, fileName: `video_gravado.${extension}` });
                    setIsRecordingVideo(false);
                    setIsSavingRecording(false);
                    toast({
                      title: "Vídeo gravado",
                      description: "Seu vídeo foi processado corretamente e está pronto para análise."
                    });
                  };

                  setMediaRecorder(recorder);
                  recorder.start();
                } catch (error) {
                  toast({
                    title: "Erro ao acessar câmera",
                    description: "Verifique se a câmera está conectada e permita o acesso.",
                    variant: "destructive"
                  });
                }
              }}
            >
              Começar Gravação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
