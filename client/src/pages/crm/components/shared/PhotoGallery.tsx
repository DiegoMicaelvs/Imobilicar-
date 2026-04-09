import { useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  url: string;
  label?: string;
  type?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  className?: string;
}

export default function PhotoGallery({ photos, className = "" }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-video rounded-lg overflow-hidden border-2 border-muted hover:border-primary cursor-pointer transition-colors"
            onClick={() => openLightbox(index)}
            data-testid={`photo-thumbnail-${index}`}
          >
            <img
              src={photo.url}
              alt={photo.label || photo.type || `Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {(photo.label || photo.type) && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                {photo.label || photo.type}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={selectedPhotoIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-5xl p-0 bg-black/95">
          <div className="relative">
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                data-testid="button-close-lightbox"
              >
                <X className="h-6 w-6" />
              </Button>
            </DialogClose>

            {selectedPhotoIndex !== null && (
              <>
                <div className="flex items-center justify-center min-h-[70vh] p-8">
                  <img
                    src={photos[selectedPhotoIndex].url}
                    alt={photos[selectedPhotoIndex].label || `Foto ${selectedPhotoIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                </div>

                {photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={goToPrevious}
                      data-testid="button-previous-photo"
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={goToNext}
                      data-testid="button-next-photo"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/70 px-4 py-2 rounded-full">
                  {selectedPhotoIndex + 1} / {photos.length}
                  {photos[selectedPhotoIndex].label && (
                    <span className="ml-2">- {photos[selectedPhotoIndex].label}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
