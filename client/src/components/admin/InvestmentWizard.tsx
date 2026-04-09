import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, User, Car, DollarSign, Camera, FileText, Lock, ArrowRight, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvestmentWizardProps {
    onClose: (success?: boolean) => void;
}

export function InvestmentWizard({ onClose }: InvestmentWizardProps) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States for the wizard
    const [customerData, setCustomerData] = useState<any>({});
    const [investmentBankData, setInvestmentBankData] = useState<any>({});
    const [investorDocuments, setInvestorDocuments] = useState<any>({});
    const [investmentVehicleData, setInvestmentVehicleData] = useState<any>({});
    const [isVehicleOwner, setIsVehicleOwner] = useState(true);
    const [vehicleOwnerName, setVehicleOwnerName] = useState("");

    // FIPE States
    const [wizardSelectedBrand, setWizardSelectedBrand] = useState("");
    const [wizardSelectedModel, setWizardSelectedModel] = useState("");
    const [wizardSelectedYear, setWizardSelectedYear] = useState("");
    const [wizardFipeBrands, setWizardFipeBrands] = useState<any[]>([]);
    const [wizardFipeModels, setWizardFipeModels] = useState<any[]>([]);
    const [wizardFipeYears, setWizardFipeYears] = useState<any[]>([]);
    const [wizardFipeValue, setWizardFipeValue] = useState("");
    const [wizardLoadingFipe, setWizardLoadingFipe] = useState(false);

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handleBack = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
                {[
                    { step: 1, icon: User, label: "Cadastro" },
                    { step: 2, icon: Car, label: "Veículo" },
                    { step: 3, icon: DollarSign, label: "Dividendos" },
                    { step: 4, icon: Camera, label: "Fotos" },
                    { step: 5, icon: FileText, label: "Contrato" },
                    { step: 6, icon: Lock, label: "Conta" },
                ].map((item, index) => (
                    <div key={item.step} className="flex items-center flex-1 min-w-[50px]">
                        <div className="flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep > item.step ? "bg-primary border-primary text-primary-foreground" :
                                    currentStep === item.step ? "border-primary text-primary" : "border-muted text-muted-foreground"
                                }`}>
                                {currentStep > item.step ? <Check className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
                            </div>
                            <p className="text-[10px] mt-1 text-center hidden sm:block">{item.label}</p>
                        </div>
                        {index < 5 && <div className={`flex-1 h-0.5 mx-1 ${currentStep > item.step ? "bg-primary" : "bg-muted"}`} />}
                    </div>
                ))}
            </div>

            {currentStep === 1 && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input value={customerData.name || ""} onChange={e => setCustomerData({ ...customerData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={customerData.email || ""} onChange={e => setCustomerData({ ...customerData, email: e.target.value })} />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onClose()}>Cancelar</Button>
                        <Button onClick={handleNext}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                </div>
            )}

            {/* Simplified for brevity in this initial extract, will expand if needed */}
            {currentStep > 1 && (
                <div className="text-center py-20">
                    <p>Etapa {currentStep} em construção no componente extraído...</p>
                    <div className="flex justify-center gap-2 mt-4">
                        <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                        {currentStep < 6 ? (
                            <Button onClick={handleNext}>Próximo <ArrowRight className="ml-2 h-4 w-4" /></Button>
                        ) : (
                            <Button onClick={() => onClose(true)}>Finalizar</Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
