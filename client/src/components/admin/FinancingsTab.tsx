import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, FileText, Camera, Video, Check, X, Loader2 } from "lucide-react";
import placeholderLogo from "@assets/logo_imobile_1765389205488.png";

interface FinancingsTabProps {
    financings: any[];
    vehicles: any[];
    tradeInVehicles: any[];
    onOpenCalculator: () => void;
    onNewFinancing: () => void;
    onSelectFinancing: (f: any) => void;
    onCheckIn: (f: any) => void;
    onCheckout: (f: any) => void;
    onConfessionVideo: (f: any) => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    isMutating: boolean;
}

export function FinancingsTab({
    financings,
    vehicles,
    tradeInVehicles,
    onOpenCalculator,
    onNewFinancing,
    onSelectFinancing,
    onCheckIn,
    onCheckout,
    onConfessionVideo,
    onApprove,
    onReject,
    isMutating
}: FinancingsTabProps) {
    const filteredFinancings = financings?.filter((f: any) => ["approved", "pending", "finalized"].includes(f.approvalStatus)) || [];

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-wrap">
                    <div>
                        <CardTitle>Contratos de Financiamento</CardTitle>
                        <CardDescription>Contratos aprovados e em andamento</CardDescription>
                    </div>
                    <Button onClick={onOpenCalculator} data-testid="button-open-vendor-calculator">
                        <Calculator className="h-4 w-4 mr-2" /> Calculadora
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {filteredFinancings.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="mb-6">Nenhum contrato encontrado</p>
                        <Button onClick={onNewFinancing}><Plus className="mr-2 h-4 w-4" /> Novo Financiamento</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFinancings.map((financing) => {
                            const vehicle = vehicles?.find((v: any) => v.id === financing.vehicleId);
                            const tradeIn = tradeInVehicles?.find((t: any) => t.financingId === financing.id);
                            const isPlaceholder = !vehicle?.imageUrl || vehicle.imageUrl.includes('placeholder');

                            return (
                                <Card key={financing.id} className="hover-elevate cursor-pointer" onClick={() => onSelectFinancing(financing)}>
                                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 p-6">
                                        <div className={`aspect-video md:aspect-square rounded-lg overflow-hidden ${isPlaceholder ? 'bg-gray-900' : 'bg-muted'}`}>
                                            <img src={isPlaceholder ? placeholderLogo : vehicle.imageUrl} alt={vehicle?.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold">{financing.customerName}</h3>
                                                    <p className="text-sm text-muted-foreground">{vehicle?.name} • {vehicle?.licensePlate}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant={financing.approvalStatus === "approved" ? "default" : financing.approvalStatus === "finalized" ? "outline" : "secondary"}>
                                                        {financing.approvalStatus}
                                                    </Badge>
                                                    {financing.approvalStatus === "approved" && (
                                                        <Badge variant="outline" className={financing.paymentStatus === "em_dia" ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}>
                                                            {financing.paymentStatus === "em_dia" ? "✓ Em Dia" : "⚠ Atrasado"}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div><p className="text-xs text-muted-foreground">Valor</p>R$ {Number(financing.vehicleValue).toLocaleString('pt-BR')}</div>
                                                <div><p className="text-xs text-muted-foreground">Entrada</p>R$ {Number(financing.downPaymentTotal).toLocaleString('pt-BR')}</div>
                                                <div><p className="text-xs text-muted-foreground">Parcelas</p>{financing.installments}x R$ {Number(financing.monthlyInstallment).toLocaleString('pt-BR')}</div>
                                            </div>

                                            {financing.approvalStatus === "pending" && (
                                                <div className="pt-3 flex gap-2">
                                                    <Button onClick={(e) => { e.stopPropagation(); onApprove(financing.id); }} disabled={isMutating} className="bg-green-600 font-bold">Aprovar</Button>
                                                    <Button variant="destructive" onClick={(e) => { e.stopPropagation(); onReject(financing.id); }} disabled={isMutating}>Rejeitar</Button>
                                                </div>
                                            )}

                                            {financing.approvalStatus === "approved" && (
                                                <div className="pt-3 flex gap-2">
                                                    {!financing.checkInCompletedAt ? (
                                                        <Button onClick={(e) => { e.stopPropagation(); onCheckIn(financing); }} className="bg-blue-600">Vistoria Entrega</Button>
                                                    ) : (
                                                        <Badge variant="outline" className="border-green-500 text-green-600">✓ Vistoria Concluída</Badge>
                                                    )}
                                                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); onConfessionVideo(financing); }}>
                                                        <Video className="h-4 w-4 mr-2" /> Vídeo Confissão
                                                    </Button>
                                                </div>
                                            )}

                                            {financing.approvalStatus === "finalized" && !financing.checkOutCompletedAt && (
                                                <Button onClick={(e) => { e.stopPropagation(); onCheckout(financing.id); }}>Vistoria Checkout</Button>
                                            )}
                                        </div>
                                    </div>
                                    {tradeIn && (
                                        <div className="px-6 pb-6 pt-4 border-t">
                                            <Badge variant="outline" className="border-orange-500 text-orange-600 mb-2">Veículo de Troca</Badge>
                                            <p className="text-sm">{tradeIn.brand} {tradeIn.model} - R$ {Number(tradeIn.acceptedValue).toLocaleString('pt-BR')}</p>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
