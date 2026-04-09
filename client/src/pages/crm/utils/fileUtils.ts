/**
 * File handling utilities for image compression and file processing
 */

/**
 * Compresses an image file while maintaining visual quality
 * Uses intelligent multi-stage compression to achieve target file size
 * 
 * @param file - The image file to compress
 * @returns Promise resolving to base64 encoded string
 * @throws Error if file is too large (>50MB) or processing fails
 */
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      reject(new Error('Arquivo muito grande. Tamanho máximo: 50MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const resizeWithQuality = (maxDim: number, qual: number): string => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height / width) * maxDim);
              width = maxDim;
            } else {
              width = Math.round((width / height) * maxDim);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Não foi possível processar a imagem');
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.filter = 'contrast(1.02) brightness(1.01)';
          ctx.drawImage(img, 0, 0, width, height);
          
          return canvas.toDataURL('image/jpeg', qual);
        };

        const maxTargetSize = 1.5 * 1024 * 1024; // 1.5MB in base64 (~1.1MB real)
        
        let result = resizeWithQuality(1600, 0.85);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        result = resizeWithQuality(1280, 0.80);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        result = resizeWithQuality(1024, 0.75);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        result = resizeWithQuality(800, 0.70);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        result = resizeWithQuality(640, 0.65);
        if (result.length <= maxTargetSize) {
          resolve(result);
          return;
        }
        
        result = resizeWithQuality(480, 0.60);
        resolve(result);
      };
      img.onerror = () => reject(new Error('Erro ao carregar a imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a file to base64 encoded string
 * 
 * @param file - The file to convert
 * @returns Promise resolving to base64 encoded string
 */
export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Processes file uploads - compresses images and converts other files to base64
 * 
 * @param file - The file to process
 * @returns Promise resolving to base64 encoded string
 */
export const processFileUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      compressImage(file).then(resolve).catch(reject);
    } else {
      convertToBase64(file).then(resolve).catch(reject);
    }
  });
};
