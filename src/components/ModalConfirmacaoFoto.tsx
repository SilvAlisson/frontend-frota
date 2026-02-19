import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { supabase } from '../supabaseClient';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Camera, Loader2, Check, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal'; // 🔑 Importando o Modal blindado!

// Estilos padronizados Premium
const fileInputContainer = "relative border-2 border-dashed border-border/60 rounded-3xl p-4 hover:bg-surface-hover transition-all duration-300 cursor-pointer group hover:border-primary/50 flex flex-col items-center justify-center min-h-[280px] overflow-hidden bg-surface shadow-sm";
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
  nested?: boolean; // 🔑 Nova prop para suportar 2 modais abertos
}

// --- FUNÇÃO DE COMPRESSÃO (MANTIDA) ---
const comprimirImagem = (arquivo: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(arquivo);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
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
  onSuccess,
  nested = false // 🔑 Falso por padrão, só ativamos quando necessário
}: ModalProps) {

  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);

  const textoAjuda = useMemo(() => {
    if (apiEndpoint.includes('abastecimentos')) {
      return "Foto nítida da Nota Fiscal ou da Bomba de Combustível.";
    }
    if (apiEndpoint.includes('manutencoes') || apiEndpoint.includes('ordens-servico')) {
      return "Foto da Ordem de Serviço (OS), Nota Fiscal ou Peça.";
    }
    return "Certifique-se que o KM e o painel estejam visíveis.";
  }, [apiEndpoint]);

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
        const imagemComprimida = await comprimirImagem(arquivoOriginal);
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
      const fileType = apiEndpoint.split('/')[1] || 'geral';
      const fileName = `${fileType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
      const filePath = `public/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('fotos-frota')
        .upload(filePath, foto);

      if (uploadError) throw new Error('Falha no upload da imagem.');
      if (!uploadData) throw new Error('Erro desconhecido no upload.');

      const { data: publicUrlData } = supabase
        .storage
        .from('fotos-frota')
        .getPublicUrl(uploadData.path);

      const fotoUrl = publicUrlData.publicUrl;

      let dadosCompletos = { ...dadosJornada };

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
    <Modal 
      isOpen={true} 
      onClose={!loading ? onClose : () => {}} 
      title={titulo} 
      nested={nested} // 🔑 Repassa para o Modal principal
    >
      <div className="space-y-6">

        {/* Visor de Painel */}
        {kmParaConfirmar !== null && (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-2xl border border-primary/20 text-center shadow-inner relative overflow-hidden mt-2">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1.5 relative z-10">
              Leitura do Painel
            </p>
            <p className="text-4xl font-black text-primary tracking-tighter font-mono relative z-10">
              {kmParaConfirmar.toLocaleString('pt-BR')} <span className="text-lg text-primary/60 font-bold ml-1">km</span>
            </p>
          </div>
        )}

        {/* Área de Upload / Preview */}
        <div className="space-y-2.5">
          <label className="block text-sm font-black text-text-main flex items-center justify-between">
            <span>Foto do Comprovante <span className="text-error ml-1">*</span></span>
            {previewUrl && !loading && (
              <span className="text-xs text-primary font-bold cursor-pointer hover:underline uppercase tracking-wide">
                Trocar foto
              </span>
            )}
          </label>

          <div className={`${fileInputContainer} ${previewUrl ? 'border-transparent p-0 bg-black/5' : ''}`}>
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
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <p className="text-sm text-primary font-bold animate-pulse">Otimizando imagem...</p>
              </div>
            ) : previewUrl ? (
              <div className="relative w-full h-full min-h-[280px] group rounded-3xl overflow-hidden bg-black/10">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full absolute inset-0 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none backdrop-blur-sm">
                  <Camera className="w-10 h-10 text-white mb-2" />
                  <p className="text-white font-bold text-sm tracking-wide">Toque para alterar</p>
                </div>
                <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg border border-white/20">
                  <Check className="w-5 h-5" />
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="w-20 h-20 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm border border-primary/20">
                  <Camera className="w-10 h-10" />
                </div>
                <p className="text-base font-black text-text-main tracking-tight">
                  Toque para abrir a câmera
                </p>
                <div className="mt-3 inline-flex items-start gap-2 bg-surface-hover py-2 px-3 rounded-xl border border-border/60 max-w-[240px]">
                  <AlertCircle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary font-medium leading-relaxed text-left">
                    {textoAjuda}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 flex gap-3 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            className="flex-1 h-14 font-bold"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-[2] h-14 text-base font-black shadow-float hover:shadow-lg transition-all"
            onClick={handleSubmit}
            disabled={loading || !foto || processandoFoto}
            isLoading={loading}
          >
            {loading ? 'Enviando...' : 'Confirmar'}
          </Button>
        </div>

      </div>
    </Modal>
  );
}