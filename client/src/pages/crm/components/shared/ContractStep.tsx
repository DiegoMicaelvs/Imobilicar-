import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import FileUploadZone from "./FileUploadZone";

interface ContractStepProps {
  templates: any[];
  customerData: any;
  selectedVehicle: any;
  rentalStartDate: string;
  rentalEndDate: string;
  agreedRentalValue: number;
  guarantorData?: any;
  contractData: any;
  setContractData: (data: any) => void;
}

export default function ContractStep({ 
  templates, 
  customerData, 
  selectedVehicle, 
  rentalStartDate, 
  rentalEndDate, 
  agreedRentalValue,
  guarantorData,
  contractData,
  setContractData
}: ContractStepProps) {
  const rentalTemplate = templates?.find((t: any) => t.type === "rental" && t.isActive);
  
  const fillContractTemplate = (template: string) => {
    if (!customerData || !selectedVehicle || !rentalStartDate || !rentalEndDate) {
      return template;
    }
    
    const days = Math.ceil((new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalValue = agreedRentalValue || (days * Number(selectedVehicle.pricePerDay));
    
    const enderecoCompleto = `${customerData.street}${customerData.complement ? ', ' + customerData.complement : ''}, ${customerData.neighborhood}, ${customerData.city} - ${customerData.state}, CEP: ${customerData.zipCode}`;
    
    let filledTemplate = template
      .replace(/\{\{CLIENTE_NOME\}\}/g, customerData.name || "")
      .replace(/\{\{CLIENTE_CPF\}\}/g, customerData.cpf || "")
      .replace(/\{\{CLIENTE_EMAIL\}\}/g, customerData.email || "")
      .replace(/\{\{CLIENTE_TELEFONE\}\}/g, customerData.phone || "")
      .replace(/\{\{CLIENTE_CNH\}\}/g, customerData.driverLicense || "")
      .replace(/\{\{CLIENTE_EMERGENCIA\}\}/g, customerData.emergencyContact || "")
      .replace(/\{\{CLIENTE_RUA\}\}/g, customerData.street || "")
      .replace(/\{\{CLIENTE_COMPLEMENTO\}\}/g, customerData.complement || "")
      .replace(/\{\{CLIENTE_BAIRRO\}\}/g, customerData.neighborhood || "")
      .replace(/\{\{CLIENTE_CIDADE\}\}/g, customerData.city || "")
      .replace(/\{\{CLIENTE_ESTADO\}\}/g, customerData.state || "")
      .replace(/\{\{CLIENTE_CEP\}\}/g, customerData.zipCode || "")
      .replace(/\{\{CLIENTE_ENDERECO_COMPLETO\}\}/g, enderecoCompleto)
      .replace(/\{\{VEICULO_NOME\}\}/g, selectedVehicle.name || "")
      .replace(/\{\{VEICULO_MARCA\}\}/g, selectedVehicle.brand || "")
      .replace(/\{\{VEICULO_MODELO\}\}/g, selectedVehicle.model || "")
      .replace(/\{\{VEICULO_ANO\}\}/g, selectedVehicle.year?.toString() || "")
      .replace(/\{\{VEICULO_PLACA\}\}/g, selectedVehicle.plate || "")
      .replace(/\{\{VEICULO_COR\}\}/g, selectedVehicle.color || "")
      .replace(/\{\{VEICULO_CATEGORIA\}\}/g, selectedVehicle.category || "")
      .replace(/\{\{VEICULO_COMBUSTIVEL\}\}/g, selectedVehicle.fuel || "")
      .replace(/\{\{VEICULO_TRANSMISSAO\}\}/g, selectedVehicle.transmission || "")
      .replace(/\{\{VEICULO_LUGARES\}\}/g, selectedVehicle.seats?.toString() || "")
      .replace(/\{\{DATA_INICIO\}\}/g, format(new Date(rentalStartDate), "dd/MM/yyyy", { locale: ptBR }))
      .replace(/\{\{DATA_FIM\}\}/g, format(new Date(rentalEndDate), "dd/MM/yyyy", { locale: ptBR }))
      .replace(/\{\{DATA_HOJE\}\}/g, format(new Date(), "dd/MM/yyyy", { locale: ptBR }))
      .replace(/\{\{NUMERO_DIARIAS\}\}/g, days.toString())
      .replace(/\{\{VALOR_DIARIA\}\}/g, `R$ ${Number(selectedVehicle.pricePerDay).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
      .replace(/\{\{VALOR_TOTAL\}\}/g, `R$ ${totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
      .replace(/\{\{AVALISTA_NOME\}\}/g, guarantorData?.name || "Não informado")
      .replace(/\{\{AVALISTA_CPF\}\}/g, guarantorData?.cpf || "Não informado")
      .replace(/\{\{AVALISTA_EMAIL\}\}/g, guarantorData?.email || "Não informado")
      .replace(/\{\{AVALISTA_TELEFONE\}\}/g, guarantorData?.phone || "Não informado")
      .replace(/\{\{AVALISTA_CNH\}\}/g, guarantorData?.driverLicense || "Não informado");
    
    filledTemplate = filledTemplate
      .replace(/(Nome\/Razão Social:)\s*_+/gi, `$1 ${customerData.name || ""}`)
      .replace(/(CPF\/CNPJ:)\s*_+/gi, `$1 ${customerData.cpf || ""}`)
      .replace(/(Endereço:)\s*_+/gi, `$1 ${enderecoCompleto}`)
      .replace(/(Cidade\/UF:)\s*_+/gi, `$1 ${customerData.city || ""} - ${customerData.state || ""}`)
      .replace(/(Telefone:)\s*_+/gi, `$1 ${customerData.phone || ""}`)
      .replace(/(E-mail:)\s*_+/gi, `$1 ${customerData.email || ""}`)
      .replace(/(CNH:)\s*_+/gi, `$1 ${customerData.driverLicense || ""}`)
      .replace(/(Contato de Emergência:)\s*_+/gi, `$1 ${customerData.emergencyContact || ""}`)
      .replace(/(CEP:)\s*_+/gi, `$1 ${customerData.zipCode || ""}`)
      .replace(/(Bairro:)\s*_+/gi, `$1 ${customerData.neighborhood || ""}`)
      .replace(/(Complemento:)\s*_+/gi, `$1 ${customerData.complement || "Não informado"}`)
      .replace(/(Marca\/Modelo:)\s*_+/gi, `$1 ${selectedVehicle.brand || ""} ${selectedVehicle.model || ""}`)
      .replace(/(Marca:)\s*_+/gi, `$1 ${selectedVehicle.brand || ""}`)
      .replace(/(Modelo:)\s*_+/gi, `$1 ${selectedVehicle.model || ""}`)
      .replace(/(Ano:)\s*_+/gi, `$1 ${selectedVehicle.year || ""}`)
      .replace(/(Placa:)\s*_+/gi, `$1 ${selectedVehicle.plate || ""}`)
      .replace(/(Cor:)\s*_+/gi, `$1 ${selectedVehicle.color || ""}`)
      .replace(/(Categoria:)\s*_+/gi, `$1 ${selectedVehicle.category || ""}`)
      .replace(/(Combustível:)\s*_+/gi, `$1 ${selectedVehicle.fuel || ""}`)
      .replace(/(Transmissão:)\s*_+/gi, `$1 ${selectedVehicle.transmission || ""}`)
      .replace(/(Capacidade:)\s*_+/gi, `$1 ${selectedVehicle.seats || ""} lugares`)
      .replace(/(Data de Início:)\s*_+/gi, `$1 ${format(new Date(rentalStartDate), "dd/MM/yyyy", { locale: ptBR })}`)
      .replace(/(Data de Término:)\s*_+/gi, `$1 ${format(new Date(rentalEndDate), "dd/MM/yyyy", { locale: ptBR })}`)
      .replace(/(Data:)\s*_+/gi, `$1 ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`)
      .replace(/(Período:)\s*_+/gi, `$1 ${format(new Date(rentalStartDate), "dd/MM/yyyy", { locale: ptBR })} até ${format(new Date(rentalEndDate), "dd/MM/yyyy", { locale: ptBR })}`)
      .replace(/(Número de Diárias:)\s*_+/gi, `$1 ${days}`)
      .replace(/(Valor da Diária:)\s*_+/gi, `$1 R$ ${Number(selectedVehicle.pricePerDay).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
      .replace(/(Valor Total:)\s*_+/gi, `$1 R$ ${totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`)
      .replace(/(Avalista - Nome:)\s*_+/gi, `$1 ${guarantorData?.name || "Não informado"}`)
      .replace(/(Avalista - CPF:)\s*_+/gi, `$1 ${guarantorData?.cpf || "Não informado"}`)
      .replace(/(Avalista - Telefone:)\s*_+/gi, `$1 ${guarantorData?.phone || "Não informado"}`)
      .replace(/(Avalista - E-mail:)\s*_+/gi, `$1 ${guarantorData?.email || "Não informado"}`)
      .replace(/(Avalista - CNH:)\s*_+/gi, `$1 ${guarantorData?.driverLicense || "Não informado"}`);
    
    return filledTemplate;
  };
  
  const filledContract = rentalTemplate ? fillContractTemplate(rentalTemplate.content) : null;
  
  const downloadContractAsWord = async () => {
    if (!filledContract) return;
    
    try {
      const lines = filledContract.split('\n');
      const paragraphs = lines.map(line => {
        const isTitle = /^[0-9]+\./.test(line.trim()) || (line.trim().length > 0 && line.trim() === line.trim().toUpperCase());
        
        return new Paragraph({
          children: [
            new TextRun({
              text: line || " ",
              bold: isTitle,
              size: isTitle ? 24 : 22,
            })
          ],
          spacing: {
            after: 100,
          },
          alignment: isTitle ? AlignmentType.CENTER : AlignmentType.LEFT,
        });
      });
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });
      
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato_Locacao_${customerData?.name?.replace(/\s+/g, '_') || 'Cliente'}_${format(new Date(), 'dd-MM-yyyy')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar documento Word:", error);
      alert("Erro ao gerar documento Word. Tente novamente.");
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Etapa 4: Contrato de Locação</h3>
        <p className="text-sm text-muted-foreground">Revise o contrato preenchido e faça upload do documento assinado</p>
      </div>
      
      {filledContract ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-md">Contrato de Locação Preenchido</CardTitle>
              <CardDescription>
                Este contrato foi gerado automaticamente com base no template ativo
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadContractAsWord}
              data-testid="button-download-contract-word"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar em Word
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-6 rounded-lg border max-h-[500px] overflow-y-auto">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm">
                {filledContract}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Resumo do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-1">Locatário</p>
                <p className="text-muted-foreground">{customerData?.name || "—"}</p>
                <p className="text-muted-foreground">CPF: {customerData?.cpf || "—"}</p>
                <p className="text-muted-foreground">{customerData?.email || "—"}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Veículo</p>
                <p className="text-muted-foreground">{selectedVehicle?.name || "—"}</p>
                <p className="text-muted-foreground">{selectedVehicle?.brand} {selectedVehicle?.model}</p>
                <p className="text-muted-foreground">Ano: {selectedVehicle?.year || "—"}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Endereço</p>
                <p className="text-muted-foreground">
                  {customerData?.street}, {customerData?.neighborhood}
                </p>
                <p className="text-muted-foreground">
                  {customerData?.city} - {customerData?.state}
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Valor</p>
                <p className="text-lg font-bold text-primary">
                  R$ {selectedVehicle?.pricePerDay ? Number(selectedVehicle.pricePerDay).toFixed(2) : "—"}/dia
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Nenhum template de contrato ativo encontrado. Cadastre um template de contrato do tipo "Locação" na aba "Contratos" para gerar automaticamente o contrato preenchido.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    
      <FileUploadZone
        fileData={contractData}
        onFileChange={setContractData}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        label="Upload do Contrato Assinado *"
        description="Faça o upload do contrato assinado pelo cliente (PDF, imagem ou documento)"
        testId="contract-upload"
      />
    </div>
  );
}
