import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import logoImobilicar from "@assets/logo imobile_1759944435911.png";
import adminBg from "@assets/Foto_titulo.jpeg";

interface AdminLoginProps {
    onLogin: (email: string, password: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function AdminLogin({ onLogin, isLoading, error }: AdminLoginProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-black">
            {/* Background Layer */}
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.5 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${adminBg})` }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/60 to-transparent backdrop-blur-[1px]" />

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute bottom-1/2 right-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-[420px]"
            >
                <div className="mb-8 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <img
                            src={logoImobilicar}
                            alt="Imobilicar Admin"
                            className="h-20 sm:h-24 w-auto mb-6 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                        />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase"
                    >
                        Painel <span className="text-primary italic">Admin</span>
                    </motion.h1>
                </div>

                <Card className="border-white/10 bg-black/70 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

                    <CardHeader className="space-y-1 pb-6 pt-8">
                        <CardTitle className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Acesso Restrito
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-center font-medium">
                            Sistema de Gestão Imobilicar
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pb-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 group">
                                <Label htmlFor="email" className="text-white/70 text-sm font-bold ml-1">Email Corporativo</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        className="h-12 pl-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                                        placeholder="seu@imobilicar.com.br"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label htmlFor="password" className="text-white/70 text-sm font-bold ml-1">Senha de Acesso</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        className="h-12 pl-11 bg-white/[0.04] border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-sm font-bold text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-black font-black h-12 rounded-xl transition-all shadow-[0_10px_20px_-5px_rgba(255,204,0,0.3)] group relative overflow-hidden"
                                disabled={isLoading}
                            >
                                <AnimatePresence mode="wait">
                                    {isLoading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-center"
                                        >
                                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            Autenticando...
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="idle"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-2"
                                        >
                                            ENTRAR NO PAINEL
                                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                            <Link href="/">
                                <Button
                                    variant="ghost"
                                    className="text-gray-500 hover:text-white hover:bg-white/5 transition-all text-xs font-bold flex items-center gap-2 group rounded-lg"
                                >
                                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                    VOLTAR PARA PÁGINA INICIAL
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
