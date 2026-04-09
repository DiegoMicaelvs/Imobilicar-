import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Shield, Lock, User, ArrowRight, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoPng from "@assets/logo png imobile car_1762547337913.png";
import investmentBg from "@assets/investimento.jpg";

export default function CustomerAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Formatar CPF
  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cpf || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha CPF e senha para fazer login.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        cpf: cpf,
        password: password,
      });

      const response = await res.json();

      if (response.success && response.customer) {
        localStorage.setItem("customer", JSON.stringify({
          customer: response.customer
        }));

        toast({
          title: "Login realizado!",
          description: `Bem-vindo de volta, ${response.customer.name}!`,
        });

        setLocation("/portal");
      }
    } catch (error: any) {
      let errorMessage = "CPF ou senha incorretos. Se você ainda não tem acesso, entre em contato com o suporte.";

      if (error.message) {
        const parts = error.message.split(": ");
        if (parts.length > 1) {
          errorMessage = parts.slice(1).join(": ");
          try {
            const errorData = JSON.parse(errorMessage);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // Fallback to raw string
          }
        }
      }

      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-black">
      {/* Dynamic Background */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${investmentBg})` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black/80 via-black/40 to-primary/10 backdrop-blur-[2px]" />

      {/* Floating particles or decorative elements could go here */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <div className="mb-10 flex flex-col items-center text-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-50" />
            <img
              src={logoPng}
              alt="Imobilicar"
              className="h-24 sm:h-28 w-auto mb-6 relative drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-display"
          >
            Portal do <span className="text-primary italic">Investidor</span>
          </motion.h1>

        </div>

        <Card className="border-white/10 bg-black/60 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Área Restrita
            </CardTitle>
            <CardDescription className="text-gray-400 text-center font-medium">
              Informe suas credenciais de acesso
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-white/70 text-sm font-semibold ml-1">CPF</Label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="cpf"
                    className="h-12 pl-11 bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    maxLength={14}
                    data-testid="input-cpf"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-white/70 text-sm font-semibold">Senha</Label>
                  <button type="button" className="text-xs font-bold text-primary/80 hover:text-primary transition-colors">
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    className="h-12 pl-11 bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-black font-black h-12 rounded-xl transition-all shadow-[0_10px_20px_-5px_rgba(255,204,0,0.3)] group mt-4 overflow-hidden relative"
                disabled={loading}
                data-testid="button-login"
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center"
                    >
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processando...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      ENTRAR NO SISTEMA
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </form>


          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-center"
        >
          <p className="text-[11px] text-gray-500 font-medium tracking-wide">
            SISTEMA DE GESTÃO PATRIMONIAL &copy; 2025 IMOBILICAR
          </p>
          <div className="mt-4 flex justify-center items-center gap-6">
            <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Criptografia SSL 256-bit</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative Glows */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </div>
  );
}
