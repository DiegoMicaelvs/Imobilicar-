import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle } from "lucide-react";

interface FleetEventsTabProps {
    customerEvents: any[];
    rentals: any[];
    customers: any[];
    vehicles: any[];
    onRegisterDamage: () => void;
    onAddFleetEvent: () => void;
}

export function FleetEventsTab({
    customerEvents,
    rentals,
    customers,
    vehicles,
    onRegisterDamage,
    onAddFleetEvent
}: FleetEventsTabProps) {
    const [eventFilterName, setEventFilterName] = useState("");
    const [eventFilterPlate, setEventFilterPlate] = useState("");
    const [eventFilterType, setEventFilterType] = useState("");
    const [eventFilterStatus, setEventFilterStatus] = useState("");

    // Combinar eventos da frota com avarias de aluguéis
    let allEvents: any[] = [];

    // Adicionar eventos da frota (que têm incidentType)
    const fleetEvents = customerEvents?.filter((e: any) => e.incidentType) || [];
    allEvents.push(...fleetEvents.map((e: any) => ({ ...e, eventSource: 'fleet' })));

    // Adicionar APENAS avarias de aluguéis como eventos
    const rentalDamages = rentals?.filter((r: any) => r.checkpointHasDamages) || [];
    allEvents.push(...rentalDamages.map((r: any) => ({
        ...r,
        eventSource: 'rental_damage',
        id: r.id,
        title: `Devolução com Avaria #${r.id.slice(0, 8)}`,
        incidentType: 'oficina',
        severity: Number(r.checkpointRepairCost || 0) > 1000 ? 'alta' : 'media',
        status: 'resolvido',
        cost: r.checkpointRepairCost,
        createdAt: r.checkoutCompletedAt || r.finalizedAt || r.updatedAt || r.createdAt
    })));

    // Ordenar por data (mais recentes primeiro)
    allEvents.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Aplicar filtros
    let filtered = allEvents;

    if (eventFilterName) {
        filtered = filtered.filter((e: any) => {
            const customer = customers?.find((c: any) => c.id === e.customerId);
            return customer?.name?.toLowerCase().includes(eventFilterName.toLowerCase());
        });
    }
    if (eventFilterPlate) {
        filtered = filtered.filter((e: any) => {
            const vehicle = vehicles?.find((v: any) => v.id === e.vehicleId);
            return vehicle?.name?.toLowerCase().includes(eventFilterPlate.toLowerCase()) ||
                vehicle?.licensePlate?.toLowerCase().includes(eventFilterPlate.toLowerCase());
        });
    }
    if (eventFilterType) {
        filtered = filtered.filter((e: any) => e.incidentType === eventFilterType);
    }
    if (eventFilterStatus) {
        filtered = filtered.filter((e: any) => e.status === eventFilterStatus);
    }

    const typeColors: Record<string, string> = {
        'roubo': 'bg-red-500/10 text-red-600 border-red-500/20',
        'furto': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        'colisao': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        'incendio': 'bg-red-500/10 text-red-600 border-red-500/20',
        'oficina': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        'assistencia': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
        'manutencao': 'bg-green-500/10 text-green-600 border-green-500/20',
    };

    const statusColors: Record<string, string> = {
        'aberto': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        'em_andamento': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        'resolvido': 'bg-green-500/10 text-green-600 border-green-500/20',
        'cancelado': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <div>
                    <CardTitle>Eventos da Frota</CardTitle>
                    <CardDescription>Incidentes, sinistros, avarias e manutenções</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button onClick={onRegisterDamage} variant="outline" data-testid="button-register-damage">
                        <Plus className="h-4 w-4 mr-2" /> Registrar Avaria
                    </Button>
                    <Button onClick={onAddFleetEvent} data-testid="button-add-fleet-event">
                        <Plus className="h-4 w-4 mr-2" /> Registrar Evento
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input placeholder="Cliente..." value={eventFilterName} onChange={(e) => setEventFilterName(e.target.value)} />
                    <Input placeholder="Veículo ou Placa..." value={eventFilterPlate} onChange={(e) => setEventFilterPlate(e.target.value)} />
                    <Select value={eventFilterType || "all"} onValueChange={(v) => setEventFilterType(v === "all" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="roubo">Roubo</SelectItem>
                            <SelectItem value="furto">Furto</SelectItem>
                            <SelectItem value="colisao">Colisão</SelectItem>
                            <SelectItem value="oficina">Oficina/Reparo</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={eventFilterStatus || "all"} onValueChange={(v) => setEventFilterStatus(v === "all" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="resolvido">Resolvido</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p>Nenhum evento registrado</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((event) => {
                            const customer = customers?.find((c) => c.id === event.customerId);
                            const vehicle = vehicles?.find((v) => v.id === event.vehicleId);
                            return (
                                <Card key={event.id} className="hover-elevate">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold">{event.title || event.incidentType}</h3>
                                                <p className="text-sm text-muted-foreground">{customer?.name} • {vehicle?.name}</p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Badge variant="outline" className={typeColors[event.incidentType]}>{event.incidentType}</Badge>
                                                <Badge variant="outline" className={statusColors[event.status]}>{event.status}</Badge>
                                            </div>
                                        </div>
                                        {event.description && <p className="text-sm mb-4">{event.description}</p>}
                                        <div className="grid grid-cols-3 gap-4 pt-4 border-t text-sm">
                                            {event.cost && <div><p className="text-xs text-muted-foreground">Custo</p>R$ {Number(event.cost).toLocaleString('pt-BR')}</div>}
                                            <div><p className="text-xs text-muted-foreground">Severidade</p>{event.severity}</div>
                                            <div><p className="text-xs text-muted-foreground">Data</p>{new Date(event.createdAt).toLocaleDateString('pt-BR')}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
