import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Car, Fuel, Users, Settings, MessageCircle, UserPlus, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { Vehicle } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import placeholderLogo from "@assets/logo_imobile_1765389205488.png";

interface VehicleCardProps {
  vehicle: Vehicle;
  hideRentButton?: boolean;
  interestType?: "Aluguel de Veículo" | "Com opção de compra";
  animationDelay?: number;
}

export function VehicleCard({ vehicle, hideRentButton = false, interestType = "Aluguel de Veículo", animationDelay = 0 }: VehicleCardProps) {
  const { toast } = useToast();
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCpf, setLeadCpf] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create lead");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead enviado!",
        description: "Entraremos em contato em breve.",
      });
      setLeadDialogOpen(false);
      setLeadName("");
      setLeadEmail("");
      setLeadCpf("");
      setLeadPhone("");
      setLeadNotes("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o lead. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleLeadSubmit = () => {
    if (!leadName.trim() || !leadEmail.trim() || !leadPhone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome, email e telefone.",
        variant: "destructive",
      });
      return;
    }

    createLeadMutation.mutate({
      name: leadName,
      email: leadEmail,
      cpf: leadCpf || null,
      phone: leadPhone,
      source: "website",
      interest: interestType,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      notes: leadNotes || null,
    });
  };

  const isPlaceholder = !vehicle.imageUrl || vehicle.imageUrl.includes('placeholder');

  return (
    <Card
      className="overflow-visible group transition-all duration-500 border-2 hover-elevate animate-slide-in-scale animation-fill-both"
      style={{ animationDelay: `${animationDelay}ms` }}
      data-testid={`card-vehicle-${vehicle.id}`}
    >
      <div className={`relative aspect-[4/3] overflow-hidden ${isPlaceholder ? 'bg-gray-900' : 'bg-gradient-to-br from-muted/20 to-muted/40'}`}>
        {!imageLoaded && !isPlaceholder && (
          <div className="absolute inset-0 bg-muted animate-shimmer" />
        )}
        <img
          src={isPlaceholder ? placeholderLogo : vehicle.imageUrl}
          alt={vehicle.name}
          className={`w-full h-full object-contain transition-all duration-700 group-hover:scale-105 ${imageLoaded || isPlaceholder ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute top-4 right-4">
          {vehicle.available ? (
            <Badge className="bg-chart-3 text-white shadow-lg" data-testid={`badge-available-${vehicle.id}`}>
              Disponível
            </Badge>
          ) : (
            <Badge variant="secondary" data-testid={`badge-unavailable-${vehicle.id}`}>
              Alugado
            </Badge>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors duration-300" data-testid={`text-vehicle-name-${vehicle.id}`}>
            {vehicle.name}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`text-vehicle-category-${vehicle.id}`}>
            {vehicle.category}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span data-testid={`text-year-${vehicle.id}`}>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span data-testid={`text-transmission-${vehicle.id}`}>{vehicle.transmission}</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="h-4 w-4" />
            <span data-testid={`text-fuel-${vehicle.id}`}>{vehicle.fuel}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span data-testid={`text-seats-${vehicle.id}`}>{vehicle.seats} lugares</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold" data-testid={`text-price-${vehicle.id}`}>
                {vehicle.fipeValue && Number(vehicle.fipeValue) > 0 
                  ? `R$ ${Number(vehicle.fipeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Consulte'}
              </p>
              <p className="text-sm text-muted-foreground">
                Tabela FIPE
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              asChild
              data-testid={`button-whatsapp-${vehicle.id}`}
            >
              <a href="https://wa.me/5511947348989" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </a>
            </Button>

            <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  data-testid={`button-lead-${vehicle.id}`}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Tenho Interesse
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]" data-testid={`dialog-lead-${vehicle.id}`}>
                <DialogHeader>
                  <DialogTitle>Tenho Interesse - {vehicle.name}</DialogTitle>
                  <DialogDescription>
                    Preencha seus dados e entraremos em contato em breve
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`lead-name-${vehicle.id}`}>Nome Completo *</Label>
                    <Input
                      id={`lead-name-${vehicle.id}`}
                      placeholder="Seu nome completo"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      data-testid={`input-lead-name-${vehicle.id}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lead-email-${vehicle.id}`}>Email *</Label>
                    <Input
                      id={`lead-email-${vehicle.id}`}
                      type="email"
                      placeholder="seu@email.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      data-testid={`input-lead-email-${vehicle.id}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lead-cpf-${vehicle.id}`}>CPF</Label>
                    <Input
                      id={`lead-cpf-${vehicle.id}`}
                      placeholder="000.000.000-00"
                      value={leadCpf}
                      onChange={(e) => setLeadCpf(formatCpf(e.target.value))}
                      maxLength={14}
                      data-testid={`input-lead-cpf-${vehicle.id}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lead-phone-${vehicle.id}`}>Telefone *</Label>
                    <Input
                      id={`lead-phone-${vehicle.id}`}
                      placeholder="(00) 00000-0000"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      data-testid={`input-lead-phone-${vehicle.id}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lead-notes-${vehicle.id}`}>Observações</Label>
                    <Textarea
                      id={`lead-notes-${vehicle.id}`}
                      placeholder="Alguma observação adicional?"
                      value={leadNotes}
                      onChange={(e) => setLeadNotes(e.target.value)}
                      rows={3}
                      data-testid={`input-lead-notes-${vehicle.id}`}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLeadDialogOpen(false)}
                      className="flex-1"
                      data-testid={`button-cancel-lead-${vehicle.id}`}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleLeadSubmit}
                      className="flex-1"
                      disabled={createLeadMutation.isPending}
                      data-testid={`button-submit-lead-${vehicle.id}`}
                    >
                      {createLeadMutation.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
