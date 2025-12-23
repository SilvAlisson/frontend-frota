import { useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { supabase } from '../supabaseClient';
import { Button } from './ui/Button';
import { toast } from 'sonner';

// Estilos específicos para file input
const fileInputContainer = "relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-all cursor-pointer group hover:border-primary flex flex-col items-center justify-center min-h-[200px]";
const fileInputLabel = "text-sm text-gray-500 font-medium mt-3 group-hover:text-primary transition-colors";
const hiddenInput = "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10";

interface ModalProps {
  titulo: string;
  kmParaConfirmar: number | null;
  jornadaId: string | null;
  dadosJornada: any;
  apiEndpoint: string;
  apiMethod: 'POST' | 'PUT';
  onClose: () => void;
  onSuccess: (data: any) => void;
}

// --- FUNÇÃO DE COMPRESSÃO (CORREÇÃO DE MEMÓRIA) ---
const comprimirImagem = (arquivo: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(arquivo);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Reduz para HD (suficiente e leve)
        const MAX_HEIGHT = 1600; 
        
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
            reject(new Error("Erro ao processar imagem"));
            return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converte para JPG com qualidade 70% (Economiza ~80% de RAM/Dados)
        canvas.toBlob((blob) => {
          if (blob) {
            const novoArquivo = new File([blob], arquivo.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(novoArquivo);
          } else {
            reject(new Error("Erro na compressão"));
          }
        }, 'image/jpeg', 0.7);
      };
      
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
  const [processandoFoto, setProcessandoFoto] = useState(false); // Novo estado

  // Manipulador de arquivo atualizado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const arquivoOriginal = e.target.files[0];
      
      try {
        setProcessandoFoto(true);
        // Comprime ANTES de salvar no estado
        const imagemComprimida = await comprimirImagem(arquivoOriginal);
        setFoto(imagemComprimida);
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        toast.error("Erro ao processar a foto. Tente novamente.");
        setFoto(null);
      } finally {
        setProcessandoFoto(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!foto) {
      toast.error('A foto do comprovante é obrigatória.');
      return;
    }

    setLoading(true);

    const fluxoCompleto = async () => {
      // 1. Upload Supabase
      const fileType = apiEndpoint.split('/')[1] || 'geral';
      const fileExt = 'jpg'; // Forçamos jpg
      const fileName = `${fileType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('fotos-frota')
        .upload(filePath, foto);

      if (uploadError) throw new Error('Falha no upload da imagem.');
      if (!uploadData) throw new Error('Erro desconhecido no upload.');

      // 2. Get Public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('fotos-frota')
        .getPublicUrl(uploadData.path);

      const fotoUrl = publicUrlData.publicUrl;

      // 3. Prepare Payload
      let dadosCompletos = { ...dadosJornada };

      if (apiEndpoint.includes('abastecimentos')) {
        dadosCompletos.fotoNotaFiscalUrl = fotoUrl;
      } else if (apiEndpoint.includes('ordens-servico')) {
        dadosCompletos.fotoComprovanteUrl = fotoUrl;
      } else if (apiMethod === 'POST') { // Iniciar Jornada
        dadosCompletos.fotoInicioUrl = fotoUrl;
      } else { // Finalizar Jornada
        dadosCompletos.fotoFimUrl = fotoUrl;
      }

      // 4. Send to Backend
      let response;
      if (apiMethod === 'POST') {
        response = await api.post(apiEndpoint, dadosCompletos);
      } else {
        const endpoint = apiEndpoint.replace(':jornadaId', jornadaId || '');
        response = await api.put(endpoint, dadosCompletos);
      }

      return response.data;
    };

    toast.promise(fluxoCompleto(), {
      loading: 'Enviando comprovante e registrando...',
      success: (data) => {
        onSuccess(data); // Fecha modal via callback
        return 'Registro confirmado com sucesso!';
      },
      error: (err) => {
        setLoading(false);
        console.error(err);
        if (axios.isAxiosError(err) && err.response?.data?.error) {
          return err.response.data.error;
        }
        return 'Ocorreu um erro no processo. Tente novamente.';
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={!loading ? onClose : undefined}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* KM Confirmation Banner */}
          {kmParaConfirmar !== null && (
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-center shadow-sm">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
                Leitura do Painel
              </p>
              <p className="text-4xl font-bold text-primary tracking-tight font-mono">
                {kmParaConfirmar.toLocaleString('pt-BR')} <span className="text-lg text-blue-400 font-medium">km</span>
              </p>
            </div>
          )}

          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Foto do Comprovante <span className="text-red-500">*</span>
            </label>

            <div className={`${fileInputContainer} ${foto ? 'border-primary bg-primary/5' : ''}`}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className={hiddenInput}
                onChange={handleFileChange} 
                disabled={loading || processandoFoto}
              />

              {processandoFoto ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                  <p className="text-sm text-primary font-medium">Processando imagem...</p>
                </div>
              ) : foto ? (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 mx-auto bg-primary text-white rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-primary truncate max-w-[250px]">{foto.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Toque para alterar</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-gray-100 rounded-full mb-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </div>
                  <p className={fileInputLabel}>
                    Toque aqui para tirar foto
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 h-12"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-[2] h-12 shadow-lg shadow-primary/20"
              onClick={handleSubmit}
              disabled={loading || !foto || processandoFoto}
              isLoading={loading}
            >
              {loading ? 'Enviando...' : 'Confirmar Envio'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}