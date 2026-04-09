import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CalendarIcon, CheckCircle, Car, Fuel, Users, Settings } from "lucide-react";
import { format, differenceInDays, differenceInMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Vehicle } from "@shared/schema";

const rentalSchema = z.object({
  customerName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  customerEmail: z.string().email("Email inválido"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  customerCpf: z.string().min(11, "CPF inválido"),
  customerRg: z.string().optional(),
  driverLicense: z.string().min(5, "CNH inválida"),
  emergencyContact: z.string().min(10, "Contato de emergência inválido"),
  street: z.string().min(3, "Rua/Avenida deve ter pelo menos 3 caracteres"),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, "Bairro deve ter pelo menos 3 caracteres"),
  city: z.string().min(3, "Cidade deve ter pelo menos 3 caracteres"),
  state: z.string().length(2, "Estado deve ter 2 caracteres (ex: SP)"),
  zipCode: z.string().min(8, "CEP inválido"),
  // Avalista
  hasGuarantor: z.boolean().default(true),
  guarantorName: z.string().optional(),
  guarantorCpf: z.string().optional(),
  guarantorRg: z.string().optional(),
  guarantorEmail: z.string().optional(),
  guarantorPhone: z.string().optional(),
  guarantorStreet: z.string().optional(),
  guarantorComplement: z.string().optional(),
  guarantorNeighborhood: z.string().optional(),
  guarantorCity: z.string().optional(),
  guarantorState: z.string().optional(),
  guarantorZipCode: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isNegativado: z.boolean().default(false),
  isMonthly: z.boolean().default(false),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
  useBonus: z.boolean().default(false),
}).refine((data) => {
  if (data.isMonthly) {
    return !!data.startMonth && !!data.endMonth;
  }
  return !!data.startDate && !!data.endDate;
}, {
  message: "Selecione o período do aluguel",
  path: ["startDate"],
}).refine((data) => {
  // Para locações diárias (não mensais), avalista é obrigatório
  if (!data.isMonthly) {
    return !!data.guarantorName && !!data.guarantorCpf && !!data.guarantorRg &&
           !!data.guarantorEmail && !!data.guarantorPhone &&
           !!data.guarantorStreet && !!data.guarantorNeighborhood &&
           !!data.guarantorCity && !!data.guarantorState && !!data.guarantorZipCode;
  }
  return true;
}, {
  message: "Avalista é obrigatório para locações diárias",
  path: ["guarantorName"],
});

type RentalFormData = z.infer<typeof rentalSchema>;

export default function RentVehicle() {
  const [, params] = useRoute("/alugar/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [authData, setAuthData] = useState<{ customerId: string; customerName: string } | null>(null);

  // Verificar se há cliente logado
  useEffect(() => {
    const storedCustomer = localStorage.getItem("customer");
    if (storedCustomer) {
      setAuthData(JSON.parse(storedCustomer));
    }
  }, []);

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: plans } = useQuery<any[]>({
    queryKey: ["/api/rental-plans"],
  });

  // Buscar dados completos do cliente logado
  const { data: loggedCustomer } = useQuery<any>({
    queryKey: ["/api/customers", authData?.customerId],
    enabled: !!authData?.customerId,
  });

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerCpf: "",
      customerRg: "",
      driverLicense: "",
      emergencyContact: "",
      street: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      hasGuarantor: true,
      guarantorName: "",
      guarantorCpf: "",
      guarantorRg: "",
      guarantorEmail: "",
      guarantorPhone: "",
      guarantorStreet: "",
      guarantorComplement: "",
      guarantorNeighborhood: "",
      guarantorCity: "",
      guarantorState: "",
      guarantorZipCode: "",
      isNegativado: false,
      isMonthly: false,
      startMonth: "",
      endMonth: "",
      useBonus: false,
    },
  });

  // Preencher formulário com dados do cliente logado
  useEffect(() => {
    if (loggedCustomer) {
      form.reset({
        customerName: loggedCustomer.name || "",
        customerEmail: loggedCustomer.email || "",
        customerPhone: loggedCustomer.phone || "",
        customerCpf: loggedCustomer.cpf || "",
        customerRg: loggedCustomer.rg || "",
        driverLicense: loggedCustomer.driverLicense || "",
        emergencyContact: loggedCustomer.emergencyContact || "",
        street: loggedCustomer.street || "",
        complement: loggedCustomer.complement || "",
        neighborhood: loggedCustomer.neighborhood || "",
        city: loggedCustomer.city || "",
        state: loggedCustomer.state || "",
        zipCode: loggedCustomer.zipCode || "",
        isNegativado: loggedCustomer.isNegativado || false,
        isMonthly: false,
        startMonth: "",
        endMonth: "",
      });
    }
  }, [loggedCustomer, form]);

  const createRental = useMutation({
    mutationFn: async (data: RentalFormData) => {
      let vehiclePrice = 0;
      
      // Calcular preço do veículo (mensal ou diário)
      if (data.isMonthly && data.startMonth && data.endMonth && vehicle?.monthlyPrice) {
        const start = new Date(data.startMonth + "-01");
        const end = new Date(data.endMonth + "-01");
        const monthsDiff = differenceInMonths(end, start) + 1;
        vehiclePrice = Number(vehicle.monthlyPrice) * monthsDiff;
      } else if (data.startDate && data.endDate) {
        const days = differenceInDays(data.endDate, data.startDate);
        vehiclePrice = Number(vehicle?.pricePerDay || 0) * days;
      }
      
      // Calcular total dos planos
      const plansPrice = selectedPlans.reduce((sum, planId) => {
        const plan = plans?.find((p: any) => p.id === planId);
        return sum + (plan ? Number(plan.price) : 0);
      }, 0);
      
      const priceBeforeDiscount = vehiclePrice + plansPrice;
      
      // Calcular desconto de bonificação
      const customerBonusBalance = parseFloat(loggedCustomer?.bonusBalance || "0");
      const bonusDiscountUsed = data.useBonus && customerBonusBalance > 0 
        ? Math.min(customerBonusBalance, priceBeforeDiscount) 
        : 0;
      
      const totalPrice = priceBeforeDiscount - bonusDiscountUsed;
      
      return apiRequest("POST", "/api/rentals", {
        vehicleId: params?.id,
        ...data,
        totalPrice,
        priceBeforeDiscount,
        bonusDiscountUsed,
        selectedPlanIds: selectedPlans,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setSuccess(true);
      toast({
        title: "Reserva confirmada!",
        description: "Entraremos em contato com os detalhes da sua reserva.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar reserva",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RentalFormData) => {
    createRental.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold mb-4">Veículo não encontrado</p>
          <Button onClick={() => setLocation("/veiculos")}>Ver Outros Veículos</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="h-20 w-20 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-chart-3" />
            </div>
            <h2 className="text-2xl font-bold mb-4" data-testid="text-success-title">
              Reserva Confirmada!
            </h2>
            <p className="text-muted-foreground mb-8">
              Entraremos em contato com os detalhes da sua reserva e instruções para retirada do veículo.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setLocation("/veiculos")} data-testid="button-back-vehicles">
                Ver Outros Veículos
              </Button>
              <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back-home">
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const isMonthly = form.watch("isMonthly");
  const startMonth = form.watch("startMonth");
  const endMonth = form.watch("endMonth");
  const useBonus = form.watch("useBonus");
  const hasGuarantor = form.watch("hasGuarantor");
  
  const days = startDate && endDate ? differenceInDays(endDate, startDate) : 0;
  
  const months = [
    { value: "2025-01", label: "Janeiro 2025" },
    { value: "2025-02", label: "Fevereiro 2025" },
    { value: "2025-03", label: "Março 2025" },
    { value: "2025-04", label: "Abril 2025" },
    { value: "2025-05", label: "Maio 2025" },
    { value: "2025-06", label: "Junho 2025" },
    { value: "2025-07", label: "Julho 2025" },
    { value: "2025-08", label: "Agosto 2025" },
    { value: "2025-09", label: "Setembro 2025" },
    { value: "2025-10", label: "Outubro 2025" },
    { value: "2025-11", label: "Novembro 2025" },
    { value: "2025-12", label: "Dezembro 2025" },
    { value: "2026-01", label: "Janeiro 2026" },
    { value: "2026-02", label: "Fevereiro 2026" },
    { value: "2026-03", label: "Março 2026" },
    { value: "2026-04", label: "Abril 2026" },
    { value: "2026-05", label: "Maio 2026" },
    { value: "2026-06", label: "Junho 2026" },
    { value: "2026-07", label: "Julho 2026" },
    { value: "2026-08", label: "Agosto 2026" },
    { value: "2026-09", label: "Setembro 2026" },
    { value: "2026-10", label: "Outubro 2026" },
    { value: "2026-11", label: "Novembro 2026" },
    { value: "2026-12", label: "Dezembro 2026" },
    { value: "2027-01", label: "Janeiro 2027" },
    { value: "2027-02", label: "Fevereiro 2027" },
    { value: "2027-03", label: "Março 2027" },
    { value: "2027-04", label: "Abril 2027" },
    { value: "2027-05", label: "Maio 2027" },
    { value: "2027-06", label: "Junho 2027" },
    { value: "2027-07", label: "Julho 2027" },
    { value: "2027-08", label: "Agosto 2027" },
    { value: "2027-09", label: "Setembro 2027" },
    { value: "2027-10", label: "Outubro 2027" },
    { value: "2027-11", label: "Novembro 2027" },
    { value: "2027-12", label: "Dezembro 2027" },
  ];
  
  const calculateMonthlyTotal = () => {
    if (!isMonthly || !startMonth || !endMonth || !vehicle.monthlyPrice) return 0;
    
    const start = new Date(startMonth + "-01");
    const end = new Date(endMonth + "-01");
    const monthsDiff = differenceInMonths(end, start) + 1;
    
    return Number(vehicle.monthlyPrice) * monthsDiff;
  };
  
  const monthlyTotal = calculateMonthlyTotal();
  const monthsCount = isMonthly && startMonth && endMonth 
    ? differenceInMonths(new Date(endMonth + "-01"), new Date(startMonth + "-01")) + 1 
    : 0;
  
  // Calcular total dos planos selecionados
  const plansTotal = selectedPlans.reduce((sum, planId) => {
    const plan = plans?.find((p: any) => p.id === planId);
    return sum + (plan ? Number(plan.price) : 0);
  }, 0);
  
  const vehicleTotal = isMonthly ? monthlyTotal : (days > 0 ? Number(vehicle.pricePerDay) * days : 0);
  const priceBeforeDiscount = vehicleTotal + plansTotal;
  
  // Calcular desconto de bonificação
  const customerBonusBalance = parseFloat(loggedCustomer?.bonusBalance || "0");
  const bonusDiscount = useBonus && customerBonusBalance > 0 
    ? Math.min(customerBonusBalance, priceBeforeDiscount) 
    : 0;
  
  const totalPrice = priceBeforeDiscount - bonusDiscount;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 font-display" data-testid="text-rent-title">
          Alugar Veículo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Locatário</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="customerCpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00" {...field} data-testid="input-cpf" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerRg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RG</FormLabel>
                            <FormControl>
                              <Input placeholder="00.000.000-0" {...field} data-testid="input-rg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="driverLicense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNH</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da CNH" {...field} data-testid="input-driver-license" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contato de Emergência</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} data-testid="input-emergency-contact" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Endereço</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="street"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Rua/Avenida</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da rua" {...field} data-testid="input-street" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="complement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Complemento</FormLabel>
                              <FormControl>
                                <Input placeholder="Apto, Bloco, etc." {...field} data-testid="input-complement" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bairro</FormLabel>
                              <FormControl>
                                <Input placeholder="Bairro" {...field} data-testid="input-neighborhood" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Cidade" {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <FormControl>
                                <Input placeholder="SP" maxLength={2} {...field} data-testid="input-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem className="md:w-1/3">
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input placeholder="00000-000" {...field} data-testid="input-zipcode" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Seção Avalista - Obrigatório para locações diárias */}
                    {!isMonthly && (
                      <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">Dados do Avalista (Obrigatório)</h4>
                          <p className="text-sm text-muted-foreground">
                            Para locações diárias, é obrigatório ter um avalista
                          </p>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="guarantorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo *</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do avalista" {...field} data-testid="input-guarantor-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="guarantorCpf"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CPF *</FormLabel>
                                <FormControl>
                                  <Input placeholder="000.000.000-00" {...field} data-testid="input-guarantor-cpf" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="guarantorRg"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>RG *</FormLabel>
                                <FormControl>
                                  <Input placeholder="00.000.000-0" {...field} data-testid="input-guarantor-rg" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="guarantorEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="email@exemplo.com" {...field} data-testid="input-guarantor-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="guarantorPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone *</FormLabel>
                                <FormControl>
                                  <Input placeholder="(00) 00000-0000" {...field} data-testid="input-guarantor-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                          <h5 className="font-semibold text-sm pt-2">Endereço do Avalista</h5>

                          <FormField
                            control={form.control}
                            name="guarantorStreet"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rua/Avenida</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rua exemplo, 123" {...field} data-testid="input-guarantor-street" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="guarantorComplement"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Complemento (Opcional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Apto, Bloco, etc" {...field} value={field.value || ""} data-testid="input-guarantor-complement" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="guarantorNeighborhood"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bairro</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Bairro" {...field} data-testid="input-guarantor-neighborhood" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="guarantorCity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cidade</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Cidade" {...field} data-testid="input-guarantor-city" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="guarantorState"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estado</FormLabel>
                                  <FormControl>
                                    <Input placeholder="SP" maxLength={2} {...field} data-testid="input-guarantor-state" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="guarantorZipCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CEP</FormLabel>
                                  <FormControl>
                                    <Input placeholder="00000-000" {...field} data-testid="input-guarantor-zipcode" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                      </div>
                    )}

                    {!isMonthly && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Data de Início</FormLabel>
                              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="justify-start text-left font-normal"
                                      data-testid="button-start-date"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione"}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      field.onChange(date);
                                      setStartDateOpen(false);
                                    }}
                                    disabled={(date) => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      return date < today;
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Data de Término</FormLabel>
                              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="justify-start text-left font-normal"
                                      data-testid="button-end-date"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione"}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      field.onChange(date);
                                      setEndDateOpen(false);
                                    }}
                                    disabled={(date) => {
                                      const minDate = startDate || new Date();
                                      const compareDate = new Date(minDate);
                                      compareDate.setHours(0, 0, 0, 0);
                                      return date < compareDate;
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {vehicle.monthlyPrice && (
                      <FormField
                        control={form.control}
                        name="isMonthly"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-primary/5">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-monthly"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none flex-1">
                              <FormLabel>
                                Aluguel Mensal
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Prefere alugar por meses? Valor mensal: <span className="font-semibold text-primary">R$ {Number(vehicle.monthlyPrice).toFixed(2)}</span>
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}

                    {isMonthly && vehicle.monthlyPrice && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-md border bg-primary/5">
                        <FormField
                          control={form.control}
                          name="startMonth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mês Inicial</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-start-month">
                                    <SelectValue placeholder="Selecione o mês" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {months.map((month) => (
                                    <SelectItem key={month.value} value={month.value}>
                                      {month.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="endMonth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mês Final</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value}
                                disabled={!startMonth}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-end-month">
                                    <SelectValue placeholder="Selecione o mês" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {months
                                    .filter((month) => !startMonth || month.value >= startMonth)
                                    .map((month) => (
                                      <SelectItem key={month.value} value={month.value}>
                                        {month.label}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="isNegativado"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-negativado"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Estou negativado
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Não se preocupe! Aceitamos negativados sem consulta ao SPC/Serasa
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {loggedCustomer && parseFloat(loggedCustomer.bonusBalance || "0") > 0 && (
                      <FormField
                        control={form.control}
                        name="useBonus"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-use-bonus"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none flex-1">
                              <FormLabel>
                                Usar Bonificação
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Você tem <span className="font-semibold text-green-700 dark:text-green-300">R$ {customerBonusBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> disponível.
                                {bonusDiscount > 0 && (
                                  <span className="block mt-1 font-medium text-green-700 dark:text-green-300">
                                    Desconto aplicado: R$ {bonusDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={createRental.isPending}
                      data-testid="button-submit-rental"
                    >
                      {createRental.isPending ? "Processando..." : "Confirmar Reserva"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Card de Planos Adicionais */}
            {plans && plans.filter((p: any) => p.isActive).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Planos Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plans.filter((p: any) => p.isActive).map((plan: any) => (
                      <div 
                        key={plan.id}
                        className="flex items-start gap-3 p-4 rounded-md border hover-elevate cursor-pointer"
                        onClick={() => {
                          setSelectedPlans(prev => 
                            prev.includes(plan.id) 
                              ? prev.filter(id => id !== plan.id)
                              : [...prev, plan.id]
                          );
                        }}
                        data-testid={`plan-option-${plan.id}`}
                      >
                        <div className="flex items-center h-5 pt-0.5">
                          <Checkbox
                            checked={selectedPlans.includes(plan.id)}
                            onCheckedChange={() => {}}
                            data-testid={`checkbox-plan-${plan.id}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">{plan.name}</p>
                            <p className="text-lg font-bold text-primary whitespace-nowrap">
                              R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Resumo da Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-muted/20 to-muted/40">
                  <img src={vehicle.imageUrl} alt={vehicle.name} className="w-full h-full object-contain" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-1" data-testid="text-vehicle-name">
                    {vehicle.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{vehicle.category}</p>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    <span>{vehicle.transmission}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    <span>{vehicle.fuel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{vehicle.seats} lugares</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  {isMonthly && vehicle.monthlyPrice ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor Mensal</span>
                        <span className="font-medium">R$ {Number(vehicle.monthlyPrice).toFixed(2)}</span>
                      </div>
                      {monthsCount > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Período</span>
                            <span className="font-medium">{monthsCount} mês{monthsCount > 1 ? 'es' : ''}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">De</span>
                            <span className="font-medium">
                              {startMonth && months.find(m => m.value === startMonth)?.label}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Até</span>
                            <span className="font-medium">
                              {endMonth && months.find(m => m.value === endMonth)?.label}
                            </span>
                          </div>
                          {selectedPlans.length > 0 && (
                            <>
                              {selectedPlans.map(planId => {
                                const plan = plans?.find((p: any) => p.id === planId);
                                return plan ? (
                                  <div key={plan.id} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{plan.name}</span>
                                    <span className="font-medium">R$ {Number(plan.price).toFixed(2)}</span>
                                  </div>
                                ) : null;
                              })}
                            </>
                          )}
                          {bonusDiscount > 0 && (
                            <>
                              <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">R$ {priceBeforeDiscount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm text-green-700 dark:text-green-300 font-medium">
                                <span>Desconto (Bonificação)</span>
                                <span>- R$ {bonusDiscount.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between text-lg font-bold border-t pt-3">
                            <span>Total</span>
                            <span data-testid="text-total-price">R$ {totalPrice.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Diária</span>
                        <span className="font-medium">R$ {Number(vehicle.pricePerDay).toFixed(2)}</span>
                      </div>
                      {days > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Período</span>
                            <span className="font-medium">{days} dia{days > 1 ? 's' : ''}</span>
                          </div>
                          {selectedPlans.length > 0 && (
                            <>
                              {selectedPlans.map(planId => {
                                const plan = plans?.find((p: any) => p.id === planId);
                                return plan ? (
                                  <div key={plan.id} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{plan.name}</span>
                                    <span className="font-medium">R$ {Number(plan.price).toFixed(2)}</span>
                                  </div>
                                ) : null;
                              })}
                            </>
                          )}
                          {bonusDiscount > 0 && (
                            <>
                              <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">R$ {priceBeforeDiscount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm text-green-700 dark:text-green-300 font-medium">
                                <span>Desconto (Bonificação)</span>
                                <span>- R$ {bonusDiscount.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between text-lg font-bold border-t pt-3">
                            <span>Total</span>
                            <span data-testid="text-total-price">R$ {totalPrice.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  {isMonthly && (
                    <Badge className="w-full justify-center bg-primary/20 text-primary border-primary/30" data-testid="badge-monthly-summary">
                      Aluguel Mensal
                    </Badge>
                  )}
                  {form.watch("isNegativado") && (
                    <Badge className="w-full justify-center bg-chart-4/20 text-chart-4 border-chart-4/30" data-testid="badge-negativado-summary">
                      Sem Consulta ao SPC/Serasa
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
