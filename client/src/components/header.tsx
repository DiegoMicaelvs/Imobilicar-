import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Link, useLocation } from "wouter";
import { User, LogOut, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface AuthData {
  customer: {
    id: string;
    name: string;
    role?: string;
  };
}

interface NavItem {
  href: string;
  label: string;
  protected?: boolean;
}

export function Header() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/", label: "Início" },
    { href: "/veiculos?mode=financing", label: "Locação" },
    { href: "/investidor", label: "Seja Investidor" },
    { href: "/nossa-historia", label: "Nossa História" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const checkAuthStatus = () => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      setAuthData(null);
      return;
    }
    try {
      setAuthData(JSON.parse(stored));
    } catch (error) {
      console.error("Erro ao parsear dados do customer:", error);
      localStorage.removeItem("customer");
      setAuthData(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    window.addEventListener("storage", checkAuthStatus);
    window.addEventListener("authChange", checkAuthStatus);
    return () => {
      window.removeEventListener("storage", checkAuthStatus);
      window.removeEventListener("authChange", checkAuthStatus);
    };
  }, [location]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    setAuthData(null);
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });
    setLocation("/");
  };

  const handleProtectedNavigation = (item: NavItem, e: React.MouseEvent) => {
    if (item.protected && !authData) {
      e.preventDefault();
      toast({
        title: "Login necessário",
        description: "Faça login para acessar esta funcionalidade.",
        variant: "destructive",
      });
      setLocation("/login");
    }
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  const renderNavLinks = (isMobile = false) => (
    navItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={(e) => handleProtectedNavigation(item, e)}
        className={isMobile
          ? `block px-4 py-3 rounded-md text-sm font-semibold transition-all duration-300 ${location === item.href ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted"}`
          : `text-sm font-semibold transition-all duration-300 relative group ${location === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
        }
      >
        {item.label}
        {!isMobile && (
          <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${location === item.href ? "w-full" : "w-0 group-hover:w-full"}`} />
        )}
      </Link>
    ))
  );

  return (
    <header className={`sticky top-0 z-[9999] w-full border-b transition-all duration-500 ${scrolled ? "header-scrolled bg-background/80" : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <nav className="hidden md:flex items-center gap-6">
            {renderNavLinks()}
          </nav>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {authData ? (
              <UserAccountMenu name={authData.customer.name} onLogout={handleLogout} />
            ) : (
              <PublicActions />
            )}

            <Button asChild data-testid="button-alugar">
              <Link href="/veiculos">Alugar Carro</Link>
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-xl animate-fade-in-down">
          <div className="px-4 py-4 space-y-1">
            {renderNavLinks(true)}
            {!authData && (
              <div className="pt-3 border-t mt-3 flex gap-2">
                <PublicActions isMobile />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function UserAccountMenu({ name, onLogout }: { name: string; onLogout: () => void }) {
  const firstName = name.split(' ')[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" data-testid="button-user-menu">
          <User className="h-4 w-4 mr-2" />
          {firstName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/portal" data-testid="link-portal">Meu Portal</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} data-testid="button-logout-header">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PublicActions({ isMobile = false }: { isMobile?: boolean }) {
  if (isMobile) {
    return (
      <Button variant="outline" asChild className="flex-1" data-testid="button-login-mobile">
        <Link href="/login">Portal do Investidor</Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" asChild className="hidden sm:inline-flex" data-testid="button-login">
        <Link href="/login">Portal do Investidor</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className="inline-flex px-2 sm:px-4" data-testid="button-admin">
        <Link href="/admin">Admin</Link>
      </Button>
    </>
  );
}
