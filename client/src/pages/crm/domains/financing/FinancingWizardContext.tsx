import { createContext, useContext, useState, ReactNode, useRef } from 'react';
import type { FipeBrand, FipeModel, FipeYear } from '@/pages/crm/utils/fipeApi';

interface FinancingWizardContextType {
  // Wizard navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Customer data
  customerData: any;
  setCustomerData: (data: any) => void;
  hasGuarantor: boolean;
  setHasGuarantor: (value: boolean) => void;
  guarantorData: any;
  setGuarantorData: (data: any) => void;

  // Vehicle selection
  selectedVehicle: any;
  setSelectedVehicle: (vehicle: any) => void;

  // Calculator state
  vehicleValue: number;
  setVehicleValue: (value: number) => void;
  downPaymentType: "split" | "full";
  setDownPaymentType: (type: "split" | "full") => void;
  downPaymentInstallments: number;
  setDownPaymentInstallments: (value: number) => void;
  selectedRateType: number;
  setSelectedRateType: (value: number) => void;
  rateSettings: {
    rate1: number;
    rate2: number;
    rate3: number;
    rate4: number;
  };
  setRateSettings: (settings: any) => void;
  simulationValidUntil: string;
  setSimulationValidUntil: (date: string) => void;
  dueDateDay: number;
  setDueDateDay: (day: number) => void;
  entryPercent: number;
  setEntryPercent: (percent: number) => void;
  entryValue: number;
  setEntryValue: (value: number) => void;

  // FIPE state for calculator
  calcFipeBrands: FipeBrand[];
  setCalcFipeBrands: (brands: FipeBrand[]) => void;
  calcFipeModels: FipeModel[];
  setCalcFipeModels: (models: FipeModel[]) => void;
  calcFipeYears: FipeYear[];
  setCalcFipeYears: (years: FipeYear[]) => void;
  calcSelectedBrand: string;
  setCalcSelectedBrand: (brand: string) => void;
  calcSelectedModel: string;
  setCalcSelectedModel: (model: string) => void;
  calcSelectedYear: string;
  setCalcSelectedYear: (year: string) => void;
  calcLoadingFipe: boolean;
  setCalcLoadingFipe: (loading: boolean) => void;
  calcManualBrandInput: string;
  setCalcManualBrandInput: (input: string) => void;
  calcManualModelInput: string;
  setCalcManualModelInput: (input: string) => void;
  calcFipeValue: string;
  setCalcFipeValue: (value: string) => void;
  calcLastBrandRequestRef: React.MutableRefObject<string>;
  calcLastModelRequestRef: React.MutableRefObject<string>;
  calcLastConsultaRequestRef: React.MutableRefObject<string>;

  // Financing calculation result
  financingCalculation: any;
  setFinancingCalculation: (calc: any) => void;

  // Documents
  financingDocuments: any;
  setFinancingDocuments: (docs: any) => void;

  // Check-in data
  checkInPhotos: Record<string, string>;
  setCheckInPhotos: (photos: Record<string, string>) => void;
  vehicleChecklist: Record<string, { checked: boolean, notes?: string }>;
  setVehicleChecklist: (checklist: Record<string, { checked: boolean, notes?: string }>) => void;

  // Approval
  financingApprovalStatus: "pending" | "approved" | "rejected";
  setFinancingApprovalStatus: (status: "pending" | "approved" | "rejected") => void;

  // Contract
  contractData: any;
  setContractData: (data: any) => void;

  // Payment
  paymentData: any;
  setPaymentData: (data: any) => void;

  // Inspection PDF
  inspectionPdfData: { fileName: string, fileUrl: string } | null;
  setInspectionPdfData: (data: { fileName: string, fileUrl: string } | null) => void;

  // Confession Video (Step 4)
  confessionVideoData: { blob: Blob | File, url: string, fileName: string } | null;
  setConfessionVideoData: (data: { blob: Blob | File, url: string, fileName: string } | null) => void;

  // Dialog states
  calculatorDialogOpen: boolean;
  setCalculatorDialogOpen: (open: boolean) => void;
  showFinancingDetails: boolean;
  setShowFinancingDetails: (show: boolean) => void;
  financingDetailsDialogOpen: boolean;
  setFinancingDetailsDialogOpen: (open: boolean) => void;

  // Trade-in vehicle states
  hasTradeIn: boolean;
  setHasTradeIn: (value: boolean) => void;
  tradeInVehicleData: any;
  setTradeInVehicleData: (data: any) => void;
  tradeInAcceptanceStatus: "pending" | "accepted" | "rejected";
  setTradeInAcceptanceStatus: (status: "pending" | "accepted" | "rejected") => void;
  tradeInFipeValue: string;
  setTradeInFipeValue: (value: string) => void;
  tradeInAcceptedValue: string;
  setTradeInAcceptedValue: (value: string) => void;
  tradeInDocuments: any;
  setTradeInDocuments: (docs: any) => void;
  tradeInFipeBrands: FipeBrand[];
  setTradeInFipeBrands: (brands: FipeBrand[]) => void;
  tradeInFipeModels: FipeModel[];
  setTradeInFipeModels: (models: FipeModel[]) => void;
  tradeInFipeYears: FipeYear[];
  setTradeInFipeYears: (years: FipeYear[]) => void;
  tradeInSelectedBrand: string;
  setTradeInSelectedBrand: (brand: string) => void;
  tradeInSelectedModel: string;
  setTradeInSelectedModel: (model: string) => void;
  tradeInSelectedYear: string;
  setTradeInSelectedYear: (year: string) => void;
  tradeInLoadingFipe: boolean;
  setTradeInLoadingFipe: (loading: boolean) => void;

  // Reset function
  resetWizard: () => void;
}

const FinancingWizardContext = createContext<FinancingWizardContextType | undefined>(undefined);

export function FinancingWizardProvider({ children }: { children: ReactNode }) {
  // Wizard navigation
  const [currentStep, setCurrentStep] = useState(1);

  // Customer data
  const [customerData, setCustomerData] = useState<any>(null);
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [guarantorData, setGuarantorData] = useState<any>(null);

  // Vehicle selection
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Calculator state
  const [vehicleValue, setVehicleValue] = useState<number>(50000);
  const [downPaymentType, setDownPaymentType] = useState<"split" | "full">("split");
  const [downPaymentInstallments, setDownPaymentInstallments] = useState<number>(12);
  const [selectedRateType, setSelectedRateType] = useState<number>(1);
  const [rateSettings, setRateSettings] = useState({
    rate1: 3.99441076905043,
    rate2: 4.25,
    rate3: 4.50,
    rate4: 5.00
  });
  const [simulationValidUntil, setSimulationValidUntil] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dueDateDay, setDueDateDay] = useState<number>(10);
  const [entryPercent, setEntryPercent] = useState<number>(20); // Percentual de entrada sobre o valor do veículo
  const [entryValue, setEntryValue] = useState<number>(10000); // Valor da entrada em reais

  // FIPE state for calculator
  const [calcFipeBrands, setCalcFipeBrands] = useState<FipeBrand[]>([]);
  const [calcFipeModels, setCalcFipeModels] = useState<FipeModel[]>([]);
  const [calcFipeYears, setCalcFipeYears] = useState<FipeYear[]>([]);
  const [calcSelectedBrand, setCalcSelectedBrand] = useState<string>("");
  const [calcSelectedModel, setCalcSelectedModel] = useState<string>("");
  const [calcSelectedYear, setCalcSelectedYear] = useState<string>("");
  const [calcLoadingFipe, setCalcLoadingFipe] = useState(false);
  const [calcManualBrandInput, setCalcManualBrandInput] = useState<string>("");
  const [calcManualModelInput, setCalcManualModelInput] = useState<string>("");
  const [calcFipeValue, setCalcFipeValue] = useState<string>("");

  const calcLastBrandRequestRef = useRef<string>("");
  const calcLastModelRequestRef = useRef<string>("");
  const calcLastConsultaRequestRef = useRef<string>("");

  // Financing calculation result
  const [financingCalculation, setFinancingCalculation] = useState<any>(null);

  // Documents
  const [financingDocuments, setFinancingDocuments] = useState<any>({});

  // Check-in data
  const [checkInPhotos, setCheckInPhotos] = useState<Record<string, string>>({});
  const [vehicleChecklist, setVehicleChecklist] = useState<Record<string, { checked: boolean, notes?: string }>>({});

  // Approval
  const [financingApprovalStatus, setFinancingApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");

  // Contract
  const [contractData, setContractData] = useState<any>(null);

  // Payment
  const [paymentData, setPaymentData] = useState<any>(null);

  // Inspection PDF
  const [inspectionPdfData, setInspectionPdfData] = useState<{ fileName: string, fileUrl: string } | null>(null);

  // Confession Video
  const [confessionVideoData, setConfessionVideoData] = useState<{ blob: Blob | File, url: string, fileName: string } | null>(null);

  // Dialog states
  const [calculatorDialogOpen, setCalculatorDialogOpen] = useState(false);
  const [showFinancingDetails, setShowFinancingDetails] = useState(false);
  const [financingDetailsDialogOpen, setFinancingDetailsDialogOpen] = useState(false);

  // Trade-in vehicle states
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInVehicleData, setTradeInVehicleData] = useState<any>(null);
  const [tradeInAcceptanceStatus, setTradeInAcceptanceStatus] = useState<"pending" | "accepted" | "rejected">("pending");
  const [tradeInFipeValue, setTradeInFipeValue] = useState<string>("");
  const [tradeInAcceptedValue, setTradeInAcceptedValue] = useState<string>("");
  const [tradeInDocuments, setTradeInDocuments] = useState<any>({});
  const [tradeInFipeBrands, setTradeInFipeBrands] = useState<FipeBrand[]>([]);
  const [tradeInFipeModels, setTradeInFipeModels] = useState<FipeModel[]>([]);
  const [tradeInFipeYears, setTradeInFipeYears] = useState<FipeYear[]>([]);
  const [tradeInSelectedBrand, setTradeInSelectedBrand] = useState<string>("");
  const [tradeInSelectedModel, setTradeInSelectedModel] = useState<string>("");
  const [tradeInSelectedYear, setTradeInSelectedYear] = useState<string>("");
  const [tradeInLoadingFipe, setTradeInLoadingFipe] = useState(false);

  // Reset function
  const resetWizard = () => {
    setCurrentStep(1);
    setCustomerData(null);
    setHasGuarantor(false);
    setGuarantorData(null);
    setSelectedVehicle(null);
    setVehicleValue(50000);
    setDownPaymentType("split");
    setDownPaymentInstallments(12);
    setSelectedRateType(1);
    setSimulationValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setDueDateDay(10);
    setEntryPercent(20);
    setCalcFipeBrands([]);
    setCalcFipeModels([]);
    setCalcFipeYears([]);
    setCalcSelectedBrand("");
    setCalcSelectedModel("");
    setCalcSelectedYear("");
    setCalcLoadingFipe(false);
    setCalcManualBrandInput("");
    setCalcManualModelInput("");
    setCalcFipeValue("");
    setFinancingCalculation(null);
    setFinancingDocuments({});
    setCheckInPhotos({});
    setVehicleChecklist({});
    setFinancingApprovalStatus("pending");
    setContractData(null);
    setPaymentData(null);
    setInspectionPdfData(null);
    setConfessionVideoData(null);
    setCalculatorDialogOpen(false);
    setShowFinancingDetails(false);
    setFinancingDetailsDialogOpen(false);
    setHasTradeIn(false);
    setTradeInVehicleData(null);
    setTradeInAcceptanceStatus("pending");
    setTradeInFipeValue("");
    setTradeInAcceptedValue("");
    setTradeInDocuments({});
    setTradeInFipeBrands([]);
    setTradeInFipeModels([]);
    setTradeInFipeYears([]);
    setTradeInSelectedBrand("");
    setTradeInSelectedModel("");
    setTradeInSelectedYear("");
    setTradeInLoadingFipe(false);
  };

  const value: FinancingWizardContextType = {
    currentStep,
    setCurrentStep,
    customerData,
    setCustomerData,
    hasGuarantor,
    setHasGuarantor,
    guarantorData,
    setGuarantorData,
    selectedVehicle,
    setSelectedVehicle,
    vehicleValue,
    setVehicleValue,
    downPaymentType,
    setDownPaymentType,
    downPaymentInstallments,
    setDownPaymentInstallments,
    selectedRateType,
    setSelectedRateType,
    rateSettings,
    setRateSettings,
    simulationValidUntil,
    setSimulationValidUntil,
    dueDateDay,
    setDueDateDay,
    entryPercent,
    setEntryPercent,
    entryValue,
    setEntryValue,
    calcFipeBrands,
    setCalcFipeBrands,
    calcFipeModels,
    setCalcFipeModels,
    calcFipeYears,
    setCalcFipeYears,
    calcSelectedBrand,
    setCalcSelectedBrand,
    calcSelectedModel,
    setCalcSelectedModel,
    calcSelectedYear,
    setCalcSelectedYear,
    calcLoadingFipe,
    setCalcLoadingFipe,
    calcManualBrandInput,
    setCalcManualBrandInput,
    calcManualModelInput,
    setCalcManualModelInput,
    calcFipeValue,
    setCalcFipeValue,
    calcLastBrandRequestRef,
    calcLastModelRequestRef,
    calcLastConsultaRequestRef,
    financingCalculation,
    setFinancingCalculation,
    financingDocuments,
    setFinancingDocuments,
    checkInPhotos,
    setCheckInPhotos,
    vehicleChecklist,
    setVehicleChecklist,
    financingApprovalStatus,
    setFinancingApprovalStatus,
    contractData,
    setContractData,
    paymentData,
    setPaymentData,
    inspectionPdfData,
    setInspectionPdfData,
    confessionVideoData,
    setConfessionVideoData,
    calculatorDialogOpen,
    setCalculatorDialogOpen,
    showFinancingDetails,
    setShowFinancingDetails,
    financingDetailsDialogOpen,
    setFinancingDetailsDialogOpen,
    hasTradeIn,
    setHasTradeIn,
    tradeInVehicleData,
    setTradeInVehicleData,
    tradeInAcceptanceStatus,
    setTradeInAcceptanceStatus,
    tradeInFipeValue,
    setTradeInFipeValue,
    tradeInAcceptedValue,
    setTradeInAcceptedValue,
    tradeInDocuments,
    setTradeInDocuments,
    tradeInFipeBrands,
    setTradeInFipeBrands,
    tradeInFipeModels,
    setTradeInFipeModels,
    tradeInFipeYears,
    setTradeInFipeYears,
    tradeInSelectedBrand,
    setTradeInSelectedBrand,
    tradeInSelectedModel,
    setTradeInSelectedModel,
    tradeInSelectedYear,
    setTradeInSelectedYear,
    tradeInLoadingFipe,
    setTradeInLoadingFipe,
    resetWizard,
  };

  return (
    <FinancingWizardContext.Provider value={value}>
      {children}
    </FinancingWizardContext.Provider>
  );
}

export function useFinancingWizard() {
  const context = useContext(FinancingWizardContext);
  if (!context) {
    throw new Error('useFinancingWizard must be used within FinancingWizardProvider');
  }
  return context;
}
