import { useState } from 'react';
import { api } from '../services/api';
import { uploadToR2 } from '../services/uploadService';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

interface SubmitParams<T> {
  foto: File;
  apiEndpoint: string;
  apiMethod: 'POST' | 'PUT';
  jornadaId: string | null;
  dadosJornada: T;
}

export function usePhotoSubmit<T extends Record<string, unknown>>() {
  const [loading, setLoading] = useState(false);

  const submitPhoto = async ({
    foto,
    apiEndpoint,
    apiMethod,
    jornadaId,
    dadosJornada
  }: SubmitParams<T>) => {
    setLoading(true);

    try {
      const fileType = apiEndpoint.split('/')[1] || 'geral';
      const fileExt = foto.name.split('.').pop() || 'jpg';
      const fileName = `${fileType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const publicUrlString = await uploadToR2(foto, fileName, foto.type || 'image/jpeg', fileType);
      const fotoUrl = publicUrlString;

      const dadosCompletos: Record<string, unknown> = { ...dadosJornada };

      if (apiEndpoint.includes('abastecimentos')) {
        dadosCompletos.fotoNotaFiscalUrl = fotoUrl;
      } else if (apiEndpoint.includes('manutencoes')) {
        dadosCompletos.fotoComprovanteUrl = fotoUrl;
      } else if (apiMethod === 'POST') {
        dadosCompletos.fotoInicioUrl = fotoUrl;
      } else {
        dadosCompletos.fotoFimUrl = fotoUrl;
      }

      let response;
      if (apiMethod === 'POST') {
        response = await api.post(apiEndpoint, dadosCompletos);
      } else {
        const endpoint = apiEndpoint.replace(':jornadaId', jornadaId || '');
        response = await api.put(endpoint, dadosCompletos);
      }

      toast.success('Informações gravadas com sucesso!');
      return response?.data;
    } catch (error: unknown) {
      logger.debug('Erro ao confirmar foto:', error);
      if (!(error as Record<string, unknown>)?._toastHandled) {
        toast.error('Erro ao processar imagem ou salvar dados.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { submitPhoto, loading };
}
