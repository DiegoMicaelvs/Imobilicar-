import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { VehicleCard } from "@/components/vehicle-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, SlidersHorizontal, ArrowLeft, CheckCircle, UserPlus, MessageCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Vehicle } from "@shared/schema";

const leadFormSchema = insertLeadSchema.extend({
  phone: z.string().min(10, "Telefone deve ter no mínimo 10 dígitos"),
  email: z.string().email("Email inválido"),
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  vehicleId: z.string().min(1, "Selecione um veículo"),
  cpf: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

export default function Vehicles() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [financingFilter, setFinancingFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Formatar CPF
  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };
  
  // Ler parâmetros da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'financing') {
      setFinancingFilter('financing');
    }
  }, []);

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      vehicleId: "",
      vehicleName: "",
      source: "website",
      interest: financingFilter === "financing" ? "Com opção de compra" : "Aluguel de Veículo",
      notes: "",
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const selectedVehicle = filteredVehicles?.find(v => v.id === data.vehicleId);
      const leadData = {
        ...data,
        vehicleName: selectedVehicle?.name || "",
        interest: financingFilter === "financing" ? "Com opção de compra" : "Aluguel de Veículo",
      };
      return apiRequest("POST", "/api/leads", leadData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Lead enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      form.reset();
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro ao enviar lead",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadFormData) => {
    createLeadMutation.mutate(data);
  };

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || vehicle.category === categoryFilter;
    const matchesFinancing = financingFilter === "all" || 
      (financingFilter === "financing" && vehicle.availableForFinancing) ||
      (financingFilter === "no-financing" && !vehicle.availableForFinancing);
    const isPubliclyVisible = vehicle.isPubliclyVisible !== false; // Mostrar apenas veículos visíveis publicamente
    const notFinanced = !vehicle.isFinanced; // Não mostrar veículos financiados
    return matchesSearch && matchesCategory && matchesFinancing && isPubliclyVisible && notFinanced;
  }).sort((a, b) => {
    if (sortBy === "price-low") return Number(a.pricePerDay) - Number(b.pricePerDay);
    if (sortBy === "price-high") return Number(b.pricePerDay) - Number(a.pricePerDay);
    return a.name.localeCompare(b.name);
  });

  const categories = Array.from(new Set(vehicles?.map(v => v.category).filter(c => c && c.trim() !== "") || []));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="bg-gradient-to-br from-muted/50 via-muted/30 to-background py-12 sm:py-16 lg:py-20 border-b-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6 -ml-2 hover-elevate"
            asChild
            data-testid="button-back-home"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Home
            </Link>
          </Button>
          
          {financingFilter === "financing" ? (
            <>
              <div className="inline-block mb-4 sm:mb-6">
                <Badge className="px-4 py-2 text-sm font-bold bg-chart-3 text-white border-2 border-chart-3/30 shadow-lg" data-testid="badge-financing">
                  Locação com Direito à Compra
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 font-display leading-tight" data-testid="text-vehicles-title">
                Locação com Opção de Compra
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl mb-8 sm:mb-10 leading-relaxed max-w-3xl">
                Alugue agora e tenha a opção de comprar o veículo depois. Parcele sua entrada e realize o sonho do carro próprio.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                {[
                  "Entradas a partir de R$ 6.000,00",
                  "Parcelas de até 48x",
                  "Aprovação direto com a loja",
                  "Sem comprovar renda",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-background/50 backdrop-blur-sm rounded-lg border-2 border-chart-3/20 hover-elevate transition-all" data-testid={`financing-feature-${index}`}>
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-chart-3/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-chart-3" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="inline-block mb-4 sm:mb-6">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Nossa Frota</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 font-display leading-tight" data-testid="text-vehicles-title">
                Nossos Veículos
              </h1>
              <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-3xl">
                Encontre o carro perfeito para sua necessidade. Frota diversificada e bem cuidada.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca, modelo ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base border-2 rounded-xl"
              data-testid="input-search-vehicles"
            />
          </div>
        </div>

        {financingFilter === "financing" && filteredVehicles && filteredVehicles.length > 0 && (
          <div className="bg-gradient-to-br from-chart-3/10 via-chart-3/5 to-transparent border-2 border-chart-3/30 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 shadow-lg">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold mb-3" data-testid="text-lead-cta-title">
                  Quer mais informações sobre Locação com opção de compra?
                </h3>
                <p className="text-base text-muted-foreground mb-3 leading-relaxed">
                  Deixe seus dados e entraremos em contato para ajudá-lo com todas as informações. Ou entre em contato conosco pelo nosso WhatsApp
                </p>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="h-5 w-5 text-chart-3" />
                  <span className="text-muted-foreground">WhatsApp:</span>
                  <span className="text-foreground font-bold">55 11 94734-8989</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-chart-3 text-chart-3 font-semibold shadow-md"
                  asChild
                  data-testid="button-whatsapp"
                >
                  <a href="https://wa.me/5511947348989" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Falar no WhatsApp
                  </a>
                </Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full sm:w-auto bg-chart-3 text-white font-semibold shadow-md" data-testid="button-open-lead-form">
                      <UserPlus className="h-5 w-5 mr-2" />
                      Tenho Interesse
                    </Button>
                  </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]" data-testid="dialog-lead-form">
                  <DialogHeader>
                    <DialogTitle>Deixe seus dados</DialogTitle>
                    <DialogDescription>
                      Preencha o formulário abaixo e entraremos em contato em breve
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} data-testid="input-lead-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000.000.000-00" 
                                {...field} 
                                value={field.value || ""} 
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
                        control={form.control}
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
                        control={form.control}
                        name="vehicleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Veículo de Interesse</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-lead-vehicle">
                                  <SelectValue placeholder="Selecione um veículo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredVehicles?.map((vehicle) => (
                                  <SelectItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.name}
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
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Alguma observação adicional?" 
                                {...field} 
                                value={field.value || ""}
                                data-testid="input-lead-notes" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-3 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                          className="flex-1"
                          data-testid="button-cancel-lead"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 bg-chart-3"
                          disabled={createLeadMutation.isPending}
                          data-testid="button-submit-lead"
                        >
                          {createLeadMutation.isPending ? "Enviando..." : "Enviar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gradient-to-br from-muted/50 to-muted/30 animate-pulse rounded-2xl border-2" />
            ))}
          </div>
        ) : filteredVehicles && filteredVehicles.length > 0 ? (
          <>
            <div className="mb-6 sm:mb-8 flex items-center gap-3">
              <div className="h-1 w-12 bg-primary rounded-full"></div>
              <p className="text-base sm:text-lg font-semibold" data-testid="text-results-count">
                {filteredVehicles.length} veículo{filteredVehicles.length !== 1 ? 's' : ''} disponíve{filteredVehicles.length !== 1 ? 'is' : 'l'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredVehicles.map((vehicle, index) => (
                <VehicleCard 
                  key={vehicle.id} 
                  vehicle={vehicle} 
                  hideRentButton={financingFilter === "financing"}
                  interestType={financingFilter === "financing" ? "Com opção de compra" : "Aluguel de Veículo"}
                  animationDelay={Math.min(index * 100, 600)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 sm:py-32">
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg sm:text-xl mb-6 font-medium" data-testid="text-no-vehicles">
                Nenhum veículo encontrado
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                Tente ajustar seus filtros de busca ou limpar todos os filtros
              </p>
              <Button 
                size="lg"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setFinancingFilter("all");
                }} 
                className="h-12 px-8 shadow-lg"
                data-testid="button-clear-filters"
              >
                Limpar Todos os Filtros
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
