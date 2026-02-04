import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { supabase } from '../supabaseClient';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { X, Camera, Loader2, Check, AlertCircle } from 'lucide-react';

// Estilos padronizados
const fileInputContainer = "relative border-2 border-dashed border-border rounded-2xl p-4 hover:bg-surface-hover transition-all cursor-pointer group hover:border-primary flex flex-col items-center justify-center min-h-[250px] overflow-hidden bg-surface";
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

// --- FUNÇÃO DE COMPRESSÃO (Nativa via Canvas) ---
// Reduz drasticamente o tamanho da imagem antes do upload para economizar dados e storage
const comprimirImagem = (arquivo: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(arquivo);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // HD (Otimizado para Mobile e 4G)
        const MAX_HEIGHT = 1600;

        let width = img.width;
        let height = img.height;

        // Mantém a proporção
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

        // Converte para JPG com qualidade 70%
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);

  // Define a mensagem de ajuda baseada no contexto do Endpoint
  const textoAjuda = useMemo(() => {
    if (apiEndpoint.includes('abastecimentos')) {
      return "Foto nítida da Nota Fiscal ou da Bomba de Combustível.";
    }
    if (apiEndpoint.includes('ordens-servico') || apiEndpoint.includes('manutencoes')) {
      return "Foto da Ordem de Serviço (OS), Nota Fiscal ou Peça.";
    }
    // Padrão (Jornadas)
    return "Certifique-se que o KM e o painel estejam visíveis.";
  }, [apiEndpoint]);

  // Limpa a URL de preview da memória quando o componente desmonta
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const arquivoOriginal = e.target.files[0];

      try {
        setProcessandoFoto(true);
        // 1. Comprime
        const imagemComprimida = await comprimirImagem(arquivoOriginal);

        // 2. Cria Preview
        const url = URL.createObjectURL(imagemComprimida);
        setPreviewUrl(url);
        setFoto(imagemComprimida);

      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        toast.error("Erro ao processar a foto. Tente novamente.");
        setFoto(null);
        setPreviewUrl(null);
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
      // Forçamos extensão .jpg pois a compressão converte para jpeg
      const fileName = `${fileType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
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

      // 3. Prepare Payload (Lógica inteligente de mapeamento de campos)
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
        // Se a URL já vier com ID (ex: /finalizar/123), usamos ela direto
        // Se vier com :jornadaId, substituímos
        const endpoint = apiEndpoint.replace(':jornadaId', jornadaId || '');
        response = await api.put(endpoint, dadosCompletos);
      }

      return response.data;
    };

    toast.promise(fluxoCompleto(), {
      loading: 'Enviando comprovante e registrando...',
      success: (data) => {
        onSuccess(data);
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={!loading ? onClose : undefined}
    >
      <div
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-background px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-text-main">{titulo}</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-text-main p-2 rounded-full hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Banner de KM (Aparece apenas se tiver KM para confirmar) */}
          {kmParaConfirmar !== null && (
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-center shadow-sm">
              <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">
                Leitura do Painel
              </p>
              <p className="text-3xl font-bold text-primary tracking-tight font-mono">
                {kmParaConfirmar.toLocaleString('pt-BR')} <span className="text-base text-primary/60 font-medium">km</span>
              </p>
            </div>
          )}

          {/* Área de Upload / Preview */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-text-main mb-1 flex items-center justify-between">
              <span>Foto do Comprovante <span className="text-error">*</span></span>
              {previewUrl && !loading && (
                <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Trocar foto</span>
              )}
            </label>

            <div className={`${fileInputContainer} ${previewUrl ? 'border-primary border-solid p-0 bg-black/5' : ''}`}>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className={hiddenInput}
                onChange={handleFileChange}
                disabled={loading || processandoFoto}
              />

              {processandoFoto ? (
                // Estado de Carregamento/Compressão
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                  <p className="text-sm text-primary font-medium">Otimizando imagem...</p>
                </div>
              ) : previewUrl ? (
                // Estado de Preview (Sucesso)
                <div className="relative w-full h-full min-h-[250px] group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full absolute inset-0 object-contain p-2"
                  />
                  {/* Overlay ao passar o mouse ou clicar */}
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Camera className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-medium text-sm">Toque para alterar</p>
                  </div>
                  {/* Badge de Confirmado */}
                  <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                // Estado Inicial (Vazio)
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-primary/20">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-text-main">
                    Toque para tirar foto
                  </p>
                  <p className="text-xs text-text-secondary mt-2 max-w-[220px] mx-auto flex items-center justify-center gap-1 bg-surface-hover py-1 px-2 rounded-md">
                    <AlertCircle className="w-3 h-3" />
                    {textoAjuda}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 flex gap-3 shrink-0 bg-surface">
          <Button
            type="button"
            variant="ghost"
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
  );
}