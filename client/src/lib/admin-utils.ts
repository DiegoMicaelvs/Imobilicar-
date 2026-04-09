import { AdminUser } from "@shared/schema";

/**
 * Gets the localized label for a status string.
 */
export const getStatusLabel = (status: string) => {
    switch (status) {
        case "pending":
            return "Pendente";
        case "completed":
            return "Com Sucesso";
        case "cancelled":
            return "Sem Sucesso";
        case "active":
            return "Ativo";
        default:
            return status;
    }
};

/**
 * Helper function to download base64 documents with automatic type detection
 */
export const downloadDocument = async (url: string, fileName: string) => {
    try {
        if (url.startsWith('data:')) {
            const base64Match = url.match(/data:[^;]+;base64,(.+)/);
            if (!base64Match) {
                throw new Error('URL de dados inválida');
            }

            const base64Data = base64Match[1];
            const firstBytes = base64Data.substring(0, 20);

            let realMimeType = 'application/octet-stream';
            let correctExtension = '';

            if (firstBytes.startsWith('/9j/')) {
                realMimeType = 'image/jpeg';
                correctExtension = '.jpg';
            } else if (firstBytes.startsWith('iVBORw0KGgo')) {
                realMimeType = 'image/png';
                correctExtension = '.png';
            } else if (firstBytes.startsWith('JVBERi0')) {
                realMimeType = 'application/pdf';
                correctExtension = '.pdf';
            } else if (firstBytes.startsWith('R0lGOD')) {
                realMimeType = 'image/gif';
                correctExtension = '.gif';
            } else if (firstBytes.startsWith('UEsDB')) {
                if (fileName.toLowerCase().endsWith('.xlsx')) {
                    realMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    correctExtension = '.xlsx';
                } else {
                    realMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    correctExtension = '.docx';
                }
            }

            let finalFileName = fileName;
            if (correctExtension) {
                const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
                if (!fileName.toLowerCase().endsWith(correctExtension)) {
                    finalFileName = nameWithoutExt + correctExtension;
                }
            }

            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: realMimeType });

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = finalFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('Erro ao baixar documento:', error);
        window.open(url, '_blank');
    }
};
