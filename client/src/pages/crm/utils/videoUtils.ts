export const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const uploadVideoChunked = async (
    financingId: string,
    videoBlob: Blob,
    onProgress: (msg: string) => void
): Promise<string> => {
    const chunkSize = 1 * 1024 * 1024; // 1MB por chunk (menor para maior estabilidade)
    const totalChunks = Math.ceil(videoBlob.size / chunkSize);
    const uploadId = Date.now().toString() + Math.random().toString(36).substring(7);
    const fileName = 'video_confissao.webm';

    console.log(`[CHUNK UPLOAD] Iniciando em ${totalChunks} partes de 1MB`);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, videoBlob.size);
        const chunk = videoBlob.slice(start, end, videoBlob.type);

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('fileName', fileName);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('chunk', chunk, 'chunk.bin');

        const percent = Math.round(((i + 1) / totalChunks) * 90);
        onProgress(`Enviando: ${percent}%`);

        const response = await fetch(`/api/financings/${financingId}/confession-video-chunk`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Falha ao enviar parte ${i + 1} do vídeo`);
        }
    }

    onProgress("Finalizando...");

    const completeResponse = await fetch(`/api/financings/${financingId}/confession-video-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, totalChunks, fileName }),
    });

    if (!completeResponse.ok) {
        throw new Error('Falha ao finalizar upload do vídeo');
    }

    const data = await completeResponse.json();
    onProgress("Vídeo enviado!");
    return data.videoUrl;
};

export const uploadVideoFile = async (
    financingId: string,
    videoBlob: Blob | File,
    onProgress: (msg: string) => void
): Promise<string> => {
    if (isMobileDevice() || videoBlob.size > 30 * 1024 * 1024) {
        return uploadVideoChunked(financingId, videoBlob, onProgress);
    }

    const formData = new FormData();
    const fileName = videoBlob instanceof File ? videoBlob.name : 'video.webm';
    formData.append('video', videoBlob, fileName);

    onProgress("Preparando envio...");
    const xhr = new XMLHttpRequest();
    xhr.timeout = 600000;

    return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(`Enviando: ${percent}%`);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.videoUrl);
                } catch (parseError) {
                    reject(new Error('Erro ao processar resposta do servidor'));
                }
            } else {
                reject(new Error(`Falha ao enviar vídeo (código ${xhr.status})`));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Erro de conexão.')));
        xhr.addEventListener('timeout', () => reject(new Error('Tempo esgotado.')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelado.')));

        xhr.open('POST', `/api/financings/${financingId}/confession-video`);
        xhr.send(formData);
    });
};
