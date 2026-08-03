/**
 * Comprime a imagem mantendo uma proporção máxima de 1200x1600.
 */
export const comprimirImagem = (arquivo: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 1600;

    // 1. Tentar com Web Worker (OffscreenCanvas)
    if (typeof window !== 'undefined' && window.Worker && 'OffscreenCanvas' in window) {
      try {
        const worker = new Worker(new URL('./imageCompressorWorker.ts', import.meta.url), { type: 'module' });
        
        worker.onmessage = (e) => {
          if (e.data.error) {
            worker.terminate();
            fallbackComprimirImagem(arquivo, MAX_WIDTH, MAX_HEIGHT).then(resolve).catch(reject);
          } else if (e.data.blob) {
            worker.terminate();
            const novoArquivo = new File([e.data.blob], arquivo.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(novoArquivo);
          }
        };

        worker.onerror = () => {
          worker.terminate();
          fallbackComprimirImagem(arquivo, MAX_WIDTH, MAX_HEIGHT).then(resolve).catch(reject);
        };

        worker.postMessage({ file: arquivo, MAX_WIDTH, MAX_HEIGHT });
        return;
      } catch (err) {
        console.warn('Falha ao iniciar Web Worker, usando fallback:', err);
        fallbackComprimirImagem(arquivo, MAX_WIDTH, MAX_HEIGHT).then(resolve).catch(reject);
        return;
      }
    }

    // 2. Fallback (Main Thread)
    fallbackComprimirImagem(arquivo, MAX_WIDTH, MAX_HEIGHT).then(resolve).catch(reject);
  });
};

function fallbackComprimirImagem(arquivo: File, MAX_WIDTH: number, MAX_HEIGHT: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(arquivo);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Erro ao processar imagem no fallback"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const novoArquivo = new File([blob], arquivo.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(novoArquivo);
          } else {
            reject(new Error("Erro na compressão fallback"));
          }
        }, 'image/jpeg', 0.7);
      };

      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}


