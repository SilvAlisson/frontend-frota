import { api } from './api';

/**
 * Faz o upload ponta-a-ponta de um arquivo (Upload Direto do Client-side pro Cloudflare R2).
 * Protege seu servidor Backend de vazamentos de RAM carregando buffers pesados.
 */
export async function uploadToR2(file: File | Blob, originalName: string, contentType: string): Promise<string> {
  // 1. Pede permissão (Pre-signed URL) segura gerada pelo backend conectado com suas credenciais S3.
  const { data } = await api.post('/r2/presign', {
    fileName: originalName,
    contentType: contentType,
  });

  const { presignedUrl, publicUrl } = data;

  // 2. Tendo o link mágico do Cloudflare, joga a foto diretão lá via PUT.
  // IMPORTANTE: Foi usado fetch() nu e cru porque o `api` (Axios) possui interceptors
  // que injetam headers (ex: Authorization Bearer) os quais corromperiam a restrita Assinatura de PUT/S3.
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!response.ok) {
    throw new Error('Falha no upload para o Storage R2.');
  }

  // 3. Tudo deu certo. Retorna pra chamar o Supabase Database pra gravar só o link públicozinho.
  return publicUrl;
}
