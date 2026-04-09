import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Camera, Trash2, Car, Users, Fuel, Settings, DollarSign, Tag, Eye, EyeOff, Edit, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";
import { processFileUpload, compressImage } from "@/pages/crm/utils/fileUtils";
import { fetchFipeBrands, fetchFipeModels, fetchFipeYears, fetchFipePrice, parseFipePrice } from "@/pages/crm/utils/fipeApi";
import type { FipeBrand, FipeModel, FipeYear } from "@/pages/crm/utils/fipeApi";
import FileUploadZone from "@/pages/crm/components/shared/FileUploadZone";
import placeholderVehicle from "@assets/logo_imobile_1765389205488.png";

// Função auxiliar para formatar valor monetário em Real Brasileiro
const formatCurrency = (value: string): string => {
  // Remove tudo que não é dígito
  const numericValue = value.replace(/\D/g, "");
  
  if (!numericValue) return "";
  
  // Converte para número e formata
  const number = parseFloat(numericValue) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(number);
};

// Função auxiliar para remover formatação e retornar apenas o número
const parseCurrency = (value: string): string => {
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue) return "";
  return (parseFloat(numericValue) / 100).toFixed(2);
};

export default function VehicleManagement({ showOnlyTradeIns = false, readOnly = false }: { showOnlyTradeIns?: boolean; readOnly?: boolean }) {
  const { toast } = useToast();
  const { vehicles, tradeInVehicles, customers, financings, vehicleRequests, isLoading, invalidate } = useCrmData();

  // Estados para gerenciamento de veículos
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [vehicleFormData, setVehicleFormData] = useState<any>({
    crlvDocumentUrl: null,
    laudoCautelarUrl: null,
    laudoMecanicoUrl: null,
    otherDocumentsUrls: []
  });
  const [selectedInvestorForVehicle, setSelectedInvestorForVehicle] = useState<string>("");
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [bulkImportData, setBulkImportData] = useState("");
  const [parsedVehicles, setParsedVehicles] = useState<any[]>([]);

  // Estados para consulta FIPE no bulk import
  const [bulkFipeBrands, setBulkFipeBrands] = useState<FipeBrand[]>([]);
  const [bulkFipeModels, setBulkFipeModels] = useState<FipeModel[]>([]);
  const [bulkFipeYears, setBulkFipeYears] = useState<FipeYear[]>([]);
  const [bulkSelectedBrand, setBulkSelectedBrand] = useState<string>("");
  const [bulkSelectedModel, setBulkSelectedModel] = useState<string>("");
  const [bulkSelectedYear, setBulkSelectedYear] = useState<string>("");
  const [bulkLoadingFipe, setBulkLoadingFipe] = useState(false);
  const [bulkFipeValue, setBulkFipeValue] = useState<string>("");
  const [bulkManualBrandInput, setBulkManualBrandInput] = useState<string>("");
  const [bulkManualModelInput, setBulkManualModelInput] = useState<string>("");
  const [bulkVehicleType, setBulkVehicleType] = useState<"aluguel" | "investimento">("aluguel");

  const bulkLastBrandRequestRef = useRef<string>("");
  const bulkLastModelRequestRef = useRef<string>("");
  const bulkLastConsultaRequestRef = useRef<string>("");

  // Estados FIPE para formulário de edição de veículos
  const [editVehicleFipeBrands, setEditVehicleFipeBrands] = useState<FipeBrand[]>([]);
  const [editVehicleFipeModels, setEditVehicleFipeModels] = useState<FipeModel[]>([]);
  const [editVehicleFipeYears, setEditVehicleFipeYears] = useState<FipeYear[]>([]);
  const [editVehicleSelectedBrand, setEditVehicleSelectedBrand] = useState<string>("");
  const [editVehicleSelectedModel, setEditVehicleSelectedModel] = useState<string>("");
  const [editVehicleSelectedYear, setEditVehicleSelectedYear] = useState<string>("");
  const [editVehicleLoadingFipe, setEditVehicleLoadingFipe] = useState(false);
  const [editVehicleManualBrandInput, setEditVehicleManualBrandInput] = useState<string>("");
  const [editVehicleManualModelInput, setEditVehicleManualModelInput] = useState<string>("");

  const editVehicleLastBrandRequestRef = useRef<string>("");
  const editVehicleLastModelRequestRef = useRef<string>("");
  const editVehicleLastConsultaRequestRef = useRef<string>("");

  // Estados para adicionar veículo de troca à frota
  const [addTradeInToFleetDialogOpen, setAddTradeInToFleetDialogOpen] = useState(false);
  const [selectedTradeInForFleet, setSelectedTradeInForFleet] = useState<any>(null);
  const [tradeInFleetData, setTradeInFleetData] = useState<any>({
    pricePerDay: "",
    pricePerMonth: "",
    imageUrl: ""
  });
  const [processingTradeInFleetPhoto, setProcessingTradeInFleetPhoto] = useState(false);

  // Estado para dialog de detalhes do veículo de troca
  const [tradeInDetailsDialogOpen, setTradeInDetailsDialogOpen] = useState(false);
  const [selectedTradeInDetails, setSelectedTradeInDetails] = useState<any>(null);

  // Estados para filtros de pesquisa e status
  const [searchName, setSearchName] = useState("");
  const [searchPlate, setSearchPlate] = useState("");
  const [searchBrandModel, setSearchBrandModel] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estados para dialog de detalhes do veículo (da frota)
  const [vehicleDetailsDialogOpen, setVehicleDetailsDialogOpen] = useState(false);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<any>(null);
  const [vehicleInspections, setVehicleInspections] = useState<any[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; label: string } | null>(null);

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

  // Mutations para veículos
  const createVehicleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/vehicles", data);
    },
    onSuccess: () => {
      invalidate.vehicles();
      toast({
        title: "Veículo adicionado!",
        description: "Veículo cadastrado com sucesso.",
      });
      setVehicleDialogOpen(false);
      setVehicleFormData({
        crlvDocumentUrl: null,
        laudoCautelarUrl: null,
        laudoMecanicoUrl: null,
        otherDocumentsUrls: []
      });
      setSelectedInvestorForVehicle("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar veículo",
        description: error.message || "Ocorreu um erro ao adicionar o veículo.",
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/vehicles/${id}`, data);
    },
    onSuccess: (_data, variables) => {
      invalidate.vehicles();
      toast({
        title: "Veículo atualizado!",
        description: "Dados do veículo atualizados com sucesso.",
      });
      setVehicleDialogOpen(false);
      setEditingVehicle(null);
      setVehicleFormData({
        crlvDocumentUrl: null,
        laudoCautelarUrl: null,
        laudoMecanicoUrl: null,
        otherDocumentsUrls: []
      });

      // Preservar posição do scroll - rolar de volta ao card atualizado
      setTimeout(() => {
        const cardElement = document.querySelector(`[data-vehicle-card-id="${variables.id}"]`);
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar veículo",
        description: error.message || "Ocorreu um erro ao atualizar o veículo.",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/vehicles/${id}`, {});
    },
    onSuccess: () => {
      invalidate.vehicles();
      invalidate.customers();
      invalidate.investors();
      toast({
        title: "Veículo removido!",
        description: "Veículo removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover veículo",
        description: error.message || "Ocorreu um erro ao remover o veículo.",
        variant: "destructive",
      });
    },
  });

  const addTradeInToFleetMutation = useMutation({
    mutationFn: async (data: any) => {
      // Extrair valor FIPE numérico se existir
      // Formato brasileiro: 10.963,00 ou 10.963.00 -> 10963.00
      let fipeValueNumeric: string | undefined = undefined;
      if (data.fipeValue) {
        // Remove R$ e espaços, remove pontos de milhares, converte vírgula em ponto decimal
        let cleaned = String(data.fipeValue).replace(/[R$\s]/g, '');
        // Se tem vírgula como decimal (formato BR 10.963,00)
        if (cleaned.includes(',')) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          // Se não tem vírgula, assume pontos de milhares e último como decimal
          // Exemplo: 10.963.00 -> precisa identificar se é 10963.00 ou outro formato
          const parts = cleaned.split('.');
          if (parts.length > 2) {
            // Múltiplos pontos: juntar todos exceto o último como parte inteira
            const decimalPart = parts.pop();
            cleaned = parts.join('') + '.' + decimalPart;
          }
        }
        if (cleaned && !isNaN(parseFloat(cleaned))) {
          fipeValueNumeric = cleaned;
        }
      }
      
      // Usar primeira foto do trade-in se nenhuma nova foi fornecida
      let imageUrl = data.imageUrl;
      if (!imageUrl && data.photosUrls && data.photosUrls.length > 0) {
        imageUrl = data.photosUrls[0];
      }
      
      const vehicleData = {
        name: `${data.brand} ${data.model}`,
        brand: data.brand,
        model: data.model,
        year: parseInt(data.year),
        licensePlate: data.plate || `TROCA-${Date.now()}`,
        category: data.category || "Econômico",
        pricePerDay: data.pricePerDay && data.pricePerDay.trim() !== "" ? data.pricePerDay : "0",
        monthlyPrice: data.pricePerMonth && data.pricePerMonth.trim() !== "" ? data.pricePerMonth : undefined,
        imageUrl: imageUrl || undefined,
        color: "Não especificado",
        fuel: "Flex",
        transmission: "Manual",
        seats: 5,
        available: true,
        isTradeIn: true,
        tradeInValue: data.acceptedValue ? String(data.acceptedValue) : undefined,
        tradeInCustomerName: data.customerName,
        tradeInStatus: "em_estoque",
        // Campos adicionais do veículo de troca
        mileage: data.mileage ? parseInt(data.mileage) : undefined,
        fipeValue: fipeValueNumeric,
        laudoCautelarUrl: data.cautelarUrl || undefined,
        // Salvar fotos originais como galeria adicional
        additionalPhotos: data.photosUrls && data.photosUrls.length > 0 ? JSON.stringify(data.photosUrls) : undefined,
      };
      return await apiRequest("POST", "/api/vehicles", vehicleData);
    },
    onSuccess: () => {
      invalidate.vehicles();
      toast({
        title: "Veículo adicionado à frota!",
        description: "Veículo de troca adicionado com sucesso.",
      });
      setAddTradeInToFleetDialogOpen(false);
      setSelectedTradeInForFleet(null);
      setTradeInFleetData({
        pricePerDay: "",
        pricePerMonth: "",
        imageUrl: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar veículo",
        description: error.message || "Ocorreu um erro ao adicionar o veículo à frota.",
        variant: "destructive",
      });
    },
  });

  const bulkCreateVehiclesMutation = useMutation({
    mutationFn: async (vehicles: any[]) => {
      const promises = vehicles.map(vehicle => apiRequest("POST", "/api/vehicles", vehicle));
      return await Promise.all(promises);
    },
    onSuccess: (data) => {
      invalidate.vehicles();
      toast({
        title: "Veículos importados!",
        description: `${data.length} veículo(s) cadastrado(s) com sucesso.`,
      });
      setBulkImportDialogOpen(false);
      setBulkImportData("");
      setParsedVehicles([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao importar veículos",
        description: error.message || "Ocorreu um erro ao importar os veículos.",
        variant: "destructive",
      });
    },
  });

  // Funções FIPE para formulário de edição de veículos
  const fetchEditVehicleFipeBrands = async () => {
    try {
      const brands = await fetchFipeBrands();
      setEditVehicleFipeBrands(brands);
    } catch (error) {
      console.error('Error fetching FIPE brands:', error);
      toast({
        title: "Erro ao buscar marcas",
        description: "Não foi possível carregar as marcas FIPE.",
        variant: "destructive",
      });
    }
  };

  const fetchEditVehicleFipeModels = async (brandCode: string) => {
    const requestId = `${brandCode}-${Date.now()}`;
    editVehicleLastBrandRequestRef.current = requestId;

    try {
      const models = await fetchFipeModels(brandCode);

      if (editVehicleLastBrandRequestRef.current === requestId) {
        setEditVehicleFipeModels(models);
      }
    } catch (error) {
      console.error('Error fetching FIPE models:', error);
      toast({
        title: "Erro ao buscar modelos",
        description: "Não foi possível carregar os modelos FIPE.",
        variant: "destructive",
      });
    }
  };

  const fetchEditVehicleFipeYears = async (brandCode: string, modelCode: string) => {
    const requestId = `${brandCode}-${modelCode}-${Date.now()}`;
    editVehicleLastModelRequestRef.current = requestId;

    try {
      const years = await fetchFipeYears(brandCode, modelCode);

      if (editVehicleLastModelRequestRef.current === requestId) {
        setEditVehicleFipeYears(years);
      }
    } catch (error) {
      console.error('Error fetching FIPE years:', error);
      toast({
        title: "Erro ao buscar anos",
        description: "Não foi possível carregar os anos FIPE.",
        variant: "destructive",
      });
    }
  };

  const consultEditVehicleFipe = async () => {
    if (!editVehicleSelectedBrand || !editVehicleSelectedModel || !editVehicleSelectedYear) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione marca, modelo e ano antes de consultar.",
        variant: "destructive",
      });
      return;
    }

    setEditVehicleLoadingFipe(true);
    const requestId = `${editVehicleSelectedBrand}-${editVehicleSelectedModel}-${editVehicleSelectedYear}-${Date.now()}`;
    editVehicleLastConsultaRequestRef.current = requestId;

    try {
      const data = await fetchFipePrice(editVehicleSelectedBrand, editVehicleSelectedModel, editVehicleSelectedYear);

      if (editVehicleLastConsultaRequestRef.current === requestId) {
        // Preencher dados do veículo automaticamente
        const brandObj = editVehicleFipeBrands.find(b => b.code === editVehicleSelectedBrand);
        const modelObj = editVehicleFipeModels.find(m => m.code === editVehicleSelectedModel);

        const fipeValueNumeric = parseFipePrice(data.price);

        setVehicleFormData({
          ...vehicleFormData,
          name: data.model || "",
          brand: brandObj?.name || data.brand || "",
          model: modelObj?.name || "",
          year: data.modelYear || new Date().getFullYear(),
          fipeValue: fipeValueNumeric.toString(),
          fuel: data.fuel || vehicleFormData.fuel || "Flex"
        });

        toast({
          title: "Consulta FIPE realizada",
          description: `Valor FIPE: ${data.price || "Não disponível"}`,
        });
      }
    } catch (error) {
      console.error('Error consulting FIPE:', error);
      toast({
        title: "Erro ao consultar FIPE",
        description: "Não foi possível consultar o valor FIPE.",
        variant: "destructive",
      });
    } finally {
      if (editVehicleLastConsultaRequestRef.current === requestId) {
        setEditVehicleLoadingFipe(false);
      }
    }
  };

  // Effect para carregar marcas FIPE quando abrir o diálogo de veículo (adicionar ou editar)
  useEffect(() => {
    if (vehicleDialogOpen) {
      if (editVehicleFipeBrands.length === 0) {
        fetchEditVehicleFipeBrands();
      }
    } else {
      // Limpar estados FIPE quando fechar o diálogo
      setEditVehicleFipeBrands([]);
      setEditVehicleFipeModels([]);
      setEditVehicleFipeYears([]);
      setEditVehicleSelectedBrand("");
      setEditVehicleSelectedModel("");
      setEditVehicleSelectedYear("");
      setEditVehicleManualBrandInput("");
      setEditVehicleManualModelInput("");
    }
  }, [vehicleDialogOpen]);

  // Effect para carregar modelos quando marca for selecionada
  useEffect(() => {
    if (editVehicleSelectedBrand) {
      setEditVehicleFipeModels([]);
      setEditVehicleFipeYears([]);
      setEditVehicleSelectedModel("");
      setEditVehicleSelectedYear("");
      fetchEditVehicleFipeModels(editVehicleSelectedBrand);
    }
  }, [editVehicleSelectedBrand]);

  // Effect para carregar anos quando modelo for selecionado
  useEffect(() => {
    if (editVehicleSelectedBrand && editVehicleSelectedModel) {
      setEditVehicleFipeYears([]);
      setEditVehicleSelectedYear("");
      fetchEditVehicleFipeYears(editVehicleSelectedBrand, editVehicleSelectedModel);
    }
  }, [editVehicleSelectedModel]);

  // Effect para consultar FIPE automaticamente quando ano for selecionado
  useEffect(() => {
    if (editVehicleSelectedBrand && editVehicleSelectedModel && editVehicleSelectedYear) {
      consultEditVehicleFipe();
    }
  }, [editVehicleSelectedYear]);

  // Effect para auto-matching de marca e modelo com inputs manuais
  useEffect(() => {
    if (editVehicleManualBrandInput && editVehicleFipeBrands.length > 0) {
      const match = editVehicleFipeBrands.find(b =>
        b.name.toLowerCase().includes(editVehicleManualBrandInput.toLowerCase())
      );
      if (match && match.code !== editVehicleSelectedBrand) {
        setEditVehicleSelectedBrand(match.code);
      }
    }
  }, [editVehicleManualBrandInput, editVehicleFipeBrands]);

  useEffect(() => {
    if (editVehicleManualModelInput && editVehicleFipeModels.length > 0) {
      const match = editVehicleFipeModels.find(m =>
        m.name.toLowerCase().includes(editVehicleManualModelInput.toLowerCase())
      );
      if (match && match.code !== editVehicleSelectedModel) {
        setEditVehicleSelectedModel(match.code);
      }
    }
  }, [editVehicleManualModelInput, editVehicleFipeModels]);

  // Effect para carregar marcas FIPE no bulk import quando abrir o diálogo
  useEffect(() => {
    if (bulkImportDialogOpen && bulkFipeBrands.length === 0) {
      fetchFipeBrands().then(setBulkFipeBrands).catch(console.error);
    }
  }, [bulkImportDialogOpen]);

  return (
    <div className="space-y-4">
      {/* Frota Tab */}
      {!showOnlyTradeIns && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Frota</CardTitle>
            <CardDescription>
              Gerenciamento de veículos
            </CardDescription>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkImportDialogOpen(true);
                  setParsedVehicles([]);
                  setBulkImportData("");
                }}
                data-testid="button-bulk-import-vehicles"
              >
                <FileText className="h-4 w-4 mr-2" />
                Importar Múltiplos
              </Button>
              <Button
                onClick={() => {
                  setEditingVehicle(null);
                  setVehicleFormData({
                    crlvDocumentUrl: null,
                    laudoCautelarUrl: null,
                    laudoMecanicoUrl: null,
                    otherDocumentsUrls: []
                  });
                  setVehicleDialogOpen(true);
                }}
                data-testid="button-add-vehicle"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Veículo
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros de Pesquisa */}
          <div className="bg-muted/50 p-6 rounded-xl border border-muted-foreground/10 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Filtros de Pesquisa</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  Nome do Veículo
                </label>
                <Input
                  placeholder="Buscar por nome..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  data-testid="input-search-vehicle-name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  Placa
                </label>
                <Input
                  placeholder="Buscar por placa..."
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                  data-testid="input-search-vehicle-plate"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Marca/Modelo
                </label>
                <Input
                  placeholder="Buscar por marca ou modelo..."
                  value={searchBrandModel}
                  onChange={(e) => setSearchBrandModel(e.target.value)}
                  data-testid="input-search-brand-model"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="unavailable">Indisponível</SelectItem>
                    <SelectItem value="financed">Financiado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Contador de resultados */}
            {(searchName || searchPlate || searchBrandModel || statusFilter !== "all") && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const filtered = vehicles?.filter((vehicle: any) => {
                      const matchesName = !searchName || vehicle.name?.toLowerCase().includes(searchName.toLowerCase());
                      const matchesPlate = !searchPlate || vehicle.licensePlate?.toUpperCase().includes(searchPlate);
                      const matchesBrandModel = !searchBrandModel || 
                        vehicle.brand?.toLowerCase().includes(searchBrandModel.toLowerCase()) ||
                        vehicle.model?.toLowerCase().includes(searchBrandModel.toLowerCase());
                      
                      let matchesStatus = true;
                      if (statusFilter === "available") matchesStatus = vehicle.available === true;
                      else if (statusFilter === "unavailable") matchesStatus = vehicle.available === false;
                      else if (statusFilter === "financed") matchesStatus = vehicle.isFinanced === true;
                      
                      return matchesName && matchesPlate && matchesBrandModel && matchesStatus;
                    }) || [];
                    
                    return `${filtered.length} veículo${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;
                  })()}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchName("");
                    setSearchPlate("");
                    setSearchBrandModel("");
                    setStatusFilter("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
          
          {/* Lista de Veículos */}
          {isLoading.vehicles ? (
            <p className="text-center text-muted-foreground py-8">Carregando veículos...</p>
          ) : (() => {
            // Aplicar filtros
            const filteredVehicles = vehicles?.filter((vehicle: any) => {
              const matchesName = !searchName || vehicle.name?.toLowerCase().includes(searchName.toLowerCase());
              const matchesPlate = !searchPlate || vehicle.licensePlate?.toUpperCase().includes(searchPlate);
              const matchesBrandModel = !searchBrandModel || 
                vehicle.brand?.toLowerCase().includes(searchBrandModel.toLowerCase()) ||
                vehicle.model?.toLowerCase().includes(searchBrandModel.toLowerCase());
              
              let matchesStatus = true;
              if (statusFilter === "available") matchesStatus = vehicle.available === true;
              else if (statusFilter === "unavailable") matchesStatus = vehicle.available === false;
              else if (statusFilter === "financed") matchesStatus = vehicle.isFinanced === true;
              
              return matchesName && matchesPlate && matchesBrandModel && matchesStatus;
            }) || [];
            
            return filteredVehicles.length > 0 ? (
            <div className="space-y-6">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden hover-elevate transition-all" data-vehicle-card-id={vehicle.id}>
                  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0">
                    {/* Foto do veículo */}
                    <div className={`relative aspect-video lg:aspect-[4/5] overflow-hidden ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'bg-gray-900' : 'bg-muted'}`}>
                      <img
                        src={vehicle.imageUrl && !vehicle.imageUrl.includes('placeholder') ? vehicle.imageUrl : placeholderVehicle}
                        alt={vehicle.name}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-2 mt-[20px] mb-[20px]">
                        <Badge variant={vehicle.available ? "default" : "secondary"} className="shadow-lg">
                          {vehicle.available ? "Disponível" : "Indisponível"}
                        </Badge>
                        {vehicle.isInvestorVehicle && (
                          <Badge variant="outline" className="bg-background/95 shadow-lg">Investimento</Badge>
                        )}
                        {vehicle.isFinanced && (
                          <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50/95 dark:bg-purple-950/95 shadow-lg">Financiado</Badge>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo principal */}
                    <div className="p-6 space-y-6">
                      {/* Header com nome e placa */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold tracking-tight mb-1">
                              {vehicle.name}
                            </h3>
                            <p className="text-muted-foreground">
                              {vehicle.brand} {vehicle.model} • {vehicle.year}
                            </p>
                          </div>
                          {vehicle.licensePlate && (
                            <Badge variant="outline" className="font-mono text-lg px-4 py-2 border-2 border-primary/50 text-primary font-bold">
                              {vehicle.licensePlate}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Especificações */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                        {vehicle.licensePlate && (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Placa</p>
                              <p className="font-medium font-mono">{vehicle.licensePlate}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Categoria</p>
                            <p className="font-medium">{vehicle.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Câmbio</p>
                            <p className="font-medium">{vehicle.transmission}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Motor</p>
                            <p className="font-medium">{vehicle.fuel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Ocupantes</p>
                            <p className="font-medium">{vehicle.seats} pessoas</p>
                          </div>
                        </div>
                        {vehicle.mileage && (
                          <div className="flex items-center gap-2 col-span-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Quilometragem</p>
                              <p className="font-medium">{Number(vehicle.mileage).toLocaleString('pt-BR')} KM</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Preços e Valores */}
                      {vehicle.fipeValue && (
                        <div className="flex justify-center">
                          <div className="p-4 rounded-lg border bg-card min-w-[200px]">
                            <div className="flex items-center gap-2 mb-2 justify-center">
                              <Tag className="h-4 w-4 text-primary" />
                              <p className="text-xs font-medium text-muted-foreground">Valor FIPE</p>
                            </div>
                            <p className="text-2xl font-bold text-primary text-center">
                              R$ {Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Investidor e Status */}
                      <div className="space-y-3">
                        {vehicle.isInvestorVehicle && vehicle.ownerId && (() => {
                          const owner = customers?.find((c: any) => c.id === vehicle.ownerId);
                          return owner ? (
                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Investidor</p>
                                <p className="font-medium">{owner.name}</p>
                              </div>
                            </div>
                          ) : null;
                        })()}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {!vehicle.isFinanced && (
                            <Badge
                              variant="outline"
                              className={vehicle.availableForFinancing
                                ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950"
                                : "border-gray-400 text-gray-600 bg-gray-50 dark:bg-gray-900"}
                            >
                              {vehicle.availableForFinancing ? "✓ Financiamento Disponível" : "✗ Sem Financiamento"}
                            </Badge>
                          )}
                          {vehicle.isPubliclyVisible === false && (
                            <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Oculto da Frota
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="pt-4 border-t flex flex-wrap gap-2">
                        {!readOnly && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingVehicle(vehicle);
                                setVehicleFormData({
                                  ...vehicle,
                                  otherDocumentsUrls: (vehicle.otherDocumentsUrls || []).map((doc: string) => {
                                    try {
                                      return JSON.parse(doc);
                                    } catch {
                                      return { label: "", fileUrl: doc };
                                    }
                                  })
                                });
                                setSelectedInvestorForVehicle(vehicle.ownerId ? vehicle.ownerId.toString() : "none");
                                setVehicleDialogOpen(true);
                              }}
                              data-testid={`button-edit-vehicle-${vehicle.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateVehicleMutation.mutate({
                                  id: vehicle.id,
                                  data: { available: !vehicle.available }
                                });
                              }}
                              data-testid={`button-toggle-availability-${vehicle.id}`}
                            >
                              {vehicle.available ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                              {vehicle.available ? "Marcar Indisponível" : "Marcar Disponível"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateVehicleMutation.mutate({
                                  id: vehicle.id,
                                  data: { availableForFinancing: !vehicle.availableForFinancing }
                                });
                              }}
                              data-testid={`button-toggle-financing-${vehicle.id}`}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              {vehicle.availableForFinancing ? "Remover de Financiamento" : "Disponível p/ Financiamento"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateVehicleMutation.mutate({
                                  id: vehicle.id,
                                  data: { isPubliclyVisible: !vehicle.isPubliclyVisible }
                                });
                              }}
                              data-testid={`button-toggle-public-visibility-${vehicle.id}`}
                            >
                              {vehicle.isPubliclyVisible ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                              {vehicle.isPubliclyVisible ? "Remover da Frota" : "Adicionar à Frota"}
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setSelectedVehicleDetails(vehicle);
                            setVehicleDetailsDialogOpen(true);
                            setLoadingInspections(true);
                            try {
                              const response = await fetch(`/api/vehicles/${vehicle.id}/inspections`);
                              if (response.ok) {
                                const data = await response.json();
                                setVehicleInspections(data);
                              }
                            } catch (error) {
                              console.error('Error fetching inspections:', error);
                            } finally {
                              setLoadingInspections(false);
                            }
                          }}
                          data-testid={`button-view-vehicle-details-${vehicle.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja remover ${vehicle.name}?`)) {
                                deleteVehicleMutation.mutate(vehicle.id);
                              }
                            }}
                            data-testid={`button-delete-vehicle-${vehicle.id}`}
                            className="ml-auto text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {(searchName || searchPlate || searchBrandModel || statusFilter !== "all") 
                ? "Nenhum veículo encontrado com os filtros aplicados."
                : readOnly ? "Nenhum veículo cadastrado na frota." : "Nenhum veículo cadastrado. Clique em 'Adicionar Veículo' para começar."}
            </p>
          )
          })()}
        </CardContent>
      </Card>
      )}

      {/* Veículos de Troca Tab */}
      {showOnlyTradeIns && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Veículos de Troca</CardTitle>
            <CardDescription>
              Gerenciamento de veículos recebidos em troca
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingVehicle(null);
              setVehicleFormData({ 
                isTradeIn: true,
                crlvDocumentUrl: null,
                laudoCautelarUrl: null,
                laudoMecanicoUrl: null,
                otherDocumentsUrls: []
              });
              setVehicleDialogOpen(true);
            }}
            data-testid="button-add-trade-in-vehicle"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Veículo de Troca
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading.vehicles || isLoading.tradeInVehicles ? (
            <p className="text-center text-muted-foreground py-8">Carregando veículos...</p>
          ) : (() => {
            // Mostrar apenas veículos de troca que ainda não foram processados/adicionados à frota
            // Não incluir veículos que já fazem parte da frota operacional
            const financingTradeIns = tradeInVehicles || [];
            const hasAnyTradeIn = financingTradeIns.length > 0;

            return hasAnyTradeIn ? (
              <div className="space-y-4">
                {/* Veículos de troca de financiamentos */}
                {financingTradeIns.map((tradeIn: any) => {
                  const financing = financings?.find((f: any) => f.id === tradeIn.financingId);
                  const customer = customers?.find((c: any) => c.id === tradeIn.customerId);

                  // Verificar se este veículo de troca já foi adicionado à frota
                  const normalizePlate = (plate: string) => plate?.trim().toUpperCase().replace(/\s+/g, '');
                  const tradeInPlate = normalizePlate(tradeIn.plate);
                  const alreadyInFleet = vehicles?.some((v: any) =>
                    v.isTradeIn && normalizePlate(v.licensePlate) === tradeInPlate
                  );

                  return (
                    <Card 
                      key={`tradein-${tradeIn.id}`} 
                      className={`overflow-hidden cursor-pointer hover-elevate ${alreadyInFleet ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-950/30' : 'border-orange-200 dark:border-orange-800'}`}
                      onClick={() => {
                        setSelectedTradeInDetails({ ...tradeIn, financing, customer, alreadyInFleet });
                        setTradeInDetailsDialogOpen(true);
                      }}
                      data-testid={`card-trade-in-${tradeIn.id}`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 p-4">
                        {/* Detalhes do veículo */}
                        <div className="space-y-3 md:col-span-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950">
                                Veículo de Troca - Financiamento
                              </Badge>
                              <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950">
                                {tradeIn.status === "accepted" ? "Aceito" : tradeIn.status === "rejected" ? "Rejeitado" : "Pendente"}
                              </Badge>
                              {alreadyInFleet && (
                                <Badge variant="default" className="bg-green-600 text-white">
                                  Adicionado à Frota
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold">
                              {tradeIn.plate ? `[${tradeIn.plate}] ` : ""}{tradeIn.brand} {tradeIn.model}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Ano: {tradeIn.year}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                            <div>
                              <span className="font-medium">Placa:</span> {tradeIn.plate}
                            </div>
                            {tradeIn.category && (
                              <div>
                                <span className="font-medium">Categoria:</span> {tradeIn.category}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Valor Aceito:</span> R$ {Number(tradeIn.acceptedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            {tradeIn.fipeValue && (
                              <div>
                                <span className="font-medium">Valor FIPE:</span> {tradeIn.fipeValue}
                              </div>
                            )}
                            <div className="md:col-span-2">
                              <span className="font-medium">Cliente:</span> {customer?.name || financing?.customerName || "Não identificado"}
                              {(customer?.cpf || financing?.customerCpf) && ` (CPF: ${customer?.cpf || financing?.customerCpf})`}
                            </div>
                            {financing && (
                              <div className="md:col-span-3">
                                <span className="font-medium">Financiamento ID:</span> {financing.id.substring(0, 8)}...
                                <span className="text-muted-foreground ml-2">
                                  (Veículo: {vehicles?.find((v: any) => v.id === financing.vehicleId)?.name || "Não encontrado"})
                                </span>
                              </div>
                            )}
                          </div>

                          {tradeIn.cautelarUrl && (
                            <div className="pt-2">
                              <a
                                href={tradeIn.cautelarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                📄 Ver Documento Cautelar
                              </a>
                            </div>
                          )}

                          {/* Botão para adicionar à frota */}
                          <div className="pt-3 border-t">
                            {alreadyInFleet ? (
                              <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Veículo já adicionado à frota
                              </p>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTradeInForFleet(tradeIn);
                                  setTradeInFleetData({
                                    pricePerDay: "",
                                    pricePerMonth: "",
                                    imageUrl: ""
                                  });
                                  setAddTradeInToFleetDialogOpen(true);
                                }}
                                data-testid={`button-add-to-fleet-${tradeIn.id}`}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar à Frota
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum veículo de troca registrado.
              </p>
            );
          })()}
        </CardContent>
      </Card>
      )}

      {/* Dialog para Adicionar/Editar Veículo */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? "Editar Veículo" : "Adicionar Veículo"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do veículo
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-lg space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Consultar Tabela FIPE</h4>
              <Button
                size="sm"
                onClick={consultEditVehicleFipe}
                disabled={editVehicleLoadingFipe || !editVehicleSelectedBrand || !editVehicleSelectedModel || !editVehicleSelectedYear}
                data-testid="button-consult-fipe"
              >
                {editVehicleLoadingFipe ? "Consultando..." : "Consultar FIPE"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Marca FIPE</label>
                <Select
                  value={editVehicleSelectedBrand}
                  onValueChange={(value) => setEditVehicleSelectedBrand(value)}
                >
                  <SelectTrigger data-testid="select-fipe-brand">
                    <SelectValue placeholder={editVehicleFipeBrands.length === 0 ? "Carregando..." : "Selecione a marca"} />
                  </SelectTrigger>
                  <SelectContent>
                    {editVehicleFipeBrands.map((brand) => (
                      <SelectItem key={brand.code} value={brand.code}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Busca Manual de Marca</label>
                <Input
                  placeholder="Digite para buscar marca"
                  value={editVehicleManualBrandInput}
                  onChange={(e) => setEditVehicleManualBrandInput(e.target.value)}
                  data-testid="input-manual-brand"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Modelo FIPE</label>
                <Select
                  value={editVehicleSelectedModel}
                  onValueChange={(value) => setEditVehicleSelectedModel(value)}
                  disabled={!editVehicleSelectedBrand}
                >
                  <SelectTrigger data-testid="select-fipe-model">
                    <SelectValue placeholder={!editVehicleSelectedBrand ? "Selecione a marca primeiro" : editVehicleFipeModels.length === 0 ? "Carregando..." : "Selecione o modelo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {editVehicleFipeModels.map((model) => (
                      <SelectItem key={model.code} value={model.code}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Busca Manual de Modelo</label>
                <Input
                  placeholder="Digite para buscar modelo"
                  value={editVehicleManualModelInput}
                  onChange={(e) => setEditVehicleManualModelInput(e.target.value)}
                  disabled={!editVehicleSelectedBrand}
                  data-testid="input-manual-model"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Ano FIPE</label>
                <Select
                  value={editVehicleSelectedYear}
                  onValueChange={(value) => setEditVehicleSelectedYear(value)}
                  disabled={!editVehicleSelectedModel}
                >
                  <SelectTrigger data-testid="select-fipe-year">
                    <SelectValue placeholder={!editVehicleSelectedModel ? "Selecione o modelo primeiro" : editVehicleFipeYears.length === 0 ? "Carregando..." : "Selecione o ano"} />
                  </SelectTrigger>
                  <SelectContent>
                    {editVehicleFipeYears.map((year) => (
                      <SelectItem key={year.code} value={year.code}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Veículo *</label>
              <Input
                placeholder="Ex: Fiat Argo 1.0"
                value={vehicleFormData.name || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, name: e.target.value })}
                data-testid="input-vehicle-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Placa *</label>
              <Input
                placeholder="Ex: ABC-1234"
                value={vehicleFormData.licensePlate || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, licensePlate: e.target.value.toUpperCase() })}
                data-testid="input-vehicle-license-plate"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Renavam</label>
              <Input
                placeholder="Ex: 0-12345678901"
                maxLength={14}
                value={vehicleFormData.renavam || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9-]/g, '');
                  setVehicleFormData({ ...vehicleFormData, renavam: value });
                }}
                data-testid="input-vehicle-renavam"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chassi</label>
              <Input
                placeholder="Ex: 9BWZZZ377VT004251"
                maxLength={17}
                value={vehicleFormData.chassi || ""}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  setVehicleFormData({ ...vehicleFormData, chassi: value });
                }}
                data-testid="input-vehicle-chassi"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Marca *</label>
              <Input
                placeholder="Ex: Fiat"
                value={vehicleFormData.brand || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, brand: e.target.value })}
                data-testid="input-vehicle-brand"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Modelo *</label>
              <Input
                placeholder="Ex: Argo"
                value={vehicleFormData.model || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value })}
                data-testid="input-vehicle-model"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ano *</label>
              <Input
                type="number"
                placeholder="2024"
                value={vehicleFormData.year || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, year: parseInt(e.target.value) })}
                data-testid="input-vehicle-year"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria *</label>
              <Select
                value={vehicleFormData.category || ""}
                onValueChange={(value) => setVehicleFormData({ ...vehicleFormData, category: value })}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Motor</label>
              <Input
                placeholder="Ex: 1.0 Flex"
                value={vehicleFormData.fuel || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, fuel: e.target.value })}
                data-testid="input-vehicle-fuel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Número de Ocupantes *</label>
              <Input
                type="number"
                placeholder="5"
                value={vehicleFormData.seats || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, seats: parseInt(e.target.value) })}
                data-testid="input-vehicle-seats"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Câmbio *</label>
              <Select
                value={vehicleFormData.transmission || ""}
                onValueChange={(value) => setVehicleFormData({ ...vehicleFormData, transmission: value })}
              >
                <SelectTrigger data-testid="select-vehicle-transmission">
                  <SelectValue placeholder="Selecione o câmbio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automático">Automático</SelectItem>
                  <SelectItem value="CVT">CVT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor FIPE</label>
              {editingVehicle ? (
                <Input
                  type="number"
                  step="0.01"
                  placeholder="50000.00"
                  value={vehicleFormData.fipeValue || ""}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, fipeValue: e.target.value })}
                  data-testid="input-vehicle-fipe"
                />
              ) : (
                vehicleFormData.fipeValue ? (
                  <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">✓ Valor consultado automaticamente na FIPE:</p>
                    <p className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(parseFloat(vehicleFormData.fipeValue))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Você pode editar o valor abaixo se necessário</p>
                    <Input
                      type="text"
                      placeholder="R$ 50.000,00"
                      value={vehicleFormData.fipeValue ? formatCurrency((parseFloat(vehicleFormData.fipeValue) * 100).toString()) : ""}
                      onChange={(e) => {
                        const parsedValue = parseCurrency(e.target.value);
                        setVehicleFormData({ ...vehicleFormData, fipeValue: parsedValue });
                      }}
                      data-testid="input-vehicle-fipe"
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <Input
                    type="text"
                    placeholder="R$ 50.000,00"
                    value={vehicleFormData.fipeValue ? formatCurrency((parseFloat(vehicleFormData.fipeValue) * 100).toString()) : ""}
                    onChange={(e) => {
                      const parsedValue = parseCurrency(e.target.value);
                      setVehicleFormData({ ...vehicleFormData, fipeValue: parsedValue });
                    }}
                    data-testid="input-vehicle-fipe"
                  />
                )
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quilometragem (KM)</label>
              <Input
                type="number"
                placeholder="Ex: 50000"
                value={vehicleFormData.mileage || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, mileage: e.target.value ? parseInt(e.target.value) : undefined })}
                data-testid="input-vehicle-mileage"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="border-t pt-4">
                <h4 className="text-md font-semibold mb-3">Informações do Veículo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Possui Seguro?</label>
                    <Select
                      value={vehicleFormData.hasInsurance ? "sim" : "nao"}
                      onValueChange={(value) => {
                        setVehicleFormData({ 
                          ...vehicleFormData, 
                          hasInsurance: value === "sim",
                          insuranceValue: value !== "sim" ? undefined : vehicleFormData.insuranceValue
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-vehicle-insurance">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {vehicleFormData.hasInsurance && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor do Seguro (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 2500.00"
                        value={vehicleFormData.insuranceValue || ""}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, insuranceValue: e.target.value })}
                        data-testid="input-vehicle-insurance-value"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status do IPVA</label>
                    <Select
                      value={vehicleFormData.ipvaStatus || ""}
                      onValueChange={(value) => {
                        let ipvaValue = value !== "pago" ? undefined : vehicleFormData.ipvaValue;
                        
                        // Se "pago" for selecionado, calcular automaticamente 4% do valor FIPE
                        if (value === "pago" && vehicleFormData.fipeValue) {
                          const fipeVal = parseFloat(String(vehicleFormData.fipeValue).replace(/[^\d.]/g, '')) || 0;
                          ipvaValue = (fipeVal * 0.04).toFixed(2);
                        }
                        
                        setVehicleFormData({ 
                          ...vehicleFormData, 
                          ipvaStatus: value,
                          ipvaValue
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-vehicle-ipva-status">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="nao_pago">Não Pago</SelectItem>
                        <SelectItem value="isento">Isento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {vehicleFormData.ipvaStatus === "pago" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Valor do IPVA (R$)
                        <span className="text-xs text-muted-foreground ml-1">
                          (padrão: 4% da tabela FIPE)
                        </span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1500.00"
                        value={vehicleFormData.ipvaValue || ""}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, ipvaValue: e.target.value })}
                        data-testid="input-vehicle-ipva-value"
                      />
                      <p className="text-xs text-muted-foreground">
                        Calculado automaticamente como 4% da tabela FIPE. Você pode alterar manualmente.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tem Multas?</label>
                    <Select
                      value={vehicleFormData.temMultas === true ? "sim" : vehicleFormData.temMultas === false ? "nao" : ""}
                      onValueChange={(value) => {
                        setVehicleFormData({ 
                          ...vehicleFormData, 
                          temMultas: value === "sim",
                          observacoesMultas: value !== "sim" ? "" : vehicleFormData.observacoesMultas
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-vehicle-multas">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {vehicleFormData.temMultas !== undefined && vehicleFormData.temMultas !== null && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Observações sobre Multas</label>
                      <Textarea
                        placeholder="Descreva detalhes sobre as multas..."
                        value={vehicleFormData.observacoesMultas || ""}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, observacoesMultas: e.target.value })}
                        rows={2}
                        data-testid="input-vehicle-multas-obs"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">É de Leilão?</label>
                    <Select
                      value={vehicleFormData.eDeLeilao === true ? "sim" : vehicleFormData.eDeLeilao === false ? "nao" : ""}
                      onValueChange={(value) => {
                        setVehicleFormData({ 
                          ...vehicleFormData, 
                          eDeLeilao: value === "sim"
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-vehicle-leilao">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Licenciamento Pago?</label>
                    <Select
                      value={vehicleFormData.licenciamentoPago === true ? "sim" : vehicleFormData.licenciamentoPago === false ? "nao" : ""}
                      onValueChange={(value) => {
                        setVehicleFormData({ 
                          ...vehicleFormData, 
                          licenciamentoPago: value === "sim"
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-vehicle-licenciamento">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tem Rastreador?</label>
                    <Select
                      value={vehicleFormData.temRastreador === true ? "sim" : vehicleFormData.temRastreador === false ? "nao" : ""}
                      onValueChange={(value) => {
                        setVehicleFormData({ 
                          ...vehicleFormData, 
                          temRastreador: value === "sim"
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-vehicle-rastreador">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tem Documento?</label>
                    <Select
                      value={vehicleFormData.temDocumento === true ? "sim" : vehicleFormData.temDocumento === false ? "nao" : ""}
                      onValueChange={(value) => {
                        setVehicleFormData({ 
                          ...vehicleFormData, 
                          temDocumento: value === "sim"
                        });
                      }}
                    >
                      <SelectTrigger data-testid="select-vehicle-documento">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor da Diária *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={vehicleFormData.pricePerDay || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, pricePerDay: e.target.value })}
                data-testid="input-vehicle-price-day"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor do Plano Mensal</label>
              <Input
                type="number"
                step="0.01"
                placeholder="3000.00"
                value={vehicleFormData.monthlyPrice || ""}
                onChange={(e) => setVehicleFormData({ ...vehicleFormData, monthlyPrice: e.target.value })}
                data-testid="input-vehicle-price-month"
              />
            </div>

            <div className="md:col-span-2 space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold">Documentos do Veículo (Opcional)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FileUploadZone
                  label="CRLV"
                  fileData={vehicleFormData.crlvDocumentUrl ? { fileName: "CRLV", fileUrl: vehicleFormData.crlvDocumentUrl } : null}
                  onFileChange={(data) => setVehicleFormData({ ...vehicleFormData, crlvDocumentUrl: data?.fileUrl || null })}
                  accept=".pdf,.jpg,.jpeg,.png"
                  description="PDF, JPG ou PNG"
                  testId="upload-crlv"
                />
                
                <FileUploadZone
                  label="Laudo Cautelar"
                  fileData={vehicleFormData.laudoCautelarUrl ? { fileName: "Laudo Cautelar", fileUrl: vehicleFormData.laudoCautelarUrl } : null}
                  onFileChange={(data) => setVehicleFormData({ ...vehicleFormData, laudoCautelarUrl: data?.fileUrl || null })}
                  accept=".pdf,.jpg,.jpeg,.png"
                  description="PDF, JPG ou PNG"
                  testId="upload-laudo-cautelar"
                />
                
                <FileUploadZone
                  label="Laudo Mecânico"
                  fileData={vehicleFormData.laudoMecanicoUrl ? { fileName: "Laudo Mecânico", fileUrl: vehicleFormData.laudoMecanicoUrl } : null}
                  onFileChange={(data) => setVehicleFormData({ ...vehicleFormData, laudoMecanicoUrl: data?.fileUrl || null })}
                  accept=".pdf,.jpg,.jpeg,.png"
                  description="PDF, JPG ou PNG"
                  testId="upload-laudo-mecanico"
                />
              </div>

              {/* Outros Documentos */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Outros Documentos</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const currentDocs = vehicleFormData.otherDocumentsUrls || [];
                      setVehicleFormData({
                        ...vehicleFormData,
                        otherDocumentsUrls: [...currentDocs, { label: "", fileUrl: "" }]
                      });
                    }}
                    data-testid="button-add-other-document"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Documento
                  </Button>
                </div>

                {vehicleFormData.otherDocumentsUrls && vehicleFormData.otherDocumentsUrls.length > 0 && (
                  <div className="space-y-3">
                    {vehicleFormData.otherDocumentsUrls.map((doc: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Documento #{index + 1}</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const updated = vehicleFormData.otherDocumentsUrls.filter((_: any, i: number) => i !== index);
                                setVehicleFormData({ ...vehicleFormData, otherDocumentsUrls: updated });
                              }}
                              data-testid={`button-remove-other-document-${index}`}
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
                                const updated = [...vehicleFormData.otherDocumentsUrls];
                                updated[index] = { ...updated[index], label: e.target.value };
                                setVehicleFormData({ ...vehicleFormData, otherDocumentsUrls: updated });
                              }}
                              data-testid={`input-other-document-label-${index}`}
                            />
                          </div>

                          <FileUploadZone
                            label="Arquivo do Documento"
                            fileData={doc.fileUrl ? { fileName: doc.label || `Documento ${index + 1}`, fileUrl: doc.fileUrl } : null}
                            onFileChange={(data) => {
                              const updated = [...vehicleFormData.otherDocumentsUrls];
                              updated[index] = { ...updated[index], fileUrl: data?.fileUrl || "" };
                              setVehicleFormData({ ...vehicleFormData, otherDocumentsUrls: updated });
                            }}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            description="PDF, JPG, PNG ou DOCX"
                            testId={`upload-other-document-${index}`}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Avarias */}
            <div className="md:col-span-2 space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400">Avarias do Veículo</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Possui Avarias?</label>
                  <Select
                    value={vehicleFormData.hasDamage ? "sim" : "nao"}
                    onValueChange={(value) => {
                      setVehicleFormData({ 
                        ...vehicleFormData, 
                        hasDamage: value === "sim",
                        damageDescription: value !== "sim" ? "" : vehicleFormData.damageDescription
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-vehicle-has-damage">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {vehicleFormData.hasDamage && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Descrição das Avarias</label>
                    <Textarea
                      placeholder="Descreva detalhadamente as avarias do veículo..."
                      value={vehicleFormData.damageDescription || ""}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, damageDescription: e.target.value })}
                      rows={3}
                      data-testid="input-vehicle-damage-description"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Foto do Veículo *</label>
              {vehicleFormData.imageUrl ? (
                <div className="space-y-2">
                  <div className="relative">
                    <img
                      src={vehicleFormData.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <label className="flex-1" data-testid="button-vehicle-image-replace">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          Trocar Foto
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const base64 = await processFileUpload(file);
                              setVehicleFormData({ ...vehicleFormData, imageUrl: base64 });
                            } catch (error) {
                              console.error('Erro ao processar imagem:', error);
                            }
                          }
                        }}
                        data-testid="input-vehicle-image-replace"
                      />
                    </label>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setVehicleFormData({ ...vehicleFormData, imageUrl: "" })}
                      data-testid="button-remove-vehicle-image"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer bg-muted/50 transition-colors">
                  <Camera className="h-12 w-12 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium mb-1">Clique para fazer upload</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG ou URL</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const base64 = await processFileUpload(file);
                          setVehicleFormData({ ...vehicleFormData, imageUrl: base64 });
                        } catch (error) {
                          console.error('Erro ao processar imagem:', error);
                        }
                      }
                    }}
                    data-testid="input-vehicle-image"
                  />
                </label>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVehicleDialogOpen(false);
                setEditingVehicle(null);
                setVehicleFormData({
                  crlvDocumentUrl: null,
                  laudoCautelarUrl: null,
                  laudoMecanicoUrl: null,
                  otherDocumentsUrls: []
                });
                setSelectedInvestorForVehicle("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!vehicleFormData.name || !vehicleFormData.licensePlate || !vehicleFormData.brand || !vehicleFormData.model ||
                  !vehicleFormData.year || !vehicleFormData.category || !vehicleFormData.transmission ||
                  !vehicleFormData.seats || !vehicleFormData.pricePerDay || !vehicleFormData.imageUrl) {
                  toast({
                    title: "Campos obrigatórios",
                    description: "Preencha todos os campos obrigatórios (*)",
                    variant: "destructive",
                  });
                  return;
                }

                if (editingVehicle) {
                  const vehicleData = {
                    ...vehicleFormData,
                    ownerId: selectedInvestorForVehicle && selectedInvestorForVehicle !== "none" ? selectedInvestorForVehicle : null,
                    otherDocumentsUrls: (vehicleFormData.otherDocumentsUrls || [])
                      .filter((doc: any) => doc && doc.fileUrl)
                      .map((doc: any) => JSON.stringify(doc))
                  };
                  updateVehicleMutation.mutate({
                    id: editingVehicle.id,
                    data: vehicleData
                  });
                } else {
                  const vehicleData = {
                    ...vehicleFormData,
                    ownerId: selectedInvestorForVehicle && selectedInvestorForVehicle !== "none" ? selectedInvestorForVehicle : null,
                    otherDocumentsUrls: (vehicleFormData.otherDocumentsUrls || [])
                      .filter((doc: any) => doc && doc.fileUrl)
                      .map((doc: any) => JSON.stringify(doc))
                  };
                  createVehicleMutation.mutate(vehicleData);
                }
              }}
              disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending}
              data-testid="button-save-vehicle"
            >
              {createVehicleMutation.isPending || updateVehicleMutation.isPending ? "Salvando..." : "Salvar Veículo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Importação em Massa */}
      <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Múltiplos Veículos</DialogTitle>
            <DialogDescription>
              Preencha a tabela abaixo para adicionar vários veículos de uma vez
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setParsedVehicles([...parsedVehicles, {
                    name: "",
                    licensePlate: "",
                    brand: "",
                    model: "",
                    year: 2024,
                    category: "Econômico",
                    fuel: "Flex",
                    seats: 5,
                    transmission: "Manual",
                    fipeValue: "",
                    pricePerDay: "",
                    monthlyPrice: "",
                    isInvestorVehicle: false,
                    ownerId: null,
                    imageUrl: ""
                  }]);
                }}
                data-testid="button-add-row"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Linha
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const examples = [
                    {
                      name: "Fiat Argo 1.0",
                      licensePlate: "ABC-1234",
                      brand: "Fiat",
                      model: "Argo",
                      year: 2024,
                      category: "Econômico",
                      fuel: "1.0 Flex",
                      seats: 5,
                      transmission: "Manual",
                      fipeValue: "65000",
                      pricePerDay: "150",
                      monthlyPrice: "3000",
                      isInvestorVehicle: false,
                      ownerId: null,
                      imageUrl: ""
                    },
                    {
                      name: "Chevrolet Onix Plus",
                      licensePlate: "XYZ-5678",
                      brand: "Chevrolet",
                      model: "Onix Plus",
                      year: 2023,
                      category: "Sedan",
                      fuel: "1.0 Turbo",
                      seats: 5,
                      transmission: "Automático",
                      fipeValue: "75000",
                      pricePerDay: "180",
                      monthlyPrice: "3500",
                      isInvestorVehicle: false,
                      ownerId: null,
                      imageUrl: ""
                    },
                    {
                      name: "Toyota Corolla",
                      licensePlate: "DEF-9012",
                      brand: "Toyota",
                      model: "Corolla",
                      year: 2024,
                      category: "Sedan",
                      fuel: "2.0 Hybrid",
                      seats: 5,
                      transmission: "CVT",
                      fipeValue: "145000",
                      pricePerDay: "250",
                      monthlyPrice: "5000",
                      isInvestorVehicle: true,
                      ownerId: null,
                      imageUrl: ""
                    }
                  ];
                  setParsedVehicles(examples);
                }}
              >
                Carregar Exemplos
              </Button>
            </div>

            {/* Consulta FIPE */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Consulta Tabela FIPE</p>
                  {bulkFipeValue && (
                    <Badge variant="default" className="text-base px-3 py-1">
                      Valor FIPE: {bulkFipeValue}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Marca</label>
                    <Select
                      value={bulkSelectedBrand}
                      onValueChange={async (value) => {
                        const requestId = Date.now().toString();
                        bulkLastBrandRequestRef.current = requestId;

                        setBulkSelectedBrand(value);
                        setBulkSelectedModel("");
                        setBulkSelectedYear("");
                        setBulkFipeModels([]);
                        setBulkFipeYears([]);
                        setBulkFipeValue("");

                        if (!value) return;

                        setBulkLoadingFipe(true);
                        try {
                          const models = await fetchFipeModels(value);

                          if (bulkLastBrandRequestRef.current !== requestId) return;

                          setBulkFipeModels(models);
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Falha ao carregar modelos da FIPE",
                            variant: "destructive",
                          });
                        } finally {
                          if (bulkLastBrandRequestRef.current === requestId) {
                            setBulkLoadingFipe(false);
                          }
                        }
                      }}
                      disabled={bulkLoadingFipe}
                    >
                      <SelectTrigger data-testid="select-bulk-fipe-brand">
                        <SelectValue placeholder={bulkLoadingFipe ? "Carregando..." : "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        {bulkFipeBrands.map((brand) => (
                          <SelectItem key={brand.code} value={brand.code}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Ou digite a marca"
                      value={bulkManualBrandInput}
                      onChange={(e) => setBulkManualBrandInput(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Modelo</label>
                    <Select
                      value={bulkSelectedModel}
                      onValueChange={async (value) => {
                        const requestId = Date.now().toString();
                        bulkLastModelRequestRef.current = requestId;

                        setBulkSelectedModel(value);
                        setBulkSelectedYear("");
                        setBulkFipeYears([]);
                        setBulkFipeValue("");

                        if (!value || !bulkSelectedBrand) return;

                        setBulkLoadingFipe(true);
                        try {
                          const years = await fetchFipeYears(bulkSelectedBrand, value);

                          if (bulkLastModelRequestRef.current !== requestId) return;

                          setBulkFipeYears(years);
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Falha ao carregar anos da FIPE",
                            variant: "destructive",
                          });
                        } finally {
                          if (bulkLastModelRequestRef.current === requestId) {
                            setBulkLoadingFipe(false);
                          }
                        }
                      }}
                      disabled={!bulkSelectedBrand || bulkLoadingFipe || bulkFipeModels.length === 0}
                    >
                      <SelectTrigger data-testid="select-bulk-fipe-model">
                        <SelectValue placeholder={bulkLoadingFipe ? "Carregando..." : bulkFipeModels.length === 0 ? "Selecione a marca" : "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        {bulkFipeModels.map((model) => (
                          <SelectItem key={model.code} value={model.code}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Ou digite o modelo"
                      value={bulkManualModelInput}
                      onChange={(e) => setBulkManualModelInput(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ano</label>
                    <Select
                      value={bulkSelectedYear}
                      onValueChange={async (value) => {
                        const requestId = Date.now().toString();
                        bulkLastConsultaRequestRef.current = requestId;

                        setBulkSelectedYear(value);
                        setBulkFipeValue("");

                        if (!value || !bulkSelectedBrand || !bulkSelectedModel) return;

                        setBulkLoadingFipe(true);
                        try {
                          const data = await fetchFipePrice(bulkSelectedBrand, bulkSelectedModel, value);

                          if (bulkLastConsultaRequestRef.current !== requestId) return;

                          setBulkFipeValue(data.price || "");
                        } catch (error) {
                          toast({
                            title: "Erro",
                            description: "Falha ao consultar valor na FIPE",
                            variant: "destructive",
                          });
                        } finally {
                          if (bulkLastConsultaRequestRef.current === requestId) {
                            setBulkLoadingFipe(false);
                          }
                        }
                      }}
                      disabled={!bulkSelectedModel || bulkLoadingFipe || bulkFipeYears.length === 0}
                    >
                      <SelectTrigger data-testid="select-bulk-fipe-year">
                        <SelectValue placeholder={bulkLoadingFipe ? "Carregando..." : bulkFipeYears.length === 0 ? "Selecione o modelo" : "Selecione"} />
                      </SelectTrigger>
                      <SelectContent>
                        {bulkFipeYears.map((year) => (
                          <SelectItem key={year.code} value={year.code}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Veículo</label>
                    <Select
                      value={bulkVehicleType}
                      onValueChange={(value: "aluguel" | "investimento") => setBulkVehicleType(value)}
                    >
                      <SelectTrigger data-testid="select-bulk-vehicle-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluguel">Aluguel</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ação</label>
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!bulkSelectedBrand || !bulkSelectedModel || !bulkSelectedYear) {
                          toast({
                            title: "Campos obrigatórios",
                            description: "Selecione marca, modelo e ano para consultar",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Encontrar os nomes das seleções
                        const brand = bulkFipeBrands.find(b => b.code === bulkSelectedBrand);
                        const model = bulkFipeModels.find(m => m.code === bulkSelectedModel);
                        const year = bulkFipeYears.find(y => y.code === bulkSelectedYear);

                        // Preencher dados com base na consulta FIPE
                        const newVehicle = {
                          name: `${brand?.name || bulkManualBrandInput} ${model?.name || bulkManualModelInput}`,
                          licensePlate: "",
                          brand: brand?.name || bulkManualBrandInput,
                          model: model?.name || bulkManualModelInput,
                          year: year ? parseInt(year.name.split('/')[0]) : 2024,
                          category: "Econômico",
                          fuel: "Flex",
                          seats: 5,
                          transmission: "Manual",
                          fipeValue: parseFipePrice(bulkFipeValue).toString() || "",
                          pricePerDay: "",
                          monthlyPrice: "",
                          isInvestorVehicle: bulkVehicleType === "investimento",
                          ownerId: null,
                          imageUrl: ""
                        };

                        setParsedVehicles([...parsedVehicles, newVehicle]);

                        toast({
                          title: "Veículo adicionado",
                          description: "Veículo adicionado à tabela com dados da FIPE",
                        });
                      }}
                      disabled={!bulkFipeValue || bulkLoadingFipe}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar à Tabela
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {parsedVehicles.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[60vh] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left min-w-[150px]">Nome *</th>
                        <th className="p-2 text-left min-w-[100px]">Placa *</th>
                        <th className="p-2 text-left min-w-[100px]">Marca *</th>
                        <th className="p-2 text-left min-w-[100px]">Modelo *</th>
                        <th className="p-2 text-left min-w-[80px]">Ano *</th>
                        <th className="p-2 text-left min-w-[100px]">Categoria *</th>
                        <th className="p-2 text-left min-w-[100px]">Motor</th>
                        <th className="p-2 text-left min-w-[80px]">Ocup. *</th>
                        <th className="p-2 text-left min-w-[100px]">Câmbio *</th>
                        <th className="p-2 text-left min-w-[100px]">FIPE</th>
                        <th className="p-2 text-left min-w-[100px]">Diária *</th>
                        <th className="p-2 text-left min-w-[100px]">Mensal</th>
                        <th className="p-2 text-left min-w-[100px]">Tipo</th>
                        <th className="p-2 text-left min-w-[50px]">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedVehicles.map((vehicle, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-1">
                            <Input
                              value={vehicle.name}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].name = e.target.value;
                                setParsedVehicles(updated);
                              }}
                              placeholder="Nome"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={vehicle.licensePlate || ""}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].licensePlate = e.target.value.toUpperCase();
                                setParsedVehicles(updated);
                              }}
                              placeholder="Placa"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={vehicle.brand}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].brand = e.target.value;
                                setParsedVehicles(updated);
                              }}
                              placeholder="Marca"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              value={vehicle.model}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].model = e.target.value;
                                setParsedVehicles(updated);
                              }}
                              placeholder="Modelo"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={vehicle.year}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].year = parseInt(e.target.value);
                                setParsedVehicles(updated);
                              }}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Select
                              value={vehicle.category}
                              onValueChange={(value) => {
                                const updated = [...parsedVehicles];
                                updated[index].category = value;
                                setParsedVehicles(updated);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
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
                          </td>
                          <td className="p-1">
                            <Input
                              value={vehicle.fuel}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].fuel = e.target.value;
                                setParsedVehicles(updated);
                              }}
                              placeholder="Motor"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={vehicle.seats}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].seats = parseInt(e.target.value);
                                setParsedVehicles(updated);
                              }}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Select
                              value={vehicle.transmission}
                              onValueChange={(value) => {
                                const updated = [...parsedVehicles];
                                updated[index].transmission = value;
                                setParsedVehicles(updated);
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Automático">Automático</SelectItem>
                                <SelectItem value="CVT">CVT</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={vehicle.fipeValue}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].fipeValue = e.target.value;
                                setParsedVehicles(updated);
                              }}
                              placeholder="FIPE"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={vehicle.pricePerDay}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].pricePerDay = e.target.value;
                                setParsedVehicles(updated);
                              }}
                              placeholder="Diária"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={vehicle.monthlyPrice}
                              onChange={(e) => {
                                const updated = [...parsedVehicles];
                                updated[index].monthlyPrice = e.target.value;
                                setParsedVehicles(updated);
                              }}
                              placeholder="Mensal"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Badge variant={vehicle.isInvestorVehicle ? "default" : "secondary"} className="text-xs">
                              {vehicle.isInvestorVehicle ? "Inv" : "Alug"}
                            </Badge>
                          </td>
                          <td className="p-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const updated = parsedVehicles.filter((_, i) => i !== index);
                                setParsedVehicles(updated);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkImportDialogOpen(false);
                setParsedVehicles([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (parsedVehicles.length === 0) {
                  toast({
                    title: "Nenhum veículo",
                    description: "Adicione pelo menos um veículo à tabela.",
                    variant: "destructive",
                  });
                  return;
                }

                // Validar campos obrigatórios
                const invalid = parsedVehicles.some(v =>
                  !v.name || !v.licensePlate || !v.brand || !v.model || !v.year ||
                  !v.category || !v.transmission || !v.seats || !v.pricePerDay
                );

                if (invalid) {
                  toast({
                    title: "Campos obrigatórios",
                    description: "Preencha todos os campos obrigatórios (*) em todos os veículos.",
                    variant: "destructive",
                  });
                  return;
                }

                bulkCreateVehiclesMutation.mutate(parsedVehicles);
              }}
              disabled={bulkCreateVehiclesMutation.isPending || parsedVehicles.length === 0}
              data-testid="button-import-vehicles"
            >
              {bulkCreateVehiclesMutation.isPending ? "Importando..." : `Importar ${parsedVehicles.length} Veículo(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Veículo de Troca à Frota */}
      <Dialog open={addTradeInToFleetDialogOpen} onOpenChange={setAddTradeInToFleetDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Veículo à Frota</DialogTitle>
            <DialogDescription>
              Defina os valores de locação e a foto do veículo antes de adicionar à frota
            </DialogDescription>
          </DialogHeader>

          {selectedTradeInForFleet && (
            <div className="space-y-6">
              {/* Informações do Veículo */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-lg">
                  {selectedTradeInForFleet.brand} {selectedTradeInForFleet.model} - {selectedTradeInForFleet.year}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Placa:</span> {selectedTradeInForFleet.plate}
                  </div>
                  {selectedTradeInForFleet.category && (
                    <div>
                      <span className="font-medium">Categoria:</span> {selectedTradeInForFleet.category}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Valor Aceito:</span> R$ {Number(selectedTradeInForFleet.acceptedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Valor da Diária <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tradeInFleetData.pricePerDay}
                      onChange={(e) => setTradeInFleetData((prev: any) => ({ ...prev, pricePerDay: e.target.value }))}
                      placeholder="200.00"
                      data-testid="input-trade-in-price-per-day"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Valor Mensal <span className="text-muted-foreground font-normal">(opcional)</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tradeInFleetData.pricePerMonth}
                      onChange={(e) => setTradeInFleetData((prev: any) => ({ ...prev, pricePerMonth: e.target.value }))}
                      placeholder="3000.00"
                      data-testid="input-trade-in-price-per-month"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Foto do Veículo <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProcessingTradeInFleetPhoto(true);
                        try {
                          const compressed = await compressImage(file);
                          setTradeInFleetData((prev: any) => ({ ...prev, imageUrl: compressed }));
                          toast({
                            title: "Foto processada!",
                            description: "Foto comprimida e pronta para upload.",
                          });
                        } catch (error: any) {
                          console.error("Erro ao comprimir imagem:", error);
                          toast({
                            title: "Erro ao processar foto",
                            description: error.message || "Tente novamente.",
                            variant: "destructive",
                          });
                        } finally {
                          setProcessingTradeInFleetPhoto(false);
                        }
                      }
                    }}
                    disabled={processingTradeInFleetPhoto}
                    data-testid="input-trade-in-photo"
                  />
                  {processingTradeInFleetPhoto && (
                    <p className="text-sm text-muted-foreground">Processando imagem...</p>
                  )}
                  {tradeInFleetData.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={tradeInFleetData.imageUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddTradeInToFleetDialogOpen(false);
                setSelectedTradeInForFleet(null);
                setTradeInFleetData({
                  pricePerDay: "",
                  pricePerMonth: "",
                  imageUrl: ""
                });
              }}
              data-testid="button-cancel-add-to-fleet"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const financing = financings?.find((f: any) => f.id === selectedTradeInForFleet.financingId);
                const customer = customers?.find((c: any) => c.id === selectedTradeInForFleet.customerId);

                addTradeInToFleetMutation.mutate({
                  ...selectedTradeInForFleet,
                  pricePerDay: tradeInFleetData.pricePerDay,
                  pricePerMonth: tradeInFleetData.pricePerMonth,
                  imageUrl: tradeInFleetData.imageUrl,
                  customerName: customer?.name || financing?.customerName || "Cliente não identificado"
                });
              }}
              disabled={addTradeInToFleetMutation.isPending || processingTradeInFleetPhoto}
              data-testid="button-confirm-add-to-fleet"
            >
              {addTradeInToFleetMutation.isPending ? "Adicionando..." : "Adicionar à Frota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Veículo de Troca */}
      <Dialog open={tradeInDetailsDialogOpen} onOpenChange={setTradeInDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Detalhes do Veículo de Troca
            </DialogTitle>
            <DialogDescription>
              Informações completas do veículo recebido em troca
            </DialogDescription>
          </DialogHeader>

          {selectedTradeInDetails && (
            <div className="space-y-6">
              {/* Badges de Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950">
                  Veículo de Troca - Financiamento
                </Badge>
                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950">
                  {selectedTradeInDetails.status === "accepted" ? "Aceito" : selectedTradeInDetails.status === "rejected" ? "Rejeitado" : "Pendente"}
                </Badge>
                {selectedTradeInDetails.alreadyInFleet && (
                  <Badge variant="default" className="bg-green-600 text-white">
                    Adicionado à Frota
                  </Badge>
                )}
              </div>

              {/* Informações Principais */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-xl font-bold mb-2">
                  {selectedTradeInDetails.plate ? `[${selectedTradeInDetails.plate}] ` : ""}{selectedTradeInDetails.brand} {selectedTradeInDetails.model}
                </h3>
                <p className="text-muted-foreground">Ano: {selectedTradeInDetails.year}</p>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Dados do Veículo</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Placa:</span>
                      <span className="font-medium">{selectedTradeInDetails.plate || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marca:</span>
                      <span className="font-medium">{selectedTradeInDetails.brand || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modelo:</span>
                      <span className="font-medium">{selectedTradeInDetails.model || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ano:</span>
                      <span className="font-medium">{selectedTradeInDetails.year || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoria:</span>
                      <span className="font-medium">{selectedTradeInDetails.category || "-"}</span>
                    </div>
                    {selectedTradeInDetails.mileage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quilometragem:</span>
                        <span className="font-medium">{Number(selectedTradeInDetails.mileage).toLocaleString('pt-BR')} km</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Valores</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Aceito:</span>
                      <span className="font-medium text-green-600">
                        R$ {Number(selectedTradeInDetails.acceptedValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {selectedTradeInDetails.fipeValue && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor FIPE:</span>
                        <span className="font-medium">{selectedTradeInDetails.fipeValue}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Informações Adicionais</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tem Documento:</span>
                      <span className="font-medium">{selectedTradeInDetails.temDocumento === true ? "Sim" : selectedTradeInDetails.temDocumento === false ? "Não" : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Licenciamento Pago:</span>
                      <span className="font-medium">{selectedTradeInDetails.licenciamentoPago === true ? "Sim" : selectedTradeInDetails.licenciamentoPago === false ? "Não" : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">É de Leilão:</span>
                      <span className="font-medium">{selectedTradeInDetails.eDeLeilao === true ? "Sim" : selectedTradeInDetails.eDeLeilao === false ? "Não" : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tem Rastreador:</span>
                      <span className="font-medium">{selectedTradeInDetails.temRastreador === true ? "Sim" : selectedTradeInDetails.temRastreador === false ? "Não" : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações do Cliente/Financiamento */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1">Origem</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">
                      {selectedTradeInDetails.customer?.name || selectedTradeInDetails.financing?.customerName || "Não identificado"}
                    </span>
                  </div>
                  {(selectedTradeInDetails.customer?.cpf || selectedTradeInDetails.financing?.customerCpf) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPF:</span>
                      <span className="font-medium">
                        {selectedTradeInDetails.customer?.cpf || selectedTradeInDetails.financing?.customerCpf}
                      </span>
                    </div>
                  )}
                  {selectedTradeInDetails.financing && (
                    <div className="flex justify-between md:col-span-2">
                      <span className="text-muted-foreground">Financiamento:</span>
                      <span className="font-medium">
                        ID: {selectedTradeInDetails.financing.id.substring(0, 8)}... 
                        {vehicles?.find((v: any) => v.id === selectedTradeInDetails.financing.vehicleId) && (
                          <span className="text-muted-foreground ml-2">
                            (Veículo: {vehicles.find((v: any) => v.id === selectedTradeInDetails.financing.vehicleId)?.name})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Documentos */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1">Documentos</h4>
                <div className="flex flex-wrap gap-3">
                  {selectedTradeInDetails.cautelarUrl && (
                    <a
                      href={selectedTradeInDetails.cautelarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Laudo Cautelar
                    </a>
                  )}
                  {selectedTradeInDetails.crlvUrl && (
                    <a
                      href={selectedTradeInDetails.crlvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      CRLV
                    </a>
                  )}
                  {selectedTradeInDetails.laudoMecanicoUrl && (
                    <a
                      href={selectedTradeInDetails.laudoMecanicoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Laudo Mecânico
                    </a>
                  )}
                  {!selectedTradeInDetails.cautelarUrl && !selectedTradeInDetails.crlvUrl && !selectedTradeInDetails.laudoMecanicoUrl && (
                    <span className="text-sm text-muted-foreground italic">Nenhum documento anexado</span>
                  )}
                </div>
              </div>

              {/* Fotos */}
              {selectedTradeInDetails.photosUrls && selectedTradeInDetails.photosUrls.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Fotos ({selectedTradeInDetails.photosUrls.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedTradeInDetails.photosUrls.map((url: string, index: number) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-video rounded-lg overflow-hidden border hover:border-primary transition-colors"
                      >
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão de Ação */}
              {!selectedTradeInDetails.alreadyInFleet && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      setTradeInDetailsDialogOpen(false);
                      setSelectedTradeInForFleet(selectedTradeInDetails);
                      setTradeInFleetData({
                        pricePerDay: "",
                        pricePerMonth: "",
                        imageUrl: ""
                      });
                      setAddTradeInToFleetDialogOpen(true);
                    }}
                    data-testid="button-add-to-fleet-from-details"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar à Frota
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTradeInDetailsDialogOpen(false);
                setSelectedTradeInDetails(null);
              }}
              data-testid="button-close-trade-in-details"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Veículo */}
      <Dialog open={vehicleDetailsDialogOpen} onOpenChange={setVehicleDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Veículo</DialogTitle>
            <DialogDescription>
              Informações completas, documentos e fotos de vistoria
            </DialogDescription>
          </DialogHeader>
          
          {selectedVehicleDetails && (() => {
            const vehicle = selectedVehicleDetails;
            const inspectionPhotos = vehicleInspections.filter((i: any) => i.imageUrl && i.type === 'evaluation');
            const damagePhotos = vehicleInspections.filter((i: any) => i.imageUrl && (i.type === 'damage' || i.imageType === 'damage_detail'));
            
            const imageTypeLabels: Record<string, string> = {
              'front': 'Frente',
              'back': 'Traseira',
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
            };
            
            const vehicleDocs = [
              { label: "CRLV", url: vehicle.crlvDocumentUrl },
              { label: "Laudo Cautelar", url: vehicle.laudoCautelarUrl },
              { label: "Laudo Mecânico", url: vehicle.laudoMecanicoUrl },
            ].filter(doc => doc.url);
            
            const otherDocs = (vehicle.otherDocumentsUrls || []).map((docString: string) => {
              try {
                const parsed = JSON.parse(docString);
                return { label: parsed.label || 'Documento', url: parsed.fileUrl || docString };
              } catch {
                return { label: 'Documento', url: docString };
              }
            }).filter((doc: any) => doc.url);
            
            return (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className={`w-full md:w-64 aspect-[4/3] rounded-lg overflow-hidden flex-shrink-0 ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'bg-gray-900' : 'bg-muted'}`}>
                    <img
                      src={vehicle.imageUrl && !vehicle.imageUrl.includes('placeholder') ? vehicle.imageUrl : placeholderVehicle}
                      alt={vehicle.name}
                      className={`w-full h-full ${!vehicle.imageUrl || vehicle.imageUrl.includes('placeholder') ? 'object-contain p-4' : 'object-cover'}`}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{vehicle.name}</h3>
                      <p className="text-muted-foreground">
                        {vehicle.brand} {vehicle.model} • {vehicle.year}
                        {vehicle.licensePlate && ` • ${vehicle.licensePlate}`}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Categoria</p>
                        <p className="font-medium">{vehicle.category || "—"}</p>
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
                        <p className="text-muted-foreground text-xs">Valor FIPE</p>
                        <p className="font-medium text-primary">
                          R$ {parseFloat(vehicle.fipeValue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Quilometragem</p>
                        <p className="font-medium">{vehicle.mileage ? `${vehicle.mileage.toLocaleString('pt-BR')} km` : "—"}</p>
                      </div>
                      {vehicle.chassi && (
                        <div>
                          <p className="text-muted-foreground text-xs">Chassi</p>
                          <p className="font-medium font-mono text-xs">{vehicle.chassi}</p>
                        </div>
                      )}
                      {vehicle.renavam && (
                        <div>
                          <p className="text-muted-foreground text-xs">Renavam</p>
                          <p className="font-medium font-mono text-xs">{vehicle.renavam}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">Informações Adicionais</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Documento</p>
                      <p className={`font-medium ${vehicle.temDocumento === true ? 'text-green-600' : vehicle.temDocumento === false ? 'text-red-600' : ''}`}>
                        {vehicle.temDocumento === true ? 'Sim' : vehicle.temDocumento === false ? 'Não' : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">IPVA</p>
                      <p className={`font-medium ${vehicle.ipvaStatus === 'sim' || vehicle.ipvaStatus === 'pago' ? 'text-green-600' : vehicle.ipvaStatus === 'isento' ? 'text-blue-600' : vehicle.ipvaStatus === 'nao' || vehicle.ipvaStatus === 'nao_pago' ? 'text-red-600' : ''}`}>
                        {vehicle.ipvaStatus === 'sim' || vehicle.ipvaStatus === 'pago' ? 'Pago' : vehicle.ipvaStatus === 'isento' ? 'Isento' : vehicle.ipvaStatus === 'nao' || vehicle.ipvaStatus === 'nao_pago' ? 'Não Pago' : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Licenciamento</p>
                      <p className={`font-medium ${vehicle.licenciamentoPago === true ? 'text-green-600' : vehicle.licenciamentoPago === false ? 'text-red-600' : ''}`}>
                        {vehicle.licenciamentoPago === true ? 'Pago' : vehicle.licenciamentoPago === false ? 'Não Pago' : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Seguro</p>
                      <p className={`font-medium ${vehicle.hasInsurance === true ? 'text-green-600' : vehicle.hasInsurance === false ? 'text-red-600' : ''}`}>
                        {vehicle.hasInsurance === true ? 'Sim' : vehicle.hasInsurance === false ? 'Não' : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Financiado</p>
                      <p className={`font-medium ${vehicle.taFinanciado === true ? 'text-orange-600' : vehicle.taFinanciado === false ? 'text-green-600' : ''}`}>
                        {vehicle.taFinanciado === true ? 'Sim' : vehicle.taFinanciado === false ? 'Não' : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Leilão</p>
                      <p className={`font-medium ${vehicle.eDeLeilao === true ? 'text-orange-600' : vehicle.eDeLeilao === false ? 'text-green-600' : ''}`}>
                        {vehicle.eDeLeilao === true ? 'Sim' : vehicle.eDeLeilao === false ? 'Não' : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Rastreador</p>
                      <p className={`font-medium ${vehicle.temRastreador === true ? 'text-green-600' : vehicle.temRastreador === false ? 'text-red-600' : ''}`}>
                        {vehicle.temRastreador === true ? 'Sim' : vehicle.temRastreador === false ? 'Não' : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Multas</p>
                      <p className={`font-medium ${vehicle.temMultas === true ? 'text-red-600' : vehicle.temMultas === false ? 'text-green-600' : ''}`}>
                        {vehicle.temMultas === true ? 'Sim' : vehicle.temMultas === false ? 'Não' : '—'}
                      </p>
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
                          onClick={() => handleDownload(doc.url, `${vehicle.name}-${doc.label}`)}
                          data-testid={`button-vehicle-doc-${index}`}
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
                          onClick={() => handleDownload(doc.url, `${vehicle.name}-${doc.label}`)}
                          data-testid={`button-vehicle-other-doc-${index}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {doc.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fotos de Vistoria */}
                {loadingInspections ? (
                  <div className="border-t pt-4">
                    <p className="text-center text-muted-foreground py-4">Carregando fotos de vistoria...</p>
                  </div>
                ) : inspectionPhotos.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3">Fotos de Vistoria ({inspectionPhotos.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {inspectionPhotos.map((inspection: any, index: number) => {
                        const photoLabel = imageTypeLabels[inspection.imageType] || inspection.imageType || 'Foto';
                        return (
                          <div key={inspection.id || index} className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {photoLabel}
                            </p>
                            <img
                              src={inspection.imageUrl}
                              alt={photoLabel}
                              className="w-full aspect-[4/3] object-cover rounded-lg border cursor-pointer hover-elevate transition-all"
                              onClick={() => setEnlargedPhoto({ url: inspection.imageUrl, label: photoLabel })}
                              data-testid={`img-inspection-${index}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                                data-testid={`img-damage-${index}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVehicleDetailsDialogOpen(false);
                setSelectedVehicleDetails(null);
                setVehicleInspections([]);
              }}
              data-testid="button-close-vehicle-details"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Foto Ampliada */}
      <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{enlargedPhoto?.label || "Foto"}</DialogTitle>
          </DialogHeader>
          {enlargedPhoto && (
            <div className="flex items-center justify-center">
              <img
                src={enlargedPhoto.url}
                alt={enlargedPhoto.label}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnlargedPhoto(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
