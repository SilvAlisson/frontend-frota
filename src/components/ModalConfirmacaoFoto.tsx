import { useState } from 'react';
import axios from 'axios';
import { api } from '../services/api'; // Use global api for backend requests
import { supabase } from '../supabaseClient';
import { Button } from './ui/Button';

// Estilos específicos para file input
const fileInputContainer = "relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer hover:border-primary";
const fileInputLabel = "text-sm text-gray-600 font-medium";
const hiddenInput = "absolute inset-0 w-full h-full opacity-0 cursor-pointer";

interface ModalProps {
  token: string; // Mantido por compatibilidade de props, mas usamos api.ts internamente
  titulo: string;
  kmParaConfirmar: number | null;
  jornadaId: string | null;
  dadosJornada: any;
  apiEndpoint: string;
  apiMethod: 'POST' | 'PUT';
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export function ModalConfirmacaoFoto({
  titulo,
  kmParaConfirmar,
  jornadaId,
  dadosJornada,
  apiEndpoint,
  apiMethod,
  onClose,
  onSuccess
}: ModalProps) {

  const [foto, setFoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(''); // Feedback de progresso

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setUploadProgress('A preparar envio...');

    if (!foto) {
      setError('A foto é obrigatória para auditoria.');
      setLoading(false);
      return;
    }

    try {
      // 1. Upload Supabase
      setUploadProgress('A enviar foto para a nuvem...');

      const fileType = apiEndpoint.split('/')[1] || 'geral';
      const fileExt = foto.name.split('.').pop();
      // Nome único para evitar colisão
      const fileName = `${fileType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('fotos-frota')
        .upload(filePath, foto);

      if (uploadError) {
        console.error('Supabase Upload Error:', uploadError);
        throw new Error('Falha no upload da imagem. Verifique sua conexão.');
      }
      if (!uploadData) {
        throw new Error('Erro desconhecido no upload da imagem.');
      }

      // 2. Get Public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('fotos-frota')
        .getPublicUrl(uploadData.path);

      const fotoUrl = publicUrlData.publicUrl;

      // 3. Prepare Payload
      let dadosCompletos = { ...dadosJornada };

      if (apiEndpoint.includes('abastecimento')) {
        dadosCompletos.fotoNotaFiscalUrl = fotoUrl;
      } else if (apiEndpoint.includes('ordem-servico')) {
        dadosCompletos.fotoComprovanteUrl = fotoUrl;
      } else if (apiMethod === 'POST') { // Iniciar Jornada
        dadosCompletos.fotoInicioUrl = fotoUrl;
      } else { // Finalizar Jornada
        dadosCompletos.fotoFimUrl = fotoUrl;
      }

      // 4. Send to Backend
      setUploadProgress('A registar dados no sistema...');

      let response;
      if (apiMethod === 'POST') {
        response = await api.post(apiEndpoint, dadosCompletos);
      } else {
        const endpoint = apiEndpoint.replace(':jornadaId', jornadaId || '');
        response = await api.put(endpoint, dadosCompletos);
      }

      setUploadProgress('Sucesso!');
      onSuccess(response.data); // Fecha modal via callback do pai

    } catch (err: any) {
      console.error("Erro no processo:", err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-primary">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* KM Confirmation Banner */}
          {kmParaConfirmar !== null && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center shadow-inner">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">
                Valor Registado
              </p>
              <p className="text-4xl font-bold text-primary tracking-tight">
                {kmParaConfirmar.toLocaleString('pt-BR')} <span className="text-lg text-gray-500 font-medium">KM</span>
              </p>
            </div>
          )}

          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Comprovativo / Foto <span className="text-error">*</span>
            </label>

            <div className={fileInputContainer}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className={hiddenInput}
                onChange={(e) => setFoto(e.target.files ? e.target.files[0] : null)}
                disabled={loading}
              />
              <div className="space-y-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                <p className={fileInputLabel}>
                  {foto ? (
                    <span className="text-primary font-bold">{foto.name}</span>
                  ) : (
                    "Toque para tirar foto ou selecionar arquivo"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {loading && (
            <div className="text-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-primary font-medium animate-pulse">{uploadProgress}</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-error text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !foto}
              isLoading={loading}
            >
              {loading ? 'Processando...' : 'Confirmar Envio'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}