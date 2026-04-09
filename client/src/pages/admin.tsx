import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Car, Users, Calendar, LayoutDashboard, FileText } from "lucide-react";
import { type AdminUser } from "@shared/schema";
import { useAdminData } from "@/hooks/use-admin-data";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import CRM from "@/pages/crm";
import LeadManagement from "@/pages/crm/domains/leads/LeadManagement";
import VehicleManagement from "@/pages/crm/domains/vehicles/VehicleManagement";
import RentalWizard from "@/pages/crm/domains/rentals/RentalWizard";
import { RentalWizardProvider } from "@/pages/crm/domains/rentals/RentalWizardContext";
import FinancingWizard from "@/pages/crm/domains/financing/FinancingWizard";
import { FinancingWizardProvider } from "@/pages/crm/domains/financing/FinancingWizardContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { VendorDashboard } from "@/components/admin/VendorDashboard";
import { FinancingsTab } from "@/components/admin/FinancingsTab";
import { FleetEventsTab } from "@/components/admin/FleetEventsTab";
import { CrmDataProvider } from "@/pages/crm/context/CrmDataProvider";
import { Dialog, DialogContent } from "@/components/ui/dialog";






// Vendor Workspace Component
function VendorWorkspace({ currentUser, handleLogout }: { currentUser: Omit<AdminUser, 'password'>; handleLogout: () => void }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [rentalWizardOpen, setRentalWizardOpen] = useState(false);
  const [financingWizardOpen, setFinancingWizardOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const adminData = useAdminData(true, currentUser.id);
  
  const customers = adminData.customers.data || [];
  const financings = adminData.financings.data || [];
  const vehicles = adminData.vehicles.data || [];
  const tradeInVehicles = adminData.tradeInVehicles.data || [];
  const customerEvents = adminData.customerEvents.data || [];
  const rentals = adminData.rentals.data || [];
  const approvedProposals = adminData.financingProposals.data || [];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "eventos") {
      adminData.customerEvents.refetch();
    }
  };

  const { approveFinancing, rejectFinancing } = useAdminMutations();

  const [fleetEventDialogOpen, setFleetEventDialogOpen] = useState(false);
  const [registerDamageDialogOpen, setRegisterDamageDialogOpen] = useState(false);
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [selectedFinancing, setSelectedFinancing] = useState<any>(null);
  const [financingDetailsOpen, setFinancingDetailsOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [confessionVideoDialogOpen, setConfessionVideoDialogOpen] = useState(false);

  const navItems = [
    { value: "dashboard", label: "Controle", icon: LayoutDashboard },
    { value: "leads", label: "Leads", icon: Users },
    { value: "fleet", label: "Frota iMobile", icon: Car },
    { value: "financiamentos", label: "Contratos", icon: FileText },
    { value: "eventos", label: "Eventos", icon: Calendar, badge: customerEvents.filter(e => e.status === 'aberto').length },
  ];

  return (
    <AdminLayout
      currentUser={currentUser}
      handleLogout={handleLogout}
      navItems={navItems}
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      title="Painel Vendedor"
      onNewRental={() => setRentalWizardOpen(true)}
      onNewFinancing={() => setFinancingWizardOpen(true)}
      sidebarStats={
        <div className="mt-4 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Meta de Hoje</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-primary">0</span>
            <span className="text-xs text-muted-foreground mb-1">/ 1 vendas</span>
          </div>
        </div>
      }
    >
      {activeTab === "dashboard" && (
        <VendorDashboard
          salesGoal={1}
          salesCount={0}
          monthlyGoalsAchieved={0}
          salesRevenue={currentUser.salesRevenue || "0"}
          approvedProposals={approvedProposals}
          onOpenFinancingWizard={() => setFinancingWizardOpen(true)}
        />
      )}

      {activeTab === "leads" && <LeadManagement />}

      {activeTab === "fleet" && <VehicleManagement showOnlyTradeIns={false} readOnly={true} />}

      {activeTab === "financiamentos" && (
        <FinancingsTab
          financings={financings}
          vehicles={vehicles}
          tradeInVehicles={tradeInVehicles}
          onOpenCalculator={() => setCalculatorDialogOpen(true)}
          onNewFinancing={() => setFinancingWizardOpen(true)}
          onSelectFinancing={(f) => { setSelectedFinancing(f); setFinancingDetailsOpen(true); }}
          onCheckIn={(f) => { setSelectedFinancing(f); setCheckInDialogOpen(true); }}
          onCheckout={(id) => { setCheckoutDialogOpen(true); }}
          onConfessionVideo={(f) => { setSelectedFinancing(f); setConfessionVideoDialogOpen(true); }}
          onApprove={(id) => approveFinancing.mutate(id)}
          onReject={(id) => rejectFinancing.mutate(id)}
          isMutating={approveFinancing.isPending || rejectFinancing.isPending}
        />
      )}

      {activeTab === "eventos" && (
        <FleetEventsTab
          customerEvents={customerEvents}
          rentals={rentals}
          customers={customers}
          vehicles={vehicles}
          onRegisterDamage={() => setRegisterDamageDialogOpen(true)}
          onAddFleetEvent={() => setFleetEventDialogOpen(true)}
        />
      )}

      {/* Wizards and Dialogs */}
      <RentalWizardProvider>
        <Dialog open={rentalWizardOpen} onOpenChange={setRentalWizardOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <RentalWizard />
          </DialogContent>
        </Dialog>
      </RentalWizardProvider>

      <FinancingWizardProvider>
        <Dialog open={financingWizardOpen} onOpenChange={setFinancingWizardOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <FinancingWizard />
          </DialogContent>
        </Dialog>
      </FinancingWizardProvider>
    </AdminLayout>
  );
}
export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Omit<AdminUser, 'password'> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const adminAuthData = localStorage.getItem("adminAuth");
    if (adminAuthData) {
      try {
        const { timestamp, user } = JSON.parse(adminAuthData);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000 && user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
        } else {
          localStorage.removeItem("adminAuth");
        }
      } catch {
        localStorage.removeItem("adminAuth");
      }
    }
  }, []);


  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("adminAuth");
  };

  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLogin={async (email, password) => {
          setError("");
          try {
            const response = await fetch("/api/admin/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (data.success && data.user) {
              setIsAuthenticated(true);
              setCurrentUser(data.user);
              localStorage.setItem("adminAuth", JSON.stringify({
                timestamp: Date.now(),
                authenticated: true,
                user: data.user
              }));
            } else {
              setError(data.error || "Email ou senha incorretos");
            }
          } catch (error) {
            setError("Erro ao conectar com o servidor");
          }
        }}
        isLoading={false}
        error={error}
      />
    );
  }

  // Dashboard específico para vendedores
  if (currentUser?.role === "VENDEDOR") {
    return <VendorWorkspace currentUser={currentUser} handleLogout={handleLogout} />;
  }

  // ADMIN: renderizar CRM diretamente
  return <CRM />;
}

// Componente de Gerenciamento de Usuários Admin
