import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Car, TrendingUp, Calendar } from "lucide-react";
import type { Vehicle, Rental, Investor } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { data: investors } = useQuery<Investor[]>({
    queryKey: ["/api/investors"],
  });

  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: rentals } = useQuery<Rental[]>({
    queryKey: ["/api/rentals"],
  });

  const investor = investors?.[0];
  const investorVehicles = vehicles?.filter(v => v.isInvestorVehicle) || [];
  const investorRentals = rentals?.filter(r => 
    investorVehicles.some(v => v.id === r.vehicleId)
  ) || [];

  const totalEarnings = investorRentals.reduce((sum, rental) => {
    const vehicle = investorVehicles.find(v => v.id === rental.vehicleId);
    const percentage = vehicle?.investorPercentage || 70;
    return sum + (Number(rental.totalPrice) * percentage / 100);
  }, 0);

  const activeRentals = investorRentals.filter(r => r.status === "active").length;

  const stats = [
    {
      title: "Ganhos Totais",
      value: `R$ ${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      trend: "+12% este mês",
    },
    {
      title: "Veículos Cadastrados",
      value: investorVehicles.length.toString(),
      icon: Car,
      trend: `${investorVehicles.filter(v => v.available).length} disponíveis`,
    },
    {
      title: "Aluguéis Ativos",
      value: activeRentals.toString(),
      icon: TrendingUp,
      trend: `${investorRentals.length} total`,
    },
  ];

  if (!investor && !investorVehicles.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Nenhum investimento encontrado</h2>
          <p className="text-muted-foreground mb-6">
            Você ainda não está cadastrado como investidor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/30 py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 font-display" data-testid="text-dashboard-title">
            Dashboard do Investidor
          </h1>
          {investor && (
            <p className="text-muted-foreground text-lg" data-testid="text-investor-name">
              Bem-vindo, {investor.name}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} data-testid={`card-stat-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Seus Veículos</CardTitle>
            </CardHeader>
            <CardContent>
              {investorVehicles.length > 0 ? (
                <div className="space-y-4">
                  {investorVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex gap-4 p-4 rounded-lg border hover-elevate"
                      data-testid={`vehicle-item-${vehicle.id}`}
                    >
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.name}
                        className="w-24 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.category}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={vehicle.available ? "default" : "secondary"} className="text-xs">
                            {vehicle.available ? "Disponível" : "Alugado"}
                          </Badge>
                          <span className="text-sm font-medium">
                            R$ {Number(vehicle.pricePerDay).toFixed(2)}/dia
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum veículo cadastrado
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Aluguéis</CardTitle>
            </CardHeader>
            <CardContent>
              {investorRentals.length > 0 ? (
                <div className="space-y-4">
                  {investorRentals.slice(0, 5).map((rental) => {
                    const vehicle = investorVehicles.find(v => v.id === rental.vehicleId);
                    const percentage = vehicle?.investorPercentage || 70;
                    const earnings = Number(rental.totalPrice) * percentage / 100;
                    
                    return (
                      <div
                        key={rental.id}
                        className="flex justify-between items-start p-4 rounded-lg border"
                        data-testid={`rental-item-${rental.id}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{vehicle?.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {rental.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(rental.startDate), "dd MMM", { locale: ptBR })} - {format(new Date(rental.endDate), "dd MMM", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-chart-3">
                            +R$ {earnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {percentage}% de R$ {Number(rental.totalPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum aluguel registrado
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
