import { useState, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrendingUp, Shield, DollarSign, CheckCircle, Car, Search, Camera, Star, MessageCircle, ChevronDown, Users, FileText, Handshake, CircleDollarSign, ClipboardCheck, ArrowRight, Quote, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import investimentoImage from "@assets/investimento.jpg";
import logoImobilicar from "@assets/logo imobile_1759944435911.png";

function useScrollReveal() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const observers = useRef<Map<string, IntersectionObserver>>(new Map());

  const registerSection = (id: string, element: HTMLElement | null) => {
    if (!element) return;
    if (observers.current.has(id)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set(prev).add(id));
          observer.disconnect();
          observers.current.delete(id);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    observer.observe(element);
    observers.current.set(id, observer);
  };

  useEffect(() => {
    return () => {
      observers.current.forEach((obs) => obs.disconnect());
    };
  }, []);

  return { visibleSections, registerSection };
}

function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

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

const investorVehicleSchema = z.object({
  // Dados do investidor
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  rg: z.string().optional(),
  driverLicense: z.string().refine(val => val === "" || val.length >= 5, {
    message: "CNH inválida"
  }),
  emergencyContact: z.string().refine(val => val === "" || val.length >= 10, {
    message: "Contato de emergência inválido"
  }),
  street: z.string().refine(val => val === "" || val.length >= 3, {
    message: "Rua/Avenida deve ter pelo menos 3 caracteres"
  }),
  complement: z.string().optional(),
  neighborhood: z.string().refine(val => val === "" || val.length >= 3, {
    message: "Bairro deve ter pelo menos 3 caracteres"
  }),
  city: z.string().refine(val => val === "" || val.length >= 3, {
    message: "Cidade deve ter pelo menos 3 caracteres"
  }),
  state: z.string().refine(val => val === "" || val.length === 2, {
    message: "Estado deve ter 2 caracteres (ex: SP)"
  }),
  zipCode: z.string().refine(val => val === "" || val.length >= 8, {
    message: "CEP inválido"
  }),
  paymentDate: z.string().nullable().optional(),
  // Dados do veículo
  vehicleName: z.string().min(3, "Nome do veículo é obrigatório"),
  category: z.string().min(1, "Selecione uma categoria"),
  brand: z.string().min(2, "Marca é obrigatória"),
  model: z.string().min(2, "Modelo é obrigatório"),
  year: z.coerce.number().min(2000, "Ano mínimo: 2000").max(new Date().getFullYear() + 1),
  transmission: z.string().min(1, "Selecione o tipo de transmissão"),
  fuel: z.string().min(1, "Selecione o combustível"),
  seats: z.coerce.number().min(2).max(9),
  imageUrl: z.string().min(1, "Imagem é obrigatória").refine(
    (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
    { message: "Deve ser uma URL válida ou uma imagem em base64" }
  ),
  licensePlate: z.string().min(1, "Placa é obrigatória"),
  // Proprietário do veículo
  isVehicleOwner: z.boolean().default(true),
  vehicleOwnerName: z.string().optional(),
}).refine(
  (data) => {
    if (!data.isVehicleOwner && (!data.vehicleOwnerName || data.vehicleOwnerName.trim() === "")) {
      return false;
    }
    return true;
  },
  {
    message: "Nome do proprietário é obrigatório quando você não é o proprietário",
    path: ["vehicleOwnerName"],
  }
);

type InvestorVehicleFormData = z.infer<typeof investorVehicleSchema>;

// Schema para Lead simplificado
const leadSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

// Componente de formulário de Lead
function LeadForm() {
  const { toast } = useToast();

  // Formatar CPF
  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const leadForm = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      console.log("Enviando lead:", data);
      return apiRequest("POST", "/api/leads", {
        ...data,
        source: "website",
        interest: "Investimento",
        vehicleId: null,
        vehicleName: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Solicitação enviada!",
        description: "Entraremos em contato em breve.",
      });
      leadForm.reset();
    },
    onError: (error: any) => {
      console.error("Erro ao enviar lead:", error);
      let errorMessage = "Tente novamente mais tarde.";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: "Erro ao enviar",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadFormData) => {
    createLeadMutation.mutate(data);
  };

  return (
    <Form {...leadForm}>
      <form onSubmit={leadForm.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={leadForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} data-testid="input-lead-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={leadForm.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input
                  placeholder="000.000.000-00"
                  {...field}
                  onChange={(e) => field.onChange(formatCpf(e.target.value))}
                  maxLength={14}
                  data-testid="input-lead-cpf"
                />
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
                <Input type="email" placeholder="seu@email.com" {...field} data-testid="input-lead-email" />
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
                <Input placeholder="(00) 00000-0000" {...field} data-testid="input-lead-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={leadForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Deixe sua mensagem ou dúvida" {...field} data-testid="input-lead-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createLeadMutation.isPending}
          data-testid="button-submit-lead"
        >
          {createLeadMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
        </Button>
      </form>
    </Form>
  );
}

export default function Investor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"info" | "vehicle" | "success">("info");
  const [loggedCustomerId, setLoggedCustomerId] = useState<string | null>(null);

  // Verificar se está logado (opcional - página pública)
  useEffect(() => {
    const storedCustomer = localStorage.getItem("customer");
    if (storedCustomer) {
      const customerData = JSON.parse(storedCustomer);
      setLoggedCustomerId(customerData.customerId);
    }
  }, []);

  // Estado de loading para processamento de fotos
  const [processingPhoto, setProcessingPhoto] = useState(false);

  // Função aprimorada para comprimir imagens mantendo alta qualidade visual
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

            // Aplicar filtro de nitidez leve (opcional)
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
          // Isso só acontecerá em casos extremos
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

  const [isInspectionDialogOpen, setIsInspectionDialogOpen] = useState(false);
  const [inspectionPhotos, setInspectionPhotos] = useState({
    front: "",
    back: "",
    rightSide: "",
    leftSide: "",
  });

  const [vehicleDocuments, setVehicleDocuments] = useState({
    crlv: "",
    laudoCautelar: "",
    laudoMecanico: "",
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const form = useForm<InvestorVehicleFormData>({
    resolver: zodResolver(investorVehicleSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      driverLicense: "",
      emergencyContact: "",
      street: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      paymentDate: null,
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
      isVehicleOwner: true,
      vehicleOwnerName: "",
    },
  });

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

  const lastBrandRequestRef = useRef<string>("");
  const lastModelRequestRef = useRef<string>("");
  const lastConsultaRequestRef = useRef<string>("");

  const { data: investmentQuotas } = useQuery<Array<{
    id: string;
    category: string;
    minValue: string;
    maxValue: string;
    minDividend: string;
    maxDividend: string;
  }>>({
    queryKey: ["/api/investment-quotas"],
  });

  // Buscar dados do cliente logado para pré-preencher o formulário
  const { data: loggedCustomer } = useQuery<{
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    driverLicense: string | null;
    emergencyContact: string | null;
    street: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    paymentDate: string | null;
  }>({
    queryKey: [`/api/customers/${loggedCustomerId}`],
    enabled: !!loggedCustomerId,
  });

  // Pré-preencher formulário com dados do cliente logado
  useEffect(() => {
    if (loggedCustomer) {
      form.setValue("name", loggedCustomer.name);
      form.setValue("email", loggedCustomer.email);
      form.setValue("phone", loggedCustomer.phone);
      form.setValue("cpf", loggedCustomer.cpf);
      form.setValue("driverLicense", loggedCustomer.driverLicense || "");
      form.setValue("emergencyContact", loggedCustomer.emergencyContact || "");
      form.setValue("street", loggedCustomer.street || "");
      form.setValue("complement", loggedCustomer.complement || "");
      form.setValue("neighborhood", loggedCustomer.neighborhood || "");
      form.setValue("city", loggedCustomer.city || "");
      form.setValue("state", loggedCustomer.state || "");
      form.setValue("zipCode", loggedCustomer.zipCode || "");
      if (loggedCustomer.paymentDate) {
        form.setValue("paymentDate", String(loggedCustomer.paymentDate));
      }
    }
  }, [loggedCustomer, form]);

  const category = form.watch("category");

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

  useEffect(() => {
    if (step === "vehicle") {
      fetchFipeBrands();
    }
  }, [step]);

  const clearFipeFormFields = () => {
    form.setValue("vehicleName", "");
    form.setValue("brand", "");
    form.setValue("model", "");
    form.setValue("year", "" as any);
    form.setValue("fuel", "");
  };

  const fetchFipeBrands = async () => {
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
    const requestKey = `${brandId}-${modelId}`;
    lastModelRequestRef.current = requestKey;
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

      if (lastModelRequestRef.current === requestKey) {
        setFipeYears(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erro ao buscar anos FIPE:", error);
      if (lastModelRequestRef.current === requestKey) {
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

      form.setValue("vehicleName", `${brandName} ${modelName} ${data.modelYear}`);
      form.setValue("brand", brandName);
      form.setValue("model", modelName);
      form.setValue("year", data.modelYear);

      const fuelMap: { [key: string]: string } = {
        "Gasolina": "Gasolina",
        "Álcool": "Álcool",
        "Diesel": "Diesel",
        "Flex": "Flex",
        "Elétrico": "Elétrico",
        "Híbrido": "Híbrido",
      };
      const fuelValue = fuelMap[data.fuel] || "Flex";
      form.setValue("fuel", fuelValue);

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

  const createInvestorWithVehicle = useMutation({
    mutationFn: (data: InvestorVehicleFormData) => apiRequest("POST", "/api/investor-with-vehicle", {
      ...data,
      fipeValue: fipeValue ? fipeValue.replace(/[^\d,]/g, '').replace(',', '.') : null,
      evaluationFrontImage: inspectionPhotos.front || null,
      evaluationBackImage: inspectionPhotos.back || null,
      evaluationRightSideImage: inspectionPhotos.rightSide || null,
      evaluationLeftSideImage: inspectionPhotos.leftSide || null,
      crlvDocumentUrl: vehicleDocuments.crlv || null,
      laudoCautelarUrl: vehicleDocuments.laudoCautelar || null,
      laudoMecanicoUrl: vehicleDocuments.laudoMecanico || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-requests"] });
      setStep("success");
      setInspectionPhotos({
        front: "",
        back: "",
        rightSide: "",
        leftSide: "",
      });
      form.reset();
      toast({
        title: "Solicitação enviada!",
        description: "Seu cadastro está em análise pela nossa equipe.",
      });
    },
    onError: (error: any) => {
      console.error("Erro detalhado ao enviar solicitação:", error);
      let errorMessage = "Tente novamente mais tarde.";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      // Se for erro de tamanho de payload
      if (errorMessage.includes("payload") || errorMessage.includes("413")) {
        errorMessage = "As fotos são muito grandes. Tente tirar fotos com menor resolução.";
      }

      toast({
        title: "Erro ao enviar solicitação",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const { visibleSections, registerSection } = useScrollReveal();

  const benefits = [
    {
      icon: DollarSign,
      title: "Renda Fixa Mensal",
      description: "Receba dividendos garantidos em contrato, todo mês, direto na sua conta.",
    },
    {
      icon: Shield,
      title: "Gestão Completa",
      description: "Cuidamos de tudo: seguro, manutenção, rastreador, limpeza e multas.",
    },
    {
      icon: FileText,
      title: "Contrato de 12 Meses",
      description: "Rentabilidade fixa, garantida e formalizada. Segurança para o seu investimento.",
    },
    {
      icon: ClipboardCheck,
      title: "Vistoria Profissional",
      description: "Avaliação mecânica e cautelar completa antes de qualquer contrato.",
    },
  ];

  const processSteps = [
    {
      number: "1",
      title: "Cadastro",
      description: "Preencha seus dados ou entre em contato pelo WhatsApp.",
      icon: Users,
    },
    {
      number: "2",
      title: "Avaliação",
      description: "Avaliamos seu veículo com vistoria mecânica e cautelar.",
      icon: Search,
    },
    {
      number: "3",
      title: "Contrato",
      description: "Formalizamos tudo em contrato com valores e prazos definidos.",
      icon: Handshake,
    },
    {
      number: "4",
      title: "Dividendos",
      description: "Receba sua renda mensal de forma pontual e segura.",
      icon: CircleDollarSign,
    },
  ];

  const investorTestimonials = [
    {
      name: "Ricardo Mendes",
      role: "Investidor desde 2023",
      content: "Tenho meu carro agregado há 8 meses e recebo meus dividendos todo dia 5 sem falta. É tranquilo saber que não preciso me preocupar com nada!",
      rating: 5,
    },
    {
      name: "Ana Paula Costa",
      role: "Investidora desde 2024",
      content: "Melhor decisão que tomei! Meu carro estava parado na garagem e agora gera uma renda fixa mensal. A Imobilicar cuida de tudo mesmo.",
      rating: 5,
    },
    {
      name: "Fernando Alves",
      role: "Investidor desde 2023",
      content: "Rentabilidade garantida em contrato, seguro completo e total transparência. Recomendo para quem quer fazer o dinheiro trabalhar!",
      rating: 5,
    },
  ];

  const stats = [
    { value: 40, suffix: "+", label: "Investidores Parceiros", icon: Users },
    { value: 100, suffix: "+", label: "Veículos na Frota", icon: Car },
    { value: 12, suffix: "", label: "Meses de Contrato", icon: FileText },
  ];

  const investorBenefits = [
    "Rentabilidade fixa em contrato de 12 meses",
    "Seguro completo com rastreador incluso",
    "Todas as manutenções pagas por nós",
    "Vistoria e avaliação mecânica antes do contrato",
    "Gestão de multas e motoristas",
    "Responsabilidade total da Imobilicar",
    "Transparência e segurança em todas as etapas",
  ];

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4" data-testid="text-investor-success-title">
              Solicitação Enviada!
            </h2>
            <p className="text-muted-foreground mb-8">
              Sua solicitação foi enviada com sucesso. Nossa equipe irá analisar seu veículo e entraremos em contato em breve.
            </p>
            <Button onClick={() => setLocation("/")} className="w-full" data-testid="button-go-home">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* HERO - Full-width image with dark wash */}
      <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 hero-gradient-overlay z-10" />
        <img
          src={investimentoImage}
          alt="Programa de Investidores Imobilicar"
          className="absolute inset-0 w-full h-full object-cover object-[center_65%] animate-fade-in"
          style={{ animationDuration: '1.5s' }}
        />
        <div className="relative z-20 min-h-screen flex items-start justify-center w-full pt-8 sm:pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl flex flex-col items-center text-center mx-auto">
              <img
                src={logoImobilicar}
                alt="Logo"
                className="h-24 sm:h-32 md:h-40 lg:h-48 w-auto mb-4 drop-shadow-2xl animate-fade-in-down"
              />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-display leading-tight animate-fade-in-up animation-delay-300">
                Transforme seu carro em <br className="hidden sm:block" />
                <span className="text-gradient-gold">Renda Passiva</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 px-4 animate-fade-in-up animation-delay-400">
                Agregue seu veículo à nossa frota e receba dividendos mensais garantidos em contrato. Nós cuidamos de tudo.
              </p>
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-primary/30 px-5 py-2 text-sm sm:text-base font-bold backdrop-blur-md bg-black/40 text-primary animate-fade-in-up animation-delay-450 shadow-2xl">
                <CheckCircle className="h-5 w-5" />
                <span className="tracking-wide uppercase text-[12px] sm:text-[14px]">Rentabilidade Garantida</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-5 justify-center w-full px-4 animate-fade-in-up animation-delay-500">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 shadow-[0_10px_20px_-10px_rgba(255,204,0,0.5)] bg-gradient-to-r from-primary via-[#f8e08e] to-primary bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 group">
                      <span className="flex items-center gap-2.5">
                        Tenho Interesse
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Interesse em Investimento</DialogTitle>
                      <DialogDescription>
                        Deixe seus dados que entraremos em contato em breve!
                      </DialogDescription>
                    </DialogHeader>
                    <LeadForm />
                  </DialogContent>
                </Dialog>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-white/5 border-white/20 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/40 shadow-xl transition-all duration-300 group">
                  <a
                    href="https://wa.me/5511947348989?text=Olá! Tenho interesse no Programa de Investidores."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="flex items-center gap-2.5">
                      Falar no WhatsApp
                      <FaWhatsapp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-bounce-subtle">
          <ChevronDown className="h-8 w-8 text-white/60" />
        </div>
      </section>

      <section ref={(el) => registerSection("stats", el)} className="py-10 sm:py-16 relative overflow-hidden bg-background">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className={`relative group ${visibleSections.has("stats") ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="p-6 sm:p-8 rounded-2xl border-2 border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 group-hover:-translate-y-1 relative overflow-hidden">
                  {/* Accent line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 p-3.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-500 shadow-inner">
                      <stat.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-foreground">
                        {visibleSections.has("stats") ? <AnimatedCounter target={stat.value} suffix={stat.suffix} /> : "0"}
                      </h3>
                      <div className="h-1 w-10 bg-primary/30 mx-auto rounded-full group-hover:w-16 group-hover:bg-primary transition-all duration-500" />
                      <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-3 group-hover:text-foreground transition-colors">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={(el) => registerSection("benefits", el)} className="py-16 lg:py-24 bg-background relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffcc00_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.03] -z-10" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <SectionHeader
            isVisible={visibleSections.has("benefits")}
            badge="Vantagens"
            title={<>Por Que Investir com a <span className="text-gradient-gold">Imobilicar?</span></>}
            description="Segurança, transparência e renda garantida para o seu patrimônio através de uma gestão profissional."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className={`relative border-2 border-border/40 group card-shine hover:border-primary/50 transition-all duration-500 overflow-hidden bg-card/30 backdrop-blur-sm shadow-xl shadow-black/5 ${visibleSections.has("benefits") ? "animate-slide-in-scale" : "opacity-0"}`} style={{ animationDelay: `${200 + idx * 150}ms` }}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full group-hover:bg-primary/20 transition-colors" />
                <CardContent className="p-8 text-center relative z-10">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-primary/10">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-black mb-3 group-hover:text-primary transition-colors tracking-tight">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section ref={(el) => registerSection("howItWorks", el)} className="py-24 lg:py-32 relative overflow-hidden bg-[#0a0a0a]">
        {/* Dark Premium Background with Gold Accents */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Subtle Gold Glows */}
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 opacity-50" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 translate-x-1/2 opacity-30" />

          {/* Animated Grid Texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className={`relative p-12 sm:p-20 rounded-[3rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl ${visibleSections.has("howItWorks") ? "animate-fade-in-up" : "opacity-0"}`}>
            {/* Internal Decorative Grain */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="relative z-10">
              <SectionHeader
                isVisible={visibleSections.has("howItWorks")}
                title={<span className="text-white">Como Funciona</span>}
                description={<span className="text-white/60">Agregue seu carro em 4 passos simples com nossa gestão profissional</span>}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8 lg:gap-16 relative mt-16">
                {processSteps.map((step, idx) => (
                  <div key={idx} className={`relative group flex flex-col items-center ${visibleSections.has("howItWorks") ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${300 + idx * 200}ms` }}>
                    <div className="relative mb-8">
                      {/* Step number - Large, bold and glowing */}
                      <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-4xl font-black relative z-10 shadow-[0_0_30px_-5px_rgba(255,204,0,0.4)] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        {step.number}
                      </div>
                      {/* Background glow for the number */}
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 -z-10 group-hover:scale-110 transition-transform duration-500" />
                    </div>

                    <h3 className="text-xl lg:text-2xl font-black mb-4 text-white tracking-tight text-center group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-white/60 text-center text-base leading-relaxed font-medium max-w-[240px]">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={(el) => registerSection("detailedBenefits", el)} className="py-24 lg:py-32 relative overflow-hidden bg-background">
        {/* Decorative background */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <ImageContainer isVisible={visibleSections.has("detailedBenefits")} src={investimentoImage} alt="Investimento de sucesso" animationDir="left" />
            <div className={`flex flex-col space-y-8 ${visibleSections.has("detailedBenefits") ? "" : "opacity-0"}`}>
              <div className="origin-left">
                <Dialog>
                  <FeatureContent
                    title={<>Tudo Incluso, sem <span className="text-gradient-gold">Preocupações</span></>}
                    description="Agregue seu carro à frota da IMOBILICAR e receba todos os meses uma rentabilidade garantida em contrato. Nós cuidamos de toda a operação."
                    features={investorBenefits}
                    btnText="Tenho Interesse"
                    onClick={() => {
                      const trigger = document.getElementById("hidden-lead-trigger");
                      if (trigger) trigger.click();
                    }}
                  />
                  <DialogTrigger asChild>
                    <button id="hidden-lead-trigger" className="hidden" />
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Interesse em Investimento</DialogTitle>
                      <DialogDescription>
                        Deixe seus dados que entraremos em contato em breve!
                      </DialogDescription>
                    </DialogHeader>
                    <LeadForm />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={(el) => registerSection("testimonials", el)} className="py-24 lg:py-32 relative overflow-hidden bg-muted/30">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <SectionHeader
            isVisible={visibleSections.has("testimonials")}
            badge="Depoimentos"
            title={<>O Que Dizem Nossos <span className="text-gradient-gold">Investidores</span></>}
            description="Histórias reais de quem transformou seu carro em renda passiva com total segurança."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {investorTestimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className={`h-full ${visibleSections.has("testimonials") ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 group relative overflow-hidden flex flex-col shadow-lg hover:shadow-primary/5">
                  {/* Decorative Quote Icon */}
                  <div className="absolute top-6 right-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                    <Quote className="h-12 w-12 rotate-12" />
                  </div>

                  <CardContent className="p-8 flex flex-col h-full relative z-10">
                    <div className="flex gap-0.5 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>

                    <p className="text-foreground/80 text-lg leading-relaxed mb-8 italic flex-grow">
                      "{testimonial.content}"
                    </p>

                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border/50">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <span className="text-primary font-black text-sm">
                          {testimonial.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                          {testimonial.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={(el) => registerSection("cta", el)} className="py-24 lg:py-32 relative overflow-hidden bg-[#0a0a0a]">
        {/* Dark Premium Background with Gold Accents */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Subtle Gold Glows */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-50" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-30" />

          {/* Animated Grid Texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className={`relative p-12 sm:p-20 rounded-[3rem] border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl ${visibleSections.has("cta") ? "animate-fade-in-up" : "opacity-0"}`}>
            {/* Internal Decorative Grain */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-black uppercase tracking-[0.2em] mb-8">
                Oportunidade de Investimento
              </div>

              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-8 font-display tracking-tight text-white leading-[1.1]">
                Pronto Para <span className="text-primary italic">Começar?</span>
              </h2>

              <p className="text-lg sm:text-xl lg:text-2xl mb-12 text-white/60 max-w-2xl mx-auto font-medium leading-relaxed">
                Transforme seu veículo em uma fonte de renda passiva com a plataforma que redefine a segurança no investimento automotivo.
              </p>

              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_10px_30px_-10px_rgba(255,204,0,0.5)] font-bold h-14 sm:h-16 px-10 text-lg hover:scale-105 transition-all duration-300 group rounded-2xl">
                      <span className="flex items-center gap-3">
                        Tenho Interesse
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Interesse em Investimento</DialogTitle>
                      <DialogDescription>
                        Deixe seus dados que entraremos em contato em breve!
                      </DialogDescription>
                    </DialogHeader>
                    <LeadForm />
                  </DialogContent>
                </Dialog>

                <Button asChild size="lg" variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/5 shadow-xl font-bold h-14 sm:h-16 px-10 text-lg hover:scale-105 transition-all duration-300 group rounded-2xl">
                  <a
                    href="https://wa.me/5511947348989?text=Olá! Tenho interesse no Programa de Investidores."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="flex items-center gap-3">
                      Falar no WhatsApp
                      <FaWhatsapp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    </span>
                  </a>
                </Button>
              </div>

              <div className="mt-12 flex flex-col items-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                  <FaWhatsapp className="h-5 w-5 text-[#25D366]" />
                  <p className="text-sm sm:text-base font-medium text-white/80">
                    WhatsApp: <span className="font-bold text-white">55 11 94734-8989</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterSection
        isVisible={visibleSections.has("footer")}
        registerRef={(el) => registerSection("footer", el)}
      />

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/5511947348989"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 animate-pulse-glow"
        aria-label="Contato via WhatsApp"
      >
        <FaWhatsapp className="h-7 w-7 sm:h-8 sm:w-8" />
      </a>
    </div>
  );
}

// --- Shared Internal UI Components ---

function SectionHeader({ isVisible, badge, title, description }: any) {
  return (
    <div
      className={`text-center mb-12 sm:mb-16 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
    >
      {badge && (
        <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-4 border border-primary/20">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-5xl font-black mb-4 font-display tracking-tight leading-tight">{title}</h2>
      <div className="h-1 w-12 bg-primary/40 mx-auto mb-6 rounded-full" />
      <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">{description}</p>
    </div>
  );
}


function ImageContainer({ isVisible, src, alt, className = "", delay = 0 }: any) {
  return (
    <div className={`relative h-[350px] sm:h-[550px] rounded-2xl overflow-hidden shadow-2xl group ${isVisible ? "animate-fade-in-left" : "opacity-0"} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <img src={src} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}

function FeatureContent({ badge, title, description, features, btnText, onClick, badgeColor = "bg-chart-3 text-white border-chart-3/30" }: any) {
  return (
    <>
      {badge && (
        <div
          className={`mb-6 inline-flex items-center rounded-full border-2 px-4 py-2 text-sm font-bold shadow-lg ${badgeColor} animate-fade-in`}
        >
          {badge}
        </div>
      )}

      <h2 className="text-3xl sm:text-5xl font-bold mb-6 font-display leading-tight">{title}</h2>

      <p className="text-muted-foreground text-lg mb-8 leading-relaxed">{description}</p>

      <div className="space-y-4 mb-10">
        {features.map((item: string, idx: number) => (
          <div
            key={idx}
            className={`flex items-center gap-4 group/item ${true ? "animate-fade-in-left" : "opacity-0"}`}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <CheckCircle className="h-5 w-5 text-chart-3" />
            <span className="text-base sm:text-lg font-medium">{item}</span>
          </div>
        ))}
      </div>

      <Button onClick={onClick} size="lg" className="w-full sm:w-auto text-lg h-14 px-10 shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300 group">
        <span className="flex items-center gap-2.5">
          {btnText}
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </Button>
    </>
  );
}


function FooterSection({ isVisible, registerRef }: { isVisible: boolean; registerRef: (el: HTMLElement | null) => void }) {
  return (
    <footer ref={registerRef} className="py-20 bg-muted/30 border-t-2 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <FooterCard isVisible={isVisible} icon={Shield} title="Jurídico" content="CNPJ: 61.363.556/0001-37" delay={0} />
          <FooterCard isVisible={isVisible} icon={MapPin} title="Localização" delay={200}
            content={<a href="https://google.com/search?q=..." target="_blank" className="hover:text-primary transition-colors">R. Antônio Cardoso Franco, 237<br />Santo André - SP</a>}
          />
          <FooterCard isVisible={isVisible} icon={Star} title="Redes Sociais" delay={400}
            content={
              <div className="flex gap-4 justify-center">
                <SocialLink icon={FaInstagram} href="https://instagram.com/imobilicar" color="bg-gradient-to-br from-[#E4405F] to-[#833AB4]" />
                <SocialLink icon={FaWhatsapp} href="https://wa.me/5511947348989" color="bg-[#25D366]" />
              </div>
            }
          />
        </div>
        <div className="pt-8 border-t-2 text-center text-muted-foreground">&copy; {new Date().getFullYear()} Imobilicar. Todos os direitos reservados.</div>
      </div>
    </footer>
  );
}

function FooterCard({ isVisible, icon: Icon, title, content, delay }: any) {
  return (
    <Card className={`hover-elevate border-2 card-shine ${isVisible ? "animate-slide-in-scale" : "opacity-0"}`} style={{ animationDelay: `${delay}ms` }}>
      <CardContent className="p-8 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><Icon className="h-8 w-8 text-primary" /></div>
        <h3 className="font-bold text-lg mb-3">{title}</h3>
        <div className="text-muted-foreground font-medium">{content}</div>
      </CardContent>
    </Card>
  );
}

function SocialLink({ icon: Icon, href, color }: any) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`h-12 w-12 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-xl ${color}`}>
      <Icon className="h-6 w-6" />
    </a>
  );
}

