import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, TrendingUp, Phone, Mail, Plus, Minus, Calendar, ChevronDown, Car, DollarSign, HandCoins, User, Camera, FileText, CreditCard, Check, ArrowLeft, ArrowRight, X, Settings, Calculator, Trash2, Zap, Star, Gift, Edit, Eye, EyeOff, Download, Target, AlertCircle, ClipboardList, Loader2, CheckCircle, XCircle, Shield, Briefcase, UserCheck, Wallet, Key, Video, ImageIcon, ArrowLeftRight, PanelLeftClose, PanelLeft, LayoutDashboard, LogOut, ArrowDownCircle } from "lucide-react";
import type { Lead, Rental } from "@shared/schema";
import { insertLeadSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect, useRef, useMemo } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/currency";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { processFileUpload, compressImage } from "./crm/utils/fileUtils";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { formatCPF, formatPhone, formatCEP, formatCNPJ } from "./crm/utils/formatters";
import type { FipeBrand, FipeModel, FipeYear, FipePrice } from "./crm/utils/fipeApi";
import { fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipePrice, parseFipePrice } from "./crm/utils/fipeApi";
import SignatureCanvas from "./crm/components/shared/SignatureCanvas";
import placeholderLogo from "@assets/logo_imobile_1765389205488.png";
import { downloadDocument } from "@/lib/admin-utils";

import ContractStep from "./crm/components/shared/ContractStep";
import FileUploadZone from "./crm/components/shared/FileUploadZone";
import PhotoUploadZone from "./crm/components/shared/PhotoUploadZone";
import ChecklistRenderer from "./crm/components/shared/ChecklistRenderer";
import PhotoGallery from "./crm/components/shared/PhotoGallery";
import StatusBadge from "./crm/components/shared/StatusBadge";
import LeadManagement from "./crm/domains/leads/LeadManagement";
import CustomerManagement from "./crm/domains/customers/CustomerManagement";
import InvestorManagement from "./crm/domains/investors/InvestorManagement";
import VehicleManagement from "./crm/domains/vehicles/VehicleManagement";
import { CrmDataProvider, useCrmData } from "./crm/context/CrmDataProvider";
import { RentalWizardProvider } from "./crm/domains/rentals/RentalWizardContext";
import RentalWizard from "./crm/domains/rentals/RentalWizard";
import { FinancingWizardProvider } from "./crm/domains/financing/FinancingWizardContext";
import FinancingWizard from "./crm/domains/financing/FinancingWizard";

// Componente interno que usa os dados do CRM
function CRMContent() {
  const [, setLocation] = useLocation();
  const [newSaleDialogOpen, setNewSaleDialogOpen] = useState(false);
  const [saleType, setSaleType] = useState<"rental" | "investment" | "financing" | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Dados do CRM
  const { 
    leads, 
    auditLogs, 
    customerEvents, 
    isLoading: crmLoading, 
    refetch 
  } = useCrmData();
  const { toast } = useToast();

  // Handle query parameter to open investment wizard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openInvestment') === 'true') {
      setSaleType("investment");
      setNewSaleDialogOpen(true);
      setCurrentStep(1);
      // Clean up URL without refreshing
      window.history.replaceState({}, '', '/admin/crm');
    }
  }, []);



  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    markAsViewed(value);
    
    // Disparar carregamento sob demanda via contexto
    if (value === "eventos") {
      refetch.customerEvents();
    } else if (value === "configuracoes") {
      refetch.auditLogs();
    }
  };

  // Filtros para a lista de contratos
  const [filterName, setFilterName] = useState("");
  const [filterCpf, setFilterCpf] = useState("");
  const [filterPlate, setFilterPlate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Filtros para usuários
  const [userFilterName, setUserFilterName] = useState("");
  const [userFilterEmail, setUserFilterEmail] = useState("");
  const [userFilterCpf, setUserFilterCpf] = useState("");
  const [userFilterRole, setUserFilterRole] = useState("");

  // Estados para gerenciamento de planos de aluguel
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planFormData, setPlanFormData] = useState<any>({});

  // Estado para gerenciamento de bonificação
  const [bonusDialogOpen, setBonusDialogOpen] = useState<Record<string, boolean>>({});

  // Estados para gerenciamento de finalização de alugu éis
  const [finalizationDialogOpen, setFinalizationDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [finalizationStep, setFinalizationStep] = useState(1); // 1: Checkout, 2: Checkpoint, 3: Encerramento
  const [checkoutData, setCheckoutData] = useState<any>({
    checkOutImages: [],
    tirePhotos: [],
    checkOutNotes: "",
    hasDamages: false,
    damagesDescription: ""
  });
  const [checkpointData, setCheckpointData] = useState<any>({
    tiresSame: null,
    fuelSame: null,
    hasDamages: null,
    damagesNotes: "",
    repairCost: ""
  });
  const [finalizationData, setFinalizationData] = useState<any>({
    debtAmount: "",
    paymentMethod: "",
    contractUrl: ""
  });
  const [isFinalizingContract, setIsFinalizingContract] = useState(false);

  // Estados para histórico do veículo
  const [vehicleHistoryDialogOpen, setVehicleHistoryDialogOpen] = useState(false);
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<any>(null);
  const [newEventDialogOpen, setNewEventDialogOpen] = useState(false);
  const [newEventData, setNewEventData] = useState<any>({
    type: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    severity: "media",
    cost: ""
  });
  const [eventDetailsDialogOpen, setEventDetailsDialogOpen] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<any>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  // Estados para registro de avarias
  const [registerDamageDialogOpen, setRegisterDamageDialogOpen] = useState(false);
  const [damageFormData, setDamageFormData] = useState<any>({
    rentalId: "",
    repairCost: "",
    damagesNotes: "",
    photos: []
  });

  // Estados para aba Eventos (Fleet Events)
  const [fleetEventDialogOpen, setFleetEventDialogOpen] = useState(false);
  const [editingFleetEvent, setEditingFleetEvent] = useState<any>(null);
  const [fleetEventFormData, setFleetEventFormData] = useState<any>({
    customerId: "",
    vehicleId: "",
    type: "",
    title: "",
    description: "",
    incidentType: "",
    status: "aberto",
    severity: "media",
    cost: "",
    paymentMethod: "",
    insuranceClaim: false,
    franchiseValue: "",
    insuranceCompany: "",
    claimNumber: "",
    workshopStatus: ""
  });

  // Estado para busca de veículos
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");

  // Estado para veículo selecionado
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Estados para assinaturas digitais e PDF de vistoria
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [customerSignature, setCustomerSignature] = useState<string>("");
  const [inspectorSignature, setInspectorSignature] = useState<string>("");
  const [currentSignatureType, setCurrentSignatureType] = useState<"customer" | "inspector">("customer");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [inspectionPdfData, setInspectionPdfData] = useState<{ fileName: string; fileUrl: string } | null>(null);

  // Estados para gerenciamento de cotas de investimento
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [editingQuota, setEditingQuota] = useState<any>(null);
  const [quotaFormData, setQuotaFormData] = useState<any>({});
  const [calculatingDividends, setCalculatingDividends] = useState(false);

  // Estados para consulta FIPE de dividendos
  const [fipeCalculatorDialogOpen, setFipeCalculatorDialogOpen] = useState(false);
  const [fipeBrands, setFipeBrands] = useState<any[]>([]);
  const [fipeModels, setFipeModels] = useState<any[]>([]);
  const [fipeYears, setFipeYears] = useState<any[]>([]);
  const [selectedFipeBrand, setSelectedFipeBrand] = useState<string>("");
  const [selectedFipeModel, setSelectedFipeModel] = useState<string>("");
  const [selectedFipeYear, setSelectedFipeYear] = useState<string>("");
  const [selectedFipeCategory, setSelectedFipeCategory] = useState<string>("");
  const [loadingFipeData, setLoadingFipeData] = useState(false);
  const [consultedFipeValue, setConsultedFipeValue] = useState<string>("");
  const [calculatedDividend, setCalculatedDividend] = useState<string>("");

  // Estados específicos para wizard de investimento
  const [investmentVehicleData, setInvestmentVehicleData] = useState<any>(null);
  const [investmentInspectionPhotos, setInvestmentInspectionPhotos] = useState<Record<string, string>>({});
  const [hasDamages, setHasDamages] = useState<boolean | null>(null);
  const [investorDocuments, setInvestorDocuments] = useState<{
    comprovanteResidencia?: string;
    cnh?: string;
    rg?: string;
  }>({});
  const [investmentAdditionalDocs, setInvestmentAdditionalDocs] = useState<{
    laudoCautelar?: string;
    laudoMecanico?: string;
    crlv?: string;
    outros?: string;
  }>({});
  const [vehicleInfo, setVehicleInfo] = useState<{
    temDocumento?: boolean;
    observacoesDocumento?: string;
    ipvaPago?: "sim" | "nao" | "isento";
    valorIpva?: string;
    licenciamentoPago?: boolean;
    observacoesLicenciamento?: string;
    temSeguro?: boolean;
    valorSeguro?: string;
    taFinanciado?: boolean;
    observacoesFinanciado?: string;
    eDeLeilao?: boolean;
    observacoesLeilao?: string;
    temRastreador?: boolean;
    localizacaoRastreador?: string;
    temMultas?: boolean;
    observacoesMultas?: string;
    problemaMecanico?: string;
    observacoesSeguro?: string;
  }>({});
  const [investmentBankData, setInvestmentBankData] = useState<any>(null);

  // Estado para proprietário do veículo (investimento)
  const [isVehicleOwner, setIsVehicleOwner] = useState<boolean>(true);
  const [vehicleOwnerName, setVehicleOwnerName] = useState<string>("");

  // Estados FIPE específicos para wizard de investimento
  const [wizardFipeBrands, setWizardFipeBrands] = useState<FipeBrand[]>([]);
  const [wizardFipeModels, setWizardFipeModels] = useState<FipeModel[]>([]);
  const [wizardFipeYears, setWizardFipeYears] = useState<FipeYear[]>([]);
  const [wizardSelectedBrand, setWizardSelectedBrand] = useState<string>("");
  const [wizardSelectedModel, setWizardSelectedModel] = useState<string>("");
  const [wizardSelectedYear, setWizardSelectedYear] = useState<string>("");
  const [wizardLoadingFipe, setWizardLoadingFipe] = useState(false);
  const [investmentSubmitting, setInvestmentSubmitting] = useState(false);
  const [wizardFipeValue, setWizardFipeValue] = useState<string>("");
  const [wizardCustomDividend, setWizardCustomDividend] = useState<string>("");
  const [wizardManualBrandInput, setWizardManualBrandInput] = useState<string>("");
  const [wizardManualModelInput, setWizardManualModelInput] = useState<string>("");

  const wizardLastBrandRequestRef = useRef<string>("");
  const wizardLastModelRequestRef = useRef<string>("");
  const wizardLastConsultaRequestRef = useRef<string>("");

  // Estados para gerenciamento de usuários
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Estados para gerenciamento de templates
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [userFormData, setUserFormData] = useState<any>({
    name: "",
    email: "",
    cpf: "",
    password: "",
    role: "",
    isActive: true,
    salesGoal: 1,
    salesCount: 0
  });
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [selectedUserForSales, setSelectedUserForSales] = useState<any>(null);
  const [salesAmount, setSalesAmount] = useState("1");
  const [salesRevenue, setSalesRevenue] = useState("");
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedUserForGoal, setSelectedUserForGoal] = useState<any>(null);
  const [goalAmount, setGoalAmount] = useState("1");
  const [goalPeriod, setGoalPeriod] = useState("daily");
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [selectedUserForRevenue, setSelectedUserForRevenue] = useState<any>(null);
  const [revenueAmount, setRevenueAmount] = useState("");
  const [salesManagementDialogOpen, setSalesManagementDialogOpen] = useState(false);

  // Estado para espelhamento do painel de investidor
  const [investorMirrorDialogOpen, setInvestorMirrorDialogOpen] = useState(false);
  const [mirroredInvestor, setMirroredInvestor] = useState<any>(null);

  // Estados para aprovar solicitações de aluguel
  const [approveRequestDialogOpen, setApproveRequestDialogOpen] = useState(false);
  const [selectedVehicleRequest, setSelectedVehicleRequest] = useState<any>(null);
  const [viewPhotosDialogOpen, setViewPhotosDialogOpen] = useState(false);
  const [approvalData, setApprovalData] = useState<any>({
    pricePerDay: "",
    monthlyPrice: "",
    customDividend: ""
  });

  // Missing state declarations
  const [templateFormData, setTemplateFormData] = useState<any>({});
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [showTotalValue, setShowTotalValue] = useState(false);
  const [calcValueMode, setCalcValueMode] = useState<"manual" | "fipe">("manual");
  const [calcVehicleValue, setCalcVehicleValue] = useState<number>(50000);
  const [calcDownPaymentType, setCalcDownPaymentType] = useState<"split" | "full">("split");
  const [calcDownPaymentInstallments, setCalcDownPaymentInstallments] = useState<number>(10);
  const [calcEntryValue, setCalcEntryValue] = useState<number>(15000); // Valor da entrada em reais
  const [calcInterestRate, setCalcInterestRate] = useState<number>(3);
  const [calcInstallments, setCalcInstallments] = useState<number>(48);
  const [calcFipeBrands, setCalcFipeBrands] = useState<FipeBrand[]>([]);
  const [calcFipeModels, setCalcFipeModels] = useState<FipeModel[]>([]);
  const [calcFipeYears, setCalcFipeYears] = useState<FipeYear[]>([]);
  const [calcSelectedBrand, setCalcSelectedBrand] = useState<string>("");
  const [calcSelectedModel, setCalcSelectedModel] = useState<string>("");
  const [calcSelectedYear, setCalcSelectedYear] = useState<string>("");
  const [calcLoadingFipe, setCalcLoadingFipe] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState<any>(null);
  const [tempDueDay, setTempDueDay] = useState<number | null>(null);
  const [tempBonusPaymentDay, setTempBonusPaymentDay] = useState<number | null>(null);
  const [financingDetailsDialogOpen, setFinancingDetailsDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutPhotos, setCheckoutPhotos] = useState<any>({});
  const [checkoutChecklist, setCheckoutChecklist] = useState<any>({});
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [confessionVideoDialogOpen, setConfessionVideoDialogOpen] = useState(false);
  const [confessionVideoUrl, setConfessionVideoUrl] = useState<string | null>(null);
  const [confessionVideoUploading, setConfessionVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string>("");
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Upload por chunks para mobile (contorna limite de proxy de 50MB)
  const uploadVideoChunked = async (
    financingId: string,
    videoBlob: Blob | File,
    onProgress: (msg: string) => void
  ): Promise<string> => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB por chunk
    const totalChunks = Math.ceil(videoBlob.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileName = videoBlob instanceof File ? videoBlob.name : 'video.mp4';

    console.log(`[CHUNK UPLOAD] Iniciando upload chunked: ${totalChunks} chunks de 5MB`);

    // Enviar cada chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, videoBlob.size);
      const chunk = videoBlob.slice(start, end);

      const formData = new FormData();
      // IMPORTANTE: metadados ANTES do arquivo para que Multer leia corretamente
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('chunk', chunk, 'chunk.bin');

      const percent = Math.round(((i + 1) / totalChunks) * 90); // 90% para upload, 10% para finalização
      onProgress(`Enviando: ${percent}%`);
      console.log(`[CHUNK UPLOAD] Enviando chunk ${i + 1}/${totalChunks}`);

      const response = await fetch(`/api/financings/${financingId}/confession-video-chunk`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[CHUNK UPLOAD] Erro no chunk ${i}:`, errorText);
        throw new Error(`Falha ao enviar parte ${i + 1} do vídeo`);
      }
    }

    // Finalizar e juntar os chunks
    onProgress("Finalizando...");
    console.log('[CHUNK UPLOAD] Finalizando upload');

    const completeResponse = await fetch(`/api/financings/${financingId}/confession-video-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, totalChunks, fileName }),
    });

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      console.error('[CHUNK UPLOAD] Erro ao finalizar:', errorText);
      throw new Error('Falha ao finalizar upload do vídeo');
    }

    const data = await completeResponse.json();
    console.log('[CHUNK UPLOAD] Sucesso! URL:', data.videoUrl);
    onProgress("Vídeo enviado!");
    return data.videoUrl;
  };

  const uploadVideoFile = async (
    financingId: string,
    videoBlob: Blob | File,
    onProgress: (msg: string) => void
  ): Promise<string> => {
    const fileSizeMB = (videoBlob.size / 1024 / 1024).toFixed(2);
    console.log('[VIDEO UPLOAD] Iniciando upload, tamanho:', fileSizeMB, 'MB, mobile:', isMobileDevice());

    // Para mobile ou arquivos grandes (>30MB), usar upload chunked
    if (isMobileDevice() || videoBlob.size > 30 * 1024 * 1024) {
      console.log('[VIDEO UPLOAD] Usando upload chunked');
      return uploadVideoChunked(financingId, videoBlob, onProgress);
    }

    // Desktop com arquivo pequeno: usar upload direto
    const formData = new FormData();
    const fileName = videoBlob instanceof File ? videoBlob.name : 'video.mp4';
    formData.append('video', videoBlob, fileName);

    onProgress("Preparando envio...");
    const xhr = new XMLHttpRequest();
    xhr.timeout = 600000;

    return new Promise((resolve, reject) => {
      let uploadCompleted = false;

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(`Enviando: ${percent}%`);
          console.log('[VIDEO UPLOAD] Progresso:', percent, '%');
        }
      });

      xhr.addEventListener('load', () => {
        uploadCompleted = true;
        console.log('[VIDEO UPLOAD] Resposta recebida, status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('[VIDEO UPLOAD] Sucesso! URL:', response.videoUrl);
            resolve(response.videoUrl);
          } catch (parseError) {
            console.error('[VIDEO UPLOAD] Erro ao parsear resposta:', xhr.responseText);
            reject(new Error('Erro ao processar resposta do servidor'));
          }
        } else {
          console.error('[VIDEO UPLOAD] Falha, status:', xhr.status, 'resposta:', xhr.responseText);
          reject(new Error(`Falha ao enviar vídeo (código ${xhr.status})`));
        }
      });

      xhr.addEventListener('error', (e) => {
        console.error('[VIDEO UPLOAD] Erro de conexão:', e);
        reject(new Error('Erro de conexão. Verifique sua internet e tente novamente.'));
      });

      xhr.addEventListener('timeout', () => {
        console.error('[VIDEO UPLOAD] Timeout após 10 minutos');
        reject(new Error('Tempo esgotado. O vídeo pode ser muito grande ou a conexão está lenta.'));
      });

      xhr.addEventListener('abort', () => {
        console.warn('[VIDEO UPLOAD] Upload cancelado');
        reject(new Error('Upload cancelado'));
      });

      xhr.addEventListener('loadend', () => {
        console.log('[VIDEO UPLOAD] Upload finalizado, sucesso:', uploadCompleted);
      });

      xhr.open('POST', `/api/financings/${financingId}/confession-video`);
      xhr.send(formData);
      console.log('[VIDEO UPLOAD] Requisição enviada');
    });
  };

  const compressVideo = async (videoFile: File | Blob, onProgress: (msg: string) => void): Promise<Blob> => {
    if (isMobileDevice()) {
      onProgress("Processando vídeo...");
      return videoFile instanceof File ? videoFile : videoFile;
    }

    onProgress("Carregando compressor de vídeo...");

    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }

    const ffmpeg = ffmpegRef.current;

    if (!ffmpegLoaded) {
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar FFmpeg:', error);
        onProgress("Compressor não disponível, enviando original...");
        return videoFile instanceof File ? videoFile : videoFile;
      }
    }

    onProgress("Preparando vídeo para compressão...");

    const inputName = 'input.mp4';
    const outputName = 'output.mp4';

    try {
      const videoData = await fetchFile(videoFile);
      await ffmpeg.writeFile(inputName, videoData);

      onProgress("Comprimindo vídeo (pode levar alguns segundos)...");

      await ffmpeg.exec([
        '-i', inputName,
        '-vf', 'scale=-2:720',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName
      ]);

      onProgress("Finalizando compressão...");

      const data = await ffmpeg.readFile(outputName);
      const compressedBlob = new Blob([data as any], { type: 'video/mp4' });

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const originalSize = videoFile instanceof File ? videoFile.size : videoFile.size;
      const compressedSize = compressedBlob.size;
      const reduction = Math.round((1 - compressedSize / originalSize) * 100);

      console.log(`Vídeo comprimido: ${(originalSize / 1024 / 1024).toFixed(1)}MB -> ${(compressedSize / 1024 / 1024).toFixed(1)}MB (${reduction}% menor)`);

      return compressedBlob;
    } catch (error) {
      console.error('Erro na compressão:', error);
      onProgress("Erro na compressão, enviando original...");
      return videoFile instanceof File ? videoFile : videoFile;
    }
  };

  const [finalizeConfirmDialogOpen, setFinalizeConfirmDialogOpen] = useState(false);
  const [finalizingFinancing, setFinalizingFinancing] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedImageLabel, setSelectedImageLabel] = useState<string>("");
  const [customerPasswordDialogOpen, setCustomerPasswordDialogOpen] = useState(false);
  const [editSalesDialogOpen, setEditSalesDialogOpen] = useState(false);
  const [editRevenueDialogOpen, setEditRevenueDialogOpen] = useState(false);
  const [customerData, setCustomerData] = useState<any>({});
  const [contractData, setContractData] = useState<any>({});
  const [formData, setFormData] = useState<any>({});
  const [paymentData, setPaymentData] = useState<any>({});
  const [financingCalculation, setFinancingCalculation] = useState<any>(null);
  const [financingDocuments, setFinancingDocuments] = useState<any>({});
  const [financingApprovalStatus, setFinancingApprovalStatus] = useState<string>("");
  const [guarantorData, setGuarantorData] = useState<any>({});
  const [hasGuarantor, setHasGuarantor] = useState<boolean>(false);
  const [checkInPhotos, setCheckInPhotos] = useState<any[]>([]);
  const [rentalStartDate, setRentalStartDate] = useState<string>("");
  const [rentalEndDate, setRentalEndDate] = useState<string>("");
  const [vehicleValue, setVehicleValue] = useState<number>(0);
  const [selectedCustomerForPassword, setSelectedCustomerForPassword] = useState<any>(null);
  const [newCustomerPassword, setNewCustomerPassword] = useState<string>("");
  const [selectedPlans, setSelectedPlans] = useState<any[]>([]);
  const [pendingRequestId, setPendingRequestId] = useState<string>("");
  const [processingPendingRequest, setProcessingPendingRequest] = useState(false);
  const [vehicleChecklist, setVehicleChecklist] = useState<any>({});
  const [agreedRentalValue, setAgreedRentalValue] = useState<string>("");
  const [bulkFipeBrands, setBulkFipeBrands] = useState<any[]>([]);

  // Estados FIPE para veículo de troca
  const [tradeInVehicleData, setTradeInVehicleData] = useState<any>(null);
  const [tradeInFipeBrands, setTradeInFipeBrands] = useState<FipeBrand[]>([]);
  const [tradeInFipeModels, setTradeInFipeModels] = useState<FipeModel[]>([]);
  const [tradeInFipeYears, setTradeInFipeYears] = useState<FipeYear[]>([]);
  const [tradeInSelectedBrand, setTradeInSelectedBrand] = useState<string>("");
  const [tradeInSelectedModel, setTradeInSelectedModel] = useState<string>("");
  const [tradeInSelectedYear, setTradeInSelectedYear] = useState<string>("");
  const [tradeInLoadingFipe, setTradeInLoadingFipe] = useState(false);
  const [tradeInFipeValue, setTradeInFipeValue] = useState<string>("");
  const [tradeInDocuments, setTradeInDocuments] = useState<any>({});
  const [tradeInAcceptanceStatus, setTradeInAcceptanceStatus] = useState<string>("");
  const [tradeInAcceptedValue, setTradeInAcceptedValue] = useState<string>("");

  const tradeInLastBrandRequestRef = useRef<string>("");
  const tradeInLastModelRequestRef = useRef<string>("");
  const tradeInLastConsultaRequestRef = useRef<string>("");

  const { data: rentals, isLoading: rentalsLoading, isError: rentalsError } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Query para buscar dados completos de um rental específico (com imagens)
  const { data: selectedRentalFull } = useQuery<any>({
    queryKey: ["/api/rentals", selectedRental?.id],
    enabled: !!selectedRental?.id && finalizationDialogOpen,
  });

  // Contador de solicitações pendentes
  const pendingRequestsCount = useMemo(() => {
    return rentals?.filter(r => r.status === "pending").length || 0;
  }, [rentals]);

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<any[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: financings, isLoading: financingsLoading } = useQuery<any[]>({
    queryKey: ["/api/financings"],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });


  // Removido query local redundante de auditLogs

  const { data: adminUsers, isLoading: adminUsersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  // Removido query local redundante de customerEvents

  const { data: investmentQuotas, isLoading: quotasLoading } = useQuery<any[]>({
    queryKey: ["/api/investment-quotas"],
  });

  const { data: investors, isLoading: investorsLoading } = useQuery<any[]>({
    queryKey: ["/api/investors"],
  });

  const { data: tradeInVehicles, isLoading: tradeInVehiclesLoading } = useQuery<any[]>({
    queryKey: ["/api/trade-in-vehicles"],
  });

  const { data: vehicleRequests, isLoading: vehicleRequestsLoading } = useQuery<any[]>({
    queryKey: ["/api/vehicle-requests"],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const { data: plans, isLoading: plansLoading } = useQuery<any[]>({
    queryKey: ["/api/rental-plans"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ["/api/contract-templates"],
  });

  const { data: financingProposals, isLoading: financingProposalsLoading } = useQuery<any[]>({
    queryKey: ["/api/financing-proposals"],
    refetchInterval: 30000,
  });

  const { data: operationalExpenses } = useQuery<any[]>({
    queryKey: ["/api/operational-expenses"],
  });

  const { data: dividendSummary, isLoading: dividendSummaryLoading } = useQuery<{
    currentPeriod: {
      month: number;
      year: number;
      total: number;
      breakdown: {
        investorId: string;
        investorName: string;
        vehicles: { vehicleId: string; vehicleName: string; licensePlate: string; dividend: number }[];
        totalDividend: number;
      }[];
    };
    cumulative: {
      total: number;
      breakdown: {
        investorId: string;
        investorName: string;
        paymentsCount: number;
        monthlyDividend: number;
        totalPaid: number;
        details: string[];
      }[];
    };
  }>({
    queryKey: ["/api/admin/dividends/summary"],
  });

  const [dividendModalOpen, setDividendModalOpen] = useState(false);
  const [dividendModalType, setDividendModalType] = useState<"current" | "cumulative">("current");

  // Contador de solicitações de veículos pendentes
  const pendingVehicleRequestsCount = useMemo(() => {
    return vehicleRequests?.filter(r => r.status === "pending").length || 0;
  }, [vehicleRequests]);

  // Sistema de rastreamento de visualizações
  const [lastViewedTimestamps, setLastViewedTimestamps] = useState<Record<string, number>>({});

  // Carregar timestamps do localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem('crm_last_viewed');
    if (stored) {
      try {
        setLastViewedTimestamps(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar timestamps:', e);
      }
    }
  }, []);

  // Função para marcar uma seção como visualizada
  const markAsViewed = (section: string) => {
    const newTimestamps = {
      ...lastViewedTimestamps,
      [section]: Date.now()
    };
    setLastViewedTimestamps(newTimestamps);
    localStorage.setItem('crm_last_viewed', JSON.stringify(newTimestamps));
  };

  // Contador de leads não visualizados
  const newLeadsCount = useMemo(() => {
    if (!leads) return 0;
    const lastViewed = lastViewedTimestamps['leads'] || 0;
    return leads.filter((lead: any) => {
      const createdAt = new Date(lead.createdAt || 0).getTime();
      return createdAt > lastViewed;
    }).length;
  }, [leads, lastViewedTimestamps]);

  // Contador de financiamentos pendentes
  const pendingFinancingsCount = useMemo(() => {
    return financings?.filter(f => f.approvalStatus === "pending").length || 0;
  }, [financings]);

  // Contador de veículos de troca não visualizados  
  const newTradeInVehiclesCount = useMemo(() => {
    if (!tradeInVehicles) return 0;
    const lastViewed = lastViewedTimestamps['veiculos-troca'] || 0;
    return tradeInVehicles.filter((v: any) => {
      const createdAt = new Date(v.createdAt || 0).getTime();
      return createdAt > lastViewed;
    }).length;
  }, [tradeInVehicles, lastViewedTimestamps]);

  // Cálculo automático do dividendo baseado em valor FIPE e categoria
  const wizardMatchingQuota = useMemo(() => {
    if (!investmentQuotas || !wizardFipeValue || !investmentVehicleData?.category) return null;

    const cleanFipeValue = wizardFipeValue
      .replace(/[^\d,.]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const fipeVal = parseFloat(cleanFipeValue);
    if (isNaN(fipeVal)) return null;

    return investmentQuotas.find(quota => {
      const minVal = parseFloat(quota.minValue.trim());
      const maxVal = parseFloat(quota.maxValue.trim());
      return quota.category === investmentVehicleData.category && fipeVal >= minVal && fipeVal <= maxVal;
    });
  }, [investmentQuotas, wizardFipeValue, investmentVehicleData?.category]);

  // Sincronizar valor do dividendo customizado com a quota quando disponível
  useEffect(() => {
    if (wizardMatchingQuota && !wizardCustomDividend) {
      // Usa o valor médio da faixa como sugestão inicial
      const avgDividend = (parseFloat(wizardMatchingQuota.minDividend) + parseFloat(wizardMatchingQuota.maxDividend)) / 2;
      // Salvar em formato brasileiro (vírgula como decimal)
      setWizardCustomDividend(avgDividend.toFixed(2).replace('.', ','));
    }
  }, [wizardMatchingQuota]);

  // Preencher automaticamente dividendo quando entrar na Etapa 3
  useEffect(() => {
    if (saleType === "investment" && currentStep === 3) {
      if (wizardMatchingQuota && (!wizardCustomDividend || wizardCustomDividend === "0" || wizardCustomDividend === "0,00")) {
        // Usa o valor médio da faixa como sugestão inicial
        const avgDividend = (parseFloat(wizardMatchingQuota.minDividend) + parseFloat(wizardMatchingQuota.maxDividend)) / 2;
        // Salvar em formato brasileiro (vírgula como decimal)
        const formattedValue = avgDividend.toFixed(2).replace('.', ',');
        setWizardCustomDividend(formattedValue);
      }
    }
  }, [currentStep, saleType, wizardMatchingQuota, wizardCustomDividend]);

  // Buscar marcas FIPE quando entrar na etapa 2
  useEffect(() => {
    if (saleType === "investment" && currentStep === 2) {
      wizardFetchFipeBrands();
    }
  }, [saleType, currentStep]);


  // Função para buscar marcas FIPE
  const wizardFetchFipeBrands = async () => {
    try {
      const response = await fetch("https://parallelum.com.br/fipe/api/v2/cars/brands");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setWizardFipeBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar marcas FIPE:", error);
      setWizardFipeBrands([]);
      toast({
        title: "Erro ao carregar marcas FIPE",
        description: "Não foi possível carregar a lista de marcas. Você pode preencher os dados manualmente.",
        variant: "destructive",
      });
    }
  };

  // Função para buscar modelos FIPE
  const wizardFetchFipeModels = async (brandId: string) => {
    wizardLastBrandRequestRef.current = brandId;
    wizardLastModelRequestRef.current = "";
    wizardLastConsultaRequestRef.current = "";
    setWizardFipeModels([]);
    setWizardFipeYears([]);
    setWizardSelectedModel("");
    setWizardSelectedYear("");
    setWizardFipeValue("");

    try {
      setWizardLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      if (wizardLastBrandRequestRef.current === brandId) {
        setWizardFipeModels(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar modelos FIPE:", error);
      if (wizardLastBrandRequestRef.current === brandId) {
        setWizardFipeModels([]);
      }
    } finally {
      setWizardLoadingFipe(false);
    }
  };

  // Função para buscar anos FIPE
  const wizardFetchFipeYears = async (brandId: string, modelId: string) => {
    const requestKey = `${brandId}-${modelId}`;
    wizardLastModelRequestRef.current = requestKey;
    wizardLastConsultaRequestRef.current = "";
    setWizardFipeYears([]);
    setWizardSelectedYear("");
    setWizardFipeValue("");

    try {
      setWizardLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models/${modelId}/years`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      if (wizardLastModelRequestRef.current === requestKey) {
        setWizardFipeYears(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar anos FIPE:", error);
      if (wizardLastModelRequestRef.current === requestKey) {
        setWizardFipeYears([]);
      }
    } finally {
      setWizardLoadingFipe(false);
    }
  };

  // Função para consultar valor FIPE
  const wizardConsultarFipe = async () => {
    if (!wizardSelectedBrand || !wizardSelectedModel || !wizardSelectedYear) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione marca, modelo e ano para consultar a FIPE",
        variant: "destructive",
      });
      return;
    }

    const requestBrand = wizardSelectedBrand;
    const requestModel = wizardSelectedModel;
    const requestYear = wizardSelectedYear;
    const requestKey = `${requestBrand}-${requestModel}-${requestYear}`;
    wizardLastConsultaRequestRef.current = requestKey;

    try {
      setWizardLoadingFipe(true);
      const response = await fetch(
        `https://parallelum.com.br/fipe/api/v2/cars/brands/${requestBrand}/models/${requestModel}/years/${requestYear}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: FipePrice = await response.json();

      if (wizardLastConsultaRequestRef.current !== requestKey) {
        return;
      }

      const brandName = wizardFipeBrands.find(b => b.code === requestBrand)?.name || "";
      const modelName = wizardFipeModels.find(m => m.code === requestModel)?.name || "";

      setInvestmentVehicleData({
        ...investmentVehicleData,
        brand: brandName,
        model: modelName,
        year: data.modelYear.toString(),
        fipeValue: data.price
      });

      setWizardFipeValue(data.price);

      toast({
        title: "Valor FIPE consultado!",
        description: `Valor de mercado: ${data.price}`,
      });
    } catch (error) {
      if (wizardLastConsultaRequestRef.current === requestKey) {
        setWizardFipeValue("");
        toast({
          title: "Erro ao consultar FIPE",
          description: "Não foi possível buscar o valor do veículo",
          variant: "destructive",
        });
      }
    } finally {
      setWizardLoadingFipe(false);
    }
  };

  // Funções FIPE para veículo de troca
  const tradeInFetchFipeBrands = async () => {
    try {
      const response = await fetch("https://parallelum.com.br/fipe/api/v2/cars/brands");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setTradeInFipeBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar marcas FIPE (trade-in):", error);
      setTradeInFipeBrands([]);
      toast({
        title: "Erro ao carregar marcas FIPE",
        description: "Não foi possível carregar a lista de marcas.",
        variant: "destructive",
      });
    }
  };

  const tradeInFetchFipeModels = async (brandId: string) => {
    tradeInLastBrandRequestRef.current = brandId;
    tradeInLastModelRequestRef.current = "";
    tradeInLastConsultaRequestRef.current = "";
    setTradeInFipeModels([]);
    setTradeInFipeYears([]);
    setTradeInSelectedModel("");
    setTradeInSelectedYear("");
    setTradeInFipeValue("");

    try {
      setTradeInLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      if (tradeInLastBrandRequestRef.current === brandId) {
        setTradeInFipeModels(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar modelos FIPE (trade-in):", error);
      if (tradeInLastBrandRequestRef.current === brandId) {
        setTradeInFipeModels([]);
      }
    } finally {
      setTradeInLoadingFipe(false);
    }
  };

  const tradeInFetchFipeYears = async (brandId: string, modelId: string) => {
    const requestKey = `${brandId}-${modelId}`;
    tradeInLastModelRequestRef.current = requestKey;
    tradeInLastConsultaRequestRef.current = "";
    setTradeInFipeYears([]);
    setTradeInSelectedYear("");
    setTradeInFipeValue("");

    try {
      setTradeInLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models/${modelId}/years`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      if (tradeInLastModelRequestRef.current === requestKey) {
        setTradeInFipeYears(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar anos FIPE (trade-in):", error);
      if (tradeInLastModelRequestRef.current === requestKey) {
        setTradeInFipeYears([]);
      }
    } finally {
      setTradeInLoadingFipe(false);
    }
  };

  const tradeInConsultarFipe = async () => {
    if (!tradeInSelectedBrand || !tradeInSelectedModel || !tradeInSelectedYear) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione marca, modelo e ano para consultar a FIPE",
        variant: "destructive",
      });
      return;
    }

    const requestBrand = tradeInSelectedBrand;
    const requestModel = tradeInSelectedModel;
    const requestYear = tradeInSelectedYear;
    const requestKey = `${requestBrand}-${requestModel}-${requestYear}`;
    tradeInLastConsultaRequestRef.current = requestKey;

    try {
      setTradeInLoadingFipe(true);
      const response = await fetch(
        `https://parallelum.com.br/fipe/api/v2/cars/brands/${requestBrand}/models/${requestModel}/years/${requestYear}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: FipePrice = await response.json();

      if (tradeInLastConsultaRequestRef.current !== requestKey) {
        return;
      }

      const brandName = tradeInFipeBrands.find(b => b.code === requestBrand)?.name || "";
      const modelName = tradeInFipeModels.find(m => m.code === requestModel)?.name || "";

      setTradeInVehicleData({
        ...tradeInVehicleData,
        brand: brandName,
        model: modelName,
        year: data.modelYear.toString(),
        fipeValue: data.price
      });

      setTradeInFipeValue(data.price);

      toast({
        title: "Valor FIPE consultado!",
        description: `Valor de mercado do veículo de troca: ${data.price}`,
      });
    } catch (error) {
      if (tradeInLastConsultaRequestRef.current === requestKey) {
        setTradeInFipeValue("");
        toast({
          title: "Erro ao consultar FIPE",
          description: "Não foi possível buscar o valor do veículo de troca",
          variant: "destructive",
        });
      }
    } finally {
      setTradeInLoadingFipe(false);
    }
  };

  // Funções FIPE para bulk import
  const bulkFetchFipeBrands = async () => {
    try {
      const response = await fetch("https://parallelum.com.br/fipe/api/v2/cars/brands");
      const data = await response.json();
      setBulkFipeBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar marcas FIPE (bulk):", error);
      setBulkFipeBrands([]);
      toast({
        title: "Erro ao carregar marcas FIPE",
        description: "Não foi possível carregar a lista de marcas.",
        variant: "destructive",
      });
    }
  };

  // Preencher automaticamente valor FIPE quando veículo é selecionado
  useEffect(() => {
    if (selectedVehicle && selectedVehicle.fipeValue) {
      const fipeValue = Number(selectedVehicle.fipeValue);
      if (fipeValue > 0) {
        setVehicleValue(fipeValue);
      }
    }
  }, [selectedVehicle]);

  // Funções FIPE para calculadora
  useEffect(() => {
    if (calculatorDialogOpen && calcValueMode === "fipe" && calcFipeBrands.length === 0) {
      calcFetchFipeBrands();
    }
  }, [calculatorDialogOpen, calcValueMode]);

  useEffect(() => {
    if (calcSelectedBrand) {
      calcFetchFipeModels();
    } else {
      setCalcFipeModels([]);
      setCalcSelectedModel("");
    }
  }, [calcSelectedBrand]);

  useEffect(() => {
    if (calcSelectedModel) {
      calcFetchFipeYears();
    } else {
      setCalcFipeYears([]);
      setCalcSelectedYear("");
    }
  }, [calcSelectedModel]);

  // Atribuir stream ao elemento de vídeo quando disponível
  useEffect(() => {
    if (webcamStream && webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = webcamStream;
      webcamVideoRef.current.play().catch(() => { });
    }

    // Cleanup: parar tracks quando componente desmontar ou stream mudar
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  const calcFetchFipeBrands = async () => {
    try {
      const brands = await fetchFipeBrands();
      setCalcFipeBrands(brands);
    } catch (error) {
      toast({
        title: "Erro ao carregar marcas",
        description: "Não foi possível carregar as marcas FIPE",
        variant: "destructive",
      });
    }
  };

  const calcFetchFipeModels = async () => {
    if (!calcSelectedBrand) return;
    try {
      const models = await fetchFipeModels(calcSelectedBrand);
      setCalcFipeModels(models);
    } catch (error) {
      toast({
        title: "Erro ao carregar modelos",
        description: "Não foi possível carregar os modelos",
        variant: "destructive",
      });
    }
  };

  const calcFetchFipeYears = async () => {
    if (!calcSelectedBrand || !calcSelectedModel) return;
    try {
      const years = await fetchFipeYears(calcSelectedBrand, calcSelectedModel);
      setCalcFipeYears(years);
    } catch (error) {
      toast({
        title: "Erro ao carregar anos",
        description: "Não foi possível carregar os anos disponíveis",
        variant: "destructive",
      });
    }
  };

  const calcConsultarFipe = async () => {
    if (!calcSelectedBrand || !calcSelectedModel || !calcSelectedYear) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione marca, modelo e ano para consultar a FIPE",
        variant: "destructive",
      });
      return;
    }

    try {
      setCalcLoadingFipe(true);
      const priceData = await fetchFipePrice(calcSelectedBrand, calcSelectedModel, calcSelectedYear);
      const numericValue = parseFipePrice(priceData.price);

      setCalcVehicleValue(numericValue);

      toast({
        title: "Valor FIPE consultado!",
        description: `${priceData.brand} ${priceData.model} (${priceData.modelYear}): ${priceData.price}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao consultar FIPE",
        description: "Não foi possível buscar o valor do veículo",
        variant: "destructive",
      });
    } finally {
      setCalcLoadingFipe(false);
    }
  };

  // Customer mutations
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
      return await apiRequest("PATCH", `/api/customers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao atualizar cliente",
      });
    },
  });

  const uploadInvestorContractMutation = useMutation({
    mutationFn: async ({ id, contractUrl, contractFileName }: { id: string; contractUrl: string; contractFileName: string }) => {
      return await apiRequest("PATCH", `/api/customers/${id}/investor-contract`, { contractUrl, contractFileName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Contrato anexado!",
        description: "O contrato foi anexado com sucesso e está disponível para o investidor.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao anexar contrato",
      });
    },
  });

  const removeInvestorContractMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/customers/${id}/investor-contract`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Contrato removido!",
        description: "O contrato foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao remover contrato",
      });
    },
  });

  const updateFinancingPaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus, dueDay }: { id: string; paymentStatus?: string; dueDay?: number }) => {
      const payload: any = {};
      if (paymentStatus !== undefined) payload.paymentStatus = paymentStatus;
      if (dueDay !== undefined) payload.dueDay = dueDay;
      return await apiRequest("PATCH", `/api/financings/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financings"] });
      toast({
        title: "Atualizado!",
        description: "Informações do financiamento atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao atualizar as informações.",
        variant: "destructive",
      });
    },
  });

  const approveVehicleRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/vehicle-requests/${data.id}/approve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      toast({
        title: "Solicitação aprovada!",
        description: "A solicitação de veículo foi aprovada com sucesso.",
      });
      setApproveRequestDialogOpen(false);
      setSelectedVehicleRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar solicitação",
        description: error.message || "Ocorreu um erro ao aprovar a solicitação.",
        variant: "destructive",
      });
    },
  });

  const rejectVehicleRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/vehicle-requests/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Solicitação rejeitada!",
        description: "A solicitação de veículo foi rejeitada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar solicitação",
        description: error.message || "Ocorreu um erro ao rejeitar a solicitação.",
        variant: "destructive",
      });
    },
  });

  // Mutations para Cotas de Investimento
  const createQuotaMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/investment-quotas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investment-quotas"] });
      toast({
        title: "Cota criada!",
        description: "Cota de investimento criada com sucesso.",
      });
      setQuotaDialogOpen(false);
      setEditingQuota(null);
      setQuotaFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cota",
        description: error.message || "Ocorreu um erro ao criar a cota.",
        variant: "destructive",
      });
    },
  });

  const updateQuotaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/investment-quotas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investment-quotas"] });
      toast({
        title: "Cota atualizada!",
        description: "Cota de investimento atualizada com sucesso.",
      });
      setQuotaDialogOpen(false);
      setEditingQuota(null);
      setQuotaFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cota",
        description: error.message || "Ocorreu um erro ao atualizar a cota.",
        variant: "destructive",
      });
    },
  });

  const deleteQuotaMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/investment-quotas/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investment-quotas"] });
      toast({
        title: "Cota removida!",
        description: "Cota de investimento removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover cota",
        description: error.message || "Ocorreu um erro ao remover a cota.",
        variant: "destructive",
      });
    },
  });

  // Mutations para Planos de Aluguel
  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/rental-plans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-plans"] });
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
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/rental-plans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-plans"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/rental-plans"] });
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

  // Mutations para Gerenciamento de Usuários
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário criado!",
        description: "Usuário criado com sucesso.",
      });
      setUserDialogOpen(false);
      setUserFormData({ name: "", email: "", password: "", role: "", isActive: true, salesGoal: 1, salesCount: 0 });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Limpar campos vazios antes de enviar
      const updateData: any = {};

      // Adicionar apenas campos que não estão vazios
      Object.keys(data).forEach(key => {
        const value = data[key];
        // Ignorar password e cpf se estiverem vazios
        if (key === 'password' || key === 'cpf') {
          if (value && value.trim() !== "") {
            updateData[key] = value;
          }
        } else {
          // Outros campos sempre incluir
          updateData[key] = value;
        }
      });

      return await apiRequest("PATCH", `/api/admin/users/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário atualizado!",
        description: "Usuário atualizado com sucesso.",
      });
      setUserDialogOpen(false);
      setEditingUser(null);
      setUserFormData({ name: "", email: "", password: "", role: "", isActive: true, salesGoal: 1, salesCount: 0 });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Usuário removido!",
        description: "Usuário removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover usuário",
        description: error.message || "Ocorreu um erro ao remover o usuário.",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Status atualizado!",
        description: "Status do usuário atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const addSalesMutation = useMutation({
    mutationFn: async ({ id, amount, revenue }: { id: string; amount: number; revenue?: string }) => {
      return await apiRequest("POST", `/api/admin/users/${id}/sales`, { amount, revenue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Vendas registradas!",
        description: "Vendas registradas com sucesso.",
      });
      setSalesDialogOpen(false);
      setSelectedUserForSales(null);
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

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, salesGoal, goalPeriod }: { id: string; salesGoal: number; goalPeriod: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, { salesGoal, goalPeriod });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Meta atualizada!",
        description: "Meta de vendas atualizada com sucesso.",
      });
      setGoalDialogOpen(false);
      setSelectedUserForGoal(null);
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

  const updateRevenueMutation = useMutation({
    mutationFn: async ({ id, salesRevenue }: { id: string; salesRevenue: string }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, { salesRevenue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Receita atualizada!",
        description: "Receita total atualizada com sucesso.",
      });
      setRevenueDialogOpen(false);
      setSelectedUserForRevenue(null);
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

  // Mutations para Contract Templates
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contract-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-templates"] });
      toast({
        title: "Template criado!",
        description: "Template de contrato criado com sucesso.",
      });
      setTemplateDialogOpen(false);
      setTemplateFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar template",
        description: error.message || "Ocorreu um erro ao criar o template.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/contract-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-templates"] });
      toast({
        title: "Template atualizado!",
        description: "Template de contrato atualizado com sucesso.",
      });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      setTemplateFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message || "Ocorreu um erro ao atualizar o template.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contract-templates/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contract-templates"] });
      toast({
        title: "Template removido!",
        description: "Template de contrato removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover template",
        description: error.message || "Ocorreu um erro ao remover o template.",
        variant: "destructive",
      });
    },
  });

  const approveProposalMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return await apiRequest("POST", `/api/financing-proposals/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing-proposals"] });
      toast({
        title: "Proposta aprovada!",
        description: "A contra proposta foi aprovada. O vendedor poderá retomar o wizard.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar proposta",
        description: error.message || "Ocorreu um erro ao aprovar a proposta.",
        variant: "destructive",
      });
    },
  });

  const rejectProposalMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return await apiRequest("POST", `/api/financing-proposals/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing-proposals"] });
      toast({
        title: "Proposta rejeitada",
        description: "A contra proposta foi rejeitada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar proposta",
        description: error.message || "Ocorreu um erro ao rejeitar a proposta.",
        variant: "destructive",
      });
    },
  });


  // Função de validação para cada etapa
  const validateStep = (step: number): boolean => {
    // Validação específica para wizard de investimento
    if (saleType === "investment") {
      switch (step) {
        case 1:
          // Validar campos obrigatórios do investidor
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
          // Validar dados do veículo e valor FIPE
          if (!investmentVehicleData?.brand || !investmentVehicleData?.model ||
            !investmentVehicleData?.year || !investmentVehicleData?.category ||
            !investmentVehicleData?.plate) {
            toast({
              title: "Dados do veículo incompletos",
              description: "Preencha todos os campos obrigatórios do veículo e consulte o valor FIPE.",
              variant: "destructive",
            });
            return false;
          }

          // Validar proprietário do veículo
          if (!isVehicleOwner && !vehicleOwnerName.trim()) {
            toast({
              title: "Nome do proprietário obrigatório",
              description: "Informe o nome do proprietário do veículo ou marque que você é o proprietário.",
              variant: "destructive",
            });
            return false;
          }
          return true;

        case 3:
          // Etapa de dividendos é apenas informativa, não precisa validar
          return true;

        case 4:
          // Opcionais não são obrigatórios
          return true;

        case 5:
          // Validar se todas as 4 fotos obrigatórias foram enviadas
          const requiredInvestmentPhotos = [
            "frente", "fundo", "lateral_esquerda", "lateral_direita"
          ];
          const missingInvestmentPhotos = requiredInvestmentPhotos.filter(key => !investmentInspectionPhotos[key]);
          if (missingInvestmentPhotos.length > 0) {
            toast({
              title: "Fotos faltando",
              description: `Envie todas as 4 fotos obrigatórias. Faltam: ${missingInvestmentPhotos.length} foto(s).`,
              variant: "destructive",
            });
            return false;
          }
          return true;

        case 6:
          // Validar se o contrato foi enviado
          if (!contractData?.fileUrl) {
            toast({
              title: "Contrato não anexado",
              description: "Faça o upload do contrato de parceria assinado.",
              variant: "destructive",
            });
            return false;
          }
          return true;

        case 7:
          // Validar dados bancários obrigatórios
          if (!investmentBankData?.accountType || !investmentBankData?.bankName ||
            !investmentBankData?.bankCode || !investmentBankData?.agency ||
            !investmentBankData?.accountNumber || !investmentBankData?.accountDigit ||
            !investmentBankData?.accountHolder || !investmentBankData?.accountHolderDocument) {
            toast({
              title: "Dados bancários incompletos",
              description: "Preencha todos os campos obrigatórios (*) dos dados bancários.",
              variant: "destructive",
            });
            return false;
          }
          return true;

        default:
          return true;
      }
    }

    // Financing wizard validation is now handled in FinancingWizard component
    // Rental wizard validation is now handled in RentalWizard component
    return true;
  };


  // Funções para gerenciamento de cotas de investimento
  const handleSaveQuota = () => {
    if (!quotaFormData.category || !quotaFormData.minValue || !quotaFormData.maxValue || !quotaFormData.minDividend || !quotaFormData.maxDividend) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (editingQuota) {
      updateQuotaMutation.mutate({
        id: editingQuota.id,
        data: quotaFormData,
      });
    } else {
      createQuotaMutation.mutate(quotaFormData);
    }
  };

  // Funções para consulta FIPE
  const fetchFipeBrandsForCalculator = async () => {
    try {
      setLoadingFipeData(true);
      const response = await fetch("https://parallelum.com.br/fipe/api/v2/cars/brands");
      const data = await response.json();
      setFipeBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar marcas FIPE:", error);
      setFipeBrands([]);
      toast({
        title: "Erro ao carregar marcas",
        description: "Não foi possível carregar a lista de marcas FIPE.",
        variant: "destructive",
      });
    } finally {
      setLoadingFipeData(false);
    }
  };

  const fetchFipeModelsForCalculator = async (brandId: string) => {
    try {
      setLoadingFipeData(true);
      setFipeModels([]);
      setFipeYears([]);
      setSelectedFipeModel("");
      setSelectedFipeYear("");
      setConsultedFipeValue("");
      setCalculatedDividend("");

      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models`);
      const data = await response.json();
      setFipeModels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar modelos FIPE:", error);
      setFipeModels([]);
      toast({
        title: "Erro ao carregar modelos",
        description: "Não foi possível carregar os modelos.",
        variant: "destructive",
      });
    } finally {
      setLoadingFipeData(false);
    }
  };

  const fetchFipeYearsForCalculator = async (brandId: string, modelId: string) => {
    try {
      setLoadingFipeData(true);
      setFipeYears([]);
      setSelectedFipeYear("");
      setConsultedFipeValue("");
      setCalculatedDividend("");

      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models/${modelId}/years`);
      const data = await response.json();
      setFipeYears(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar anos FIPE:", error);
      setFipeYears([]);
      toast({
        title: "Erro ao carregar anos",
        description: "Não foi possível carregar os anos disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoadingFipeData(false);
    }
  };

  const consultarFipeForDividend = async () => {
    if (!selectedFipeBrand || !selectedFipeModel || !selectedFipeYear) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione marca, modelo e ano para consultar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoadingFipeData(true);
      const response = await fetch(
        `https://parallelum.com.br/fipe/api/v2/cars/brands/${selectedFipeBrand}/models/${selectedFipeModel}/years/${selectedFipeYear}`
      );
      const data = await response.json();
      setConsultedFipeValue(data.price);

      // Calcular dividendo se categoria selecionada
      if (selectedFipeCategory) {
        const cleanFipeValue = data.price
          .replace(/[^\d,.]/g, '')
          .replace(/\./g, '')
          .replace(',', '.');

        const fipeVal = parseFloat(cleanFipeValue);

        if (!isNaN(fipeVal)) {
          const matchingQuota = investmentQuotas?.find((q: any) => {
            const minVal = parseFloat(q.minValue);
            const maxVal = parseFloat(q.maxValue);
            return q.category === selectedFipeCategory && fipeVal >= minVal && fipeVal <= maxVal;
          });

          if (matchingQuota) {
            // Armazena a faixa de dividendos como string
            setCalculatedDividend(`${matchingQuota.minDividend}|${matchingQuota.maxDividend}`);
          } else {
            setCalculatedDividend("");
            toast({
              title: "Cota não encontrada",
              description: `Não há cota cadastrada para categoria ${selectedFipeCategory} com valor ${data.price}`,
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao consultar FIPE:", error);
      setConsultedFipeValue("");
      setCalculatedDividend("");
      toast({
        title: "Erro ao consultar FIPE",
        description: "Não foi possível buscar o valor do veículo.",
        variant: "destructive",
      });
    } finally {
      setLoadingFipeData(false);
    }
  };

  const handleCalculateDividends = () => {
    // Resetar estados e abrir diálogo FIPE
    setSelectedFipeBrand("");
    setSelectedFipeModel("");
    setSelectedFipeYear("");
    setSelectedFipeCategory("");
    setConsultedFipeValue("");
    setCalculatedDividend("");
    setFipeBrands([]);
    setFipeModels([]);
    setFipeYears([]);

    // Abrir diálogo e carregar marcas
    setFipeCalculatorDialogOpen(true);
    fetchFipeBrandsForCalculator();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Novo";
      case "qualified":
        return "Qualificado";
      case "contacted":
        return "Contatado";
      case "converted":
        return "Convertido";
      case "lost":
        return "Perdido";
      default:
        return status;
    }
  };

  // Função para verificar se há dados preenchidos no formulário
  const hasFormData = () => {
    return !!(
      customerData?.name ||
      customerData?.cpf ||
      customerData?.email ||
      selectedVehicle ||
      Object.keys(checkInPhotos).length > 0 ||
      contractData ||
      paymentData ||
      investmentVehicleData?.plate ||
      Object.keys(investmentInspectionPhotos).length > 0
    );
  };

  // Função para resetar todos os dados do formulário
  const resetFormData = () => {
    setSaleType(null);
    setCurrentStep(1);
    setCustomerData(null);
    setHasGuarantor(false);
    setGuarantorData(null);
    setInvestorDocuments({});
    setVehicleInfo({});
    setSelectedVehicle(null);
    setSelectedPlans([]);
    setRentalStartDate("");
    setRentalEndDate("");
    setCheckInPhotos([]);
    setVehicleChecklist({});
    setContractData(null);
    setProcessingPendingRequest(false);
    setPendingRequestId("");
    setPaymentData(null);
    setInvestmentVehicleData(null);
    setInvestmentInspectionPhotos({});
    setInvestmentBankData(null);
    setWizardFipeValue("");
    setWizardCustomDividend("");
    setFinancingCalculation(null);
    setFinancingDocuments({});
    setFinancingApprovalStatus("pending");
    setTradeInVehicleData(null);
    setTradeInAcceptanceStatus("pending");
    setTradeInFipeValue("");
    setTradeInAcceptedValue("");
    setTradeInDocuments({});
  };

  // Handler para fechar o diálogo com confirmação
  const handleDialogClose = (open: boolean) => {
    if (!open && hasFormData()) {
      // Se está tentando fechar e tem dados, mostrar confirmação
      setShowExitConfirmation(true);
    } else if (!open) {
      // Se está tentando fechar e não tem dados, fechar direto
      setNewSaleDialogOpen(false);
      resetFormData();
    } else {
      // Se está abrindo o diálogo
      setNewSaleDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* AlertDialog de Confirmação de Saída */}
      <Dialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Descartar alterações?</DialogTitle>
            <DialogDescription>
              Você tem dados não salvos. Se sair agora, todas as informações preenchidas serão perdidas. Tem certeza que deseja sair?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExitConfirmation(false)}
              data-testid="button-cancel-exit"
            >
              Não, continuar editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitConfirmation(false);
                setNewSaleDialogOpen(false);
                resetFormData();
              }}
              data-testid="button-confirm-exit"
            >
              Sim, descartar e sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Nova Venda - Wizard multi-step */}
      <Dialog open={newSaleDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {saleType === "rental" ? "Nova Venda - Aluguel" : saleType === "investment" ? "Investimento" : "Nova Venda - Financiamento"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {saleType === "rental" && "Fluxo completo de criação de aluguel: Cadastro → Veículo → Check-in → Contrato → Pagamento"}
              {saleType === "investment" && "Processo de registro de novo investimento"}
              {saleType === "financing" && "Processo de criação de financiamento"}
            </DialogDescription>
          </DialogHeader>

          {/* Wizard de Aluguel */}
          {saleType === "rental" && (
            <RentalWizardProvider>
              <RentalWizard />
            </RentalWizardProvider>
          )}

          {/* Wizard de Investimento - 5 Etapas */}
          {saleType === "investment" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stepper - 5 etapas */}
              <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto pb-2">
                {[
                  { step: 1, icon: User, label: "Cadastro" },
                  { step: 2, icon: Car, label: "Veículo" },
                  { step: 3, icon: DollarSign, label: "Dividendos" },
                  { step: 4, icon: Camera, label: "Fotos" },
                  { step: 5, icon: FileText, label: "Contrato" },
                  { step: 6, icon: Key, label: "Criar Conta" },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center flex-1 min-w-[60px] sm:min-w-[80px]">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${currentStep > item.step
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
                      <p className="text-[10px] sm:text-xs mt-1 text-center hidden sm:block">{item.label}</p>
                    </div>
                    {index < 5 && (
                      <div className={`flex-1 h-0.5 mx-0.5 sm:mx-1 ${currentStep > item.step ? "bg-primary" : "bg-muted"
                        }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Conteúdo das etapas */}
              <div className="min-h-[400px]">
                {/* Etapa 1: Cadastro */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">Etapa 1: Cadastro do Investidor</h3>
                        <p className="text-sm text-muted-foreground">Dados pessoais, CNH e endereço completo</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCustomerData({
                            name: "João da Silva",
                            cpf: "123.456.789-00",
                            rg: "12.345.678-9",
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
                          setInvestmentBankData({
                            accountType: "conta_corrente",
                            bankName: "Banco do Brasil",
                            bankCode: "001",
                            agency: "1234",
                            agencyDigit: "5",
                            accountNumber: "56789",
                            accountDigit: "0",
                            accountHolder: "João da Silva",
                            accountHolderDocument: "123.456.789-00",
                            pixKeyType: "cpf",
                            pixKey: "123.456.789-00"
                          });
                          setIsVehicleOwner(true);
                          toast({
                            title: "Dados preenchidos!",
                            description: "Formulário preenchido com dados de teste.",
                          });
                        }}
                        data-testid="button-fill-test-data"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Preencher Dados de Teste
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome Completo *</label>
                        <Input
                          placeholder="Digite o nome completo"
                          value={customerData?.name || ""}
                          onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                          data-testid="input-investor-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">CPF *</label>
                        <Input
                          placeholder="000.000.000-00"
                          value={customerData?.cpf || ""}
                          onChange={(e) => setCustomerData({ ...customerData, cpf: e.target.value })}
                          data-testid="input-investor-cpf"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">RG</label>
                        <Input
                          placeholder="00.000.000-0"
                          value={customerData?.rg || ""}
                          onChange={(e) => setCustomerData({ ...customerData, rg: e.target.value })}
                          data-testid="input-investor-rg"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data de Nascimento</label>
                        <Input
                          type="date"
                          placeholder="DD/MM/AAAA"
                          value={customerData?.birthDate || ""}
                          onChange={(e) => setCustomerData({ ...customerData, birthDate: e.target.value })}
                          data-testid="input-investor-birth-date"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email *</label>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          value={customerData?.email || ""}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          data-testid="input-investor-email"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefone *</label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={customerData?.phone || ""}
                          onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                          data-testid="input-investor-phone"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">CNH (Carteira de Motorista) *</label>
                        <Input
                          placeholder="Número da CNH"
                          value={customerData?.driverLicense || ""}
                          onChange={(e) => setCustomerData({ ...customerData, driverLicense: e.target.value })}
                          data-testid="input-investor-cnh"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Contato de Emergência *</label>
                        <Input
                          placeholder="Nome e telefone"
                          value={customerData?.emergencyContact || ""}
                          onChange={(e) => setCustomerData({ ...customerData, emergencyContact: e.target.value })}
                          data-testid="input-investor-emergency"
                        />
                      </div>
                    </div>

                    {/* Seção: Proprietário do Veículo */}
                    <div className="bg-muted/30 p-4 rounded-lg border-2 border-primary/20">
                      <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        Informações do Proprietário do Veículo
                      </h4>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isVehicleOwner"
                            checked={isVehicleOwner}
                            onChange={(e) => {
                              setIsVehicleOwner(e.target.checked);
                              if (e.target.checked) {
                                setVehicleOwnerName("");
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            data-testid="checkbox-is-vehicle-owner"
                          />
                          <label htmlFor="isVehicleOwner" className="text-sm font-medium cursor-pointer">
                            Sou o proprietário do veículo
                          </label>
                        </div>

                        {!isVehicleOwner && (
                          <div className="space-y-2 ml-7 animate-in fade-in slide-in-from-left-2 duration-300">
                            <label className="text-sm font-medium">Nome do Proprietário do Veículo *</label>
                            <Input
                              placeholder="Digite o nome completo do proprietário"
                              value={vehicleOwnerName}
                              onChange={(e) => setVehicleOwnerName(e.target.value)}
                              data-testid="input-vehicle-owner-name"
                              className="bg-background"
                            />
                            <p className="text-xs text-muted-foreground">
                              Informe o nome completo do proprietário registrado no documento do veículo
                            </p>
                          </div>
                        )}
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
                            data-testid="input-investor-street"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Complemento</label>
                          <Input
                            placeholder="Apto, bloco, etc."
                            value={customerData?.complement || ""}
                            onChange={(e) => setCustomerData({ ...customerData, complement: e.target.value })}
                            data-testid="input-investor-complement"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Bairro *</label>
                          <Input
                            placeholder="Nome do bairro"
                            value={customerData?.neighborhood || ""}
                            onChange={(e) => setCustomerData({ ...customerData, neighborhood: e.target.value })}
                            data-testid="input-investor-neighborhood"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Cidade *</label>
                          <Input
                            placeholder="Nome da cidade"
                            value={customerData?.city || ""}
                            onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                            data-testid="input-investor-city"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Estado *</label>
                          <Input
                            placeholder="UF"
                            maxLength={2}
                            value={customerData?.state || ""}
                            onChange={(e) => setCustomerData({ ...customerData, state: e.target.value.toUpperCase() })}
                            data-testid="input-investor-state"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">CEP *</label>
                          <Input
                            placeholder="00000-000"
                            value={customerData?.zipCode || ""}
                            onChange={(e) => setCustomerData({ ...customerData, zipCode: e.target.value })}
                            data-testid="input-investor-zipcode"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-semibold mb-3">Documentos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* RG */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">RG</label>
                          {investorDocuments.rg ? (
                            <div className="space-y-2">
                              <div className="relative rounded-lg border-2 border-primary bg-muted/50 p-4">
                                <div className="flex items-center gap-3">
                                  <CreditCard className="h-8 w-8 text-primary" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Documento anexado</p>
                                    <p className="text-xs text-muted-foreground">RG digitalizado</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.getElementById('doc-rg') as HTMLInputElement;
                                    if (input) input.click();
                                  }}
                                  data-testid="button-change-rg-doc"
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Trocar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setInvestorDocuments({ ...investorDocuments, rg: undefined });
                                  }}
                                  data-testid="button-remove-rg-doc"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover
                                </Button>
                              </div>
                              <input
                                id="doc-rg"
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const processedFile = await processFileUpload(file);
                                      setInvestorDocuments({ ...investorDocuments, rg: processedFile });
                                    } catch (error) {
                                      console.error('Erro ao processar documento:', error);
                                      toast({
                                        title: "Erro",
                                        description: "Não foi possível processar o documento.",
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6">
                                <CreditCard className="h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-xs text-muted-foreground mb-3">Nenhum documento anexado</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  const input = document.getElementById('doc-rg') as HTMLInputElement;
                                  if (input) input.click();
                                }}
                                data-testid="button-upload-rg-doc"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Anexar RG
                              </Button>
                              <input
                                id="doc-rg"
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const processedFile = await processFileUpload(file);
                                      setInvestorDocuments({ ...investorDocuments, rg: processedFile });
                                    } catch (error) {
                                      console.error('Erro ao processar documento:', error);
                                      toast({
                                        title: "Erro",
                                        description: "Não foi possível processar o documento.",
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Comprovante de Residência */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Comprovante de Residência</label>
                          {investorDocuments.comprovanteResidencia ? (
                            <div className="space-y-2">
                              <div className="relative rounded-lg border-2 border-primary bg-muted/50 p-4">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-8 w-8 text-primary" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Documento anexado</p>
                                    <p className="text-xs text-muted-foreground">Comprovante de residência</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.getElementById('doc-comprovante') as HTMLInputElement;
                                    if (input) input.click();
                                  }}
                                  data-testid="button-change-comprovante"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Trocar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setInvestorDocuments({ ...investorDocuments, comprovanteResidencia: undefined });
                                  }}
                                  data-testid="button-remove-comprovante"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover
                                </Button>
                              </div>
                              <input
                                id="doc-comprovante"
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const processedFile = await processFileUpload(file);
                                      setInvestorDocuments({ ...investorDocuments, comprovanteResidencia: processedFile });
                                    } catch (error) {
                                      console.error('Erro ao processar documento:', error);
                                      toast({
                                        title: "Erro",
                                        description: "Não foi possível processar o documento.",
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6">
                                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-xs text-muted-foreground mb-3">Nenhum documento anexado</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  const input = document.getElementById('doc-comprovante') as HTMLInputElement;
                                  if (input) input.click();
                                }}
                                data-testid="button-upload-comprovante"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Anexar Comprovante
                              </Button>
                              <input
                                id="doc-comprovante"
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const processedFile = await processFileUpload(file);
                                      setInvestorDocuments({ ...investorDocuments, comprovanteResidencia: processedFile });
                                    } catch (error) {
                                      console.error('Erro ao processar documento:', error);
                                      toast({
                                        title: "Erro",
                                        description: "Não foi possível processar o documento.",
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* CNH */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CNH</label>
                          {investorDocuments.cnh ? (
                            <div className="space-y-2">
                              <div className="relative rounded-lg border-2 border-primary bg-muted/50 p-4">
                                <div className="flex items-center gap-3">
                                  <CreditCard className="h-8 w-8 text-primary" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Documento anexado</p>
                                    <p className="text-xs text-muted-foreground">CNH digitalizada</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.getElementById('doc-cnh') as HTMLInputElement;
                                    if (input) input.click();
                                  }}
                                  data-testid="button-change-cnh-doc"
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Trocar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setInvestorDocuments({ ...investorDocuments, cnh: undefined });
                                  }}
                                  data-testid="button-remove-cnh-doc"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remover
                                </Button>
                              </div>
                              <input
                                id="doc-cnh"
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const processedFile = await processFileUpload(file);
                                      setInvestorDocuments({ ...investorDocuments, cnh: processedFile });
                                    } catch (error) {
                                      console.error('Erro ao processar documento:', error);
                                      toast({
                                        title: "Erro",
                                        description: "Não foi possível processar o documento.",
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6">
                                <CreditCard className="h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-xs text-muted-foreground mb-3">Nenhum documento anexado</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  const input = document.getElementById('doc-cnh') as HTMLInputElement;
                                  if (input) input.click();
                                }}
                                data-testid="button-upload-cnh-doc"
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Anexar CNH
                              </Button>
                              <input
                                id="doc-cnh"
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const processedFile = await processFileUpload(file);
                                      setInvestorDocuments({ ...investorDocuments, cnh: processedFile });
                                    } catch (error) {
                                      console.error('Erro ao processar documento:', error);
                                      toast({
                                        title: "Erro",
                                        description: "Não foi possível processar o documento.",
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dados Bancários - movido da antiga Etapa 6 */}
                    <div className="mt-8 pt-8 border-t-2 border-primary">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-8 bg-primary rounded"></div>
                        <h4 className="text-lg font-bold text-primary">Dados Bancários para Recebimento de Dividendos</h4>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Informe a conta onde você receberá os dividendos mensais do seu investimento
                      </p>

                      <div className="p-6 bg-muted/50 rounded-lg space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Tipo de Conta *</label>
                            <Select
                              value={investmentBankData?.accountType || ""}
                              onValueChange={(value) => setInvestmentBankData({ ...investmentBankData, accountType: value })}
                            >
                              <SelectTrigger data-testid="select-account-type">
                                <SelectValue placeholder="Selecione o tipo de conta" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                                <SelectItem value="conta_poupanca">Conta Poupança</SelectItem>
                                <SelectItem value="conta_pagamento">Conta de Pagamento</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Banco *</label>
                            <Input
                              placeholder="Nome do banco"
                              value={investmentBankData?.bankName || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, bankName: e.target.value })}
                              data-testid="input-bank-name"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Código do Banco *</label>
                            <Input
                              placeholder="000"
                              value={investmentBankData?.bankCode || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, bankCode: e.target.value })}
                              data-testid="input-bank-code"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Agência *</label>
                            <Input
                              placeholder="0000"
                              value={investmentBankData?.agency || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, agency: e.target.value })}
                              data-testid="input-agency"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Dígito da Agência</label>
                            <Input
                              placeholder="0"
                              maxLength={1}
                              value={investmentBankData?.agencyDigit || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, agencyDigit: e.target.value })}
                              data-testid="input-agency-digit"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Número da Conta *</label>
                            <Input
                              placeholder="00000"
                              value={investmentBankData?.accountNumber || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, accountNumber: e.target.value })}
                              data-testid="input-account-number"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Dígito da Conta *</label>
                            <Input
                              placeholder="0"
                              value={investmentBankData?.accountDigit || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, accountDigit: e.target.value })}
                              data-testid="input-account-digit"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Titular da Conta *</label>
                            <Input
                              placeholder="Nome completo do titular"
                              value={investmentBankData?.accountHolder || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, accountHolder: e.target.value })}
                              data-testid="input-account-holder"
                            />
                            <p className="text-xs text-muted-foreground">
                              Deve ser o mesmo nome do investidor cadastrado
                            </p>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">CPF/CNPJ do Titular *</label>
                            <Input
                              placeholder="000.000.000-00"
                              value={investmentBankData?.accountHolderDocument || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, accountHolderDocument: e.target.value })}
                              data-testid="input-account-holder-document"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Chave PIX</label>
                            <Select
                              value={investmentBankData?.pixKeyType || ""}
                              onValueChange={(value) => setInvestmentBankData({ ...investmentBankData, pixKeyType: value })}
                            >
                              <SelectTrigger data-testid="select-pix-key-type">
                                <SelectValue placeholder="Selecione (opcional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cpf">CPF</SelectItem>
                                <SelectItem value="cnpj">CNPJ</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="telefone">Telefone</SelectItem>
                                <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Chave PIX</label>
                            <Input
                              placeholder="Chave PIX (opcional)"
                              value={investmentBankData?.pixKey || ""}
                              onChange={(e) => setInvestmentBankData({ ...investmentBankData, pixKey: e.target.value })}
                              data-testid="input-pix-key"
                            />
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mt-4">
                          <p className="text-sm">
                            <strong>Atenção:</strong> Os dividendos serão pagos mensalmente nesta conta. Certifique-se de que os dados estão corretos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Etapa 2: Veículo com FIPE */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">Etapa 2: Dados do Veículo</h3>
                      <p className="text-sm text-muted-foreground">Consulte o valor FIPE e informe a placa</p>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-md">Consulta FIPE</CardTitle>
                        <CardDescription>Identifique seu veículo e consulte o valor de mercado</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Marca *</label>
                            <Select
                              value={wizardSelectedBrand}
                              onValueChange={(value) => {
                                setWizardSelectedBrand(value);
                                wizardFetchFipeModels(value);
                              }}
                            >
                              <SelectTrigger data-testid="select-vehicle-brand">
                                <SelectValue placeholder={wizardLoadingFipe ? "Carregando..." : "Selecione a marca"} />
                              </SelectTrigger>
                              <SelectContent>
                                {wizardFipeBrands.map((brand) => (
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
                              value={wizardSelectedModel}
                              onValueChange={(value) => {
                                setWizardSelectedModel(value);
                                if (wizardSelectedBrand) {
                                  wizardFetchFipeYears(wizardSelectedBrand, value);
                                }
                              }}
                              disabled={!wizardSelectedBrand || wizardLoadingFipe}
                            >
                              <SelectTrigger data-testid="select-vehicle-model">
                                <SelectValue placeholder={wizardLoadingFipe ? "Carregando..." : "Selecione o modelo"} />
                              </SelectTrigger>
                              <SelectContent>
                                {wizardFipeModels.map((model) => (
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
                              value={wizardSelectedYear}
                              onValueChange={(value) => setWizardSelectedYear(value)}
                              disabled={!wizardSelectedModel || wizardLoadingFipe}
                            >
                              <SelectTrigger data-testid="select-vehicle-year">
                                <SelectValue placeholder={wizardLoadingFipe ? "Carregando..." : "Selecione o ano"} />
                              </SelectTrigger>
                              <SelectContent>
                                {wizardFipeYears.map((year) => (
                                  <SelectItem key={year.code} value={year.code}>
                                    {year.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Categoria *</label>
                            <Select
                              value={investmentVehicleData?.category || ""}
                              onValueChange={(value) => setInvestmentVehicleData({ ...investmentVehicleData, category: value })}
                            >
                              <SelectTrigger data-testid="select-vehicle-category">
                                <SelectValue placeholder="Selecione a categoria" />
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

                        <Button
                          variant="outline"
                          onClick={wizardConsultarFipe}
                          disabled={wizardLoadingFipe || !wizardSelectedBrand || !wizardSelectedModel || !wizardSelectedYear}
                          data-testid="button-consult-fipe"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          {wizardLoadingFipe ? "Consultando..." : "Consultar Valor FIPE"}
                        </Button>

                        {wizardFipeValue && (
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-sm font-medium mb-1">Valor FIPE Consultado</p>
                            <p className="text-2xl font-bold text-primary">
                              {wizardFipeValue}
                            </p>
                          </div>
                        )}

                        {wizardMatchingQuota && (
                          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-1 text-green-800 dark:text-green-200">Faixa de Dividendo Mensal</p>
                              <p className="text-xs text-muted-foreground text-green-700 dark:text-green-300">
                                Faixa para esta categoria: R$ {Number(wizardMatchingQuota.minDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ {Number(wizardMatchingQuota.maxDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground text-green-700 dark:text-green-300 mt-1">
                                Valor exato será definido pelo admin na aprovação
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-green-800 dark:text-green-200">Valor Final (Editável)</label>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">R$</span>
                                <Input
                                  type="text"
                                  value={wizardCustomDividend}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d.,]/g, '');
                                    setWizardCustomDividend(value);
                                  }}
                                  placeholder="0,00"
                                  className="text-lg font-bold bg-white dark:bg-gray-950"
                                  data-testid="input-custom-dividend"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground text-green-700 dark:text-green-300">
                                Ajuste manualmente se necessário
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Placa do Veículo *</label>
                      <Input
                        placeholder="ABC-1234"
                        value={investmentVehicleData?.plate || ""}
                        onChange={(e) => setInvestmentVehicleData({ ...investmentVehicleData, plate: e.target.value.toUpperCase() })}
                        data-testid="input-vehicle-plate"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Câmbio *</label>
                        <Select
                          value={investmentVehicleData?.transmission || ""}
                          onValueChange={(value) => setInvestmentVehicleData({ ...investmentVehicleData, transmission: value })}
                        >
                          <SelectTrigger data-testid="select-transmission">
                            <SelectValue placeholder="Selecione o tipo de câmbio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="automatic">Automático</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Motor *</label>
                        <Input
                          type="text"
                          placeholder="Ex: 1.0, 1.6 16V, 2.0 Turbo"
                          value={investmentVehicleData?.fuel || ""}
                          onChange={(e) => setInvestmentVehicleData({ ...investmentVehicleData, fuel: e.target.value })}
                          data-testid="input-motor"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Assentos *</label>
                        <Select
                          value={investmentVehicleData?.seats || ""}
                          onValueChange={(value) => setInvestmentVehicleData({ ...investmentVehicleData, seats: value })}
                        >
                          <SelectTrigger data-testid="select-seats">
                            <SelectValue placeholder="Número de assentos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 assentos</SelectItem>
                            <SelectItem value="4">4 assentos</SelectItem>
                            <SelectItem value="5">5 assentos</SelectItem>
                            <SelectItem value="7">7 assentos</SelectItem>
                            <SelectItem value="8">8 assentos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-semibold mb-3">Informações do Veículo</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Tem documento? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Tem documento?</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.temDocumento === true ? "default" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, temDocumento: true })}
                                  data-testid="button-tem-documento-sim"
                                >
                                  Sim
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.temDocumento === false ? "destructive" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, temDocumento: false, observacoesDocumento: "" })}
                                  data-testid="button-tem-documento-nao"
                                >
                                  Não
                                </Button>
                              </div>
                            </div>
                            {vehicleInfo.temDocumento === true && (
                              <div className="space-y-1 mt-2">
                                <label className="text-xs text-muted-foreground">Observações sobre documentação</label>
                                <Textarea
                                  placeholder="Descreva detalhes sobre a documentação..."
                                  value={vehicleInfo.observacoesDocumento || ""}
                                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, observacoesDocumento: e.target.value })}
                                  rows={2}
                                  data-testid="textarea-observacoes-documento"
                                />
                              </div>
                            )}
                          </div>

                          {/* IPVA pago? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">IPVA</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.ipvaPago === "sim" ? "default" : "outline"}
                                  onClick={() => {
                                    const cleanFipe = wizardFipeValue
                                      ? wizardFipeValue.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
                                      : "0";
                                    const fipeVal = parseFloat(cleanFipe) || 0;
                                    const ipvaDefault = (fipeVal * 0.04).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    setVehicleInfo({ ...vehicleInfo, ipvaPago: "sim", valorIpva: ipvaDefault });
                                  }}
                                  data-testid="button-ipva-pago-sim"
                                >
                                  Pago
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.ipvaPago === "nao" ? "destructive" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, ipvaPago: "nao", valorIpva: "" })}
                                  data-testid="button-ipva-pago-nao"
                                >
                                  Não Pago
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.ipvaPago === "isento" ? "secondary" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, ipvaPago: "isento", valorIpva: "0,00" })}
                                  data-testid="button-ipva-isento"
                                >
                                  Isento
                                </Button>
                              </div>
                            </div>
                            {vehicleInfo.ipvaPago === "sim" && (
                              <div className="space-y-1 mt-2">
                                <label className="text-xs text-muted-foreground">
                                  Valor do IPVA (padrão: 4% da tabela FIPE)
                                </label>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">R$</span>
                                  <Input
                                    type="text"
                                    placeholder="0,00"
                                    value={vehicleInfo.valorIpva || ""}
                                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, valorIpva: e.target.value })}
                                    data-testid="input-valor-ipva"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Calculado automaticamente. Você pode alterar manualmente.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Licenciamento pago? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Licenciamento pago?</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.licenciamentoPago === true ? "default" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, licenciamentoPago: true })}
                                  data-testid="button-licenciamento-pago-sim"
                                >
                                  Sim
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.licenciamentoPago === false ? "destructive" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, licenciamentoPago: false })}
                                  data-testid="button-licenciamento-pago-nao"
                                >
                                  Não
                                </Button>
                              </div>
                            </div>
                            {vehicleInfo.licenciamentoPago !== undefined && (
                              <div className="space-y-1 mt-2">
                                <label className="text-xs text-muted-foreground">Observações sobre licenciamento</label>
                                <Textarea
                                  placeholder="Descreva detalhes sobre o licenciamento..."
                                  value={vehicleInfo.observacoesLicenciamento || ""}
                                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, observacoesLicenciamento: e.target.value })}
                                  rows={2}
                                  data-testid="textarea-observacoes-licenciamento"
                                />
                              </div>
                            )}
                          </div>

                          {/* Tem seguro? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Tem seguro?</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.temSeguro === true ? "default" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, temSeguro: true })}
                                  data-testid="button-tem-seguro-sim"
                                >
                                  Sim
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.temSeguro === false ? "destructive" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, temSeguro: false, observacoesSeguro: "" })}
                                  data-testid="button-tem-seguro-nao"
                                >
                                  Não
                                </Button>
                              </div>
                            </div>
                            {vehicleInfo.temSeguro !== undefined && (
                              <div className="space-y-1 mt-2">
                                <label className="text-xs text-muted-foreground">Observações sobre seguro</label>
                                <Textarea
                                  placeholder="Descreva detalhes sobre o seguro (seguradora, tipo de cobertura, vencimento, etc.)..."
                                  value={vehicleInfo.observacoesSeguro || ""}
                                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, observacoesSeguro: e.target.value })}
                                  rows={2}
                                  data-testid="textarea-observacoes-seguro"
                                />
                              </div>
                            )}
                          </div>

                          {/* Tá financiado? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Tá financiado?</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.taFinanciado === true ? "default" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, taFinanciado: true })}
                                  data-testid="button-ta-financiado-sim"
                                >
                                  Sim
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.taFinanciado === false ? "destructive" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, taFinanciado: false, observacoesFinanciado: "" })}
                                  data-testid="button-ta-financiado-nao"
                                >
                                  Não
                                </Button>
                              </div>
                            </div>
                            {vehicleInfo.taFinanciado === true && (
                              <div className="space-y-1 mt-2">
                                <label className="text-xs text-muted-foreground">Observações sobre financiamento</label>
                                <Textarea
                                  placeholder="Descreva detalhes sobre o financiamento (parcelas, banco, etc.)..."
                                  value={vehicleInfo.observacoesFinanciado || ""}
                                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, observacoesFinanciado: e.target.value })}
                                  rows={2}
                                  data-testid="textarea-observacoes-financiado"
                                />
                              </div>
                            )}
                          </div>

                          {/* É de leilão? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">É de leilão?</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.eDeLeilao === true ? "default" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, eDeLeilao: true })}
                                  data-testid="button-e-de-leilao-sim"
                                >
                                  Sim
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.eDeLeilao === false ? "destructive" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, eDeLeilao: false, observacoesLeilao: "" })}
                                  data-testid="button-e-de-leilao-nao"
                                >
                                  Não
                                </Button>
                              </div>
                            </div>
                            {vehicleInfo.eDeLeilao === true && (
                              <div className="space-y-1 mt-2">
                                <label className="text-xs text-muted-foreground">Observações sobre leilão</label>
                                <Textarea
                                  placeholder="Descreva detalhes sobre o leilão (origem, sinistro, etc.)..."
                                  value={vehicleInfo.observacoesLeilao || ""}
                                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, observacoesLeilao: e.target.value })}
                                  rows={2}
                                  data-testid="textarea-observacoes-leilao"
                                />
                              </div>
                            )}
                          </div>

                          {/* Tem rastreador? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Tem rastreador?</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.temRastreador === true ? "default" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, temRastreador: true })}
                                  data-testid="button-tem-rastreador-sim"
                                >
                                  Sim
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.temRastreador === false ? "destructive" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, temRastreador: false, localizacaoRastreador: "" })}
                                  data-testid="button-tem-rastreador-nao"
                                >
                                  Não
                                </Button>
                              </div>
                            </div>
                            {vehicleInfo.temRastreador === true && (
                              <div className="space-y-1 mt-2">
                                <label className="text-xs text-muted-foreground">Localização do rastreador no veículo</label>
                                <Input
                                  type="text"
                                  placeholder="Ex: Embaixo do banco do motorista, porta-malas..."
                                  value={vehicleInfo.localizacaoRastreador || ""}
                                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, localizacaoRastreador: e.target.value })}
                                  data-testid="input-localizacao-rastreador"
                                />
                              </div>
                            )}
                          </div>

                          {/* Tem multas? */}
                          <div className="flex flex-col gap-2 p-3 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Tem multas?</label>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.temMultas === true ? "default" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, temMultas: true })}
                                  data-testid="button-tem-multas-sim"
                                >
                                  Sim
                                </Button>
                                <Button
                                  size="sm"
                                  variant={vehicleInfo.temMultas === false ? "destructive" : "outline"}
                                  onClick={() => setVehicleInfo({ ...vehicleInfo, temMultas: false, observacoesMultas: "" })}
                                  data-testid="button-tem-multas-nao"
                                >
                                  Não
                                </Button>
                              </div>
                            </div>
                            {vehicleInfo.temMultas !== undefined && vehicleInfo.temMultas !== null && (
                              <div className="space-y-1 mt-2">
                                <label className="text-xs text-muted-foreground">Observações sobre multas</label>
                                <Textarea
                                  placeholder="Descreva detalhes sobre as multas (quantidade, valor, etc.)..."
                                  value={vehicleInfo.observacoesMultas || ""}
                                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, observacoesMultas: e.target.value })}
                                  rows={2}
                                  data-testid="textarea-observacoes-multas"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Algum problema mecânico ou elétrico? */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Algum problema mecânico ou elétrico?</label>
                          <Textarea
                            placeholder="Descreva qualquer problema que o veículo possa ter..."
                            value={vehicleInfo.problemaMecanico || ""}
                            onChange={(e) => setVehicleInfo({ ...vehicleInfo, problemaMecanico: e.target.value })}
                            rows={3}
                            data-testid="textarea-problema-mecanico"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Etapa 3: Cálculo de Dividendos */}
                {currentStep === 3 && (() => {
                  // Calcular valores baseados no dividendo customizado
                  // Formato brasileiro: ponto é separador de milhar, vírgula é decimal
                  const cleanDividend = wizardCustomDividend
                    ? wizardCustomDividend.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
                    : "0";
                  const monthlyDividend = parseFloat(cleanDividend) || 0;
                  const annualRevenue = monthlyDividend * 12;

                  // Calcular rentabilidade baseado no valor FIPE
                  // Formato brasileiro: ponto é separador de milhar, vírgula é decimal
                  const cleanFipeValue = wizardFipeValue
                    ? wizardFipeValue.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
                    : "0";
                  const fipeValue = parseFloat(cleanFipeValue) || 0;
                  const rentability = fipeValue > 0 ? ((annualRevenue / fipeValue) * 100).toFixed(1) : "0";

                  // Debug: log dos valores para troubleshooting
                  console.log('🔍 Debug Rentabilidade:', {
                    wizardCustomDividend,
                    cleanDividend,
                    monthlyDividend,
                    annualRevenue,
                    wizardFipeValue,
                    cleanFipeValue,
                    fipeValue,
                    rentability
                  });

                  return (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold">Etapa 3: Projeção de Dividendos</h3>
                        <p className="text-sm text-muted-foreground">Veja quanto você pode ganhar deixando seu carro na Imobilicar</p>
                      </div>

                      <Card className="border-primary">
                        <CardHeader className="bg-primary/5">
                          <CardTitle>Seu Potencial de Rendimento</CardTitle>
                          <CardDescription>Baseado no valor FIPE e categoria do seu veículo</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                          {/* Campo editável para dividendo mensal */}
                          <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                            <label className="text-sm font-medium mb-2 block">Dividendo Mensal (Editável)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">R$</span>
                              <Input
                                type="text"
                                value={wizardCustomDividend}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d.,]/g, '');
                                  setWizardCustomDividend(value);
                                }}
                                placeholder="0,00"
                                className="text-2xl font-bold text-primary bg-white dark:bg-gray-950 h-14"
                                data-testid="input-dividend-step3"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Ajuste o valor do dividendo mensal. Os cálculos abaixo serão atualizados automaticamente.
                            </p>
                          </div>

                          {/* Dia de Pagamento dos Dividendos e Bônus */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Dia de Pagamento dos Dividendos *</label>
                              <Select
                                value={investmentBankData?.paymentDay?.toString() || ""}
                                onValueChange={(value) => setInvestmentBankData({ ...investmentBankData, paymentDay: parseInt(value) })}
                              >
                                <SelectTrigger data-testid="select-payment-day">
                                  <SelectValue placeholder="Selecione o dia do mês" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                    <SelectItem key={day} value={day.toString()}>
                                      Dia {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Escolha o dia do mês em que os dividendos serão creditados
                              </p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Data do Pagamento do Bônus</label>
                              <Input
                                type="text"
                                placeholder="DD/MM/AAAA"
                                value={investmentBankData?.bonusDate || ""}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                                  if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
                                  setInvestmentBankData({ ...investmentBankData, bonusDate: value });
                                }}
                                maxLength={10}
                                data-testid="input-bonus-date"
                              />
                              <p className="text-xs text-muted-foreground">
                                Data específica do pagamento único do bônus (opcional)
                              </p>
                            </div>
                          </div>

                          {/* Valor do Bônus */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Valor do Bônus (Pagamento Único)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">R$</span>
                              <Input
                                type="text"
                                placeholder="0,00"
                                value={investmentBankData?.bonusValue || ""}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d.,]/g, '');
                                  setInvestmentBankData({ ...investmentBankData, bonusValue: value });
                                }}
                                data-testid="input-bonus-value"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Valor único do bônus a ser pago na data especificada acima (opcional)
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center p-4 rounded-lg bg-muted">
                              <p className="text-sm text-muted-foreground mb-1">Faturamento Anual</p>
                              <p className="text-3xl font-bold text-primary">
                                R$ {annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">12 meses × R$ {monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted">
                              <p className="text-sm text-muted-foreground mb-1">Rentabilidade</p>
                              <p className="text-3xl font-bold text-primary">~{rentability}%</p>
                            </div>
                          </div>

                          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <h4 className="font-semibold flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-primary" />
                              Benefícios de Investir na Imobilicar
                            </h4>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5" />
                                <span><strong>Renda passiva garantida:</strong> Receba dividendos mensais fixos</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5" />
                                <span><strong>Nós cuidamos de tudo:</strong> Manutenção, seguros e gestão de aluguéis</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5" />
                                <span><strong>Sem preocupações:</strong> Proteção total do veículo incluída</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5" />
                                <span><strong>Rentabilidade atrativa:</strong> Melhor que deixar o carro parado</span>
                              </li>
                            </ul>
                          </div>

                          <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">
                              * Valores baseados nas cotas de investimento cadastradas no sistema
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                {/* Etapa 4: Fotos do Veículo */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="text-lg font-semibold">Etapa 4: Fotos de Vistoria do Veículo</h3>
                        <p className="text-sm text-muted-foreground">Tire fotos dos 4 ângulos do veículo (opcional - pode adicionar depois)</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(5)}
                        className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        data-testid="button-skip-inspection"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Pular Vistoria
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: "frente", label: "Frente" },
                        { key: "fundo", label: "Fundo" },
                        { key: "lateral_esquerda", label: "Lateral Esquerda" },
                        { key: "lateral_direita", label: "Lateral Direita" },
                      ].map((photo) => (
                        <div key={photo.key} className="space-y-2">
                          <label className="text-sm font-medium">{photo.label}</label>
                          <div className="relative">
                            {investmentInspectionPhotos[photo.key] ? (
                              <div className="space-y-2">
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-primary">
                                  <img
                                    src={investmentInspectionPhotos[photo.key]}
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
                                      const input = document.getElementById(`investment-photo-${photo.key}`) as HTMLInputElement;
                                      if (input) input.click();
                                    }}
                                    data-testid={`button-change-investment-photo-${photo.key}`}
                                  >
                                    <Camera className="h-4 w-4 mr-2" />
                                    Trocar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      const newPhotos = { ...investmentInspectionPhotos };
                                      delete newPhotos[photo.key];
                                      setInvestmentInspectionPhotos(newPhotos);
                                    }}
                                    data-testid={`button-remove-investment-photo-${photo.key}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                  </Button>
                                </div>
                                <input
                                  id={`investment-photo-${photo.key}`}
                                  type="file"
                                  accept="image/*"

                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const compressedImage = await compressImage(file);
                                        setInvestmentInspectionPhotos({
                                          ...investmentInspectionPhotos,
                                          [photo.key]: compressedImage
                                        });
                                      } catch (error) {
                                        console.error('Erro ao processar foto:', error);
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
                                    const input = document.getElementById(`investment-photo-${photo.key}`) as HTMLInputElement;
                                    if (input) input.click();
                                  }}
                                  data-testid={`button-upload-investment-photo-${photo.key}`}
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Adicionar Foto
                                </Button>
                                <input
                                  id={`investment-photo-${photo.key}`}
                                  type="file"
                                  accept="image/*"

                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const compressedImage = await compressImage(file);
                                        setInvestmentInspectionPhotos({
                                          ...investmentInspectionPhotos,
                                          [photo.key]: compressedImage
                                        });
                                      } catch (error) {
                                        console.error('Erro ao processar foto:', error);
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

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Avarias Presentes</label>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant={hasDamages === true ? "default" : "outline"}
                            className={hasDamages === true ? "bg-orange-600 hover:bg-orange-700" : ""}
                            onClick={() => setHasDamages(true)}
                            data-testid="button-has-damages-yes"
                          >
                            Sim
                          </Button>
                          <Button
                            type="button"
                            variant={hasDamages === false ? "default" : "outline"}
                            onClick={() => {
                              setHasDamages(false);
                              const newPhotos: Record<string, string> = {};
                              Object.keys(investmentInspectionPhotos).forEach(key => {
                                if (!key.startsWith('damage_') && key !== 'notes') {
                                  newPhotos[key] = investmentInspectionPhotos[key];
                                }
                              });
                              setInvestmentInspectionPhotos(newPhotos);
                            }}
                            data-testid="button-has-damages-no"
                          >
                            Não
                          </Button>
                        </div>
                      </div>

                      {/* Detalhamento de avarias - só aparece se "Sim" */}
                      {hasDamages === true && (
                        <div className="space-y-4 p-4 rounded-lg border-2 border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-orange-700 dark:text-orange-300">Descrição das Avarias</label>
                            <Textarea
                              placeholder="Descreva quaisquer danos, arranhões ou problemas observados no veículo..."
                              value={investmentInspectionPhotos.notes || ""}
                              onChange={(e) => setInvestmentInspectionPhotos({ ...investmentInspectionPhotos, notes: e.target.value })}
                              rows={4}
                              className="border-orange-300 focus:border-orange-500"
                              data-testid="textarea-investment-damages"
                            />
                          </div>

                          {/* Fotos de Avarias */}
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-orange-700 dark:text-orange-300">Fotos das Avarias</label>

                            {/* Galeria de fotos de avaria */}
                            {(() => {
                              const damagePhotos: string[] = [];
                              for (let i = 1; i <= 10; i++) {
                                const key = `damage_${i}`;
                                if (investmentInspectionPhotos[key]) {
                                  damagePhotos.push(key);
                                }
                              }

                              return damagePhotos.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {damagePhotos.map((key, index) => (
                                    <div key={key} className="relative group">
                                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                                        <img
                                          src={investmentInspectionPhotos[key]}
                                          alt={`Avaria ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                          const newPhotos = { ...investmentInspectionPhotos };
                                          delete newPhotos[key];
                                          setInvestmentInspectionPhotos(newPhotos);
                                        }}
                                        data-testid={`button-remove-damage-photo-${index}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                                        {index + 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : null;
                            })()}

                            {/* Botão para adicionar foto de avaria */}
                            {(() => {
                              let count = 0;
                              for (let i = 1; i <= 10; i++) {
                                if (investmentInspectionPhotos[`damage_${i}`]) count++;
                              }
                              return count < 10 ? (
                                <div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-orange-500/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                                    onClick={() => {
                                      const input = document.getElementById('damage-photo-input');
                                      if (input) input.click();
                                    }}
                                    data-testid="button-add-damage-photo"
                                  >
                                    <Camera className="h-4 w-4 mr-2" />
                                    Adicionar Foto de Avaria ({count}/10)
                                  </Button>
                                  <input
                                    id="damage-photo-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const compressedImage = await compressImage(file);
                                          let nextSlot = 1;
                                          for (let i = 1; i <= 10; i++) {
                                            if (!investmentInspectionPhotos[`damage_${i}`]) {
                                              nextSlot = i;
                                              break;
                                            }
                                          }
                                          setInvestmentInspectionPhotos({
                                            ...investmentInspectionPhotos,
                                            [`damage_${nextSlot}`]: compressedImage
                                          });
                                        } catch (error) {
                                          console.error('Erro ao processar foto:', error);
                                          toast({
                                            title: "Erro",
                                            description: "Não foi possível processar a foto.",
                                            variant: "destructive"
                                          });
                                        }
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">Limite de 10 fotos de avaria atingido</p>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Documentos Adicionais */}
                    <div className="mt-8 pt-6 border-t">
                      <h4 className="text-md font-semibold mb-4">Documentos Adicionais (Opcional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Laudo Cautelar */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Laudo Cautelar</label>
                          {investmentAdditionalDocs.laudoCautelar ? (
                            <div className="space-y-2">
                              <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-xs flex-1 truncate">Arquivo anexado</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.getElementById('doc-laudo-cautelar');
                                    if (input) input.click();
                                  }}
                                  data-testid="button-change-laudo-cautelar"
                                >
                                  Trocar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setInvestmentAdditionalDocs({ ...investmentAdditionalDocs, laudoCautelar: undefined })}
                                  data-testid="button-remove-laudo-cautelar"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const input = document.getElementById('doc-laudo-cautelar');
                                if (input) input.click();
                              }}
                              data-testid="button-upload-laudo-cautelar"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Anexar Laudo
                            </Button>
                          )}
                          <input
                            id="doc-laudo-cautelar"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const processedFile = await processFileUpload(file);
                                  setInvestmentAdditionalDocs({ ...investmentAdditionalDocs, laudoCautelar: processedFile });
                                } catch (error) {
                                  console.error('Erro ao processar documento:', error);
                                  toast({
                                    title: "Erro",
                                    description: "Não foi possível processar o documento.",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          />
                        </div>

                        {/* Laudo Mecânico */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Laudo Mecânico</label>
                          {investmentAdditionalDocs.laudoMecanico ? (
                            <div className="space-y-2">
                              <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-xs flex-1 truncate">Arquivo anexado</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.getElementById('doc-laudo-mecanico');
                                    if (input) input.click();
                                  }}
                                  data-testid="button-change-laudo-mecanico"
                                >
                                  Trocar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setInvestmentAdditionalDocs({ ...investmentAdditionalDocs, laudoMecanico: undefined })}
                                  data-testid="button-remove-laudo-mecanico"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const input = document.getElementById('doc-laudo-mecanico');
                                if (input) input.click();
                              }}
                              data-testid="button-upload-laudo-mecanico"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Anexar Laudo
                            </Button>
                          )}
                          <input
                            id="doc-laudo-mecanico"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const processedFile = await processFileUpload(file);
                                  setInvestmentAdditionalDocs({ ...investmentAdditionalDocs, laudoMecanico: processedFile });
                                } catch (error) {
                                  console.error('Erro ao processar documento:', error);
                                  toast({
                                    title: "Erro",
                                    description: "Não foi possível processar o documento.",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          />
                        </div>

                        {/* CRLV */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CRLV</label>
                          {investmentAdditionalDocs.crlv ? (
                            <div className="space-y-2">
                              <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-xs flex-1 truncate">Arquivo anexado</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.getElementById('doc-crlv');
                                    if (input) input.click();
                                  }}
                                  data-testid="button-change-crlv"
                                >
                                  Trocar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setInvestmentAdditionalDocs({ ...investmentAdditionalDocs, crlv: undefined })}
                                  data-testid="button-remove-crlv"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const input = document.getElementById('doc-crlv');
                                if (input) input.click();
                              }}
                              data-testid="button-upload-crlv"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Anexar CRLV
                            </Button>
                          )}
                          <input
                            id="doc-crlv"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const processedFile = await processFileUpload(file);
                                  setInvestmentAdditionalDocs({ ...investmentAdditionalDocs, crlv: processedFile });
                                } catch (error) {
                                  console.error('Erro ao processar documento:', error);
                                  toast({
                                    title: "Erro",
                                    description: "Não foi possível processar o documento.",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          />
                        </div>

                        {/* Outros */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Outros</label>
                          {investmentAdditionalDocs.outros ? (
                            <div className="space-y-2">
                              <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <span className="text-xs flex-1 truncate">Arquivo anexado</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    const input = document.getElementById('doc-outros');
                                    if (input) input.click();
                                  }}
                                  data-testid="button-change-outros"
                                >
                                  Trocar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setInvestmentAdditionalDocs({ ...investmentAdditionalDocs, outros: undefined })}
                                  data-testid="button-remove-outros"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                const input = document.getElementById('doc-outros');
                                if (input) input.click();
                              }}
                              data-testid="button-upload-outros"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Anexar Documento
                            </Button>
                          )}
                          <input
                            id="doc-outros"
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const processedFile = await processFileUpload(file);
                                  setInvestmentAdditionalDocs({ ...investmentAdditionalDocs, outros: processedFile });
                                } catch (error) {
                                  console.error('Erro ao processar documento:', error);
                                  toast({
                                    title: "Erro",
                                    description: "Não foi possível processar o documento.",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Etapa 5: Contrato */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">Etapa 5: Contrato de Parceria</h3>
                      <p className="text-sm text-muted-foreground">Revise os dados completos e gere o contrato de cessão</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-primary/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Dados do Investidor
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Nome:</span>
                            <span className="font-medium">{customerData?.name || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CPF:</span>
                            <span className="font-medium">{customerData?.cpf || "—"}</span>
                          </div>
                          {customerData?.rg && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">RG:</span>
                              <span className="font-medium">{customerData.rg}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Telefone:</span>
                            <span className="font-medium">{customerData?.phone || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium text-xs">{customerData?.email || "—"}</span>
                          </div>
                          {customerData?.street && (
                            <div className="pt-2 border-t">
                              <p className="text-muted-foreground text-xs">Endereço:</p>
                              <p className="font-medium text-xs">
                                {customerData.street}{customerData.number ? `, ${customerData.number}` : ''}{customerData.complement ? ` - ${customerData.complement}` : ''}
                                {customerData.neighborhood ? `, ${customerData.neighborhood}` : ''}
                                {customerData.city ? ` - ${customerData.city}/${customerData.state}` : ''}
                                {customerData.zipCode ? ` - CEP ${customerData.zipCode}` : ''}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-cyan-500/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Car className="h-4 w-4 text-cyan-500" />
                            Dados do Veículo
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Marca/Modelo:</span>
                            <span className="font-medium">{investmentVehicleData?.brand} {investmentVehicleData?.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ano:</span>
                            <span className="font-medium">{investmentVehicleData?.year || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Placa:</span>
                            <span className="font-medium">{investmentVehicleData?.plate || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Categoria:</span>
                            <span className="font-medium capitalize">{investmentVehicleData?.category || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Câmbio:</span>
                            <span className="font-medium capitalize">{investmentVehicleData?.transmission || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Motor:</span>
                            <span className="font-medium">{investmentVehicleData?.fuel || "—"}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          Condições Financeiras
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                          <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border flex-1 min-w-[140px] max-w-[180px]">
                            <p className="text-muted-foreground text-xs mb-1">Valor FIPE</p>
                            <p className="text-lg font-bold text-primary">
                              {wizardFipeValue || investmentVehicleData?.fipeValue || "—"}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-500/30 flex-1 min-w-[140px] max-w-[180px]">
                            <p className="text-muted-foreground text-xs mb-1">Dividendo Mensal</p>
                            <p className="text-lg font-bold text-green-600">
                              R$ {(() => {
                                const cleanDividend = wizardCustomDividend
                                  ? wizardCustomDividend.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
                                  : "0";
                                const monthlyDividend = parseFloat(cleanDividend) || 0;
                                return monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                              })()}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border flex-1 min-w-[140px] max-w-[180px]">
                            <p className="text-muted-foreground text-xs mb-1">Dia do Pagamento</p>
                            <p className="text-lg font-bold">Dia {investmentBankData?.paymentDay || "—"}</p>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-500/30 flex-1 min-w-[140px] max-w-[180px]">
                            <p className="text-muted-foreground text-xs mb-1">Valor do Bônus</p>
                            <p className="text-lg font-bold text-amber-600">
                              {investmentBankData?.bonusValue ? `R$ ${investmentBankData.bonusValue}` : "—"}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-500/30 flex-1 min-w-[140px] max-w-[180px]">
                            <p className="text-muted-foreground text-xs mb-1">Data do Bônus</p>
                            <p className="text-lg font-bold text-amber-600">
                              {investmentBankData?.bonusDate || "—"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Contrato de Cessão de Veículo</label>
                      <p className="text-xs text-muted-foreground">
                        Gere automaticamente o contrato de cessão no modelo IMOBILICAR 2025, ou faça upload do contrato assinado
                      </p>

                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={async () => {
                          if (!customerData || !investmentVehicleData) {
                            toast({
                              title: "Erro",
                              description: "Dados do investidor ou veículo não encontrados",
                              variant: "destructive",
                            });
                            return;
                          }

                          try {
                            const response = await fetch('/api/generate-investor-contract-docx', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                customer: {
                                  name: customerData.name || '',
                                  cpf: customerData.cpf || '',
                                  rg: customerData.rg || '',
                                  phone: customerData.phone || '',
                                  email: customerData.email || '',
                                  street: customerData.street || '',
                                  complement: customerData.number || '',
                                  neighborhood: customerData.neighborhood || '',
                                  city: customerData.city || '',
                                  state: customerData.state || '',
                                  zipCode: customerData.zipCode || '',
                                },
                                vehicle: {
                                  brand: investmentVehicleData.brand || '',
                                  model: investmentVehicleData.model || investmentVehicleData.name || '',
                                  year: investmentVehicleData.year || '',
                                  plate: investmentVehicleData.plate || '',
                                  renavam: '',
                                  chassi: '',
                                },
                                customDividend: wizardCustomDividend || '0',
                                bonusValue: investmentBankData?.bonusValue || '0',
                                debitosVeiculo: '',
                                paymentDate: investmentBankData?.paymentDay?.toString() || '20',
                              }),
                            });

                            if (!response.ok) {
                              throw new Error('Falha ao gerar contrato de cessão');
                            }

                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Contrato de Cessao - ${customerData.name} - ${investmentVehicleData.plate || investmentVehicleData.name} - ${format(new Date(), "dd-MM-yyyy")}.docx`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);

                            toast({
                              title: "Sucesso",
                              description: "Contrato de cessão gerado com sucesso! Baixe, imprima e faça o upload do documento assinado.",
                            });
                          } catch (error) {
                            toast({
                              title: "Erro",
                              description: error instanceof Error ? error.message : "Erro ao gerar contrato de cessão",
                              variant: "destructive",
                            });
                          }
                        }}
                        data-testid="button-generate-cession-contract"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Contrato de Cessão
                      </Button>

                      <p className="text-xs text-muted-foreground italic">
                        As tabelas "Itens Verificados" e "Item de revisão/ajuste" já vêm preenchidas com os valores padrão. O contrato inclui a logo da Imobilicar.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Upload do Contrato Assinado *</label>
                      <p className="text-xs text-muted-foreground">
                        Faça o upload do contrato de parceria assinado (PDF, imagem ou documento)
                      </p>

                      {contractData?.fileUrl ? (
                        <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                          <FileText className="h-8 w-8 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">Contrato anexado</p>
                            <p className="text-xs text-muted-foreground">{contractData?.fileName}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setContractData(null)}
                          >
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground mb-1">Nenhum contrato anexado</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const input = document.getElementById('investment-contract-input') as HTMLInputElement;
                              if (input) input.click();
                            }}
                            data-testid="button-upload-investment-contract"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Adicionar Contrato
                          </Button>
                          <input
                            id="investment-contract-input"
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            className="hidden"
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
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Etapa 6: Criar Conta */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">Etapa 6: Criar Conta do Investidor</h3>
                      <p className="text-sm text-muted-foreground">Confirme a criação da conta de acesso do investidor</p>
                    </div>

                    {/* Resumo do Investidor */}
                    <Card className="border-primary/30">
                      <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-primary" />
                          Dados do Investidor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Nome</p>
                            <p className="font-medium">{customerData?.name || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CPF</p>
                            <p className="font-medium">{customerData?.cpf || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="font-medium">{customerData?.email || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Telefone</p>
                            <p className="font-medium">{customerData?.phone || "-"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Resumo do Veículo */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                          <Car className="h-5 w-5 text-cyan-500" />
                          Veículo Investido
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Veículo</p>
                            <p className="font-medium">{investmentVehicleData?.brand && investmentVehicleData?.model ? `${investmentVehicleData.brand} ${investmentVehicleData.model}` : "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Placa</p>
                            <p className="font-medium">{investmentVehicleData?.plate || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor FIPE</p>
                            <p className="font-medium text-primary">{wizardFipeValue || "-"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Dividendo Mensal</p>
                            <p className="font-medium text-green-600">R$ {wizardCustomDividend || "0,00"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Informações de Acesso */}
                    <Card className="border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
                      <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2 text-amber-700 dark:text-amber-300">
                          <Key className="h-5 w-5" />
                          Credenciais de Acesso
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Login (CPF):</span>
                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{customerData?.cpf?.replace(/\D/g, '') || "-"}</code>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Senha:</span>
                            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">Investicar@2025</code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Ao confirmar, será criado:</p>
                          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                            <li>- Cadastro do investidor no sistema</li>
                            <li>- Veículo adicionado à frota</li>
                            <li>- Conta de acesso ao portal do investidor</li>
                            <li>- Perfil visível na seção "Usuários"</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navegação */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  data-testid="button-wizard-previous"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                {currentStep < 6 ? (
                  <Button
                    onClick={() => {
                      // Validação da etapa 5 (Contrato)
                      if (currentStep === 5) {
                        if (!contractData?.fileUrl) {
                          toast({
                            title: "Contrato obrigatório",
                            description: "Por favor, anexe o contrato antes de continuar.",
                            variant: "destructive",
                          });
                          return;
                        }
                      }

                      setCurrentStep(prev => Math.min(6, prev + 1));
                    }}
                    data-testid="button-wizard-next"
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      setInvestmentSubmitting(true);
                      try {
                        // Collect damage photos from damage_1, damage_2, etc. into an array
                        const damagePhotosArray: string[] = [];
                        for (let i = 1; i <= 10; i++) {
                          const key = `damage_${i}`;
                          if (investmentInspectionPhotos[key]) {
                            damagePhotosArray.push(investmentInspectionPhotos[key]);
                          }
                        }

                        // Prepare inspection photos with damage info in the format expected by backend
                        const inspectionPhotosPayload = {
                          ...investmentInspectionPhotos,
                          hasDamages: hasDamages === true,
                          damagePhotos: damagePhotosArray,
                          damageNotes: investmentInspectionPhotos.notes || null,
                        };

                        // Prepare data to send - includes createAccount flag
                        const investmentData = {
                          customer: {
                            ...customerData,
                            isVehicleOwner,
                            vehicleOwnerName: isVehicleOwner ? "" : vehicleOwnerName,
                          },
                          vehicle: {
                            ...investmentVehicleData,
                            plate: investmentVehicleData?.plate,
                            fipeValue: wizardFipeValue,
                          },
                          vehicleInfo: vehicleInfo,
                          inspectionPhotos: inspectionPhotosPayload,
                          additionalDocs: investmentAdditionalDocs,
                          bankData: investmentBankData,
                          contract: contractData,
                          customDividend: wizardCustomDividend?.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.'),
                          investorDocuments: investorDocuments,
                          createInvestorAccount: true,
                          // Bonus do veículo (pagamento único)
                          vehicleBonus: {
                            bonusDate: investmentBankData?.bonusDate || null,
                            bonusValue: investmentBankData?.bonusValue || null,
                          },
                        };

                        // Send to backend
                        const response = await fetch('/api/admin/investments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(investmentData),
                        });

                        if (!response.ok) {
                          throw new Error('Failed to create investment');
                        }

                        const result = await response.json();

                        toast({
                          title: "Investidor cadastrado com sucesso!",
                          description: "O veículo foi adicionado à frota e a conta de acesso foi criada.",
                        });

                        // Invalidate queries to refresh data
                        queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/investors'] });

                        // Close dialog and reset wizard
                        setNewSaleDialogOpen(false);
                        setCurrentStep(1);
                        setCustomerData(null);
                        setInvestorDocuments({});
                        setVehicleInfo({});
                        setInvestmentVehicleData(null);
                        setInvestmentInspectionPhotos({});
                        setInvestmentAdditionalDocs({});
                        setInvestmentBankData(null);
                        setContractData(null);
                        setWizardFipeValue("");
                        setWizardCustomDividend("");
                        setIsVehicleOwner(true);
                        setVehicleOwnerName("");
                        setHasDamages(null);
                      } catch (error) {
                        console.error('Error creating investment:', error);
                        toast({
                          title: "Erro ao criar investimento",
                          description: "Ocorreu um erro ao processar o investimento.",
                          variant: "destructive",
                        });
                      } finally {
                        setInvestmentSubmitting(false);
                      }
                    }}
                    disabled={investmentSubmitting}
                    data-testid="button-wizard-finish"
                  >
                    {investmentSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        Confirmar e Criar Conta
                        <Key className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Wizard de Financiamento */}
          {saleType === "financing" && (
            <FinancingWizardProvider>
              <FinancingWizard />
            </FinancingWizardProvider>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Assinaturas Digitais */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinaturas Digitais</DialogTitle>
            <DialogDescription>
              Colete as assinaturas do cliente e do vistoriador antes de gerar o PDF
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Assinatura do Cliente */}
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

            {/* Assinatura do Vistoriador */}
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

                  // Converter blob para base64 para salvar no estado
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64data = reader.result as string;
                    const fileName = `vistoria-${selectedVehicle?.plate || 'veiculo'}-${new Date().toISOString().split('T')[0]}.pdf`;

                    // Salvar no estado para incluir nos dados do financiamento
                    setInspectionPdfData({
                      fileName,
                      fileUrl: base64data
                    });
                  };
                  reader.readAsDataURL(blob);

                  // Baixar o arquivo também
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
                    description: "Relatório de vistoria com assinaturas baixado e salvo nos dados do financiamento.",
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

      <div className="flex min-h-screen">
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-60'} flex-shrink-0 border-r bg-muted/20 transition-all duration-300 hidden md:flex md:flex-col`}>
          <div className="sticky top-0 p-3 space-y-4 overflow-y-auto max-h-screen">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className={`w-full justify-start gap-2 text-muted-foreground ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              data-testid="button-back-home"
              title={sidebarCollapsed ? "Voltar ao site" : undefined}
            >
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm">Voltar ao site</span>}
            </Button>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3" data-testid="text-sidebar-menu">Menu</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
                data-testid="button-toggle-sidebar"
                className="ml-auto"
              >
                {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
            </div>

            {!sidebarCollapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full" data-testid="button-new-sale">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Venda
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setSaleType("rental");
                      setNewSaleDialogOpen(true);
                    }}
                    data-testid="menu-item-rental"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Aluguel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSaleType("financing");
                      setNewSaleDialogOpen(true);
                    }}
                    data-testid="menu-item-financing"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Financiamento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {sidebarCollapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="w-full" data-testid="button-new-sale-collapsed">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setSaleType("rental");
                      setNewSaleDialogOpen(true);
                    }}
                    data-testid="menu-item-rental-collapsed"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Aluguel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSaleType("financing");
                      setNewSaleDialogOpen(true);
                    }}
                    data-testid="menu-item-financing-collapsed"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Financiamento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div>
              {!sidebarCollapsed && (
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2" data-testid="text-group-operacoes">Operações</h3>
              )}
              <div className="space-y-1">
                {[
                  { value: "dashboard", label: "BI", icon: LayoutDashboard, badge: 0 },
                  { value: "leads", label: "Leads", icon: Users, badge: newLeadsCount },
                  { value: "clientes", label: "Clientes", icon: UserCheck, badge: 0 },
                  { value: "frota", label: "Frota", icon: Car, badge: 0 },
                  { value: "veiculos-troca", label: "Veíc. de Troca", icon: ArrowLeftRight, badge: newTradeInVehiclesCount },
                  { value: "financiamentos", label: "Financiamentos", icon: CreditCard, badge: pendingFinancingsCount },
                  { value: "alugueis", label: "Aluguéis", icon: Key, badge: pendingRequestsCount },
                  { value: "investidores", label: "Investidores", icon: Briefcase, badge: 0 },
                  { value: "eventos", label: "Eventos", icon: AlertCircle, badge: 0 },
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant="ghost"
                    onClick={() => handleTabChange(item.value)}
                    className={`relative w-full justify-start gap-3 ${sidebarCollapsed ? 'justify-center' : ''} toggle-elevate ${activeTab === item.value ? "toggle-elevated bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    data-testid={`nav-${item.value}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {!sidebarCollapsed && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs" data-testid={`badge-${item.value}`}>
                        {item.badge}
                      </Badge>
                    )}
                    {sidebarCollapsed && item.badge > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-destructive" data-testid={`dot-${item.value}`} />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              {!sidebarCollapsed && (
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2" data-testid="text-group-configuracoes">Configurações</h3>
              )}
              <div className="space-y-1">
                {[
                  { value: "usuarios", label: "Usuários", icon: Shield, badge: 0 },
                  { value: "logs", label: "Logs", icon: ClipboardList, badge: 0 },
                  { value: "solicitacoes", label: "Solicitações", icon: Zap, badge: pendingVehicleRequestsCount },
                ].map((item) => (
                  <Button
                    key={item.value}
                    variant="ghost"
                    onClick={() => handleTabChange(item.value)}
                    className={`relative w-full justify-start gap-3 ${sidebarCollapsed ? 'justify-center' : ''} toggle-elevate ${activeTab === item.value ? "toggle-elevated bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    data-testid={`nav-${item.value}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {!sidebarCollapsed && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs" data-testid={`badge-${item.value}`}>
                        {item.badge}
                      </Badge>
                    )}
                    {sidebarCollapsed && item.badge > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-destructive" data-testid={`dot-${item.value}`} />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 mt-auto">
              <Button
                variant="ghost"
                onClick={() => {
                  localStorage.removeItem("adminAuth");
                  setLocation("/admin");
                  window.location.reload();
                }}
                className={`w-full justify-start gap-3 text-muted-foreground ${sidebarCollapsed ? 'justify-center' : ''}`}
                data-testid="button-logout"
                title={sidebarCollapsed ? "Sair" : undefined}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>Sair</span>}
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 px-4 lg:px-8 py-6 overflow-x-hidden">
          {rentalsLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          )}

          {rentalsError && (
            <Card className="mb-8">
              <CardContent className="py-8">
                <p className="text-center text-destructive">
                  Erro ao carregar dados. Por favor, tente novamente.
                </p>
              </CardContent>
            </Card>
          )}

          {!rentalsLoading && !rentalsError && (
            <>
              {/* Quadros de estatísticas ocultos
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} data-testid={`card-crm-stat-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-crm-stat-${index}`}>
                  {stat.value}
                </div>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        */}

              {/* Alertas de Solicitações Pendentes */}
              {vehicleRequests && vehicleRequests.filter((r: any) => r.status === "pending").length > 0 && (
                <Card className="border-primary bg-primary/5 mb-6">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <AlertCircle className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-primary">
                          {vehicleRequests.filter((r: any) => r.status === "pending").length} {vehicleRequests.filter((r: any) => r.status === "pending").length === 1 ? "Solicitação Pendente" : "Solicitações Pendentes"}
                        </CardTitle>
                        <CardDescription>
                          {vehicleRequests.filter((r: any) => r.status === "pending").length === 1
                            ? "Há uma nova solicitação de investimento aguardando aprovação"
                            : `Há ${vehicleRequests.filter((r: any) => r.status === "pending").length} novas solicitações de investimento aguardando aprovação`
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vehicleRequests
                        .filter((r: any) => r.status === "pending")
                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((request: any) => (
                          <Card key={request.id} className="bg-background border-primary/20" data-testid={`alert-request-${request.id}`}>
                            <CardHeader className="pb-3">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="flex-1">
                                  <CardTitle className="text-base">
                                    {request.brand} {request.model} {request.year}
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Investidor: {request.investor?.name} • {request.investor?.email}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline">{request.category}</Badge>
                                  {request.licensePlate && (
                                    <Badge variant="outline">{request.licensePlate}</Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Valor FIPE:</span>
                                    <span className="ml-2 font-semibold text-primary">
                                      R$ {Number(request.fipeValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Solicitado:</span>
                                    <span className="ml-2 font-medium">
                                      {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedVehicleRequest(request);
                                      setViewPhotosDialogOpen(true);
                                    }}
                                    data-testid={`button-alert-view-photos-${request.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Fotos
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedVehicleRequest(request);

                                      // Buscar cota de investimento correspondente à categoria do veículo
                                      const matchingQuota = investmentQuotas?.find(
                                        (quota: any) => quota.category === request.category
                                      );

                                      setApprovalData({
                                        pricePerDay: "",
                                        monthlyPrice: "",
                                        customDividend: matchingQuota?.minDividend || ""
                                      });
                                      setApproveRequestDialogOpen(true);
                                    }}
                                    data-testid={`button-alert-approve-${request.id}`}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Tem certeza que deseja rejeitar a solicitação de ${request.name}?`)) {
                                        rejectVehicleRequestMutation.mutate(request.id);
                                      }
                                    }}
                                    data-testid={`button-alert-reject-${request.id}`}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="md:hidden mb-2">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/")}
                  className="gap-2 text-muted-foreground"
                  data-testid="button-back-home-mobile"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Voltar ao site</span>
                </Button>
              </div>
              <div className="md:hidden w-full overflow-x-auto pb-2 mb-4 scrollbar-thin">
                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-max">
                  {[
                    { value: "dashboard", label: "BI", badge: 0 },
                    { value: "leads", label: "Leads", badge: newLeadsCount },
                    { value: "clientes", label: "Clientes", badge: 0 },
                    { value: "frota", label: "Frota", badge: 0 },
                    { value: "veiculos-troca", label: "Troca", badge: newTradeInVehiclesCount },
                    { value: "financiamentos", label: "Financ.", badge: pendingFinancingsCount },
                    { value: "alugueis", label: "Aluguéis", badge: pendingRequestsCount },
                    { value: "investidores", label: "Invest.", badge: 0 },
                    { value: "eventos", label: "Eventos", badge: 0 },
                    { value: "contratos", label: "Contratos", badge: 0 },
                    { value: "usuarios", label: "Usuários", badge: 0 },
                    { value: "logs", label: "Logs", badge: 0 },
                    { value: "solicitacoes", label: "Solic.", badge: pendingVehicleRequestsCount },
                  ].map((item) => (
                    <Button
                      key={item.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTabChange(item.value)}
                      className={`relative whitespace-nowrap text-xs toggle-elevate ${activeTab === item.value ? "toggle-elevated bg-primary text-primary-foreground" : "text-muted-foreground"
                        }`}
                      data-testid={`tab-mobile-${item.value}`}
                    >
                      {item.label}
                      {item.badge > 0 && (
                        <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 text-[10px]" data-testid={`badge-mobile-${item.value}`}>
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

                <TabsContent value="dashboard">
                  {(() => {
                    const totalVehicles = vehicles?.length || 0;
                    const availableVehicles = vehicles?.filter((v: any) => v.available).length || 0;
                    const unavailableVehicles = vehicles?.filter((v: any) => !v.available).length || 0;
                    const investorVehicles = vehicles?.filter((v: any) => v.ownerId).length || 0;
                    const companyVehicles = totalVehicles - investorVehicles;
                    const totalRentals = rentals?.length || 0;
                    const activeRentals = rentals?.filter((r: any) => r.status === "approved").length || 0;
                    const completedRentals = rentals?.filter((r: any) => r.status === "completed").length || 0;
                    const totalRevenue = rentals?.reduce((sum: number, r: any) => sum + Number(r.totalPrice), 0) || 0;
                    const totalCustomers = customers?.length || 0;
                    const publicCustomers = customers?.filter((c: any) => c.password).length || 0;
                    const investorOwnerIds = new Set(vehicles?.filter((v: any) => v.isInvestorVehicle && v.ownerId).map((v: any) => v.ownerId));
                    const approvedInvestors = investorOwnerIds.size;
                    const totalFinancings = financings?.length || 0;
                    const activeFinancings = financings?.filter((f: any) => f.status === "ativo").length || 0;
                    const financingRevenue = financings?.reduce((sum: number, f: any) => sum + Number(f.totalCost), 0) || 0;
                    const totalClaims = customerEvents?.filter((e: any) => e.type === "sinistro").reduce((sum: number, e: any) => sum + Number(e.cost || 0), 0) || 0;
                    const totalOperationalExpenses = operationalExpenses?.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) || 0;
                    const monthlyDividendTotal = dividendSummary?.currentPeriod?.total || 0;
                    const totalExpenses = monthlyDividendTotal + totalClaims + totalOperationalExpenses;
                    const averageRentalDays = rentals && rentals.length > 0
                      ? Math.round(rentals.reduce((sum: number, r: any) => {
                        if (r.startDate && r.endDate) {
                          const days = Math.abs(Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24)));
                          return sum + days;
                        }
                        return sum;
                      }, 0) / rentals.length)
                      : 0;

                    return (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-2xl font-bold mb-1" data-testid="text-bi-title">Business Intelligence</h2>
                          <p className="text-muted-foreground text-sm">Acompanhe o desempenho geral do seu negócio em tempo real</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <h3 className="text-lg font-semibold">Receita e Finanças</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card data-testid="card-bi-revenue-rentals">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total (Aluguéis)</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid="text-bi-revenue-rentals">
                                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{totalRentals} aluguéis realizados</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-revenue-financings">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Financiamentos</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-500" data-testid="text-bi-revenue-financings">
                                  R$ {financingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{totalFinancings} financiamentos</p>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20" data-testid="card-bi-revenue-total">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total Geral</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-primary">
                                  R$ {(totalRevenue + financingRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Aluguéis + Financiamentos</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <ArrowDownCircle className="h-5 w-5 text-red-600" />
                            <h3 className="text-lg font-semibold">Despesas e Saídas</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="cursor-pointer hover-elevate" data-testid="card-bi-dividends-monthly" onClick={() => { setDividendModalType("current"); setDividendModalOpen(true); }}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Dividendos Mensais</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                    <Users className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-500" data-testid="text-bi-dividends-monthly">
                                  {dividendSummaryLoading ? <span className="animate-pulse">...</span> : `R$ ${(dividendSummary?.currentPeriod?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Obrigação mensal aos investidores</p>
                                <p className="text-xs text-primary mt-1 flex items-center gap-1"><Eye className="h-3 w-3" /> Clique para ver detalhes</p>
                              </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover-elevate" data-testid="card-bi-dividends-cumulative" onClick={() => { setDividendModalType("cumulative"); setDividendModalOpen(true); }}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Dividendos Pagos (Acumulado)</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-500" data-testid="text-bi-dividends-cumulative">
                                  {dividendSummaryLoading ? <span className="animate-pulse">...</span> : `R$ ${(dividendSummary?.cumulative?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Total histórico pago</p>
                                <p className="text-xs text-primary mt-1 flex items-center gap-1"><Eye className="h-3 w-3" /> Clique para ver detalhes</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-claims">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Sinistros</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-500" data-testid="text-bi-claims">
                                  R$ {totalClaims.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{customerEvents?.filter((e: any) => e.type === "sinistro").length || 0} eventos registrados</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-operational">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Despesas Operacionais</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-rose-600 dark:text-rose-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-rose-600 dark:text-rose-500" data-testid="text-bi-operational">
                                  R$ {totalOperationalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{operationalExpenses?.length || 0} despesas registradas</p>
                              </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20" data-testid="card-bi-total-expenses">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Saídas</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                    <ArrowDownCircle className="h-4 w-4 text-destructive" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-destructive">
                                  R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Dividendos + Sinistros + Operacional</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Car className="h-5 w-5 text-cyan-600" />
                            <h3 className="text-lg font-semibold">Frota de Veículos</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card data-testid="card-bi-total-vehicles">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Veículos na Frota</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0">
                                    <Car className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-500" data-testid="text-bi-total-vehicles">{totalVehicles}</div>
                                <p className="text-xs text-muted-foreground mt-1">{companyVehicles} próprios, {investorVehicles} investidores</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-available-vehicles">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Veículos Disponíveis</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                    <Car className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500" data-testid="text-bi-available-vehicles">{availableVehicles}</div>
                                <p className="text-xs text-muted-foreground mt-1">{totalVehicles - availableVehicles} em uso</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-utilization">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Utilização</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                  {totalVehicles > 0 ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100) : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Veículos sendo usados</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-unavailable-vehicles">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Veículos Indisponíveis</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                    <Car className="h-4 w-4 text-red-600 dark:text-red-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-500" data-testid="text-bi-unavailable-vehicles">{unavailableVehicles}</div>
                                <p className="text-xs text-muted-foreground mt-1">Marcados como indisponíveis</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <h3 className="text-lg font-semibold">Operações</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card data-testid="card-bi-rentals">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Aluguéis</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-500" data-testid="text-bi-rentals">{totalRentals}</div>
                                <p className="text-xs text-muted-foreground mt-1">{activeRentals} ativos, {completedRentals} finalizados</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-financings">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Financiamentos</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500" data-testid="text-bi-financings">{totalFinancings}</div>
                                <p className="text-xs text-muted-foreground mt-1">{activeFinancings} ativos</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-customers">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-500" data-testid="text-bi-customers">{totalCustomers}</div>
                                <p className="text-xs text-muted-foreground mt-1">{publicCustomers} com cadastro público</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-investors">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Investidores Aprovados</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center flex-shrink-0">
                                    <Users className="h-4 w-4 text-pink-600 dark:text-pink-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-pink-600 dark:text-pink-500" data-testid="text-bi-investors">{approvedInvestors}</div>
                                <p className="text-xs text-muted-foreground mt-1">{investorVehicles} veículos na frota</p>
                              </CardContent>
                            </Card>

                            <Card data-testid="card-bi-avg-rental-days">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between gap-2">
                                  <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio de Locação</CardTitle>
                                  <div className="h-9 w-9 rounded-lg bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-500" />
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold text-teal-600 dark:text-teal-500" data-testid="text-bi-avg-rental-days">{averageRentalDays}</div>
                                <p className="text-xs text-muted-foreground mt-1">dias em média por aluguel</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="leads">
                  <LeadManagement />
                </TabsContent>

                <TabsContent value="clientes">
                  <CustomerManagement />
                </TabsContent>

                <TabsContent value="frota">
                  <VehicleManagement showOnlyTradeIns={false} />
                </TabsContent>

                <TabsContent value="veiculos-troca">
                  <VehicleManagement showOnlyTradeIns={true} />
                </TabsContent>

                <TabsContent value="financiamentos">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-wrap">
                        <div>
                          <CardTitle>Contratos de Financiamento</CardTitle>
                          <CardDescription>
                            Gerencie contratos aprovados, finalizados e pendentes
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => setCalculatorDialogOpen(true)}
                          data-testid="button-open-calculator"
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Calculadora de Financiamento
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Filtros */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome do Cliente</label>
                          <Input
                            placeholder="Buscar por nome..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            data-testid="input-filter-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CPF</label>
                          <Input
                            placeholder="Buscar por CPF..."
                            value={filterCpf}
                            onChange={(e) => setFilterCpf(e.target.value)}
                            data-testid="input-filter-cpf"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Placa do Veículo</label>
                          <Input
                            placeholder="Buscar por placa..."
                            value={filterPlate}
                            onChange={(e) => setFilterPlate(e.target.value)}
                            data-testid="input-filter-plate"
                          />
                        </div>
                      </div>

                      {/* Lista de Contratos Filtrados */}
                      {financingsLoading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Carregando contratos...</p>
                        </div>
                      ) : (() => {
                        // Filtrar aprovados, pendentes, finalizados e cancelados
                        const validStatuses = ["approved", "pending", "finalized", "cancelled"];
                        let filtered = financings?.filter((f: any) => validStatuses.includes(f.approvalStatus)) || [];

                        // Aplicar filtros de busca
                        if (filterName) {
                          filtered = filtered.filter((f: any) =>
                            f.customerName?.toLowerCase().includes(filterName.toLowerCase())
                          );
                        }
                        if (filterCpf) {
                          filtered = filtered.filter((f: any) =>
                            f.customerCpf?.includes(filterCpf)
                          );
                        }
                        if (filterPlate) {
                          const vehicle = vehicles?.find((v: any) => v.id === filtered.find((f: any) => f.vehicleId)?.vehicleId);
                          filtered = filtered.filter((f: any) => {
                            const v = vehicles?.find((vehicle: any) => vehicle.id === f.vehicleId);
                            return v?.licensePlate?.toLowerCase().includes(filterPlate.toLowerCase());
                          });
                        }

                        return filtered.length > 0 ? (
                          <div className="space-y-4">
                            {filtered.map((financing: any) => {
                              const vehicle = vehicles?.find((v: any) => v.id === financing.vehicleId);
                              const tradeIn = tradeInVehicles?.find((t: any) => t.financingId === financing.id);

                              const customer = customers?.find((c: any) => c.id === financing.customerId);

                              return (
                                <Card
                                  key={financing.id}
                                  className="hover-elevate cursor-pointer"
                                  data-testid={`card-financing-${financing.id}`}
                                  onClick={() => {
                                    setSelectedFinancing(financing);
                                    setTempDueDay(null);
                                    setTempBonusPaymentDay(null);
                                    setFinancingDetailsDialogOpen(true);
                                  }}
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 p-6">
                                    {/* Foto do Veículo */}
                                    <div className="aspect-video md:aspect-square rounded-lg overflow-hidden bg-muted">
                                      {vehicle?.imageUrl ? (
                                        <img
                                          src={vehicle.imageUrl}
                                          alt={vehicle.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                          Sem imagem
                                        </div>
                                      )}
                                    </div>

                                    {/* Conteúdo */}
                                    <div className="space-y-4">
                                      {/* Header com badges */}
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1">
                                          <h3 className="text-xl font-bold mb-1">
                                            {financing.customerName}
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {vehicle?.name || "Veículo não encontrado"}
                                            {vehicle?.licensePlate && ` • ${vehicle.licensePlate}`}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge variant={
                                            financing.approvalStatus === "approved" ? "default" :
                                              financing.approvalStatus === "rejected" ? "destructive" :
                                                financing.approvalStatus === "finalized" ? "default" :
                                                  financing.approvalStatus === "cancelled" ? "outline" :
                                                    "secondary"
                                          }>
                                            {financing.approvalStatus === "approved"
                                              ? "Aprovado"
                                              : financing.approvalStatus === "rejected"
                                                ? "Rejeitado"
                                                : financing.approvalStatus === "finalized"
                                                  ? "Finalizado"
                                                  : financing.approvalStatus === "cancelled"
                                                    ? "Cancelado"
                                                    : "Pendente"}
                                          </Badge>
                                          {financing.approvalStatus === "approved" && (
                                            <Badge
                                              variant="outline"
                                              className={
                                                financing.paymentStatus === "em_dia"
                                                  ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950"
                                                  : "border-red-500 text-red-600 bg-red-50 dark:bg-red-950"
                                              }
                                            >
                                              {financing.paymentStatus === "em_dia" ? "✓ Em Dia" : "⚠ Atrasado"}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Informações Principais */}
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                          <p className="text-xs text-muted-foreground">Valor do Veículo</p>
                                          <p className="text-base font-bold">
                                            R$ {Number(financing.vehicleValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Entrada Total</p>
                                          <p className="text-base font-bold">
                                            R$ {Number(financing.downPaymentTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-muted-foreground">Parcelas</p>
                                          <p className="text-base font-bold">
                                            {financing.installments}x de R$ {Number(financing.monthlyInstallment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Informações Adicionais */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm pt-2 border-t">
                                        <div>
                                          <span className="font-medium">CPF:</span> {financing.customerCpf}
                                        </div>
                                        <div>
                                          <span className="font-medium">Telefone:</span> {financing.customerPhone}
                                        </div>
                                        {customer?.paymentDate && (
                                          <div>
                                            <span className="font-medium">Dia de Pagamento do Cliente:</span> Dia {customer.paymentDate}
                                          </div>
                                        )}
                                        {financing.dueDay && (
                                          <div>
                                            <span className="font-medium">Vencimento das Parcelas:</span> Dia {financing.dueDay}
                                          </div>
                                        )}
                                        <div className="sm:col-span-2">
                                          <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950">
                                            Com Avalista
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Dados do Avalista (Obrigatório) */}
                                  <div className="px-6 pb-6">
                                    <div className="border-t pt-4">
                                      <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950">
                                          Dados do Avalista
                                        </Badge>
                                      </div>
                                      <div className="bg-muted/30 rounded-lg p-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                          <div>
                                            <span className="font-medium">Nome:</span> {financing.guarantorName || '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">CPF:</span> {financing.guarantorCpf || '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Email:</span> {financing.guarantorEmail || '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Telefone:</span> {financing.guarantorPhone || '-'}
                                          </div>
                                          {financing.guarantorDriverLicense && (
                                            <div>
                                              <span className="font-medium">CNH:</span> {financing.guarantorDriverLicense}
                                            </div>
                                          )}
                                          {(financing.guarantorStreet || financing.guarantorCity) && (
                                            <div className="sm:col-span-2">
                                              <span className="font-medium">Endereço:</span>{' '}
                                              {[
                                                financing.guarantorStreet,
                                                financing.guarantorNeighborhood,
                                                financing.guarantorCity && financing.guarantorState ? `${financing.guarantorCity}/${financing.guarantorState}` : null,
                                                financing.guarantorZipCode ? `CEP: ${financing.guarantorZipCode}` : null
                                              ].filter(Boolean).join(', ')}
                                            </div>
                                          )}
                                          {financing.guarantorDocumentUrl && (
                                            <div className="sm:col-span-2">
                                              <span className="font-medium">Documento:</span>{' '}
                                              <a
                                                href={financing.guarantorDocumentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                Ver documento com foto
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Botões de Aprovação/Reprovação - apenas para financiamentos pendentes */}
                                  {financing.approvalStatus === "pending" && (
                                    <div className="px-6 pb-6">
                                      <div className="border-t pt-4">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                          <Button
                                            variant="default"
                                            className="flex-1"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (!financing.id) return;

                                              try {
                                                await apiRequest("PATCH", `/api/financings/${financing.id}`, {
                                                  approvalStatus: "approved",
                                                  approvedAt: new Date().toISOString()
                                                });

                                                queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                                                toast({
                                                  title: "Financiamento Aprovado",
                                                  description: "O financiamento foi aprovado com sucesso!",
                                                });
                                              } catch (error) {
                                                toast({
                                                  title: "Erro ao aprovar",
                                                  description: error instanceof Error ? error.message : "Tente novamente.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                            data-testid={`button-approve-financing-${financing.id}`}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Aprovar Financiamento
                                          </Button>

                                          <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (!financing.id) return;

                                              if (!confirm("Tem certeza que deseja reprovar este financiamento? Esta ação não pode ser desfeita.")) {
                                                return;
                                              }

                                              try {
                                                await apiRequest("PATCH", `/api/financings/${financing.id}`, {
                                                  approvalStatus: "rejected",
                                                  rejectedAt: new Date().toISOString()
                                                });

                                                queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                                                toast({
                                                  title: "Financiamento Reprovado",
                                                  description: "O financiamento foi reprovado.",
                                                  variant: "destructive",
                                                });
                                              } catch (error) {
                                                toast({
                                                  title: "Erro ao reprovar",
                                                  description: error instanceof Error ? error.message : "Tente novamente.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                            data-testid={`button-reject-financing-${financing.id}`}
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reprovar Financiamento
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Botões para financiamentos aprovados */}
                                  {financing.approvalStatus === "approved" && (
                                    <div className="px-6 pb-6">
                                      <div className="border-t pt-4">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                          {/* Botão de Vistoria de Entrega - apenas se não concluído */}
                                          {!financing.checkInCompletedAt && (
                                            <Button
                                              variant="default"
                                              className="flex-1"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFinancing(financing);
                                                setCheckoutDialogOpen(true);
                                              }}
                                              data-testid={`button-checkout-financing-${financing.id}`}
                                            >
                                              <Camera className="h-4 w-4 mr-2" />
                                              Realizar Vistoria de Entrega
                                            </Button>
                                          )}

                                          {/* Botão de Vídeo Confissão */}
                                          {financing.confessionVideoUrl && (
                                            <Button
                                              variant="outline"
                                              className="flex-1 border-green-500 text-green-600 bg-green-50 dark:bg-green-950"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFinancing(financing);
                                                setConfessionVideoUrl(financing.confessionVideoUrl || null);
                                                setConfessionVideoDialogOpen(true);
                                              }}
                                              data-testid={`button-confession-video-${financing.id}`}
                                            >
                                              <Video className="h-4 w-4 mr-2" />
                                              Ver Vídeo Confissão
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Indicador de Vistoria de Entrega Concluída */}
                                  {financing.checkInCompletedAt && (
                                    <div className="px-6 pb-6">
                                      <div className="border-t pt-4">
                                        <div className="flex items-center gap-2 text-green-600">
                                          <CheckCircle className="h-5 w-5" />
                                          <p className="text-sm font-medium">
                                            Vistoria de entrega concluída em {new Date(financing.checkInCompletedAt).toLocaleDateString('pt-BR')} às {new Date(financing.checkInCompletedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Trade-in (se houver) */}
                                  {tradeIn && (
                                    <div className="px-6 pb-6">
                                      <div className="border-t pt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950">
                                            Veículo de Troca na Entrada
                                          </Badge>
                                        </div>
                                        <div className="bg-muted/30 rounded-lg p-4">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                            <div>
                                              <span className="font-medium">Veículo:</span> {tradeIn.brand} {tradeIn.model} - {tradeIn.year}
                                            </div>
                                            <div>
                                              <span className="font-medium">Placa:</span> {tradeIn.plate}
                                            </div>
                                            <div>
                                              <span className="font-medium">Valor Aceito:</span> R$ {Number(tradeIn.acceptedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                            {tradeIn.fipeValue && (
                                              <div>
                                                <span className="font-medium">Valor FIPE:</span> {tradeIn.fipeValue}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-muted-foreground">Nenhum contrato encontrado com os filtros aplicados.</p>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>


                <TabsContent value="alugueis">
                  <Card>
                    <CardHeader>
                      <CardTitle>Aluguéis</CardTitle>
                      <CardDescription>
                        Gestão completa de contratos de aluguel - ativos e inativos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Filtros */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Nome do Cliente</label>
                          <Input
                            placeholder="Buscar por nome..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            data-testid="input-filter-rental-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">CPF</label>
                          <Input
                            placeholder="Buscar por CPF..."
                            value={filterCpf}
                            onChange={(e) => setFilterCpf(e.target.value)}
                            data-testid="input-filter-rental-cpf"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Veículo ou Placa</label>
                          <Input
                            placeholder="Buscar por nome ou placa..."
                            value={filterPlate}
                            onChange={(e) => setFilterPlate(e.target.value)}
                            data-testid="input-filter-rental-vehicle"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select
                            value={filterStatus || "all"}
                            onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
                          >
                            <SelectTrigger data-testid="select-filter-rental-status">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="approved">Aprovado</SelectItem>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="finalized">Finalizado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Lista de Aluguéis */}
                      {rentalsLoading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Carregando aluguéis...</p>
                        </div>
                      ) : (() => {
                        // Filtrar aluguéis aprovados, ativos e finalizados
                        const validStatuses = ["approved", "active", "finalized", "pending", "cancelled"];
                        let filtered = rentals?.filter((r: any) => validStatuses.includes(r.status)) || [];

                        // Aplicar filtros de busca
                        if (filterName) {
                          filtered = filtered.filter((r: any) =>
                            r.customerName?.toLowerCase().includes(filterName.toLowerCase())
                          );
                        }
                        if (filterCpf) {
                          filtered = filtered.filter((r: any) =>
                            r.customerCpf?.includes(filterCpf)
                          );
                        }
                        if (filterPlate) {
                          filtered = filtered.filter((r: any) => {
                            const vehicle = vehicles?.find((v: any) => v.id === r.vehicleId);
                            return vehicle?.name?.toLowerCase().includes(filterPlate.toLowerCase()) ||
                              vehicle?.licensePlate?.toLowerCase().includes(filterPlate.toLowerCase());
                          });
                        }
                        if (filterStatus) {
                          filtered = filtered.filter((r: any) => r.status === filterStatus);
                        }

                        // Ordenar por data de início (mais recentes primeiro)
                        filtered.sort((a: any, b: any) =>
                          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                        );

                        return filtered.length > 0 ? (
                          <div className="space-y-6">
                            {filtered.map((rental: any) => {
                              const vehicle = vehicles?.find((v: any) => v.id === rental.vehicleId);
                              const isActive = rental.status === "active" || rental.status === "approved";

                              return (
                                <Card key={rental.id} className="hover-elevate overflow-hidden" data-testid={`card-rental-${rental.id}`}>
                                  <CardHeader className="pb-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                      {/* Imagem do Veículo */}
                                      {vehicle?.imageUrl && (
                                        <div className="w-full md:w-32 h-24 flex-shrink-0">
                                          <img
                                            src={vehicle.imageUrl}
                                            alt={vehicle.name}
                                            className="w-full h-full object-cover rounded-lg border-2 border-border"
                                          />
                                        </div>
                                      )}

                                      {/* Info do Veículo e Cliente */}
                                      <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                          <CardTitle className="text-xl mb-2">
                                            {vehicle?.name || "Veículo não encontrado"}
                                            {vehicle?.licensePlate && (
                                              <span className="text-sm font-normal text-muted-foreground ml-2">
                                                ({vehicle.licensePlate})
                                              </span>
                                            )}
                                          </CardTitle>
                                          <CardDescription className="text-base">
                                            <span className="font-semibold">Cliente:</span> {rental.customerName}
                                          </CardDescription>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            CPF: {rental.customerCpf}
                                          </p>
                                        </div>

                                        {/* Badges de Status */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge
                                            variant={isActive ? "default" : "secondary"}
                                            className={
                                              rental.status === "approved" || rental.status === "active"
                                                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                                                : rental.status === "finalized"
                                                  ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                  : rental.status === "cancelled"
                                                    ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                                    : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                                            }
                                          >
                                            {rental.status === "approved"
                                              ? "Aprovado"
                                              : rental.status === "active"
                                                ? "Ativo"
                                                : rental.status === "finalized"
                                                  ? "Finalizado"
                                                  : rental.status === "cancelled"
                                                    ? "Cancelado"
                                                    : "Pendente"}
                                          </Badge>
                                          {rental.isNegativado && (
                                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                                              Negativado
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Período</p>
                                        <p className="font-medium">
                                          {new Date(rental.startDate).toLocaleDateString('pt-BR')} até {new Date(rental.endDate).toLocaleDateString('pt-BR')}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Valor Total</p>
                                        <p className="text-lg font-bold">
                                          R$ {Number(rental.totalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Contato</p>
                                        <p className="font-medium text-sm">{rental.customerPhone}</p>
                                        <p className="text-xs text-muted-foreground">{rental.customerEmail}</p>
                                      </div>
                                    </div>

                                    <div className="pt-6 border-t">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                        <div className="space-y-2">
                                          <p className="text-muted-foreground">
                                            <span className="font-medium">Check-in:</span> {rental.hasCheckin ? "✓ Realizado" : "✗ Pendente"}
                                          </p>
                                          <p className="text-muted-foreground">
                                            <span className="font-medium">Check-out:</span> {rental.hasCheckout ? "✓ Realizado" : "✗ Pendente"}
                                          </p>
                                        </div>
                                        <div className="space-y-2">
                                          <p className="text-muted-foreground">
                                            <span className="font-medium">Telefone:</span> {rental.customerPhone}
                                          </p>
                                          <p className="text-muted-foreground">
                                            <span className="font-medium">Email:</span> {rental.customerEmail}
                                          </p>
                                        </div>
                                      </div>

                                      {(rental.paymentMethod || rental.contractUrl || rental.approvedAt) && (
                                        <div className="mt-3 pt-3 border-t">
                                          {rental.approvedAt && (
                                            <p className="text-sm text-muted-foreground">
                                              <span className="font-medium">Aprovado em:</span> {new Date(rental.approvedAt).toLocaleDateString('pt-BR')} às {new Date(rental.approvedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                          )}
                                          {rental.paymentMethod && (
                                            <p className="text-sm text-muted-foreground">
                                              <span className="font-medium">Pagamento:</span> {rental.paymentMethod}
                                              {rental.paymentVerifiedAt && " ✓"}
                                            </p>
                                          )}
                                          {rental.contractUrl && (
                                            <p className="text-sm text-muted-foreground">
                                              <span className="font-medium">Contrato:</span> <a href={rental.contractUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver documento</a>
                                            </p>
                                          )}
                                        </div>
                                      )}

                                      {/* Botões para Solicitações Pendentes */}
                                      {rental.status === "pending" && (
                                        <div className="mt-4 pt-4 border-t space-y-3">
                                          {/* Processar com Check-in e Contrato (obrigatório para aprovação) */}
                                          <Button
                                            onClick={async () => {
                                              // Buscar dados completos do rental para preencher
                                              const rentalData = await fetch(`/api/rentals/${rental.id}`).then(r => r.json());

                                              console.log('📋 Dados COMPLETOS da solicitação:', rentalData);
                                              console.log('🚗 vehicleId:', rentalData.vehicleId);
                                              console.log('📅 Datas:', rentalData.startDate, '-', rentalData.endDate);
                                              console.log('💰 Valor total:', rentalData.totalPrice);
                                              console.log('📦 Planos:', rentalData.selectedPlanIds);

                                              // Preencher dados do cliente com os dados da solicitação
                                              setCustomerData({
                                                name: rentalData.customerName || "",
                                                cpf: rentalData.customerCpf || "",
                                                email: rentalData.customerEmail || "",
                                                phone: rentalData.customerPhone || "",
                                                driverLicense: rentalData.driverLicense || "",
                                                emergencyContact: rentalData.emergencyContact || "",
                                                street: rentalData.street || "",
                                                complement: rentalData.complement || "",
                                                neighborhood: rentalData.neighborhood || "",
                                                city: rentalData.city || "",
                                                state: rentalData.state || "",
                                                zipCode: rentalData.zipCode || "",
                                                notes: ""
                                              });

                                              // Buscar o veículo correto baseado no vehicleId do rental
                                              const correctVehicle = vehicles?.find(v => v.id === rentalData.vehicleId);

                                              if (!correctVehicle) {
                                                toast({
                                                  title: "Erro ao processar solicitação",
                                                  description: "Veículo não encontrado. O veículo pode ter sido removido.",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }

                                              // Definir todos os estados ANTES de abrir o dialog - USAR APENAS rentalData
                                              setSelectedVehicle(correctVehicle);
                                              setRentalStartDate(rentalData.startDate.split('T')[0]);
                                              setRentalEndDate(rentalData.endDate.split('T')[0]);
                                              setAgreedRentalValue(String(rentalData.totalPrice));

                                              // Preencher planos selecionados (se existirem)
                                              if (rentalData.selectedPlanIds && Array.isArray(rentalData.selectedPlanIds)) {
                                                setSelectedPlans(rentalData.selectedPlanIds);
                                              } else {
                                                setSelectedPlans([]);
                                              }

                                              // Marcar que estamos processando uma solicitação pendente
                                              setProcessingPendingRequest(true);
                                              setPendingRequestId(rental.id);
                                              setSaleType("rental");

                                              // Aguardar um tick para garantir que os estados foram atualizados
                                              setTimeout(() => {
                                                setCurrentStep(3);
                                                setNewSaleDialogOpen(true);
                                              }, 50);
                                            }}
                                            className="w-full"
                                            variant="outline"
                                            data-testid={`button-process-request-${rental.id}`}
                                          >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Processar com Check-in e Contrato
                                          </Button>

                                          {/* Botão para recusar */}
                                          <Button
                                            onClick={async () => {
                                              if (!confirm("Tem certeza que deseja recusar esta solicitação? Esta ação não pode ser desfeita.")) {
                                                return;
                                              }

                                              try {
                                                await apiRequest("PATCH", `/api/rentals/${rental.id}`, { status: "cancelled" });

                                                toast({
                                                  title: "Solicitação recusada",
                                                  description: "O aluguel foi recusado.",
                                                  variant: "destructive",
                                                });

                                                queryClient.invalidateQueries({ queryKey: ['/api/rentals'] });
                                              } catch (error) {
                                                toast({
                                                  title: "Erro ao recusar",
                                                  description: "Não foi possível recusar a solicitação.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                            className="w-full"
                                            variant="destructive"
                                            data-testid={`button-reject-rental-${rental.id}`}
                                          >
                                            <X className="h-4 w-4 mr-2" />
                                            Recusar Solicitação
                                          </Button>
                                        </div>
                                      )}

                                      {/* Botão de Gerenciamento */}
                                      {(rental.status === "approved" || rental.status === "active") && !rental.finalizedAt && (
                                        <div className="mt-4 pt-4 border-t">
                                          <Button
                                            onClick={() => {
                                              setSelectedRental(rental);
                                              setFinalizationStep(1);
                                              setIsFinalizingContract(false);
                                              setCheckoutData({
                                                checkOutImages: [],
                                                checkOutNotes: "",
                                                checklist: {}
                                              });
                                              setCheckpointData({
                                                hasDamages: null,
                                                damagesNotes: "",
                                                repairCost: ""
                                              });
                                              setFinalizationData({
                                                debtAmount: "",
                                                paymentMethod: "",
                                                contractUrl: ""
                                              });
                                              setFinalizationDialogOpen(true);
                                            }}
                                            className="w-full"
                                            data-testid={`button-manage-rental-${rental.id}`}
                                          >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Gerenciar Finalização
                                          </Button>
                                        </div>
                                      )}

                                      {rental.finalizedAt && (
                                        <div className="mt-4 pt-4 border-t">
                                          <p className="text-sm text-green-600 font-medium">
                                            ✓ Contrato finalizado em {new Date(rental.finalizedAt).toLocaleDateString('pt-BR')}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-muted-foreground">
                              {filterName || filterCpf || filterPlate || filterStatus
                                ? "Nenhum aluguel encontrado com os filtros aplicados."
                                : "Nenhum aluguel cadastrado ainda."}
                            </p>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="solicitacoes">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Solicitações de Contra Proposta</CardTitle>
                          <CardDescription>
                            Gerencie as propostas de financiamento personalizadas enviadas pelos vendedores
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" data-testid="badge-pending-proposals-crm">
                          {financingProposals?.filter((p: any) => p.status === "pending").length || 0} Pendentes
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!financingProposals || financingProposals.length === 0 ? (
                        <div className="text-center py-12">
                          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Nenhuma solicitação de contra proposta no momento.
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Quando vendedores enviarem propostas personalizadas, elas aparecerão aqui para aprovação.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {financingProposals.filter((p: any) => p.status === "pending").map((proposal: any) => {
                            const originalCalc = proposal.originalCalculation ? JSON.parse(proposal.originalCalculation) : {};
                            const proposedTerms = proposal.proposedTerms ? JSON.parse(proposal.proposedTerms) : {};
                            const seller = adminUsers?.find((u: any) => u.id === proposal.sellerId);

                            return (
                              <Card key={proposal.id} className="border-l-4 border-l-amber-500" data-testid={`proposal-card-crm-${proposal.id}`}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        {proposal.vehicleName}
                                        <Badge variant="secondary">Pendente</Badge>
                                      </CardTitle>
                                      <CardDescription className="mt-2">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                          <div>
                                            <span className="font-medium">Cliente:</span> {proposal.customerName}
                                          </div>
                                          <div>
                                            <span className="font-medium">CPF:</span> {proposal.customerCpf}
                                          </div>
                                          <div>
                                            <span className="font-medium">Vendedor:</span> {seller?.name || "N/A"}
                                          </div>
                                          <div>
                                            <span className="font-medium">Data:</span> {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                                          </div>
                                        </div>
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {/* Justificativa */}
                                  {proposal.proposalNotes && (
                                    <Card className="bg-amber-50/50 dark:bg-amber-950/20">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Justificativa do Vendedor</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <p className="text-sm">{proposal.proposalNotes}</p>
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* Comparativo de Valores */}
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Valores Propostos */}
                                    <Card className="bg-primary/5">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-primary">✨ Proposta do Vendedor</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span>Valor do veículo:</span>
                                          <span className="font-semibold">R$ {proposedTerms.vehicleValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Entrada total:</span>
                                          <span className="font-semibold">R$ {proposedTerms.downPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Valor financiado:</span>
                                          <span className="font-semibold text-primary">R$ {proposedTerms.financeAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2">
                                          <span>Parcela mensal:</span>
                                          <span className="font-bold text-primary">R$ {proposedTerms.monthlyPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>Taxa de juros:</span>
                                          <span>{proposedTerms.interestRate?.toFixed(2) || '0,00'}% a.m.</span>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Valores Originais */}
                                    <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-muted-foreground">📋 Valores Padrão</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                          <span>Valor do veículo:</span>
                                          <span className="font-semibold">R$ {originalCalc.vehicleValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Entrada total:</span>
                                          <span className="font-semibold">R$ {originalCalc.downPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Valor financiado:</span>
                                          <span className="font-semibold">R$ {originalCalc.financeAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2">
                                          <span>Parcela mensal:</span>
                                          <span className="font-bold">R$ {originalCalc.monthlyPayment?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span>Taxa de juros:</span>
                                          <span>{originalCalc.interestRate?.toFixed(2) || '0,00'}% a.m.</span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Botões de Ação */}
                                  <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                      onClick={() => approveProposalMutation.mutate({ id: proposal.id })}
                                      disabled={approveProposalMutation.isPending || rejectProposalMutation.isPending}
                                      data-testid={`button-approve-proposal-crm-${proposal.id}`}
                                      className="flex-1"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Aprovar
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => rejectProposalMutation.mutate({ id: proposal.id })}
                                      disabled={approveProposalMutation.isPending || rejectProposalMutation.isPending}
                                      data-testid={`button-reject-proposal-crm-${proposal.id}`}
                                      className="flex-1"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Rejeitar
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="investidores">
                  <InvestorManagement
                    onOpenInvestmentWizard={() => {
                      setSaleType("investment");
                      setNewSaleDialogOpen(true);
                    }}
                  />
                </TabsContent>

                <TabsContent value="investimentos">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle>Cotas de Investimento</CardTitle>
                        <CardDescription>
                          Configure as cotas de dividendos por categoria de veículo e faixa de valor FIPE
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setEditingQuota(null);
                          setQuotaFormData({
                            category: "",
                            minValue: "",
                            maxValue: "",
                            minDividend: "",
                            maxDividend: ""
                          });
                          setQuotaDialogOpen(true);
                        }}
                        data-testid="button-add-quota"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Cota
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {quotasLoading ? (
                        <p className="text-center text-muted-foreground py-8">Carregando cotas...</p>
                      ) : investmentQuotas && investmentQuotas.length > 0 ? (
                        <div className="space-y-4">
                          {investmentQuotas.map((quota: any) => (
                            <Card key={quota.id} className="hover-elevate" data-testid={`card-quota-${quota.id}`}>
                              <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div className="flex-1">
                                    <CardTitle className="text-lg">{quota.category}</CardTitle>
                                    <CardDescription className="mt-1">
                                      Faixa FIPE: R$ {Number(quota.minValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ {Number(quota.maxValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </CardDescription>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <p className="text-sm text-muted-foreground">Dividendo Mensal</p>
                                      <p className="text-lg font-bold text-primary">
                                        R$ {Number(quota.minDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ {Number(quota.maxDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingQuota(quota);
                                          setQuotaFormData({
                                            category: quota.category,
                                            minValue: quota.minValue,
                                            maxValue: quota.maxValue,
                                            minDividend: quota.minDividend,
                                            maxDividend: quota.maxDividend
                                          });
                                          setQuotaDialogOpen(true);
                                        }}
                                        data-testid={`button-edit-quota-${quota.id}`}
                                      >
                                        Editar
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm(`Tem certeza que deseja remover a cota de ${quota.category}?`)) {
                                            deleteQuotaMutation.mutate(quota.id);
                                          }
                                        }}
                                        data-testid={`button-delete-quota-${quota.id}`}
                                      >
                                        Remover
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">Nenhuma cota de investimento configurada.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bonificacao">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bonificação - Sistema de Descontos por Indicação</CardTitle>
                      <CardDescription>
                        Gerencie os saldos de bonificação dos clientes. Clientes que indicam outros ganham créditos de desconto que podem usar em futuros serviços.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {customersLoading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Carregando clientes...</p>
                        </div>
                      ) : customers && customers.length > 0 ? (
                        <div className="space-y-4">
                          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <h4 className="font-semibold mb-2 text-primary">Como funciona o sistema de bonificação?</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>• Clientes que indicam outros ganham créditos de desconto vinculados ao CPF</li>
                              <li>• O admin define manualmente o valor da bonificação para cada cliente</li>
                              <li>• Durante a contratação de serviços (aluguel, financiamento), o cliente pode optar por usar o desconto</li>
                              <li>• O saldo é debitado automaticamente quando usado</li>
                            </ul>
                          </div>

                          <div className="rounded-md border">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="text-left p-4 font-medium">Cliente</th>
                                    <th className="text-left p-4 font-medium">CPF</th>
                                    <th className="text-left p-4 font-medium">Saldo Atual</th>
                                    <th className="text-right p-4 font-medium">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {customers
                                    .sort((a: any, b: any) => Number(b.bonusBalance || 0) - Number(a.bonusBalance || 0))
                                    .map((customer: any) => (
                                      <tr key={customer.id} className="border-b hover-elevate" data-testid={`row-bonus-${customer.id}`}>
                                        <td className="p-4">
                                          <div>
                                            <p className="font-medium">{customer.name}</p>
                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <span className="font-mono text-sm">{customer.cpf}</span>
                                        </td>
                                        <td className="p-4">
                                          <div className="flex items-center gap-2">
                                            <span className={`font-bold text-lg ${Number(customer.bonusBalance || 0) > 0
                                              ? "text-green-600 dark:text-green-400"
                                              : "text-muted-foreground"
                                              }`}>
                                              R$ {Number(customer.bonusBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            {Number(customer.bonusBalance || 0) > 0 && (
                                              <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950">
                                                Disponível
                                              </Badge>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-4">
                                          <div className="flex justify-end gap-2">
                                            <Dialog
                                              open={bonusDialogOpen[customer.id] || false}
                                              onOpenChange={(open) => setBonusDialogOpen({ ...bonusDialogOpen, [customer.id]: open })}
                                            >
                                              <DialogTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  data-testid={`button-edit-bonus-${customer.id}`}
                                                >
                                                  <Gift className="h-4 w-4 mr-2" />
                                                  Ajustar Bonificação
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent>
                                                <DialogHeader>
                                                  <DialogTitle>Ajustar Bonificação</DialogTitle>
                                                  <DialogDescription>
                                                    Defina o valor de bonificação disponível para {customer.name}
                                                  </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                  <div>
                                                    <label className="text-sm font-medium">Saldo Atual</label>
                                                    <p className="text-2xl font-bold text-primary">
                                                      R$ {Number(customer.bonusBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                  </div>
                                                  <div className="space-y-2">
                                                    <label className="text-sm font-medium">Novo Saldo de Bonificação</label>
                                                    <Input
                                                      type="number"
                                                      step="0.01"
                                                      min="0"
                                                      placeholder="0.00"
                                                      defaultValue={customer.bonusBalance || "0"}
                                                      id={`bonus-input-${customer.id}`}
                                                      data-testid={`input-bonus-${customer.id}`}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                      Este valor ficará disponível para o cliente usar como desconto em serviços futuros
                                                    </p>
                                                  </div>
                                                  <div className="flex justify-end gap-2">
                                                    <Button
                                                      variant="outline"
                                                      onClick={() => setBonusDialogOpen({ ...bonusDialogOpen, [customer.id]: false })}
                                                    >
                                                      Cancelar
                                                    </Button>
                                                    <Button
                                                      onClick={async () => {
                                                        const input = document.getElementById(`bonus-input-${customer.id}`) as HTMLInputElement;
                                                        const newValue = input?.value || "0";
                                                        try {
                                                          await updateCustomerMutation.mutateAsync({
                                                            id: customer.id,
                                                            data: { bonusBalance: newValue }
                                                          });
                                                          setBonusDialogOpen({ ...bonusDialogOpen, [customer.id]: false });
                                                        } catch (error) {
                                                          // Error já é tratado pela mutação
                                                        }
                                                      }}
                                                      disabled={updateCustomerMutation.isPending}
                                                      data-testid={`button-save-bonus-${customer.id}`}
                                                    >
                                                      {updateCustomerMutation.isPending ? "Salvando..." : "Salvar"}
                                                    </Button>
                                                  </div>
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-2">Estatísticas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Total de Clientes</p>
                                <p className="text-2xl font-bold">{customers.length}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Clientes com Saldo</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {customers.filter((c: any) => Number(c.bonusBalance || 0) > 0).length}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total em Bonificações</p>
                                <p className="text-2xl font-bold text-primary">
                                  R$ {customers.reduce((sum: number, c: any) => sum + Number(c.bonusBalance || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="planos">
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
                      {plansLoading ? (
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
                </TabsContent>

                <TabsContent value="eventos">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle>Eventos da Frota</CardTitle>
                        <CardDescription>
                          Todos os eventos do sistema: incidentes, sinistros, avarias, roubos, assistências e manutenções
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setRegisterDamageDialogOpen(true);
                            setDamageFormData({
                              rentalId: "",
                              repairCost: "",
                              damagesNotes: "",
                              photos: []
                            });
                          }}
                          data-testid="button-register-damage"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar Avaria
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingFleetEvent(null);
                            setVehicleSearchTerm("");
                            setFleetEventFormData({
                              customerId: "",
                              vehicleId: "",
                              type: "",
                              title: "",
                              description: "",
                              incidentType: "",
                              status: "aberto",
                              severity: "media",
                              cost: "",
                              paymentMethod: "",
                              insuranceClaim: false,
                              franchiseValue: "",
                              insuranceCompany: "",
                              claimNumber: "",
                              workshopStatus: ""
                            });
                            setFleetEventDialogOpen(true);
                          }}
                          data-testid="button-add-fleet-event"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Registrar Evento
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Filtros */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Cliente</label>
                          <Input
                            placeholder="Buscar por cliente..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            data-testid="input-filter-event-customer"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Veículo ou Placa</label>
                          <Input
                            placeholder="Buscar por nome ou placa..."
                            value={filterPlate}
                            onChange={(e) => setFilterPlate(e.target.value)}
                            data-testid="input-filter-event-vehicle"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tipo de Incidente</label>
                          <Select
                            value={filterStatus || "all"}
                            onValueChange={(value) => setFilterStatus(value === "all" ? "" : value)}
                          >
                            <SelectTrigger data-testid="select-filter-incident-type">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="roubo">Roubo</SelectItem>
                              <SelectItem value="furto">Furto</SelectItem>
                              <SelectItem value="colisao">Colisão</SelectItem>
                              <SelectItem value="incendio">Incêndio</SelectItem>
                              <SelectItem value="oficina">Oficina/Reparo</SelectItem>
                              <SelectItem value="assistencia">Assistência 24h</SelectItem>
                              <SelectItem value="manutencao">Manutenção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select
                            value={filterCpf || "all"}
                            onValueChange={(value) => setFilterCpf(value === "all" ? "" : value)}
                          >
                            <SelectTrigger data-testid="select-filter-event-status">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="aberto">Aberto</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="resolvido">Resolvido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Lista de Eventos */}
                      {crmLoading.customerEvents || rentalsLoading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Carregando eventos...</p>
                        </div>
                      ) : (() => {
                        // Combinar eventos da frota com avarias de aluguéis
                        let allEvents = [];

                        // Adicionar eventos da frota (que têm incidentType)
                        const fleetEvents = customerEvents?.filter((e: any) => e.incidentType) || [];                        allEvents.push(...fleetEvents.map((e: any) => ({ ...e, eventSource: 'fleet' })));

                        // Adicionar APENAS avarias de aluguéis como eventos
                        const rentalDamages = rentals?.filter((r: any) => r.checkpointHasDamages) || [];
                        allEvents.push(...rentalDamages.map((r: any) => ({
                          ...r,
                          eventSource: 'rental_damage',
                          id: r.id,
                          title: `Devolução com Avaria #${r.id.slice(0, 8)}`,
                          incidentType: 'oficina',
                          severity: Number(r.checkpointRepairCost || 0) > 1000 ? 'alta' : 'media',
                          status: 'resolvido',
                          cost: r.checkpointRepairCost,
                          createdAt: r.checkoutCompletedAt || r.finalizedAt || r.updatedAt || r.createdAt
                        })));

                        // Ordenar por data (mais recentes primeiro)
                        allEvents.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                        // Aplicar filtros
                        let filtered = allEvents;

                        // Aplicar filtros de busca
                        if (filterName) {
                          filtered = filtered.filter((e: any) => {
                            const customer = customers?.find((c: any) => c.id === e.customerId);
                            return customer?.name?.toLowerCase().includes(filterName.toLowerCase());
                          });
                        }
                        if (filterPlate) {
                          filtered = filtered.filter((e: any) => {
                            const vehicle = vehicles?.find((v: any) => v.id === e.vehicleId);
                            return vehicle?.name?.toLowerCase().includes(filterPlate.toLowerCase()) ||
                              vehicle?.licensePlate?.toLowerCase().includes(filterPlate.toLowerCase());
                          });
                        }
                        if (filterStatus && filterStatus !== "all") {
                          filtered = filtered.filter((e: any) => e.incidentType === filterStatus);
                        }
                        if (filterCpf && filterCpf !== "all") {
                          filtered = filtered.filter((e: any) => e.status === filterCpf);
                        }

                        return filtered.length > 0 ? (
                          <div className="space-y-4">
                            {filtered.map((event: any) => {
                              const customer = customers?.find((c: any) => c.id === event.customerId);
                              const vehicle = vehicles?.find((v: any) => v.id === event.vehicleId);

                              return (
                                <Card key={event.id} className="hover-elevate" data-testid={`card-fleet-event-${event.id}`}>
                                  <CardHeader>
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                          <CardTitle className="text-lg">{event.title}</CardTitle>
                                          <Badge variant={
                                            event.severity === "critica" ? "destructive" :
                                              event.severity === "alta" ? "destructive" :
                                                event.severity === "media" ? "default" : "secondary"
                                          }>
                                            {event.severity === "critica" ? "Crítica" :
                                              event.severity === "alta" ? "Alta" :
                                                event.severity === "media" ? "Média" : "Baixa"}
                                          </Badge>
                                          <Badge variant="outline">
                                            {event.incidentType === "roubo" ? "Roubo" :
                                              event.incidentType === "furto" ? "Furto" :
                                                event.incidentType === "colisao" ? "Colisão" :
                                                  event.incidentType === "incendio" ? "Incêndio" :
                                                    event.incidentType === "oficina" ? "Oficina" :
                                                      event.incidentType === "assistencia" ? "Assistência 24h" :
                                                        event.incidentType === "manutencao" ? "Manutenção" : event.incidentType}
                                          </Badge>
                                          <Badge variant={
                                            event.status === "resolvido" ? "default" :
                                              event.status === "em_andamento" ? "secondary" : "outline"
                                          }>
                                            {event.status === "resolvido" ? "Resolvido" :
                                              event.status === "em_andamento" ? "Em Andamento" : "Aberto"}
                                          </Badge>
                                        </div>
                                        <CardDescription className="mt-1">
                                          {customer?.name || "Sem cliente vinculado"} - {vehicle?.name || "Veículo não identificado"}
                                        </CardDescription>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {new Date(event.createdAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                      {event.eventSource === 'fleet' && (
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingFleetEvent(event);
                                              setFleetEventFormData(event);
                                              setFleetEventDialogOpen(true);
                                            }}
                                            data-testid={`button-edit-fleet-event-${event.id}`}
                                          >
                                            Editar
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                                        <p className="text-sm whitespace-pre-wrap">
                                          {event.eventSource === 'rental_damage'
                                            ? (event.checkpointDamagesNotes || 'Sem descrição detalhada')
                                            : (event.description || 'Sem descrição')}
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
                                        {event.cost && Number(event.cost) > 0 && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Custo de Reparo</p>
                                            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                              R$ {Number(event.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                          </div>
                                        )}
                                        {event.eventSource === 'rental_damage' && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Status de Pagamento</p>
                                            <div className="flex items-center gap-2">
                                              <Badge variant={event.repairPaid ? "default" : "outline"}>
                                                {event.repairPaid ? 'Pago' : 'Pendente'}
                                              </Badge>
                                              <Button
                                                size="sm"
                                                variant={event.repairPaid ? "outline" : "default"}
                                                onClick={async () => {
                                                  try {
                                                    await apiRequest("PATCH", `/api/rentals/${event.id}`, {
                                                      repairPaid: !event.repairPaid
                                                    });
                                                    queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
                                                    toast({
                                                      title: event.repairPaid ? "Marcado como pendente" : "Marcado como pago",
                                                      description: "Status de pagamento atualizado.",
                                                    });
                                                  } catch (error: any) {
                                                    toast({
                                                      title: "Erro ao atualizar",
                                                      description: error.message,
                                                      variant: "destructive",
                                                    });
                                                  }
                                                }}
                                              >
                                                {event.repairPaid ? 'Marcar Pendente' : 'Marcar Pago'}
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                        {event.paymentMethod && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
                                            <p className="text-sm font-medium">
                                              {event.paymentMethod === "franquia" ? "Franquia" :
                                                event.paymentMethod === "direto_empresa" ? "Pago Direto" :
                                                  event.paymentMethod === "prejuizo_empresa" ? "Prejuízo Empresa" :
                                                    event.paymentMethod === "seguro" ? "Seguro" : event.paymentMethod}
                                            </p>
                                          </div>
                                        )}
                                        {event.workshopStatus && (
                                          <div>
                                            <p className="text-xs text-muted-foreground">Status Oficina</p>
                                            <p className="text-sm font-medium">
                                              {event.workshopStatus === "na_oficina" ? "Na Oficina" :
                                                event.workshopStatus === "aguardando_pecas" ? "Aguardando Peças" :
                                                  event.workshopStatus === "em_reparo" ? "Em Reparo" :
                                                    event.workshopStatus === "concluido" ? "Concluído" : event.workshopStatus}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {event.insuranceClaim && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Acionamento de Seguro</p>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                            {event.insuranceCompany && (
                                              <div>
                                                <span className="text-muted-foreground">Seguradora:</span>{" "}
                                                <span className="font-medium">{event.insuranceCompany}</span>
                                              </div>
                                            )}
                                            {event.claimNumber && (
                                              <div>
                                                <span className="text-muted-foreground">Nº Sinistro:</span>{" "}
                                                <span className="font-medium">{event.claimNumber}</span>
                                              </div>
                                            )}
                                            {event.franchiseValue && Number(event.franchiseValue) > 0 && (
                                              <div>
                                                <span className="text-muted-foreground">Franquia:</span>{" "}
                                                <span className="font-medium">
                                                  R$ {Number(event.franchiseValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Fotos das Avarias (para rental_damage) */}
                                      {event.eventSource === 'rental_damage' && event.checkOutImages && event.checkOutImages.length > 0 && (
                                        <div className="pt-3 border-t">
                                          <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium">Fotos das Avarias ({event.checkOutImages.length})</p>
                                            <Badge variant="outline">{event.checkOutImages.length} fotos</Badge>
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {event.checkOutImages.map((img: string, idx: number) => (
                                              <div key={idx} className="relative group">
                                                <img
                                                  src={img}
                                                  alt={`Avaria ${idx + 1}`}
                                                  className="w-full h-32 object-cover rounded-md border-2 border-border hover-elevate cursor-pointer transition-transform"
                                                  onClick={() => setFullscreenPhoto(img)}
                                                />
                                                <Badge className="absolute top-2 left-2 text-xs bg-black/70 text-white">
                                                  {idx + 1}
                                                </Badge>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <p className="text-xs text-muted-foreground pt-2 border-t">
                                        Criado em: {new Date(event.createdAt).toLocaleDateString('pt-BR')} às {new Date(event.createdAt).toLocaleTimeString('pt-BR')}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-muted-foreground">
                              {filterName || filterPlate || filterStatus || filterCpf
                                ? "Nenhum evento encontrado com os filtros aplicados."
                                : "Nenhum evento registrado ainda."}
                            </p>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="usuarios">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle>Usuários do Sistema</CardTitle>
                        <CardDescription>
                          Gerenciamento de usuários com diferentes perfis de acesso
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSalesManagementDialogOpen(true)}
                          data-testid="button-manage-sales"
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Gerenciar Metas
                        </Button>
                        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setEditingUser(null);
                                setUserFormData({ name: "", email: "", password: "", role: "", isActive: true, salesGoal: 1, salesCount: 0 });
                                setUserDialogOpen(true);
                              }}
                              data-testid="button-add-user"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Novo Usuário
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{editingUser ? "Editar Usuário" : "Criar Novo Usuário"}</DialogTitle>
                              <DialogDescription>
                                {editingUser ? "Atualize as informações do usuário" : "Adicione um novo usuário ao sistema"}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Nome *</label>
                                <Input
                                  placeholder="Nome completo"
                                  value={userFormData.name}
                                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                                  data-testid="input-user-name"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Email *</label>
                                <Input
                                  type="email"
                                  placeholder="email@exemplo.com"
                                  value={userFormData.email}
                                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                  data-testid="input-user-email"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">CPF</label>
                                <Input
                                  type="text"
                                  placeholder="000.000.000-00"
                                  value={userFormData.cpf || ""}
                                  onChange={(e) => setUserFormData({ ...userFormData, cpf: e.target.value })}
                                  data-testid="input-user-cpf"
                                />
                                {userFormData.role === "INVESTIDOR" && (
                                  <p className="text-xs text-muted-foreground">
                                    Para investidores, utilize o CPF cadastrado no sistema
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  {editingUser ? "Nova Senha (opcional)" : "Senha *"}
                                </label>
                                <Input
                                  type="password"
                                  placeholder={editingUser ? "Deixe em branco para manter a senha atual" : "Mínimo 6 caracteres"}
                                  value={userFormData.password}
                                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                  data-testid="input-user-password"
                                />
                                {editingUser && (
                                  <p className="text-xs text-muted-foreground">
                                    Preencha apenas se deseja redefinir a senha do usuário
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Perfil de Acesso *</label>
                                <Select
                                  value={userFormData.role}
                                  onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}
                                  data-testid="select-user-role"
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o perfil" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                                    <SelectItem value="INVESTIDOR">Investidor</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancelar</Button>
                              </DialogClose>
                              <Button
                                onClick={() => {
                                  if (!userFormData.name || !userFormData.email || !userFormData.role) {
                                    toast({
                                      title: "Campos obrigatórios",
                                      description: "Preencha todos os campos obrigatórios.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  if (!editingUser && !userFormData.password) {
                                    toast({
                                      title: "Senha obrigatória",
                                      description: "A senha é obrigatória para novos usuários.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  if (editingUser) {
                                    updateUserMutation.mutate({ id: editingUser.id, data: userFormData });
                                  } else {
                                    createUserMutation.mutate(userFormData);
                                  }
                                }}
                                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                                data-testid="button-save-user"
                              >
                                {createUserMutation.isPending || updateUserMutation.isPending ? "Salvando..." : editingUser ? "Atualizar" : "Criar Usuário"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Filtros de pesquisa */}
                      <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Nome</label>
                            <Input
                              placeholder="Buscar por nome..."
                              value={userFilterName}
                              onChange={(e) => setUserFilterName(e.target.value)}
                              data-testid="input-filter-user-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                              placeholder="Buscar por email..."
                              value={userFilterEmail}
                              onChange={(e) => setUserFilterEmail(e.target.value)}
                              data-testid="input-filter-user-email"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">CPF</label>
                            <Input
                              placeholder="Buscar por CPF..."
                              value={userFilterCpf}
                              onChange={(e) => setUserFilterCpf(e.target.value)}
                              data-testid="input-filter-user-cpf"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Perfil</label>
                            <Select value={userFilterRole} onValueChange={setUserFilterRole}>
                              <SelectTrigger data-testid="select-filter-user-role">
                                <SelectValue placeholder="Todos os perfis" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos os perfis</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                                <SelectItem value="INVESTIDOR">Investidor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {(userFilterName || userFilterEmail || userFilterCpf || (userFilterRole && userFilterRole !== "all")) && (() => {
                          let filtered = adminUsers || [];
                          if (userFilterName) {
                            filtered = filtered.filter((u: any) =>
                              u.name?.toLowerCase().includes(userFilterName.toLowerCase())
                            );
                          }
                          if (userFilterEmail) {
                            filtered = filtered.filter((u: any) =>
                              u.email?.toLowerCase().includes(userFilterEmail.toLowerCase())
                            );
                          }
                          if (userFilterCpf) {
                            filtered = filtered.filter((u: any) =>
                              u.cpf?.includes(userFilterCpf)
                            );
                          }
                          if (userFilterRole && userFilterRole !== "all") {
                            filtered = filtered.filter((u: any) => u.role === userFilterRole);
                          }

                          return (
                            <div className="flex items-center justify-between pt-2">
                              <p className="text-sm text-muted-foreground">
                                {filtered.length} usuário{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserFilterName("");
                                  setUserFilterEmail("");
                                  setUserFilterCpf("");
                                  setUserFilterRole("");
                                }}
                                data-testid="button-clear-user-filters"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Limpar Filtros
                              </Button>
                            </div>
                          );
                        })()}
                      </div>

                      {adminUsersLoading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Carregando usuários...</p>
                        </div>
                      ) : (() => {
                        // Aplicar filtros
                        let filtered = adminUsers || [];
                        if (userFilterName) {
                          filtered = filtered.filter((u: any) =>
                            u.name?.toLowerCase().includes(userFilterName.toLowerCase())
                          );
                        }
                        if (userFilterEmail) {
                          filtered = filtered.filter((u: any) =>
                            u.email?.toLowerCase().includes(userFilterEmail.toLowerCase())
                          );
                        }
                        if (userFilterCpf) {
                          filtered = filtered.filter((u: any) =>
                            u.cpf?.includes(userFilterCpf)
                          );
                        }
                        if (userFilterRole && userFilterRole !== "all") {
                          filtered = filtered.filter((u: any) => u.role === userFilterRole);
                        }

                        if (filtered && filtered.length > 0) {
                          return (
                            <div className="space-y-6">
                              {filtered.map((user: any) => {
                                const getRoleIcon = () => {
                                  if (user.role === 'ADMIN') return Shield;
                                  if (user.role === 'VENDEDOR') return Briefcase;
                                  return User;
                                };
                                const RoleIcon = getRoleIcon();

                                const getRoleColor = () => {
                                  if (user.role === 'ADMIN') return 'bg-red-500/10 text-red-600 dark:text-red-400';
                                  if (user.role === 'VENDEDOR') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
                                  return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
                                };

                                return (
                                  <Card key={user.id} className="overflow-hidden hover-elevate transition-all" data-testid={`card-user-${user.id}`}>
                                    <div className="p-6 space-y-6">
                                      {/* Header com Avatar e Nome */}
                                      <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-4 flex-1">
                                          <div className={`h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0 ${getRoleColor()}`}>
                                            <RoleIcon className="h-8 w-8" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                              <CardTitle className="text-2xl font-bold tracking-tight">
                                                {user.name}
                                              </CardTitle>
                                              {user.role === 'ADMIN' && (
                                                <Badge variant="destructive" className="shadow-sm">
                                                  Admin
                                                </Badge>
                                              )}
                                              {user.role === 'VENDEDOR' && (
                                                <Badge variant="default" className="bg-blue-500 shadow-sm">
                                                  Vendedor
                                                </Badge>
                                              )}
                                              {user.role === 'INVESTIDOR' && (
                                                <Badge variant="secondary" className="border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950 shadow-sm">
                                                  Investidor
                                                </Badge>
                                              )}
                                              <Badge variant={user.isActive ? "default" : "secondary"}>
                                                {user.isActive ? "✓ Ativo" : "○ Inativo"}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                              <Mail className="h-4 w-4" />
                                              <p className="truncate">{user.email}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Informações do Usuário */}
                                      {user.cpf && (
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                          <div className="flex items-center gap-3">
                                            <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <div>
                                              <p className="text-xs text-muted-foreground">CPF</p>
                                              <p className="font-mono font-medium">{user.cpf}</p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Métricas de Vendedor */}
                                      {user.role === 'VENDEDOR' && (
                                        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                          <div className="flex items-center gap-2 mb-4">
                                            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <h4 className="font-bold text-base text-blue-900 dark:text-blue-100">
                                              Performance de Vendas
                                            </h4>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Card Meta */}
                                            <div className="p-4 bg-white dark:bg-gray-900/50 rounded-lg border">
                                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                                Meta {user.goalPeriod === 'daily' ? 'Diária' : user.goalPeriod === 'weekly' ? 'Semanal' : user.goalPeriod === 'monthly' ? 'Mensal' : user.goalPeriod === 'yearly' ? 'Anual' : 'Diária'}
                                              </p>
                                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.salesGoal || 1}</p>
                                              <p className="text-xs text-muted-foreground mt-1">vendas</p>
                                            </div>

                                            {/* Card Vendas */}
                                            <div className="p-4 bg-white dark:bg-gray-900/50 rounded-lg border">
                                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                                {user.goalPeriod === 'daily' ? 'Hoje' : user.goalPeriod === 'weekly' ? 'Esta Semana' : user.goalPeriod === 'monthly' ? 'Este Mês' : user.goalPeriod === 'yearly' ? 'Este Ano' : 'Hoje'}
                                              </p>
                                              <div className="flex items-center gap-2">
                                                <p className="text-2xl font-bold">{user.salesCount || 0}</p>
                                                <div className="flex gap-1 ml-auto">
                                                  <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7"
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
                                                    className="h-7 w-7"
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
                                              <p className="text-xs text-muted-foreground mt-1">vendas</p>
                                            </div>

                                            {/* Card Receita */}
                                            <div className="p-4 bg-white dark:bg-gray-900/50 rounded-lg border">
                                              <p className="text-xs font-medium text-muted-foreground mb-2">Receita Total</p>
                                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                R$ {parseFloat(user.salesRevenue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                              </p>
                                              <p className="text-xs text-muted-foreground mt-1">acumulado</p>
                                            </div>

                                            {/* Card Progresso */}
                                            <div className="p-4 bg-white dark:bg-gray-900/50 rounded-lg border">
                                              <p className="text-xs font-medium text-muted-foreground mb-2">Progresso</p>
                                              <p className="text-2xl font-bold">
                                                {Math.round(((user.salesCount || 0) / (user.salesGoal || 1)) * 100)}%
                                              </p>
                                              {(user.salesCount || 0) >= (user.salesGoal || 1) ? (
                                                <Badge variant="default" className="bg-green-500 mt-2">✓ Meta Atingida</Badge>
                                              ) : (
                                                <p className="text-xs text-muted-foreground mt-1">da meta</p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Histórico Permanente */}
                                          <div className="mt-5 pt-4 border-t border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2 mb-4">
                                              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                              <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-200">
                                                Histórico Permanente
                                              </h5>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="p-3 bg-white dark:bg-gray-900/50 rounded-lg border">
                                                <p className="text-xs text-muted-foreground mb-1">Total de Vendas</p>
                                                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                                  {user.totalSales || 0}
                                                </p>
                                                <p className="text-xs text-muted-foreground">vendas</p>
                                              </div>
                                              <div className="p-3 bg-white dark:bg-gray-900/50 rounded-lg border">
                                                <p className="text-xs text-muted-foreground mb-1">Metas Batidas</p>
                                                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                                                  {user.totalGoalsAchieved || 0}
                                                </p>
                                                <p className="text-xs text-muted-foreground">vezes</p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Ações do Vendedor */}
                                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
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
                                              <Target className="h-4 w-4 mr-2" />
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
                                              <DollarSign className="h-4 w-4 mr-2" />
                                              Editar Receita
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Ações do Usuário */}
                                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                                        {/* Botão de espelhamento apenas para investidores */}
                                        {user.role === 'INVESTIDOR' && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900 border-purple-200 dark:border-purple-800"
                                            onClick={() => {
                                              setMirroredInvestor(user);
                                              setInvestorMirrorDialogOpen(true);
                                            }}
                                            data-testid={`button-mirror-investor-${user.id}`}
                                            title="Ver painel do investidor"
                                          >
                                            <Eye className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                                            Ver Painel
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingUser(user);
                                            setUserFormData({
                                              name: user.name,
                                              email: user.email,
                                              cpf: user.cpf || "",
                                              password: "",
                                              role: user.role,
                                              isActive: user.isActive,
                                              salesGoal: user.salesGoal || 1,
                                              salesCount: user.salesCount || 0
                                            });
                                            setUserDialogOpen(true);
                                          }}
                                          data-testid={`button-edit-user-${user.id}`}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Editar Usuário
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            toggleUserStatusMutation.mutate({ id: user.id, isActive: !user.isActive });
                                          }}
                                          disabled={toggleUserStatusMutation.isPending}
                                          data-testid={`button-toggle-user-${user.id}`}
                                        >
                                          <UserCheck className="h-4 w-4 mr-2" />
                                          {user.isActive ? "Desativar" : "Ativar"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            if (window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`)) {
                                              deleteUserMutation.mutate(user.id);
                                            }
                                          }}
                                          disabled={deleteUserMutation.isPending}
                                          data-testid={`button-delete-user-${user.id}`}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Excluir
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-12">
                              <p className="text-muted-foreground">
                                {(userFilterName || userFilterEmail || userFilterCpf || (userFilterRole && userFilterRole !== "all"))
                                  ? "Nenhum usuário encontrado com os filtros aplicados."
                                  : "Nenhum usuário cadastrado. Clique em \"Novo Usuário\" para começar."}
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="logs">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logs do Sistema</CardTitle>
                      <CardDescription>
                        Registro detalhado de todas as ações realizadas no sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {crmLoading.auditLogs ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Carregando logs...</p>
                        </div>
                      ) : auditLogs && auditLogs.length > 0 ? (
                        <div className="space-y-3">
                          {auditLogs.map((log: any) => {
                            const actionColors: Record<string, string> = {
                              'create': 'bg-green-500/10 text-green-600 border-green-500/20',
                              'update': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                              'delete': 'bg-red-500/10 text-red-600 border-red-500/20',
                              'login': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                              'logout': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
                              'approve': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                              'reject': 'bg-red-500/10 text-red-600 border-red-500/20',
                              'checkout': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
                              'finalize': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
                            };

                            const actionLabels: Record<string, string> = {
                              'create': 'Criação',
                              'update': 'Atualização',
                              'delete': 'Exclusão',
                              'login': 'Login',
                              'logout': 'Logout',
                              'approve': 'Aprovação',
                              'reject': 'Rejeição',
                              'checkout': 'Vistoria',
                              'finalize': 'Finalização'
                            };

                            const entityLabels: Record<string, string> = {
                              'vehicle': 'Veículo',
                              'customer': 'Cliente',
                              'rental': 'Aluguel',
                              'financing': 'Financiamento',
                              'investor': 'Investidor',
                              'admin': 'Admin',
                              'admin_user': 'Usuário Admin',
                              'vehicle_request': 'Solicitação de Investimento',
                              'trade_in_vehicle': 'Veículo de Troca',
                              'contract': 'Contrato',
                              'lead': 'Lead'
                            };

                            // Parse details if it's a string
                            let parsedDetails: Record<string, any> = {};
                            try {
                              parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {});
                            } catch (e) {
                              parsedDetails = {};
                            }

                            // Create detailed description using entityName or action + entity
                            const getDescription = () => {
                              const actionLabel = actionLabels[log.action] || log.action;
                              const entityLabel = entityLabels[log.entity] || log.entity;
                              const entityName = log.entityName;

                              // Build contextual description
                              if (log.action === 'login') {
                                return `${log.userName || 'Usuário'} fez login no sistema`;
                              }
                              if (log.action === 'create' && log.entity === 'vehicle' && entityName) {
                                return `Cadastrou veículo: ${entityName}`;
                              }
                              if (log.action === 'create' && log.entity === 'customer' && entityName) {
                                return `Cadastrou cliente: ${entityName}`;
                              }
                              if (log.action === 'create' && log.entity === 'investor' && entityName) {
                                return `Cadastrou investidor: ${entityName}`;
                              }
                              if (log.action === 'create' && log.entity === 'rental' && entityName) {
                                return `Criou aluguel para: ${entityName}`;
                              }
                              if (log.action === 'create' && log.entity === 'financing' && entityName) {
                                return `Criou financiamento para: ${entityName}`;
                              }
                              if (log.action === 'approve' && log.entity === 'vehicle_request' && entityName) {
                                return `Aprovou solicitação de investimento: ${entityName}`;
                              }
                              if (log.action === 'approve' && log.entity === 'financing' && entityName) {
                                return `Aprovou financiamento de: ${entityName}`;
                              }
                              if (log.action === 'reject' && entityName) {
                                return `Rejeitou ${entityLabel.toLowerCase()}: ${entityName}`;
                              }
                              if (log.action === 'update' && entityName) {
                                return `Atualizou ${entityLabel.toLowerCase()}: ${entityName}`;
                              }
                              if (log.action === 'delete' && entityName) {
                                return `Excluiu ${entityLabel.toLowerCase()}: ${entityName}`;
                              }
                              if (log.action === 'checkout' && entityName) {
                                return `Realizou vistoria: ${entityName}`;
                              }
                              if (log.action === 'finalize' && entityName) {
                                return `Finalizou ${entityLabel.toLowerCase()}: ${entityName}`;
                              }

                              // Fallback to entity name if available
                              if (entityName) {
                                return `${actionLabel} de ${entityLabel.toLowerCase()}: ${entityName}`;
                              }

                              return `${actionLabel} de ${entityLabel}`;
                            };

                            return (
                              <Card key={log.id} className="hover-elevate" data-testid={`card-log-${log.id}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                          variant="outline"
                                          className={actionColors[log.action] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'}
                                        >
                                          {actionLabels[log.action] || log.action}
                                        </Badge>
                                        <Badge variant="secondary">{entityLabels[log.entity] || log.entity}</Badge>
                                      </div>

                                      <p className="text-sm font-medium">{getDescription()}</p>

                                      {log.userName && (
                                        <p className="text-xs text-muted-foreground">
                                          Executado por: <span className="font-medium">{log.userName}</span>
                                        </p>
                                      )}

                                      {parsedDetails && Object.keys(parsedDetails).length > 0 && (
                                        <div className="mt-2 p-2 bg-muted rounded-md">
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Detalhes:</p>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                            {Object.entries(parsedDetails).slice(0, 8).map(([key, value]: [string, any]) => (
                                              <div key={key} className="flex gap-2">
                                                <span className="font-medium text-muted-foreground">{key}:</span>
                                                <span className="text-foreground truncate" title={String(value)}>
                                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                              </div>
                                            ))}
                                            {Object.keys(parsedDetails).length > 8 && (
                                              <div className="text-xs text-muted-foreground">
                                                + {Object.keys(parsedDetails).length - 8} campos...
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {log.ipAddress && (
                                        <p className="text-xs text-muted-foreground">
                                          IP: {log.ipAddress}
                                        </p>
                                      )}
                                    </div>

                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </p>
                                      <p className="text-xs font-medium">
                                        {new Date(log.createdAt).toLocaleTimeString('pt-BR', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-muted-foreground">Nenhum log registrado ainda.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {/* Dialog para Registrar Vendas */}
      <Dialog open={salesDialogOpen} onOpenChange={setSalesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Vendas de {selectedUserForSales?.name}</DialogTitle>
            <DialogDescription>
              Adicione ou remova vendas (use valores negativos para diminuir)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade de Vendas</label>
              <Input
                type="number"
                value={salesAmount}
                onChange={(e) => setSalesAmount(e.target.value)}
                placeholder="1 ou -1"
                data-testid="input-sales-count"
              />
              <p className="text-xs text-muted-foreground">
                Use valores positivos para adicionar ou negativos para remover vendas
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor da Venda (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={salesRevenue}
                onChange={(e) => setSalesRevenue(e.target.value)}
                placeholder="0.00"
                data-testid="input-sales-revenue"
              />
              <p className="text-xs text-muted-foreground">
                Opcional: Informe o valor em reais (positivo para adicionar, negativo para remover)
              </p>
            </div>
            <div className="pt-2 border-t space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Vendas {selectedUserForSales?.goalPeriod === 'daily' ? 'Hoje' : selectedUserForSales?.goalPeriod === 'weekly' ? 'Esta Semana' : selectedUserForSales?.goalPeriod === 'monthly' ? 'Este Mês' : selectedUserForSales?.goalPeriod === 'yearly' ? 'Este Ano' : 'Atuais'}:
                </p>
                <p className="text-sm font-medium">{selectedUserForSales?.salesCount || 0}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Receita Total:</p>
                <p className="text-sm font-medium">
                  R$ {parseFloat(selectedUserForSales?.salesRevenue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => {
                const amount = parseInt(salesAmount);
                if (isNaN(amount) || amount === 0) {
                  toast({
                    title: "Valor inválido",
                    description: "Informe uma quantidade diferente de zero.",
                    variant: "destructive",
                  });
                  return;
                }

                const currentCount = selectedUserForSales?.salesCount || 0;
                if (currentCount + amount < 0) {
                  toast({
                    title: "Operação inválida",
                    description: `Não é possível remover ${Math.abs(amount)} vendas. O vendedor tem apenas ${currentCount} vendas no período atual.`,
                    variant: "destructive",
                  });
                  return;
                }

                addSalesMutation.mutate({
                  id: selectedUserForSales.id,
                  amount,
                  revenue: salesRevenue || undefined
                });
              }}
              disabled={addSalesMutation.isPending}
              data-testid="button-confirm-add-sale"
            >
              {addSalesMutation.isPending ? "Processando..." : "Confirmar"}
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
              Configure a meta de vendas e o período de avaliação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade (vendas)</label>
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
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
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
            {(adminUsers ?? []).filter((u: any) => u.role === 'VENDEDOR').length > 0 ? (
              <div className="space-y-4">
                {(adminUsers ?? []).filter((u: any) => u.role === 'VENDEDOR').map((vendor: any) => {
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

      {/* Dialog para Espelhamento do Painel do Investidor */}
      <Dialog open={investorMirrorDialogOpen} onOpenChange={setInvestorMirrorDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-600" />
              Painel do Investidor: {mirroredInvestor?.name}
            </DialogTitle>
            <DialogDescription>
              Visualização espelhada do que o investidor vê em seu portal
            </DialogDescription>
          </DialogHeader>

          {mirroredInvestor && (() => {
            const investorCpf = mirroredInvestor.cpf;
            const normalizeCpf = (cpf: string | null | undefined) => cpf?.replace(/\D/g, '') || '';
            const normalizedInvestorCpf = normalizeCpf(investorCpf);
            const customerRecord = customers?.find((c: any) => normalizeCpf(c.cpf) === normalizedInvestorCpf);

            const investorOwnerId = customerRecord?.id || mirroredInvestor.id;
            const investorVehiclesList = vehicles?.filter((v: any) =>
              v.isInvestorVehicle && v.ownerId === investorOwnerId
            ) || [];

            const customerData = customerRecord || mirroredInvestor;

            const calculateMonthlyDiv = () => {
              const vehiclesDividendSum = investorVehiclesList.reduce((total: number, vehicle: any) => {
                if (vehicle.customDividend) {
                  return total + parseFloat(vehicle.customDividend);
                }

                if (vehicle.fipeValue && investmentQuotas && Array.isArray(investmentQuotas)) {
                  const fipeValue = parseFloat(vehicle.fipeValue);
                  const matchingQuota = investmentQuotas.find((quota: any) => {
                    const minValue = parseFloat(quota.minValue);
                    const maxValue = parseFloat(quota.maxValue);
                    const categoryMatch = quota.category === vehicle.category;
                    return categoryMatch && fipeValue >= minValue && fipeValue <= maxValue;
                  });

                  if (matchingQuota) {
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

              if (customerData.monthlyDividend) {
                return parseFloat(customerData.monthlyDividend);
              }

              return 0;
            };

            const monthlyDiv = calculateMonthlyDiv();

            const calculateAccrued = () => {
              if (!customerData?.createdAt || !customerData?.paymentDate) return { total: 0, paymentsCount: 0 };
              if (monthlyDiv === 0) return { total: 0, paymentsCount: 0 };

              const createdDate = new Date(customerData.createdAt);
              const today = new Date(); // Data atual real
              const paymentDay = customerData.paymentDate;

              let paymentsCount = 0;
              let currentDate = new Date(createdDate);

              if (currentDate.getDate() <= paymentDay) {
                currentDate.setDate(paymentDay);
              } else {
                currentDate.setMonth(currentDate.getMonth() + 1);
                currentDate.setDate(paymentDay);
              }

              while (currentDate <= today) {
                paymentsCount++;
                currentDate.setMonth(currentDate.getMonth() + 1);
              }

              return { total: paymentsCount * monthlyDiv, paymentsCount };
            };

            const accruedDiv = calculateAccrued();

            return (
              <div className="space-y-6">
                {/* Hero Overview */}
                <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-cyan-500/5 border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <User className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-1">Bem-vindo, {customerData.name || mirroredInvestor.name}!</h2>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-purple-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Investidor Parceiro
                          </Badge>
                          {customerData.createdAt && (
                            <span className="text-sm text-muted-foreground">
                              desde {format(new Date(customerData.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-green-200 dark:border-green-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Dividendo Mensal</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Valor fixo garantido</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        R$ {monthlyDiv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 dark:border-amber-800">
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
                      <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        R$ {accruedDiv.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {accruedDiv.paymentsCount} pagamento(s) realizado(s)
                      </p>
                    </CardContent>
                  </Card>

                  {(() => {
                    // Agregar datas de pagamento de todos os veículos
                    const vehiclePaymentDates = investorVehiclesList
                      .map((v: any) => v.paymentDate)
                      .filter((d: any) => d != null && d > 0);
                    const allPaymentDates = vehiclePaymentDates.length > 0
                      ? vehiclePaymentDates
                      : (customerData.paymentDate ? [customerData.paymentDate] : []);
                    const uniquePaymentDates = Array.from(new Set(allPaymentDates)).sort((a: number, b: number) => a - b);
                    const paymentDatesFormatted = uniquePaymentDates.length > 0
                      ? `Dia ${uniquePaymentDates.join('/')}`
                      : null;

                    return (
                      <Card className="border-cyan-200 dark:border-cyan-800">
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
                          <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                            {paymentDatesFormatted || "—"}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  <Card className="border-blue-200 dark:border-blue-800">
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
                        {investorVehiclesList.length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {investorVehiclesList.filter((v: any) => v.available).length} disponíveis agora
                      </p>
                    </CardContent>
                  </Card>

                  {(() => {
                    // Aggregar bônus de todos os veículos do investidor
                    const vehicleBonuses = investorVehiclesList
                      .filter((v: any) => v.bonusValue && parseFloat(v.bonusValue) > 0)
                      .map((v: any) => ({
                        vehicleName: v.name || `${v.brand} ${v.model}`,
                        bonusValue: parseFloat(v.bonusValue),
                        bonusDate: v.bonusDate,
                      }));
                    const totalBonus = vehicleBonuses.reduce((sum: number, b: any) => sum + b.bonusValue, 0);
                    const hasBonus = vehicleBonuses.length > 0;

                    return (
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <div>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Bônus (Pagamento Único)</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Pagamento especial</p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                            <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {hasBonus ? `R$ ${totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "—"}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {hasBonus
                              ? vehicleBonuses.length === 1
                                ? `Data: ${vehicleBonuses[0].bonusDate}`
                                : `${vehicleBonuses.length} veículo(s) com bônus`
                              : "Não configurado"}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>

                {/* Lista de Veículos - Igual ao Portal */}
                <Card>
                  <CardHeader>
                    <CardTitle>Meus Veículos</CardTitle>
                    <CardDescription>Gerencie sua frota e acompanhe o desempenho</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {investorVehiclesList.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {investorVehiclesList.map((vehicle: any) => (
                          <Card key={vehicle.id} className="overflow-hidden hover-elevate">
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
                                    <Settings className="h-4 w-4 text-muted-foreground" />
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
                                  <Phone className="h-4 w-4 mr-2" />
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
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Seção de Contratos de Investimento por Veículo */}
                <Card className="border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-600" />
                      Contratos de Investimento
                    </CardTitle>
                    <CardDescription>
                      Gerencie os contratos de cessão para cada veículo do investidor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {investorVehiclesList.length > 0 ? investorVehiclesList.map((vehicle: any) => (
                        <div key={vehicle.id} className="p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{vehicle.brand} {vehicle.model}</span>
                              <Badge variant="outline" className="text-xs">{vehicle.licensePlate}</Badge>
                            </div>
                          </div>

                          {vehicle.investmentContractUrl ? (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                              <FileText className="h-6 w-6 text-green-600" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">Contrato anexado</p>
                                <p className="text-xs text-muted-foreground">{vehicle.investmentContractFileName || "contrato.pdf"}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = vehicle.investmentContractUrl;
                                    link.download = vehicle.investmentContractFileName || "contrato";
                                    link.click();
                                  }}
                                  data-testid={`button-download-vehicle-contract-${vehicle.id}`}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (confirm("Tem certeza que deseja remover este contrato?")) {
                                      try {
                                        await apiRequest("DELETE", `/api/vehicles/${vehicle.id}/investment-contract`, {});
                                        queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
                                        toast({
                                          title: "Contrato removido",
                                          description: "O contrato foi removido com sucesso.",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Erro",
                                          description: "Não foi possível remover o contrato.",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }}
                                  data-testid={`button-remove-vehicle-contract-${vehicle.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-orange-500/50 cursor-pointer bg-muted/50 transition-colors">
                              <FileText className="h-6 w-6 text-muted-foreground mr-2" />
                              <span className="text-sm text-muted-foreground">
                                Anexar contrato de cessão
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const base64 = await processFileUpload(file);
                                      await apiRequest("PATCH", `/api/vehicles/${vehicle.id}/investment-contract`, {
                                        contractUrl: base64,
                                        contractFileName: file.name,
                                      });
                                      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
                                      toast({
                                        title: "Contrato anexado",
                                        description: "O contrato foi anexado com sucesso.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Erro ao processar arquivo",
                                        description: error instanceof Error ? error.message : "Erro desconhecido",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                                data-testid={`input-vehicle-contract-upload-${vehicle.id}`}
                              />
                            </label>
                          )}
                        </div>
                      )) : (
                        <div className="text-center py-6 text-muted-foreground">
                          Nenhum veículo cadastrado para este investidor.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar/Editar Veículo */}

      {/* Dialog para Importação em Massa */}


      {/* Dialog para Adicionar/Editar Template de Contrato */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template de Contrato"}
            </DialogTitle>
            <DialogDescription>
              Crie templates de contratos para locação, financiamento e investimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Template *</label>
              <Input
                placeholder="Ex: Contrato de Locação Padrão"
                value={templateFormData.name || ""}
                onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                data-testid="input-template-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select
                value={templateFormData.type || ""}
                onValueChange={(value) => setTemplateFormData({ ...templateFormData, type: value })}
              >
                <SelectTrigger data-testid="select-template-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental">Locação</SelectItem>
                  <SelectItem value="financing">Financiamento</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo do Contrato *</label>
              <p className="text-xs text-muted-foreground">
                Use variáveis como {`{{customerName}}`}, {`{{vehicleName}}`}, {`{{totalPrice}}`}, etc.
              </p>
              <textarea
                className="w-full min-h-[300px] p-3 border rounded-md text-sm font-mono"
                placeholder="Digite o conteúdo do contrato aqui..."
                value={templateFormData.content || ""}
                onChange={(e) => setTemplateFormData({ ...templateFormData, content: e.target.value })}
                data-testid="textarea-template-content"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={templateFormData.isActive !== false}
                onChange={(e) => setTemplateFormData({ ...templateFormData, isActive: e.target.checked })}
                className="rounded"
                data-testid="checkbox-template-active"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Template ativo (disponível para uso)
              </label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTemplateDialogOpen(false);
                setEditingTemplate(null);
                setTemplateFormData({});
              }}
              data-testid="button-cancel-template"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!templateFormData.name || !templateFormData.type || !templateFormData.content) {
                  toast({
                    title: "Dados incompletos",
                    description: "Preencha todos os campos obrigatórios.",
                    variant: "destructive",
                  });
                  return;
                }

                if (editingTemplate) {
                  updateTemplateMutation.mutate({
                    id: editingTemplate.id,
                    data: templateFormData,
                  });
                } else {
                  createTemplateMutation.mutate(templateFormData);
                }
              }}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {createTemplateMutation.isPending || updateTemplateMutation.isPending ? "Salvando..." : editingTemplate ? "Atualizar" : "Criar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Finalização de Contrato de Aluguel */}
      <Dialog open={finalizationDialogOpen} onOpenChange={setFinalizationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Finalização de Contrato - Etapa {finalizationStep} de 3
            </DialogTitle>
            <DialogDescription>
              {finalizationStep === 1 && "Devolução e Checkout do Veículo"}
              {finalizationStep === 2 && "Análise Crítica e Checkpoint"}
              {finalizationStep === 3 && "Encerramento do Contrato"}
            </DialogDescription>
          </DialogHeader>

          {selectedRental && (
            <div className="space-y-6">
              {/* Informações do Aluguel */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">Cliente: {selectedRental.customerName}</p>
                <p className="text-sm text-muted-foreground">CPF: {selectedRental.customerCpf}</p>
                <p className="text-sm text-muted-foreground">
                  Período: {new Date(selectedRental.startDate).toLocaleDateString('pt-BR')} até {new Date(selectedRental.endDate).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Etapa 1: Devolução/Checkout */}
              {finalizationStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg">Vistoria de Devolução</h3>
                    <p className="text-sm text-muted-foreground">
                      Fotos obrigatórias e checklist completo de inspeção
                    </p>
                  </div>

                  {/* Fotos Obrigatórias - 4 fotos principais */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Fotos Obrigatórias do Veículo</CardTitle>
                      <CardDescription>Tire as 4 fotos principais do veículo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 0, label: 'Vista Frontal' },
                          { key: 1, label: 'Vista Traseira' },
                          { key: 2, label: 'Lateral Esquerda' },
                          { key: 3, label: 'Lateral Direita' },
                        ].map((photo) => (
                          <div key={photo.key} className="space-y-2">
                            <label className="text-sm font-medium">{photo.label} *</label>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const base64 = await processFileUpload(file);
                                    const newImages = [...(checkoutData.checkOutImages || [])];
                                    newImages[photo.key] = {
                                      type: photo.label,
                                      url: base64
                                    };
                                    setCheckoutData({ ...checkoutData, checkOutImages: newImages });
                                  } catch (error) {
                                    console.error('Erro ao processar imagem:', error);
                                  }
                                }
                              }}
                              className="w-full text-sm"
                              data-testid={`input-checkout-photo-${photo.key}`}
                            />
                            {checkoutData.checkOutImages?.[photo.key] && (
                              <img
                                src={checkoutData.checkOutImages[photo.key].url}
                                alt={photo.label}
                                className="w-full h-32 object-cover rounded border-2 border-primary"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Checklist Completo de Inspeção */}
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
                            checked={checkoutData.checklist?.[item]?.checked ?? true}
                            onChange={(e) => setCheckoutData({
                              ...checkoutData,
                              checklist: {
                                ...checkoutData.checklist,
                                [item]: { ...checkoutData.checklist?.[item], checked: e.target.checked }
                              }
                            })}
                            className="mt-1 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item}</p>
                            {!checkoutData.checklist?.[item]?.checked && (
                              <Input
                                placeholder="Observações sobre o problema..."
                                value={checkoutData.checklist?.[item]?.notes || ""}
                                onChange={(e) => setCheckoutData({
                                  ...checkoutData,
                                  checklist: {
                                    ...checkoutData.checklist,
                                    [item]: { ...checkoutData.checklist?.[item], notes: e.target.value }
                                  }
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
                            checked={checkoutData.checklist?.[item]?.checked ?? true}
                            onChange={(e) => setCheckoutData({
                              ...checkoutData,
                              checklist: {
                                ...checkoutData.checklist,
                                [item]: { ...checkoutData.checklist?.[item], checked: e.target.checked }
                              }
                            })}
                            className="mt-1 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item}</p>
                            {!checkoutData.checklist?.[item]?.checked && (
                              <Input
                                placeholder="Observações sobre o problema..."
                                value={checkoutData.checklist?.[item]?.notes || ""}
                                onChange={(e) => setCheckoutData({
                                  ...checkoutData,
                                  checklist: {
                                    ...checkoutData.checklist,
                                    [item]: { ...checkoutData.checklist?.[item], notes: e.target.value }
                                  }
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
                            checked={checkoutData.checklist?.[item]?.checked ?? true}
                            onChange={(e) => setCheckoutData({
                              ...checkoutData,
                              checklist: {
                                ...checkoutData.checklist,
                                [item]: { ...checkoutData.checklist?.[item], checked: e.target.checked }
                              }
                            })}
                            className="mt-1 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item}</p>
                            {!checkoutData.checklist?.[item]?.checked && (
                              <Input
                                placeholder="Observações sobre o problema..."
                                value={checkoutData.checklist?.[item]?.notes || ""}
                                onChange={(e) => setCheckoutData({
                                  ...checkoutData,
                                  checklist: {
                                    ...checkoutData.checklist,
                                    [item]: { ...checkoutData.checklist?.[item], notes: e.target.value }
                                  }
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
                            checked={checkoutData.checklist?.[item]?.checked ?? true}
                            onChange={(e) => setCheckoutData({
                              ...checkoutData,
                              checklist: {
                                ...checkoutData.checklist,
                                [item]: { ...checkoutData.checklist?.[item], checked: e.target.checked }
                              }
                            })}
                            className="mt-1 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item}</p>
                            {!checkoutData.checklist?.[item]?.checked && (
                              <Input
                                placeholder="Observações sobre o problema..."
                                value={checkoutData.checklist?.[item]?.notes || ""}
                                onChange={(e) => setCheckoutData({
                                  ...checkoutData,
                                  checklist: {
                                    ...checkoutData.checklist,
                                    [item]: { ...checkoutData.checklist?.[item], notes: e.target.value }
                                  }
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
                            checked={checkoutData.checklist?.[item]?.checked ?? true}
                            onChange={(e) => setCheckoutData({
                              ...checkoutData,
                              checklist: {
                                ...checkoutData.checklist,
                                [item]: { ...checkoutData.checklist?.[item], checked: e.target.checked }
                              }
                            })}
                            className="mt-1 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item}</p>
                            {!checkoutData.checklist?.[item]?.checked && (
                              <Input
                                placeholder="Observações sobre o problema..."
                                value={checkoutData.checklist?.[item]?.notes || ""}
                                onChange={(e) => setCheckoutData({
                                  ...checkoutData,
                                  checklist: {
                                    ...checkoutData.checklist,
                                    [item]: { ...checkoutData.checklist?.[item], notes: e.target.value }
                                  }
                                })}
                                className="mt-2"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Etapa 2: Checkpoint/Análise Crítica */}
              {finalizationStep === 2 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Análise Crítica de Devolução</h3>
                  <p className="text-sm text-muted-foreground">
                    Revise as informações do checklist e confirme se há problemas ou avarias detectadas
                  </p>

                  {/* Análise de Avarias */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Verificação de Avarias</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Possui avarias não documentadas no check-in? *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="hasDamages"
                              value="true"
                              checked={checkpointData.hasDamages === true}
                              onChange={() => setCheckpointData({ ...checkpointData, hasDamages: true })}
                              data-testid="radio-has-damages-yes"
                            />
                            <span className="text-sm">Sim</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="hasDamages"
                              value="false"
                              checked={checkpointData.hasDamages === false}
                              onChange={() => setCheckpointData({ ...checkpointData, hasDamages: false })}
                              data-testid="radio-has-damages-no"
                            />
                            <span className="text-sm">Não</span>
                          </label>
                        </div>
                      </div>

                      {checkpointData.hasDamages && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Observações sobre as Avarias</label>
                            <textarea
                              className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                              placeholder="Descreva as avarias encontradas..."
                              value={checkpointData.damagesNotes || ""}
                              onChange={(e) => setCheckpointData({ ...checkpointData, damagesNotes: e.target.value })}
                              data-testid="textarea-checkpoint-damages"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Custo de Reparo (R$)</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={checkpointData.repairCost || ""}
                              onChange={(e) => setCheckpointData({ ...checkpointData, repairCost: e.target.value })}
                              data-testid="input-repair-cost"
                            />
                            <p className="text-xs text-muted-foreground">
                              Este valor será cobrado do cliente na finalização
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Etapa 3: Encerramento */}
              {finalizationStep === 3 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Encerramento do Contrato</h3>

                  {/* Resumo da Análise */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-medium">Resumo da Análise</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Avarias não documentadas:</span> {checkpointData.hasDamages ? "✓ Sim" : "✓ Não"}
                      </div>
                      {checkpointData.hasDamages && checkpointData.damagesNotes && (
                        <div>
                          <span className="font-medium">Observações:</span> {checkpointData.damagesNotes}
                        </div>
                      )}
                      {checkpointData.repairCost && (
                        <div>
                          <span className="font-medium">Custo de Reparo:</span> R$ {Number(checkpointData.repairCost).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cálculo de Débitos */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <h4 className="font-medium">Débitos e Pagamentos</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Valor do Contrato:</span>
                        <span className="font-medium">R$ {Number(selectedRental.totalPrice).toFixed(2)}</span>
                      </div>
                      {checkpointData.repairCost && Number(checkpointData.repairCost) > 0 && (
                        <div className="flex justify-between text-sm text-orange-600">
                          <span>Custo de Reparos:</span>
                          <span className="font-medium">+ R$ {Number(checkpointData.repairCost).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span>
                          R$ {(Number(selectedRental.totalPrice) + Number(checkpointData.repairCost || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor de Débitos Pendentes (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={finalizationData.debtAmount || ""}
                        onChange={(e) => setFinalizationData({ ...finalizationData, debtAmount: e.target.value })}
                        data-testid="input-debt-amount"
                      />
                      <p className="text-xs text-muted-foreground">
                        Se houver valores pendentes, informe o total aqui
                      </p>
                    </div>

                    {finalizationData.debtAmount && Number(finalizationData.debtAmount) > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Método de Pagamento dos Débitos *</label>
                        <Select
                          value={finalizationData.paymentMethod || ""}
                          onValueChange={(value) => setFinalizationData({ ...finalizationData, paymentMethod: value })}
                        >
                          <SelectTrigger data-testid="select-finalization-payment">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                            <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Ao finalizar, um contrato de entrega do veículo será gerado e o aluguel será marcado como finalizado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {finalizationStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setFinalizationStep(finalizationStep - 1)}
                data-testid="button-previous-step"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setFinalizationDialogOpen(false);
                setSelectedRental(null);
                setFinalizationStep(1);
                setIsFinalizingContract(false);
              }}
              data-testid="button-cancel-finalization"
            >
              Cancelar
            </Button>
            {finalizationStep < 3 ? (
              <Button
                onClick={() => {
                  if (finalizationStep === 1) {
                    const hasAll4Photos = checkoutData.checkOutImages?.length === 4 &&
                      checkoutData.checkOutImages.every((img: any) => img && img.url);

                    if (!hasAll4Photos) {
                      toast({
                        title: "Fotos incompletas",
                        description: "Por favor, faça upload das 4 fotos obrigatórias do veículo.",
                        variant: "destructive",
                      });
                      return;
                    }
                  }
                  if (finalizationStep === 2) {
                    if (checkpointData.hasDamages === null) {
                      toast({
                        title: "Checkpoint incompleto",
                        description: "Por favor, responda se há avarias não documentadas no check-in.",
                        variant: "destructive",
                      });
                      return;
                    }
                  }
                  setFinalizationStep(finalizationStep + 1);
                }}
                data-testid="button-next-step"
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  setIsFinalizingContract(true);
                  try {
                    // Coletar apenas as 4 fotos obrigatórias
                    const checkoutPhotos = checkoutData.checkOutImages?.map((img: any) => img.url) || [];

                    // Coletar dados do checklist
                    const checklistData = checkoutData.checklist || {};

                    // Combinar lógica de avarias: baseado apenas na Etapa 2
                    const hasDamages = checkpointData.hasDamages;
                    const damagesNotes = checkpointData.damagesNotes || "";

                    const updateData = {
                      status: "finalized",
                      hasCheckout: true,
                      checkOutImages: checkoutPhotos,
                      checkOutNotes: checkoutData.checkOutNotes,
                      checkoutCompletedAt: new Date().toISOString(),
                      checkpointHasDamages: hasDamages,
                      checkpointDamagesNotes: damagesNotes,
                      checkpointRepairCost: checkpointData.repairCost || "0",
                      finalizationDebtAmount: finalizationData.debtAmount || "0",
                      finalizationPaymentMethod: finalizationData.paymentMethod,
                      finalizedAt: new Date().toISOString(),
                      checkOutChecklist: checklistData,
                    };

                    await apiRequest("PATCH", `/api/rentals/${selectedRental.id}`, updateData);

                    // Invalidar cache de aluguéis e veículos
                    queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });

                    toast({
                      title: "Contrato finalizado!",
                      description: "O contrato foi encerrado e o veículo está disponível para nova locação.",
                    });

                    setFinalizationDialogOpen(false);
                    setSelectedRental(null);
                    setFinalizationStep(1);
                  } catch (error: any) {
                    toast({
                      title: "Erro ao finalizar",
                      description: error.message || "Ocorreu um erro ao finalizar o contrato.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsFinalizingContract(false);
                  }
                }}
                disabled={isFinalizingContract}
                data-testid="button-finalize-contract"
              >
                {isFinalizingContract ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Finalizar Contrato
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico do Veículo */}
      <Dialog open={vehicleHistoryDialogOpen} onOpenChange={setVehicleHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Histórico do Veículo</DialogTitle>
                <DialogDescription>
                  {selectedVehicleForHistory?.name} - Timeline completa de eventos
                </DialogDescription>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setNewEventDialogOpen(true)}
                data-testid="button-add-vehicle-event"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Evento
              </Button>
            </div>
          </DialogHeader>

          {selectedVehicleForHistory && (
            <div className="space-y-6">
              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total de Aluguéis</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        const vehicleRentals = rentals?.filter((r: any) => r.vehicleId === selectedVehicleForHistory.id) || [];
                        return vehicleRentals.length;
                      })()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      R$ {(() => {
                        const vehicleRentals = rentals?.filter((r: any) => r.vehicleId === selectedVehicleForHistory.id) || [];
                        const total = vehicleRentals.reduce((sum: number, r: any) => sum + Number(r.totalPrice || 0), 0);
                        return total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                      })()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Custos de Eventos</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      R$ {(() => {
                        const vehicleRentals = rentals?.filter((r: any) => r.vehicleId === selectedVehicleForHistory.id) || [];
                        const vehicleEvents = customerEvents?.filter((e: any) => e.vehicleId === selectedVehicleForHistory.id) || [];

                        // Somar custos de reparos de aluguéis
                        const repairCosts = vehicleRentals.reduce((sum: number, r: any) => {
                          return sum + Number(r.checkpointRepairCost || 0);
                        }, 0);

                        // Somar custos de eventos personalizados
                        const eventCosts = vehicleEvents.reduce((sum: number, e: any) => {
                          return sum + Number(e.cost || 0);
                        }, 0);

                        return (repairCosts + eventCosts).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                      })()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Status Atual</p>
                    <Badge variant={selectedVehicleForHistory.available ? "default" : "secondary"}>
                      {selectedVehicleForHistory.available ? "Disponível" : "Alugado"}
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Dias Total Alugado</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        const vehicleRentals = rentals?.filter((r: any) => r.vehicleId === selectedVehicleForHistory.id) || [];
                        const totalDays = vehicleRentals.reduce((sum: number, r: any) => {
                          const days = Math.ceil((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 60 * 60 * 24));
                          return sum + days;
                        }, 0);
                        return totalDays;
                      })()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Timeline de Eventos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Timeline de Eventos</h3>

                <div className="relative border-l-2 border-muted-foreground/30 pl-6 space-y-6">
                  {(() => {
                    // Buscar todos os eventos relacionados ao veículo
                    const vehicleRentals = rentals?.filter((r: any) => r.vehicleId === selectedVehicleForHistory.id) || [];
                    const vehicleEvents = customerEvents?.filter((e: any) => e.vehicleId === selectedVehicleForHistory.id) || [];

                    // Criar array de eventos unificado
                    const allEvents: any[] = [];

                    // Adicionar aluguéis
                    vehicleRentals.forEach((rental: any) => {
                      const isApproved = rental.status === 'approved' || rental.status === 'active' || rental.status === 'completed';
                      const isRejected = rental.status === 'rejected';

                      allEvents.push({
                        type: 'rental',
                        date: rental.startDate,
                        title: isApproved ? 'Início de Aluguel - Aprovado' : isRejected ? 'Solicitação de Aluguel - Reprovada' : 'Solicitação de Aluguel - Pendente',
                        description: `Cliente: ${rental.customerName}`,
                        rental: rental,
                        icon: isApproved ? Check : isRejected ? X : Car,
                        severity: isRejected ? 'danger' : 'normal'
                      });
                      if (rental.finalizedAt) {
                        allEvents.push({
                          type: 'rental_end',
                          date: rental.finalizedAt,
                          title: 'Fim de Aluguel',
                          description: `Cliente: ${rental.customerName} - Contrato finalizado`,
                          rental: rental,
                          icon: Check
                        });
                      }
                      if (rental.checkpointHasDamages) {
                        allEvents.push({
                          type: 'damage',
                          date: rental.checkoutCompletedAt || rental.endDate,
                          title: 'Avaria Detectada',
                          description: rental.checkpointDamagesNotes || 'Avarias identificadas no checkout',
                          rental: rental,
                          icon: X,
                          severity: 'warning'
                        });
                      }
                    });

                    // Adicionar eventos de clientes
                    vehicleEvents.forEach((event: any) => {
                      const eventType = event.type?.toLowerCase() || '';
                      let icon = Calendar;
                      let severity = 'normal';

                      if (eventType.includes('sinistro') || eventType.includes('acidente')) {
                        icon = X;
                        severity = 'danger';
                      } else if (eventType.includes('manutencao') || eventType.includes('manutenção')) {
                        icon = Settings;
                        severity = 'info';
                      } else if (eventType.includes('avaria') || eventType.includes('dano')) {
                        icon = X;
                        severity = 'warning';
                      }

                      allEvents.push({
                        type: 'custom_event',
                        date: event.date || event.createdAt,
                        title: event.type || 'Evento',
                        description: event.description,
                        event: event,
                        icon: icon,
                        severity: severity
                      });
                    });

                    // Ordenar por data (mais recente primeiro)
                    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    if (allEvents.length === 0) {
                      return (
                        <p className="text-muted-foreground text-sm">
                          Nenhum evento registrado para este veículo ainda.
                        </p>
                      );
                    }

                    return allEvents.map((event, index) => {
                      const Icon = event.icon;
                      return (
                        <div key={index} className="relative">
                          {/* Marcador da timeline */}
                          <div className={`absolute -left-[29px] w-4 h-4 rounded-full border-2 
                            ${event.severity === 'danger' ? 'bg-red-500 border-red-500' :
                              event.severity === 'warning' ? 'bg-orange-500 border-orange-500' :
                                event.severity === 'info' ? 'bg-blue-500 border-blue-500' :
                                  'bg-primary border-primary'}`}
                          />

                          <Card
                            className="hover-elevate cursor-pointer"
                            onClick={() => {
                              setSelectedEventDetails(event);
                              setEventDetailsDialogOpen(true);
                            }}
                            data-testid={`event-card-${index}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg 
                                  ${event.severity === 'danger' ? 'bg-red-100 dark:bg-red-900/20' :
                                    event.severity === 'warning' ? 'bg-orange-100 dark:bg-orange-900/20' :
                                      event.severity === 'info' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                        'bg-primary/10'}`}>
                                  <Icon className={`h-5 w-5 
                                    ${event.severity === 'danger' ? 'text-red-600 dark:text-red-400' :
                                      event.severity === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                                        event.severity === 'info' ? 'text-blue-600 dark:text-blue-400' :
                                          'text-primary'}`} />
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div>
                                      <h4 className="font-semibold">{event.title}</h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {event.description}
                                      </p>
                                    </div>
                                    <Badge variant="outline">
                                      {new Date(event.date).toLocaleDateString('pt-BR')}
                                    </Badge>
                                  </div>

                                  {/* Detalhes específicos por tipo */}
                                  {event.type === 'rental' && event.rental && (
                                    <>
                                      <div className="mt-2">
                                        <Badge
                                          variant={
                                            event.rental.status === 'approved' || event.rental.status === 'active' || event.rental.status === 'completed' ? 'default' :
                                              event.rental.status === 'rejected' ? 'destructive' :
                                                'outline'
                                          }
                                          className={
                                            event.rental.status === 'approved' || event.rental.status === 'active' || event.rental.status === 'completed'
                                              ? 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
                                              : ''
                                          }
                                        >
                                          {event.rental.status === 'approved' || event.rental.status === 'active' || event.rental.status === 'completed' ? '✓ APROVADO' :
                                            event.rental.status === 'rejected' ? '✗ REPROVADO' :
                                              '⏳ PENDENTE'}
                                        </Badge>
                                      </div>
                                      <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-1 text-sm">
                                        <p><span className="font-medium">CPF:</span> {event.rental.customerCpf}</p>
                                        <p><span className="font-medium">Período:</span> {new Date(event.rental.startDate).toLocaleDateString('pt-BR')} até {new Date(event.rental.endDate).toLocaleDateString('pt-BR')}</p>
                                        <p><span className="font-medium">Valor:</span> R$ {Number(event.rental.totalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        <p><span className="font-medium">Duração:</span> {Math.ceil((new Date(event.rental.endDate).getTime() - new Date(event.rental.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias</p>
                                      </div>
                                    </>
                                  )}

                                  {event.rental?.checkpointRepairCost && Number(event.rental.checkpointRepairCost) > 0 && (
                                    <div className="mt-2">
                                      <Badge variant="destructive">
                                        Custo de Reparo: R$ {Number(event.rental.checkpointRepairCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Custo de eventos personalizados */}
                                  {event.type === 'custom_event' && event.event?.cost && Number(event.event.cost) > 0 && (
                                    <div className="mt-3">
                                      <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700">
                                        💰 Custo: R$ {Number(event.event.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVehicleHistoryDialogOpen(false);
                setSelectedVehicleForHistory(null);
              }}
              data-testid="button-close-history"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Novo Evento */}
      <Dialog open={newEventDialogOpen} onOpenChange={setNewEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Evento ao Histórico</DialogTitle>
            <DialogDescription>
              Registre avarias, manutenções, sinistros ou outros eventos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Evento *</label>
              <Select
                value={newEventData.type || ""}
                onValueChange={(value) => setNewEventData({ ...newEventData, type: value })}
              >
                <SelectTrigger data-testid="select-event-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manutenção Preventiva">Manutenção Preventiva</SelectItem>
                  <SelectItem value="Manutenção Corretiva">Manutenção Corretiva</SelectItem>
                  <SelectItem value="Avaria">Avaria</SelectItem>
                  <SelectItem value="Sinistro">Sinistro</SelectItem>
                  <SelectItem value="Acidente">Acidente</SelectItem>
                  <SelectItem value="Troca de Pneus">Troca de Pneus</SelectItem>
                  <SelectItem value="Revisão">Revisão</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Evento *</label>
              <Input
                type="date"
                value={newEventData.date || ""}
                onChange={(e) => setNewEventData({ ...newEventData, date: e.target.value })}
                data-testid="input-event-date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gravidade *</label>
              <Select
                value={newEventData.severity || "media"}
                onValueChange={(value) => setNewEventData({ ...newEventData, severity: value })}
              >
                <SelectTrigger data-testid="select-event-severity">
                  <SelectValue placeholder="Selecione a gravidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Gasto (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newEventData.cost || ""}
                onChange={(e) => setNewEventData({ ...newEventData, cost: e.target.value })}
                data-testid="input-event-cost"
              />
              <p className="text-xs text-muted-foreground">
                Informe o custo associado ao evento (opcional)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição *</label>
              <textarea
                className="w-full min-h-[120px] p-3 border rounded-md text-sm bg-background text-foreground"
                placeholder="Descreva em detalhes o evento, incluindo custos se aplicável..."
                value={newEventData.description || ""}
                onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                data-testid="textarea-event-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewEventDialogOpen(false);
                setNewEventData({
                  type: "",
                  description: "",
                  date: new Date().toISOString().split('T')[0],
                  severity: "media",
                  cost: ""
                });
              }}
              data-testid="button-cancel-event"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!newEventData.type || !newEventData.description || !newEventData.date) {
                  toast({
                    title: "Campos obrigatórios",
                    description: "Preencha todos os campos obrigatórios.",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  const typeMapping: Record<string, string> = {
                    "Manutenção Preventiva": "manutencao",
                    "Manutenção Corretiva": "manutencao",
                    "Avaria": "oficina",
                    "Sinistro": "colisao",
                    "Acidente": "colisao",
                    "Troca de Pneus": "manutencao",
                    "Revisão": "manutencao",
                    "Outro": "manutencao"
                  };

                  await apiRequest("POST", "/api/customer-events", {
                    customerId: selectedVehicleForHistory.ownerId || null,
                    vehicleId: selectedVehicleForHistory.id,
                    type: newEventData.type,
                    title: newEventData.type,
                    description: newEventData.description,
                    status: "resolvido",
                    severity: newEventData.severity || "media",
                    cost: newEventData.cost || null,
                    incidentType: typeMapping[newEventData.type] || "manutencao",
                    createdAt: new Date(newEventData.date).toISOString(),
                  });

                  queryClient.invalidateQueries({ queryKey: ["/api/customer-events"] });

                  toast({
                    title: "Evento adicionado!",
                    description: "O evento foi registrado no histórico do veículo.",
                  });

                  setNewEventDialogOpen(false);
                  setNewEventData({
                    type: "",
                    description: "",
                    date: new Date().toISOString().split('T')[0],
                    severity: "media",
                    cost: ""
                  });
                } catch (error: any) {
                  toast({
                    title: "Erro ao adicionar evento",
                    description: error.message || "Ocorreu um erro ao registrar o evento.",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="button-save-event"
            >
              Salvar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Detalhes do Evento */}
      <Dialog open={eventDetailsDialogOpen} onOpenChange={setEventDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o evento selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedEventDetails && (
            <div className="space-y-6">
              {/* Cabeçalho do Evento */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className={`p-3 rounded-lg 
                  ${selectedEventDetails.severity === 'danger' ? 'bg-red-100 dark:bg-red-900/20' :
                    selectedEventDetails.severity === 'warning' ? 'bg-orange-100 dark:bg-orange-900/20' :
                      selectedEventDetails.severity === 'info' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        'bg-primary/10'}`}>
                  {selectedEventDetails.icon && (
                    <selectedEventDetails.icon className={`h-6 w-6 
                      ${selectedEventDetails.severity === 'danger' ? 'text-red-600 dark:text-red-400' :
                        selectedEventDetails.severity === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                          selectedEventDetails.severity === 'info' ? 'text-blue-600 dark:text-blue-400' :
                            'text-primary'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedEventDetails.title}</h3>
                  <p className="text-muted-foreground mt-1">{selectedEventDetails.description}</p>
                  <Badge variant="outline" className="mt-2">
                    {new Date(selectedEventDetails.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Badge>
                </div>
              </div>

              {/* Detalhes para Início de Aluguel */}
              {selectedEventDetails.type === 'rental' && selectedEventDetails.rental && (
                <div className="space-y-4">
                  {/* Informações do Cliente e Aluguel */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações do Aluguel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Cliente</p>
                          <p className="font-medium">{selectedEventDetails.rental.customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CPF</p>
                          <p className="font-medium">{selectedEventDetails.rental.customerCpf}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{selectedEventDetails.rental.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">E-mail</p>
                          <p className="font-medium">{selectedEventDetails.rental.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Período</p>
                          <p className="font-medium">
                            {new Date(selectedEventDetails.rental.startDate).toLocaleDateString('pt-BR')} até {new Date(selectedEventDetails.rental.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Duração</p>
                          <p className="font-medium">
                            {Math.ceil((new Date(selectedEventDetails.rental.endDate).getTime() - new Date(selectedEventDetails.rental.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                          <p className="font-medium text-green-600 dark:text-green-400 text-lg">
                            R$ {Number(selectedEventDetails.rental.totalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={
                            selectedEventDetails.rental.status === 'approved' ? 'default' :
                              selectedEventDetails.rental.status === 'completed' ? 'secondary' :
                                'outline'
                          }>
                            {selectedEventDetails.rental.status === 'approved' ? 'Aprovado' :
                              selectedEventDetails.rental.status === 'completed' ? 'Concluído' :
                                selectedEventDetails.rental.status === 'active' ? 'Ativo' :
                                  selectedEventDetails.rental.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fotos de Check-in */}
                  {selectedEventDetails.rental.checkInImages && selectedEventDetails.rental.checkInImages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Fotos de Check-in</CardTitle>
                        {selectedEventDetails.rental.checkInDate && (
                          <p className="text-sm text-muted-foreground">
                            Realizado em {new Date(selectedEventDetails.rental.checkInDate).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedEventDetails.rental.checkInImages.map((image: string, idx: number) => (
                            <div key={idx} className="relative group">
                              <img
                                src={image}
                                alt={`Check-in ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-md border-2 border-border hover-elevate cursor-pointer"
                                onClick={() => window.open(image, '_blank')}
                              />
                              <Badge className="absolute top-2 left-2 text-xs">
                                Foto {idx + 1}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {selectedEventDetails.rental.checkInNotes && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-md">
                            <p className="text-sm font-medium mb-1">Observações do Check-in:</p>
                            <p className="text-sm">{selectedEventDetails.rental.checkInNotes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Informações de Pagamento */}
                  {selectedEventDetails.rental.paymentMethod && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Informações de Pagamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                          <p className="font-medium">{selectedEventDetails.rental.paymentMethod}</p>
                        </div>
                        {selectedEventDetails.rental.paymentVerifiedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Pagamento Verificado em</p>
                            <p className="font-medium">
                              {new Date(selectedEventDetails.rental.paymentVerifiedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                        {selectedEventDetails.rental.paymentProofUrl && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Comprovante de Pagamento</p>
                            <img
                              src={selectedEventDetails.rental.paymentProofUrl}
                              alt="Comprovante"
                              className="max-w-xs rounded-md border-2 border-border hover-elevate cursor-pointer"
                              onClick={() => setFullscreenPhoto(selectedEventDetails.rental.paymentProofUrl)}
                              data-testid="img-payment-proof"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Contrato */}
                  {selectedEventDetails.rental.contractUrl && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contrato de Locação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => {
                            // Se for uma imagem, abrir no modal fullscreen
                            if (selectedEventDetails.rental.contractUrl.startsWith('data:image')) {
                              setFullscreenPhoto(selectedEventDetails.rental.contractUrl);
                            } else {
                              // Para PDFs e outros arquivos, criar um link temporário para download/visualização
                              const link = document.createElement('a');
                              link.href = selectedEventDetails.rental.contractUrl;
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                          className="w-full"
                          data-testid="button-view-contract"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Visualizar Contrato
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Detalhes para Fim de Aluguel/Checkout */}
              {selectedEventDetails.type === 'rental_end' && selectedEventDetails.rental && (
                <div className="space-y-4">
                  {/* Informações Básicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações da Devolução</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Cliente</p>
                          <p className="font-medium">{selectedEventDetails.rental.customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Data de Finalização</p>
                          <p className="font-medium">
                            {new Date(selectedEventDetails.rental.finalizedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fotos de Checkout */}
                  {selectedEventDetails.rental.checkOutImages && selectedEventDetails.rental.checkOutImages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Fotos de Checkout</CardTitle>
                        {selectedEventDetails.rental.checkOutDate && (
                          <p className="text-sm text-muted-foreground">
                            Realizado em {new Date(selectedEventDetails.rental.checkOutDate).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedEventDetails.rental.checkOutImages.map((image: string, idx: number) => (
                            <div key={idx} className="relative group">
                              <img
                                src={image}
                                alt={`Checkout ${idx + 1}`}
                                className="w-full h-32 object-cover rounded-md border-2 border-border hover-elevate cursor-pointer"
                                onClick={() => window.open(image, '_blank')}
                              />
                              <Badge className="absolute top-2 left-2 text-xs">
                                Foto {idx + 1}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {selectedEventDetails.rental.checkOutNotes && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-md">
                            <p className="text-sm font-medium mb-1">Observações do Checkout:</p>
                            <p className="text-sm">{selectedEventDetails.rental.checkOutNotes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Análise Crítica (Checkpoint) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Análise Crítica da Devolução</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Pneus Iguais ao Check-in?</p>
                          <Badge variant={selectedEventDetails.rental.checkpointTiresSame ? "default" : "destructive"}>
                            {selectedEventDetails.rental.checkpointTiresSame ? "Sim" : "Não"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Combustível Igual ao Check-in?</p>
                          <Badge variant={selectedEventDetails.rental.checkpointFuelSame ? "default" : "destructive"}>
                            {selectedEventDetails.rental.checkpointFuelSame ? "Sim" : "Não"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Possui Avarias?</p>
                          <Badge variant={selectedEventDetails.rental.checkpointHasDamages ? "destructive" : "default"}>
                            {selectedEventDetails.rental.checkpointHasDamages ? "Sim" : "Não"}
                          </Badge>
                        </div>
                        {selectedEventDetails.rental.checkpointRepairCost && Number(selectedEventDetails.rental.checkpointRepairCost) > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">Custo de Reparo</p>
                            <p className="font-medium text-red-600 dark:text-red-400 text-lg">
                              R$ {Number(selectedEventDetails.rental.checkpointRepairCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedEventDetails.rental.checkpointDamagesNotes && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium mb-1 text-red-800 dark:text-red-200">Observações sobre Avarias:</p>
                          <p className="text-sm text-red-700 dark:text-red-300">{selectedEventDetails.rental.checkpointDamagesNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Débitos Pendentes */}
                  {selectedEventDetails.rental.finalizationDebtAmount && Number(selectedEventDetails.rental.finalizationDebtAmount) > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Débitos Pendentes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor do Débito</p>
                          <p className="font-medium text-orange-600 dark:text-orange-400 text-lg">
                            R$ {Number(selectedEventDetails.rental.finalizationDebtAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {selectedEventDetails.rental.finalizationPaymentMethod && (
                          <div>
                            <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                            <p className="font-medium">{selectedEventDetails.rental.finalizationPaymentMethod}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Contrato de Finalização */}
                  {selectedEventDetails.rental.finalizationContractUrl && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contrato de Finalização</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => {
                            // Se for uma imagem, abrir no modal fullscreen
                            if (selectedEventDetails.rental.finalizationContractUrl.startsWith('data:image')) {
                              setFullscreenPhoto(selectedEventDetails.rental.finalizationContractUrl);
                            } else {
                              // Para PDFs e outros arquivos, criar um link temporário para download/visualização
                              const link = document.createElement('a');
                              link.href = selectedEventDetails.rental.finalizationContractUrl;
                              link.target = '_blank';
                              link.rel = 'noopener noreferrer';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }}
                          className="w-full"
                          data-testid="button-view-finalization-contract"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Visualizar Contrato de Finalização
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Detalhes para Avaria Detectada */}
              {selectedEventDetails.type === 'damage' && selectedEventDetails.rental && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detalhes da Avaria</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                        <p className="text-sm font-medium mb-2 text-red-800 dark:text-red-200">Descrição:</p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {selectedEventDetails.rental.checkpointDamagesNotes || 'Avarias identificadas no checkout'}
                        </p>
                      </div>
                      {selectedEventDetails.rental.checkpointRepairCost && Number(selectedEventDetails.rental.checkpointRepairCost) > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground">Custo de Reparo</p>
                          <p className="font-medium text-red-600 dark:text-red-400 text-xl">
                            R$ {Number(selectedEventDetails.rental.checkpointRepairCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="font-medium">{selectedEventDetails.rental.customerName}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Detalhes para Eventos Customizados */}
              {selectedEventDetails.type === 'custom_event' && selectedEventDetails.event && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações do Evento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tipo</p>
                          <Badge variant="outline">{selectedEventDetails.event.type}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Gravidade</p>
                          <Badge variant={
                            selectedEventDetails.event.severity === 'critica' ? 'destructive' :
                              selectedEventDetails.event.severity === 'alta' ? 'destructive' :
                                selectedEventDetails.event.severity === 'media' ? 'default' :
                                  'secondary'
                          }>
                            {selectedEventDetails.event.severity === 'critica' ? 'Crítica' :
                              selectedEventDetails.event.severity === 'alta' ? 'Alta' :
                                selectedEventDetails.event.severity === 'media' ? 'Média' :
                                  'Baixa'}
                          </Badge>
                        </div>
                        {selectedEventDetails.event.cost && Number(selectedEventDetails.event.cost) > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">Custo</p>
                            <p className="font-medium text-orange-600 dark:text-orange-400 text-lg">
                              R$ {Number(selectedEventDetails.event.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant="outline">{selectedEventDetails.event.status || 'Pendente'}</Badge>
                        </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-sm font-medium mb-1">Descrição Completa:</p>
                        <p className="text-sm">{selectedEventDetails.event.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEventDetailsDialogOpen(false);
                setSelectedEventDetails(null);
              }}
              data-testid="button-close-event-details"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar/Editar Evento da Frota */}
      <Dialog open={fleetEventDialogOpen} onOpenChange={setFleetEventDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFleetEvent ? "Editar Evento" : "Registrar Novo Evento"}
            </DialogTitle>
            <DialogDescription>
              Registre incidentes, sinistros, assistências e outros eventos da frota
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Linha 1: Cliente e Veículo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente *</label>
                <Select
                  value={fleetEventFormData.customerId || ""}
                  onValueChange={(value) => setFleetEventFormData({ ...fleetEventFormData, customerId: value })}
                >
                  <SelectTrigger data-testid="select-fleet-event-customer">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Veículo *</label>
                <Input
                  placeholder="Digite a placa ou nome do veículo..."
                  value={vehicleSearchTerm}
                  onChange={(e) => setVehicleSearchTerm(e.target.value)}
                  data-testid="input-vehicle-search"
                  className="mb-2"
                />
                <Select
                  value={fleetEventFormData.vehicleId || ""}
                  onValueChange={(value) => setFleetEventFormData({ ...fleetEventFormData, vehicleId: value })}
                >
                  <SelectTrigger data-testid="select-fleet-event-vehicle">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles
                      ?.filter((vehicle: any) => {
                        if (!vehicleSearchTerm) return true;
                        const searchLower = vehicleSearchTerm.toLowerCase();
                        return (
                          vehicle.name?.toLowerCase().includes(searchLower) ||
                          vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
                          vehicle.brand?.toLowerCase().includes(searchLower) ||
                          vehicle.model?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((vehicle: any) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.licensePlate ? `[${vehicle.licensePlate}] ` : ""}{vehicle.name}
                        </SelectItem>
                      ))}
                    {vehicles?.filter((vehicle: any) => {
                      if (!vehicleSearchTerm) return true;
                      const searchLower = vehicleSearchTerm.toLowerCase();
                      return (
                        vehicle.name?.toLowerCase().includes(searchLower) ||
                        vehicle.licensePlate?.toLowerCase().includes(searchLower) ||
                        vehicle.brand?.toLowerCase().includes(searchLower) ||
                        vehicle.model?.toLowerCase().includes(searchLower)
                      );
                    }).length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Nenhum veículo encontrado
                        </div>
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Tipo de Incidente e Título */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Incidente *</label>
                <Select
                  value={fleetEventFormData.incidentType || ""}
                  onValueChange={(value) => setFleetEventFormData({ ...fleetEventFormData, incidentType: value })}
                >
                  <SelectTrigger data-testid="select-incident-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roubo">Roubo</SelectItem>
                    <SelectItem value="furto">Furto</SelectItem>
                    <SelectItem value="colisao">Colisão</SelectItem>
                    <SelectItem value="incendio">Incêndio</SelectItem>
                    <SelectItem value="oficina">Oficina/Reparo</SelectItem>
                    <SelectItem value="assistencia">Assistência 24h</SelectItem>
                    <SelectItem value="manutencao">Manutenção Preventiva</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Título *</label>
                <Input
                  placeholder="Ex: Colisão frontal na Av. Paulista"
                  value={fleetEventFormData.title || ""}
                  onChange={(e) => setFleetEventFormData({ ...fleetEventFormData, title: e.target.value })}
                  data-testid="input-fleet-event-title"
                />
              </div>
            </div>

            {/* Linha 3: Status e Gravidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status *</label>
                <Select
                  value={fleetEventFormData.status || "aberto"}
                  onValueChange={(value) => setFleetEventFormData({ ...fleetEventFormData, status: value })}
                >
                  <SelectTrigger data-testid="select-fleet-event-status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gravidade *</label>
                <Select
                  value={fleetEventFormData.severity || "media"}
                  onValueChange={(value) => setFleetEventFormData({ ...fleetEventFormData, severity: value })}
                >
                  <SelectTrigger data-testid="select-fleet-event-severity">
                    <SelectValue placeholder="Selecione a gravidade" />
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

            {/* Linha 4: Descrição */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição Detalhada *</label>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md text-sm bg-background text-foreground"
                placeholder="Descreva o incidente em detalhes..."
                value={fleetEventFormData.description || ""}
                onChange={(e) => setFleetEventFormData({ ...fleetEventFormData, description: e.target.value })}
                data-testid="textarea-fleet-event-description"
              />
            </div>

            {/* Linha 5: Valores Financeiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Gasto (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={fleetEventFormData.cost || ""}
                  onChange={(e) => setFleetEventFormData({ ...fleetEventFormData, cost: e.target.value })}
                  data-testid="input-fleet-event-cost"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de Pagamento</label>
                <Select
                  value={fleetEventFormData.paymentMethod || ""}
                  onValueChange={(value) => setFleetEventFormData({ ...fleetEventFormData, paymentMethod: value })}
                >
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder="Selecione a forma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="franquia">Franquia</SelectItem>
                    <SelectItem value="direto_empresa">Pago Direto pela Empresa</SelectItem>
                    <SelectItem value="prejuizo_empresa">Prejuízo da Empresa</SelectItem>
                    <SelectItem value="seguro">Coberto por Seguro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkbox de Acionamento de Seguro */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="insurance-claim"
                checked={fleetEventFormData.insuranceClaim || false}
                onChange={(e) => setFleetEventFormData({ ...fleetEventFormData, insuranceClaim: e.target.checked })}
                data-testid="checkbox-insurance-claim"
                className="h-4 w-4"
              />
              <label htmlFor="insurance-claim" className="text-sm font-medium">
                Teve acionamento de seguro
              </label>
            </div>

            {/* Campos de Seguro (aparecem apenas se insuranceClaim estiver marcado) */}
            {fleetEventFormData.insuranceClaim && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seguradora</label>
                  <Input
                    placeholder="Nome da seguradora"
                    value={fleetEventFormData.insuranceCompany || ""}
                    onChange={(e) => setFleetEventFormData({ ...fleetEventFormData, insuranceCompany: e.target.value })}
                    data-testid="input-insurance-company"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Número do Sinistro</label>
                  <Input
                    placeholder="Nº do sinistro"
                    value={fleetEventFormData.claimNumber || ""}
                    onChange={(e) => setFleetEventFormData({ ...fleetEventFormData, claimNumber: e.target.value })}
                    data-testid="input-claim-number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor da Franquia (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={fleetEventFormData.franchiseValue || ""}
                    onChange={(e) => setFleetEventFormData({ ...fleetEventFormData, franchiseValue: e.target.value })}
                    data-testid="input-franchise-value"
                  />
                </div>
              </div>
            )}

            {/* Status da Oficina (apenas para incidentes de oficina) */}
            {fleetEventFormData.incidentType === "oficina" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Status na Oficina</label>
                <Select
                  value={fleetEventFormData.workshopStatus || ""}
                  onValueChange={(value) => setFleetEventFormData({ ...fleetEventFormData, workshopStatus: value })}
                >
                  <SelectTrigger data-testid="select-workshop-status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="na_oficina">Na Oficina</SelectItem>
                    <SelectItem value="aguardando_pecas">Aguardando Peças</SelectItem>
                    <SelectItem value="em_reparo">Em Reparo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFleetEventDialogOpen(false);
                setEditingFleetEvent(null);
                setVehicleSearchTerm("");
                setFleetEventFormData({
                  customerId: "",
                  vehicleId: "",
                  type: "",
                  title: "",
                  description: "",
                  incidentType: "",
                  status: "aberto",
                  severity: "media",
                  cost: "",
                  paymentMethod: "",
                  insuranceClaim: false,
                  franchiseValue: "",
                  insuranceCompany: "",
                  claimNumber: "",
                  workshopStatus: ""
                });
              }}
              data-testid="button-cancel-fleet-event"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                // Validação
                if (!fleetEventFormData.customerId || !fleetEventFormData.vehicleId ||
                  !fleetEventFormData.incidentType || !fleetEventFormData.title ||
                  !fleetEventFormData.description) {
                  toast({
                    title: "Campos obrigatórios",
                    description: "Preencha todos os campos obrigatórios marcados com *",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  const eventData = {
                    customerId: fleetEventFormData.customerId,
                    vehicleId: fleetEventFormData.vehicleId,
                    type: fleetEventFormData.incidentType, // Usar incidentType como type principal
                    title: fleetEventFormData.title,
                    description: fleetEventFormData.description,
                    status: fleetEventFormData.status || "aberto",
                    severity: fleetEventFormData.severity || "media",
                    cost: fleetEventFormData.cost || null,
                    incidentType: fleetEventFormData.incidentType,
                    paymentMethod: fleetEventFormData.paymentMethod || null,
                    insuranceClaim: fleetEventFormData.insuranceClaim || false,
                    franchiseValue: fleetEventFormData.franchiseValue || null,
                    insuranceCompany: fleetEventFormData.insuranceCompany || null,
                    claimNumber: fleetEventFormData.claimNumber || null,
                    workshopStatus: fleetEventFormData.workshopStatus || null,
                  };

                  if (editingFleetEvent) {
                    await apiRequest("PATCH", `/api/customer-events/${editingFleetEvent.id}`, eventData);
                    toast({
                      title: "Evento atualizado!",
                      description: "O evento foi atualizado com sucesso.",
                    });
                  } else {
                    await apiRequest("POST", "/api/customer-events", eventData);
                    toast({
                      title: "Evento registrado!",
                      description: "O evento foi registrado na frota com sucesso.",
                    });
                  }

                  queryClient.invalidateQueries({ queryKey: ["/api/customer-events"] });

                  setFleetEventDialogOpen(false);
                  setEditingFleetEvent(null);
                  setVehicleSearchTerm("");
                  setFleetEventFormData({
                    customerId: "",
                    vehicleId: "",
                    type: "",
                    title: "",
                    description: "",
                    incidentType: "",
                    status: "aberto",
                    severity: "media",
                    cost: "",
                    paymentMethod: "",
                    insuranceClaim: false,
                    franchiseValue: "",
                    insuranceCompany: "",
                    claimNumber: "",
                    workshopStatus: ""
                  });
                } catch (error: any) {
                  toast({
                    title: "Erro ao salvar evento",
                    description: error.message || "Ocorreu um erro ao salvar o evento.",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="button-save-fleet-event"
            >
              {editingFleetEvent ? "Atualizar Evento" : "Registrar Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Gerenciar Cotas de Investimento */}
      <Dialog open={quotaDialogOpen} onOpenChange={setQuotaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingQuota ? "Editar Cota de Investimento" : "Nova Cota de Investimento"}</DialogTitle>
            <DialogDescription>
              Configure a faixa de valor FIPE e o dividendo mensal para cada categoria de veículo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria do Veículo *</label>
              <Select
                value={quotaFormData.category || ""}
                onValueChange={(value) => setQuotaFormData({ ...quotaFormData, category: value })}
              >
                <SelectTrigger data-testid="select-quota-category">
                  <SelectValue placeholder="Selecione a categoria" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor FIPE Mínimo (R$) *</label>
                <CurrencyInput
                  placeholder="30.000,00"
                  value={quotaFormData.minValue || ""}
                  onChange={(value) => setQuotaFormData({ ...quotaFormData, minValue: value })}
                  data-testid="input-quota-min-value"
                />
                <p className="text-xs text-muted-foreground">Valor mínimo da faixa FIPE</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Valor FIPE Máximo (R$) *</label>
                <CurrencyInput
                  placeholder="50.000,00"
                  value={quotaFormData.maxValue || ""}
                  onChange={(value) => setQuotaFormData({ ...quotaFormData, maxValue: value })}
                  data-testid="input-quota-max-value"
                />
                <p className="text-xs text-muted-foreground">Valor máximo da faixa FIPE</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dividendo Mínimo (R$) *</label>
                <CurrencyInput
                  placeholder="1.500,00"
                  value={quotaFormData.minDividend || ""}
                  onChange={(value) => setQuotaFormData({ ...quotaFormData, minDividend: value })}
                  data-testid="input-quota-min-dividend"
                />
                <p className="text-xs text-muted-foreground">Valor mínimo do dividendo mensal</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dividendo Máximo (R$) *</label>
                <CurrencyInput
                  placeholder="2.500,00"
                  value={quotaFormData.maxDividend || ""}
                  onChange={(value) => setQuotaFormData({ ...quotaFormData, maxDividend: value })}
                  data-testid="input-quota-max-dividend"
                />
                <p className="text-xs text-muted-foreground">Valor máximo do dividendo mensal</p>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Exemplo de uso:</h4>
              <p className="text-sm text-muted-foreground">
                Se um investidor tem um veículo {quotaFormData.category || "desta categoria"} com valor FIPE entre{" "}
                R$ {quotaFormData.minValue ? Number(quotaFormData.minValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"} e{" "}
                R$ {quotaFormData.maxValue ? Number(quotaFormData.maxValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"},{" "}
                ele receberá entre R$ {quotaFormData.minDividend ? Number(quotaFormData.minDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"} e R$ {quotaFormData.maxDividend ? Number(quotaFormData.maxDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"} mensais (valor exato definido pelo admin).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setQuotaDialogOpen(false);
                setEditingQuota(null);
                setQuotaFormData({});
              }}
              data-testid="button-cancel-quota"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveQuota}
              data-testid="button-save-quota"
            >
              {editingQuota ? "Atualizar Cota" : "Criar Cota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Calculadora FIPE de Dividendos */}
      <Dialog open={fipeCalculatorDialogOpen} onOpenChange={setFipeCalculatorDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consultar Dividendo por Veículo</DialogTitle>
            <DialogDescription>
              Use a tabela FIPE para consultar o valor do veículo e calcular automaticamente o dividendo mensal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seleção de Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria do Veículo *</label>
              <Select
                value={selectedFipeCategory}
                onValueChange={setSelectedFipeCategory}
              >
                <SelectTrigger data-testid="select-fipe-category">
                  <SelectValue placeholder="Selecione a categoria" />
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

            {/* Seleção de Marca */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Marca *</label>
              <Select
                value={selectedFipeBrand}
                onValueChange={(value) => {
                  setSelectedFipeBrand(value);
                  fetchFipeModelsForCalculator(value);
                }}
                disabled={loadingFipeData}
              >
                <SelectTrigger data-testid="select-fipe-brand">
                  <SelectValue placeholder={loadingFipeData ? "Carregando..." : "Selecione a marca"} />
                </SelectTrigger>
                <SelectContent>
                  {fipeBrands.map((brand: any) => (
                    <SelectItem key={brand.code} value={brand.code}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Modelo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Modelo *</label>
              <Select
                value={selectedFipeModel}
                onValueChange={(value) => {
                  setSelectedFipeModel(value);
                  fetchFipeYearsForCalculator(selectedFipeBrand, value);
                }}
                disabled={!selectedFipeBrand || loadingFipeData}
              >
                <SelectTrigger data-testid="select-fipe-model">
                  <SelectValue placeholder={loadingFipeData ? "Carregando..." : "Selecione o modelo"} />
                </SelectTrigger>
                <SelectContent>
                  {fipeModels.map((model: any) => (
                    <SelectItem key={model.code} value={model.code}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Ano */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ano *</label>
              <Select
                value={selectedFipeYear}
                onValueChange={setSelectedFipeYear}
                disabled={!selectedFipeModel || loadingFipeData}
              >
                <SelectTrigger data-testid="select-fipe-year">
                  <SelectValue placeholder={loadingFipeData ? "Carregando..." : "Selecione o ano"} />
                </SelectTrigger>
                <SelectContent>
                  {fipeYears.map((year: any) => (
                    <SelectItem key={year.code} value={year.code}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botão Consultar FIPE */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={consultarFipeForDividend}
                disabled={!selectedFipeBrand || !selectedFipeModel || !selectedFipeYear || !selectedFipeCategory || loadingFipeData}
                className="w-full md:w-auto"
                data-testid="button-consult-fipe-dividend"
              >
                {loadingFipeData ? "Consultando..." : "Consultar FIPE"}
              </Button>
            </div>

            {/* Resultado da Consulta */}
            {consultedFipeValue && (
              <div className="mt-6 p-6 bg-primary/5 border-2 border-primary rounded-lg space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Valor FIPE Consultado</p>
                  <p className="text-3xl font-bold text-primary">{consultedFipeValue}</p>
                </div>

                {calculatedDividend && (() => {
                  const [minDiv, maxDiv] = calculatedDividend.split('|');
                  return (
                    <>
                      <div className="border-t pt-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Faixa de Dividendo Mensal</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            R$ {Number(minDiv).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ {Number(maxDiv).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          ✓ A Imobilicar pagará entre <strong>R$ {Number(minDiv).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> e <strong>R$ {Number(maxDiv).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> mensais
                          ao investidor proprietário de um veículo {selectedFipeCategory} com valor FIPE de {consultedFipeValue}.
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                          O valor exato será definido pelo admin durante a aprovação.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Informações sobre as cotas */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Como funciona?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Selecione a categoria e consulte o valor FIPE do veículo</li>
                <li>• O sistema encontra automaticamente a cota correspondente</li>
                <li>• A faixa de dividendo mostrada é o intervalo (mínimo-máximo) que a Imobilicar pode pagar ao investidor</li>
                <li>• O valor exato será definido pelo admin durante a aprovação da solicitação</li>
                <li>• Se não houver cota cadastrada para a faixa de valor, você será notificado</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFipeCalculatorDialogOpen(false);
                setSelectedFipeBrand("");
                setSelectedFipeModel("");
                setSelectedFipeYear("");
                setSelectedFipeCategory("");
                setConsultedFipeValue("");
                setCalculatedDividend("");
                setFipeBrands([]);
                setFipeModels([]);
                setFipeYears([]);
              }}
              data-testid="button-close-fipe-calculator"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Registrar Avaria */}
      <Dialog open={registerDamageDialogOpen} onOpenChange={setRegisterDamageDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Avaria de Aluguel</DialogTitle>
            <DialogDescription>
              Registre avarias detectadas em aluguéis finalizados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o Aluguel *</label>
              <Select
                value={damageFormData.rentalId || ""}
                onValueChange={(value) => {
                  setDamageFormData({ ...damageFormData, rentalId: value });
                }}
              >
                <SelectTrigger data-testid="select-rental-for-damage">
                  <SelectValue placeholder="Selecione um aluguel" />
                </SelectTrigger>
                <SelectContent>
                  {rentals?.filter((r: any) => r.status === 'approved' || r.status === 'finalized').map((rental: any) => {
                    const vehicle = vehicles?.find((v: any) => v.id === rental.vehicleId);
                    return (
                      <SelectItem key={rental.id} value={rental.id}>
                        {rental.customerName} - {vehicle?.name || 'Veículo'} - {new Date(rental.startDate).toLocaleDateString('pt-BR')}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Custo de Reparo (R$) *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={damageFormData.repairCost || ""}
                onChange={(e) => setDamageFormData({ ...damageFormData, repairCost: e.target.value })}
                data-testid="input-repair-cost"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição das Avarias *</label>
              <textarea
                className="w-full min-h-[120px] p-3 border rounded-md text-sm bg-background text-foreground"
                placeholder="Descreva detalhadamente as avarias detectadas..."
                value={damageFormData.damagesNotes || ""}
                onChange={(e) => setDamageFormData({ ...damageFormData, damagesNotes: e.target.value })}
                data-testid="textarea-damages-notes"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fotos das Avarias</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {damageFormData.photos?.map((photo: string, idx: number) => (
                  <div key={idx} className="relative group">
                    <img
                      src={photo}
                      alt={`Avaria ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-md border-2 border-border"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newPhotos = [...damageFormData.photos];
                        newPhotos.splice(idx, 1);
                        setDamageFormData({ ...damageFormData, photos: newPhotos });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center h-24 rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer bg-muted/50 transition-colors">
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Adicionar</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      for (const file of files) {
                        try {
                          const base64 = await processFileUpload(file);
                          setDamageFormData((prev: any) => ({
                            ...prev,
                            photos: [...(prev.photos || []), base64]
                          }));
                        } catch (error) {
                          console.error('Erro ao processar imagem:', error);
                        }
                      }
                    }}
                    data-testid="input-damage-photos"
                  />
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRegisterDamageDialogOpen(false);
                setDamageFormData({
                  rentalId: "",
                  repairCost: "",
                  damagesNotes: "",
                  photos: []
                });
              }}
              data-testid="button-cancel-damage"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!damageFormData.rentalId || !damageFormData.repairCost || !damageFormData.damagesNotes) {
                  toast({
                    title: "Campos obrigatórios",
                    description: "Preencha todos os campos obrigatórios.",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  const rental = rentals?.find((r: any) => r.id === damageFormData.rentalId);
                  if (!rental) {
                    throw new Error("Aluguel não encontrado");
                  }

                  // Acumular descrições de avarias (adicionar à existente ao invés de substituir)
                  const existingNotes = rental.checkpointDamagesNotes || "";
                  const separator = existingNotes ? "\n\n--- Nova Avaria Registrada ---\n" : "";
                  const updatedNotes = existingNotes + separator + damageFormData.damagesNotes;

                  // Acumular custo de reparos (adicionar ao existente)
                  const existingCost = Number(rental.checkpointRepairCost || 0);
                  const newCost = Number(damageFormData.repairCost || 0);
                  const totalCost = existingCost + newCost;

                  // Acumular fotos (concatenar com as existentes)
                  const existingPhotos = rental.checkOutImages || [];
                  const newPhotos = damageFormData.photos || [];
                  const allPhotos = [...existingPhotos, ...newPhotos];

                  // Atualizar o aluguel com as informações da avaria
                  await apiRequest("PATCH", `/api/rentals/${damageFormData.rentalId}`, {
                    checkpointHasDamages: true,
                    checkpointDamagesNotes: updatedNotes,
                    checkpointRepairCost: totalCost.toString(),
                    checkOutImages: allPhotos,
                    repairPaid: false
                  });

                  // Criar um evento no histórico do veículo
                  const vehicle = vehicles?.find((v: any) => v.id === rental.vehicleId);
                  await apiRequest("POST", "/api/customer-events", {
                    customerId: rental.customerId || null,
                    vehicleId: rental.vehicleId,
                    type: "Avaria de Aluguel",
                    title: `Avaria detectada - Aluguel #${rental.id.slice(0, 8)}`,
                    description: `Cliente: ${rental.customerName}\nCusto de reparo: R$ ${Number(damageFormData.repairCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\nDetalhes:\n${damageFormData.damagesNotes}`,
                    status: "resolvido",
                    severity: Number(damageFormData.repairCost) > 1000 ? "alta" : "media",
                    cost: damageFormData.repairCost,
                    incidentType: "oficina",
                  });

                  queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/customer-events"] });

                  toast({
                    title: "Avaria registrada!",
                    description: "A avaria foi registrada no aluguel e no histórico do veículo.",
                  });

                  setRegisterDamageDialogOpen(false);
                  setDamageFormData({
                    rentalId: "",
                    repairCost: "",
                    damagesNotes: "",
                    photos: []
                  });
                } catch (error: any) {
                  toast({
                    title: "Erro ao registrar avaria",
                    description: error.message || "Ocorreu um erro ao registrar a avaria.",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="button-save-damage"
            >
              Salvar Avaria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualização de foto em fullscreen */}
      <Dialog open={!!fullscreenPhoto} onOpenChange={() => setFullscreenPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Visualização da Foto</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {fullscreenPhoto && (
              <img
                src={fullscreenPhoto}
                alt="Foto ampliada"
                className="max-w-full max-h-[70vh] object-contain rounded"
                data-testid="img-fullscreen-photo"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFullscreenPhoto(null)}
              data-testid="button-close-fullscreen"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Diálogo de Aprovação de Solicitação de Investimento */}
      <Dialog open={approveRequestDialogOpen} onOpenChange={setApproveRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Solicitação de Veículo</DialogTitle>
            <DialogDescription>
              Configure os valores para adicionar o veículo à frota
            </DialogDescription>
          </DialogHeader>
          {selectedVehicleRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-semibold">{selectedVehicleRequest.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Investidor: {selectedVehicleRequest.investor?.name}
                </p>
                {selectedVehicleRequest.fipeValue && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Valor FIPE:</span> {selectedVehicleRequest.fipeValue}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Valor da Diária (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="150.00"
                  value={approvalData.pricePerDay}
                  onChange={(e) => setApprovalData({ ...approvalData, pricePerDay: e.target.value })}
                  data-testid="input-price-per-day"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Valor Mensal (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="3000.00"
                  value={approvalData.monthlyPrice}
                  onChange={(e) => setApprovalData({ ...approvalData, monthlyPrice: e.target.value })}
                  data-testid="input-monthly-price"
                />
                <p className="text-xs text-muted-foreground mt-1">Opcional - valor para contratos mensais</p>
              </div>
              <div>
                <label className="text-sm font-medium">Dividendo Mensal do Investidor (R$)</label>
                {(() => {
                  const matchingQuota = investmentQuotas?.find((q: any) => q.category === selectedVehicleRequest?.category);
                  if (matchingQuota && matchingQuota.minDividend && matchingQuota.maxDividend) {
                    return (
                      <div className="space-y-2">
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-sm font-medium text-primary mb-1">
                            Faixa apresentada ao investidor:
                          </p>
                          <p className="text-lg font-bold">
                            R$ {Number(matchingQuota.minDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            {' - '}
                            R$ {Number(matchingQuota.maxDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Categoria: {matchingQuota.category}
                          </p>
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          min={matchingQuota.minDividend}
                          max={matchingQuota.maxDividend}
                          placeholder={`Entre ${Number(matchingQuota.minDividend).toFixed(2)} e ${Number(matchingQuota.maxDividend).toFixed(2)}`}
                          value={approvalData.customDividend}
                          onChange={(e) => setApprovalData({ ...approvalData, customDividend: e.target.value })}
                          data-testid="input-investor-dividend"
                        />
                        <p className="text-xs text-muted-foreground">
                          Escolha um valor dentro da faixa apresentada ao investidor
                        </p>
                      </div>
                    );
                  }
                  return (
                    <>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1500.00"
                        value={approvalData.customDividend}
                        onChange={(e) => setApprovalData({ ...approvalData, customDividend: e.target.value })}
                        data-testid="input-investor-dividend"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Valor fixo em reais que o investidor receberá mensalmente
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveRequestDialogOpen(false)}
              data-testid="button-cancel-approval"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Validação rigorosa antes de enviar
                const pricePerDay = approvalData.pricePerDay.trim();
                const priceValue = parseFloat(pricePerDay);

                if (!pricePerDay || isNaN(priceValue) || priceValue <= 0) {
                  toast({
                    title: "Valor obrigatório",
                    description: "Informe um valor de diária válido e maior que zero.",
                    variant: "destructive",
                  });
                  return;
                }

                // Validar monthlyPrice se fornecido
                const monthlyPrice = approvalData.monthlyPrice.trim();
                const monthlyValue = monthlyPrice ? parseFloat(monthlyPrice) : null;
                if (monthlyPrice && (isNaN(monthlyValue!) || monthlyValue! <= 0)) {
                  toast({
                    title: "Valor inválido",
                    description: "O valor mensal deve ser um número válido maior que zero.",
                    variant: "destructive",
                  });
                  return;
                }

                // Validar customDividend (opcional)
                const dividend = approvalData.customDividend.trim();
                const dividendValue = dividend ? parseFloat(dividend) : null;
                if (dividend && (isNaN(dividendValue!) || dividendValue! <= 0)) {
                  toast({
                    title: "Valor inválido",
                    description: "O dividendo mensal deve ser um número válido maior que zero.",
                    variant: "destructive",
                  });
                  return;
                }

                approveVehicleRequestMutation.mutate({
                  id: selectedVehicleRequest!.id,
                  pricePerDay: priceValue.toFixed(2),
                  monthlyPrice: monthlyValue ? monthlyValue.toFixed(2) : undefined,
                  customDividend: dividendValue ? dividendValue.toFixed(2) : undefined,
                });
              }}
              disabled={approveVehicleRequestMutation.isPending || !approvalData.pricePerDay.trim()}
              data-testid="button-confirm-approval"
            >
              {approveVehicleRequestMutation.isPending ? "Aprovando..." : "Aprovar e Adicionar à Frota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Visualização de Fotos de Vistoria */}
      <Dialog open={viewPhotosDialogOpen} onOpenChange={setViewPhotosDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fotos de Vistoria de Avaliação</DialogTitle>
            <DialogDescription>
              Fotos enviadas pelo investidor para avaliação do veículo
            </DialogDescription>
          </DialogHeader>
          {selectedVehicleRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-1">{selectedVehicleRequest.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Placa: {selectedVehicleRequest.licensePlate || "Não informada"}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedVehicleRequest.evaluationFrontImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Frontal (com placa)</p>
                    <img
                      src={selectedVehicleRequest.evaluationFrontImage}
                      alt="Frontal"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationFrontImage)}
                      data-testid="img-evaluation-front"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationBackImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Traseira (com placa)</p>
                    <img
                      src={selectedVehicleRequest.evaluationBackImage}
                      alt="Traseira"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationBackImage)}
                      data-testid="img-evaluation-back"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationRightSideImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Lateral Direita</p>
                    <img
                      src={selectedVehicleRequest.evaluationRightSideImage}
                      alt="Lateral Direita"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationRightSideImage)}
                      data-testid="img-evaluation-right"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationLeftSideImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Lateral Esquerda</p>
                    <img
                      src={selectedVehicleRequest.evaluationLeftSideImage}
                      alt="Lateral Esquerda"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationLeftSideImage)}
                      data-testid="img-evaluation-left"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationMotorImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Motor</p>
                    <img
                      src={selectedVehicleRequest.evaluationMotorImage}
                      alt="Motor"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationMotorImage)}
                      data-testid="img-evaluation-motor"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationStepImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step, Macaco e Triângulo</p>
                    <img
                      src={selectedVehicleRequest.evaluationStepImage}
                      alt="Step, Macaco e Triângulo"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationStepImage)}
                      data-testid="img-evaluation-step"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationTire1Image && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pneu 1 (Dianteiro Esquerdo)</p>
                    <img
                      src={selectedVehicleRequest.evaluationTire1Image}
                      alt="Pneu 1"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationTire1Image)}
                      data-testid="img-evaluation-tire1"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationTire2Image && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pneu 2 (Dianteiro Direito)</p>
                    <img
                      src={selectedVehicleRequest.evaluationTire2Image}
                      alt="Pneu 2"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationTire2Image)}
                      data-testid="img-evaluation-tire2"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationTire3Image && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pneu 3 (Traseiro Esquerdo)</p>
                    <img
                      src={selectedVehicleRequest.evaluationTire3Image}
                      alt="Pneu 3"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationTire3Image)}
                      data-testid="img-evaluation-tire3"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationTire4Image && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Pneu 4 (Traseiro Direito)</p>
                    <img
                      src={selectedVehicleRequest.evaluationTire4Image}
                      alt="Pneu 4"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationTire4Image)}
                      data-testid="img-evaluation-tire4"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationChassiImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Chassi</p>
                    <img
                      src={selectedVehicleRequest.evaluationChassiImage}
                      alt="Chassi"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationChassiImage)}
                      data-testid="img-evaluation-chassi"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationOdometroImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Odômetro</p>
                    <img
                      src={selectedVehicleRequest.evaluationOdometroImage}
                      alt="Odômetro"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationOdometroImage)}
                      data-testid="img-evaluation-odometro"
                    />
                  </div>
                )}
                {selectedVehicleRequest.evaluationNivelGasolinaImage && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Nível de Gasolina</p>
                    <img
                      src={selectedVehicleRequest.evaluationNivelGasolinaImage}
                      alt="Nível de Gasolina"
                      className="w-full h-48 object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                      onClick={() => setFullscreenPhoto(selectedVehicleRequest.evaluationNivelGasolinaImage)}
                      data-testid="img-evaluation-fuel"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewPhotosDialogOpen(false)}
              data-testid="button-close-photos"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização em Tela Cheia */}
      <Dialog open={!!fullscreenPhoto} onOpenChange={() => setFullscreenPhoto(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          <div className="relative w-full h-[95vh] flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setFullscreenPhoto(null)}
              data-testid="button-close-fullscreen"
            >
              <X className="h-6 w-6" />
            </Button>
            {fullscreenPhoto && (
              <img
                src={fullscreenPhoto}
                alt="Visualização em tela cheia"
                className="max-w-full max-h-full object-contain"
                data-testid="img-fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog da Calculadora de Financiamento */}
      <Dialog open={calculatorDialogOpen} onOpenChange={setCalculatorDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calculadora de Financiamento</DialogTitle>
            <DialogDescription>
              Simule financiamentos com diferentes condições de pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Modo de Entrada */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Como deseja informar o valor?</label>
              <Select value={calcValueMode} onValueChange={(v: any) => setCalcValueMode(v)}>
                <SelectTrigger data-testid="select-calc-value-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Informar valor manualmente</SelectItem>
                  <SelectItem value="fipe">Consultar Tabela FIPE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consulta FIPE */}
            {calcValueMode === "fipe" && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-semibold">Consultar Tabela FIPE</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Marca</label>
                    <Select
                      value={calcSelectedBrand}
                      onValueChange={(value) => {
                        setCalcSelectedBrand(value);
                        setCalcSelectedModel("");
                        setCalcSelectedYear("");
                      }}
                    >
                      <SelectTrigger data-testid="select-calc-fipe-brand">
                        <SelectValue placeholder={calcFipeBrands.length === 0 ? "Carregando..." : "Selecione a marca"} />
                      </SelectTrigger>
                      <SelectContent>
                        {calcFipeBrands.map((brand) => (
                          <SelectItem key={brand.code} value={brand.code}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Modelo</label>
                    <Select
                      value={calcSelectedModel}
                      onValueChange={(value) => {
                        setCalcSelectedModel(value);
                        setCalcSelectedYear("");
                      }}
                      disabled={!calcSelectedBrand}
                    >
                      <SelectTrigger data-testid="select-calc-fipe-model">
                        <SelectValue placeholder={!calcSelectedBrand ? "Selecione a marca primeiro" : "Selecione o modelo"} />
                      </SelectTrigger>
                      <SelectContent>
                        {calcFipeModels.map((model) => (
                          <SelectItem key={model.code} value={model.code}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ano</label>
                    <Select
                      value={calcSelectedYear}
                      onValueChange={setCalcSelectedYear}
                      disabled={!calcSelectedModel}
                    >
                      <SelectTrigger data-testid="select-calc-fipe-year">
                        <SelectValue placeholder={!calcSelectedModel ? "Selecione o modelo primeiro" : "Selecione o ano"} />
                      </SelectTrigger>
                      <SelectContent>
                        {calcFipeYears.map((year) => (
                          <SelectItem key={year.code} value={year.code}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={calcConsultarFipe}
                  disabled={calcLoadingFipe || !calcSelectedBrand || !calcSelectedModel || !calcSelectedYear}
                  className="w-full"
                  data-testid="button-consult-calc-fipe"
                >
                  {calcLoadingFipe ? "Consultando..." : "Consultar Valor FIPE"}
                </Button>
              </div>
            )}

            {/* Entrada de Dados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor do Veículo</label>
                <Input
                  type="number"
                  step="1000"
                  value={calcVehicleValue}
                  onChange={(e) => setCalcVehicleValue(Number(e.target.value))}
                  disabled={calcValueMode === "fipe"}
                  data-testid="input-calc-vehicle-value"
                />
                {calcValueMode === "fipe" && (
                  <p className="text-xs text-muted-foreground">
                    Valor será preenchido automaticamente após consultar a FIPE
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Valor da Entrada (R$)</label>
                <Input
                  type="number"
                  step="1000"
                  value={calcEntryValue}
                  onChange={(e) => setCalcEntryValue(Number(e.target.value))}
                  data-testid="input-calc-entry-value"
                />
                <p className="text-xs text-muted-foreground">
                  Valor que será dado como entrada ({calcVehicleValue > 0 ? ((calcEntryValue / calcVehicleValue) * 100).toFixed(1) : 0}% do veículo)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de Pagamento da Entrada</label>
                <Select value={calcDownPaymentType} onValueChange={(v: any) => setCalcDownPaymentType(v)}>
                  <SelectTrigger data-testid="select-calc-down-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">100% à vista</SelectItem>
                    <SelectItem value="split">70% à vista + 30% parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {calcDownPaymentType === "split" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parcelas da Entrada (30%)</label>
                  <Select value={calcDownPaymentInstallments.toString()} onValueChange={(v) => setCalcDownPaymentInstallments(Number(v))}>
                    <SelectTrigger data-testid="select-calc-down-payment-installments">
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
                <label className="text-sm font-medium">Taxa de Juros (% a.m.)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={calcInterestRate}
                  onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                  data-testid="input-calc-interest-rate"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Número de Parcelas</label>
                <Select value={calcInstallments.toString()} onValueChange={(v) => setCalcInstallments(Number(v))}>
                  <SelectTrigger data-testid="select-calc-installments">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[12, 24, 36, 48, 60].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resultados */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Resultados do Cálculo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  // Usar valor da entrada definido manualmente
                  const entryTotal = calcEntryValue;
                  const entryPercent = calcVehicleValue > 0 ? (entryTotal / calcVehicleValue) * 100 : 0;

                  // Se split: 70% à vista, 30% parcelado da ENTRADA (não do veículo)
                  const entryCash = calcDownPaymentType === "split" ? entryTotal * 0.7 : entryTotal;
                  const entryInstallmentTotal = calcDownPaymentType === "split" ? entryTotal * 0.3 : 0;
                  const entryInstallmentValue = calcDownPaymentType === "split"
                    ? entryInstallmentTotal / calcDownPaymentInstallments
                    : 0;

                  // Valor a financiar = valor do veículo - entrada total
                  const financeAmount = calcVehicleValue - entryTotal;

                  // Cálculo da parcela usando Price (Sistema Francês)
                  const monthlyRate = calcInterestRate / 100;
                  const monthlyPayment = financeAmount > 0
                    ? (financeAmount * monthlyRate * Math.pow(1 + monthlyRate, calcInstallments)) /
                    (Math.pow(1 + monthlyRate, calcInstallments) - 1)
                    : 0;

                  return (
                    <>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Entrada à Vista ({calcDownPaymentType === "split" ? "70%" : "100%"})</p>
                        <p className="text-2xl font-bold">
                          R$ {entryCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {calcDownPaymentType === "split" && (
                        <>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Entrada Parcelada (30%)</p>
                            <p className="text-2xl font-bold">
                              {calcDownPaymentInstallments}x de R$ {entryInstallmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </>
                      )}

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Entrada Total ({entryPercent.toFixed(1)}%)</p>
                        <p className="text-2xl font-bold">
                          R$ {entryTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="p-4 bg-blue-500/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Valor a Financiar ({(100 - entryPercent).toFixed(1)}%)</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          R$ {financeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="p-4 bg-primary/10 rounded-lg md:col-span-2">
                        <p className="text-sm text-muted-foreground">Parcela Mensal do Financiamento</p>
                        <p className="text-3xl font-bold text-primary">
                          {calcInstallments}x de R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg md:col-span-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-muted-foreground">Valor Total (Entrada + Financiamento)</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowTotalValue(!showTotalValue)}
                            data-testid="button-toggle-total-value"
                          >
                            {showTotalValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {showTotalValue ? (
                          <>
                            <p className="text-xl font-bold">
                              R$ {(entryTotal + (monthlyPayment * calcInstallments)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Juros totais: R$ {((monthlyPayment * calcInstallments) - financeAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </>
                        ) : (
                          <p className="text-xl font-bold text-muted-foreground">R$ ••••••</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCalculatorDialogOpen(false)}
              data-testid="button-close-calculator"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhamento do Financiamento */}
      <Dialog open={financingDetailsDialogOpen} onOpenChange={setFinancingDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Detalhes do Financiamento</DialogTitle>
                <DialogDescription>
                  Visualização completa do financiamento, documentos e histórico
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedFinancing && (() => {
            // Debug: verificar se os documentos estão presentes no objeto
            console.log('[FINANCING DETAILS] Documentos no selectedFinancing:', {
              cnhDocumentUrl: selectedFinancing.cnhDocumentUrl,
              proofOfResidenceUrl: selectedFinancing.proofOfResidenceUrl,
              guaranteesUrls: selectedFinancing.guaranteesUrls,
              otherDocumentsUrls: selectedFinancing.otherDocumentsUrls,
              cashProofUrl: selectedFinancing.cashProofUrl,
            });

            const vehicle = vehicles?.find((v: any) => v.id === selectedFinancing.vehicleId);
            const tradeIn = tradeInVehicles?.find((t: any) => t.financingId === selectedFinancing.id);

            let checkInData = null;
            try {
              checkInData = selectedFinancing.checkInPhotos ?
                (typeof selectedFinancing.checkInPhotos === 'string' ?
                  JSON.parse(selectedFinancing.checkInPhotos) :
                  selectedFinancing.checkInPhotos) :
                null;
            } catch (error) {
              console.error('Erro ao analisar fotos de check-in:', error);
              checkInData = null;
            }

            let checkOutData = null;
            let checkOutChecklistData = null;
            try {
              checkOutData = selectedFinancing.checkOutPhotos ?
                (typeof selectedFinancing.checkOutPhotos === 'string' ?
                  JSON.parse(selectedFinancing.checkOutPhotos) :
                  selectedFinancing.checkOutPhotos) :
                null;
              checkOutChecklistData = selectedFinancing.checkOutChecklist ?
                (typeof selectedFinancing.checkOutChecklist === 'string' ?
                  JSON.parse(selectedFinancing.checkOutChecklist) :
                  selectedFinancing.checkOutChecklist) :
                null;
            } catch (error) {
              console.error('Erro ao analisar dados de checkout:', error);
              checkOutData = null;
              checkOutChecklistData = null;
            }

            return (
              <div className="space-y-6">
                {/* Dados do Cliente */}
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Dados do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">Nome Completo</span>
                        <span className="font-medium">{selectedFinancing.customerName}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">CPF</span>
                        <span className="font-medium">{selectedFinancing.customerCpf}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">Email</span>
                        <span className="font-medium">{selectedFinancing.customerEmail}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">Telefone</span>
                        <span className="font-medium">{selectedFinancing.customerPhone}</span>
                      </div>
                      {selectedFinancing.customerRg && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">RG</span>
                          <span className="font-medium">{selectedFinancing.customerRg}</span>
                        </div>
                      )}
                      {selectedFinancing.customerDriverLicense && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">CNH</span>
                          <span className="font-medium">{selectedFinancing.customerDriverLicense}</span>
                        </div>
                      )}
                      {selectedFinancing.customerFirstContactDate && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">Data da Venda</span>
                          <span className="font-medium">
                            {new Date(selectedFinancing.customerFirstContactDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {selectedFinancing.customerClosingDate && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">Data de Retirada</span>
                          <span className="font-medium">
                            {new Date(selectedFinancing.customerClosingDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                    {(selectedFinancing.customerStreet || selectedFinancing.customerCity) && (
                      <div className="pt-3 border-t">
                        <span className="text-xs text-muted-foreground mb-1 block">Endereço Completo</span>
                        <span className="font-medium">
                          {[
                            selectedFinancing.customerStreet,
                            selectedFinancing.customerNeighborhood,
                            selectedFinancing.customerCity && selectedFinancing.customerState ?
                              `${selectedFinancing.customerCity}/${selectedFinancing.customerState}` : null,
                            selectedFinancing.customerZipCode ? `CEP: ${selectedFinancing.customerZipCode}` : null
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dados do Veículo */}
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      Veículo Financiado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
                      {vehicle?.imageUrl && (
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2">
                          <img
                            src={vehicle.imageUrl}
                            alt={vehicle.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold mb-2">{vehicle?.name || "Veículo não encontrado"}</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Placa</Badge>
                              <span className="font-medium">{vehicle?.licensePlate || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Categoria</Badge>
                              <span className="font-medium">{vehicle?.category || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Ano</Badge>
                              <span className="font-medium">{vehicle?.year || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Veículo de Troca */}
                {tradeIn && (
                  <Card className="border-blue-500/50 bg-blue-50/30 dark:bg-blue-950/20">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Car className="h-5 w-5 text-blue-600" />
                        Veículo de Troca
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                        {tradeIn.photosUrls && tradeIn.photosUrls.length > 0 && (
                          <div className="aspect-video md:aspect-square rounded-lg overflow-hidden bg-muted">
                            <img
                              src={tradeIn.photosUrls[0]}
                              alt={`${tradeIn.brand} ${tradeIn.model}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Veículo:</span> {tradeIn.brand} {tradeIn.model}
                            </div>
                            <div>
                              <span className="font-medium">Ano:</span> {tradeIn.year || "-"}
                            </div>
                            {tradeIn.plate && (
                              <div>
                                <span className="font-medium">Placa:</span> {tradeIn.plate}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Categoria:</span> {tradeIn.category || "-"}
                            </div>
                            {tradeIn.mileage && (
                              <div>
                                <span className="font-medium">Quilometragem:</span> {Number(tradeIn.mileage).toLocaleString('pt-BR')} km
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
                              <p className="text-xs text-muted-foreground">Valor FIPE</p>
                              <p className="text-base font-bold text-blue-700 dark:text-blue-400">
                                R$ {Number(tradeIn.fipeValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="p-3 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
                              <p className="text-xs text-muted-foreground">Valor Aceito</p>
                              <p className="text-base font-bold text-green-700 dark:text-green-400">
                                R$ {Number(tradeIn.acceptedValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>

                          {tradeIn.cautelarUrl && (
                            <div className="border-t pt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => downloadDocument(tradeIn.cautelarUrl!, 'Cautelar_Veiculo_Troca.pdf')}
                                data-testid="button-download-trade-in-cautelar"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar Cautelar do Veículo de Troca
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Valores do Financiamento */}
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Valores do Financiamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Valor do Veículo */}
                      <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Car className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Valor do Veículo</p>
                        </div>
                        <p className="text-xl font-bold">
                          R$ {Number(selectedFinancing.vehicleValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Entrada Total */}
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Entrada Total</p>
                        </div>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                          R$ {Number(selectedFinancing.downPaymentTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 space-y-1">
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            À vista: R$ {Number(selectedFinancing.downPaymentCash).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {selectedFinancing.downPaymentType === "split" && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              Parcelado: {selectedFinancing.downPaymentInstallments}x de R$ {Number(selectedFinancing.downPaymentInstallmentValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Parcela Mensal */}
                      <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg border-2 border-primary/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-xs font-medium text-primary">Parcela Mensal</p>
                        </div>
                        <p className="text-xl font-bold text-primary">
                          {selectedFinancing.installments}x
                        </p>
                        <p className="text-lg font-bold text-primary">
                          R$ {Number(selectedFinancing.monthlyInstallment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Taxa: {Number(selectedFinancing.interestRate).toFixed(2)}% a.m.
                        </p>
                      </div>

                      {/* Valor Financiado */}
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-2 border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-xs font-medium text-green-600 dark:text-green-400">Valor Financiado</p>
                        </div>
                        <p className="text-xl font-bold text-green-700 dark:text-green-300">
                          R$ {Number(selectedFinancing.principalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          Vencimento: Dia {selectedFinancing.dueDay}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documentos */}
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Documentos do Cliente
                      </CardTitle>
                      {selectedFinancing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary/10 font-black shadow-sm h-9 px-4"
                          onClick={() => {
                            const docsToDownload: { url: string; name: string }[] = [];

                            // Documentos Básicos
                            if (selectedFinancing.cnhDocumentUrl) docsToDownload.push({ url: selectedFinancing.cnhDocumentUrl, name: selectedFinancing.cnhDocumentFileName || 'CNH' });
                            if (selectedFinancing.proofOfResidenceUrl) docsToDownload.push({ url: selectedFinancing.proofOfResidenceUrl, name: selectedFinancing.proofOfResidenceFileName || 'Comprovante_Residencia' });
                            if (selectedFinancing.cashProofUrl) docsToDownload.push({ url: selectedFinancing.cashProofUrl, name: selectedFinancing.cashProofFileName || 'Comprovante_Pagamento' });

                            // Documentos do Avalista
                            if (selectedFinancing.guarantorDocumentUrl) docsToDownload.push({ url: selectedFinancing.guarantorDocumentUrl, name: selectedFinancing.guarantorDocumentFileName || 'Documento_Avalista' });
                            if (selectedFinancing.guarantorResidenceUrl) docsToDownload.push({ url: selectedFinancing.guarantorResidenceUrl, name: selectedFinancing.guarantorResidenceFileName || 'Comprovante_Residencia_Avalista' });

                            // Contratos Gerados (JSON)
                            if (selectedFinancing.generatedContracts) {
                              try {
                                const contracts = typeof selectedFinancing.generatedContracts === 'string'
                                  ? JSON.parse(selectedFinancing.generatedContracts)
                                  : selectedFinancing.generatedContracts;

                                if (Array.isArray(contracts)) {
                                  contracts.forEach((c: any, i: number) => {
                                    if (c.url) docsToDownload.push({ url: c.url, name: c.fileName || `Contrato_${i + 1}` });
                                  });
                                }
                              } catch (e) {
                                console.error("Erro ao processar contratos:", e);
                              }
                            }

                            // Contrato Legado
                            if (selectedFinancing.contractUrl) docsToDownload.push({ url: selectedFinancing.contractUrl, name: selectedFinancing.contractFileName || 'Contrato' });

                            // Garantias (Array)
                            if (selectedFinancing.guaranteesUrls && Array.isArray(selectedFinancing.guaranteesUrls)) {
                              selectedFinancing.guaranteesUrls.forEach((url: string, i: number) => {
                                if (url) docsToDownload.push({ url, name: (selectedFinancing.guaranteesFileNames && selectedFinancing.guaranteesFileNames[i]) || `Garantia_${i + 1}` });
                              });
                            }

                            // Outros Documentos (Array)
                            if (selectedFinancing.otherDocumentsUrls && Array.isArray(selectedFinancing.otherDocumentsUrls)) {
                              selectedFinancing.otherDocumentsUrls.forEach((url: string, i: number) => {
                                if (url) docsToDownload.push({ url, name: (selectedFinancing.otherDocumentsFileNames && selectedFinancing.otherDocumentsFileNames[i]) || `Documento_Adicional_${i + 1}` });
                              });
                            }

                            if (docsToDownload.length === 0) {
                              toast({
                                title: "Nenhum documento",
                                description: "Não existem documentos anexados para baixar.",
                                variant: "destructive"
                              });
                              return;
                            }

                            toast({
                              title: "Baixando documentos",
                              description: `Iniciando o download de ${docsToDownload.length} arquivos separadamente.`,
                            });

                            // Delay de 500ms entre downloads para evitar bloqueio do navegador
                            docsToDownload.forEach((doc, index) => {
                              setTimeout(() => {
                                downloadDocument(doc.url, doc.name);
                              }, index * 500);
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar todos os documentos
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CNH */}
                    {selectedFinancing.cnhDocumentUrl ? (
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/30 hover-elevate">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-primary/20 rounded-lg">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{selectedFinancing.cnhDocumentFileName || 'CNH (Documento)'}</p>
                            <p className="text-xs text-muted-foreground">Habilitação digitalizada</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => downloadDocument(selectedFinancing.cnhDocumentUrl!, selectedFinancing.cnhDocumentFileName || 'CNH')}
                          data-testid="button-download-cnh"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar CNH
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed rounded-lg text-center">
                        <CreditCard className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">CNH</p>
                        <p className="text-xs text-muted-foreground">Não anexado</p>
                      </div>
                    )}

                    {/* Comprovante de Residência */}
                    {selectedFinancing.proofOfResidenceUrl ? (
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-primary/30 hover-elevate">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-primary/20 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{selectedFinancing.proofOfResidenceFileName || 'Comprovante de Residência'}</p>
                            <p className="text-xs text-muted-foreground">Documento de endereço</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => downloadDocument(selectedFinancing.proofOfResidenceUrl!, selectedFinancing.proofOfResidenceFileName || 'Comprovante_Residencia')}
                          data-testid="button-download-residence"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Comprovante
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed rounded-lg text-center">
                        <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Comprovante de Residência</p>
                        <p className="text-xs text-muted-foreground">Não anexado</p>
                      </div>
                    )}

                    {/* Garantias */}
                    {selectedFinancing.guaranteesUrls && selectedFinancing.guaranteesUrls.length > 0 && selectedFinancing.guaranteesUrls.map((url: string, index: number) => (
                      <div key={index} className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg border-2 border-orange-200 dark:border-orange-800 hover-elevate">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-orange-200 dark:bg-orange-800 rounded-lg">
                            <FileText className="h-5 w-5 text-orange-700 dark:text-orange-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">{selectedFinancing.guaranteesFileNames?.[index] || `Garantia ${index + 1}`}</p>
                            <p className="text-xs text-orange-700 dark:text-orange-300">Documento de garantia</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-orange-300 dark:border-orange-700"
                          onClick={() => downloadDocument(url, selectedFinancing.guaranteesFileNames?.[index] || `Garantia_${index + 1}`)}
                          data-testid={`button-download-guarantee-${index}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Garantia
                        </Button>
                      </div>
                    ))}

                    {/* Outros Documentos */}
                    {selectedFinancing.otherDocumentsUrls && selectedFinancing.otherDocumentsUrls.length > 0 && selectedFinancing.otherDocumentsUrls.map((url: string, index: number) => (
                      <div key={index} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border-2 hover-elevate">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                            <FileText className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{selectedFinancing.otherDocumentsFileNames?.[index] || `Documento ${index + 1}`}</p>
                            <p className="text-xs text-muted-foreground">Documento adicional</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => downloadDocument(url, selectedFinancing.otherDocumentsFileNames?.[index] || `Documento_${index + 1}`)}
                          data-testid={`button-download-other-doc-${index}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Documento
                        </Button>
                      </div>
                    ))}

                    {/* Comprovante de Pagamento */}
                    {selectedFinancing.cashProofUrl && (
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-2 border-green-200 dark:border-green-800 hover-elevate md:col-span-2">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                            <CreditCard className="h-5 w-5 text-green-700 dark:text-green-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-100">{selectedFinancing.cashProofFileName || 'Comprovante de Pagamento'}</p>
                            <p className="text-xs text-green-700 dark:text-green-300">
                              {selectedFinancing.cashPaymentMethod === 'PIX' ? 'Comprovante de PIX' :
                                selectedFinancing.cashPaymentMethod === 'Transferência' ? 'Comprovante de transferência' :
                                  'Comprovante de pagamento'}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-green-300 dark:border-green-700"
                          onClick={() => downloadDocument(selectedFinancing.cashProofUrl!, selectedFinancing.cashProofFileName || 'Comprovante_Pagamento')}
                          data-testid="button-download-cash-proof-docs"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Comprovante
                        </Button>
                      </div>
                    )}

                    {/* Vídeo Confissão de Ciência */}
                    {selectedFinancing?.confessionVideoUrl && (
                      <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border-2 border-green-200 dark:border-green-800 hover-elevate md:col-span-2">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                            <Video className="h-5 w-5 text-green-700 dark:text-green-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-100">Vídeo Confissão de Ciência</p>
                            <p className="text-xs text-green-700 dark:text-green-300">Gravação do consentimento do cliente</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-green-300 dark:border-green-700 font-bold"
                          onClick={() => {
                            setConfessionVideoUrl(selectedFinancing.confessionVideoUrl || null);
                            setConfessionVideoDialogOpen(true);
                          }}
                          data-testid="button-confession-video-details"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Assistir Vídeo
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dados do Avalista */}
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Dados do Avalista
                      </CardTitle>
                      <Badge variant="outline" className="border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950">
                        Obrigatório
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">Nome Completo</span>
                        <span className="font-medium">{selectedFinancing.guarantorName || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">CPF</span>
                        <span className="font-medium">{selectedFinancing.guarantorCpf || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">Email</span>
                        <span className="font-medium">{selectedFinancing.guarantorEmail || '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground mb-1">Telefone</span>
                        <span className="font-medium">{selectedFinancing.guarantorPhone || '-'}</span>
                      </div>
                      {selectedFinancing.guarantorDriverLicense && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">CNH</span>
                          <span className="font-medium">{selectedFinancing.guarantorDriverLicense}</span>
                        </div>
                      )}
                      {selectedFinancing.guarantorRg && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground mb-1">RG</span>
                          <span className="font-medium">{selectedFinancing.guarantorRg}</span>
                        </div>
                      )}
                    </div>
                    {(selectedFinancing.guarantorStreet || selectedFinancing.guarantorCity) && (
                      <div className="pt-3 border-t">
                        <span className="text-xs text-muted-foreground mb-1 block">Endereço Completo</span>
                        <span className="font-medium">
                          {[
                            selectedFinancing.guarantorStreet,
                            selectedFinancing.guarantorNeighborhood,
                            selectedFinancing.guarantorCity && selectedFinancing.guarantorState ?
                              `${selectedFinancing.guarantorCity}/${selectedFinancing.guarantorState}` : null,
                            selectedFinancing.guarantorZipCode ? `CEP: ${selectedFinancing.guarantorZipCode}` : null
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {/* Documentos do Avalista */}
                    <div className="pt-3 border-t space-y-3">
                      <span className="text-xs text-muted-foreground font-medium block">Documentos do Avalista</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Documento com Foto */}
                        {selectedFinancing.guarantorDocumentUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => downloadDocument(
                              selectedFinancing.guarantorDocumentUrl!,
                              selectedFinancing.guarantorDocumentFileName || 'Documento_Avalista.pdf'
                            )}
                            data-testid="button-download-guarantor-doc"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Documento com Foto
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const base64 = await processFileUpload(file);
                                    await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                                      guarantorDocumentUrl: base64,
                                      guarantorDocumentFileName: file.name
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["/api/financings"] });
                                    toast({
                                      title: "Documento anexado!",
                                      description: "Documento do avalista salvo com sucesso.",
                                    });
                                  } catch (error) {
                                    console.error('Erro ao anexar documento:', error);
                                    toast({
                                      title: "Erro",
                                      description: "Não foi possível anexar o documento.",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              data-testid="input-upload-guarantor-doc"
                            />
                            <p className="text-xs text-muted-foreground">Documento com foto (CNH/RG)</p>
                          </div>
                        )}

                        {/* Comprovante de Residência */}
                        {selectedFinancing.guarantorResidenceUrl ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => downloadDocument(
                              selectedFinancing.guarantorResidenceUrl!,
                              selectedFinancing.guarantorResidenceFileName || 'Comprovante_Residencia_Avalista.pdf'
                            )}
                            data-testid="button-download-guarantor-residence"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Comprovante de Residência
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const base64 = await processFileUpload(file);
                                    await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                                      guarantorResidenceUrl: base64,
                                      guarantorResidenceFileName: file.name
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["/api/financings"] });
                                    toast({
                                      title: "Documento anexado!",
                                      description: "Comprovante de residência do avalista salvo com sucesso.",
                                    });
                                  } catch (error) {
                                    console.error('Erro ao anexar documento:', error);
                                    toast({
                                      title: "Erro",
                                      description: "Não foi possível anexar o documento.",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              data-testid="input-upload-guarantor-residence"
                            />
                            <p className="text-xs text-muted-foreground">Comprovante de residência</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fotos de Check-in (Vistoria de Entrega) */}
                {checkInData && Object.keys(checkInData).some(key => key !== 'notes' && key !== 'checklist' && checkInData[key]) && (
                  <Card className="border-2 border-green-500/50 bg-green-50/30 dark:bg-green-950/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Camera className="h-5 w-5 text-green-600" />
                          Vistoria de Entrega
                        </CardTitle>
                        {selectedFinancing.checkInCompletedAt && (
                          <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950">
                            Concluída em {new Date(selectedFinancing.checkInCompletedAt).toLocaleDateString('pt-BR')}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(checkInData).map(([key, value]) => {
                          if (key === 'notes' || key === 'checklist' || !value || typeof value !== 'string') return null;

                          const labels: { [key: string]: string } = {
                            front: 'Frente',
                            frente: 'Frente',
                            back: 'Traseira',
                            fundo: 'Traseira',
                            leftSide: 'Lado Esquerdo',
                            lateral_esquerda: 'Lateral Esquerda',
                            rightSide: 'Lado Direito',
                            lateral_direita: 'Lateral Direita',
                            interior: 'Interior',
                            dashboard: 'Painel',
                            painel: 'Painel',
                            odometer: 'Hodômetro',
                            trunk: 'Porta-malas'
                          };

                          return (
                            <div key={key} className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                {labels[key] || key}
                              </p>
                              <div
                                className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover-elevate"
                                onClick={() => {
                                  setSelectedImageUrl(value as string);
                                  setSelectedImageLabel(labels[key] || key);
                                  setImageViewerOpen(true);
                                }}
                              >
                                <img
                                  src={value as string}
                                  alt={labels[key] || key}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Checklist do Check-in */}
                      {checkInData.checklist && Object.keys(checkInData.checklist).length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-3">Checklist do Veículo</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {Object.entries(checkInData.checklist).map(([key, value]: [string, any]) => {
                              const checklistLabels: { [key: string]: string } = {
                                documentos: 'Documentos do Veículo',
                                chave_reserva: 'Chave Reserva',
                                extintor: 'Extintor',
                                macaco_chave: 'Macaco e Chave de Roda',
                                triangulo: 'Triângulo',
                                estepe: 'Estepe',
                                manual: 'Manual do Proprietário',
                                tapetes: 'Tapetes'
                              };

                              return (
                                <div key={key} className="flex items-center gap-2">
                                  {value ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className={value ? "text-foreground" : "text-muted-foreground"}>
                                    {checklistLabels[key] || key}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {checkInData.notes && (
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Observações</p>
                          <p className="text-sm text-muted-foreground">{checkInData.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Vistoria de Checkout */}
                {selectedFinancing.checkOutCompletedAt && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Vistoria de Entrega (Checkout)
                        <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950">
                          Concluída
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Realizada em {new Date(selectedFinancing.checkOutCompletedAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(selectedFinancing.checkOutCompletedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Fotos de Checkout */}
                      {checkOutData && Object.keys(checkOutData).length > 0 && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Fotos da Vistoria</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(checkOutData).map(([key, value]) => {
                              if (!value) return null;

                              const labels: { [key: string]: string } = {
                                front: 'Frente',
                                back: 'Traseira',
                                leftSide: 'Lado Esquerdo',
                                rightSide: 'Lado Direito',
                                interior: 'Interior',
                                dashboard: 'Painel',
                                odometer: 'Hodômetro',
                                trunk: 'Porta-malas'
                              };

                              return (
                                <div key={key} className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    {labels[key] || key}
                                  </p>
                                  <div
                                    className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover-elevate"
                                    onClick={() => {
                                      setSelectedImageUrl(value as string);
                                      setSelectedImageLabel(labels[key] || key);
                                      setImageViewerOpen(true);
                                    }}
                                  >
                                    <img
                                      src={value as string}
                                      alt={labels[key] || key}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Checklist de Verificação */}
                      {checkOutChecklistData && Object.keys(checkOutChecklistData).length > 0 && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Itens Verificados</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(checkOutChecklistData).map(([item, checked]) => {
                              if (!checked) return null;
                              return (
                                <div key={item} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span className="text-sm">{item}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Observações do Checkout */}
                      {selectedFinancing.checkOutNotes && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Observações da Vistoria</label>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedFinancing.checkOutNotes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Informações de Pagamento */}
                {(selectedFinancing.cashPaymentMethod || selectedFinancing.installmentPaymentMethod || selectedFinancing.generalPaymentNotes) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Informações de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pagamento da Entrada à Vista */}
                      {selectedFinancing.cashPaymentMethod && (
                        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                          <h4 className="text-sm font-semibold">Pagamento da Entrada à Vista</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium">Forma de Pagamento:</span>{' '}
                              <span className="capitalize">
                                {selectedFinancing.cashPaymentMethod === 'pix' ? 'PIX' :
                                  selectedFinancing.cashPaymentMethod === 'transferencia' ? 'Transferência Bancária' :
                                    selectedFinancing.cashPaymentMethod === 'dinheiro' ? 'Dinheiro' :
                                      selectedFinancing.cashPaymentMethod === 'cartao' ? 'Cartão de Débito' :
                                        selectedFinancing.cashPaymentMethod === 'cheque' ? 'Cheque' :
                                          selectedFinancing.cashPaymentMethod}
                              </span>
                            </div>
                            {selectedFinancing.cashPaymentDate && (
                              <div>
                                <span className="font-medium">Data do Pagamento:</span>{' '}
                                {new Date(selectedFinancing.cashPaymentDate).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                          {selectedFinancing.cashProofUrl && (
                            <div className="space-y-2">
                              <span className="text-sm font-medium">Comprovante de Pagamento:</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => downloadDocument(selectedFinancing.cashProofUrl!, 'Comprovante_Pagamento_Entrada.pdf')}
                                data-testid="button-download-cash-proof"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Baixar Comprovante
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pagamento da Entrada Parcelada */}
                      {selectedFinancing.installmentPaymentMethod && (
                        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                          <h4 className="text-sm font-semibold">Pagamento da Entrada Parcelada</h4>
                          <div className="text-sm">
                            <span className="font-medium">Forma de Pagamento:</span>{' '}
                            <span className="capitalize">
                              {selectedFinancing.installmentPaymentMethod === 'cartao_credito' ? 'Cartão de Crédito' :
                                selectedFinancing.installmentPaymentMethod === 'boleto' ? 'Boleto Bancário' :
                                  selectedFinancing.installmentPaymentMethod === 'debito_automatico' ? 'Débito Automático' :
                                    selectedFinancing.installmentPaymentMethod === 'cheque_pre' ? 'Cheque Pré-Datado' :
                                      selectedFinancing.installmentPaymentMethod}
                            </span>
                          </div>
                          {selectedFinancing.installmentNotes && (
                            <div>
                              <span className="text-sm font-medium">Observações:</span>
                              <p className="text-sm text-muted-foreground mt-1">{selectedFinancing.installmentNotes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Observações Gerais */}
                      {selectedFinancing.generalPaymentNotes && (
                        <div>
                          <span className="text-sm font-medium">Observações Gerais:</span>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedFinancing.generalPaymentNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Contratos */}
                {(() => {
                  let contracts = [];
                  if (selectedFinancing.generatedContracts) {
                    try {
                      contracts = JSON.parse(selectedFinancing.generatedContracts);
                    } catch (e) {
                      contracts = [];
                    }
                  }

                  return (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Contratos
                          </CardTitle>
                          {selectedFinancing.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={uploadingContract}
                              onClick={async () => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '*/*';
                                input.onchange = async (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  setUploadingContract(true);
                                  try {
                                    const base64 = await processFileUpload(file);
                                    const newContract = {
                                      fileName: file.name,
                                      url: base64,
                                      generatedAt: new Date().toISOString(),
                                    };

                                    const updatedContracts = [...contracts, newContract];

                                    await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                                      generatedContracts: JSON.stringify(updatedContracts),
                                    });

                                    queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                                    toast({
                                      title: "Contrato adicionado!",
                                      description: "O contrato foi anexado com sucesso.",
                                    });
                                  } catch (error) {
                                    console.error('Erro ao adicionar contrato:', error);
                                    toast({
                                      title: "Erro ao adicionar contrato",
                                      description: "Não foi possível anexar o contrato. Tente novamente.",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setUploadingContract(false);
                                  }
                                };
                                input.click();
                              }}
                              data-testid="button-upload-contract"
                            >
                              {uploadingContract ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar Contrato
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {contracts.length > 0 ? (
                          contracts.map((contract: any, index: number) => (
                            <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="text-sm font-medium">{contract.fileName || `Contrato ${index + 1}`}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Adicionado em {new Date(contract.generatedAt).toLocaleDateString('pt-BR')} às{' '}
                                      {new Date(contract.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      downloadDocument(contract.url, contract.fileName || `contrato-${index + 1}.pdf`);
                                    }}
                                    data-testid={`button-download-contract-${index}`}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      if (!confirm('Tem certeza que deseja remover este contrato?')) return;

                                      try {
                                        const updatedContracts = contracts.filter((_: any, i: number) => i !== index);

                                        await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                                          generatedContracts: JSON.stringify(updatedContracts),
                                        });

                                        queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                                        toast({
                                          title: "Contrato removido!",
                                          description: "O contrato foi removido com sucesso.",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Erro ao remover contrato",
                                          description: "Não foi possível remover o contrato.",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    data-testid={`button-remove-contract-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : selectedFinancing.contractUrl ? (
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="text-sm font-medium">{selectedFinancing.contractFileName || 'Contrato Legado'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedFinancing.contractFileName ? 'Contrato anexado' : 'Formato antigo'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadDocument(selectedFinancing.contractUrl!, selectedFinancing.contractFileName || 'contrato-legado.pdf')}
                                  data-testid="button-download-legacy-contract"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (!confirm('Tem certeza que deseja remover este contrato?')) return;

                                    try {
                                      await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                                        contractUrl: null,
                                      });

                                      queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                                      toast({
                                        title: "Contrato removido!",
                                        description: "O contrato foi removido com sucesso.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Erro ao remover contrato",
                                        description: "Não foi possível remover o contrato.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  data-testid="button-remove-legacy-contract"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum contrato anexado</p>
                            <p className="text-xs mt-1">Use o botão acima para adicionar um contrato</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Status e Observações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status e Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status da Aprovação:</span>
                      <Badge variant={
                        selectedFinancing.approvalStatus === "approved" ? "default" :
                          selectedFinancing.approvalStatus === "rejected" ? "destructive" :
                            "secondary"
                      }>
                        {selectedFinancing.approvalStatus === "approved" ? "Aprovado" :
                          selectedFinancing.approvalStatus === "rejected" ? "Rejeitado" :
                            selectedFinancing.approvalStatus === "finalized" ? "Finalizado" :
                              "Pendente"}
                      </Badge>
                    </div>
                    {selectedFinancing.approvalNotes && (
                      <div>
                        <span className="font-medium">Observações:</span>
                        <p className="text-muted-foreground mt-1">{selectedFinancing.approvalNotes}</p>
                      </div>
                    )}
                    {selectedFinancing.approvedAt && (
                      <div>
                        <span className="font-medium">Data de Aprovação:</span>{' '}
                        {new Date(selectedFinancing.approvedAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(selectedFinancing.approvedAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedFinancing && (
              <>
                {/* Botões de Aprovação/Rejeição - só aparece se estiver pendente ou aprovado */}
                {(selectedFinancing.approvalStatus === "pending" || selectedFinancing.approvalStatus === "approved") && (
                  <>
                    {selectedFinancing.approvalStatus === "pending" && (
                      <>
                        <Button
                          variant="default"
                          onClick={async () => {
                            if (!selectedFinancing.id) return;

                            try {
                              await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                                approvalStatus: "approved",
                                approvalNotes: "Financiamento aprovado",
                                approvedAt: new Date().toISOString()
                              });

                              queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                              toast({
                                title: "Financiamento Aprovado",
                                description: "O financiamento foi aprovado com sucesso!",
                              });

                              setFinancingDetailsDialogOpen(false);
                            } catch (error) {
                              toast({
                                title: "Erro ao aprovar",
                                description: error instanceof Error ? error.message : "Tente novamente.",
                                variant: "destructive",
                              });
                            }
                          }}
                          data-testid="button-approve-financing"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar Financiamento
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={async () => {
                            if (!selectedFinancing.id) return;

                            const notes = prompt("Motivo da rejeição (opcional):");

                            try {
                              await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                                approvalStatus: "rejected",
                                approvalNotes: notes || "Financiamento rejeitado",
                              });

                              queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                              toast({
                                title: "Financiamento Rejeitado",
                                description: "O financiamento foi rejeitado.",
                                variant: "destructive",
                              });

                              setFinancingDetailsDialogOpen(false);
                            } catch (error) {
                              toast({
                                title: "Erro ao rejeitar",
                                description: error instanceof Error ? error.message : "Tente novamente.",
                                variant: "destructive",
                              });
                            }
                          }}
                          data-testid="button-reject-financing"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </>
                    )}

                    {/* Botão de Vistoria de Checkout - aparece após aprovação, se pagamento em dia e ainda não teve check-in */}
                    {selectedFinancing.approvalStatus === "approved" &&
                      selectedFinancing.paymentStatus === "em_dia" &&
                      !selectedFinancing.checkInCompletedAt && (
                        <Button
                          variant="default"
                          onClick={() => {
                            setFinancingDetailsDialogOpen(false);
                            // Abrir dialog de vistoria de checkout
                            setSelectedFinancing(selectedFinancing);
                            setCheckoutDialogOpen(true);
                          }}
                          data-testid="button-start-checkout-inspection"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Realizar Vistoria de Entrega
                        </Button>
                      )}

                    {/* Botão de Finalizar Financiamento - só aparece após checkout concluído */}
                    {selectedFinancing.approvalStatus === "approved" &&
                      selectedFinancing.checkOutCompletedAt && (
                        <Button
                          variant="default"
                          onClick={() => setFinalizeConfirmDialogOpen(true)}
                          data-testid="button-finalize-financing"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finalizar Financiamento
                        </Button>
                      )}

                    {/* Botão de Cancelar Financiamento - aparece para financiamentos aprovados ou finalizados */}
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (!selectedFinancing.id) return;

                        const confirmed = confirm("Tem certeza que deseja cancelar este financiamento? O veículo ficará disponível para financiamento novamente.");
                        if (!confirmed) return;

                        const notes = prompt("Motivo do cancelamento (opcional):");

                        try {
                          await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}/cancel`, {
                            cancelNotes: notes || "Financiamento cancelado pelo administrador",
                          });

                          queryClient.invalidateQueries({ queryKey: ["/api/financings"] });
                          queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });

                          toast({
                            title: "Financiamento Cancelado",
                            description: "O financiamento foi cancelado e o veículo está disponível novamente.",
                          });

                          setFinancingDetailsDialogOpen(false);
                        } catch (error) {
                          toast({
                            title: "Erro ao cancelar",
                            description: error instanceof Error ? error.message : "Tente novamente.",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-cancel-financing"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar Financiamento
                    </Button>
                  </>
                )}
              </>
            )}

            <Button
              variant="outline"
              onClick={() => setFinancingDetailsDialogOpen(false)}
              data-testid="button-close-financing-details"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Vistoria de Checkout */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vistoria de Checkout - Financiamento</DialogTitle>
            <DialogDescription>
              Documente a vistoria final do veículo com fotos, checklist e observações
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Fotos do Checkout */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fotos do Checkout
                </CardTitle>
                <CardDescription>
                  Tire fotos do veículo para registro final (mínimo 4 fotos recomendadas)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["frontal", "traseira", "lateral_direita", "lateral_esquerda", "painel", "interior"].map((tipo) => (
                    <div key={tipo} className="space-y-2">
                      <label className="text-sm font-medium capitalize">{tipo.replace(/_/g, " ")}</label>
                      <Input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const url = await compressImage(file);
                              setCheckoutPhotos((prev: any) => ({ ...prev, [tipo]: url }));
                              toast({
                                title: "Foto enviada",
                                description: `Foto ${tipo.replace(/_/g, " ")} enviada com sucesso.`,
                              });
                            } catch (error) {
                              toast({
                                title: "Erro ao enviar foto",
                                description: error instanceof Error ? error.message : "Tente novamente.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                        data-testid={`input-checkout-photo-${tipo}`}
                      />
                      {checkoutPhotos[tipo] && (
                        <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-muted">
                          <img
                            src={checkoutPhotos[tipo]}
                            alt={tipo}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setCheckoutPhotos((prev: any) => {
                                const updated = { ...prev };
                                delete updated[tipo];
                                return updated;
                              });
                            }}
                            data-testid={`button-remove-checkout-photo-${tipo}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Checklist do Veículo
                </CardTitle>
                <CardDescription>
                  Marque os itens presentes e em bom estado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Documentos do Veículo",
                    "Chave Reserva",
                    "Extintor",
                    "Macaco e Chave de Roda",
                    "Triângulo",
                    "Estepe",
                    "Manual do Proprietário",
                    "Tapetes"
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`checkout-${item}`}
                        checked={checkoutChecklist[item] || false}
                        onChange={(e) => {
                          setCheckoutChecklist((prev: any) => ({
                            ...prev,
                            [item]: e.target.checked
                          }));
                        }}
                        className="rounded"
                        data-testid={`checkbox-checkout-${item.toLowerCase().replace(/ /g, "-")}`}
                      />
                      <label htmlFor={`checkout-${item}`} className="text-sm cursor-pointer">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
                <CardDescription>
                  Registre qualquer avaria, defeito ou observação importante
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Ex: Arranhão na porta traseira esquerda, farol direito com pequena trinca..."
                  rows={4}
                  data-testid="textarea-checkout-notes"
                />
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCheckoutDialogOpen(false);
                setCheckoutPhotos({});
                setCheckoutChecklist({});
                setCheckoutNotes("");
                setCheckoutSubmitting(false);
              }}
              disabled={checkoutSubmitting}
              data-testid="button-cancel-checkout"
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              disabled={checkoutSubmitting}
              onClick={async () => {
                if (!selectedFinancing?.id) return;

                // Verificar se tem pelo menos 4 fotos
                const photoCount = Object.keys(checkoutPhotos).length;
                if (photoCount < 4) {
                  toast({
                    title: "Fotos insuficientes",
                    description: "Tire pelo menos 4 fotos do veículo para continuar.",
                    variant: "destructive",
                  });
                  return;
                }

                setCheckoutSubmitting(true);

                try {
                  await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}/checkout`, {
                    checkInPhotos: JSON.stringify(checkoutPhotos),
                    checkInChecklist: JSON.stringify(checkoutChecklist),
                    checkInNotes: checkoutNotes,
                    checkInCompletedAt: new Date().toISOString(),
                  });

                  queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                  toast({
                    title: "Vistoria Concluída",
                    description: "A vistoria de entrega foi registrada com sucesso!",
                  });

                  setCheckoutDialogOpen(false);
                  setCheckoutPhotos({});
                  setCheckoutChecklist({});
                  setCheckoutNotes("");
                  setCheckoutSubmitting(false);
                } catch (error) {
                  setCheckoutSubmitting(false);
                  toast({
                    title: "Erro ao salvar vistoria",
                    description: error instanceof Error ? error.message : "Tente novamente.",
                    variant: "destructive",
                  });
                }
              }}
              data-testid="button-submit-checkout"
            >
              {checkoutSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir Vistoria
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Vídeo Confissão de Ciência */}
      <Dialog open={confessionVideoDialogOpen} onOpenChange={setConfessionVideoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Vídeo Confissão de Ciência
            </DialogTitle>
            <DialogDescription>
              Grave ou anexe um vídeo do cliente confirmando ciência das condições do financiamento. Este vídeo é opcional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Vídeo já gravado */}
            {confessionVideoUrl && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                  <video
                    src={confessionVideoUrl}
                    controls
                    className="w-full h-full object-contain"
                    data-testid="video-confession-preview"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Vídeo gravado em {selectedFinancing?.confessionVideoRecordedAt
                      ? new Date(selectedFinancing.confessionVideoRecordedAt).toLocaleDateString('pt-BR')
                      : "data não registrada"}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!selectedFinancing?.id) return;
                      if (!confirm("Tem certeza que deseja remover o vídeo de confissão?")) return;

                      try {
                        await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                          confessionVideoUrl: null,
                          confessionVideoRecordedAt: null,
                        });

                        queryClient.invalidateQueries({ queryKey: ["/api/financings"] });
                        setConfessionVideoUrl(null);

                        toast({
                          title: "Vídeo removido",
                          description: "O vídeo de confissão foi removido com sucesso.",
                        });
                      } catch (error) {
                        toast({
                          title: "Erro ao remover vídeo",
                          description: error instanceof Error ? error.message : "Tente novamente.",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="button-remove-confession-video"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Vídeo
                  </Button>
                </div>
              </div>
            )}

            {/* Opções de gravação foram movidas para a Etapa 4 do financiamento */}
            {!confessionVideoUrl && !isRecordingVideo && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nenhum vídeo de confissão encontrado para este financiamento. O vídeo agora deve ser anexado durante a Etapa 4 (Documentação e Anexos) no momento da criação da proposta.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfessionVideoDialogOpen(false);
                setConfessionVideoUrl(null);
              }}
              data-testid="button-close-confession-dialog"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Finalização de Financiamento */}
      <Dialog open={finalizeConfirmDialogOpen} onOpenChange={setFinalizeConfirmDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Finalizar Financiamento
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p className="font-medium text-foreground">
                O que significa finalizar um financiamento?
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Todas as parcelas foram <strong>pagas integralmente</strong></li>
                <li>O financiamento está <strong>100% quitado</strong></li>
                <li>O veículo agora <strong>pertence ao cliente</strong></li>
                <li>O contrato será encerrado com sucesso</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Esta ação não pode ser desfeita. O veículo não retornará à frota.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setFinalizeConfirmDialogOpen(false)}
              disabled={finalizingFinancing}
              data-testid="button-cancel-finalize"
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              disabled={finalizingFinancing}
              onClick={async () => {
                if (!selectedFinancing?.id) return;

                setFinalizingFinancing(true);

                try {
                  await apiRequest("PATCH", `/api/financings/${selectedFinancing.id}`, {
                    approvalStatus: "finalized"
                  });

                  queryClient.invalidateQueries({ queryKey: ["/api/financings"] });

                  toast({
                    title: "Financiamento Finalizado",
                    description: "O financiamento foi quitado com sucesso! O veículo agora pertence ao cliente.",
                  });

                  setFinalizeConfirmDialogOpen(false);
                  setFinancingDetailsDialogOpen(false);
                } catch (error) {
                  toast({
                    title: "Erro ao finalizar",
                    description: error instanceof Error ? error.message : "Tente novamente.",
                    variant: "destructive",
                  });
                } finally {
                  setFinalizingFinancing(false);
                }
              }}
              data-testid="button-confirm-finalize"
            >
              {finalizingFinancing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sim, Finalizar Financiamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização de Imagem */}
      <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{selectedImageLabel}</DialogTitle>
            <DialogDescription>
              Clique na imagem para abrir em nova aba
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <div
              className="relative w-full rounded-lg overflow-hidden bg-black cursor-pointer"
              onClick={() => window.open(selectedImageUrl, '_blank')}
            >
              <img
                src={selectedImageUrl}
                alt={selectedImageLabel}
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button
              variant="outline"
              onClick={() => setImageViewerOpen(false)}
              data-testid="button-close-image-viewer"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes de Dividendos */}
      <Dialog open={dividendModalOpen} onOpenChange={setDividendModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dividendModalType === "current" ? "Dividendos Mensais por Investidor" : "Histórico de Pagamentos Acumulados"}
            </DialogTitle>
            <DialogDescription>
              {dividendModalType === "current"
                ? `Obrigação mensal de dividendos - ${dividendSummary?.currentPeriod?.month || ''}/${dividendSummary?.currentPeriod?.year || ''}`
                : "Total de dividendos já pagos a cada investidor"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {dividendModalType === "current" ? (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-900">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Total Mensal:</span>
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                      R$ {(dividendSummary?.currentPeriod?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                {dividendSummary?.currentPeriod?.breakdown?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum investidor com veículos ativos.</p>
                ) : (
                  <div className="space-y-3">
                    {dividendSummary?.currentPeriod?.breakdown?.map((investor) => (
                      <Card key={investor.investorId} className="border" data-testid={`card-dividend-investor-${investor.investorId}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-base">{investor.investorName}</h4>
                              <p className="text-xs text-muted-foreground">{investor.vehicles.length} veículo(s)</p>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 no-default-hover-elevate no-default-active-elevate">
                              R$ {investor.totalDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {investor.vehicles.map((vehicle) => (
                              <div key={vehicle.vehicleId} className="flex justify-between items-center text-sm bg-muted/50 rounded p-2" data-testid={`row-vehicle-dividend-${vehicle.vehicleId}`}>
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-muted-foreground" />
                                  <span>{vehicle.vehicleName}</span>
                                  {vehicle.licensePlate && <span className="text-xs text-muted-foreground">({vehicle.licensePlate})</span>}
                                </div>
                                <span className="font-medium">R$ {vehicle.dividend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Total Acumulado Pago:</span>
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                      R$ {(dividendSummary?.cumulative?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                {dividendSummary?.cumulative?.breakdown?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum dividendo acumulado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {dividendSummary?.cumulative?.breakdown?.map((investor: {
                      investorId: string;
                      investorName: string;
                      paymentsCount: number;
                      monthlyDividend: number;
                      totalPaid: number;
                      details: string[];
                      paymentsByDate?: {
                        paymentDay: number;
                        vehicles: { vehicleId: string; vehicleName: string; licensePlate: string; dividend: number }[];
                        totalForDate: number;
                        paymentDates: string[];
                        paymentsCount: number;
                      }[];
                    }) => (
                      <Card key={investor.investorId} className="border" data-testid={`card-cumulative-investor-${investor.investorId}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-base">{investor.investorName}</h4>
                              <p className="text-xs text-muted-foreground">
                                R$ {investor.monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                              </p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 no-default-hover-elevate no-default-active-elevate">
                              R$ {investor.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Badge>
                          </div>
                          {investor.paymentsByDate && investor.paymentsByDate.length > 0 ? (
                            <div className="space-y-3">
                              {investor.paymentsByDate.map((dateGroup) => (
                                <div key={dateGroup.paymentDay} className="border rounded-lg p-3 bg-muted/30">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-sm flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Dia {dateGroup.paymentDay}
                                    </span>
                                    <Badge variant="outline" className="text-xs no-default-hover-elevate no-default-active-elevate">
                                      R$ {dateGroup.totalForDate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 mb-2">
                                    {dateGroup.vehicles.map((vehicle) => (
                                      <div key={vehicle.vehicleId} className="flex justify-between items-center text-xs bg-background rounded px-2 py-1">
                                        <div className="flex items-center gap-1">
                                          <Car className="h-3 w-3 text-muted-foreground" />
                                          <span>{vehicle.vehicleName}</span>
                                          {vehicle.licensePlate && <span className="text-muted-foreground">({vehicle.licensePlate})</span>}
                                        </div>
                                        <span className="font-medium">R$ {vehicle.dividend.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {dateGroup.paymentDates.map((date, idx) => (
                                      <span key={idx} className="text-xs bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">{date}</span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : investor.details.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {investor.details.map((monthYear, idx) => (
                                <span key={idx} className="text-xs bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">{monthYear}</span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setDividendModalOpen(false)} data-testid="button-close-dividend-modal">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Veículo de Troca à Frota */}
    </div>
  );
}

// Componente principal que envolve com o Provider
export default function CRM() {
  return (
    <CrmDataProvider>
      <CRMContent />
    </CrmDataProvider>
  );
}
