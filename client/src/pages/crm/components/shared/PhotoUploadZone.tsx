import { Button } from "@/components/ui/button";
import { Camera, Trash2 } from "lucide-react";
import { compressImage } from "../../utils/fileUtils";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadZoneProps {
  photoUrl: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
  label: string;
  photoKey: string;
}

export default function PhotoUploadZone({
  photoUrl,
  onPhotoChange,
  label,
  photoKey
}: PhotoUploadZoneProps) {
  const { toast } = useToast();

  const handlePhotoUpload = async (file: File) => {
    try {
      const compressedImage = await compressImage(file);
      onPhotoChange(compressedImage);
    } catch (error) {
      toast({
        title: "Erro ao processar foto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const inputId = `photo-input-${photoKey}`;

  if (photoUrl) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label} *</label>
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-primary">
          <img 
            src={photoUrl} 
            alt={label}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              const input = document.getElementById(inputId) as HTMLInputElement;
              if (input) input.click();
            }}
            data-testid={`button-change-photo-${photoKey}`}
          >
            <Camera className="h-4 w-4 mr-2" />
            Trocar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onPhotoChange(null)}
            data-testid={`button-remove-photo-${photoKey}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </Button>
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await handlePhotoUpload(file);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label} *</label>
      <div className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
        <Camera className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground mb-3">Nenhuma foto anexada</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => {
          const input = document.getElementById(inputId) as HTMLInputElement;
          if (input) input.click();
        }}
        data-testid={`button-upload-photo-${photoKey}`}
      >
        <Camera className="h-4 w-4 mr-2" />
        Adicionar Foto
      </Button>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            await handlePhotoUpload(file);
          }
        }}
      />
    </div>
  );
}
