import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Target, TrendingUp, DollarSign, Zap, Check, PlayCircle
} from "lucide-react";

interface VendorDashboardProps {
    salesGoal: number;
    salesCount: number;
    monthlyGoalsAchieved: number;
    salesRevenue: string;
    approvedProposals: any[];
    onOpenFinancingWizard: () => void;
}

export function VendorDashboard({
    salesGoal,
    salesCount,
    monthlyGoalsAchieved,
    salesRevenue,
    approvedProposals,
    onOpenFinancingWizard
}: VendorDashboardProps) {
    const progressPercentage = Math.min((salesCount / salesGoal) * 100, 100);
    const goalAchieved = salesCount >= salesGoal;

    return (
        <div className="space-y-6">
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Meta do Dia */}
                <Card className="border-2 hover-elevate transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Target className="h-6 w-6 text-primary" />
                            </div>
                            {goalAchieved && (
                                <Badge variant="default" className="bg-green-600">
                                    <Check className="h-3 w-3 mr-1" />
                                    Atingida
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Meta do Dia</p>
                        <p className="text-3xl font-bold">{salesGoal}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {salesGoal === 1 ? "venda" : "vendas"}
                        </p>
                    </CardContent>
                </Card>

                {/* Vendas Realizadas */}
                <Card className="border-2 hover-elevate transition-all">
                    <CardContent className="p-6">
                        <div className="p-3 bg-primary/10 rounded-lg mb-4 w-fit">
                            <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Vendas Realizadas</p>
                        <p className="text-3xl font-bold text-primary">{salesCount}</p>
                        <div className="mt-3">
                            <div className="w-full bg-muted rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-500 shadow-sm shadow-primary/30"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {progressPercentage.toFixed(0)}% da meta
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Receita Total */}
                <Card className="border-2 hover-elevate transition-all">
                    <CardContent className="p-6">
                        <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg mb-4 w-fit">
                            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Receita Total</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                            R$ {parseFloat(salesRevenue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </CardContent>
                </Card>

                {/* Metas Atingidas no Mês */}
                <Card className="border-2 hover-elevate transition-all">
                    <CardContent className="p-6">
                        <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg mb-4 w-fit">
                            <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Metas Atingidas no Mês</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            {monthlyGoalsAchieved}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {monthlyGoalsAchieved === 1 ? "meta concluída" : "metas concluídas"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Message */}
            {!goalAchieved ? (
                <Card className="border-2 border-primary bg-primary/5">
                    <CardContent className="p-4 sm:p-6 text-center font-medium">
                        Faltam <span className="text-primary font-bold">{salesGoal - salesCount}</span> {salesGoal - salesCount === 1 ? "venda" : "vendas"} para atingir a meta de hoje!
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="p-4 sm:p-6 text-center font-medium text-green-700 dark:text-green-400">
                        <Check className="inline h-5 w-5 mr-2" />
                        Parabéns! Você atingiu sua meta de hoje!
                    </CardContent>
                </Card>
            )}

            {/* Approved Proposasls */}
            {approvedProposals && approvedProposals.length > 0 && (
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-green-600" />
                                    Propostas Aprovadas
                                </CardTitle>
                                <CardDescription>
                                    Suas contra-propostas foram aprovadas! Continue a venda onde parou.
                                </CardDescription>
                            </div>
                            <Badge variant="default" className="bg-green-600">
                                {approvedProposals.length} {approvedProposals.length === 1 ? 'Aprovada' : 'Aprovadas'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {approvedProposals.map((proposal: any) => {
                                const terms = proposal.proposedTerms ? JSON.parse(proposal.proposedTerms) : {};
                                return (
                                    <Card key={proposal.id} className="bg-green-50/50 dark:bg-green-950/20 p-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-lg">{proposal.vehicleName}</h4>
                                                <p className="text-sm text-muted-foreground">Cliente: {proposal.customerName}</p>
                                                <div className="mt-2 text-sm grid grid-cols-2 gap-x-4">
                                                    <span>Entrada: R$ {terms.downPayment?.toLocaleString('pt-BR')}</span>
                                                    <span>Parcela: R$ {terms.monthlyPayment?.toLocaleString('pt-BR')}</span>
                                                </div>
                                            </div>
                                            <Button onClick={onOpenFinancingWizard}>
                                                <PlayCircle className="h-4 w-4 mr-2" />
                                                Retomar Venda
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
