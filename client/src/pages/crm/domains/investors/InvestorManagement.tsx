import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Car, DollarSign, Edit, AlertCircle, TrendingUp, FileText, Trash2, XCircle, Mail, Phone, Calendar, MapPin, CreditCard, Building, Plus, HandCoins, Gift, ChevronDown, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";
import { formatCPF, formatPhone, formatCEP } from "@/pages/crm/utils/formatters";
import { format, differenceInMonths, startOfMonth, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import PhotoUploadZone from "@/pages/crm/components/shared/PhotoUploadZone";
import FileUploadZone from "@/pages/crm/components/shared/FileUploadZone";
import placeholderLogo from "@assets/logo_imobile_1765389205488.png";

interface InvestorManagementProps {
  onOpenInvestmentWizard?: () => void;
}

export default function InvestorManagement({ onOpenInvestmentWizard }: InvestorManagementProps) {
  const { toast } = useToast();
  const { investors, vehicles, investmentQuotas, vehicleRequests, isLoading, invalidate } = useCrmData();
  
  // State variables
  const [selectedInvestor, setSelectedInvestor] = useState<any>(null);
  const [investorDetailsDialogOpen, setInvestorDetailsDialogOpen] = useState(false);
  const [editInvestorDialogOpen, setEditInvestorDialogOpen] = useState(false);
  const [investorEditData, setInvestorEditData] = useState<any>({});
  const [vehicleDocsEditData, setVehicleDocsEditData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [cancelInvestmentDialogOpen, setCancelInvestmentDialogOpen] = useState(false);
  const [adminPasswordForCancel, setAdminPasswordForCancel] = useState("");
  const [selectedVehiclesToCancel, setSelectedVehiclesToCancel] = useState<string[]>([]);
  const [vehicleInspections, setVehicleInspections] = useState<Record<string, any[]>>({});
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; label: string } | null>(null);
  const [uploadingInspectionVehicleId, setUploadingInspectionVehicleId] = useState<string | null>(null);
  
  // Add Vehicle to Investor states (6 steps like main wizard)
  const [addVehicleDialogOpen, setAddVehicleDialogOpen] = useState(false);
  const [addVehicleStep, setAddVehicleStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [addVehicleSubmitting, setAddVehicleSubmitting] = useState(false);
  
  // Step 1: Investor personal data (pre-filled from selectedInvestor)
  const [wizardInvestorData, setWizardInvestorData] = useState<any>({});
  const [wizardInvestorDocs, setWizardInvestorDocs] = useState<any>({
    comprovanteResidencia: null,
    cnh: null,
  });
  
  // Step 2: Vehicle data
  const [newVehicleData, setNewVehicleData] = useState({
    vehicleName: "",
    category: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    transmission: "",
    fuel: "",
    seats: 5,
    imageUrl: "",
    licensePlate: "",
    chassi: "",
    fipeValue: "",
    customDividend: "",
    hasBonus: false,
    bonusDate: "",
    bonusValue: "",
    temDocumento: null as boolean | null,
    observacoesDocumento: "",
    ipvaStatus: null as string | null, // 'sim', 'nao', 'isento'
    ipvaValue: "",
    licenciamentoPago: null as boolean | null,
    observacoesLicenciamento: "",
    hasInsurance: null as boolean | null,
    insuranceValue: "",
    taFinanciado: null as boolean | null,
    observacoesFinanciado: "",
    eDeLeilao: null as boolean | null,
    observacoesLeilao: "",
    temRastreador: null as boolean | null,
    localizacaoRastreador: "",
    temMultas: null as boolean | null,
    observacoesMultas: "",
    problemaMecanico: "",
    observacoesAvarias: "",
  });
  
  // Step 3: Dividend/Bank data
  const [wizardBankData, setWizardBankData] = useState<any>({});
  
  // Step 4: Photos
  const [newVehiclePhotos, setNewVehiclePhotos] = useState({
    front: "",
    back: "",
    rightSide: "",
    leftSide: "",
    display: "",
  });
  const [hasDamages, setHasDamages] = useState<boolean | null>(null);
  const [damagePhotos, setDamagePhotos] = useState<Record<string, string>>({});
  const [newVehicleDocs, setNewVehicleDocs] = useState({
    crlv: "",
    laudoCautelar: "",
    laudoMecanico: "",
  });
  
  // Step 5: Contract
  const [wizardContractData, setWizardContractData] = useState<any>(null);
  
  // FIPE states for new vehicle
  interface FipeBrand { code: string; name: string; }
  interface FipeModel { code: string; name: string; }
  interface FipeYear { code: string; name: string; }
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModel[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeYear[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loadingFipe, setLoadingFipe] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  // Initialize investorEditData when an investor is selected
  useEffect(() => {
    if (selectedInvestor) {
      // Get investor's vehicles to read data
      const investorVehicles = (vehicles || []).filter(
        (v: any) => v.ownerId === selectedInvestor.id && v.isInvestorVehicle
      );
      const firstVehicle = investorVehicles[0];
      
      // Calculate total monthly dividend from all vehicles
      const totalDividend = investorVehicles.reduce((sum: number, v: any) => {
        return sum + (parseFloat(v.customDividend || "0"));
      }, 0);
      
      // Aggregate payment dates from all vehicles (unique, sorted)
      const allDates: number[] = [];
      investorVehicles.forEach((v: any) => {
        if (v.paymentDate) {
          const dates = String(v.paymentDate).split('/').map((d: string) => parseInt(d.trim())).filter((d: number) => !isNaN(d) && d > 0 && d <= 31);
          allDates.push(...dates);
        }
      });
      const uniqueDates = [...new Set(allDates)].sort((a, b) => a - b);
      const paymentDateStr = uniqueDates.length > 0 ? uniqueDates.join('/') : (selectedInvestor.paymentDate || "");
      
      setInvestorEditData({
        name: selectedInvestor.name || "",
        email: selectedInvestor.email || "",
        cpf: selectedInvestor.cpf || "",
        phone: selectedInvestor.phone || "",
        rg: selectedInvestor.rg || "",
        rgImageUrl: selectedInvestor.rgImageUrl || null,
        cnhImageUrl: selectedInvestor.cnhImageUrl || null,
        proofOfResidenceUrl: selectedInvestor.proofOfResidenceUrl || null,
        driverLicense: selectedInvestor.driverLicense || "",
        emergencyContact: selectedInvestor.emergencyContact || "",
        street: selectedInvestor.street || "",
        complement: selectedInvestor.complement || "",
        neighborhood: selectedInvestor.neighborhood || "",
        city: selectedInvestor.city || "",
        state: selectedInvestor.state || "",
        zipCode: selectedInvestor.zipCode || "",
        monthlyDividend: totalDividend > 0 ? totalDividend.toString() : (selectedInvestor.monthlyDividend || ""),
        paymentDate: paymentDateStr,
        // Bonus data is stored on the vehicle, not the investor
        bonusDate: firstVehicle?.bonusDate || selectedInvestor.bonusDate || "",
        bonusValue: firstVehicle?.bonusValue || selectedInvestor.bonusValue || "",
      });

      // Initialize vehicle documents (reuse investorVehicles from above)
      const docsData: any = {};
      investorVehicles.forEach((vehicle: any) => {
        docsData[vehicle.id] = {
          crlvDocumentUrl: vehicle.crlvDocumentUrl || null,
          laudoCautelarUrl: vehicle.laudoCautelarUrl || null,
          laudoMecanicoUrl: vehicle.laudoMecanicoUrl || null,
          otherDocumentsUrls: (vehicle.otherDocumentsUrls || []).map((doc: string) => {
            try {
              return JSON.parse(doc);
            } catch {
              return { label: "", fileUrl: doc };
            }
          }),
        };
      });
      setVehicleDocsEditData(docsData);

      // Fetch vehicle inspections for all investor vehicles
      const fetchInspections = async () => {
        const inspectionsData: Record<string, any[]> = {};
        for (const vehicle of investorVehicles) {
          try {
            const response = await fetch(`/api/vehicles/${vehicle.id}/inspections`);
            if (response.ok) {
              const data = await response.json();
              inspectionsData[vehicle.id] = data;
            }
          } catch (error) {
            console.error(`Error fetching inspections for vehicle ${vehicle.id}:`, error);
          }
        }
        setVehicleInspections(inspectionsData);
      };
      fetchInspections();
    }
  }, [selectedInvestor, vehicles]);

  // Helper function to extract file extension from URL or base64 MIME type
  const getFileExtension = (url: string): string => {
    if (url.startsWith('data:')) {
      const mimeMatch = url.match(/^data:([^;]+);/);
      if (mimeMatch) {
        const mime = mimeMatch[1];
        const mimeToExt: Record<string, string> = {
          'application/pdf': '.pdf',
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
          'text/plain': '.txt',
        };
        return mimeToExt[mime] || '';
      }
      return '';
    }
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      if (lastDot === -1) return '';
      return pathname.substring(lastDot);
    } catch {
      const lastDot = url.lastIndexOf('.');
      if (lastDot === -1) return '';
      const extension = url.substring(lastDot);
      const questionMark = extension.indexOf('?');
      return questionMark === -1 ? extension : extension.substring(0, questionMark);
    }
  };

  // Helper function to download documents (handles both base64 and URLs)
  const handleDownload = async (url: string, baseFileName: string) => {
    try {
      const extension = getFileExtension(url);
      const fileName = `${baseFileName}${extension}`;
      
      let blob: Blob;
      
      if (url.startsWith('data:')) {
        const mimeMatch = url.match(/^data:([^;]+);base64,(.+)$/);
        if (!mimeMatch) {
          throw new Error('URL base64 malformada');
        }
        
        const mimeType = mimeMatch[1];
        const base64Data = mimeMatch[2];
        
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        blob = new Blob([bytes], { type: mimeType });
      } else {
        const response = await fetch(url);
        blob = await response.blob();
      }
      
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast({
        title: "Download iniciado",
        description: `O arquivo ${fileName} está sendo baixado.`,
      });
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  // Query for payment history
  const { data: paymentHistory } = useQuery<any[]>({
    queryKey: ["/api/investor-payments", selectedInvestor?.id],
    enabled: !!selectedInvestor?.id,
  });

  // Mutations
  const updateInvestorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Check for duplicate CPF if CPF is being changed
      if (data.cpf && selectedInvestor && data.cpf !== selectedInvestor.cpf) {
        const existingInvestor = investors?.find((inv: any) => inv.cpf === data.cpf && inv.id !== id);
        if (existingInvestor) {
          throw new Error("Já existe um investidor cadastrado com este CPF.");
        }
      }
      // Sanitize numeric fields - convert empty strings to null
      const sanitizedData = { ...data };
      if (sanitizedData.monthlyDividend === "" || sanitizedData.monthlyDividend === undefined) {
        sanitizedData.monthlyDividend = null;
      }
      if (sanitizedData.bonusValue === "" || sanitizedData.bonusValue === undefined) {
        sanitizedData.bonusValue = null;
      }
      if (sanitizedData.paymentDate === "" || sanitizedData.paymentDate === undefined || isNaN(sanitizedData.paymentDate)) {
        sanitizedData.paymentDate = null;
      }
      return await apiRequest("PATCH", `/api/investors/${id}`, sanitizedData);
    },
    onSuccess: async () => {
      await Promise.all([
        invalidate.investors(),
        invalidate.vehicles()
      ]);
      toast({
        title: "Investidor atualizado",
        description: "As informações foram salvas com sucesso!",
      });
      setEditInvestorDialogOpen(false);
      
      // Refresh selected investor data
      if (selectedInvestor) {
        const response = await apiRequest("GET", "/api/investors");
        const updatedInvestors = await response.json();
        const updated = updatedInvestors.find((inv: any) => inv.id === selectedInvestor.id);
        if (updated) {
          setSelectedInvestor(updated);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar investidor",
        description: error.message || "Ocorreu um erro ao atualizar o investidor.",
        variant: "destructive",
      });
    },
  });

  // Cancel investment mutation
  const cancelInvestmentMutation = useMutation({
    mutationFn: async ({ investorId, adminPassword, vehicleIds }: { investorId: string; adminPassword: string; vehicleIds?: string[] }) => {
      return await apiRequest("POST", `/api/investors/${investorId}/cancel-investment`, { adminPassword, vehicleIds });
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        invalidate.investors(),
        invalidate.vehicles(),
        invalidate.vehicleRequests()
      ]);
      
      const investorVehicles = vehicles ? vehicles.filter((v: any) => v.ownerId === variables.investorId && v.isInvestorVehicle) : [];
      const removedAll = !variables.vehicleIds || variables.vehicleIds.length === investorVehicles.length;
      
      if (removedAll) {
        toast({
          title: "Investimento cancelado",
          description: "O investidor e todos os seus veículos foram removidos da base.",
        });
        setInvestorDetailsDialogOpen(false);
        setSelectedInvestor(null);
      } else {
        toast({
          title: "Veículos removidos",
          description: `${variables.vehicleIds?.length} veículo(s) removido(s) do investidor.`,
        });
        // Refresh investor data
        const response = await apiRequest("GET", "/api/investors");
        const updatedInvestors = await response.json();
        const updated = updatedInvestors.find((inv: any) => inv.id === variables.investorId);
        if (updated) {
          setSelectedInvestor(updated);
        }
      }
      
      setCancelInvestmentDialogOpen(false);
      setAdminPasswordForCancel("");
      setSelectedVehiclesToCancel([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar investimento",
        description: error.message || "Ocorreu um erro ao cancelar o investimento.",
        variant: "destructive",
      });
      setAdminPasswordForCancel("");
    },
  });

  // Add vehicle to investor mutation
  const addVehicleToInvestorMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/investments", data);
    },
    onSuccess: () => {
      toast({
        title: "Veículo adicionado",
        description: "O veículo foi adicionado ao investidor com sucesso!",
      });
      setAddVehicleDialogOpen(false);
      resetAddVehicleForm();
      
      invalidate.investors();
      invalidate.vehicles();
      
      if (selectedInvestor) {
        apiRequest("GET", "/api/investors").then(response => response.json()).then(updatedInvestors => {
          const updated = updatedInvestors.find((inv: any) => inv.id === selectedInvestor.id);
          if (updated) setSelectedInvestor(updated);
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar veículo",
        description: error.message || "Ocorreu um erro ao adicionar o veículo.",
        variant: "destructive",
      });
    },
  });

  // Reset add vehicle form
  const resetAddVehicleForm = () => {
    setAddVehicleStep(1);
    setAddVehicleSubmitting(false);
    setWizardInvestorData({});
    setWizardInvestorDocs({ comprovanteResidencia: null, cnh: null });
    setNewVehicleData({
      vehicleName: "",
      category: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      transmission: "",
      fuel: "",
      seats: 5,
      imageUrl: "",
      licensePlate: "",
      chassi: "",
      fipeValue: "",
      customDividend: "",
      hasBonus: false,
      bonusDate: "",
      bonusValue: "",
      temDocumento: null,
      observacoesDocumento: "",
      ipvaStatus: null,
      ipvaValue: "",
      licenciamentoPago: null,
      observacoesLicenciamento: "",
      hasInsurance: null,
      insuranceValue: "",
      taFinanciado: null,
      observacoesFinanciado: "",
      eDeLeilao: null,
      observacoesLeilao: "",
      temRastreador: null,
      localizacaoRastreador: "",
      temMultas: null,
      observacoesMultas: "",
      problemaMecanico: "",
      observacoesAvarias: "",
    });
    setWizardBankData({});
    setNewVehiclePhotos({ front: "", back: "", rightSide: "", leftSide: "", display: "" });
    setHasDamages(null);
    setDamagePhotos({});
    setNewVehicleDocs({ crlv: "", laudoCautelar: "", laudoMecanico: "" });
    setWizardContractData(null);
    setFipeBrands([]);
    setFipeModels([]);
    setFipeYears([]);
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
  };
  
  // Initialize wizard with investor data when opening
  const initializeAddVehicleWizard = () => {
    if (!selectedInvestor) return;
    
    setWizardInvestorData({
      name: selectedInvestor.name || "",
      cpf: selectedInvestor.cpf || "",
      rg: selectedInvestor.rg || "",
      email: selectedInvestor.email || "",
      phone: selectedInvestor.phone || "",
      driverLicense: selectedInvestor.driverLicense || "",
      emergencyContact: selectedInvestor.emergencyContact || "",
      street: selectedInvestor.street || "",
      complement: selectedInvestor.complement || "",
      neighborhood: selectedInvestor.neighborhood || "",
      city: selectedInvestor.city || "",
      state: selectedInvestor.state || "",
      zipCode: selectedInvestor.zipCode || "",
    });
    
    setWizardInvestorDocs({
      comprovanteResidencia: selectedInvestor.proofOfResidenceUrl || null,
      cnh: selectedInvestor.cnhImageUrl || null,
    });
    
    setWizardBankData({
      paymentDay: selectedInvestor.paymentDate || null,
      bonusDate: selectedInvestor.bonusDate || "",
      bonusValue: selectedInvestor.bonusValue || "",
    });
    
    // Reset vehicle data
    setNewVehicleData({
      vehicleName: "",
      category: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      transmission: "",
      fuel: "",
      seats: 5,
      imageUrl: "",
      licensePlate: "",
      chassi: "",
      fipeValue: "",
      customDividend: "",
      hasBonus: false,
      bonusDate: "",
      bonusValue: "",
      temDocumento: null,
      observacoesDocumento: "",
      ipvaStatus: null,
      ipvaValue: "",
      licenciamentoPago: null,
      observacoesLicenciamento: "",
      hasInsurance: null,
      insuranceValue: "",
      taFinanciado: null,
      observacoesFinanciado: "",
      eDeLeilao: null,
      observacoesLeilao: "",
      temRastreador: null,
      localizacaoRastreador: "",
      temMultas: null,
      observacoesMultas: "",
      problemaMecanico: "",
      observacoesAvarias: "",
    });
    
    // Reset photos and docs
    setNewVehiclePhotos({ front: "", back: "", rightSide: "", leftSide: "", display: "" });
    setNewVehicleDocs({ crlv: "", laudoCautelar: "", laudoMecanico: "" });
    setHasDamages(null);
    setDamagePhotos({});
    setWizardContractData(null);
    
    // Reset FIPE selections
    setSelectedBrand("");
    setSelectedModel("");
    setSelectedYear("");
    setFipeModels([]);
    setFipeYears([]);
    
    setAddVehicleStep(1);
    setAddVehicleDialogOpen(true);
    fetchFipeBrands();
  };

  // FIPE functions
  const fetchFipeBrands = async () => {
    try {
      setLoadingFipe(true);
      const response = await fetch("https://parallelum.com.br/fipe/api/v2/cars/brands");
      const data = await response.json();
      setFipeBrands(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar marcas FIPE:", error);
      setFipeBrands([]);
    } finally {
      setLoadingFipe(false);
    }
  };

  const fetchFipeModels = async (brandId: string) => {
    setFipeModels([]);
    setFipeYears([]);
    setSelectedModel("");
    setSelectedYear("");
    setNewVehicleData(prev => ({ ...prev, vehicleName: "", brand: "", model: "", year: new Date().getFullYear(), fuel: "", fipeValue: "" }));
    
    try {
      setLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models`);
      const data = await response.json();
      setFipeModels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar modelos FIPE:", error);
      setFipeModels([]);
    } finally {
      setLoadingFipe(false);
    }
  };

  const fetchFipeYears = async (brandId: string, modelId: string) => {
    setFipeYears([]);
    setSelectedYear("");
    setNewVehicleData(prev => ({ ...prev, vehicleName: "", fipeValue: "" }));
    
    try {
      setLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models/${modelId}/years`);
      const data = await response.json();
      setFipeYears(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar anos FIPE:", error);
      setFipeYears([]);
    } finally {
      setLoadingFipe(false);
    }
  };

  const consultarFipe = async (brandId: string, modelId: string, yearId: string) => {
    try {
      setLoadingFipe(true);
      const response = await fetch(`https://parallelum.com.br/fipe/api/v2/cars/brands/${brandId}/models/${modelId}/years/${yearId}`);
      const data = await response.json();
      
      if (data.price) {
        const brandName = fipeBrands.find(b => b.code === brandId)?.name || "";
        const modelName = fipeModels.find(m => m.code === modelId)?.name || "";
        const yearName = fipeYears.find(y => y.code === yearId)?.name || "";
        const yearNumber = parseInt(yearName) || new Date().getFullYear();
        
        setNewVehicleData(prev => ({
          ...prev,
          vehicleName: `${brandName} ${modelName}`.trim(),
          brand: brandName,
          model: modelName,
          year: yearNumber,
          fuel: data.fuel || "",
          fipeValue: data.price,
        }));
      }
    } catch (error) {
      console.error("Erro ao consultar FIPE:", error);
      toast({
        title: "Erro ao consultar FIPE",
        description: "Não foi possível buscar o valor do veículo.",
        variant: "destructive",
      });
    } finally {
      setLoadingFipe(false);
    }
  };

  // Image compression function
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const maxFileSize = 50 * 1024 * 1024;
      if (file.size > maxFileSize) {
        reject(new Error('Arquivo muito grande. Tamanho máximo: 50MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const resizeWithQuality = (maxDim: number, qual: number): string => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
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
            if (!ctx) throw new Error('Não foi possível processar a imagem');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            return canvas.toDataURL('image/jpeg', qual);
          };

          const maxTargetSize = 200 * 1024;
          let result = resizeWithQuality(1200, 0.75);
          if (result.length <= maxTargetSize) { resolve(result); return; }
          result = resizeWithQuality(1000, 0.65);
          if (result.length <= maxTargetSize) { resolve(result); return; }
          result = resizeWithQuality(800, 0.55);
          if (result.length <= maxTargetSize) { resolve(result); return; }
          result = resizeWithQuality(600, 0.50);
          resolve(result);
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  };

  // Handle vehicle photo upload
  const handleVehiclePhotoUpload = async (file: File, photoType: 'front' | 'back' | 'rightSide' | 'leftSide' | 'main') => {
    try {
      setProcessingPhoto(true);
      const compressed = await compressImage(file);
      if (photoType === 'main') {
        setNewVehicleData(prev => ({ ...prev, imageUrl: compressed }));
      } else {
        setNewVehiclePhotos(prev => ({ ...prev, [photoType]: compressed }));
      }
      toast({ title: "Foto adicionada", description: "Imagem processada com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro ao processar foto", description: error.message, variant: "destructive" });
    } finally {
      setProcessingPhoto(false);
    }
  };

  // Handle inspection photo upload for existing vehicles
  const handleInspectionPhotoUpload = async (vehicleId: string, file: File, imageType: string) => {
    try {
      setUploadingInspectionVehicleId(vehicleId);
      const compressed = await compressImage(file);
      
      const response = await fetch(`/api/vehicles/${vehicleId}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'evaluation',
          imageUrl: compressed,
          imageType: imageType,
          notes: `Foto de vistoria - ${imageType}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload inspection photo');
      }

      // Refresh inspections for this vehicle
      const inspectionsResponse = await fetch(`/api/vehicles/${vehicleId}/inspections`);
      if (inspectionsResponse.ok) {
        const data = await inspectionsResponse.json();
        setVehicleInspections(prev => ({ ...prev, [vehicleId]: data }));
      }

      toast({ title: "Foto de vistoria adicionada", description: "A foto foi salva com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar foto", description: error.message || "Não foi possível salvar a foto.", variant: "destructive" });
    } finally {
      setUploadingInspectionVehicleId(null);
    }
  };

  // Handle inspection photo delete
  const handleDeleteInspectionPhoto = async (vehicleId: string, inspectionId: number) => {
    if (!confirm('Tem certeza que deseja remover esta foto?')) return;
    
    try {
      const response = await fetch(`/api/vehicle-inspections/${inspectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover foto');
      }

      // Refresh inspections for this vehicle
      const inspectionsResponse = await fetch(`/api/vehicles/${vehicleId}/inspections`);
      if (inspectionsResponse.ok) {
        const data = await inspectionsResponse.json();
        setVehicleInspections(prev => ({ ...prev, [vehicleId]: data }));
      }

      toast({ title: "Foto removida", description: "A foto de vistoria foi removida com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro ao remover foto", description: error.message || "Não foi possível remover a foto.", variant: "destructive" });
    }
  };

  // Handle submit new vehicle
  const handleSubmitNewVehicle = () => {
    if (!selectedInvestor) return;
    
    // Build payload in the format expected by /api/admin/investments
    const payload = {
      customer: {
        name: selectedInvestor.name || wizardInvestorData?.name,
        email: selectedInvestor.email || wizardInvestorData?.email,
        phone: selectedInvestor.phone || wizardInvestorData?.phone,
        cpf: selectedInvestor.cpf || wizardInvestorData?.cpf,
        rg: selectedInvestor.rg || wizardInvestorData?.rg,
        driverLicense: selectedInvestor.driverLicense || wizardInvestorData?.driverLicense,
        emergencyContact: selectedInvestor.emergencyContact || wizardInvestorData?.emergencyContact,
        street: selectedInvestor.street || wizardInvestorData?.street,
        complement: selectedInvestor.complement || wizardInvestorData?.complement,
        neighborhood: selectedInvestor.neighborhood || wizardInvestorData?.neighborhood,
        city: selectedInvestor.city || wizardInvestorData?.city,
        state: selectedInvestor.state || wizardInvestorData?.state,
        zipCode: selectedInvestor.zipCode || wizardInvestorData?.zipCode,
      },
      vehicle: {
        brand: newVehicleData.brand,
        model: newVehicleData.model,
        category: newVehicleData.category,
        year: newVehicleData.year,
        transmission: newVehicleData.transmission,
        fuel: newVehicleData.fuel,
        seats: newVehicleData.seats,
        plate: newVehicleData.licensePlate,
        chassi: newVehicleData.chassi,
        fipeValue: newVehicleData.fipeValue,
      },
      vehicleInfo: {
        temDocumento: newVehicleData.temDocumento,
        observacoesDocumento: newVehicleData.observacoesDocumento || null,
        ipvaPago: newVehicleData.ipvaStatus,
        valorIpva: newVehicleData.ipvaValue || null,
        licenciamentoPago: newVehicleData.licenciamentoPago,
        observacoesLicenciamento: newVehicleData.observacoesLicenciamento || null,
        temSeguro: newVehicleData.hasInsurance,
        valorSeguro: newVehicleData.insuranceValue || null,
        taFinanciado: newVehicleData.taFinanciado,
        observacoesFinanciado: newVehicleData.observacoesFinanciado || null,
        eDeLeilao: newVehicleData.eDeLeilao,
        observacoesLeilao: newVehicleData.observacoesLeilao || null,
        temRastreador: newVehicleData.temRastreador,
        localizacaoRastreador: newVehicleData.localizacaoRastreador || null,
        temMultas: newVehicleData.temMultas,
        observacoesMultas: newVehicleData.observacoesMultas || null,
        problemaMecanico: newVehicleData.problemaMecanico || null,
      },
      inspectionPhotos: {
        frente: newVehiclePhotos.display || newVehiclePhotos.front || null,
        fundo: newVehiclePhotos.back || null,
        lateral_esquerda: newVehiclePhotos.leftSide || null,
        lateral_direita: newVehiclePhotos.rightSide || null,
        notes: hasDamages ? newVehicleData.observacoesAvarias : null,
        hasDamages: hasDamages || false,
        damageNotes: hasDamages ? newVehicleData.observacoesAvarias : null,
        damagePhotos: Object.values(damagePhotos).filter(Boolean),
      },
      additionalDocs: {
        crlv: newVehicleDocs.crlv || null,
        laudoCautelar: newVehicleDocs.laudoCautelar || null,
        laudoMecanico: newVehicleDocs.laudoMecanico || null,
      },
      bankData: {
        bankName: selectedInvestor.bankName || '',
        bankCode: selectedInvestor.bankCode || '',
        agency: selectedInvestor.agency || '',
        agencyDigit: selectedInvestor.agencyDigit || null,
        accountNumber: selectedInvestor.accountNumber || '',
        accountDigit: selectedInvestor.accountDigit || '',
        accountType: selectedInvestor.accountType || '',
        accountHolder: selectedInvestor.accountHolder || '',
        accountHolderDocument: selectedInvestor.accountHolderDocument || '',
        pixKeyType: selectedInvestor.pixKeyType || null,
        pixKey: selectedInvestor.pixKey || null,
        paymentDay: wizardBankData.paymentDay || selectedInvestor.paymentDate || null,
        bonusDate: wizardBankData.bonusDate || selectedInvestor.bonusDate || null,
        bonusValue: wizardBankData.bonusValue || selectedInvestor.bonusValue || null,
      },
      contract: wizardContractData ? {
        fileName: wizardContractData.fileName,
        fileUrl: wizardContractData.fileUrl,
      } : null,
      customDividend: newVehicleData.customDividend || '0',
      vehicleBonus: newVehicleData.hasBonus ? {
        bonusDate: newVehicleData.bonusDate || null,
        bonusValue: newVehicleData.bonusValue || null,
      } : null,
      investorDocuments: {
        comprovanteResidencia: wizardInvestorDocs?.comprovanteResidencia || selectedInvestor.proofOfResidenceUrl || null,
        cnh: wizardInvestorDocs?.cnh || selectedInvestor.cnhImageUrl || null,
      },
      createInvestorAccount: false, // Investor already exists
    };
    
    addVehicleToInvestorMutation.mutate(payload);
  };

  // Calculate investor statistics
  const calculateInvestorStats = (investor: any) => {
    const investorVehicles = vehicles?.filter((v: any) => v.ownerId === investor.id && v.isInvestorVehicle) || [];
    
    const totalInvestment = investorVehicles.reduce((sum: number, v: any) => {
      return sum + (parseFloat(v.fipeValue || "0"));
    }, 0);

    // Aggregate monthly dividend from all vehicles owned by this investor
    const monthlyDividend = investorVehicles.reduce((sum: number, v: any) => {
      return sum + (parseFloat(v.customDividend || "0"));
    }, 0);
    const totalVehicles = investorVehicles.length;
    
    // Calculate total dividends paid based on time elapsed and payment date
    let totalDividendsPaid = 0;
    
    if (investor.createdAt && investor.paymentDate && monthlyDividend > 0) {
      const createdDate = new Date(investor.createdAt);
      const today = new Date();
      const paymentDay = investor.paymentDate; // Dia do mês (1-31)
      
      // Calculate how many complete months have passed since creation
      let monthsPaid = differenceInMonths(today, createdDate);
      
      // Check if we should count the current month
      // If today is before the payment day of the current month, don't count this month yet
      const currentMonthPaymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
      if (isBefore(today, currentMonthPaymentDate)) {
        // Current month payment hasn't happened yet
        // Don't subtract anything, monthsPaid is already correct
      } else {
        // Current month payment has already happened, add 1 to include it
        monthsPaid += 1;
      }
      
      // Check if the first month should be counted
      // If investor was created after the payment day of the creation month, don't count that month
      const creationMonthPaymentDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), paymentDay);
      if (isAfter(createdDate, creationMonthPaymentDate)) {
        // Created after payment day, so first month doesn't count
        monthsPaid -= 1;
      }
      
      // Ensure we don't have negative months
      monthsPaid = Math.max(0, monthsPaid);
      
      totalDividendsPaid = monthsPaid * monthlyDividend;
    }

    // Calculate ROI (Return on Investment)
    const roi = totalInvestment > 0 ? (totalDividendsPaid / totalInvestment) * 100 : 0;

    // Calculate average dividend per vehicle
    const avgDividendPerVehicle = totalVehicles > 0 ? monthlyDividend / totalVehicles : 0;

    // Calculate total bonus from all vehicles
    const vehiclesWithBonus = investorVehicles.filter((v: any) => v.bonusValue && parseFloat(v.bonusValue) > 0);
    const totalBonus = vehiclesWithBonus.reduce((sum: number, v: any) => {
      return sum + parseFloat(v.bonusValue || "0");
    }, 0);
    
    // Include legacy customer bonus if exists
    const customerBonus = investor.bonusValue ? parseFloat(investor.bonusValue) : 0;
    const grandTotalBonus = totalBonus + (vehiclesWithBonus.length === 0 ? customerBonus : 0);

    // Aggregate payment dates from all vehicles (unique, sorted)
    // Each vehicle can have multiple dates in format "16" or "16/20/30"
    const allVehicleDates: number[] = [];
    investorVehicles.forEach((v: any) => {
      if (v.paymentDate) {
        const dates = String(v.paymentDate).split('/').map((d: string) => parseInt(d.trim())).filter((d: number) => !isNaN(d) && d > 0 && d <= 31);
        allVehicleDates.push(...dates);
      }
    });
    
    // Add customer payment date if no vehicle has a payment date
    if (allVehicleDates.length === 0 && investor.paymentDate) {
      const customerDates = String(investor.paymentDate).split('/').map((d: string) => parseInt(d.trim())).filter((d: number) => !isNaN(d) && d > 0 && d <= 31);
      allVehicleDates.push(...customerDates);
    }
    
    // Get unique sorted payment dates
    const uniquePaymentDates = [...new Set(allVehicleDates)].sort((a: number, b: number) => a - b);
    
    // Format payment dates as "Dia 7" or "Dia 7/15/30"
    const paymentDatesFormatted = uniquePaymentDates.length > 0 
      ? `Dia ${uniquePaymentDates.join('/')}`
      : null;

    return {
      totalInvestment,
      monthlyDividend,
      totalVehicles,
      totalDividendsPaid,
      roi,
      avgDividendPerVehicle,
      investorVehicles,
      vehiclesWithBonus,
      totalBonus: grandTotalBonus,
      bonusCount: vehiclesWithBonus.length > 0 ? vehiclesWithBonus.length : (customerBonus > 0 ? 1 : 0),
      uniquePaymentDates,
      paymentDatesFormatted
    };
  };

  // Filter and sort investors (most recent first)
  const filteredInvestors = (investors || [])
    .filter((investor: any) => {
      if (!searchTerm) return true;
      
      const search = searchTerm.toLowerCase();
      return (
        investor.name?.toLowerCase().includes(search) ||
        investor.email?.toLowerCase().includes(search) ||
        investor.cpf?.includes(searchTerm) ||
        investor.phone?.includes(searchTerm)
      );
    })
    .sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Most recent first
    });

  // Calculate overall statistics
  const overallStats = {
    totalInvestors: investors?.length || 0,
    activeInvestors: investors?.filter((inv: any) => {
      const investorVehicles = vehicles?.filter((v: any) => v.ownerId === inv.id && v.isInvestorVehicle);
      return investorVehicles && investorVehicles.length > 0;
    }).length || 0,
    totalVehiclesInFleet: vehicles?.filter((v: any) => v.isInvestorVehicle).length || 0,
    totalMonthlyDividends: investors?.reduce((sum: number, inv: any) => {
      // Aggregate dividends from all vehicles owned by this investor
      const investorVehicles = vehicles?.filter((v: any) => v.ownerId === inv.id && v.isInvestorVehicle) || [];
      const investorDividend = investorVehicles.reduce((vehicleSum: number, v: any) => {
        return vehicleSum + parseFloat(v.customDividend || "0");
      }, 0);
      return sum + investorDividend;
    }, 0) || 0,
  };

  const handleExportExcel = () => {
    const sortedInvestors = [...(investors || [])].sort((a: any, b: any) =>
      (a.name || "").localeCompare(b.name || "", "pt-BR")
    );

    const rows: any[] = [];

    sortedInvestors.forEach((investor: any, investorIdx: number) => {
      const stats = calculateInvestorStats(investor);
      const investorVehicles = [...stats.investorVehicles].sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || "", "pt-BR")
      );

      const investorData = {
        "Investidor": investor.name || "",
        "CPF": investor.cpf || "",
        "RG": investor.rg || "",
        "CNH": investor.driverLicense || "",
        "Email": investor.email || "",
        "Telefone": investor.phone || "",
        "Cidade": investor.city || "",
        "Estado": investor.state || "",
        "Endereço": investor.street || "",
        "Bairro": investor.neighborhood || "",
        "CEP": investor.zipCode || "",
        "Banco": investor.bankName || "",
        "Agência": investor.agency || "",
        "Conta": investor.accountNumber || "",
        "Chave PIX": investor.pixKey || "",
        "Dividendo Mensal Total": `R$ ${stats.monthlyDividend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        "Dia Pagamento": stats.paymentDatesFormatted || "",
      };

      if (investorVehicles.length === 0) {
        rows.push({
          ...investorData,
          "Veículo": "", "Placa": "", "Ano": "", "Categoria": "", "Valor FIPE": "", "Dividendo Veículo": "",
        });
      } else {
        investorVehicles.forEach((vehicle: any, idx: number) => {
          rows.push({
            ...(idx === 0 ? investorData : {
              "Investidor": "", "CPF": "", "RG": "", "CNH": "", "Email": "",
              "Telefone": "", "Cidade": "", "Estado": "", "Endereço": "", "Bairro": "",
              "CEP": "", "Banco": "", "Agência": "", "Conta": "", "Chave PIX": "",
              "Dividendo Mensal Total": "", "Dia Pagamento": "",
            }),
            "Veículo": vehicle.name || "",
            "Placa": vehicle.licensePlate || "",
            "Ano": vehicle.year || "",
            "Categoria": vehicle.category || "",
            "Valor FIPE": vehicle.fipeValue ? `R$ ${parseFloat(vehicle.fipeValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "",
            "Dividendo Veículo": vehicle.customDividend ? `R$ ${parseFloat(vehicle.customDividend).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "",
          });
        });
      }

    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Investidores");

    const colWidths = [
      { wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 28 },
      { wch: 16 }, { wch: 16 }, { wch: 6 }, { wch: 30 }, { wch: 18 },
      { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 22 },
      { wch: 20 }, { wch: 14 }, { wch: 32 }, { wch: 10 }, { wch: 6 },
      { wch: 12 }, { wch: 16 }, { wch: 18 },
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `Investidores_Imobilicar_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({
      title: "Exportação concluída",
      description: `${sortedInvestors.length} investidores exportados com sucesso.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Investidores</CardTitle>
              <CardDescription>
                Gestão completa de investidores e seus veículos
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                data-testid="button-export-investors-excel"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              {onOpenInvestmentWizard && (
                <Button 
                  onClick={onOpenInvestmentWizard}
                  data-testid="button-register-investor"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar investidor
                </Button>
              )}
            </div>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Investidores</p>
                    <p className="text-2xl font-bold" data-testid="text-total-investors">
                      {overallStats.totalInvestors}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Investidores Ativos</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-active-investors">
                      {overallStats.activeInvestors}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Veículos na Frota</p>
                    <p className="text-2xl font-bold" data-testid="text-total-fleet-vehicles">
                      {overallStats.totalVehiclesInFleet}
                    </p>
                  </div>
                  <Car className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dividendos Mensais</p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-total-monthly-dividends">
                      R$ {overallStats.totalMonthlyDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mt-6">
            <Input
              placeholder="Buscar por nome, CPF, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-investors"
              className="max-w-md"
            />
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading state */}
          {isLoading.investors ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando investidores...</p>
            </div>
          ) : filteredInvestors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum investidor encontrado com os critérios de busca." : "Nenhum investidor cadastrado ainda."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredInvestors.map((investor: any) => {
                const stats = calculateInvestorStats(investor);
                const hasVehicles = stats.totalVehicles > 0;

                return (
                  <Card 
                    key={investor.id} 
                    className="overflow-hidden hover-elevate cursor-pointer transition-all" 
                    data-testid={`card-investor-${investor.id}`}
                    onClick={() => {
                      setSelectedInvestor(investor);
                      setInvestorDetailsDialogOpen(true);
                    }}
                  >
                    <div className="p-6 space-y-6">
                      {/* Header com nome e status */}
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl font-bold tracking-tight" data-testid={`text-investor-name-${investor.id}`}>
                                {investor.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {hasVehicles ? (
                                  <Badge variant="default" className="shadow-sm">
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950">
                                    Sem veículos
                                  </Badge>
                                )}
                                {investor.createdAt && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid={`text-investor-created-at-${investor.id}`}>
                                    <Calendar className="h-3 w-3" />
                                    Cadastrado em {format(new Date(investor.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Informações de Contato */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">CPF</p>
                            <p className="font-mono font-medium truncate" data-testid={`text-investor-cpf-${investor.id}`}>
                              {formatCPF(investor.cpf)}
                            </p>
                          </div>
                        </div>
                        {investor.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="font-medium truncate">{investor.email}</p>
                            </div>
                          </div>
                        )}
                        {investor.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Telefone</p>
                              <p className="font-medium">{formatPhone(investor.phone)}</p>
                            </div>
                          </div>
                        )}
                        {(investor.city || investor.state) && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Localização</p>
                              <p className="font-medium truncate">
                                {investor.city}{investor.city && investor.state && '/'}{investor.state}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Estatísticas de Investimento */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-xs font-medium text-muted-foreground">Veículos na Frota</p>
                          </div>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid={`text-investor-vehicles-${investor.id}`}>
                            {stats.totalVehicles}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {hasVehicles ? 'Ativos no sistema' : 'Nenhum veículo cadastrado'}
                          </p>
                        </div>

                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-xs font-medium text-muted-foreground">Dividendo Mensal</p>
                          </div>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid={`text-investor-dividend-${investor.id}`}>
                            R$ {stats.monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {stats.paymentDatesFormatted && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Pagamento {stats.paymentDatesFormatted}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investor Details Dialog */}
      <Dialog open={investorDetailsDialogOpen} onOpenChange={setInvestorDetailsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle>Detalhes do Investidor</DialogTitle>
                <DialogDescription>
                  Informações completas e histórico do investidor
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={initializeAddVehicleWizard}
                  data-testid="button-header-add-vehicle"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Veículo
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setCancelInvestmentDialogOpen(true)}
                  data-testid="button-cancel-investment"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Investimento
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedInvestor && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info" data-testid="tab-investor-info">Informações</TabsTrigger>
                <TabsTrigger value="vehicles" data-testid="tab-investor-vehicles">Veículos</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-investor-documents">Documentos</TabsTrigger>
                <TabsTrigger value="statistics" data-testid="tab-investor-statistics">Estatísticas</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="info" className="space-y-4">
                {(() => {
                  const stats = calculateInvestorStats(selectedInvestor);
                  
                  return (
                    <>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-base">Dados Pessoais</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditInvestorDialogOpen(true)}
                            data-testid="button-edit-investor"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Nome Completo</p>
                            <p className="font-medium" data-testid="text-investor-detail-name">{selectedInvestor.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">CPF</p>
                            <p className="font-medium font-mono" data-testid="text-investor-detail-cpf">{formatCPF(selectedInvestor.cpf)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">RG</p>
                            <p className="font-medium" data-testid="text-investor-detail-rg">{selectedInvestor.rg || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">CNH</p>
                            <p className="font-medium" data-testid="text-investor-detail-cnh">{selectedInvestor.driverLicense || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                            <p className="font-medium" data-testid="text-investor-detail-birthdate">
                              {selectedInvestor.birthDate ? new Date(selectedInvestor.birthDate + 'T00:00:00').toLocaleDateString('pt-BR') : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium" data-testid="text-investor-detail-email">{selectedInvestor.email || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Telefone</p>
                            <p className="font-medium" data-testid="text-investor-detail-phone">
                              {selectedInvestor.phone ? formatPhone(selectedInvestor.phone) : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Contato de Emergência</p>
                            <p className="font-medium" data-testid="text-investor-detail-emergency">
                              {selectedInvestor.emergencyContact || "—"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Endereço</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">Rua</p>
                            <p className="font-medium" data-testid="text-investor-detail-street">{selectedInvestor.street || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Complemento</p>
                            <p className="font-medium" data-testid="text-investor-detail-complement">{selectedInvestor.complement || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Bairro</p>
                            <p className="font-medium" data-testid="text-investor-detail-neighborhood">{selectedInvestor.neighborhood || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Cidade</p>
                            <p className="font-medium" data-testid="text-investor-detail-city">{selectedInvestor.city || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Estado</p>
                            <p className="font-medium" data-testid="text-investor-detail-state">{selectedInvestor.state || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">CEP</p>
                            <p className="font-medium" data-testid="text-investor-detail-zipcode">
                              {selectedInvestor.zipCode ? formatCEP(selectedInvestor.zipCode) : "—"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-base">Informações de Investimento</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditInvestorDialogOpen(true)}
                            data-testid="button-edit-investor-investment"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Dividendo Mensal</p>
                            <p className="font-medium text-lg text-primary" data-testid="text-investor-detail-monthly-dividend">
                              R$ {stats.monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Dia de Pagamento</p>
                            <p className="font-medium" data-testid="text-investor-detail-payment-day">
                              {stats.paymentDatesFormatted || "Não definido"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data do Bônus</p>
                            <p className="font-medium" data-testid="text-investor-detail-bonus-date">
                              {stats.investorVehicles[0]?.bonusDate || selectedInvestor.bonusDate || "Não definido"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Valor do Bônus</p>
                            <p className="font-medium text-lg text-primary" data-testid="text-investor-detail-bonus-value">
                              {(() => {
                                const bonusVal = stats.investorVehicles[0]?.bonusValue || selectedInvestor.bonusValue;
                                return bonusVal ? `R$ ${parseFloat(bonusVal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Não definido";
                              })()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Dados Bancários Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Dados Bancários
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Banco</p>
                            <p className="font-medium" data-testid="text-investor-detail-bank-name">
                              {selectedInvestor.bankName || "Não informado"}
                              {selectedInvestor.bankCode && ` (${selectedInvestor.bankCode})`}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Agência</p>
                            <p className="font-medium" data-testid="text-investor-detail-agency">
                              {selectedInvestor.agency ? 
                                `${selectedInvestor.agency}${selectedInvestor.agencyDigit ? `-${selectedInvestor.agencyDigit}` : ''}` 
                                : "Não informado"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Conta</p>
                            <p className="font-medium" data-testid="text-investor-detail-account">
                              {selectedInvestor.accountNumber ? 
                                `${selectedInvestor.accountNumber}${selectedInvestor.accountDigit ? `-${selectedInvestor.accountDigit}` : ''}` 
                                : "Não informado"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tipo de Conta</p>
                            <p className="font-medium" data-testid="text-investor-detail-account-type">
                              {selectedInvestor.accountType === 'conta_corrente' ? 'Conta Corrente' :
                               selectedInvestor.accountType === 'conta_poupanca' ? 'Conta Poupança' :
                               selectedInvestor.accountType === 'conta_pagamento' ? 'Conta Pagamento' :
                               selectedInvestor.accountType || "Não informado"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Titular da Conta</p>
                            <p className="font-medium" data-testid="text-investor-detail-account-holder">
                              {selectedInvestor.accountHolder || "Não informado"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">CPF/CNPJ do Titular</p>
                            <p className="font-medium" data-testid="text-investor-detail-account-holder-doc">
                              {selectedInvestor.accountHolderDocument || "Não informado"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Chave PIX</p>
                            <p className="font-medium" data-testid="text-investor-detail-pix-key">
                              {selectedInvestor.pixKey ? (
                                <>
                                  {selectedInvestor.pixKeyType && (
                                    <span className="text-muted-foreground">
                                      ({selectedInvestor.pixKeyType === 'cpf' ? 'CPF' :
                                        selectedInvestor.pixKeyType === 'cnpj' ? 'CNPJ' :
                                        selectedInvestor.pixKeyType === 'email' ? 'E-mail' :
                                        selectedInvestor.pixKeyType === 'telefone' ? 'Telefone' :
                                        selectedInvestor.pixKeyType === 'aleatoria' ? 'Aleatória' :
                                        selectedInvestor.pixKeyType})
                                    </span>
                                  )} {selectedInvestor.pixKey}
                                </>
                              ) : "Não informado"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </TabsContent>

              {/* Vehicles Tab */}
              <TabsContent value="vehicles" className="space-y-4">
                {(() => {
                  const stats = calculateInvestorStats(selectedInvestor);
                  
                  // Labels for inspection photo types
                  const imageTypeLabels: Record<string, string> = {
                    'front': 'Frente',
                    'back': 'Fundo',
                    'left_side': 'Lateral Esquerda',
                    'right_side': 'Lateral Direita',
                    'motor': 'Motor',
                    'step': 'Step/Macaco/Triângulo',
                    'tire1': 'Pneu 1',
                    'tire2': 'Pneu 2',
                    'tire3': 'Pneu 3',
                    'tire4': 'Pneu 4',
                    'chassi': 'Chassi',
                    'odometer': 'Odômetro',
                    'fuel_level': 'Nível de Combustível',
                    'interior': 'Interior',
                    'trunk': 'Porta-Malas',
                    'dashboard': 'Painel',
                    'notes': 'Observações',
                    'other': 'Outra',
                  };
                  
                  return (
                    <>
                      {stats.investorVehicles.length === 0 ? (
                        <div className="text-center py-12">
                          <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Este investidor ainda não possui veículos na frota.</p>
                        </div>
                      ) : (
                    <div className="space-y-4">
                      {stats.investorVehicles.map((vehicle: any) => {
                        // Get inspection photos for this vehicle
                        const inspections = vehicleInspections[vehicle.id] || [];
                        const inspectionPhotos = inspections.filter((i: any) => i.imageUrl && i.type === 'evaluation');
                        
                        // Get damage photos for this vehicle
                        const damagePhotos = inspections.filter((i: any) => i.imageUrl && (i.type === 'damage' || i.imageType === 'damage_detail'));
                        
                        // Get vehicle documents (Contrato de Investimento fica apenas na aba Documentos)
                        const vehicleDocs = [
                          { label: "CRLV", url: vehicle.crlvDocumentUrl },
                          { label: "Laudo Cautelar", url: vehicle.laudoCautelarUrl },
                          { label: "Laudo Mecânico", url: vehicle.laudoMecanicoUrl },
                        ].filter(doc => doc.url);
                        
                        // Parse other documents
                        const otherDocs = (vehicle.otherDocumentsUrls || []).map((docString: string) => {
                          try {
                            const parsed = JSON.parse(docString);
                            return {
                              label: parsed.label || 'Documento',
                              url: parsed.fileUrl || docString
                            };
                          } catch {
                            return {
                              label: 'Documento',
                              url: docString
                            };
                          }
                        }).filter((doc: any) => doc.url);

                        return (
                          <Card key={vehicle.id} data-testid={`card-vehicle-${vehicle.id}`}>
                            <div className="flex flex-col gap-4 p-4">
                              <div className="flex flex-col md:flex-row gap-4">
                                <div className={`w-full md:w-48 aspect-[4/3] rounded-lg overflow-hidden flex-shrink-0 ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'bg-gray-900' : 'bg-muted'}`}>
                                  <img
                                    src={vehicle.imageUrl && !vehicle.imageUrl.includes('placeholder') ? vehicle.imageUrl : placeholderLogo}
                                    alt={vehicle.name}
                                    className={`w-full h-full ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'object-contain p-4' : 'object-cover'}`}
                                    data-testid={`img-vehicle-${vehicle.id}`}
                                  />
                                </div>
                                <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                  <div className="flex-1">
                                    <CardTitle className="text-lg mb-1" data-testid={`text-vehicle-name-${vehicle.id}`}>
                                      {vehicle.name}
                                    </CardTitle>
                                    <CardDescription className="mb-3">
                                      <span data-testid={`text-vehicle-plate-${vehicle.id}`}>
                                        {vehicle.licensePlate || vehicle.plate || "Sem placa"}
                                      </span>
                                      {vehicle.year && ` • ${vehicle.year}`}
                                      {vehicle.category && ` • ${vehicle.category}`}
                                      {vehicle.chassi && ` • Chassi: ${vehicle.chassi}`}
                                    </CardDescription>
                                    
                                    {/* Informações Básicas do Veículo */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <p className="text-muted-foreground text-xs">Proprietário</p>
                                        <p className="font-medium" data-testid={`text-vehicle-owner-${vehicle.id}`}>{selectedInvestor?.name || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">Transmissão</p>
                                        <p className="font-medium">{vehicle.transmission || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">Motor</p>
                                        <p className="font-medium">{vehicle.fuel || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">Assentos</p>
                                        <p className="font-medium">{vehicle.seats || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground text-xs">Dividendo Mensal</p>
                                        <p className="font-medium text-green-600">
                                          {vehicle.customDividend ? `R$ ${parseFloat(vehicle.customDividend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "—"}
                                        </p>
                                      </div>
                                      {vehicle.bonusDate && (
                                        <div>
                                          <p className="text-muted-foreground text-xs">Data do Bônus</p>
                                          <p className="font-medium">{vehicle.bonusDate}</p>
                                        </div>
                                      )}
                                      {vehicle.bonusValue && (
                                        <div>
                                          <p className="text-muted-foreground text-xs">Valor do Bônus</p>
                                          <p className="font-medium text-primary">
                                            R$ {parseFloat(vehicle.bonusValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 text-right">
                                    <div>
                                      <p className="text-muted-foreground text-xs">Valor FIPE</p>
                                      <p className="font-bold text-lg" data-testid={`text-vehicle-fipe-${vehicle.id}`}>
                                        R$ {parseFloat(vehicle.fipeValue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Documentos do Veículo */}
                              {(vehicleDocs.length > 0 || otherDocs.length > 0) && (
                                <div className="border-t pt-4">
                                  <h4 className="text-sm font-semibold mb-3">Documentos do Veículo</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {vehicleDocs.map((doc, index) => (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownload(doc.url, `${vehicle.name}-${doc.label}`);
                                        }}
                                        data-testid={`button-vehicle-doc-${vehicle.id}-${index}`}
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        {doc.label}
                                      </Button>
                                    ))}
                                    {otherDocs.map((doc: any, index: number) => (
                                      <Button
                                        key={`other-${index}`}
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownload(doc.url, `${vehicle.name}-${doc.label}`);
                                        }}
                                        data-testid={`button-vehicle-other-doc-${vehicle.id}-${index}`}
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        {doc.label}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Fotos de Vistoria */}
                              <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-semibold">Fotos de Vistoria</h4>
                                  <div className="relative">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled={uploadingInspectionVehicleId === vehicle.id}
                                          data-testid={`button-add-inspection-${vehicle.id}`}
                                        >
                                          {uploadingInspectionVehicleId === vehicle.id ? (
                                            <>Enviando...</>
                                          ) : (
                                            <>
                                              <Plus className="h-4 w-4 mr-1" />
                                              Adicionar Foto
                                              <ChevronDown className="h-3 w-3 ml-1" />
                                            </>
                                          )}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {[
                                          { type: 'front', label: 'Frente' },
                                          { type: 'back', label: 'Fundo' },
                                          { type: 'left_side', label: 'Lateral Esquerda' },
                                          { type: 'right_side', label: 'Lateral Direita' },
                                          { type: 'other', label: 'Outra' },
                                        ].map((option) => (
                                          <DropdownMenuItem
                                            key={option.type}
                                            onClick={() => {
                                              const input = document.getElementById(`inspection-upload-${vehicle.id}-${option.type}`) as HTMLInputElement;
                                              if (input) input.click();
                                            }}
                                            data-testid={`menu-item-inspection-${option.type}-${vehicle.id}`}
                                          >
                                            {option.label}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    {/* Hidden file inputs for each type */}
                                    {['front', 'back', 'left_side', 'right_side', 'other'].map((photoType) => (
                                      <input
                                        key={photoType}
                                        id={`inspection-upload-${vehicle.id}-${photoType}`}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            await handleInspectionPhotoUpload(vehicle.id, file, photoType);
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {inspectionPhotos.length > 0 ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {inspectionPhotos.map((inspection: any, index: number) => {
                                      const photoLabel = imageTypeLabels[inspection.imageType] || inspection.imageType || 'Foto';
                                      return (
                                        <div key={inspection.id} className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-muted-foreground">
                                              {photoLabel}
                                            </p>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5 text-destructive hover:text-destructive"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteInspectionPhoto(vehicle.id, inspection.id);
                                              }}
                                              data-testid={`button-delete-inspection-${vehicle.id}-${index}`}
                                            >
                                              <XCircle className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <img
                                            src={inspection.imageUrl}
                                            alt={photoLabel}
                                            className="w-full aspect-[4/3] object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                                            onClick={() => setEnlargedPhoto({ url: inspection.imageUrl, label: photoLabel })}
                                            data-testid={`img-inspection-${vehicle.id}-${index}`}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">Nenhuma foto de vistoria cadastrada. Clique em "Adicionar Foto" para incluir.</p>
                                )}
                              </div>
                              
                              {/* Avarias do Veículo */}
                              {(vehicle.hasDamage || damagePhotos.length > 0) && (
                                <div className="border-t pt-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400">Avarias Registradas</h4>
                                    <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950">
                                      Com Avaria
                                    </Badge>
                                  </div>
                                  
                                  {vehicle.damageDescription && (
                                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 mb-3 border border-orange-200 dark:border-orange-800">
                                      <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Descrição da Avaria:</p>
                                      <p className="text-sm text-orange-600 dark:text-orange-300">{vehicle.damageDescription}</p>
                                    </div>
                                  )}
                                  
                                  {damagePhotos.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-2">Fotos das Avarias ({damagePhotos.length})</p>
                                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {damagePhotos.map((photo: any, index: number) => (
                                          <div key={photo.id || index} className="space-y-1">
                                            <img
                                              src={photo.imageUrl}
                                              alt={`Avaria ${index + 1}`}
                                              className="w-full aspect-[4/3] object-cover rounded-lg border border-orange-300 cursor-pointer hover-elevate transition-all"
                                              onClick={() => setEnlargedPhoto({ url: photo.imageUrl, label: `Avaria ${index + 1}` })}
                                              data-testid={`img-damage-${vehicle.id}-${index}`}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Informações Adicionais do Veículo */}
                              <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-3">Informações Adicionais</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">Documento</p>
                                    <p className={`font-medium ${vehicle.temDocumento === true ? 'text-green-600' : vehicle.temDocumento === false ? 'text-red-600' : ''}`}>
                                      {vehicle.temDocumento === true ? 'Sim' : vehicle.temDocumento === false ? 'Não' : '—'}
                                    </p>
                                    {vehicle.observacoesDocumento && (
                                      <p className="text-xs text-muted-foreground italic">{vehicle.observacoesDocumento}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">IPVA</p>
                                    <p className={`font-medium ${vehicle.ipvaStatus === 'pago' ? 'text-green-600' : vehicle.ipvaStatus === 'isento' ? 'text-blue-600' : vehicle.ipvaStatus === 'nao' ? 'text-red-600' : ''}`}>
                                      {vehicle.ipvaStatus === 'pago' ? 'Pago' : vehicle.ipvaStatus === 'isento' ? 'Isento' : vehicle.ipvaStatus === 'nao' ? 'Não Pago' : '—'}
                                    </p>
                                    {vehicle.ipvaValue && vehicle.ipvaStatus === 'pago' && (
                                      <p className="text-xs text-muted-foreground">R$ {parseFloat(vehicle.ipvaValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Licenciamento</p>
                                    <p className={`font-medium ${vehicle.licenciamentoPago === true ? 'text-green-600' : vehicle.licenciamentoPago === false ? 'text-red-600' : ''}`}>
                                      {vehicle.licenciamentoPago === true ? 'Pago' : vehicle.licenciamentoPago === false ? 'Não Pago' : '—'}
                                    </p>
                                    {vehicle.observacoesLicenciamento && (
                                      <p className="text-xs text-muted-foreground italic">{vehicle.observacoesLicenciamento}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Seguro</p>
                                    <p className={`font-medium ${vehicle.hasInsurance === true ? 'text-green-600' : vehicle.hasInsurance === false ? 'text-red-600' : ''}`}>
                                      {vehicle.hasInsurance === true ? 'Sim' : vehicle.hasInsurance === false ? 'Não' : '—'}
                                    </p>
                                    {vehicle.insuranceValue && vehicle.hasInsurance && (
                                      <p className="text-xs text-muted-foreground">R$ {parseFloat(vehicle.insuranceValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Financiado</p>
                                    <p className={`font-medium ${vehicle.taFinanciado === true ? 'text-orange-600' : vehicle.taFinanciado === false ? 'text-green-600' : ''}`}>
                                      {vehicle.taFinanciado === true ? 'Sim' : vehicle.taFinanciado === false ? 'Não' : '—'}
                                    </p>
                                    {vehicle.observacoesFinanciado && (
                                      <p className="text-xs text-muted-foreground italic">{vehicle.observacoesFinanciado}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Leilão</p>
                                    <p className={`font-medium ${vehicle.eDeLeilao === true ? 'text-orange-600' : vehicle.eDeLeilao === false ? 'text-green-600' : ''}`}>
                                      {vehicle.eDeLeilao === true ? 'Sim' : vehicle.eDeLeilao === false ? 'Não' : '—'}
                                    </p>
                                    {vehicle.observacoesLeilao && (
                                      <p className="text-xs text-muted-foreground italic">{vehicle.observacoesLeilao}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">Rastreador</p>
                                    <p className={`font-medium ${vehicle.temRastreador === true ? 'text-green-600' : vehicle.temRastreador === false ? 'text-red-600' : ''}`}>
                                      {vehicle.temRastreador === true ? 'Sim' : vehicle.temRastreador === false ? 'Não' : '—'}
                                    </p>
                                    {vehicle.localizacaoRastreador && (
                                      <p className="text-xs text-muted-foreground italic">{vehicle.localizacaoRastreador}</p>
                                    )}
                                  </div>
                                </div>
                                {vehicle.problemaMecanico && (
                                  <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
                                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Problemas Mecânicos/Elétricos:</p>
                                    <p className="text-sm text-orange-600 dark:text-orange-300">{vehicle.problemaMecanico}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              {/* Documents Tab - Personal Documents and Vehicle Contracts */}
              <TabsContent value="documents" className="space-y-4">
                {(() => {
                  const stats = calculateInvestorStats(selectedInvestor);
                  const vehicleContracts = stats.investorVehicles
                    .filter((v: any) => v.investmentContractUrl)
                    .map((v: any) => ({
                      vehicleName: v.name || `${v.brand} ${v.model}`,
                      contractUrl: v.investmentContractUrl,
                    }));
                  const hasPersonalDocs = selectedInvestor.rgImageUrl || selectedInvestor.cnhImageUrl || selectedInvestor.proofOfResidenceUrl || selectedInvestor.investorContractUrl;
                  const hasVehicleContracts = vehicleContracts.length > 0;
                  
                  if (!hasPersonalDocs && !hasVehicleContracts) {
                    return (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Este investidor não possui documentos pessoais anexados.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Os documentos dos veículos podem ser encontrados na aba "Veículos".
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {hasPersonalDocs && (
                        <Card data-testid="card-personal-documents">
                          <CardHeader>
                            <CardTitle className="text-base">Documentos Pessoais</CardTitle>
                            <CardDescription>
                              Documentos de identificação do investidor
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {selectedInvestor.rgImageUrl && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">RG</p>
                                  {selectedInvestor.rgImageUrl.includes('application/pdf') ? (
                                    <div
                                      className="w-full aspect-[4/3] rounded-lg border cursor-pointer hover-elevate transition-all flex items-center justify-center bg-muted/30"
                                      onClick={() => handleDownload(selectedInvestor.rgImageUrl, `RG-${selectedInvestor.name}`)}
                                      data-testid="doc-rg"
                                    >
                                      <div className="text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">RG (PDF)</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={selectedInvestor.rgImageUrl}
                                      alt="RG do investidor"
                                      className="w-full aspect-[4/3] object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                                      onClick={() => handleDownload(selectedInvestor.rgImageUrl, `RG-${selectedInvestor.name}`)}
                                      data-testid="img-doc-rg"
                                    />
                                  )}
                                </div>
                              )}
                              {selectedInvestor.cnhImageUrl && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">CNH</p>
                                  {selectedInvestor.cnhImageUrl.includes('application/pdf') ? (
                                    <div
                                      className="w-full aspect-[4/3] rounded-lg border cursor-pointer hover-elevate transition-all flex items-center justify-center bg-muted/30"
                                      onClick={() => handleDownload(selectedInvestor.cnhImageUrl, `CNH-${selectedInvestor.name}`)}
                                      data-testid="doc-cnh"
                                    >
                                      <div className="text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">CNH (PDF)</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={selectedInvestor.cnhImageUrl}
                                      alt="CNH do investidor"
                                      className="w-full aspect-[4/3] object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                                      onClick={() => handleDownload(selectedInvestor.cnhImageUrl, `CNH-${selectedInvestor.name}`)}
                                      data-testid="img-doc-cnh"
                                    />
                                  )}
                                </div>
                              )}
                              {selectedInvestor.proofOfResidenceUrl && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Comprovante de Residência</p>
                                  {selectedInvestor.proofOfResidenceUrl.includes('application/pdf') ? (
                                    <div
                                      className="w-full aspect-[4/3] rounded-lg border cursor-pointer hover-elevate transition-all flex items-center justify-center bg-muted/30"
                                      onClick={() => handleDownload(selectedInvestor.proofOfResidenceUrl, `Comprovante-Residencia-${selectedInvestor.name}`)}
                                      data-testid="doc-proof-residence"
                                    >
                                      <div className="text-center">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">
                                          Comprovante (PDF)
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={selectedInvestor.proofOfResidenceUrl}
                                      alt="Comprovante de Residência"
                                      className="w-full aspect-[4/3] object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                                      onClick={() => handleDownload(selectedInvestor.proofOfResidenceUrl, `Comprovante-Residencia-${selectedInvestor.name}`)}
                                      data-testid="img-doc-proof-residence"
                                    />
                                  )}
                                </div>
                              )}
                              {selectedInvestor.investorContractUrl && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Contrato de Investidor</p>
                                  <div
                                    className="w-full aspect-[4/3] rounded-lg border cursor-pointer hover-elevate transition-all flex items-center justify-center bg-muted/30"
                                    onClick={() => handleDownload(selectedInvestor.investorContractUrl, selectedInvestor.investorContractFileName || `Contrato-${selectedInvestor.name}`)}
                                    data-testid="doc-investor-contract"
                                  >
                                    <div className="text-center">
                                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                      <p className="text-xs text-muted-foreground">
                                        {selectedInvestor.investorContractFileName || "Contrato"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {hasVehicleContracts && (
                        <Card data-testid="card-vehicle-contracts">
                          <CardHeader>
                            <CardTitle className="text-base">Contratos de Cessão</CardTitle>
                            <CardDescription>
                              Contratos de cessão dos veículos do investidor
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {vehicleContracts.map((contract: any, index: number) => (
                                <div key={index} className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground truncate" title={contract.vehicleName}>
                                    {contract.vehicleName}
                                  </p>
                                  <div
                                    className="w-full aspect-[4/3] rounded-lg border cursor-pointer hover-elevate transition-all flex items-center justify-center bg-muted/30"
                                    onClick={() => handleDownload(contract.contractUrl, `Contrato-Cessao-${contract.vehicleName}`)}
                                    data-testid={`doc-vehicle-contract-${index}`}
                                  >
                                    <div className="text-center">
                                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                      <p className="text-xs text-muted-foreground">
                                        Contrato de Cessão
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })()}
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="statistics" className="space-y-4">
                {(() => {
                  const stats = calculateInvestorStats(selectedInvestor);
                  
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="hover-elevate">
                          <CardHeader>
                            <CardTitle className="text-base">Investimento Total</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-primary" data-testid="text-stat-total-investment">
                              R$ {stats.totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Soma do valor FIPE de todos os veículos
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="hover-elevate">
                          <CardHeader>
                            <CardTitle className="text-base">Dividendos Pagos</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-stat-total-dividends">
                              R$ {stats.totalDividendsPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Total de dividendos já pagos
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="hover-elevate">
                          <CardHeader>
                            <CardTitle className="text-base">Dividendo Médio por Veículo</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-primary" data-testid="text-stat-avg-dividend">
                              R$ {stats.avgDividendPerVehicle.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Média mensal por veículo
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="hover-elevate">
                          <CardHeader>
                            <CardTitle className="text-base">Dividendo Mensal</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-primary" data-testid="text-stat-monthly-dividend">
                              R$ {stats.monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Total agregado de todos os veículos
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="hover-elevate">
                          <CardHeader>
                            <CardTitle className="text-base">Dia de Pagamento</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold" data-testid="text-stat-payment-day">
                              {stats.paymentDatesFormatted || "—"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Dia do mês para recebimento
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="hover-elevate">
                          <CardHeader>
                            <CardTitle className="text-base">Bônus (Pagamento Único)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-stat-bonus-value">
                              {stats.totalBonus > 0 ? `R$ ${stats.totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "—"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1" data-testid="text-stat-bonus-count">
                              {stats.bonusCount > 0 ? `${stats.bonusCount} bônus configurado(s)` : "Nenhum bônus configurado"}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Per-Vehicle Dividend Breakdown */}
                      {stats.investorVehicles.length > 1 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              Dividendos por Veículo
                            </CardTitle>
                            <CardDescription>
                              Detalhamento do dividendo de cada veículo do investidor
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md border">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="text-left p-3 font-medium">Veículo</th>
                                    <th className="text-left p-3 font-medium">Placa</th>
                                    <th className="text-right p-3 font-medium">Valor FIPE</th>
                                    <th className="text-right p-3 font-medium">Dividendo Mensal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {stats.investorVehicles.map((vehicle: any) => (
                                    <tr key={vehicle.id} className="border-b last:border-b-0" data-testid={`row-vehicle-dividend-${vehicle.id}`}>
                                      <td className="p-3">
                                        <p className="font-medium" data-testid={`text-vehicle-dividend-name-${vehicle.id}`}>
                                          {vehicle.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {vehicle.year}
                                        </p>
                                      </td>
                                      <td className="p-3">
                                        <p className="font-mono text-sm" data-testid={`text-vehicle-dividend-plate-${vehicle.id}`}>
                                          {vehicle.plate || vehicle.licensePlate || "—"}
                                        </p>
                                      </td>
                                      <td className="p-3 text-right">
                                        <p data-testid={`text-vehicle-dividend-fipe-${vehicle.id}`}>
                                          R$ {parseFloat(vehicle.fipeValue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                      </td>
                                      <td className="p-3 text-right">
                                        <p className="font-bold text-primary" data-testid={`text-vehicle-dividend-value-${vehicle.id}`}>
                                          R$ {parseFloat(vehicle.customDividend || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-muted/30">
                                    <td colSpan={2} className="p-3 font-semibold">
                                      Total ({stats.investorVehicles.length} veículos)
                                    </td>
                                    <td className="p-3 text-right font-semibold">
                                      R$ {stats.totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-right font-bold text-primary">
                                      R$ {stats.monthlyDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Per-Vehicle Bonus Breakdown */}
                      {stats.vehiclesWithBonus.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Gift className="h-4 w-4 text-purple-600" />
                              Bônus por Veículo
                            </CardTitle>
                            <CardDescription>
                              Detalhamento do bônus de cada veículo do investidor
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md border">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b bg-muted/50">
                                    <th className="text-left p-3 font-medium">Veículo</th>
                                    <th className="text-left p-3 font-medium">Placa</th>
                                    <th className="text-center p-3 font-medium">Data do Bônus</th>
                                    <th className="text-right p-3 font-medium">Valor do Bônus</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {stats.vehiclesWithBonus.map((vehicle: any) => (
                                    <tr key={vehicle.id} className="border-b last:border-b-0" data-testid={`row-vehicle-bonus-${vehicle.id}`}>
                                      <td className="p-3">
                                        <p className="font-medium" data-testid={`text-vehicle-bonus-name-${vehicle.id}`}>
                                          {vehicle.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {vehicle.year}
                                        </p>
                                      </td>
                                      <td className="p-3">
                                        <p className="font-mono text-sm" data-testid={`text-vehicle-bonus-plate-${vehicle.id}`}>
                                          {vehicle.plate || vehicle.licensePlate || "—"}
                                        </p>
                                      </td>
                                      <td className="p-3 text-center">
                                        <p data-testid={`text-vehicle-bonus-date-${vehicle.id}`}>
                                          {vehicle.bonusDate || "—"}
                                        </p>
                                      </td>
                                      <td className="p-3 text-right">
                                        <p className="font-bold text-purple-600 dark:text-purple-400" data-testid={`text-vehicle-bonus-value-${vehicle.id}`}>
                                          R$ {parseFloat(vehicle.bonusValue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-purple-50 dark:bg-purple-950/20">
                                    <td colSpan={3} className="p-3 font-semibold">
                                      Total ({stats.vehiclesWithBonus.length} bônus)
                                    </td>
                                    <td className="p-3 text-right font-bold text-purple-600 dark:text-purple-400">
                                      R$ {stats.totalBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {stats.totalVehicles === 0 && (
                        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                              <div>
                                <p className="font-medium text-orange-800 dark:text-orange-300">
                                  Investidor sem veículos
                                </p>
                                <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                                  Este investidor ainda não possui veículos cadastrados na frota. As estatísticas serão atualizadas assim que veículos forem associados.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Investor Dialog */}
      <Dialog open={editInvestorDialogOpen} onOpenChange={setEditInvestorDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Investidor</DialogTitle>
            <DialogDescription>
              Atualize as informações do investidor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input
                    value={investorEditData.name || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, name: e.target.value })}
                    placeholder="Nome completo"
                    data-testid="input-edit-investor-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF</label>
                  <Input
                    value={formatCPF(investorEditData.cpf || "")}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, cpf: e.target.value.replace(/\D/g, '') })}
                    placeholder="000.000.000-00"
                    data-testid="input-edit-investor-cpf"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">RG</label>
                  <Input
                    value={investorEditData.rg || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, rg: e.target.value })}
                    placeholder="RG"
                    data-testid="input-edit-investor-rg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CNH</label>
                  <Input
                    value={investorEditData.driverLicense || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, driverLicense: e.target.value })}
                    placeholder="CNH"
                    data-testid="input-edit-investor-cnh"
                  />
                </div>
                <div className="md:col-span-2">
                  <PhotoUploadZone
                    label="Foto do RG"
                    photoUrl={investorEditData.rgImageUrl}
                    onPhotoChange={(url) => setInvestorEditData({ ...investorEditData, rgImageUrl: url })}
                    photoKey="edit-investor-rg"
                  />
                </div>
                <div className="md:col-span-2">
                  <PhotoUploadZone
                    label="Foto da CNH"
                    photoUrl={investorEditData.cnhImageUrl}
                    onPhotoChange={(url) => setInvestorEditData({ ...investorEditData, cnhImageUrl: url })}
                    photoKey="edit-investor-cnh"
                  />
                </div>
                <div className="md:col-span-2">
                  <PhotoUploadZone
                    label="Comprovante de Residência"
                    photoUrl={investorEditData.proofOfResidenceUrl}
                    onPhotoChange={(url) => setInvestorEditData({ ...investorEditData, proofOfResidenceUrl: url })}
                    photoKey="edit-investor-proof-residence"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={investorEditData.email || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    data-testid="input-edit-investor-email"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={formatPhone(investorEditData.phone || "")}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="(00) 00000-0000"
                    data-testid="input-edit-investor-phone"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Contato de Emergência</label>
                  <Input
                    value={investorEditData.emergencyContact || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, emergencyContact: e.target.value })}
                    placeholder="Nome e telefone do contato de emergência"
                    data-testid="input-edit-investor-emergency"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Endereço</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Rua</label>
                  <Input
                    value={investorEditData.street || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, street: e.target.value })}
                    placeholder="Rua"
                    data-testid="input-edit-investor-street"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Complemento</label>
                  <Input
                    value={investorEditData.complement || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, complement: e.target.value })}
                    placeholder="Apto, bloco, etc."
                    data-testid="input-edit-investor-complement"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bairro</label>
                  <Input
                    value={investorEditData.neighborhood || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    data-testid="input-edit-investor-neighborhood"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cidade</label>
                  <Input
                    value={investorEditData.city || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, city: e.target.value })}
                    placeholder="Cidade"
                    data-testid="input-edit-investor-city"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Input
                    value={investorEditData.state || ""}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                    data-testid="input-edit-investor-state"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CEP</label>
                  <Input
                    value={formatCEP(investorEditData.zipCode || "")}
                    onChange={(e) => setInvestorEditData({ ...investorEditData, zipCode: e.target.value.replace(/\D/g, '') })}
                    placeholder="00000-000"
                    data-testid="input-edit-investor-zipcode"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Investment Information - Per Vehicle Editing */}
            {(() => {
              if (!selectedInvestor) return null;
              
              const investorVehicles = (vehicles || []).filter(
                (v: any) => v.ownerId === selectedInvestor.id && v.isInvestorVehicle
              );
              
              // Calculate aggregated values for display
              const totalDividend = investorVehicles.reduce((sum: number, v: any) => {
                return sum + (parseFloat(v.customDividend || "0"));
              }, 0);
              
              const allDates: number[] = [];
              investorVehicles.forEach((v: any) => {
                if (v.paymentDate) {
                  const dates = String(v.paymentDate).split('/').map((d: string) => parseInt(d.trim())).filter((d: number) => !isNaN(d) && d > 0 && d <= 31);
                  allDates.push(...dates);
                }
              });
              const uniqueDates = [...new Set(allDates)].sort((a, b) => a - b);
              const paymentDatesFormatted = uniqueDates.length > 0 ? uniqueDates.join('/') : "Não definido";
              
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações de Investimento</CardTitle>
                    <CardDescription>
                      Edite os valores de cada veículo individualmente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary (Read-only) */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Dividendo Total Mensal</p>
                        <p className="text-xl font-bold text-primary">
                          R$ {totalDividend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dias de Pagamento</p>
                        <p className="text-xl font-bold">
                          Dia {paymentDatesFormatted}
                        </p>
                      </div>
                    </div>
                    
                    {/* Per Vehicle Editing */}
                    {investorVehicles.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-sm font-medium">Editar por Veículo</p>
                        {investorVehicles.map((vehicle: any) => (
                          <div key={vehicle.id} className="p-4 border rounded-lg space-y-3" data-testid={`edit-vehicle-investment-${vehicle.id}`}>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{vehicle.name}</span>
                              <Badge variant="outline">{vehicle.licensePlate || "Sem placa"}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Dividendo Mensal (R$)</label>
                                <Input
                                  type="text"
                                  value={vehicleDocsEditData[vehicle.id]?.customDividend !== undefined 
                                    ? vehicleDocsEditData[vehicle.id].customDividend 
                                    : (vehicle.customDividend || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d,]/g, '');
                                    const numValue = value.replace(',', '.');
                                    setVehicleDocsEditData({
                                      ...vehicleDocsEditData,
                                      [vehicle.id]: {
                                        ...vehicleDocsEditData[vehicle.id],
                                        customDividend: numValue
                                      }
                                    });
                                  }}
                                  placeholder="0,00"
                                  data-testid={`input-edit-vehicle-dividend-${vehicle.id}`}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Dia de Pagamento</label>
                                <Input
                                  type="text"
                                  value={vehicleDocsEditData[vehicle.id]?.paymentDate !== undefined 
                                    ? vehicleDocsEditData[vehicle.id].paymentDate 
                                    : (vehicle.paymentDate || "")}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^\d/]/g, '');
                                    setVehicleDocsEditData({
                                      ...vehicleDocsEditData,
                                      [vehicle.id]: {
                                        ...vehicleDocsEditData[vehicle.id],
                                        paymentDate: value
                                      }
                                    });
                                  }}
                                  placeholder="10 ou 10/20"
                                  data-testid={`input-edit-vehicle-payment-${vehicle.id}`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {investorVehicles.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado para este investidor.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Vehicle Documents Section */}
            {(() => {
              if (!selectedInvestor) return null;
              
              const investorVehicles = (vehicles || []).filter(
                (v: any) => v.ownerId === selectedInvestor.id && v.isInvestorVehicle
              );

              if (investorVehicles.length === 0) return null;

              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Documentos dos Veículos</CardTitle>
                    <CardDescription>
                      Gerencie os documentos de cada veículo deste investidor
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {investorVehicles.map((vehicle: any) => (
                      <div key={vehicle.id} className="space-y-4 pb-6 border-b last:border-b-0 last:pb-0">
                        <div>
                          <h4 className="text-sm font-semibold">{vehicle.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.licensePlate || "Sem placa"} • {vehicle.year}
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FileUploadZone
                              label="CRLV"
                              fileData={vehicleDocsEditData[vehicle.id]?.crlvDocumentUrl ? { 
                                fileName: "CRLV", 
                                fileUrl: vehicleDocsEditData[vehicle.id].crlvDocumentUrl 
                              } : null}
                              onFileChange={(data) => setVehicleDocsEditData({
                                ...vehicleDocsEditData,
                                [vehicle.id]: {
                                  ...vehicleDocsEditData[vehicle.id],
                                  crlvDocumentUrl: data?.fileUrl || null
                                }
                              })}
                              accept=".pdf,.jpg,.jpeg,.png"
                              description="PDF, JPG ou PNG"
                              testId={`edit-vehicle-crlv-${vehicle.id}`}
                            />
                            
                            <FileUploadZone
                              label="Laudo Cautelar"
                              fileData={vehicleDocsEditData[vehicle.id]?.laudoCautelarUrl ? { 
                                fileName: "Laudo Cautelar", 
                                fileUrl: vehicleDocsEditData[vehicle.id].laudoCautelarUrl 
                              } : null}
                              onFileChange={(data) => setVehicleDocsEditData({
                                ...vehicleDocsEditData,
                                [vehicle.id]: {
                                  ...vehicleDocsEditData[vehicle.id],
                                  laudoCautelarUrl: data?.fileUrl || null
                                }
                              })}
                              accept=".pdf,.jpg,.jpeg,.png"
                              description="PDF, JPG ou PNG"
                              testId={`edit-vehicle-laudo-cautelar-${vehicle.id}`}
                            />
                            
                            <FileUploadZone
                              label="Laudo Mecânico"
                              fileData={vehicleDocsEditData[vehicle.id]?.laudoMecanicoUrl ? { 
                                fileName: "Laudo Mecânico", 
                                fileUrl: vehicleDocsEditData[vehicle.id].laudoMecanicoUrl 
                              } : null}
                              onFileChange={(data) => setVehicleDocsEditData({
                                ...vehicleDocsEditData,
                                [vehicle.id]: {
                                  ...vehicleDocsEditData[vehicle.id],
                                  laudoMecanicoUrl: data?.fileUrl || null
                                }
                              })}
                              accept=".pdf,.jpg,.jpeg,.png"
                              description="PDF, JPG ou PNG"
                              testId={`edit-vehicle-laudo-mecanico-${vehicle.id}`}
                            />
                          </div>

                          {/* Outros Documentos */}
                          <div className="pt-4 border-t">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-medium">Outros Documentos</label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const currentOthers = vehicleDocsEditData[vehicle.id]?.otherDocumentsUrls || [];
                                  setVehicleDocsEditData({
                                    ...vehicleDocsEditData,
                                    [vehicle.id]: {
                                      ...vehicleDocsEditData[vehicle.id],
                                      otherDocumentsUrls: [...currentOthers, { label: "", fileUrl: "" }]
                                    }
                                  });
                                }}
                                data-testid={`button-add-other-doc-${vehicle.id}`}
                              >
                                + Adicionar Documento
                              </Button>
                            </div>
                            
                            {(vehicleDocsEditData[vehicle.id]?.otherDocumentsUrls || []).length > 0 && (
                              <div className="space-y-3">
                                {(vehicleDocsEditData[vehicle.id]?.otherDocumentsUrls || []).map((doc: any, index: number) => (
                                  <Card key={index} className="p-3">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Documento #{index + 1}</p>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            const currentOthers = [...(vehicleDocsEditData[vehicle.id]?.otherDocumentsUrls || [])];
                                            currentOthers.splice(index, 1);
                                            setVehicleDocsEditData({
                                              ...vehicleDocsEditData,
                                              [vehicle.id]: {
                                                ...vehicleDocsEditData[vehicle.id],
                                                otherDocumentsUrls: currentOthers
                                              }
                                            });
                                          }}
                                          data-testid={`button-remove-other-doc-${vehicle.id}-${index}`}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Remover
                                        </Button>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium">Nome do Documento</label>
                                        <Input
                                          placeholder="Ex: Contrato de Compra, Nota Fiscal..."
                                          value={doc.label || ""}
                                          onChange={(e) => {
                                            const currentOthers = [...(vehicleDocsEditData[vehicle.id]?.otherDocumentsUrls || [])];
                                            currentOthers[index] = { ...currentOthers[index], label: e.target.value };
                                            setVehicleDocsEditData({
                                              ...vehicleDocsEditData,
                                              [vehicle.id]: {
                                                ...vehicleDocsEditData[vehicle.id],
                                                otherDocumentsUrls: currentOthers
                                              }
                                            });
                                          }}
                                          data-testid={`input-other-doc-label-${vehicle.id}-${index}`}
                                        />
                                      </div>

                                      <FileUploadZone
                                        label="Arquivo do Documento"
                                        fileData={doc.fileUrl ? { 
                                          fileName: doc.label || `Documento ${index + 1}`, 
                                          fileUrl: doc.fileUrl 
                                        } : null}
                                        onFileChange={(data) => {
                                          const currentOthers = [...(vehicleDocsEditData[vehicle.id]?.otherDocumentsUrls || [])];
                                          currentOthers[index] = { ...currentOthers[index], fileUrl: data?.fileUrl || "" };
                                          setVehicleDocsEditData({
                                            ...vehicleDocsEditData,
                                            [vehicle.id]: {
                                              ...vehicleDocsEditData[vehicle.id],
                                              otherDocumentsUrls: currentOthers
                                            }
                                          });
                                        }}
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        description="PDF, JPG, PNG ou DOCX"
                                        testId={`edit-vehicle-other-doc-${vehicle.id}-${index}`}
                                      />
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            )}
                            
                            {(vehicleDocsEditData[vehicle.id]?.otherDocumentsUrls || []).length === 0 && (
                              <p className="text-sm text-muted-foreground">Nenhum outro documento adicionado</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditInvestorDialogOpen(false)}
              data-testid="button-cancel-edit-investor"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!selectedInvestor) {
                  toast({
                    title: "Erro",
                    description: "Nenhum investidor selecionado.",
                    variant: "destructive",
                  });
                  return;
                }

                if (!investorEditData.name || !investorEditData.cpf) {
                  toast({
                    title: "Campos obrigatórios",
                    description: "Nome e CPF são obrigatórios.",
                    variant: "destructive",
                  });
                  return;
                }
                
                try {
                  // Update investor data
                  await updateInvestorMutation.mutateAsync({
                    id: selectedInvestor.id,
                    data: investorEditData
                  });

                  // Update vehicle documents for each vehicle
                  const investorVehicles = (vehicles || []).filter(
                    (v: any) => v.ownerId === selectedInvestor.id && v.isInvestorVehicle
                  );

                  const vehicleUpdatePromises = investorVehicles.map(async (vehicle: any) => {
                    const docs = vehicleDocsEditData[vehicle.id];
                    if (docs) {
                      // Convert otherDocumentsUrls to JSON strings
                      const otherDocs = (docs.otherDocumentsUrls || [])
                        .filter((doc: any) => doc && doc.fileUrl)
                        .map((doc: any) => JSON.stringify(doc));
                      
                      // Build update payload including dividend and payment date if changed
                      const updatePayload: any = {
                        crlvDocumentUrl: docs.crlvDocumentUrl,
                        laudoCautelarUrl: docs.laudoCautelarUrl,
                        laudoMecanicoUrl: docs.laudoMecanicoUrl,
                        otherDocumentsUrls: otherDocs,
                      };
                      
                      // Include customDividend if it was edited
                      if (docs.customDividend !== undefined) {
                        updatePayload.customDividend = docs.customDividend || "0";
                      }
                      
                      // Include paymentDate if it was edited
                      if (docs.paymentDate !== undefined) {
                        updatePayload.paymentDate = docs.paymentDate || null;
                      }
                      
                      await apiRequest("PATCH", `/api/vehicles/${vehicle.id}`, updatePayload);
                    }
                  });

                  await Promise.all(vehicleUpdatePromises);
                  
                  toast({
                    title: "Dados atualizados",
                    description: "Investidor e documentos dos veículos foram salvos com sucesso!",
                  });
                  
                  invalidate.vehicles();
                  setEditInvestorDialogOpen(false);
                } catch (error: any) {
                  toast({
                    title: "Erro ao salvar",
                    description: error.message || "Ocorreu um erro ao salvar as alterações.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={updateInvestorMutation.isPending}
              data-testid="button-save-investor"
            >
              {updateInvestorMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Investment Confirmation Dialog */}
      <Dialog open={cancelInvestmentDialogOpen} onOpenChange={(open) => {
        setCancelInvestmentDialogOpen(open);
        if (!open) {
          setAdminPasswordForCancel("");
          setSelectedVehiclesToCancel([]);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancelar Investimento
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const investorVehicles = selectedInvestor && vehicles ? 
              vehicles.filter((v: any) => v.ownerId === selectedInvestor.id && v.isInvestorVehicle) : [];
            const hasMultipleVehicles = investorVehicles.length > 1;
            const willRemoveInvestor = selectedVehiclesToCancel.length === 0 || selectedVehiclesToCancel.length === investorVehicles.length;
            
            return (
              <div className="space-y-4 py-4">
                {hasMultipleVehicles && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Selecione os veículos para remover:</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {investorVehicles.map((vehicle: any) => (
                        <label 
                          key={vehicle.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedVehiclesToCancel.includes(vehicle.id) 
                              ? "bg-destructive/10 border-destructive/30" 
                              : "hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedVehiclesToCancel.includes(vehicle.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVehiclesToCancel(prev => [...prev, vehicle.id]);
                              } else {
                                setSelectedVehiclesToCancel(prev => prev.filter(id => id !== vehicle.id));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                            data-testid={`checkbox-vehicle-cancel-${vehicle.id}`}
                          />
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{vehicle.brand} {vehicle.model}</p>
                            <p className="text-xs text-muted-foreground">{vehicle.licensePlate} • R$ {parseFloat(vehicle.customDividend || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedVehiclesToCancel(investorVehicles.map((v: any) => v.id))}
                      >
                        Selecionar Todos
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedVehiclesToCancel([])}
                      >
                        Limpar Seleção
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm font-medium mb-2">
                    {willRemoveInvestor ? "Ao cancelar este investimento:" : "Ao remover os veículos selecionados:"}
                  </p>
                  <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                    {willRemoveInvestor && (
                      <li>O investidor <strong className="text-foreground">{selectedInvestor?.name}</strong> será removido da base</li>
                    )}
                    <li>
                      {hasMultipleVehicles && selectedVehiclesToCancel.length > 0
                        ? `${selectedVehiclesToCancel.length} veículo(s) selecionado(s) serão removidos da frota`
                        : investorVehicles.length === 1 
                          ? "1 veículo será removido da frota"
                          : `${investorVehicles.length} veículos serão removidos da frota`}
                    </li>
                    {willRemoveInvestor && <li>Todos os documentos e histórico serão perdidos</li>}
                    <li>Esta ação é permanente e não pode ser revertida</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Para confirmar, insira sua senha de administrador:
                  </p>
                  <Input
                    type="password"
                    value={adminPasswordForCancel}
                    onChange={(e) => setAdminPasswordForCancel(e.target.value)}
                    placeholder="Senha de administrador"
                    data-testid="input-admin-password-cancel"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && selectedInvestor && adminPasswordForCancel.trim()) {
                        cancelInvestmentMutation.mutate({
                          investorId: selectedInvestor.id,
                          adminPassword: adminPasswordForCancel,
                          vehicleIds: hasMultipleVehicles && selectedVehiclesToCancel.length > 0 ? selectedVehiclesToCancel : undefined
                        });
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tem certeza que deseja continuar com o cancelamento?
                  </p>
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelInvestmentDialogOpen(false);
                setAdminPasswordForCancel("");
                setSelectedVehiclesToCancel([]);
              }}
              data-testid="button-cancel-cancellation"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const investorVehicles = selectedInvestor && vehicles ? 
                  vehicles.filter((v: any) => v.ownerId === selectedInvestor.id && v.isInvestorVehicle) : [];
                const hasMultipleVehicles = investorVehicles.length > 1;
                
                if (selectedInvestor && adminPasswordForCancel.trim()) {
                  cancelInvestmentMutation.mutate({
                    investorId: selectedInvestor.id,
                    adminPassword: adminPasswordForCancel,
                    vehicleIds: hasMultipleVehicles && selectedVehiclesToCancel.length > 0 ? selectedVehiclesToCancel : undefined
                  });
                } else if (!adminPasswordForCancel.trim()) {
                  toast({
                    title: "Senha obrigatória",
                    description: "Digite sua senha de administrador para confirmar.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={cancelInvestmentMutation.isPending || !adminPasswordForCancel.trim()}
              data-testid="button-confirm-cancel-investment"
            >
              {cancelInvestmentMutation.isPending ? (
                "Cancelando..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {(() => {
                    const investorVehicles = selectedInvestor && vehicles ? 
                      vehicles.filter((v: any) => v.ownerId === selectedInvestor.id && v.isInvestorVehicle) : [];
                    const hasMultipleVehicles = investorVehicles.length > 1;
                    const willRemoveInvestor = selectedVehiclesToCancel.length === 0 || selectedVehiclesToCancel.length === investorVehicles.length;
                    
                    if (hasMultipleVehicles && selectedVehiclesToCancel.length > 0 && !willRemoveInvestor) {
                      return `Remover ${selectedVehiclesToCancel.length} Veículo(s)`;
                    }
                    return "Confirmar Cancelamento";
                  })()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualização ampliada de foto */}
      <Dialog open={!!enlargedPhoto} onOpenChange={(open) => !open && setEnlargedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-2">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">{enlargedPhoto?.label}</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização ampliada da foto de vistoria
            </DialogDescription>
          </DialogHeader>
          {enlargedPhoto && (
            <div className="flex items-center justify-center">
              <img
                src={enlargedPhoto.url}
                alt={enlargedPhoto.label}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                data-testid="img-enlarged-photo"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar veículo ao investidor - 6 Etapas */}
      <Dialog open={addVehicleDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddVehicleDialogOpen(false);
          resetAddVehicleForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Veículo ao Investidor</DialogTitle>
            <DialogDescription>
              Novo veículo para {selectedInvestor?.name}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Steps - 6 etapas */}
          <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
            {[
              { step: 1, icon: User, label: "Cadastro" },
              { step: 2, icon: Car, label: "Veículo" },
              { step: 3, icon: DollarSign, label: "Dividendos" },
              { step: 4, icon: FileText, label: "Fotos" },
              { step: 5, icon: FileText, label: "Contrato" },
              { step: 6, icon: TrendingUp, label: "Confirmar" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center flex-1 min-w-[60px]">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    addVehicleStep > item.step 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : addVehicleStep === item.step
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                  }`}>
                    {addVehicleStep > item.step ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <item.icon className="h-4 w-4" />
                    )}
                  </div>
                  <p className="text-[10px] mt-1 text-center hidden sm:block">{item.label}</p>
                </div>
                {index < 5 && (
                  <div className={`flex-1 h-0.5 mx-0.5 ${
                    addVehicleStep > item.step ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Etapa 1: Cadastro do Investidor (dados pré-preenchidos) */}
          {addVehicleStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Etapa 1: Dados do Investidor</h3>
                <p className="text-sm text-muted-foreground">Dados pessoais e documentos (pré-preenchidos)</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input value={wizardInvestorData?.name || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CPF</label>
                  <Input value={wizardInvestorData?.cpf || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">RG</label>
                  <Input value={wizardInvestorData?.rg || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={wizardInvestorData?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input value={wizardInvestorData?.phone || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CNH</label>
                  <Input value={wizardInvestorData?.driverLicense || ""} disabled className="bg-muted" />
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-semibold mb-3">Endereço</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Rua</label>
                    <Input value={wizardInvestorData?.street || ""} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bairro</label>
                    <Input value={wizardInvestorData?.neighborhood || ""} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cidade/Estado</label>
                    <Input value={`${wizardInvestorData?.city || ""} / ${wizardInvestorData?.state || ""}`} disabled className="bg-muted" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3">Documentos Anexados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comprovante de Residência</label>
                    {wizardInvestorDocs.comprovanteResidencia ? (
                      <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm">Documento anexado</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Nenhum documento</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">CNH (Documento)</label>
                    {wizardInvestorDocs.cnh ? (
                      <div className="p-3 rounded-lg border-2 border-primary bg-primary/5 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm">Documento anexado</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Nenhum documento</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Veículo com FIPE */}
          {addVehicleStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Etapa 2: Dados do Veículo</h3>
                <p className="text-sm text-muted-foreground">Consulte o valor FIPE e informe os dados</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Consulta FIPE</CardTitle>
                  <CardDescription>Selecione a marca, modelo e ano do veículo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Marca *</label>
                      <Select value={selectedBrand} onValueChange={(value) => { setSelectedBrand(value); fetchFipeModels(value); }}>
                        <SelectTrigger><SelectValue placeholder={loadingFipe ? "Carregando..." : "Selecione"} /></SelectTrigger>
                        <SelectContent>
                          {fipeBrands.map((brand) => (<SelectItem key={brand.code} value={brand.code}>{brand.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Modelo *</label>
                      <Select value={selectedModel} onValueChange={(value) => { setSelectedModel(value); fetchFipeYears(selectedBrand, value); }} disabled={!selectedBrand || fipeModels.length === 0}>
                        <SelectTrigger><SelectValue placeholder={loadingFipe ? "Carregando..." : "Selecione"} /></SelectTrigger>
                        <SelectContent>
                          {fipeModels.map((model) => (<SelectItem key={model.code} value={model.code}>{model.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Ano *</label>
                      <Select value={selectedYear} onValueChange={(value) => { setSelectedYear(value); consultarFipe(selectedBrand, selectedModel, value); }} disabled={!selectedModel || fipeYears.length === 0}>
                        <SelectTrigger><SelectValue placeholder={loadingFipe ? "Carregando..." : "Selecione"} /></SelectTrigger>
                        <SelectContent>
                          {fipeYears.map((year) => (<SelectItem key={year.code} value={year.code}>{year.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {newVehicleData.fipeValue && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-800 dark:text-green-200"><strong>Valor FIPE:</strong> {newVehicleData.fipeValue}</p>
                      <p className="text-sm text-green-800 dark:text-green-200"><strong>Veículo:</strong> {newVehicleData.vehicleName}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium mb-3">Ou preencha manualmente:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Marca</label>
                        <Input 
                          value={newVehicleData.brand || ""} 
                          onChange={(e) => setNewVehicleData(prev => ({ ...prev, brand: e.target.value }))} 
                          placeholder="Ex: Volkswagen" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Modelo</label>
                        <Input 
                          value={newVehicleData.model || ""} 
                          onChange={(e) => {
                            const model = e.target.value;
                            setNewVehicleData(prev => ({ 
                              ...prev, 
                              model: model,
                              vehicleName: prev.brand ? `${prev.brand} ${model}`.toUpperCase() : model.toUpperCase()
                            }));
                          }} 
                          placeholder="Ex: Voyage" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ano</label>
                        <Input 
                          type="number" 
                          value={newVehicleData.year || ""} 
                          onChange={(e) => setNewVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))} 
                          placeholder="Ex: 2023" 
                          min={1990}
                          max={new Date().getFullYear() + 1}
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <label className="text-sm font-medium">Nome do Veículo</label>
                      <Input 
                        value={newVehicleData.vehicleName || ""} 
                        onChange={(e) => setNewVehicleData(prev => ({ ...prev, vehicleName: e.target.value.toUpperCase() }))} 
                        placeholder="Ex: VOYAGE MPI 1.0" 
                      />
                      <p className="text-xs text-muted-foreground">Nome completo que aparecerá no sistema</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <label className="text-sm font-medium">Valor FIPE (manual)</label>
                      <Input 
                        value={newVehicleData.fipeValue || ""} 
                        onChange={(e) => setNewVehicleData(prev => ({ ...prev, fipeValue: e.target.value }))} 
                        placeholder="Ex: R$ 59.265,00" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Placa *</label>
                  <Input value={newVehicleData.licensePlate} onChange={(e) => setNewVehicleData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))} placeholder="ABC1234" maxLength={7} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chassi</label>
                  <Input 
                    value={newVehicleData.chassi} 
                    onChange={(e) => setNewVehicleData(prev => ({ ...prev, chassi: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))} 
                    placeholder="9BWZZZ377VT004251" 
                    maxLength={17} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria *</label>
                  <Select value={newVehicleData.category} onValueChange={(value) => setNewVehicleData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transmissão *</label>
                  <Select value={newVehicleData.transmission} onValueChange={(value) => setNewVehicleData(prev => ({ ...prev, transmission: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatico">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Combustível *</label>
                  <Select value={newVehicleData.fuel} onValueChange={(value) => setNewVehicleData(prev => ({ ...prev, fuel: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gasolina">Gasolina</SelectItem>
                      <SelectItem value="Etanol">Etanol</SelectItem>
                      <SelectItem value="Flex">Flex</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Elétrico">Elétrico</SelectItem>
                      <SelectItem value="Híbrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assentos</label>
                  <Select value={String(newVehicleData.seats)} onValueChange={(value) => setNewVehicleData(prev => ({ ...prev, seats: parseInt(value) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="7">7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Informações do Veículo</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Tem documento? */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg border">
                      <label className="text-sm font-medium">Tem documento?</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newVehicleData.temDocumento === true ? "default" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, temDocumento: true }))}>Sim</Button>
                        <Button size="sm" variant={newVehicleData.temDocumento === false ? "destructive" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, temDocumento: false }))}>Não</Button>
                      </div>
                      {newVehicleData.temDocumento !== null && newVehicleData.temDocumento !== undefined && (
                        <Textarea placeholder="Observações sobre documento..." value={newVehicleData.observacoesDocumento} onChange={(e) => setNewVehicleData(prev => ({ ...prev, observacoesDocumento: e.target.value }))} rows={2} className="mt-2" />
                      )}
                    </div>
                    {/* IPVA */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg border">
                      <label className="text-sm font-medium">IPVA</label>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant={newVehicleData.ipvaStatus === 'sim' ? "default" : "outline"} onClick={() => {
                          const fipeClean = newVehicleData.fipeValue?.replace(/[^\d,]/g, '').replace(',', '.') || "0";
                          const fipeNumeric = parseFloat(fipeClean) || 0;
                          const ipva4Percent = (fipeNumeric * 0.04).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          setNewVehicleData(prev => ({ ...prev, ipvaStatus: 'sim', ipvaValue: ipva4Percent }));
                        }}>Pago</Button>
                        <Button size="sm" variant={newVehicleData.ipvaStatus === 'nao' ? "destructive" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, ipvaStatus: 'nao', ipvaValue: "" }))}>Não Pago</Button>
                        <Button size="sm" variant={newVehicleData.ipvaStatus === 'isento' ? "secondary" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, ipvaStatus: 'isento', ipvaValue: "" }))}>Isento</Button>
                      </div>
                      {newVehicleData.ipvaStatus === 'sim' && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">4% do valor FIPE (editável)</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">R$</span>
                            <Input value={newVehicleData.ipvaValue} onChange={(e) => setNewVehicleData(prev => ({ ...prev, ipvaValue: e.target.value }))} placeholder="0,00" />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Licenciamento pago? */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg border">
                      <label className="text-sm font-medium">Licenciamento pago?</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newVehicleData.licenciamentoPago === true ? "default" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, licenciamentoPago: true }))}>Sim</Button>
                        <Button size="sm" variant={newVehicleData.licenciamentoPago === false ? "destructive" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, licenciamentoPago: false }))}>Não</Button>
                      </div>
                      {newVehicleData.licenciamentoPago !== null && (
                        <Textarea placeholder="Observações sobre licenciamento..." value={newVehicleData.observacoesLicenciamento} onChange={(e) => setNewVehicleData(prev => ({ ...prev, observacoesLicenciamento: e.target.value }))} rows={2} className="mt-2" />
                      )}
                    </div>
                    {/* Tem seguro? */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg border">
                      <label className="text-sm font-medium">Tem seguro?</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newVehicleData.hasInsurance === true ? "default" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, hasInsurance: true }))}>Sim</Button>
                        <Button size="sm" variant={newVehicleData.hasInsurance === false ? "destructive" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, hasInsurance: false }))}>Não</Button>
                      </div>
                    </div>
                    {/* Tá financiado? */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg border">
                      <label className="text-sm font-medium">Tá financiado?</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newVehicleData.taFinanciado === true ? "default" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, taFinanciado: true }))}>Sim</Button>
                        <Button size="sm" variant={newVehicleData.taFinanciado === false ? "destructive" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, taFinanciado: false, observacoesFinanciado: "" }))}>Não</Button>
                      </div>
                      {newVehicleData.taFinanciado === true && (
                        <Textarea placeholder="Observações sobre financiamento..." value={newVehicleData.observacoesFinanciado} onChange={(e) => setNewVehicleData(prev => ({ ...prev, observacoesFinanciado: e.target.value }))} rows={2} className="mt-2" />
                      )}
                    </div>
                    {/* É de leilão? */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg border">
                      <label className="text-sm font-medium">É de leilão?</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newVehicleData.eDeLeilao === true ? "default" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, eDeLeilao: true }))}>Sim</Button>
                        <Button size="sm" variant={newVehicleData.eDeLeilao === false ? "destructive" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, eDeLeilao: false, observacoesLeilao: "" }))}>Não</Button>
                      </div>
                      {newVehicleData.eDeLeilao === true && (
                        <Textarea placeholder="Observações sobre leilão..." value={newVehicleData.observacoesLeilao} onChange={(e) => setNewVehicleData(prev => ({ ...prev, observacoesLeilao: e.target.value }))} rows={2} className="mt-2" />
                      )}
                    </div>
                    {/* Tem rastreador? */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg border">
                      <label className="text-sm font-medium">Tem rastreador?</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newVehicleData.temRastreador === true ? "default" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, temRastreador: true }))}>Sim</Button>
                        <Button size="sm" variant={newVehicleData.temRastreador === false ? "destructive" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, temRastreador: false, localizacaoRastreador: "" }))}>Não</Button>
                      </div>
                      {newVehicleData.temRastreador === true && (
                        <Input placeholder="Localização do rastreador..." value={newVehicleData.localizacaoRastreador} onChange={(e) => setNewVehicleData(prev => ({ ...prev, localizacaoRastreador: e.target.value }))} className="mt-2" />
                      )}
                    </div>
                    {/* Tem multas? */}
                    <div className="flex flex-col gap-2 p-3 rounded-lg border">
                      <label className="text-sm font-medium">Tem multas?</label>
                      <div className="flex gap-2">
                        <Button size="sm" variant={newVehicleData.temMultas === true ? "default" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, temMultas: true }))}>Sim</Button>
                        <Button size="sm" variant={newVehicleData.temMultas === false ? "destructive" : "outline"} onClick={() => setNewVehicleData(prev => ({ ...prev, temMultas: false, observacoesMultas: "" }))}>Não</Button>
                      </div>
                      {newVehicleData.temMultas !== null && newVehicleData.temMultas !== undefined && (
                        <Textarea placeholder="Observações sobre multas..." value={newVehicleData.observacoesMultas || ""} onChange={(e) => setNewVehicleData(prev => ({ ...prev, observacoesMultas: e.target.value }))} rows={2} className="mt-2" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Problemas Mecânicos/Elétricos</label>
                    <Textarea placeholder="Descreva qualquer problema..." value={newVehicleData.problemaMecanico} onChange={(e) => setNewVehicleData(prev => ({ ...prev, problemaMecanico: e.target.value }))} rows={3} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Etapa 3: Dividendos */}
          {addVehicleStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Etapa 3: Projeção de Dividendos</h3>
                <p className="text-sm text-muted-foreground">Defina o dividendo mensal para este veículo</p>
              </div>

              <Card className="border-primary">
                <CardHeader className="bg-primary/5">
                  <CardTitle>Dividendo do Veículo</CardTitle>
                  <CardDescription>Valor mensal para o investidor</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm"><strong>Veículo:</strong> {newVehicleData.vehicleName || "—"}</p>
                    <p className="text-sm"><strong>Placa:</strong> {newVehicleData.licensePlate || "—"}</p>
                    <p className="text-sm"><strong>Valor FIPE:</strong> {newVehicleData.fipeValue || "—"}</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                    <label className="text-sm font-medium mb-2 block">Dividendo Mensal *</label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">R$</span>
                      <Input type="text" value={newVehicleData.customDividend} onChange={(e) => setNewVehicleData(prev => ({ ...prev, customDividend: e.target.value.replace(/[^\d.,]/g, '') }))} placeholder="0,00" className="text-2xl font-bold h-14" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dia(s) de Pagamento</label>
                      <Input
                        type="text"
                        value={wizardBankData?.paymentDay || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d/]/g, '');
                          setWizardBankData({ ...wizardBankData, paymentDay: value });
                        }}
                        placeholder="10 ou 10/20/30"
                        data-testid="input-wizard-payment-day"
                      />
                      <p className="text-xs text-muted-foreground">Use "/" para múltiplas datas (ex: 16/20/30)</p>
                      {selectedInvestor?.paymentDate && (
                        <p className="text-xs text-muted-foreground">Dia atual: <span className="font-medium text-primary">Dia {selectedInvestor.paymentDate}</span></p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 p-3 rounded-lg border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="has-bonus-vehicle"
                          checked={newVehicleData.hasBonus || false}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              setNewVehicleData(prev => ({ ...prev, hasBonus: false, bonusDate: "", bonusValue: "" }));
                            } else {
                              setNewVehicleData(prev => ({ ...prev, hasBonus: true }));
                            }
                          }}
                          className="rounded"
                          data-testid="checkbox-has-bonus-vehicle"
                        />
                        <label htmlFor="has-bonus-vehicle" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-500" />
                          Tem Bônus por Agregar?
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">Bônus único pago ao investidor por adicionar este veículo à frota</p>
                      {newVehicleData.hasBonus && (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Data do Bônus</label>
                            <Input type="text" placeholder="DD/MM/AAAA" value={newVehicleData.bonusDate || ""} onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                              if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
                              setNewVehicleData(prev => ({ ...prev, bonusDate: value }));
                            }} maxLength={10} className="h-9" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Valor do Bônus</label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium">R$</span>
                              <Input type="text" placeholder="0,00" value={newVehicleData.bonusValue || ""} onChange={(e) => setNewVehicleData(prev => ({ ...prev, bonusValue: e.target.value.replace(/[^\d.,]/g, '') }))} className="h-9" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground mb-1">Dividendo Mensal</p>
                    <p className="text-3xl font-bold text-green-600">R$ {parseFloat(newVehicleData.customDividend?.replace(/\./g, '').replace(',', '.') || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Etapa 4: Fotos */}
          {addVehicleStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Etapa 4: Fotos de Vistoria</h3>
                <p className="text-sm text-muted-foreground">Tire fotos dos 4 ângulos do veículo (obrigatório)</p>
              </div>

              <Card className="border-cyan-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Car className="h-4 w-4 text-cyan-500" />Foto do Veículo para Exibição</CardTitle>
                  <CardDescription>Esta foto será exibida para os clientes no catálogo</CardDescription>
                </CardHeader>
                <CardContent>
                  {newVehiclePhotos.display ? (
                    <div className="relative max-w-md">
                      <img src={newVehiclePhotos.display} alt="Foto do veículo" className="w-full aspect-video object-cover rounded-lg border-2 border-cyan-500" />
                      <Button size="icon" variant="destructive" className="absolute top-2 right-2" onClick={() => setNewVehiclePhotos(prev => ({ ...prev, display: "" }))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video max-w-md rounded-lg border-2 border-dashed border-cyan-300 bg-cyan-50 dark:bg-cyan-950/20 cursor-pointer hover-elevate">
                      <Car className="h-12 w-12 text-cyan-500" />
                      <span className="text-sm text-cyan-600 mt-2">{processingPhoto ? "Processando..." : "Adicionar foto de exibição"}</span>
                      <span className="text-xs text-muted-foreground mt-1">Esta foto aparecerá no catálogo para clientes</span>
                      <input type="file" accept="image/*" className="hidden" disabled={processingPhoto} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProcessingPhoto(true);
                          try {
                            const compressed = await compressImage(file);
                            setNewVehiclePhotos(prev => ({ ...prev, display: compressed }));
                          } finally { setProcessingPhoto(false); }
                        }
                      }} />
                    </label>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "front" as const, label: "Frente" },
                  { key: "back" as const, label: "Traseira" },
                  { key: "leftSide" as const, label: "Lateral Esquerda" },
                  { key: "rightSide" as const, label: "Lateral Direita" },
                ].map((photo) => (
                  <div key={photo.key} className="space-y-2">
                    <label className="text-sm font-medium">{photo.label} *</label>
                    {newVehiclePhotos[photo.key] ? (
                      <div className="relative">
                        <img src={newVehiclePhotos[photo.key]} alt={photo.label} className="w-full aspect-video object-cover rounded-lg border-2 border-primary" />
                        <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => setNewVehiclePhotos(prev => ({ ...prev, [photo.key]: "" }))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 cursor-pointer hover-elevate">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">{processingPhoto ? "Processando..." : "Adicionar"}</span>
                        <input type="file" accept="image/*" className="hidden" disabled={processingPhoto} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleVehiclePhotoUpload(file, photo.key); }} />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Avarias Presentes</label>
                <div className="flex gap-3">
                  <Button variant={hasDamages === true ? "default" : "outline"} className={hasDamages === true ? "bg-orange-600 hover:bg-orange-700" : ""} onClick={() => setHasDamages(true)}>Sim</Button>
                  <Button variant={hasDamages === false ? "default" : "outline"} onClick={() => { setHasDamages(false); setDamagePhotos({}); setNewVehicleData(prev => ({ ...prev, observacoesAvarias: "" })); }}>Não</Button>
                </div>
                {hasDamages === true && (
                  <div className="space-y-4 p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observações sobre avarias</label>
                      <Textarea placeholder="Descreva as avarias encontradas..." value={newVehicleData.observacoesAvarias || ""} onChange={(e) => setNewVehicleData(prev => ({ ...prev, observacoesAvarias: e.target.value }))} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fotos das Avarias</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(damagePhotos).map(([key, url]) => (
                          <div key={key} className="relative">
                            <img src={url} alt={`Avaria ${key}`} className="w-full aspect-square object-cover rounded-lg border-2 border-orange-400" />
                            <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-5 w-5" onClick={() => setDamagePhotos(prev => { const newPhotos = { ...prev }; delete newPhotos[key]; return newPhotos; })}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 dark:bg-orange-950/30 cursor-pointer hover-elevate">
                          <Plus className="h-6 w-6 text-orange-500" />
                          <span className="text-xs text-orange-600 mt-1">{processingPhoto ? "..." : "Adicionar"}</span>
                          <input type="file" accept="image/*" className="hidden" disabled={processingPhoto} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setProcessingPhoto(true);
                              try {
                                const compressed = await compressImage(file);
                                const newKey = `damage_${Date.now()}`;
                                setDamagePhotos(prev => ({ ...prev, [newKey]: compressed }));
                              } finally { setProcessingPhoto(false); }
                            }
                          }} />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">Adicione quantas fotos de avarias forem necessárias</p>
                    </div>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Documentos do Veículo</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: "crlv" as const, label: "CRLV" },
                      { key: "laudoCautelar" as const, label: "Laudo Cautelar" },
                      { key: "laudoMecanico" as const, label: "Laudo Mecânico" },
                    ].map((doc) => (
                      <div key={doc.key} className="space-y-2">
                        <label className="text-sm font-medium">{doc.label}</label>
                        {newVehicleDocs[doc.key] ? (
                          <div className="flex items-center gap-2 p-2 border rounded-lg bg-green-50 dark:bg-green-950/20">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 flex-1 truncate">{doc.label} anexado</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewVehicleDocs(prev => ({ ...prev, [doc.key]: "" }))}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover-elevate">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Adicionar</span>
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProcessingPhoto(true);
                                try {
                                  if (file.type === 'application/pdf') {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => { setNewVehicleDocs(prev => ({ ...prev, [doc.key]: ev.target?.result as string })); };
                                    reader.readAsDataURL(file);
                                  } else {
                                    const compressed = await compressImage(file);
                                    setNewVehicleDocs(prev => ({ ...prev, [doc.key]: compressed }));
                                  }
                                } finally { setProcessingPhoto(false); }
                              }
                            }} />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Etapa 5: Contrato */}
          {addVehicleStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Etapa 5: Contrato de Cessão</h3>
                <p className="text-sm text-muted-foreground">Gere o contrato automaticamente ou anexe o documento assinado</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-primary/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" />Dados do Investidor</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Nome:</span><span className="font-medium">{wizardInvestorData?.name || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">CPF:</span><span className="font-medium">{wizardInvestorData?.cpf || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Telefone:</span><span className="font-medium">{wizardInvestorData?.phone || "—"}</span></div>
                    {wizardInvestorData?.rg && (
                      <div className="flex justify-between"><span className="text-muted-foreground">RG:</span><span className="font-medium">{wizardInvestorData.rg}</span></div>
                    )}
                    {wizardInvestorData?.email && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-medium text-xs">{wizardInvestorData.email}</span></div>
                    )}
                  </CardContent>
                </Card>
                <Card className="border-cyan-500/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4 text-cyan-500" />Dados do Veículo</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Veículo:</span><span className="font-medium">{newVehicleData.vehicleName || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Placa:</span><span className="font-medium">{newVehicleData.licensePlate || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Valor FIPE:</span><span className="font-medium">{newVehicleData.fipeValue || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Dividendo:</span><span className="font-medium text-green-600">R$ {newVehicleData.customDividend || "0"}</span></div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Gerar Contrato de Cessão</label>
                <p className="text-xs text-muted-foreground">
                  Gere automaticamente o contrato de cessão no modelo IMOBILICAR 2025
                </p>
                
                <Button
                  variant="secondary"
                  className="w-full"
                  data-testid="button-generate-add-vehicle-contract"
                  onClick={async () => {
                    if (!wizardInvestorData || !newVehicleData.vehicleName) {
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
                            name: wizardInvestorData.name || '',
                            cpf: wizardInvestorData.cpf || '',
                            rg: wizardInvestorData.rg || '',
                            phone: wizardInvestorData.phone || '',
                            email: wizardInvestorData.email || '',
                            street: wizardInvestorData.street || '',
                            complement: wizardInvestorData.complement || '',
                            neighborhood: wizardInvestorData.neighborhood || '',
                            city: wizardInvestorData.city || '',
                            state: wizardInvestorData.state || '',
                            zipCode: wizardInvestorData.zipCode || '',
                          },
                          vehicle: {
                            brand: newVehicleData.brand || '',
                            model: newVehicleData.model || newVehicleData.vehicleName || '',
                            year: newVehicleData.year || '',
                            plate: newVehicleData.licensePlate || '',
                            renavam: '',
                            chassi: '',
                          },
                          customDividend: newVehicleData.customDividend || '0',
                          bonusValue: wizardBankData.bonusValue || '0',
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
                      a.download = `Contrato de Cessao - ${wizardInvestorData.name} - ${newVehicleData.licensePlate || newVehicleData.vehicleName} - ${format(new Date(), "dd-MM-yyyy")}.docx`;
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
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Contrato de Cessão (IMOBILICAR 2025)
                </Button>
                
                <p className="text-xs text-muted-foreground italic">
                  As tabelas "Itens Verificados" e "Item de revisão/ajuste" ficam em branco para preenchimento manual.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Upload do Contrato Assinado *</label>
                <p className="text-xs text-muted-foreground">
                  Faça o upload do contrato de parceria assinado (PDF, imagem ou documento)
                </p>
                
                {wizardContractData?.fileUrl ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary bg-primary/5">
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="flex-1 font-medium">{wizardContractData.fileName || "Contrato anexado"}</span>
                    <Button size="sm" variant="destructive" onClick={() => setWizardContractData(null)}><Trash2 className="h-4 w-4 mr-2" />Remover</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                      <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-1">Nenhum contrato anexado</p>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" onClick={() => {
                      const input = document.getElementById('wizard-contract-input') as HTMLInputElement;
                      if (input) input.click();
                    }}>
                      <FileText className="h-4 w-4 mr-2" />Anexar Contrato Assinado
                    </Button>
                    <input id="wizard-contract-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setWizardContractData({ fileName: file.name, fileUrl: ev.target?.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Etapa 6: Confirmação */}
          {addVehicleStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Etapa 6: Confirmação</h3>
                <p className="text-sm text-muted-foreground">Revise os dados antes de confirmar</p>
              </div>

              <Card className="border-primary/30">
                <CardHeader><CardTitle className="text-md flex items-center gap-2"><User className="h-5 w-5 text-primary" />Investidor</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Nome</p><p className="font-medium">{wizardInvestorData?.name || "-"}</p></div>
                  <div><p className="text-muted-foreground">CPF</p><p className="font-medium">{wizardInvestorData?.cpf || "-"}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-md flex items-center gap-2"><Car className="h-5 w-5 text-cyan-500" />Novo Veículo</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Veículo</p><p className="font-medium">{newVehicleData.vehicleName || "-"}</p></div>
                  <div><p className="text-muted-foreground">Placa</p><p className="font-medium">{newVehicleData.licensePlate || "-"}</p></div>
                  <div><p className="text-muted-foreground">Valor FIPE</p><p className="font-medium text-primary">{newVehicleData.fipeValue || "-"}</p></div>
                  <div><p className="text-muted-foreground">Dividendo Mensal</p><p className="font-medium text-green-600">R$ {newVehicleData.customDividend || "0"}</p></div>
                </CardContent>
              </Card>

              {wizardBankData?.hasBonus && (wizardBankData?.bonusDate || wizardBankData?.bonusValue) && (
                <Card className="border-amber-500/30">
                  <CardHeader className="pb-2"><CardTitle className="text-md flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-500" />Bônus por Agregar</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Data do Bônus</p><p className="font-medium">{wizardBankData.bonusDate || "-"}</p></div>
                    <div><p className="text-muted-foreground">Valor do Bônus</p><p className="font-medium text-amber-600">R$ {wizardBankData.bonusValue || "0"}</p></div>
                  </CardContent>
                </Card>
              )}

              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Ao confirmar, será criado:</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>- Novo veículo associado ao investidor</li>
                      <li>- Dividendo mensal configurado</li>
                      <li>- Fotos de vistoria registradas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navegação */}
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddVehicleStep(prev => Math.max(1, prev - 1) as 1|2|3|4|5|6)} disabled={addVehicleStep === 1}>
              Anterior
            </Button>
            
            {addVehicleStep < 6 ? (
              <Button onClick={() => {
                if (addVehicleStep === 2) {
                  if (!newVehicleData.vehicleName || !newVehicleData.category) {
                    toast({ title: "Dados incompletos", description: "Selecione o veículo na tabela FIPE e a categoria.", variant: "destructive" });
                    return;
                  }
                }
                if (addVehicleStep === 4) {
                  const requiredPhotos = ['front', 'back', 'leftSide', 'rightSide'] as const;
                  const missingPhotos = requiredPhotos.filter(key => !newVehiclePhotos[key]);
                  if (missingPhotos.length > 0) {
                    toast({ title: "Fotos obrigatórias faltando", description: "Por favor, anexe todas as 4 fotos de vistoria.", variant: "destructive" });
                    return;
                  }
                }
                if (addVehicleStep === 5) {
                  if (!wizardContractData?.fileUrl) {
                    toast({ title: "Contrato obrigatório", description: "Por favor, anexe o contrato antes de continuar.", variant: "destructive" });
                    return;
                  }
                }
                setAddVehicleStep(prev => Math.min(6, prev + 1) as 1|2|3|4|5|6);
              }}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmitNewVehicle} disabled={addVehicleToInvestorMutation.isPending}>
                {addVehicleToInvestorMutation.isPending ? "Adicionando..." : "Confirmar e Adicionar Veículo"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
