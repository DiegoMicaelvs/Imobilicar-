import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    ArrowLeft, PanelLeft, PanelLeftClose, User, Plus, ChevronDown,
    CreditCard, DollarSign, LogOut, LucideIcon
} from "lucide-react";
import { AdminUser } from "@shared/schema";

interface NavItem {
    value: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
}

interface AdminLayoutProps {
    children: React.ReactNode;
    currentUser: Omit<AdminUser, "password">;
    handleLogout: () => void;
    navItems: NavItem[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    title: string;
    onNewRental?: () => void;
    onNewFinancing?: () => void;
    sidebarStats?: React.ReactNode;
}

export function AdminLayout({
    children,
    currentUser,
    handleLogout,
    navItems,
    activeTab,
    setActiveTab,
    title,
    onNewRental,
    onNewFinancing,
    sidebarStats
}: AdminLayoutProps) {
    const [, setLocation] = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 border-r bg-muted/20 transition-all duration-300 hidden md:flex md:flex-col`}>
                <div className="sticky top-0 p-3 space-y-3 overflow-y-auto max-h-screen z-10">
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation("/")}
                            aria-label="Voltar à página inicial"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        {!sidebarCollapsed && (
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">{title}</span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
                            className="ml-auto"
                        >
                            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                        </Button>
                    </div>

                    {!sidebarCollapsed && (
                        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-11 w-11 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                                </div>
                            </div>
                            {sidebarStats}
                        </div>
                    )}

                    {sidebarCollapsed && (
                        <div className="flex flex-col items-center gap-1 py-1">
                            <div className="h-9 w-9 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center" title={currentUser.name}>
                                <User className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    )}

                    <div className="border-t" />

                    {/* New Actions */}
                    {(onNewRental || onNewFinancing) && (
                        <div className="space-y-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="w-full" size={sidebarCollapsed ? "icon" : "default"}>
                                        <Plus className="h-4 w-4" />
                                        {!sidebarCollapsed && <span className="ml-2">Novo</span>}
                                        {!sidebarCollapsed && <ChevronDown className="h-4 w-4 ml-2" />}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48 z-[9999]">
                                    {onNewRental && (
                                        <DropdownMenuItem onClick={onNewRental}>
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Novo Aluguel
                                        </DropdownMenuItem>
                                    )}
                                    {onNewFinancing && (
                                        <DropdownMenuItem onClick={onNewFinancing}>
                                            <DollarSign className="h-4 w-4 mr-2" />
                                            Novo Financiamento
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    {/* Nav Items */}
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <Button
                                key={item.value}
                                variant="ghost"
                                onClick={() => setActiveTab(item.value)}
                                className={`relative w-full justify-start gap-3 ${sidebarCollapsed ? 'justify-center' : ''} transition-all ${activeTab === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                    }`}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                                {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                                    <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                                        {item.badge}
                                    </Badge>
                                )}
                                {sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-destructive" />
                                )}
                            </Button>
                        ))}
                    </nav>

                    <div className="border-t pt-3 mt-auto">
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className={`w-full justify-start gap-3 text-muted-foreground ${sidebarCollapsed ? 'justify-center' : ''}`}
                            title={sidebarCollapsed ? "Sair" : undefined}
                        >
                            <LogOut className="h-4 w-4 flex-shrink-0" />
                            {!sidebarCollapsed && <span>Sair</span>}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t p-2">
                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLocation("/")}
                        className="flex-shrink-0 flex-col gap-0.5 h-auto py-1.5 px-2.5 text-[10px] text-muted-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Início</span>
                    </Button>
                    {navItems.map((item) => (
                        <Button
                            key={item.value}
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab(item.value)}
                            className={`flex-shrink-0 flex-col gap-0.5 h-auto py-1.5 px-2.5 text-[10px] ${activeTab === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="flex-shrink-0 flex-col gap-0.5 h-auto py-1.5 px-2.5 text-[10px] text-muted-foreground"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                    </Button>
                </div>
            </nav>

            <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 pb-20 md:pb-6 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
