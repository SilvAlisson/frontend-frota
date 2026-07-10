import { api } from './api';

/**
 * Faz o upload direto do cliente para o Cloudflare R2 usando uma URL pré-assinada.
 * O parâmetro 'folder' define em qual pasta o arquivo será armazenado.
 */
export async function uploadToR2(
  file: File | Blob,
  originalName?: string,
  contentType?: string,
  folder: string = 'geral'
): Promise<string> {
  
  // 1. Tratamento inteligente de parâmetros (Caso envie apenas o file e a pasta)
  let finalName = originalName;
  let finalType = contentType;
  let finalFolder = folder;

  if (file instanceof File) {
    // Se o originalName for igual ao nome de uma pasta (ex: 'asos'), fazemos a correção automática
    if (!finalName || finalName === 'asos' || finalName === 'certificados') {
      finalFolder = finalName && finalName !== file.name ? finalName : folder;
      finalName = file.name;
    }
    if (!finalType) {
      finalType = file.type;
    }
  }

  // Fallbacks de segurança
  finalName = finalName || `arquivo-${Date.now()}.pdf`;
  finalType = finalType || 'application/pdf';

  // 2. BLINDAGEM: Sanitização do nome do ficheiro para passar no Regex do Backend
  // Remove espaços, parênteses, acentos e deixa apenas letras, números, pontos e traços
  const sanitizedName = finalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

  // 3. Chamada à API para obter a URL pré-assinada
  const response = await api.post('/r2/presign', {
    fileName: sanitizedName,
    contentType: finalType,
    folder: finalFolder,
  });

  const { presignedUrl, publicUrl } = response.data;

  // 4. Upload Binário para o Cloudflare R2
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': finalType,
    },
  });

  return publicUrl;
}