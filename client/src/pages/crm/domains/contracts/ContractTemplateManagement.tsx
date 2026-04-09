import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCrmData } from "@/pages/crm/context/CrmDataProvider";

export default function ContractTemplateManagement() {
  const { toast } = useToast();
  const { templates, isLoading, invalidate } = useCrmData();
  
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateFormData, setTemplateFormData] = useState<any>({});

  // Mutations para Templates de Contratos
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contract-templates", data);
    },
    onSuccess: () => {
      invalidate.templates();
      toast({
        title: "Template criado!",
        description: "Template de contrato criado com sucesso.",
      });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      setTemplateFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar template",
        description: error.message || "Ocorreu um erro ao criar o template.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/contract-templates/${id}`, data);
    },
    onSuccess: () => {
      invalidate.templates();
      toast({
        title: "Template atualizado!",
        description: "Template de contrato atualizado com sucesso.",
      });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      setTemplateFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message || "Ocorreu um erro ao atualizar o template.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contract-templates/${id}`, {});
    },
    onSuccess: () => {
      invalidate.templates();
      toast({
        title: "Template removido!",
        description: "Template de contrato removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover template",
        description: error.message || "Ocorreu um erro ao remover o template.",
        variant: "destructive",
      });
    },
  });

  const exampleTemplates = [
    {
      name: "Contrato de Locação de Veículo",
      type: "rental",
      isActive: true,
      content: `CONTRATO DE LOCAÇÃO DE VEÍCULO

1. IDENTIFICAÇÃO DAS PARTES

LOCADOR (Proprietário do Veículo):
Nome/Razão Social: __________________________________________
CPF/CNPJ: __________________________________________
Endereço: __________________________________________
Cidade/UF: __________________________________________
Telefone: __________________________________________

LOCATÁRIO (Cliente):
Nome/Razão Social: __________________________________________
CPF/CNPJ: __________________________________________
Endereço: __________________________________________
Cidade/UF: __________________________________________
Telefone: __________________________________________
E-mail: __________________________________________
CNH: __________________________________________
Contato de Emergência: __________________________________________

2. OBJETO DO CONTRATO

Veículo Locado:
Marca/Modelo: __________________________________________
Ano: __________________________________________
Placa: __________________________________________
Cor: __________________________________________
Categoria: __________________________________________
Combustível: __________________________________________

3. PRAZO E VALORES

Período de Locação:
Data de Início: __________________________________________
Data de Término: __________________________________________
Número de Diárias: __________________________________________

Valores:
Valor da Diária: __________________________________________
Valor Total: __________________________________________

4. CONDIÇÕES GERAIS

4.1. O LOCATÁRIO receberá o veículo em perfeitas condições de uso e funcionamento.
4.2. O LOCATÁRIO compromete-se a devolver o veículo nas mesmas condições em que o recebeu.
4.3. O LOCATÁRIO é responsável por todas as multas de trânsito durante o período de locação.
4.4. O seguro do veículo cobre apenas danos materiais, sendo o LOCATÁRIO responsável por franquia em caso de sinistro.

5. DEVOLUÇÃO DO VEÍCULO

5.1. O veículo deverá ser devolvido com o mesmo nível de combustível de quando foi retirado.
5.2. Caso haja atraso na devolução, será cobrado valor adicional proporcional ao tempo excedido.

6. ASSINATURAS

______________________, _____ de _____________ de _____

________________________________          ________________________________
        LOCADOR                                LOCATÁRIO`
    },
    {
      name: "Contrato de Investimento em Veículo",
      type: "investment",
      isActive: true,
      content: `CONTRATO DE PARCERIA DE INVESTIMENTO EM VEÍCULO

1. IDENTIFICAÇÃO DAS PARTES

LOCADORA (Empresa):
Nome/Razão Social: __________________________________________
CPF/CNPJ: __________________________________________
Endereço: __________________________________________
Telefone: __________________________________________

INVESTIDOR (Proprietário do Veículo):
Nome/Razão Social: __________________________________________
CPF/CNPJ: __________________________________________
Endereço: __________________________________________
Cidade/UF: __________________________________________
Telefone: __________________________________________
E-mail: __________________________________________

2. OBJETO DO CONTRATO

Veículo em Investimento:
Marca/Modelo: __________________________________________
Ano: __________________________________________
Placa: __________________________________________
Cor: __________________________________________
Valor FIPE: __________________________________________

3. CONDIÇÕES FINANCEIRAS

Dividendos Mensais: __________________________________________
Data de Pagamento: __________________________________________
Valor da Diária: __________________________________________

4. OBRIGAÇÕES DAS PARTES

4.1. DO INVESTIDOR:
- Fornecer o veículo em perfeitas condições de uso
- Manter a documentação do veículo regularizada
- Autorizar a locação do veículo através da LOCADORA

4.2. DA LOCADORA:
- Realizar manutenções preventivas e corretivas
- Pagar os dividendos mensais ao INVESTIDOR
- Contratar seguro para o veículo
- Gerenciar as locações do veículo

5. PRAZO E RESCISÃO

5.1. Este contrato tem prazo indeterminado.
5.2. Qualquer das partes pode rescindir o contrato com aviso prévio de 30 dias.
5.3. Em caso de perda total do veículo, o contrato será automaticamente rescindido.

6. ASSINATURAS

______________________, _____ de _____________ de _____

________________________________          ________________________________
        LOCADORA                              INVESTIDOR`
    },
    {
      name: "Contrato de Financiamento de Veículo",
      type: "financing",
      isActive: true,
      content: `CONTRATO DE FINANCIAMENTO DE VEÍCULO

1. IDENTIFICAÇÃO DAS PARTES

FINANCIADORA:
Nome/Razão Social: __________________________________________
CPF/CNPJ: __________________________________________
Endereço: __________________________________________
Telefone: __________________________________________

FINANCIADO (Cliente):
Nome/Razão Social: __________________________________________
CPF/CNPJ: __________________________________________
Endereço: __________________________________________
Cidade/UF: __________________________________________
Telefone: __________________________________________
E-mail: __________________________________________
CNH: __________________________________________

2. OBJETO DO FINANCIAMENTO

Veículo Financiado:
Marca/Modelo: __________________________________________
Ano: __________________________________________
Placa: __________________________________________
Cor: __________________________________________
Valor do Veículo: __________________________________________

3. CONDIÇÕES FINANCEIRAS

Valor Total do Veículo: __________________________________________
Valor da Entrada (20%): __________________________________________
Valor Financiado: __________________________________________
Taxa de Juros Mensal: __________________________________________
Número de Parcelas: 48
Valor da Parcela: __________________________________________
Data de Vencimento: Todo dia __________________________________________

4. FORMA DE PAGAMENTO DA ENTRADA

Entrada À Vista (70%): __________________________________________
Entrada Parcelada (30%): __________________________________________
Número de Parcelas da Entrada: __________________________________________
Valor de Cada Parcela da Entrada: __________________________________________

5. VEÍCULO DE TROCA (se aplicável)

Veículo Dado como Entrada:
Marca/Modelo: __________________________________________
Ano: __________________________________________
Placa: __________________________________________
Valor Aceito: __________________________________________

6. CONDIÇÕES GERAIS

6.1. O veículo ficará alienado em favor da FINANCIADORA até quitação total.
6.2. O FINANCIADO compromete-se a manter o seguro do veículo durante todo o período do financiamento.
6.3. Em caso de atraso no pagamento, serão cobrados juros de mora de 1% ao mês.
6.4. O FINANCIADO poderá antecipar parcelas com desconto de 0,15% por dia de antecipação.

7. DESCONTO POR ANTECIPAÇÃO

7.1. Cada parcela antecipada terá desconto de 0,15% por dia de antecipação.
7.2. O desconto máximo por parcela é de 70% do valor.
7.3. Quanto mais cedo pagar, maior o desconto acumulado.

8. ASSINATURAS

______________________, _____ de _____________ de _____

________________________________          ________________________________
      FINANCIADORA                           FINANCIADO`
    }
  ];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Templates de Contratos</CardTitle>
            <CardDescription>
              Crie e gerencie templates de contratos para locação, financiamento e investimento
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(!templates || templates.length === 0) && (
              <Button
                variant="outline"
                onClick={async () => {
                  // Criar templates
                  for (const template of exampleTemplates) {
                    try {
                      await createTemplateMutation.mutateAsync(template);
                    } catch (error) {
                      console.error("Erro ao criar template:", error);
                    }
                  }

                  toast({
                    title: "Templates criados!",
                    description: "3 templates de exemplo foram criados com sucesso.",
                  });
                }}
                data-testid="button-create-example-templates"
              >
                <FileText className="h-4 w-4 mr-2" />
                Criar Templates de Exemplo
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateFormData({});
                setTemplateDialogOpen(true);
              }}
              data-testid="button-add-template"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading.templates ? (
            <p className="text-center text-muted-foreground py-8">Carregando templates...</p>
          ) : templates && templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((template: any) => (
                <Card key={template.id} className="hover-elevate" data-testid={`card-template-${template.id}`}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="outline" className="mt-2">
                            {template.type === "rental" ? "Locação" : template.type === "financing" ? "Financiamento" : "Investimento"}
                          </Badge>
                          {template.isActive && (
                            <Badge variant="default" className="ml-2">Ativo</Badge>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateFormData(template);
                            setTemplateDialogOpen(true);
                          }}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover o template "${template.name}"?`)) {
                              deleteTemplateMutation.mutate(template.id);
                            }
                          }}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Prévia do Conteúdo:</p>
                      <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{template.content.substring(0, 200)}...</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Criado em: {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                        {template.updatedAt && ` | Atualizado em: ${new Date(template.updatedAt).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum template cadastrado ainda.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Crie templates de contratos com campos vazios que serão preenchidos automaticamente com os dados do cliente.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={async () => {
                    // Criar templates
                    for (const template of exampleTemplates) {
                      try {
                        await createTemplateMutation.mutateAsync(template);
                      } catch (error) {
                        console.error("Erro ao criar template:", error);
                      }
                    }

                    toast({
                      title: "Templates criados!",
                      description: "3 templates de exemplo foram criados com sucesso.",
                    });
                  }}
                  data-testid="button-create-example-templates-empty"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Criar Templates de Exemplo
                </Button>
                <Button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateFormData({});
                    setTemplateDialogOpen(true);
                  }}
                  data-testid="button-add-template-empty"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Adicionar/Editar Template de Contrato */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Editar Template" : "Novo Template de Contrato"}
            </DialogTitle>
            <DialogDescription>
              Crie templates de contratos para locação, financiamento e investimento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Template *</label>
              <Input
                placeholder="Ex: Contrato de Locação Padrão"
                value={templateFormData.name || ""}
                onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                data-testid="input-template-name"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select 
                value={templateFormData.type || ""} 
                onValueChange={(value) => setTemplateFormData({...templateFormData, type: value})}
              >
                <SelectTrigger data-testid="select-template-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rental">Locação</SelectItem>
                  <SelectItem value="financing">Financiamento</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo do Contrato *</label>
              <p className="text-xs text-muted-foreground">
                Use variáveis como {`{{customerName}}`}, {`{{vehicleName}}`}, {`{{totalPrice}}`}, etc.
              </p>
              <textarea
                className="w-full min-h-[300px] p-3 border rounded-md text-sm font-mono"
                placeholder="Digite o conteúdo do contrato aqui..."
                value={templateFormData.content || ""}
                onChange={(e) => setTemplateFormData({...templateFormData, content: e.target.value})}
                data-testid="textarea-template-content"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={templateFormData.isActive !== false}
                onChange={(e) => setTemplateFormData({...templateFormData, isActive: e.target.checked})}
                className="rounded"
                data-testid="checkbox-template-active"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Template ativo (disponível para uso)
              </label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTemplateDialogOpen(false);
                setEditingTemplate(null);
                setTemplateFormData({});
              }}
              data-testid="button-cancel-template"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!templateFormData.name || !templateFormData.type || !templateFormData.content) {
                  toast({
                    title: "Dados incompletos",
                    description: "Preencha todos os campos obrigatórios.",
                    variant: "destructive",
                  });
                  return;
                }

                if (editingTemplate) {
                  updateTemplateMutation.mutate({
                    id: editingTemplate.id,
                    data: templateFormData,
                  });
                } else {
                  createTemplateMutation.mutate(templateFormData);
                }
              }}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              data-testid="button-save-template"
            >
              {createTemplateMutation.isPending || updateTemplateMutation.isPending ? "Salvando..." : editingTemplate ? "Atualizar" : "Criar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
