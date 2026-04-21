import { api } from './api';

/**
 * Faz o upload direto do cliente para o Cloudflare R2 usando uma URL pré-assinada.
 * O parâmetro 'folder' define em qual pasta o arquivo será armazenado.
 */
export async function uploadToR2(
  file: File | Blob,
  originalName: string,
  contentType: string,
  folder: string = 'geral'
): Promise<string> {

  // 1. Solicita a URL assinada enviando a pasta de destino
  const { data } = await api.post('/r2/presign', {
    fileName: originalName,
    contentType: contentType,
    folder: folder,
  });

  const { presignedUrl, publicUrl } = data;

  // 2. Realiza o upload direto via PUT (usando fetch para evitar interceptores do Axios)
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao enviar arquivo para o storage.');
  }

  return publicUrl;
}