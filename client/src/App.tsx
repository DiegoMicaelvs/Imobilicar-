import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import Home from "@/pages/home";
import Vehicles from "@/pages/vehicles";
import RentVehicle from "@/pages/rent-vehicle";
import Investor from "@/pages/investor";
import NossaHistoria from "@/pages/nossa-historia";
import Admin from "@/pages/admin";
import CRM from "@/pages/crm";
import CustomerDetails from "@/pages/customer-details-new";
import InvestorDetails from "@/pages/investor-details";
import VehicleDetails from "@/pages/vehicle-details";
import CustomerAuth from "@/pages/customer-auth";
import CustomerPortal from "@/pages/customer-portal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/veiculos" component={Vehicles} />
      <Route path="/alugar/:id" component={RentVehicle} />
      <Route path="/nossa-historia" component={NossaHistoria} />
      <Route path="/investidor" component={Investor} />
      <Route path="/login" component={CustomerAuth} />
      <Route path="/portal" component={CustomerPortal} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/crm" component={CRM} />
      <Route path="/admin/cliente/:id" component={CustomerDetails} />
      <Route path="/admin/investidor/:id" component={InvestorDetails} />
      <Route path="/admin/veiculo/:id" component={VehicleDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            {!isAdminRoute && <Header />}
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
