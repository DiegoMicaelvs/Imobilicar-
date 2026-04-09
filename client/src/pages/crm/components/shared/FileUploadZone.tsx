import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { processFileUpload } from "../../utils/fileUtils";
import { useToast } from "@/hooks/use-toast";

interface FileUploadZoneProps {
  fileData: { fileName: string; fileUrl: string } | null;
  onFileChange: (fileData: { fileName: string; fileUrl: string } | null) => void;
  accept?: string;
  label?: string;
  description?: string;
  testId?: string;
}

export default function FileUploadZone({
  fileData,
  onFileChange,
  accept = ".pdf,.png,.jpg,.jpeg,.doc,.docx",
  label = "Upload do Documento",
  description = "PDF, PNG, JPG ou DOCX",
  testId = "file-upload"
}: FileUploadZoneProps) {
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      const base64 = await processFileUpload(file);
      onFileChange({
        fileName: file.name,
        fileUrl: base64
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  if (fileData?.fileUrl) {
    return (
      <div className="space-y-3">
        {label && <label className="text-sm font-medium">{label}</label>}
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
          <FileText className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <p className="font-medium text-sm">Arquivo anexado</p>
            <p className="text-xs text-muted-foreground">{fileData.fileName}</p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onFileChange(null)}
            data-testid={`button-remove-${testId}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium">{label}</label>}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <label className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer bg-muted/50 transition-colors">
        <FileText className="h-12 w-12 text-muted-foreground mb-3" />
        <span className="text-sm font-medium mb-1">Clique para fazer upload</span>
        <span className="text-xs text-muted-foreground">{description}</span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await handleFileUpload(file);
            }
          }}
          data-testid={`input-${testId}`}
        />
      </label>
    </div>
  );
}
