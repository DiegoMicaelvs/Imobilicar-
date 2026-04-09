import { createContext, useContext, useState, ReactNode } from 'react';

interface RentalWizardContextType {
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
  
  // Vehicle and rental period
  selectedVehicle: any;
  setSelectedVehicle: (vehicle: any) => void;
  rentalStartDate: string;
  setRentalStartDate: (date: string) => void;
  rentalEndDate: string;
  setRentalEndDate: (date: string) => void;
  agreedRentalValue: number;
  setAgreedRentalValue: (value: number) => void;
  
  // Plans
  selectedPlans: string[];
  setSelectedPlans: (plans: string[]) => void;
  
  // Check-in photos and checklist
  checkInPhotos: Record<string, string>;
  setCheckInPhotos: (photos: Record<string, string>) => void;
  vehicleChecklist: Record<string, {checked: boolean, notes?: string}>;
  setVehicleChecklist: (checklist: Record<string, {checked: boolean, notes?: string}>) => void;
  
  // Contract and payment
  contractData: any;
  setContractData: (data: any) => void;
  paymentData: any;
  setPaymentData: (data: any) => void;
  
  // Signatures
  signatureDialogOpen: boolean;
  setSignatureDialogOpen: (open: boolean) => void;
  customerSignature: string;
  setCustomerSignature: (signature: string) => void;
  inspectorSignature: string;
  setInspectorSignature: (signature: string) => void;
  currentSignatureType: "customer" | "inspector";
  setCurrentSignatureType: (type: "customer" | "inspector") => void;
  
  // PDF generation
  inspectionPdfData: {fileName: string, fileUrl: string} | null;
  setInspectionPdfData: (data: {fileName: string, fileUrl: string} | null) => void;
  proposalPdfData: {fileName: string, fileUrl: string} | null;
  setProposalPdfData: (data: {fileName: string, fileUrl: string} | null) => void;
  isGeneratingPdf: boolean;
  setIsGeneratingPdf: (value: boolean) => void;
  
  // Processing pending requests
  processingPendingRequest: boolean;
  setProcessingPendingRequest: (value: boolean) => void;
  pendingRequestId: string | null;
  setPendingRequestId: (id: string | null) => void;
  
  // Reset function
  resetWizard: () => void;
}

const RentalWizardContext = createContext<RentalWizardContextType | undefined>(undefined);

export function RentalWizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerData, setCustomerData] = useState<any>(null);
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [guarantorData, setGuarantorData] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [rentalStartDate, setRentalStartDate] = useState<string>("");
  const [rentalEndDate, setRentalEndDate] = useState<string>("");
  const [agreedRentalValue, setAgreedRentalValue] = useState<number>(0);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [checkInPhotos, setCheckInPhotos] = useState<Record<string, string>>({});
  const [vehicleChecklist, setVehicleChecklist] = useState<Record<string, {checked: boolean, notes?: string}>>({});
  const [contractData, setContractData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [customerSignature, setCustomerSignature] = useState<string>("");
  const [inspectorSignature, setInspectorSignature] = useState<string>("");
  const [currentSignatureType, setCurrentSignatureType] = useState<"customer" | "inspector">("customer");
  const [inspectionPdfData, setInspectionPdfData] = useState<{fileName: string, fileUrl: string} | null>(null);
  const [proposalPdfData, setProposalPdfData] = useState<{fileName: string, fileUrl: string} | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [processingPendingRequest, setProcessingPendingRequest] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const resetWizard = () => {
    setCurrentStep(1);
    setCustomerData(null);
    setHasGuarantor(false);
    setGuarantorData(null);
    setSelectedVehicle(null);
    setRentalStartDate("");
    setRentalEndDate("");
    setAgreedRentalValue(0);
    setSelectedPlans([]);
    setCheckInPhotos({});
    setVehicleChecklist({});
    setContractData(null);
    setPaymentData(null);
    setCustomerSignature("");
    setInspectorSignature("");
    setInspectionPdfData(null);
    setProposalPdfData(null);
    setProcessingPendingRequest(false);
    setPendingRequestId(null);
  };

  const value: RentalWizardContextType = {
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
    rentalStartDate,
    setRentalStartDate,
    rentalEndDate,
    setRentalEndDate,
    agreedRentalValue,
    setAgreedRentalValue,
    selectedPlans,
    setSelectedPlans,
    checkInPhotos,
    setCheckInPhotos,
    vehicleChecklist,
    setVehicleChecklist,
    contractData,
    setContractData,
    paymentData,
    setPaymentData,
    signatureDialogOpen,
    setSignatureDialogOpen,
    customerSignature,
    setCustomerSignature,
    inspectorSignature,
    setInspectorSignature,
    currentSignatureType,
    setCurrentSignatureType,
    inspectionPdfData,
    setInspectionPdfData,
    proposalPdfData,
    setProposalPdfData,
    isGeneratingPdf,
    setIsGeneratingPdf,
    processingPendingRequest,
    setProcessingPendingRequest,
    pendingRequestId,
    setPendingRequestId,
    resetWizard,
  };

  return (
    <RentalWizardContext.Provider value={value}>
      {children}
    </RentalWizardContext.Provider>
  );
}

export function useRentalWizard() {
  const context = useContext(RentalWizardContext);
  if (!context) {
    throw new Error('useRentalWizard must be used within RentalWizardProvider');
  }
  return context;
}
